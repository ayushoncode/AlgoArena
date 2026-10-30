/**
 * backend/routes/premium.js
 *
 * REST endpoints for AlgoArena Premium:
 * - GET  /api/premium/offer     (public, 30s cache)
 * - GET  /api/premium/status    (authenticated / optional auth)
 * - POST /api/premium/subscribe (authenticated, rate limited, transactional slot claim)
 * - POST /api/premium/verify    (authenticated, rate limited, UX checkout signature verification only)
 * - POST /api/premium/webhook   (raw body HMAC signature verification, idempotent)
 * - POST /api/premium/cancel    (authenticated, rate limited, cancel at cycle end)
 */

'use strict'

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../db')
const config = require('../config/premium')
const authMiddleware = require('../middleware/auth')
const { createRateLimiter } = require('../middleware/rateLimiter')
const {
  getOfferState,
  getSubscriptionStatus,
  claimSlotTransaction,
  invalidateOfferCache
} = require('../services/premium')
const {
  maskId,
  createSubscription,
  cancelSubscription,
  verifyCheckoutSignature,
  verifyWebhookSignature
} = require('../utils/razorpay')

// Rate limiters
const subscribeLimiter = createRateLimiter({ windowMs: 600_000, max: 10, message: 'Too many subscription requests. Please try again in a few minutes.' })
const verifyLimiter = createRateLimiter({ windowMs: 600_000, max: 20, message: 'Too many verification attempts. Please try again shortly.' })
const cancelLimiter = createRateLimiter({ windowMs: 600_000, max: 10, message: 'Too many cancellation requests. Please try again shortly.' })

// Metrics
let invalidWebhookCount = 0

/**
 * Optional authentication helper:
 * Decodes req.user if Bearer token is provided, without rejecting if missing.
 */
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      req.user = null
    }
  } else {
    req.user = null
  }
  next()
}

/**
 * Helper to parse Unix timestamp (seconds) into ISO UTC Date or null
 */
function toDateOrNull(unixSec) {
  if (!unixSec || isNaN(unixSec)) return null
  return new Date(unixSec * 1000).toISOString()
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. GET /api/premium/offer
// Public launch offer details (30s cache)
// ══════════════════════════════════════════════════════════════════════════════
router.get('/offer', async (_req, res) => {
  if (!config.isPremiumEnabled) {
    return res.status(404).json({ message: 'premium feature disabled' })
  }

  try {
    const offer = await getOfferState()
    return res.json(offer)
  } catch (err) {
    console.error('[GET /api/premium/offer]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// 2. GET /api/premium/status
// Current subscription status for authenticated user
// ══════════════════════════════════════════════════════════════════════════════
router.get('/status', optionalAuth, async (req, res) => {
  if (!config.isPremiumEnabled) {
    return res.json({
      active: false,
      until: null,
      cancelAtPeriodEnd: false,
      plan: null,
      launchSlot: false,
      enabled: false
    })
  }

  try {
    if (!req.user || !req.user.id) {
      return res.json({
        active: false,
        until: null,
        cancelAtPeriodEnd: false,
        plan: null,
        launchSlot: false,
        enabled: true
      })
    }

    const status = await getSubscriptionStatus(req.user.id)
    return res.json({
      ...status,
      enabled: true
    })
  } catch (err) {
    console.error('[GET /api/premium/status]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// 2b. GET /api/premium/badges
// Query premium status for a list of user IDs or usernames
// ══════════════════════════════════════════════════════════════════════════════
router.get('/badges', async (req, res) => {
  if (!config.isPremiumEnabled) {
    return res.json({ premiumUserIds: [], premiumUsernames: [] })
  }

  try {
    const rawIds = req.query.ids ? String(req.query.ids).split(',').map(s => s.trim()).filter(Boolean) : []
    const rawUsernames = req.query.usernames ? String(req.query.usernames).split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : []

    if (rawIds.length === 0 && rawUsernames.length === 0) {
      return res.json({ premiumUserIds: [], premiumUsernames: [] })
    }

    let premiumUserIds = []
    let premiumUsernames = []
    const slots = {}

    if (rawIds.length > 0 || rawUsernames.length > 0) {
      const { rows } = await db.query(
        `SELECT DISTINCT LOWER(u.username) AS username, s.user_id, ls.slot_number
         FROM subscriptions s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN launch_slots ls ON ls.subscription_id = s.id AND ls.status = 'active'
         WHERE (LOWER(u.username) = ANY($1::text[]) OR s.user_id::text = ANY($2::text[]))
           AND s.status IN ('active', 'cancelled')
           AND s.current_period_end > NOW()`,
        [rawUsernames, rawIds]
      )
      premiumUsernames = rows.map(r => r.username)
      premiumUserIds = rows.map(r => r.user_id)
      for (const r of rows) {
        if (r.slot_number) {
          slots[r.username] = r.slot_number
          slots[r.user_id] = r.slot_number
        }
      }
    }

    return res.json({ premiumUserIds, premiumUsernames, slots })
  } catch (err) {
    console.error('[GET /api/premium/badges]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// 2c. GET /api/premium/billing
// Full subscription state and payment history for authenticated user
// ══════════════════════════════════════════════════════════════════════════════
router.get('/billing', authMiddleware, async (req, res) => {
  if (!config.isPremiumEnabled) {
    return res.status(404).json({ message: 'premium feature disabled' })
  }

  const userId = req.user.id

  try {
    const status = await getSubscriptionStatus(userId)

    const { rows: payments } = await db.query(`
      SELECT 
        p.id,
        p.razorpay_payment_id,
        p.amount,
        p.currency,
        p.status,
        p.captured_at,
        p.created_at
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      WHERE s.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 20;
    `, [userId])

    return res.json({
      subscription: status,
      payments
    })
  } catch (err) {
    console.error('[GET /api/premium/billing]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// 3. POST /api/premium/subscribe
// Claim slot, create Razorpay subscription, return subscription_id & key_id
// ══════════════════════════════════════════════════════════════════════════════
router.post('/subscribe', authMiddleware, subscribeLimiter, async (req, res) => {
  if (!config.isPremiumEnabled) {
    return res.status(404).json({ message: 'premium feature disabled' })
  }

  const userId = req.user.id

  try {
    // 1. Prevent duplicate active or pending subscriptions
    const { rows: existingSubs } = await db.query(`
      SELECT s.id, s.razorpay_subscription_id, s.razorpay_plan_id, s.status, s.launch_slot
      FROM subscriptions s
      WHERE s.user_id = $1
        AND s.status IN ('active', 'authenticated', 'created', 'pending')
      ORDER BY s.created_at DESC
      LIMIT 1;
    `, [userId])

    if (existingSubs.length > 0) {
      const existing = existingSubs[0]
      console.log(`[Premium:Subscribe] Returning existing subscription for user ${maskId(userId)}: sub=${maskId(existing.razorpay_subscription_id)}`)
      return res.json({
        subscription_id: existing.razorpay_subscription_id,
        key_id: config.razorpayKeyId,
        plan: existing.launch_slot ? 'launch' : 'standard',
        is_existing: true
      })
    }

    // 2. Transactional slot reservation and subscription creation
    const client = await db.pool.connect()
    try {
      await client.query('BEGIN')

      // Atomically claim next launch slot if available
      const slotClaim = await claimSlotTransaction(client, userId)
      const isLaunch = slotClaim.hasLaunchSlot
      const slotNumber = slotClaim.slotNumber
      const planId = isLaunch ? config.razorpayPlanLaunchId : config.razorpayPlanStandardId

      // Create subscription in Razorpay
      const rzpSub = await createSubscription({
        planId,
        userId,
        totalCount: 120 // Monthly subscription
      })

      // Insert subscription record into our database
      const { rows: insertedRows } = await client.query(`
        INSERT INTO subscriptions (
          user_id,
          razorpay_subscription_id,
          razorpay_plan_id,
          status,
          launch_slot
        ) VALUES ($1, $2, $3, 'created', $4)
        RETURNING id;
      `, [userId, rzpSub.id, planId, isLaunch])

      const subInternalId = insertedRows[0].id

      // Link launch slot to subscription if claimed
      if (isLaunch && slotNumber) {
        await client.query(`
          UPDATE launch_slots
          SET subscription_id = $1,
              updated_at = NOW()
          WHERE slot_number = $2;
        `, [subInternalId, slotNumber])
      }

      await client.query('COMMIT')
      invalidateOfferCache()

      console.log(`[Premium:Subscribe] User ${maskId(userId)} assigned plan=${isLaunch ? 'launch' : 'standard'} slot=${slotNumber || 'none'} sub=${maskId(rzpSub.id)}`)

      return res.json({
        subscription_id: rzpSub.id,
        key_id: config.razorpayKeyId,
        plan: isLaunch ? 'launch' : 'standard',
        slot_number: slotNumber
      })

    } catch (txnErr) {
      await client.query('ROLLBACK')
      throw txnErr
    } finally {
      client.release()
    }

  } catch (err) {
    console.error('[POST /api/premium/subscribe]', err)
    return res.status(500).json({ message: 'Unable to initiate subscription. Please try again.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// 4. POST /api/premium/verify
// Verifies Checkout signature for UX purposes only. DOES NOT grant Premium.
// ══════════════════════════════════════════════════════════════════════════════
router.post('/verify', authMiddleware, verifyLimiter, async (req, res) => {
  if (!config.isPremiumEnabled) {
    return res.status(404).json({ message: 'premium feature disabled' })
  }

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({
      verified: false,
      message: 'Missing required signature verification fields.'
    })
  }

  const isValid = verifyCheckoutSignature({
    paymentId: razorpay_payment_id,
    subscriptionId: razorpay_subscription_id,
    signature: razorpay_signature
  })

  if (!isValid) {
    console.warn(`[Premium:Verify] Signature mismatch for sub=${maskId(razorpay_subscription_id)} pay=${maskId(razorpay_payment_id)}`)
    return res.status(400).json({
      verified: false,
      message: 'Invalid signature. Payment authorization could not be verified.'
    })
  }

  console.log(`[Premium:Verify] Checkout signature valid for sub=${maskId(razorpay_subscription_id)}. Awaiting webhook activation.`)
  return res.json({
    verified: true,
    message: 'Payment received. Activating Premium...'
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 5. POST /api/premium/webhook
// Raw body HMAC signature verification, idempotent, grants and updates Premium.
// ══════════════════════════════════════════════════════════════════════════════
router.post('/webhook', async (req, res) => {
  // Webhooks are accepted even if PREMIUM_ENABLED is false to ensure provider handshakes work
  const signature = req.headers['x-razorpay-signature']
  const rawBody = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}), 'utf8'))

  // 1. Signature Verification with timing-safe comparison
  const isValid = verifyWebhookSignature(rawBody, signature)
  if (!isValid) {
    invalidWebhookCount++
    console.warn(`[Premium:Webhook] Invalid signature received (count: ${invalidWebhookCount})`)
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  let eventData
  try {
    eventData = JSON.parse(rawBody.toString('utf8'))
  } catch (err) {
    console.error('[Premium:Webhook] Malformed JSON payload:', err.message)
    return res.status(400).json({ error: 'Malformed JSON payload' })
  }

  const eventType = eventData.event
  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex')
  const eventId = req.headers['x-razorpay-event-id'] || eventData.event_id || eventData.id || `${eventType}_${payloadHash.slice(0, 16)}`

  // 2. Idempotency Check in webhook_events table
  try {
    const { rows: insertedEvents } = await db.query(`
      INSERT INTO webhook_events (razorpay_event_id, event_type, payload_hash, received_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (razorpay_event_id) DO NOTHING
      RETURNING id;
    `, [eventId, eventType, payloadHash])

    if (insertedEvents.length === 0) {
      console.log(`[Premium:Webhook] Duplicate event ignored: ${maskId(eventId)} (${eventType})`)
      return res.status(200).json({ status: 'ignored', duplicate: true })
    }
  } catch (dbErr) {
    console.error('[Premium:Webhook] Error checking idempotency:', dbErr.message)
    return res.status(500).json({ error: 'Database error' })
  }

  console.log(`[Premium:Webhook] Processing event: ${maskId(eventId)} (${eventType})`)

  // 3. Process events safely
  try {
    const subEntity = eventData?.payload?.subscription?.entity
    const paymentEntity = eventData?.payload?.payment?.entity

    const rzpSubId = subEntity?.id || (paymentEntity && paymentEntity.subscription_id) || null
    const rzpPayId = paymentEntity?.id || null

    switch (eventType) {
      case 'subscription.authenticated': {
        if (rzpSubId) {
          const { rows } = await db.query(`
            UPDATE subscriptions
            SET status = 'authenticated',
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1
            RETURNING id, launch_slot;
          `, [rzpSubId])

          if (rows[0] && rows[0].launch_slot) {
            await db.query(`
              UPDATE launch_slots
              SET status = 'active',
                  updated_at = NOW()
              WHERE subscription_id = $1;
            `, [rows[0].id])
          }
        }
        break
      }

      case 'subscription.activated': {
        if (rzpSubId) {
          const periodStart = toDateOrNull(subEntity?.current_start)
          const periodEnd = toDateOrNull(subEntity?.current_end)

          const { rows } = await db.query(`
            UPDATE subscriptions
            SET status = 'active',
                current_period_start = COALESCE($2, current_period_start, NOW()),
                current_period_end = COALESCE($3, current_period_end, NOW() + INTERVAL '30 days'),
                cancel_at_period_end = false,
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1
            RETURNING id, launch_slot;
          `, [rzpSubId, periodStart, periodEnd])

          if (rows[0] && rows[0].launch_slot) {
            await db.query(`
              UPDATE launch_slots
              SET status = 'active',
                  updated_at = NOW()
              WHERE subscription_id = $1;
            `, [rows[0].id])
          }
          invalidateOfferCache()
        }
        break
      }

      case 'subscription.charged': {
        if (rzpSubId) {
          const periodStart = toDateOrNull(subEntity?.current_start)
          const periodEnd = toDateOrNull(subEntity?.current_end)

          const { rows: subRows } = await db.query(`
            UPDATE subscriptions
            SET status = 'active',
                current_period_start = COALESCE($2, current_period_start, NOW()),
                current_period_end = COALESCE($3, current_period_end, NOW() + INTERVAL '30 days'),
                cancel_at_period_end = false,
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1
            RETURNING id;
          `, [rzpSubId, periodStart, periodEnd])

          const subInternalId = subRows[0]?.id || null

          // Record payment transaction
          if (rzpPayId && paymentEntity) {
            const amount = paymentEntity.amount || 0
            const currency = paymentEntity.currency || 'INR'
            const capturedAt = toDateOrNull(paymentEntity.created_at)

            await db.query(`
              INSERT INTO payments (
                razorpay_payment_id,
                subscription_id,
                razorpay_subscription_id,
                amount,
                currency,
                status,
                captured_at
              ) VALUES ($1, $2, $3, $4, $5, 'captured', $6)
              ON CONFLICT (razorpay_payment_id) DO UPDATE
              SET status = 'captured',
                  captured_at = EXCLUDED.captured_at;
            `, [rzpPayId, subInternalId, rzpSubId, amount, currency, capturedAt])
          }
        }
        break
      }

      case 'subscription.pending': {
        if (rzpSubId) {
          await db.query(`
            UPDATE subscriptions
            SET status = 'pending',
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1;
          `, [rzpSubId])
        }
        break
      }

      case 'subscription.halted': {
        if (rzpSubId) {
          await db.query(`
            UPDATE subscriptions
            SET status = 'halted',
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1;
          `, [rzpSubId])
        }
        break
      }

      case 'subscription.cancelled': {
        if (rzpSubId) {
          await db.query(`
            UPDATE subscriptions
            SET status = 'cancelled',
                cancel_at_period_end = true,
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1;
          `, [rzpSubId])
        }
        break
      }

      case 'subscription.completed': {
        if (rzpSubId) {
          await db.query(`
            UPDATE subscriptions
            SET status = 'completed',
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1;
          `, [rzpSubId])
        }
        break
      }

      case 'subscription.updated': {
        if (rzpSubId && subEntity) {
          const planId = subEntity.plan_id
          const periodStart = toDateOrNull(subEntity.current_start)
          const periodEnd = toDateOrNull(subEntity.current_end)

          await db.query(`
            UPDATE subscriptions
            SET razorpay_plan_id = COALESCE($2, razorpay_plan_id),
                current_period_start = COALESCE($3, current_period_start),
                current_period_end = COALESCE($4, current_period_end),
                updated_at = NOW()
            WHERE razorpay_subscription_id = $1;
          `, [rzpSubId, planId, periodStart, periodEnd])
        }
        break
      }

      case 'payment.failed': {
        if (rzpPayId && paymentEntity) {
          const amount = paymentEntity.amount || 0
          const currency = paymentEntity.currency || 'INR'
          const capturedAt = toDateOrNull(paymentEntity.created_at)

          await db.query(`
            INSERT INTO payments (
              razorpay_payment_id,
              subscription_id,
              razorpay_subscription_id,
              amount,
              currency,
              status,
              captured_at
            ) VALUES ($1, NULL, $2, $3, $4, 'failed', $5)
            ON CONFLICT (razorpay_payment_id) DO UPDATE
            SET status = 'failed';
          `, [rzpPayId, rzpSubId, amount, currency, capturedAt])

          // If a created subscription failed initial mandate payment, release slot
          if (rzpSubId) {
            const { rows: subRows } = await db.query(`
              SELECT id, status, launch_slot
              FROM subscriptions
              WHERE razorpay_subscription_id = $1;
            `, [rzpSubId])

            if (subRows[0] && subRows[0].status === 'created' && subRows[0].launch_slot) {
              await db.query(`
                UPDATE launch_slots
                SET status = 'released',
                    user_id = NULL,
                    subscription_id = NULL,
                    reserved_at = NULL,
                    updated_at = NOW()
                WHERE subscription_id = $1;
              `, [subRows[0].id])
              invalidateOfferCache()
            }
          }
        }
        break
      }

      default:
        console.log(`[Premium:Webhook] Unhandled event type acknowledged: ${eventType}`)
    }

    // Mark event processed
    await db.query(`
      UPDATE webhook_events
      SET processed_at = NOW()
      WHERE razorpay_event_id = $1;
    `, [eventId])

    return res.status(200).json({ status: 'processed' })

  } catch (procErr) {
    console.error(`[Premium:Webhook] Error processing event ${maskId(eventId)}:`, procErr)
    // Return 200 so provider does not storm retries on application errors, event is recorded
    return res.status(200).json({ status: 'error_logged' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// 6. POST /api/premium/cancel
// User cancels subscription at cycle end
// ══════════════════════════════════════════════════════════════════════════════
router.post('/cancel', authMiddleware, cancelLimiter, async (req, res) => {
  if (!config.isPremiumEnabled) {
    return res.status(404).json({ message: 'premium feature disabled' })
  }

  const userId = req.user.id

  try {
    const { rows } = await db.query(`
      SELECT id, razorpay_subscription_id, status, launch_slot, current_period_end
      FROM subscriptions
      WHERE user_id = $1
        AND status IN ('active', 'authenticated')
      ORDER BY created_at DESC
      LIMIT 1;
    `, [userId])

    if (!rows[0]) {
      return res.status(404).json({ message: 'No active subscription found to cancel.' })
    }

    const sub = rows[0]

    // Call Razorpay API to cancel at cycle end
    await cancelSubscription(sub.razorpay_subscription_id, true)

    // Update in database
    await db.query(`
      UPDATE subscriptions
      SET cancel_at_period_end = true,
          updated_at = NOW()
      WHERE id = $1;
    `, [sub.id])

    console.log(`[Premium:Cancel] User ${maskId(userId)} cancelled subscription ${maskId(sub.razorpay_subscription_id)} at period end`)

    return res.json({
      cancelled: true,
      cancelAtPeriodEnd: true,
      until: sub.current_period_end ? new Date(sub.current_period_end).toISOString() : null
    })

  } catch (err) {
    console.error('[POST /api/premium/cancel]', err)
    return res.status(500).json({ message: 'Failed to cancel subscription. Please contact support.' })
  }
})

module.exports = router
