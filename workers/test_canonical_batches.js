'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const part1 = require('./canonical_dataset/part1_trees_linked_lists');
const part2 = require('./canonical_dataset/part2_arrays_matrix_twopointers');
const part3 = require('./canonical_dataset/part3_strings_backtracking');
const { runSandbox } = require('./sandbox');

async function testBatch(batch, name) {
  console.log(`\n======================================================`);
  console.log(`Testing ${name} (${batch.length} problems across JS, Python, Java, C++)`);
  console.log(`======================================================`);

  let passedAll = 0;
  for (let i = 0; i < batch.length; i++) {
    const prob = batch[i];
    process.stdout.write(`[${i+1}/${batch.length}] ${prob.title} ... `);

    const langs = ['js', 'py', 'java', 'cpp'];
    let probPass = true;
    const errors = [];

    for (const lang of langs) {
      const code = prob.solutions[lang];
      const langKey = lang === 'js' ? 'javascript' : lang === 'py' ? 'python' : lang;
      try {
        const res = await runSandbox({
          language: langKey,
          code,
          testCases: prob.test_cases,
          timeLimitMs: 10000
        });
        if (res.verdict !== 'ACCEPTED' || res.passedTests !== prob.test_cases.length) {
          probPass = false;
          errors.push(`${lang.toUpperCase()}: ${res.verdict} (${res.passedTests}/${prob.test_cases.length}) ${res.testResults?.[0]?.error || ''}`);
        }
      } catch (err) {
        probPass = false;
        errors.push(`${lang.toUpperCase()} Fatal: ${err.message}`);
      }
    }

    if (probPass) {
      console.log('✅ ALL 4 LANGS PASSED');
      passedAll++;
    } else {
      console.log('❌ FAILED: ' + errors.join(' | '));
    }
  }

  console.log(`\nResult for ${name}: ${passedAll}/${batch.length} (100% in 4 languages)\n`);
}

async function main() {
  await testBatch(part1, 'Part 1 (Trees & Linked Lists)');
  await testBatch(part2, 'Part 2 (Arrays & Mutations)');
  await testBatch(part3, 'Part 3 (Strings & Backtracking)');
}

main().catch(console.error);
