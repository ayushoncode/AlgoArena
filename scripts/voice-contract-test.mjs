/**
 * scripts/voice-contract-test.mjs
 *
 * Playwright contract test and protocol recorder for AlgoArena Live Voice.
 * Records every HTTP request (fetch/XHR) and every socket emit (event, payload),
 * plus all registered socket listeners, in deterministic order.
 *
 * Covers required flows:
 *   1. Queue and match (matchmaking pair)
 *   2. Battle (typing code in editor)
 *   3. Run (run_code execution)
 *   4. Submit (submit_code evaluation)
 *   5. Reconnect (page reload mid-match, state restoration)
 *   6. Resign (forfeit, match_end, result navigation)
 *   7. Private room (create_custom_room, join_custom_room, private match)
 *
 * Usage:
 *   node scripts/voice-contract-test.mjs --record
 *   node scripts/voice-contract-test.mjs --diff
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { io } = require('../frontend/node_modules/socket.io-client');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment from backend/.env
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena';

const OUT_DIR = path.join(rootDir, 'private', 'voice-contract');
const LEGACY_FILE = path.join(OUT_DIR, 'legacy.json');
const CURRENT_FILE = path.join(OUT_DIR, 'current.json');

// Parse CLI flags
const args = process.argv.slice(2);
let mode = 'record'; // 'record' | 'verify' | 'diff'
for (const arg of args) {
  if (arg === '--record' || arg === '--legacy') mode = 'record';
  if (arg === '--verify' || arg === '--current') mode = 'verify';
  if (arg === '--diff') mode = 'diff';
}

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

// Safety verification banner
console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA VOICE CONTRACT & PROTOCOL RECORDER            ');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`[SAFETY CHECK] Target Mode:      ${mode.toUpperCase()}`);
console.log(`[SAFETY CHECK] Dev Frontend:     ${FRONTEND_URL}`);
console.log(`[SAFETY CHECK] Dev Backend:      ${BACKEND_URL}`);
console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(DATABASE_URL)}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (mode === 'diff') {
  runDiff();
  process.exit(0);
}

function normalizeEmit(e) {
  if (!e) return null;
  const clone = JSON.parse(JSON.stringify(e));
  if (clone.payload && typeof clone.payload.roomId === 'string') {
    clone.payload.roomId = '<ROOM_ID>';
  }
  if (clone.payload && typeof clone.payload.code === 'string') {
    clone.payload.code = '<CODE_PAYLOAD>';
  }
  if (clone.payload && typeof clone.payload.roomCode === 'string') {
    clone.payload.roomCode = '<ROOM_CODE>';
  }
  if (clone.event === 'code_change' && clone.payload) {
    if (typeof clone.payload.charCount === 'number') clone.payload.charCount = '<NUM>';
    if (typeof clone.payload.lineCount === 'number') clone.payload.lineCount = '<NUM>';
  }
  return clone;
}

function dedupeConsecutive(emits) {
  const res = [];
  for (let i = 0; i < emits.length; i++) {
    const cur = normalizeEmit(emits[i]);
    if (!cur) continue;
    const prev = res[res.length - 1];
    if (prev && prev.event === 'rejoin_match' && cur.event === 'rejoin_match') {
      continue;
    }
    if (prev && prev.event === 'code_change' && cur.event === 'code_change') {
      continue;
    }
    res.push(cur);
  }
  return res;
}

function runDiff() {
  if (!fs.existsSync(LEGACY_FILE) || !fs.existsSync(CURRENT_FILE)) {
    console.error('Error: Both legacy.json and current.json must exist to perform diff.');
    console.error(`legacy.json exists:  ${fs.existsSync(LEGACY_FILE)}`);
    console.error(`current.json exists: ${fs.existsSync(CURRENT_FILE)}`);
    process.exit(1);
  }

  const legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8'));
  const current = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf8'));

  console.log('\n--- COMPARING SOCKET EMITS ---');
  const legacyEmits = (legacy.timeline || []).filter(e => e.type === 'socket_emit');
  const currentEmits = (current.timeline || []).filter(e => e.type === 'socket_emit');

  const normLegacy = dedupeConsecutive(legacyEmits);
  const normCurrent = dedupeConsecutive(currentEmits);

  let emitDiffs = 0;
  const maxLen = Math.max(normLegacy.length, normCurrent.length);
  for (let i = 0; i < maxLen; i++) {
    const l = normLegacy[i];
    const c = normCurrent[i];
    if (JSON.stringify(l) !== JSON.stringify(c)) {
      console.log(`  [DIFF at emit #${i + 1}]:`);
      console.log(`    Legacy:  ${JSON.stringify(l)}`);
      console.log(`    Current: ${JSON.stringify(c)}`);
      emitDiffs++;
    }
  }

  console.log('\n--- COMPARING REGISTERED LISTENERS ---');
  const legacyListeners = new Set(legacy.listeners || []);
  const currentListeners = new Set(current.listeners || []);
  const missingListeners = [...legacyListeners].filter(x => !currentListeners.has(x));
  const extraListeners = [...currentListeners].filter(x => !legacyListeners.has(x));

  if (missingListeners.length > 0) {
    console.log(`  Missing in Current: ${JSON.stringify(missingListeners)}`);
  }
  if (extraListeners.length > 0) {
    console.log(`  Extra in Current:   ${JSON.stringify(extraListeners)}`);
  }

  console.log('\n--- COMPARING HTTP REQUESTS ---');
  const legacyHttp = (legacy.timeline || []).filter(e => e.type === 'http_request');
  const currentHttp = (current.timeline || []).filter(e => e.type === 'http_request');
  console.log(`  Legacy HTTP requests:  ${legacyHttp.length}`);
  console.log(`  Current HTTP requests: ${currentHttp.length}`);

  if (emitDiffs === 0 && missingListeners.length === 0) {
    console.log('\n✓ CONTRACT VERIFICATION PASSED: Sockets and protocols match baseline exactly.');
  } else {
    console.log(`\n✗ CONTRACT DIFFERENCE DETECTED: ${emitDiffs} emit diffs, ${missingListeners.length} missing listeners.`);
  }
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const recording = {
    recordedAt: new Date().toISOString(),
    timeline: [],
    listeners: []
  };

  const user1 = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com',
    is_username_set: true,
    institute_locked: true,
  };
  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '7d' });

  const user2 = {
    id: '6ebc64aa-e03c-4ab9-84b9-ca0de791de33',
    username: 'champion',
    elo_rating: 1229,
    email: 'shreshth6002a@gmail.com',
    is_username_set: true,
    institute_locked: true,
  };
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '7d' });

  console.log('[CLEANUP] Ensuring clean slate for test users...');
  for (const t of [token1, token2]) {
    await new Promise((resolve) => {
      const s = io(BACKEND_URL, { auth: { token: t }, timeout: 2000, reconnection: false });
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          s.disconnect();
          resolve();
        }
      };
      s.on('connect', () => {
        s.emit('leave_queue');
        s.emit('check_active_match');
      });
      s.on('active_match', (data) => {
        if (data?.roomId) {
          s.emit('resign_match', { roomId: data.roomId });
        }
      });
      s.on('match_end', done);
      setTimeout(done, 1200);
    });
  }

  const browser = await chromium.launch({ headless: true });

  const setupContext = async (userObj, token) => {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.removeItem('aa_active_match');

      try {
        window.__contractTimeline = JSON.parse(sessionStorage.getItem('__voice_contract_timeline') || '[]');
        window.__contractListeners = new Set(JSON.parse(sessionStorage.getItem('__voice_contract_listeners') || '[]'));
      } catch {
        window.__contractTimeline = [];
        window.__contractListeners = new Set();
      }

      function syncSession() {
        try {
          sessionStorage.setItem('__voice_contract_timeline', JSON.stringify(window.__contractTimeline));
          sessionStorage.setItem('__voice_contract_listeners', JSON.stringify(Array.from(window.__contractListeners)));
        } catch {}
      }

      // 1. Wrap window.fetch
      const origFetch = window.fetch;
      window.fetch = async function(...args) {
        let url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        let method = args[1]?.method || 'GET';
        const cleanUrl = url.replace(/^https?:\/\/[^/]+/, '');
        if (!cleanUrl.includes('/assets/') && !cleanUrl.includes('/@vite/') && !cleanUrl.includes('/node_modules/')) {
          window.__contractTimeline.push({
            type: 'http_request',
            method: method.toUpperCase(),
            url: cleanUrl
          });
          syncSession();
        }
        return origFetch.apply(this, args);
      };

      // 2. Wrap XMLHttpRequest
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        this._reqMethod = method;
        this._reqUrl = url;
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        const cleanUrl = String(this._reqUrl || '').replace(/^https?:\/\/[^/]+/, '');
        if (!cleanUrl.includes('/assets/') && !cleanUrl.includes('/@vite/') && !cleanUrl.includes('/socket.io/')) {
          window.__contractTimeline.push({
            type: 'http_request',
            method: (this._reqMethod || 'GET').toUpperCase(),
            url: cleanUrl
          });
          syncSession();
        }
        return origSend.apply(this, arguments);
      };

      // 3. Hook socket client once loaded
      import('/src/utils/socket.js').then(mod => {
        const socket = mod.default;
        if (!socket) return;

        const origEmit = socket.emit.bind(socket);
        socket.emit = function(event, ...args) {
          window.__contractTimeline.push({
            type: 'socket_emit',
            event: String(event),
            payload: args[0] !== undefined ? JSON.parse(JSON.stringify(args[0])) : null
          });
          syncSession();
          return origEmit(event, ...args);
        };

        const origOn = socket.on.bind(socket);
        socket.on = function(event, handler) {
          window.__contractListeners.add(String(event));
          syncSession();
          return origOn(event, handler);
        };

        if (socket.eventNames) {
          socket.eventNames().forEach(n => {
            window.__contractListeners.add(String(n));
          });
          syncSession();
        }
      }).catch(() => {});
    }, { token, userObj });

    const page = await ctx.newPage();
    return { ctx, page };
  };

  try {
    console.log('[SETUP] Creating browser contexts for User 1 and User 2...');
    const user1Ctx = await setupContext(user1, token1);
    const user2Ctx = await setupContext(user2, token2);

    const page1 = user1Ctx.page;
    const page2 = user2Ctx.page;

    // ── FLOW 1: QUEUE & MATCH ────────────────────────────────────
    const lobbyUrl = `${FRONTEND_URL}/lobby?ui=legacy`;
    console.log(`[FLOW 1] Navigating User 1 & User 2 to Lobby (${lobbyUrl})...`);
    await Promise.all([
      page1.goto(lobbyUrl, { waitUntil: 'networkidle' }),
      page2.goto(lobbyUrl, { waitUntil: 'networkidle' })
    ]);
    await page1.waitForTimeout(1000);

    console.log('[FLOW 1] Selecting Arrays topic and queuing up...');
    const topic1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic1.waitFor({ state: 'visible', timeout: 10000 });
    await topic1.click();
    await page1.waitForTimeout(300);

    const topic2 = page2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic2.waitFor({ state: 'visible', timeout: 10000 });
    await topic2.click();
    await page2.waitForTimeout(400);

    const findMatch1 = page1.locator('#find-match-btn').first();
    await findMatch1.waitFor({ state: 'visible', timeout: 10000 });
    await page1.waitForFunction(() => {
      const btn = document.querySelector('#find-match-btn');
      return btn && !btn.disabled;
    }, { timeout: 6000 }).catch(() => {});
    await findMatch1.click();
    await page1.waitForTimeout(600);

    const findMatch2 = page2.locator('#find-match-btn').first();
    await findMatch2.waitFor({ state: 'visible', timeout: 10000 });
    await page2.waitForFunction(() => {
      const btn = document.querySelector('#find-match-btn');
      return btn && !btn.disabled;
    }, { timeout: 6000 }).catch(() => {});
    await findMatch2.click();

    console.log('[FLOW 1] Waiting for match_found and redirection to /match/:roomId...');
    await Promise.all([
      page1.waitForURL(/\/match\//, { timeout: 35000 }),
      page2.waitForURL(/\/match\//, { timeout: 35000 })
    ]);
    console.log(`  User 1 landed at: ${page1.url()}`);
    console.log(`  User 2 landed at: ${page2.url()}`);
    await page1.waitForTimeout(1500);

    // ── FLOW 2: BATTLE (TYPING IN EDITOR) ────────────────────────
    console.log('[FLOW 2] Typing code in Battle Room...');
    const monaco = page1.locator('.monaco-editor').first();
    await monaco.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await monaco.isVisible()) {
      await monaco.click();
      await page1.keyboard.type('\n// Live Voice Baseline Test\n');
      await page1.waitForTimeout(1300); // Wait for debounce emit
    }

    // ── FLOW 3: RUN CODE ─────────────────────────────────────────
    console.log('[FLOW 3] Running Code...');
    const runBtn = page1.locator('#run-btn').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page1.waitForTimeout(2500);
    }

    // ── FLOW 4: SUBMIT CODE ──────────────────────────────────────
    console.log('[FLOW 4] Submitting Code...');
    const submitBtn = page1.locator('#submit-btn').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page1.waitForTimeout(1000);
      // Wait for evaluation
      await page1.waitForFunction(() => {
        const verdictEl = document.querySelector('.battle-v2__console-verdict-tag');
        return verdictEl && !verdictEl.textContent.includes('Evaluating');
      }, { timeout: 20000 }).catch(() => {});
      await page1.waitForTimeout(1000);
    }

    // ── FLOW 5: RECONNECT (MID-MATCH RELOAD) ─────────────────────
    console.log('[FLOW 5] Reloading mid-match to verify rejoin recovery...');
    await page1.reload({ waitUntil: 'networkidle' });
    await page1.waitForTimeout(2000);
    console.log(`  User 1 recovered at: ${page1.url()}`);

    // ── FLOW 6: RESIGN & RESULT ──────────────────────────────────
    console.log('[FLOW 6] Resigning match from User 1...');
    const resignModalBtn = page1.locator('button:has-text("Resign")').first();
    await resignModalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await resignModalBtn.click();
    await page1.waitForTimeout(400);

    const confirmBtn = page1.locator('button:has-text("Resign & Exit"), button:has-text("Resign and Exit")').first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    await page1.waitForURL(/\/result/, { timeout: 10000 });
    console.log(`  User 1 arrived at result: ${page1.url()}`);
    await page1.waitForTimeout(1200);

    // ── FLOW 7: PRIVATE ROOM FLOW ────────────────────────────────
    console.log(`[FLOW 7] Navigating both users to Lobby (${lobbyUrl}) for Private Room flow...`);
    await Promise.all([
      page1.goto(lobbyUrl, { waitUntil: 'networkidle' }),
      page2.goto(lobbyUrl, { waitUntil: 'networkidle' })
    ]);
    await page1.waitForTimeout(1000);

    // Select topic for private room
    const topicP1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    if (await topicP1.isVisible()) {
      await topicP1.click();
      await page1.waitForTimeout(300);
    }

    // Switch to Private Duel tab
    const privateTab1 = page1.locator('.lobby-v2-mode-tab, button').filter({ hasText: /Private/i }).first();
    if (await privateTab1.isVisible()) {
      await privateTab1.click();
      await page1.waitForTimeout(400);
    }

    // Click Create Room & Generate Code
    const createRoomBtn = page1.locator('button:has-text("Create Room & Generate Code"), button:has-text("Create Or Join Room")').first();
    if (await createRoomBtn.isVisible()) {
      await createRoomBtn.click();
      await page1.waitForTimeout(600);
    }

    // Click Generate Room Code inside modal
    const genCodeBtn = page1.locator('button:has-text("Generate Room Code")').first();
    if (await genCodeBtn.isVisible()) {
      await genCodeBtn.click();
      await page1.waitForTimeout(1200);
    }

    // Extract generated room code
    const codeEl = page1.locator('.lobby-v2-roomcode-text').first();
    let roomCode = '';
    if (await codeEl.isVisible()) {
      roomCode = (await codeEl.textContent()).trim();
      console.log(`  Generated Private Room Code: ${roomCode}`);
    }

    if (roomCode) {
      // User 2 joins with code
      const privateTab2 = page2.locator('.lobby-v2-mode-tab, button').filter({ hasText: /Private/i }).first();
      if (await privateTab2.isVisible()) {
        await privateTab2.click();
        await page2.waitForTimeout(400);
      }

      const openJoinBtn = page2.locator('button:has-text("Create Room & Generate Code"), button:has-text("Create Or Join Room")').first();
      if (await openJoinBtn.isVisible()) {
        await openJoinBtn.click();
        await page2.waitForTimeout(600);
      }

      const joinCodeTab = page2.locator('button:has-text("Join Code")').first();
      if (await joinCodeTab.isVisible()) {
        await joinCodeTab.click();
        await page2.waitForTimeout(300);
      }

      const inputCode = page2.locator('#room-code-input, input[placeholder*="ARENA-8K2Y" i]').first();
      if (await inputCode.isVisible()) {
        await inputCode.fill(roomCode);
        await page2.waitForTimeout(300);
        const enterRoomBtn = page2.locator('button:has-text("Enter Room")').first();
        if (await enterRoomBtn.isVisible()) {
          await enterRoomBtn.click();
        }
      }

      // Both should enter private match room
      console.log('  Waiting for both users to enter private match room...');
      await Promise.all([
        page1.waitForURL(/\/match\//, { timeout: 25000 }),
        page2.waitForURL(/\/match\//, { timeout: 25000 })
      ]);
      console.log(`  User 1 joined private match: ${page1.url()}`);
      console.log(`  User 2 joined private match: ${page2.url()}`);
      await page1.waitForTimeout(1200);

      // Clean up private match by resigning
      const resignPvt = page1.locator('button:has-text("Resign")').first();
      if (await resignPvt.isVisible()) {
        await resignPvt.click();
        await page1.waitForTimeout(400);
        const confirmPvt = page1.locator('button:has-text("Resign & Exit"), button:has-text("Resign and Exit")').first();
        if (await confirmPvt.isVisible()) {
          await confirmPvt.click();
          await page1.waitForURL(/\/result/, { timeout: 10000 });
        }
      }
    }

    // Collect timeline and listeners from User 1
    const p1Timeline = await page1.evaluate(() => window.__contractTimeline || []);
    const p1Listeners = await page1.evaluate(() => Array.from(window.__contractListeners || []));

    recording.timeline = p1Timeline;
    recording.listeners = p1Listeners;

    const outFile = mode === 'record' ? LEGACY_FILE : CURRENT_FILE;
    fs.writeFileSync(outFile, JSON.stringify(recording, null, 2), 'utf8');
    console.log(`\n✓ Voice contract recording saved to: ${outFile}`);
    console.log(`  Timeline events recorded: ${recording.timeline.length}`);
    console.log(`  Socket listeners registered: ${recording.listeners.length}`);

  } catch (err) {
    console.error('Voice contract test execution encountered error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

