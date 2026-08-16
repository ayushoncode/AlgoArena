/**
 * queues/redisClient.js — Shared ioredis connection factory
 *
 * Each BullMQ Queue, Worker, and pub/sub subscriber needs its own
 * ioredis instance because subscriber connections can't issue regular
 * commands. Call makeRedisConnection() once per logical connection.
 *
 * Returns null (and logs a warning) if REDIS_URL is not set so the
 * rest of the app degrades gracefully to the inline judge fallback.
 */

'use strict'

const Redis = require('ioredis')

/**
 * makeRedisConnection(overrideOptions?)
 * → ioredis instance, or null if REDIS_URL is unset
 */
function makeRedisConnection(overrideOptions = {}) {
  const url = process.env.REDIS_URL
  if (!url || url.includes('your-upstash-url-here')) {
    return null
  }

  return new Redis(url, {
    maxRetriesPerRequest: null,   // BullMQ requirement
    enableReadyCheck:     false,
    lazyConnect:          false,
    // Upstash uses rediss:// (TLS) — ioredis auto-detects from the URL scheme
    ...overrideOptions,
  })
}

module.exports = { makeRedisConnection }
