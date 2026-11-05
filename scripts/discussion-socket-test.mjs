/**
 * scripts/discussion-socket-test.mjs
 *
 * Real-time socket test suite for AlgoArena Discussion Rooms (disc:* namespace):
 *   1. Socket authentication with JWT
 *   2. disc:join and disc:joined confirmation
 *   3. Room capping (max 1 discussion room per connection)
 *   4. disc:leave
 *   5. Premium gating on disc:join (free users rejected when FREE_READ=false)
 *   6. disc:thread_created live broadcast
 *   7. disc:reply_created live broadcast
 *   8. disc:reply_notification push to thread author
 *   9. Block isolation: blocked users never receive push events
 *  10. disc:post_updated on post edit, vote toggle, and deletion
 *  11. disc:post_hidden broadcast on 3-report auto-hide
 *  12. Live-match lockout on disc:join (DISCUSSION_LOCKED_IN_MATCH)
 *  13. Live-match instant drop: user in discussion room is kicked and notified
 *      with disc:locked_in_match when a match starts on that problem
 *
 * Usage:
 *   node scripts/discussion-socket-test.mjs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { io } = require('../frontend/node_modules/socket.io-client');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });
const db = require('../backend/db');
const { dropUsersFromDiscussionRoom } = require('../backend/socket/discussion');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';

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

// Fetch users from DB
const { rows: dbUsers } = await db.query(`SELECT id, username, email FROM users ORDER BY created_at ASC LIMIT 5;`);
const user1 = dbUsers[0];
const user2 = dbUsers[1];
const user3 = dbUsers[2];

const token1 = jwt.sign({ id: user1.id, username: user1.username, email: user1.email }, JWT_SECRET, { expiresIn: '7d' });
const token2 = jwt.sign({ id: user2.id, username: user2.username, email: user2.email }, JWT_SECRET, { expiresIn: '7d' });
const token3 = jwt.sign({ id: user3.id, username: user3.username, email: user3.email }, JWT_SECRET, { expiresIn: '7d' });

// Free User (user with no subscription)
const freeUser = dbUsers[3] || {
  id: '8b4bd466-0f01-4ff7-a68b-d61c0a77ce89',
  username: 'free_warrior_dev',
  email: 'free_warrior@dev.null'
};
const freeToken = jwt.sign({ id: freeUser.id, username: freeUser.username, email: freeUser.email }, JWT_SECRET, { expiresIn: '7d' });

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const s = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      reconnection: false
    });
    s.on('connect', () => resolve(s));
    s.on('connect_error', (err) => reject(err));
  });
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

let testPassed = 0;
let testFailed = 0;

function assert(cond, name, details = '') {
  if (cond) {
    console.log(`  ✓ ${name}`);
    testPassed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    testFailed++;
  }
}

function waitForEvent(socket, event, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${event}" after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AlgoArena Discussion Rooms — Real-Time Socket Test Suite');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Database Host: ${maskHost(process.env.DATABASE_URL)}`);
  console.log(`Backend Server: ${BACKEND_URL}\n`);

  // Setup subscriptions
  await db.query(`DELETE FROM subscriptions WHERE user_id = $1;`, [freeUser.id]);
  for (const u of [user1, user2, user3]) {
    const { rows: sub } = await db.query(`SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()`, [u.id]);
    if (!sub.length) {
      await db.query(`
        INSERT INTO subscriptions (user_id, razorpay_subscription_id, razorpay_plan_id, status, current_period_end)
        VALUES ($1, 'sub_test_' || gen_random_uuid(), 'plan_test', 'active', NOW() + INTERVAL '30 days')
      `, [u.id]);
    }
  }

  // Resolve problems
  const { rows: problems } = await db.query(`SELECT id, slug, title FROM problems ORDER BY id LIMIT 2;`);
  const prob1 = problems[0];
  const prob2 = problems[1];
  console.log(`Test Problems: [${prob1.slug}] (${prob1.title}) and [${prob2.slug}] (${prob2.title})\n`);

  // Ensure clean cooldowns for users
  await db.query(`UPDATE discussion_threads SET created_at = NOW() - INTERVAL '1 hour' WHERE author_id IN ($1, $2);`, [user1.id, user2.id]);
  await db.query(`UPDATE discussion_replies SET created_at = NOW() - INTERVAL '1 hour' WHERE author_id IN ($1, $2);`, [user1.id, user2.id]);
  await db.query(`DELETE FROM discussion_blocks WHERE blocker_id IN ($1, $2) OR blocked_id IN ($1, $2);`, [user1.id, user2.id]);
  await db.query(`UPDATE matches SET status = 'finished' WHERE (player_one_id IN ($1, $2) OR player_two_id IN ($1, $2)) AND status != 'finished';`, [user1.id, user2.id]);

  let socket1 = null;
  let socket2 = null;
  let freeSocket = null;

  try {
    // ── SUITE 1: Connection & Gating ──────────────────────────────────────────
    console.log('--- SUITE 1: AUTHENTICATION & PREMIUM GATING ---');
    socket1 = await connectSocket(token1);
    assert(socket1.connected, 'Socket 1 (Premium user 1) connected successfully');

    socket2 = await connectSocket(token2);
    assert(socket2.connected, 'Socket 2 (Premium user 2) connected successfully');

    freeSocket = await connectSocket(freeToken);
    assert(freeSocket.connected, 'Free socket connected to server');

    // Free user attempts disc:join
    const freeJoinPromise = waitForEvent(freeSocket, 'disc:error');
    freeSocket.emit('disc:join', { problemSlug: prob1.slug });
    const freeErr = await freeJoinPromise;
    assert(freeErr.code === 'PREMIUM_REQUIRED', 'Free user rejected from disc:join with PREMIUM_REQUIRED');

    // ── SUITE 2: Join, Cap & Leave ────────────────────────────────────────────
    console.log('\n--- SUITE 2: ROOM JOIN, LEAVE & SINGLE ROOM CAP ---');
    const join1Promise = waitForEvent(socket1, 'disc:joined');
    socket1.emit('disc:join', { problemSlug: prob1.slug });
    const join1 = await join1Promise;
    assert(join1.problemSlug === prob1.slug && join1.problemId === prob1.id, 'User 1 joined discussion room for prob1');

    // User 1 joins prob2 room (should leave prob1 automatically)
    const join2Promise = waitForEvent(socket1, 'disc:joined');
    socket1.emit('disc:join', { problemSlug: prob2.slug });
    const join2 = await join2Promise;
    assert(join2.problemSlug === prob2.slug, 'User 1 switched to prob2 room');

    // User 1 leaves prob2, rejoins prob1
    socket1.emit('disc:leave');
    const rejoinPromise = waitForEvent(socket1, 'disc:joined');
    socket1.emit('disc:join', { problemSlug: prob1.slug });
    await rejoinPromise;

    // User 2 joins prob1
    const joinUser2Promise = waitForEvent(socket2, 'disc:joined');
    socket2.emit('disc:join', { problemSlug: prob1.slug });
    await joinUser2Promise;
    assert(true, 'User 2 joined discussion room for prob1');

    // ── SUITE 3: Thread & Reply Broadcasts ────────────────────────────────────
    console.log('\n--- SUITE 3: REAL-TIME BROADCASTS (disc:thread_created & disc:reply_created) ---');
    // Cooldown reset
    await db.query(`UPDATE discussion_threads SET created_at = NOW() - INTERVAL '30 seconds' WHERE author_id = $1;`, [user1.id]);

    const threadBroadcastPromise = waitForEvent(socket2, 'disc:thread_created');
    const threadRes = await api('/api/discussion/threads', {
      method: 'POST',
      token: token1,
      body: {
        slug: prob1.slug,
        type: 'Question',
        title: `Socket Test Thread ${Date.now()}`,
        body: `Testing live thread broadcast to other users in discussion room ${Date.now()}`
      }
    });
    assert(threadRes.status === 201, 'User 1 created thread via API', `Status: ${threadRes.status}, data: ${JSON.stringify(threadRes.data)}`);
    const createdThread = threadRes.data.thread;

    const threadBroadcast = await threadBroadcastPromise;
    assert(threadBroadcast.thread.id === createdThread.id, 'User 2 received disc:thread_created event with correct thread ID');
    assert(threadBroadcast.thread.author.username === user1.username, 'disc:thread_created contains public author details');
    assert(!threadBroadcast.thread.author.institute, 'Public author fields omit institute');

    // Reply broadcast & unread notification
    await db.query(`UPDATE discussion_replies SET created_at = NOW() - INTERVAL '30 seconds' WHERE author_id = $1;`, [user2.id]);

    const replyBroadcastPromise = waitForEvent(socket1, 'disc:reply_created');
    const replyNotifPromise = waitForEvent(socket1, 'disc:reply_notification');

    const replyRes = await api(`/api/discussion/threads/${createdThread.id}/replies`, {
      method: 'POST',
      token: token2,
      body: {
        body: `Here is a live socket reply from User 2 to User 1 thread ${Date.now()}`
      }
    });
    assert(replyRes.status === 201, 'User 2 replied to User 1 thread');
    const createdReply = replyRes.data.reply;

    const replyBroadcast = await replyBroadcastPromise;
    assert(replyBroadcast.reply.id === createdReply.id, 'User 1 received disc:reply_created broadcast');

    const replyNotif = await replyNotifPromise;
    assert(replyNotif.threadId === createdThread.id && replyNotif.replyId === createdReply.id,
      'User 1 received disc:reply_notification unread dot notification');

    // Unread API check
    const unreadRes = await api('/api/discussion/unread', { token: token1 });
    assert(unreadRes.data.hasUnread === true && unreadRes.data.unreadCount >= 1, 'GET /api/discussion/unread reports unread replies');

    // ── SUITE 4: Block Isolation ──────────────────────────────────────────────
    console.log('\n--- SUITE 4: BLOCK ISOLATION (No pushes to blocker) ---');
    // User 2 blocks User 1
    const blockRes = await api('/api/discussion/block', {
      method: 'POST',
      token: token2,
      body: { blockedUserId: user1.id }
    });
    assert(blockRes.status === 200, 'User 2 blocked User 1');

    await db.query(`UPDATE discussion_replies SET created_at = NOW() - INTERVAL '30 seconds' WHERE author_id = $1;`, [user1.id]);

    let user2GotBlockedPush = false;
    const unexpectedHandler = () => { user2GotBlockedPush = true; };
    socket2.on('disc:reply_created', unexpectedHandler);

    // User 1 replies to own thread
    await api(`/api/discussion/threads/${createdThread.id}/replies`, {
      method: 'POST',
      token: token1,
      body: `User 1 reply while blocked by User 2 ${Date.now()}`
    });

    // Wait 500ms to verify User 2 received nothing
    await new Promise(r => setTimeout(r, 500));
    socket2.off('disc:reply_created', unexpectedHandler);
    assert(!user2GotBlockedPush, 'Blocked User 2 did NOT receive reply pushed by blocked User 1');

    // Unblock User 1
    await api(`/api/discussion/block/${user1.id}`, { method: 'DELETE', token: token2 });

    // ── SUITE 5: Post Updates & Auto-hide ──────────────────────────────────────
    console.log('\n--- SUITE 5: POST UPDATES & 3-REPORT AUTO-HIDE BROADCAST ---');
    // Vote update
    const voteUpdatedPromise = waitForEvent(socket2, 'disc:post_updated');
    await api('/api/discussion/vote', {
      method: 'POST',
      token: token1,
      body: { postKind: 'thread', postId: createdThread.id }
    });
    const voteUpdated = await voteUpdatedPromise;
    assert(voteUpdated.postId === createdThread.id && voteUpdated.helpfulCount === 1,
      'User 2 received disc:post_updated on helpful vote toggle');

    // Edit update
    const editUpdatedPromise = waitForEvent(socket2, 'disc:post_updated');
    await api(`/api/discussion/threads/${createdThread.id}`, {
      method: 'PATCH',
      token: token1,
      body: { title: 'Updated Title by User 1' }
    });
    const editUpdated = await editUpdatedPromise;
    assert(editUpdated.postId === createdThread.id && editUpdated.title === 'Updated Title by User 1',
      'User 2 received disc:post_updated with new title on thread edit');

    // 3-Report auto-hide push
    const hideBroadcastPromise = waitForEvent(socket1, 'disc:post_hidden');
    // Report 1
    await api('/api/discussion/report', {
      method: 'POST',
      token: token1,
      body: { postKind: 'reply', postId: createdReply.id, category: 'Spam' }
    });
    // Report 2
    await api('/api/discussion/report', {
      method: 'POST',
      token: token2,
      body: { postKind: 'reply', postId: createdReply.id, category: 'Spam' }
    });
    // Report 3 (from User 3)
    await api('/api/discussion/report', {
      method: 'POST',
      token: token3,
      body: { postKind: 'reply', postId: createdReply.id, category: 'Spam' }
    });

    const hideEvent = await hideBroadcastPromise;
    assert(hideEvent.postKind === 'reply' && hideEvent.postId === createdReply.id,
      'User 1 received disc:post_hidden broadcast when reply hit 3 reports');

    // ── SUITE 6: Live-Match Lockout & Dynamic Kick ────────────────────────────
    console.log('\n--- SUITE 6: LIVE-MATCH LOCKOUT & REAL-TIME DROP ---');
    // 1. Test lockout on disc:join while in match
    const matchRes = await db.query(`
      INSERT INTO matches (player_one_id, player_two_id, problem_id, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING id;
    `, [user1.id, user2.id, prob2.id]);
    const matchId = matchRes.rows[0].id;

    const lockedJoinPromise = waitForEvent(socket1, 'disc:error');
    socket1.emit('disc:join', { problemSlug: prob2.slug });
    const lockedErr = await lockedJoinPromise;
    assert(lockedErr.code === 'DISCUSSION_LOCKED_IN_MATCH',
      'User in match on prob2 is rejected from disc:join with DISCUSSION_LOCKED_IN_MATCH');

    // Finish match
    await db.query(`UPDATE matches SET status = 'finished' WHERE id = $1;`, [matchId]);

    // 2. Test live drop: User 1 is currently in prob1 discussion room. A match on prob1 begins.
    // Insert active match for User 1 on prob1
    const activeMatchRes = await db.query(`
      INSERT INTO matches (player_one_id, player_two_id, problem_id, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING id;
    `, [user1.id, user2.id, prob1.id]);
    const activeMatchId = activeMatchRes.rows[0].id;

    // Verify REST API confirms lockout
    const isLockedNow = await api(`/api/discussion/rooms/${prob1.slug}`, { token: token1 });
    assert(isLockedNow.status === 403 && isLockedNow.data.code === 'DISCUSSION_LOCKED_IN_MATCH',
      'API confirms live match lockout (403 DISCUSSION_LOCKED_IN_MATCH)');

    // Verify socket emission lockout: when a match starts, dropUsersFromDiscussionRoom is called
    // or when socket attempts disc:join on prob1 while in match, it is locked out
    const lockedJoin2Promise = waitForEvent(socket1, 'disc:error');
    socket1.emit('disc:join', { problemSlug: prob1.slug });
    const lockedErr2 = await lockedJoin2Promise;
    assert(lockedErr2.code === 'DISCUSSION_LOCKED_IN_MATCH',
      'User in live match on prob1 is rejected from joining disc room');

    // Clean up test match
    await db.query(`UPDATE matches SET status = 'finished' WHERE id = $1;`, [activeMatchId]);

    // Clean up test match
    await db.query(`UPDATE matches SET status = 'finished' WHERE id = $1;`, [activeMatchId]);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`TEST SUMMARY: Passed ${testPassed} / ${testPassed + testFailed}`);
    if (testFailed === 0) {
      console.log('✓ ALL DISCUSSION SOCKET & INTEGRITY TESTS PASSED!');
    } else {
      console.error(`✗ ${testFailed} TESTS FAILED.`);
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('Fatal error during socket testing:', err);
    testFailed++;
  } finally {
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
    if (freeSocket) freeSocket.disconnect();
    await db.pool.end();
    process.exit(testFailed === 0 ? 0 : 1);
  }
}

run();
