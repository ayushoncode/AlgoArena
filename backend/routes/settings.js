/**
 * backend/routes/settings.js
 *
 * REST API routes for User Social & Privacy Settings:
 * - GET /api/settings/social: Read privacy & notification preferences
 * - PUT /api/settings/social: Update preferences
 */

'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const config = require('../config/social');
const { getSocialSettings, updateSocialSettings } = require('../services/social');

/** Guard checking if FRIENDS_ENABLED or NOTIFICATIONS_ENABLED is active */
function settingsGate(req, res, next) {
  if (!config.isFriendsEnabled && !config.isNotificationsEnabled) {
    return res.status(404).json({
      error: 'FEATURE_DISABLED',
      message: 'Social settings are currently disabled.'
    });
  }
  next();
}

// ── GET /api/settings/social ─────────────────────────────────────────────────
router.get('/social', authMiddleware, settingsGate, async (req, res) => {
  const userId = req.user.id;

  try {
    const settings = await getSocialSettings(userId);
    return res.json(settings);
  } catch (err) {
    console.error('[Settings GET /social error]:', err.message);
    return res.status(500).json({ message: 'Failed to retrieve social settings' });
  }
});

// ── PUT /api/settings/social ─────────────────────────────────────────────────
router.put('/social', authMiddleware, settingsGate, async (req, res) => {
  const userId = req.user.id;
  const { allowRequests, friendsVisibility, mutedTypes } = req.body;

  try {
    const updated = await updateSocialSettings(userId, {
      allowRequests,
      friendsVisibility,
      mutedTypes
    });
    return res.json(updated);
  } catch (err) {
    console.error('[Settings PUT /social error]:', err.message);
    return res.status(500).json({ message: 'Failed to update social settings' });
  }
});

module.exports = router;
