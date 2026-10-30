/**
 * backend/utils/razorpay.js
 *
 * Server-side Razorpay Subscriptions integration:
 * - API Client for Subscriptions, Plans, and Cancellations
 * - Timing-safe HMAC signature verification for Checkout & Webhooks
 * - ID masking for safe logging
 */

'use strict'

const crypto = require('crypto')
const config = require('../config/premium')

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1'

/**
 * Mask sensitive identifiers for logs.
 * e.g. "sub_1234567890abcdef" -> "sub_***cdef"
 */
function maskId(id) {
  if (!id || typeof id !== 'string') return '***'
  if (id.length <= 6) return '***'
  return id.slice(0, 4) + '***' + id.slice(-4)
}

/**
 * Get HTTP Basic Authorization header
 */
function getAuthHeader() {
  const keyId = config.razorpayKeyId
  const keySecret = config.razorpayKeySecret
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured in environment')
  }
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
}

/**
 * Check if Razorpay keys are in TEST mode
 */
function isTestMode() {
  return (config.razorpayKeyId || '').startsWith('rzp_test_')
}

/**
 * Check if mock fallback mode is active (for offline dev/tests)
 */
function isMockMode() {
  return !config.razorpayKeyId || config.razorpayKeyId.includes('placeholder')
}

/**
 * Create a plan via Razorpay Subscriptions API
 */
async function createPlan({ name, amountPaise, currency = 'INR', description = '' }) {
  if (isMockMode()) {
    return {
      id: `plan_mock_${amountPaise}_${Date.now()}`,
      name,
      amount: amountPaise,
      currency,
      period: 'monthly',
      interval: 1
    }
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/plans`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      period: 'monthly',
      interval: 1,
      item: {
        name,
        amount: amountPaise,
        currency,
        description
      }
    })
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Razorpay createPlan failed (${res.status}): ${errorBody}`)
  }

  return res.json()
}

/**
 * Create a subscription via Razorpay Subscriptions API
 * POST https://api.razorpay.com/v1/subscriptions
 */
async function createSubscription({ planId, userId, totalCount = 120 }) {
  if (isMockMode()) {
    const mockSubId = `sub_mock_${(userId || 'user').slice(0, 8)}_${Date.now()}`
    console.log(`[Razorpay:Mock] Created subscription ${maskId(mockSubId)} for plan=${maskId(planId)}`)
    return {
      id: mockSubId,
      plan_id: planId,
      status: 'created',
      current_start: null,
      current_end: null,
      ended_at: null,
      quantity: 1,
      notes: { user_id: userId }
    }
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId
      }
    })
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Razorpay createSubscription failed (${res.status}): ${errorBody}`)
  }

  return res.json()
}

/**
 * Fetch subscription details from Razorpay API
 * GET https://api.razorpay.com/v1/subscriptions/{id}
 */
async function fetchSubscription(subscriptionId) {
  if (isMockMode() || subscriptionId.startsWith('sub_mock_')) {
    return {
      id: subscriptionId,
      plan_id: config.razorpayPlanLaunchId,
      status: 'active',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      ended_at: null
    }
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader()
    }
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Razorpay fetchSubscription failed (${res.status}): ${errorBody}`)
  }

  return res.json()
}

/**
 * Cancel subscription at cycle end via Razorpay API
 * POST https://api.razorpay.com/v1/subscriptions/{id}/cancel
 */
async function cancelSubscription(subscriptionId, cancelAtCycleEnd = true) {
  if (isMockMode() || subscriptionId.startsWith('sub_mock_')) {
    console.log(`[Razorpay:Mock] Cancelled subscription ${maskId(subscriptionId)} (cycleEnd=${cancelAtCycleEnd})`)
    return {
      id: subscriptionId,
      status: 'cancelled',
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0
    }
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0
    })
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Razorpay cancelSubscription failed (${res.status}): ${errorBody}`)
  }

  return res.json()
}

/**
 * Verify Razorpay Subscriptions Checkout signature (UX purpose only)
 * Message: razorpay_payment_id + '|' + razorpay_subscription_id
 * Secret: Razorpay Key Secret
 */
function verifyCheckoutSignature({ paymentId, subscriptionId, signature }) {
  if (!paymentId || !subscriptionId || !signature) {
    return false
  }

  const secret = config.razorpayKeySecret
  if (!secret) return false

  const message = `${paymentId}|${subscriptionId}`
  const expected = crypto.createHmac('sha256', secret).update(message).digest('hex')

  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

/**
 * Verify Razorpay Webhook signature
 * Message: Raw Request Body string or Buffer
 * Secret: Razorpay Webhook Secret
 * Header: X-Razorpay-Signature
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) {
    return false
  }

  const secret = config.razorpayWebhookSecret
  if (!secret) return false

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8')
  const expected = crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex')

  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

module.exports = {
  maskId,
  isTestMode,
  isMockMode,
  createPlan,
  createSubscription,
  fetchSubscription,
  cancelSubscription,
  verifyCheckoutSignature,
  verifyWebhookSignature
}

