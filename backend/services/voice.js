/**
 * backend/services/voice.js
 *
 * Core business logic for AlgoArena Live Voice:
 * - Deterministic room hash derivation (never leaks match or user IDs)
 * - LiveKit AccessToken generation with scoped VideoGrants
 * - Active match consent, eligibility, and block verification
 * - Usage caps and concurrent session telemetry
 * - Additive database persistence (sessions, blocks, reports, usage, suspensions)
 */

'use strict';

const crypto = require('crypto');
const { AccessToken, WebhookReceiver } = require('livekit-server-sdk');
const db = require('../db');
const config = require('../config/voice');
const { getEntitlements } = require('./premium');

/**
 * Derives a secure, anonymous SHA-256 room hash from match ID and server secret salt.
 * Ensures provider room names contain no raw database IDs or user information.
 */
function deriveRoomHash(matchId) {
  return crypto
    .createHmac('sha256', config.voiceSecretSalt)
    .update(String(matchId))
    .digest('hex');
}

/**
 * Checks if a user is currently suspended from voice.
 */
async function getVoiceSuspension(userId) {
  try {
    const { rows } = await db.query(
      `SELECT suspended_until, reason
       FROM voice_suspensions
       WHERE user_id = $1 AND suspended_until > NOW()
       ORDER BY suspended_until DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  } catch (err) {
    console.error('[VoiceService] getVoiceSuspension error:', err.message);
    return null;
  }
}

/**
 * Checks if either player has blocked the other for voice.
 */
async function isVoiceBlocked(userA, userB) {
  try {
    const { rows } = await db.query(
      `SELECT id FROM voice_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userA, userB]
    );
    return rows.length > 0;
  } catch (err) {
    console.error('[VoiceService] isVoiceBlocked error:', err.message);
    return false;
  }
}

/**
 * Checks user daily voice usage and logs threshold alerts.
 */
async function checkDailyUsage(userId) {
  try {
    const { rows } = await db.query(
      `SELECT seconds FROM voice_usage_daily
       WHERE user_id = $1 AND usage_date = CURRENT_DATE`,
      [userId]
    );
    const usedSeconds = rows[0]?.seconds || 0;
    const limitSeconds = config.dailyLimitMinutes * 60;

    if (usedSeconds >= limitSeconds * config.alertThresholdRatio) {
      console.warn(`[VoiceService] ALERT: User ${userId} has consumed ${Math.round(usedSeconds / 60)}m of ${config.dailyLimitMinutes}m daily voice cap.`);
    }

    if (usedSeconds >= limitSeconds) {
      return { allowed: false, usedSeconds, limitSeconds };
    }
    return { allowed: true, usedSeconds, limitSeconds };
  } catch (err) {
    console.error('[VoiceService] checkDailyUsage error:', err.message);
    return { allowed: true, usedSeconds: 0, limitSeconds: config.dailyLimitMinutes * 60 };
  }
}

/**
 * Checks active concurrent voice sessions.
 */
async function checkConcurrentSessions() {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*)::INT as count FROM voice_sessions WHERE ended_at IS NULL`
    );
    const activeCount = rows[0]?.count || 0;
    if (activeCount >= config.maxConcurrentSessions * config.alertThresholdRatio) {
      console.warn(`[VoiceService] ALERT: Active voice sessions (${activeCount}) reached 80%+ of capacity (${config.maxConcurrentSessions}).`);
    }
    return activeCount < config.maxConcurrentSessions;
  } catch (err) {
    console.error('[VoiceService] checkConcurrentSessions error:', err.message);
    return true;
  }
}

/**
 * Generates a short-lived, single-purpose LiveKit join token.
 */
async function generateVoiceToken({ userId, matchId }) {
  const roomHash = deriveRoomHash(matchId);
  const apiKey = config.livekitApiKey || 'dev_key';
  const apiSecret = config.livekitApiSecret || 'dev_secret_at_least_32_characters_long_for_hmac';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(userId),
    ttl: `${config.tokenTtlSeconds}s`,
  });

  at.addGrant({
    roomJoin: true,
    room: roomHash,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
  });

  const token = await at.toJwt();
  return {
    token,
    url: config.livekitUrl || 'wss://demo.livekit.cloud',
    roomHash,
  };
}

/**
 * Records the start of a voice session in voice_sessions.
 */
async function recordVoiceSessionStart({ matchId, playerOneId, playerTwoId, roomHash }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO voice_sessions (match_id, player_one_id, player_two_id, provider_room_id_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [matchId, playerOneId, playerTwoId, roomHash]
    );
    return rows[0]?.id || null;
  } catch (err) {
    console.error('[VoiceService] recordVoiceSessionStart error:', err.message);
    return null;
  }
}

/**
 * Ends a voice session and credits elapsed duration to daily usage for both participants.
 */
async function endVoiceSession(matchId, endReason = 'match_ended') {
  try {
    const { rows } = await db.query(
      `UPDATE voice_sessions
       SET ended_at = NOW(),
           end_reason = $2,
           duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::INT)
       WHERE match_id = $1 AND ended_at IS NULL
       RETURNING id, player_one_id, player_two_id, duration_seconds`,
      [matchId, endReason]
    );

    for (const session of rows) {
      const dur = session.duration_seconds || 0;
      if (dur > 0) {
        for (const uid of [session.player_one_id, session.player_two_id]) {
          if (uid) {
            await db.query(
              `INSERT INTO voice_usage_daily (user_id, usage_date, seconds)
               VALUES ($1, CURRENT_DATE, $2)
               ON CONFLICT (user_id, usage_date)
               DO UPDATE SET seconds = voice_usage_daily.seconds + $2`,
              [uid, dur]
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('[VoiceService] endVoiceSession error:', err.message);
  }
}

/**
 * Blocks a user from voice interactions.
 */
async function blockVoiceUser({ blockerId, blockedId }) {
  try {
    await db.query(
      `INSERT INTO voice_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, blockedId]
    );
    return true;
  } catch (err) {
    console.error('[VoiceService] blockVoiceUser error:', err.message);
    return false;
  }
}

/**
 * Reports a voice user.
 */
async function reportVoiceUser({ reporterId, reportedId, matchId, category, note }) {
  try {
    const cleanNote = typeof note === 'string' ? note.slice(0, 500) : null;
    const { rows } = await db.query(
      `INSERT INTO voice_reports (reporter_id, reported_id, match_id, window_start, window_end, category, note)
       VALUES ($1, $2, $3, NOW() - INTERVAL '30 minutes', NOW(), $4, $5)
       RETURNING id`,
      [reporterId, reportedId, matchId || null, category, cleanNote]
    );
    return rows[0]?.id || null;
  } catch (err) {
    console.error('[VoiceService] reportVoiceUser error:', err.message);
    return null;
  }
}

/**
 * Verifies and handles incoming webhook events from LiveKit.
 */
async function processWebhookEvent(rawBody, authHeader) {
  if (!config.livekitApiKey || !config.livekitApiSecret) {
    return { status: 'ignored', reason: 'livekit credentials not set' };
  }

  const receiver = new WebhookReceiver(config.livekitApiKey, config.livekitApiSecret);
  const event = await receiver.receive(rawBody, authHeader);

  console.log(`[VoiceService] Webhook received: ${event.event} room=${event.room?.name}`);

  if (event.event === 'room_finished') {
    const roomHash = event.room?.name;
    if (roomHash) {
      await db.query(
        `UPDATE voice_sessions
         SET ended_at = NOW(),
             end_reason = 'provider_room_finished',
             duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::INT)
         WHERE provider_room_id_hash = $1 AND ended_at IS NULL`,
        [roomHash]
      );
    }
  }

  return { status: 'processed', event: event.event };
}

module.exports = {
  deriveRoomHash,
  getVoiceSuspension,
  isVoiceBlocked,
  checkDailyUsage,
  checkConcurrentSessions,
  generateVoiceToken,
  recordVoiceSessionStart,
  endVoiceSession,
  blockVoiceUser,
  reportVoiceUser,
  processWebhookEvent,
};

