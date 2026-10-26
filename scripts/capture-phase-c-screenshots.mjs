import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Read backend .env for JWT_SECRET
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

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Daily Selected
  console.log('Capturing Daily Selected...');
  const dailyBtn = page.locator('button:has-text("Play Daily")').first();
  if (await dailyBtn.count() > 0) {
    await dailyBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'lobby_v2_daily_selected.png') });
  }

  // 2. Searching Overlay
  console.log('Capturing Searching Overlay...');
  const findMatchBtn = page.locator('#find-match-btn');
  await findMatchBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, 'lobby_v2_searching_overlay.png') });

  // Cancel search
  const cancelBtn = page.locator('button:has-text("Cancel Queue")').first();
  await cancelBtn.click();
  await page.waitForTimeout(500);

  // 3. Private Modal - Create Room
  console.log('Capturing Private Modal - Create...');
  // Select topic
  await page.keyboard.press('1');
  await page.waitForTimeout(200);
  const friendBtn = page.locator('button:has-text("Create Or Join Room")').first();
  await friendBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'lobby_v2_private_modal_create.png') });

  // 4. Private Modal - Join Code
  console.log('Capturing Private Modal - Join...');
  const joinTab = page.locator('button:has-text("Join Code")').first();
  await joinTab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, 'lobby_v2_private_modal_join.png') });

  await browser.close();
  console.log('✓ All Phase C screenshots captured successfully!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
