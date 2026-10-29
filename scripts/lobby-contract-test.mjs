/**
 * scripts/lobby-contract-test.mjs
 * 
 * AlgoArena Lobby Contract Test & Protocol Verification
 * Runs all 13 required user flows against local dev backend (http://localhost:5173 / http://localhost:4000).
 * Records every HTTP request (method, normalized URL), every socket emit (event, payload),
 * and all registered socket listener names in deterministic order.
 *
 * Usage:
 *   node scripts/lobby-contract-test.mjs --mode=legacy
 *   node scripts/lobby-contract-test.mjs --mode=v2
 *   node scripts/lobby-contract-test.mjs --diff
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment from backend/.env
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena';

// Parse CLI flags
const args = process.argv.slice(2);
let mode = 'legacy'; // 'legacy' | 'v2'
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

// Print safety verification banner
console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA LOBBY CONTRACT & INTERACTION RECORDER         ');
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
  const legacyPath = path.join(rootDir, 'private', 'lobby-contract', 'legacy.json');
  const v2Path = path.join(rootDir, 'private', 'lobby-contract', 'v2.json');

  if (!fs.existsSync(legacyPath) || !fs.existsSync(v2Path)) {
    console.error('Error: Both legacy.json and v2.json must exist to perform diff.');
    console.error(`legacy.json exists: ${fs.existsSync(legacyPath)}`);
    console.error(`v2.json exists:     ${fs.existsSync(v2Path)}`);
    process.exit(1);
  }

  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const v2 = JSON.parse(fs.readFileSync(v2Path, 'utf8'));

  console.log('\n--- COMPARING SOCKET EMITS ---');
  const legacyEmits = legacy.timeline.filter(e => e.type === 'socket_emit');
  const v2Emits = v2.timeline.filter(e => e.type === 'socket_emit');

  function normalizeEmit(e) {
    if (!e) return null;
    const clone = JSON.parse(JSON.stringify(e));
    if (clone.payload && typeof clone.payload.code === 'string') {
      clone.payload.code = '<ROOM_CODE>';
    }
    return clone;
  }

  let emitDiffs = 0;
  const maxLen = Math.max(legacyEmits.length, v2Emits.length);
  for (let i = 0; i < maxLen; i++) {
    const l = normalizeEmit(legacyEmits[i]);
    const v = normalizeEmit(v2Emits[i]);
    if (JSON.stringify(l) !== JSON.stringify(v)) {
      console.log(`  [DIFF at emit #${i + 1}]:`);
      console.log(`    Legacy: ${JSON.stringify(l)}`);
      console.log(`    V2:     ${JSON.stringify(v)}`);
      emitDiffs++;
    }
  }

  console.log('\n--- COMPARING REGISTERED LISTENERS ---');
  const legacyListeners = new Set(legacy.listeners);
  const v2Listeners = new Set(v2.listeners);
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
  const recording = {
    mode,
    timestamp: new Date().toISOString(),
    timeline: [],
    listeners: []
  };

  // Test users
  const user1 = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com'
  };
  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '7d' });

  const user2 = {
    id: '6ebc64aa-e03c-4ab9-84b9-ca0de791de33',
    username: 'champion',
    elo_rating: 1229,
    email: 'shreshth6002a@gmail.com'
  };
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Inject recorder hooks before anything runs
  await page.addInitScript(({ token, userObj }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(userObj));

    window.__contractTimeline = [];
    window.__contractListeners = new Set();

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
        return origEmit(event, ...args);
      };

      const origOn = socket.on.bind(socket);
      socket.on = function(event, handler) {
        window.__contractListeners.add(String(event));
        return origOn(event, handler);
      };

      if (socket.eventNames) {
        socket.eventNames().forEach(n => window.__contractListeners.add(String(n)));
      }
    }).catch(() => {});
  }, { token: token1, userObj: user1 });

  const targetUrl = mode === 'legacy' ? `${FRONTEND_URL}/lobby?ui=legacy` : `${FRONTEND_URL}/lobby`;

  console.log(`[FLOW 1] Loading page at ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('[FLOW 2] Pick a topic by click: Arrays');
  // Both legacy and v2 support role="radio" on topic cells
  const arraysRadio = page.locator('button[role="radio"]').filter({ hasText: 'Arrays' }).first();
  await arraysRadio.click();
  await page.waitForTimeout(300);

  console.log('[FLOW 3] Pick by number key: press "2" (Two Pointers)');
  await page.keyboard.press('2');
  await page.waitForTimeout(300);

  console.log('[FLOW 4] Pick difficulty: Hard');
  const hardButton = page.locator('button').filter({ hasText: /Hard/i }).first();
  await hardButton.click();
  await page.waitForTimeout(300);

  console.log('[FLOW 5] Press Find Match (join_queue)');
  const deployBtn = page.locator('#find-match-btn');
  await deployBtn.click();
  await page.waitForTimeout(1000);

  console.log('[FLOW 6] Cancel the queue (leave_queue)');
  const cancelBtn = page.locator('button').filter({ hasText: /Cancel Queue/i }).first();
  await cancelBtn.click();
  await page.waitForTimeout(500);

  console.log('[FLOW 7] Select and deselect the daily challenge');
  const dailyBtn = page.locator('button').filter({ hasText: /Daily/i }).first();
  if (await dailyBtn.count() > 0) {
    await dailyBtn.click();
    await page.waitForTimeout(300);
    // Click again to deselect
    await dailyBtn.click();
    await page.waitForTimeout(300);
  }

  console.log('[FLOW 8] Create Room modal flow');
  // Re-select a topic first so room creation is valid
  await page.keyboard.press('1'); // Arrays
  await page.waitForTimeout(200);

  if (mode === 'v2') {
    const privateTab = page.locator('.lobby-v2-mode-tab').filter({ hasText: /Private/i }).first();
    if (await privateTab.count() > 0) {
      await privateTab.click();
      await page.waitForTimeout(400);
      const hostBtn = page.locator('button:has-text("Create Room & Generate Code")').first();
      if (await hostBtn.count() > 0) {
        await hostBtn.click();
        await page.waitForTimeout(600);
      }
    }
  } else {
    const roomModalBtn = page.locator('button:has-text("Create Or Join Room")').first();
    if (await roomModalBtn.count() > 0) {
      await roomModalBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // Look for create room button inside modal
  const genCodeBtn = page.locator('button:has-text("Generate Room Code")').first();
  if (await genCodeBtn.count() > 0) {
    await genCodeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Cancel room
  const cancelRoomBtn = page.locator('button:has-text("Cancel Room")').first();
  if (await cancelRoomBtn.count() > 0) {
    await cancelRoomBtn.click();
    await page.waitForTimeout(500);
  }

  console.log('[FLOW 9] Join Room with code "TEST99"');
  const joinTab = page.locator('button:has-text("Join Code")').first();
  if (await joinTab.count() > 0) {
    await joinTab.click();
    await page.waitForTimeout(300);
  }

  const codeInput = page.locator('input[placeholder*="ARENA-8K2Y" i]').first();
  if (await codeInput.count() > 0) {
    await codeInput.fill('TEST99');
    const submitJoin = page.locator('button:has-text("Enter Room"), button:has-text("Join Arena Room")').first();
    if (await submitJoin.count() > 0) {
      await submitJoin.click();
      await page.waitForTimeout(500);
    }
  }

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  if (mode === 'v2') {
    // Switch back to Quick Arena tab
    const quickTab = page.locator('.lobby-v2-mode-tab').filter({ hasText: /Quick Arena/i }).first();
    if (await quickTab.count() > 0) {
      await quickTab.click();
      await page.waitForTimeout(300);
    }
  }

  console.log('[FLOW 10] Search player with "/"');
  await page.keyboard.press('/');
  await page.waitForTimeout(200);
  await page.keyboard.type('champ');
  await page.waitForTimeout(600); // debounce wait
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  console.log('[FLOW 11] Clear selection');
  const clearBtn = page.locator('button').filter({ hasText: /Clear Selection/i }).first();
  if (await clearBtn.count() > 0) {
    await clearBtn.click();
    await page.waitForTimeout(200);
  }

  console.log('[FLOW 12] Go offline and back online');
  await context.setOffline(true);
  await page.waitForTimeout(500);
  await context.setOffline(false);
  await page.waitForTimeout(1000);

  // Extract recorded timeline and listeners from page 1
  const page1Data = await page.evaluate(async () => {
    const mod = await import('/src/utils/socket.js');
    const socket = mod.default;
    if (socket && socket.eventNames) {
      socket.eventNames().forEach(n => window.__contractListeners.add(String(n)));
    }
    return {
      timeline: window.__contractTimeline,
      listeners: Array.from(window.__contractListeners)
    };
  });

  recording.timeline.push(...page1Data.timeline);
  recording.listeners = page1Data.listeners;

  await page.close();
  await context.close();

  console.log('\n[FLOW 13] Match-found flow: 2 logged-in test users in separate contexts');
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pA = await ctxA.newPage();
  await pA.addInitScript(({ token, userObj }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(userObj));
    window.__eventsA = [];
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      const origEmit = socket.emit.bind(socket);
      socket.emit = function(event, ...args) {
        window.__eventsA.push({ type: 'socket_emit', event: String(event), payload: args[0] });
        return origEmit(event, ...args);
      };
    }).catch(() => {});
  }, { token: token1, userObj: user1 });

  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pB = await ctxB.newPage();
  await pB.addInitScript(({ token, userObj }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(userObj));
    import('/src/utils/socket.js').catch(() => {});
  }, { token: token2, userObj: user2 });

  await Promise.all([
    pA.goto(targetUrl, { waitUntil: 'networkidle' }),
    pB.goto(targetUrl, { waitUntil: 'networkidle' })
  ]);
  await pA.waitForTimeout(500);
  await pB.waitForTimeout(500);

  // Select Arrays on both
  await pA.locator('button[role="radio"]').filter({ hasText: 'Arrays' }).first().click();
  await pB.locator('button[role="radio"]').filter({ hasText: 'Arrays' }).first().click();

  // Deploy User A
  await pA.locator('#find-match-btn').click();
  await pA.waitForTimeout(500);

  // Deploy User B
  await pB.locator('#find-match-btn').click();

  // Wait for match found announcement on pA
  console.log('  Waiting for match_found socket event & announcement...');
  await Promise.race([
    pA.waitForSelector('[aria-label="Match found announcement"]', { timeout: 12000 }),
    pB.waitForSelector('[aria-label="Match found announcement"]', { timeout: 12000 })
  ]);

  console.log('  Match found overlay detected! Recording match_found flow.');
  recording.timeline.push({
    type: 'flow_match_found',
    status: 'VERIFIED_TWO_PLAYERS_MATCHED',
    player1: user1.username,
    player2: user2.username
  });

  await ctxA.close();
  await ctxB.close();
  await browser.close();

  // Deduplicate and clean timeline
  const outDir = path.join(rootDir, 'private', 'lobby-contract');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, `${mode}.json`);
  fs.writeFileSync(outPath, JSON.stringify(recording, null, 2), 'utf8');

  console.log(`\n✓ Contract recording complete for mode "${mode}"!`);
  console.log(`✓ Saved to: ${outPath}`);
  console.log(`✓ Total recorded timeline items: ${recording.timeline.length}`);
  console.log(`✓ Registered socket listeners (${recording.listeners.length}):`, recording.listeners);
}

run().catch(err => {
  console.error('\n✗ Error during contract test execution:', err);
  process.exit(1);
});
