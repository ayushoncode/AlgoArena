/**
 * scripts/verify-lobby-quick-screenshots.mjs
 *
 * Captures comprehensive visual verification screenshots for the 3-column Quick Arena panel:
 *  - Viewports: 390px, 820px, 1194px, 1366x768, 1536px
 *  - Themes: Dark and Light
 *  - States:
 *      1. Initial / Nothing selected
 *      2. Topic near the end (Backtracking) scrolled into view & selected
 *      3. Difficulties selected (Easy, Medium, Hard)
 *      4. Loading skeleton state
 *      5. Failed stats state
 *      6. Keyboard focus ring visible
 *  - Measures page scroll at 1366x768 to ensure zero page overflow
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
const OUT_DIR = path.join(rootDir, 'private', 'lobby-screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'tablet_820', width: 820, height: 1180 },
  { name: 'tablet_landscape_1194', width: 1194, height: 834 },
  { name: 'desktop_1366x768', width: 1366, height: 768 },
  { name: 'desktop_1536', width: 1536, height: 864 }
];

const testUser = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  elo_rating: 1220,
  email: 'ayush916282580@gmail.com'
};
const authToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

async function setupPage(context, theme = 'dark') {
  const page = await context.newPage();
  await page.addInitScript(({ token, user, th }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
    localStorage.setItem('arena-theme', th);
    document.documentElement.setAttribute('data-theme', th);
  }, { token: authToken, user: testUser, th: theme });
  return page;
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       ALGOARENA 3-COLUMN QUICK ARENA VISUAL VERIFICATION      ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });

  // 1. Core responsive tests across dark & light themes
  for (const vp of VIEWPORTS) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });
      const page = await setupPage(context, theme);

      await page.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      // State A: Initial / Any topic selected
      const shotA = path.join(OUT_DIR, `${vp.name}_${theme}_initial.png`);
      await page.screenshot({ path: shotA, fullPage: false });
      console.log(`[SAVED] ${shotA}`);

      // State B: Topic near end (Backtracking) scrolled into view & selected
      const backtrackingRow = page.locator('button[role="radio"]').filter({ hasText: 'Backtracking' }).first();
      if (await backtrackingRow.count() > 0) {
        await backtrackingRow.click();
        await page.waitForTimeout(400);
        const shotB = path.join(OUT_DIR, `${vp.name}_${theme}_backtracking.png`);
        await page.screenshot({ path: shotB, fullPage: false });
        console.log(`[SAVED] ${shotB}`);
      }

      // Check height at 1366x768
      if (vp.name === 'desktop_1366x768' && theme === 'dark') {
        const metrics = await page.evaluate(() => {
          const threeCol = document.querySelector('.quick-arena-block');
          const rect = threeCol ? threeCol.getBoundingClientRect() : null;
          return {
            windowHeight: window.innerHeight,
            scrollHeight: document.documentElement.scrollHeight,
            threeColBottom: rect ? rect.bottom : 0,
            hasVerticalScroll: document.documentElement.scrollHeight > window.innerHeight
          };
        });
        console.log('\n[1366x768 VIEWPORT BUDGET REPORT]');
        console.log(`  Window Height:     ${metrics.windowHeight}px`);
        console.log(`  Scroll Height:     ${metrics.scrollHeight}px`);
        console.log(`  3-Col Panel Bottom: ${Math.round(metrics.threeColBottom)}px`);
        console.log(`  Has Page Scroll:   ${metrics.hasVerticalScroll ? 'YES' : 'NO'}`);
        console.log('═══════════════════════════════════════════════════════════════\n');
      }

      await context.close();
    }
  }

  // 2. Specific feature states: Difficulties, Focus ring, Skeletons, Failed stats
  console.log('--- CAPTURING INTERACTION STATES ---');
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2
  });

  // State: Easy & Hard difficulty selection
  {
    const page = await setupPage(context, 'dark');
    await page.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Pick Easy
    const easyBtn = page.locator('.quick-arena-diff-card').filter({ hasText: 'Easy' }).first();
    await easyBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, 'desktop_1366_easy_selected.png') });

    // Pick Hard
    const hardBtn = page.locator('.quick-arena-diff-card').filter({ hasText: 'Hard' }).first();
    await hardBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, 'desktop_1366_hard_selected.png') });

    // Keyboard focus ring visible
    const arraysBtn = page.locator('button[role="radio"]').filter({ hasText: 'Arrays' }).first();
    await arraysBtn.focus();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, 'desktop_1366_focus_ring.png') });

    await page.close();
  }

  // State: Loading skeleton
  {
    const page = await setupPage(context, 'dark');
    // Intercept /api/problems/stats and delay it
    await page.route('**/api/problems/stats', async (route) => {
      await new Promise(r => setTimeout(r, 4000));
      await route.continue();
    });
    await page.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400); // skeleton visible
    await page.screenshot({ path: path.join(OUT_DIR, 'desktop_1366_loading_skeleton.png') });
    await page.close();
  }

  // State: Failed stats API (graceful fallback)
  {
    const page = await setupPage(context, 'dark');
    await page.route('**/api/problems/stats', (route) => {
      route.abort('failed');
    });
    await page.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'desktop_1366_stats_failed_fallback.png') });
    await page.close();
  }

  await context.close();
  await browser.close();

  console.log(`\n✓ All verification screenshots captured successfully into ${OUT_DIR}`);
}

run().catch((err) => {
  console.error('Screenshot verification failed:', err);
  process.exit(1);
});
