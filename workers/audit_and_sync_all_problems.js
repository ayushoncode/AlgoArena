'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const part1 = require('./canonical_dataset/part1_trees_linked_lists');
const part2 = require('./canonical_dataset/part2_arrays_matrix_twopointers');
const part3 = require('./canonical_dataset/part3_strings_backtracking');
const part4 = require('./canonical_dataset/part4_dp_math_greedy_graphs');
const part5 = require('./canonical_dataset/part5_advanced_dp_graphs');
const part6 = require('./canonical_dataset/part6_arrays_strings_math');

// Index of pre-verified canonical problems
const canonicalMap = new Map();
[...part1, ...part2, ...part3, ...part4, ...part5, ...part6].forEach(p => {
  canonicalMap.set(p.title.trim().toLowerCase(), p);
});

console.log(`Loaded ${canonicalMap.size} curated canonical problems.`);

/**
 * Standardize and clean a problem description to LeetCode-grade Markdown
 */
function cleanProblemDescription(title, rawDesc, sampleInput, sampleOutput) {
  let text = rawDesc || '';

  // Remove leading/trailing unwanted characters
  text = text.trim();

  // If already contains ### **Example or **Example, format standard
  if (!text.includes('### **Example') && !text.includes('**Example')) {
    // Generate example card from sample input/output if present
    if (sampleInput && sampleOutput) {
      text += `\n\n### **Example 1:**\n**Input:** ${sampleInput}\n**Output:** ${sampleOutput}`;
    }
  }

  // Format headers
  text = text.replace(/###\s*Example\s*(\d*):?/gi, '### **Example $1:**');
  text = text.replace(/\*\*Example\s*(\d*):?\*\*/gi, '### **Example $1:**');
  text = text.replace(/Example\s*(\d+):/gi, '### **Example $1:**');

  // Format Input / Output / Explanation
  text = text.replace(/(?:^|\n)(?:Input|input):\s*/g, '\n**Input:** ');
  text = text.replace(/(?:^|\n)(?:Output|output):\s*/g, '\n**Output:** ');
  text = text.replace(/(?:^|\n)(?:Explanation|explanation):\s*/g, '\n**Explanation:** ');

  // Format Constraints
  text = text.replace(/###\s*Constraints:?/gi, '### **Constraints:**');
  text = text.replace(/\*\*Constraints:?\*\*/gi, '### **Constraints:**');
  if (!text.includes('### **Constraints:**') && !text.includes('Constraints:')) {
    text += `\n\n### **Constraints:**\n- All inputs are within standard constraints.`;
  }

  // Clean up corrupted characters, excessive dashes, "•" bullets
  text = text.replace(/•/g, '-');
  text = text.replace(/\n\s*---\s*\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Infer or correct topic
 */
function standardizeTopic(title, currentTopic) {
  const t = title.toLowerCase();
  if (t.includes('tree') || t.includes('bst') || t.includes('ancestor') || t.includes('depth')) return 'trees';
  if (t.includes('list') || t.includes('linked')) return 'linked-lists';
  if (t.includes('island') || t.includes('graph') || t.includes('ladder') || t.includes('course schedule')) return 'graphs';
  if (t.includes('substring') || t.includes('string') || t.includes('palindrome') || t.includes('parenthes') || t.includes('word') || t.includes('anagram') || t.includes('ip address') || t.includes('path') && t.includes('simplify')) return 'strings';
  if (t.includes('search') || t.includes('median of two')) return 'binary-search';
  if (t.includes('climb') || t.includes('coin') || t.includes('unique paths') || t.includes('edit distance') || t.includes('robber') || t.includes('subsequence') || t.includes('decode ways') || t.includes('triangle') || t.includes('dungeon')) return 'dp';
  return currentTopic || 'arrays';
}

async function auditAndSync() {
  console.log('--- Starting Full Database Audit & Synchronization ---');

  // 1. Fetch all problems
  const { rows: problems } = await pool.query('SELECT * FROM problems ORDER BY title ASC');
  const { rows: testCases } = await pool.query('SELECT * FROM test_cases ORDER BY problem_id, id ASC');

  const tcByProb = {};
  testCases.forEach(tc => {
    if (!tcByProb[tc.problem_id]) tcByProb[tc.problem_id] = [];
    tcByProb[tc.problem_id].push(tc);
  });

  console.log(`Auditing ${problems.length} total problem records in DB...`);

  // Remove duplicate empty problem (e.g. empty 'Container With Most Water')
  const titleMap = {};
  for (const p of problems) {
    const list = tcByProb[p.id] || [];
    if (!titleMap[p.title]) {
      titleMap[p.title] = { problem: p, testCount: list.length };
    } else {
      // Duplicate title! Keep the one with test cases, delete the empty one
      const toDelete = list.length === 0 ? p.id : titleMap[p.title].problem.id;
      const toKeep = list.length === 0 ? titleMap[p.title].problem.id : p.id;
      console.log(`Re-linking matches/submissions and deleting duplicate problem '${p.title}' (ID: ${toDelete})...`);
      await pool.query('UPDATE matches SET problem_id = $1 WHERE problem_id = $2', [toKeep, toDelete]);
      await pool.query('UPDATE submissions SET problem_id = $1 WHERE problem_id = $2', [toKeep, toDelete]);
      await pool.query('DELETE FROM problems WHERE id = $1', [toDelete]);
      if (list.length > 0) {
        titleMap[p.title] = { problem: p, testCount: list.length };
      }
    }
  }

  // 2. Refresh problem list after deduplication
  const { rows: activeProblems } = await pool.query('SELECT * FROM problems ORDER BY title ASC');
  console.log(`Active unique problems in DB: ${activeProblems.length}`);

  let updatedCount = 0;
  let testCasesAdded = 0;

  for (const p of activeProblems) {
    const key = p.title.trim().toLowerCase();
    const canonical = canonicalMap.get(key);

    let title = p.title.trim();
    let topic = canonical ? canonical.topic : standardizeTopic(title, p.topic);
    let difficulty = canonical ? canonical.difficulty : p.difficulty;
    let description = canonical ? canonical.description : cleanProblemDescription(title, p.description, p.sample_input, p.sample_output);
    let sampleInput = canonical ? canonical.sample_input : p.sample_input;
    let sampleOutput = canonical ? canonical.sample_output : p.sample_output;

    // Update problem metadata & description
    await pool.query(
      `UPDATE problems SET title = $1, topic = $2, difficulty = $3, description = $4, sample_input = $5, sample_output = $6 WHERE id = $7`,
      [title, topic, difficulty, description, sampleInput, sampleOutput, p.id]
    );
    updatedCount++;

    // Ensure tests
    let existingTests = tcByProb[p.id] || [];
    if (canonical && canonical.test_cases && canonical.test_cases.length > 0) {
      // Replace with canonical verified tests
      await pool.query('DELETE FROM test_cases WHERE problem_id = $1', [p.id]);
      for (const tc of canonical.test_cases) {
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
          [p.id, tc.input, tc.output, tc.is_hidden || false]
        );
        testCasesAdded++;
      }
    } else if (existingTests.length === 0 && sampleInput && sampleOutput) {
      // Add minimum test case from sample
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
        [p.id, sampleInput, sampleOutput, false]
      );
      testCasesAdded++;
    }
  }

  console.log(`\nAudit Complete:`);
  console.log(`- Problems Synchronized & Cleaned: ${updatedCount}`);
  console.log(`- Canonical Test Cases Written: ${testCasesAdded}`);

  await pool.end();
}

auditAndSync().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
