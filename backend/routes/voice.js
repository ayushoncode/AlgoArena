/**
 * backend/routes/voice.js
 *
 * REST API endpoints for Live Voice:
 * - POST /api/voice/token: Authenticated token generation with full gating & validation
 * - POST /api/voice/webhook: LiveKit provider webhook receiver
 * - POST /api/voice/block: Block opponent voice communication
 * - POST /api/voice/report: Report safety violation during voice session
 * - GET  /api/voice/status: Check voice availability & flags
 */

'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');
const config = require('../config/voice');
const { getEntitlements } = require('../services/premium');
const {
  getVoiceSuspension,
  isVoiceBlocked,
  checkDailyUsage,
  checkConcurrentSessions,
  generateVoiceToken,
  recordVoiceSessionStart,
  blockVoiceUser,
  reportVoiceUser,
  processWebhookEvent,
} = require('../services/voice');

// ── GET /api/voice/status ───────────────────────────────────────
router.get('/status', (req, res) => {
  return res.json({
    enabled: config.isVoiceEnabled,
    requireBothPremium: config.requireBothPremium,
    isBetaActive: config.betaUserIds.length > 0,
  });
});

// ── POST /api/voice/token ───────────────────────────────────────
router.post('/token', authMiddleware, async (req, res) => {
  // 1. Feature Flag Check
  if (!config.isVoiceEnabled) {
    return res.status(403).json({
      code: 'VOICE_DISABLED',
      message: 'Live voice communication is currently disabled.',
    });
  }

  const userId = req.user.id;

  // 2. Beta Allow-list Check
  if (config.betaUserIds.length > 0 && !config.betaUserIds.includes(userId)) {
    return res.status(403).json({
      code: 'VOICE_BETA_ONLY',
      message: 'Live voice is currently restricted to beta participants.',
    });
  }

  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ message: 'roomId is required' });
  }

  // 3. User Suspension Check
  const suspension = await getVoiceSuspension(userId);
  if (suspension) {
    return res.status(403).json({
      code: 'VOICE_SUSPENDED',
      message: `Voice is unavailable for your account until ${suspension.suspended_until}`,
      suspendedUntil: suspension.suspended_until,
    });
  }

  // 4. Verify match membership & opponent
  // Check in-memory match registry first
  const { activeMatches } = require('../socket/match');
  let match = activeMatches ? activeMatches.get(roomId) : null;
  let dbMatchId = match?.dbMatchId || null;
  let opponentId = null;

  if (match) {
    if (match.isResolved) {
      return res.status(403).json({
        code: 'NOT_IN_MATCH',
        message: 'Match is no longer active.',
      });
    }
    const isParticipant = match.players?.some(p => String(p.userId) === String(userId));
    if (!isParticipant) {
      return res.status(403).json({
        code: 'NOT_IN_MATCH',
        message: 'User is not a participant of this match.',
      });
    }
    const opponent = match.players?.find(p => String(p.userId) !== String(userId));
    opponentId = opponent?.userId;
  } else {
    // Fallback: check matches table in database
    try {
      const { rows } = await db.query(
        `SELECT id, player_one_id, player_two_id, status FROM matches
         WHERE (id::text = $1 OR id::text = $2) AND status = 'active'
         LIMIT 1`,
        [roomId, roomId.replace(/^room:/, '')]
      );
      if (rows.length === 0) {
        return res.status(403).json({
          code: 'NOT_IN_MATCH',
          message: 'Active match not found.',
        });
      }
      const dbRow = rows[0];
      dbMatchId = dbRow.id;
      if (dbRow.player_one_id === userId) {
        opponentId = dbRow.player_two_id;
      } else if (dbRow.player_two_id === userId) {
        opponentId = dbRow.player_one_id;
      } else {
        return res.status(403).json({
          code: 'NOT_IN_MATCH',
          message: 'User is not a participant of this match.',
        });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Error verifying match' });
    }
  }

  if (!opponentId) {
    return res.status(403).json({
      code: 'NOT_IN_MATCH',
      message: 'Opponent could not be verified.',
    });
  }

  // 5. Block Check
  const blocked = await isVoiceBlocked(userId, opponentId);
  if (blocked) {
    return res.status(403).json({
      code: 'BLOCKED',
      message: 'Voice communication is blocked between these players.',
    });
  }

  // 6. Premium Entitlement Check
  const [myEntitlement, oppEntitlement] = await Promise.all([
    getEntitlements(userId),
    getEntitlements(opponentId),
  ]);

  if (config.requireBothPremium) {
    if (!myEntitlement.isPremium || !oppEntitlement.isPremium) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        message: 'Both players must have an active Premium membership for live voice.',
      });
    }
  } else {
    if (!myEntitlement.isPremium && !oppEntitlement.isPremium) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        message: 'At least one player must have an active Premium membership for live voice.',
      });
    }
  }

  // 7. Consent Handshake Check
  // Consent state must be accepted in match memory
  if (match) {
    const consent = match.voiceConsent;
    if (!consent || !consent.accepted) {
      return res.status(403).json({
        code: 'VOICE_NOT_ACCEPTED',
        message: 'Voice request has not been accepted by both players.',
      });
    }
  }

  // 8. Daily Usage Cap Check
  const usageCheck = await checkDailyUsage(userId);
  if (!usageCheck.allowed) {
    return res.status(403).json({
      code: 'LIMIT_REACHED',
      message: 'Daily voice allowance reached for your account.',
    });
  }

  // 9. Concurrency Capacity Check
  const hasCapacity = await checkConcurrentSessions();
  if (!hasCapacity) {
    return res.status(403).json({
      code: 'LIMIT_REACHED',
      message: 'Voice service is currently at maximum capacity. Please retry shortly.',
    });
  }

  // 10. Generate Provider Token
  try {
    const sessionMatchId = dbMatchId || roomId;
    const tokenData = await generateVoiceToken({
      userId,
      matchId: sessionMatchId,
    });

    // Record session start
    await recordVoiceSessionStart({
      matchId: dbMatchId,
      playerOneId: userId,
      playerTwoId: opponentId,
      roomHash: tokenData.roomHash,
    });

    return res.json({
      token: tokenData.token,
      url: tokenData.url,
      roomHash: tokenData.roomHash,
      participantIdentity: String(userId),
    });
  } catch (err) {
    console.error('[VoiceRoutes] Error generating voice token:', err);
    return res.status(500).json({ message: 'Failed to generate voice token' });
  }
});

// ── POST /api/voice/webhook ─────────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
    const authHeader = req.get('Authorization');

    const result = await processWebhookEvent(rawBody, authHeader);
    return res.json(result);
  } catch (err) {
    console.error('[VoiceRoutes] Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
});

// ── POST /api/voice/block ───────────────────────────────────────
router.post('/block', authMiddleware, async (req, res) => {
  const blockerId = req.user.id;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ message: 'targetUserId is required' });
  }

  const ok = await blockVoiceUser({ blockerId, blockedId: targetUserId });
  if (ok) {
    return res.json({ status: 'ok', blocked: true });
  }
  return res.status(500).json({ message: 'Failed to block user' });
});

// ── POST /api/voice/report ──────────────────────────────────────
router.post('/report', authMiddleware, async (req, res) => {
  const reporterId = req.user.id;
  const { targetUserId, matchId, category, note } = req.body;

  if (!targetUserId || !category) {
    return res.status(400).json({ message: 'targetUserId and category are required' });
  }

  const reportId = await reportVoiceUser({
    reporterId,
    reportedId: targetUserId,
    matchId,
    category,
    note,
  });

  if (reportId) {
    return res.json({ status: 'ok', reportId });
  }
  return res.status(500).json({ message: 'Failed to submit voice report' });
});

module.exports = router;

