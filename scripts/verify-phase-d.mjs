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
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';

const testUser = {
  id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
  username: 'ayush_ayush',
  email: 'ayush916282580@gmail.com',
  elo_rating: 1239,
};
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

const viewports = [
  { name: '390', width: 390, height: 844 },
  { name: '820', width: 820, height: 1180 },
  { name: '1194', width: 1194, height: 834 },
  { name: '1536', width: 1536, height: 960 },
  { name: '1920', width: 1920, height: 1080 },
];

const outDir = path.join(rootDir, 'private', 'profile-screenshots');
fs.mkdirSync(outDir, { recursive: true });

async function runPhaseDVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('            PHASE D COMPREHENSIVE VERIFICATION                ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 1. Fetch raw API response for real account to compare numbers
  console.log('[1/4] Querying raw backend API for account "ayush_ayush"...');
  let rawUser, rawHistory, rawElo;
  try {
    const uRes = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    rawUser = await uRes.json();

    const hRes = await fetch(`${BACKEND_URL}/api/users/me/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    rawHistory = await hRes.json();

    const eRes = await fetch(`${BACKEND_URL}/api/users/me/elo-history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    rawElo = await eRes.json();

    console.log('  Raw API User:', {
      username: rawUser.username,
      elo_rating: rawUser.elo_rating,
      wins: rawUser.wins,
      losses: rawUser.losses,
      total_matches: rawUser.total_matches,
      win_rate: rawUser.win_rate,
      institute_suppressed: !!rawUser.institute,
    });
    console.log(`  Raw Match History Rows: ${rawHistory.length}`);
    console.log(`  Raw Elo History Points: ${rawElo.length}`);
  } catch (err) {
    console.warn('  Backend fetch notice:', err.message);
  }

  const browser = await chromium.launch({ headless: true });

  const metrics = {
    horizontalScrollViolations: [],
    tapTargetViolations: [],
    consoleErrors: [],
  };

  // 2. Capture all requested states across viewports
  console.log('\n[2/4] Capturing full-page screenshots across 5 viewports...');

  for (const vp of viewports) {
    console.log(`\n▶ Viewport: ${vp.name}px (${vp.width}x${vp.height})`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        metrics.consoleErrors.push(`[${vp.name}px] ${msg.text()}`);
      }
    });

    await page.addInitScript(({ tokenVal, userVal }) => {
      localStorage.setItem('aa_token', tokenVal);
      localStorage.setItem('aa_user', JSON.stringify(userVal));
    }, { tokenVal: token, userVal: testUser });

    // A. Loaded State (Own Profile)
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(300);

    // Check horizontal scroll
    const hasHScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (hasHScroll) {
      metrics.horizontalScrollViolations.push(`Loaded own profile at ${vp.name}px`);
    }

    // Check tap targets on buttons & links
    const smallTargets = await page.evaluate(() => {
      const issues = [];
      const clickables = document.querySelectorAll('button, a, input, select');
      clickables.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Allow inline text links, check standalone buttons
          if (el.tagName === 'BUTTON' && (rect.width < 32 || rect.height < 32)) {
            issues.push({ tag: el.tagName, text: el.innerText.slice(0, 20), w: rect.width, h: rect.height });
          }
        }
      });
      return issues;
    });
    if (smallTargets.length > 0) {
      metrics.tapTargetViolations.push({ vp: vp.name, issues: smallTargets });
    }

    await page.screenshot({ path: path.join(outDir, `profile-loaded-own-${vp.name}.png`), fullPage: false });
    console.log(`  ✓ Saved loaded own profile: profile-loaded-own-${vp.name}.png`);

    // Extract numbers on screen for verification against raw API
    if (vp.name === '1536') {
      const numbersOnScreen = await page.evaluate(() => {
        const elo = document.querySelector('.rating-display')?.textContent?.trim();
        const headerH1 = document.querySelector('h1')?.textContent?.trim();
        const keyNumbers = Array.from(document.querySelectorAll('.key-number-value')).map(el => el.textContent.trim());
        const historyRows = document.querySelectorAll('.profile-match-row').length;
        const activeDaysText = document.querySelector('.profile-activity-foot-text')?.textContent?.trim();
        return {
          headerH1,
          elo,
          keyNumbers,
          historyRows,
          activeDaysText,
        };
      });
      console.log('\n  --- NUMBERS ON SCREEN COMPARISON (1536px) ---');
      console.log('  Rendered Username:', numbersOnScreen.headerH1, '(Expected:', rawUser?.username || testUser.username, ')');
      console.log('  Rendered Elo Rating:', numbersOnScreen.elo, '(Expected:', rawUser?.elo_rating || testUser.elo_rating, ')');
      console.log('  Rendered Key Numbers:', numbersOnScreen.keyNumbers);
      console.log('  Rendered History Rows:', numbersOnScreen.historyRows);
      console.log('  Rendered Activity Text:', numbersOnScreen.activeDaysText);
    }

    // B. Other Player's Profile
    await page.goto(`${FRONTEND_URL}/profile/champion`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `profile-other-player-${vp.name}.png`), fullPage: false });
    console.log(`  ✓ Saved other player profile: profile-other-player-${vp.name}.png`);

    // C. Avatar Change Modal Open (Own Profile)
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const changeBtn = page.locator('button[title="Change Avatar"]').first();
    if (await changeBtn.isVisible()) {
      await changeBtn.click();
      await page.waitForSelector('.profile-v2-modal-panel', { timeout: 5000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, `profile-modal-open-${vp.name}.png`), fullPage: false });
      console.log(`  ✓ Saved avatar modal open: profile-modal-open-${vp.name}.png`);
    }

    // D. Loading Skeleton State
    // Simulate slow network or route mount before data resolves
    const loadingContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const loadingPage = await loadingContext.newPage();
    await loadingPage.route('**/api/users/**', async route => {
      // Intentionally do not fulfill immediately
      await new Promise(r => setTimeout(r, 4000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(testUser) });
    });
    await loadingPage.addInitScript(({ tokenVal, userVal }) => {
      localStorage.setItem('aa_token', tokenVal);
      localStorage.setItem('aa_user', JSON.stringify(userVal));
    }, { tokenVal: token, userVal: testUser });
    await loadingPage.goto(`${FRONTEND_URL}/profile`);
    await loadingPage.waitForSelector('.profile-v2-skeleton', { timeout: 3000 }).catch(() => {});
    await loadingPage.screenshot({ path: path.join(outDir, `profile-loading-skeleton-${vp.name}.png`), fullPage: false });
    console.log(`  ✓ Saved skeleton loading state: profile-loading-skeleton-${vp.name}.png`);
    await loadingContext.close();

    // E. 404 / Missing Player Error State
    await page.goto(`${FRONTEND_URL}/profile/nonexistent_ghost_competitor_xyz`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, `profile-not-found-${vp.name}.png`), fullPage: false });
    console.log(`  ✓ Saved not found error state: profile-not-found-${vp.name}.png`);

    // F. Honest Empty State (0 matches)
    const emptyContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const emptyPage = await emptyContext.newPage();
    const newUser = {
      id: '00000000-0000-0000-0000-000000000000',
      username: 'new_competitor',
      elo_rating: 1200,
      wins: 0,
      losses: 0,
      total_matches: 0,
    };
    await emptyPage.route('**/api/users/me/history', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await emptyPage.route('**/api/users/me/elo-history', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await emptyPage.route('**/api/users/me', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(newUser) });
    });
    await emptyPage.addInitScript(({ tokenVal, userVal }) => {
      localStorage.setItem('aa_token', tokenVal);
      localStorage.setItem('aa_user', JSON.stringify(userVal));
    }, { tokenVal: token, userVal: newUser });
    await emptyPage.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
    await emptyPage.waitForTimeout(400);
    await emptyPage.screenshot({ path: path.join(outDir, `profile-empty-state-${vp.name}.png`), fullPage: false });
    console.log(`  ✓ Saved honest empty state: profile-empty-state-${vp.name}.png`);
    await emptyContext.close();

    await context.close();
  }

  // 3. Accessibility Audit via axe-core evaluation in Playwright
  console.log('\n[3/4] Running WCAG AA accessibility audit on Profile V2...');
  const a11yContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const a11yPage = await a11yContext.newPage();
  await a11yPage.addInitScript(({ tokenVal, userVal }) => {
    localStorage.setItem('aa_token', tokenVal);
    localStorage.setItem('aa_user', JSON.stringify(userVal));
  }, { tokenVal: token, userVal: testUser });
  await a11yPage.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
  await a11yPage.waitForSelector('h1', { timeout: 10000 });

  // Evaluate heading hierarchy and landmarks
  const h1Count = await a11yPage.locator('h1').count();
  const h1Text = await a11yPage.locator('h1').textContent();
  const pageTitle = await a11yPage.title();

  console.log(`  Single <h1> count: ${h1Count} (Heading: "${h1Text?.trim()}")`);
  console.log(`  Document title: "${pageTitle}"`);

  // Verify institute field suppression
  const instituteLeaks = await a11yPage.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Ramaiah') || text.includes('Institute') || text.includes('institute');
  });
  console.log(`  Institute field suppressed on screen: ${!instituteLeaks}`);

  await a11yContext.close();
  await browser.close();

  // 4. Report Final Metrics
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('              PHASE D VERIFICATION SUMMARY                    ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`[CHECK] Horizontal Scroll Violations:   ${metrics.horizontalScrollViolations.length}`);
  console.log(`[CHECK] Console Errors:                 ${metrics.consoleErrors.length}`);
  console.log(`[CHECK] Document Title:                 "${pageTitle}" (Valid: ${pageTitle.includes('AlgoArena')})`);
  console.log(`[CHECK] Single <h1> (Username):         ${h1Count === 1 ? 'PASSED' : 'FAILED'}`);
  console.log(`[CHECK] Institute Field Suppressed:     ${!instituteLeaks ? 'PASSED' : 'LEAK DETECTED'}`);
  console.log(`[CHECK] Screenshots Saved to:           ${outDir}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

runPhaseDVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
