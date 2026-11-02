/**
 * backend/scripts/upgrade_arrays_batch3_25tc.js
 *
 * Upgrades the remaining 5 Array problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with comprehensive edge cases and upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute-force solutions with TLE (> 2000ms).
 *
 * Problems:
 * 1. Product of Array Except Self (product-of-array-except-self) [LC 238]
 * 2. Spiral Matrix II (spiral-matrix-ii) [LC 59]
 * 3. Largest Number (largest-number) [LC 179]
 * 4. Pascal's Triangle II (pascal-s-triangle-ii) [LC 119]
 * 5. Maximum Gap (maximum-gap) [LC 164]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers
function solveProductExceptSelf(nums) {
  const n = nums.length;
  const ans = new Array(n);
  ans[0] = 1;
  for (let i = 1; i < n; i++) {
    ans[i] = ans[i - 1] * nums[i - 1];
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    ans[i] = ans[i] * right;
    right *= nums[i];
  }
  return ans;
}

function solveGenerateMatrix(n) {
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  let top = 0, bottom = n - 1, left = 0, right = n - 1;
  let num = 1;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) matrix[top][j] = num++;
    top++;
    for (let i = top; i <= bottom; i++) matrix[i][right] = num++;
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) matrix[bottom][j] = num++;
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) matrix[i][left] = num++;
      left++;
    }
  }
  return matrix;
}

function solveLargestNumber(nums) {
  const strs = nums.map(String);
  strs.sort((a, b) => (b + a).localeCompare(a + b));
  if (strs[0] === '0') return '0';
  return strs.join('');
}

function solveGetRow(rowIndex) {
  const row = [1];
  for (let i = 1; i <= rowIndex; i++) {
    row.push(1);
    for (let j = i - 1; j > 0; j--) {
      row[j] += row[j - 1];
    }
  }
  return row;
}

function solveMaximumGap(nums) {
  if (nums.length < 2) return 0;
  let min = Math.min(...nums);
  let max = Math.max(...nums);
  if (min === max) return 0;
  const n = nums.length;
  const bucketSize = Math.max(1, Math.floor((max - min) / (n - 1)));
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  const buckets = Array.from({ length: bucketCount }, () => ({ min: Infinity, max: -Infinity, used: false }));
  for (const num of nums) {
    const idx = Math.floor((num - min) / bucketSize);
    buckets[idx].used = true;
    buckets[idx].min = Math.min(buckets[idx].min, num);
    buckets[idx].max = Math.max(buckets[idx].max, num);
  }
  let maxGap = 0;
  let prevMax = min;
  for (const b of buckets) {
    if (!b.used) continue;
    maxGap = Math.max(maxGap, b.min - prevMax);
    prevMax = b.max;
  }
  return maxGap;
}

// -------------------------------------------------------------
// Generators for 25 Test Cases Each
// -------------------------------------------------------------

function generateProductExceptSelfTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    [1, 2, 3, 4],
    [-1, 1, 0, -3, 3],
    [2, 3],
    [0, 0],
    [1, 0],

    // 6-10: Zeros and negatives
    [0, 1, 2, 3],
    [-1, -2, -3, -4],
    [-1, 2, -3, 4],
    [1, 1, 1, 1],
    [5, 4, 3, 2, 1],

    // 11-15: Varied values
    [10, 0, 0, 5],
    [3, 5, 2, 6, 1],
    [2, 2, 2, 2, 2],
    [1, -1, 1, -1],
    [4, 5, 1, 8, 2],

    // 16-20: Medium scale
    Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 1 : 2)),
    Array.from({ length: 100 }, () => 1),
    Array.from({ length: 200 }, (_, i) => (i === 100 ? 0 : 1)),
    Array.from({ length: 500 }, (_, i) => (i % 2 === 0 ? 1 : -1)),
    Array.from({ length: 1000 }, () => 1),

    // 21-24: Upper scale
    Array.from({ length: 5000 }, () => 1),
    Array.from({ length: 10000 }, (_, i) => (i % 2 === 0 ? 1 : -1)),
    Array.from({ length: 20000 }, () => 1),
    Array.from({ length: 40000 }, (_, i) => (i === 0 ? 0 : 1)),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2)
    Array.from({ length: 75000 }, () => 1)
  ];

  return tcs.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveProductExceptSelf(arr)),
    is_hidden: idx >= 3
  }));
}

function generateSpiralMatrixIITestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    1, 2, 3, 4, 5,

    // 6-10: Small to mid values
    6, 7, 8, 9, 10,

    // 11-15: Even and odd sizes
    11, 12, 13, 14, 15,

    // 16-20: Larger sizes
    16, 17, 18, 19, 20,

    // 21-24: Upper scale
    25, 30, 40, 50,

    // 25: Maximum constraint (n = 100 -> 10,000 matrix cells)
    100
  ];

  return tcs.map((n, idx) => ({
    input: String(n),
    output: JSON.stringify(solveGenerateMatrix(n)),
    is_hidden: idx >= 3
  }));
}

function generateLargestNumberTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    [10, 2],
    [3, 30, 34, 5, 9],
    [1],
    [10],
    [0, 0],

    // 6-10: Common prefix complications
    [0, 0, 0],
    [8308, 8308],
    [111311, 1113],
    [12, 121],
    [12, 128],

    // 11-15: Multi-digit permutations
    [432, 43243],
    [9, 91, 98, 99],
    [100, 10, 1],
    [70, 7, 700],
    [5, 55, 56, 54],

    // 16-20: Medium scale
    Array.from({ length: 50 }, (_, i) => i + 1),
    Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 9 : 30)),
    Array.from({ length: 200 }, () => 0),
    Array.from({ length: 500 }, (_, i) => ((i * 31) % 1000)),
    Array.from({ length: 1000 }, (_, i) => i * 3),

    // 21-24: Upper scale
    Array.from({ length: 3000 }, (_, i) => ((i * 17) % 500)),
    Array.from({ length: 5000 }, (_, i) => i % 100),
    Array.from({ length: 10000 }, (_, i) => ((i * 7) % 1000)),
    Array.from({ length: 20000 }, (_, i) => (i % 2 === 0 ? 99 : 9)),

    // 25: Massive stress test (N = 35,000) strictly designed to kill O(N^2) bubble sort
    Array.from({ length: 35000 }, (_, i) => (i % 1000))
  ];

  return tcs.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: solveLargestNumber(arr),
    is_hidden: idx >= 3
  }));
}

function generatePascalTriangleIITestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    3, 0, 1, 2, 4,

    // 6-10: Rows 5 to 9
    5, 6, 7, 8, 9,

    // 11-15: Rows 10 to 14
    10, 11, 12, 13, 14,

    // 16-20: Rows 15 to 19
    15, 16, 17, 18, 19,

    // 21-24: Rows 20 to 29
    20, 22, 25, 28,

    // 25: Maximum constraint (rowIndex = 33)
    33
  ];

  return tcs.map((n, idx) => ({
    input: String(n),
    output: JSON.stringify(solveGetRow(n)),
    is_hidden: idx >= 3
  }));
}

function generateMaximumGapTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    [3, 6, 9, 1],
    [10],
    [1, 10000000],
    [1, 3, 100],
    [1, 1, 1, 1],

    // 6-10: Uniform and small differences
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [10, 20, 30, 40],
    [2, 999999999],
    [1, 10, 100, 1000],

    // 11-15: Alternating clusters
    [1, 2, 100, 101, 1000],
    [5, 9, 1, 2, 8, 3, 7, 4, 6],
    [100, 3, 2, 1],
    [152507235, 521521211, 75, 23],
    [4, 8, 15, 16, 23, 42],

    // 16-20: Medium scale
    Array.from({ length: 50 }, (_, i) => i * 5),
    Array.from({ length: 100 }, (_, i) => ((i * 37) % 500) + 1),
    Array.from({ length: 200 }, () => 42),
    Array.from({ length: 500 }, (_, i) => (i === 250 ? 1000000 : i)),
    Array.from({ length: 1000 }, (_, i) => 1000 - i),

    // 21-24: Upper scale
    Array.from({ length: 5000 }, (_, i) => i * 2),
    Array.from({ length: 10000 }, (_, i) => (i % 2 === 0 ? 1 : 100000)),
    Array.from({ length: 20000 }, (_, i) => ((i * 17) % 50000) + 1),
    Array.from({ length: 40000 }, (_, i) => (i === 0 ? 100000000 : i)),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2) comparison
    Array.from({ length: 75000 }, (_, i) => 75000 - i)
  ];

  return tcs.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: String(solveMaximumGap(arr)),
    is_hidden: idx >= 3
  }));
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const ARRAY_PROBLEMS = [
  {
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'medium',
    description: `Given an integer array \`nums\`, return *an array* \`answer\` *such that* \`answer[i]\` *is equal to the product of all the elements of* \`nums\` *except* \`nums[i]\`.

The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in \`O(N)\` time and **without using the division operator**.

### Example 1:
\`\`\`
Input: nums = [1,2,3,4]
Output: [24,12,8,6]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]
\`\`\`

### Constraints:
- \`2 <= nums.length <= 10^5\`
- \`-30 <= nums[i] <= 30\`
- The product of any prefix or suffix of \`nums\` is guaranteed to fit in a 32-bit integer.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\` (excluding the output array)`,
    sample_input: '[1,2,3,4]',
    sample_output: '[24,12,8,6]',
    generator: generateProductExceptSelfTestCases,
    optimalCode: `
function solution(nums) {
  const n = nums.length;
  const ans = new Array(n);
  ans[0] = 1;
  for (let i = 1; i < n; i++) {
    ans[i] = ans[i - 1] * nums[i - 1];
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    ans[i] = ans[i] * right;
    right *= nums[i];
  }
  return ans;
}`,
    bruteCode: `
function solution(nums) {
  const n = nums.length;
  const ans = new Array(n);
  for (let i = 0; i < n; i++) {
    let prod = 1;
    for (let j = 0; j < n; j++) {
      if (i !== j) prod *= nums[j];
    }
    ans[i] = prod;
  }
  return ans;
}`
  },
  {
    slug: 'spiral-matrix-ii',
    title: 'Spiral Matrix II',
    difficulty: 'medium',
    description: `Given a positive integer \`n\`, generate an \`n x n\` matrix filled with elements from \`1\` to \`n^2\` in **spiral order**.

### Example 1:
\`\`\`
Input: n = 3
Output: [[1,2,3],[8,9,4],[7,6,5]]
\`\`\`

### Example 2:
\`\`\`
Input: n = 1
Output: [[1]]
\`\`\`

### Constraints:
- \`1 <= n <= 100\`
- **Expected Time Complexity:** \`O(n^2)\`
- **Expected Auxiliary Space:** \`O(1)\` (excluding the output matrix)`,
    sample_input: '3',
    sample_output: '[[1,2,3],[8,9,4],[7,6,5]]',
    generator: generateSpiralMatrixIITestCases,
    optimalCode: `
function solution(n) {
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  let top = 0, bottom = n - 1, left = 0, right = n - 1;
  let num = 1;
  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) matrix[top][j] = num++;
    top++;
    for (let i = top; i <= bottom; i++) matrix[i][right] = num++;
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) matrix[bottom][j] = num++;
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) matrix[i][left] = num++;
      left++;
    }
  }
  return matrix;
}`
  },
  {
    slug: 'largest-number',
    title: 'Largest Number',
    difficulty: 'medium',
    description: `Given a list of non-negative integers \`nums\`, arrange them such that they form the **largest number** and return it.

Since the result may be very large, you need to return a string instead of an integer.

### Example 1:
\`\`\`
Input: nums = [10,2]
Output: "210"
\`\`\`

### Example 2:
\`\`\`
Input: nums = [3,30,34,5,9]
Output: "9534330"
\`\`\`

### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`0 <= nums[i] <= 10^9\`
- **Expected Time Complexity:** \`O(N log N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '[10,2]',
    sample_output: '"210"',
    generator: generateLargestNumberTestCases,
    optimalCode: `
function solution(nums) {
  const strs = nums.map(String);
  strs.sort((a, b) => (b + a).localeCompare(a + b));
  if (strs[0] === '0') return '0';
  return strs.join('');
}`,
    bruteCode: `
function solution(nums) {
  const strs = nums.map(String);
  // O(N^2) bubble sort
  for (let i = 0; i < strs.length; i++) {
    for (let j = 0; j < strs.length - 1; j++) {
      if ((strs[j] + strs[j + 1]).localeCompare(strs[j + 1] + strs[j]) < 0) {
        const tmp = strs[j];
        strs[j] = strs[j + 1];
        strs[j + 1] = tmp;
      }
    }
  }
  if (strs[0] === '0') return '0';
  return strs.join('');
}`
  },
  {
    slug: 'pascal-s-triangle-ii',
    title: "Pascal's Triangle II",
    difficulty: 'easy',
    description: `Given an integer \`rowIndex\`, return the \`rowIndex\`-th (**0-indexed**) row of the **Pascal's triangle**.

In **Pascal's triangle**, each number is the sum of the two numbers directly above it.

### Example 1:
\`\`\`
Input: rowIndex = 3
Output: [1,3,3,1]
\`\`\`

### Example 2:
\`\`\`
Input: rowIndex = 0
Output: [1]
\`\`\`

### Example 3:
\`\`\`
Input: rowIndex = 1
Output: [1,1]
\`\`\`

### Constraints:
- \`0 <= rowIndex <= 33\`
- **Expected Time Complexity:** \`O(rowIndex^2)\`
- **Expected Auxiliary Space:** \`O(rowIndex)\``,
    sample_input: '3',
    sample_output: '[1,3,3,1]',
    generator: generatePascalTriangleIITestCases,
    optimalCode: `
function solution(rowIndex) {
  const row = [1];
  for (let i = 1; i <= rowIndex; i++) {
    row.push(1);
    for (let j = i - 1; j > 0; j--) {
      row[j] += row[j - 1];
    }
  }
  return row;
}`
  },
  {
    slug: 'maximum-gap',
    title: 'Maximum Gap',
    difficulty: 'medium',
    description: `Given an integer array \`nums\`, return *the maximum difference between two successive elements in its sorted form*. If the array contains less than two elements, return \`0\`.

You must write an algorithm that runs in **linear time** and uses **linear extra space**.

### Example 1:
\`\`\`
Input: nums = [3,6,9,1]
Output: 3
Explanation: The sorted form of the array is [1,3,6,9], either (3,6) or (6,9) has the maximum difference 3.
\`\`\`

### Example 2:
\`\`\`
Input: nums = [10]
Output: 0
Explanation: The array contains less than 2 elements, therefore return 0.
\`\`\`

### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`0 <= nums[i] <= 10^9\`
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '[3,6,9,1]',
    sample_output: '3',
    generator: generateMaximumGapTestCases,
    optimalCode: `
function solution(nums) {
  if (nums.length < 2) return 0;
  let min = Math.min(...nums);
  let max = Math.max(...nums);
  if (min === max) return 0;
  const n = nums.length;
  const bucketSize = Math.max(1, Math.floor((max - min) / (n - 1)));
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  const buckets = Array.from({ length: bucketCount }, () => ({ min: Infinity, max: -Infinity, used: false }));
  for (const num of nums) {
    const idx = Math.floor((num - min) / bucketSize);
    buckets[idx].used = true;
    buckets[idx].min = Math.min(buckets[idx].min, num);
    buckets[idx].max = Math.max(buckets[idx].max, num);
  }
  let maxGap = 0;
  let prevMax = min;
  for (const b of buckets) {
    if (!b.used) continue;
    maxGap = Math.max(maxGap, b.min - prevMax);
    prevMax = b.max;
  }
  return maxGap;
}`,
    bruteCode: `
function solution(nums) {
  const arr = [...nums];
  // O(N^2) bubble sort
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
  let maxGap = 0;
  for (let i = 1; i < arr.length; i++) {
    maxGap = Math.max(maxGap, arr[i] - arr[i - 1]);
  }
  return maxGap;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Arrays Batch 3 (5 Problems) ===\n');

  for (const prob of ARRAY_PROBLEMS) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await db.query('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`Problem ${prob.slug} NOT FOUND in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update Problem metadata & description
    await db.query(
      `UPDATE problems 
       SET title = $1, difficulty = $2, description = $3, sample_input = $4, sample_output = $5
       WHERE id = $6`,
      [prob.title, prob.difficulty, prob.description, prob.sample_input, prob.sample_output, problemId]
    );
    console.log(`✓ Metadata & LeetCode description updated.`);

    // 3. Delete existing test cases and insert 25 curated test cases
    const testCases = prob.generator();
    if (testCases.length !== 25) {
      throw new Error(`Expected 25 test cases for ${prob.slug}, got ${testCases.length}`);
    }

    await db.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      await db.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }
    console.log(`✓ Seeded exactly 25 test cases (TC 25 length: ${testCases[24].input.length} chars).`);

    // 4. Validate Optimal Solution with Judge
    const optimalResult = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(
      `✓ Optimal Solution: verdict = ${optimalResult.verdict} (${optimalResult.passedTests}/${optimalResult.totalTests} in ${optimalResult.runtimeMs}ms)`
    );
    if (optimalResult.verdict !== 'ACCEPTED' || optimalResult.passedTests !== 25) {
      console.error('OPTIMAL SOLUTION FAILED!', optimalResult);
      process.exit(1);
    }

    // 5. Test Brute Force / Sub-optimal Solution
    if (prob.bruteCode) {
      const bruteResult = await evaluateSubmission(problemId, prob.bruteCode, 'javascript');
      console.log(
        `✓ Brute Force: verdict = ${bruteResult.verdict} (${bruteResult.passedTests}/${bruteResult.totalTests} in ${bruteResult.runtimeMs}ms)`
      );
      if (bruteResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
        console.warn(`WARNING: Brute force did not get TIME_LIMIT_EXCEEDED! Verdict: ${bruteResult.verdict}`);
      } else {
        console.log(`✓ Confirmed: Brute force triggers TIME_LIMIT_EXCEEDED (> 2000ms limit).`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('✓ All 5 Array problems successfully upgraded and verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

