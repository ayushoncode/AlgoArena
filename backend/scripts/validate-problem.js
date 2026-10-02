const fs = require('fs');
const path = require('path');
const { runSandbox } = require('../../workers/sandbox.js');
const { Pool } = require('pg');

// Basic JSON Schema validation using hand-rolled checks for simplicity and speed
function validateSchema(data) {
  const req = ['title', 'topic', 'difficulty', 'statement', 'constraints', 'examples', 'hints', 'testSuite', 'referenceSolutions'];
  for (const r of req) {
    if (!data[r]) throw new Error(`Missing required field: ${r}`);
  }
  if (!Array.isArray(data.testSuite) || data.testSuite.length === 0) throw new Error("testSuite must be non-empty array");
  if (!data.referenceSolutions.python || !data.referenceSolutions.javascript || !data.referenceSolutions.java || !data.referenceSolutions.cpp) {
    throw new Error("Missing some language in referenceSolutions");
  }
}

async function validateProblem(problemFile) {
  const probPath = path.resolve(problemFile);
  if (!fs.existsSync(probPath)) {
    console.error(`File not found: ${probPath}`);
    process.exit(1);
  }

  const probData = JSON.parse(fs.readFileSync(probPath, 'utf8'));
  const title = probData.title;
  console.log(`\n========================================`);
  console.log(`Validating: ${title} (${probData.difficulty})`);
  console.log(`========================================\n`);

  // 1. JSON Schema Validation
  validateSchema(probData);
  console.log(`✅ JSON Schema passed`);

  // 2. Duplicate slug/title check against DB
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  const { rows } = await pool.query('SELECT id FROM problems WHERE slug = $1 OR title = $2', [slug, title]);
  if (rows.length > 0) {
    console.error(`❌ Duplicate title or slug found in DB: ${title}`);
    process.exit(1);
  }
  console.log(`✅ DB Slug/Title uniquely available`);

  // 3. Test case count checks
  const hiddenCount = probData.testSuite.filter(t => t.is_hidden).length;
  const reqHidden = probData.difficulty === 'easy' ? 15 : 20;
  if (hiddenCount < reqHidden) {
    console.error(`❌ Insufficient hidden tests: ${hiddenCount} (Required: ${reqHidden})`);
    process.exit(1);
  }
  console.log(`✅ Hidden tests count: ${hiddenCount}`);

  // 4. Starter code generation validation
  const sigModuleUrl = 'file://' + path.resolve(__dirname, '../../frontend/src/utils/problemSignatures.js');
  const { CANONICAL_SIGNATURES, buildStarterTemplate } = await import(sigModuleUrl);
  if (!CANONICAL_SIGNATURES[title.toLowerCase()]) {
    console.error(`❌ Missing signature in CANONICAL_SIGNATURES for: "${title.toLowerCase()}"`);
    process.exit(1);
  }
  const starterCodes = {};
  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    try {
      starterCodes[lang] = buildStarterTemplate({ title, sample_input: probData.examples[0].input }, lang);
    } catch (e) {
      console.error(`❌ Starter code generation failed for ${lang}: ${e.message}`);
      process.exit(1);
    }
  }
  console.log(`✅ Starter code generated for all 4 languages`);

  const testCases = probData.testSuite;
  const TIMEOUT = 5000;

  // 5. Empty solution baseline
  console.log(`\n--- Running Empty Solution Baseline ---`);
  const emptyRes = await runSandbox({
    code: `def solution(*args):\n    return None`,
    language: 'python',
    testCases,
    timeLimitMs: TIMEOUT
  });
  console.log(`✅ Baseline empty python solution execution took: ${emptyRes.runtimeMs}ms`);

  // 6. Run all 4 references + cross check
  console.log(`\n--- Running References (All Languages) ---`);
  const runLang = async (lang, code) => {
    const res = await runSandbox({ code, language: lang, testCases, timeLimitMs: TIMEOUT });
    if (res.verdict !== 'ACCEPTED') {
      console.error(`❌ ${lang.toUpperCase()} Reference failed! Verdict: ${res.verdict}`);
      process.exit(1);
    }
    console.log(`✅ ${lang.padEnd(10)} passed all ${res.totalTests} tests (Raw Runtime: ${res.runtimeMs}ms).`);
  };

  await runLang('python', probData.referenceSolutions.python);
  await runLang('javascript', probData.referenceSolutions.javascript);
  await runLang('java', probData.referenceSolutions.java);
  await runLang('cpp', probData.referenceSolutions.cpp);

  // 7. Validate Brute Force Solution
  if (probData.bruteForceSolution) {
    console.log(`\n--- Running Brute Force Solution ---`);
    const bf = probData.bruteForceSolution;
    const bfRes = await runSandbox({
      code: bf.code,
      language: bf.language,
      testCases,
      timeLimitMs: TIMEOUT
    });

    if (bfRes.verdict === 'TIME_LIMIT_EXCEEDED') {
      console.log(`✅ Brute force solution got TLE as expected.`);
    } else {
      console.log(`⚠️ Brute force solution did NOT get TLE (Verdict: ${bfRes.verdict}). (This is fine if TLE is not applicable)`);
    }
  }

  // 8. Starter Code failure check
  console.log(`\n--- Validating Starter Codes Fail Cleanly ---`);
  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    const scRes = await runSandbox({ code: starterCodes[lang], language: lang, testCases: [testCases[0]], timeLimitMs: 2000 });
    if (scRes.verdict === 'ACCEPTED') {
        console.error(`❌ ${lang.toUpperCase()} Starter code passed the test? Shouldn't happen.`);
        process.exit(1);
    }
    console.log(`✅ ${lang.padEnd(10)} starter code failed cleanly (${scRes.verdict}) (Empty Runtime: ${scRes.runtimeMs}ms)`);
  }

  console.log(`\n🎉 All rigid validations completed successfully for ${title}!`);
  pool.end();
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node validate-problem.js <path-to-json>");
  process.exit(1);
}

// Ensure .env is loaded
require('dotenv').config({ path: __dirname + '/../.env' });
validateProblem(args[0]).catch(e => {
  console.error(e);
  process.exit(1);
});
