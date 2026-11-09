/**
 * backend/config/social.js
 *
 * Server-side configuration for AlgoArena Friends & Notification Centre:
 * feature flags, limits, privacy options, notification types, and anti-abuse limits.
 */

'use strict';

module.exports = {
  // Feature flags (default off unless env explicitly sets 'true')
  get isFriendsEnabled() {
    return process.env.FRIENDS_ENABLED === 'true';
  },
  get isNotificationsEnabled() {
    return process.env.NOTIFICATIONS_ENABLED === 'true';
  },
  get isPresenceEnabled() {
    return process.env.PRESENCE_ENABLED === 'true';
  },

  // Friendship limits
  maxFriends: 200,
  maxPendingOutgoing: 20,
  maxRequestsPer24Hours: 30,
  declineCooldownDays: 14,
  requestExpiryDays: 60,

  // Notification limits
  notificationRetentionDays: 90,
  maxNotificationsPerUser: 200,

  // Supported privacy settings
  allowRequestsOptions: ['everyone', 'nobody'],
  defaultAllowRequests: 'everyone',

  friendsVisibilityOptions: ['signed_in', 'friends_only', 'only_me'],
  defaultFriendsVisibility: 'signed_in',

  // Supported notification types
  notificationTypes: [
    'friend_request',
    'friend_accepted',
    'discussion_reply'
  ]
};
