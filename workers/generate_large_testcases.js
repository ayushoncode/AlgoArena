'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs = require('fs');
const { Pool } = require('pg');
const { runSandbox } = require('./sandbox');

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

const canonicalMap = new Map();
[...part1, ...part2, ...part3, ...part4, ...part5, ...part6].forEach(p => {
  canonicalMap.set(p.title.trim().toLowerCase(), p);
});

// Helper to determine argument types from sample_input
function parseSignature(sampleInput, topic) {
  if (!sampleInput) return [];
  try {
    const rawArgs = JSON.parse('[' + sampleInput + ']');
    return rawArgs.map((arg, i) => {
      if (Array.isArray(arg)) {
        if (topic === 'trees') return { type: 'tree' };
        if (topic === 'linked-lists') return { type: 'linked-list' };
        if (Array.isArray(arg[0])) return { type: 'matrix' };
        return { type: 'array' };
      }
      if (typeof arg === 'string') return { type: 'string' };
      if (typeof arg === 'number') return { type: 'number' };
      return { type: 'unknown' };
    });
  } catch (e) {
    return [];
  }
}

function generateLargeInput(types, seed = 1) {
  const args = [];
  for (const t of types) {
    if (t.type === 'array') {
      const N = 10000;
      const arr = [];
      for(let i=0; i<N; i++) arr.push(i % 1000 - 500);
      args.push(arr);
    } else if (t.type === 'tree') {
      const N = 5000; // Deep tree
      const arr = [];
      for(let i=1; i<=N; i++) arr.push(i);
      args.push(arr);
    } else if (t.type === 'linked-list') {
      const N = 10000;
      const arr = [];
      for(let i=1; i<=N; i++) arr.push(i);
      args.push(arr);
    } else if (t.type === 'matrix') {
      const M = 200, N = 200;
      const mat = [];
      for(let i=0; i<M; i++) {
        const row = [];
        for(let j=0; j<N; j++) row.push((i*N+j)%100);
        mat.push(row);
      }
      args.push(mat);
    } else if (t.type === 'string') {
      const N = 10000;
      const chars = "abcdefghijklmnopqrstuvwxyz()[]{}";
      let s = "";
      for(let i=0; i<N; i++) s += chars[(seed * i) % chars.length];
      args.push(s);
    } else if (t.type === 'number') {
      args.push(seed * 1000);
    } else {
      args.push(null);
    }
  }
  
  // Format as a valid JSON string without the outer brackets
  return JSON.stringify(args).slice(1, -1);
}

function generateEdgeInput(types) {
  const args = [];
  for (const t of types) {
    if (t.type === 'array') args.push([]);
    else if (t.type === 'tree') args.push([]);
    else if (t.type === 'linked-list') args.push([]);
    else if (t.type === 'matrix') args.push([[]]);
    else if (t.type === 'string') args.push("");
    else if (t.type === 'number') args.push(0);
    else args.push(null);
  }
  return JSON.stringify(args).slice(1, -1);
}

async function run() {
  console.log('Generating massive edge cases and inserting to DB...');
  let totalAdded = 0;
  
  let processed = 0;
  for (const [titleKey, p] of canonicalMap.entries()) {
    console.log(`Processing: ${p.title}`);
    
    // Check if we can parse the signature
    const sigTypes = parseSignature(p.sample_input, p.topic);
    if (sigTypes.length === 0) {
      console.log(`  -> Skipping, could not parse signature for input: ${p.sample_input}`);
      continue;
    }
    
    // Generate inputs
    const inputsToTest = [];
    
    // 1. Large Input
    inputsToTest.push(generateLargeInput(sigTypes, 1));
    
    // 2. Another variant (reverse sorted or different seed)
    inputsToTest.push(generateLargeInput(sigTypes, 7));
    
    // 3. Empty/Zero Edge Case
    inputsToTest.push(generateEdgeInput(sigTypes));
    
    // Now run these inputs through the JS Reference solution
    const jsSolution = p.solutions.js;
    if (!jsSolution) continue;
    
    // Get problem ID from DB
    const { rows: probRows } = await pool.query('SELECT id FROM problems WHERE LOWER(title) = $1', [titleKey]);
    if (probRows.length === 0) continue;
    const problemId = probRows[0].id;
    
    for (const testInput of inputsToTest) {
      // Check if this input already exists in the test_cases
      const { rows: existing } = await pool.query(
        'SELECT id FROM test_cases WHERE problem_id = $1 AND input = $2', 
        [problemId, testInput]
      );
      if (existing.length > 0) continue;
      
      try {
        const result = await runSandbox({
          language: 'javascript',
          code: jsSolution,
          testCases: [{ input: testInput, output: null }], 
          timeLimitMs: 15000
        });
        
        if (result.testResults && result.testResults.length > 0) {
          const resObj = result.testResults[0];
          if (!resObj.error && resObj.actual !== undefined) {
             const expectedOutputStr = typeof resObj.actual === 'string' && (resObj.actual.startsWith('[') || resObj.actual === 'true' || resObj.actual === 'false') ? resObj.actual : JSON.stringify(resObj.actual);
             
             // Insert into DB
             await pool.query(
               'INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)',
               [problemId, testInput, expectedOutputStr, true]
             );
             console.log(`  -> Inserted hidden test case. Output len: ${expectedOutputStr.length}`);
             totalAdded++;
          } else {
             console.log(`  -> Ref solution failed for this input: ${resObj.error}`);
          }
        } else {
          console.log(`  -> No results returned from sandbox. Result object: ${result.fatal || 'unknown error'}`);
        }
      } catch(err) {
         console.log(`  -> Sandbox threw error: ${err.message}`);
      }
    }
    processed++;
  }
  
  console.log(`\nFinished! Total new massive constraints test cases added: ${totalAdded}`);
  process.exit(0);
}

run().catch(console.error);
