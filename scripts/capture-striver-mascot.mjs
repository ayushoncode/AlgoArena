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

  // 1. Capture the Mode Selector row with the 3D Striver mascot
  const modeSelector = page.locator('.lobby-v2-mode-selector');
  if (await modeSelector.count() > 0) {
    // Screenshot with some margin above so mascot is fully visible
    const box = await modeSelector.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(outDir, 'striver_3d_mascot_mode_selector.png'),
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 80),
          width: box.width + 40,
          height: box.height + 100,
        }
      });
    }
  }

  // 2. Capture close up of Striver Tab button specifically
  const striverTab = page.locator('.lobby-v2-striver-tab');
  if (await striverTab.count() > 0) {
    const box = await striverTab.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(outDir, 'striver_3d_tab_crop.png'),
        clip: {
          x: Math.max(0, box.x - 15),
          y: Math.max(0, box.y - 75),
          width: box.width + 30,
          height: box.height + 85,
        }
      });
    }
  }

  // 3. Also capture Find Match button in white
  const topicCell = page.locator('.lobby-v2-topic-cell').nth(1);
  if (await topicCell.count() > 0) {
    await topicCell.click();
    await page.waitForTimeout(300);
  }
  const findMatchBtn = page.locator('#find-match-btn');
  if (await findMatchBtn.count() > 0) {
    await findMatchBtn.screenshot({ path: path.join(outDir, 'white_find_match_button.png') });
  }

  // 4. Capture Mobile view
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobileContext.addInitScript(({ token, user }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(user));
  }, { token, user });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const mobileModeSelector = mobilePage.locator('.lobby-v2-mode-selector');
  if (await mobileModeSelector.count() > 0) {
    const box = await mobileModeSelector.boundingBox();
    if (box) {
      await mobilePage.screenshot({
        path: path.join(outDir, 'mobile_striver_mascot_crop.png'),
        clip: {
          x: Math.max(0, box.x - 10),
          y: Math.max(0, box.y - 60),
          width: box.width + 20,
          height: box.height + 70,
        }
      });
    }
  }

  await browser.close();
  console.log('Striver mascot and Find Match captures completed successfully!');
}

run().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
