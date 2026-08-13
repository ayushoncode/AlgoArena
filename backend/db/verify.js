/**
 * db/verify.js — quick connectivity + schema check
 *
 * Run after setting DATABASE_URL in .env:
 *   node db/verify.js
 *
 * Prints a table of all public tables and their row counts.
 */

'use strict'
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { Pool } = require('pg')

async function main() {
  console.log('\n[AlgoArena] Verifying database connection...\n')

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('<password>')) {
    console.error('✕  DATABASE_URL is not set or still a placeholder.')
    console.error('   Update backend/.env with your Supabase connection string.\n')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })

  try {
    const client = await pool.connect()
    console.log('✓  Connected to PostgreSQL\n')

    // Check which tables exist
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    const expected = ['elo_history', 'matches', 'problems', 'submissions', 'test_cases', 'users']
    console.log('  Tables found:')

    for (const name of expected) {
      const found = tables.some(t => t.table_name === name)
      if (found) {
        const { rows } = await client.query(`SELECT COUNT(*) FROM ${name}`)
        console.log(`  ✓  ${name.padEnd(15)} (${rows[0].count} rows)`)
      } else {
        console.log(`  ✕  ${name.padEnd(15)} ← MISSING — run db/schema.sql in Supabase SQL Editor`)
      }
    }

    const missing = expected.filter(n => !tables.some(t => t.table_name === n))
    console.log(missing.length === 0
      ? '\n✓  All 6 tables present. Database ready for Day 6.\n'
      : `\n✕  ${missing.length} table(s) missing — paste schema.sql into Supabase SQL Editor and run it.\n`
    )

    client.release()
  } catch (err) {
    console.error('✕  Connection failed:', err.message)
    console.error('\n   Common causes:')
    console.error('   • Wrong DATABASE_URL (check Supabase Settings → Database → URI)')
    console.error('   • Supabase project paused (wake it up in the dashboard)')
    console.error('   • VPN / firewall blocking outbound port 5432\n')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
