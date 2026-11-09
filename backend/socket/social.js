/**
 * backend/socket/social.js
 *
 * Socket.io handlers and real-time emitters for AlgoArena Social & Notifications:
 * Namespaces/Events:
 *   - "user:<hashed id>" private room for each authenticated user
 *   - notif:created { notification, unreadCount }
 *   - notif:count { unreadCount }
 *   - social:friend_added { friendId, friendshipId }
 *   - social:friend_removed { friendId }
 */

'use strict';

const crypto = require('crypto');
const config = require('../config/social');

function hashId(id) {
  if (!id) return 'unknown';
  return crypto.createHash('sha256').update(String(id)).digest('hex').slice(0, 10);
}

function getUserRoom(userId) {
  return `user:${hashId(userId)}`;
}

let ioInstance = null;

function registerSocial(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user || !user.id) return;

    const userRoom = getUserRoom(user.id);
    socket.join(userRoom);

    // console.log(`[Social Socket] user=${hashId(user.id)} joined private room=${userRoom}`);

    socket.on('disconnect', () => {
      // Clean up
    });
  });
}

function getIO() {
  return ioInstance;
}

/** Emit real-time notification creation and updated unread count */
function emitNotificationCreated(io, userId, notification, unreadCount) {
  const targetIo = io || ioInstance;
  if (!targetIo) return;

  const room = getUserRoom(userId);
  targetIo.to(room).emit('notif:created', {
    notification,
    unreadCount
  });
}

/** Emit unread count update */
function emitUnreadCount(io, userId, unreadCount) {
  const targetIo = io || ioInstance;
  if (!targetIo) return;

  const room = getUserRoom(userId);
  targetIo.to(room).emit('notif:count', {
    unreadCount
  });
}

/** Emit friend added event to a user */
function emitFriendAdded(io, userId, friendId, friendshipId) {
  const targetIo = io || ioInstance;
  if (!targetIo) return;

  const room = getUserRoom(userId);
  targetIo.to(room).emit('social:friend_added', {
    friendId,
    friendshipId
  });
}

/** Emit friend removed event to a user */
function emitFriendRemoved(io, userId, friendId) {
  const targetIo = io || ioInstance;
  if (!targetIo) return;

  const room = getUserRoom(userId);
  targetIo.to(room).emit('social:friend_removed', {
    friendId
  });
}

module.exports = {
  hashId,
  getUserRoom,
  registerSocial,
  getIO,
  emitNotificationCreated,
  emitUnreadCount,
  emitFriendAdded,
  emitFriendRemoved
};
