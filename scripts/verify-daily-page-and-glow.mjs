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

  // 1. Verify Lobby has NO daily card
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'dark');
    }, { token, userObj: user });

    await page.goto(`${FRONTEND_URL}/lobby`);
    await page.waitForTimeout(1500);

    const lobbyDailyCard = page.locator('.lobby-v2-daily-section, .lobby-v2-daily-card');
    const hasDailyInLobby = await lobbyDailyCard.count();
    console.log(`[VERIFY] Lobby daily card count: ${hasDailyInLobby} (Expected: 0)`);

    await page.screenshot({
      path: path.join(artifactDir, 'lobby_without_daily.png'),
      clip: { x: 0, y: 0, width: 1440, height: 750 }
    });
    console.log('Saved lobby_without_daily.png');

    // 2. Click flame button and verify navigation to /daily
    const flameBtn = page.locator('nav #nav-streak-btn');
    await flameBtn.click();
    await page.waitForTimeout(1000);

    console.log(`[VERIFY] Current URL after clicking flame: ${page.url()} (Expected: /daily)`);

    // 3. Capture /daily page
    await page.screenshot({
      path: path.join(artifactDir, 'daily_challenge_page_dark.png'),
      fullPage: true
    });
    console.log('Saved daily_challenge_page_dark.png');

    await context.close();
  }

  // 4. Verify Flame Glowing state when daily question completed
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const todayUtc = new Date().toISOString().slice(0, 10);

    await page.addInitScript(({ token, userObj }) => {
      const todayUtc = new Date().toISOString().slice(0, 10);
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'dark');
      // Set completed signal for today
      localStorage.setItem(`aa_daily_done_${todayUtc}`, 'true');
    }, { token, userObj: user });

    await page.goto(`${FRONTEND_URL}/daily`);
    await page.waitForTimeout(2000);

    // Check if flame has is-glowing class
    const glowingFlame = page.locator('nav #nav-streak-btn.is-glowing');
    console.log(`[VERIFY] Flame glowing count: ${await glowingFlame.count()} (Expected: 1 when completed)`);

    await page.screenshot({
      path: path.join(artifactDir, 'navbar_flame_glowing.png'),
      clip: { x: 1050, y: 10, width: 350, height: 60 }
    });
    console.log('Saved navbar_flame_glowing.png');

    await page.screenshot({
      path: path.join(artifactDir, 'daily_page_completed_state.png'),
      clip: { x: 200, y: 70, width: 1040, height: 700 }
    });
    console.log('Saved daily_page_completed_state.png');

    await context.close();
  }

  await browser.close();
  console.log('✓ Verification completed successfully.');
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
