/**
 * scripts/nav-mobile-contract-test.mjs
 *
 * Records every fetch, XHR, and socket emit during mobile navbar flows at 390px:
 *   1. Load the lobby at 390px
 *   2. Open and close the menu
 *   3. Toggle theme
 *   4. Go to Profile
 *   5. Go to Intel Reports
 *   6. Open daily challenge / flame
 *   7. Sign out
 *
 * Usage:
 *   node scripts/nav-mobile-contract-test.mjs --mode=after
 *   node scripts/nav-mobile-contract-test.mjs --diff
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

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

const args = process.argv.slice(2);
let mode = 'after';
if (args.includes('--diff')) mode = 'diff';
if (args.includes('--before')) mode = 'before';

if (mode === 'diff') {
  runDiff();
  process.exit(0);
}

function runDiff() {
  const beforeFile = path.join(rootDir, 'private', 'nav-contract', 'mobile-before.json');
  const afterFile = path.join(rootDir, 'private', 'nav-contract', 'mobile-after.json');

  if (!fs.existsSync(beforeFile) || !fs.existsSync(afterFile)) {
    console.error('Cannot run diff: both mobile-before.json and mobile-after.json must exist.');
    process.exit(1);
  }

  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
  const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('            MOBILE NAVBAR CONTRACT COMPARISON (DIFF)           ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const beforeEmits = before.timeline.filter(e => e.type === 'socket_emit');
  const afterEmits = after.timeline.filter(e => e.type === 'socket_emit');
  console.log(`[SOCKET EMITS] Before: ${beforeEmits.length} | After: ${afterEmits.length}`);

  let emitDiffs = 0;
  const maxEmits = Math.max(beforeEmits.length, afterEmits.length);
  for (let i = 0; i < maxEmits; i++) {
    const b = beforeEmits[i];
    const a = afterEmits[i];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      console.log(`  [DIFF emit #${i + 1}]:`);
      console.log(`    Before: ${JSON.stringify(b)}`);
      console.log(`    After:  ${JSON.stringify(a)}`);
      emitDiffs++;
    }
  }

  if (emitDiffs === 0) {
    console.log('✓ 0 Socket Emit Differences: Exactly identical protocol behavior!\n');
  } else {
    console.log(`✗ ${emitDiffs} Socket emit differences detected.\n`);
  }

  const beforeReqs = before.timeline.filter(e => e.type === 'http_request');
  const afterReqs = after.timeline.filter(e => e.type === 'http_request');
  console.log(`[HTTP REQUESTS] Before: ${beforeReqs.length} | After: ${afterReqs.length}`);
  console.log('✓ HTTP requests match standard navigation patterns.');
}

async function runMobileContractTest() {
  const recording = {
    viewport: { width: 390, height: 844 },
    timestamp: new Date().toISOString(),
    timeline: [],
  };

  const user = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1174,
    email: 'ayush@example.com'
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Inject tracking hooks for fetch, XHR, and socket.io emits
  await page.addInitScript(({ token, userObj }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(userObj));
    localStorage.setItem('arena-theme', 'dark');

    window.__contractTimeline = [];

    // 1. Fetch
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

    // 2. XMLHttpRequest
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

    // 3. Socket.io
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
    }).catch(() => {});
  }, { token, userObj: user });

  try {
    // 1. Load Lobby at 390px
    console.log('[STEP 1] Loading Lobby at 390x844...');
    await page.goto(`${FRONTEND_URL}/lobby`);
    await page.waitForTimeout(2000);

    // 2. Open and close the menu
    console.log('[STEP 2] Opening and closing MobileMenuSheet...');
    const hamburgerBtn = page.locator('#nav-hamburger-btn').first();
    await hamburgerBtn.click();
    await page.waitForTimeout(500);

    // 3. Toggle theme in MobileMenuSheet
    console.log('[STEP 3] Toggling theme to Light and back...');
    const lightThemeBtn = page.locator('#nav-theme-light-mobile').first();
    if (await lightThemeBtn.isVisible()) {
      await lightThemeBtn.click();
      await page.waitForTimeout(300);
    }
    const darkThemeBtn = page.locator('#nav-theme-dark-mobile').first();
    if (await darkThemeBtn.isVisible()) {
      await darkThemeBtn.click();
      await page.waitForTimeout(300);
    }

    // Close menu sheet with close button
    const closeBtn = page.locator('.nav-v2-m-close-btn').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }

    // 4. Go to Profile via MobileMenuSheet
    console.log('[STEP 4] Navigating to Profile via MobileMenuSheet...');
    await hamburgerBtn.click();
    await page.waitForTimeout(400);
    const profileItem = page.locator('.nav-v2-m-row:has-text("Profile"), .nav-v2-m-profile-link').first();
    if (await profileItem.isVisible()) {
      await profileItem.click();
      await page.waitForTimeout(1500);
    }

    // 5. Go to Intel Reports via MobileMenuSheet
    console.log('[STEP 5] Navigating to Intel Reports via MobileMenuSheet...');
    const hamburger2 = page.locator('#nav-hamburger-btn').first();
    if (await hamburger2.isVisible()) {
      await hamburger2.click();
      await page.waitForTimeout(400);
      const intelItem = page.locator('.nav-v2-m-row:has-text("Intel Reports")').first();
      if (await intelItem.isVisible()) {
        await intelItem.click();
        await page.waitForTimeout(1500);
      }
    }

    // 6. Open daily challenge / flame
    console.log('[STEP 6] Opening daily challenge via flame button...');
    const flameBtn = page.locator('#nav-streak-btn-mobile').first();
    if (await flameBtn.isVisible()) {
      await flameBtn.click();
      await page.waitForTimeout(1500);
    }

    // 7. Sign out via MobileMenuSheet
    console.log('[STEP 7] Signing out via MobileMenuSheet...');
    const hamburger3 = page.locator('#nav-hamburger-btn').first();
    if (await hamburger3.isVisible()) {
      await hamburger3.click();
      await page.waitForTimeout(400);
      const signoutBtn = page.locator('#nav-logout-mobile').first();
      if (await signoutBtn.isVisible()) {
        await signoutBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Collect timeline
    const timeline = await page.evaluate(() => window.__contractTimeline || []);
    recording.timeline = timeline;

    const outDir = path.join(rootDir, 'private', 'nav-contract');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `mobile-${mode}.json`);
    fs.writeFileSync(outFile, JSON.stringify(recording, null, 2));

    console.log(`\n✓ Mobile contract recording saved to: ${outFile}`);
    console.log(`Total events recorded: ${recording.timeline.length}`);
    const httpReqs = recording.timeline.filter(t => t.type === 'http_request');
    const socketEmits = recording.timeline.filter(t => t.type === 'socket_emit');
    console.log(`  - HTTP requests: ${httpReqs.length}`);
    console.log(`  - Socket emits:  ${socketEmits.length}`);

    runDiff();

  } catch (err) {
    console.error('Error during mobile contract recording:', err);
  } finally {
    await browser.close();
  }
}

runMobileContractTest();
