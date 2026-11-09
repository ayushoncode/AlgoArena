/**
 * backend/routes/notifications.js
 *
 * REST API routes for AlgoArena Notification Centre:
 * - GET /api/notifications: Fetch user notification feed with cursor pagination
 * - GET /api/notifications/unread-count: Quick unread count for navbar badge
 * - POST /api/notifications/:id/read: Mark individual notification read
 * - POST /api/notifications/read-all: Mark all notifications read
 */

'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const config = require('../config/social');
const {
  getUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../services/notifications');

/** Guard middleware verifying NOTIFICATIONS_ENABLED is active */
function notificationsGate(req, res, next) {
  if (!config.isNotificationsEnabled) {
    return res.status(404).json({
      error: 'FEATURE_DISABLED',
      message: 'Notifications feature is currently disabled.'
    });
  }
  next();
}

// ── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', authMiddleware, notificationsGate, async (req, res) => {
  const userId = req.user.id;
  const { limit, cursor, type } = req.query;

  try {
    const feed = await getNotifications({ userId, limit, cursor, type });
    return res.json(feed);
  } catch (err) {
    console.error('[GET /api/notifications error]:', err.message);
    return res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
});

// ── GET /api/notifications/unread-count ──────────────────────────────────────
router.get('/unread-count', authMiddleware, notificationsGate, async (req, res) => {
  const userId = req.user.id;

  try {
    const unreadCount = await getUnreadCount(userId);
    return res.json({ unreadCount, count: unreadCount });
  } catch (err) {
    console.error('[GET /api/notifications/unread-count error]:', err.message);
    return res.status(500).json({ message: 'Failed to retrieve unread notification count' });
  }
});

// ── POST /api/notifications/:id/read ─────────────────────────────────────────
router.post('/:id/read', authMiddleware, notificationsGate, async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  const io = req.app.get('io');

  try {
    const result = await markNotificationRead(notificationId, userId, io);
    return res.json(result);
  } catch (err) {
    console.error('[POST /api/notifications/:id/read error]:', err.message);
    return res.status(500).json({ message: 'Failed to mark notification read' });
  }
});

// ── POST /api/notifications/read-all ─────────────────────────────────────────
router.post('/read-all', authMiddleware, notificationsGate, async (req, res) => {
  const userId = req.user.id;
  const io = req.app.get('io');

  try {
    const result = await markAllNotificationsRead(userId, io);
    return res.json(result);
  } catch (err) {
    console.error('[POST /api/notifications/read-all error]:', err.message);
    return res.status(500).json({ message: 'Failed to mark all notifications read' });
  }
});

module.exports = router;
