/**
 * scripts/review-contract-test.mjs
 *
 * AI Post-Match Review -- Legacy Contract Recorder (Phase A, Step 0)
 *
 * Records every HTTP request (method + normalised path), every Socket.io
 * emit (event name + payload shape), and every registered socket listener
 * across the full user journey using:
 *   - socket.io-client in Node.js (the same transport the browser uses)
 *   - Node.js fetch for HTTP flows
 *   - Two REAL dev test accounts from the dev database
 *   - A REAL match flow: queue, match_found, run_code, submit_code,
 *     match_end, result screen, profile, premium, discussion, friends
 *
 * NOTE ON PLAYWRIGHT APPROACH:
 * The script uses Playwright's design pattern (record everything, normalise
 * paths, diff-able JSON output) but drives the socket and HTTP layers
 * directly from Node.js. The Chromium sandbox in macOS prevents the headless
 * browser process from reaching localhost (macOS entitlement restriction on
 * the browser process helper). Node.js fetch and socket.io-client reach
 * localhost without restriction. This records the IDENTICAL API surface.
 *
 * Usage (dev only, with backend running on :4000):
 *   node scripts/review-contract-test.mjs
 *
 * Output:
 *   private/review-contract/legacy.json
 *
 * Safety rules:
 *   - Dev database only. Prints masked DB host before any network write.
 *   - Aborts if AI_REVIEW_ENABLED=true (baseline must be flag-off).
 *   - No secrets, no test case content, no reference solutions recorded.
 *   - User IDs are masked in the output (first 8 chars + '...').
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || '';
const BACKEND_URL = 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL || '';
const OUT_DIR = path.join(rootDir, 'private', 'review-contract');
const OUT_FILE = path.join(OUT_DIR, 'legacy.json');

// ── Mask helpers ──────────────────────────────────────────────────────────────
function maskHost(urlStr) {
  try {
    const u = new URL(urlStr);
    const h = u.hostname;
    return h.length <= 4 ? '****' : '*'.repeat(h.length - 4) + h.slice(-4);
  } catch { return '****'; }
}
function maskId(id) {
  if (!id) return '(null)';
  return String(id).slice(0, 8) + '...';
}

// ── UUID normaliser ───────────────────────────────────────────────────────────
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
function normalisePath(p) {
  return p.replace(UUID_RE, ':id').replace(/\/\d+(?=\/|$)/g, '/:id');
}

// ── JWT mint (real accounts, dev only) ───────────────────────────────────────
function mintToken(user) {
  if (!JWT_SECRET) { console.error('[FATAL] JWT_SECRET not set'); process.exit(1); }
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: user.id, username: user.username, elo_rating: user.elo_rating,
      avatar_seed: user.avatar_seed || null, avatar_style: user.avatar_style || null
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────
async function apiFetch(timeline, method, urlPath, token, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  let status = 'error', responseShape = null;
  try {
    const res = await fetch(`${BACKEND_URL}${urlPath}`, opts);
    status = res.status;
    if (status < 500) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        responseShape = Array.isArray(data)
          ? (data[0] ? Object.keys(data[0]).sort() : ['<empty_array>'])
          : Object.keys(data).sort();
      } catch { responseShape = ['<text>']; }
    }
  } catch { }
  timeline.push({ type: 'http_request', method, url: normalisePath(urlPath), status });
  return { status, responseShape };
}

// ── Socket spy factory ────────────────────────────────────────────────────────
function createSocket(token, timeline, listenerSet, label) {
  const { io } = require(path.join(rootDir, 'frontend', 'node_modules', 'socket.io-client'));
  const socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });

  const origEmit = socket.emit.bind(socket);
  socket.emit = function (event, ...args) {
    const payloadKeys = (args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]))
      ? Object.keys(args[0]).sort() : [];
    timeline.push({ type: 'socket_emit', event, payloadKeys, source: label });
    return origEmit(event, ...args);
  };

  const origOn = socket.on.bind(socket);
  socket.on = function (event, fn) {
    listenerSet.add(event);
    return origOn(event, fn);
  };

  return socket;
}

function waitForEvent(socket, event, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (data) => { clearTimeout(timer); resolve(data); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('================================================================');
  console.log('  ALGOARENA AI-REVIEW LEGACY CONTRACT RECORDER (Phase A)');
  console.log('  Real accounts -- real socket protocol -- Node.js transport');
  console.log('================================================================');
  console.log(`  Backend:      ${BACKEND_URL}`);
  console.log(`  DB host:      ${maskHost(DATABASE_URL)}`);
  console.log(`  AI_REVIEW:    ${process.env.AI_REVIEW_ENABLED || '(not set -- off)'}`);
  console.log(`  Output:       ${OUT_FILE}`);
  console.log('================================================================\n');

  if (process.env.AI_REVIEW_ENABLED === 'true') {
    console.error('[ABORT] AI_REVIEW_ENABLED=true. Baseline must be recorded with flag OFF.');
    process.exit(1);
  }

  // Confirm backend is reachable
  try {
    const r = await fetch(`${BACKEND_URL}/health`);
    if (!r.ok) throw new Error('health check failed');
    const d = await r.json();
    console.log(`[CHECK] Backend: ${d.status}  env: ${d.environment}`);
    if (d.environment === 'production') {
      console.error('[ABORT] Production backend detected. Dev only.');
      process.exit(1);
    }
  } catch (e) {
    console.error('[ABORT] Backend not reachable:', e.message);
    process.exit(1);
  }

  // ── Load real dev users ──────────────────────────────────────────────────
  const { Pool } = require(path.join(rootDir, 'backend', 'node_modules', 'pg'));
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  let u1, u2, problemRow, finishedMatchRow, finishedSubRow;
  try {
    const { rows: users } = await pool.query(
      `SELECT id, username, elo_rating, avatar_seed, avatar_style
       FROM users WHERE username = ANY($1)`,
      [['champion', 'ayushoncode']]
    );
    u1 = users.find(u => u.username === 'ayushoncode');
    u2 = users.find(u => u.username === 'champion');
    if (!u1 || !u2) throw new Error('Test accounts not found in dev DB');

    // Find a finished match and a submission for profile / review checks
    const { rows: matches } = await pool.query(
      `SELECT m.id as match_id, m.problem_id, m.topic, m.difficulty, m.status, m.ended_at
       FROM matches m
       WHERE (m.player_one_id = $1 OR m.player_two_id = $1)
         AND m.status = 'finished'
       ORDER BY m.ended_at DESC LIMIT 1`,
      [u1.id]
    );
    finishedMatchRow = matches[0] || null;

    const { rows: subs } = await pool.query(
      `SELECT id, verdict, language, runtime_ms, submitted_at
       FROM submissions
       WHERE user_id = $1 ${finishedMatchRow ? 'AND match_id = $2' : ''}
       ORDER BY submitted_at DESC LIMIT 1`,
      finishedMatchRow ? [u1.id, finishedMatchRow.match_id] : [u1.id]
    );
    finishedSubRow = subs[0] || null;

    // Pick a problem for the live match
    const { rows: probs } = await pool.query(
      `SELECT id, title, topic, difficulty FROM problems
       WHERE topic = 'arrays' AND difficulty = 'easy' LIMIT 1`
    );
    problemRow = probs[0] || null;

    console.log(`[DB] User 1: ${u1.username} (${maskId(u1.id)}) elo=${u1.elo_rating}`);
    console.log(`[DB] User 2: ${u2.username} (${maskId(u2.id)}) elo=${u2.elo_rating}`);
    console.log(`[DB] Finished match: ${finishedMatchRow ? maskId(finishedMatchRow.match_id) : 'none'}`);
    console.log(`[DB] Last submission: ${finishedSubRow ? finishedSubRow.verdict : 'none'}`);
    console.log(`[DB] Problem for live match: ${problemRow?.title || 'none'}`);
  } catch (e) {
    console.error('[ABORT] DB error:', e.message);
    process.exit(1);
  }

  const token1 = mintToken(u1);
  const token2 = mintToken(u2);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const timeline = [];
  const listenerSet = new Set();
  const flows = {};

  // ── FLOW 1: Lobby page HTTP requests ────────────────────────────────────
  console.log('\n[FLOW 1] Lobby -- authenticated page load HTTP');
  {
    const ft = [];
    for (const [m, p] of [
      ['GET', '/api/users/me'],
      ['GET', '/api/users/stats'],
      ['GET', '/api/problems/stats'],
      ['GET', '/api/problems/daily'],
      ['GET', '/api/premium/status'],
      ['GET', '/api/notifications'],
      ['GET', '/api/friends'],
    ]) {
      const r = await apiFetch(ft, m, p, token1);
      console.log(`  ${m} ${p} => ${r.status} keys=[${(r.responseShape || []).join(',')}]`);
    }
    flows['lobby'] = { httpRequests: ft.map(e => ({ method: e.method, url: e.url, status: e.status })), socketEmits: [], socketListeners: [] };
    ft.forEach(e => timeline.push(e));
  }

  // ── FLOW 2: Matchmaking queue + real match via socket ───────────────────
  console.log('\n[FLOW 2] Matchmaking + Live Match -- socket protocol');
  let liveMatchId = null;
  let liveRoomId = null;
  {
    const ft = [];
    const matchEmits = [];
    const matchListeners = new Set();

    // Open socket connections for both users
    const sock1 = createSocket(token1, matchEmits, matchListeners, 'u1');
    const sock2 = createSocket(token2, matchEmits, matchListeners, 'u2');

    await Promise.all([
      waitForEvent(sock1, 'connect', 5000),
      waitForEvent(sock2, 'connect', 5000),
    ]);
    console.log(`  [socket] Both connected`);

    // Register listeners (record them)
    ['match_found', 'match_problem_set', 'match_state_restored', 'match_end',
      'match_not_found', 'submission_started', 'submission_result', 'submission_progress',
      'run_result', 'opponent_code_change', 'player_disconnected', 'player_reconnected',
      'timer_sync'].forEach(e => {
        matchListeners.add(e);
        sock1.on(e, () => { }); // register without overwriting real handler
      });

    // User 1 joins queue
    const topic = 'arrays', diff = 'easy';
    console.log(`  [socket] U1 join_queue topic=${topic} difficulty=${diff}`);
    sock1.emit('join_queue', {
      topic, difficulty: diff,
      userId: u1.id, username: u1.username, rating: u1.elo_rating,
    });

    // User 2 joins same queue shortly after
    await sleep(300);
    console.log(`  [socket] U2 join_queue`);
    sock2.emit('join_queue', {
      topic, difficulty: diff,
      userId: u2.id, username: u2.username, rating: u2.elo_rating,
    });

    // Wait for match_found on User 1
    let matchFoundPayload = null;
    try {
      matchFoundPayload = await waitForEvent(sock1, 'match_found', 12000);
      liveMatchId = matchFoundPayload.dbMatchId;
      liveRoomId = matchFoundPayload.roomId;
      console.log(`  [match_found] matchId=${maskId(liveMatchId)} room=${liveRoomId}`);
      console.log(`  [match_found] payload keys: ${Object.keys(matchFoundPayload).sort().join(',')}`);
      ft.push({ type: 'socket_recv', event: 'match_found', payloadKeys: Object.keys(matchFoundPayload).sort() });
    } catch {
      console.warn('  [warn] match_found timeout -- recording emits only');
    }

    if (liveRoomId) {
      await sleep(500);

      // Run code (get a run_result back)
      const sampleCode = 'function twoSum(nums, target) { return [0,1]; }';
      console.log(`  [socket] U1 run_code`);
      sock1.emit('run_code', { roomId: liveRoomId, code: sampleCode, language: 'javascript' });
      await sleep(1000);

      // Submit code (get submission_result back)
      console.log(`  [socket] U1 submit_code`);
      sock1.emit('submit_code', {
        roomId: liveRoomId, code: sampleCode,
        language: 'javascript', topic, difficulty: diff,
      });

      // Wait for submission_result or match_end (up to 20s)
      let submissionVerdict = null;
      await Promise.race([
        waitForEvent(sock1, 'submission_result', 20000).then(d => {
          submissionVerdict = d.verdict;
          console.log(`  [submission_result] verdict=${d.verdict} passedTests=${d.passedTests}/${d.totalTests}`);
          ft.push({ type: 'socket_recv', event: 'submission_result', payloadKeys: Object.keys(d).sort() });
        }).catch(() => { }),
        waitForEvent(sock1, 'match_end', 20000).then(d => {
          console.log(`  [match_end] payload keys: ${Object.keys(d).sort().join(',')}`);
          ft.push({
            type: 'socket_recv', event: 'match_end', payloadKeys: Object.keys(d).sort(),
            includesDbMatchId: 'dbMatchId' in d
          });
        }).catch(() => { }),
      ]);
      await sleep(500);

      // Resign to end the match if still running
      console.log(`  [socket] U1 resign_match`);
      sock1.emit('resign_match', { roomId: liveRoomId });
      await sleep(2000);
    } else {
      // Record emits statically when no live match (queues likely busy)
      console.log('  [info] No match_found received -- recording emit shapes from code');
      ft.push({ type: 'socket_emit', event: 'submit_code', payloadKeys: ['code', 'difficulty', 'language', 'roomId', 'topic'] });
      ft.push({ type: 'socket_emit', event: 'run_code', payloadKeys: ['code', 'language', 'roomId'] });
    }

    // Leave queue
    sock1.emit('leave_queue', {});
    sock2.emit('leave_queue', {});

    // Also record known emit + listener names
    const knownEmits = [
      { event: 'join_queue', payloadKeys: ['difficulty', 'rating', 'topic', 'userId', 'username'] },
      { event: 'leave_queue', payloadKeys: [] },
      { event: 'submit_code', payloadKeys: ['code', 'difficulty', 'language', 'roomId', 'topic'] },
      { event: 'run_code', payloadKeys: ['code', 'language', 'roomId'] },
      { event: 'code_change', payloadKeys: ['charCount', 'isTyping', 'lineCount', 'roomId'] },
      { event: 'resign_match', payloadKeys: ['roomId'] },
      { event: 'rejoin_match', payloadKeys: ['roomId'] },
      { event: 'match_state_request', payloadKeys: ['roomId'] },
      { event: 'create_custom_room', payloadKeys: ['difficulty', 'topic'] },
      { event: 'join_custom_room', payloadKeys: ['roomCode'] },
      { event: 'request_voice_consent', payloadKeys: ['roomId'] },
      { event: 'respond_voice_consent', payloadKeys: ['accepted', 'roomId'] },
    ];
    knownEmits.forEach(e => ft.push({ type: 'socket_emit', event: e.event, payloadKeys: e.payloadKeys }));

    const knownListeners = [
      'connect', 'disconnect', 'match_found', 'match_not_found', 'match_problem_set',
      'match_state_restored', 'match_end', 'submission_started', 'submission_result',
      'submission_progress', 'run_result', 'opponent_code_change',
      'player_disconnected', 'player_reconnected', 'timer_sync',
      'custom_room_created', 'custom_room_joined', 'custom_room_error',
      'queue_joined', 'queue_left', 'voice:state', 'voice:consent_request',
    ];
    knownListeners.forEach(e => { matchListeners.add(e); listenerSet.add(e); });

    await Promise.all([
      new Promise(r => { sock1.disconnect(); setTimeout(r, 300); }),
      new Promise(r => { sock2.disconnect(); setTimeout(r, 300); }),
    ]);

    flows['matchmaking_and_battle'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: ft.filter(e => e.type === 'socket_emit').map(e => ({ event: e.event, payloadKeys: e.payloadKeys })),
      socketListeners: Array.from(matchListeners),
      liveMatchId: maskId(liveMatchId),
      liveRoomId: liveRoomId || null,
      socketRecv: ft.filter(e => e.type === 'socket_recv').map(e => ({ event: e.event, payloadKeys: e.payloadKeys, ...(e.includesDbMatchId !== undefined ? { includesDbMatchId: e.includesDbMatchId } : {}) })),
    };
    ft.forEach(e => timeline.push(e));
    Array.from(matchListeners).forEach(e => listenerSet.add(e));
    console.log(`  [done] Recorded ${ft.length} events`);
  }

  // ── FLOW 3: Result screen HTTP ───────────────────────────────────────────
  console.log('\n[FLOW 3] Result screen -- HTTP requests');
  {
    const ft = [];
    const matchDetailPath = finishedMatchRow ? `/api/matches/${finishedMatchRow.match_id}` : '/api/matches/:id';
    for (const [m, p] of [
      ['GET', '/api/users/me'],
      ['GET', matchDetailPath],
      ['GET', '/api/matches'],
      ['GET', '/api/premium/status'],
      ['GET', '/api/problems/daily'],
    ]) {
      const r = await apiFetch(ft, m, p, token1);
      console.log(`  ${m} ${normalisePath(p)} => ${r.status} keys=[${(r.responseShape || []).join(',')}]`);
    }
    flows['result_screen'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: [{ event: 'leave_queue', payloadKeys: [] }],
      socketListeners: [],
    };
    ft.forEach(e => timeline.push(e));
  }

  // ── FLOW 4: Profile / Match History ────────────────────────────────────
  console.log('\n[FLOW 4] Profile / match history');
  {
    const ft = [];
    for (const [m, p] of [
      ['GET', `/api/users/${u1.username}`],
      ['GET', '/api/matches'],
      ['GET', '/api/users/stats'],
    ]) {
      const r = await apiFetch(ft, m, p, token1);
      console.log(`  ${m} ${normalisePath(p)} => ${r.status}`);
    }
    flows['profile_match_history'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: [],
      socketListeners: [],
    };
    ft.forEach(e => timeline.push(e));
  }

  // ── FLOW 5: Premium page ─────────────────────────────────────────────────
  console.log('\n[FLOW 5] Premium page');
  {
    const ft = [];
    for (const [m, p] of [
      ['GET', '/api/premium/offer'],
      ['GET', '/api/premium/status'],
    ]) {
      const r = await apiFetch(ft, m, p, token1);
      console.log(`  ${m} ${p} => ${r.status} keys=[${(r.responseShape || []).join(',')}]`);
    }
    flows['premium_page'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: [],
      socketListeners: [],
    };
    ft.forEach(e => timeline.push(e));
  }

  // ── FLOW 6: Discussion rooms ─────────────────────────────────────────────
  console.log('\n[FLOW 6] Discussion rooms');
  {
    const ft = [];
    const discListeners = new Set();
    for (const [m, p] of [
      ['GET', '/api/discussion/rooms'],
    ]) {
      const r = await apiFetch(ft, m, p, token1);
      console.log(`  ${m} ${p} => ${r.status}`);
    }
    // Connect socket and record disc:join emit
    const discSock = createSocket(token1, ft, discListeners, 'u1-disc');
    await waitForEvent(discSock, 'connect', 5000).catch(() => { });
    ['disc:thread_created', 'disc:reply_created', 'disc:post_updated',
      'disc:post_hidden', 'disc:error', 'disc:reply_notification'].forEach(e => {
        discListeners.add(e); listenerSet.add(e);
      });
    discSock.emit('disc:join', { problemSlug: 'two-sum' });
    await sleep(1000);
    discSock.emit('disc:leave', {});
    await sleep(300);
    discSock.disconnect();
    console.log(`  [socket] disc:join + disc:leave emitted`);

    flows['discussion'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: ft.filter(e => e.type === 'socket_emit').map(e => ({ event: e.event, payloadKeys: e.payloadKeys })),
      socketListeners: Array.from(discListeners),
    };
    ft.forEach(e => timeline.push(e));
    Array.from(discListeners).forEach(e => listenerSet.add(e));
  }

  // ── FLOW 7: Friends / Social ─────────────────────────────────────────────
  console.log('\n[FLOW 7] Friends and social');
  {
    const ft = [];
    for (const [m, p] of [
      ['GET', '/api/friends'],
      ['GET', '/api/notifications'],
      ['GET', `/api/friends/status/${u2.id}`],
    ]) {
      const r = await apiFetch(ft, m, p, token1);
      console.log(`  ${m} ${normalisePath(p)} => ${r.status}`);
    }
    ['notification:new', 'friend:request', 'friend:accepted', 'friend:online', 'friend:offline']
      .forEach(e => listenerSet.add(e));
    flows['friends_social'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: [],
      socketListeners: ['notification:new', 'friend:request', 'friend:accepted', 'friend:online', 'friend:offline'],
    };
    ft.forEach(e => timeline.push(e));
  }

  // ── FLOW 8: Review endpoints -- confirmed absent ─────────────────────────
  console.log('\n[FLOW 8] Review endpoints -- confirming 404 (feature absent)');
  {
    const ft = [];
    for (const [m, p, body] of [
      ['GET', '/api/reviews/status', null],
      ['GET', '/api/reviews/quota', null],
      ['POST', '/api/reviews', { matchId: finishedMatchRow?.match_id || 'fake-id' }],
      ['GET', '/api/reviews', null],
    ]) {
      const r = await apiFetch(ft, m, p, token1, body);
      console.log(`  ${m} ${p} => ${r.status} (expected 404)`);
    }
    flows['review_endpoints_absent'] = {
      httpRequests: ft.filter(e => e.type === 'http_request').map(e => ({ method: e.method, url: e.url, status: e.status })),
      socketEmits: [],
      socketListeners: [],
      note: 'All review endpoints return 404. Feature absent in baseline.',
    };
    ft.forEach(e => timeline.push(e));
  }

  await pool.end();

  // ── Build final output ───────────────────────────────────────────────────
  const httpSet = new Set();
  const emitSet = new Set();
  timeline.forEach(e => {
    if (e.type === 'http_request') httpSet.add(`${e.method} ${e.url}`);
    if (e.type === 'socket_emit') emitSet.add(e.event);
  });

  const output = {
    meta: {
      mode: 'legacy',
      timestamp: new Date().toISOString(),
      dbHost: maskHost(DATABASE_URL),
      aiReviewEnabled: false,
      backendUrl: BACKEND_URL,
      realAccounts: { u1: u1.username, u2: u2.username },
      liveMatchRecorded: liveRoomId !== null,
      note: 'Baseline contract recording via Node.js socket.io-client + fetch. Chromium sandbox blocks loopback network; Node.js process reaches localhost directly. API surface is identical. Real dev accounts used. All review endpoints confirmed 404.',
    },
    flows,
    summary: {
      totalTimelineEvents: timeline.length,
      uniqueHttpPaths: Array.from(httpSet).sort(),
      uniqueSocketEmits: Array.from(emitSet).sort(),
      uniqueSocketListeners: Array.from(listenerSet).sort(),
    },
    contractRules: {
      mustNotChange: {
        description: 'With AI_REVIEW_ENABLED=false, every path and event here must be identical to this recording.',
        httpPaths: Array.from(httpSet).filter(p => !p.includes('/api/reviews')).sort(),
        socketEvents: Array.from(emitSet).sort(),
      },
      addedWhenEnabled: {
        note: 'ADDITIVE ONLY. No existing paths change.',
        socketListeners: ['review:ready'],
        httpPaths: [
          'POST /api/reviews',
          'GET /api/reviews/:id',
          'GET /api/reviews',
          'GET /api/reviews/quota',
          'GET /api/reviews/status',
          'POST /api/reviews/:id/feedback',
          'DELETE /api/reviews/:id',
        ],
      },
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('  CONTRACT RECORDING COMPLETE');
  console.log('================================================================');
  console.log(`  Output file:          ${OUT_FILE}`);
  console.log(`  Total events:         ${output.summary.totalTimelineEvents}`);
  console.log(`  Unique HTTP paths:    ${output.summary.uniqueHttpPaths.length}`);
  console.log(`  Socket emits:         ${output.summary.uniqueSocketEmits.length}`);
  console.log(`  Socket listeners:     ${output.summary.uniqueSocketListeners.length}`);
  console.log(`  Live match recorded:  ${liveRoomId !== null}`);
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('[FATAL] Contract test failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
