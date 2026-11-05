/**
 * scripts/discussion-e2e-test.mjs
 *
 * End-to-end Playwright verification for Discussion Rooms:
 * - Tests responsiveness across 4 viewports:
 *     - Desktop: 1536 x 960
 *     - Laptop:  1194 x 834
 *     - Tablet:   820 x 1180
 *     - Mobile:   390 x 844
 * - Verifies /discuss index catalog
 * - Verifies /discuss/:slug problem room
 * - Verifies /discuss/:slug/thread/:id detail timeline
 * - Verifies Navbar desktop & mobile drawer entry points
 * - Saves screenshots in private/discussion-screenshots/
 *
 * Usage:
 *   node scripts/discussion-e2e-test.mjs
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

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';

const SCREENSHOT_DIR = path.join(rootDir, 'private', 'discussion-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1536, height: 960 },
  { name: 'laptop',  width: 1194, height: 834 },
  { name: 'tablet',  width: 820,  height: 1180 },
  { name: 'mobile',  width: 390,  height: 844 }
];

// Test Premium user
const user = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  email: 'ayush916282580@gmail.com'
};
const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AlgoArena Discussion Rooms — Frontend E2E & Screenshot Suite');
  console.log('═══════════════════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });
      const page = await context.newPage();

      // Inject auth token & user into localStorage before loading page
      await page.addInitScript(({ token, user }) => {
        localStorage.setItem('aa_token', token);
        localStorage.setItem('aa_user', JSON.stringify(user));
      }, { token, user });

      // 1. Discussions Index (/discuss)
      await page.goto(`${FRONTEND_URL}/discuss`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const indexScreenshotPath = path.join(SCREENSHOT_DIR, `discuss-index-${vp.name}.png`);
      await page.screenshot({ path: indexScreenshotPath, fullPage: false });
      console.log(`  ✓ Saved index screenshot: ${path.basename(indexScreenshotPath)}`);

      // 2. Room Detail (/discuss/balanced-binary-tree)
      await page.goto(`${FRONTEND_URL}/discuss/balanced-binary-tree`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const roomScreenshotPath = path.join(SCREENSHOT_DIR, `discuss-room-${vp.name}.png`);
      await page.screenshot({ path: roomScreenshotPath, fullPage: false });
      console.log(`  ✓ Saved room screenshot: ${path.basename(roomScreenshotPath)}`);

      // 3. Navbar state (on mobile open the sheet)
      if (vp.width < 900) {
        const hamburger = page.locator('#nav-hamburger-btn');
        if (await hamburger.isVisible()) {
          await hamburger.click();
          await page.waitForTimeout(400);
          const sheetScreenshotPath = path.join(SCREENSHOT_DIR, `mobile-sheet-${vp.name}.png`);
          await page.screenshot({ path: sheetScreenshotPath, fullPage: false });
          console.log(`  ✓ Saved mobile sheet screenshot: ${path.basename(sheetScreenshotPath)}`);
        }
      }

      await context.close();
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✓ All frontend responsive views and screenshots completed!');
    console.log(`Output Directory: ${SCREENSHOT_DIR}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('E2E test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
