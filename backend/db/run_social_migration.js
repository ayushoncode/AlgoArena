/**
 * backend/db/run_social_migration.js
 * Runner to apply additive migration for Friends & Notification Centre
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const db = require('./index');

function maskHost(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '*******st (localhost)';
    return host.replace(/.(?=.{3})/g, '*');
  } catch {
    return '*******st (local)';
  }
}

async function run() {
  const isDown = process.argv.includes('--down');
  const sqlFile = isDown ? 'migrate_social_down.sql' : 'migrate_social_up.sql';
  const sqlPath = path.join(__dirname, sqlFile);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`[SAFETY CHECK] Running Social Migration: ${sqlFile}`);
  console.log(`[SAFETY CHECK] Masked Dev DB Host:     ${maskHost(process.env.DATABASE_URL)}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    await db.query(sql);
    console.log(`✓ Successfully executed ${sqlFile} on dev database.`);
    process.exit(0);
  } catch (err) {
    console.error(`✗ Migration error:`, err);
    process.exit(1);
  }
}

run();
