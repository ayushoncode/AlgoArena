'use strict';
const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('all_175_problems_raw.json', 'utf8'));
const uniqueRaw = [];
const seen = new Set();
for (const p of raw) {
  if (!seen.has(p.title)) {
    seen.add(p.title);
    uniqueRaw.push(p);
  }
}

const part1 = require('./canonical_dataset/part1_trees_linked_lists');
const part2 = require('./canonical_dataset/part2_arrays_matrix_twopointers');
const part3 = require('./canonical_dataset/part3_strings_backtracking');
const part4 = require('./canonical_dataset/part4_dp_math_greedy_graphs');

const allCatalog = [...part1, ...part2, ...part3, ...part4];
const catalogTitles = new Set(allCatalog.map(p => p.title));

const missing = uniqueRaw.filter(p => !catalogTitles.has(p.title));

console.log(`Unique problems in DB: ${uniqueRaw.length}`);
console.log(`Problems in canonical dataset: ${allCatalog.length}`);
console.log(`Remaining problems to specify: ${missing.length}`);
console.log('\nMissing problem titles:');
console.log(missing.map((p, i) => `${i+1}. ${p.title} (${p.difficulty} | ${p.topic})`).join('\n'));
