/**
 * scripts/premium-reconcile.mjs
 *
 * Reconciliation script (read-only by default) comparing local subscription
 * state in PostgreSQL with Razorpay Subscriptions API.
 *
 * Usage:
 *   node scripts/premium-reconcile.mjs           # Read-only audit
 *   node scripts/premium-reconcile.mjs --fix     # Apply sync if approved
 */

'use strict'

import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import pkg from '../backend/node_modules/pg/lib/index.js'
const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, 'backend', '.env') })

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena'
const KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const isFixMode = process.argv.includes('--fix')

function maskHost(urlStr) {
  try {
    const u = new URL(urlStr)
    const host = u.hostname
    if (host === 'localhost' || host === '127.0.0.1') return '*******st (localhost)'
    return host.replace(/.(?=.{3})/g, '*')
  } catch {
    return '*******st (local)'
  }
}

function maskId(id) {
  if (!id || typeof id !== 'string') return '***'
  if (id.length <= 6) return '***'
  return id.slice(0, 4) + '***' + id.slice(-4)
}

console.log('═══════════════════════════════════════════════════════════════')
console.log('       ALGOARENA PREMIUM RECONCILIATION AUDIT                  ')
console.log('═══════════════════════════════════════════════════════════════')
console.log(`[SAFETY CHECK] Mode:            ${isFixMode ? 'APPLY FIXES (--fix)' : 'READ-ONLY AUDIT (default)'}`)
console.log(`[SAFETY CHECK] Masked DB Host:  ${maskHost(DATABASE_URL)}`)
console.log(`[SAFETY CHECK] Razorpay Key:    ${maskId(KEY_ID)}`)
console.log('═══════════════════════════════════════════════════════════════\n')

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

async function fetchRazorpaySubscription(subId) {
  if (!KEY_ID || KEY_ID.includes('placeholder') || subId.startsWith('sub_mock_')) {
    return {
      id: subId,
      status: 'active',
      plan_id: 'plan_launch_test',
      current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      cancel_at_cycle_end: 0
    }
  }

  const auth = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
  const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subId)}`, {
    headers: { Authorization: auth }
  })

  if (!res.ok) {
    throw new Error(`Razorpay API HTTP ${res.status}`)
  }
  return res.json()
}

async function run() {
  const client = await pool.connect()

  try {
    const { rows: localSubs } = await client.query(`
      SELECT 
        s.id,
        s.user_id,
        s.razorpay_subscription_id,
        s.razorpay_plan_id,
        s.status,
        s.current_period_end,
        s.cancel_at_period_end,
        s.launch_slot,
        u.username,
        u.email
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC;
    `)

    console.log(`Found ${localSubs.length} local subscription records in database.\n`)

    if (localSubs.length === 0) {
      console.log('No subscriptions found. Nothing to reconcile.')
      return
    }

    let matched = 0
    let mismatched = 0
    let errors = 0

    for (const sub of localSubs) {
      const subId = sub.razorpay_subscription_id
      try {
        const rzpSub = await fetchRazorpaySubscription(subId)
        const statusMatches = sub.status === rzpSub.status
        const cancelMatches = Boolean(sub.cancel_at_period_end) === Boolean(rzpSub.cancel_at_cycle_end)

        if (statusMatches && cancelMatches) {
          matched++
          console.log(`[MATCH] ${maskId(subId)} | User: ${sub.username.padEnd(16)} | Status: ${sub.status}`)
        } else {
          mismatched++
          console.warn(`[MISMATCH] ${maskId(subId)} | User: ${sub.username}`)
          console.warn(`  Local:    status=${sub.status}, cancelAtEnd=${sub.cancel_at_period_end}`)
          console.warn(`  Razorpay: status=${rzpSub.status}, cancelAtEnd=${Boolean(rzpSub.cancel_at_cycle_end)}`)

          if (isFixMode) {
            await client.query(`
              UPDATE subscriptions
              SET status = $1,
                  cancel_at_period_end = $2,
                  updated_at = NOW()
              WHERE id = $3;
            `, [rzpSub.status, Boolean(rzpSub.cancel_at_cycle_end), sub.id])
            console.log(`  -> Synced local record with Razorpay state.`)
          }
        }
      } catch (err) {
        errors++
        console.error(`[ERROR] ${maskId(subId)} | User: ${sub.username} | ${err.message}`)
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('               RECONCILIATION AUDIT SUMMARY                    ')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`Total Checked: ${localSubs.length}`)
    console.log(`Matched:       ${matched}`)
    console.log(`Mismatched:    ${mismatched}`)
    console.log(`Errors:        ${errors}`)
    console.log('═══════════════════════════════════════════════════════════════\n')

  } finally {
    client.release()
    await pool.end()
  }
}

run()

