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

async function capture() {
  const testUser = {
    id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
    username: 'ayush_ayush',
    display_name: 'Ayush Singh',
    email: 'ayush916282580@gmail.com',
    elo_rating: 1239,
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  await page.addInitScript(({ tokenVal, userVal }) => {
    localStorage.setItem('aa_token', tokenVal);
    localStorage.setItem('aa_user', JSON.stringify(userVal));
  }, { tokenVal: token, userVal: testUser });

  console.log('Navigating to /profile...');
  await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // 1. Capture main profile view
  const artifactPath = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663/profile_restructured_clean.png';
  await page.screenshot({ path: artifactPath, fullPage: true });
  console.log(`Saved clean profile screenshot to: ${artifactPath}`);

  // 2. Click "Edit Profile" and capture modal
  const editBtn = page.locator('button:has-text("Edit Profile")');
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(500);
    const modalArtifactPath = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663/profile_edit_modal.png';
    await page.screenshot({ path: modalArtifactPath, fullPage: false });
    console.log(`Saved edit modal screenshot to: ${modalArtifactPath}`);

    // Close modal
    const closeBtn = page.locator('.btn-modal-close');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(400);
  }

  // 3. Click "View as table" and capture table mode
  const tableToggleBtn = page.locator('button:has-text("View as table")');
  if (await tableToggleBtn.isVisible()) {
    await tableToggleBtn.click();
    await page.waitForTimeout(400);
    const tableArtifactPath = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663/profile_table_mode.png';
    await page.screenshot({ path: tableArtifactPath, fullPage: true });
    console.log(`Saved table mode screenshot to: ${tableArtifactPath}`);

    // Switch back to chart
    const chartToggleBtn = page.locator('button:has-text("View chart")');
    if (await chartToggleBtn.isVisible()) {
      await chartToggleBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // 4. Click share button to capture share popover
  const shareBtn = page.locator('.btn-share-icon');
  if (await shareBtn.isVisible()) {
    await shareBtn.click();
    await page.waitForTimeout(400);
    const shareArtifactPath = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663/profile_share_options.png';
    await page.screenshot({ path: shareArtifactPath, fullPage: false });
    console.log(`Saved share options screenshot to: ${shareArtifactPath}`);
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
