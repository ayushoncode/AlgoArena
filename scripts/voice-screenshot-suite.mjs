/**
 * scripts/voice-screenshot-suite.mjs
 *
 * Captures clean, pixel-perfect screenshots of Live Voice components
 * across required viewports (390, 820, 1194, 1536) in Dark and Light themes.
 * Saves to private/voice-screenshots/
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
const OUT_DIR = path.join(rootDir, 'private', 'voice-screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

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

const VIEWPORTS = [
  { name: 'phone_390', width: 390, height: 844 },
  { name: 'tablet_820', width: 820, height: 1180 },
  { name: 'laptop_1194', width: 1194, height: 834 },
  { name: 'desktop_1536', width: 1536, height: 960 },
];

async function capture() {
  console.log('═'.repeat(60));
  console.log('       ALGOARENA VOICE SCREENSHOT CAPTURE SUITE');
  console.log('═'.repeat(60));

  // Reset any active matches
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
        if (data?.roomId) s.emit('resign_match', { roomId: data.roomId });
      });
      s.on('match_end', done);
      setTimeout(done, 1200);
    });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n[VIEWPORT] Capturing for ${vp.name} (${vp.width}x${vp.height})...`);

      for (const theme of ['dark', 'light']) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          permissions: ['microphone'],
        });

        await ctx.addInitScript(({ token, user, theme }) => {
          localStorage.setItem('aa_token', token);
          localStorage.setItem('aa_user', JSON.stringify(user));
          localStorage.setItem('aa_theme', theme);
          document.documentElement.setAttribute('data-theme', theme);
        }, { token: token1, user: user1, theme });

        const page = await ctx.newPage();

        // 1. First-Use Modal Preview
        await page.goto(`${FRONTEND_URL}/match/room:preview_voice`);
        await page.waitForTimeout(1000);

        // Click Voice button to open first-use modal
        const voiceBtn = page.locator('.voice-topbar-btn').first();
        if (await voiceBtn.isVisible()) {
          await voiceBtn.click();
          await page.waitForTimeout(400);
          const firstUseModal = page.locator('.voice-modal-frame').first();
          if (await firstUseModal.isVisible()) {
            const shotPath = path.join(OUT_DIR, `first_use_modal_${vp.name}_${theme}.png`);
            await page.screenshot({ path: shotPath, fullPage: false });
            console.log(`  ✓ Saved: first_use_modal_${vp.name}_${theme}.png`);
          }
        }

        // Close context
        await ctx.close();
      }
    }

    // Now capture Live Connected Voice Dock and Modals in Desktop 1536
    console.log('\n[LIVE SESSION] Capturing connected dock and settings modal at 1536...');
    const ctx1 = await browser.newContext({
      viewport: { width: 1536, height: 960 },
      permissions: ['microphone'],
    });
    const ctx2 = await browser.newContext({
      viewport: { width: 1536, height: 960 },
      permissions: ['microphone'],
    });

    await ctx1.addInitScript(({ token, user }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(user));
      localStorage.setItem('algoarena_voice_ack', 'true');
    }, { token: token1, user: user1 });

    await ctx2.addInitScript(({ token, user }) => {
      localStorage.setItem('aa_token', token);
      localStorage.setItem('aa_user', JSON.stringify(user));
      localStorage.setItem('algoarena_voice_ack', 'true');
    }, { token: token2, user: user2 });

    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    // Queue up
    await Promise.all([
      p1.goto(`${FRONTEND_URL}/lobby?ui=legacy`, { waitUntil: 'networkidle' }),
      p2.goto(`${FRONTEND_URL}/lobby?ui=legacy`, { waitUntil: 'networkidle' }),
    ]);

    const topic1 = p1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    const topic2 = p2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic1.click();
    await topic2.click();

    await p1.locator('#find-match-btn').click();
    await p1.waitForTimeout(400);
    await p2.locator('#find-match-btn').click();

    await Promise.all([
      p1.waitForURL(/\/match\//, { timeout: 35000 }),
      p2.waitForURL(/\/match\//, { timeout: 35000 }),
    ]);

    await p1.waitForSelector('.monaco-editor', { timeout: 15000 });
    await p2.waitForSelector('.monaco-editor', { timeout: 15000 });

    // User 1 requests voice
    await p1.locator('.voice-topbar-btn').first().click();
    await p1.waitForTimeout(600);

    // Capture User 2 incoming prompt banner
    const incomingPromptShot = path.join(OUT_DIR, 'incoming_prompt_desktop_1536_dark.png');
    await p2.screenshot({ path: incomingPromptShot });
    console.log(`  ✓ Saved: incoming_prompt_desktop_1536_dark.png`);

    // User 2 accepts
    await p2.locator('.voice-btn-accept').first().click();
    await p1.waitForTimeout(2000);

    // Capture User 1 connected voice dock in topbar
    const dockShot = path.join(OUT_DIR, 'connected_dock_desktop_1536_dark.png');
    await p1.screenshot({ path: dockShot });
    console.log(`  ✓ Saved: connected_dock_desktop_1536_dark.png`);

    // Open Settings Modal via dock overflow
    const overflowBtn = p1.locator('.voice-dock button[aria-label="Voice options menu"]').first();
    if (await overflowBtn.isVisible()) {
      await overflowBtn.click();
      await p1.waitForTimeout(300);
      const settingsOption = p1.locator('button[role="menuitem"]').filter({ hasText: /Voice settings/i }).first();
      if (await settingsOption.isVisible()) {
        await settingsOption.click();
        await p1.waitForTimeout(400);
        const settingsShot = path.join(OUT_DIR, 'settings_modal_desktop_1536_dark.png');
        await p1.screenshot({ path: settingsShot });
        console.log(`  ✓ Saved: settings_modal_desktop_1536_dark.png`);
        await p1.keyboard.press('Escape');
        await p1.waitForTimeout(300);
      }

      // Capture Report Modal
      await overflowBtn.click();
      await p1.waitForTimeout(300);
      const reportOption = p1.locator('button[role="menuitem"]').filter({ hasText: /Report voice/i }).first();
      if (await reportOption.isVisible()) {
        await reportOption.click();
        await p1.waitForTimeout(400);
        const reportShot = path.join(OUT_DIR, 'report_modal_desktop_1536_dark.png');
        await p1.screenshot({ path: reportShot });
        console.log(`  ✓ Saved: report_modal_desktop_1536_dark.png`);
        await p1.keyboard.press('Escape');
        await p1.waitForTimeout(300);
      }

      // Capture Block Modal
      await overflowBtn.click();
      await p1.waitForTimeout(300);
      const blockOption = p1.locator('button[role="menuitem"]').filter({ hasText: /Block voice/i }).first();
      if (await blockOption.isVisible()) {
        await blockOption.click();
        await p1.waitForTimeout(400);
        const blockShot = path.join(OUT_DIR, 'block_modal_desktop_1536_dark.png');
        await p1.screenshot({ path: blockShot });
        console.log(`  ✓ Saved: block_modal_desktop_1536_dark.png`);
        await p1.keyboard.press('Escape');
        await p1.waitForTimeout(300);
      }
    }

    // Clean up
    await p1.locator('button:has-text("Resign")').first().click();
    await p1.waitForTimeout(300);
    await p1.locator('button:has-text("Resign & Exit")').first().click();
    await p1.waitForURL(/\/result/, { timeout: 10000 });

    console.log('\n═'.repeat(60));
    console.log('✓ SCREENSHOT SUITE COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(60));
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

