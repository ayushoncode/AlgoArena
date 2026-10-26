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
  elo_rating: 1174,
};

const token = jwt.sign(
  { id: user.id, username: user.username, email: user.email },
  jwtSecret,
  { expiresIn: '7d' }
);

const outDir = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Select a topic (e.g. Arrays) so the Find Match button becomes active
  const arrayTopic = page.locator('.lobby-v2-topic-card').first();
  if (await arrayTopic.count() > 0) {
    await arrayTopic.click();
    await page.waitForTimeout(400);
  }

  // 1. Screenshot the active Find Match button on desktop
  const findMatchBtn = page.locator('#find-match-btn');
  if (await findMatchBtn.count() > 0) {
    await findMatchBtn.screenshot({ path: path.join(outDir, 'white_find_match_btn_desktop.png') });
  }

  // 2. Screenshot the summary rail on desktop
  const rail = page.locator('.lobby-v2-rail');
  if (await rail.count() > 0) {
    await rail.screenshot({ path: path.join(outDir, 'lobby_rail_with_white_find_match.png') });
  }

  // 3. Screenshot the navbar with rating pill
  const nav = page.locator('header, nav, .navbar').first();
  if (await nav.count() > 0) {
    await nav.screenshot({ path: path.join(outDir, 'navbar_rank_colored_pill.png') });
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

  const mobileTopic = mobilePage.locator('.lobby-v2-topic-card').first();
  if (await mobileTopic.count() > 0) {
    await mobileTopic.click();
    await mobilePage.waitForTimeout(400);
  }

  const mobileFindBtn = mobilePage.locator('.lobby-v2-mobile-find-btn');
  if (await mobileFindBtn.count() > 0) {
    await mobileFindBtn.screenshot({ path: path.join(outDir, 'white_find_match_btn_mobile.png') });
  }

  const mobileBar = mobilePage.locator('.lobby-v2-mobile-bar');
  if (await mobileBar.count() > 0) {
    await mobileBar.screenshot({ path: path.join(outDir, 'mobile_sticky_bar_white_find_match.png') });
  }

  await browser.close();
  console.log('White Find Match captures completed successfully!');
}

run().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
