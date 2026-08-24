'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
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

const rawList = require('./all_175_problems_raw.json');
const rawMap = new Map();
rawList.forEach(r => rawMap.set(r.title.trim().toLowerCase(), r));

// Index of pre-verified canonical problems
const canonicalMap = new Map();
[...part1, ...part2, ...part3, ...part4, ...part5, ...part6].forEach(p => {
  canonicalMap.set(p.title.trim().toLowerCase(), p);
});

console.log(`Loaded ${canonicalMap.size} curated canonical problems and ${rawMap.size} pristine raw problem definitions.`);

/**
 * Standardize and clean a problem description to 100% pure LeetCode Markdown.
 * Deterministic and idempotent (can be run repeatedly without duplicating headers).
 */
function cleanProblemDescription(title, rawDesc, sampleInput, sampleOutput) {
  let text = (rawDesc || '').trim();

  // Strip stacked markdown artifacts from older migrations
  text = text.replace(/#{2,}/g, '');
  text = text.replace(/\*{3,}/g, '**');

  // 1. Extract the Constraints section from the bottom
  const lower = text.toLowerCase();
  const lastConstrPos = lower.lastIndexOf('constraints');
  let mainBody = text;
  let constraints = [];

  if (lastConstrPos > 0) {
    const rawConstr = text.slice(lastConstrPos).replace(/^constraints:?\*+/i, '').replace(/^\**constraints:?\**/i, '').trim();
    mainBody = text.slice(0, lastConstrPos).trim();
    constraints = rawConstr.split('\n')
      .map(s => s.trim().replace(/^[-*•]\s*/, '').replace(/^`+|`+$/g, ''))
      .filter(s => s && !s.toLowerCase().startsWith('example') && !s.startsWith('Input') && !s.startsWith('Output') && !s.startsWith('```') && !s.toLowerCase().includes('constraints'));
  }

  // Remove premature "Constraints:" in mainBody
  mainBody = mainBody.replace(/Constraints:?/gi, '').trim();

  // 2. Extract Problem Statement and Examples
  const parts = mainBody.split(/(?:^|\n)\s*(?:###\s*)?\**Example\s*\d*:?\**\s*/i);
  let statement = parts[0].trim().replace(/\*{3,}/g, '**');

  const examples = [];
  for (let i = 1; i < parts.length; i++) {
    let exText = parts[i].trim();

    // If entire block is in ``` ... ```, unwrap it
    if (exText.startsWith('```') && exText.endsWith('```')) {
      exText = exText.slice(3, -3).trim();
    }

    // Extract visual diagram before Input: if present
    let visual = '';
    const inputPos = exText.search(/(?:Input|input):/);
    if (inputPos > 0) {
      visual = exText.slice(0, inputPos).trim().replace(/^```+|```+$/g, '').trim();
      exText = exText.slice(inputPos);
    }

    let inMatch = exText.match(/(?:Input|input):\s*([\s\S]*?)(?=(?:Output|output):|$)/i);
    let outMatch = exText.match(/(?:Output|output):\s*([\s\S]*?)(?=(?:Explanation|explanation):|$)/i);
    let expMatch = exText.match(/(?:Explanation|explanation):\s*([\s\S]*?)$/i);

    let input = inMatch ? inMatch[1].trim().replace(/^`+|`+$/g, '').replace(/```/g, '').trim() : '';
    let output = outMatch ? outMatch[1].trim().replace(/^`+|`+$/g, '').replace(/```/g, '').trim() : '';
    let explanation = expMatch ? expMatch[1].trim().replace(/^`+|`+$/g, '').replace(/```/g, '').trim() : '';

    // Check if visual is embedded inside explanation
    if (explanation.includes('\n') && !visual) {
      const expLines = explanation.split('\n');
      const diagramLines = [];
      const textLines = [];
      expLines.forEach(line => {
        if (/^\s*[\d\s\-_\|\+\/\\]+$/.test(line) && line.trim().length > 0) {
          diagramLines.push(line);
        } else {
          textLines.push(line);
        }
      });
      if (diagramLines.length >= 2) {
        visual = diagramLines.join('\n');
        explanation = textLines.join(' ').replace(/\s+/g, ' ').trim();
      }
    }

    if (input || output) {
      examples.push({ visual, input, output, explanation });
    }
  }

  // Fallback if no examples were parsed
  if (examples.length === 0 && sampleInput && sampleOutput) {
    examples.push({ visual: '', input: sampleInput, output: sampleOutput, explanation: '' });
  }

  // 3. Assemble clean, pristine LeetCode Markdown
  let result = statement;

  examples.forEach((ex, idx) => {
    result += `\n\n### **Example ${idx + 1}:**`;
    if (ex.visual) {
      result += `\n\`\`\`\n${ex.visual}\n\`\`\``;
    }
    if (ex.input) result += `\n**Input:** ${ex.input}`;
    if (ex.output) result += `\n**Output:** ${ex.output}`;
    if (ex.explanation) result += `\n**Explanation:** ${ex.explanation}`;
  });

  result += '\n\n### **Constraints:**';
  if (constraints.length > 0) {
    constraints.forEach(c => {
      let cleanC = c
        .replace(/-105\b/g, '-10⁵').replace(/105\b/g, '10⁵')
        .replace(/-104\b/g, '-10⁴').replace(/104\b/g, '10⁴')
        .replace(/-109\b/g, '-10⁹').replace(/109\b/g, '10⁹')
        .replace(/231\s*-\s*1/g, '2³¹ - 1')
        .replace(/231-1/g, '2³¹ - 1');
      result += `\n- \`${cleanC}\``;
    });
  } else {
    result += '\n- All inputs are within standard constraints.';
  }

  // Clean trailing spaces and multiple newlines
  result = result.replace(/\n+\s*\*\*\s*\n+/g, '\n\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result.trim();
}

/**
 * Standardize topic category accurately
 */
function standardizeTopic(title, currentTopic) {
  const t = title.toLowerCase();
  if (t.includes('tree') || t.includes('bst') || t.includes('ancestor') || t.includes('depth') || t.includes('flatten binary') || t.includes('populating next')) return 'trees';
  if (t.includes('linked list') || t.includes('list') && !t.includes('wordlist') && !t.includes('word ladder') || t.includes('reverse nodes in k')) return 'linked-lists';
  if (t.includes('island') || t.includes('graph') || t.includes('ladder') || t.includes('course schedule') || t.includes('surrounded regions') || t.includes('sudoku') || t.includes('water flow') || t.includes('rotting oranges')) return 'graphs';
  if (t.includes('substring') || t.includes('string') || t.includes('palindrome') || t.includes('parenthes') || t.includes('word') || t.includes('anagram') || t.includes('ip address') || t.includes('simplify path') || t.includes('roman') || t.includes('text justification') || t.includes('repeated dna')) return 'strings';
  if (t.includes('search') || t.includes('median of two') || t.includes('find peak') || t.includes('find first and last')) return 'binary-search';
  if (t.includes('climb') || t.includes('coin') || t.includes('unique paths') || t.includes('edit distance') || t.includes('robber') || t.includes('subsequence') || t.includes('decode ways') || t.includes('triangle') || t.includes('dungeon') || t.includes('maximal rectangle') || t.includes('maximum product') || t.includes('candy') || t.includes('stock')) return 'dp';
  return currentTopic || 'arrays';
}

/**
 * Standardize sample output/input quoting
 */
function standardizeSample(val, isStringExpected) {
  if (!val) return val;
  const v = String(val).trim();
  if (isStringExpected) {
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")) || v.startsWith('[') || v.startsWith('{')) {
      return v;
    }
    return JSON.stringify(v);
  }
  return v;
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

  // Remove duplicate empty problems
  const titleMap = {};
  for (const p of problems) {
    const list = tcByProb[p.id] || [];
    if (!titleMap[p.title]) {
      titleMap[p.title] = { problem: p, testCount: list.length };
    } else {
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

  // Process in concurrent batches of 15
  const BATCH_SIZE = 15;
  for (let i = 0; i < activeProblems.length; i += BATCH_SIZE) {
    const batch = activeProblems.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (p) => {
      const key = p.title.trim().toLowerCase();
      const canonical = canonicalMap.get(key);
      const raw = rawMap.get(key);

      let title = p.title.trim();
      let topic = canonical ? canonical.topic : standardizeTopic(title, p.topic);
      let difficulty = canonical ? canonical.difficulty : (raw ? raw.difficulty : p.difficulty);
      
      const baseDesc = canonical ? canonical.description : (raw ? raw.description : p.description);
      const baseInput = canonical ? canonical.sample_input : (raw ? raw.sample_input : p.sample_input);
      const baseOutput = canonical ? canonical.sample_output : (raw ? raw.sample_output : p.sample_output);

      let description = canonical ? canonical.description : cleanProblemDescription(title, baseDesc, baseInput, baseOutput);
      let sampleInput = baseInput;
      let sampleOutput = baseOutput;

      if (topic === 'strings' && !sampleOutput.startsWith('"') && !sampleOutput.startsWith('[') && sampleOutput !== 'true' && sampleOutput !== 'false' && isNaN(Number(sampleOutput))) {
        sampleOutput = JSON.stringify(sampleOutput);
      }

      await pool.query(
        `UPDATE problems SET title = $1, topic = $2, difficulty = $3, description = $4, sample_input = $5, sample_output = $6 WHERE id = $7`,
        [title, topic, difficulty, description, sampleInput, sampleOutput, p.id]
      );
      updatedCount++;

      let existingTests = tcByProb[p.id] || [];
      if (canonical && canonical.test_cases && canonical.test_cases.length > 0) {
        await pool.query('DELETE FROM test_cases WHERE problem_id = $1', [p.id]);
        for (const tc of canonical.test_cases) {
          await pool.query(
            `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
            [p.id, tc.input, tc.output, tc.is_hidden || false]
          );
          testCasesAdded++;
        }
      } else if (existingTests.length === 0 && sampleInput && sampleOutput) {
        await pool.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
          [p.id, sampleInput, sampleOutput, false]
        );
        testCasesAdded++;
      }
    }));
    console.log(`Progress: ${Math.min(i + BATCH_SIZE, activeProblems.length)} / ${activeProblems.length} problems synced...`);
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
