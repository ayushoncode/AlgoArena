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

async function capture() {
  const user = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1174,
    email: 'ayush@example.com'
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Dark Mode: Navbar Right Controls + Daily Popover
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'dark');
      document.documentElement.removeAttribute('data-theme');
    }, { token, userObj: user });

    await page.goto(`${FRONTEND_URL}/lobby`);
    await page.waitForTimeout(1500);

    // Capture resting topbar right area
    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_c_controls.png'),
      clip: { x: 1050, y: 10, width: 350, height: 60 }
    });
    console.log('Saved navbar_phase_c_controls.png');

    // Click streak button to open daily challenge dialog
    const streakBtn = page.locator('nav #nav-streak-btn');
    await streakBtn.click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_c_daily_dark.png'),
      clip: { x: 880, y: 0, width: 560, height: 480 }
    });
    console.log('Saved navbar_phase_c_daily_dark.png');
    await context.close();
  }

  // 2. Desktop Light Mode: Daily Popover
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    }, { token, userObj: user });

    await page.goto(`${FRONTEND_URL}/lobby`);
    await page.waitForTimeout(1500);

    const streakBtn = page.locator('nav #nav-streak-btn');
    await streakBtn.click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_c_daily_light.png'),
      clip: { x: 880, y: 0, width: 560, height: 480 }
    });
    console.log('Saved navbar_phase_c_daily_light.png');
    await context.close();
  }

  // 3. Mobile View (iPhone 390x844): Daily Bottom Sheet
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'dark');
    }, { token, userObj: user });

    await page.goto(`${FRONTEND_URL}/lobby`);
    await page.waitForTimeout(1500);

    const streakBtn = page.locator('nav #nav-streak-btn-mobile');
    await streakBtn.click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_c_daily_mobile.png')
    });
    console.log('Saved navbar_phase_c_daily_mobile.png');
    await context.close();
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

