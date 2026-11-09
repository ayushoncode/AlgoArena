/**
 * scripts/social-contract-test.mjs
 *
 * Playwright contract test for AlgoArena Social & Notification Centre features.
 * Records every HTTP request (fetch / XHR) and every socket emit (event, payload),
 * plus all registered listener names, in deterministic order across:
 *   1. Load lobby (/lobby)
 *   2. Navbar open and close
 *   3. User search (Roster search autocomplete)
 *   4. Private room create and join (Custom rooms)
 *   5. Queue and match (Matchmaking)
 *   6. Battle (Editor, language switch, typing)
 *   7. Run code
 *   8. Submit code (Judge evaluation)
 *   9. Resign & forfeit
 *  10. Result screen (/result)
 *  11. Profile (Own profile /profile)
 *  12. Another user's profile (/profile/:username)
 *  13. Leaderboard (/leaderboard)
 *
 * Usage:
 *   node scripts/social-contract-test.mjs --legacy
 *   node scripts/social-contract-test.mjs --v2
 *   node scripts/social-contract-test.mjs --diff
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

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena';

const OUT_DIR = path.join(rootDir, 'private', 'social-contract');
const LEGACY_FILE = path.join(OUT_DIR, 'legacy.json');
const V2_FILE = path.join(OUT_DIR, 'v2.json');

// Parse CLI flags
const args = process.argv.slice(2);
let mode = 'legacy'; // 'legacy' | 'v2' | 'diff'
for (const arg of args) {
  if (arg.startsWith('--mode=')) mode = arg.split('=')[1];
  if (arg === '--legacy') mode = 'legacy';
  if (arg === '--v2') mode = 'v2';
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

console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA SOCIAL & NOTIFICATION CONTRACT RECORDER       ');
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
  if (clone.event === 'code_change' && clone.payload) {
    clone.payload.charCount = '<CHAR_COUNT>';
    clone.payload.lineCount = '<LINE_COUNT>';
  }
  return clone;
}

function normalizeUrl(url) {
  if (!url) return '';
  let u = url.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>');
  if (u.startsWith('/api/premium/badges?')) {
    u = '/api/premium/badges';
  }
  return u;
}

function runDiff() {
  if (!fs.existsSync(LEGACY_FILE) || !fs.existsSync(V2_FILE)) {
    console.error('Error: Both legacy.json and v2.json must exist to perform diff.');
    console.error(`legacy.json exists: ${fs.existsSync(LEGACY_FILE)}`);
    console.error(`v2.json exists:     ${fs.existsSync(V2_FILE)}`);
    process.exit(1);
  }

  const legacy = JSON.parse(fs.readFileSync(LEGACY_FILE, 'utf8'));
  const v2 = JSON.parse(fs.readFileSync(V2_FILE, 'utf8'));

  console.log('\n--- COMPARING SOCKET EMITS ---');
  const legacyEmits = (legacy.timeline || []).filter(e => e.type === 'socket_emit');
  const v2Emits = (v2.timeline || []).filter(e => e.type === 'socket_emit');

  let emitDiffs = 0;
  const maxLen = Math.max(legacyEmits.length, v2Emits.length);
  for (let i = 0; i < maxLen; i++) {
    const l = normalizeEmit(legacyEmits[i]);
    const v = normalizeEmit(v2Emits[i]);
    const lStr = JSON.stringify(l);
    const vStr = JSON.stringify(v);
    if (lStr !== vStr) {
      console.log(`[DIFF @ emit #${i}]`);
      console.log(`  LEGACY: ${lStr || '<none>'}`);
      console.log(`  V2:     ${vStr || '<none>'}`);
      emitDiffs++;
    }
  }
  if (emitDiffs === 0) {
    console.log(`✓ Socket emits match perfectly (${legacyEmits.length} events verified).`);
  }

  console.log('\n--- COMPARING HTTP REQUESTS ---');
  const legacyReqs = (legacy.timeline || []).filter(e => e.type === 'http_request');
  const v2Reqs = (v2.timeline || []).filter(e => e.type === 'http_request');

  let reqDiffs = 0;
  const maxReqLen = Math.max(legacyReqs.length, v2Reqs.length);
  for (let i = 0; i < maxReqLen; i++) {
    const l = legacyReqs[i];
    const v = v2Reqs[i];
    const lStr = l ? `${l.method} ${normalizeUrl(l.url)}` : '<none>';
    const vStr = v ? `${v.method} ${normalizeUrl(v.url)}` : '<none>';
    if (lStr !== vStr) {
      console.log(`[DIFF @ req #${i}]`);
      console.log(`  LEGACY: ${lStr}`);
      console.log(`  V2:     ${vStr}`);
      reqDiffs++;
    }
  }
  if (reqDiffs === 0) {
    console.log(`✓ HTTP requests match perfectly (${legacyReqs.length} requests verified).`);
  }

  console.log('\n--- COMPARING SOCKET LISTENERS ---');
  const legListeners = new Set(legacy.listeners || []);
  const v2Listeners = new Set(v2.listeners || []);
  const missingListeners = [...legListeners].filter(x => !v2Listeners.has(x));
  const newListeners = [...v2Listeners].filter(x => !legListeners.has(x));

  if (missingListeners.length > 0) {
    console.log(`✗ Missing socket listeners in V2: ${missingListeners.join(', ')}`);
  } else {
    console.log('✓ All legacy socket listeners preserved in V2.');
  }

  if (newListeners.length > 0) {
    console.log(`ℹ New socket listeners in V2 (social/notif additions): ${newListeners.join(', ')}`);
  }

  if (emitDiffs === 0 && missingListeners.length === 0) {
    console.log('\n✓ CONTRACT VERIFICATION PASSED: Core protocol matches Legacy baseline!');
  } else {
    console.log(`\n✗ CONTRACT DIFFERENCE DETECTED: ${emitDiffs} emit diffs, ${missingListeners.length} missing listeners.`);
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const recording = {
    mode,
    timestamp: new Date().toISOString(),
    timeline: [],
    listeners: []
  };

  const user1 = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com',
  };
  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '7d' });

  const user2 = {
    id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
    username: 'ayush_ayush',
    elo_rating: 1229,
    email: '1ms24is030@msrit.edu',
  };
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '7d' });

  console.log('[CLEANUP] Resetting active matches for test users...');
  for (const t of [token1, token2]) {
    await new Promise((resolve) => {
      const s = io(BACKEND_URL, { auth: { token: t }, timeout: 2500, reconnection: false });
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
      setTimeout(done, 1500);
    });
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const setupContext = async (userObj, token) => {
    const ctx = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      permissions: ['microphone'],
    });

    await ctx.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('algoarena_voice_ack', 'true');
      localStorage.removeItem('aa_active_match');

      try {
        window.__contractTimeline = JSON.parse(sessionStorage.getItem('__social_contract_timeline') || '[]');
        window.__contractListeners = new Set(JSON.parse(sessionStorage.getItem('__social_contract_listeners') || '[]'));
      } catch {
        window.__contractTimeline = [];
        window.__contractListeners = new Set();
      }

      function syncSession() {
        try {
          sessionStorage.setItem('__social_contract_timeline', JSON.stringify(window.__contractTimeline));
          sessionStorage.setItem('__social_contract_listeners', JSON.stringify(Array.from(window.__contractListeners)));
        } catch {}
      }

      // Intercept window.fetch
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

      // Intercept XMLHttpRequest
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

      // Intercept Socket client
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

    // ── FLOW 1: Lobby Load ───────────────────────────────────────────────────
    console.log('[FLOW 1] Navigating User 1 & User 2 to Lobby (/lobby)...');
    await Promise.all([
      page1.goto(`${FRONTEND_URL}/lobby`),
      page2.goto(`${FRONTEND_URL}/lobby`),
    ]);
    await Promise.all([
      page1.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle'),
    ]);
    await page1.waitForTimeout(1000);

    // ── FLOW 2: Navbar Open & Close ──────────────────────────────────────────
    console.log('[FLOW 2] Testing Navbar Open and Close...');
    const avatarBtn = page1.locator('#nav-user-btn, button[aria-label="User profile menu"]').first();
    if (await avatarBtn.isVisible()) {
      await avatarBtn.click();
      await page1.waitForTimeout(400);
      // Close by clicking outside or pressing Escape
      await page1.keyboard.press('Escape');
      await page1.waitForTimeout(300);
    }

    // ── FLOW 3: User Search ──────────────────────────────────────────────────
    console.log('[FLOW 3] Testing User Search in Lobby (Roster Search)...');
    const searchInput = page1.locator('input[aria-label="Search roster by username"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('ayush');
      await page1.waitForTimeout(600);
      await searchInput.fill('');
      await page1.waitForTimeout(300);
    }

    // ── FLOW 4: Private Room Create & Join ───────────────────────────────────
    console.log('[FLOW 4] Testing Private Room Create & Join via Socket/UI...');
    await page1.evaluate(async () => {
      const socketMod = await import('/src/utils/socket.js');
      const socket = socketMod.default;
      if (socket) {
        socket.emit('create_custom_room', { topic: 'arrays', difficulty: 'easy' });
        await new Promise(r => setTimeout(r, 600));
        socket.emit('cancel_custom_room', { code: 'DUMMY' });
        await new Promise(r => setTimeout(r, 300));
      }
    });
    await page1.waitForTimeout(500);

    // ── FLOW 5: Queue and Match ──────────────────────────────────────────────
    console.log('[FLOW 5] Selecting topic and initiating matchmaking queue...');
    const topic1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic1.waitFor({ state: 'visible', timeout: 10000 });
    await topic1.click();
    await page1.waitForTimeout(300);

    const topic2 = page2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic2.waitFor({ state: 'visible', timeout: 10000 });
    await topic2.click();
    await page2.waitForTimeout(400);

    const findMatch1 = page1.locator('#find-match-btn').first();
    await page1.waitForFunction(() => {
      const btn = document.querySelector('#find-match-btn');
      return btn && !btn.disabled;
    }, { timeout: 6000 }).catch(() => {});
    await findMatch1.click();
    await page1.waitForTimeout(600);

    const findMatch2 = page2.locator('#find-match-btn').first();
    await page2.waitForFunction(() => {
      const btn = document.querySelector('#find-match-btn');
      return btn && !btn.disabled;
    }, { timeout: 6000 }).catch(() => {});
    await findMatch2.click();

    console.log('  Waiting for match_found and redirection to /match/:roomId...');
    await Promise.all([
      page1.waitForURL(/\/match\//, { timeout: 35000 }),
      page2.waitForURL(/\/match\//, { timeout: 35000 }),
    ]);
    console.log(`  User 1 URL: ${page1.url()}`);
    console.log(`  User 2 URL: ${page2.url()}`);
    
    // Wait for match countdown overlay to clear
    console.log('  Waiting for match start countdown overlay to clear...');
    await Promise.all([
      page1.waitForTimeout(4000),
      page2.waitForTimeout(4000),
    ]);

    // ── FLOW 6: Battle Room (Language & Typing) ──────────────────────────────
    console.log('[FLOW 6] Battle Room language switching and code typing...');
    for (const lang of ['PY', 'JV', 'C++', 'JS']) {
      const langBtn = page1.locator(`button:has-text("${lang}")`).first();
      if (await langBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await langBtn.click();
        await page1.waitForTimeout(150);
      }
    }

    const monaco = page1.locator('.monaco-editor').first();
    if (await monaco.isVisible({ timeout: 3000 }).catch(() => false)) {
      await monaco.click();
      await page1.keyboard.type('\n// Live typing test\n');
      await page1.waitForTimeout(1300); // Wait for debounce emit
    }

    // ── FLOW 7: Run Code ─────────────────────────────────────────────────────
    console.log('[FLOW 7] Clicking Run Code...');
    const runBtn = page1.locator('#run-btn').first();
    if (await runBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await runBtn.click();
      await page1.waitForTimeout(2500);
    }

    // ── FLOW 8: Submit Code ──────────────────────────────────────────────────
    console.log('[FLOW 8] Clicking Submit Code...');
    const submitBtn = page1.locator('#submit-btn').first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
      await page1.waitForFunction(() => {
        const verdictEl = document.querySelector('.battle-v2__console-verdict-tag, .run-console-v2__verdict-tag');
        return verdictEl && !verdictEl.textContent.includes('Evaluating');
      }, { timeout: 20000 }).catch(() => {});
      await page1.waitForTimeout(1000);
    }

    // ── FLOW 9: Resign ───────────────────────────────────────────────────────
    console.log('[FLOW 9] User 2 resigns to end match and transition to results...');
    const resignBtn = page2.locator('button.battle-v2__resign-btn, button[aria-label="Resign and exit match"], button:has-text("Resign")').first();
    await resignBtn.waitFor({ state: 'visible', timeout: 15000 });
    await resignBtn.click();
    await page2.waitForTimeout(500);

    const confirmResignBtn = page2.locator('button:has-text("Resign & Exit"), button:has-text("Resign and Exit"), button.battle-v2__modal-confirm-btn').first();
    await confirmResignBtn.waitFor({ state: 'visible', timeout: 8000 });
    await confirmResignBtn.click();

    // ── FLOW 10: Result Screen ───────────────────────────────────────────────
    console.log('[FLOW 10] Waiting for navigation to Result screen (/result)...');
    await Promise.all([
      page1.waitForURL(/\/result/, { timeout: 15000 }),
      page2.waitForURL(/\/result/, { timeout: 15000 }),
    ]);
    console.log(`  User 1 at Result screen: ${page1.url()}`);
    await page1.waitForTimeout(1500);

    // ── FLOW 11: Own Profile ─────────────────────────────────────────────────
    console.log('[FLOW 11] Navigating User 1 to Own Profile page (/profile)...');
    await page1.goto(`${FRONTEND_URL}/profile`);
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(1500);

    // ── FLOW 12: Another User's Profile ──────────────────────────────────────
    console.log('[FLOW 12] Navigating User 1 to Another User Profile (/profile/ayush_ayush)...');
    await page1.goto(`${FRONTEND_URL}/profile/ayush_ayush`);
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(1500);

    // ── FLOW 13: Leaderboard ─────────────────────────────────────────────────
    console.log('[FLOW 13] Navigating User 1 to Leaderboard page (/leaderboard)...');
    await page1.goto(`${FRONTEND_URL}/leaderboard`);
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(1500);

    // Collect timeline and listeners
    const timeline = await page1.evaluate(() => window.__contractTimeline || []);
    const listeners = await page1.evaluate(() => Array.from(window.__contractListeners || []));

    recording.timeline = timeline;
    recording.listeners = listeners;

    const targetFile = mode === 'v2' ? V2_FILE : LEGACY_FILE;
    fs.writeFileSync(targetFile, JSON.stringify(recording, null, 2), 'utf8');

    console.log(`\n✓ Contract recording complete! Saved ${timeline.length} events to ${targetFile}`);
    console.log(`  HTTP requests: ${timeline.filter(e => e.type === 'http_request').length}`);
    console.log(`  Socket emits:  ${timeline.filter(e => e.type === 'socket_emit').length}`);
    console.log(`  Socket listeners registered: ${listeners.length}`);

  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n✗ Contract test failed with error:\n', err);
  process.exit(1);
});
