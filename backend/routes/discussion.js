/**
 * backend/routes/discussion.js
 *
 * REST API routes for AlgoArena Discussion Rooms:
 * - Room listings & search
 * - Threads & replies
 * - Spoiler classification & daily challenge locks
 * - Helpful votes & moderation reports
 * - User blocking & suspensions
 * - Strict server-side integrity and match lockout enforcement
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config/discussion');
const { getSubscriptionStatus } = require('../services/premium');
const {
  hashId,
  isUserLockedInMatch,
  getUserActiveProblemIds,
  getDailyChallengeInfo,
  getSuspension,
  containsBlocklistedContent,
  hasHeavyCodeBlock,
  getOrCreateRoom,
  resolveProblem,
  validatePostingLimits,
  getBlockedUserIds
} = require('../services/discussion');
const {
  emitThreadCreated,
  emitReplyCreated,
  emitPostUpdated,
  emitPostHidden
} = require('../socket/discussion');
const authMiddleware = require('../middleware/auth');

/**
 * Entitlement gate for Discussion:
 * - When DISCUSSION_ENABLED is false, returns 404 (feature disabled).
 * - Read endpoints permit free users ONLY if DISCUSSION_FREE_READ is true.
 * - Write endpoints always require active Premium membership.
 */
function discussionGate(isWrite = false) {
  return async function (req, res, next) {
    if (!config.isDiscussionEnabled) {
      return res.status(404).json({
        code: 'DISCUSSION_DISABLED',
        message: 'Discussion Rooms are currently disabled.'
      });
    }

    if (!config.isGatingEnabled) {
      return next();
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        feature: 'discussion',
        message: 'Premium membership required to access Discussion Rooms.'
      });
    }

    try {
      const sub = await getSubscriptionStatus(userId);
      const isPremium = Boolean(sub && sub.active);

      if (isWrite && !isPremium) {
        return res.status(403).json({
          code: 'PREMIUM_REQUIRED',
          feature: 'discussion',
          message: 'Active Premium membership required to post, reply, or vote.'
        });
      }

      if (!isWrite && !isPremium && !config.isFreeReadEnabled) {
        return res.status(403).json({
          code: 'PREMIUM_REQUIRED',
          feature: 'discussion',
          message: 'Active Premium membership required to access Discussion Rooms.'
        });
      }

      req.isPremium = isPremium;
      next();
    } catch (err) {
      console.error('[Discussion Gate Error]:', err.message);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}

// ── 1. GET /api/discussion/rooms ─────────────────────────────────────────────
// Returns recent and active rooms, excluding user's live-match problem
router.get('/rooms', authMiddleware, discussionGate(false), async (req, res) => {
  const userId = req.user.id;

  try {
    const lockedProblemIds = await getUserActiveProblemIds(userId);

    const query = `
      SELECT
        r.id as room_id,
        r.thread_count,
        r.last_activity_at,
        p.id as problem_id,
        p.title as problem_title,
        p.slug as problem_slug,
        p.topic as problem_topic,
        p.difficulty as problem_difficulty
      FROM discussion_rooms r
      JOIN problems p ON p.id = r.problem_id
      WHERE p.id != ALL($1::uuid[])
      ORDER BY r.last_activity_at DESC
      LIMIT 50;
    `;

    const { rows } = await db.query(query, [lockedProblemIds]);
    return res.json({
      rooms: rows.map(r => ({
        roomId: r.room_id,
        problemId: r.problem_id,
        title: r.problem_title,
        problemTitle: r.problem_title,
        slug: r.problem_slug,
        problemSlug: r.problem_slug,
        topic: r.problem_topic,
        problemTopic: r.problem_topic,
        difficulty: r.problem_difficulty,
        problemDifficulty: r.problem_difficulty,
        threadCount: Number(r.thread_count),
        lastActivityAt: r.last_activity_at
      }))
    });
  } catch (err) {
    console.error('[GET /api/discussion/rooms]', err.message);
    return res.status(500).json({ message: 'Failed to load discussion rooms' });
  }
});

// ── 2. GET /api/discussion/rooms/:slug ───────────────────────────────────────
// Returns room threads with filters, search, and spoiler masking
router.get('/rooms/:slug', authMiddleware, discussionGate(false), async (req, res) => {
  const userId = req.user.id;
  const { slug } = req.params;
  const { type, sort = 'latest', q, cursor, limit = 20 } = req.query;

  try {
    const problem = await resolveProblem(slug);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // ── INTEGRITY RULE 1: Live match lockout ─────────────────────────────────
    const isLocked = await isUserLockedInMatch(userId, problem.id);
    if (isLocked) {
      return res.status(403).json({
        code: 'DISCUSSION_LOCKED_IN_MATCH',
        message: 'You are in a match on this problem. Discussion opens after it ends.'
      });
    }

    const room = await getOrCreateRoom(problem.id);
    const blockedIds = await getBlockedUserIds(userId);
    const { dailyProblemId, resetTime } = await getDailyChallengeInfo();
    const isDaily = dailyProblemId && String(dailyProblemId) === String(problem.id);

    // Build thread query
    const conditions = ['t.room_id = $1', "t.status != 'hidden'"];
    const params = [room.id];
    let paramIdx = 2;

    if (blockedIds.length > 0) {
      conditions.push(`t.author_id != ALL($${paramIdx}::uuid[])`);
      params.push(blockedIds);
      paramIdx++;
    }

    if (type && type !== 'All' && config.types.includes(type)) {
      conditions.push(`t.type = $${paramIdx}`);
      params.push(type);
      paramIdx++;
    }

    if (q && q.trim().length > 0) {
      const cleanQ = q.trim().replace(/[^\w\s]/g, ' ').trim();
      if (cleanQ) {
        conditions.push(`t.tsv @@ plainto_tsquery('english', $${paramIdx})`);
        params.push(cleanQ);
        paramIdx++;
      }
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        conditions.push(`t.created_at < $${paramIdx}`);
        params.push(cursorDate);
        paramIdx++;
      }
    }

    let orderBy = 't.created_at DESC';
    if (sort === 'helpful') {
      orderBy = 't.helpful_count DESC, t.created_at DESC';
    } else if (sort === 'unanswered') {
      conditions.push('t.reply_count = 0');
    }

    params.push(Math.min(50, Math.max(1, Number(limit) || 20)));
    const limitParamIdx = paramIdx;

    const threadsQuery = `
      SELECT
        t.id,
        t.type,
        t.title,
        t.body,
        t.helpful_count,
        t.reply_count,
        t.status,
        t.created_at,
        t.edited_at,
        u.id as author_id,
        u.username as author_username,
        u.avatar_seed as author_avatar_seed,
        u.avatar_style as author_avatar_style,
        u.elo_rating as author_elo_rating,
        EXISTS(
          SELECT 1 FROM subscriptions s
          WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
        ) as author_is_premium,
        EXISTS(
          SELECT 1 FROM discussion_votes v
          WHERE v.user_id = $${limitParamIdx + 1} AND v.post_kind = 'thread' AND v.post_id = t.id
        ) as has_voted
      FROM discussion_threads t
      JOIN users u ON u.id = t.author_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${limitParamIdx};
    `;

    const { rows: threadRows } = await db.query(threadsQuery, [...params, userId]);

    // Format & apply spoiler masking
    const threads = threadRows.map(t => {
      const isDeleted = t.status === 'deleted';
      const isSolution = t.type === 'Solution';
      const isHeavyCode = hasHeavyCodeBlock(t.body);
      const isSpoiler = isSolution || isHeavyCode;

      let title = t.title;
      let body = t.body;

      // Rule 3: Current daily challenge hiding
      let isDailyHidden = false;
      if (isDaily && isSolution) {
        title = 'Hidden until the daily challenge resets';
        body = null;
        isDailyHidden = true;
      } else if (isDeleted) {
        title = '[deleted]';
        body = '[deleted]';
      }

      return {
        id: t.id,
        type: t.type,
        title,
        body,
        helpfulCount: Number(t.helpful_count),
        replyCount: Number(t.reply_count),
        status: t.status,
        isSpoiler,
        isDailyHidden,
        hasVoted: Boolean(t.has_voted),
        createdAt: t.created_at,
        editedAt: t.edited_at,
        author: {
          id: t.author_id,
          username: isDeleted ? '[deleted]' : t.author_username,
          avatarSeed: isDeleted ? null : t.author_avatar_seed,
          avatarStyle: isDeleted ? null : t.author_avatar_style,
          eloRating: t.author_elo_rating,
          isPremium: Boolean(t.author_is_premium)
        }
      };
    });

    const nextCursor = threads.length > 0 ? threads[threads.length - 1].createdAt : null;

    return res.json({
      room: {
        id: room.id,
        problemId: problem.id,
        title: problem.title,
        slug: problem.slug,
        topic: problem.topic,
        difficulty: problem.difficulty,
        threadCount: Number(room.thread_count),
        isDailyChallenge: Boolean(isDaily),
        dailyResetTime: isDaily ? resetTime : null
      },
      threads,
      nextCursor
    });
  } catch (err) {
    console.error('[GET /api/discussion/rooms/:slug]', err.message);
    return res.status(500).json({ message: 'Failed to load discussion room' });
  }
});

// ── 3. GET /api/discussion/threads/:id ───────────────────────────────────────
// Returns thread details with flat list of replies
router.get('/threads/:id', authMiddleware, discussionGate(false), async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const threadQuery = `
      SELECT
        t.id,
        t.room_id,
        t.type,
        t.title,
        t.body,
        t.helpful_count,
        t.reply_count,
        t.status,
        t.created_at,
        t.edited_at,
        p.id as problem_id,
        p.title as problem_title,
        p.slug as problem_slug,
        p.topic as problem_topic,
        p.difficulty as problem_difficulty,
        u.id as author_id,
        u.username as author_username,
        u.avatar_seed as author_avatar_seed,
        u.avatar_style as author_avatar_style,
        u.elo_rating as author_elo_rating,
        EXISTS(
          SELECT 1 FROM subscriptions s
          WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
        ) as author_is_premium,
        EXISTS(
          SELECT 1 FROM discussion_votes v
          WHERE v.user_id = $2 AND v.post_kind = 'thread' AND v.post_id = t.id
        ) as has_voted
      FROM discussion_threads t
      JOIN discussion_rooms r ON r.id = t.room_id
      JOIN problems p ON p.id = r.problem_id
      JOIN users u ON u.id = t.author_id
      WHERE t.id = $1 AND t.status != 'hidden'
      LIMIT 1;
    `;

    const { rows: threadRows } = await db.query(threadQuery, [id, userId]);
    if (threadRows.length === 0) {
      return res.status(404).json({ message: 'Discussion thread not found' });
    }

    const t = threadRows[0];

    // Check match lockout
    const isLocked = await isUserLockedInMatch(userId, t.problem_id);
    if (isLocked) {
      return res.status(403).json({
        code: 'DISCUSSION_LOCKED_IN_MATCH',
        message: 'You are in a match on this problem. Discussion opens after it ends.'
      });
    }

    const { dailyProblemId } = await getDailyChallengeInfo();
    const isDaily = dailyProblemId && String(dailyProblemId) === String(t.problem_id);
    const isSolution = t.type === 'Solution';
    const isDeleted = t.status === 'deleted';

    let title = t.title;
    let body = t.body;
    let isDailyHidden = false;

    if (isDaily && isSolution) {
      title = 'Hidden until the daily challenge resets';
      body = null;
      isDailyHidden = true;
    } else if (isDeleted) {
      title = '[deleted]';
      body = '[deleted]';
    }

    // Fetch replies
    const blockedIds = await getBlockedUserIds(userId);
    const replyConditions = ['r.thread_id = $1', "r.status != 'hidden'"];
    const replyParams = [id];
    if (blockedIds.length > 0) {
      replyConditions.push('r.author_id != ALL($2::uuid[])');
      replyParams.push(blockedIds);
    }

    const repliesQuery = `
      SELECT
        r.id,
        r.thread_id,
        r.body,
        r.reply_to_id,
        r.helpful_count,
        r.status,
        r.created_at,
        r.edited_at,
        u.id as author_id,
        u.username as author_username,
        u.avatar_seed as author_avatar_seed,
        u.avatar_style as author_avatar_style,
        u.elo_rating as author_elo_rating,
        EXISTS(
          SELECT 1 FROM subscriptions s
          WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
        ) as author_is_premium,
        EXISTS(
          SELECT 1 FROM discussion_votes v
          WHERE v.user_id = $${replyParams.length + 1} AND v.post_kind = 'reply' AND v.post_id = r.id
        ) as has_voted
      FROM discussion_replies r
      JOIN users u ON u.id = r.author_id
      WHERE ${replyConditions.join(' AND ')}
      ORDER BY r.created_at ASC;
    `;

    const { rows: replyRows } = await db.query(repliesQuery, [...replyParams, userId]);

    return res.json({
      thread: {
        id: t.id,
        roomId: t.room_id,
        problem: {
          id: t.problem_id,
          title: t.problem_title,
          slug: t.problem_slug,
          topic: t.problem_topic,
          difficulty: t.problem_difficulty
        },
        type: t.type,
        title,
        body,
        helpfulCount: Number(t.helpful_count),
        replyCount: Number(t.reply_count),
        status: t.status,
        isSpoiler: isSolution || hasHeavyCodeBlock(t.body),
        isDailyHidden,
        hasVoted: Boolean(t.has_voted),
        createdAt: t.created_at,
        editedAt: t.edited_at,
        author: {
          id: t.author_id,
          username: isDeleted ? '[deleted]' : t.author_username,
          avatarSeed: isDeleted ? null : t.author_avatar_seed,
          avatarStyle: isDeleted ? null : t.author_avatar_style,
          eloRating: t.author_elo_rating,
          isPremium: Boolean(t.author_is_premium)
        }
      },
      replies: replyRows.map(r => {
        const isRepDeleted = r.status === 'deleted';
        return {
          id: r.id,
          threadId: r.thread_id,
          replyToId: r.reply_to_id,
          body: isRepDeleted ? '[deleted]' : r.body,
          helpfulCount: Number(r.helpful_count),
          status: r.status,
          hasVoted: Boolean(r.has_voted),
          createdAt: r.created_at,
          editedAt: r.edited_at,
          author: {
            id: r.author_id,
            username: isRepDeleted ? '[deleted]' : r.author_username,
            avatarSeed: isRepDeleted ? null : r.author_avatar_seed,
            avatarStyle: isRepDeleted ? null : r.author_avatar_style,
            eloRating: r.author_elo_rating,
            isPremium: Boolean(r.author_is_premium)
          }
        };
      })
    });
  } catch (err) {
    console.error('[GET /api/discussion/threads/:id]', err.message);
    return res.status(500).json({ message: 'Failed to load thread' });
  }
});

// ── 4. GET /api/discussion/unread ──────────────────────────────────────────
// Returns whether any new replies exist to threads authored by current user
router.get('/unread', authMiddleware, discussionGate(false), async (req, res) => {
  const userId = req.user.id;
  const since = req.query.since;

  try {
    let query = `
      SELECT COUNT(r.id)::int as count
      FROM discussion_replies r
      JOIN discussion_threads t ON t.id = r.thread_id
      WHERE t.author_id = $1
        AND r.author_id != $1
        AND r.status != 'hidden'
    `;
    const params = [userId];

    if (since && !isNaN(new Date(since).getTime())) {
      query += ` AND r.created_at > $2::timestamptz`;
      params.push(new Date(since).toISOString());
    }

    const { rows } = await db.query(query, params);
    const unreadCount = Number(rows[0]?.count || 0);

    return res.json({
      hasUnread: unreadCount > 0,
      unreadCount
    });
  } catch (err) {
    console.error('[GET /api/discussion/unread]', err.message);
    return res.status(500).json({ message: 'Failed to check unread replies' });
  }
});

// ── 5. GET /api/discussion/mine ────────────────────────────────────────────
router.get('/mine', authMiddleware, discussionGate(false), async (req, res) => {
  const userId = req.user.id;
  try {
    const { rows: threads } = await db.query(`
      SELECT
        t.id, t.type, t.title, t.helpful_count, t.reply_count, t.status, t.created_at,
        p.title as problem_title, p.slug as problem_slug
      FROM discussion_threads t
      JOIN discussion_rooms r ON r.id = t.room_id
      JOIN problems p ON p.id = r.problem_id
      WHERE t.author_id = $1 AND t.status != 'hidden'
      ORDER BY t.created_at DESC
      LIMIT 50;
    `, [userId]);

    return res.json({ threads });
  } catch (err) {
    console.error('[GET /api/discussion/mine]', err.message);
    return res.status(500).json({ message: 'Failed to load user threads' });
  }
});

router.post('/threads', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  let { slug, problemId, type, title, body } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Thread title is required.' });
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ message: 'Thread body is required.' });
  }
  if (!type || !config.types.includes(type)) {
    return res.status(400).json({ message: 'A valid thread type must be selected.' });
  }

  title = title.trim();
  body = body.trim();

  if (title.length > config.maxTitleLength) {
    return res.status(400).json({ message: `Title exceeds maximum of ${config.maxTitleLength} characters.` });
  }
  if (body.length > config.maxThreadBodyLength) {
    return res.status(400).json({ message: `Body exceeds maximum of ${config.maxThreadBodyLength} characters.` });
  }

  try {
    const problem = await resolveProblem(slug || problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found.' });
    }

    // Match lockout check
    const isLocked = await isUserLockedInMatch(userId, problem.id);
    if (isLocked) {
      return res.status(403).json({
        code: 'DISCUSSION_LOCKED_IN_MATCH',
        message: 'You are in a match on this problem. Discussion opens after it ends.'
      });
    }

    // Anti-abuse validation
    const check = await validatePostingLimits({ userId, body, title, isThread: true });
    if (!check.allowed) {
      return res.status(400).json({ code: check.code, message: check.message });
    }

    // Auto-solution rule: code block > 5 lines typed as something else
    let autoConvertedToSolution = false;
    if (type !== 'Solution' && hasHeavyCodeBlock(body)) {
      type = 'Solution';
      autoConvertedToSolution = true;
    }

    const room = await getOrCreateRoom(problem.id);

    const { rows } = await db.query(`
      INSERT INTO discussion_threads (room_id, author_id, type, title, body)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, room_id, author_id, type, title, body, helpful_count, reply_count, status, created_at;
    `, [room.id, userId, type, title, body]);

    // Update room counters
    await db.query(`
      UPDATE discussion_rooms
      SET thread_count = thread_count + 1,
          last_activity_at = NOW()
      WHERE id = $1;
    `, [room.id]);

    const createdThread = rows[0];
    console.log(`[Discussion] Thread created user=${hashId(userId)} room=${room.id} thread=${createdThread.id}`);

    // Fetch author info for socket push and response
    const { rows: userRows } = await db.query(`
      SELECT username, avatar_seed, avatar_style, elo_rating
      FROM users WHERE id = $1;
    `, [userId]);
    const authorUser = userRows[0] || {};
    const author = {
      id: userId,
      username: authorUser.username,
      avatarSeed: authorUser.avatar_seed,
      avatarStyle: authorUser.avatar_style,
      eloRating: authorUser.elo_rating,
      isPremium: Boolean(req.isPremium)
    };

    const io = req.app.get('io');
    if (io) {
      emitThreadCreated(io, {
        thread: {
          ...createdThread,
          author
        },
        problemId: problem.id,
        authorId: userId
      }).catch(err => console.warn('[Discussion Socket] emitThreadCreated error:', err.message));
    }

    return res.status(201).json({
      thread: {
        id: createdThread.id,
        roomId: room.id,
        type: createdThread.type,
        title: createdThread.title,
        body: createdThread.body,
        helpfulCount: 0,
        replyCount: 0,
        status: createdThread.status,
        createdAt: createdThread.created_at,
        autoConvertedToSolution,
        author
      }
    });
  } catch (err) {
    console.error('[POST /api/discussion/threads]', err.message);
    return res.status(500).json({ message: 'Failed to create thread' });
  }
});

// ── 5. POST /api/discussion/threads/:id/replies ──────────────────────────────
// Posts a reply under an existing thread
router.post('/threads/:id/replies', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  let { body, replyToId } = req.body;

  if (!body || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ message: 'Reply body is required.' });
  }

  body = body.trim();
  if (body.length > config.maxReplyBodyLength) {
    return res.status(400).json({ message: `Reply exceeds maximum of ${config.maxReplyBodyLength} characters.` });
  }

  try {
    const { rows: threadRows } = await db.query(`
      SELECT t.id, t.room_id, t.author_id, r.problem_id, p.slug as problem_slug
      FROM discussion_threads t
      JOIN discussion_rooms r ON r.id = t.room_id
      JOIN problems p ON p.id = r.problem_id
      WHERE t.id = $1 AND t.status != 'hidden';
    `, [id]);

    if (threadRows.length === 0) {
      return res.status(404).json({ message: 'Thread not found.' });
    }

    const thread = threadRows[0];

    // Match lockout check
    const isLocked = await isUserLockedInMatch(userId, thread.problem_id);
    if (isLocked) {
      return res.status(403).json({
        code: 'DISCUSSION_LOCKED_IN_MATCH',
        message: 'You are in a match on this problem. Discussion opens after it ends.'
      });
    }

    // Check block list between replier and thread author
    const blockedIds = await getBlockedUserIds(userId);
    if (blockedIds.includes(String(thread.author_id))) {
      return res.status(403).json({ message: 'You cannot reply to this thread.' });
    }

    // Anti-abuse validation
    const check = await validatePostingLimits({ userId, body, isThread: false });
    if (!check.allowed) {
      return res.status(400).json({ code: check.code, message: check.message });
    }

    const { rows } = await db.query(`
      INSERT INTO discussion_replies (thread_id, author_id, body, reply_to_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, thread_id, author_id, body, reply_to_id, helpful_count, status, created_at;
    `, [id, userId, body, replyToId || null]);

    // Update counters
    await db.query(`
      UPDATE discussion_threads
      SET reply_count = reply_count + 1
      WHERE id = $1;
    `, [id]);

    await db.query(`
      UPDATE discussion_rooms
      SET last_activity_at = NOW()
      WHERE id = $1;
    `, [thread.room_id]);

    // Fetch author info for response and socket emission
    const { rows: userRows } = await db.query(`
      SELECT username, avatar_seed, avatar_style, elo_rating
      FROM users WHERE id = $1;
    `, [userId]);
    const authorUser = userRows[0] || {};
    const author = {
      id: userId,
      username: authorUser.username,
      avatarSeed: authorUser.avatar_seed,
      avatarStyle: authorUser.avatar_style,
      eloRating: authorUser.elo_rating,
      isPremium: Boolean(req.isPremium)
    };

    const reply = {
      id: rows[0].id,
      threadId: rows[0].thread_id,
      authorId: rows[0].author_id,
      body: rows[0].body,
      replyToId: rows[0].reply_to_id,
      helpfulCount: Number(rows[0].helpful_count),
      status: rows[0].status,
      createdAt: rows[0].created_at,
      author
    };
    console.log(`[Discussion] Reply created user=${hashId(userId)} thread=${id} reply=${reply.id}`);

    const io = req.app.get('io');
    if (io) {
      emitReplyCreated(io, {
        reply,
        threadId: id,
        problemId: thread.problem_id,
        authorId: userId,
        threadAuthorId: thread.author_id,
        problemSlug: thread.problem_slug
      }).catch(err => console.warn('[Discussion Socket] emitReplyCreated error:', err.message));
    }

    return res.status(201).json({ reply });
  } catch (err) {
    console.error('[POST /api/discussion/threads/:id/replies]', err.message);
    return res.status(500).json({ message: 'Failed to create reply' });
  }
});

// ── 6. PATCH /api/discussion/threads/:id ─────────────────────────────────────
// Edit own thread within 15 minutes
router.patch('/threads/:id', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  let { title, body } = req.body;

  try {
    const { rows: threadRows } = await db.query(`
      SELECT t.id, t.author_id, t.created_at, t.status, t.helpful_count, t.reply_count, r.problem_id
      FROM discussion_threads t
      JOIN discussion_rooms r ON r.id = t.room_id
      WHERE t.id = $1;
    `, [id]);

    if (threadRows.length === 0) return res.status(404).json({ message: 'Thread not found' });
    const thread = threadRows[0];

    if (String(thread.author_id) !== String(userId)) {
      return res.status(403).json({ message: 'You can only edit your own posts.' });
    }

    const elapsedMinutes = (Date.now() - new Date(thread.created_at).getTime()) / (1000 * 60);
    if (elapsedMinutes > config.editWindowMinutes) {
      return res.status(400).json({ message: `Edits are only allowed within ${config.editWindowMinutes} minutes of posting.` });
    }

    if (title && containsBlocklistedContent(title)) {
      return res.status(400).json({ message: 'Title contains prohibited content.' });
    }
    if (body && containsBlocklistedContent(body)) {
      return res.status(400).json({ message: 'Body contains prohibited content.' });
    }

    const { rows } = await db.query(`
      UPDATE discussion_threads
      SET title = COALESCE($2, title),
          body = COALESCE($3, body),
          edited_at = NOW()
      WHERE id = $1
      RETURNING id, title, body, edited_at;
    `, [id, title?.trim() || null, body?.trim() || null]);

    const updated = rows[0];

    const io = req.app.get('io');
    if (io) {
      emitPostUpdated(io, {
        postKind: 'thread',
        postId: id,
        problemId: thread.problem_id,
        status: thread.status,
        title: updated.title,
        helpfulCount: Number(thread.helpful_count),
        replyCount: Number(thread.reply_count),
        editedAt: updated.edited_at
      }).catch(err => console.warn('[Discussion Socket] emitPostUpdated error:', err.message));
    }

    return res.json({ thread: updated });
  } catch (err) {
    console.error('[PATCH /api/discussion/threads/:id]', err.message);
    return res.status(500).json({ message: 'Failed to update thread' });
  }
});

// ── 7. PATCH /api/discussion/replies/:id ─────────────────────────────────────
// Edit own reply within 15 minutes
router.patch('/replies/:id', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  let { body } = req.body;

  try {
    const { rows: replyRows } = await db.query(`
      SELECT r.id, r.author_id, r.created_at, r.status, r.helpful_count, rm.problem_id
      FROM discussion_replies r
      JOIN discussion_threads t ON t.id = r.thread_id
      JOIN discussion_rooms rm ON rm.id = t.room_id
      WHERE r.id = $1;
    `, [id]);

    if (replyRows.length === 0) return res.status(404).json({ message: 'Reply not found' });
    const reply = replyRows[0];

    if (String(reply.author_id) !== String(userId)) {
      return res.status(403).json({ message: 'You can only edit your own posts.' });
    }

    const elapsedMinutes = (Date.now() - new Date(reply.created_at).getTime()) / (1000 * 60);
    if (elapsedMinutes > config.editWindowMinutes) {
      return res.status(400).json({ message: `Edits are only allowed within ${config.editWindowMinutes} minutes of posting.` });
    }

    if (body && containsBlocklistedContent(body)) {
      return res.status(400).json({ message: 'Body contains prohibited content.' });
    }

    const { rows } = await db.query(`
      UPDATE discussion_replies
      SET body = COALESCE($2, body),
          edited_at = NOW()
      WHERE id = $1
      RETURNING id, body, edited_at;
    `, [id, body?.trim() || null]);

    const updated = rows[0];

    const io = req.app.get('io');
    if (io) {
      emitPostUpdated(io, {
        postKind: 'reply',
        postId: id,
        problemId: reply.problem_id,
        status: reply.status,
        helpfulCount: Number(reply.helpful_count),
        editedAt: updated.edited_at
      }).catch(err => console.warn('[Discussion Socket] emitPostUpdated error:', err.message));
    }

    return res.json({ reply: updated });
  } catch (err) {
    console.error('[PATCH /api/discussion/replies/:id]', err.message);
    return res.status(500).json({ message: 'Failed to update reply' });
  }
});

// ── 8. DELETE /api/discussion/threads/:id ────────────────────────────────────
// Soft-delete own thread (status = 'deleted')
router.delete('/threads/:id', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const { rows } = await db.query(`
      SELECT t.id, t.author_id, r.problem_id
      FROM discussion_threads t
      JOIN discussion_rooms r ON r.id = t.room_id
      WHERE t.id = $1;
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Thread not found' });
    if (String(rows[0].author_id) !== String(userId)) {
      return res.status(403).json({ message: 'You can only delete your own posts.' });
    }

    await db.query(`
      UPDATE discussion_threads
      SET status = 'deleted'
      WHERE id = $1;
    `, [id]);

    console.log(`[Discussion] Thread deleted user=${hashId(userId)} thread=${id}`);

    const io = req.app.get('io');
    if (io) {
      emitPostUpdated(io, {
        postKind: 'thread',
        postId: id,
        problemId: rows[0].problem_id,
        status: 'deleted'
      }).catch(err => console.warn('[Discussion Socket] emitPostUpdated error:', err.message));
    }

    return res.json({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/discussion/threads/:id]', err.message);
    return res.status(500).json({ message: 'Failed to delete thread' });
  }
});

// ── 9. DELETE /api/discussion/replies/:id ────────────────────────────────────
// Soft-delete own reply (status = 'deleted')
router.delete('/replies/:id', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const { rows } = await db.query(`
      SELECT r.id, r.author_id, rm.problem_id
      FROM discussion_replies r
      JOIN discussion_threads t ON t.id = r.thread_id
      JOIN discussion_rooms rm ON rm.id = t.room_id
      WHERE r.id = $1;
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Reply not found' });
    if (String(rows[0].author_id) !== String(userId)) {
      return res.status(403).json({ message: 'You can only delete your own posts.' });
    }

    await db.query(`
      UPDATE discussion_replies
      SET status = 'deleted'
      WHERE id = $1;
    `, [id]);

    console.log(`[Discussion] Reply deleted user=${hashId(userId)} reply=${id}`);

    const io = req.app.get('io');
    if (io) {
      emitPostUpdated(io, {
        postKind: 'reply',
        postId: id,
        problemId: rows[0].problem_id,
        status: 'deleted'
      }).catch(err => console.warn('[Discussion Socket] emitPostUpdated error:', err.message));
    }

    return res.json({ deleted: true });
  } catch (err) {
    console.error('[DELETE /api/discussion/replies/:id]', err.message);
    return res.status(500).json({ message: 'Failed to delete reply' });
  }
});

// ── 10. POST /api/discussion/vote ────────────────────────────────────────────
// Toggle helpful vote on thread or reply (Premium write)
router.post('/vote', authMiddleware, discussionGate(true), async (req, res) => {
  const userId = req.user.id;
  const { postKind, postId } = req.body;

  if (!['thread', 'reply'].includes(postKind) || !postId) {
    return res.status(400).json({ message: 'Invalid postKind or postId' });
  }

  const table = postKind === 'thread' ? 'discussion_threads' : 'discussion_replies';

  try {
    // Find problemId for socket broadcast
    let problemId = null;
    if (postKind === 'thread') {
      const { rows: tRows } = await db.query(`
        SELECT r.problem_id FROM discussion_threads t
        JOIN discussion_rooms r ON r.id = t.room_id
        WHERE t.id = $1;
      `, [postId]);
      problemId = tRows[0]?.problem_id;
    } else {
      const { rows: rRows } = await db.query(`
        SELECT rm.problem_id FROM discussion_replies r
        JOIN discussion_threads t ON t.id = r.thread_id
        JOIN discussion_rooms rm ON rm.id = t.room_id
        WHERE r.id = $1;
      `, [postId]);
      problemId = rRows[0]?.problem_id;
    }

    // Check if vote exists
    const { rows: existing } = await db.query(`
      SELECT id FROM discussion_votes
      WHERE user_id = $1 AND post_kind = $2 AND post_id = $3;
    `, [userId, postKind, postId]);

    let voted = false;
    if (existing.length > 0) {
      // Remove vote
      await db.query(`
        DELETE FROM discussion_votes WHERE id = $1;
      `, [existing[0].id]);

      await db.query(`
        UPDATE ${table}
        SET helpful_count = GREATEST(0, helpful_count - 1)
        WHERE id = $1;
      `, [postId]);
      voted = false;
    } else {
      // Add vote
      await db.query(`
        INSERT INTO discussion_votes (user_id, post_kind, post_id)
        VALUES ($1, $2, $3);
      `, [userId, postKind, postId]);

      await db.query(`
        UPDATE ${table}
        SET helpful_count = helpful_count + 1
        WHERE id = $1;
      `, [postId]);
      voted = true;
    }

    const { rows: countRows } = await db.query(`
      SELECT helpful_count FROM ${table} WHERE id = $1;
    `, [postId]);

    const helpfulCount = countRows[0] ? Number(countRows[0].helpful_count) : 0;

    const io = req.app.get('io');
    if (io && problemId) {
      emitPostUpdated(io, {
        postKind,
        postId,
        problemId,
        helpfulCount
      }).catch(err => console.warn('[Discussion Socket] emitPostUpdated error:', err.message));
    }

    return res.json({ voted, helpfulCount });
  } catch (err) {
    console.error('[POST /api/discussion/vote]', err.message);
    return res.status(500).json({ message: 'Failed to register vote' });
  }
});

// ── 11. POST /api/discussion/report ──────────────────────────────────────────
// Report post (auto-hides on >= 3 distinct reports)
router.post('/report', authMiddleware, discussionGate(false), async (req, res) => {
  const userId = req.user.id;
  const { postKind, postId, category, note } = req.body;

  if (!['thread', 'reply'].includes(postKind) || !postId) {
    return res.status(400).json({ message: 'Invalid postKind or postId' });
  }
  if (!config.reportCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid report category' });
  }

  const table = postKind === 'thread' ? 'discussion_threads' : 'discussion_replies';

  try {
    await db.query(`
      INSERT INTO discussion_reports (reporter_id, post_kind, post_id, category, note)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (reporter_id, post_kind, post_id) DO NOTHING;
    `, [userId, postKind, postId, category, note ? note.slice(0, config.maxReportNoteLength) : null]);

    // Check count of distinct reports
    const { rows: reportRows } = await db.query(`
      SELECT COUNT(DISTINCT reporter_id) as count
      FROM discussion_reports
      WHERE post_kind = $1 AND post_id = $2;
    `, [postKind, postId]);

    const reportCount = Number(reportRows[0].count);
    let autoHidden = false;

    if (reportCount >= config.reportsThresholdToHide) {
      await db.query(`
        UPDATE ${table}
        SET status = 'hidden'
        WHERE id = $1;
      `, [postId]);
      autoHidden = true;
      console.log(`[Discussion] Post auto-hidden after ${reportCount} reports kind=${postKind} id=${postId}`);

      // Emit disc:post_hidden
      let problemId = null;
      if (postKind === 'thread') {
        const { rows: tRows } = await db.query(`
          SELECT r.problem_id FROM discussion_threads t
          JOIN discussion_rooms r ON r.id = t.room_id
          WHERE t.id = $1;
        `, [postId]);
        problemId = tRows[0]?.problem_id;
      } else {
        const { rows: rRows } = await db.query(`
          SELECT rm.problem_id FROM discussion_replies r
          JOIN discussion_threads t ON t.id = r.thread_id
          JOIN discussion_rooms rm ON rm.id = t.room_id
          WHERE r.id = $1;
        `, [postId]);
        problemId = rRows[0]?.problem_id;
      }

      const io = req.app.get('io');
      if (io && problemId) {
        emitPostHidden(io, { postKind, postId, problemId })
          .catch(err => console.warn('[Discussion Socket] emitPostHidden error:', err.message));
      }
    }

    return res.json({ reported: true, autoHidden });
  } catch (err) {
    console.error('[POST /api/discussion/report]', err.message);
    return res.status(500).json({ message: 'Failed to submit report' });
  }
});

// ── 12. POST & DELETE /api/discussion/block ──────────────────────────────────
router.post('/block', authMiddleware, discussionGate(false), async (req, res) => {
  const blockerId = req.user.id;
  const { blockedUserId } = req.body;

  if (!blockedUserId || blockedUserId === blockerId) {
    return res.status(400).json({ message: 'Invalid user to block' });
  }

  try {
    await db.query(`
      INSERT INTO discussion_blocks (blocker_id, blocked_id)
      VALUES ($1, $2)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
    `, [blockerId, blockedUserId]);

    return res.json({ blocked: true });
  } catch (err) {
    console.error('[POST /api/discussion/block]', err.message);
    return res.status(500).json({ message: 'Failed to block user' });
  }
});

router.delete('/block/:userId', authMiddleware, discussionGate(false), async (req, res) => {
  const blockerId = req.user.id;
  const blockedUserId = req.params.userId;

  try {
    await db.query(`
      DELETE FROM discussion_blocks
      WHERE blocker_id = $1 AND blocked_id = $2;
    `, [blockerId, blockedUserId]);

    return res.json({ unblocked: true });
  } catch (err) {
    console.error('[DELETE /api/discussion/block/:userId]', err.message);
    return res.status(500).json({ message: 'Failed to unblock user' });
  }
});

module.exports = router;
