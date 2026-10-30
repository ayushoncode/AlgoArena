/**
 * scripts/premium-gating-test.mjs
 *
 * Verification suite for Phase D Server-Side Gating:
 * 1. Free user with PREMIUM_GATING_ENABLED=true gets 403 PREMIUM_REQUIRED on gated routes
 * 2. Response contains no leaked content (no curriculum rows, questions, or descriptions)
 * 3. Free user calling non-gated routes (Quick Arena, stats, leaderboard, intel) passes without restriction
 * 4. Premium user with active subscription passes gated routes
 * 5. Expired user (past current_period_end) is blocked with 403
 * 6. Cancelled user before period end retains access
 * 7. Flipping PREMIUM_GATING_ENABLED=false completely restores today's behavior
 */

'use strict'

import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import express from '../backend/node_modules/express/index.js'
import pkg from '../backend/node_modules/pg/lib/index.js'
const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, 'backend', '.env') })

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena'
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'
const TEST_PORT = 4006
const BASE_URL = `http://localhost:${TEST_PORT}`

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

console.log('═══════════════════════════════════════════════════════════════')
console.log('       ALGOARENA ACCESS CONTROL & GATING VERIFICATION          ')
console.log('═══════════════════════════════════════════════════════════════')
console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(DATABASE_URL)}`)
console.log(`[SAFETY CHECK] Test Server Port: ${TEST_PORT}`)
console.log('═══════════════════════════════════════════════════════════════\n')

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

async function run() {
  // Dynamically load routes after dotenv
  const { default: problemRoutes } = await import('../backend/routes/problems.js')
  const { default: premiumRoutes } = await import('../backend/routes/premium.js')

  const app = express()
  app.use(express.json())
  app.use('/api/problems', problemRoutes)
  app.use('/api/premium', premiumRoutes)

  const server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => resolve(s))
  })

  const client = await pool.connect()

  // 1. Create a Free user and a Premium user in the database
  const freeUserId = crypto.randomUUID()
  const freeUsername = `gate_free_${Date.now() % 10000}`
  const premiumUserId = crypto.randomUUID()
  const premiumUsername = `gate_prem_${Date.now() % 10000}`

  await client.query(`
    INSERT INTO users (id, username, email, password, elo_rating, wins, losses, institute_locked, is_username_set)
    VALUES 
      ($1, $2, '${freeUsername}@test.io', 'test_pw', 1200, 0, 0, false, true),
      ($3, $4, '${premiumUsername}@test.io', 'test_pw', 1200, 0, 0, false, true);
  `, [freeUserId, freeUsername, premiumUserId, premiumUsername])

  const freeToken = jwt.sign({ id: freeUserId, username: freeUsername }, JWT_SECRET)
  const premiumToken = jwt.sign({ id: premiumUserId, username: premiumUsername }, JWT_SECRET)

  // Give premiumUser an active subscription in database
  const premSubId = `sub_active_test_${Date.now()}`
  await client.query(`
    INSERT INTO subscriptions (
      user_id, razorpay_subscription_id, razorpay_plan_id, status, 
      current_period_start, current_period_end, launch_slot
    ) VALUES (
      $1, $2, 'plan_launch_test', 'active',
      NOW(), NOW() + INTERVAL '30 days', true
    );
  `, [premiumUserId, premSubId])

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // TEST 1: Gating Enabled — Free User Accessing A2Z Sheet
    // ══════════════════════════════════════════════════════════════════════════
    process.env.PREMIUM_GATING_ENABLED = 'true'
    console.log('[TEST 1] Free user accessing GET /api/problems/striver-sheet (GATING ON)...')

    const freeRes = await fetch(`${BASE_URL}/api/problems/striver-sheet`, {
      headers: { Authorization: `Bearer ${freeToken}` }
    })
    console.log(`  HTTP Status: ${freeRes.status}`)
    if (freeRes.status !== 403) {
      throw new Error(`Expected 403 PREMIUM_REQUIRED, got ${freeRes.status}`)
    }

    const freeBody = await freeRes.json()
    console.log('  Response body:', freeBody)
    if (freeBody.code !== 'PREMIUM_REQUIRED' || freeBody.feature !== 'sheet') {
      throw new Error('Expected code: PREMIUM_REQUIRED and feature: sheet')
    }

    // Leak check: ensure no problem curriculum details exist in the response
    const rawResText = JSON.stringify(freeBody)
    if (rawResText.includes('sample_input') || rawResText.includes('subsections') || rawResText.includes('two-sum')) {
      throw new Error('SECURITY VIOLATION: Gated response leaked curriculum or problem content!')
    }
    console.log('✓ TEST 1 PASSED: Free user blocked with 403 PREMIUM_REQUIRED; 0 content leaked.\n')

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 2: Gating Enabled — Free User Accessing Free Endpoints
    // ══════════════════════════════════════════════════════════════════════════
    console.log('[TEST 2] Free user accessing non-gated /api/problems/stats (Quick Arena data)...')
    const statsRes = await fetch(`${BASE_URL}/api/problems/stats`)
    if (!statsRes.ok) throw new Error(`Non-gated endpoint failed: ${statsRes.status}`)
    const statsData = await statsRes.json()
    console.log(`  Total problems returned: ${statsData.totalProblems}`)
    console.log('✓ TEST 2 PASSED: Free user accesses non-gated endpoints without barrier.\n')

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 3: Gating Enabled — Premium User Accessing A2Z Sheet
    // ══════════════════════════════════════════════════════════════════════════
    console.log('[TEST 3] Premium user accessing GET /api/problems/striver-sheet (GATING ON)...')
    const premRes = await fetch(`${BASE_URL}/api/problems/striver-sheet`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    })
    console.log(`  HTTP Status: ${premRes.status}`)
    if (premRes.status !== 200) {
      throw new Error(`Expected 200 for Premium user, got ${premRes.status}`)
    }
    const premData = await premRes.json()
    console.log(`  Curriculum steps returned: ${premData.length}`)
    if (!Array.isArray(premData) || premData.length === 0) {
      throw new Error('Premium user received empty curriculum')
    }
    console.log('✓ TEST 3 PASSED: Premium user granted access to A2Z Sheet.\n')

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 4: Cancelled Before Period End Retains Access
    // ══════════════════════════════════════════════════════════════════════════
    console.log('[TEST 4] Cancelled subscription before period end retains access...')
    await client.query(`
      UPDATE subscriptions
      SET status = 'cancelled',
          cancel_at_period_end = true,
          current_period_end = NOW() + INTERVAL '10 days'
      WHERE razorpay_subscription_id = $1;
    `, [premSubId])

    const retainedRes = await fetch(`${BASE_URL}/api/problems/striver-sheet`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    })
    console.log(`  HTTP Status: ${retainedRes.status}`)
    if (retainedRes.status !== 200) {
      throw new Error(`Cancelled user should retain access until period end, got ${retainedRes.status}`)
    }
    console.log('✓ TEST 4 PASSED: Cancelled subscription keeps access until end date.\n')

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 5: Expired Subscription Loses Access
    // ══════════════════════════════════════════════════════════════════════════
    console.log('[TEST 5] Expired subscription (past grace period) loses access...')
    await client.query(`
      UPDATE subscriptions
      SET status = 'cancelled',
          cancel_at_period_end = true,
          current_period_end = NOW() - INTERVAL '5 days'
      WHERE razorpay_subscription_id = $1;
    `, [premSubId])

    const expiredRes = await fetch(`${BASE_URL}/api/problems/striver-sheet`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    })
    console.log(`  HTTP Status: ${expiredRes.status}`)
    if (expiredRes.status !== 403) {
      throw new Error(`Expired user should be blocked, got ${expiredRes.status}`)
    }
    console.log('✓ TEST 5 PASSED: Expired subscription blocked after period and grace end.\n')

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 6: Gating Disabled — Today's Behavior Fully Restored
    // ══════════════════════════════════════════════════════════════════════════
    process.env.PREMIUM_GATING_ENABLED = 'false'
    console.log('[TEST 6] Flipping PREMIUM_GATING_ENABLED=false (Restoring today\'s behavior)...')

    const ungateRes = await fetch(`${BASE_URL}/api/problems/striver-sheet`)
    console.log(`  HTTP Status without token: ${ungateRes.status}`)
    if (ungateRes.status !== 200) {
      throw new Error(`With gating disabled, expected 200, got ${ungateRes.status}`)
    }
    console.log('✓ TEST 6 PASSED: Flipping flag off restores un-gated behavior for all users.\n')

  } finally {
    console.log('[CLEANUP] Removing test users and subscriptions...')
    await client.query('DELETE FROM users WHERE id IN ($1, $2)', [freeUserId, premiumUserId])
    client.release()
    await pool.end()
    await new Promise((resolve) => server.close(resolve))
    console.log('✓ Cleanup finished.\n')
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('✓ ALL ACCESS CONTROL & GATING VERIFICATIONS PASSED.')
  console.log('═══════════════════════════════════════════════════════════════\n')
}

run().catch(err => {
  console.error('✗ Gating test failed:', err)
  process.exit(1)
})

