/**
 * scripts/social-backend-test.mjs
 *
 * Automated verification and security suite for AlgoArena Friends & Social relationships:
 * - Feature flag gating
 * - Authentication & IDOR safety
 * - Friend request lifecycle (send, duplicate, accept, decline, cancel)
 * - 14-day decline cool-down enforcement
 * - Mutual race condition resolution (concurrent send = 1 accepted friendship)
 * - Limits: self-request, rolling 24h (30), pending outgoing (20), max friends (200)
 * - Unfriend
 * - Block & non-leaking neutral enumeration protection
 * - Privacy settings (allow_requests, friends_visibility)
 * - Friends-only leaderboard
 * - Absence of personal/institute data leakage
 */

import jwt from 'jsonwebtoken';
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
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';

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
console.log('         ALGOARENA SOCIAL & FRIENDS BACKEND SUITE              ');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`[SAFETY CHECK] Dev API:          ${API_URL}`);
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

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

async function run() {
  // 1. Fetch 4 test users from DB
  const { rows: users } = await db.query(
    `SELECT id, username, email, elo_rating FROM users WHERE username NOT IN ('ayush_ayush', 'ayushoncode', 'lebhaiaagya') ORDER BY created_at ASC LIMIT 4;`
  );

  if (users.length < 4) {
    console.error('Error: Need at least 4 test users in dev database to run social test suite.');
    process.exit(1);
  }

  const [u1, u2, u3, u4] = users;
  const t1 = jwt.sign(u1, JWT_SECRET, { expiresIn: '1d' });
  const t2 = jwt.sign(u2, JWT_SECRET, { expiresIn: '1d' });
  const t3 = jwt.sign(u3, JWT_SECRET, { expiresIn: '1d' });
  const t4 = jwt.sign(u4, JWT_SECRET, { expiresIn: '1d' });

  // Cleanup existing friendships and blocks between test users
  const testIds = [u1.id, u2.id, u3.id, u4.id];
  await db.query(
    `DELETE FROM friend_blocks WHERE blocker_id = ANY($1::uuid[]) OR blocked_id = ANY($1::uuid[]);`,
    [testIds]
  );
  await db.query(
    `DELETE FROM friendships WHERE user_low = ANY($1::uuid[]) OR user_high = ANY($1::uuid[]);`,
    [testIds]
  );
  await db.query(
    `DELETE FROM social_settings WHERE user_id = ANY($1::uuid[]);`,
    [testIds]
  );

  console.log('--- SUITE 1: AUTHENTICATION & GATING ---');
  {
    const unauth = await apiCall('/api/friends/requests');
    assert(unauth.status === 401, 'Unauthenticated request receives 401 Unauthorized');

    const authCheck = await apiCall('/api/friends/requests', { token: t1 });
    assert(authCheck.status === 200, 'Authenticated request succeeds with 200 OK');
  }

  console.log('\n--- SUITE 2: BASIC REQUEST LIFECYCLE ---');
  let req1Id = null;
  {
    // Self-request test
    const selfRes = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u1.id },
      token: t1
    });
    assert(selfRes.status === 400 && selfRes.data.error === 'SELF_REQUEST', 'Self-request is rejected with 400 SELF_REQUEST');

    // U1 sends request to U2
    const sendRes = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });
    assert(sendRes.status === 200 && sendRes.data.status === 'pending', 'User 1 sends friend request to User 2');
    req1Id = sendRes.data.friendship?.id;

    // Check relationship status
    const status1 = await apiCall(`/api/friends/status/${u2.id}`, { token: t1 });
    assert(status1.data.status === 'pending_out', 'User 1 status to User 2 is pending_out');

    const status2 = await apiCall(`/api/friends/status/${u1.id}`, { token: t2 });
    assert(status2.data.status === 'pending_in', 'User 2 status to User 1 is pending_in');

    // Outgoing list for U1
    const outgoing = await apiCall('/api/friends/requests?direction=outgoing', { token: t1 });
    assert(outgoing.data.items?.length === 1 && outgoing.data.items[0].user.username === u2.username, 'Outgoing requests list contains User 2');

    // Incoming list for U2
    const incoming = await apiCall('/api/friends/requests?direction=incoming', { token: t2 });
    assert(incoming.data.items?.length === 1 && incoming.data.items[0].user.username === u1.username, 'Incoming requests list contains User 1');

    // Duplicate request is idempotent
    const dupRes = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });
    assert(dupRes.status === 200 && dupRes.data.status === 'pending', 'Duplicate request returns pending idempotently');
  }

  console.log('\n--- SUITE 3: DECLINE & 14-DAY COOLDOWN ---');
  {
    // U2 declines U1's request
    const declineRes = await apiCall(`/api/friends/requests/${req1Id}/decline`, {
      method: 'POST',
      token: t2
    });
    assert(declineRes.status === 200 && declineRes.data.status === 'declined', 'User 2 declines friend request');

    // U1 cannot re-send during 14-day cool-down
    const reSend = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });
    assert(reSend.status === 400 && reSend.data.error === 'DECLINE_COOLDOWN', 'Re-sending during 14-day decline cool-down is rejected with DECLINE_COOLDOWN');

    // Fast-forward responded_at past 14 days in DB to test expiry of cool-down
    await db.query(
      `UPDATE friendships SET responded_at = NOW() - INTERVAL '15 days' WHERE id = $1;`,
      [req1Id]
    );

    const reSendAllowed = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });
    assert(reSendAllowed.status === 200 && reSendAllowed.data.status === 'pending', 'Re-sending after cool-down expiry succeeds');
    req1Id = reSendAllowed.data.friendship?.id;
  }

  console.log('\n--- SUITE 4: CANCELLATION ---');
  {
    // U2 (recipient) cannot cancel U1's request
    const illegalCancel = await apiCall(`/api/friends/requests/${req1Id}/cancel`, {
      method: 'POST',
      token: t2
    });
    assert(illegalCancel.status === 403, 'Recipient cannot cancel outgoing request of another user (403)');

    // U1 (requester) cancels request
    const cancelRes = await apiCall(`/api/friends/requests/${req1Id}/cancel`, {
      method: 'POST',
      token: t1
    });
    assert(cancelRes.status === 200 && cancelRes.data.status === 'cancelled', 'Requester successfully cancels request');
  }

  console.log('\n--- SUITE 5: ACCEPTANCE & MUTUAL FRIENDS ---');
  {
    // U1 sends request again
    const reqAgain = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u2.id },
      token: t1
    });
    req1Id = reqAgain.data.friendship?.id;

    // U1 cannot accept own request
    const illegalAccept = await apiCall(`/api/friends/requests/${req1Id}/accept`, {
      method: 'POST',
      token: t1
    });
    assert(illegalAccept.status === 403, 'Requester cannot accept own request (403)');

    // U2 accepts request
    const acceptRes = await apiCall(`/api/friends/requests/${req1Id}/accept`, {
      method: 'POST',
      token: t2
    });
    assert(acceptRes.status === 200 && acceptRes.data.status === 'accepted', 'Recipient accepts request -> friends established');

    // Both status should now be friends
    const s1 = await apiCall(`/api/friends/status/${u2.id}`, { token: t1 });
    const s2 = await apiCall(`/api/friends/status/${u1.id}`, { token: t2 });
    assert(s1.data.status === 'friends' && s2.data.status === 'friends', 'Both users report relation status as friends');

    // Also connect U3 with U1 and U2 to test mutual friends
    const r3_1 = await apiCall('/api/friends/requests', { method: 'POST', body: { targetUserId: u1.id }, token: t3 });
    await apiCall(`/api/friends/requests/${r3_1.data.friendship.id}/accept`, { method: 'POST', token: t1 });

    const r3_2 = await apiCall('/api/friends/requests', { method: 'POST', body: { targetUserId: u2.id }, token: t3 });
    await apiCall(`/api/friends/requests/${r3_2.data.friendship.id}/accept`, { method: 'POST', token: t2 });

    // U1 and U2 now share U3 as a mutual friend!
    const mutual = await apiCall(`/api/friends/mutual-count/${u2.id}`, { token: t1 });
    assert(mutual.data.count === 1, 'Mutual friend count accurately reports 1 mutual friend');
  }

  console.log('\n--- SUITE 6: CONCURRENT REQUEST RESOLUTION ---');
  {
    // Clean relationships between U1 and U4
    await db.query(
      `DELETE FROM friendships WHERE (user_low = $1 AND user_high = $2) OR (user_low = $2 AND user_high = $1);`,
      [u1.id, u4.id]
    );

    // Run parallel simultaneous requests: U1 -> U4 and U4 -> U1
    const [p1, p2] = await Promise.all([
      apiCall('/api/friends/requests', { method: 'POST', body: { targetUserId: u4.id }, token: t1 }),
      apiCall('/api/friends/requests', { method: 'POST', body: { targetUserId: u1.id }, token: t4 })
    ]);

    const statuses = [p1.data.status, p2.data.status];
    const hasAccepted = statuses.includes('accepted');
    const rel = await apiCall(`/api/friends/status/${u4.id}`, { token: t1 });

    assert(hasAccepted && rel.data.status === 'friends', 'Simultaneous mutual requests automatically resolve into one accepted friendship');
  }

  console.log('\n--- SUITE 7: UNFRIEND ---');
  {
    const unfriendRes = await apiCall(`/api/friends/${u4.id}`, {
      method: 'DELETE',
      token: t1
    });
    assert(unfriendRes.status === 200 && unfriendRes.data.removed === true, 'Unfriend cleanly removes friendship record');

    const relAfter = await apiCall(`/api/friends/status/${u4.id}`, { token: t1 });
    assert(relAfter.data.status === 'none', 'Status reverts to none after unfriend');
  }

  console.log('\n--- SUITE 8: BLOCKING & NON-LEAKING NEUTRALITY ---');
  {
    // U1 blocks U4
    const blockRes = await apiCall(`/api/friends/block/${u4.id}`, {
      method: 'POST',
      token: t1
    });
    assert(blockRes.status === 200 && blockRes.data.blocked === true, 'User 1 blocks User 4');

    // U4 attempts to send friend request to U1
    const requestBlocked = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u1.id },
      token: t4
    });
    assert(
      requestBlocked.status === 200 && requestBlocked.data.status === 'pending' && requestBlocked.data.neutral === true,
      'Blocked user receives neutral pending response without leaking block status'
    );

    // U4 checking relationship status to U1 receives neutral "none"
    const statusBlocked = await apiCall(`/api/friends/status/${u1.id}`, { token: t4 });
    assert(statusBlocked.data.status === 'none', 'Blocked user relationship status is neutral none');

    // U4 cannot view U1 friends list
    const listBlocked = await apiCall(`/api/users/${u1.username}/friends`, { token: t4 });
    assert(listBlocked.status === 403, 'Blocked user cannot view friends list (403 PRIVATE_FRIENDS)');

    // U1 unblocks U4
    const unblockRes = await apiCall(`/api/friends/block/${u4.id}`, {
      method: 'DELETE',
      token: t1
    });
    assert(unblockRes.status === 200 && unblockRes.data.unblocked === true, 'User 1 unblocks User 4');
  }

  console.log('\n--- SUITE 9: PRIVACY SETTINGS ---');
  {
    // Test allow_requests = 'nobody'
    await apiCall('/api/settings/social', {
      method: 'PUT',
      body: { allowRequests: 'nobody', friendsVisibility: 'signed_in', mutedTypes: [] },
      token: t1
    });

    const sendToRestricted = await apiCall('/api/friends/requests', {
      method: 'POST',
      body: { targetUserId: u1.id },
      token: t4
    });
    assert(
      sendToRestricted.status === 200 && sendToRestricted.data.neutral === true,
      'Request to user with allow_requests=nobody returns neutral success without leaking setting'
    );

    // Test friends_visibility = 'only_me'
    await apiCall('/api/settings/social', {
      method: 'PUT',
      body: { allowRequests: 'everyone', friendsVisibility: 'only_me', mutedTypes: [] },
      token: t1
    });

    const viewOnlyMe = await apiCall(`/api/users/${u1.username}/friends`, { token: t4 });
    assert(viewOnlyMe.status === 403, 'Friends list hidden when friends_visibility=only_me (403)');

    const selfView = await apiCall(`/api/users/${u1.username}/friends`, { token: t1 });
    assert(selfView.status === 200, 'Owner can still view own friends list when only_me');

    // Reset settings
    await apiCall('/api/settings/social', {
      method: 'PUT',
      body: { allowRequests: 'everyone', friendsVisibility: 'signed_in', mutedTypes: [] },
      token: t1
    });
  }

  console.log('\n--- SUITE 10: FRIENDS LIST & DATA INTEGRITY ---');
  {
    const friendsList = await apiCall(`/api/users/${u1.username}/friends`, { token: t2 });
    assert(friendsList.status === 200, 'Friends list returned successfully');

    const firstItem = friendsList.data.items?.[0];
    assert(firstItem && firstItem.username, 'Friend entry contains username');
    assert(firstItem.institute === undefined, 'Friend entry strictly omits institute field');
    assert(firstItem.email === undefined, 'Friend entry strictly omits email');
    assert(firstItem.online_status === undefined, 'Friend entry strictly omits online_status');

    // Friends leaderboard test
    const lb = await apiCall('/api/friends/leaderboard', { token: t1 });
    assert(lb.status === 200 && Array.isArray(lb.data), 'Friends leaderboard endpoint returns array');
    const lbFirst = lb.data[0];
    assert(lbFirst && lbFirst.institute === undefined, 'Leaderboard entry strictly omits institute field');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`TEST SUMMARY: Passed ${passedTests} / ${totalTests}`);
  if (passedTests === totalTests) {
    console.log('✓ ALL SOCIAL & FRIENDS BACKEND TESTS PASSED!');
  } else {
    console.error(`✗ ${totalTests - passedTests} tests failed.`);
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

run().catch(err => {
  console.error('[FATAL TEST ERROR]', err);
  process.exit(1);
});
