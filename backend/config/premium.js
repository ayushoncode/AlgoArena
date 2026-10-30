/**
 * backend/config/premium.js
 *
 * Backend configuration for AlgoArena Premium plan, feature flags,
 * pricing, launch slots, and payment parameters.
 */

'use strict'

module.exports = {
  // Feature flags (defaults true unless explicitly disabled with 'false')
  get isPremiumEnabled() {
    return process.env.PREMIUM_ENABLED !== 'false'
  },
  get isGatingEnabled() {
    return process.env.PREMIUM_GATING_ENABLED !== 'false'
  },

  currency: 'INR',
  standardPricePaise: 5000,
  launchPricePaise: 3900,
  totalLaunchSlots: 100,
  slotReservationTimeoutMinutes: 30,
  renewalGracePeriodDays: 3,

  // Plan identifiers configured in Razorpay Test / Production dashboard
  razorpayPlanLaunchId: process.env.RAZORPAY_PLAN_LAUNCH_ID || 'plan_launch_test',
  razorpayPlanStandardId: process.env.RAZORPAY_PLAN_STANDARD_ID || 'plan_standard_test',

  // Razorpay keys (key_id is public, key_secret is server-only)
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // Support contact
  supportEmail: 'support@algoarena.io',

  // Feature keys supported by the entitlement engine
  featureKeys: {
    SHEET: 'sheet',
    SHEET_1V1: 'sheet_1v1',
    PREMIUM_BADGE: 'premium_badge',
    DISCUSSION_ROOMS: 'discussion_rooms',
    GLOBAL_CHAT: 'global_chat',
    VOICE_CHAT: 'voice_chat'
  }
}

