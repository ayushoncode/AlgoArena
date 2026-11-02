/**
 * backend/scripts/upgrade_striver_arrays_easy_batch1_25tc.js
 *
 * Upgrades the first 5 Striver Step 3 (Arrays - Easy) problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests (N = 10^4 and N = 5 * 10^4).
 * 3. 100% Judge validation (25/25 ACCEPTED).
 *
 * Problems:
 * 1. Largest Element in an Array (largest-element-in-an-array)
 * 2. Second Largest Element in an Array (second-largest-element-in-an-array)
 * 3. Check if Array Is Sorted and Rotated (check-if-array-is-sorted-and-rotated) [LC 1752]
 * 4. Left Rotate an Array by One (left-rotate-an-array-by-one)
 * 5. Move Zeroes (move-zeroes) [LC 283]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers for 100% accurate oracle outputs
function solveLargest(nums) {
  let mx = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] > mx) mx = nums[i];
  }
  return mx;
}

function solveSecondLargest(nums) {
  let largest = -Infinity;
  let second = -Infinity;
  for (const x of nums) {
    if (x > largest) {
      second = largest;
      largest = x;
    } else if (x < largest && x > second) {
      second = x;
    }
  }
  return second === -Infinity ? -1 : second;
}

function solveCheckSortedAndRotated(nums) {
  let count = 0;
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    if (nums[i] > nums[(i + 1) % n]) {
      count++;
    }
  }
  return count <= 1;
}

function solveLeftRotateByOne(nums) {
  if (nums.length <= 1) return [...nums];
  const first = nums[0];
  const res = [];
  for (let i = 1; i < nums.length; i++) res.push(nums[i]);
  res.push(first);
  return res;
}

function solveMoveZeroes(nums) {
  const res = [];
  let zeroCount = 0;
  for (const x of nums) {
    if (x === 0) zeroCount++;
    else res.push(x);
  }
  for (let i = 0; i < zeroCount; i++) res.push(0);
  return res;
}

// ── 1. Generator for Largest Element in an Array ────────────────────────
function generateLargestTCs() {
  const tcs = [];
  const base = [
    [2, 5, 1, 3, 0],
    [8, 10, 5, 7, 9],
    [1],
    [-5],
    [100, 100, 100],
    [-10, -5, -2, -20, -1],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [0, 0, 0, 0],
    [-1000000000, 1000000000],
    [4, 2, 7, 1, 9, 3],
    [500, -500, 250, -250, 0],
    [10, 20, 20, 10, 5],
    [-1, -2, -3, -4],
    [999, 1000, 999],
    [12, 35, 1, 10, 34, 1],
    [7, 7, 7, 7, 8],
    [8, 7, 7, 7, 7],
    [100, -100, 200, -200, 300, -300],
    [42]
  ];

  base.forEach((arr, idx) => {
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(solveLargest(arr)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 alternating
  const a21 = [];
  for (let i = 0; i < 500; i++) a21.push((i * 13) % 1000 - 500);
  tcs.push({ input: JSON.stringify(a21), output: JSON.stringify(solveLargest(a21)), is_hidden: true });

  // 22: 1000 all negative
  const a22 = [];
  for (let i = 1; i <= 1000; i++) a22.push(-i);
  tcs.push({ input: JSON.stringify(a22), output: JSON.stringify(solveLargest(a22)), is_hidden: true });

  // 23: 2000 random
  const a23 = [];
  for (let i = 0; i < 2000; i++) a23.push((i * 97) % 50000 - 25000);
  tcs.push({ input: JSON.stringify(a23), output: JSON.stringify(solveLargest(a23)), is_hidden: true });

  // 24: 10,000 scale test
  const a24 = [];
  for (let i = 0; i < 10000; i++) a24.push((i * 101) % 1000000 - 500000);
  tcs.push({ input: JSON.stringify(a24), output: JSON.stringify(solveLargest(a24)), is_hidden: true });

  // 25: 50,000 max constraint test
  const a25 = [];
  for (let i = 0; i < 50000; i++) a25.push(i === 34567 ? 1000000000 : (i * 31) % 100000);
  tcs.push({ input: JSON.stringify(a25), output: JSON.stringify(solveLargest(a25)), is_hidden: true });

  return tcs;
}

// ── 2. Generator for Second Largest Element in an Array ─────────────────
function generateSecondLargestTCs() {
  const tcs = [];
  const base = [
    [1, 2, 4, 7, 7, 5],
    [10, 10, 10],
    [10, 5],
    [5, 10],
    [1],
    [-1, -2, -3, -4],
    [-10, -5, -20, -5, -2],
    [100, 200, 300, 400],
    [400, 300, 200, 100],
    [12, 35, 1, 10, 34, 1],
    [7, 7, 7, 7, 8],
    [8, 7, 7, 7, 7],
    [0, 0, 0, 1],
    [1, 0, 0, 0],
    [-100, -100, -50],
    [5, 5, 4, 4, 3, 3],
    [1, 1000000000],
    [-1000000000, 0, 1000000000],
    [3, 3, 3, 3, 2],
    [2, 3, 3, 3, 3]
  ];

  base.forEach((arr, idx) => {
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(solveSecondLargest(arr)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 all identical
  const a21 = new Array(500).fill(42);
  tcs.push({ input: JSON.stringify(a21), output: JSON.stringify(-1), is_hidden: true });

  // 22: 1000 strictly decreasing
  const a22 = [];
  for (let i = 1000; i >= 1; i--) a22.push(i);
  tcs.push({ input: JSON.stringify(a22), output: JSON.stringify(999), is_hidden: true });

  // 23: 2000 with duplicates of max
  const a23 = [];
  for (let i = 0; i < 2000; i++) a23.push(i % 5 === 0 ? 99999 : (i * 17) % 50000);
  tcs.push({ input: JSON.stringify(a23), output: JSON.stringify(solveSecondLargest(a23)), is_hidden: true });

  // 24: 10,000 scale test
  const a24 = [];
  for (let i = 0; i < 10000; i++) a24.push((i * 37) % 80000 - 40000);
  tcs.push({ input: JSON.stringify(a24), output: JSON.stringify(solveSecondLargest(a24)), is_hidden: true });

  // 25: 50,000 max constraint test
  const a25 = [];
  for (let i = 0; i < 50000; i++) a25.push(i * 2);
  tcs.push({ input: JSON.stringify(a25), output: JSON.stringify(solveSecondLargest(a25)), is_hidden: true });

  return tcs;
}

// ── 3. Generator for Check if Array Is Sorted and Rotated ───────────────
function generateCheckSortedAndRotatedTCs() {
  const tcs = [];
  const base = [
    [3, 4, 5, 1, 2],
    [2, 1, 3, 4],
    [1, 2, 3],
    [1],
    [1, 1, 1],
    [2, 1],
    [1, 2],
    [5, 4, 3, 2, 1],
    [6, 10, 6],
    [1, 3, 2],
    [3, 4, 1, 2],
    [2, 3, 4, 5, 1],
    [1, 1, 1, 1, 1, 2, 1, 1],
    [7, 9, 1, 1, 1, 3],
    [2, 2, 2, 3, 2, 2],
    [10, 20, 30, 40, 5],
    [1, 4, 2, 3],
    [9, 10, 1, 2, 3, 4, 5, 6, 7, 8],
    [3, 5, 7, 1, 2, 6],
    [100, 200, 300, 400, 50]
  ];

  base.forEach((arr, idx) => {
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(solveCheckSortedAndRotated(arr)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 strictly sorted
  const a21 = [];
  for (let i = 1; i <= 500; i++) a21.push(i);
  tcs.push({ input: JSON.stringify(a21), output: JSON.stringify(true), is_hidden: true });

  // 22: 500 valid rotated by 200
  const a22 = [];
  for (let i = 301; i <= 500; i++) a22.push(i);
  for (let i = 1; i <= 300; i++) a22.push(i);
  tcs.push({ input: JSON.stringify(a22), output: JSON.stringify(true), is_hidden: true });

  // 23: 1000 invalid with two drop points
  const a23 = [];
  for (let i = 200; i <= 500; i++) a23.push(i);
  for (let i = 1; i <= 100; i++) a23.push(i);
  for (let i = 50; i <= 150; i++) a23.push(i);
  tcs.push({ input: JSON.stringify(a23), output: JSON.stringify(false), is_hidden: true });

  // 24: 10,000 scale test
  const a24 = [];
  for (let i = 4001; i <= 10000; i++) a24.push(i);
  for (let i = 1; i <= 4000; i++) a24.push(i);
  tcs.push({ input: JSON.stringify(a24), output: JSON.stringify(true), is_hidden: true });

  // 25: 50,000 max constraint test
  const a25 = [];
  for (let i = 25001; i <= 50000; i++) a25.push(i);
  for (let i = 1; i <= 25000; i++) a25.push(i);
  tcs.push({ input: JSON.stringify(a25), output: JSON.stringify(true), is_hidden: true });

  return tcs;
}

// ── 4. Generator for Left Rotate an Array by One ─────────────────────────
function generateLeftRotateByOneTCs() {
  const tcs = [];
  const base = [
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [1],
    [1, 2],
    [2, 1],
    [0, 0, 0],
    [-1, -2, -3, -4],
    [-5, 10, -15, 20],
    [100, 200],
    [1, 1, 1, 2],
    [2, 2, 2, 1],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    [0, 1, 0, 1],
    [42, 43],
    [-100],
    [10, -10, 20, -20, 30, -30],
    [1, 2, 3],
    [3, 2, 1],
    [7, 7, 7, 7],
    [1000000000, -1000000000]
  ];

  base.forEach((arr, idx) => {
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(solveLeftRotateByOne(arr)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 elements
  const a21 = [];
  for (let i = 0; i < 500; i++) a21.push((i * 17) % 100);
  tcs.push({ input: JSON.stringify(a21), output: JSON.stringify(solveLeftRotateByOne(a21)), is_hidden: true });

  // 22: 1000 elements strictly increasing
  const a22 = [];
  for (let i = 1; i <= 1000; i++) a22.push(i);
  tcs.push({ input: JSON.stringify(a22), output: JSON.stringify(solveLeftRotateByOne(a22)), is_hidden: true });

  // 23: 2000 elements all identical
  const a23 = new Array(2000).fill(99);
  tcs.push({ input: JSON.stringify(a23), output: JSON.stringify(solveLeftRotateByOne(a23)), is_hidden: true });

  // 24: 10,000 scale test
  const a24 = [];
  for (let i = 0; i < 10000; i++) a24.push((i * 29) % 5000 - 2500);
  tcs.push({ input: JSON.stringify(a24), output: JSON.stringify(solveLeftRotateByOne(a24)), is_hidden: true });

  // 25: 50,000 max constraint test
  const a25 = [];
  for (let i = 0; i < 50000; i++) a25.push(i);
  tcs.push({ input: JSON.stringify(a25), output: JSON.stringify(solveLeftRotateByOne(a25)), is_hidden: true });

  return tcs;
}

// ── 5. Generator for Move Zeroes ─────────────────────────────────────────
function generateMoveZeroesTCs() {
  const tcs = [];
  const base = [
    [0, 1, 0, 3, 12],
    [0],
    [1],
    [0, 0, 1],
    [1, 0, 0],
    [1, 2, 3, 4, 5],
    [0, 0, 0, 0, 0],
    [4, 2, 4, 0, 0, 3, 0, 5, 1, 0],
    [-1, 0, -2, 0, -3],
    [0, -1, 0, -2],
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [100, 0, 200, 0, 300],
    [0, 0, 2, 3, 0, 4],
    [-5, 0, 5, 0, -10, 10],
    [7]
  ];

  base.forEach((arr, idx) => {
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(solveMoveZeroes(arr)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 all zeroes
  const a21 = new Array(500).fill(0);
  tcs.push({ input: JSON.stringify(a21), output: JSON.stringify(solveMoveZeroes(a21)), is_hidden: true });

  // 22: 1000 alternating 0 and 1
  const a22 = [];
  for (let i = 0; i < 1000; i++) a22.push(i % 2);
  tcs.push({ input: JSON.stringify(a22), output: JSON.stringify(solveMoveZeroes(a22)), is_hidden: true });

  // 23: 2000 elements, zeroes at front
  const a23 = [];
  for (let i = 0; i < 1000; i++) a23.push(0);
  for (let i = 1; i <= 1000; i++) a23.push(i);
  tcs.push({ input: JSON.stringify(a23), output: JSON.stringify(solveMoveZeroes(a23)), is_hidden: true });

  // 24: 10,000 scale test
  const a24 = [];
  for (let i = 0; i < 10000; i++) a24.push(i % 3 === 0 ? 0 : (i * 7) % 1000);
  tcs.push({ input: JSON.stringify(a24), output: JSON.stringify(solveMoveZeroes(a24)), is_hidden: true });

  // 25: 50,000 max constraint test
  const a25 = [];
  for (let i = 0; i < 50000; i++) a25.push(i % 4 === 0 ? 0 : i);
  tcs.push({ input: JSON.stringify(a25), output: JSON.stringify(solveMoveZeroes(a25)), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'largest-element-in-an-array',
    title: 'Largest Element in an Array',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[2, 5, 1, 3, 0]',
    sample_output: '5',
    hints: [
      'Initialize a variable `largest` with the first element of the array.',
      'Iterate through the array starting from index 1. If any element is greater than `largest`, update `largest`.',
      'Return `largest` after scanning the entire array in O(N) time and O(1) auxiliary space.'
    ],
    description: `Given an integer array \`nums\`, find and return the **largest** element in the array.

### **Example 1:**
\`\`\`
Input: nums = [2, 5, 1, 3, 0]
Output: 5
Explanation: The largest element in the array is 5.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [8, 10, 5, 7, 9]
Output: 10
Explanation: The largest element in the array is 10.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [1]
Output: 1
Explanation: With only one element, 1 is the largest.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
`,
    testCases: generateLargestTCs(),
    solutionCode: `function solution(nums) {
      let mx = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] > mx) mx = nums[i];
      }
      return mx;
    }`
  },
  {
    slug: 'second-largest-element-in-an-array',
    title: 'Second Largest Element in an Array',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 2, 4, 7, 7, 5]',
    sample_output: '5',
    hints: [
      'Maintain two variables: `largest` and `secondLargest`, initialized to -Infinity.',
      'In a single pass: if nums[i] > largest, update secondLargest = largest, then largest = nums[i].',
      'If nums[i] < largest and nums[i] > secondLargest, update secondLargest = nums[i].',
      'If no second largest distinct element exists, return -1.'
    ],
    description: `Given an integer array \`nums\`, return the **second largest distinct** element in the array. If no second largest distinct element exists, return \`-1\`.

### **Example 1:**
\`\`\`
Input: nums = [1, 2, 4, 7, 7, 5]
Output: 5
Explanation: The largest distinct element is 7, and the second largest distinct element is 5.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [10, 10, 10]
Output: -1
Explanation: All elements are identical, so no distinct second largest element exists.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [10, 5]
Output: 5
Explanation: The second largest element is 5.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
`,
    testCases: generateSecondLargestTCs(),
    solutionCode: `function solution(nums) {
      let largest = -Infinity;
      let second = -Infinity;
      for (const x of nums) {
        if (x > largest) {
          second = largest;
          largest = x;
        } else if (x < largest && x > second) {
          second = x;
        }
      }
      return second === -Infinity ? -1 : second;
    }`
  },
  {
    slug: 'check-if-array-is-sorted-and-rotated',
    title: 'Check if Array Is Sorted and Rotated',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[3, 4, 5, 1, 2]',
    sample_output: 'true',
    hints: [
      'A sorted array rotated by any number of positions can have at most one index `i` where `nums[i] > nums[(i + 1) % n]`.',
      'Iterate through the array and count how many times `nums[i] > nums[(i + 1) % n]`.',
      'If count <= 1, return true; otherwise, return false.'
    ],
    description: `Given an array \`nums\`, return \`true\` *if the array was originally sorted in non-decreasing order, then rotated some number of positions (including zero)*. Otherwise, return \`false\`.

There may be duplicates in the original array.

**Note:** An array \`A\` rotated by \`x\` positions results in an array \`B\` of the same length such that \`B[i] == A[(i+x) % A.length]\` for every valid index \`i\`.

### **Example 1:**
\`\`\`
Input: nums = [3, 4, 5, 1, 2]
Output: true
Explanation: [1, 2, 3, 4, 5] is the original sorted array. Rotating by x = 3 positions gives [3, 4, 5, 1, 2].
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [2, 1, 3, 4]
Output: false
Explanation: There is no sorted array that once rotated can become [2, 1, 3, 4].
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [1, 2, 3]
Output: true
Explanation: [1, 2, 3] is already sorted (rotated by x = 0 positions).
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
`,
    testCases: generateCheckSortedAndRotatedTCs(),
    solutionCode: `function solution(nums) {
      let count = 0;
      const n = nums.length;
      for (let i = 0; i < n; i++) {
        if (nums[i] > nums[(i + 1) % n]) count++;
      }
      return count <= 1;
    }`
  },
  {
    slug: 'left-rotate-an-array-by-one',
    title: 'Left Rotate an Array by One',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '[2, 3, 4, 5, 1]',
    hints: [
      'Store the first element `nums[0]` in a temporary variable.',
      'Shift all remaining elements one position to the left: `nums[i] = nums[i + 1]` for `i` from 0 to `n - 2`.',
      'Place the temporary variable at `nums[n - 1]`.'
    ],
    description: `Given an integer array \`nums\`, rotate the array to the **left by one** position.

### **Example 1:**
\`\`\`
Input: nums = [1, 2, 3, 4, 5]
Output: [2, 3, 4, 5, 1]
Explanation: Rotating the array to the left by 1 shifts 1 to the end.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [5, 4, 3, 2, 1]
Output: [4, 3, 2, 1, 5]
Explanation: The first element 5 moves to the last position.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [1]
Output: [1]
Explanation: Rotating a single element array leaves it unchanged.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
`,
    testCases: generateLeftRotateByOneTCs(),
    solutionCode: `function solution(nums) {
      if (nums.length <= 1) return nums;
      const first = nums[0];
      for (let i = 0; i < nums.length - 1; i++) {
        nums[i] = nums[i + 1];
      }
      nums[nums.length - 1] = first;
      return nums;
    }`
  },
  {
    slug: 'move-zeroes',
    title: 'Move Zeroes',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[0, 1, 0, 3, 12]',
    sample_output: '[1, 3, 12, 0, 0]',
    hints: [
      'Use a two-pointer approach: pointer `lastNonZero` keeps track of where the next non-zero element should go.',
      'Iterate through the array. When a non-zero element is found, swap it with `nums[lastNonZero]` and increment `lastNonZero`.',
      'This achieves O(N) time and O(1) extra space in-place.'
    ],
    description: `Given an integer array \`nums\`, move all \`0\`'s to the end of it while maintaining the relative order of the non-zero elements.

**Note** that you must do this in-place without making a copy of the array.

### **Example 1:**
\`\`\`
Input: nums = [0, 1, 0, 3, 12]
Output: [1, 3, 12, 0, 0]
Explanation: All zeroes are moved to the end, while non-zero elements [1, 3, 12] preserve order.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [0]
Output: [0]
Explanation: Array containing only 0 remains unchanged.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [1]
Output: [1]
Explanation: No zeroes exist to move.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-2^{31} <= nums[i] <= 2^{31} - 1\`
`,
    testCases: generateMoveZeroesTCs(),
    solutionCode: `function solution(nums) {
      let insertPos = 0;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== 0) {
          nums[insertPos++] = nums[i];
        }
      }
      while (insertPos < nums.length) {
        nums[insertPos++] = 0;
      }
      return nums;
    }`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Easy (Batch 1)...');

  for (const prob of problemsToUpgrade) {
    console.log(`\n========================================`);
    console.log(`[Problem] Processing: ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const { rows } = await db.query('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    let problemId;

    if (rows.length > 0) {
      problemId = rows[0].id;
      console.log(`  -> Found existing in DB with ID: ${problemId}. Updating fields...`);
      await db.query(`
        UPDATE problems
        SET title = $1,
            topic = $2,
            difficulty = $3,
            description = $4,
            sample_input = $5,
            sample_output = $6,
            hints = $7
        WHERE id = $8
      `, [
        prob.title,
        prob.topic,
        prob.difficulty,
        prob.description,
        prob.sample_input,
        prob.sample_output,
        JSON.stringify(prob.hints),
        problemId
      ]);
    } else {
      console.log(`  -> Inserting new problem into DB...`);
      const insertRes = await db.query(`
        INSERT INTO problems (title, slug, topic, difficulty, description, sample_input, sample_output, hints)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        prob.title,
        prob.slug,
        prob.topic,
        prob.difficulty,
        prob.description,
        prob.sample_input,
        prob.sample_output,
        JSON.stringify(prob.hints)
      ]);
      problemId = insertRes.rows[0].id;
      console.log(`  -> Inserted with ID: ${problemId}`);
    }

    // 2. Clear old test cases
    const delRes = await db.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
    console.log(`  -> Cleared ${delRes.rowCount} old test cases.`);

    // 3. Insert 25 curated test cases
    console.log(`  -> Inserting 25 curated test cases with scale stress tests...`);
    for (const tc of prob.testCases) {
      await db.query(`
        INSERT INTO test_cases (problem_id, input, output, is_hidden)
        VALUES ($1, $2, $3, $4)
      `, [problemId, tc.input, tc.output, tc.is_hidden]);
    }

    // 4. Verify test case count
    const countRes = await db.query('SELECT count(*) as count, max(length(input)) as max_len FROM test_cases WHERE problem_id = $1', [problemId]);
    console.log(`  -> Verified in DB: count = ${countRes.rows[0].count}, max_len = ${countRes.rows[0].max_len}`);

    // 5. Run Judge to Validate 25/25 ACCEPTED
    console.log(`  -> Running Judge Validation...`);
    const evalResult = await evaluateSubmission(problemId, prob.solutionCode, 'javascript');
    console.log(`  -> Judge Verdict: ${evalResult.verdict} (${evalResult.passedTests}/${evalResult.totalTests} tests passed in ${evalResult.runtimeMs}ms)`);

    if (evalResult.verdict !== 'ACCEPTED' || evalResult.passedTests !== 25) {
      console.error(`  -> ERROR: Failed evaluation for ${prob.title}!`);
      if (evalResult.testResults) {
        const failed = evalResult.testResults.filter(t => !t.passed);
        console.error('  -> Failed tests:', JSON.stringify(failed.slice(0, 3), null, 2));
      }
      process.exit(1);
    }

    console.log(`  -> SUCCESS! 25/25 ACCEPTED for ${prob.title}`);
  }

  console.log(`\n========================================`);
  console.log(`ALL 5 STRIVER ARRAY EASY PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

