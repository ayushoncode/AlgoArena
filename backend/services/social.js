/**
 * backend/services/social.js
 *
 * Core service layer for AlgoArena Friends & Social relationships:
 * - Deterministic user pair ordering
 * - Atomic friendship state transitions & race condition resolution
 * - Friendship limits, rate limits, cool-down, and expiry enforcement
 * - Mutual friends calculation
 * - Strict block & privacy visibility enforcement
 * - Non-leaking neutral responses for blocked/restricted targets
 */

'use strict';

const crypto = require('crypto');
const db = require('../db');
const config = require('../config/social');

/** Hash user ID for privacy-safe logs and private socket rooms */
function hashId(id) {
  if (!id) return 'unknown';
  return crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 10);
}

/** Deterministically order two UUIDs so user_low < user_high */
function orderPair(idA, idB) {
  if (idA === idB) {
    throw new Error('Self-pairing is disallowed');
  }
  return idA < idB ? [idA, idB] : [idB, idA];
}

/** Check if either user has blocked the other in friend_blocks */
async function areUsersBlocked(userIdA, userIdB) {
  const { rows } = await db.query(
    `SELECT blocker_id, blocked_id FROM friend_blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)
     LIMIT 1;`,
    [userIdA, userIdB]
  );
  return rows.length > 0;
}

/** Get or create social settings for a user */
async function getSocialSettings(userId) {
  const { rows } = await db.query(
    `SELECT allow_requests, friends_visibility, muted_types, updated_at
     FROM social_settings
     WHERE user_id = $1;`,
    [userId]
  );

  if (rows.length > 0) {
    return {
      allowRequests: rows[0].allow_requests,
      friendsVisibility: rows[0].friends_visibility,
      mutedTypes: rows[0].muted_types || [],
      updatedAt: rows[0].updated_at
    };
  }

  // Return default settings
  return {
    allowRequests: config.defaultAllowRequests,
    friendsVisibility: config.defaultFriendsVisibility,
    mutedTypes: [],
    updatedAt: new Date()
  };
}

/** Upsert user social settings */
async function updateSocialSettings(userId, { allowRequests, friendsVisibility, mutedTypes }) {
  const cleanAllow = config.allowRequestsOptions.includes(allowRequests)
    ? allowRequests
    : config.defaultAllowRequests;

  const cleanVisibility = config.friendsVisibilityOptions.includes(friendsVisibility)
    ? friendsVisibility
    : config.defaultFriendsVisibility;

  const cleanMuted = Array.isArray(mutedTypes)
    ? mutedTypes.filter(t => config.notificationTypes.includes(t))
    : [];

  const { rows } = await db.query(
    `INSERT INTO social_settings (user_id, allow_requests, friends_visibility, muted_types, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       allow_requests = EXCLUDED.allow_requests,
       friends_visibility = EXCLUDED.friends_visibility,
       muted_types = EXCLUDED.muted_types,
       updated_at = NOW()
     RETURNING allow_requests, friends_visibility, muted_types, updated_at;`,
    [userId, cleanAllow, cleanVisibility, cleanMuted]
  );

  return {
    allowRequests: rows[0].allow_requests,
    friendsVisibility: rows[0].friends_visibility,
    mutedTypes: rows[0].muted_types || [],
    updatedAt: rows[0].updated_at
  };
}

/** Count active friends for a user */
async function getFriendCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int as count FROM friendships
     WHERE (user_low = $1 OR user_high = $1)
       AND status = 'accepted';`,
    [userId]
  );
  return rows[0]?.count || 0;
}

/** Count pending outgoing requests for a user */
async function getPendingOutgoingCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int as count FROM friendships
     WHERE requested_by = $1
       AND status = 'pending'
       AND expires_at > NOW();`,
    [userId]
  );
  return rows[0]?.count || 0;
}

/** Count requests created in rolling 24 hours */
async function getRolling24HourRequestCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int as count FROM friendships
     WHERE requested_by = $1
       AND created_at > (NOW() - INTERVAL '24 hours');`,
    [userId]
  );
  return rows[0]?.count || 0;
}

/** Check if two users are currently accepted friends */
async function areFriends(userIdA, userIdB) {
  if (userIdA === userIdB) return false;
  const [low, high] = orderPair(userIdA, userIdB);
  const { rows } = await db.query(
    `SELECT id FROM friendships
     WHERE user_low = $1 AND user_high = $2 AND status = 'accepted';`,
    [low, high]
  );
  return rows.length > 0;
}

/** Check if viewer is permitted to see target's friends list */
async function canViewFriendsList(viewerId, targetUserId) {
  if (viewerId === targetUserId) return true;

  // Block check
  const blocked = await areUsersBlocked(viewerId, targetUserId);
  if (blocked) return false;

  const settings = await getSocialSettings(targetUserId);

  if (settings.friendsVisibility === 'only_me') {
    return false;
  }

  if (settings.friendsVisibility === 'friends_only') {
    return areFriends(viewerId, targetUserId);
  }

  // 'signed_in' allows any authenticated viewer
  return Boolean(viewerId);
}

/** Compute number of mutual friends between viewer and target */
async function getMutualFriendsCount(viewerId, targetUserId) {
  if (!viewerId || !targetUserId || viewerId === targetUserId) return 0;

  const allowed = await canViewFriendsList(viewerId, targetUserId);
  if (!allowed) return 0;

  const query = `
    WITH viewer_friends AS (
      SELECT CASE WHEN user_low = $1 THEN user_high ELSE user_low END AS friend_id
      FROM friendships
      WHERE (user_low = $1 OR user_high = $1) AND status = 'accepted'
    ),
    target_friends AS (
      SELECT CASE WHEN user_low = $2 THEN user_high ELSE user_low END AS friend_id
      FROM friendships
      WHERE (user_low = $2 OR user_high = $2) AND status = 'accepted'
    )
    SELECT COUNT(*)::int AS count
    FROM viewer_friends vf
    INNER JOIN target_friends tf ON vf.friend_id = tf.friend_id;
  `;

  const { rows } = await db.query(query, [viewerId, targetUserId]);
  return rows[0]?.count || 0;
}

/**
 * Send a friend request with strict concurrency handling:
 * If A and B send to each other simultaneously, resolves into one accepted friendship.
 */
async function sendFriendRequest(senderId, targetUserId) {
  if (senderId === targetUserId) {
    return { error: 'SELF_REQUEST', message: 'You cannot add yourself as a friend.' };
  }

  // Verify target user exists
  const { rows: targetUserRows } = await db.query(
    `SELECT id, username FROM users WHERE id = $1;`,
    [targetUserId]
  );
  if (targetUserRows.length === 0) {
    // Return neutral response to avoid enumeration
    return { neutral: true, status: 'pending' };
  }

  // Check if either user has blocked the other
  const blocked = await areUsersBlocked(senderId, targetUserId);
  if (blocked) {
    // Neutral response so blocker/blocked status is not leaked
    return { neutral: true, status: 'pending' };
  }

  // Check target's privacy settings
  const targetSettings = await getSocialSettings(targetUserId);
  if (targetSettings.allowRequests === 'nobody') {
    // Neutral response so privacy setting is not leaked
    return { neutral: true, status: 'pending' };
  }

  // Check sender limits
  const [senderFriends, pendingOutgoing, rolling24h] = await Promise.all([
    getFriendCount(senderId),
    getPendingOutgoingCount(senderId),
    getRolling24HourRequestCount(senderId)
  ]);

  if (senderFriends >= config.maxFriends) {
    return { error: 'MAX_FRIENDS_REACHED', message: `Friend limit reached (${config.maxFriends} friends max).` };
  }
  if (pendingOutgoing >= config.maxPendingOutgoing) {
    return { error: 'MAX_PENDING_OUTGOING', message: `You have reached the maximum of ${config.maxPendingOutgoing} pending outgoing requests.` };
  }
  if (rolling24h >= config.maxRequestsPer24Hours) {
    return { error: 'RATE_LIMIT_EXCEEDED', message: `Daily request limit reached (${config.maxRequestsPer24Hours} per 24 hours).` };
  }

  // Check recipient friend limit
  const targetFriends = await getFriendCount(targetUserId);
  if (targetFriends >= config.maxFriends) {
    return { error: 'TARGET_MAX_FRIENDS', message: 'This user has reached their maximum friend limit.' };
  }

  const [low, high] = orderPair(senderId, targetUserId);

  // Execute in transaction with row locking
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: existingRows } = await client.query(
      `SELECT id, requested_by, status, created_at, responded_at, expires_at
       FROM friendships
       WHERE user_low = $1 AND user_high = $2
       FOR UPDATE;`,
      [low, high]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];

      if (existing.status === 'accepted') {
        await client.query('COMMIT');
        return { friendship: existing, status: 'accepted', autoAccepted: false };
      }

      if (existing.status === 'pending') {
        // If recipient already sent us a request, resolve mutually!
        if (existing.requested_by === targetUserId) {
          const { rows: updated } = await client.query(
            `UPDATE friendships
             SET status = 'accepted', responded_at = NOW()
             WHERE id = $1
             RETURNING id, user_low, user_high, requested_by, status, created_at, responded_at;`,
            [existing.id]
          );
          await client.query('COMMIT');
          return { friendship: updated[0], status: 'accepted', autoAccepted: true };
        }

        // Duplicate request from same sender
        await client.query('COMMIT');
        return { friendship: existing, status: 'pending', duplicate: true };
      }

      if (existing.status === 'declined') {
        // Check 14-day decline cool-down
        const cooldownMs = config.declineCooldownDays * 24 * 60 * 60 * 1000;
        const respondedAt = new Date(existing.responded_at || existing.created_at).getTime();
        const elapsed = Date.now() - respondedAt;

        if (elapsed < cooldownMs) {
          await client.query('COMMIT');
          return {
            error: 'DECLINE_COOLDOWN',
            message: `A declined request cannot be re-sent for ${config.declineCooldownDays} days.`
          };
        }

        // Cool-down passed: reset to pending
        const { rows: reRequested } = await client.query(
          `UPDATE friendships
           SET requested_by = $1, status = 'pending', created_at = NOW(), responded_at = NULL,
               expires_at = (NOW() + INTERVAL '60 days')
           WHERE id = $2
           RETURNING id, user_low, user_high, requested_by, status, created_at, expires_at;`,
          [senderId, existing.id]
        );
        await client.query('COMMIT');
        return { friendship: reRequested[0], status: 'pending', reRequest: true };
      }

      if (existing.status === 'cancelled') {
        // Resend after cancellation
        const { rows: reRequested } = await client.query(
          `UPDATE friendships
           SET requested_by = $1, status = 'pending', created_at = NOW(), responded_at = NULL,
               expires_at = (NOW() + INTERVAL '60 days')
           WHERE id = $2
           RETURNING id, user_low, user_high, requested_by, status, created_at, expires_at;`,
          [senderId, existing.id]
        );
        await client.query('COMMIT');
        return { friendship: reRequested[0], status: 'pending', reRequest: true };
      }
    }

    // Insert new friendship request with atomic mutual resolution on conflict
    const { rows: inserted } = await client.query(
      `INSERT INTO friendships (user_low, user_high, requested_by, status, created_at, expires_at)
       VALUES ($1, $2, $3, 'pending', NOW(), NOW() + INTERVAL '60 days')
       ON CONFLICT (user_low, user_high) DO UPDATE SET
         status = CASE
           WHEN friendships.status = 'pending' AND friendships.requested_by != EXCLUDED.requested_by THEN 'accepted'
           ELSE friendships.status
         END,
         responded_at = CASE
           WHEN friendships.status = 'pending' AND friendships.requested_by != EXCLUDED.requested_by THEN NOW()
           ELSE friendships.responded_at
         END
       RETURNING id, user_low, user_high, requested_by, status, created_at, responded_at, expires_at;`,
      [low, high, senderId]
    );

    await client.query('COMMIT');
    const isAccepted = inserted[0].status === 'accepted';
    return {
      friendship: inserted[0],
      status: inserted[0].status,
      isNew: !isAccepted,
      autoAccepted: isAccepted
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Respond to friend request (accept, decline, cancel) */
async function respondToFriendRequest(requestId, actingUserId, action) {
  const { rows } = await db.query(
    `SELECT id, user_low, user_high, requested_by, status, expires_at
     FROM friendships
     WHERE id = $1;`,
    [requestId]
  );

  if (rows.length === 0) {
    return { error: 'NOT_FOUND', message: 'Friend request not found.' };
  }

  const friendship = rows[0];
  const otherUserId = friendship.user_low === actingUserId ? friendship.user_high : friendship.user_low;

  if (action === 'accept') {
    // Only recipient can accept
    if (friendship.requested_by === actingUserId) {
      return { error: 'FORBIDDEN', message: 'You cannot accept your own request.' };
    }
    if (friendship.status === 'accepted') {
      return { status: 'accepted', friendship };
    }
    if (friendship.status !== 'pending') {
      return { error: 'INVALID_STATUS', message: 'This request is no longer pending.' };
    }

    const { rows: updated } = await db.query(
      `UPDATE friendships
       SET status = 'accepted', responded_at = NOW()
       WHERE id = $1
       RETURNING id, user_low, user_high, requested_by, status, created_at, responded_at;`,
      [requestId]
    );
    return { status: 'accepted', friendship: updated[0], otherUserId };
  }

  if (action === 'decline') {
    // Only recipient can decline
    if (friendship.requested_by === actingUserId) {
      return { error: 'FORBIDDEN', message: 'You cannot decline your own request.' };
    }
    if (friendship.status === 'declined') {
      return { status: 'declined', friendship };
    }

    const { rows: updated } = await db.query(
      `UPDATE friendships
       SET status = 'declined', responded_at = NOW()
       WHERE id = $1
       RETURNING id, user_low, user_high, requested_by, status, responded_at;`,
      [requestId]
    );
    return { status: 'declined', friendship: updated[0], otherUserId };
  }

  if (action === 'cancel') {
    // Only requester can cancel
    if (friendship.requested_by !== actingUserId) {
      return { error: 'FORBIDDEN', message: 'You can only cancel requests you sent.' };
    }
    if (friendship.status === 'cancelled') {
      return { status: 'cancelled', friendship };
    }

    const { rows: updated } = await db.query(
      `UPDATE friendships
       SET status = 'cancelled', responded_at = NOW()
       WHERE id = $1
       RETURNING id, user_low, user_high, requested_by, status, responded_at;`,
      [requestId]
    );
    return { status: 'cancelled', friendship: updated[0], otherUserId };
  }

  return { error: 'INVALID_ACTION', message: 'Unsupported action.' };
}

/** Unfriend a user */
async function removeFriendship(userIdA, userIdB) {
  if (userIdA === userIdB) return false;
  const [low, high] = orderPair(userIdA, userIdB);

  const { rows } = await db.query(
    `DELETE FROM friendships
     WHERE user_low = $1 AND user_high = $2 AND status = 'accepted'
     RETURNING id;`,
    [low, high]
  );
  return rows.length > 0;
}

/** Block a user: inserts into friend_blocks and purges any friendship record */
async function blockUser(blockerId, blockedId) {
  if (blockerId === blockedId) {
    return { error: 'SELF_BLOCK', message: 'You cannot block yourself.' };
  }

  const [low, high] = orderPair(blockerId, blockedId);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO friend_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING;`,
      [blockerId, blockedId]
    );

    await client.query(
      `DELETE FROM friendships
       WHERE user_low = $1 AND user_high = $2;`,
      [low, high]
    );

    await client.query('COMMIT');
    return { blocked: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Unblock a user */
async function unblockUser(blockerId, blockedId) {
  const { rowCount } = await db.query(
    `DELETE FROM friend_blocks
     WHERE blocker_id = $1 AND blocked_id = $2;`,
    [blockerId, blockedId]
  );
  return rowCount > 0;
}

/** Get relationship status between viewer and target user */
async function getRelationshipStatus(viewerId, targetUserId) {
  if (!viewerId || !targetUserId || viewerId === targetUserId) {
    return { status: 'none', friendshipId: null };
  }

  // Check if blocked
  const blocked = await areUsersBlocked(viewerId, targetUserId);
  if (blocked) {
    // Never leak "blocked" status to client
    return { status: 'none', friendshipId: null };
  }

  const [low, high] = orderPair(viewerId, targetUserId);
  const { rows } = await db.query(
    `SELECT id, requested_by, status, expires_at
     FROM friendships
     WHERE user_low = $1 AND user_high = $2;`,
    [low, high]
  );

  if (rows.length === 0) return { status: 'none', friendshipId: null };

  const f = rows[0];
  if (f.status === 'accepted') return { status: 'friends', friendshipId: f.id };
  if (f.status === 'pending') {
    if (new Date(f.expires_at).getTime() < Date.now()) {
      return { status: 'none', friendshipId: null };
    }
    const rel = f.requested_by === viewerId ? 'pending_out' : 'pending_in';
    return { status: rel, friendshipId: f.id };
  }

  return { status: 'none', friendshipId: null };
}

module.exports = {
  hashId,
  orderPair,
  areUsersBlocked,
  getSocialSettings,
  updateSocialSettings,
  getFriendCount,
  getPendingOutgoingCount,
  getRolling24HourRequestCount,
  areFriends,
  canViewFriendsList,
  getMutualFriendsCount,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendship,
  blockUser,
  unblockUser,
  getRelationshipStatus
};
