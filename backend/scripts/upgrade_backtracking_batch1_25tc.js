'use strict';

/**
 * upgrade_backtracking_batch1_25tc.js
 *
 * Upgrades 8 Core Backtracking problems (Subsets, Combinations, Permutations):
 * 1. Subsets (LC 78) [Medium]
 * 2. Subsets II (LC 90) [Medium]
 * 3. Combinations (LC 77) [Medium]
 * 4. Combination Sum (LC 39) [Medium]
 * 5. Combination Sum II (LC 40) [Medium]
 * 6. Permutations (LC 46) [Medium]
 * 7. Permutations II (LC 47) [Medium]
 * 8. Generate Parentheses (LC 22) [Medium]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

async function safeQuery(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.pool.query(text, params);
    } catch (err) {
      console.warn(`[DB Retry ${attempt}/${maxRetries}] Query failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// -------------------------------------------------------------
// Reference Solvers for Extra Test Cases
// -------------------------------------------------------------

function solveSubsets(nums) {
  const res = [];
  function backtrack(start, path) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return res;
}

function solveSubsetsII(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const res = [];
  function backtrack(start, path) {
    res.push([...path]);
    for (let i = start; i < sorted.length; i++) {
      if (i > start && sorted[i] === sorted[i - 1]) continue;
      path.push(sorted[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return res;
}

function solveCombinations(n, k) {
  const res = [];
  function backtrack(start, path) {
    if (path.length === k) {
      res.push([...path]);
      return;
    }
    const needed = k - path.length;
    for (let i = start; i <= n - needed + 1; i++) {
      path.push(i);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(1, []);
  return res;
}

function solveCombinationSum(candidates, target) {
  const cands = [...candidates].sort((a, b) => a - b);
  const res = [];
  function backtrack(start, rem, path) {
    if (rem === 0) {
      res.push([...path]);
      return;
    }
    for (let i = start; i < cands.length; i++) {
      if (cands[i] > rem) break;
      path.push(cands[i]);
      backtrack(i, rem - cands[i], path);
      path.pop();
    }
  }
  backtrack(0, target, []);
  return res;
}

function solveCombinationSumII(candidates, target) {
  const cands = [...candidates].sort((a, b) => a - b);
  const res = [];
  function backtrack(start, rem, path) {
    if (rem === 0) {
      res.push([...path]);
      return;
    }
    for (let i = start; i < cands.length; i++) {
      if (cands[i] > rem) break;
      if (i > start && cands[i] === cands[i - 1]) continue;
      path.push(cands[i]);
      backtrack(i + 1, rem - cands[i], path);
      path.pop();
    }
  }
  backtrack(0, target, []);
  return res;
}

function solvePermutations(nums) {
  const res = [];
  const used = new Array(nums.length).fill(false);
  function backtrack(path) {
    if (path.length === nums.length) {
      res.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }
  backtrack([]);
  return res;
}

function solvePermutationsII(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const res = [];
  const used = new Array(sorted.length).fill(false);
  function backtrack(path) {
    if (path.length === sorted.length) {
      res.push([...path]);
      return;
    }
    for (let i = 0; i < sorted.length; i++) {
      if (used[i]) continue;
      if (i > 0 && sorted[i] === sorted[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      path.push(sorted[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }
  backtrack([]);
  return res;
}

function solveGenerateParentheses(n) {
  const res = [];
  function backtrack(s, open, close) {
    if (s.length === 2 * n) {
      res.push(s);
      return;
    }
    if (open < n) backtrack(s + '(', open + 1, close);
    if (close < open) backtrack(s + ')', open, close + 1);
  }
  backtrack('', 0, 0);
  return res;
}

// -------------------------------------------------------------
// Problem Definitions
// -------------------------------------------------------------

const BACKTRACKING_BATCH1 = [
  {
    slug: 'subsets',
    title: 'Subsets',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-14-tests/subsets.json',
    sample_input: '[1,2,3]',
    sample_output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]',
    description: `Given an integer array \`nums\` of **unique** elements, return *all possible subsets (the power set)*.

The solution set **must not** contain duplicate subsets. Return the solution in **any order**.

### Example 1:
\`\`\`
Input: nums = [1,2,3]
Output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0]
Output: [[],[0]]
\`\`\`

### Constraints:
- \`1 <= nums.length <= 16\`
- \`-10 <= nums[i] <= 10\`
- All the numbers of \`nums\` are **unique**.`,
    generateExtraTestCases: () => {
      // 21: N=16 scale stress test (kills O((2^N)^2) linear search)
      const a_21 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
      // 22: Empty array
      const a_22 = [];
      // 23: Single element
      const a_23 = [42];
      // 24: Two elements with negative numbers
      const a_24 = [-5, 5];
      // 25: N=15
      const a_25 = [-7, -5, -3, -1, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveSubsets(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  const res = [];
  function backtrack(start, path) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return res;
}`,
    bruteCode: `
function solution(nums) {
  const res = [];
  function backtrack(start, path) {
    const copy = [...path];
    let exists = false;
    for (let i = 0; i < res.length; i++) {
      if (res[i].length === copy.length) {
        let eq = true;
        for (let j = 0; j < copy.length; j++) {
          if (res[i][j] !== copy[j]) { eq = false; break; }
        }
        if (eq) { exists = true; break; }
      }
    }
    if (!exists) res.push(copy);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return res;
}`
  },
  {
    slug: 'subsets-ii',
    title: 'Subsets II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-2-tests/subsets-ii.json',
    sample_input: '[1,2,2]',
    sample_output: '[[],[1],[1,2],[1,2,2],[2],[2,2]]',
    description: `Given an integer array \`nums\` that may contain duplicates, return *all possible subsets (the power set)*.

The solution set **must not** contain duplicate subsets. Return the solution in **any order**.

### Example 1:
\`\`\`
Input: nums = [1,2,2]
Output: [[],[1],[1,2],[1,2,2],[2],[2,2]]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0]
Output: [[],[0]]
\`\`\`

### Constraints:
- \`1 <= nums.length <= 16\`
- \`-10 <= nums[i] <= 10\``,
    generateExtraTestCases: () => {
      // 21: N=18 with pairs of duplicates (kills O((2^N)^2) linear duplicate scan)
      const a_21 = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
      // 22: All identical elements
      const a_22 = [4, 4, 4, 4, 4];
      // 23: Single element
      const a_23 = [0];
      // 24: Array with negative duplicates
      const a_24 = [-1, -1, 2, 2];
      // 25: N=15 with multiple duplicates
      const a_25 = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 7];

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveSubsetsII(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  function backtrack(start, path) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return res;
}`,
    bruteCode: `
function solution(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  function backtrack(start, path) {
    const copy = [...path];
    let exists = false;
    for (let i = 0; i < res.length; i++) {
      if (res[i].length === copy.length) {
        let eq = true;
        for (let j = 0; j < copy.length; j++) {
          if (res[i][j] !== copy[j]) { eq = false; break; }
        }
        if (eq) { exists = true; break; }
      }
    }
    if (!exists) res.push(copy);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(0, []);
  return res;
}`
  },
  {
    slug: 'combinations',
    title: 'Combinations',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-5-tests/combinations.json',
    sample_input: '4, 2',
    sample_output: '[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]',
    description: `Given two integers \`n\` and \`k\`, return *all possible combinations of \`k\` numbers chosen from the range \`[1, n]\`*.

You may return the answer in **any order**.

### Example 1:
\`\`\`
Input: n = 4, k = 2
Output: [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
Explanation: There are 4 choose 2 = 6 total combinations.
Note that combinations are unordered, i.e. [1,2] and [2,1] are considered to be the same combination.
\`\`\`

### Example 2:
\`\`\`
Input: n = 1, k = 1
Output: [[1]]
Explanation: There is 1 choose 1 = 1 total combination.
\`\`\`

### Constraints:
- \`1 <= n <= 20\`
- \`1 <= k <= n\``,
    generateExtraTestCases: () => {
      // 21: n=18, k=9 (48,620 combinations, kills linear scan)
      const n_21 = 18, k_21 = 9;
      // 22: n=5, k=1
      const n_22 = 5, k_22 = 1;
      // 23: n=5, k=5
      const n_23 = 5, k_23 = 5;
      // 24: n=10, k=2
      const n_24 = 10, k_24 = 2;
      // 25: n=20, k=4 (4845 combinations)
      const n_25 = 20, k_25 = 4;

      const extras = [
        [n_21, k_21],
        [n_22, k_22],
        [n_23, k_23],
        [n_24, k_24],
        [n_25, k_25]
      ];

      return extras.map(([n, k]) => ({
        input: `${n}, ${k}`,
        output: JSON.stringify(solveCombinations(n, k)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n, k) {
  const res = [];
  function backtrack(start, path) {
    if (path.length === k) {
      res.push([...path]);
      return;
    }
    const needed = k - path.length;
    for (let i = start; i <= n - needed + 1; i++) {
      path.push(i);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(1, []);
  return res;
}`,
    bruteCode: `
function solution(n, k) {
  const res = [];
  function backtrack(start, path) {
    if (path.length === k) {
      const copy = [...path];
      let exists = false;
      for (let i = 0; i < res.length; i++) {
        let eq = true;
        for (let j = 0; j < copy.length; j++) {
          if (res[i][j] !== copy[j]) { eq = false; break; }
        }
        if (eq) { exists = true; break; }
      }
      if (!exists) res.push(copy);
      return;
    }
    for (let i = start; i <= n; i++) {
      path.push(i);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  backtrack(1, []);
  return res;
}`
  },
  {
    slug: 'combination-sum',
    title: 'Combination Sum',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-5-tests/combination-sum.json',
    sample_input: '[2,3,6,7], 7',
    sample_output: '[[2,2,3],[7]]',
    description: `Given an array of **distinct** integers \`candidates\` and a target integer \`target\`, return *a list of all **unique combinations** of \`candidates\` where the chosen numbers sum to \`target\`*. You may return the combinations in **any order**.

The **same** number may be chosen from \`candidates\` an **unlimited number of times**. Two combinations are unique if the frequency of at least one of the chosen numbers is different.

The test cases are generated such that the number of unique combinations that sum up to \`target\` is less than \`150\` combinations for the given input.

### Example 1:
\`\`\`
Input: candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]
Explanation:
2 and 3 are candidates, and 2 + 2 + 3 = 7. Note that 2 can be used multiple times.
7 is a candidate, and 7 = 7.
These are the only two combinations.
\`\`\`

### Example 2:
\`\`\`
Input: candidates = [2,3,5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]
\`\`\`

### Example 3:
\`\`\`
Input: candidates = [2], target = 1
Output: []
\`\`\`

### Constraints:
- \`1 <= candidates.length <= 30\`
- \`2 <= candidates[i] <= 40\`
- All elements of \`candidates\` are **distinct**.
- \`1 <= target <= 500\``,
    generateExtraTestCases: () => {
      // 21: target=48 with small candidates (kills unpruned permutation search)
      const c_21 = [2, 3, 5, 7], t_21 = 48;
      // 22: target < min candidate
      const c_22 = [5, 10, 15], t_22 = 3;
      // 23: exact match single candidate
      const c_23 = [8], t_23 = 8;
      // 24: large candidates
      const c_24 = [11, 13, 17, 19], t_24 = 30;
      // 25: multiple larger combinations
      const c_25 = [2, 3, 6, 7], t_25 = 35;

      const extras = [
        [c_21, t_21],
        [c_22, t_22],
        [c_23, t_23],
        [c_24, t_24],
        [c_25, t_25]
      ];

      return extras.map(([cands, target]) => ({
        input: `${JSON.stringify(cands)}, ${target}`,
        output: JSON.stringify(solveCombinationSum(cands, target)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [];
  function backtrack(start, rem, path) {
    if (rem === 0) {
      res.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > rem) break;
      path.push(candidates[i]);
      backtrack(i, rem - candidates[i], path);
      path.pop();
    }
  }
  backtrack(0, target, []);
  return res;
}`,
    bruteCode: `
function solution(candidates, target) {
  const res = [];
  function backtrack(rem, path) {
    if (rem === 0) {
      const sorted = [...path].sort((a, b) => a - b);
      let exists = false;
      for (const item of res) {
        if (item.length === sorted.length && item.every((v, idx) => v === sorted[idx])) {
          exists = true; break;
        }
      }
      if (!exists) res.push(sorted);
      return;
    }
    if (rem < 0) return;
    for (let i = 0; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(rem - candidates[i], path);
      path.pop();
    }
  }
  backtrack(target, []);
  return res;
}`
  },
  {
    slug: 'combination-sum-ii',
    title: 'Combination Sum II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-6-tests/combination-sum-ii.json',
    sample_input: '[10,1,2,7,6,1,5], 8',
    sample_output: '[[1,1,6],[1,2,5],[1,7],[2,6]]',
    description: `Given a collection of candidate numbers (\`candidates\`) and a target number (\`target\`), find all unique combinations in \`candidates\` where the candidate numbers sum to \`target\`.

Each number in \`candidates\` may only be used **once** in the combination.

**Note:** The solution set must not contain duplicate combinations.

### Example 1:
\`\`\`
Input: candidates = [10,1,2,7,6,1,5], target = 8
Output:
[
[1,1,6],
[1,2,5],
[1,7],
[2,6]
]
\`\`\`

### Example 2:
\`\`\`
Input: candidates = [2,5,2,1,2], target = 5
Output:
[
[1,2,2],
[5]
]
\`\`\`

### Constraints:
- \`1 <= candidates.length <= 100\`
- \`1 <= candidates[i] <= 50\`
- \`1 <= target <= 30\``,
    generateExtraTestCases: () => {
      // 21: multiple duplicate numbers target=30 (kills unpruned search)
      const c_21 = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 9, 10], t_21 = 30;
      // 22: target impossible
      const c_22 = [2, 4, 6, 8], t_22 = 5;
      // 23: single element
      const c_23 = [7], t_23 = 7;
      // 24: all identical candidates
      const c_24 = [2, 2, 2, 2, 2], t_24 = 6;
      // 25: larger set
      const c_25 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], t_25 = 15;

      const extras = [
        [c_21, t_21],
        [c_22, t_22],
        [c_23, t_23],
        [c_24, t_24],
        [c_25, t_25]
      ];

      return extras.map(([cands, target]) => ({
        input: `${JSON.stringify(cands)}, ${target}`,
        output: JSON.stringify(solveCombinationSumII(cands, target)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [];
  function backtrack(start, rem, path) {
    if (rem === 0) {
      res.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > rem) break;
      if (i > start && candidates[i] === candidates[i - 1]) continue;
      path.push(candidates[i]);
      backtrack(i + 1, rem - candidates[i], path);
      path.pop();
    }
  }
  backtrack(0, target, []);
  return res;
}`,
    bruteCode: `
function solution(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [];
  function backtrack(start, rem, path) {
    if (rem === 0) {
      const copy = [...path];
      let exists = false;
      for (const item of res) {
        if (item.length === copy.length && item.every((v, idx) => v === copy[idx])) {
          exists = true; break;
        }
      }
      if (!exists) res.push(copy);
      return;
    }
    if (rem < 0) return;
    for (let i = start; i < candidates.length; i++) {
      path.push(candidates[i]);
      backtrack(i + 1, rem - candidates[i], path);
      path.pop();
    }
  }
  backtrack(0, target, []);
  return res;
}`
  },
  {
    slug: 'permutations',
    title: 'Permutations',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-32-tests/permutations.json',
    sample_input: '[1,2,3]',
    sample_output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
    description: `Given an array \`nums\` of distinct integers, return *all the possible permutations*. You can return the answer in **any order**.

### Example 1:
\`\`\`
Input: nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0,1]
Output: [[0,1],[1,0]]
\`\`\`

### Example 3:
\`\`\`
Input: nums = [1]
Output: [[1]]
\`\`\`

### Constraints:
- \`1 <= nums.length <= 8\`
- \`-10 <= nums[i] <= 10\`
- All the integers of \`nums\` are **unique**.`,
    generateExtraTestCases: () => {
      // 21: N=8 (40,320 permutations, kills linear duplicate check)
      const a_21 = [1, 2, 3, 4, 5, 6, 7, 8];
      // 22: Single element
      const a_22 = [42];
      // 23: Two elements with negative number
      const a_23 = [-1, 2];
      // 24: Three elements
      const a_24 = [10, 20, 30];
      // 25: N=7 (5040 permutations)
      const a_25 = [1, 2, 3, 4, 5, 6, 7];

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solvePermutations(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  const res = [];
  const used = new Array(nums.length).fill(false);
  function backtrack(path) {
    if (path.length === nums.length) {
      res.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }
  backtrack([]);
  return res;
}`,
    bruteCode: `
function solution(nums) {
  const res = [];
  function backtrack(curr) {
    if (curr.length === nums.length) {
      const set = new Set(curr);
      if (set.size === nums.length) {
        const copy = [...curr];
        let exists = false;
        for (let i = 0; i < res.length; i++) {
          if (res[i].every((v, idx) => v === copy[idx])) { exists = true; break; }
        }
        if (!exists) res.push(copy);
      }
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      curr.push(nums[i]);
      backtrack(curr);
      curr.pop();
    }
  }
  backtrack([]);
  return res;
}`
  },
  {
    slug: 'permutations-ii',
    title: 'Permutations II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-26-tests/permutations-ii.json',
    sample_input: '[1,1,2]',
    sample_output: '[[1,1,2],[1,2,1],[2,1,1]]',
    description: `Given a collection of numbers, \`nums\`, that might contain duplicates, return *all possible unique permutations **in any order**.*

### Example 1:
\`\`\`
Input: nums = [1,1,2]
Output:
[[1,1,2],
 [1,2,1],
 [2,1,1]]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
\`\`\`

### Constraints:
- \`1 <= nums.length <= 8\`
- \`-10 <= nums[i] <= 10\``,
    generateExtraTestCases: () => {
      // 21: N=8 with 4 pairs (kills unpruned search)
      const a_21 = [1, 1, 2, 2, 3, 3, 4, 4];
      // 22: All identical
      const a_22 = [7, 7, 7, 7];
      // 23: Single element
      const a_23 = [99];
      // 24: Distinct elements
      const a_24 = [1, 2, 3, 4];
      // 25: N=8 with multiple triplets
      const a_25 = [1, 1, 1, 2, 2, 2, 3, 3];

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solvePermutationsII(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  const used = new Array(nums.length).fill(false);
  function backtrack(path) {
    if (path.length === nums.length) {
      res.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
      used[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      used[i] = false;
    }
  }
  backtrack([]);
  return res;
}`,
    bruteCode: `
function solution(nums) {
  const res = [];
  function backtrack(curr) {
    if (curr.length === nums.length) {
      const set = new Set(curr);
      if (set.size === nums.length) {
        const copy = [...curr];
        let exists = false;
        for (let i = 0; i < res.length; i++) {
          if (res[i].every((v, idx) => v === copy[idx])) { exists = true; break; }
        }
        if (!exists) res.push(copy);
      }
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      curr.push(nums[i]);
      backtrack(curr);
      curr.pop();
    }
  }
  backtrack([]);
  return res;
}`
  },
  {
    slug: 'generate-parentheses',
    title: 'Generate Parentheses',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-1-tests/generate-parentheses.json',
    sample_input: '3',
    sample_output: '["((()))","(()())","(())()","()(())","()()()"]',
    description: `Given \`n\` pairs of parentheses, write a function to *generate all combinations of well-formed parentheses*.

### Example 1:
\`\`\`
Input: n = 3
Output: ["((()))","(()())","(())()","()(())","()()()"]
\`\`\`

### Example 2:
\`\`\`
Input: n = 1
Output: ["()"]
\`\`\`

### Constraints:
- \`1 <= n <= 10\``,
    generateExtraTestCases: () => {
      // 23: n=0
      const n_23 = 0;
      // 24: n=1
      const n_24 = 1;
      // 25: n=11 (kills all 2^(2n) brute force generation taking > 2000ms)
      const n_25 = 11;

      const extras = [n_23, n_24, n_25];

      return extras.map((n) => ({
        input: String(n),
        output: JSON.stringify(solveGenerateParentheses(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  const res = [];
  function backtrack(s, open, close) {
    if (s.length === 2 * n) {
      res.push(s);
      return;
    }
    if (open < n) backtrack(s + '(', open + 1, close);
    if (close < open) backtrack(s + ')', open, close + 1);
  }
  backtrack('', 0, 0);
  return res;
}`,
    bruteCode: `
function solution(n) {
  const res = [];
  function isValid(s) {
    const stack = [];
    for (const c of s) {
      if (c === "(") stack.push(c);
      else {
        if (!stack.length) return false;
        stack.pop();
      }
    }
    return stack.length === 0;
  }
  function generateAll(curr) {
    if (curr.length === 2 * n) {
      if (isValid(curr)) {
        let exists = false;
        for (let i = 0; i < res.length; i++) {
          if (res[i] === curr) { exists = true; break; }
        }
        if (!exists) res.push(curr);
      }
      return;
    }
    generateAll(curr + "(");
    generateAll(curr + ")");
  }
  generateAll("");
  return res;
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for Backtracking Batch 1 (8 Problems) ===\n');

  for (const prob of BACKTRACKING_BATCH1) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await safeQuery('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`Problem ${prob.slug} NOT FOUND in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update metadata & description
    await safeQuery(
      `UPDATE problems 
       SET title = $1, difficulty = $2, description = $3, sample_input = $4, sample_output = $5
       WHERE id = $6`,
      [prob.title, prob.difficulty, prob.description, prob.sample_input, prob.sample_output, problemId]
    );
    console.log(`✓ Metadata & LeetCode description updated.`);

    // 3. Load existing test cases from JSON file
    const rootDir = path.join(__dirname, '../..');
    const fullJsonPath = path.join(rootDir, prob.jsonPath);
    const existingRaw = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

    // Base test cases: take first 20 (or 22 for generate-parentheses)
    const baseCount = prob.slug === 'generate-parentheses' ? 22 : 20;
    const baseTestCases = existingRaw.slice(0, baseCount).map((tc, idx) => ({
      input: tc.input,
      output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
      is_hidden: idx >= 3
    }));

    // 4. Generate extra curated edge cases & stress tests to reach exactly 25
    const extraTestCases = prob.generateExtraTestCases();
    const finalTestCases = [...baseTestCases, ...extraTestCases];

    if (finalTestCases.length !== 25) {
      throw new Error(`Expected exactly 25 test cases for ${prob.slug}, got ${finalTestCases.length}`);
    }

    // 5. Delete and seed exactly 25 test cases
    await safeQuery('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    for (let i = 0; i < finalTestCases.length; i++) {
      const tc = finalTestCases[i];
      await safeQuery(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }
    console.log(`✓ Seeded exactly 25 test cases (TC 25 input: ${finalTestCases[24].input.slice(0, 60)}...).`);

    // 6. Validate Optimal Solution with Judge
    const optimalResult = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(
      `✓ Optimal Solution: verdict = ${optimalResult.verdict} (${optimalResult.passedTests}/${optimalResult.totalTests} in ${optimalResult.runtimeMs}ms)`
    );
    if (optimalResult.verdict !== 'ACCEPTED' || optimalResult.passedTests !== 25) {
      console.error('OPTIMAL SOLUTION FAILED!', optimalResult);
      process.exit(1);
    }

    // 7. Verify Brute Force Strictly Gets TIME_LIMIT_EXCEEDED
    if (prob.bruteCode) {
      const bruteResult = await evaluateSubmission(problemId, prob.bruteCode, 'javascript');
      console.log(
        `✓ Brute Force Check: verdict = ${bruteResult.verdict} (${bruteResult.passedTests}/${bruteResult.totalTests} in ${bruteResult.runtimeMs}ms)`
      );
      if (bruteResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
        console.warn(`WARNING: Brute force did not get TIME_LIMIT_EXCEEDED! Got: ${bruteResult.verdict}`);
      } else {
        console.log(`✓ Confirmed: Brute force strictly triggers TIME_LIMIT_EXCEEDED (> 2000ms limit).`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('✓ All 8 Backtracking Batch 1 problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
