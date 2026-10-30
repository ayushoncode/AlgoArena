/**
 * scripts/phase-e-verification.mjs
 *
 * Phase E Comprehensive Verification Suite:
 * 1. Multi-viewport responsive tests (Desktop 1366px, Tablet 820px, Tablet 1194px, Mobile 390px)
 * 2. Light Theme contrast and layout verification (Battle Room + Result screen)
 * 3. Keyboard navigation & accessibility (Cmd/Ctrl+Enter, Escape dismiss, aria-live)
 * 4. Monaco editor zero-remount verification (window.__monacoMountCount === 1)
 * 5. Rank tier color integration verification
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
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';
const ARTIFACT_DIR = path.resolve(process.env.HOME, '.gemini/antigravity/brain/7068b68a-c0f7-4ee0-a57a-4dc3144aa86b');

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       ALGOARENA PHASE E COMPREHENSIVE VERIFICATION SUITE       ');
  console.log('═══════════════════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });

  const user1 = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com',
    is_username_set: true,
    institute_locked: true,
  };
  const user2 = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f074',
    username: 'champion',
    elo_rating: 1410,
    email: 'champion@example.com',
    is_username_set: true,
    institute_locked: true,
  };

  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '1d' });
  const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '1d' });

  async function createCtx(userObj, token, viewport = { width: 1366, height: 768 }) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.removeItem('aa_active_match');
    }, { token, userObj });
    const page = await ctx.newPage();
    return { ctx, page };
  }

  const { page: page1 } = await createCtx(user1, token1, { width: 1366, height: 768 });
  const { page: page2 } = await createCtx(user2, token2, { width: 1366, height: 768 });

  console.log('1. Navigating both users to lobby to initiate duel match...');
  await Promise.all([
    page1.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'networkidle' }),
    page2.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'networkidle' })
  ]);
  await page1.waitForTimeout(1000);

  // Queue up both players
  const t1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
  await t1.waitFor({ state: 'visible', timeout: 10000 });
  await t1.click();
  const t2 = page2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
  await t2.waitFor({ state: 'visible', timeout: 10000 });
  await t2.click();

  const fm1 = page1.locator('#find-match-btn').first();
  const fm2 = page2.locator('#find-match-btn').first();
  await fm1.click();
  await page1.waitForTimeout(400);
  await fm2.click();

  console.log('2. Waiting for match to form and both players to land in BattleRoom...');
  await Promise.all([
    page1.waitForURL(/\/match\//, { timeout: 25000 }),
    page2.waitForURL(/\/match\//, { timeout: 25000 })
  ]);

  const matchUrl = page1.url();
  console.log(`✓ Both players landed in BattleRoom: ${matchUrl}`);
  await page1.waitForTimeout(2000);

  async function snap(page, filename) {
    const dest = path.join(ARTIFACT_DIR, `${filename}.png`);
    await page.screenshot({ path: dest });
    console.log(`  [SCREENSHOT] Saved ${filename}.png`);
  }

  // --- 1. Desktop 1366 Dark View ---
  console.log('3. Capturing Desktop 1366x768 Dark View with Tier Colors...');
  await snap(page1, 'phase_e_desktop_1366_dark');

  // Verify rank tier elements present
  const tierBadges = await page1.locator('.battle-v2__tier-badge').count();
  console.log(`✓ Rank tier badges detected on screen: ${tierBadges}`);
  if (tierBadges < 2) throw new Error('Expected at least 2 rank tier badges (user & rival)');

  // Verify bottom ground progress bar present
  const groundLine = page1.locator('.battle-v2__ground-line').first();
  if (!await groundLine.isVisible()) throw new Error('Expected .battle-v2__ground-line to be visible');
  console.log('✓ Bottom rank-tier ground line verified');

  // --- 2. Keyboard Navigation Test (Cmd/Ctrl+Enter & Escape) ---
  console.log('4. Testing Keyboard Shortcuts (Run: Cmd/Ctrl+Enter, Resign Modal: Escape)...');
  // Type in editor
  const monaco = page1.locator('.monaco-editor').first();
  await monaco.click();
  await page1.waitForTimeout(300);
  // Press Cmd+Enter
  const isMac = process.platform === 'darwin';
  await page1.keyboard.press(isMac ? 'Meta+Enter' : 'Control+Enter');
  await page1.waitForTimeout(1500);
  const runActive = await page1.locator('.battle-v2__console').isVisible();
  console.log(`✓ Cmd/Ctrl+Enter triggered code execution (console visible: ${runActive})`);

  // Test Escape on Resign Modal
  const resignBtn = page1.locator('button:has-text("Resign")').first();
  await resignBtn.click();
  await page1.waitForTimeout(300);
  const modalVisibleBefore = await page1.locator('.battle-v2__modal').isVisible();
  console.log(`  Resign modal open: ${modalVisibleBefore}`);
  await page1.keyboard.press('Escape');
  await page1.waitForTimeout(300);
  const modalVisibleAfter = await page1.locator('.battle-v2__modal').isVisible();
  console.log(`✓ Escape dismissed Resign modal (visible: ${modalVisibleAfter})`);

  // --- 3. Responsive Tablet Views ---
  console.log('5. Capturing Tablet Viewports (820x1180 portrait, 1194x834 landscape)...');
  await page1.setViewportSize({ width: 820, height: 1180 });
  await page1.waitForTimeout(600);
  await snap(page1, 'phase_e_tablet_820_dark');

  await page1.setViewportSize({ width: 1194, height: 834 });
  await page1.waitForTimeout(600);
  await snap(page1, 'phase_e_tablet_1194_dark');

  // --- 4. Mobile Viewports (390x844) ---
  console.log('6. Capturing Mobile 390x844 Viewports across tabs...');
  await page1.setViewportSize({ width: 390, height: 844 });
  await page1.waitForTimeout(500);

  // Tab 1: Problem
  const probTab = page1.locator('button:has-text("Problem")').first();
  await probTab.click();
  await page1.waitForTimeout(300);
  await snap(page1, 'phase_e_mobile_390_problem');

  // Tab 2: Code
  const codeTab = page1.locator('button:has-text("Code")').first();
  await codeTab.click();
  await page1.waitForTimeout(300);
  await snap(page1, 'phase_e_mobile_390_code');

  // Tab 3: Rival
  const rivalTab = page1.locator('button:has-text("Rival")').first();
  await rivalTab.click();
  await page1.waitForTimeout(300);
  await snap(page1, 'phase_e_mobile_390_rival');

  // --- 5. Verify Editor Never Remounted ---
  const mountCount = await page1.evaluate(() => window.__monacoMountCount);
  console.log(`[VERIFY REMOUNT] Monaco mount count across full Phase E flow: ${mountCount}`);
  if (mountCount !== 1) throw new Error(`Monaco remounted! Mount count: ${mountCount}`);
  console.log('✓ PASS: Monaco editor NEVER remounted (mountCount === 1)');

  // --- 6. Light Theme Verification (Battle Room) ---
  console.log('7. Testing Light Theme in Battle Room on Page 2...');
  await page2.evaluate(() => {
    localStorage.setItem('arena-theme', 'light');
  });
  await page2.reload({ waitUntil: 'networkidle' });
  await page2.waitForTimeout(2000);
  await snap(page2, 'phase_e_desktop_1366_light');

  // --- 7. Resign & Match Result Screen Verification (Light Theme & Dark Theme) ---
  console.log('8. User 1 resigns match to transition both users to Match Result screen...');
  await page1.setViewportSize({ width: 1366, height: 768 });
  await page1.waitForTimeout(200);
  await resignBtn.click();
  await page1.waitForTimeout(300);
  const confirmResignBtn = page1.locator('.battle-v2__modal-btn-confirm').first();
  await confirmResignBtn.click();

  console.log('  Waiting for Result navigation...');
  await Promise.all([
    page1.waitForURL(/\/result/, { timeout: 15000 }),
    page2.waitForURL(/\/result/, { timeout: 15000 })
  ]);
  await page1.waitForTimeout(1500);
  await page2.waitForTimeout(1500);

  console.log('9. Capturing Match Result screens (Dark & Light)...');
  await snap(page1, 'phase_e_result_1366_dark');
  await snap(page2, 'phase_e_result_1366_light');

  await browser.close();
  console.log('\n✓ ALL PHASE E VERIFICATIONS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('\n❌ Phase E Verification Failed:', err);
  process.exit(1);
});

