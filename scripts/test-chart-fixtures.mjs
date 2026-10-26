import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

const testUser = {
  id: '77017a8f-4ef6-415c-b4dd-266efdfe43e4',
  username: 'ayush_ayush',
  email: 'ayush916282580@gmail.com',
  elo_rating: 1239,
  wins: 59,
  losses: 57,
  total_matches: 116,
};
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

const fixturesDir = path.join(rootDir, 'private', 'profile-screenshots', 'fixtures');
fs.mkdirSync(fixturesDir, { recursive: true });

// ── FIXTURE GENERATORS ───────────────────────────────────────────

function generateFixtures() {
  const baseDate = new Date('2026-10-01T12:00:00.000Z');

  // 1. 0 points
  const f0 = [];

  // 2. 1 point
  const f1 = [
    {
      id: 'p1',
      date: '2026-10-15T14:30:00.000Z',
      rating: 1200,
      old_rating: 1200,
      delta: 0,
      opponent: 'alice',
      result: 'WIN',
    },
  ];

  // 3. 2 points
  const f2 = [
    {
      id: 'p1',
      date: '2026-10-15T14:30:00.000Z',
      rating: 1200,
      old_rating: 1200,
      delta: 0,
      opponent: 'alice',
      result: 'WIN',
    },
    {
      id: 'p2',
      date: '2026-10-18T16:00:00.000Z',
      rating: 1224,
      old_rating: 1200,
      delta: 24,
      opponent: 'bob',
      result: 'WIN',
    },
  ];

  // 4. 50 points
  const f50 = [];
  let r50 = 1200;
  for (let i = 0; i < 50; i++) {
    const d = new Date(baseDate.getTime() + i * 18 * 3600 * 1000);
    const delta = (i % 3 === 0 ? -14 : 18) + (i % 5);
    const old = r50;
    r50 = Math.max(1050, r50 + delta);
    f50.push({
      id: `p50-${i}`,
      date: d.toISOString(),
      rating: r50,
      old_rating: old,
      delta: r50 - old,
      opponent: `rival_${i % 7}`,
      result: delta > 0 ? 'WIN' : 'LOSS',
    });
  }

  // 5. 400 points (downsampler boundary)
  const f400 = [];
  let r400 = 1200;
  for (let i = 0; i < 400; i++) {
    const d = new Date(baseDate.getTime() + i * 2 * 3600 * 1000);
    const delta = ((i * 17) % 35) - 16;
    const old = r400;
    r400 = Math.max(1000, Math.min(1850, r400 + delta));
    f400.push({
      id: `p400-${i}`,
      date: d.toISOString(),
      rating: r400,
      old_rating: old,
      delta: r400 - old,
      opponent: `player_${i % 12}`,
      result: delta >= 0 ? 'WIN' : 'LOSS',
    });
  }

  // 6. 1500 points (stress test downsampler)
  const f1500 = [];
  let r1500 = 1200;
  for (let i = 0; i < 1500; i++) {
    const d = new Date(baseDate.getTime() + i * 40 * 60 * 1000);
    const delta = ((i * 23) % 41) - 19;
    const old = r1500;
    r1500 = Math.max(1000, Math.min(1950, r1500 + delta));
    f1500.push({
      id: `p1500-${i}`,
      date: d.toISOString(),
      rating: r1500,
      old_rating: old,
      delta: r1500 - old,
      opponent: `stress_${i % 20}`,
      result: delta >= 0 ? 'WIN' : 'LOSS',
    });
  }

  // 7. Same timestamps repeated (multiple matches on same day & minute)
  const fRepeated = [
    { id: 'pr1', date: '2026-10-10T10:00:00.000Z', rating: 1215, old_rating: 1200, delta: 15, opponent: 'a', result: 'WIN' },
    { id: 'pr2', date: '2026-10-10T10:00:00.000Z', rating: 1230, old_rating: 1215, delta: 15, opponent: 'b', result: 'WIN' },
    { id: 'pr3', date: '2026-10-10T10:00:00.000Z', rating: 1218, old_rating: 1230, delta: -12, opponent: 'c', result: 'LOSS' },
    { id: 'pr4', date: '2026-10-15T14:00:00.000Z', rating: 1236, old_rating: 1218, delta: 18, opponent: 'd', result: 'WIN' },
    { id: 'pr5', date: '2026-10-15T14:00:00.000Z', rating: 1254, old_rating: 1236, delta: 18, opponent: 'e', result: 'WIN' },
  ];

  // 8. Unsorted data (random timestamp ordering)
  const fUnsorted = [
    { id: 'u3', date: '2026-10-20T12:00:00.000Z', rating: 1260, old_rating: 1240, delta: 20, opponent: 'c', result: 'WIN' },
    { id: 'u1', date: '2026-10-05T08:00:00.000Z', rating: 1215, old_rating: 1200, delta: 15, opponent: 'a', result: 'WIN' },
    { id: 'u4', date: '2026-10-25T19:00:00.000Z', rating: 1245, old_rating: 1260, delta: -15, opponent: 'd', result: 'LOSS' },
    { id: 'u2', date: '2026-10-12T15:00:00.000Z', rating: 1240, old_rating: 1215, delta: 25, opponent: 'b', result: 'WIN' },
  ];

  // 9. Range crossing two tier boundaries (Apprentice 1250 -> Specialist 1450 -> Expert 1650)
  const fTwoTiers = [
    { id: 't1', date: '2026-09-15T10:00:00.000Z', rating: 1250, old_rating: 1200, delta: 50, opponent: 'opp1', result: 'WIN' },
    { id: 't2', date: '2026-09-28T14:00:00.000Z', rating: 1350, old_rating: 1250, delta: 100, opponent: 'opp2', result: 'WIN' },
    { id: 't3', date: '2026-10-08T16:00:00.000Z', rating: 1450, old_rating: 1350, delta: 100, opponent: 'opp3', result: 'WIN' },
    { id: 't4', date: '2026-10-18T18:00:00.000Z', rating: 1560, old_rating: 1450, delta: 110, opponent: 'opp4', result: 'WIN' },
    { id: 't5', date: '2026-10-26T20:00:00.000Z', rating: 1650, old_rating: 1560, delta: 90, opponent: 'opp5', result: 'WIN' },
  ];

  // 10. Player with fewer than 5 matches (K=48 placement calibration)
  const fFewerThan5 = [
    { id: 'p1', date: '2026-10-22T10:00:00.000Z', rating: 1248, old_rating: 1200, delta: 48, opponent: 'challenger1', result: 'WIN' },
    { id: 'p2', date: '2026-10-24T12:00:00.000Z', rating: 1200, old_rating: 1248, delta: -48, opponent: 'challenger2', result: 'LOSS' },
    { id: 'p3', date: '2026-10-26T14:00:00.000Z', rating: 1248, old_rating: 1200, delta: 48, opponent: 'challenger3', result: 'WIN' },
  ];

  // 11. Top tier (2150 Grandmaster)
  const fTopTier = [
    { id: 'gm1', date: '2026-10-01T10:00:00.000Z', rating: 2020, old_rating: 2000, delta: 20, opponent: 'master1', result: 'WIN' },
    { id: 'gm2', date: '2026-10-10T12:00:00.000Z', rating: 2080, old_rating: 2020, delta: 60, opponent: 'master2', result: 'WIN' },
    { id: 'gm3', date: '2026-10-18T15:00:00.000Z', rating: 2120, old_rating: 2080, delta: 40, opponent: 'master3', result: 'WIN' },
    { id: 'gm4', date: '2026-10-26T18:00:00.000Z', rating: 2150, old_rating: 2120, delta: 30, opponent: 'grandmaster1', result: 'WIN' },
  ];

  return {
    '01-0-points': { data: f0, currentElo: 1200, matches: 0 },
    '02-1-point': { data: f1, currentElo: 1200, matches: 1 },
    '03-2-points': { data: f2, currentElo: 1224, matches: 2 },
    '04-50-points': { data: f50, currentElo: r50, matches: 50 },
    '05-400-points': { data: f400, currentElo: r400, matches: 400 },
    '06-1500-points': { data: f1500, currentElo: r1500, matches: 1500 },
    '07-repeated-timestamps': { data: fRepeated, currentElo: 1254, matches: 5 },
    '08-unsorted-data': { data: fUnsorted, currentElo: 1245, matches: 4 },
    '09-two-tier-boundaries': { data: fTwoTiers, currentElo: 1650, matches: 5 },
    '10-fewer-than-5-matches': { data: fFewerThan5, currentElo: 1248, matches: 3 },
    '11-top-tier-grandmaster': { data: fTopTier, currentElo: 2150, matches: 4 },
  };
}

const viewports = [
  { name: '390', width: 390, height: 844 },
  { name: '820', width: 820, height: 1180 },
  { name: '1536', width: 1536, height: 960 },
];

async function runFixtureTests() {
  const fixtures = generateFixtures();
  const browser = await chromium.launch({ headless: true });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         PHASE C/D: RATING CHART FIXTURE TEST SUITE           ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`[INFO] Total fixtures to verify: ${Object.keys(fixtures).length}`);
  console.log(`[INFO] Viewports: ${viewports.map(v => v.name + 'px').join(', ')}\n`);

  let totalCollisionsDetected = 0;
  let totalDuplicateLabelsDetected = 0;
  let totalTestsPassed = 0;

  for (const [fixtureKey, fixture] of Object.entries(fixtures)) {
    console.log(`\n▶ Testing Fixture: [${fixtureKey}] (${fixture.data.length} points, current ELO: ${fixture.currentElo})...`);

    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Mock user auth
      const mockUser = {
        ...testUser,
        elo_rating: fixture.currentElo,
        total_matches: fixture.matches,
      };

      await page.addInitScript(({ tokenVal, userVal }) => {
        localStorage.setItem('aa_token', tokenVal);
        localStorage.setItem('aa_user', JSON.stringify(userVal));
      }, { tokenVal: token, userVal: mockUser });

      // Mock elo-history API with fixture data
      await page.route('**/api/users/**/elo-history', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fixture.data),
        });
      });

      // Mock user profile API with updated rating and matches
      await page.route('**/api/users/me', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUser),
        });
      });

      await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // Verify X-ticks if points >= 2
      if (fixture.data.length >= 2) {
        // Measure bounding boxes of all .x-tick-label elements
        const tickLabels = await page.locator('.x-tick-label').all();
        const boxes = [];
        const texts = [];

        for (const tick of tickLabels) {
          const txt = (await tick.textContent())?.trim();
          const box = await tick.boundingBox();
          if (box && txt) {
            boxes.push({ text: txt, ...box });
            texts.push(txt);
          }
        }

        // 1. Assert no repeated date labels
        const textSet = new Set(texts);
        const hasDuplicates = textSet.size !== texts.length;
        if (hasDuplicates) {
          console.error(`  ❌ [${vp.name}px] Duplicate X-tick labels found:`, texts);
          totalDuplicateLabelsDetected++;
        }

        // 2. Assert no overlapping bounding boxes
        boxes.sort((a, b) => a.x - b.x);
        let hasCollision = false;
        for (let i = 0; i < boxes.length - 1; i++) {
          const current = boxes[i];
          const next = boxes[i + 1];
          // Tolerating 1px subpixel rounding: current.x + current.width <= next.x
          if (current.x + current.width > next.x + 0.5) {
            console.error(`  ❌ [${vp.name}px] Label collision between "${current.text}" and "${next.text}"!`);
            console.error(`     current right (${current.x + current.width}) > next left (${next.x})`);
            hasCollision = true;
            totalCollisionsDetected++;
          }
        }

        if (!hasDuplicates && !hasCollision) {
          console.log(`  ✓ [${vp.name}px] ${boxes.length} collision-free ticks: [${texts.join(' • ')}]`);
          totalTestsPassed++;
        }
      } else {
        // Honest empty or single point state verification
        const chartText = await page.locator('.rating-chart-v2-container').textContent();
        console.log(`  ✓ [${vp.name}px] Honest boundary state: "${chartText?.replace(/\s+/g, ' ').trim().slice(0, 70)}..."`);
        totalTestsPassed++;
      }

      // Capture screenshot of fixture
      const shotPath = path.join(fixturesDir, `${fixtureKey}-${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      await context.close();
    }
  }

  await browser.close();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('              CHART FIXTURE TEST SUMMARY                     ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`[RESULT] Total Fixture Tests Passed:       ${totalTestsPassed} / 33`);
  console.log(`[RESULT] Collisions Detected:             ${totalCollisionsDetected}`);
  console.log(`[RESULT] Duplicate Labels Detected:       ${totalDuplicateLabelsDetected}`);
  console.log(`[SAVED]  Fixture screenshots in:          ${fixturesDir}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (totalCollisionsDetected > 0 || totalDuplicateLabelsDetected > 0) {
    process.exit(1);
  }
}

runFixtureTests().catch(err => {
  console.error('Fatal fixture test error:', err);
  process.exit(1);
});
