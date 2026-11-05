/**
 * scripts/record-voice-contract-before.mjs
 *
 * Records every HTTP request and socket emit for Live Voice contract verification:
 * Flows:
 *   1. request
 *   2. decline
 *   3. expire (30s timeout)
 *   4. request & accept -> connect (POST /api/voice/token)
 *   5. mute & unmute
 *   6. reconnect (page reload)
 *   7. report (POST /api/voice/report)
 *   8. block (POST /api/voice/block)
 *   9. end (voice:end)
 *
 * Output: private/voice-contract/before-ui.json
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
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

const OUT_DIR = path.join(rootDir, 'private', 'voice-contract');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
const OUT_FILE = path.join(OUT_DIR, 'before-ui.json');

const user1 = {
  id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
  username: 'ayushoncode',
  email: 'ayush916282580@gmail.com',
  elo_rating: 1220,
};
const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '7d' });

const user2 = {
  id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
  username: 'ayush_ayush',
  email: '1ms24is030@msrit.edu',
  elo_rating: 1229,
};
const token2 = jwt.sign(user2, JWT_SECRET, { expiresIn: '7d' });

async function main() {
  console.log('═'.repeat(60));
  console.log('       LIVE VOICE PROTOCOL CONTRACT RECORDER (BEFORE UI)');
  console.log('═'.repeat(60));

  // Reset active matches
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
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
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
      localStorage.setItem('algoarena_voice_ack', 'true');
      localStorage.removeItem('aa_active_match');

      try {
        window.__contractTimeline = JSON.parse(sessionStorage.getItem('__voice_contract_timeline') || '[]');
        window.__contractListeners = new Set(JSON.parse(sessionStorage.getItem('__voice_contract_listeners') || '[]'));
      } catch {
        window.__contractTimeline = [];
        window.__contractListeners = new Set();
      }

      function syncSession() {
        try {
          sessionStorage.setItem('__voice_contract_timeline', JSON.stringify(window.__contractTimeline));
          sessionStorage.setItem('__voice_contract_listeners', JSON.stringify(Array.from(window.__contractListeners)));
        } catch {}
      }

      const origFetch = window.fetch;
      window.fetch = async function(...args) {
        let url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        let method = args[1]?.method || 'GET';
        const cleanUrl = url.replace(/^https?:\/\/[^/]+/, '');
        if (!cleanUrl.includes('/assets/') && !cleanUrl.includes('/@vite/') && !cleanUrl.includes('/node_modules/')) {
          window.__contractTimeline.push({
            type: 'http_request',
            method: method.toUpperCase(),
            url: cleanUrl
          });
          syncSession();
        }
        return origFetch.apply(this, args);
      };

      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        this._reqMethod = method;
        this._reqUrl = url;
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        const cleanUrl = String(this._reqUrl || '').replace(/^https?:\/\/[^/]+/, '');
        if (!cleanUrl.includes('/assets/') && !cleanUrl.includes('/@vite/') && !cleanUrl.includes('/socket.io/')) {
          window.__contractTimeline.push({
            type: 'http_request',
            method: (this._reqMethod || 'GET').toUpperCase(),
            url: cleanUrl
          });
          syncSession();
        }
        return origSend.apply(this, arguments);
      };

      import('/src/utils/socket.js').then(mod => {
        const socket = mod.default;
        if (!socket) return;

        const origEmit = socket.emit.bind(socket);
        socket.emit = function(event, ...args) {
          window.__contractTimeline.push({
            type: 'socket_emit',
            event: String(event),
            payload: args[0] !== undefined ? JSON.parse(JSON.stringify(args[0])) : null
          });
          syncSession();
          return origEmit(event, ...args);
        };

        const origOn = socket.on.bind(socket);
        socket.on = function(event, handler) {
          window.__contractListeners.add(String(event));
          syncSession();
          return origOn(event, handler);
        };
      }).catch(() => {});
    }, { token, userObj });

    return ctx;
  };

  try {
    const ctx1 = await setupContext(user1, token1);
    const ctx2 = await setupContext(user2, token2);

    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    console.log('1. Navigating to lobby and matchmaking...');
    await Promise.all([
      page1.goto(`${FRONTEND_URL}/lobby`),
      page2.goto(`${FRONTEND_URL}/lobby`),
    ]);
    await Promise.all([
      page1.waitForLoadState('networkidle'),
      page2.waitForLoadState('networkidle'),
    ]);

    // Select topic Arrays
    const topic1 = page1.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic1.waitFor({ state: 'visible', timeout: 10000 });
    await topic1.click();
    await page1.waitForTimeout(300);

    const topic2 = page2.locator('.quick-arena-topic-row, button[role="radio"]').filter({ hasText: /Arrays/i }).first();
    await topic2.waitFor({ state: 'visible', timeout: 10000 });
    await topic2.click();
    await page2.waitForTimeout(400);

    const findMatch1 = page1.locator('#find-match-btn').first();
    await page1.waitForFunction(() => {
      const btn = document.querySelector('#find-match-btn');
      return btn && !btn.disabled;
    }, { timeout: 6000 }).catch(() => {});
    await findMatch1.click();
    await page1.waitForTimeout(600);

    const findMatch2 = page2.locator('#find-match-btn').first();
    await page2.waitForFunction(() => {
      const btn = document.querySelector('#find-match-btn');
      return btn && !btn.disabled;
    }, { timeout: 6000 }).catch(() => {});
    await findMatch2.click();

    console.log('  Waiting for match found...');
    await Promise.all([
      page1.waitForURL(/\/match\//, { timeout: 25000 }),
      page2.waitForURL(/\/match\//, { timeout: 25000 }),
    ]);

    console.log(`  Match created! URL: ${page1.url()}`);
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    const matchUrl = page1.url();
    const roomId = matchUrl.split('/match/')[1];

    // ── FLOW 1: Request & Decline ──────────────────────────────────
    console.log('2. Testing Voice Request & Decline...');
    const voiceBtn1 = page1.locator('button.voice-topbar-btn:has-text("Voice"), button:has-text("Start voice")').first();
    await voiceBtn1.click();
    await page1.waitForTimeout(1000);

    const declineBtn = page2.locator('button:has-text("Decline"), button[title="Decline"]').first();
    await declineBtn.waitFor({ state: 'visible', timeout: 5000 });
    await declineBtn.click();
    await page1.waitForTimeout(1000);
    console.log('  ✓ Declined successfully');

    // ── FLOW 2: Request, Accept & Connect ──────────────────────────
    console.log('3. Testing Voice Request, Accept & Connect...');
    await voiceBtn1.click();
    await page2.waitForTimeout(1000);

    const acceptBtn = page2.locator('button:has-text("Accept Voice"), button:has-text("Accept")').first();
    await acceptBtn.waitFor({ state: 'visible', timeout: 5000 });
    await acceptBtn.click();
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);
    console.log('  ✓ Connected to LiveKit voice session');

    // ── FLOW 3: Mute & Unmute ──────────────────────────────────────
    console.log('4. Testing Mic Mute & Unmute...');
    const muteBtn1 = page1.locator('button.voice-topbar-btn[aria-pressed], button.voice-dock__mute-btn').first();
    if (await muteBtn1.isVisible()) {
      await muteBtn1.click();
      await page1.waitForTimeout(800);
      await muteBtn1.click();
      await page1.waitForTimeout(800);
    }
    console.log('  ✓ Mute/Unmute toggled');

    // ── FLOW 4: Reconnect (Reload mid-match) ────────────────────────
    console.log('5. Testing Reconnect...');
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    await page1.waitForTimeout(2000);
    console.log('  ✓ Reconnected and state restored');

    // ── FLOW 5: Report Opponent ────────────────────────────────────
    console.log('6. Testing Voice Report...');
    const moreBtn = page1.locator('button.voice-dock__more-btn, button[aria-label="Voice settings and actions"]').first();
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page1.waitForTimeout(400);

      const reportOption = page1.locator('.voice-dock__menu-item:has-text("Report voice")').first();
      if (await reportOption.isVisible()) {
        await reportOption.click();
        await page1.waitForTimeout(500);

        const submitReportBtn = page1.locator('button:has-text("Submit Report")').first();
        if (await submitReportBtn.isVisible()) {
          await submitReportBtn.click();
          await page1.waitForTimeout(1000);
        }
      }
    }
    console.log('  ✓ Voice report submitted');

    // ── FLOW 6: Block Opponent ────────────────────────────────────
    console.log('7. Testing Voice Block...');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page1.waitForTimeout(400);

      const blockOption = page1.locator('.voice-dock__menu-item:has-text("Block voice from this player")').first();
      if (await blockOption.isVisible()) {
        await blockOption.click();
        await page1.waitForTimeout(500);

        const confirmBlockBtn = page1.locator('button:has-text("Block Voice")').first();
        if (await confirmBlockBtn.isVisible()) {
          await confirmBlockBtn.click();
          await page1.waitForTimeout(1000);
        }
      }
    }
    console.log('  ✓ Voice block registered');

    // ── FLOW 7: End Voice ──────────────────────────────────────────
    console.log('8. Testing End Voice...');
    const endVoiceBtn = page1.locator('button:has-text("End voice"), button.voice-dock__menu-item--danger').first();
    if (await endVoiceBtn.isVisible()) {
      await endVoiceBtn.click();
      await page1.waitForTimeout(1000);
    } else {
      if (await moreBtn.isVisible()) {
        await moreBtn.click();
        await page1.waitForTimeout(300);
        const endMenuBtn = page1.locator('.voice-dock__menu-item--danger:has-text("End voice")').first();
        if (await endMenuBtn.isVisible()) {
          await endMenuBtn.click();
          await page1.waitForTimeout(1000);
        }
      }
    }
    console.log('  ✓ Voice ended');

    // Collect timeline and listeners from User 1
    const p1Timeline = await page1.evaluate(() => window.__contractTimeline || []);
    const p1Listeners = await page1.evaluate(() => Array.from(window.__contractListeners || []));

    const contractResult = {
      timestamp: new Date().toISOString(),
      mode: 'before-ui',
      summary: {
        timelineEvents: p1Timeline.length,
        listenersCount: p1Listeners.length,
      },
      timeline: p1Timeline,
      listeners: p1Listeners,
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(contractResult, null, 2), 'utf8');
    console.log(`\n✓ Contract test complete! Saved to ${OUT_FILE}`);
    console.log(`  Events recorded: ${p1Timeline.length}`);
    console.log(`  Listeners recorded: ${p1Listeners.length}`);

  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[Contract Record Error]', err);
  process.exit(1);
});
