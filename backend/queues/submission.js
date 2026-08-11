/**
 * queues/submission.js — BullMQ submission queue
 *
 * Day 25: Upstash Redis credentials + BullMQ installed.
 * Day 26: real Queue instance created here.
 * Stub exported now so index.js can import it without errors.
 */

// const { Queue } = require('bullmq')
// const { redisConnection } = require('../db/redis')
// const submissionQueue = new Queue('submissions', { connection: redisConnection })

const submissionQueue = {
  add: async (name, data) => {
    console.log('[Queue] stub — job would be added:', name, data)
    return { id: 'stub' }
  },
}

module.exports = { submissionQueue }
