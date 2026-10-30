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

  // 1. Desktop Dark Mode
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

    // Click Avatar button to open menu
    const avatarBtn = page.locator('nav #nav-user-btn');
    await avatarBtn.click();
    await page.waitForTimeout(400);

    // Capture navbar area & open menu
    const navBar = page.locator('nav');
    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_b_dark.png'),
      clip: { x: 900, y: 0, width: 540, height: 420 }
    });
    console.log('Saved navbar_phase_b_dark.png');
    await context.close();
  }

  // 2. Desktop Light Mode
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

    const avatarBtn = page.locator('nav #nav-user-btn');
    await avatarBtn.click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_b_light.png'),
      clip: { x: 900, y: 0, width: 540, height: 420 }
    });
    console.log('Saved navbar_phase_b_light.png');
    await context.close();
  }

  // 3. Mobile View (iPhone 390x844)
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

    const avatarBtn = page.locator('nav #nav-user-btn-mobile');
    await avatarBtn.click();
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(artifactDir, 'navbar_phase_b_mobile_sheet.png')
    });
    console.log('Saved navbar_phase_b_mobile_sheet.png');
    await context.close();
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
