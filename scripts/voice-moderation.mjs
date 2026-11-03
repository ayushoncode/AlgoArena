/**
 * scripts/voice-moderation.mjs
 *
 * Operational moderation script for AlgoArena Live Voice:
 * - list: List pending voice reports with reporter, reported player, match ID, category, notes
 * - suspend <userId> <days> <reason>: Suspend a user's voice access for a specified duration
 * - lift <userId>: Lift an active voice suspension
 * - status <userId>: Inspect a user's active suspensions, blocks, and reports
 *
 * Safety: Dev/test only, prints masked DB host before any write.
 * Usage:
 *   node scripts/voice-moderation.mjs list
 *   node scripts/voice-moderation.mjs suspend <userId> <days> <reason>
 *   node scripts/voice-moderation.mjs lift <userId>
 *   node scripts/voice-moderation.mjs status <userId>
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables before importing db pool
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });
const db = require('../backend/db');

function maskHost(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host.length <= 8) return '***';
    return host.slice(0, 3) + '*'.repeat(host.length - 7) + host.slice(-4);
  } catch {
    return '***';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  console.log('═'.repeat(60));
  console.log('       ALGOARENA VOICE MODERATION CLI');
  console.log('═'.repeat(60));
  console.log(`[SAFETY CHECK] Dev Backend Database: ${maskHost(process.env.DATABASE_URL)}`);
  console.log('═'.repeat(60));

  try {
    if (command === 'list') {
      const { rows } = await db.query(`
        SELECT 
          r.id,
          r.match_id,
          r.category,
          r.note,
          r.status,
          r.created_at,
          u1.username AS reporter_username,
          r.reporter_id,
          u2.username AS reported_username,
          r.reported_id
        FROM voice_reports r
        LEFT JOIN users u1 ON u1.id = r.reporter_id
        LEFT JOIN users u2 ON u2.id = r.reported_id
        ORDER BY r.created_at DESC
        LIMIT 50;
      `);

      console.log(`Found ${rows.length} voice reports:\n`);
      if (rows.length === 0) {
        console.log('  No voice reports recorded.');
      } else {
        for (const row of rows) {
          console.log(`  [Report #${row.id}]`);
          console.log(`    Date:      ${new Date(row.created_at).toISOString()}`);
          console.log(`    Match ID:  ${row.match_id}`);
          console.log(`    Reporter:  ${row.reporter_username || row.reporter_id}`);
          console.log(`    Reported:  ${row.reported_username || row.reported_id}`);
          console.log(`    Category:  ${row.category}`);
          console.log(`    Notes:     ${row.note || '(none)'}`);
          console.log(`    Status:    ${row.status}`);
          console.log('');
        }
      }
    } else if (command === 'suspend') {
      const userId = args[1];
      const days = parseInt(args[2], 10) || 7;
      const reason = args.slice(3).join(' ') || 'Voice safety policy violation';

      if (!userId) {
        console.error('Usage: node scripts/voice-moderation.mjs suspend <userId> <days> <reason>');
        process.exit(1);
      }

      console.log(`Suspending user ${userId} for ${days} days...`);
      console.log(`Reason: "${reason}"`);

      await db.query(`
        INSERT INTO voice_suspensions (user_id, reason, suspended_until, created_by, created_at)
        VALUES ($1, $2, NOW() + INTERVAL '${days} days', 'moderation_cli', NOW())
      `, [userId, reason]);

      console.log(`✓ User ${userId} voice access suspended until ${days} days from now.`);
    } else if (command === 'lift') {
      const userId = args[1];
      if (!userId) {
        console.error('Usage: node scripts/voice-moderation.mjs lift <userId>');
        process.exit(1);
      }

      console.log(`Lifting voice suspension for user ${userId}...`);
      const { rowCount } = await db.query(`
        DELETE FROM voice_suspensions
        WHERE user_id = $1;
      `, [userId]);

      if (rowCount > 0) {
        console.log(`✓ Voice suspension lifted for user ${userId}.`);
      } else {
        console.log(`  No active voice suspension found for user ${userId}.`);
      }
    } else if (command === 'status') {
      const userId = args[1];
      if (!userId) {
        console.error('Usage: node scripts/voice-moderation.mjs status <userId>');
        process.exit(1);
      }

      const { rows: susp } = await db.query(`
        SELECT * FROM voice_suspensions WHERE user_id = $1 AND suspended_until > NOW();
      `, [userId]);

      const { rows: blocks } = await db.query(`
        SELECT * FROM voice_blocks WHERE blocker_id = $1 OR blocked_id = $1;
      `, [userId]);

      const { rows: reports } = await db.query(`
        SELECT * FROM voice_reports WHERE reported_id = $1;
      `, [userId]);

      console.log(`Voice status for user: ${userId}`);
      console.log(`  Active suspension: ${susp.length > 0 ? `YES (Expires: ${new Date(susp[0].suspended_until).toISOString()}, Reason: ${susp[0].reason})` : 'NO'}`);
      console.log(`  Block records:     ${blocks.length}`);
      console.log(`  Reports received:  ${reports.length}`);
    } else {
      console.log('Available commands:');
      console.log('  node scripts/voice-moderation.mjs list');
      console.log('  node scripts/voice-moderation.mjs suspend <userId> <days> <reason>');
      console.log('  node scripts/voice-moderation.mjs lift <userId>');
      console.log('  node scripts/voice-moderation.mjs status <userId>');
    }
  } catch (err) {
    console.error('Error executing moderation command:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
