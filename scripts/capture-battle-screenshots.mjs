/**
 * scripts/capture-battle-screenshots.mjs
 *
 * Captures screenshots of the Phase C Battle Room:
 * 1. Desktop 3-pane layout (1366x768)
 * 2. Problem collapsed state (1366x768)
 * 3. Resign confirmation modal (1366x768)
 * 4. Mobile Problem tab (390x844)
 * 5. Mobile Code tab (390x844)
 * 6. Mobile Rival tab (390x844)
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const ARTIFACT_DIR = path.resolve(process.env.HOME, '.gemini/antigravity/brain/7068b68a-c0f7-4ee0-a57a-4dc3144aa86b');
const OUT_DIR = path.join(rootDir, 'private', 'battle-screenshots');

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log('Capturing Phase C Battle Room screenshots...');
  const browser = await chromium.launch({ headless: true });

  const testUser = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1210,
    email: 'ayush916282580@gmail.com',
    is_username_set: true,
    institute_locked: true,
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1d' });

  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const roomId = 'room:shotc' + Math.floor(Math.random() * 1000);
  const mockState = {
    roomId,
    topic: 'arrays',
    difficulty: 'medium',
    problemId: 'a72830b5-7c9d-4467-ba9b-78bc71556b95',
    players: [
      { userId: testUser.id, username: testUser.username, rating: 1210 },
      { userId: 'opponent-id-999', username: 'rival_master', rating: 1271 }
    ],
    startedAt: Date.now() - 120_000 // 2 minutes elapsed
  };

  await ctx.addInitScript(({ token, testUser, roomId, mockState }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(testUser));
    localStorage.removeItem('aa_active_match');
    sessionStorage.setItem(`aa_match_${roomId}`, JSON.stringify(mockState));
  }, { token, testUser, roomId, mockState });

  const page = await ctx.newPage();
  await page.goto(`${FRONTEND_URL}/match/${roomId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  async function saveShot(name) {
    const p1 = path.join(ARTIFACT_DIR, `${name}.png`);
    const p2 = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: p1, fullPage: false });
    fs.copyFileSync(p1, p2);
    console.log(`Saved screenshot: ${name}`);
  }

  // 1. Desktop 3-pane layout
  await saveShot('battle_c_desktop_3pane');

  // 2. Collapse problem panel
  const collapseBtn = page.locator('[title="Collapse problem"], [title="Expand problem"]').first();
  if (await collapseBtn.isVisible()) {
    await collapseBtn.click();
    await page.waitForTimeout(400);
    await saveShot('battle_c_problem_collapsed');
    await collapseBtn.click();
    await page.waitForTimeout(400);
  }

  // 3. Open Resign Modal
  const resignBtn = page.locator('button:has-text("Resign")').first();
  if (await resignBtn.isVisible()) {
    await resignBtn.click();
    await page.waitForTimeout(400);
    await saveShot('battle_c_resign_modal');
    // Close modal
    const keepPlaying = page.locator('button:has-text("Keep Playing")').first();
    if (await keepPlaying.isVisible()) await keepPlaying.click();
    await page.waitForTimeout(300);
  }

  // 4. Mobile Viewport (390x844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  // Problem tab
  const probTab = page.locator('button:has-text("Problem")').first();
  if (await probTab.isVisible()) {
    await probTab.click();
    await page.waitForTimeout(300);
    await saveShot('battle_c_mobile_problem');
  }

  // Code tab
  const codeTab = page.locator('button:has-text("Code")').first();
  if (await codeTab.isVisible()) {
    await codeTab.click();
    await page.waitForTimeout(300);
    await saveShot('battle_c_mobile_code');
  }

  // Rival tab
  const rivalTab = page.locator('button:has-text("Rival")').first();
  if (await rivalTab.isVisible()) {
    await rivalTab.click();
    await page.waitForTimeout(300);
    await saveShot('battle_c_mobile_rival');
  }

  await browser.close();
  console.log('Finished capturing Phase C screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

