import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const backendEnvPath = path.join(rootDir, 'backend', '.env');
let jwtSecret = 'default-secret-key-change-it';
if (fs.existsSync(backendEnvPath)) {
  const content = fs.readFileSync(backendEnvPath, 'utf8');
  const match = content.match(/JWT_SECRET\s*=\s*(.+)/);
  if (match) jwtSecret = match[1].trim().replace(/^['"]|['"]$/g, '');
}

const user = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  email: 'ayush@example.com',
  elo_rating: 1220,
};

const token = jwt.sign(
  { id: user.id, username: user.username, email: user.email },
  jwtSecret,
  { expiresIn: '7d' }
);

const outDir = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Screenshot the new Daily Challenge card
  const dailySection = page.locator('.lobby-v2-daily-section');
  if (await dailySection.count() > 0) {
    await dailySection.screenshot({ path: path.join(outDir, 'daily_challenge_unique_card.png') });
  }

  // 2. Full desktop view showing Daily card & removed Play with a Friend
  await page.screenshot({ path: path.join(outDir, 'lobby_desktop_daily_featured.png') });

  // 3. Click Play Daily Challenge to test selected state
  const dailyBtn = page.locator('.lobby-v2-daily-btn');
  if (await dailyBtn.count() > 0) {
    await dailyBtn.click();
    await page.waitForTimeout(400);
    await dailySection.screenshot({ path: path.join(outDir, 'daily_challenge_selected_state.png') });
  }

  // 4. Mobile screenshot
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobileContext.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  const mobileDaily = mobilePage.locator('.lobby-v2-daily-section');
  if (await mobileDaily.count() > 0) {
    await mobileDaily.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(200);
    await mobilePage.screenshot({ path: path.join(outDir, 'lobby_mobile_daily_featured.png') });
  }

  await browser.close();
  console.log('Capture of Daily Challenge unique card finished successfully!');
}

run().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
