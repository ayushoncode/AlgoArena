/**
 * queues/verdictSubscriber.js — Redis pub/sub subscriber for worker verdicts
 *
 * The BullMQ worker (workers/judge.js) publishes results to the Redis
 * channel "aa:verdicts" after each Docker sandbox run. This module
 * subscribes to that channel and calls the provided callback so that
 * backend/socket/match.js can emit the appropriate Socket.io events
 * to the correct room — all without the worker needing a direct
 * reference to the io instance.
 *
 * A subscriber connection can ONLY subscribe/psubscribe — it cannot
 * issue regular Redis commands — so it uses its own ioredis instance
 * separate from the queue and publisher connections.
 *
 * Usage (in index.js, after io is created):
 *   const { startVerdictSubscriber } = require('./queues/verdictSubscriber')
 *   startVerdictSubscriber(payload => handleVerdict(payload, io))
 */

'use strict'

const { makeRedisConnection } = require('./redisClient')

const VERDICT_CHANNEL = 'aa:verdicts'

/**
 * startVerdictSubscriber(onVerdict)
 *
 * @param {Function} onVerdict  Called with the parsed verdict payload object
 * @returns {ioredis|null}      The subscriber ioredis instance (or null)
 */
function startVerdictSubscriber(onVerdict) {
  const sub = makeRedisConnection()

  if (!sub) {
    console.warn('[VerdictSub] REDIS_URL not set — subscriber not started (inline judge active)')
    return null
  }

  sub.subscribe(VERDICT_CHANNEL, (err, count) => {
    if (err) {
      console.error('[VerdictSub] Failed to subscribe:', err.message)
      return
    }
    console.log(`[VerdictSub] Subscribed to "${VERDICT_CHANNEL}" ✓  (${count} channel(s))`)
  })

  sub.on('message', (channel, message) => {
    if (channel !== VERDICT_CHANNEL) return
    try {
      const payload = JSON.parse(message)
      console.log(
        `[VerdictSub] verdict received  room=${payload.roomId?.slice(0, 20)}` +
        `  user=${payload.username}  verdict=${payload.verdict}`
      )
      onVerdict(payload)
    } catch (err) {
      console.error('[VerdictSub] Failed to parse message:', err.message, '\nRaw:', message?.slice(0, 200))
    }
  })

  sub.on('error', (err) => {
    console.error('[VerdictSub] Redis subscriber error:', err.message)
  })

  sub.on('connect', () => {
    console.log('[VerdictSub] Redis connected ✓')
  })

  return sub
}

module.exports = { startVerdictSubscriber }
