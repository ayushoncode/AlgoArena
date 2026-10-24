/**
 * seed_striver_bs_batch1_25tc.js
 * Seeds and validates the first 5 Striver A2Z Binary Search problems (Step 4.1: BS on 1D Arrays)
 * with exactly 25 test cases each.
 *
 * Problems:
 * 1. Binary Search (binary-search)
 * 2. Implement Lower Bound (lower-bound)
 * 3. Implement Upper Bound (upper-bound)
 * 4. Search Insert Position (search-insert-position)
 * 5. Find First and Last Position of Element in Sorted Array (find-first-and-last-position-of-element-in-sorted-array)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Binary Search TCs (25)
// ─────────────────────────────────────────────────────────────────────────────
function generateBinarySearchTCs() {
  const tcs = [
    { input: '[-1, 0, 3, 5, 9, 12], 9', output: '4', is_hidden: false },
    { input: '[-1, 0, 3, 5, 9, 12], 2', output: '-1', is_hidden: false },
    { input: '[5], 5', output: '0', is_hidden: false },
    { input: '[5], -5', output: '-1', is_hidden: true },
    { input: '[1, 3], 1', output: '0', is_hidden: true },
    { input: '[1, 3], 3', output: '1', is_hidden: true },
    { input: '[1, 3], 2', output: '-1', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], -10', output: '0', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], 10', output: '4', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], 0', output: '2', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], 7', output: '-1', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14, 16], 12', output: '5', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14, 16], 1', output: '-1', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14, 16], 20', output: '-1', is_hidden: true },
    { input: '[-100, -50, -25, 0, 25, 50, 100], -50', output: '1', is_hidden: true },
    { input: '[-100, -50, -25, 0, 25, 50, 100], 50', output: '5', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 90', output: '8', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 45', output: '-1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 1', output: '0', is_hidden: true },
    { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 15', output: '14', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items, target present at 450
  const s21 = Array.from({ length: 1000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s21)}, 900`, output: '450', is_hidden: true });

  // 22: 1000 items, target missing (odd number)
  tcs.push({ input: `${JSON.stringify(s21)}, 901`, output: '-1', is_hidden: true });

  // 23: 5000 items, target at first index
  const s23 = Array.from({ length: 5000 }, (_, i) => i * 3 - 5000);
  tcs.push({ input: `${JSON.stringify(s23)}, -5000`, output: '0', is_hidden: true });

  // 24: 10000 items, target at last index
  const s24 = Array.from({ length: 10000 }, (_, i) => i * 5);
  tcs.push({ input: `${JSON.stringify(s24)}, ${9999 * 5}`, output: '9999', is_hidden: true });

  // 25: 20000 items, target missing beyond range
  const s25 = Array.from({ length: 20000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s25)}, 999999`, output: '-1', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Implement Lower Bound TCs (25)
// ─────────────────────────────────────────────────────────────────────────────
function generateLowerBoundTCs() {
  const tcs = [
    { input: '[1, 2, 8, 10, 11, 12, 19], 5', output: '2', is_hidden: false },
    { input: '[3, 5, 8, 15, 19], 9', output: '3', is_hidden: false },
    { input: '[3, 5, 8, 15, 19], 16', output: '4', is_hidden: false },
    { input: '[3, 5, 8, 15, 19], 2', output: '0', is_hidden: true },
    { input: '[3, 5, 8, 15, 19], 20', output: '5', is_hidden: true },
    { input: '[2, 3, 7, 10, 11, 11, 25], 11', output: '4', is_hidden: true },
    { input: '[2, 3, 7, 10, 11, 11, 25], 1', output: '0', is_hidden: true },
    { input: '[2, 3, 7, 10, 11, 11, 25], 26', output: '7', is_hidden: true },
    { input: '[5], 5', output: '0', is_hidden: true },
    { input: '[5], 4', output: '0', is_hidden: true },
    { input: '[5], 6', output: '1', is_hidden: true },
    { input: '[1, 1, 1, 1, 1], 1', output: '0', is_hidden: true },
    { input: '[1, 1, 1, 1, 1], 2', output: '5', is_hidden: true },
    { input: '[1, 1, 1, 1, 1], 0', output: '0', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], -5', output: '1', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], -7', output: '1', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], 11', output: '5', is_hidden: true },
    { input: '[10, 20, 30, 40, 50], 35', output: '3', is_hidden: true },
    { input: '[10, 20, 30, 40, 50], 40', output: '3', is_hidden: true },
    { input: '[1, 2, 4, 4, 4, 5, 6, 7], 4', output: '2', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items, target in middle
  const s21 = Array.from({ length: 1000 }, (_, i) => i * 4);
  tcs.push({ input: `${JSON.stringify(s21)}, 802`, output: '201', is_hidden: true });

  // 22: 2000 items, all equal
  const s22 = new Array(2000).fill(50);
  tcs.push({ input: `${JSON.stringify(s22)}, 50`, output: '0', is_hidden: true });

  // 23: 5000 items, target smaller than all
  const s23 = Array.from({ length: 5000 }, (_, i) => i * 2 + 10);
  tcs.push({ input: `${JSON.stringify(s23)}, 5`, output: '0', is_hidden: true });

  // 24: 10000 items, target larger than all
  const s24 = Array.from({ length: 10000 }, (_, i) => i * 3);
  tcs.push({ input: `${JSON.stringify(s24)}, 999999`, output: '10000', is_hidden: true });

  // 25: 20000 items, target exact match at last element
  const s25 = Array.from({ length: 20000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s25)}, ${19999 * 2}`, output: '19999', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Implement Upper Bound TCs (25)
// ─────────────────────────────────────────────────────────────────────────────
function generateUpperBoundTCs() {
  const tcs = [
    { input: '[2, 3, 6, 7, 8, 8, 11, 11, 12], 6', output: '3', is_hidden: false },
    { input: '[1, 2, 5, 6, 10], 5', output: '3', is_hidden: false },
    { input: '[1, 2, 5, 6, 10], 10', output: '5', is_hidden: false },
    { input: '[1, 2, 5, 6, 10], 0', output: '0', is_hidden: true },
    { input: '[1, 2, 5, 6, 10], 20', output: '5', is_hidden: true },
    { input: '[3, 5, 8, 9, 15, 19], 9', output: '4', is_hidden: true },
    { input: '[3, 5, 8, 9, 15, 19], 8', output: '3', is_hidden: true },
    { input: '[2, 2, 2, 2, 2], 2', output: '5', is_hidden: true },
    { input: '[2, 2, 2, 2, 2], 1', output: '0', is_hidden: true },
    { input: '[2, 2, 2, 2, 2], 3', output: '5', is_hidden: true },
    { input: '[7], 7', output: '1', is_hidden: true },
    { input: '[7], 5', output: '0', is_hidden: true },
    { input: '[7], 9', output: '1', is_hidden: true },
    { input: '[-15, -10, -5, 0, 5, 10], -5', output: '3', is_hidden: true },
    { input: '[-15, -10, -5, 0, 5, 10], -20', output: '0', is_hidden: true },
    { input: '[-15, -10, -5, 0, 5, 10], 15', output: '6', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60, 70], 35', output: '3', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60, 70], 40', output: '4', is_hidden: true },
    { input: '[1, 3, 5, 5, 5, 7, 9], 5', output: '5', is_hidden: true },
    { input: '[1, 3, 5, 5, 5, 7, 9], 6', output: '5', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items, target in middle
  const s21 = Array.from({ length: 1000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: '251', is_hidden: true });

  // 22: 2000 items, all equal 100
  const s22 = new Array(2000).fill(100);
  tcs.push({ input: `${JSON.stringify(s22)}, 100`, output: '2000', is_hidden: true });

  // 23: 5000 items, target smaller than all
  const s23 = Array.from({ length: 5000 }, (_, i) => i * 3 + 20);
  tcs.push({ input: `${JSON.stringify(s23)}, 10`, output: '0', is_hidden: true });

  // 24: 10000 items, target larger than all
  const s24 = Array.from({ length: 10000 }, (_, i) => i * 5);
  tcs.push({ input: `${JSON.stringify(s24)}, 999999`, output: '10000', is_hidden: true });

  // 25: 20000 items, target exact match at last element
  const s25 = Array.from({ length: 20000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s25)}, ${19999 * 2}`, output: '20000', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Search Insert Position TCs (25)
// ─────────────────────────────────────────────────────────────────────────────
function generateSearchInsertPositionTCs() {
  const tcs = [
    { input: '[1, 3, 5, 6], 5', output: '2', is_hidden: false },
    { input: '[1, 3, 5, 6], 2', output: '1', is_hidden: false },
    { input: '[1, 3, 5, 6], 7', output: '4', is_hidden: false },
    { input: '[1, 3, 5, 6], 0', output: '0', is_hidden: true },
    { input: '[1], 0', output: '0', is_hidden: true },
    { input: '[1], 1', output: '0', is_hidden: true },
    { input: '[1], 2', output: '1', is_hidden: true },
    { input: '[1, 3], 2', output: '1', is_hidden: true },
    { input: '[1, 3], 4', output: '2', is_hidden: true },
    { input: '[1, 3], 0', output: '0', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], -5', output: '1', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], -20', output: '0', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], 20', output: '5', is_hidden: true },
    { input: '[-10, -5, 0, 5, 10], 3', output: '3', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14], 8', output: '3', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14], 9', output: '4', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14], 1', output: '0', is_hidden: true },
    { input: '[2, 4, 6, 8, 10, 12, 14], 15', output: '7', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60], 25', output: '2', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60], 55', output: '5', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items, target in middle
  const s21 = Array.from({ length: 1000 }, (_, i) => i * 4);
  tcs.push({ input: `${JSON.stringify(s21)}, 801`, output: '201', is_hidden: true });

  // 22: 2500 items, target exact match
  const s22 = Array.from({ length: 2500 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s22)}, 2000`, output: '1000', is_hidden: true });

  // 23: 5000 items, target before all
  const s23 = Array.from({ length: 5000 }, (_, i) => i * 3 + 100);
  tcs.push({ input: `${JSON.stringify(s23)}, 10`, output: '0', is_hidden: true });

  // 24: 10000 items, target after all
  const s24 = Array.from({ length: 10000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s24)}, 999999`, output: '10000', is_hidden: true });

  // 25: 20000 items, target in second half
  const s25 = Array.from({ length: 20000 }, (_, i) => i * 3);
  tcs.push({ input: `${JSON.stringify(s25)}, 30001`, output: '10001', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Find First and Last Position TCs (25)
// ─────────────────────────────────────────────────────────────────────────────
function generateFirstAndLastPositionTCs() {
  const tcs = [
    { input: '[5, 7, 7, 8, 8, 10], 8', output: '[3,4]', is_hidden: false },
    { input: '[5, 7, 7, 8, 8, 10], 6', output: '[-1,-1]', is_hidden: false },
    { input: '[], 0', output: '[-1,-1]', is_hidden: false },
    { input: '[1], 1', output: '[0,0]', is_hidden: true },
    { input: '[1], 2', output: '[-1,-1]', is_hidden: true },
    { input: '[2, 2], 2', output: '[0,1]', is_hidden: true },
    { input: '[2, 2], 3', output: '[-1,-1]', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 3', output: '[2,2]', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 1', output: '[0,0]', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 5', output: '[4,4]', is_hidden: true },
    { input: '[3, 3, 3, 3, 3], 3', output: '[0,4]', is_hidden: true },
    { input: '[3, 3, 3, 3, 3], 4', output: '[-1,-1]', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 5, 10], -5', output: '[1,3]', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 5, 10], 0', output: '[4,4]', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 5, 10], 11', output: '[-1,-1]', is_hidden: true },
    { input: '[1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 3', output: '[4,5]', is_hidden: true },
    { input: '[1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 1', output: '[0,1]', is_hidden: true },
    { input: '[1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 5', output: '[8,9]', is_hidden: true },
    { input: '[1, 2, 3, 3, 3, 3, 3, 4, 5], 3', output: '[2,6]', is_hidden: true },
    { input: '[1, 2, 3, 3, 3, 3, 3, 4, 5], 6', output: '[-1,-1]', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items, target spans middle 100 items [400, 499]
  const s21 = [];
  for (let i = 0; i < 400; i++) s21.push(i);
  for (let i = 0; i < 100; i++) s21.push(400);
  for (let i = 0; i < 500; i++) s21.push(401 + i);
  tcs.push({ input: `${JSON.stringify(s21)}, 400`, output: '[400,499]', is_hidden: true });

  // 22: 2000 items, all equal 7
  const s22 = new Array(2000).fill(7);
  tcs.push({ input: `${JSON.stringify(s22)}, 7`, output: '[0,1999]', is_hidden: true });

  // 23: 5000 items, target not present
  const s23 = Array.from({ length: 5000 }, (_, i) => i * 2);
  tcs.push({ input: `${JSON.stringify(s23)}, 2501`, output: '[-1,-1]', is_hidden: true });

  // 24: 10000 items, single target at index 0
  const s24 = [0, ...Array.from({ length: 9999 }, (_, i) => i + 5)];
  tcs.push({ input: `${JSON.stringify(s24)}, 0`, output: '[0,0]', is_hidden: true });

  // 25: 20000 items, target spans last 500 elements [19500, 19999]
  const s25 = Array.from({ length: 19500 }, (_, i) => i);
  for (let i = 0; i < 500; i++) s25.push(99999);
  tcs.push({ input: `${JSON.stringify(s25)}, 99999`, output: '[19500,19999]', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  // 1. Binary Search
  {
    title: 'Binary Search',
    slug: 'binary-search',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[-1,0,3,5,9,12], 9',
    sample_output: '4',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [-1,0,3,5,9,12], target = 9
**Output:** 4
**Explanation:** 9 exists in nums and its index is 4

### **Example 2:**
**Input:** nums = [-1,0,3,5,9,12], target = 2
**Output:** -1
**Explanation:** 2 does not exist in nums so return -1

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`-10⁴ < nums[i], target < 10⁴\`
- All the integers in \`nums\` are **unique**.
- \`nums\` is sorted in ascending order.`,
    hints: [
      'Maintain search range [low, high]. Initially low = 0 and high = nums.length - 1.',
      'Compute mid = Math.floor((low + high) / 2). If nums[mid] === target, return mid.',
      'If nums[mid] < target, search right half (low = mid + 1), else search left half (high = mid - 1).'
    ],
    testCases: generateBinarySearchTCs(),
    solutionCode: `
function solution(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
`
  },

  // 2. Implement Lower Bound
  {
    title: 'Implement Lower Bound',
    slug: 'lower-bound',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[1, 2, 8, 10, 11, 12, 19], 5',
    sample_output: '2',
    description: `Given a sorted array of integers \`nums\` and an integer \`target\`, find the **Lower Bound** of \`target\`.

The **Lower Bound** is defined as the smallest index \`i\` such that \`nums[i] >= target\`.
If all elements in the array are strictly smaller than \`target\`, return \`nums.length\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [1, 2, 8, 10, 11, 12, 19], target = 5
**Output:** 2
**Explanation:** nums[2] = 8 is the first element greater than or equal to 5.

### **Example 2:**
**Input:** nums = [3, 5, 8, 15, 19], target = 9
**Output:** 3
**Explanation:** nums[3] = 15 is the first element greater than or equal to 9.

### **Example 3:**
**Input:** nums = [3, 5, 8, 15, 19], target = 20
**Output:** 5
**Explanation:** No element in nums is >= 20, so return nums.length (5).

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-10⁹ <= nums[i], target <= 10⁹\`
- \`nums\` is sorted in non-decreasing order.`,
    hints: [
      'Initialize ans = nums.length, low = 0, high = nums.length - 1.',
      'Calculate mid = Math.floor((low + high) / 2).',
      'If nums[mid] >= target, mid is a candidate answer: ans = mid, high = mid - 1.',
      'Otherwise low = mid + 1.'
    ],
    testCases: generateLowerBoundTCs(),
    solutionCode: `
function solution(nums, target) {
  let low = 0, high = nums.length - 1;
  let ans = nums.length;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] >= target) {
      ans = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return ans;
}
`
  },

  // 3. Implement Upper Bound
  {
    title: 'Implement Upper Bound',
    slug: 'upper-bound',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[2, 3, 6, 7, 8, 8, 11, 11, 12], 6',
    sample_output: '3',
    description: `Given a sorted array of integers \`nums\` and an integer \`target\`, find the **Upper Bound** of \`target\`.

The **Upper Bound** is defined as the smallest index \`i\` such that \`nums[i] > target\`.
If all elements in the array are less than or equal to \`target\`, return \`nums.length\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [2, 3, 6, 7, 8, 8, 11, 11, 12], target = 6
**Output:** 3
**Explanation:** nums[3] = 7 is the first element strictly greater than 6.

### **Example 2:**
**Input:** nums = [1, 2, 5, 6, 10], target = 5
**Output:** 3
**Explanation:** nums[3] = 6 is the first element strictly greater than 5.

### **Example 3:**
**Input:** nums = [1, 2, 5, 6, 10], target = 10
**Output:** 5
**Explanation:** No element in nums is > 10, so return nums.length (5).

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-10⁹ <= nums[i], target <= 10⁹\`
- \`nums\` is sorted in non-decreasing order.`,
    hints: [
      'Initialize ans = nums.length, low = 0, high = nums.length - 1.',
      'Calculate mid = Math.floor((low + high) / 2).',
      'If nums[mid] > target, mid could be our upper bound: ans = mid, high = mid - 1.',
      'Otherwise, we need larger values, so low = mid + 1.'
    ],
    testCases: generateUpperBoundTCs(),
    solutionCode: `
function solution(nums, target) {
  let low = 0, high = nums.length - 1;
  let ans = nums.length;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] > target) {
      ans = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return ans;
}
`
  },

  // 4. Search Insert Position
  {
    title: 'Search Insert Position',
    slug: 'search-insert-position',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[1, 3, 5, 6], 5',
    sample_output: '2',
    description: `Given a sorted array of distinct integers \`nums\` and a target value \`target\`, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [1,3,5,6], target = 5
**Output:** 2

### **Example 2:**
**Input:** nums = [1,3,5,6], target = 2
**Output:** 1

### **Example 3:**
**Input:** nums = [1,3,5,6], target = 7
**Output:** 4

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`-10⁴ <= nums[i], target <= 10⁴\`
- \`nums\` contains **distinct** values sorted in ascending order.`,
    hints: [
      'This problem is identical to finding the Lower Bound in a sorted array of distinct integers.',
      'Search for the first index where nums[index] >= target.',
      'If target is greater than all elements, return nums.length.'
    ],
    testCases: generateSearchInsertPositionTCs(),
    solutionCode: `
function solution(nums, target) {
  let low = 0, high = nums.length - 1;
  let ans = nums.length;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] >= target) {
      ans = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return ans;
}
`
  },

  // 5. Find First and Last Position of Element in Sorted Array
  {
    title: 'Find First and Last Position of Element in Sorted Array',
    slug: 'find-first-and-last-position-of-element-in-sorted-array',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[5, 7, 7, 8, 8, 10], 8',
    sample_output: '[3,4]',
    description: `Given an array of integers \`nums\` sorted in non-decreasing order, find the starting and ending position of a given \`target\` value.

If \`target\` is not found in the array, return \`[-1, -1]\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [5,7,7,8,8,10], target = 8
**Output:** [3,4]

### **Example 2:**
**Input:** nums = [5,7,7,8,8,10], target = 6
**Output:** [-1,-1]

### **Example 3:**
**Input:** nums = [], target = 0
**Output:** [-1,-1]

### **Constraints:**
- \`0 <= nums.length <= 10⁵\`
- \`-10⁹ <= nums[i], target <= 10⁹\`
- \`nums\` is a non-decreasing array.`,
    hints: [
      'Use binary search twice: once to find the first occurrence, and once to find the last occurrence.',
      'For first occurrence: when nums[mid] === target, record mid and continue searching left (high = mid - 1).',
      'For last occurrence: when nums[mid] === target, record mid and continue searching right (low = mid + 1).'
    ],
    testCases: generateFirstAndLastPositionTCs(),
    solutionCode: `
function solution(nums, target) {
  function findFirst(arr, x) {
    let low = 0, high = arr.length - 1, res = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (arr[mid] === x) {
        res = mid;
        high = mid - 1;
      } else if (arr[mid] < x) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return res;
  }
  function findLast(arr, x) {
    let low = 0, high = arr.length - 1, res = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (arr[mid] === x) {
        res = mid;
        low = mid + 1;
      } else if (arr[mid] < x) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return res;
  }
  const first = findFirst(nums, target);
  if (first === -1) return [-1, -1];
  const last = findLast(nums, target);
  return [first, last];
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 1 (5 Problems)...');

  for (const prob of PROBLEMS) {
    console.log(`\n========================================\n[Problem] Processing: ${prob.title} (${prob.slug})`);

    // 1. Check or Insert into problems table
    let problemId;
    const { rows: existing } = await db.query('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (existing[0]) {
      problemId = existing[0].id;
      console.log(`  -> Found existing in DB with ID: ${problemId}. Updating fields...`);
      await db.query(
        `UPDATE problems
         SET title = $1, topic = $2, difficulty = $3, description = $4, hints = $5,
             sample_input = $6, sample_output = $7
         WHERE id = $8`,
        [prob.title, prob.topic, prob.difficulty, prob.description, JSON.stringify(prob.hints), prob.sample_input, prob.sample_output, problemId]
      );
    } else {
      console.log(`  -> Inserting new problem into DB...`);
      const { rows: inserted } = await db.query(
        `INSERT INTO problems (title, slug, topic, difficulty, description, hints, sample_input, sample_output)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [prob.title, prob.slug, prob.topic, prob.difficulty, prob.description, JSON.stringify(prob.hints), prob.sample_input, prob.sample_output]
      );
      problemId = inserted[0].id;
      console.log(`  -> Inserted with ID: ${problemId}`);
    }

    // 2. Wipe existing test cases and insert 25 verified test cases
    await db.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
    console.log(`  -> Inserting ${prob.testCases.length} test cases...`);

    for (const tc of prob.testCases) {
      await db.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }

    // 3. Verify count
    const { rows: countRows } = await db.query('SELECT count(*) FROM test_cases WHERE problem_id = $1', [problemId]);
    console.log(`  -> Verified in DB: count = ${countRows[0].count} test cases.`);

    // 4. Run real evaluation via backend judge
    const evalResult = await evaluateSubmission(problemId, prob.solutionCode, 'javascript');
    console.log(`  -> Judge Verdict: ${evalResult.verdict} (${evalResult.passedTests}/${evalResult.totalTests} tests passed in ${evalResult.runtimeMs}ms)`);

    if (evalResult.verdict !== 'ACCEPTED' || evalResult.passedTests !== 25) {
      console.error(`  [ERROR] Problem ${prob.title} failed validation!`);
      const failed = evalResult.testResults.find(t => !t.passed);
      console.error('  First failed test:', failed);
      process.exit(1);
    } else {
      console.log(`  -> SUCCESS! 25/25 ACCEPTED for ${prob.title}`);
    }
  }

  console.log('\n========================================\nALL 5 BINARY SEARCH PROBLEMS SEEDED & VALIDATED WITH 25/25 ACCEPTED!\n');
  process.exit(0);
}

seedAndVerify().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
