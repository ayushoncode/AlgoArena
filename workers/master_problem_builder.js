'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const { Pool } = require('pg');
const { runSandbox } = require('./sandbox');

const part1 = require('./canonical_dataset/part1_trees_linked_lists');
const part2 = require('./canonical_dataset/part2_arrays_matrix_twopointers');
const part3 = require('./canonical_dataset/part3_strings_backtracking');
const part4 = require('./canonical_dataset/part4_dp_math_greedy_graphs');
const part5 = require('./canonical_dataset/part5_advanced_dp_graphs');
const part6 = require('./canonical_dataset/part6_arrays_strings_math');

// Combine pre-built parts
const catalog = new Map();
[...part1, ...part2, ...part3, ...part4, ...part5, ...part6].forEach(p => {
  catalog.set(p.title, p);
});

console.log(`Loaded ${catalog.size} curated canonical problems.`);

module.exports = { catalog };
