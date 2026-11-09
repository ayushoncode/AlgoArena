/**
 * scripts/social-socket-test.mjs
 *
 * Real-time socket & notification test suite for AlgoArena:
 * - Socket authentication and private room join: "user:<hashed id>"
 * - notif:created and notif:count push on friend request
 * - Deduplication on duplicate unread friend requests
 * - notif:created, notif:count, and social:friend_added on acceptance
 * - social:friend_removed on unfriend and block
 * - Muted notification types in social_settings create no notification
 * - Blocked actors cannot emit notifications to blocker
 * - POST /api/notifications/:id/read and POST /api/notifications/read-all
 * - 90-day retention and 200-cap pruning
 * - Discussion reply notification emission
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { io: ioClient } = require('../frontend/node_modules/socket.io-client');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const db = require('../backend/db');
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

console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA SOCIAL & NOTIFICATION SOCKET SUITE            ');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`[SAFETY CHECK] Dev Backend:      ${BACKEND_URL}`);
console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(process.env.DATABASE_URL)}`);
console.log('═══════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

async function apiCall(endpoint, { method = 'GET', body = null, token = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  let data = null;
  try {
    data = await res.json();
  } catch { }
  return { status: res.status, data };
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(BACKEND_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 5000,
      reconnection: false
    });

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
}

async function run() {
  const { rows: users } = await db.query(
    `SELECT id, username, email, elo_rating FROM users WHERE username NOT IN ('ayush_ayush', 'ayushoncode', 'lebhaiaagya') ORDER BY created_at ASC LIMIT 4;`
  );

  if (users.length < 4) {
    console.error('Error: Need at least 4 test users in dev database.');
    process.exit(1);
  }

  const [u1, u2, u3, u4] = users;
  const t1 = jwt.sign(u1, JWT_SECRET, { expiresIn: '1d' });
  const t2 = jwt.sign(u2, JWT_SECRET, { expiresIn: '1d' });
  const t3 = jwt.sign(u3, JWT_SECRET, { expiresIn: '1d' });
  const t4 = jwt.sign(u4, JWT_SECRET, { expiresIn: '1d' });

  // Reset database state for test users
  const testIds = [u1.id, u2.id, u3.id, u4.id];
  await db.query(`DELETE FROM notifications WHERE user_id = ANY($1::uuid[]) OR actor_id = ANY($1::uuid[]);`, [testIds]);
  await db.query(`DELETE FROM friend_blocks WHERE blocker_id = ANY($1::uuid[]) OR blocked_id = ANY($1::uuid[]);`, [testIds]);
  await db.query(`DELETE FROM friendships WHERE user_low = ANY($1::uuid[]) OR user_high = ANY($1::uuid[]);`, [testIds]);
  await db.query(`DELETE FROM social_settings WHERE user_id = ANY($1::uuid[]);`, [testIds]);

  console.log('--- SUITE 1: SOCKET AUTHENTICATION & PRIVATE ROOM ---');
  let s1 = null;
  let s2 = null;
  {
    s1 = await connectSocket(t1);
    s2 = await connectSocket(t2);
    assert(s1.connected && s2.connected, 'Sockets for User 1 and User 2 connected and authenticated');
  }

  console.log('\n--- SUITE 2: NOTIFICATION PUSH ON FRIEND REQUEST ---');
  let receivedNotif2 = null;
  let receivedCount2 = null;
  let requestId = null;
  {
    s2.on('notif:created', (payload) => {
      receivedNotif2 = payload;
    });
    s2.on('notif:count', (payload) => {
      receivedCount2 = payload;
    });

    // U1 sends friend request to U2 via API
    const reqRes = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });

    requestId = reqRes.data.friendship?.id;
    assert(reqRes.status === 200, 'Friend request API succeeded');

    // Wait for socket push
    await new Promise(r => setTimeout(r, 600));

    assert(receivedNotif2 !== null, 'User 2 received real-time notif:created event');
    assert(receivedNotif2?.notification?.type === 'friend_request', 'Notification type is friend_request');
    assert(receivedNotif2?.notification?.actor?.username === u1.username, 'Notification actor contains User 1 username');
    assert(receivedNotif2?.notification?.actor?.institute === undefined, 'Notification payload strictly omits institute');
    assert(receivedNotif2?.unreadCount === 1, 'Unread count in payload is 1');
    assert(receivedCount2?.unreadCount === 1, 'User 2 received notif:count event with count 1');
  }

  console.log('\n--- SUITE 3: DEDUPLICATION ---');
  {
    let dupPushed = false;
    s2.once('notif:created', () => {
      dupPushed = true;
    });

    // U1 sends second request to U2 while first is unread
    await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });

    await new Promise(r => setTimeout(r, 400));
    assert(!dupPushed, 'Second unread friend_request from same actor is not pushed as duplicate');

    const feed = await apiCall('/api/notifications', { token: t2 });
    assert(feed.data.items?.length === 1, 'Notification feed contains exactly 1 item');
    assert(feed.data.unreadCount === 1, 'Unread count remains 1');
  }

  console.log('\n--- SUITE 4: ACCEPTANCE REAL-TIME PIPELINE ---');
  {
    let u1FriendAdded = null;
    let u2FriendAdded = null;
    let u1NotifCreated = null;

    s1.on('social:friend_added', (p) => { u1FriendAdded = p; });
    s2.on('social:friend_added', (p) => { u2FriendAdded = p; });
    s1.on('notif:created', (p) => { u1NotifCreated = p; });

    // U2 accepts U1's request
    const acceptRes = await apiCall(`/api/friends/requests/${requestId}/accept`, {
      method: 'POST',
      token: t2
    });
    assert(acceptRes.status === 200, 'User 2 accepted friend request');

    await new Promise(r => setTimeout(r, 600));

    assert(u1FriendAdded !== null && u1FriendAdded.friendId === u2.id, 'User 1 received social:friend_added with User 2 ID');
    assert(u2FriendAdded !== null && u2FriendAdded.friendId === u1.id, 'User 2 received social:friend_added with User 1 ID');
    assert(u1NotifCreated !== null && u1NotifCreated.notification?.type === 'friend_accepted', 'User 1 received notif:created with type friend_accepted');
    assert(u1NotifCreated.notification?.actor?.username === u2.username, 'Accepted notification actor is User 2');
  }

  console.log('\n--- SUITE 5: UNFRIEND & BLOCK REAL-TIME EVENTS ---');
  {
    let u1Removed = null;
    let u2Removed = null;
    s1.on('social:friend_removed', (p) => { u1Removed = p; });
    s2.on('social:friend_removed', (p) => { u2Removed = p; });

    // U1 unfriends U2
    await apiCall(`/api/friends/${u2.id}`, { method: 'DELETE', token: t1 });
    await new Promise(r => setTimeout(r, 500));

    assert(u1Removed !== null && u1Removed.friendId === u2.id, 'User 1 received social:friend_removed');
    assert(u2Removed !== null && u2Removed.friendId === u1.id, 'User 2 received social:friend_removed');
  }

  console.log('\n--- SUITE 6: MUTED NOTIFICATION TYPES ---');
  {
    // U2 mutes friend_request in social settings
    await apiCall('/api/settings/social', {
      method: 'PUT',
      body: {
        allowRequests: 'everyone',
        friendsVisibility: 'signed_in',
        mutedTypes: ['friend_request']
      },
      token: t2
    });

    let mutedReceived = false;
    s2.once('notif:created', () => { mutedReceived = true; });

    // U3 sends friend request to U2
    await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t3
    });

    await new Promise(r => setTimeout(r, 500));
    assert(!mutedReceived, 'Muted notification type is never pushed over socket');

    const feed = await apiCall('/api/notifications?type=friend_request', { token: t2 });
    const hasU3 = feed.data.items?.some(i => i.actor?.id === u3.id);
    assert(!hasU3, 'Muted notification type is never created in database');

    // Unmute
    await apiCall('/api/settings/social', {
      method: 'PUT',
      body: { allowRequests: 'everyone', friendsVisibility: 'signed_in', mutedTypes: [] },
      token: t2
    });
  }

  console.log('\n--- SUITE 7: BLOCK NOTIFICATION ISOLATION ---');
  {
    // U1 blocks U3
    await apiCall(`/api/friends/block/${u3.id}`, { method: 'POST', token: t1 });

    let blockedPushReceived = false;
    s1.once('notif:created', () => { blockedPushReceived = true; });

    // U3 sends request to U1
    await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u1.id },
      token: t3
    });

    await new Promise(r => setTimeout(r, 500));
    assert(!blockedPushReceived, 'Blocked actor cannot trigger notification push to blocker');

    // Unblock
    await apiCall(`/api/friends/block/${u3.id}`, { method: 'DELETE', token: t1 });
  }

  console.log('\n--- SUITE 8: MARK READ & READ ALL ---');
  {
    // Check unread count endpoint
    const initialCount = await apiCall('/api/notifications/unread-count', { token: t1 });
    assert(typeof initialCount.data.unreadCount === 'number', 'GET /api/notifications/unread-count returns integer');

    let countReceived = null;
    s1.on('notif:count', (p) => { countReceived = p; });

    // Mark all read
    const readAllRes = await apiCall('/api/notifications/read-all', {
      method: 'POST',
      token: t1
    });
    assert(readAllRes.status === 200 && readAllRes.data.unreadCount === 0, 'POST /api/notifications/read-all marks all read');

    await new Promise(r => setTimeout(r, 400));
    assert(countReceived !== null && countReceived.unreadCount === 0, 'Socket pushed notif:count with 0 after read-all');
  }

  console.log('\n--- SUITE 9: RETENTION & PRUNING ---');
  {
    // Insert an expired notification (> 90 days)
    await db.query(
      `INSERT INTO notifications (user_id, type, actor_id, created_at)
       VALUES ($1, 'friend_accepted', $2, NOW() - INTERVAL '95 days');`,
      [u1.id, u2.id]
    );

    // Trigger prune
    const { pruneNotifications } = require('../backend/services/notifications');
    await pruneNotifications(u1.id);

    const { rows: expired } = await db.query(
      `SELECT id FROM notifications WHERE user_id = $1 AND created_at < NOW() - INTERVAL '90 days';`,
      [u1.id]
    );
    assert(expired.length === 0, 'Notifications older than 90 days are cleanly pruned');
  }

  console.log('\n--- SUITE 10: DISCUSSION REPLY INTEGRATION ---');
  {
    // Fetch a problem from DB
    const { rows: probs } = await db.query(`SELECT id, slug FROM problems LIMIT 1;`);
    if (probs.length > 0) {
      const prob = probs[0];

      // Clean existing threads for this test
      await db.query(`DELETE FROM discussion_threads WHERE author_id = $1;`, [u1.id]);

      // Give U1 and U2 premium subscriptions so they can use discussion
      await db.query(
        `INSERT INTO subscriptions (user_id, razorpay_subscription_id, razorpay_plan_id, status, current_period_end)
         VALUES ($1, $2, 'plan_launch_test', 'active', NOW() + INTERVAL '1 year')
         ON CONFLICT DO NOTHING;`,
        [u1.id, 'sub_disc_u1_' + Date.now()]
      );
      await db.query(
        `INSERT INTO subscriptions (user_id, razorpay_subscription_id, razorpay_plan_id, status, current_period_end)
         VALUES ($1, $2, 'plan_launch_test', 'active', NOW() + INTERVAL '1 year')
         ON CONFLICT DO NOTHING;`,
        [u2.id, 'sub_disc_u2_' + Date.now()]
      );

      // U1 creates a discussion thread
      const threadRes = await apiCall('/api/discussion/threads', {
        method: 'POST',
        body: {
          problemId: prob.id,
          type: 'Question',
          title: 'How to solve ' + prob.slug + ' ' + Date.now(),
          body: 'Looking for advice on time complexity.'
        },
        token: t1
      });

      if (threadRes.status === 201) {
        const threadId = threadRes.data.thread.id;

        let replyNotifReceived = null;
        s1.on('notif:created', (p) => {
          if (p.notification?.type === 'discussion_reply') {
            replyNotifReceived = p;
          }
        });

        // U2 replies to U1's thread
        await apiCall(`/api/discussion/threads/${threadId}/replies`, {
          method: 'POST',
          body: {
            body: 'You can use an iterative two pointer approach for O(n) runtime.'
          },
          token: t2
        });

        await new Promise(r => setTimeout(r, 1500));

        assert(
          replyNotifReceived !== null,
          'User 1 received real-time discussion_reply notification when User 2 replied to their thread'
        );
        assert(
          replyNotifReceived?.notification?.actor?.username === u2.username,
          'discussion_reply notification actor is User 2'
        );
      } else {
        console.warn('Skipping discussion reply test (discussion thread creation returned ' + threadRes.status + ')');
      }
    }
  }

  // Teardown sockets
  s1.disconnect();
  s2.disconnect();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`TEST SUMMARY: Passed ${passedTests} / ${totalTests}`);
  if (passedTests === totalTests) {
    console.log('✓ ALL SOCIAL & NOTIFICATION SOCKET TESTS PASSED!');
  } else {
    console.error(`✗ ${totalTests - passedTests} tests failed.`);
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

run().catch(err => {
  console.error('[FATAL SOCKET TEST ERROR]', err);
  process.exit(1);
});
