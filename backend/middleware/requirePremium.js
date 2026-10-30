/**
 * backend/middleware/requirePremium.js
 *
 * Server-side access control middleware for AlgoArena Premium.
 *
 * Rules:
 * - Gates are only active when PREMIUM_GATING_ENABLED === 'true'.
 * - When gating is false, all requests pass through (preserves today's behavior).
 * - When gating is true, checks user entitlements via getSubscriptionStatus(userId).
 * - Non-entitled requests receive HTTP 403 with code PREMIUM_REQUIRED and the feature key.
 * - Never leaks gated content (problem text, solutions, discussion).
 */

'use strict'

const jwt = require('jsonwebtoken')
const { getSubscriptionStatus } = require('../services/premium')

function requirePremium(featureKey = 'premium') {
  return async function premiumGateMiddleware(req, res, next) {
    if (process.env.PREMIUM_GATING_ENABLED !== 'true') {
      return next()
    }

    // Resolve user from req.user or decode Authorization header
    let user = req.user
    if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7)
      try {
        user = jwt.verify(token, process.env.JWT_SECRET)
        req.user = user
      } catch {
        user = null
      }
    }

    if (!user || !user.id) {
      return res.status(403).json({
        code: 'PREMIUM_REQUIRED',
        feature: featureKey,
        message: 'Premium membership required to access this feature.'
      })
    }

    try {
      const status = await getSubscriptionStatus(user.id)
      if (!status || !status.active) {
        return res.status(403).json({
          code: 'PREMIUM_REQUIRED',
          feature: featureKey,
          message: 'Active Premium membership required to access this feature.'
        })
      }
      next()
    } catch (err) {
      console.error('[requirePremium middleware error]', err)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

module.exports = requirePremium

