/**
 * scripts/nav-contract-test.mjs
 * 
 * AlgoArena Navbar Contract Test & Protocol Verification
 * Records every fetch, XHR, and socket emit during navbar interaction flows:
 *   1. Loading the lobby
 *   2. Opening the profile menu
 *   3. Toggling theme
 *   4. Going to Profile and Intel Reports
 *   5. Loading the lobby daily card
 *   6. Selecting the daily challenge in the Lobby
 *   7. Starting a queue and cancelling
 *   8. Signing out
 *
 * Usage:
 *   node scripts/nav-contract-test.mjs --mode=legacy
 *   node scripts/nav-contract-test.mjs --mode=v2
 *   node scripts/nav-contract-test.mjs --diff
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

// Parse CLI flags
const args = process.argv.slice(2);
let mode = 'legacy'; // 'legacy' | 'v2' | 'diff'
for (const arg of args) {
  if (arg.startsWith('--mode=')) mode = arg.split('=')[1];
  if (arg === '--legacy') mode = 'legacy';
  if (arg === '--v2') mode = 'v2';
  if (arg === '--diff') mode = 'diff';
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA NAVBAR CONTRACT & INTERACTION RECORDER        ');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`[SAFETY CHECK] Target Mode:      ${mode.toUpperCase()}`);
console.log(`[SAFETY CHECK] Dev Frontend:     ${FRONTEND_URL}`);
console.log(`[SAFETY CHECK] Dev Backend:      ${BACKEND_URL}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (mode === 'diff') {
  runDiff();
  process.exit(0);
}

function runDiff() {
  const legacyPath = path.join(rootDir, 'private', 'nav-contract', 'legacy.json');
  const v2Path = path.join(rootDir, 'private', 'nav-contract', 'v2.json');

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

  let emitDiffs = 0;
  const maxLen = Math.max(legacyEmits.length, v2Emits.length);
  for (let i = 0; i < maxLen; i++) {
    const l = legacyEmits[i];
    const v = v2Emits[i];
    if (JSON.stringify(l) !== JSON.stringify(v)) {
      console.log(`  [DIFF at emit #${i + 1}]:`);
      console.log(`    Legacy: ${JSON.stringify(l)}`);
      console.log(`    V2:     ${JSON.stringify(v)}`);
      emitDiffs++;
    }
  }

  console.log('\n--- COMPARING HTTP REQUESTS ---');
  const legacyReqs = legacy.timeline.filter(e => e.type === 'http_request');
  const v2Reqs = v2.timeline.filter(e => e.type === 'http_request');

  // Filter allowed additive read-only requests in v2
  const allowedExtra = new Set([
    'GET /api/problems/daily',
    'GET /api/users/me/elo-history'
  ]);

  let reqDiffs = 0;
  const v2NonAdditiveReqs = v2Reqs.filter(r => !allowedExtra.has(`${r.method} ${r.url.split('?')[0]}`));

  console.log(`  Legacy Requests Total: ${legacyReqs.length}`);
  console.log(`  V2 Requests Total:     ${v2Reqs.length} (${v2Reqs.length - v2NonAdditiveReqs.length} authorized additive read-only)`);

  if (emitDiffs === 0) {
    console.log('\n✓ SOCKET CONTRACT VERIFICATION PASSED: Emits match exactly!');
  } else {
    console.log(`\n✗ SOCKET DIFFERENCE DETECTED: ${emitDiffs} emit diffs.`);
  }
}

async function run() {
  const recording = {
    mode,
    timestamp: new Date().toISOString(),
    timeline: [],
    listeners: []
  };

  const user = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1174,
    email: 'ayush@example.com'
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Inject tracking hooks
  await page.addInitScript(({ token, userObj }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(userObj));

    window.__contractTimeline = [];
    window.__contractListeners = new Set();

    // 1. Wrap window.fetch
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
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
    XMLHttpRequest.prototype.open = function (method, url) {
      this._reqMethod = method;
      this._reqUrl = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
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

    // 3. Hook socket client
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      if (!socket) return;

      const origEmit = socket.emit.bind(socket);
      socket.emit = function (event, ...args) {
        window.__contractTimeline.push({
          type: 'socket_emit',
          event: String(event),
          payload: args[0] !== undefined ? JSON.parse(JSON.stringify(args[0])) : null
        });
        return origEmit(event, ...args);
      };

      const origOn = socket.on.bind(socket);
      socket.on = function (event, handler) {
        window.__contractListeners.add(String(event));
        return origOn(event, handler);
      };
    }).catch(() => { });
  }, { token, userObj: user });

  const uiQuery = mode === 'legacy' ? '?ui=legacy' : '';

  try {
    // FLOW 1: Loading the Lobby
    console.log('[FLOW 1] Loading Lobby...');
    await page.goto(`${FRONTEND_URL}/lobby${uiQuery}`);
    await page.waitForTimeout(2000);

    // FLOW 2: Opening the profile menu
    console.log('[FLOW 2] Opening Profile Menu...');
    const userBtn = page.locator('nav #nav-user-btn, nav button[aria-label="Account menu"]').first();
    if (await userBtn.isVisible()) {
      await userBtn.click();
      await page.waitForTimeout(500);
    }

    // FLOW 3: Toggling theme
    console.log('[FLOW 3] Toggling Theme...');
    const themeBtn = page.locator('button[aria-label="Toggle theme"], button:has-text("Appearance"), button:has-text("Dark"), button:has-text("Light")').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(400);
    }

    // FLOW 4: Navigating to Profile and Intel Reports
    console.log('[FLOW 4] Navigating to Profile and Intel Reports...');
    let profileLink = page.locator('#dd-profile, a[href="/profile"], button:has-text("Profile")').first();
    if (!await profileLink.isVisible()) {
      const userBtn = page.locator('nav #nav-user-btn, nav button[aria-label="Account menu"]').first();
      if (await userBtn.isVisible()) {
        await userBtn.click();
        await page.waitForTimeout(300);
      }
    }
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForTimeout(1500);
    }

    const intelLink = page.locator('nav a[href="/experiences"]').first();
    if (await intelLink.isVisible()) {
      await intelLink.click();
      await page.waitForTimeout(1500);
    }

    // FLOW 5: Loading the Lobby daily card
    console.log('[FLOW 5] Loading Lobby Daily Card...');
    await page.goto(`${FRONTEND_URL}/lobby${uiQuery}`);
    await page.waitForTimeout(2000);

    // FLOW 6: Selecting the daily challenge in the Lobby
    console.log('[FLOW 6] Selecting Daily Challenge in Lobby...');
    const dailyBtn = page.locator('.lobby-v2-daily-btn, button:has-text("Daily Challenge"), button:has-text("Daily")').first();
    await dailyBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await dailyBtn.isVisible()) {
      await dailyBtn.click();
      await page.waitForTimeout(800);
    }

    // FLOW 7: Starting a queue and cancelling
    console.log('[FLOW 7] Starting queue and cancelling...');
    const findMatchBtn = page.locator('#find-match-btn, button:has-text("Find Match"), button:has-text("Deploy")').first();
    if (await findMatchBtn.isVisible() && await findMatchBtn.isEnabled()) {
      await findMatchBtn.click();
      await page.waitForTimeout(1000);
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // FLOW 8: Signing out
    console.log('[FLOW 8] Signing Out...');
    const userBtnAgain = page.locator('nav #nav-user-btn, nav button[aria-label="Account menu"]').first();
    if (await userBtnAgain.isVisible()) {
      await userBtnAgain.click();
      await page.waitForTimeout(400);
      const logoutBtn = page.locator('#nav-logout, button:has-text("Sign Out")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Collect recorded telemetry
    const results = await page.evaluate(() => ({
      timeline: window.__contractTimeline || [],
      listeners: Array.from(window.__contractListeners || [])
    }));

    recording.timeline = results.timeline;
    recording.listeners = results.listeners;

    const outDir = path.join(rootDir, 'private', 'nav-contract');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${mode}.json`);
    fs.writeFileSync(outFile, JSON.stringify(recording, null, 2), 'utf8');

    console.log(`\n✓ Contract recording complete: ${outFile}`);
    console.log(`  Events recorded: ${recording.timeline.length}`);
    console.log(`  Listeners recorded: ${recording.listeners.length}`);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
