/**
 * db/index.js — PostgreSQL connection pool
 *
 * Uses the `pg` library's Pool, which manages a pool of client connections.
 * All queries in the app go through this single pool instance.
 *
 * Day 5: DATABASE_URL will be set to the Supabase connection string.
 * Until then, the pool is created lazily and queries will fail gracefully.
 */

const { Pool } = require('pg')

// Don't crash on startup if DATABASE_URL isn't configured yet (before Day 5)
const DATABASE_URL = process.env.DATABASE_URL

let pool = null

if (DATABASE_URL && !DATABASE_URL.includes('<password>')) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Force SSL for Supabase / production to prevent socket hangup & timeout issues
    ssl: DATABASE_URL.includes('supabase.com') || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

  // CRITICAL: Handle error on idle clients so unexpected connection drops don't crash Node process
  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client (auto-recovering):', err.message)
  })

  // Verify connectivity on startup
  pool.connect((err, client, release) => {
    if (err) {
      console.error('[DB] Connection error:', err.message)
    } else {
      console.log('[DB] PostgreSQL connected ✓')
      release()
    }
  })
} else {
  console.warn('[DB] DATABASE_URL not set or still placeholder — skipping DB connection (configure in Day 5)')
}

/**
 * query(text, params) — thin wrapper around pool.query
 * Throws a clear error if the pool isn't ready yet.
 */
async function query(text, params) {
  if (!pool) {
    throw new Error('Database not configured — set DATABASE_URL in .env (Day 5)')
  }
  const start = Date.now()
  const result = await pool.query(text, params)
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB]', { query: text.slice(0, 80), ms: Date.now() - start, rows: result.rowCount })
  }
  return result
}

module.exports = { query, pool }
