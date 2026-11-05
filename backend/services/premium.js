/**
 * backend/services/premium.js
 *
 * Core business logic for AlgoArena Premium:
 * - Offer state with 30s cache
 * - Launch slot reservations with transactional row locks
 * - Subscription status and lifecycle evaluation
 * - Entitlements resolution
 */

'use strict'

const db = require('../db')
const config = require('../config/premium')

// 30-second in-memory cache for GET /api/premium/offer
let offerCache = null
let offerCacheExpiresAt = 0

/**
 * Release expired launch slot reservations (reserved > 30 minutes ago without activation)
 */
async function releaseExpiredSlots(client = db) {
  const timeoutMinutes = config.slotReservationTimeoutMinutes || 30
  const queryText = `
    UPDATE launch_slots
    SET status = 'released',
        user_id = NULL,
        subscription_id = NULL,
        reserved_at = NULL,
        updated_at = NOW()
    WHERE status = 'reserved'
      AND reserved_at < NOW() - ($1 || ' minutes')::INTERVAL
    RETURNING slot_number;
  `
  const { rows } = await client.query(queryText, [timeoutMinutes])
  return rows.map(r => r.slot_number)
}

/**
 * Compute the public launch offer state.
 * Returns: { total: 100, remaining: N, standardPrice, launchPrice, standardPricePaise, launchPricePaise }
 */
async function getOfferState(forceFresh = false) {
  const now = Date.now()
  if (!forceFresh && offerCache && now < offerCacheExpiresAt) {
    return offerCache
  }

  // Release expired reservations before tallying
  await releaseExpiredSlots()

  const { rows } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') as active_count,
      COUNT(*) FILTER (WHERE status = 'reserved') as reserved_count,
      COUNT(*) FILTER (WHERE status = 'released') as released_count
    FROM launch_slots;
  `)

  const stats = rows[0] || { active_count: 0, reserved_count: 0, released_count: 100 }
  const taken = Number(stats.active_count) + Number(stats.reserved_count)
  const remaining = Math.max(0, config.totalLaunchSlots - taken)

  const offer = {
    total: config.totalLaunchSlots,
    remaining,
    standardPrice: Math.floor(config.standardPricePaise / 100),
    launchPrice: Math.floor(config.launchPricePaise / 100),
    standardPricePaise: config.standardPricePaise,
    launchPricePaise: config.launchPricePaise,
    isSoldOut: remaining === 0
  }

  offerCache = offer
  offerCacheExpiresAt = now + 30_000 // 30 seconds
  return offer
}

/**
 * Invalidate the offer cache when slot status changes
 */
function invalidateOfferCache() {
  offerCache = null
  offerCacheExpiresAt = 0
}

/**
 * Transactional slot claim.
 * Must be executed with a dedicated client inside an active transaction (BEGIN ... COMMIT).
 * 
 * Rules:
 * 1. Release expired reservations.
 * 2. If the user already has an active slot, keep it.
 * 3. If the user already has a reserved slot, refresh reservation timestamp.
 * 4. Otherwise, grab the lowest available 'released' slot using SELECT ... FOR UPDATE SKIP LOCKED.
 * 5. If no slots are available, return { hasLaunchSlot: false, slotNumber: null }.
 */
async function claimSlotTransaction(client, userId) {
  if (!userId) {
    throw new Error('userId is required for slot reservation')
  }

  // 1. Release expired slots first
  const timeoutMinutes = config.slotReservationTimeoutMinutes || 30
  await client.query(`
    UPDATE launch_slots
    SET status = 'released',
        user_id = NULL,
        subscription_id = NULL,
        reserved_at = NULL,
        updated_at = NOW()
    WHERE status = 'reserved'
      AND reserved_at < NOW() - ($1 || ' minutes')::INTERVAL;
  `, [timeoutMinutes])

  // 2. Check if user already holds a slot
  const { rows: existingRows } = await client.query(`
    SELECT slot_number, status, reserved_at
    FROM launch_slots
    WHERE user_id = $1
    FOR UPDATE;
  `, [userId])

  if (existingRows.length > 0) {
    const existing = existingRows[0]
    if (existing.status === 'active') {
      return { hasLaunchSlot: true, slotNumber: existing.slot_number, isExisting: true }
    }
    // Refresh reserved timestamp
    await client.query(`
      UPDATE launch_slots
      SET reserved_at = NOW(),
          updated_at = NOW()
      WHERE slot_number = $1;
    `, [existing.slot_number])
    return { hasLaunchSlot: true, slotNumber: existing.slot_number, isExisting: true }
  }

  // 3. Atomically grab the next available slot
  const { rows: candidateRows } = await client.query(`
    SELECT slot_number
    FROM launch_slots
    WHERE status = 'released'
    ORDER BY slot_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  `)

  if (candidateRows.length === 0) {
    // All 100 slots are taken
    return { hasLaunchSlot: false, slotNumber: null, isExisting: false }
  }

  const slotNumber = candidateRows[0].slot_number

  // 4. Reserve this slot
  await client.query(`
    UPDATE launch_slots
    SET status = 'reserved',
        user_id = $1,
        reserved_at = NOW(),
        updated_at = NOW()
    WHERE slot_number = $2;
  `, [userId, slotNumber])

  invalidateOfferCache()
  return { hasLaunchSlot: true, slotNumber, isExisting: false }
}

/**
 * Get subscription status for a given user.
 * Returns: { active, until, cancelAtPeriodEnd, plan, launchSlot }
 */
async function getSubscriptionStatus(userId) {
  if (!userId) {
    return {
      active: false,
      until: null,
      cancelAtPeriodEnd: false,
      plan: null,
      launchSlot: false
    }
  }

  const { rows } = await db.query(`
    SELECT 
      s.id,
      s.razorpay_subscription_id,
      s.razorpay_plan_id,
      s.status,
      s.current_period_start,
      s.current_period_end,
      s.cancel_at_period_end,
      s.launch_slot,
      p.name as plan_name,
      p.amount as plan_amount
    FROM subscriptions s
    LEFT JOIN plans p ON p.plan_id = s.razorpay_plan_id
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC
    LIMIT 1;
  `, [userId])

  if (!rows[0]) {
    return {
      active: false,
      until: null,
      cancelAtPeriodEnd: false,
      plan: null,
      launchSlot: false
    }
  }

  const sub = rows[0]
  const now = new Date()
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null
  const graceDays = config.renewalGracePeriodDays || 3

  let isActive = false

  if (sub.status === 'active' || sub.status === 'authenticated') {
    // Active if period end is in the future or not set
    if (!periodEnd || periodEnd > now) {
      isActive = true
    } else {
      // Failed renewal / grace period check (3 days after periodEnd)
      const graceEnd = new Date(periodEnd.getTime() + graceDays * 24 * 60 * 60 * 1000)
      if (now < graceEnd) {
        isActive = true
      }
    }
  } else if (sub.status === 'cancelled' && sub.cancel_at_period_end) {
    // Kept active until period end
    if (periodEnd && periodEnd > now) {
      isActive = true
    }
  }

  return {
    active: isActive,
    status: sub.status,
    until: periodEnd ? periodEnd.toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    plan: sub.plan_name || (sub.launch_slot ? 'Premium Launch' : 'Premium Standard'),
    planAmount: sub.plan_amount || (sub.launch_slot ? config.launchPricePaise : config.standardPricePaise),
    launchSlot: sub.launch_slot,
    subscriptionId: sub.razorpay_subscription_id
  }
}

/**
 * Access control: check feature entitlements.
 * When PREMIUM_GATING_ENABLED is false, returns true for everything.
 */
async function getEntitlements(userId) {
  if (!config.isGatingEnabled) {
    return {
      isPremium: true,
      canAccessSheet: true,
      canBattleSheet: true,
      hasPremiumBadge: true,
      canAccessDiscussion: true,
      canAccessChat: true,
      canAccessVoice: true
    }
  }

  const status = await getSubscriptionStatus(userId)
  const isPremium = status.active

  return {
    isPremium,
    canAccessSheet: isPremium,
    canBattleSheet: isPremium,
    hasPremiumBadge: isPremium,
    canAccessDiscussion: process.env.DISCUSSION_ENABLED === 'true' && isPremium,
    canAccessChat: false,       // Feature marked Coming Soon
    canAccessVoice: isPremium
  }
}

module.exports = {
  getOfferState,
  getSubscriptionStatus,
  getEntitlements,
  claimSlotTransaction,
  releaseExpiredSlots,
  invalidateOfferCache
}

