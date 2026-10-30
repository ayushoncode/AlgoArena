/**
 * backend/middleware/rateLimiter.js
 *
 * Lightweight in-memory rate limiter for sensitive endpoints.
 * Protects subscribe, verify, and cancel endpoints against abuse.
 */

'use strict'

function createRateLimiter({ windowMs = 600_000, max = 10, message = 'Too many requests, please try again later.' }) {
  const hits = new Map() // key -> { count, resetAt }

  return function rateLimiter(req, res, next) {
    const key = (req.user && req.user.id) || req.ip || 'anonymous'
    const now = Date.now()

    let record = hits.get(key)
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs }
      hits.set(key, record)
      return next()
    }

    record.count++
    if (record.count > max) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000)
      })
    }

    next()
  }
}

module.exports = { createRateLimiter }

