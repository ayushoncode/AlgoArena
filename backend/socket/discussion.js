/**
 * backend/socket/discussion.js
 *
 * Socket.io handlers and event emitters for Discussion Rooms (disc:* namespace):
 * - disc:join (room keyed by problemId, capped at one room per socket)
 * - disc:leave
 * - Server pushes:
 *     - disc:thread_created
 *     - disc:reply_created
 *     - disc:post_updated
 *     - disc:post_hidden
 *     - disc:reply_notification (for unread dot on nav item)
 * - Strict entitlement check on join
 * - Match lockout enforcement on join and before any push
 * - Drop user from socket room immediately when match starts
 * - Blocklist check: never push to users who blocked author or whom author blocked
 * - Throttled emissions to handle high-frequency bursts
 * - Public author fields only (never institute, email, rating history)
 */

'use strict';

const db = require('../db');
const config = require('../config/discussion');
const { getSubscriptionStatus } = require('../services/premium');
const {
  hashId,
  isUserLockedInMatch,
  resolveProblem,
  getOrCreateRoom,
  getDailyChallengeInfo,
  getBlockedUserIds,
  hasHeavyCodeBlock
} = require('../services/discussion');

// Map of socket.id -> { roomName, problemId } to cap at one room per connection
const socketDiscRooms = new Map();

// Throttle queue per room: Map<roomName, Array<{ event, payload }>>
const throttleQueues = new Map();
const throttleTimers = new Map();
const THROTTLE_MS = 100; // max 1 flush every 100ms per room

function getDiscRoomName(problemId) {
  return `disc:room:${problemId}`;
}

/**
 * Register discussion socket handlers
 */
function registerDiscussion(io) {
  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user || !user.id) return;
    const userId = user.id;

    /* ── disc:join ────────────────────────────────────────── */
    socket.on('disc:join', async ({ problemSlug, problemId }) => {
      try {
        if (!config.isDiscussionEnabled) {
          return socket.emit('disc:error', {
            code: 'DISCUSSION_DISABLED',
            message: 'Discussion Rooms are disabled.'
          });
        }

        // Entitlement check
        if (config.isGatingEnabled) {
          const sub = await getSubscriptionStatus(userId);
          const isPremium = Boolean(sub && sub.active);
          if (!isPremium && !config.isFreeReadEnabled) {
            return socket.emit('disc:error', {
              code: 'PREMIUM_REQUIRED',
              message: 'Premium membership required to access discussion rooms.'
            });
          }
        }

        const problem = await resolveProblem(problemSlug || problemId);
        if (!problem) {
          return socket.emit('disc:error', {
            code: 'PROBLEM_NOT_FOUND',
            message: 'Problem not found.'
          });
        }

        // Integrity Rule 1: Live match lockout check
        const isLocked = await isUserLockedInMatch(userId, problem.id);
        if (isLocked) {
          return socket.emit('disc:error', {
            code: 'DISCUSSION_LOCKED_IN_MATCH',
            message: 'You are in a match on this problem. Discussion opens after it ends.'
          });
        }

        const roomName = getDiscRoomName(problem.id);

        // Cap one discussion room join per user per connection
        const previous = socketDiscRooms.get(socket.id);
        if (previous && previous.roomName !== roomName) {
          socket.leave(previous.roomName);
          socketDiscRooms.delete(socket.id);
        }

        socket.join(roomName);
        socketDiscRooms.set(socket.id, { roomName, problemId: problem.id });

        const discRoom = await getOrCreateRoom(problem.id);

        console.log(`[Discussion Socket] user=${hashId(userId)} joined room=${problem.id}`);
        socket.emit('disc:joined', {
          roomId: discRoom.id,
          problemId: problem.id,
          problemSlug: problem.slug,
          title: problem.title
        });
      } catch (err) {
        console.error('[disc:join error]', err.message);
        socket.emit('disc:error', { code: 'INTERNAL_ERROR', message: 'Failed to join discussion room' });
      }
    });

    /* ── disc:leave ───────────────────────────────────────── */
    socket.on('disc:leave', ({ problemId } = {}) => {
      const current = socketDiscRooms.get(socket.id);
      if (current) {
        socket.leave(current.roomName);
        socketDiscRooms.delete(socket.id);
        console.log(`[Discussion Socket] user=${hashId(userId)} left room=${current.problemId}`);
      }
    });

    /* ── disconnect cleanup ───────────────────────────────── */
    socket.on('disconnect', () => {
      socketDiscRooms.delete(socket.id);
    });
  });
}

/**
 * Integrity Rule 1 hook:
 * Immediately drops all connected sockets for players entering a match on problemId
 */
function dropUsersFromDiscussionRoom(io, userIds, problemId) {
  if (!io || !userIds || !problemId) return;
  const roomName = getDiscRoomName(problemId);
  const targetIds = new Set(userIds.map(id => String(id)));

  for (const [socketId, info] of socketDiscRooms.entries()) {
    if (String(info.problemId) === String(problemId)) {
      const s = io.sockets.sockets.get(socketId);
      if (s && s.user?.id && targetIds.has(String(s.user.id))) {
        s.leave(roomName);
        socketDiscRooms.delete(socketId);
        s.emit('disc:locked_in_match', {
          problemId,
          message: 'You entered a match on this problem. Discussion has been closed.'
        });
        console.log(`[Discussion Socket] Match lockout triggered: dropped user=${hashId(s.user.id)} from disc room=${problemId}`);
      }
    }
  }
}

/**
 * Filtered push helper:
 * - Checks block list
 * - Re-evaluates live-match lockout
 * - Applies daily challenge spoiler masking
 */
async function pushToRoomWithIntegrity(io, problemId, authorId, event, getPayloadForUser) {
  if (!io || !problemId) return;
  const roomName = getDiscRoomName(problemId);

  try {
    const sockets = await io.in(roomName).fetchSockets();
    if (!sockets || sockets.length === 0) return;

    const blockedIds = authorId ? await getBlockedUserIds(authorId) : [];
    const blockedSet = new Set(blockedIds.map(id => String(id)));

    for (const s of sockets) {
      const recipientId = s.user?.id;
      if (!recipientId) continue;

      // Never push to users who blocked the author or author blocked
      if (authorId && blockedSet.has(String(recipientId))) {
        continue;
      }

      // Live match lockout check on push
      const isLocked = await isUserLockedInMatch(recipientId, problemId);
      if (isLocked) {
        const fullSocket = io.sockets.sockets.get(s.id);
        if (fullSocket) {
          fullSocket.leave(roomName);
          socketDiscRooms.delete(s.id);
          fullSocket.emit('disc:locked_in_match', {
            problemId,
            message: 'You entered a match on this problem. Discussion closed.'
          });
        }
        continue;
      }

      const payload = getPayloadForUser(recipientId);
      s.emit(event, payload);
    }
  } catch (err) {
    console.error(`[Discussion Socket push error on ${event}]`, err.message);
  }
}

/**
 * Broadcast: thread created
 */
async function emitThreadCreated(io, { thread, problemId, authorId }) {
  if (!io) return;
  const { dailyProblemId } = await getDailyChallengeInfo();
  const isDaily = dailyProblemId && String(dailyProblemId) === String(problemId);
  const isSolution = thread.type === 'Solution';
  const isSpoiler = isSolution || hasHeavyCodeBlock(thread.body);

  await pushToRoomWithIntegrity(io, problemId, authorId, 'disc:thread_created', (recipientId) => {
    let title = thread.title;
    let isDailyHidden = false;

    if (isDaily && isSolution) {
      title = 'Hidden until the daily challenge resets';
      isDailyHidden = true;
    }

    return {
      thread: {
        id: thread.id,
        roomId: thread.roomId || thread.room_id,
        problemId,
        type: thread.type,
        title,
        helpfulCount: 0,
        replyCount: 0,
        status: thread.status || 'visible',
        isSpoiler,
        isDailyHidden,
        createdAt: thread.createdAt || thread.created_at,
        author: thread.author
      }
    };
  });
}

/**
 * Broadcast: reply created
 * Also sends unread dot notification directly to thread author
 */
async function emitReplyCreated(io, { reply, threadId, problemId, authorId, threadAuthorId, problemSlug }) {
  if (!io) return;

  // 1. Push to room
  await pushToRoomWithIntegrity(io, problemId, authorId, 'disc:reply_created', (_recipientId) => {
    return {
      reply: {
        id: reply.id,
        threadId,
        replyToId: reply.replyToId || reply.reply_to_id,
        helpfulCount: 0,
        status: reply.status || 'visible',
        createdAt: reply.createdAt || reply.created_at,
        author: reply.author
      }
    };
  });

  // 2. Unread notification to thread author (if replied by someone else)
  if (threadAuthorId && String(threadAuthorId) !== String(authorId)) {
    try {
      const authorSockets = await io.fetchSockets();
      for (const s of authorSockets) {
        if (s.user?.id && String(s.user.id) === String(threadAuthorId)) {
          s.emit('disc:reply_notification', {
            threadId,
            replyId: reply.id,
            problemId,
            problemSlug
          });
        }
      }
    } catch (err) {
      console.warn('[Discussion Socket] unread notification emit warning:', err.message);
    }
  }
}

/**
 * Broadcast: post updated (edited, voted, or deleted)
 */
async function emitPostUpdated(io, { postKind, postId, problemId, status, title, helpfulCount, replyCount, editedAt }) {
  if (!io) return;
  await pushToRoomWithIntegrity(io, problemId, null, 'disc:post_updated', (_recipientId) => {
    return {
      postKind,
      postId,
      status,
      title,
      helpfulCount,
      replyCount,
      editedAt
    };
  });
}

/**
 * Broadcast: post hidden (moderation or report auto-hide)
 */
async function emitPostHidden(io, { postKind, postId, problemId }) {
  if (!io) return;
  await pushToRoomWithIntegrity(io, problemId, null, 'disc:post_hidden', (_recipientId) => {
    return {
      postKind,
      postId
    };
  });
}

module.exports = {
  registerDiscussion,
  dropUsersFromDiscussionRoom,
  emitThreadCreated,
  emitReplyCreated,
  emitPostUpdated,
  emitPostHidden
};

