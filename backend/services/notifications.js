/**
 * backend/services/notifications.js
 *
 * Service layer for AlgoArena In-App Notification Centre:
 * - Generic notification type registry & emission
 * - Mute list enforcement (muted types are never created)
 * - Block isolation (blocked actors never create notifications)
 * - Deduplication (second friend_request from same actor while unread is deduped)
 * - 90-day retention and 200 items per user cap pruning
 * - Unread count source of truth & real-time socket dispatches
 */

'use strict';

const db = require('../db');
const config = require('../config/social');
const { areUsersBlocked, getSocialSettings } = require('./social');
const {
  emitNotificationCreated,
  emitUnreadCount
} = require('../socket/social');

/** Prune notifications: purge > 90 days old and enforce 200 items cap */
async function pruneNotifications(userId) {
  try {
    // 1. Purge older than 90 days
    await db.query(
      `DELETE FROM notifications
       WHERE user_id = $1 AND created_at < (NOW() - INTERVAL '90 days');`,
      [userId]
    );

    // 2. Cap at max 200 per user
    await db.query(
      `DELETE FROM notifications
       WHERE id IN (
         SELECT id FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         OFFSET $2
       );`,
      [userId, config.maxNotificationsPerUser]
    );
  } catch (err) {
    console.error('[Notification Prune Error]:', err.message);
  }
}

/** Get source-of-truth unread count for user */
async function getUnreadCount(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int as count
     FROM notifications
     WHERE user_id = $1 AND read_at IS NULL;`,
    [userId]
  );
  return rows[0]?.count || 0;
}

/**
 * Create and dispatch a new in-app notification
 */
async function createNotification({ io = null, userId, type, actorId = null, entityId = null }) {
  if (!config.isNotificationsEnabled) return null;
  if (!userId || !type) return null;

  // 1. Check if actor is blocked
  if (actorId && actorId !== userId) {
    const blocked = await areUsersBlocked(userId, actorId);
    if (blocked) {
      return null;
    }
  }

  // 2. Check user's social settings for muted notification types
  const settings = await getSocialSettings(userId);
  if (Array.isArray(settings.mutedTypes) && settings.mutedTypes.includes(type)) {
    // Muted type: do not create
    return null;
  }

  // 3. Deduplication rule: a second friend_request while one is unread is ignored
  if (type === 'friend_request' && actorId) {
    const { rows: existingUnread } = await db.query(
      `SELECT id, user_id, type, actor_id, entity_id, created_at, read_at
       FROM notifications
       WHERE user_id = $1 AND type = 'friend_request' AND actor_id = $2 AND read_at IS NULL
       LIMIT 1;`,
      [userId, actorId]
    );

    if (existingUnread.length > 0) {
      const currentCount = await getUnreadCount(userId);
      return { notification: existingUnread[0], unreadCount: currentCount, duplicate: true };
    }
  }

  // 4. Prune before write
  await pruneNotifications(userId);

  // 5. Insert notification
  const { rows: inserted } = await db.query(
    `INSERT INTO notifications (user_id, type, actor_id, entity_id, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, user_id, type, actor_id, entity_id, created_at, read_at;`,
    [userId, type, actorId, entityId ? String(entityId) : null]
  );

  const notif = inserted[0];

  // 6. Fetch actor public fields if actor exists
  let actorObj = null;
  if (actorId) {
    const { rows: actorRows } = await db.query(
      `SELECT id, username, avatar_seed, avatar_style FROM users WHERE id = $1;`,
      [actorId]
    );
    if (actorRows.length > 0) {
      actorObj = {
        id: actorRows[0].id,
        username: actorRows[0].username,
        avatarSeed: actorRows[0].avatar_seed,
        avatarStyle: actorRows[0].avatar_style
      };
    }
  }

  const notification = {
    id: notif.id,
    type: notif.type,
    entityId: notif.entity_id,
    status: notif.type === 'friend_request' ? 'pending' : null,
    entityStatus: notif.type === 'friend_request' ? 'pending' : null,
    createdAt: notif.created_at,
    readAt: notif.read_at,
    actor: actorObj
  };

  // 7. Calculate new unread count
  const unreadCount = await getUnreadCount(userId);

  // 8. Real-time socket emit
  emitNotificationCreated(io, userId, notification, unreadCount);
  emitUnreadCount(io, userId, unreadCount);

  return { notification, unreadCount };
}

/** Get list of notifications with cursor pagination */
async function getNotifications({ userId, limit = 20, cursor = null, type = null }) {
  const cleanLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const cursorDate = cursor ? new Date(cursor) : null;

  let query = `
    SELECT
      n.id, n.type, n.entity_id, n.created_at, n.read_at,
      u.id as actor_id, u.username as actor_username,
      u.avatar_seed as actor_avatar_seed, u.avatar_style as actor_avatar_style,
      f.status as entity_status
    FROM notifications n
    LEFT JOIN users u ON u.id = n.actor_id
    LEFT JOIN friendships f ON (
      n.type = 'friend_request' AND (
        f.id::text = n.entity_id
        OR (
          f.status = 'accepted' AND (
            (f.user_low = n.user_id AND f.user_high = n.actor_id)
            OR (f.user_low = n.actor_id AND f.user_high = n.user_id)
          )
        )
      )
    )
    WHERE n.user_id = $1
  `;

  const params = [userId];
  let pIdx = 2;

  if (type) {
    query += ` AND n.type = $${pIdx++}`;
    params.push(type);
  }

  if (cursorDate) {
    query += ` AND n.created_at < $${pIdx++}`;
    params.push(cursorDate);
  }

  query += `
    ORDER BY n.created_at DESC
    LIMIT $${pIdx};
  `;
  params.push(cleanLimit);

  const { rows } = await db.query(query, params);

  const items = rows.map(r => ({
    id: r.id,
    type: r.type,
    entityId: r.entity_id,
    status: r.entity_status || (r.type === 'friend_request' ? 'pending' : null),
    entityStatus: r.entity_status || (r.type === 'friend_request' ? 'pending' : null),
    createdAt: r.created_at,
    readAt: r.read_at,
    actor: r.actor_id ? {
      id: r.actor_id,
      username: r.actor_username,
      avatarSeed: r.actor_avatar_seed,
      avatarStyle: r.actor_avatar_style
    } : null
  }));

  const nextCursor = items.length === cleanLimit ? items[items.length - 1].createdAt : null;
  const unreadCount = await getUnreadCount(userId);

  return { items, notifications: items, nextCursor, unreadCount, count: unreadCount };
}

/** Mark a single notification read */
async function markNotificationRead(notificationId, userId, io = null) {
  const { rows } = await db.query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING id;`,
    [notificationId, userId]
  );

  const unreadCount = await getUnreadCount(userId);
  emitUnreadCount(io, userId, unreadCount);

  return { marked: rows.length > 0, unreadCount };
}

/** Mark all unread notifications read for user */
async function markAllNotificationsRead(userId, io = null) {
  await db.query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL;`,
    [userId]
  );

  emitUnreadCount(io, userId, 0);
  return { success: true, unreadCount: 0 };
}

/** Mark notification read by entity ID (e.g. when accepting/declining a friend request) */
async function markNotificationReadByEntity(entityId, userId, io = null) {
  if (!entityId || !userId) return;

  await db.query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE entity_id = $1 AND user_id = $2 AND read_at IS NULL;`,
    [String(entityId), userId]
  );

  const unreadCount = await getUnreadCount(userId);
  emitUnreadCount(io, userId, unreadCount);
}

module.exports = {
  pruneNotifications,
  getUnreadCount,
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markNotificationReadByEntity
};
