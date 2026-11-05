/**
 * scripts/capture-voice-before-screenshots.mjs
 *
 * Captures comprehensive screenshots of EVERY voice state and the Rival panel
 * as they look today at:
 *   - 1366x768 (Desktop)
 *   - 820x1180 (Tablet portrait)
 *   - 390x844 (Mobile modern)
 *   - 360x640 (Mobile compact)
 *   - 844x390 (Mobile landscape)
 * in both Dark and Light themes.
 *
 * Saves to private/voice-screenshots/before/
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

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const OUT_DIR = path.join(rootDir, 'private', 'voice-screenshots', 'before');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const userPremium = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  email: 'ayush916282580@gmail.com',
  elo_rating: 1220,
};
const tokenPremium = jwt.sign(userPremium, JWT_SECRET, { expiresIn: '7d' });

const userFree = {
  id: '99999999-9999-9999-9999-999999999999',
  username: 'freereader',
  email: 'free@algoarena.io',
  elo_rating: 1050,
};
const tokenFree = jwt.sign(userFree, JWT_SECRET, { expiresIn: '7d' });

const VIEWPORTS = [
  { name: '1366x768', width: 1366, height: 768, isMobile: false },
  { name: '820x1180', width: 820, height: 1180, isMobile: false },
  { name: '390x844', width: 390, height: 844, isMobile: true },
  { name: '360x640', width: 360, height: 640, isMobile: true },
  { name: '844x390', width: 844, height: 390, isMobile: true },
];

const THEMES = ['dark', 'light'];

async function run() {
  console.log('═'.repeat(60));
  console.log('  CAPTURING COMPREHENSIVE BEFORE SCREENSHOTS (5 VIEWPORTS x 2 THEMES)');
  console.log('═'.repeat(60));

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n>>> VIEWPORT: ${vp.name} (${vp.width}x${vp.height}) <<<`);

      for (const theme of THEMES) {
        console.log(`  [Theme: ${theme}]`);

        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          permissions: ['microphone'],
        });

        // Inject initial mock state in browser context
        await ctx.addInitScript(({ token, user, theme }) => {
          localStorage.setItem('aa_token', token);
          localStorage.setItem('aa_user', JSON.stringify(user));
          localStorage.setItem('aa_theme', theme);
          localStorage.setItem('algoarena_voice_ack', 'true');
          document.documentElement.setAttribute('data-theme', theme);

          // Seed match state in sessionStorage
          const matchState = {
            roomId: 'room:before_preview',
            topic: 'arrays',
            difficulty: 'medium',
            problemId: 'two-sum',
            players: [
              { userId: user.id, username: user.username, rating: user.elo_rating },
              { userId: '77017a8f-4ef6-415c-b4dd-266efdfe43e4', username: 'ayush_ayush', rating: 1229 }
            ]
          };
          sessionStorage.setItem('aa_match_room:before_preview', JSON.stringify(matchState));
        }, { token: tokenPremium, user: userPremium, theme });

        const page = await ctx.newPage();
        await page.goto(`${FRONTEND_URL}/match/room:before_preview`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Function helper to capture
        const shot = async (stateName) => {
          const fileName = `${stateName}_${vp.name}_${theme}.png`;
          const filePath = path.join(OUT_DIR, fileName);
          await page.screenshot({ path: filePath, fullPage: false });
          console.log(`    ✓ Saved: ${fileName}`);
        };

        // If mobile, switch to 'Rival' tab for inspecting Rival panel and voice card
        if (vp.isMobile) {
          const rivalTab = page.locator('button:has-text("Rival")').first();
          if (await rivalTab.isVisible()) {
            await rivalTab.click();
            await page.waitForTimeout(300);
          }
        }

        // 1. STATE: OFF (Idle)
        await shot('01_off');

        // 2. STATE: LOCKED (Free User)
        await page.evaluate(() => {
          const freeUser = { id: '9999', username: 'free_player', elo_rating: 1000 };
          localStorage.setItem('aa_user', JSON.stringify(freeUser));
          // dispatch event if needed
        });
        // We can capture locked topbar or button
        // Let's create a free user context quickly for locked
        {
          const ctxFree = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
          });
          await ctxFree.addInitScript(({ token, user, theme }) => {
            localStorage.setItem('aa_token', token);
            localStorage.setItem('aa_user', JSON.stringify(user));
            localStorage.setItem('aa_theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
            const matchState = {
              roomId: 'room:before_locked',
              topic: 'arrays',
              difficulty: 'medium',
              players: [
                { userId: user.id, username: user.username, rating: user.elo_rating },
                { userId: '77017a8f', username: 'ayush_ayush', rating: 1229 }
              ]
            };
            sessionStorage.setItem('aa_match_room:before_locked', JSON.stringify(matchState));
          }, { token: tokenFree, user: userFree, theme });

          const pFree = await ctxFree.newPage();
          await pFree.goto(`${FRONTEND_URL}/match/room:before_locked`);
          await pFree.waitForLoadState('networkidle');
          await pFree.waitForTimeout(600);
          if (vp.isMobile) {
            const rivalTab = pFree.locator('button:has-text("Rival")').first();
            if (await rivalTab.isVisible()) await rivalTab.click();
            await pFree.waitForTimeout(300);
          }
          await pFree.screenshot({ path: path.join(OUT_DIR, `02_locked_${vp.name}_${theme}.png`) });
          console.log(`    ✓ Saved: 02_locked_${vp.name}_${theme}.png`);
          await ctxFree.close();
        }

        // 3. STATE: OPPONENT NOT PREMIUM
        // Set error banner: "Your opponent needs Premium for voice."
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('voice-test-state', {
            detail: { errorMessage: 'Your opponent needs Premium for voice.' }
          }));
        });
        // Or directly click or manipulate socket event
        await page.evaluate(() => {
          import('/src/utils/socket.js').then(mod => {
            const socket = mod.default;
            if (socket) {
              socket.emit = (event, ...args) => {};
            }
          });
        });

        // 4. STATE: REQUESTING (Waiting for reply 0:24 with Cancel)
        await page.evaluate(() => {
          import('/src/utils/socket.js').then(mod => {
            const s = mod.default;
            if (s) {
              s.emit('voice:state', {
                status: 'requesting',
                requestedBy: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
                expiresAt: Date.now() + 24000,
                requestCount: 1
              });
            }
          });
        });
        await page.waitForTimeout(400);
        await shot('04_requesting');

        // 5. STATE: INCOMING REQUEST (Banner with Accept & Decline)
        await page.evaluate(() => {
          import('/src/utils/socket.js').then(mod => {
            const s = mod.default;
            if (s) {
              s.emit('voice:state', {
                status: 'requesting',
                requestedBy: '77017a8f-4ef6-415c-b4dd-266efdfe43e4', // from opponent
                expiresAt: Date.now() + 28000,
                requestCount: 1
              });
            }
          });
        });
        await page.waitForTimeout(400);
        await shot('05_incoming_request');

        // 6. STATE: CONNECTING
        await page.evaluate(() => {
          import('/src/utils/socket.js').then(mod => {
            const s = mod.default;
            if (s) {
              s.emit('voice:state', { status: 'accepted' });
            }
          });
        });
        await page.waitForTimeout(400);
        await shot('06_connecting');

        // 7. STATE: CONNECTED WITH MIC OFF
        // Force connected state in UI
        await page.evaluate(() => {
          const banner = document.querySelector('.battle-v2');
          // Dispatch fake connected event if available or simulate UI
          window.__setVoiceTestState?.({ voiceState: 'connected', isMicMuted: true });
        });
        await shot('07_connected_mic_off');

        // 8. STATE: LIVE WITH MIC ON
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ voiceState: 'live', isMicMuted: false, speakingLevel: 0.6 });
        });
        await shot('08_live_mic_on');

        // 9. STATE: SPEAKING RING
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ voiceState: 'live', isOpponentSpeaking: true, opponentSpeakingLevel: 0.8 });
        });
        await shot('09_speaking_ring');

        // 10. STATE: RECONNECTING
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ voiceState: 'reconnecting' });
        });
        await shot('10_reconnecting');

        // 11. STATE: FAILED (Permission Denied)
        await page.evaluate(() => {
          window.__setVoiceTestState?.({
            voiceState: 'failed',
            errorMessage: 'Microphone permission was denied. Allow microphone access in your browser settings to use voice.'
          });
        });
        await shot('11_failed_permission_denied');

        // 12. STATE: FAILED (No Mic)
        await page.evaluate(() => {
          window.__setVoiceTestState?.({
            voiceState: 'failed',
            errorMessage: 'No microphone was found on this device.'
          });
        });
        await shot('12_failed_no_mic');

        // 13. STATE: FAILED (In-App Browser)
        await page.evaluate(() => {
          window.__setVoiceTestState?.({
            voiceState: 'failed',
            errorMessage: 'Voice chat is not supported inside embedded browsers. Please open this page in Chrome or Safari.'
          });
        });
        await shot('13_failed_in_app_browser');

        // 14. STATE: ENDED
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ voiceState: 'ended' });
        });
        await shot('14_ended');

        // 15. FIRST-USE DIALOG
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ showFirstUseModal: true });
        });
        await page.waitForTimeout(400);
        await shot('15_first_use_dialog');

        // 16. REPORT DIALOG
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ showFirstUseModal: false, showReportModal: true });
        });
        await page.waitForTimeout(400);
        await shot('16_report_dialog');

        // 17. SETTINGS DIALOG
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ showReportModal: false, showSettingsModal: true });
        });
        await page.waitForTimeout(400);
        await shot('17_settings_dialog');

        // 18. OVERFLOW MENU OPEN
        await page.evaluate(() => {
          window.__setVoiceTestState?.({ showSettingsModal: false, voiceState: 'connected' });
        });
        await page.waitForTimeout(300);
        const overflowBtn = page.locator('button.voice-dock__more-btn, button[aria-label="Voice settings and actions"]').first();
        if (await overflowBtn.isVisible()) {
          await overflowBtn.click();
          await page.waitForTimeout(300);
          await shot('18_overflow_menu_open');
        }

        // Close context
        await ctx.close();
      }
    }

    console.log('\n✓ Comprehensive screenshot suite completed!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[Screenshot Error]', err);
  process.exit(1);
});

