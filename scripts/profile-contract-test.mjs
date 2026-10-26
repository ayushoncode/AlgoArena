/**
 * scripts/profile-contract-test.mjs
 * 
 * AlgoArena Profile Contract Test & Protocol Verification
 * 
 * Verifies that the Profile page contract is preserved:
 * - Records every fetch/XHR request (method, normalized URL, payload, execution order)
 * - Executes flows:
 *   1. Load own profile (/profile)
 *   2. Load another player's profile (/profile/:username)
 *   3. Change range on the chart (client-side only, 0 requests)
 *   4. Hover and keyboard-navigate the chart (client-side only, 0 requests)
 *   5. Filter and scroll match history (client-side only, 0 requests)
 *   6. Change avatar (local dev test account, prints masked DB host)
 *   7. Open a match opponent link (/profile/:opponent)
 * 
 * Usage:
 *   node scripts/profile-contract-test.mjs --mode=legacy
 *   node scripts/profile-contract-test.mjs --mode=v2
 *   node scripts/profile-contract-test.mjs --diff
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

// Print safety verification banner
console.log('═══════════════════════════════════════════════════════════════');
console.log('      ALGOARENA PROFILE CONTRACT & INTERACTION RECORDER       ');
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
  const legacyPath = path.join(rootDir, 'private', 'profile-contract', 'legacy.json');
  const v2Path = path.join(rootDir, 'private', 'profile-contract', 'v2.json');

  if (!fs.existsSync(legacyPath) || !fs.existsSync(v2Path)) {
    console.error('Error: Both legacy.json and v2.json must exist to perform diff.');
    console.error(`legacy.json exists: ${fs.existsSync(legacyPath)}`);
    console.error(`v2.json exists:     ${fs.existsSync(v2Path)}`);
    process.exit(1);
  }

  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const v2 = JSON.parse(fs.readFileSync(v2Path, 'utf8'));

  console.log('\n--- COMPARING NETWORK REQUEST TIMELINES ---');
  const legacyReqs = legacy.timeline.filter(e => e.type === 'http_request');
  const v2Reqs = v2.timeline.filter(e => e.type === 'http_request');

  let diffCount = 0;
  const maxLen = Math.max(legacyReqs.length, v2Reqs.length);

  for (let i = 0; i < maxLen; i++) {
    const l = legacyReqs[i];
    const v = v2Reqs[i];

    if (!l || !v || l.method !== v.method || l.url !== v.url || JSON.stringify(l.payload) !== JSON.stringify(v.payload)) {
      console.log(`\n  [DIFF at Request #${i + 1}]:`);
      console.log(`    Legacy: ${l ? `${l.method} ${l.url} ${JSON.stringify(l.payload || '')}` : '<none>'}`);
      console.log(`    V2:     ${v ? `${v.method} ${v.url} ${JSON.stringify(v.payload || '')}` : '<none>'}`);
      diffCount++;
    }
  }

  if (diffCount === 0 && legacyReqs.length === v2Reqs.length) {
    console.log(`\n✓ CONTRACT VERIFICATION PASSED: V2 network protocol matches Legacy exactly! (${legacyReqs.length} requests in identical order)`);
  } else {
    console.log(`\n✗ CONTRACT DIFFERENCE DETECTED: ${diffCount} request discrepancies found!`);
    process.exit(1);
  }
}

async function run() {
  // Test user in local dev DB (ayush_ayush)
  const testUser = {
    id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
    username: 'ayush_ayush',
    email: 'ayush916282580@gmail.com',
    elo_rating: 1239,
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

  const otherPlayerUsername = 'champion';
  const matchOpponentUsername = 'ayushoncode';

  const recording = {
    mode,
    timestamp: new Date().toISOString(),
    timeline: [],
    flows: {},
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Helper to record HTTP requests
  const recordRequest = (method, url, payload = null) => {
    const cleanUrl = url.replace(/^https?:\/\/[^/]+/, '');
    if (
      cleanUrl.startsWith('/api/') &&
      !cleanUrl.includes('/assets/') &&
      !cleanUrl.includes('/@vite/')
    ) {
      const entry = {
        type: 'http_request',
        method: method.toUpperCase(),
        url: cleanUrl,
        payload: payload ? payload : undefined,
        timestamp: Date.now(),
      };
      recording.timeline.push(entry);
      console.log(`  [HTTP] ${entry.method} ${entry.url}`);
    }
  };

  // Intercept network requests via Playwright
  page.on('request', req => {
    const url = req.url();
    const method = req.method();
    let postData = null;
    try {
      postData = req.postDataJSON();
    } catch {
      postData = req.postData();
    }
    recordRequest(method, url, postData);
  });

  // Inject session auth in localStorage before load
  await page.addInitScript(({ tokenVal, userVal }) => {
    localStorage.setItem('aa_token', tokenVal);
    localStorage.setItem('aa_user', JSON.stringify(userVal));
  }, { tokenVal: token, userVal: testUser });

  const uiQueryParam = mode === 'legacy' ? '?ui=legacy' : '';

  try {
    // ── FLOW 1: LOAD OWN PROFILE ─────────────────────────────────────
    console.log('\n[Flow 1] Loading own profile (/profile)...');
    await page.goto(`${FRONTEND_URL}/profile${uiQueryParam}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const ownHeading = await page.locator('h1').textContent();
    console.log(`  Rendered own profile heading: "${ownHeading?.trim()}"`);
    recording.flows.loadOwnProfile = { success: true, heading: ownHeading?.trim() };

    // ── FLOW 2: LOAD ANOTHER PLAYER'S PROFILE ────────────────────────
    console.log(`\n[Flow 2] Loading other player profile (/profile/${otherPlayerUsername})...`);
    await page.goto(`${FRONTEND_URL}/profile/${otherPlayerUsername}${uiQueryParam}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const otherHeading = await page.locator('h1').textContent();
    console.log(`  Rendered other player heading: "${otherHeading?.trim()}"`);
    recording.flows.loadOtherProfile = { success: true, heading: otherHeading?.trim() };

    // ── FLOW 3: CHANGE RANGE ON CHART (OWN PROFILE) ───────────────────
    console.log('\n[Flow 3] Navigating back to own profile and testing chart range...');
    await page.goto(`${FRONTEND_URL}/profile${uiQueryParam}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });

    const requestsBeforeRange = recording.timeline.length;
    // Check if range segmented control buttons exist (present in V2)
    const rangeButtons = page.locator('button:has-text("Last 20"), button:has-text("30 days"), button:has-text("All time")');
    const rangeCount = await rangeButtons.count();
    if (rangeCount > 0) {
      console.log('  Found range buttons, testing clicks...');
      await rangeButtons.first().click();
      await page.waitForTimeout(100);
      await rangeButtons.nth(1).click();
      await page.waitForTimeout(100);
    } else {
      console.log('  (Legacy UI has no range buttons; chart displays full loaded data)');
    }
    const requestsAfterRange = recording.timeline.length;
    recording.flows.chartRange = {
      tested: true,
      newNetworkRequests: requestsAfterRange - requestsBeforeRange,
    };
    console.log(`  New network requests during chart range switch: ${requestsAfterRange - requestsBeforeRange} (expected 0)`);

    // ── FLOW 4: HOVER & KEYBOARD-NAVIGATE CHART ──────────────────────
    console.log('\n[Flow 4] Testing chart hover and keyboard navigation...');
    const requestsBeforeHover = recording.timeline.length;
    const chartSvg = page.locator('svg').filter({ has: page.locator('path, circle') }).first();
    if (await chartSvg.isVisible()) {
      const box = await chartSvg.boundingBox();
      if (box) {
        // Move mouse across plot
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
        await page.waitForTimeout(100);
        await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
        await page.waitForTimeout(100);
      }
      // Focus chart and press keyboard arrows
      await chartSvg.focus().catch(() => {});
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowLeft');
    }
    const requestsAfterHover = recording.timeline.length;
    recording.flows.chartInteraction = {
      tested: true,
      newNetworkRequests: requestsAfterHover - requestsBeforeHover,
    };
    console.log(`  New network requests during chart interaction: ${requestsAfterHover - requestsBeforeHover} (expected 0)`);

    // ── FLOW 5: FILTER & SCROLL MATCH HISTORY ────────────────────────
    console.log('\n[Flow 5] Testing match history filter and scroll...');
    const requestsBeforeFilter = recording.timeline.length;
    // Check if match filter exists (V2 feature)
    const filterSelect = page.locator('select, [role="tablist"], button:has-text("Wins")');
    if (await filterSelect.first().isVisible().catch(() => false)) {
      await filterSelect.first().click().catch(() => {});
      await page.waitForTimeout(100);
    }
    // Scroll match container
    const matchContainer = page.locator('.overflow-y-auto, [data-testid="match-history-scroll"], table').first();
    if (await matchContainer.isVisible().catch(() => false)) {
      await matchContainer.evaluate(el => el.scrollTop = 200).catch(() => {});
      await page.waitForTimeout(100);
    }
    const requestsAfterFilter = recording.timeline.length;
    recording.flows.matchHistoryInteraction = {
      tested: true,
      newNetworkRequests: requestsAfterFilter - requestsBeforeFilter,
    };
    console.log(`  New network requests during match history interaction: ${requestsAfterFilter - requestsBeforeFilter} (expected 0)`);

    // ── FLOW 6: CHANGE AVATAR (WRITES TO DEV DB) ─────────────────────
    console.log('\n[Flow 6] Changing avatar (local dev test account)...');
    console.log(`[SAFETY CHECK] Masked DB Host before write: ${maskHost(DATABASE_URL)}`);
    
    // Find change avatar button
    const changeAvatarBtn = page.locator('button[title="Change Avatar"], button[aria-label="Change Avatar"], button:has-text("Change avatar")').first();
    await changeAvatarBtn.waitFor({ state: 'visible', timeout: 5000 });
    await changeAvatarBtn.click();

    // Wait for modal
    const saveAvatarBtn = page.locator('button:has-text("Save Avatar"), button:has-text("Save")').first();
    await saveAvatarBtn.waitFor({ state: 'visible', timeout: 5000 });

    // Select second avatar preset if available
    const presets = page.locator('.grid button, [data-testid="avatar-preset"]');
    if ((await presets.count()) > 1) {
      await presets.nth(1).click();
      await page.waitForTimeout(100);
    }

    // Click Save Avatar and wait for PATCH response
    const [patchResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/users/me/avatar') && resp.request().method() === 'PATCH'),
      saveAvatarBtn.click(),
    ]);
    console.log(`  PATCH /api/users/me/avatar responded with status ${patchResponse.status()}`);
    recording.flows.changeAvatar = { success: patchResponse.status() === 200 };

    await page.waitForTimeout(500);

    // ── FLOW 7: OPEN MATCH OPPONENT LINK ─────────────────────────────
    console.log(`\n[Flow 7] Opening match opponent link (${matchOpponentUsername})...`);
    // Find link/element with @opponent or opponent username
    const opponentLink = page.locator(`a[href*="/profile/${matchOpponentUsername}"], button:has-text("${matchOpponentUsername}"), text=@${matchOpponentUsername}`).first();
    if (await opponentLink.isVisible().catch(() => false)) {
      await opponentLink.click();
    } else {
      // In legacy UI, match rows do not have an <a> tag for opponent; navigate directly to opponent profile
      console.log(`  (Opponent link element not an <a> tag in legacy, navigating to /profile/${matchOpponentUsername})`);
      await page.goto(`${FRONTEND_URL}/profile/${matchOpponentUsername}${uiQueryParam}`, { waitUntil: 'networkidle' });
    }
    await page.waitForSelector('h1', { timeout: 10000 });
    const oppHeading = await page.locator('h1').textContent();
    console.log(`  Rendered opponent profile heading: "${oppHeading?.trim()}"`);
    recording.flows.openOpponentProfile = { success: true, heading: oppHeading?.trim() };

    console.log('\n--- ALL FLOWS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\nTest flow error:', err);
    recording.error = String(err);
  } finally {
    await browser.close();
  }

  // Ensure output directory exists
  const outDir = path.join(rootDir, 'private', 'profile-contract');
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${mode}.json`);
  fs.writeFileSync(outFile, JSON.stringify(recording, null, 2), 'utf8');
  console.log(`\n[SAVED] Contract recording saved to: ${outFile}`);
  console.log(`[SUMMARY] Total recorded HTTP requests: ${recording.timeline.length}`);
}

run();
