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
  await page.waitForTimeout(800);

  // Switch to Striver A2Z Sheet tab
  const striverTab = page.locator('.lobby-v2-mode-tab:has-text("Striver A2Z Sheet")').first();
  await striverTab.click();
  await page.waitForTimeout(400);

  // 1. Screenshot initial view
  await page.screenshot({ path: path.join(outDir, 'striver_v2_editorial_closed.png') });

  // 2. Expand Easy Problems accordion inside the first topic (Arrays)
  const easyHeader = page.locator('.striver-v2-diff-header:has-text("Easy")').first();
  if (await easyHeader.count() > 0) {
    await easyHeader.click();
    await page.waitForTimeout(300);
  }

  // 3. Screenshot expanded view showing problems and 1v1 battle buttons
  await page.screenshot({ path: path.join(outDir, 'striver_v2_editorial_expanded.png') });

  await browser.close();
  console.log('Striver capture completed successfully!');
}

capture().catch(console.error);
