'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { runSandbox } = require('./sandbox');
const part2 = require('./canonical_dataset/part2_arrays_matrix_twopointers');

async function testOne() {
  const prob = part2.find(p => p.title === 'Two Sum');
  console.log('Testing Two Sum...');

  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    const codeKey = lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang;
    const code = prob.solutions[codeKey];
    console.log(`Running ${lang}...`);
    const res = await runSandbox({
      language: lang,
      code,
      testCases: prob.test_cases,
      timeLimitMs: 12000
    });
    console.log(`${lang} verdict:`, res.verdict, 'passed:', res.passedTests, '/', prob.test_cases.length);
    if (res.verdict !== 'ACCEPTED') {
      console.log('Error:', res.testResults);
    }
  }
}

testOne().catch(console.error);
