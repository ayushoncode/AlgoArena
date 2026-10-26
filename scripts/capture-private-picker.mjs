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

  // 1. Switch to Private Duel tab using exact class selector
  const privateTab = page.locator('.lobby-v2-mode-tab:has-text("Private Duel")').first();
  await privateTab.click();
  await page.waitForTimeout(500);

  // Screenshot default state with topic picker
  await page.screenshot({ path: path.join(outDir, 'private_duel_with_topic_picker.png') });

  // 2. Select "Trees & BST" chip
  const treesChip = page.locator('.lobby-v2-topic-chip:has-text("Trees & BST")').first();
  if (await treesChip.count() > 0) {
    await treesChip.click();
    await page.waitForTimeout(300);
  }

  // 3. Select "Hard" difficulty
  const hardBtn = page.locator('.lobby-v2-private-diff-btn:has-text("Hard")').first();
  if (await hardBtn.count() > 0) {
    await hardBtn.click();
    await page.waitForTimeout(300);
  }

  // Screenshot after picking Trees & BST + Hard
  await page.screenshot({ path: path.join(outDir, 'private_duel_trees_hard_selected.png') });

  // 4. Click Create Room & Generate Code
  const createBtn = page.locator('.lobby-v2-private-card button:has-text("Create Room & Generate Code")').first();
  if (await createBtn.count() > 0) {
    await createBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'private_duel_modal_trees_hard.png') });
  }

  await browser.close();
  console.log('Capture completed successfully!');
}

capture().catch(console.error);
