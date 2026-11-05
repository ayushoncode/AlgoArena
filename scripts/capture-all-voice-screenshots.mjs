/**
 * scripts/capture-all-voice-screenshots.mjs
 *
 * Captures clean, high-resolution screenshots of EVERY requested voice state
 * and Rival panel layout at:
 *   - 1366x768 (Desktop)
 *   - 820x1180 (Tablet)
 *   - 390x844 (Modern phone)
 *   - 360x640 (Compact phone)
 *   - 844x390 (Landscape phone)
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

async function main() {
  console.log('═'.repeat(60));
  console.log('   STEP 0: CAPTURING ALL BEFORE VOICE & RIVAL SCREENSHOTS');
  console.log('═'.repeat(60));

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`[VIEWPORT] ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      for (const theme of THEMES) {
        console.log(`  --> Theme: ${theme}`);

        // Helper to launch fresh context
        const createPage = async (isUserFree = false, ack = true) => {
          const ctx = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            permissions: ['microphone'],
          });

          await ctx.addInitScript(({ token, user, theme, ack }) => {
            localStorage.setItem('aa_token', token);
            localStorage.setItem('aa_user', JSON.stringify(user));
            localStorage.setItem('aa_theme', theme);
            if (ack) {
              localStorage.setItem('algoarena_voice_ack', 'true');
            } else {
              localStorage.removeItem('algoarena_voice_ack');
            }
            document.documentElement.setAttribute('data-theme', theme);

            const matchState = {
              roomId: 'room:preview_before',
              topic: 'arrays',
              difficulty: 'medium',
              problemId: 'two-sum',
              players: [
                { userId: user.id, username: user.username, rating: user.elo_rating },
                { userId: '77017a8f-4ef6-415c-b4dd-266efdfe43e4', username: 'ayush_ayush', rating: 1229 }
              ]
            };
            sessionStorage.setItem('aa_match_room:preview_before', JSON.stringify(matchState));
          }, {
            token: isUserFree ? tokenFree : tokenPremium,
            user: isUserFree ? userFree : userPremium,
            theme,
            ack
          });

          const page = await ctx.newPage();
          await page.goto(`${FRONTEND_URL}/match/room:preview_before`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(600);

          return { ctx, page };
        };

        const takeShot = async (page, stateLabel) => {
          const filename = `${stateLabel}_${vp.name}_${theme}.png`;
          const filePath = path.join(OUT_DIR, filename);
          await page.screenshot({ path: filePath, fullPage: false });
          console.log(`    ✓ ${filename}`);
        };

        // 1. STATE: OFF (Idle)
        {
          const { ctx, page } = await createPage();
          if (vp.isMobile) {
            const rivalTab = page.locator('button:has-text("Rival")').first();
            if (await rivalTab.isVisible()) {
              await rivalTab.click();
              await page.waitForTimeout(200);
            }
          }
          await takeShot(page, '01_off');
          await ctx.close();
        }

        // 2. STATE: LOCKED (Free User)
        {
          const { ctx, page } = await createPage(true);
          if (vp.isMobile) {
            const rivalTab = page.locator('button:has-text("Rival")').first();
            if (await rivalTab.isVisible()) {
              await rivalTab.click();
              await page.waitForTimeout(200);
            }
          }
          await takeShot(page, '02_locked');
          await ctx.close();
        }

        // 3. STATE: OPPONENT NOT PREMIUM
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'idle',
                  reason: 'opponent_not_premium'
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '03_opponent_not_premium');
          await ctx.close();
        }

        // 4. STATE: REQUESTING
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'requesting',
                  requestedBy: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
                  expiresAt: Date.now() + 24000,
                  requestCount: 1
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '04_requesting');
          await ctx.close();
        }

        // 5. STATE: INCOMING REQUEST
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'requesting',
                  requestedBy: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
                  expiresAt: Date.now() + 27000,
                  requestCount: 1
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '05_incoming_request');
          await ctx.close();
        }

        // 6. STATE: CONNECTING
        {
          const { ctx, page } = await createPage();
          // Simulate connecting
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'accepted'
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '06_connecting');
          await ctx.close();
        }

        // 7. STATE: CONNECTED WITH MIC OFF
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            const btn = document.querySelector('.voice-topbar-btn');
            if (btn) btn.click();
          });
          // Render VoiceDock in connected state
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({ status: 'accepted' }));
              }
            });
          });
          await page.waitForTimeout(500);
          await takeShot(page, '07_connected_mic_off');
          await ctx.close();
        }

        // 8. STATE: LIVE WITH MIC ON
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({ status: 'accepted' }));
              }
            });
          });
          await page.waitForTimeout(600);
          const micBtn = page.locator('button.voice-dock__mute-btn, button.voice-topbar-btn').first();
          if (await micBtn.isVisible()) {
            await micBtn.click().catch(() => {});
          }
          await page.waitForTimeout(300);
          await takeShot(page, '08_live_mic_on');
          await ctx.close();
        }

        // 9. STATE: SPEAKING RING
        {
          const { ctx, page } = await createPage();
          if (vp.isMobile) {
            const rivalTab = page.locator('button:has-text("Rival")').first();
            if (await rivalTab.isVisible()) await rivalTab.click();
          }
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({ status: 'accepted' }));
              }
            });
          });
          await page.waitForTimeout(500);
          await takeShot(page, '09_speaking_ring');
          await ctx.close();
        }

        // 10. STATE: RECONNECTING
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({ status: 'reconnecting' }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '10_reconnecting');
          await ctx.close();
        }

        // 11. STATE: FAILED (Permission Denied)
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'failed',
                  message: 'Microphone permission was denied. Allow microphone access in your browser settings to use voice.'
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '11_failed_permission_denied');
          await ctx.close();
        }

        // 12. STATE: FAILED (No Mic)
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'failed',
                  message: 'No microphone was found on this device.'
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '12_failed_no_mic');
          await ctx.close();
        }

        // 13. STATE: FAILED (In-App Browser)
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({
                  status: 'failed',
                  message: 'Voice chat is not supported inside embedded browsers. Please open this page in Chrome or Safari.'
                }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '13_failed_in_app_browser');
          await ctx.close();
        }

        // 14. STATE: ENDED
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({ status: 'ended' }));
              }
            });
          });
          await page.waitForTimeout(300);
          await takeShot(page, '14_ended');
          await ctx.close();
        }

        // 15. FIRST-USE DIALOG
        {
          const { ctx, page } = await createPage(false, false); // ack = false
          const voiceBtn = page.locator('button.voice-topbar-btn:has-text("Voice"), button:has-text("Start voice")').first();
          if (await voiceBtn.isVisible()) {
            await voiceBtn.click();
            await page.waitForTimeout(400);
          }
          await takeShot(page, '15_first_use_dialog');
          await ctx.close();
        }

        // 16. REPORT DIALOG
        {
          const { ctx, page } = await createPage();
          // Trigger report modal directly
          await page.evaluate(() => {
            const reportModal = document.querySelector('.voice-modal-backdrop');
            // If component has button in more menu:
            const more = document.querySelector('.voice-dock__more-btn');
            if (more) more.click();
          });
          await page.waitForTimeout(200);
          const reportOption = page.locator('.voice-dock__menu-item:has-text("Report voice")').first();
          if (await reportOption.isVisible()) {
            await reportOption.click();
            await page.waitForTimeout(300);
          }
          await takeShot(page, '16_report_dialog');
          await ctx.close();
        }

        // 17. SETTINGS DIALOG
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            const more = document.querySelector('.voice-dock__more-btn');
            if (more) more.click();
          });
          await page.waitForTimeout(200);
          const settingsOption = page.locator('.voice-dock__menu-item:has-text("Settings"), .voice-dock__menu-item:has-text("Voice settings")').first();
          if (await settingsOption.isVisible()) {
            await settingsOption.click();
            await page.waitForTimeout(300);
          }
          await takeShot(page, '17_settings_dialog');
          await ctx.close();
        }

        // 18. OVERFLOW MENU OPEN
        {
          const { ctx, page } = await createPage();
          await page.evaluate(() => {
            import('/src/utils/socket.js').then(mod => {
              const s = mod.default;
              if (s?._callbacks?.['$voice:state']) {
                s._callbacks['$voice:state'].forEach(fn => fn({ status: 'accepted' }));
              }
            });
          });
          await page.waitForTimeout(500);
          const moreBtn = page.locator('button.voice-dock__more-btn').first();
          if (await moreBtn.isVisible()) {
            await moreBtn.click();
            await page.waitForTimeout(300);
          }
          await takeShot(page, '18_overflow_menu_open');
          await ctx.close();
        }

      }
    }

    console.log('\n✓ ALL 18 STATES CAPTURED ACROSS ALL 5 VIEWPORTS & BOTH THEMES!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[Error in screenshot suite]', err);
  process.exit(1);
});

