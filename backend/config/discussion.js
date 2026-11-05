/**
 * backend/config/discussion.js
 *
 * Server-side configuration for Discussion Rooms:
 * feature flags, limits, spoiler rules, blocklist, and anti-abuse thresholds.
 */

'use strict';

module.exports = {
  // Feature flags (default off unless set to 'true')
  get isDiscussionEnabled() {
    return process.env.DISCUSSION_ENABLED === 'true';
  },
  get isFreeReadEnabled() {
    return process.env.DISCUSSION_FREE_READ === 'true';
  },
  get isGatingEnabled() {
    return process.env.PREMIUM_GATING_ENABLED !== 'false';
  },

  // Content lengths
  maxTitleLength: 120,
  maxThreadBodyLength: 4000,
  maxReplyBodyLength: 2000,
  maxReportNoteLength: 500,

  // Allowed thread types
  types: ['Question', 'Approach', 'Hint', 'Solution'],

  // Report categories
  reportCategories: [
    'Spam',
    'Harassment or hate',
    'Cheating or leaked answers',
    'Sharing private information',
    'Other'
  ],

  // Anti-abuse limits
  maxThreadsPerHour: 5,
  maxRepliesPerHour: 30,
  minSecondsBetweenPosts: 20,
  maxLinksPerPost: 3,
  duplicateWindowHours: 24,
  linksAllowedMinAccountAgeDays: 7,

  // Safety thresholds
  reportsThresholdToHide: 3,
  editWindowMinutes: 15,

  // Spoiler rules
  codeLinesForAutoSolution: 5,

  // Blocklist of disallowed phrases (normalized, case-insensitive)
  blocklist: [
    'nigger', 'nigga', 'faggot', 'kike', 'chink', 'retard',
    'free discord nitro', 't.me/', 'whatsapp group', 'telegram group',
    'crypto giveaway', 'buy followers', 'cheap robux'
  ]
};

