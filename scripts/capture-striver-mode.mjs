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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Quick Arena Mode
  console.log('Capturing Quick Arena mode...');
  await page.screenshot({ path: path.join(outDir, 'lobby_v2_quick_arena_mode.png') });

  // 2. Click Striver A2Z Sheet Tab
  console.log('Clicking Striver A2Z Sheet tab...');
  const striverTabBtn = page.locator('button:has-text("Striver A2Z Sheet")').first();
  await striverTabBtn.click();
  await page.waitForTimeout(1200);

  console.log('Capturing Striver Sheet mode...');
  await page.screenshot({ path: path.join(outDir, 'lobby_v2_striver_sheet_mode.png') });

  // 3. Test clicking 1v1 Battle on a Striver problem
  console.log('Testing 1v1 Battle on Striver problem...');
  // Open the first difficulty accordion if not open
  const firstAccordion = page.locator('button:has-text("Easy")').first();
  if (await firstAccordion.count() > 0) {
    await firstAccordion.click();
    await page.waitForTimeout(500);
  }

  const battleBtn = page.locator('button:has-text("1v1 Battle"), button:has-text("1v1")').first();
  if (await battleBtn.count() > 0) {
    await battleBtn.click();
    await page.waitForTimeout(1000);

    console.log('Capturing Striver targeted search overlay...');
    await page.screenshot({ path: path.join(outDir, 'lobby_v2_striver_targeted_queue.png') });

    // Cancel queue
    const cancelBtn = page.locator('button:has-text("Cancel Queue")').first();
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }
  }

  await browser.close();
  console.log('✓ Striver mode verification complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
