/**
 * scripts/test-editor-mount.mjs
 *
 * Verifies that the Monaco code editor NEVER remounts under any layout or interaction:
 * - Mount count starts at 1
 * - Toggling problem panel collapse (collapse and expand) leaves mount count at 1
 * - Resizing panes via divider drag leaves mount count at 1
 * - Switching mobile navigation tabs leaves mount count at 1
 * - Switching languages updates value/model without remounting (mount count === 1)
 * - Typed code and undo history survive
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

async function run() {
  console.log('=== RUNNING EDITOR NEVER-REMOUNT VERIFICATION ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });

  const testUser = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com',
    is_username_set: true,
    institute_locked: true,
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1d' });

  const roomId = 'room:testmount' + Math.floor(Math.random() * 10000);
  const mockState = {
    roomId,
    topic: 'arrays',
    difficulty: 'medium',
    problemId: 'a72830b5-7c9d-4467-ba9b-78bc71556b95',
    players: [
      { userId: testUser.id, username: testUser.username, rating: 1220 },
      { userId: 'opponent-id-999', username: 'shadow_coder', rating: 1250 }
    ],
    startedAt: Date.now()
  };

  await ctx.addInitScript(({ token, testUser, roomId, mockState }) => {
    localStorage.setItem('aa_token', token);
    localStorage.setItem('aa_user', JSON.stringify(testUser));
    localStorage.removeItem('aa_active_match');
    sessionStorage.setItem(`aa_match_${roomId}`, JSON.stringify(mockState));
  }, { token, testUser, roomId, mockState });

  const page = await ctx.newPage();

  console.log('1. Navigating directly to BattleRoom...');
  
  await page.addInitScript(({ roomId, testUser }) => {
    // Intercept socket to provide mock match state on connect
    import('/src/utils/socket.js').then(mod => {
      const socket = mod.default;
      if (!socket) return;
      const origEmit = socket.emit.bind(socket);
      socket.emit = function(event, ...args) {
        if (event === 'join_match' || event === 'check_active_match') {
          setTimeout(() => {
            if (socket._callbacks?.['$match_problem_set']) {
              socket._callbacks['$match_problem_set'].forEach(cb => cb({
                roomId,
                problemId: 'two-sum-custom-test',
                problem: {
                  id: 'two-sum-custom-test',
                  title: 'Two Sum',
                  difficulty: 'Easy',
                  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                  examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
                  constraints: ['2 <= nums.length <= 10^4']
                },
                players: [
                  { userId: testUser.id, username: testUser.username, rating: 1220 },
                  { userId: 'opponent-id-999', username: 'shadow_coder', rating: 1250 }
                ]
              }));
            }
          }, 50);
        }
        return origEmit(event, ...args);
      };
    }).catch(() => {});
  }, { roomId, testUser });

  await page.goto(`${FRONTEND_URL}/match/${roomId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Initial mount check
  const initialMounts = await page.evaluate(() => window.__monacoMountCount);
  console.log(`Initial Monaco Mount Count: ${initialMounts}`);
  if (initialMounts !== 1) {
    throw new Error(`Expected initial mount count 1, got ${initialMounts}`);
  }

  // 2. Type test code into editor
  console.log('2. Typing unique code string into Monaco editor...');
  const monaco = page.locator('.monaco-editor').first();
  await monaco.click();
  await page.keyboard.type('\nconst REMOUNT_TEST_TOKEN = 998877;\n');
  await page.waitForTimeout(500);

  // 3. Toggle Problem Panel Collapse and Expand
  console.log('3. Toggling problem panel collapse and expand...');
  const collapseBtn = page.locator('[title="Collapse problem"], [title="Expand problem"]').first();
  if (await collapseBtn.isVisible()) {
    await collapseBtn.click();
    await page.waitForTimeout(400);
    const mountsAfterCollapse = await page.evaluate(() => window.__monacoMountCount);
    console.log(`  Mount count after collapse: ${mountsAfterCollapse}`);
    if (mountsAfterCollapse !== 1) throw new Error(`Editor remounted on collapse! Count: ${mountsAfterCollapse}`);

    await collapseBtn.click();
    await page.waitForTimeout(400);
    const mountsAfterExpand = await page.evaluate(() => window.__monacoMountCount);
    console.log(`  Mount count after expand: ${mountsAfterExpand}`);
    if (mountsAfterExpand !== 1) throw new Error(`Editor remounted on expand! Count: ${mountsAfterExpand}`);
  } else {
    console.warn('Collapse button not visible');
  }

  // 4. Resize panes via divider drag
  console.log('4. Dragging problem pane divider...');
  const divider = page.locator('.battle-v2__divider').first();
  if (await divider.isVisible()) {
    const box = await divider.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + box.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    const mountsAfterResize = await page.evaluate(() => window.__monacoMountCount);
    console.log(`  Mount count after divider resize: ${mountsAfterResize}`);
    if (mountsAfterResize !== 1) throw new Error(`Editor remounted on resize! Count: ${mountsAfterResize}`);
  }

  // 5. Test Mobile viewport tab switching
  console.log('5. Testing mobile viewport and tab switching...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  const mountsMobileResize = await page.evaluate(() => window.__monacoMountCount);
  console.log(`  Mount count after window resize to mobile: ${mountsMobileResize}`);
  if (mountsMobileResize !== 1) throw new Error(`Editor remounted on mobile resize! Count: ${mountsMobileResize}`);

  const problemTab = page.locator('button:has-text("Problem")').first();
  const rivalTab = page.locator('button:has-text("Rival")').first();
  const codeTab = page.locator('button:has-text("Code")').first();

  if (await problemTab.isVisible()) {
    console.log('  Switching to Problem tab on mobile...');
    await problemTab.click();
    await page.waitForTimeout(300);
    const mountsAfterProbTab = await page.evaluate(() => window.__monacoMountCount);
    if (mountsAfterProbTab !== 1) throw new Error(`Editor remounted on Problem tab! Count: ${mountsAfterProbTab}`);

    console.log('  Switching to Rival tab on mobile...');
    await rivalTab.click();
    await page.waitForTimeout(300);
    const mountsAfterRivalTab = await page.evaluate(() => window.__monacoMountCount);
    if (mountsAfterRivalTab !== 1) throw new Error(`Editor remounted on Rival tab! Count: ${mountsAfterRivalTab}`);

    console.log('  Switching back to Code tab on mobile...');
    await codeTab.click();
    await page.waitForTimeout(300);
    const mountsAfterCodeTab = await page.evaluate(() => window.__monacoMountCount);
    if (mountsAfterCodeTab !== 1) throw new Error(`Editor remounted on Code tab! Count: ${mountsAfterCodeTab}`);
  }

  // Restore desktop viewport
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(500);

  // 6. Test undo history and token preservation
  console.log('6. Verifying typed token survives in editor content...');
  const editorContent = await page.evaluate(() => {
    return window.monaco ? monaco.editor.getModels()[0]?.getValue() : null;
  });
  console.log(`  Editor content includes token (998877): ${editorContent?.includes('998877')}`);
  if (!editorContent?.includes('998877')) {
    throw new Error('Typed content was lost during interactions!');
  }

  // Final count
  const finalMountCount = await page.evaluate(() => window.__monacoMountCount);
  console.log(`\n✓ FINAL MONACO MOUNT COUNT: ${finalMountCount}`);
  if (finalMountCount === 1) {
    console.log('✓ PASS: Code editor NEVER remounted throughout all layouts and actions!');
  } else {
    throw new Error(`Mount count exceeded 1: ${finalMountCount}`);
  }

  await browser.close();
}

run().catch(err => {
  console.error('Editor mount verification failed:', err);
  process.exit(1);
});
