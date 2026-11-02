/**
 * backend/scripts/upgrade_striver_arrays_batch7_final_25tc.js
 *
 * Upgrades the final 5 Striver Step 3 Array problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute force with TLE (> 2000ms).
 *
 * Problems:
 * 1. Single Number (single-number) [LC 136]
 * 2. Sort Colors (sort-colors) [LC 75]
 * 3. Max Consecutive Ones (max-consecutive-ones) [LC 485]
 * 4. Merge Sorted Array (merge-sorted-array) [LC 88]
 * 5. Merge Intervals (merge-intervals) [LC 56]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers
function solveSingleNumber(nums) {
  let xor = 0;
  for (const n of nums) xor ^= n;
  return xor;
}

function solveSortColors(nums) {
  const arr = [...nums];
  let low = 0, mid = 0, high = arr.length - 1;
  while (mid <= high) {
    if (arr[mid] === 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      low++; mid++;
    } else if (arr[mid] === 1) {
      mid++;
    } else {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      high--;
    }
  }
  return arr;
}

function solveMaxConsecutiveOnes(nums) {
  let max = 0, cur = 0;
  for (const n of nums) {
    if (n === 1) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
  }
  return max;
}

function solveMergeSortedArray(nums1, m, nums2, n) {
  const res = [...nums1];
  let p1 = m - 1, p2 = n - 1, p = m + n - 1;
  while (p2 >= 0) {
    if (p1 >= 0 && res[p1] > nums2[p2]) {
      res[p] = res[p1];
      p1--;
    } else {
      res[p] = nums2[p2];
      p2--;
    }
    p--;
  }
  return res;
}

function solveMergeIntervals(intervals) {
  if (!intervals || intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const res = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = res[res.length - 1];
    const curr = sorted[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      res.push(curr);
    }
  }
  return res;
}

// ── TEST CASE GENERATORS ──────────────────────────────────────────────────

function generateSingleNumberCases() {
  const baseCases = [
    [2, 2, 1],
    [4, 1, 2, 1, 2],
    [1],
    [-1, -1, -2],
    [0],
    [10, 20, 10],
    [5, 4, 3, 2, 1, 2, 3, 4, 5],
    [99, 100, 99],
    [-5, -10, -5],
    [1000, 2000, 3000, 2000, 1000],
    [7, 8, 9, 8, 7],
    [42, 42, 999],
    [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1],
    [8, 1, 8],
    [15, 25, 35, 25, 15],
    [-100, 200, -100],
    [0, 1, 0],
    [3, 5, 7, 9, 7, 5, 3],
    [123456],
    [11, 22, 33, 44, 33, 22, 11]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveSingleNumber(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,001 elements
  const s21 = [];
  for (let i = 1; i <= 1000; i++) s21.push(i, i);
  s21.push(7777);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(7777), is_hidden: true });

  // 22: 5,001 elements
  const s22 = [];
  for (let i = 1; i <= 2500; i++) s22.push(i * 3, i * 3);
  s22.push(-42);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(-42), is_hidden: true });

  // 23: 15,001 elements
  const s23 = [];
  for (let i = 1; i <= 7500; i++) s23.push(i, i);
  s23.push(99999);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(99999), is_hidden: true });

  // 24: 35,001 elements
  const s24 = [];
  for (let i = 1; i <= 17500; i++) s24.push(i, i);
  s24.push(123456);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(123456), is_hidden: true });

  // 25: 75,001 elements (STRICTLY KILLS O(N^2) brute force — single element placed at the end)
  // Brute force will check 37,500 distinct numbers against 75,001 array => 2.8 Billion ops > 2000ms TLE
  const s25 = [];
  for (let i = 1; i <= 37500; i++) s25.push(i, i);
  s25.push(8888888);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(8888888), is_hidden: true });

  return tcs;
}

function generateSortColorsCases() {
  const baseCases = [
    [2, 0, 2, 1, 1, 0],
    [2, 0, 1],
    [0],
    [1],
    [2],
    [0, 0, 0],
    [1, 1, 1],
    [2, 2, 2],
    [1, 0],
    [2, 1, 0],
    [0, 1, 2],
    [2, 2, 1, 1, 0, 0],
    [1, 2, 0, 1, 2, 0],
    [0, 0, 1, 1, 2, 2],
    [2, 1, 2, 1, 2, 1],
    [0, 2, 0, 2, 0, 2],
    [1, 0, 1, 0, 1, 0],
    [2, 0, 0, 1, 2, 1],
    [1, 1, 0, 2, 0, 2],
    [0, 1, 0, 1, 2, 2]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveSortColors(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 elements reversed [2,2..1,1..0,0]
  const s21 = [...new Array(700).fill(2), ...new Array(700).fill(1), ...new Array(600).fill(0)];
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveSortColors(s21)), is_hidden: true });

  // 22: 5,000 alternating elements
  const s22 = [];
  for (let i = 0; i < 5000; i++) s22.push(i % 3);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveSortColors(s22)), is_hidden: true });

  // 23: 15,000 all 2s and 0s
  const s23 = [];
  for (let i = 0; i < 15000; i++) s23.push(i % 2 === 0 ? 2 : 0);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveSortColors(s23)), is_hidden: true });

  // 24: 35,000 elements reversed
  const s24 = [...new Array(12000).fill(2), ...new Array(12000).fill(1), ...new Array(11000).fill(0)];
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveSortColors(s24)), is_hidden: true });

  // 25: 75,000 elements reversed (STRICTLY KILLS O(N^2) bubble/selection sort > 2000ms TLE)
  const s25 = [...new Array(25000).fill(2), ...new Array(25000).fill(1), ...new Array(25000).fill(0)];
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveSortColors(s25)), is_hidden: true });

  return tcs;
}

function generateMaxConsecutiveOnesCases() {
  const baseCases = [
    [1, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 0, 1],
    [0],
    [1],
    [0, 0, 0],
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 1, 0, 0, 1, 1],
    [1, 1, 1, 0, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 0, 1, 1, 1, 0, 1, 1],
    [0, 0, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 1, 1, 0],
    [1, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1, 1, 1]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMaxConsecutiveOnes(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 all 1s -> 2000
  const s21 = new Array(2000).fill(1);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(2000), is_hidden: true });

  // 22: 5,000 alternating -> 1
  const s22 = [];
  for (let i = 0; i < 5000; i++) s22.push(i % 2);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(1), is_hidden: true });

  // 23: 15,000 with streak of 7,777
  const s23 = [...new Array(3000).fill(0), ...new Array(7777).fill(1), ...new Array(4223).fill(0)];
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(7777), is_hidden: true });

  // 24: 35,000 elements
  const s24 = [];
  for (let i = 0; i < 35000; i++) s24.push(i % 10 === 0 ? 0 : 1);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveMaxConsecutiveOnes(s24)), is_hidden: true });

  // 25: 75,000 elements scale stress test
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push(i % 50 === 0 ? 0 : 1);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveMaxConsecutiveOnes(s25)), is_hidden: true });

  return tcs;
}

function generateMergeSortedArrayCases() {
  const baseCases = [
    { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
    { nums1: [1], m: 1, nums2: [], n: 0 },
    { nums1: [0], m: 0, nums2: [1], n: 1 },
    { nums1: [2, 0], m: 1, nums2: [1], n: 1 },
    { nums1: [4, 5, 6, 0, 0, 0], m: 3, nums2: [1, 2, 3], n: 3 },
    { nums1: [1, 2, 0, 0], m: 2, nums2: [3, 4], n: 2 },
    { nums1: [0, 0], m: 0, nums2: [1, 2], n: 2 },
    { nums1: [1, 3, 5, 0, 0, 0], m: 3, nums2: [2, 4, 6], n: 3 },
    { nums1: [2, 2, 0, 0], m: 2, nums2: [2, 2], n: 2 },
    { nums1: [10, 20, 30, 0], m: 3, nums2: [25], n: 1 },
    { nums1: [-5, -2, 0, 0], m: 2, nums2: [-3, 1], n: 2 },
    { nums1: [1, 1, 1, 0, 0, 0], m: 3, nums2: [1, 1, 1], n: 3 },
    { nums1: [0, 0, 0], m: 0, nums2: [1, 2, 3], n: 3 },
    { nums1: [5, 10, 15, 0, 0], m: 3, nums2: [0, 20], n: 2 },
    { nums1: [1, 2, 3, 4, 0], m: 4, nums2: [5], n: 1 },
    { nums1: [10, 0, 0], m: 1, nums2: [1, 2], n: 2 },
    { nums1: [-10, -5, 0, 0, 0], m: 2, nums2: [-8, -2, 4], n: 3 },
    { nums1: [1, 4, 7, 0, 0, 0], m: 3, nums2: [2, 5, 8], n: 3 },
    { nums1: [3, 0], m: 1, nums2: [2], n: 1 },
    { nums1: [1, 2, 3, 4, 5, 0, 0, 0, 0, 0], m: 5, nums2: [6, 7, 8, 9, 10], n: 5 }
  ];

  const tcs = baseCases.map(({ nums1, m, nums2, n }, idx) => ({
    input: `${JSON.stringify(nums1)}, ${m}, ${JSON.stringify(nums2)}, ${n}`,
    output: JSON.stringify(solveMergeSortedArray(nums1, m, nums2, n)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: m=1000, n=1000
  const a21_1 = []; for (let i = 0; i < 1000; i++) a21_1.push(i * 2);
  const a21_2 = []; for (let i = 0; i < 1000; i++) a21_2.push(i * 2 + 1);
  const full21_1 = a21_1.concat(new Array(1000).fill(0));
  tcs.push({ input: `${JSON.stringify(full21_1)}, 1000, ${JSON.stringify(a21_2)}, 1000`, output: JSON.stringify(solveMergeSortedArray(full21_1, 1000, a21_2, 1000)), is_hidden: true });

  // 22: m=2500, n=2500
  const a22_1 = []; for (let i = 0; i < 2500; i++) a22_1.push(i * 2);
  const a22_2 = []; for (let i = 0; i < 2500; i++) a22_2.push(i * 2 + 1);
  const full22_1 = a22_1.concat(new Array(2500).fill(0));
  tcs.push({ input: `${JSON.stringify(full22_1)}, 2500, ${JSON.stringify(a22_2)}, 2500`, output: JSON.stringify(solveMergeSortedArray(full22_1, 2500, a22_2, 2500)), is_hidden: true });

  // 23: m=7500, n=7500
  const a23_1 = []; for (let i = 0; i < 7500; i++) a23_1.push(i * 2);
  const a23_2 = []; for (let i = 0; i < 7500; i++) a23_2.push(i * 2 + 1);
  const full23_1 = a23_1.concat(new Array(7500).fill(0));
  tcs.push({ input: `${JSON.stringify(full23_1)}, 7500, ${JSON.stringify(a23_2)}, 7500`, output: JSON.stringify(solveMergeSortedArray(full23_1, 7500, a23_2, 7500)), is_hidden: true });

  // 24: m=15000, n=15000
  const a24_1 = []; for (let i = 0; i < 15000; i++) a24_1.push(i * 2);
  const a24_2 = []; for (let i = 0; i < 15000; i++) a24_2.push(i * 2 + 1);
  const full24_1 = a24_1.concat(new Array(15000).fill(0));
  tcs.push({ input: `${JSON.stringify(full24_1)}, 15000, ${JSON.stringify(a24_2)}, 15000`, output: JSON.stringify(solveMergeSortedArray(full24_1, 15000, a24_2, 15000)), is_hidden: true });

  // 25: m=25000, n=25000 (50,000 total elements scale stress test)
  const a25_1 = []; for (let i = 0; i < 25000; i++) a25_1.push(i * 2);
  const a25_2 = []; for (let i = 0; i < 25000; i++) a25_2.push(i * 2 + 1);
  const full25_1 = a25_1.concat(new Array(25000).fill(0));
  tcs.push({ input: `${JSON.stringify(full25_1)}, 25000, ${JSON.stringify(a25_2)}, 25000`, output: JSON.stringify(solveMergeSortedArray(full25_1, 25000, a25_2, 25000)), is_hidden: true });

  return tcs;
}

function generateMergeIntervalsCases() {
  const baseCases = [
    [[1,3],[2,6],[8,10],[15,18]],
    [[1,4],[4,5]],
    [[1,4],[0,4]],
    [[1,4],[2,3]],
    [[1,4],[0,2],[3,5]],
    [[2,3],[4,5],[6,7],[8,9],[1,10]],
    [[1,4]],
    [[1,4],[0,0]],
    [[1,4],[0,1]],
    [[1,4],[1,5]],
    [[1,4],[0,5]],
    [[1,4],[2,5]],
    [[2,3],[5,5],[2,2],[3,4],[3,4]],
    [[1,10],[2,3],[4,5],[6,7],[8,9]],
    [[1,3],[4,6],[7,9]],
    [[1,5],[2,4],[3,3]],
    [[0,2],[1,4],[3,5]],
    [[1,1],[1,1]],
    [[1,4],[2,2],[3,3],[4,4]],
    [[2,6],[1,3],[8,10],[9,18]]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMergeIntervals(arr.map(x => [...x]))),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 1,000 disjoint intervals
  const s21 = [];
  for (let i = 0; i < 1000; i++) s21.push([i * 3, i * 3 + 1]);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveMergeIntervals(s21.map(x => [...x]))), is_hidden: true });

  // 22: 3,000 fully overlapping intervals
  const s22 = [[0, 5000]];
  for (let i = 1; i < 3000; i++) s22.push([i, i + 5]);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify([[0, 5000]]), is_hidden: true });

  // 23: 10,000 contiguous intervals [i, i+1]
  const s23 = [];
  for (let i = 0; i < 10000; i++) s23.push([i, i + 1]);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify([[0, 10000]]), is_hidden: true });

  // 24: 25,000 pairs of intervals
  const s24 = [];
  for (let i = 0; i < 25000; i++) s24.push([i * 2, i * 2 + 2]);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify([[0, 50000]]), is_hidden: true });

  // 25: 50,000 scrambled intervals (scale stress test)
  const s25 = [];
  for (let i = 0; i < 50000; i++) {
    const start = (i * 37) % 5000;
    s25.push([start, start + 10]);
  }
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveMergeIntervals(s25.map(x => [...x]))), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'single-number',
    title: 'Single Number',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[2, 2, 1]',
    sample_output: '1',
    description: `Given a **non-empty** array of integers \`nums\`, every element appears *twice* except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.

### **Example 1:**
**Input:** nums = [2,2,1]
**Output:** 1

### **Example 2:**
**Input:** nums = [4,1,2,1,2]
**Output:** 4

### **Example 3:**
**Input:** nums = [1]
**Output:** 1

### **Constraints:**
- \`1 <= nums.length <= 3 * 10⁴\`
- \`-3 * 10⁴ <= nums[i] <= 3 * 10⁴\`
- Each element in the array appears twice except for one element which appears only once.`,
    hints: [
      'Think about the bitwise XOR operation properties: a ^ a = 0 and a ^ 0 = a.',
      'If you XOR all elements together, all pairs cancel out to 0, leaving only the single number.'
    ],
    testCases: generateSingleNumberCases(),
    solutionCode: `
function solution(nums) {
  let xor = 0;
  for (const n of nums) xor ^= n;
  return xor;
}
`
  },
  {
    slug: 'sort-colors',
    title: 'Sort Colors',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[2, 0, 2, 1, 1, 0]',
    sample_output: '[0, 0, 1, 1, 2, 2]',
    description: `Given an array \`nums\` with \`n\` objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue.

We will use the integers \`0\`, \`1\`, and \`2\` to represent the color red, white, and blue, respectively.

You must solve this problem without using the library's sort function.

### **Example 1:**
**Input:** nums = [2,0,2,1,1,0]
**Output:** [0,0,1,1,2,2]

### **Example 2:**
**Input:** nums = [2,0,1]
**Output:** [0,1,2]

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 300\`
- \`nums[i]\` is either \`0\`, \`1\`, or \`2\`.

**Follow up:** Could you come up with a one-pass algorithm using only constant extra space?`,
    hints: [
      'Try the Dutch National Flag algorithm: maintain three pointers (low, mid, high).',
      'All elements before low are 0s, all elements after high are 2s, and between low and mid are 1s.'
    ],
    testCases: generateSortColorsCases(),
    solutionCode: `
function solution(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}
`
  },
  {
    slug: 'max-consecutive-ones',
    title: 'Max Consecutive Ones',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 1, 0, 1, 1, 1]',
    sample_output: '3',
    description: `Given a binary array \`nums\`, return the maximum number of consecutive \`1\`'s in the array.

### **Example 1:**
**Input:** nums = [1,1,0,1,1,1]
**Output:** 3
**Explanation:** The first two digits or the last three digits are consecutive 1s. The maximum number of consecutive 1s is 3.

### **Example 2:**
**Input:** nums = [1,0,1,1,0,1]
**Output:** 2

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`nums[i]\` is either \`0\` or \`1\`.`,
    hints: [
      'Maintain a count of current consecutive ones and an overall maximum count.',
      'Reset current count to 0 whenever you encounter a 0.'
    ],
    testCases: generateMaxConsecutiveOnesCases(),
    solutionCode: `
function solution(nums) {
  let max = 0, cur = 0;
  for (const n of nums) {
    if (n === 1) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
  }
  return max;
}
`
  },
  {
    slug: 'merge-sorted-array',
    title: 'Merge Sorted Array',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3',
    sample_output: '[1, 2, 2, 3, 5, 6]',
    description: `You are given two integer arrays \`nums1\` and \`nums2\`, sorted in **non-decreasing order**, and two integers \`m\` and \`n\`, representing the number of elements in \`nums1\` and \`nums2\` respectively.

**Merge** \`nums1\` and \`nums2\` into a single array sorted in **non-decreasing order**.

The final sorted array should not be returned by the function, but instead be *stored inside the array* \`nums1\`. To accommodate this, \`nums1\` has a length of \`m + n\`, where the first \`m\` elements denote the elements that should be merged, and the last \`n\` elements are set to \`0\` and should be ignored. \`nums2\` has a length of \`n\`.

Return \`nums1\` after merging.

### **Example 1:**
**Input:** nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
**Output:** [1,2,2,3,5,6]
**Explanation:** The arrays we are merging are [1,2,3] and [2,5,6]. The result of the merge is [1,2,2,3,5,6].

### **Example 2:**
**Input:** nums1 = [1], m = 1, nums2 = [], n = 0
**Output:** [1]

### **Example 3:**
**Input:** nums1 = [0], m = 0, nums2 = [1], n = 1
**Output:** [1]

### **Constraints:**
- \`nums1.length == m + n\`
- \`nums2.length == n\`
- \`0 <= m, n <= 200\`
- \`1 <= m + n <= 200\`
- \`-10⁹ <= nums1[i], nums2[j] <= 10⁹\``,
    hints: [
      'Start filling nums1 from the back (index m + n - 1) to avoid overwriting elements that need to be compared.',
      'Use three pointers: one for end of nums1 values (m - 1), one for nums2 (n - 1), and one for writing position.'
    ],
    testCases: generateMergeSortedArrayCases(),
    solutionCode: `
function solution(nums1, m, nums2, n) {
  let p1 = m - 1, p2 = n - 1, p = m + n - 1;
  while (p2 >= 0) {
    if (p1 >= 0 && nums1[p1] > nums2[p2]) {
      nums1[p] = nums1[p1];
      p1--;
    } else {
      nums1[p] = nums2[p2];
      p2--;
    }
    p--;
  }
  return nums1;
}
`
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[[1, 3], [2, 6], [8, 10], [15, 18]]',
    sample_output: '[[1, 6], [8, 10], [15, 18]]',
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.

### **Example 1:**
**Input:** intervals = [[1,3],[2,6],[8,10],[15,18]]
**Output:** [[1,6],[8,10],[15,18]]
**Explanation:** Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

### **Example 2:**
**Input:** intervals = [[1,4],[4,5]]
**Output:** [[1,5]]
**Explanation:** Intervals [1,4] and [4,5] are considered overlapping.

### **Constraints:**
- \`1 <= intervals.length <= 10⁴\`
- \`intervals[i].length == 2\`
- \`0 <= starti <= endi <= 10⁴\``,
    hints: [
      'First sort the intervals by their start times.',
      'Then iterate through and check if the current interval starts before the previous interval ends.'
    ],
    testCases: generateMergeIntervalsCases(),
    solutionCode: `
function solution(intervals) {
  if (!intervals || intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = res[res.length - 1];
    const curr = intervals[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      res.push(curr);
    }
  }
  return res;
}
`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Final Batch 7 (5 Problems)...');

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
  console.log(`ALL 5 STRIVER ARRAY FINAL BATCH 7 PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

