/**
 * scripts/premium-contract-test.mjs
 *
 * Playwright-based contract test for AlgoArena free flows.
 * Records all HTTP requests, socket emits, and registered socket listeners.
 *
 * Flows covered:
 * 1. Lobby load & tab inspection (Quick Arena, Striver Sheet tab, Private Duel tab)
 * 2. Quick Arena topic/difficulty selection, Find Match (join_queue), Cancel Queue (leave_queue)
 * 3. Private Duel room creation (create_custom_room), cancel, room join (join_custom_room)
 * 4. Leaderboard page load & API calls
 * 5. Profile page load & API calls
 * 6. Intel Reports page load & API calls
 *
 * Usage:
 *   node scripts/premium-contract-test.mjs --mode=legacy
 *   node scripts/premium-contract-test.mjs --mode=current
 *   node scripts/premium-contract-test.mjs --diff
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment from backend/.env
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/algoarena';

// Parse CLI flags
const args = process.argv.slice(2);
let mode = 'legacy'; // 'legacy' | 'current' | 'diff'
for (const arg of args) {
  if (arg.startsWith('--mode=')) mode = arg.split('=')[1];
  if (arg === '--legacy') mode = 'legacy';
  if (arg === '--current' || arg === '--v2') mode = 'current';
  if (arg === '--diff') mode = 'diff';
}

function maskHost(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '*******st (localhost)';
    return host.replace(/.(?=.{3})/g, '*');
  } catch {
    return '*******st (local)';
  }
}

// Print safety verification banner
console.log('═══════════════════════════════════════════════════════════════');
console.log('       ALGOARENA PREMIUM CONTRACT & FREE FLOW RECORDER          ');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`[SAFETY CHECK] Target Mode:      ${mode.toUpperCase()}`);
console.log(`[SAFETY CHECK] Dev Frontend:     ${FRONTEND_URL}`);
console.log(`[SAFETY CHECK] Dev Backend:      ${BACKEND_URL}`);
console.log(`[SAFETY CHECK] Masked DB Host:   ${maskHost(DATABASE_URL)}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (mode === 'diff') {
  runDiff();
  process.exit(0);
}

function normalizeEmitPayload(event, payload) {
  if (!payload) return null;
  const clone = JSON.parse(JSON.stringify(payload));
  if (event === 'join_custom_room' && typeof clone.code === 'string') {
    clone.code = '<ROOM_CODE>';
  }
  return clone;
}

function runDiff() {
  const legacyPath = path.join(rootDir, 'private', 'premium-contract', 'legacy.json');
  const currentPath = path.join(rootDir, 'private', 'premium-contract', 'current.json');

  if (!fs.existsSync(legacyPath)) {
    console.error(`Error: legacy.json not found at ${legacyPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(currentPath)) {
    console.error(`Error: current.json not found at ${currentPath}`);
    process.exit(1);
  }

  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));

  console.log('\n--- COMPARING SOCKET EMITS ---');
  const legacyEmits = legacy.timeline.filter(e => e.type === 'socket_emit');
  const currentEmits = current.timeline.filter(e => e.type === 'socket_emit');

  let emitDiffs = 0;
  const maxLen = Math.max(legacyEmits.length, currentEmits.length);
  for (let i = 0; i < maxLen; i++) {
    const l = legacyEmits[i];
    const c = currentEmits[i];
    const lNorm = l ? { event: l.event, payload: normalizeEmitPayload(l.event, l.payload) } : null;
    const cNorm = c ? { event: c.event, payload: normalizeEmitPayload(c.event, c.payload) } : null;
    if (JSON.stringify(lNorm) !== JSON.stringify(cNorm)) {
      console.log(`  Diff at emit #${i}:`);
      console.log(`    Legacy:  ${JSON.stringify(lNorm)}`);
      console.log(`    Current: ${JSON.stringify(cNorm)}`);
      emitDiffs++;
    }
  }
  if (emitDiffs === 0) {
    console.log(`✓ All ${legacyEmits.length} socket emits match exactly.`);
  }

  console.log('\n--- COMPARING HTTP REQUESTS ---');
  const allowedAdditions = new Set(['/api/premium/status', '/api/premium/offer']);
  const legacyHttp = legacy.timeline.filter(e => e.type === 'http_request').map(r => `${r.method} ${r.url.split('?')[0]}`);
  const currentHttp = current.timeline.filter(e => e.type === 'http_request').map(r => `${r.method} ${r.url.split('?')[0]}`);

  // Check that all legacy endpoints are present in current
  const legacySet = new Set(legacyHttp);
  const currentSet = new Set(currentHttp);

  let missingHttp = [];
  for (const ep of legacySet) {
    if (!currentSet.has(ep)) {
      missingHttp.push(ep);
    }
  }

  let extraHttp = [];
  for (const ep of currentSet) {
    if (!legacySet.has(ep) && !allowedAdditions.has(ep.split(' ')[1])) {
      extraHttp.push(ep);
    }
  }

  if (missingHttp.length === 0) {
    console.log('✓ All baseline HTTP endpoints preserved in current flow.');
  } else {
    console.log(`✗ Missing HTTP endpoints: ${JSON.stringify(missingHttp)}`);
  }

  if (extraHttp.length === 0) {
    console.log('✓ No unexpected new HTTP endpoints in free flow.');
  } else {
    console.log(`! Extra HTTP endpoints: ${JSON.stringify(extraHttp)}`);
  }

  console.log('\n--- COMPARING SOCKET LISTENERS ---');
  const legacyListeners = new Set(legacy.listeners || []);
  const currentListeners = new Set(current.listeners || []);
  const missingListeners = [...legacyListeners].filter(l => !currentListeners.has(l));

  if (missingListeners.length === 0) {
    console.log(`✓ All ${legacyListeners.size} socket listeners preserved.`);
  } else {
    console.log(`✗ Missing socket listeners: ${JSON.stringify(missingListeners)}`);
  }

  if (emitDiffs === 0 && missingHttp.length === 0 && missingListeners.length === 0) {
    console.log('\n✓ CONTRACT VERIFICATION PASSED: Free flow contract preserved.');
  } else {
    console.log(`\n✗ CONTRACT DIFFERENCE DETECTED: ${emitDiffs} emit diffs, ${missingHttp.length} missing HTTP, ${missingListeners.length} missing listeners.`);
  }
}

async function run() {
  const testUser = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1094,
    email: 'ayush916282580@gmail.com'
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const timeline = [];
  const listeners = new Set();

  await page.exposeFunction('__recordContractEvent', (item) => {
    timeline.push(item);
  });
  await page.exposeFunction('__recordSocketListener', (name) => {
    listeners.add(name);
  });

  // Inject recorder and auth credentials
  await page.addInitScript(({ tokenStr, userObj }) => {
    localStorage.setItem('aa_token', tokenStr);
    localStorage.setItem('aa_user', JSON.stringify(userObj));

    // 1. Wrap window.fetch
    const origFetch = window.fetch;
    window.fetch = async function(...args) {
      let url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      let method = args[1]?.method || 'GET';
      const cleanUrl = url.replace(/^https?:\/\/[^/]+/, '');
      if (!cleanUrl.includes('/assets/') && !cleanUrl.includes('/@vite/') && !cleanUrl.includes('/node_modules/') && !cleanUrl.includes('.hot-update')) {
        window.__recordContractEvent({
          type: 'http_request',
          method: method.toUpperCase(),
          url: cleanUrl
        });
      }
      return origFetch.apply(this, args);
    };

    // 2. Wrap XMLHttpRequest
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._reqMethod = method;
      this._reqUrl = url;
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      const cleanUrl = String(this._reqUrl || '').replace(/^https?:\/\/[^/]+/, '');
      if (!cleanUrl.includes('/assets/') && !cleanUrl.includes('/@vite/') && !cleanUrl.includes('/node_modules/') && !cleanUrl.includes('/socket.io/')) {
        window.__recordContractEvent({
          type: 'http_request',
          method: (this._reqMethod || 'GET').toUpperCase(),
          url: cleanUrl
        });
      }
      return origSend.apply(this, arguments);
    };

    // 3. Hook socket client once loaded
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      if (!socket) return;

      const origEmit = socket.emit.bind(socket);
      socket.emit = function(event, ...args) {
        window.__recordContractEvent({
          type: 'socket_emit',
          event: String(event),
          payload: args[0] !== undefined ? JSON.parse(JSON.stringify(args[0])) : null
        });
        return origEmit(event, ...args);
      };

      const origOn = socket.on.bind(socket);
      socket.on = function(event, handler) {
        window.__recordSocketListener(String(event));
        return origOn(event, handler);
      };

      if (socket.eventNames) {
        socket.eventNames().forEach(n => window.__recordSocketListener(String(n)));
      }
    }).catch(() => {});
  }, { tokenStr: token, userObj: testUser });

  try {
    // ════════════════════════════════════════════════
    // FLOW 1: Lobby load & mode tabs
    // ════════════════════════════════════════════════
    console.log('[FLOW 1] Loading Lobby page...');
    await page.goto(`${FRONTEND_URL}/lobby`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Striver Sheet tab click & view
    console.log('[FLOW 1] Inspecting Striver A2Z sheet tab...');
    const striverTab = page.locator('.lobby-v2-mode-tab').filter({ hasText: /Striver/i }).first();
    if (await striverTab.count() > 0) {
      await striverTab.click();
      await page.waitForTimeout(600);
    }

    // Switch back to Quick Arena
    const quickTab = page.locator('.lobby-v2-mode-tab').filter({ hasText: /Quick/i }).first();
    if (await quickTab.count() > 0) {
      await quickTab.click();
      await page.waitForTimeout(400);
    }

    // ════════════════════════════════════════════════
    // FLOW 2: Quick Arena Matchmaking & Cancel
    // ════════════════════════════════════════════════
    console.log('[FLOW 2] Selecting Topic (Arrays) & Difficulty (Hard)...');
    const arraysRadio = page.locator('button[role="radio"]').filter({ hasText: 'Arrays' }).first();
    if (await arraysRadio.count() > 0) {
      await arraysRadio.click();
      await page.waitForTimeout(300);
    }

    const hardButton = page.locator('button').filter({ hasText: /Hard/i }).first();
    if (await hardButton.count() > 0) {
      await hardButton.click();
      await page.waitForTimeout(300);
    }

    console.log('[FLOW 2] Finding Match (join_queue)...');
    const findMatchBtn = page.locator('#find-match-btn').first();
    if (await findMatchBtn.count() > 0) {
      await findMatchBtn.click();
      await page.waitForTimeout(1000);
    }

    console.log('[FLOW 2] Cancelling Queue (leave_queue)...');
    const cancelQueueBtn = page.locator('button').filter({ hasText: /Cancel Queue/i }).first();
    if (await cancelQueueBtn.count() > 0) {
      await cancelQueueBtn.click();
      await page.waitForTimeout(500);
    }

    // ════════════════════════════════════════════════
    // FLOW 3: Private Duel Room Creation & Join Code
    // ════════════════════════════════════════════════
    console.log('[FLOW 3] Opening Private Duel tab...');
    const privateTab = page.locator('.lobby-v2-mode-tab').filter({ hasText: /Private/i }).first();
    if (await privateTab.count() > 0) {
      await privateTab.click();
      await page.waitForTimeout(500);

      // Create Room
      const hostBtn = page.locator('button:has-text("Create Room & Generate Code")').first();
      if (await hostBtn.count() > 0) {
        console.log('[FLOW 3] Creating custom room (create_custom_room)...');
        await hostBtn.click();
        await page.waitForTimeout(1000);

        // Cancel room
        const cancelRoomBtn = page.locator('button:has-text("Cancel Room")').first();
        if (await cancelRoomBtn.count() > 0) {
          await cancelRoomBtn.click();
          await page.waitForTimeout(500);
        }

        // Switch to Join tab inside modal
        const joinModalTab = page.locator('.lobby-v2-modal-tabs button:has-text("Join Code")').first();
        if (await joinModalTab.count() > 0) {
          console.log('[FLOW 3] Switching to Join Code tab in modal...');
          await joinModalTab.click();
          await page.waitForTimeout(400);

          const codeInput = page.locator('#room-code-input').first();
          if (await codeInput.count() > 0) {
            await codeInput.fill('ARENA-TEST');
            const enterBtn = page.locator('button:has-text("Enter Room")').first();
            if (await enterBtn.count() > 0) {
              console.log('[FLOW 3] Entering custom room code (join_custom_room)...');
              await enterBtn.click();
              await page.waitForTimeout(600);
            }
          }
        }

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }

      // Switch back to Quick Arena tab
      if (await quickTab.count() > 0) {
        await quickTab.click();
        await page.waitForTimeout(400);
      }
    }

    // ════════════════════════════════════════════════
    // FLOW 4: Leaderboard Page
    // ════════════════════════════════════════════════
    console.log('[FLOW 4] Navigating to Leaderboard (/leaderboard)...');
    await page.goto(`${FRONTEND_URL}/leaderboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // ════════════════════════════════════════════════
    // FLOW 5: Profile Page
    // ════════════════════════════════════════════════
    console.log('[FLOW 5] Navigating to Profile (/profile)...');
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // ════════════════════════════════════════════════
    // FLOW 6: Intel Reports Page
    // ════════════════════════════════════════════════
    console.log('[FLOW 6] Navigating to Intel Reports (/experiences)...');
    await page.goto(`${FRONTEND_URL}/experiences`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

  } catch (err) {
    console.error('Error during contract test run:', err);
  } finally {
    await browser.close();
  }

  // Deduplicate consecutive identical requests if any
  const recording = {
    mode,
    timestamp: new Date().toISOString(),
    timeline,
    listeners: Array.from(listeners).sort(),
    summary: {
      totalEvents: timeline.length,
      httpRequests: timeline.filter(e => e.type === 'http_request').length,
      socketEmits: timeline.filter(e => e.type === 'socket_emit').length,
      socketListeners: listeners.size
    }
  };

  const outDir = path.join(rootDir, 'private', 'premium-contract');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = mode === 'legacy' ? 'legacy.json' : 'current.json';
  const outPath = path.join(outDir, outFile);
  fs.writeFileSync(outPath, JSON.stringify(recording, null, 2), 'utf8');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`✓ Recording saved to: ${outPath}`);
  console.log(`  Total Events:      ${recording.summary.totalEvents}`);
  console.log(`  HTTP Requests:     ${recording.summary.httpRequests}`);
  console.log(`  Socket Emits:      ${recording.summary.socketEmits}`);
  console.log(`  Socket Listeners:  ${recording.summary.socketListeners}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

run();

