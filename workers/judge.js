/**
 * workers/judge.js — BullMQ Worker: processes code submission jobs
 *
 * Runs as a separate process (Render background worker in production).
 * Connects to the same Upstash Redis as the API server.
 *
 * Job lifecycle:
 *   1. API server pushes job to "submissions" BullMQ queue
 *   2. This worker picks it up (concurrency = WORKER_CONCURRENCY, default 3)
 *   3. Fetches test cases from Postgres
 *   4. Calls sandbox.js → runs Docker container with all security flags
 *   5. Updates submission row in Postgres (status='done', verdict, runtime_ms)
 *   6. Publishes verdict JSON to Redis pub/sub channel "aa:verdicts"
 *   7. API server verdictSubscriber receives it → emits socket events to room
 *
 * Start:  node workers/judge.js
 * Dev:    npm run dev  (from /workers, uses nodemon)
 */

'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const { Worker }        = require('bullmq')
const Redis             = require('ioredis')
const { Pool }          = require('pg')
const { runSandbox }    = require('./sandbox')

// ── Environment checks ─────────────────────────────────────────────
const REDIS_URL    = process.env.REDIS_URL
const DATABASE_URL = process.env.DATABASE_URL

if (!REDIS_URL) {
  console.error('[Worker] FATAL: REDIS_URL not set in workers/.env')
  process.exit(1)
}
if (!DATABASE_URL) {
  console.error('[Worker] FATAL: DATABASE_URL not set in workers/.env')
  process.exit(1)
}

const VERDICT_CHANNEL  = 'aa:verdicts'
const CONCURRENCY      = parseInt(process.env.WORKER_CONCURRENCY, 10) || 3

// ── Redis connections ──────────────────────────────────────────────
// BullMQ requires a dedicated non-subscriber connection.
const redisTLS = REDIS_URL.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}

const workerConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,  // required by BullMQ
  enableReadyCheck:     false,
  lazyConnect:          false,
  ...redisTLS,
})

// Separate publisher connection for verdict pub/sub.
const publishConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck:     false,
  ...redisTLS,
})

// ── PostgreSQL ─────────────────────────────────────────────────────
const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

db.on('error', (err) => {
  console.error('[Worker DB] Unexpected error on idle client (auto-recovering):', err.message)
})

// ── BullMQ Worker ─────────────────────────────────────────────────
const worker = new Worker(
  'submissions',
  async (job) => {
    const {
      submissionId,
      matchId,
      roomId,
      userId,
      username,
      problemId,
      code,
      language,
    } = job.data

    const jobStart = Date.now()
    console.log(
      `[Worker] ▶ job=${job.id}  user=${username}  lang=${language}` +
      `  room=${roomId?.slice(0, 20)}  prob=${problemId?.slice(0, 8)}`
    )

    // ── 1. Fetch test cases from PostgreSQL ──────────────────────
    let testCases = []
    try {
      const { rows } = await db.query(
        `SELECT input, output, is_hidden
         FROM test_cases
         WHERE problem_id = $1
         ORDER BY is_hidden ASC, id ASC`,
        [problemId]
      )
      testCases = rows
      console.log(`[Worker] fetched ${testCases.length} test cases for problem=${problemId?.slice(0, 8)}`)
    } catch (err) {
      console.error('[Worker] Failed to fetch test cases:', err.message)
    }

    // Fallback: empty test cases (shouldn't happen in production)
    if (testCases.length === 0) {
      console.warn('[Worker] No test cases found — using stub')
      testCases = [{ input: '[]', output: 'null', is_hidden: false }]
    }

    // ── 2. Run Docker sandbox ────────────────────────────────────
    let result
    try {
      result = await runSandbox({ 
        code, 
        language, 
        testCases,
        onProgress: (tr) => {
          publishConnection.publish(VERDICT_CHANNEL, JSON.stringify({
            type: 'progress',
            roomId,
            userId,
            username,
            submissionId,
            testIndex: tr.testIndex,
            passed: tr.passed,
            totalTests: testCases.length
          })).catch(err => console.error('[Worker] progress publish err:', err.message))
        }
      })
      console.log(
        `[Worker] sandbox done  verdict=${result.verdict}` +
        `  passed=${result.passedTests}/${result.totalTests}  ms=${result.runtimeMs}`
      )
    } catch (err) {
      console.error('[Worker] Sandbox threw unexpectedly:', err.message)
      result = {
        verdict:     'RUNTIME_ERROR',
        totalTests:  testCases.length,
        passedTests: 0,
        runtimeMs:   Date.now() - jobStart,
        testResults: [],
        error:       err.message,
      }
    }

    // ── 3. Update submission row in Postgres ─────────────────────
    if (submissionId) {
      try {
        await db.query(
          `UPDATE submissions
           SET status = 'done', verdict = $1, runtime_ms = $2
           WHERE id = $3`,
          [result.verdict, result.runtimeMs, submissionId]
        )
        console.log(`[Worker] submission row updated  id=${submissionId?.slice(0, 8)}`)
      } catch (err) {
        console.error('[Worker] Failed to update submission row:', err.message)
      }
    }

    // ── 4. Publish verdict to Redis pub/sub ──────────────────────
    const payload = {
      type: 'verdict',
      roomId,
      userId,
      username,
      submissionId,
      verdict:     result.verdict,
      totalTests:  result.totalTests,
      passedTests: result.passedTests,
      testResults: result.testResults,
      runtimeMs:   result.runtimeMs,
    }

    try {
      await publishConnection.publish(VERDICT_CHANNEL, JSON.stringify(payload))
      console.log(`[Worker] ✓ published verdict to "${VERDICT_CHANNEL}"  room=${roomId?.slice(0, 20)}`)
    } catch (err) {
      console.error('[Worker] Failed to publish verdict:', err.message)
    }

    const totalMs = Date.now() - jobStart
    console.log(`[Worker] ■ job=${job.id} complete  total_ms=${totalMs}`)

    return { verdict: result.verdict, passedTests: result.passedTests }
  },
  {
    connection:  workerConnection,
    concurrency: CONCURRENCY,
  }
)

// ── Worker event listeners ─────────────────────────────────────────
worker.on('completed', (job, ret) => {
  console.log(`[Worker] completed  job=${job.id}  verdict=${ret?.verdict}`)
})

worker.on('failed', (job, err) => {
  console.error(`[Worker] FAILED  job=${job?.id}  error=${err.message}`)
})

worker.on('error', (err) => {
  // Catches connection errors — worker retries automatically
  console.error('[Worker] Worker error:', err.message)
})

workerConnection.on('connect', () => console.log('[Worker] Redis connected (worker) ✓'))
publishConnection.on('connect', () => console.log('[Worker] Redis connected (publish) ✓'))

// ── Graceful shutdown ──────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`[Worker] ${signal} received — shutting down gracefully`)
  await worker.close()
  await workerConnection.quit()
  await publishConnection.quit()
  await db.end()
  console.log('[Worker] shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

// ── Startup banner ─────────────────────────────────────────────────
console.log(`
  ┌────────────────────────────────────────────────────┐
  │  AlgoArena Submission Worker                       │
  │  Queue:        submissions                         │
  │  Concurrency:  ${String(CONCURRENCY).padEnd(3)}                              │
  │  Sandbox:      ${(process.env.SANDBOX_IMAGE || 'algoarena-sandbox').padEnd(20)}          │
  │  Timeout:      ${String(process.env.SANDBOX_TIMEOUT_MS || 5000).padEnd(6)}ms                        │
  └────────────────────────────────────────────────────┘
`)
