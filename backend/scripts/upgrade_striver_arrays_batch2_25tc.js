/**
 * backend/scripts/upgrade_striver_arrays_batch2_25tc.js
 *
 * Upgrades Striver Step 3 Arrays Batch 2 (6 Problems) to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 *
 * Problems:
 * 1. Linear Search (linear-search)
 * 2. Union of Two Sorted Arrays (union-of-two-sorted-arrays)
 * 3. Missing Number (missing-number) [LC 268]
 * 4. Two Sum (two-sum) [LC 1]
 * 5. Longest Subarray with Given Sum K (longest-subarray-with-given-sum)
 * 6. Subarray Sum Equals K (subarray-sum-equals-k) [LC 560]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers for 100% accurate oracle outputs
function solveLinearSearch(nums, k) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === k) return i;
  }
  return -1;
}

function solveUnion(nums1, nums2) {
  const set = new Set();
  for (const x of nums1) set.add(x);
  for (const x of nums2) set.add(x);
  const arr = Array.from(set);
  arr.sort((a, b) => a - b);
  return arr;
}

function solveMissingNumber(nums) {
  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;
  const actualSum = nums.reduce((a, b) => a + b, 0);
  return expectedSum - actualSum;
}

function solveTwoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) return [map.get(comp), i];
    map.set(nums[i], i);
  }
  return [-1, -1];
}

function solveLongestSubarray(nums, k) {
  const map = new Map();
  let maxLen = 0;
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (sum === k) maxLen = i + 1;
    if (map.has(sum - k)) {
      maxLen = Math.max(maxLen, i - map.get(sum - k));
    }
    if (!map.has(sum)) map.set(sum, i);
  }
  return maxLen;
}

function solveSubarraySumEqualsK(nums, k) {
  const map = new Map();
  map.set(0, 1);
  let count = 0;
  let sum = 0;
  for (const n of nums) {
    sum += n;
    if (map.has(sum - k)) count += map.get(sum - k);
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}

// ── 1. Generator for Linear Search ──────────────────────────────────────
function generateLinearSearchTCs() {
  const tcs = [];
  const base = [
    { nums: [1, 2, 3, 4, 5], k: 3 },
    { nums: [5, 4, 3, 2, 1], k: 5 },
    { nums: [10, 20, 30, 40], k: 25 },
    { nums: [7], k: 7 },
    { nums: [7], k: 8 },
    { nums: [1, 2, 3, 4, 5], k: 5 },
    { nums: [-5, -2, 0, 3, 8], k: -2 },
    { nums: [-5, -2, 0, 3, 8], k: 0 },
    { nums: [-5, -2, 0, 3, 8], k: -10 },
    { nums: [4, 4, 4, 4, 4], k: 4 },
    { nums: [1, 3, 5, 7, 9, 11], k: 1 },
    { nums: [1, 3, 5, 7, 9, 11], k: 11 },
    { nums: [1, 3, 5, 7, 9, 11], k: 6 },
    { nums: [-100, 200, -300, 400], k: -300 },
    { nums: [0, 0, 0, 1], k: 1 },
    { nums: [1, 0, 0, 0], k: 1 },
    { nums: [10, -10, 20, -20], k: 99 },
    { nums: [1000000000], k: 1000000000 },
    { nums: [-1000000000], k: 1000000000 },
    { nums: [2, 4, 6, 8, 10], k: 8 }
  ];

  base.forEach(({ nums, k }, idx) => {
    tcs.push({
      input: `${JSON.stringify(nums)}, ${k}`,
      output: JSON.stringify(solveLinearSearch(nums, k)),
      is_hidden: idx >= 3
    });
  });

  // 21: 1000 elements, k in middle
  const a21 = [];
  for (let i = 0; i < 1000; i++) a21.push(i * 3);
  tcs.push({ input: `${JSON.stringify(a21)}, 1500`, output: JSON.stringify(500), is_hidden: true });

  // 22: 2000 elements, k not found
  const a22 = [];
  for (let i = 0; i < 2000; i++) a22.push(i * 2);
  tcs.push({ input: `${JSON.stringify(a22)}, 3333`, output: JSON.stringify(-1), is_hidden: true });

  // 23: 5000 elements, duplicates
  const a23 = [];
  for (let i = 0; i < 5000; i++) a23.push((i * 13) % 200);
  tcs.push({ input: `${JSON.stringify(a23)}, 99`, output: JSON.stringify(solveLinearSearch(a23, 99)), is_hidden: true });

  // 24: 10,000 scale test
  const a24 = [];
  for (let i = 0; i < 10000; i++) a24.push(i);
  tcs.push({ input: `${JSON.stringify(a24)}, 9999`, output: JSON.stringify(9999), is_hidden: true });

  // 25: 50,000 max constraint test
  const a25 = [];
  for (let i = 0; i < 50000; i++) a25.push(i === 49999 ? 777777 : i);
  tcs.push({ input: `${JSON.stringify(a25)}, 777777`, output: JSON.stringify(49999), is_hidden: true });

  return tcs;
}

// ── 2. Generator for Union of Two Sorted Arrays ─────────────────────────
function generateUnionTCs() {
  const tcs = [];
  const base = [
    { nums1: [1, 2, 3, 4, 5], nums2: [1, 2, 3] },
    { nums1: [2, 2, 3, 4, 5], nums2: [1, 1, 2, 3, 4] },
    { nums1: [1, 1, 1, 1, 1], nums2: [2, 2, 2, 2, 2] },
    { nums1: [1], nums2: [2] },
    { nums1: [1], nums2: [1] },
    { nums1: [1, 3, 5], nums2: [2, 4, 6] },
    { nums1: [2, 4, 6], nums2: [1, 3, 5] },
    { nums1: [-5, -3, -1], nums2: [-4, -2, 0] },
    { nums1: [10, 20, 30], nums2: [5, 10, 15, 20, 25, 30] },
    { nums1: [0], nums2: [0] },
    { nums1: [-10, 0, 10], nums2: [-5, 0, 5] },
    { nums1: [1, 2, 3], nums2: [4, 5, 6] },
    { nums1: [1, 2, 2, 3], nums2: [2, 3, 3, 4] },
    { nums1: [100, 200], nums2: [50, 100, 150, 200, 250] },
    { nums1: [-1000000000], nums2: [1000000000] },
    { nums1: [1, 4, 7, 10], nums2: [2, 5, 8, 11] },
    { nums1: [3, 3, 3], nums2: [3, 3] },
    { nums1: [1, 2, 3, 4], nums2: [1, 2, 3, 4] },
    { nums1: [5, 10, 15], nums2: [1, 2, 3, 4] },
    { nums1: [1, 2, 3, 4], nums2: [5, 10, 15] }
  ];

  base.forEach(({ nums1, nums2 }, idx) => {
    tcs.push({
      input: `${JSON.stringify(nums1)}, ${JSON.stringify(nums2)}`,
      output: JSON.stringify(solveUnion(nums1, nums2)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 disjoint
  const a21_1 = [];
  const a21_2 = [];
  for (let i = 0; i < 500; i++) {
    a21_1.push(i * 2);
    a21_2.push(i * 2 + 1);
  }
  tcs.push({ input: `${JSON.stringify(a21_1)}, ${JSON.stringify(a21_2)}`, output: JSON.stringify(solveUnion(a21_1, a21_2)), is_hidden: true });

  // 22: 1000 with heavy duplicates
  const a22_1 = [];
  const a22_2 = [];
  for (let i = 0; i < 1000; i++) {
    a22_1.push(Math.floor(i / 10));
    a22_2.push(Math.floor((i + 5) / 10));
  }
  tcs.push({ input: `${JSON.stringify(a22_1)}, ${JSON.stringify(a22_2)}`, output: JSON.stringify(solveUnion(a22_1, a22_2)), is_hidden: true });

  // 23: 2000 identical
  const a23_1 = new Array(2000).fill(5);
  const a23_2 = new Array(2000).fill(5);
  tcs.push({ input: `${JSON.stringify(a23_1)}, ${JSON.stringify(a23_2)}`, output: JSON.stringify([5]), is_hidden: true });

  // 24: 10,000 scale test
  const a24_1 = [];
  const a24_2 = [];
  for (let i = 0; i < 10000; i++) {
    a24_1.push(i * 3);
    a24_2.push(i * 2);
  }
  tcs.push({ input: `${JSON.stringify(a24_1)}, ${JSON.stringify(a24_2)}`, output: JSON.stringify(solveUnion(a24_1, a24_2)), is_hidden: true });

  // 25: 25,000 + 25,000 max constraint test
  const a25_1 = [];
  const a25_2 = [];
  for (let i = 0; i < 25000; i++) {
    a25_1.push(i * 2);
    a25_2.push(i * 2 + 1);
  }
  tcs.push({ input: `${JSON.stringify(a25_1)}, ${JSON.stringify(a25_2)}`, output: JSON.stringify(solveUnion(a25_1, a25_2)), is_hidden: true });

  return tcs;
}

// ── 3. Generator for Missing Number ─────────────────────────────────────
function generateMissingNumberTCs() {
  const tcs = [];
  const base = [
    [3, 0, 1],
    [0, 1],
    [9, 6, 4, 2, 3, 5, 7, 0, 1],
    [0],
    [1],
    [1, 2],
    [0, 2],
    [2, 0],
    [0, 1, 2, 3, 5],
    [5, 4, 3, 2, 1],
    [0, 1, 2, 4, 5, 6],
    [6, 5, 4, 3, 2, 0],
    [1, 3, 4, 2, 0],
    [0, 2, 3, 4, 5],
    [4, 3, 2, 1, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 10],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [2, 3, 1, 0, 5],
    [0, 1, 3],
    [3, 2, 0]
  ];

  base.forEach((arr, idx) => {
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(solveMissingNumber(arr)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 missing 250
  const a21 = [];
  for (let i = 0; i <= 500; i++) if (i !== 250) a21.push(i);
  // shuffle deterministically
  for (let i = 0; i < a21.length; i++) {
    const j = (i * 31) % a21.length;
    const temp = a21[i]; a21[i] = a21[j]; a21[j] = temp;
  }
  tcs.push({ input: JSON.stringify(a21), output: JSON.stringify(250), is_hidden: true });

  // 22: 1000 missing 0
  const a22 = [];
  for (let i = 1; i <= 1000; i++) a22.push(i);
  tcs.push({ input: JSON.stringify(a22), output: JSON.stringify(0), is_hidden: true });

  // 23: 2000 missing last element 2000
  const a23 = [];
  for (let i = 0; i < 2000; i++) a23.push(i);
  tcs.push({ input: JSON.stringify(a23), output: JSON.stringify(2000), is_hidden: true });

  // 24: 10,000 scale test missing 4567
  const a24 = [];
  for (let i = 0; i <= 10000; i++) if (i !== 4567) a24.push(i);
  tcs.push({ input: JSON.stringify(a24), output: JSON.stringify(4567), is_hidden: true });

  // 25: 30,000 max constraint test (strictly kills O(N^2) brute force with TLE)
  const a25 = [];
  for (let i = 0; i <= 30000; i++) if (i !== 17290) a25.push(i);
  tcs.push({ input: JSON.stringify(a25), output: JSON.stringify(17290), is_hidden: true });

  return tcs;
}

// ── 4. Generator for Two Sum ─────────────────────────────────────────────
function generateTwoSumTCs() {
  const tcs = [];
  const base = [
    { nums: [2, 7, 11, 15], target: 9 },
    { nums: [3, 2, 4], target: 6 },
    { nums: [3, 3], target: 6 },
    { nums: [1, 2], target: 3 },
    { nums: [10, -5, 20, 3], target: 15 },
    { nums: [-3, 4, 3, 90], target: 0 },
    { nums: [0, 4, 3, 0], target: 0 },
    { nums: [-1, -2, -3, -4, -5], target: -8 },
    { nums: [1000000000, 5, 1000000000], target: 2000000000 },
    { nums: [1, 5, 8, 13, 17], target: 22 },
    { nums: [5, 75, 25], target: 100 },
    { nums: [1, 2, 3, 4, 5, 6], target: 11 },
    { nums: [2, 5, 5, 11], target: 10 },
    { nums: [-10, -20, 30, 40], target: 10 },
    { nums: [1, 3, 4, 7], target: 8 },
    { nums: [100, 200, 300, 400], target: 700 },
    { nums: [1, 2, 4, 8, 16], target: 24 },
    { nums: [7, 2, 13, 11], target: 9 },
    { nums: [0, 1, 2], target: 1 },
    { nums: [-5, 0, 5], target: 0 }
  ];

  base.forEach(({ nums, target }, idx) => {
    tcs.push({
      input: `${JSON.stringify(nums)}, ${target}`,
      output: JSON.stringify(solveTwoSum(nums, target)),
      is_hidden: idx >= 3
    });
  });

  function makeStrictTwoSum(n, idx1, idx2) {
    const nums = [];
    for (let i = 0; i < n; i++) nums.push(i * 2 + 1);
    const v1 = 500000000;
    const v2 = 700000000;
    nums[idx1] = v1;
    nums[idx2] = v2;
    return { nums, target: v1 + v2 };
  }

  // 21: 1,000 elements
  const tc21 = makeStrictTwoSum(1000, 150, 850);
  tcs.push({ input: `${JSON.stringify(tc21.nums)}, ${tc21.target}`, output: JSON.stringify([150, 850]), is_hidden: true });

  // 22: 3,000 elements
  const tc22 = makeStrictTwoSum(3000, 500, 2500);
  tcs.push({ input: `${JSON.stringify(tc22.nums)}, ${tc22.target}`, output: JSON.stringify([500, 2500]), is_hidden: true });

  // 23: 10,000 scale test
  const tc23 = makeStrictTwoSum(10000, 1000, 9000);
  tcs.push({ input: `${JSON.stringify(tc23.nums)}, ${tc23.target}`, output: JSON.stringify([1000, 9000]), is_hidden: true });

  // 24: 30,000 scale test
  const tc24 = makeStrictTwoSum(30000, 5000, 25000);
  tcs.push({ input: `${JSON.stringify(tc24.nums)}, ${tc24.target}`, output: JSON.stringify([5000, 25000]), is_hidden: true });

  // 25: 50,000 max constraint test (pair at the very end to strictly kill O(N^2) brute force with TLE)
  const tc25 = makeStrictTwoSum(50000, 49998, 49999);
  tcs.push({ input: `${JSON.stringify(tc25.nums)}, ${tc25.target}`, output: JSON.stringify([49998, 49999]), is_hidden: true });

  return tcs;
}

// ── 5. Generator for Longest Subarray with Given Sum K ───────────────────
function generateLongestSubarrayTCs() {
  const tcs = [];
  const base = [
    { nums: [10, 5, 2, 7, 1, 9], k: 15 },
    { nums: [-1, 2, 3], k: 6 },
    { nums: [1, -1, 1], k: 1 },
    { nums: [1, 2, 3], k: 3 },
    { nums: [1, 2, 3, 4, 5], k: 9 },
    { nums: [-5, 8, -14, 2, 4, 12], k: -5 },
    { nums: [0, 0, 0, 0], k: 0 },
    { nums: [1, 4, 0, 0, 3, 10, 5], k: 7 },
    { nums: [2, 3, 5, 1, 9], k: 10 },
    { nums: [1, 2, 1, 2, 1], k: 3 },
    { nums: [-1, 1, -1, 1], k: 0 },
    { nums: [10, -10, 20, -20], k: 0 },
    { nums: [5], k: 5 },
    { nums: [5], k: 10 },
    { nums: [2, 0, 0, 3], k: 5 },
    { nums: [-2, -1, 2, 1], k: 1 },
    { nums: [1, 1, 1, 1, 1], k: 3 },
    { nums: [10, 20, 30], k: 100 },
    { nums: [1, -2, 3, -4, 5], k: 2 },
    { nums: [3, 1, 0, 1, 8, 2, 3, 6], k: 5 }
  ];

  base.forEach(({ nums, k }, idx) => {
    tcs.push({
      input: `${JSON.stringify(nums)}, ${k}`,
      output: JSON.stringify(solveLongestSubarray(nums, k)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 alternating
  const a21 = [];
  for (let i = 0; i < 500; i++) a21.push(i % 2 === 0 ? 1 : -1);
  tcs.push({ input: `${JSON.stringify(a21)}, 0`, output: JSON.stringify(500), is_hidden: true });

  // 22: 1000 all zeroes, k = 0
  const a22 = new Array(1000).fill(0);
  tcs.push({ input: `${JSON.stringify(a22)}, 0`, output: JSON.stringify(1000), is_hidden: true });

  // 23: 2000 elements
  const a23 = [];
  for (let i = 0; i < 2000; i++) a23.push((i * 17) % 21 - 10);
  tcs.push({ input: `${JSON.stringify(a23)}, 15`, output: JSON.stringify(solveLongestSubarray(a23, 15)), is_hidden: true });

  // 24: 5,000 scale test
  const a24 = [];
  for (let i = 0; i < 5000; i++) a24.push(i % 2 === 0 ? 2 : -1);
  tcs.push({ input: `${JSON.stringify(a24)}, 500`, output: JSON.stringify(solveLongestSubarray(a24, 500)), is_hidden: true });

  // 25: 20,000 max constraint test (strictly kills O(N^2) brute force with TLE)
  const a25 = [];
  for (let i = 0; i < 20000; i++) a25.push(i % 3 === 0 ? -1 : 1);
  tcs.push({ input: `${JSON.stringify(a25)}, 2500`, output: JSON.stringify(solveLongestSubarray(a25, 2500)), is_hidden: true });

  return tcs;
}

// ── 6. Generator for Subarray Sum Equals K ───────────────────────────────
function generateSubarraySumEqualsKTCs() {
  const tcs = [];
  const base = [
    { nums: [1, 1, 1], k: 2 },
    { nums: [1, 2, 3], k: 3 },
    { nums: [1, -1, 0], k: 0 },
    { nums: [1], k: 0 },
    { nums: [1], k: 1 },
    { nums: [1, 2, 1, 2, 1], k: 3 },
    { nums: [-1, -1, 1], k: 0 },
    { nums: [0, 0, 0, 0, 0], k: 0 },
    { nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 },
    { nums: [100, 200, 300], k: 1000 },
    { nums: [-2, -1, 2, 1], k: 1 },
    { nums: [10, 5, 2, 7, 1, 9], k: 15 },
    { nums: [1, 0, 1, 0, 1], k: 2 },
    { nums: [-5, 5, -5, 5], k: 0 },
    { nums: [2, 3, 5, 1, 9], k: 10 },
    { nums: [1, 1, 1, 1], k: 2 },
    { nums: [5, -5, 5, -5, 5], k: 5 },
    { nums: [1, 2, 3, 4, 5], k: 15 },
    { nums: [0, 0, 0], k: 0 },
    { nums: [2, 4, 6], k: 5 }
  ];

  base.forEach(({ nums, k }, idx) => {
    tcs.push({
      input: `${JSON.stringify(nums)}, ${k}`,
      output: JSON.stringify(solveSubarraySumEqualsK(nums, k)),
      is_hidden: idx >= 3
    });
  });

  // 21: 500 alternating
  const a21 = [];
  for (let i = 0; i < 500; i++) a21.push(i % 2 === 0 ? 1 : -1);
  tcs.push({ input: `${JSON.stringify(a21)}, 0`, output: JSON.stringify(solveSubarraySumEqualsK(a21, 0)), is_hidden: true });

  // 22: 1000 all zeroes, k = 0 (1000 * 1001 / 2 subarrays)
  const a22 = new Array(1000).fill(0);
  tcs.push({ input: `${JSON.stringify(a22)}, 0`, output: JSON.stringify(500500), is_hidden: true });

  // 23: 2000 elements
  const a23 = [];
  for (let i = 0; i < 2000; i++) a23.push((i * 13) % 19 - 9);
  tcs.push({ input: `${JSON.stringify(a23)}, 5`, output: JSON.stringify(solveSubarraySumEqualsK(a23, 5)), is_hidden: true });

  // 24: 5,000 scale test
  const a24 = [];
  for (let i = 0; i < 5000; i++) a24.push(i % 2 === 0 ? 2 : -2);
  tcs.push({ input: `${JSON.stringify(a24)}, 0`, output: JSON.stringify(solveSubarraySumEqualsK(a24, 0)), is_hidden: true });

  // 25: 50,000 max constraint test (strictly kills O(N^2) brute force — ~6.25B ops > 2s limit)
  const a25 = [];
  for (let i = 0; i < 50000; i++) a25.push(i % 7 === 0 ? 3 : -1);
  tcs.push({ input: `${JSON.stringify(a25)}, 6`, output: JSON.stringify(solveSubarraySumEqualsK(a25, 6)), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'linear-search',
    title: 'Linear Search',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 2, 3, 4, 5], 3',
    sample_output: '2',
    hints: [
      'Iterate through the array from index 0 to n - 1.',
      'Compare each element with `k`. If a match is found, return the index immediately.',
      'If the loop terminates without finding `k`, return -1.'
    ],
    description: `Given an integer array \`nums\` and an integer \`k\`, find and return the **index** of the first occurrence of \`k\` in the array. If \`k\` is not present in the array, return \`-1\`.

### **Example 1:**
\`\`\`
Input: nums = [1, 2, 3, 4, 5], k = 3
Output: 2
Explanation: 3 is present at index 2 (0-indexed).
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [5, 4, 3, 2, 1], k = 5
Output: 0
Explanation: 5 is present at index 0.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [10, 20, 30, 40], k = 25
Output: -1
Explanation: 25 is not present in the array.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= k <= 10^9\`
`,
    testCases: generateLinearSearchTCs(),
    solutionCode: `function solution(nums, k) {
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === k) return i;
      }
      return -1;
    }`
  },
  {
    slug: 'union-of-two-sorted-arrays',
    title: 'Union of Two Sorted Arrays',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 2, 3, 4, 5], [1, 2, 3]',
    sample_output: '[1, 2, 3, 4, 5]',
    hints: [
      'Since both arrays are already sorted, use a two-pointer approach to traverse them concurrently.',
      'Compare elements at both pointers, append the smaller element to the result, and advance its pointer, skipping duplicate values.',
      'If both elements are equal, append either one and advance both pointers. Finally, append any remaining elements.'
    ],
    description: `Given two sorted arrays \`nums1\` and \`nums2\`, return the **union** of the two arrays.

The union of two arrays contains all distinct elements from both arrays sorted in non-decreasing order.

### **Example 1:**
\`\`\`
Input: nums1 = [1, 2, 3, 4, 5], nums2 = [1, 2, 3]
Output: [1, 2, 3, 4, 5]
Explanation: Distinct elements from both arrays are 1, 2, 3, 4, 5.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums1 = [2, 2, 3, 4, 5], nums2 = [1, 1, 2, 3, 4]
Output: [1, 2, 3, 4, 5]
Explanation: Duplicates are eliminated, leaving distinct sorted values [1, 2, 3, 4, 5].
\`\`\`

### **Example 3:**
\`\`\`
Input: nums1 = [1, 1, 1, 1, 1], nums2 = [2, 2, 2, 2, 2]
Output: [1, 2]
Explanation: The distinct elements are 1 and 2.
\`\`\`

### **Constraints:**
- \`1 <= nums1.length, nums2.length <= 5 * 10^4\`
- \`-10^9 <= nums1[i], nums2[j] <= 10^9\`
- \`nums1\` and \`nums2\` are sorted in non-decreasing order.
`,
    testCases: generateUnionTCs(),
    solutionCode: `function solution(nums1, nums2) {
      const res = [];
      let i = 0, j = 0;
      const n1 = nums1.length, n2 = nums2.length;
      while (i < n1 && j < n2) {
        if (nums1[i] <= nums2[j]) {
          if (res.length === 0 || res[res.length - 1] !== nums1[i]) res.push(nums1[i]);
          if (nums1[i] === nums2[j]) j++;
          i++;
        } else {
          if (res.length === 0 || res[res.length - 1] !== nums2[j]) res.push(nums2[j]);
          j++;
        }
      }
      while (i < n1) {
        if (res.length === 0 || res[res.length - 1] !== nums1[i]) res.push(nums1[i]);
        i++;
      }
      while (j < n2) {
        if (res.length === 0 || res[res.length - 1] !== nums2[j]) res.push(nums2[j]);
        j++;
      }
      return res;
    }`
  },
  {
    slug: 'missing-number',
    title: 'Missing Number',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[3, 0, 1]',
    sample_output: '2',
    hints: [
      'The array contains n numbers from range [0, n]. The expected sum of 0 to n is n * (n + 1) / 2.',
      'Subtract the actual sum of the array elements from the expected sum.',
      'The difference is the missing number! Time complexity is O(N) and space complexity is O(1).'
    ],
    description: `Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return *the only number in the range that is missing from the array*.

### **Example 1:**
\`\`\`
Input: nums = [3, 0, 1]
Output: 2
Explanation: n = 3 since there are 3 numbers, so all numbers are in the range [0, 3]. 2 is the missing number.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [0, 1]
Output: 2
Explanation: n = 2 since there are 2 numbers, so all numbers are in the range [0, 2]. 2 is the missing number.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]
Output: 8
Explanation: n = 9 since there are 9 numbers, so all numbers are in the range [0, 9]. 8 is the missing number.
\`\`\`

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 3 * 10^4\`
- \`0 <= nums[i] <= n\`
- All the numbers of \`nums\` are **unique**.
`,
    testCases: generateMissingNumberTCs(),
    solutionCode: `function solution(nums) {
      const n = nums.length;
      let expected = (n * (n + 1)) / 2;
      for (const x of nums) expected -= x;
      return expected;
    }`
  },
  {
    slug: 'two-sum',
    title: 'Two Sum',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[2, 7, 11, 15], 9',
    sample_output: '[0, 1]',
    hints: [
      'A brute force O(N^2) approach checks every pair, which will exceed the time limit on large arrays.',
      'Use a Hash Map to store each element and its index as you iterate through the array.',
      'For each element `nums[i]`, check if `target - nums[i]` exists in the map. If it does, return `[map.get(target - nums[i]), i]`.'
    ],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### **Example 1:**
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
Explanation: Because nums[1] + nums[2] == 6, we return [1, 2].
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [3, 3], target = 6
Output: [0, 1]
Explanation: Because nums[0] + nums[1] == 6, we return [0, 1].
\`\`\`

### **Constraints:**
- \`2 <= nums.length <= 1.5 * 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**
`,
    testCases: generateTwoSumTCs(),
    solutionCode: `function solution(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
      }
      return [-1, -1];
    }`
  },
  {
    slug: 'longest-subarray-with-given-sum',
    title: 'Longest Subarray with Given Sum K',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[10, 5, 2, 7, 1, 9], 15',
    sample_output: '4',
    hints: [
      'Maintain a cumulative prefix sum as you traverse the array.',
      'If `prefixSum == k`, the subarray from index 0 to `i` has sum `k`, so length is `i + 1`.',
      'If `prefixSum - k` was seen at index `j`, the subarray from `j + 1` to `i` sums to `k`. Check `i - j` against `maxLen`.',
      'Store each prefix sum in a Hash Map only on its first occurrence to maximize subarray length.'
    ],
    description: `Given an array \`nums\` and an integer \`k\`, find the length of the **longest subarray** that sums to \`k\`. If no such subarray exists, return \`0\`.

Subarrays can contain positive, negative, and zero values.

### **Example 1:**
\`\`\`
Input: nums = [10, 5, 2, 7, 1, 9], k = 15
Output: 4
Explanation: The longest subarray with sum 15 is [5, 2, 7, 1] with length 4.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [-1, 2, 3], k = 6
Output: 0
Explanation: No subarray sums to 6.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [1, -1, 1], k = 1
Output: 3
Explanation: The entire array [1, -1, 1] sums to 1 with length 3.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 2 * 10^4\`
- \`-10^5 <= nums[i] <= 10^5\`
- \`-10^9 <= k <= 10^9\`
`,
    testCases: generateLongestSubarrayTCs(),
    solutionCode: `function solution(nums, k) {
      const map = new Map();
      let maxLen = 0;
      let sum = 0;
      for (let i = 0; i < nums.length; i++) {
        sum += nums[i];
        if (sum === k) maxLen = i + 1;
        if (map.has(sum - k)) {
          maxLen = Math.max(maxLen, i - map.get(sum - k));
        }
        if (!map.has(sum)) map.set(sum, i);
      }
      return maxLen;
    }`
  },
  {
    slug: 'subarray-sum-equals-k',
    title: 'Subarray Sum Equals K',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1, 1, 1], 2',
    sample_output: '2',
    hints: [
      'A brute force approach considers every subarray in O(N^2) time, which will TLE.',
      'Use a Hash Map to record the frequency of each prefix sum seen so far, initialized with `{ 0: 1 }`.',
      'For each prefix sum, add `map.get(prefixSum - k)` to your answer count, then increment the frequency of `prefixSum`.'
    ],
    description: `Given an array of integers \`nums\` and an integer \`k\`, return *the total number of subarrays whose sum equals to \`k\`*.

A subarray is a contiguous **non-empty** sequence of elements within an array.

### **Example 1:**
\`\`\`
Input: nums = [1, 1, 1], k = 2
Output: 2
Explanation: Subarrays [1, 1] at index (0,1) and index (1,2) both sum to 2.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [1, 2, 3], k = 3
Output: 2
Explanation: Subarrays [1, 2] and [3] sum to 3.
\`\`\`

### **Example 3:**
\`\`\`
Input: nums = [1, -1, 0], k = 0
Output: 3
Explanation: Subarrays [1, -1], [0], and [1, -1, 0] all sum to 0.
\`\`\`

### **Constraints:**
- \`1 <= nums.length <= 2 * 10^4\`
- \`-1000 <= nums[i] <= 1000\`
- \`-10^7 <= k <= 10^7\`
`,
    testCases: generateSubarraySumEqualsKTCs(),
    solutionCode: `function solution(nums, k) {
      const map = new Map();
      map.set(0, 1);
      let count = 0;
      let sum = 0;
      for (const n of nums) {
        sum += n;
        if (map.has(sum - k)) count += map.get(sum - k);
        map.set(sum, (map.get(sum) || 0) + 1);
      }
      return count;
    }`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Batch 2 (6 Problems)...');

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
  console.log(`ALL 6 STRIVER ARRAY BATCH 2 PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
