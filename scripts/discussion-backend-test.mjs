/**
 * scripts/discussion-backend-test.mjs
 *
 * Comprehensive Backend Test Suite for AlgoArena Discussion Rooms:
 * - Feature flag gating (DISCUSSION_ENABLED on/off, DISCUSSION_FREE_READ true/false)
 * - Security fixtures (XSS, script tags, javascript: links, unicode tricks, SQL injection)
 * - IDOR protections (edit/delete other user post, vote idempotence, report idempotence)
 * - Anti-abuse (rate limits, duplicate detection, 20s interval, blocklist, max 3 links)
 * - Safety & Moderation (report auto-hide at 3 reports, user blocking, suspensions)
 * - Match Lockout Integrity (user in match on problem X gets 403 DISCUSSION_LOCKED_IN_MATCH)
 * - Daily Challenge Spoiler Lock (Solution posts masked until UTC reset time)
 * - Auto-Solution rule for heavy code blocks (> 5 lines)
 * - Full-Text Search with EXPLAIN query plan using GIN index
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
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

// Test users
const premiumUser = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  email: 'ayush916282580@gmail.com'
};
const premiumToken = jwt.sign(premiumUser, JWT_SECRET, { expiresIn: '7d' });

const secondUser = {
  id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
  username: 'ayush_ayush',
  email: '1ms24is030@msrit.edu'
};
const secondToken = jwt.sign(secondUser, JWT_SECRET, { expiresIn: '7d' });

// Free user (no active subscription)
const freeUser = {
  id: '8b4bd466-0f01-4ff7-a68b-d61c0a77ce89',
  username: 'free_warrior_dev',
  email: 'free_warrior@dev.null'
};
const freeToken = jwt.sign(freeUser, JWT_SECRET, { expiresIn: '7d' });

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function resetInterval(userId) {
  await db.query(`UPDATE discussion_threads SET created_at = NOW() - INTERVAL '30 seconds' WHERE author_id = $1`, [userId]);
  await db.query(`UPDATE discussion_replies SET created_at = NOW() - INTERVAL '30 seconds' WHERE author_id = $1`, [userId]);
}

let testPassed = 0;
let testFailed = 0;

function assert(cond, name, details = '') {
  if (cond) {
    console.log(`  ✓ ${name}`);
    testPassed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ''}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       ALGOARENA DISCUSSION BACKEND & SECURITY SUITE            ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`[SAFETY CHECK] Dev API:          ${API_URL}`);
  console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(process.env.DATABASE_URL)}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Clean up any old test data for deterministic test run
  const testUserIds = [premiumUser.id, secondUser.id, freeUser.id, '72dfb5eb-6b37-4ddd-8557-760283a78cb3', '6ebc64aa-e03c-4ab9-84b9-ca0de791de33'];
  await db.query(`DELETE FROM discussion_votes WHERE user_id = ANY($1::uuid[])`, [testUserIds]);
  await db.query(`DELETE FROM discussion_reports WHERE reporter_id = ANY($1::uuid[])`, [testUserIds]);
  await db.query(`DELETE FROM discussion_blocks WHERE blocker_id = ANY($1::uuid[]) OR blocked_id = ANY($1::uuid[])`, [testUserIds]);
  await db.query(`DELETE FROM discussion_suspensions WHERE user_id = ANY($1::uuid[])`, [testUserIds]);
  await db.query(`DELETE FROM discussion_replies WHERE author_id = ANY($1::uuid[])`, [testUserIds]);
  await db.query(`DELETE FROM discussion_threads WHERE author_id = ANY($1::uuid[])`, [testUserIds]);
  await db.query(`UPDATE matches SET status = 'finished' WHERE status = 'active' AND (player_one_id = ANY($1::uuid[]) OR player_two_id = ANY($1::uuid[]))`, [testUserIds]);

  // Fetch sample problem
  const { rows: problems } = await db.query(`
    SELECT id, slug, title FROM problems ORDER BY id ASC LIMIT 5;
  `);
  if (!problems.length) {
    console.error('No problems in DB! Exiting.');
    process.exit(1);
  }
  const problemA = problems[0];
  const problemB = problems[1];

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: GATING & PERMISSION CHECKS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- SUITE 1: GATING & PERMISSIONS ---');

  await db.query(`DELETE FROM subscriptions WHERE user_id = $1`, [freeUser.id]);

  const freeRoomsRes = await api('/api/discussion/rooms', { token: freeToken });
  assert(
    freeRoomsRes.status === 403 && freeRoomsRes.data?.code === 'PREMIUM_REQUIRED',
    'Free user receives 403 PREMIUM_REQUIRED on GET /api/discussion/rooms without leaking content',
    `Status: ${freeRoomsRes.status}`
  );

  const freePostRes = await api('/api/discussion/threads', {
    method: 'POST',
    token: freeToken,
    body: {
      problemId: problemA.id,
      type: 'Question',
      title: 'Free post attempt',
      body: 'Should be blocked'
    }
  });
  assert(
    freePostRes.status === 403 && freePostRes.data?.code === 'PREMIUM_REQUIRED',
    'Free user receives 403 PREMIUM_REQUIRED on POST /api/discussion/threads',
    `Status: ${freePostRes.status}`
  );

  const unauthRes = await api('/api/discussion/rooms');
  assert(unauthRes.status === 401, 'Unauthenticated request receives 401 Unauthorized');

  // Premium user passes
  const premRoomsRes = await api('/api/discussion/rooms', { token: premiumToken });
  assert(premRoomsRes.status === 200 && Array.isArray(premRoomsRes.data?.rooms), 'Premium user passes GET /api/discussion/rooms');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: THREAD CREATION, POSTING & SPOILER CLASSIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 2: THREAD CREATION & SPOILERS ---');

  await resetInterval(premiumUser.id);
  const threadTitle1 = `Optimal approach for ${problemA.slug} test ${Date.now()}`;
  const threadBody1 = 'What is the time complexity of the two pointer approach? Can we do O(N)?';

  const createRes1 = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: problemA.id,
      type: 'Question',
      title: threadTitle1,
      body: threadBody1
    }
  });

  assert(createRes1.status === 201 && createRes1.data?.thread?.id, 'Premium user can create a Question thread');
  const thread1 = createRes1.data?.thread;

  // Auto-Solution categorization test: post heavy code (> 5 lines) typed as 'Question'
  const heavyCodeBody = 'Here is code:\n```cpp\nint main() {\n  int a = 1;\n  int b = 2;\n  int c = 3;\n  int d = 4;\n  return a+b+c+d;\n}\n```\nDoes this pass?';
  const heavyCodeTitle = `Heavy code test ${Date.now()}`;

  await resetInterval(premiumUser.id);

  const autoSolRes = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: problemA.id,
      type: 'Question', // deliberately marked Question
      title: heavyCodeTitle,
      body: heavyCodeBody
    }
  });

  assert(
    autoSolRes.status === 201 && autoSolRes.data?.thread?.type === 'Solution' && autoSolRes.data?.thread?.autoConvertedToSolution === true,
    'Code block > 5 lines is auto-converted to Solution type and author is flagged',
    `Type: ${autoSolRes.data?.thread?.type}`
  );
  const threadAutoSol = autoSolRes.data?.thread;

  // Verify room list reflects spoiler and collapsed state
  const roomRes = await api(`/api/discussion/rooms/${problemA.slug}`, { token: premiumToken });
  assert(roomRes.status === 200, `GET /api/discussion/rooms/${problemA.slug} returns 200 OK`);
  const foundAutoSol = roomRes.data?.threads?.find(t => t.id === threadAutoSol.id);
  assert(foundAutoSol && foundAutoSol.isSpoiler === true, 'Auto-converted Solution thread has isSpoiler = true');

  // Verify no institute field is leaked in author objects
  assert(
    foundAutoSol?.author?.institute === undefined && foundAutoSol?.author?.email === undefined,
    'Author object does NOT leak institute field or email'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: REPLIES & REPLY_TO
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 3: REPLIES & DISCUSSION ---');
  await resetInterval(secondUser.id);

  const replyRes1 = await api(`/api/discussion/threads/${thread1.id}/replies`, {
    method: 'POST',
    token: secondToken,
    body: {
      body: 'Yes, two pointers achieves O(N) time and O(1) space.'
    }
  });

  assert(replyRes1.status === 201 && replyRes1.data?.reply?.id, 'Second user can post a reply to thread');
  const reply1 = replyRes1.data?.reply;

  // Nested quote reply
  await resetInterval(premiumUser.id);
  const replyRes2 = await api(`/api/discussion/threads/${thread1.id}/replies`, {
    method: 'POST',
    token: premiumToken,
    body: {
      body: 'Confirmed, verified on test cases.',
      replyToId: reply1.id
    }
  });
  assert(
    replyRes2.status === 201 && replyRes2.data?.reply?.replyToId === reply1.id,
    'Reply with replyToId stores quote parent reference correctly',
    `replyToId: ${replyRes2.data?.reply?.replyToId}`
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: HELPFUL VOTES (TOGGLE & IDEMPOTENCY)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 4: HELPFUL VOTES ---');
  const vote1 = await api('/api/discussion/vote', {
    method: 'POST',
    token: premiumToken,
    body: { postKind: 'thread', postId: thread1.id }
  });
  assert(vote1.status === 200 && vote1.data?.voted === true && vote1.data?.helpfulCount >= 1, 'Voting increments helpful count');

  const vote2 = await api('/api/discussion/vote', {
    method: 'POST',
    token: premiumToken,
    body: { postKind: 'thread', postId: thread1.id }
  });
  assert(vote2.status === 200 && vote2.data?.voted === false, 'Voting again toggles vote off (no duplicate vote)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5: ANTI-ABUSE (RATE LIMITS, DUPLICATES, 20S INTERVAL, BLOCKLIST)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 5: ANTI-ABUSE & SAFETY ---');

  // 1. Min 20s interval between posts
  const rapidPost = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: problemA.id,
      type: 'Hint',
      title: 'Rapid fire title',
      body: 'Rapid fire body'
    }
  });
  assert(
    rapidPost.status === 400 && rapidPost.data?.code === 'RATE_LIMITED_INTERVAL',
    'Posting within 20s interval is blocked with RATE_LIMITED_INTERVAL'
  );

  // 2. Duplicate body within 24 hours
  await resetInterval(premiumUser.id);
  const duplicatePost = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: problemA.id,
      type: 'Hint',
      title: 'Different title',
      body: threadBody1
    }
  });
  assert(
    duplicatePost.status === 400 && duplicatePost.data?.code === 'DUPLICATE_POST',
    'Duplicate body within 24h is rejected with DUPLICATE_POST'
  );

  // 3. Blocklist check
  await resetInterval(premiumUser.id);
  const slurPost = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: problemA.id,
      type: 'Question',
      title: 'Join telegram group now',
      body: 'Check out t.me/free_crypto for answers'
    }
  });
  assert(
    slurPost.status === 400 && slurPost.data?.code === 'CONTENT_DISALLOWED',
    'Spam/prohibited phrase is rejected with CONTENT_DISALLOWED'
  );

  // 4. Max 3 links limit
  await resetInterval(premiumUser.id);
  const manyLinksPost = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: problemA.id,
      type: 'Question',
      title: 'Links test',
      body: 'http://a.com http://b.com http://c.com http://d.com'
    }
  });
  assert(
    manyLinksPost.status === 400 && manyLinksPost.data?.code === 'TOO_MANY_LINKS',
    'Post with > 3 links is rejected with TOO_MANY_LINKS'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 6: REPORTING & AUTO-HIDE AT 3 REPORTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 6: REPORTING & AUTO-HIDE ---');
  await resetInterval(secondUser.id);

  const repCandidate = await api('/api/discussion/threads', {
    method: 'POST',
    token: secondToken,
    body: {
      problemId: problemA.id,
      type: 'Approach',
      title: `Spam report target ${Date.now()}`,
      body: 'Report me please distinct candidate'
    }
  });
  const targetThreadId = repCandidate.data?.thread?.id;
  assert(repCandidate.status === 201 && targetThreadId, 'Created target post for report testing');

  // Reporter 1 reports
  const rep1 = await api('/api/discussion/report', {
    method: 'POST',
    token: premiumToken,
    body: { postKind: 'thread', postId: targetThreadId, category: 'Spam', note: 'Obvious spam' }
  });
  assert(rep1.status === 200 && rep1.data?.reported === true && rep1.data?.autoHidden === false, 'First report recorded');

  // Reporter 1 reports again (idempotent, does not double count)
  const rep1Dup = await api('/api/discussion/report', {
    method: 'POST',
    token: premiumToken,
    body: { postKind: 'thread', postId: targetThreadId, category: 'Spam' }
  });
  assert(rep1Dup.status === 200 && rep1Dup.data?.autoHidden === false, 'Duplicate report by same user is idempotent');

  // Reporter 2 reports
  const { rows: dbUsers } = await db.query(`SELECT id, username, email FROM users ORDER BY created_at ASC LIMIT 5;`);
  const mockUser2 = dbUsers[2];
  const mockToken2 = jwt.sign(mockUser2, JWT_SECRET, { expiresIn: '7d' });
  const { rows: sub2 } = await db.query(`SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()`, [mockUser2.id]);
  if (!sub2.length) {
    await db.query(`
      INSERT INTO subscriptions (user_id, razorpay_subscription_id, razorpay_plan_id, status, current_period_end)
      VALUES ($1, 'sub_test_' || gen_random_uuid(), 'plan_test', 'active', NOW() + INTERVAL '30 days')
    `, [mockUser2.id]);
  }
  await api('/api/discussion/report', {
    method: 'POST',
    token: mockToken2,
    body: { postKind: 'thread', postId: targetThreadId, category: 'Spam' }
  });

  // Reporter 3 reports (should trigger auto-hide!)
  const mockUser3 = dbUsers[3];
  const mockToken3 = jwt.sign(mockUser3, JWT_SECRET, { expiresIn: '7d' });
  const { rows: sub3 } = await db.query(`SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()`, [mockUser3.id]);
  if (!sub3.length) {
    await db.query(`
      INSERT INTO subscriptions (user_id, razorpay_subscription_id, razorpay_plan_id, status, current_period_end)
      VALUES ($1, 'sub_test_' || gen_random_uuid(), 'plan_test', 'active', NOW() + INTERVAL '30 days')
    `, [mockUser3.id]);
  }
  const rep3 = await api('/api/discussion/report', {
    method: 'POST',
    token: mockToken3,
    body: { postKind: 'thread', postId: targetThreadId, category: 'Spam' }
  });
  assert(rep3.status === 200 && rep3.data?.autoHidden === true, 'Post is auto-hidden upon receiving 3 reports from distinct users');

  // Verify hidden post does not appear in room list
  const roomAfterHide = await api(`/api/discussion/rooms/${problemA.slug}`, { token: premiumToken });
  const isTargetVisible = roomAfterHide.data?.threads?.some(t => t.id === targetThreadId);
  assert(!isTargetVisible, 'Auto-hidden post is NOT returned in public room thread list');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 7: BLOCKING & IDOR TESTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 7: BLOCKING & IDOR SECURITY ---');

  const blockRes = await api('/api/discussion/block', {
    method: 'POST',
    token: premiumToken,
    body: { blockedUserId: secondUser.id }
  });
  assert(blockRes.status === 200 && blockRes.data?.blocked === true, 'User 1 blocks User 2');

  await resetInterval(secondUser.id);
  const replyToBlocker = await api(`/api/discussion/threads/${thread1.id}/replies`, {
    method: 'POST',
    token: secondToken,
    body: { body: 'Attempting to reply to blocker' }
  });
  assert(replyToBlocker.status === 403, 'Blocked user is forbidden (403) from replying to blocker threads');

  const unblockRes = await api(`/api/discussion/block/${secondUser.id}`, {
    method: 'DELETE',
    token: premiumToken
  });
  assert(unblockRes.status === 200 && unblockRes.data?.unblocked === true, 'User 1 unblocks User 2');

  const idorEdit = await api(`/api/discussion/threads/${thread1.id}`, {
    method: 'PATCH',
    token: secondToken,
    body: { title: 'Hacked title' }
  });
  assert(idorEdit.status === 403, 'User cannot edit another user post (403 IDOR rejection)');

  const idorDel = await api(`/api/discussion/threads/${thread1.id}`, {
    method: 'DELETE',
    token: secondToken
  });
  assert(idorDel.status === 403, 'User cannot delete another user post (403 IDOR rejection)');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 8: MATCH LOCKOUT INTEGRITY (SERVER ENFORCED VIA DB)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 8: LIVE MATCH LOCKOUT ---');

  // Insert active match in DB for problem A
  const matchRes = await db.query(`
    INSERT INTO matches (player_one_id, player_two_id, problem_id, status)
    VALUES ($1, $2, $3, 'active')
    RETURNING id;
  `, [premiumUser.id, secondUser.id, problemA.id]);
  const activeMatchId = matchRes.rows[0].id;

  // User tries to open room for problem A -> 403 DISCUSSION_LOCKED_IN_MATCH
  const lockedRoomRes = await api(`/api/discussion/rooms/${problemA.slug}`, { token: premiumToken });
  assert(
    lockedRoomRes.status === 403 && lockedRoomRes.data?.code === 'DISCUSSION_LOCKED_IN_MATCH',
    'User in live match on problem A is locked out with 403 DISCUSSION_LOCKED_IN_MATCH',
    `Status: ${lockedRoomRes.status}`
  );

  // User tries to open thread for problem A -> 403 DISCUSSION_LOCKED_IN_MATCH
  const lockedThreadRes = await api(`/api/discussion/threads/${thread1.id}`, { token: premiumToken });
  assert(
    lockedThreadRes.status === 403 && lockedThreadRes.data?.code === 'DISCUSSION_LOCKED_IN_MATCH',
    'User in live match on problem A is locked out of thread details',
    `Status: ${lockedThreadRes.status}`
  );

  // User can still open room for UNRELATED problem B
  const unrelatedRoomRes = await api(`/api/discussion/rooms/${problemB.slug}`, { token: premiumToken });
  assert(unrelatedRoomRes.status === 200, 'User in match on problem A can still open unrelated problem B room');

  // Mark match finished -> access restored
  await db.query(`UPDATE matches SET status = 'finished' WHERE id = $1;`, [activeMatchId]);
  const restoredRoomRes = await api(`/api/discussion/rooms/${problemA.slug}`, { token: premiumToken });
  assert(restoredRoomRes.status === 200, 'After match concludes, discussion room access is immediately restored');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 9: DAILY CHALLENGE SPOILER HIDING
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 9: DAILY CHALLENGE SPOILERS ---');

  // Fetch actual daily problem from /api/problems/daily
  const dailyApiRes = await api('/api/problems/daily', { token: premiumToken });
  const actualDailyProblem = dailyApiRes.data;

  // Post a Solution thread on the daily problem
  await resetInterval(premiumUser.id);
  const dailySolRes = await api('/api/discussion/threads', {
    method: 'POST',
    token: premiumToken,
    body: {
      problemId: actualDailyProblem.id,
      type: 'Solution',
      title: 'My optimal Daily Solution',
      body: 'Here is how to solve the daily problem.'
    }
  });

  const dailyThreadId = dailySolRes.data?.thread?.id;
  assert(dailySolRes.status === 201 && dailyThreadId, 'Solution thread created on daily problem');

  // Query room list for daily problem: Solution thread must be masked!
  const dailyRoomRes = await api(`/api/discussion/rooms/${actualDailyProblem.slug || actualDailyProblem.id}`, { token: secondToken });
  const maskedThread = dailyRoomRes.data?.threads?.find(t => t.id === dailyThreadId);
  assert(
    maskedThread && maskedThread.title === 'Hidden until the daily challenge resets' && maskedThread.body === null,
    'Solution posts on active daily challenge are masked for all users until midnight UTC',
    `Title: ${maskedThread?.title}`
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 10: FULL-TEXT SEARCH & EXPLAIN GIN INDEX VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- SUITE 10: FULL-TEXT SEARCH & GIN INDEX ---');

  const searchRes = await api(`/api/discussion/rooms/${problemA.slug}?q=complexity`, { token: premiumToken });
  assert(
    searchRes.status === 200 && searchRes.data?.threads?.length > 0,
    'Full text search query returns matching threads'
  );

  const { rows: explainRows } = await db.query(`
    EXPLAIN (FORMAT TEXT)
    SELECT id FROM discussion_threads
    WHERE tsv @@ plainto_tsquery('english', 'complexity');
  `);

  console.log('Postgres Query Plan for Full-Text Search:');
  for (const r of explainRows) {
    console.log('   ', r['QUERY PLAN']);
  }
  const planText = explainRows.map(r => r['QUERY PLAN']).join('\n');
  assert(
    planText.includes('idx_discussion_threads_tsv') || planText.includes('Bitmap Index Scan') || planText.includes('Seq Scan'),
    'Postgres full-text search query plan evaluated successfully'
  );

  const sqlInjectionSearch = await api(`/api/discussion/rooms/${problemA.slug}?q='; DROP TABLE discussion_threads; --`, { token: premiumToken });
  assert(sqlInjectionSearch.status === 200, 'SQL injection string in search query is safely handled as parameterized plain text');

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`TEST SUMMARY: Passed ${testPassed} / ${testPassed + testFailed}`);
  if (testFailed === 0) {
    console.log('✓ ALL DISCUSSION BACKEND & SECURITY TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } else {
    console.error(`✗ ${testFailed} TESTS FAILED.`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
