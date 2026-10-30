/**
 * seed_striver_bs_batch2_25tc.js
 * Seeds and validates the next 5 Striver A2Z Binary Search problems (Step 4.1: BS on 1D Arrays)
 * with exactly 25 test cases each.
 *
 * Problems:
 * 1. Floor and Ceil in Sorted Array (floor-and-ceil-in-sorted-array)
 * 2. Count Occurrences in Sorted Array (count-occurrences-in-sorted-array)
 * 3. Search in Rotated Sorted Array (search-in-rotated-sorted-array)
 * 4. Search in Rotated Sorted Array II (search-in-rotated-sorted-array-ii)
 * 5. Find Minimum in Rotated Sorted Array (find-minimum-in-rotated-sorted-array)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Floor and Ceil in Sorted Array (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFloorCeilTCs() {
  const tcs = [
    { input: '[3, 4, 7, 8, 8, 10], 5', output: '[4, 7]', is_hidden: false },
    { input: '[3, 4, 7, 8, 8, 10], 2', output: '[-1, 3]', is_hidden: false },
    { input: '[3, 4, 7, 8, 8, 10], 11', output: '[10, -1]', is_hidden: false },
    { input: '[5], 5', output: '[5, 5]', is_hidden: true },
    { input: '[5], 4', output: '[-1, 5]', is_hidden: true },
    { input: '[5], 6', output: '[5, -1]', is_hidden: true },
    { input: '[1, 3], 2', output: '[1, 3]', is_hidden: true },
    { input: '[1, 3], 1', output: '[1, 1]', is_hidden: true },
    { input: '[1, 3], 3', output: '[3, 3]', is_hidden: true },
    { input: '[2, 4, 6, 8, 10], 6', output: '[6, 6]', is_hidden: true },
    { input: '[2, 4, 6, 8, 10], 7', output: '[6, 8]', is_hidden: true },
    { input: '[2, 4, 6, 8, 10], 1', output: '[-1, 2]', is_hidden: true },
    { input: '[2, 4, 6, 8, 10], 12', output: '[10, -1]', is_hidden: true },
    { input: '[10, 20, 30, 40, 50], 25', output: '[20, 30]', is_hidden: true },
    { input: '[10, 20, 30, 40, 50], 10', output: '[10, 10]', is_hidden: true },
    { input: '[10, 20, 30, 40, 50], 50', output: '[50, 50]', is_hidden: true },
    { input: '[1, 2, 8, 10, 10, 12, 19], 0', output: '[-1, 1]', is_hidden: true },
    { input: '[1, 2, 8, 10, 10, 12, 19], 10', output: '[10, 10]', is_hidden: true },
    { input: '[1, 2, 8, 10, 10, 12, 19], 11', output: '[10, 12]', is_hidden: true },
    { input: '[1, 2, 8, 10, 10, 12, 19], 20', output: '[19, -1]', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: large array (500 items, all even numbers 2..1000), target 501
  const s21 = Array.from({ length: 500 }, (_, i) => (i + 1) * 2);
  tcs.push({ input: `${JSON.stringify(s21)}, 501`, output: '[500, 502]', is_hidden: true });

  // 22: target exactly present at 800
  tcs.push({ input: `${JSON.stringify(s21)}, 800`, output: '[800, 800]', is_hidden: true });

  // 23: target smaller than minimum
  tcs.push({ input: `${JSON.stringify(s21)}, 1`, output: '[-1, 2]', is_hidden: true });

  // 24: target larger than maximum
  tcs.push({ input: `${JSON.stringify(s21)}, 1005`, output: '[1000, -1]', is_hidden: true });

  // 25: 1000 items with repeated values
  const s25 = [];
  for (let i = 1; i <= 200; i++) {
    s25.push(i, i, i, i, i);
  }
  tcs.push({ input: `${JSON.stringify(s25)}, 150`, output: '[150, 150]', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Count Occurrences in Sorted Array (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateCountOccurrencesTCs() {
  const tcs = [
    { input: '[1, 1, 2, 2, 2, 2, 3], 2', output: '4', is_hidden: false },
    { input: '[1, 1, 2, 2, 2, 2, 3], 4', output: '0', is_hidden: false },
    { input: '[8, 9, 10, 12, 12, 12], 12', output: '3', is_hidden: false },
    { input: '[], 5', output: '0', is_hidden: true },
    { input: '[5], 5', output: '1', is_hidden: true },
    { input: '[5], 6', output: '0', is_hidden: true },
    { input: '[2, 2, 2, 2, 2], 2', output: '5', is_hidden: true },
    { input: '[2, 2, 2, 2, 2], 3', output: '0', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 3', output: '1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 1', output: '1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 5', output: '1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5], 6', output: '0', is_hidden: true },
    { input: '[1, 3, 3, 3, 5, 7, 9], 3', output: '3', is_hidden: true },
    { input: '[1, 3, 3, 3, 5, 7, 9], 1', output: '1', is_hidden: true },
    { input: '[1, 3, 3, 3, 5, 7, 9], 9', output: '1', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 0, 5], -5', output: '3', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 0, 5], 0', output: '2', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 0, 5], -10', output: '1', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 0, 5], 5', output: '1', is_hidden: true },
    { input: '[-10, -5, -5, -5, 0, 0, 5], 100', output: '0', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items, all same value
  const s21 = new Array(1000).fill(7);
  tcs.push({ input: `${JSON.stringify(s21)}, 7`, output: '1000', is_hidden: true });

  // 22: 1000 items, target not present
  tcs.push({ input: `${JSON.stringify(s21)}, 8`, output: '0', is_hidden: true });

  // 23: 1000 items, target appears 50 times in the middle
  const s23 = [];
  for (let i = 0; i < 400; i++) s23.push(1);
  for (let i = 0; i < 50; i++) s23.push(2);
  for (let i = 0; i < 550; i++) s23.push(3);
  tcs.push({ input: `${JSON.stringify(s23)}, 2`, output: '50', is_hidden: true });

  // 24: target at the very end
  tcs.push({ input: `${JSON.stringify(s23)}, 3`, output: '550', is_hidden: true });

  // 25: target at the very start
  tcs.push({ input: `${JSON.stringify(s23)}, 1`, output: '400', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Search in Rotated Sorted Array (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSearchRotatedTCs() {
  const tcs = [
    { input: '[4,5,6,7,0,1,2], 0', output: '4', is_hidden: false },
    { input: '[4,5,6,7,0,1,2], 3', output: '-1', is_hidden: false },
    { input: '[1], 0', output: '-1', is_hidden: false },
    { input: '[1], 1', output: '0', is_hidden: true },
    { input: '[1, 3], 3', output: '1', is_hidden: true },
    { input: '[3, 1], 1', output: '1', is_hidden: true },
    { input: '[3, 1], 3', output: '0', is_hidden: true },
    { input: '[3, 1], 2', output: '-1', is_hidden: true },
    { input: '[5, 1, 3], 5', output: '0', is_hidden: true },
    { input: '[5, 1, 3], 1', output: '1', is_hidden: true },
    { input: '[5, 1, 3], 3', output: '2', is_hidden: true },
    { input: '[5, 1, 3], 0', output: '-1', is_hidden: true },
    { input: '[4, 5, 6, 7, 8, 1, 2, 3], 8', output: '4', is_hidden: true },
    { input: '[4, 5, 6, 7, 8, 1, 2, 3], 1', output: '5', is_hidden: true },
    { input: '[4, 5, 6, 7, 8, 1, 2, 3], 4', output: '0', is_hidden: true },
    { input: '[4, 5, 6, 7, 8, 1, 2, 3], 3', output: '7', is_hidden: true },
    { input: '[4, 5, 6, 7, 8, 1, 2, 3], 9', output: '-1', is_hidden: true },
    { input: '[6, 7, 1, 2, 3, 4, 5], 6', output: '0', is_hidden: true },
    { input: '[6, 7, 1, 2, 3, 4, 5], 5', output: '6', is_hidden: true },
    { input: '[6, 7, 1, 2, 3, 4, 5], 2', output: '3', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items rotated at 400
  const orig = Array.from({ length: 1000 }, (_, i) => i * 2);
  const s21 = orig.slice(400).concat(orig.slice(0, 400));
  // element 800 was orig[400], now at index 0
  tcs.push({ input: `${JSON.stringify(s21)}, 800`, output: '0', is_hidden: true });

  // 22: element 0 was orig[0], now at index 600
  tcs.push({ input: `${JSON.stringify(s21)}, 0`, output: '600', is_hidden: true });

  // 23: element 1998 was orig[999], now at index 599
  tcs.push({ input: `${JSON.stringify(s21)}, 1998`, output: '599', is_hidden: true });

  // 24: element not in array
  tcs.push({ input: `${JSON.stringify(s21)}, 501`, output: '-1', is_hidden: true });

  // 25: negative numbers rotated
  const neg = [-100, -50, -20, -10, -5, 0, 5, 10, 20, 50];
  const s25 = neg.slice(6).concat(neg.slice(0, 6)); // [5, 10, 20, 50, -100, -50, -20, -10, -5, 0]
  tcs.push({ input: `${JSON.stringify(s25)}, -20`, output: '6', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Search in Rotated Sorted Array II (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSearchRotatedIITCs() {
  const tcs = [
    { input: '[2,5,6,0,0,1,2], 0', output: 'true', is_hidden: false },
    { input: '[2,5,6,0,0,1,2], 3', output: 'false', is_hidden: false },
    { input: '[1,0,1,1,1], 0', output: 'true', is_hidden: false },
    { input: '[1], 1', output: 'true', is_hidden: true },
    { input: '[1], 2', output: 'false', is_hidden: true },
    { input: '[1, 1, 1, 1, 1], 1', output: 'true', is_hidden: true },
    { input: '[1, 1, 1, 1, 1], 2', output: 'false', is_hidden: true },
    { input: '[1, 1, 1, 2, 1], 2', output: 'true', is_hidden: true },
    { input: '[1, 2, 1, 1, 1], 2', output: 'true', is_hidden: true },
    { input: '[1, 1, 2, 1, 1], 2', output: 'true', is_hidden: true },
    { input: '[3, 1, 1], 3', output: 'true', is_hidden: true },
    { input: '[3, 1, 1], 1', output: 'true', is_hidden: true },
    { input: '[3, 1, 1], 2', output: 'false', is_hidden: true },
    { input: '[1, 1, 3], 3', output: 'true', is_hidden: true },
    { input: '[2, 2, 2, 3, 2, 2, 2], 3', output: 'true', is_hidden: true },
    { input: '[2, 2, 2, 3, 2, 2, 2], 4', output: 'false', is_hidden: true },
    { input: '[1, 3, 1, 1, 1], 3', output: 'true', is_hidden: true },
    { input: '[3, 5, 1], 3', output: 'true', is_hidden: true },
    { input: '[3, 5, 1], 1', output: 'true', is_hidden: true },
    { input: '[3, 5, 1], 5', output: 'true', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items all 1s except a 2 at index 750
  const s21 = new Array(1000).fill(1);
  s21[750] = 2;
  tcs.push({ input: `${JSON.stringify(s21)}, 2`, output: 'true', is_hidden: true });

  // 22: same array looking for 3
  tcs.push({ input: `${JSON.stringify(s21)}, 3`, output: 'false', is_hidden: true });

  // 23: 1000 items with repeated sequence rotated
  const base = [];
  for (let i = 0; i < 200; i++) base.push(1, 2, 3, 4, 5);
  const s23 = base.slice(300).concat(base.slice(0, 300));
  tcs.push({ input: `${JSON.stringify(s23)}, 4`, output: 'true', is_hidden: true });

  // 24: looking for missing element 99
  tcs.push({ input: `${JSON.stringify(s23)}, 99`, output: 'false', is_hidden: true });

  // 25: negative values with duplicates
  const s25 = [-2, -2, -1, 0, 1, 2, -3, -2];
  tcs.push({ input: `${JSON.stringify(s25)}, -3`, output: 'true', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Find Minimum in Rotated Sorted Array (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFindMinRotatedTCs() {
  const tcs = [
    { input: '[3,4,5,1,2]', output: '1', is_hidden: false },
    { input: '[4,5,6,7,0,1,2]', output: '0', is_hidden: false },
    { input: '[11,13,15,17]', output: '11', is_hidden: false },
    { input: '[1]', output: '1', is_hidden: true },
    { input: '[2, 1]', output: '1', is_hidden: true },
    { input: '[1, 2]', output: '1', is_hidden: true },
    { input: '[3, 1, 2]', output: '1', is_hidden: true },
    { input: '[2, 3, 1]', output: '1', is_hidden: true },
    { input: '[1, 2, 3]', output: '1', is_hidden: true },
    { input: '[4, 5, 1, 2, 3]', output: '1', is_hidden: true },
    { input: '[5, 1, 2, 3, 4]', output: '1', is_hidden: true },
    { input: '[2, 3, 4, 5, 1]', output: '1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5]', output: '1', is_hidden: true },
    { input: '[-1, 0, 1, 2, -5, -4, -3, -2]', output: '-5', is_hidden: true },
    { input: '[-5, -4, -3, -2, -1, 0, 1, 2]', output: '-5', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 5]', output: '5', is_hidden: true },
    { input: '[50, 10, 20, 30, 40]', output: '10', is_hidden: true },
    { input: '[30, 40, 50, 10, 20]', output: '10', is_hidden: true },
    { input: '[20, 30, 40, 50, 10]', output: '10', is_hidden: true },
    { input: '[7, 8, 9, 10, 1, 2, 3, 4, 5, 6]', output: '1', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items rotated at 700 (min is 0 at index 300)
  const orig = Array.from({ length: 1000 }, (_, i) => i * 3);
  const s21 = orig.slice(700).concat(orig.slice(0, 700));
  tcs.push({ input: `${JSON.stringify(s21)}`, output: '0', is_hidden: true });

  // 22: rotated by 1 (min at index 999)
  const s22 = orig.slice(1).concat(orig.slice(0, 1));
  tcs.push({ input: `${JSON.stringify(s22)}`, output: '0', is_hidden: true });

  // 23: rotated by length - 1 (min at index 1)
  const s23 = orig.slice(999).concat(orig.slice(0, 999));
  tcs.push({ input: `${JSON.stringify(s23)}`, output: '0', is_hidden: true });

  // 24: not rotated at all
  tcs.push({ input: `${JSON.stringify(orig)}`, output: '0', is_hidden: true });

  // 25: 1000 items with negative and positive values
  const negOrig = Array.from({ length: 1000 }, (_, i) => i - 500); // -500 .. 499
  const s25 = negOrig.slice(450).concat(negOrig.slice(0, 450));
  tcs.push({ input: `${JSON.stringify(s25)}`, output: '-500', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Floor and Ceil in Sorted Array',
    slug: 'floor-and-ceil-in-sorted-array',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[3, 4, 7, 8, 8, 10], 5',
    sample_output: '[4, 7]',
    description: `Given a sorted array \`nums\` of integers and an integer \`x\`. Find the **floor** and **ceiling** of \`x\` in \`nums\`.

- The **floor** of \`x\` is the largest element in the array smaller than or equal to \`x\`. If no such element exists, return \`-1\`.
- The **ceiling** of \`x\` is the smallest element in the array greater than or equal to \`x\`. If no such element exists, return \`-1\`.

Return an array \`[floor, ceil]\`.

### **Example 1:**
**Input:** nums = [3, 4, 7, 8, 8, 10], x = 5
**Output:** [4, 7]
**Explanation:** Floor of 5 is 4 (largest element <= 5) and ceiling of 5 is 7 (smallest element >= 5).

### **Example 2:**
**Input:** nums = [3, 4, 7, 8, 8, 10], x = 2
**Output:** [-1, 3]
**Explanation:** No element is <= 2 so floor is -1. Ceiling is 3.

### **Example 3:**
**Input:** nums = [3, 4, 7, 8, 8, 10], x = 11
**Output:** [10, -1]
**Explanation:** Floor is 10. No element is >= 11 so ceiling is -1.

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`1 <= nums[i], x <= 10⁹\`
- \`nums\` is sorted in non-decreasing order.`,
    hints: [
      'For floor: find the largest element <= x using binary search. If nums[mid] <= x, record nums[mid] and search right (low = mid + 1).',
      'For ceil: find the smallest element >= x using binary search. If nums[mid] >= x, record nums[mid] and search left (high = mid - 1).'
    ],
    testCases: generateFloorCeilTCs(),
    solutionCode: `
function solution(nums, x) {
  let floor = -1, ceil = -1;
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] <= x) {
      floor = nums[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  low = 0; high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] >= x) {
      ceil = nums[mid];
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return [floor, ceil];
}
`
  },
  {
    title: 'Count Occurrences in Sorted Array',
    slug: 'count-occurrences-in-sorted-array',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[1, 1, 2, 2, 2, 2, 3], 2',
    sample_output: '4',
    description: `Given a sorted array \`nums\` of integers and an integer \`target\`. Count the number of occurrences of \`target\` in \`nums\`.

If \`target\` does not appear in \`nums\`, return \`0\`.

You should write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [1, 1, 2, 2, 2, 2, 3], target = 2
**Output:** 4
**Explanation:** 2 appears 4 times in the array.

### **Example 2:**
**Input:** nums = [1, 1, 2, 2, 2, 2, 3], target = 4
**Output:** 0
**Explanation:** 4 does not appear in the array.

### **Example 3:**
**Input:** nums = [8, 9, 10, 12, 12, 12], target = 12
**Output:** 3

### **Constraints:**
- \`0 <= nums.length <= 10⁵\`
- \`-10⁹ <= nums[i], target <= 10⁹\`
- \`nums\` is sorted in non-decreasing order.`,
    hints: [
      'Use binary search to find the first occurrence of target.',
      'Use binary search again to find the last occurrence of target.',
      'If target is present, the count is (lastIndex - firstIndex + 1). If not present, return 0.'
    ],
    testCases: generateCountOccurrencesTCs(),
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
  if (first === -1) return 0;
  const last = findLast(nums, target);
  return last - first + 1;
}
`
  },
  {
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[4,5,6,7,0,1,2], 0',
    sample_output: '4',
    description: `There is an integer array \`nums\` sorted in ascending order (with **distinct** values).

Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index \`k\` (\`1 <= k < nums.length\`) such that the resulting array is \`[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]\` (**0-indexed**). For example, \`[0,1,2,4,5,6,7]\` might be rotated at pivot index \`3\` and become \`[4,5,6,7,0,1,2]\`.

Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [4,5,6,7,0,1,2], target = 0
**Output:** 4

### **Example 2:**
**Input:** nums = [4,5,6,7,0,1,2], target = 3
**Output:** -1

### **Example 3:**
**Input:** nums = [1], target = 0
**Output:** -1

### **Constraints:**
- \`1 <= nums.length <= 5000\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- All values of \`nums\` are **unique**.
- \`nums\` is an ascending array that is possibly rotated.
- \`-10⁴ <= target <= 10⁴\``,
    hints: [
      'At least one half of the rotated array is always sorted.',
      'Check if the left half (nums[low] <= nums[mid]) is sorted. If so, check if target lies within [nums[low], nums[mid]].',
      'Otherwise, the right half must be sorted. Check if target lies within [nums[mid], nums[high]].'
    ],
    testCases: generateSearchRotatedTCs(),
    solutionCode: `
function solution(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[low] <= nums[mid]) {
      if (nums[low] <= target && target < nums[mid]) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[high]) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
  }
  return -1;
}
`
  },
  {
    title: 'Search in Rotated Sorted Array II',
    slug: 'search-in-rotated-sorted-array-ii',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[2,5,6,0,0,1,2], 0',
    sample_output: 'true',
    description: `There is an integer array \`nums\` sorted in non-decreasing order (not necessarily with **distinct** values).

Before being passed to your function, \`nums\` is rotated at an unknown pivot index \`k\` (\`0 <= k < nums.length\`) such that the resulting array is \`[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]\` (**0-indexed**).

Given the array \`nums\` after the rotation and an integer \`target\`, return \`true\` if \`target\` is in \`nums\`, or \`false\` if it is not in \`nums\`.

You must decrease the overall operation steps as much as possible.

### **Example 1:**
**Input:** nums = [2,5,6,0,0,1,2], target = 0
**Output:** true

### **Example 2:**
**Input:** nums = [2,5,6,0,0,1,2], target = 3
**Output:** false

### **Constraints:**
- \`1 <= nums.length <= 5000\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- \`nums\` is guaranteed to be rotated at some pivot.
- \`-10⁴ <= target <= 10⁴\``,
    hints: [
      'When nums[low] === nums[mid] === nums[high], we cannot determine which half is sorted.',
      'In that case, simply shrink the search space: low++ and high--.',
      'Otherwise, apply standard rotated binary search on the sorted half.'
    ],
    testCases: generateSearchRotatedIITCs(),
    solutionCode: `
function solution(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return true;
    if (nums[low] === nums[mid] && nums[mid] === nums[high]) {
      low++;
      high--;
      continue;
    }
    if (nums[low] <= nums[mid]) {
      if (nums[low] <= target && target < nums[mid]) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[high]) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
  }
  return false;
}
`
  },
  {
    title: 'Find Minimum in Rotated Sorted Array',
    slug: 'find-minimum-in-rotated-sorted-array',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[3,4,5,1,2]',
    sample_output: '1',
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times. For example, the array \`nums = [0,1,2,4,5,6,7]\` might become:
- \`[4,5,6,7,0,1,2]\` if it was rotated 4 times.
- \`[0,1,2,4,5,6,7]\` if it was rotated 7 times.

Notice that rotating an array \`[a[0], a[1], a[2], ..., a[n-1]]\` 1 time results in the array \`[a[n-1], a[0], a[1], a[2], ..., a[n-2]]\`.

Given the sorted rotated array \`nums\` of **unique** elements, return the minimum element of this array.

You must write an algorithm that runs in \`O(log n)\` time.

### **Example 1:**
**Input:** nums = [3,4,5,1,2]
**Output:** 1
**Explanation:** The original array was [1,2,3,4,5] rotated 3 times.

### **Example 2:**
**Input:** nums = [4,5,6,7,0,1,2]
**Output:** 0
**Explanation:** The original array was [0,1,2,4,5,6,7] and it was rotated 4 times.

### **Example 3:**
**Input:** nums = [11,13,15,17]
**Output:** 11
**Explanation:** The original array was [11,13,15,17] and it was rotated 4 times.

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 5000\`
- \`-5000 <= nums[i] <= 5000\`
- All the integers of \`nums\` are **unique**.
- \`nums\` is sorted and rotated between \`1\` and \`n\` times.`,
    hints: [
      'Compare nums[mid] with nums[high].',
      'If nums[mid] > nums[high], the minimum element must be in the right half: low = mid + 1.',
      'If nums[mid] <= nums[high], the minimum element is in the left half including mid: high = mid.'
    ],
    testCases: generateFindMinRotatedTCs(),
    solutionCode: `
function solution(nums) {
  let low = 0, high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] > nums[high]) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return nums[low];
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 2 (5 Problems)...');

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

