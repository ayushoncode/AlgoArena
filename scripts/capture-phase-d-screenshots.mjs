/**
 * scripts/capture-phase-d-screenshots.mjs
 *
 * Captures comprehensive visual verification screenshots for Phase D:
 * 1. Dark theme Monaco editor with syntax highlighting, toolbar, and Run/Submit buttons
 * 2. RunConsole in Wrong Answer state (ruled test rows rail, input/expected/actual blocks, copy buttons)
 * 3. RunConsole in Accepted state (all tests green, runtime ms, status line)
 * 4. RunConsole in Live Judging state (progress bar evaluating tests)
 * 5. Light theme Monaco editor
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
  console.log('Capturing Phase D screenshots...');
  const browser = await chromium.launch({ headless: true });

  const testUser = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com',
    is_username_set: true,
    institute_locked: true,
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1d' });

  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const roomId = 'room:phased' + Math.floor(Math.random() * 10000);
  const mockState = {
    roomId,
    topic: 'arrays',
    difficulty: 'medium',
    problemId: 'a72830b5-7c9d-4467-ba9b-78bc71556b95',
    players: [
      { userId: testUser.id, username: testUser.username, rating: 1220 },
      { userId: 'opponent-id-999', username: 'rival_master', rating: 1264 }
    ],
    startedAt: Date.now() - 300_000 // 5 minutes elapsed
  };

  await ctx.addInitScript(({ token, testUser, roomId, mockState }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(testUser));
    localStorage.removeItem('aa_active_match');
    sessionStorage.setItem(`aa_match_${roomId}`, JSON.stringify(mockState));
  }, { token, testUser, roomId, mockState });

  const page = await ctx.newPage();

  async function saveShot(name) {
    const p1 = path.join(ARTIFACT_DIR, `${name}.png`);
    const p2 = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: p1, fullPage: false });
    fs.copyFileSync(p1, p2);
    console.log(`Saved screenshot: ${name}`);
  }

  // Intercept socket to provide mock responses without relying on external judge
  await page.addInitScript(({ roomId, testUser }) => {
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      if (!socket) return;
      const origEmit = socket.emit.bind(socket);
      socket.emit = function(event, payload, ...args) {
        if (event === 'join_match' || event === 'check_active_match') {
          setTimeout(() => {
            if (socket._callbacks?.['$match_problem_set']) {
              socket._callbacks['$match_problem_set'].forEach(cb => cb({
                roomId,
                problemId: 'two-sum-demo',
                problem: {
                  id: 'two-sum-demo',
                  title: 'Two Sum',
                  difficulty: 'Medium',
                  description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
                  examples: [
                    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
                    { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
                  ],
                  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9']
                },
                players: [
                  { userId: testUser.id, username: testUser.username, rating: 1220 },
                  { userId: 'opponent-id-999', username: 'rival_master', rating: 1264 }
                ]
              }));
            }
          }, 40);
        }
        return origEmit(event, payload, ...args);
      };
    }).catch(() => {});
  }, { roomId, testUser });

  await page.goto(`${FRONTEND_URL}/match/${roomId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // 1. Dark Theme Monaco Editor + Toolbar View
  console.log('Capturing Dark Theme Editor View...');
  await saveShot('battle_d_editor_dark');

  // 2. Inject Wrong Answer result into RunConsole
  console.log('Capturing Wrong Answer RunConsole...');
  await page.evaluate(() => {
    const mockWrongAnswer = {
      verdict: 'WRONG_ANSWER',
      passedTests: 1,
      totalTests: 3,
      runtimeMs: 42,
      testResults: [
        { testIndex: 1, passed: true, input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]', actual: '[0,1]', runtimeMs: 14 },
        { testIndex: 2, passed: false, input: 'nums = [3,2,4], target = 6', expected: '[1,2]', actual: '[0,1]', runtimeMs: 16 },
        { testIndex: 3, passed: false, isHidden: true, input: '<hidden>', expected: '<hidden>', actual: '<hidden>', error: null, runtimeMs: 12 }
      ]
    };
    // Dispatch to react state via custom event or direct hook if exposed, or trigger Run with mocked socket
    window.__setRunResult?.(mockWrongAnswer);
  });

  // If window.__setRunResult is not exposed, let's trigger via socket mock or click
  const hasConsole = await page.locator('.battle-v2__console').isVisible();
  if (!hasConsole) {
    // Let's trigger via socket submission_result
    await page.evaluate((roomId) => {
      import('/src/utils/socket.js').then(mod => {
        const socket = mod.default;
        if (socket?._callbacks?.['$submission_result']) {
          socket._callbacks['$submission_result'].forEach(cb => cb({
            roomId,
            userId: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
            verdict: 'WRONG_ANSWER',
            passedTests: 2,
            totalTests: 4,
            runtimeMs: 38,
            testResults: [
              { testIndex: 1, passed: true, input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]', actual: '[0, 1]', runtimeMs: 8 },
              { testIndex: 2, passed: true, input: 'nums = [3,2,4], target = 6', expected: '[1, 2]', actual: '[1, 2]', runtimeMs: 9 },
              { testIndex: 3, passed: false, input: 'nums = [3,3], target = 6', expected: '[0, 1]', actual: '[1, 1]', runtimeMs: 11 },
              { testIndex: 4, passed: false, isHidden: true, input: '<hidden>', expected: '<hidden>', actual: '<hidden>', error: null, runtimeMs: 10 }
            ]
          }));
        }
      });
    }, roomId);
    await page.waitForTimeout(600);
  }

  await saveShot('battle_d_console_wrong_answer');

  // Select test 3 to show input/expected/actual diff with copy button
  const test3Btn = page.locator('.battle-v2__test-row-btn:has-text("Test 3")').first();
  if (await test3Btn.isVisible()) {
    await test3Btn.click();
    await page.waitForTimeout(300);
    // Click copy button to verify "Copied" feedback
    const copyBtn = page.locator('.battle-v2__code-copy-btn').first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(200);
      await saveShot('battle_d_copy_interaction');
    }
  }

  // 3. Inject Accepted Result
  console.log('Capturing Accepted RunConsole...');
  await page.evaluate((roomId) => {
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      if (socket?._callbacks?.['$submission_result']) {
        socket._callbacks['$submission_result'].forEach(cb => cb({
          roomId,
          userId: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
          verdict: 'ACCEPTED',
          passedTests: 4,
          totalTests: 4,
          runtimeMs: 24,
          testResults: [
            { testIndex: 1, passed: true, input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]', actual: '[0, 1]', runtimeMs: 5 },
            { testIndex: 2, passed: true, input: 'nums = [3,2,4], target = 6', expected: '[1, 2]', actual: '[1, 2]', runtimeMs: 6 },
            { testIndex: 3, passed: true, input: 'nums = [3,3], target = 6', expected: '[0, 1]', actual: '[0, 1]', runtimeMs: 6 },
            { testIndex: 4, passed: true, isHidden: true, input: 'nums = [1..1000], target = 999', expected: '[45, 954]', actual: '[45, 954]', runtimeMs: 7 }
          ]
        }));
      }
    });
  }, roomId);
  await page.waitForTimeout(600);
  await saveShot('battle_d_console_accepted');

  // 4. Inject Live Judging Progress
  console.log('Capturing Live Judging State...');
  await page.evaluate((roomId) => {
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      if (socket?._callbacks?.['$submission_started']) {
        socket._callbacks['$submission_started'].forEach(cb => cb({
          roomId,
          userId: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073'
        }));
      }
      if (socket?._callbacks?.['$submission_progress']) {
        socket._callbacks['$submission_progress'].forEach(cb => cb({
          roomId,
          userId: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
          testIndex: 3,
          totalTests: 5
        }));
      }
    });
  }, roomId);
  await page.waitForTimeout(600);
  await saveShot('battle_d_console_judging');

  // 5. Light Theme
  console.log('Capturing Light Theme Editor...');
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  });
  // Reload to let theme provider read light
  await page.goto(`${FRONTEND_URL}/match/${roomId}?theme=light`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await saveShot('battle_d_editor_light');

  await browser.close();
  console.log('Phase D screenshot capture completed successfully!');
}

run().catch(err => {
  console.error('Error capturing Phase D screenshots:', err);
  process.exit(1);
});

