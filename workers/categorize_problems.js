'use strict';
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('all_175_problems_raw.json', 'utf8'));
const unique = [];
const seen = new Set();

for (const p of raw) {
  if (!seen.has(p.title)) {
    seen.add(p.title);
    unique.push(p);
  }
}

const groups = {};
unique.forEach(p => {
  if (!groups[p.topic]) groups[p.topic] = [];
  groups[p.topic].push(p);
});

console.log('Problem counts by topic:');
Object.entries(groups).forEach(([topic, list]) => {
  console.log(`\n=== Topic: ${topic} (${list.length} problems) ===`);
  console.log(list.map((p, i) => `${i+1}. ${p.title} [${p.difficulty}] (tests: ${p.test_cases.length})`).join('\n'));
});
