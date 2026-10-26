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

async function capture() {
  const browser = await chromium.launch({ headless: true });
  
  // Desktop
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const header = page.locator('.lobby-v2-header-block');
  if (await header.count() > 0) {
    await header.screenshot({ path: path.join(outDir, 'lobby_v2_header_stats_desktop.png') });
  }
  await page.screenshot({ path: path.join(outDir, 'lobby_v2_full_stats_desktop.png') });

  // Mobile
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobileContext.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const mobileHeader = mobilePage.locator('.lobby-v2-header-block');
  if (await mobileHeader.count() > 0) {
    await mobileHeader.screenshot({ path: path.join(outDir, 'lobby_v2_header_stats_mobile.png') });
  }

  await browser.close();
  console.log('Screenshots saved!');
}

capture().catch(console.error);
