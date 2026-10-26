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

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    await page.addInitScript(({ tokenVal, userVal }) => {
      localStorage.setItem('aa_token', tokenVal);
      localStorage.setItem('aa_user', JSON.stringify(userVal));
    }, { tokenVal: token, userVal: testUser });

    // 1. Own profile
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `phase-b-own-${vp.name}.png`), fullPage: false });

    // 2. Other player's profile
    await page.goto(`${FRONTEND_URL}/profile/champion`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, `phase-b-other-${vp.name}.png`), fullPage: false });

    // 3. Avatar modal open (own profile)
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });
    const changeBtn = page.locator('button[title="Change Avatar"]').first();
    if (await changeBtn.isVisible()) {
      await changeBtn.click();
      await page.waitForSelector('.profile-v2-modal-panel', { timeout: 5000 });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, `phase-b-modal-${vp.name}.png`), fullPage: false });
    }

    // 4. Legacy UI comparison (at 1536 and 390)
    if (vp.name === '1536' || vp.name === '390') {
      await page.goto(`${FRONTEND_URL}/profile?ui=legacy`, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `legacy-${vp.name}.png`), fullPage: false });
    }

    await context.close();
  }

  await browser.close();
  console.log('✓ All Phase B screenshots captured into private/profile-screenshots/');
}

run();
