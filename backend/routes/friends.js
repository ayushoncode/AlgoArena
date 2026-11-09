/**
 * backend/routes/friends.js
 *
 * REST API routes for AlgoArena Friends & Social features:
 * - Friend request dispatch & management (incoming/outgoing)
 * - Atomic accept, decline, cancel with mutual race condition resolution
 * - Unfriend & mutual friend count
 * - Block & unblock
 * - Friends lists with privacy visibility and search
 * - Friends-only leaderboard
 */

'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config/social');
const authMiddleware = require('../middleware/auth');
const {
  hashId,
  areUsersBlocked,
  getFriendCount,
  canViewFriendsList,
  getMutualFriendsCount,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendship,
  blockUser,
  unblockUser,
  getRelationshipStatus
} = require('../services/social');
const {
  emitFriendAdded,
  emitFriendRemoved
} = require('../socket/social');
const {
  createNotification,
  markNotificationReadByEntity
} = require('../services/notifications');

/** Guard middleware checking if FRIENDS_ENABLED is true */
function friendsGate(req, res, next) {
  if (!config.isFriendsEnabled) {
    return res.status(404).json({
      error: 'FEATURE_DISABLED',
      message: 'Friends feature is currently disabled.'
    });
  }
  next();
}

// ── 1. POST /api/friends/requests ──────────────────────────────────────────
// Send friend request by targetUserId or username
router.post('/requests', authMiddleware, friendsGate, async (req, res) => {
  const senderId = req.user.id;
  const targetUserId = req.body.targetUserId || req.body.userId;
  const username = req.body.username;

  try {
    let resolvedTargetId = targetUserId;

    if (!resolvedTargetId && username) {
      const cleanUsername = String(username).trim().toLowerCase();
      const { rows } = await db.query(
        `SELECT id FROM users WHERE LOWER(username) = $1;`,
        [cleanUsername]
      );
      if (rows.length > 0) {
        resolvedTargetId = rows[0].id;
      } else {
        // Neutral response to prevent username enumeration
        return res.json({ status: 'pending', neutral: true });
      }
    }

    if (!resolvedTargetId) {
      return res.status(400).json({ message: 'Target user ID or username required' });
    }

    const result = await sendFriendRequest(senderId, resolvedTargetId);

    if (result.error) {
      return res.status(400).json({ error: result.error, message: result.message });
    }

    if (result.neutral) {
      return res.json({ status: 'pending', neutral: true });
    }

    if (result.status === 'pending' && !result.neutral && !result.duplicate) {
      const io = req.app.get('io');
      await createNotification({
        io,
        userId: resolvedTargetId,
        type: 'friend_request',
        actorId: senderId,
        entityId: result.friendship?.id
      });
    } else if (result.status === 'accepted' && result.autoAccepted) {
      const io = req.app.get('io');
      emitFriendAdded(io, senderId, resolvedTargetId, result.friendship?.id);
      emitFriendAdded(io, resolvedTargetId, senderId, result.friendship?.id);
      await createNotification({
        io,
        userId: resolvedTargetId,
        type: 'friend_accepted',
        actorId: senderId,
        entityId: result.friendship?.id
      });
    }

    console.log(`[Social] Request created sender=${hashId(senderId)} target=${hashId(resolvedTargetId)} status=${result.status}`);
    return res.json({
      status: result.status,
      id: result.friendship?.id,
      friendship: result.friendship,
      autoAccepted: Boolean(result.autoAccepted)
    });
  } catch (err) {
    console.error('[Social POST /requests error]:', err.message);
    return res.status(500).json({ message: 'Failed to send friend request' });
  }
});

// ── 2. GET /api/friends/requests ───────────────────────────────────────────
// List incoming or outgoing requests with cursor pagination
router.get('/requests', authMiddleware, friendsGate, async (req, res) => {
  const userId = req.user.id;
  const direction = req.query.direction === 'outgoing' ? 'outgoing' : 'incoming';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

  try {
    let query = '';
    const params = [userId, limit];

    if (direction === 'incoming') {
      query = `
        SELECT
          f.id, f.status, f.created_at, f.expires_at,
          u.id as user_id, u.username, u.elo_rating, u.avatar_seed, u.avatar_style,
          EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
          ) AS is_premium
        FROM friendships f
        JOIN users u ON u.id = f.requested_by
        WHERE (f.user_low = $1 OR f.user_high = $1)
          AND f.requested_by != $1
          AND f.status = 'pending'
          AND f.expires_at > NOW()
          ${cursor ? `AND f.created_at < $3` : ''}
        ORDER BY f.created_at DESC
        LIMIT $2;
      `;
      if (cursor) params.push(cursor);
    } else {
      // Outgoing
      query = `
        SELECT
          f.id, f.status, f.created_at, f.expires_at,
          u.id as user_id, u.username, u.elo_rating, u.avatar_seed, u.avatar_style,
          EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
          ) AS is_premium
        FROM friendships f
        JOIN users u ON u.id = (CASE WHEN f.user_low = $1 THEN f.user_high ELSE f.user_low END)
        WHERE f.requested_by = $1
          AND f.status = 'pending'
          AND f.expires_at > NOW()
          ${cursor ? `AND f.created_at < $3` : ''}
        ORDER BY f.created_at DESC
        LIMIT $2;
      `;
      if (cursor) params.push(cursor);
    }

    const { rows } = await db.query(query, params);

    const items = rows.map(r => {
      const u = {
        id: r.user_id,
        username: r.username,
        eloRating: r.elo_rating,
        elo_rating: r.elo_rating,
        avatarSeed: r.avatar_seed,
        avatar_seed: r.avatar_seed,
        avatarStyle: r.avatar_style,
        avatar_style: r.avatar_style,
        isPremium: Boolean(r.is_premium),
        is_premium: Boolean(r.is_premium)
      };
      return {
        id: r.id,
        status: r.status,
        created_at: r.created_at,
        createdAt: r.created_at,
        expires_at: r.expires_at,
        expiresAt: r.expires_at,
        user: u,
        requester: u,
        target: u
      };
    });

    const nextCursor = items.length === limit ? items[items.length - 1].createdAt : null;

    return res.json({ items, requests: items, nextCursor });
  } catch (err) {
    console.error('[Social GET /requests error]:', err.message);
    return res.status(500).json({ message: 'Failed to fetch friend requests' });
  }
});

// ── 3. POST /api/friends/requests/:id/accept ───────────────────────────────
router.post('/requests/:id/accept', authMiddleware, friendsGate, async (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;

  try {
    const result = await respondToFriendRequest(requestId, userId, 'accept');

    if (result.error) {
      const statusCode = result.error === 'NOT_FOUND' ? 404 : result.error === 'FORBIDDEN' ? 403 : 400;
      return res.status(statusCode).json({ error: result.error, message: result.message });
    }

    const io = req.app.get('io');
    await markNotificationReadByEntity(requestId, userId, io);

    if (result.otherUserId) {
      emitFriendAdded(io, userId, result.otherUserId, requestId);
      emitFriendAdded(io, result.otherUserId, userId, requestId);
      await createNotification({
        io,
        userId: result.otherUserId,
        type: 'friend_accepted',
        actorId: userId,
        entityId: requestId
      });
    }

    console.log(`[Social] Request accepted user=${hashId(userId)} request=${requestId}`);
    return res.json({ status: 'accepted', friendship: result.friendship });
  } catch (err) {
    console.error('[Social POST /requests/:id/accept error]:', err.message);
    return res.status(500).json({ message: 'Failed to accept friend request' });
  }
});

// ── 4. POST /api/friends/requests/:id/decline ──────────────────────────────
router.post('/requests/:id/decline', authMiddleware, friendsGate, async (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;

  try {
    const result = await respondToFriendRequest(requestId, userId, 'decline');

    if (result.error) {
      const statusCode = result.error === 'NOT_FOUND' ? 404 : result.error === 'FORBIDDEN' ? 403 : 400;
      return res.status(statusCode).json({ error: result.error, message: result.message });
    }

    const io = req.app.get('io');
    await markNotificationReadByEntity(requestId, userId, io);

    console.log(`[Social] Request declined user=${hashId(userId)} request=${requestId}`);
    return res.json({ status: 'declined', friendship: result.friendship });
  } catch (err) {
    console.error('[Social POST /requests/:id/decline error]:', err.message);
    return res.status(500).json({ message: 'Failed to decline friend request' });
  }
});

// ── 5. POST /api/friends/requests/:id/cancel ───────────────────────────────
router.post('/requests/:id/cancel', authMiddleware, friendsGate, async (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;

  try {
    const result = await respondToFriendRequest(requestId, userId, 'cancel');

    if (result.error) {
      const statusCode = result.error === 'NOT_FOUND' ? 404 : result.error === 'FORBIDDEN' ? 403 : 400;
      return res.status(statusCode).json({ error: result.error, message: result.message });
    }

    console.log(`[Social] Request cancelled user=${hashId(userId)} request=${requestId}`);
    return res.json({ status: 'cancelled', friendship: result.friendship });
  } catch (err) {
    console.error('[Social POST /requests/:id/cancel error]:', err.message);
    return res.status(500).json({ message: 'Failed to cancel friend request' });
  }
});

// ── 6. DELETE /api/friends/:userId (Unfriend) ───────────────────────────────
router.delete('/:userId', authMiddleware, friendsGate, async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const removed = await removeFriendship(userId, targetUserId);
    if (removed) {
      const io = req.app.get('io');
      emitFriendRemoved(io, userId, targetUserId);
      emitFriendRemoved(io, targetUserId, userId);
    }
    console.log(`[Social] Friendship removed user=${hashId(userId)} target=${hashId(targetUserId)} removed=${removed}`);
    return res.json({ success: true, removed });
  } catch (err) {
    console.error('[Social DELETE /:userId error]:', err.message);
    return res.status(500).json({ message: 'Failed to remove friend' });
  }
});

// ── 7. GET /api/friends/status/:userId ──────────────────────────────────────
router.get('/status/:userId', authMiddleware, friendsGate, async (req, res) => {
  const viewerId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const rawStatus = await getRelationshipStatus(viewerId, targetUserId);
    const status = typeof rawStatus === 'object' ? rawStatus.status : rawStatus;
    const friendshipId = typeof rawStatus === 'object' ? rawStatus.friendshipId : null;
    return res.json({ status, relation: status, friendshipId });
  } catch (err) {
    console.error('[Social GET /status/:userId error]:', err.message);
    return res.status(500).json({ message: 'Failed to check relationship status' });
  }
});

// ── 8. GET /api/friends/mutual-count/:userId ────────────────────────────────
router.get('/mutual-count/:userId', authMiddleware, friendsGate, async (req, res) => {
  const viewerId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const count = await getMutualFriendsCount(viewerId, targetUserId);
    return res.json({ count });
  } catch (err) {
    console.error('[Social GET /mutual-count/:userId error]:', err.message);
    return res.status(500).json({ message: 'Failed to calculate mutual friends' });
  }
});

// ── 9. POST /api/friends/block/:userId ──────────────────────────────────────
router.post('/block/:userId', authMiddleware, friendsGate, async (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const result = await blockUser(blockerId, targetUserId);
    if (result.error) {
      return res.status(400).json({ error: result.error, message: result.message });
    }

    const io = req.app.get('io');
    emitFriendRemoved(io, blockerId, targetUserId);
    emitFriendRemoved(io, targetUserId, blockerId);

    // Purge pending notifications between blocker and blocked
    await db.query(
      `DELETE FROM notifications
       WHERE (user_id = $1 AND actor_id = $2)
          OR (user_id = $2 AND actor_id = $1);`,
      [blockerId, targetUserId]
    );

    console.log(`[Social] User blocked blocker=${hashId(blockerId)} blocked=${hashId(targetUserId)}`);
    return res.json({ blocked: true });
  } catch (err) {
    console.error('[Social POST /block/:userId error]:', err.message);
    return res.status(500).json({ message: 'Failed to block user' });
  }
});

// ── 10. DELETE /api/friends/block/:userId ───────────────────────────────────
router.delete('/block/:userId', authMiddleware, friendsGate, async (req, res) => {
  const blockerId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    const unblocked = await unblockUser(blockerId, targetUserId);
    console.log(`[Social] User unblocked blocker=${hashId(blockerId)} blocked=${hashId(targetUserId)}`);
    return res.json({ unblocked });
  } catch (err) {
    console.error('[Social DELETE /block/:userId error]:', err.message);
    return res.status(500).json({ message: 'Failed to unblock user' });
  }
});

// ── 11. GET /api/friends/leaderboard ────────────────────────────────────────
// Friends leaderboard: viewer's friends plus the viewer, ordered by elo_rating DESC
router.get('/leaderboard', authMiddleware, friendsGate, async (req, res) => {
  const viewerId = req.user.id;

  try {
    const query = `
      WITH friend_ids AS (
        SELECT CASE WHEN user_low = $1 THEN user_high ELSE user_low END AS user_id
        FROM friendships
        WHERE (user_low = $1 OR user_high = $1) AND status = 'accepted'
        UNION
        SELECT $1::uuid AS user_id
      )
      SELECT
        u.id, u.username, u.elo_rating, u.wins, u.losses, u.avatar_seed, u.avatar_style,
        RANK() OVER (ORDER BY u.elo_rating DESC, u.id ASC) AS rank,
        EXISTS(
          SELECT 1 FROM subscriptions s
          WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
        ) AS is_premium
      FROM users u
      JOIN friend_ids f ON f.user_id = u.id
      ORDER BY u.elo_rating DESC, u.id ASC
      LIMIT 100;
    `;

    const { rows } = await db.query(query, [viewerId]);

    const sanitized = rows.map(r => ({
      id: r.id,
      username: r.username,
      elo_rating: r.elo_rating,
      wins: r.wins,
      losses: r.losses,
      avatar_seed: r.avatar_seed,
      avatar_style: r.avatar_style,
      rank: Number(r.rank),
      is_premium: Boolean(r.is_premium)
    }));

    return res.json(sanitized);
  } catch (err) {
    console.error('[Social GET /leaderboard error]:', err.message);
    return res.status(500).json({ message: 'Failed to load friends leaderboard' });
  }
});

module.exports = router;
