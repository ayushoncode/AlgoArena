/**
 * queues/submission.js — BullMQ submission queue (Days 25–26)
 *
 * When REDIS_URL is set: creates a real BullMQ Queue connected to Upstash.
 * When REDIS_URL is absent: falls back to a no-op stub so local dev without
 * Redis still works — backend/socket/match.js checks isQueueActive() and
 * calls the inline vm.Script judge instead.
 *
 * Job schema (pushed on each submit_code event):
 * {
 *   submissionId : UUID   — Postgres submissions.id
 *   matchId      : UUID   — Postgres matches.id
 *   roomId       : string — Socket.io room name
 *   userId       : UUID
 *   username     : string
 *   problemId    : UUID
 *   code         : string
 *   language     : 'javascript' | 'python'
 * }
 */

'use strict'

const { makeRedisConnection } = require('./redisClient')

let submissionQueue = null
let _queueActive    = false

const connection = makeRedisConnection()

if (connection) {
  try {
    const { Queue } = require('bullmq')
    submissionQueue = new Queue('submissions', {
      connection,
      defaultJobOptions: {
        attempts:         2,
        removeOnComplete: { count: 1000 },  // keep last 1000 completed jobs in Redis
        removeOnFail:     { count: 500  },  // keep last 500 failed jobs for inspection
        backoff: { type: 'exponential', delay: 1000 },
      },
    })
    _queueActive = true
    console.log('[Queue] BullMQ submissionQueue initialised ✓  (Redis active)')
  } catch (err) {
    console.error('[Queue] Failed to initialise BullMQ:', err.message)
    submissionQueue = _makeStub()
  }
} else {
  console.warn('[Queue] REDIS_URL not set — inline judge fallback active (no BullMQ)')
  submissionQueue = _makeStub()
}

function _makeStub() {
  return {
    add: async (name, data) => {
      console.log('[Queue] stub — no Redis configured, job dropped:', name)
      return null
    },
  }
}

/**
 * isQueueActive() → boolean
 * True when a real BullMQ queue is connected.
 * Used by match.js to decide queue vs inline-judge path.
 */
function isQueueActive() {
  return _queueActive
}

module.exports = { submissionQueue, isQueueActive }
