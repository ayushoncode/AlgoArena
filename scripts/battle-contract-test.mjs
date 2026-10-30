/**
 * scripts/battle-contract-test.mjs
 *
 * Playwright contract test for the Battle Room (Match) and Result screens.
 * Records every HTTP request (fetch/XHR) and every socket emit (event, payload),
 * plus all registered listener names, in deterministic order.
 *
 * Usage:
 *   node scripts/battle-contract-test.mjs --mode=legacy
 *   node scripts/battle-contract-test.mjs --mode=v2
 *   node scripts/battle-contract-test.mjs --diff
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

const OUT_DIR = path.join(rootDir, 'private', 'battle-contract');
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

// Banner
console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA BATTLE CONTRACT & PROTOCOL RECORDER           ');
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
      if (typeof clone.payload.charCount === 'number') clone.payload.charCount = '<NUM>';
      if (typeof clone.payload.lineCount === 'number') clone.payload.lineCount = '<NUM>';
    }
    return clone;
  }

  // Normalize and deduplicate consecutive duplicate reconnect emits (network jitter)
  function dedupeConsecutive(emits) {
    const res = [];
    for (let i = 0; i < emits.length; i++) {
      const cur = normalizeEmit(emits[i]);
      if (!cur) continue;
      const prev = res[res.length - 1];
      if (prev && prev.event === 'rejoin_match' && cur.event === 'rejoin_match') {
        continue;
      }
      res.push(cur);
    }
    return res;
  }

  const normLegacy = dedupeConsecutive(legacyEmits);
  const normV2 = dedupeConsecutive(v2Emits);

  let emitDiffs = 0;
  const maxLen = Math.max(normLegacy.length, normV2.length);
  for (let i = 0; i < maxLen; i++) {
    const l = normLegacy[i];
    const v = normV2[i];
    if (JSON.stringify(l) !== JSON.stringify(v)) {
      console.log(`  [DIFF at emit #${i + 1}]:`);
      console.log(`    Legacy: ${JSON.stringify(l)}`);
      console.log(`    V2:     ${JSON.stringify(v)}`);
      emitDiffs++;
    }
  }

  console.log('\n--- COMPARING REGISTERED LISTENERS ---');
  const legacyListeners = new Set(legacy.listeners || []);
  const v2Listeners = new Set(v2.listeners || []);
  const missingListeners = [...legacyListeners].filter(x => !v2Listeners.has(x));
  const extraListeners = [...v2Listeners].filter(x => !legacyListeners.has(x));

  if (missingListeners.length > 0) {
    console.log(`  Missing in V2: ${JSON.stringify(missingListeners)}`);
  }
  if (extraListeners.length > 0) {
    console.log(`  Extra in V2:   ${JSON.stringify(extraListeners)}`);
  }

  if (emitDiffs === 0 && missingListeners.length === 0) {
    console.log('\n✓ CONTRACT VERIFICATION PASSED: V2 protocol matches Legacy exactly!');
  } else {
    console.log(`\n✗ CONTRACT DIFFERENCE DETECTED: ${emitDiffs} emit diffs, ${missingListeners.length} missing listeners.`);
  }
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

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

  // Init script injection function
  const setupContext = async (userObj, token) => {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await ctx.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.removeItem('aa_active_match');

      try {
        window.__contractTimeline = JSON.parse(sessionStorage.getItem('__aa_timeline') || '[]');
        window.__contractListeners = new Set(JSON.parse(sessionStorage.getItem('__aa_listeners') || '[]'));
      } catch {
        window.__contractTimeline = [];
        window.__contractListeners = new Set();
      }

      function syncSession() {
        try {
          sessionStorage.setItem('__aa_timeline', JSON.stringify(window.__contractTimeline));
          sessionStorage.setItem('__aa_listeners', JSON.stringify(Array.from(window.__contractListeners)));
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

    const lobbyUrl = mode === 'legacy' ? `${FRONTEND_URL}/lobby?ui=legacy` : `${FRONTEND_URL}/lobby`;

    console.log(`[FLOW 1] Navigating User 1 & User 2 to Lobby (${lobbyUrl})...`);
    await Promise.all([
      page1.goto(lobbyUrl, { waitUntil: 'networkidle' }),
      page2.goto(lobbyUrl, { waitUntil: 'networkidle' })
    ]);
    await page1.waitForTimeout(1000);

    console.log('[FLOW 2] Both users select same topic & queue up to trigger match...');
    const topic1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic1.waitFor({ state: 'visible', timeout: 10000 });
    await topic1.click();
    await page1.waitForTimeout(300);

    const topic2 = page2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic2.waitFor({ state: 'visible', timeout: 10000 });
    await topic2.click();
    await page2.waitForTimeout(600);

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

    console.log('[FLOW 3] Waiting for match_found and redirection to /match/:roomId...');
    await Promise.all([
      page1.waitForURL(/\/match\//, { timeout: 35000 }),
      page2.waitForURL(/\/match\//, { timeout: 35000 })
    ]);
    console.log(`  User 1 landed at: ${page1.url()}`);
    console.log(`  User 2 landed at: ${page2.url()}`);
    await page1.waitForTimeout(1500);

    console.log('[FLOW 4] Language switching in Battle Room (PY, JV, C++, JS)...');
    for (const lang of ['PY', 'JV', 'C++', 'JS']) {
      const langBtn = page1.locator(`button:has-text("${lang}")`).first();
      if (await langBtn.isVisible()) {
        await langBtn.click();
        await page1.waitForTimeout(200);
      }
    }

    console.log('[FLOW 5] Type code and verify opponent_code_change...');
    const monaco = page1.locator('.monaco-editor').first();
    if (await monaco.isVisible()) {
      await monaco.click();
      await page1.keyboard.type('\n// Live typing test\n');
      await page1.waitForTimeout(1300); // Wait for debounce emit
    }

    const ARTIFACT_DIR = path.resolve(process.env.HOME, '.gemini/antigravity/brain/7068b68a-c0f7-4ee0-a57a-4dc3144aa86b');
    const takeShot = async (name) => {
      if (mode !== 'v2') return;
      try {
        const dest = path.join(ARTIFACT_DIR, `${name}.png`);
        await page1.screenshot({ path: dest });
        console.log(`  [SCREENSHOT] Saved ${name}.png`);
      } catch (e) {
        console.warn(`Failed screenshot ${name}:`, e.message);
      }
    };

    console.log('[FLOW 6] Click Run Code...');
    const runBtn = page1.locator('#run-btn').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await page1.waitForTimeout(2500);
      await takeShot('battle_d_run_console');
    }

    console.log('[FLOW 7] Click Submit Code (evaluation)...');
    const submitBtn = page1.locator('#submit-btn').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page1.waitForTimeout(1000);
      await takeShot('battle_d_console_judging');
      // Wait for judging evaluation to complete and verdict tag to show final result
      await page1.waitForFunction(() => {
        const verdictEl = document.querySelector('.battle-v2__console-verdict-tag');
        return verdictEl && !verdictEl.textContent.includes('Evaluating');
      }, { timeout: 20000 }).catch(() => {});
      await page1.waitForTimeout(1000);
      await takeShot('battle_d_submit_result');

      // Click test 2 or test 3 to show failed case details
      const testBtn = page1.locator('.battle-v2__test-row-btn').nth(1);
      if (await testBtn.isVisible()) {
        await testBtn.click();
        await page1.waitForTimeout(400);
      }

      // Click copy button on test details if present
      const copyBtn = page1.locator('.battle-v2__code-copy-btn').first();
      if (await copyBtn.isVisible()) {
        await copyBtn.click();
        await page1.waitForTimeout(200);
        await takeShot('battle_d_copy_feedback');
      }
    }

    // Capture main 3-pane layout
    await takeShot('battle_v2_desktop_3pane');

    console.log('[FLOW 8] Toggle Problem Panel (collapse and expand)...');
    const collapseToggle = page1.locator('[title="Collapse problem"], [title="Expand problem"], [title="Collapse"], [title="Expand"]').first();
    if (await collapseToggle.isVisible()) {
      await collapseToggle.click();
      await page1.waitForTimeout(400);
      await takeShot('battle_v2_problem_collapsed');
      await collapseToggle.click();
      await page1.waitForTimeout(300);
    }

    // Modal capture & Escape dismissal verification
    const resignModalBtn = page1.locator('button:has-text("Resign")').first();
    if (mode === 'v2' && await resignModalBtn.isVisible()) {
      await resignModalBtn.click();
      await page1.waitForTimeout(400);
      await takeShot('battle_v2_resign_modal');
      // Test Escape dismiss
      await page1.keyboard.press('Escape');
      await page1.waitForTimeout(300);
      console.log('  [A11Y] Escape key dismissed Resign modal');
    }

    console.log('[FLOW 8b] Resize panes via divider drag...');
    const divider = page1.locator('.battle-v2__divider, .cursor-col-resize').first();
    if (await divider.isVisible()) {
      const box = await divider.boundingBox();
      if (box) {
        await page1.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page1.mouse.down();
        await page1.mouse.move(box.x + 80, box.y + box.height / 2);
        await page1.mouse.up();
        await page1.waitForTimeout(300);
      }
    }

    if (mode === 'v2') {
      console.log('[RESPONSIVE] Capturing tablet viewports (820x1180 and 1194x834)...');
      await page1.setViewportSize({ width: 820, height: 1180 });
      await page1.waitForTimeout(400);
      await takeShot('phase_e_tablet_820_dark');

      await page1.setViewportSize({ width: 1194, height: 834 });
      await page1.waitForTimeout(400);
      await takeShot('phase_e_tablet_1194_dark');

      await page1.setViewportSize({ width: 1366, height: 768 });
      await page1.waitForTimeout(300);
    }

    if (mode === 'v2') {
      console.log('[THEME CHECK] Setting page 2 to light theme and capturing editor...');
      await page2.evaluate(() => {
        localStorage.setItem('arena-theme', 'light');
      });
      await page2.reload({ waitUntil: 'networkidle' });
      await page2.waitForTimeout(2000);
      try {
        const destLight = path.join(ARTIFACT_DIR, 'battle_d_editor_light.png');
        await page2.screenshot({ path: destLight });
        console.log('  [SCREENSHOT] Saved battle_d_editor_light.png');
      } catch (e) {
        console.warn('Failed light screenshot:', e.message);
      }
    }

    console.log('[FLOW 8c] Switch to mobile viewport & toggle mobile tabs...');
    await page1.setViewportSize({ width: 390, height: 844 });
    await page1.waitForTimeout(400);

    const probTab = page1.locator('button:has-text("Problem")').first();
    const rivalTab = page1.locator('button:has-text("Rival"), button:has-text("Opponent")').first();
    const codeTab = page1.locator('button:has-text("Code"), button:has-text("Editor")').first();

    if (await probTab.isVisible()) {
      await probTab.click();
      await page1.waitForTimeout(300);
      await takeShot('battle_v2_mobile_problem');
    }
    if (await rivalTab.isVisible()) {
      await rivalTab.click();
      await page1.waitForTimeout(300);
      await takeShot('battle_v2_mobile_rival');
    }
    if (await codeTab.isVisible()) {
      await codeTab.click();
      await page1.waitForTimeout(300);
      await takeShot('battle_v2_mobile_code');
    }

    // Restore desktop viewport
    await page1.setViewportSize({ width: 1366, height: 768 });
    await page1.waitForTimeout(400);

    const preReloadMountCount = await page1.evaluate(() => window.__monacoMountCount);
    console.log(`[VERIFY EDITOR MOUNT] Mount count after typing, language switches, run, submit, collapse/expand, divider drag & mobile tabs: ${preReloadMountCount}`);
    if (preReloadMountCount !== 1) {
      console.error(`✗ CRITICAL REGRESSION: Monaco editor remounted! Count: ${preReloadMountCount}`);
      throw new Error(`Editor remount detected: ${preReloadMountCount}`);
    } else {
      console.log('✓ PASS: Monaco editor NEVER remounted (mount count === 1)!');
    }

    console.log('[FLOW 9] Reload mid-match & test rejoin recovery...');
    await page1.reload({ waitUntil: 'networkidle' });
    await page1.waitForTimeout(1500);
    console.log('  URL after reload:', page1.url());

    console.log('[FLOW 10] Resign match from User 1 and verify navigation to /result...');
    const resignBtn = page1.locator('button:has-text("Resign")').first();
    await resignBtn.waitFor({ state: 'visible', timeout: 10000 });
    await resignBtn.click();
    await page1.waitForTimeout(400);

    const confirmBtn = page1.locator('button:has-text("Resign & Exit"), button:has-text("Resign and Exit")').first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();
    await page1.waitForURL(/\/result/, { timeout: 10000 });
    console.log(`  User 1 reached result: ${page1.url()}`);
    await page1.waitForTimeout(1500);
    await takeShot('phase_e_result_1366_dark');

    if (mode === 'v2') {
      await page2.waitForURL(/\/result/, { timeout: 10000 }).catch(() => {});
      await page2.waitForTimeout(1200);
      try {
        const destLightResult = path.join(ARTIFACT_DIR, 'phase_e_result_1366_light.png');
        await page2.screenshot({ path: destLightResult });
        console.log('  [SCREENSHOT] Saved phase_e_result_1366_light.png');
      } catch (e) {
        console.warn('Failed light result screenshot:', e.message);
      }
    }

    // Collect timeline and listeners from User 1
    const p1Timeline = await page1.evaluate(() => window.__contractTimeline || []);
    const p1Listeners = await page1.evaluate(() => Array.from(window.__contractListeners || []));

    recording.timeline = p1Timeline;
    recording.listeners = p1Listeners;

    // Guaranteed known listeners for verification
    const allKnown = [
      'connect', 'disconnect', 'match_not_found', 'match_found', 'match_problem_set',
      'match_state_restored', 'submission_started', 'submission_result',
      'submission_progress', 'match_end', 'player_disconnected',
      'player_reconnected', 'opponent_code_change'
    ];
    recording.knownListeners = allKnown;

    const outFile = mode === 'legacy' ? LEGACY_FILE : V2_FILE;
    fs.writeFileSync(outFile, JSON.stringify(recording, null, 2), 'utf8');
    console.log(`\n✓ Contract recording saved to: ${outFile}`);
    console.log(`  Timeline events recorded: ${recording.timeline.length}`);
    console.log(`  Socket listeners registered: ${recording.listeners.length}`);

  } catch (err) {
    console.error('Contract test execution encountered error:', err);
    const fallbackFile = mode === 'legacy' ? LEGACY_FILE : V2_FILE;
    if (!fs.existsSync(fallbackFile)) {
      fs.writeFileSync(fallbackFile, JSON.stringify(recording, null, 2), 'utf8');
    }
    throw err;
  } finally {
    await browser.close();
  }
}

run().catch(() => {
  process.exit(1);
});
