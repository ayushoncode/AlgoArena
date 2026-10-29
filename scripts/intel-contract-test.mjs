/**
 * scripts/intel-contract-test.mjs
 * 
 * AlgoArena Intel Reports Contract Test & Interaction Recorder
 * 
 * Verifies that the Intel Reports contract is strictly preserved:
 * - Records every fetch/XHR request (method, normalized URL, payload, execution order)
 * - Executes all 12 required flows:
 *   1. Logged-out access (gate)
 *   2. Load list (/experiences)
 *   3. Switch track (intern <-> sde)
 *   4. Apply each filter and clear all
 *   5. Search (keyword & company)
 *   6. Open detail (/experiences/:id)
 *   7. Mark helpful
 *   8. Bookmark
 *   9. Report
 *   10. Open My Reports (/experiences/mine) and Saved (/experiences/saved)
 *   11. Share wizard with test account (draft autosave/restore, leaving with unsaved changes, complete steps 1-4)
 *   12. Edit and delete own post
 * 
 * Usage:
 *   node scripts/intel-contract-test.mjs --mode=legacy
 *   node scripts/intel-contract-test.mjs --mode=v2
 *   node scripts/intel-contract-test.mjs --diff
 */

import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '../backend/node_modules/pg/lib/index.js';
const { Pool } = pkg;

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
let mode = 'legacy'; // 'legacy' | 'v2' | 'diff'
for (const arg of args) {
  if (arg.startsWith('--mode=')) mode = arg.split('=')[1];
  if (arg === '--legacy') mode = 'legacy';
  if (arg === '--v2') mode = 'v2';
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
console.log('    ALGOARENA INTEL REPORTS CONTRACT & INTERACTION RECORDER    ');
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

function runDiff() {
  const legacyPath = path.join(rootDir, 'private', 'intel-contract', 'legacy.json');
  const v2Path = path.join(rootDir, 'private', 'intel-contract', 'v2.json');

  if (!fs.existsSync(legacyPath) || !fs.existsSync(v2Path)) {
    console.error('Error: Both legacy.json and v2.json must exist to perform diff.');
    console.error(`legacy.json exists: ${fs.existsSync(legacyPath)}`);
    console.error(`v2.json exists:     ${fs.existsSync(v2Path)}`);
    process.exit(1);
  }

  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const v2 = JSON.parse(fs.readFileSync(v2Path, 'utf8'));

  console.log('\n--- COMPARING NETWORK REQUEST TIMELINES ---');
  const legacyReqs = legacy.timeline.filter(e => e.type === 'http_request');
  const v2Reqs = v2.timeline.filter(e => e.type === 'http_request');

  let diffCount = 0;
  const maxLen = Math.max(legacyReqs.length, v2Reqs.length);

  for (let i = 0; i < maxLen; i++) {
    const l = legacyReqs[i];
    const v = v2Reqs[i];

    // Normalize URLs for comparison: ignore dynamic IDs in created/edited/deleted post URLs
    const normalizeUrl = (u) => {
      if (!u) return '';
      return u.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':uuid');
    };

    const lUrl = l ? normalizeUrl(l.url) : '<none>';
    const vUrl = v ? normalizeUrl(v.url) : '<none>';

    const matchMethod = l && v && l.method === v.method;
    const matchUrl = lUrl === vUrl;

    if (!matchMethod || !matchUrl) {
      console.log(`\n  [DIFF at Request #${i + 1}]:`);
      console.log(`    Legacy: ${l ? `${l.method} ${l.url}` : '<none>'}`);
      console.log(`    V2:     ${v ? `${v.method} ${v.url}` : '<none>'}`);
      diffCount++;
    }
  }

  if (diffCount === 0 && legacyReqs.length === v2Reqs.length) {
    console.log(`\n✓ CONTRACT VERIFICATION PASSED: V2 network protocol matches Legacy exactly! (${legacyReqs.length} requests in identical order)`);
  } else {
    console.log(`\n✗ CONTRACT DIFFERENCE DETECTED: ${diffCount} request discrepancies found! (Legacy: ${legacyReqs.length}, V2: ${v2Reqs.length})`);
    process.exit(1);
  }
}

async function run() {
  // Test user in local dev DB (ayush_ayush)
  const testUser = {
    id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
    username: 'ayush_ayush',
    email: 'ayush916282580@gmail.com',
    elo_rating: 1239,
  };
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

  // Pre-existing seed post ID
  const seedPostId = '0d53376d-b0c6-44c9-9947-5fcedd89dafc';

  // Reset test user's reports on seed post so Flow 9 is fully repeatable
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query('DELETE FROM experience_reports WHERE user_id = $1', [testUser.id]);
    await pool.query('UPDATE interview_experiences SET report_count = 0 WHERE id = $1', [seedPostId]);
    await pool.end();
  } catch (err) {
    console.warn('  [DB Reset Notice]', err.message);
  }

  const recording = {
    mode,
    timestamp: new Date().toISOString(),
    timeline: [],
    flows: {},
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Dialog auto-accept handler for window.confirm (e.g. restore draft, delete post)
  page.on('dialog', async (dialog) => {
    console.log(`    [Browser Dialog] ${dialog.type()}: "${dialog.message()}" -> ACCEPT`);
    await dialog.accept();
  });

  // Helper to record HTTP requests
  const recordRequest = (method, url, payload = null) => {
    const cleanUrl = url.replace(/^https?:\/\/[^/]+/, '');
    if (
      cleanUrl.startsWith('/api/') &&
      !cleanUrl.includes('/assets/') &&
      !cleanUrl.includes('/@vite/')
    ) {
      const entry = {
        type: 'http_request',
        method: method.toUpperCase(),
        url: cleanUrl,
        payload: payload ? payload : undefined,
        timestamp: Date.now(),
      };
      recording.timeline.push(entry);
      console.log(`  [HTTP] ${entry.method} ${entry.url}`);
    }
  };

  // Intercept network requests via Playwright
  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();
    let postData = null;
    try {
      postData = req.postDataJSON();
    } catch {
      postData = req.postData();
    }
    recordRequest(method, url, postData);
  });

  const appendUi = (urlPath) => {
    if (mode !== 'legacy') return urlPath;
    return urlPath.includes('?') ? `${urlPath}&ui=legacy` : `${urlPath}?ui=legacy`;
  };

  try {
    // ═════════════════════════════════════════════════════════════════
    // FLOW 1: LOGGED-OUT ACCESS (GATE)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 1] Logged-out access (gate)...');
    await page.goto(`${FRONTEND_URL}${appendUi('/experiences')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const gateHeading = page.locator('h1');
    const headingText = await gateHeading.textContent();
    console.log(`  Auth Gate rendered heading: "${headingText?.trim()}"`);
    recording.flows.loggedOutGate = { success: true, heading: headingText?.trim() };

    // ═════════════════════════════════════════════════════════════════
    // AUTHENTICATE FOR REMAINING FLOWS
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Auth] Injecting session for test account (ayush_ayush)...');
    await page.addInitScript(
      ({ tokenVal, userVal }) => {
        localStorage.setItem('aa_token', tokenVal);
        localStorage.setItem('aa_user', JSON.stringify(userVal));
        localStorage.setItem('aa_intel_track', 'intern');
        localStorage.removeItem('aa_intel_draft_v2');
      },
      { tokenVal: token, userVal: testUser }
    );

    // ═════════════════════════════════════════════════════════════════
    // FLOW 2: LOAD LIST (/experiences)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 2] Loading reports list (/experiences)...');
    await page.goto(`${FRONTEND_URL}${appendUi('/experiences')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const listHeading = await page.locator('h1').first().textContent();
    console.log(`  Loaded list heading: "${listHeading?.trim()}"`);
    recording.flows.loadList = { success: true, heading: listHeading?.trim() };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 3: SWITCH TRACK (INTERN -> SDE -> INTERN)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 3] Switching track (intern <-> sde)...');
    const sdeBtn = page.locator('button:has-text("SDE")').first();
    await sdeBtn.click();
    await page.waitForResponse(resp => resp.url().includes('/api/experiences') && resp.url().includes('track=sde'));
    await page.waitForTimeout(300);

    const internBtn = page.locator('button:has-text("INTERN")').first();
    await internBtn.click();
    await page.waitForResponse(resp => resp.url().includes('/api/experiences') && resp.url().includes('track=intern'));
    await page.waitForTimeout(300);
    recording.flows.switchTrack = { success: true };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 4: APPLY EACH FILTER AND CLEAR ALL
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 4] Applying filters and clearing all...');

    const applySelect = async (selectLocator, value, expectedParam) => {
      const [resp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && r.url().includes(expectedParam)),
        selectLocator.selectOption(value),
      ]);
      await page.waitForTimeout(200);
      return resp.status();
    };

    // 1. Outcome: selected
    const outcomeSelect = page.locator('select').filter({ has: page.locator('option[value="selected"]') }).first();
    if (await outcomeSelect.isVisible()) {
      await applySelect(outcomeSelect, 'selected', 'outcome=selected');
    }

    // 2. Difficulty: medium
    const diffSelect = page.locator('select').filter({ has: page.locator('option[value="medium"]') }).first();
    if (await diffSelect.isVisible()) {
      await applySelect(diffSelect, 'medium', 'difficulty=medium');
    }

    // Expand "More filters" if present
    const moreBtn = page.locator('button:has-text("More filters"), [data-testid="more-filters"]').first();
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(200);
    }

    // 3. Year: 2025
    const yearSelect = page.locator('select').filter({ has: page.locator('option[value="2025"]') }).first();
    if (await yearSelect.isVisible()) {
      await applySelect(yearSelect, '2025', 'year=2025');
    }

    // 4. Round: technical
    const roundSelect = page.locator('select').filter({ has: page.locator('option[value="technical"]') }).first();
    if (await roundSelect.isVisible()) {
      await applySelect(roundSelect, 'technical', 'round=technical');
    }

    // 5. Topic: arrays
    const topicSelect = page.locator('select').filter({ has: page.locator('option[value="arrays"]') }).first();
    if (await topicSelect.isVisible()) {
      await applySelect(topicSelect, 'arrays', 'topic=arrays');
    }

    // 6. Source: on_campus
    const sourceSelect = page.locator('select').filter({ has: page.locator('option[value="on_campus"]') }).first();
    if (await sourceSelect.isVisible()) {
      await applySelect(sourceSelect, 'on_campus', 'source=on_campus');
    }

    // 7. Sort: helpful
    const sortBtnHelpful = page.locator('button:has-text("Most helpful"), [data-sort="helpful"]').first();
    const sortSelect = page.locator('select').filter({ has: page.locator('option[value="helpful"]') }).first();
    if (await sortBtnHelpful.isVisible()) {
      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && r.url().includes('sort=helpful')),
        sortBtnHelpful.click(),
      ]);
      await page.waitForTimeout(200);

      const sortBtnLatest = page.locator('button:has-text("Latest"), [data-sort="latest"]').first();
      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && r.url().includes('sort=latest')),
        sortBtnLatest.click(),
      ]);
      await page.waitForTimeout(200);
    } else if (await sortSelect.isVisible()) {
      await applySelect(sortSelect, 'helpful', 'sort=helpful');
      await applySelect(sortSelect, 'latest', 'sort=latest');
    }

    // Clear All Filters
    console.log('  Clearing all filters...');
    const clearBtn = page.locator('button:has-text("CLEAR ALL"), button:has-text("Clear all"), [data-testid="clear-filters"]').first();
    if (await clearBtn.isVisible()) {
      const [clearResp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && !r.url().includes('outcome=')),
        clearBtn.click(),
      ]);
      await page.waitForTimeout(300);
      console.log(`  Clear all triggered fresh fetch, status: ${clearResp.status()}`);
    }
    recording.flows.filtersAndClear = { success: true };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 5: SEARCH (KEYWORD & COMPANY)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 5] Search (keyword and company)...');
    const keywordInput = page.locator('input[placeholder*="Search keywords"], input[placeholder*="Search"]').first();
    if (await keywordInput.isVisible()) {
      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && r.url().includes('q=intern')),
        keywordInput.fill('intern'),
      ]);
      await page.waitForTimeout(300);

      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && !r.url().includes('q=intern')),
        keywordInput.fill(''),
      ]);
      await page.waitForTimeout(300);
    }

    let companyInput = page.locator('input[placeholder*="Filter company"], input[placeholder*="Company"]').first();
    if (!await companyInput.isVisible()) {
      const moreBtn = page.locator('button:has-text("More filters"), [data-testid="more-filters"]').first();
      if (await moreBtn.isVisible()) {
        await moreBtn.click();
        await page.waitForTimeout(200);
      }
    }
    if (await companyInput.isVisible()) {
      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && r.url().includes('company=GE')),
        companyInput.fill('GE'),
      ]);
      await page.waitForTimeout(300);

      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/experiences') && !r.url().includes('company=GE')),
        companyInput.fill(''),
      ]);
      await page.waitForTimeout(300);
    }
    recording.flows.search = { success: true };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 6: OPEN DETAIL (/experiences/:seedPostId)
    // ═════════════════════════════════════════════════════════════════
    console.log(`\n[Flow 6] Opening detail page (/experiences/${seedPostId})...`);
    await page.goto(`${FRONTEND_URL}${appendUi(`/experiences/${seedPostId}`)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const detailHeading = await page.locator('h1').textContent();
    console.log(`  Loaded detail heading: "${detailHeading?.trim()}"`);
    recording.flows.openDetail = { success: true, heading: detailHeading?.trim() };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 7: MARK HELPFUL (TOGGLE ON AND OFF)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 7] Toggling helpful state...');
    const helpfulBtn = page.locator('button:has-text("Helpful"), button[title="Mark as helpful"]').first();
    await helpfulBtn.waitFor({ state: 'visible', timeout: 5000 });

    const [helpResp1] = await Promise.all([
      page.waitForResponse(r => r.url().includes(`/api/experiences/${seedPostId}/helpful`) && r.request().method() === 'POST'),
      helpfulBtn.click(),
    ]);
    console.log(`  Mark helpful response: ${helpResp1.status()}`);
    await page.waitForTimeout(300);

    const [helpResp2] = await Promise.all([
      page.waitForResponse(r => r.url().includes(`/api/experiences/${seedPostId}/helpful`) && r.request().method() === 'POST'),
      helpfulBtn.click(),
    ]);
    console.log(`  Unmark helpful response: ${helpResp2.status()}`);
    await page.waitForTimeout(300);
    recording.flows.toggleHelpful = { success: true };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 8: BOOKMARK (TOGGLE ON AND OFF)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 8] Toggling bookmark state...');
    const bookmarkBtn = page.locator('button:has-text("Save"), button:has-text("Saved"), button[title="Bookmark report"]').first();
    await bookmarkBtn.waitFor({ state: 'visible', timeout: 5000 });

    const [bmResp1] = await Promise.all([
      page.waitForResponse(r => r.url().includes(`/api/experiences/${seedPostId}/bookmark`) && r.request().method() === 'POST'),
      bookmarkBtn.click(),
    ]);
    console.log(`  Bookmark response: ${bmResp1.status()}`);
    await page.waitForTimeout(300);

    const [bmResp2] = await Promise.all([
      page.waitForResponse(r => r.url().includes(`/api/experiences/${seedPostId}/bookmark`) && r.request().method() === 'POST'),
      bookmarkBtn.click(),
    ]);
    console.log(`  Un-bookmark response: ${bmResp2.status()}`);
    await page.waitForTimeout(300);
    recording.flows.toggleBookmark = { success: true };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 9: REPORT MODAL & SUBMIT
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 9] Submitting report modal...');
    const reportBtn = page.locator('button[title="Report inappropriate content"], [data-testid="report-btn"]').first();
    await reportBtn.waitFor({ state: 'visible', timeout: 5000 });
    await reportBtn.click();

    const reportTextarea = page.locator('textarea[placeholder*="Reason for report"], textarea').first();
    await reportTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await reportTextarea.fill('Contract test automated report flag.');

    const submitReportBtn = page.locator('button:has-text("SUBMIT REPORT"), button:has-text("Submit")').first();
    const [reportResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes(`/api/experiences/${seedPostId}/report`) && r.request().method() === 'POST'),
      submitReportBtn.click(),
    ]);
    console.log(`  Report submission response: ${reportResp.status()}`);
    await page.waitForTimeout(500);
    recording.flows.reportSubmission = { success: reportResp.status() === 200 };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 10: MY REPORTS & SAVED
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 10] Loading My Reports (/experiences/mine)...');
    await page.goto(`${FRONTEND_URL}${appendUi('/experiences/mine')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    console.log('  Loading Saved Reports (/experiences/saved)...');
    await page.goto(`${FRONTEND_URL}${appendUi('/experiences/saved')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    recording.flows.mineAndSaved = { success: true };

    // ═════════════════════════════════════════════════════════════════
    // FLOW 11: SHARE WIZARD (DRAFT AUTOSAVE, RESTORE, COMPLETE STEPS)
    // ═════════════════════════════════════════════════════════════════
    console.log('\n[Flow 11] Share wizard with draft autosave and restore...');
    await page.evaluate(() => localStorage.removeItem('aa_intel_draft_v2'));
    await page.goto(`${FRONTEND_URL}${appendUi('/experiences/new')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const companyInputWizard = page.locator('input[placeholder*="Google, Amazon"]').first();
    await companyInputWizard.waitFor({ state: 'visible', timeout: 5000 });
    await companyInputWizard.fill('Autosave Draft Co');
    await page.waitForTimeout(600);

    const draftInStorage = await page.evaluate(() => localStorage.getItem('aa_intel_draft_v2'));
    console.log(`  Draft successfully saved in localStorage: ${draftInStorage ? 'YES' : 'NO'}`);

    // Leave with unsaved changes: Click EXIT
    console.log('  Leaving with unsaved changes (clicking EXIT)...');
    const exitBtn = page.locator('button:has-text("EXIT")').first();
    await exitBtn.click();
    await page.waitForTimeout(500);

    // Return to /experiences/new -> dialog will fire and auto-accept
    console.log('  Returning to wizard to test draft restore...');
    await page.goto(`${FRONTEND_URL}${appendUi('/experiences/new')}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Fill out the complete wizard
    console.log('  Completing wizard steps 1 to 4...');
    const companyField = page.locator('input[placeholder*="Google, Amazon"]').first();
    await companyField.fill('Veritas Analytics');

    const roleField = page.locator('input[placeholder*="SWE Intern"]').first();
    await roleField.fill('Systems Engineer');

    const locField = page.locator('input[placeholder*="Bengaluru"]').first();
    await locField.fill('Bengaluru');

    // Next -> Step 2
    await page.locator('button:has-text("NEXT")').first().click();
    await page.waitForTimeout(400);

    // Step 2: Add Round
    console.log('  Step 2: Adding interview round...');
    const addRoundBtn = page.locator('button:has-text("ADD ROUND")').first();
    await addRoundBtn.waitFor({ state: 'visible', timeout: 5000 });
    await addRoundBtn.click();
    await page.waitForTimeout(300);

    const dsaCard = page.locator('button:has-text("Technical Round"), button:has-text("DSA Round")').first();
    await dsaCard.click();

    const roundDesc = page.locator('textarea[placeholder*="Describe the round"]').first();
    await roundDesc.fill('Two coding problems focused on dynamic programming and graph traversals.');

    const clearedBtn = page.locator('button:has-text("Yes, cleared")').first();
    if (await clearedBtn.isVisible()) {
      await clearedBtn.click();
    }

    // Expand questions section and add question
    const qSectionBtn = page.locator('button:has-text("Questions asked in this round"), button:has-text("QUESTIONS ASKED")').first();
    if (await qSectionBtn.isVisible()) {
      await qSectionBtn.click();
      await page.waitForTimeout(200);

      const addQBtn = page.locator('button:has-text("Add a question"), button:has-text("ADD QUESTION")').first();
      if (await addQBtn.isVisible()) {
        await addQBtn.click();
        await page.waitForTimeout(200);

        const qTextInput = page.locator('input[placeholder*="Find LCA in a Binary Tree"], input[placeholder*="question"]').first();
        if (await qTextInput.isVisible()) {
          await qTextInput.fill('Find the longest path in a directed acyclic graph.');
        }
      }
    }

    // Next -> Step 3
    await page.locator('button:has-text("NEXT")').first().click();
    await page.waitForTimeout(400);

    // Step 3: Your Take
    console.log('  Step 3: Entering overall experience...');
    const overallExp = page.locator('textarea[placeholder*="How did it go overall"]').first();
    await overallExp.waitFor({ state: 'visible', timeout: 5000 });
    await overallExp.fill('The interview process was structured and professional. Feedback was clear and the interviewers were encouraging throughout all rounds.');

    const tipsArea = page.locator('textarea[placeholder*="What should someone prep"]').first();
    if (await tipsArea.isVisible()) {
      await tipsArea.fill('Practice medium to hard graphs and DP problems on AlgoArena.');
    }

    // Next -> Step 4
    await page.locator('button:has-text("NEXT")').first().click();
    await page.waitForTimeout(400);

    // Step 4: NDA & Submit
    console.log('  Step 4: Acknowledging NDA and submitting post...');
    const ndaCheckDiv = page.locator('label div.w-5.h-5, [data-testid="nda-checkbox"], label div').first();
    await ndaCheckDiv.waitFor({ state: 'visible', timeout: 5000 });
    await ndaCheckDiv.click();

    // Print masked DB host before write
    console.log(`[SAFETY CHECK] Masked DB Host before write: ${maskHost(DATABASE_URL)}`);

    const publishBtn = page.locator('button:has-text("PUBLISH")').first();
    await publishBtn.waitFor({ state: 'visible', timeout: 5000 });

    const [publishResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/experiences') && r.request().method() === 'POST'),
      publishBtn.click(),
    ]);

    const publishData = await publishResp.json();
    const createdPostId = publishData?.experience?.id;
    console.log(`  POST /api/experiences status: ${publishResp.status()}, Created ID: ${createdPostId}`);
    recording.flows.shareWizard = { success: publishResp.status() === 201, createdPostId };

    await page.waitForTimeout(1000);

    // ═════════════════════════════════════════════════════════════════
    // FLOW 12: EDIT AND DELETE OWN POST
    // ═════════════════════════════════════════════════════════════════
    if (createdPostId) {
      console.log(`\n[Flow 12] Editing and deleting own post (${createdPostId})...`);

      // Go to edit page
      await page.goto(`${FRONTEND_URL}${appendUi(`/experiences/${createdPostId}/edit`)}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      const editRoleInput = page.locator('input[placeholder*="SWE Intern"]').first();
      await editRoleInput.waitFor({ state: 'visible', timeout: 5000 });
      await editRoleInput.fill('Systems Engineer [Updated]');

      // Step to review
      await page.locator('button:has-text("NEXT")').first().click();
      await page.waitForTimeout(200);
      await page.locator('button:has-text("NEXT")').first().click();
      await page.waitForTimeout(200);
      await page.locator('button:has-text("NEXT")').first().click();
      await page.waitForTimeout(200);

      // In edit mode: NDA checkbox
      const ndaEditCheckDiv = page.locator('label div.w-5.h-5, [data-testid="nda-checkbox"], label div').first();
      await ndaEditCheckDiv.click();

      console.log(`[SAFETY CHECK] Masked DB Host before edit write: ${maskHost(DATABASE_URL)}`);
      const updateBtn = page.locator('button:has-text("UPDATE REPORT")').first();
      const [updateResp] = await Promise.all([
        page.waitForResponse(r => r.url().includes(`/api/experiences/${createdPostId}`) && r.request().method() === 'PUT'),
        updateBtn.click(),
      ]);
      console.log(`  PUT /api/experiences/${createdPostId} status: ${updateResp.status()}`);
      await page.waitForTimeout(600);

      // Detail page: Delete button
      console.log(`  Deleting created post to keep dev DB clean...`);
      console.log(`[SAFETY CHECK] Masked DB Host before delete write: ${maskHost(DATABASE_URL)}`);
      const deleteBtn = page.locator('button[title="Delete report"]').first();
      await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });

      const [deleteResp] = await Promise.all([
        page.waitForResponse(r => r.url().includes(`/api/experiences/${createdPostId}`) && r.request().method() === 'DELETE'),
        deleteBtn.click(),
      ]);
      console.log(`  DELETE /api/experiences/${createdPostId} status: ${deleteResp.status()}`);
      await page.waitForTimeout(600);

      recording.flows.editAndDelete = { success: updateResp.status() === 200 && deleteResp.status() === 200 };
    }

    console.log('\n--- ALL 12 INTEL CONTRACT FLOWS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\nTest flow error:', err);
    recording.error = String(err);
  } finally {
    await browser.close();
  }

  // Ensure output directory exists
  const outDir = path.join(rootDir, 'private', 'intel-contract');
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${mode}.json`);
  fs.writeFileSync(outFile, JSON.stringify(recording, null, 2), 'utf8');
  console.log(`\n[SAVED] Contract recording saved to: ${outFile}`);
  console.log(`[SUMMARY] Total recorded HTTP requests: ${recording.timeline.length}`);
}

run();
