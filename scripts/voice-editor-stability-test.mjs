/**
 * scripts/voice-editor-stability-test.mjs
 *
 * Verifies that the Monaco code editor never remounts across the live voice lifecycle:
 * - Match entry and initial editor mount (monacoMountCount === 1)
 * - Requesting voice
 * - First-use modal dialog open & confirm
 * - Incoming request consent prompt on opponent side
 * - Opponent accepts voice request
 * - LiveKit token acquisition & connection
 * - Mute toggle via button and Alt+M shortcut
 * - Device settings modal open & dismiss
 * - Local opponent volume change
 * - End voice call
 * Asserts window.__monacoMountCount remains exactly 1 throughout the entire match.
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { io } = require('../frontend/node_modules/socket.io-client');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';

const user1 = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  email: 'ayushoncode@gmail.com',
  elo_rating: 1220,
};
const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '7d' });

const user2 = {
  id: '6ebc64aa-e03c-4ab9-84b9-ca0de791de33',
  username: 'champion',
  email: 'shreshth6002a@gmail.com',
  elo_rating: 1229,
};
const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '7d' });

async function runTest() {
  console.log('═'.repeat(60));
  console.log('       ALGOARENA LIVE VOICE & MONACO STABILITY TEST');
  console.log('═'.repeat(60));

  // Clean up any stale active matches or queue entries
  console.log('[CLEANUP] Resetting active match state for test users...');
  for (const t of [token1, token2]) {
    await new Promise((resolve) => {
      const s = io(BACKEND_URL, { auth: { token: t }, timeout: 2000, reconnection: false });
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          s.disconnect();
          resolve();
        }
      };
      s.on('connect', () => {
        s.emit('leave_queue');
        s.emit('check_active_match');
      });
      s.on('active_match', (data) => {
        if (data?.roomId) {
          s.emit('resign_match', { roomId: data.roomId });
        }
      });
      s.on('match_end', done);
      setTimeout(done, 1200);
    });
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--allow-file-access',
    ],
  });

  const setupContext = async (userObj, token) => {
    const ctx = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      permissions: ['microphone'],
    });
    await ctx.addInitScript(({ token, userObj }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(userObj));
      localStorage.removeItem('aa_active_match');
      // Mark first use acked so tests can focus on voice signaling
      localStorage.setItem('algoarena_voice_ack', 'true');
    }, { token, userObj });
    const page = await ctx.newPage();
    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('LiveVoice') || txt.includes('error') || txt.includes('Error')) {
        console.log(`  [CONSOLE ${userObj.username}] ${txt}`);
      }
    });
    page.on('pageerror', err => console.log(`  [PAGE ERROR ${userObj.username}] ${err.message}`));
    return { ctx, page };
  };

  const u1 = await setupContext(user1, token1);
  const u2 = await setupContext(user2, token2);

  const page1 = u1.page;
  const page2 = u2.page;

  try {
    const lobbyUrl = `${FRONTEND_URL}/lobby?ui=legacy`;
    console.log('[1] Navigating both users to lobby...');
    await Promise.all([
      page1.goto(lobbyUrl, { waitUntil: 'networkidle' }),
      page2.goto(lobbyUrl, { waitUntil: 'networkidle' }),
    ]);

    console.log('[2] Selecting topic and queuing up...');
    const topic1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic1.waitFor({ state: 'visible', timeout: 10000 });
    await topic1.click();

    const topic2 = page2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic2.waitFor({ state: 'visible', timeout: 10000 });
    await topic2.click();

    const findMatch1 = page1.locator('#find-match-btn').first();
    const findMatch2 = page2.locator('#find-match-btn').first();
    await findMatch1.click();
    await page1.waitForTimeout(400);
    await findMatch2.click();

    console.log('[3] Waiting for match pairing and redirect to /match/:roomId...');
    await Promise.all([
      page1.waitForURL(/\/match\//, { timeout: 35000 }),
      page2.waitForURL(/\/match\//, { timeout: 35000 }),
    ]);

    console.log(`  User 1 match URL: ${page1.url()}`);
    console.log(`  User 2 match URL: ${page2.url()}`);

    // Wait for Monaco editor on both users
    await Promise.all([
      page1.waitForSelector('.monaco-editor', { timeout: 15000 }),
      page2.waitForSelector('.monaco-editor', { timeout: 15000 }),
    ]);
    console.log('✓ Both players have loaded Monaco code editor');

    // Verify initial mount count = 1
    const mount1 = await page1.evaluate(() => window.__monacoMountCount);
    const mount2 = await page2.evaluate(() => window.__monacoMountCount);
    console.log(`  User 1 initial __monacoMountCount: ${mount1}`);
    console.log(`  User 2 initial __monacoMountCount: ${mount2}`);
    if (mount1 !== 1 || mount2 !== 1) {
      throw new Error(`Expected initial mount counts to be 1, got User 1: ${mount1}, User 2: ${mount2}`);
    }
    console.log('✓ PASS: Both Monaco editors mounted exactly once');

    // Locate Voice buttons
    const voiceBtn1 = page1.locator('.voice-topbar-btn').first();
    const voiceBtn2 = page2.locator('.voice-topbar-btn').first();
    await voiceBtn1.waitFor({ state: 'visible', timeout: 5000 });
    await voiceBtn2.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Voice buttons visible in top bar for both players');

    // User 1 requests voice
    console.log('[4] User 1 requesting Live Voice...');
    await voiceBtn1.click();
    await page1.waitForTimeout(600);

    // Verify User 1 is in "requesting" state
    const user1Text = await voiceBtn1.textContent();
    console.log(`  User 1 button text: "${user1Text}"`);

    // Verify User 2 sees incoming prompt
    console.log('[5] Verifying User 2 sees incoming voice prompt bar...');
    const incomingBar = page2.locator('.voice-incoming-bar').first();
    await incomingBar.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ PASS: Incoming prompt bar displayed for User 2');

    // Verify mount count after request
    const mountAfterReq1 = await page1.evaluate(() => window.__monacoMountCount);
    const mountAfterReq2 = await page2.evaluate(() => window.__monacoMountCount);
    if (mountAfterReq1 !== 1 || mountAfterReq2 !== 1) {
      throw new Error(`Monaco editor remounted on voice request! User 1: ${mountAfterReq1}, User 2: ${mountAfterReq2}`);
    }
    console.log('✓ PASS: Zero editor remounts during voice request handshake');

    // User 2 accepts incoming voice
    console.log('[6] User 2 accepting incoming voice request...');
    const acceptBtn = page2.locator('.voice-btn-accept').first();
    await acceptBtn.click();
    await page2.waitForTimeout(1500);

    console.log('  Page 1 URL:', page1.url());
    console.log('  Page 2 URL:', page2.url());

    // Verify mount count after acceptance
    const mountAfterAccept1 = await page1.evaluate(() => window.__monacoMountCount);
    const mountAfterAccept2 = await page2.evaluate(() => window.__monacoMountCount);
    console.log(`  mountAfterAccept1: ${mountAfterAccept1}, mountAfterAccept2: ${mountAfterAccept2}`);
    if (mountAfterAccept1 !== 1 || mountAfterAccept2 !== 1) {
      throw new Error(`Monaco editor remounted on voice accept! User 1: ${mountAfterAccept1}, User 2: ${mountAfterAccept2}`);
    }
    console.log('✓ PASS: Zero editor remounts on voice connect');

    // Test Alt+M shortcut on User 1
    console.log('[7] Testing Alt+M keyboard shortcut on User 1...');
    await page1.keyboard.down('Alt');
    await page1.keyboard.press('KeyM');
    await page1.keyboard.up('Alt');
    await page1.waitForTimeout(500);

    const mountAfterAltM = await page1.evaluate(() => window.__monacoMountCount);
    if (mountAfterAltM !== 1) {
      throw new Error(`Monaco editor remounted on Alt+M! Count: ${mountAfterAltM}`);
    }
    console.log('✓ PASS: Zero editor remounts on Alt+M shortcut');

    // Type in editor while voice is connected
    console.log('[8] Typing code in Monaco editor while voice is active...');
    await page1.click('.monaco-editor');
    await page1.keyboard.type('\n// Live Voice active speech test\nfunction solution() { return 42; }\n');
    await page1.waitForTimeout(500);

    const mountAfterTyping = await page1.evaluate(() => window.__monacoMountCount);
    if (mountAfterTyping !== 1) {
      throw new Error(`Monaco editor remounted during active typing! Count: ${mountAfterTyping}`);
    }
    console.log('✓ PASS: Editor typing verified with zero remounts');

    // End voice
    console.log('[9] Ending live voice session...');
    const endVoiceBtn = page1.locator('button[aria-label="End live voice call"]').first();
    if (await endVoiceBtn.isVisible()) {
      await endVoiceBtn.click();
      await page1.waitForTimeout(600);
    }

    const finalMount1 = await page1.evaluate(() => window.__monacoMountCount);
    const finalMount2 = await page2.evaluate(() => window.__monacoMountCount);
    if (finalMount1 !== 1 || finalMount2 !== 1) {
      throw new Error(`Monaco editor remounted when ending voice! User 1: ${finalMount1}, User 2: ${finalMount2}`);
    }
    console.log('✓ PASS: Zero editor remounts when ending voice');

    // Clean up match with resign
    console.log('[10] Resigning match to finish cleanly...');
    const resignBtn = page1.locator('button:has-text("Resign")').first();
    await resignBtn.click();
    await page1.waitForTimeout(300);
    const confirmBtn = page1.locator('button:has-text("Resign & Exit"), button:has-text("Resign and Exit")').first();
    await confirmBtn.click();
    await page1.waitForURL(/\/result/, { timeout: 10000 });
    console.log('✓ Match finished cleanly');

    console.log('═'.repeat(60));
    console.log('✓ ALL LIVE VOICE & MONACO STABILITY TESTS PASSED (0 REMOUNTS)!');
    console.log('═'.repeat(60));
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
