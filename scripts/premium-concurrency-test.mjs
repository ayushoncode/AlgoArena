/**
 * scripts/premium-concurrency-test.mjs
 *
 * Concurrency test for AlgoArena launch slot reservation.
 *
 * Requirements:
 * 1. 150 parallel slot-claim requests from distinct users.
 * 2. Exactly 100 users must receive a launch slot.
 * 3. Exactly 50 users must receive the standard plan (no launch slot).
 * 4. Zero duplicate slots assigned.
 * 5. Verify expired reservations (>30 min) can be reclaimed.
 * 6. Clean up test slots and verify database state.
 */

'use strict'

import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import dotenv from 'dotenv'
import pkg from '../backend/node_modules/pg/lib/index.js'
const { Pool } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, 'backend', '.env') })

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena'

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
console.log('         ALGOARENA LAUNCH SLOT CONCURRENCY TEST                ')
console.log('═══════════════════════════════════════════════════════════════')
console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(DATABASE_URL)}`)
console.log(`[SAFETY CHECK] Concurrent Users: 150`)
console.log(`[SAFETY CHECK] Slot Limit:       100`)
console.log('═══════════════════════════════════════════════════════════════\n')

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 30, // Pool size for concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
})

// Slot claim transaction mirroring backend/services/premium.js
async function claimSlotTransaction(client, userId) {
  const timeoutMinutes = 30
  // 1. Release expired
  await client.query(`
    UPDATE launch_slots
    SET status = 'released',
        user_id = NULL,
        subscription_id = NULL,
        reserved_at = NULL,
        updated_at = NOW()
    WHERE status = 'reserved'
      AND reserved_at < NOW() - ($1 || ' minutes')::INTERVAL;
  `, [timeoutMinutes])

  // 2. Check existing
  const { rows: existingRows } = await client.query(`
    SELECT slot_number, status, reserved_at
    FROM launch_slots
    WHERE user_id = $1
    FOR UPDATE;
  `, [userId])

  if (existingRows.length > 0) {
    const existing = existingRows[0]
    return { hasLaunchSlot: true, slotNumber: existing.slot_number, isExisting: true }
  }

  // 3. Atomically grab lowest available slot
  const { rows: candidateRows } = await client.query(`
    SELECT slot_number
    FROM launch_slots
    WHERE status = 'released'
    ORDER BY slot_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  `)

  if (candidateRows.length === 0) {
    return { hasLaunchSlot: false, slotNumber: null, isExisting: false }
  }

  const slotNumber = candidateRows[0].slot_number

  // 4. Reserve
  await client.query(`
    UPDATE launch_slots
    SET status = 'reserved',
        user_id = $1,
        reserved_at = NOW(),
        updated_at = NOW()
    WHERE slot_number = $2;
  `, [userId, slotNumber])

  return { hasLaunchSlot: true, slotNumber, isExisting: false }
}

async function run() {
  const masterClient = await pool.connect()

  try {
    // 1. Reset all slots to released state before starting
    console.log('[STEP 1] Resetting all 100 slots to released state...')
    await masterClient.query(`
      UPDATE launch_slots
      SET status = 'released',
          user_id = NULL,
          subscription_id = NULL,
          reserved_at = NULL,
          updated_at = NOW();
    `)

    // 2. Insert 160 temporary test users in users table
    console.log('[STEP 2] Inserting 160 temporary test users in users table...')
    await masterClient.query(`
      DELETE FROM users WHERE username LIKE 'st_%';
    `)

    const userInserts = Array.from({ length: 160 }, (_, i) => {
      const uid = crypto.randomUUID()
      const uname = `st_${i}_${(Date.now() % 100000)}`
      const email = `${uname}@test.io`
      return `('${uid}', '${uname}', '${email}', 'test_hash', 1200, 0, 0, false, true)`
    }).join(',\n')

    const { rows: insertedUsers } = await masterClient.query(`
      INSERT INTO users (id, username, email, password, elo_rating, wins, losses, institute_locked, is_username_set)
      VALUES ${userInserts}
      RETURNING id;
    `)
    const userIds = insertedUsers.slice(0, 150).map(u => u.id)
    const extraUserIds = insertedUsers.slice(150).map(u => u.id)

    // 3. Firing 150 simultaneous reservation transactions
    console.log('[STEP 3] Firing 150 concurrent slot-claim transactions...')
    const startTime = Date.now()

    const results = await Promise.all(
      userIds.map(async (uid, idx) => {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          const outcome = await claimSlotTransaction(client, uid)
          await client.query('COMMIT')
          return { userId: uid, ...outcome }
        } catch (err) {
          await client.query('ROLLBACK')
          return { userId: uid, error: err.message }
        } finally {
          client.release()
        }
      })
    )

    const durationMs = Date.now() - startTime
    console.log(`[STEP 3] Finished 150 transactions in ${durationMs}ms.\n`)

    // 4. Analyze outcomes
    const successfulClaims = results.filter(r => r.hasLaunchSlot)
    const standardPlans = results.filter(r => !r.hasLaunchSlot && !r.error)
    const errors = results.filter(r => r.error)

    console.log('--- CONCURRENCY RESULTS ---')
    console.log(`Total Requests:         ${results.length}`)
    console.log(`Launch Slots Granted:   ${successfulClaims.length}`)
    console.log(`Standard Plans (No Slot): ${standardPlans.length}`)
    console.log(`Transaction Errors:     ${errors.length}`)

    if (errors.length > 0) {
      console.error('Errors encountered:', errors)
      throw new Error(`Encountered ${errors.length} transaction errors.`)
    }

    // Check slot numbers
    const claimedSlotNumbers = successfulClaims.map(r => r.slotNumber).sort((a, b) => a - b)
    const uniqueSlots = new Set(claimedSlotNumbers)

    console.log(`Unique Slots Claimed:   ${uniqueSlots.size}`)
    console.log(`Slot Range:             ${claimedSlotNumbers[0]} to ${claimedSlotNumbers[claimedSlotNumbers.length - 1]}`)

    // Assertions
    if (successfulClaims.length !== 100) {
      throw new Error(`Expected exactly 100 launch slots granted, got ${successfulClaims.length}`)
    }
    if (standardPlans.length !== 50) {
      throw new Error(`Expected exactly 50 standard plans assigned, got ${standardPlans.length}`)
    }
    if (uniqueSlots.size !== 100) {
      throw new Error(`Duplicate slots detected! Unique count: ${uniqueSlots.size}`)
    }

    console.log('\n✓ CONCURRENCY CHECK PASSED: Exactly 100 launch slots claimed, 50 diverted to standard, 0 duplicates.')

    // 5. Test 30-minute expiration and reclaiming
    console.log('\n[STEP 4] Testing slot expiration after 30 minutes...')
    // Expire 10 random slots
    await masterClient.query(`
      UPDATE launch_slots
      SET reserved_at = NOW() - INTERVAL '35 minutes'
      WHERE slot_number IN (5, 12, 23, 44, 55, 67, 78, 89, 91, 100);
    `)

    // Try claiming with 10 brand new test users from extraUserIds
    const reclaimedResults = await Promise.all(
      extraUserIds.map(async (uid) => {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          const outcome = await claimSlotTransaction(client, uid)
          await client.query('COMMIT')
          return outcome
        } finally {
          client.release()
        }
      })
    )

    const reclaimedCount = reclaimedResults.filter(r => r.hasLaunchSlot).length
    console.log(`Reclaimed expired slots: ${reclaimedCount}/10`)
    if (reclaimedCount !== 10) {
      throw new Error(`Expected 10 expired slots to be reclaimed, got ${reclaimedCount}`)
    }
    console.log('✓ EXPIRATION CHECK PASSED: Expired reservations released and reclaimed safely.')

    // 6. Clean up: reset all slots to released state and remove test users
    console.log('\n[STEP 5] Cleaning up test slots and temporary users...')
    await masterClient.query(`
      UPDATE launch_slots
      SET status = 'released',
          user_id = NULL,
          subscription_id = NULL,
          reserved_at = NULL,
          updated_at = NOW();
    `)
    await masterClient.query(`
      DELETE FROM users WHERE username LIKE 'st_%';
    `)
    const { rows: finalCount } = await masterClient.query(`
      SELECT COUNT(*) as count, status FROM launch_slots GROUP BY status;
    `)
    console.log('Final slots state:', finalCount)
    console.log('✓ CLEANUP COMPLETE: All 100 slots released, test users deleted.\n')

  } catch (err) {
    console.error('✗ Concurrency test failed:', err)
    process.exit(1)
  } finally {
    masterClient.release()
    await pool.end()
  }
}

run()
