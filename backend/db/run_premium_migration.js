/**
 * backend/db/run_premium_migration.js
 *
 * Runs the premium up or down migration on the development database.
 * Safety rule: Always prints masked DB host before any write.
 */

'use strict'

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { pool } = require('./index')

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

async function runMigration() {
  const isDown = process.argv.includes('--down')
  const sqlFile = isDown ? 'migrate_premium_down.sql' : 'migrate_premium_up.sql'
  const sqlPath = path.join(__dirname, sqlFile)
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('            PREMIUM DATABASE MIGRATION RUNNER                  ')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`[SAFETY CHECK] Target Mode:      ${isDown ? 'DOWN (ROLLBACK)' : 'UP (APPLY)'}`)
  console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(process.env.DATABASE_URL)}`)
  console.log(`[SAFETY CHECK] Migration File:   ${sqlFile}`)
  console.log('═══════════════════════════════════════════════════════════════\n')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log(`✓ Migration ${sqlFile} applied successfully.`)

    if (!isDown) {
      // Verification check
      const { rows: tables } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('plans', 'subscriptions', 'payments', 'webhook_events', 'launch_slots')
        ORDER BY table_name;
      `)
      console.log('Created tables:', tables.map(t => t.table_name))

      const { rows: slotCount } = await client.query(`
        SELECT COUNT(*) as count, status FROM launch_slots GROUP BY status;
      `)
      console.log('Launch slots breakdown:', slotCount)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('✗ Migration failed and rolled back:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()

