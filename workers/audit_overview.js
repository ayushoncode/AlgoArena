'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('all_175_problems_raw.json', 'utf8'));

// Filter out empty duplicate
const seen = new Set();
const problems = [];
for (const p of raw) {
  if (seen.has(p.title)) {
    if (p.test_cases.length > 0) {
      const idx = problems.findIndex(x => x.title === p.title);
      if (idx !== -1 && problems[idx].test_cases.length === 0) {
        problems[idx] = p;
      }
    }
  } else {
    seen.add(p.title);
    problems.push(p);
  }
}

console.log(`Auditing ${problems.length} unique problems...`);

const report = {
  total: problems.length,
  byTopic: {},
  byDifficulty: {},
  missingTests: [],
  testCounts: {}
};

problems.forEach(p => {
  report.byTopic[p.topic] = (report.byTopic[p.topic] || 0) + 1;
  report.byDifficulty[p.difficulty] = (report.byDifficulty[p.difficulty] || 0) + 1;
  report.testCounts[p.title] = p.test_cases.length;
  if (p.test_cases.length === 0) {
    report.missingTests.push(p.title);
  }
});

console.log('Audit Overview:');
console.log('Difficulty Distribution:', report.byDifficulty);
console.log('Topic Distribution:', report.byTopic);
console.log('Problems with 0 test cases:', report.missingTests);
