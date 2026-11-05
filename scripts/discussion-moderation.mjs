/**
 * scripts/discussion-moderation.mjs
 *
 * Operational moderation script for AlgoArena Discussion Rooms:
 * - list: List pending discussion reports (reporter, post kind, post title/preview, category, note)
 * - hide <thread|reply> <id>: Hide a reported post pending review
 * - restore <thread|reply> <id>: Restore a hidden post to visible
 * - delete-thread <threadId>: Delete a thread
 * - suspend <userId> <days> <reason>: Suspend a user's discussion rights with end date
 * - lift <userId>: Lift an active discussion suspension
 * - status <userId>: Inspect user suspension, blocks, and reports
 *
 * Safety: Always prints masked DB host before any write.
 * Usage:
 *   node scripts/discussion-moderation.mjs list
 *   node scripts/discussion-moderation.mjs hide <thread|reply> <id>
 *   node scripts/discussion-moderation.mjs restore <thread|reply> <id>
 *   node scripts/discussion-moderation.mjs delete-thread <threadId>
 *   node scripts/discussion-moderation.mjs suspend <userId> <days> <reason>
 *   node scripts/discussion-moderation.mjs lift <userId>
 *   node scripts/discussion-moderation.mjs status <userId>
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });
const db = require('../backend/db');

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

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('          ALGOARENA DISCUSSION MODERATION CLI                  ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`[SAFETY CHECK] Dev Backend DB: ${maskHost(process.env.DATABASE_URL)}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    if (command === 'list' || command === 'list-reports') {
      const { rows } = await db.query(`
        SELECT
          r.id,
          r.post_kind,
          r.post_id,
          r.category,
          r.note,
          r.status,
          r.created_at,
          u.username as reporter_username,
          r.reporter_id,
          CASE
            WHEN r.post_kind = 'thread' THEN (SELECT title FROM discussion_threads WHERE id = r.post_id)
            ELSE (SELECT SUBSTRING(body, 1, 80) FROM discussion_replies WHERE id = r.post_id)
          END as post_preview,
          CASE
            WHEN r.post_kind = 'thread' THEN (SELECT status FROM discussion_threads WHERE id = r.post_id)
            ELSE (SELECT status FROM discussion_replies WHERE id = r.post_id)
          END as post_status
        FROM discussion_reports r
        LEFT JOIN users u ON u.id = r.reporter_id
        ORDER BY r.created_at DESC
        LIMIT 50;
      `);

      console.log(`Found ${rows.length} reports:\n`);
      if (rows.length === 0) {
        console.log('  No reports recorded.');
      } else {
        for (const r of rows) {
          console.log(`  [Report #${r.id}]`);
          console.log(`    Date:        ${new Date(r.created_at).toISOString()}`);
          console.log(`    Kind:        ${r.post_kind} (ID: ${r.post_id})`);
          console.log(`    Post Status: ${r.post_status || 'not found'}`);
          console.log(`    Preview:     ${r.post_preview || '(none)'}`);
          console.log(`    Category:    ${r.category}`);
          console.log(`    Note:        ${r.note || '(none)'}`);
          console.log(`    Reporter:    ${r.reporter_username} (${r.reporter_id})`);
          console.log(`    Report St:   ${r.status}`);
          console.log('');
        }
      }
    } else if (command === 'hide') {
      const kind = args[1];
      const id = args[2];
      if (!['thread', 'reply'].includes(kind) || !id) {
        console.error('Usage: node scripts/discussion-moderation.mjs hide <thread|reply> <id>');
        process.exit(1);
      }
      const table = kind === 'thread' ? 'discussion_threads' : 'discussion_replies';
      const { rowCount } = await db.query(`UPDATE ${table} SET status = 'hidden' WHERE id = $1;`, [id]);
      console.log(`✓ Post ${kind} #${id} marked as 'hidden' (affected ${rowCount} row).`);

    } else if (command === 'restore') {
      const kind = args[1];
      const id = args[2];
      if (!['thread', 'reply'].includes(kind) || !id) {
        console.error('Usage: node scripts/discussion-moderation.mjs restore <thread|reply> <id>');
        process.exit(1);
      }
      const table = kind === 'thread' ? 'discussion_threads' : 'discussion_replies';
      const { rowCount } = await db.query(`UPDATE ${table} SET status = 'visible' WHERE id = $1;`, [id]);
      console.log(`✓ Post ${kind} #${id} restored to 'visible' (affected ${rowCount} row).`);

    } else if (command === 'delete-thread') {
      const threadId = args[1];
      if (!threadId) {
        console.error('Usage: node scripts/discussion-moderation.mjs delete-thread <threadId>');
        process.exit(1);
      }
      const { rowCount } = await db.query(`UPDATE discussion_threads SET status = 'deleted' WHERE id = $1;`, [threadId]);
      console.log(`✓ Thread #${threadId} marked as 'deleted' (affected ${rowCount} row).`);

    } else if (command === 'suspend') {
      const userId = args[1];
      const days = parseInt(args[2], 10) || 7;
      const reason = args.slice(3).join(' ') || 'Community policy violation';

      if (!userId) {
        console.error('Usage: node scripts/discussion-moderation.mjs suspend <userId> <days> <reason>');
        process.exit(1);
      }

      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const { rows } = await db.query(`
        INSERT INTO discussion_suspensions (user_id, reason, suspended_until, created_by)
        VALUES ($1, $2, $3, 'cli-owner')
        RETURNING id, user_id, reason, suspended_until;
      `, [userId, reason, until]);

      console.log(`✓ Suspended user ${userId} until ${rows[0].suspended_until.toISOString()}`);
      console.log(`  Reason: ${reason}`);

    } else if (command === 'lift') {
      const userId = args[1];
      if (!userId) {
        console.error('Usage: node scripts/discussion-moderation.mjs lift <userId>');
        process.exit(1);
      }
      const { rowCount } = await db.query(`
        DELETE FROM discussion_suspensions WHERE user_id = $1;
      `, [userId]);
      console.log(`✓ Lifted discussion suspensions for user ${userId} (removed ${rowCount} record(s)).`);

    } else if (command === 'status') {
      const userId = args[1];
      if (!userId) {
        console.error('Usage: node scripts/discussion-moderation.mjs status <userId>');
        process.exit(1);
      }
      const { rows: suspensions } = await db.query(`
        SELECT reason, suspended_until, created_at FROM discussion_suspensions
        WHERE user_id = $1 AND suspended_until > NOW()
        ORDER BY suspended_until DESC;
      `, [userId]);

      const { rows: reports } = await db.query(`
        SELECT count(*) as count FROM discussion_reports WHERE reporter_id = $1;
      `, [userId]);

      const { rows: blocks } = await db.query(`
        SELECT count(*) as count FROM discussion_blocks WHERE blocker_id = $1;
      `, [userId]);

      console.log(`Status for User ${userId}:`);
      console.log(`  Active Suspensions: ${suspensions.length}`);
      for (const s of suspensions) {
        console.log(`    - Until:  ${s.suspended_until.toISOString()}`);
        console.log(`      Reason: ${s.reason}`);
      }
      console.log(`  Reports Filed:      ${reports[0].count}`);
      console.log(`  Users Blocked:      ${blocks[0].count}`);

    } else {
      console.log(`Unknown command: ${command}`);
      console.log('Available commands: list, hide, restore, delete-thread, suspend, lift, status');
    }
  } catch (err) {
    console.error('Moderation error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main().catch(console.error);

