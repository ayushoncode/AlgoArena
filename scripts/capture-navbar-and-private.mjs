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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture navbar
  const nav = page.locator('nav.fixed').first();
  if (await nav.count() > 0) {
    await nav.screenshot({ path: path.join(outDir, 'navbar_editorial_logged_in.png') });
  }

  // 2. Click "Private Duel" tab in mode selector
  const privateTabBtn = page.locator('button:has-text("Private Duel")').first();
  if (await privateTabBtn.count() > 0) {
    await privateTabBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'lobby_v2_private_duel_section.png') });
  }

  // 3. Click "Quick Arena" tab to return
  const quickArenaBtn = page.locator('button:has-text("Quick Arena")').first();
  if (await quickArenaBtn.count() > 0) {
    await quickArenaBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'lobby_v2_quick_arena_tab.png') });
  }

  await browser.close();
  console.log('Capture complete!');
}

capture().catch(console.error);
