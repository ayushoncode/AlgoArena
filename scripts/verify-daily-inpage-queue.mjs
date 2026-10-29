import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const artifactDir = '/Users/ayush/.gemini/antigravity/brain/83692b29-6bf3-4459-9bff-cce862f1c663';

async function verify() {
  const user = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1174,
    email: 'ayush@example.com'
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  await page.addInitScript(({ token, userObj }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(userObj));
    localStorage.setItem('arena-theme', 'dark');
  }, { token, userObj: user });

  // 1. Visit /daily page
  await page.goto(`${FRONTEND_URL}/daily`);
  await page.waitForTimeout(2000);

  // Take full screenshot of formatted problem description
  await page.screenshot({ path: path.join(artifactDir, 'daily_page_markdown_fixed.png'), fullPage: true });
  console.log('[VERIFY] Saved daily_page_markdown_fixed.png');

  // Verify text doesn't contain raw markdown tokens
  const textContent = await page.locator('.lg\\:col-span-2').innerText();
  const hasRawTripleBackticks = textContent.includes('```');
  const hasRawHashes = textContent.includes('###');
  console.log('[VERIFY] Contains raw ```:', hasRawTripleBackticks, '(Expected: false)');
  console.log('[VERIFY] Contains raw ###:', hasRawHashes, '(Expected: false)');

  // 2. Click Start Daily Duel
  const startBtn = page.locator('#daily-page-start-btn');
  console.log('[VERIFY] Start button text:', await startBtn.innerText());
  await startBtn.click();
  await page.waitForTimeout(1000);

  console.log('[VERIFY] Current URL after click:', page.url(), '(Expected: http://localhost:5173/daily - NOT /lobby)');
  const searchingOverlayCount = await page.locator('div[role="region"][aria-live="polite"]').count();
  console.log('[VERIFY] SearchingOverlay count on /daily:', searchingOverlayCount, '(Expected: 1)');

  await page.screenshot({ path: path.join(artifactDir, 'daily_page_searching_overlay.png') });
  console.log('[VERIFY] Saved daily_page_searching_overlay.png');

  // 3. Click Cancel Search
  const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Cancel Search")');
  if (await cancelBtn.count() > 0) {
    await cancelBtn.first().click();
    await page.waitForTimeout(1000);
    const afterCancelCount = await page.locator('div[role="region"][aria-live="polite"]').count();
    console.log('[VERIFY] SearchingOverlay after cancel count:', afterCancelCount, '(Expected: 0)');
    console.log('[VERIFY] Current URL after cancel:', page.url(), '(Expected: http://localhost:5173/daily)');
  }

  await browser.close();
}

verify().catch(err => {
  console.error('[VERIFY FAILED]', err);
  process.exit(1);
});

