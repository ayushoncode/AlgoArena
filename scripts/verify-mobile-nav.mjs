import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

const outDir = '/Users/ayush/.gemini/antigravity/brain/83692b29-6bf3-4459-9bff-cce862f1c663';

async function main() {
  const user = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1174,
    email: 'ayush@example.com'
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Mobile 390x844 Dark Logged-in
    console.log('Testing 390x844 Dark Logged-in...');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'dark');
    }, { token, userObj: user });

    await page.goto(`${FRONTEND_URL}/lobby`);
    await page.waitForTimeout(1500);

    // Screenshot bar closed
    await page.screenshot({ path: path.join(outDir, 'mobile_bar_loggedin_390.png') });

    // Measure mobile bar
    const barBox = await page.locator('.nav-v2-mobile-bar').boundingBox();
    console.log('Mobile bar height:', barBox?.height);

    // Flame button target size
    const flameBox = await page.locator('#nav-streak-btn-mobile').boundingBox();
    console.log('Flame button size:', flameBox?.width, 'x', flameBox?.height);

    // Hamburger button target size
    const hamBox = await page.locator('#nav-hamburger-btn').boundingBox();
    console.log('Hamburger button size:', hamBox?.width, 'x', hamBox?.height);

    // Open menu
    await page.locator('#nav-hamburger-btn').click();
    await page.waitForTimeout(400);

    // Check scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    const htmlOverflow = await page.evaluate(() => document.documentElement.style.overflow);
    console.log('Body overflow:', bodyOverflow, '| HTML overflow:', htmlOverflow);

    // Check row heights
    const rows = await page.locator('.nav-v2-m-row').all();
    console.log('Number of rows:', rows.length);
    for (let i = 0; i < rows.length; i++) {
      const box = await rows[i].boundingBox();
      console.log(`Row #${i + 1} height:`, box?.height);
    }

    // Screenshot sheet open
    await page.screenshot({ path: path.join(outDir, 'mobile_sheet_loggedin_dark_390.png') });

    // Switch to Light Mode
    const lightBtn = page.locator('#nav-theme-light-mobile');
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, 'mobile_sheet_loggedin_light_390.png') });
      // Switch back to Dark
      await page.locator('#nav-theme-dark-mobile').click();
      await page.waitForTimeout(300);
    }

    await ctx.close();

    // 2. Mobile 320x568 (Narrowest mobile)
    console.log('Testing 320x568 narrow mobile...');
    const ctx320 = await browser.newContext({ viewport: { width: 320, height: 568 } });
    const page320 = await ctx320.newPage();
    await page320.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.setItem('arena-theme', 'dark');
    }, { token, userObj: user });
    await page320.goto(`${FRONTEND_URL}/lobby`);
    await page320.waitForTimeout(1500);
    await page320.screenshot({ path: path.join(outDir, 'mobile_bar_320.png') });
    await ctx320.close();

    // 3. Logged-out Mobile 390x844 (on /terms where Navbar is rendered for guest)
    console.log('Testing Logged-out mobile on /terms...');
    const ctxOut = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageOut = await ctxOut.newPage();
    await pageOut.goto(`${FRONTEND_URL}/terms`);
    await pageOut.waitForTimeout(1500);
    await pageOut.screenshot({ path: path.join(outDir, 'mobile_bar_loggedout_390.png') });

    const hamOut = pageOut.locator('#nav-hamburger-btn');
    if (await hamOut.isVisible()) {
      await hamOut.click();
      await pageOut.waitForTimeout(400);
      await pageOut.screenshot({ path: path.join(outDir, 'mobile_sheet_loggedout_390.png') });
    }
    await ctxOut.close();

    console.log('All verification checks completed successfully!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

main();
