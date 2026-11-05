/**
 * backend/services/discussion.js
 *
 * Core business logic for Discussion Rooms:
 * - Lazy room initialization
 * - Live match lockout check (server-enforced)
 * - Daily challenge spoiler lock (until midnight UTC)
 * - Safe markdown / link validation
 * - Anti-abuse: rate limits, duplicates, min interval, blocklist, link caps
 * - Auto-Solution categorization for code blocks > 5 lines
 * - Auto-hide on 3 reports
 * - Hashed logging (no PII, no post bodies)
 */

'use strict';

const crypto = require('crypto');
const db = require('../db');
const config = require('../config/discussion');
const { activeMatches } = require('../socket/match');

function hashId(id) {
  if (!id) return 'unknown';
  return crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 10);
}

/** Check if user is actively in a live match for a given problem */
async function isUserLockedInMatch(userId, problemId) {
  if (!userId || !problemId) return false;

  // 1. Check in-memory active matches
  try {
    for (const match of activeMatches.values()) {
      if (!match.isResolved && String(match.problemId) === String(problemId)) {
        if (match.players?.some(p => String(p.userId) === String(userId))) {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[Discussion] in-memory activeMatches check warning:', err.message);
  }

  // 2. Check Postgres matches table
  const { rows } = await db.query(`
    SELECT id FROM matches
    WHERE status = 'active'
      AND problem_id = $1
      AND (player_one_id = $2 OR player_two_id = $2)
    LIMIT 1;
  `, [problemId, userId]);

  return rows.length > 0;
}

/** Get list of problem IDs currently active for the user */
async function getUserActiveProblemIds(userId) {
  if (!userId) return [];
  const activeIds = new Set();

  try {
    for (const match of activeMatches.values()) {
      if (!match.isResolved && match.problemId) {
        if (match.players?.some(p => String(p.userId) === String(userId))) {
          activeIds.add(String(match.problemId));
        }
      }
    }
  } catch {}

  const { rows } = await db.query(`
    SELECT problem_id FROM matches
    WHERE status = 'active'
      AND (player_one_id = $1 OR player_two_id = $1)
      AND problem_id IS NOT NULL;
  `, [userId]);

  for (const r of rows) {
    activeIds.add(String(r.problem_id));
  }

  return Array.from(activeIds);
}

/** Fetch today's daily challenge problem ID and reset time */
async function getDailyChallengeInfo() {
  const now = Date.now();
  const utcDay = Math.floor(now / 86400000);
  const resetTime = (utcDay + 1) * 86400000;

  const { rows } = await db.query(`
    SELECT id FROM problems ORDER BY id ASC;
  `);

  if (!rows.length) return { dailyProblemId: null, resetTime };
  const dailyProblem = rows[utcDay % rows.length];
  return {
    dailyProblemId: dailyProblem ? String(dailyProblem.id) : null,
    resetTime
  };
}

/** Check if user is currently suspended from discussions */
async function getSuspension(userId) {
  if (!userId) return null;
  const { rows } = await db.query(`
    SELECT id, reason, suspended_until
    FROM discussion_suspensions
    WHERE user_id = $1 AND suspended_until > NOW()
    ORDER BY suspended_until DESC
    LIMIT 1;
  `, [userId]);

  if (rows.length === 0) return null;
  return {
    isSuspended: true,
    reason: rows[0].reason,
    until: rows[0].suspended_until
  };
}

/** Check text against blocklist */
function containsBlocklistedContent(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/[\s\-_.,@#*!]+/g, ' ');
  for (const phrase of config.blocklist) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }
  return false;
}

/** Count links in text */
function countLinks(text) {
  if (!text) return 0;
  const matches = text.match(/https?:\/\/[^\s]+/gi);
  return matches ? matches.length : 0;
}

/** Determine whether code block contains > 5 lines */
function hasHeavyCodeBlock(body) {
  if (!body) return false;
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = codeBlockRegex.exec(body)) !== null) {
    const lines = match[0].split('\n').length;
    // Fenced code with 5+ content lines
    if (lines > config.codeLinesForAutoSolution + 1) {
      return true;
    }
  }
  return false;
}

/** Ensure room exists for a problem (created lazily) */
async function getOrCreateRoom(problemId) {
  const { rows } = await db.query(`
    INSERT INTO discussion_rooms (problem_id)
    VALUES ($1)
    ON CONFLICT (problem_id) DO UPDATE SET problem_id = EXCLUDED.problem_id
    RETURNING id, problem_id, created_at, thread_count, last_activity_at;
  `, [problemId]);
  return rows[0];
}

/** Resolve problem by ID or slug */
async function resolveProblem(slugOrId) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const query = isUuid
    ? 'SELECT id, title, slug, topic, difficulty FROM problems WHERE id = $1 LIMIT 1;'
    : 'SELECT id, title, slug, topic, difficulty FROM problems WHERE slug = $1 LIMIT 1;';
  const { rows } = await db.query(query, [slugOrId]);
  return rows[0] || null;
}

/** Validate anti-abuse constraints before posting */
async function validatePostingLimits({ userId, body, title, isThread }) {
  // 1. Suspension check
  const suspension = await getSuspension(userId);
  if (suspension) {
    return {
      allowed: false,
      code: 'USER_SUSPENDED',
      message: `Your discussion access is suspended until ${new Date(suspension.until).toISOString().split('T')[0]}. Reason: ${suspension.reason}`
    };
  }

  // 2. Blocklist check
  if (containsBlocklistedContent(title) || containsBlocklistedContent(body)) {
    return {
      allowed: false,
      code: 'CONTENT_DISALLOWED',
      message: 'Post rejected because it contains prohibited phrases or spam patterns.'
    };
  }

  // 3. Link count & user age check
  const linkCount = countLinks(body) + countLinks(title || '');
  if (linkCount > config.maxLinksPerPost) {
    return {
      allowed: false,
      code: 'TOO_MANY_LINKS',
      message: `A maximum of ${config.maxLinksPerPost} links are allowed per post.`
    };
  }

  if (linkCount > 0) {
    const { rows: userRows } = await db.query(`SELECT created_at FROM users WHERE id = $1`, [userId]);
    if (userRows.length > 0) {
      const accountAgeDays = (Date.now() - new Date(userRows[0].created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < config.linksAllowedMinAccountAgeDays) {
        return {
          allowed: false,
          code: 'LINKS_NOT_ALLOWED_YET',
          message: `Links are permitted only for accounts older than ${config.linksAllowedMinAccountAgeDays} days.`
        };
      }
    }
  }

  // 4. Minimum 20 seconds between posts
  const intervalQuery = `
    SELECT created_at FROM (
      SELECT created_at FROM discussion_threads WHERE author_id = $1
      UNION ALL
      SELECT created_at FROM discussion_replies WHERE author_id = $1
    ) combined
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows: lastPostRows } = await db.query(intervalQuery, [userId]);
  if (lastPostRows.length > 0) {
    const elapsedSec = (Date.now() - new Date(lastPostRows[0].created_at).getTime()) / 1000;
    if (elapsedSec < config.minSecondsBetweenPosts) {
      const waitSec = Math.ceil(config.minSecondsBetweenPosts - elapsedSec);
      return {
        allowed: false,
        code: 'RATE_LIMITED_INTERVAL',
        message: `Please wait ${waitSec} second(s) before posting again.`
      };
    }
  }

  // 5. Hourly rate limits
  if (isThread) {
    const { rows: threadCountRows } = await db.query(`
      SELECT COUNT(*) as count FROM discussion_threads
      WHERE author_id = $1 AND created_at > NOW() - INTERVAL '1 hour';
    `, [userId]);
    if (Number(threadCountRows[0].count) >= config.maxThreadsPerHour) {
      return {
        allowed: false,
        code: 'RATE_LIMITED_HOURLY',
        message: `Rate limit reached: maximum ${config.maxThreadsPerHour} new threads per hour.`
      };
    }
  } else {
    const { rows: replyCountRows } = await db.query(`
      SELECT COUNT(*) as count FROM discussion_replies
      WHERE author_id = $1 AND created_at > NOW() - INTERVAL '1 hour';
    `, [userId]);
    if (Number(replyCountRows[0].count) >= config.maxRepliesPerHour) {
      return {
        allowed: false,
        code: 'RATE_LIMITED_HOURLY',
        message: `Rate limit reached: maximum ${config.maxRepliesPerHour} replies per hour.`
      };
    }
  }

  // 6. Duplicate body within 24 hours
  const normalizedBody = body.trim().toLowerCase();
  const dupQuery = isThread
    ? `SELECT id FROM discussion_threads WHERE author_id = $1 AND LOWER(TRIM(body)) = $2 AND created_at > NOW() - INTERVAL '24 hours' LIMIT 1;`
    : `SELECT id FROM discussion_replies WHERE author_id = $1 AND LOWER(TRIM(body)) = $2 AND created_at > NOW() - INTERVAL '24 hours' LIMIT 1;`;
  const { rows: dupRows } = await db.query(dupQuery, [userId, normalizedBody]);
  if (dupRows.length > 0) {
    return {
      allowed: false,
      code: 'DUPLICATE_POST',
      message: 'You posted identical content within the last 24 hours.'
    };
  }

  return { allowed: true };
}

/** Check if author is blocked by viewer or viewer is blocked by author */
async function getBlockedUserIds(userId) {
  if (!userId) return [];
  const { rows } = await db.query(`
    SELECT blocked_id FROM discussion_blocks WHERE blocker_id = $1
    UNION
    SELECT blocker_id FROM discussion_blocks WHERE blocked_id = $1;
  `, [userId]);
  return rows.map(r => r.blocked_id);
}

module.exports = {
  hashId,
  isUserLockedInMatch,
  getUserActiveProblemIds,
  getDailyChallengeInfo,
  getSuspension,
  containsBlocklistedContent,
  countLinks,
  hasHeavyCodeBlock,
  getOrCreateRoom,
  resolveProblem,
  validatePostingLimits,
  getBlockedUserIds
};

