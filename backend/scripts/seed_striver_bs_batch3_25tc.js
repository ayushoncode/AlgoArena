/**
 * seed_striver_bs_batch3_25tc.js
 * Seeds and validates the 3rd batch of 5 Striver A2Z Binary Search problems:
 * 1. Find Kth Rotation (find-kth-rotation)
 * 2. Single Element in a Sorted Array (single-element-in-a-sorted-array)
 * 3. Find Peak Element (find-peak-element)
 * 4. Sqrt(x) (sqrt-x)
 * 5. Koko Eating Bananas (koko-eating-bananas)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Find Kth Rotation (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFindKthRotationTCs() {
  const tcs = [
    { input: '[5, 1, 2, 3, 4]', output: '1', is_hidden: false },
    { input: '[4, 5, 6, 7, 0, 1, 2]', output: '4', is_hidden: false },
    { input: '[1, 2, 3, 4, 5]', output: '0', is_hidden: false },
    { input: '[1]', output: '0', is_hidden: true },
    { input: '[2, 1]', output: '1', is_hidden: true },
    { input: '[1, 2]', output: '0', is_hidden: true },
    { input: '[3, 1, 2]', output: '1', is_hidden: true },
    { input: '[2, 3, 1]', output: '2', is_hidden: true },
    { input: '[1, 2, 3]', output: '0', is_hidden: true },
    { input: '[3, 4, 5, 1, 2]', output: '3', is_hidden: true },
    { input: '[4, 5, 1, 2, 3]', output: '2', is_hidden: true },
    { input: '[5, 1, 2, 3, 4]', output: '1', is_hidden: true },
    { input: '[2, 3, 4, 5, 1]', output: '4', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 5]', output: '5', is_hidden: true },
    { input: '[50, 10, 20, 30, 40]', output: '1', is_hidden: true },
    { input: '[40, 50, 10, 20, 30]', output: '2', is_hidden: true },
    { input: '[30, 40, 50, 10, 20]', output: '3', is_hidden: true },
    { input: '[20, 30, 40, 50, 10]', output: '4', is_hidden: true },
    { input: '[-1, 0, 1, 2, -5, -4, -3, -2]', output: '4', is_hidden: true },
    { input: '[-5, -4, -3, -2, -1, 0, 1, 2]', output: '0', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items rotated at index 350
  const orig = Array.from({ length: 1000 }, (_, i) => i * 3);
  const s21 = orig.slice(650).concat(orig.slice(0, 650));
  tcs.push({ input: `${JSON.stringify(s21)}`, output: '350', is_hidden: true });

  // 22: rotated by 1 (min at index 999)
  const s22 = orig.slice(1).concat(orig.slice(0, 1));
  tcs.push({ input: `${JSON.stringify(s22)}`, output: '999', is_hidden: true });

  // 23: rotated by length - 1 (min at index 1)
  const s23 = orig.slice(999).concat(orig.slice(0, 999));
  tcs.push({ input: `${JSON.stringify(s23)}`, output: '1', is_hidden: true });

  // 24: not rotated at all
  tcs.push({ input: `${JSON.stringify(orig)}`, output: '0', is_hidden: true });

  // 25: 1000 items rotated at 780
  const s25 = orig.slice(220).concat(orig.slice(0, 220));
  tcs.push({ input: `${JSON.stringify(s25)}`, output: '780', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Single Element in a Sorted Array (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSingleElementTCs() {
  const tcs = [
    { input: '[1,1,2,3,3,4,4,8,8]', output: '2', is_hidden: false },
    { input: '[3,3,7,7,10,11,11]', output: '10', is_hidden: false },
    { input: '[1]', output: '1', is_hidden: false },
    { input: '[1, 1, 2]', output: '2', is_hidden: true },
    { input: '[1, 2, 2]', output: '1', is_hidden: true },
    { input: '[1, 1, 2, 2, 3]', output: '3', is_hidden: true },
    { input: '[1, 2, 2, 3, 3]', output: '1', is_hidden: true },
    { input: '[1, 1, 2, 3, 3]', output: '2', is_hidden: true },
    { input: '[0, 1, 1]', output: '0', is_hidden: true },
    { input: '[1, 1, 0]', output: '0', is_hidden: true },
    { input: '[2, 2, 5, 5, 7, 7, 9]', output: '9', is_hidden: true },
    { input: '[1, 3, 3, 5, 5, 7, 7]', output: '1', is_hidden: true },
    { input: '[1, 1, 3, 3, 5, 7, 7]', output: '5', is_hidden: true },
    { input: '[2, 2, 4, 4, 6, 8, 8]', output: '6', is_hidden: true },
    { input: '[1, 1, 3, 5, 5, 7, 7, 9, 9]', output: '3', is_hidden: true },
    { input: '[10, 10, 20, 20, 30, 40, 40]', output: '30', is_hidden: true },
    { input: '[10, 20, 20, 30, 30, 40, 40]', output: '10', is_hidden: true },
    { input: '[10, 10, 20, 20, 30, 30, 40]', output: '40', is_hidden: true },
    { input: '[1, 1, 2, 2, 3, 3, 4, 4, 5]', output: '5', is_hidden: true },
    { input: '[1, 2, 2, 3, 3, 4, 4, 5, 5]', output: '1', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1001 items, single element at index 500
  const s21 = [];
  for (let i = 1; i <= 250; i++) s21.push(i, i);
  s21.push(99999);
  for (let i = 251; i <= 500; i++) s21.push(i, i);
  tcs.push({ input: `${JSON.stringify(s21)}`, output: '99999', is_hidden: true });

  // 22: single element at the very beginning
  const s22 = [0];
  for (let i = 1; i <= 500; i++) s22.push(i, i);
  tcs.push({ input: `${JSON.stringify(s22)}`, output: '0', is_hidden: true });

  // 23: single element at the very end
  const s23 = [];
  for (let i = 1; i <= 500; i++) s23.push(i, i);
  s23.push(1001);
  tcs.push({ input: `${JSON.stringify(s23)}`, output: '1001', is_hidden: true });

  // 24: single element at index 2
  const s24 = [1, 1, 2];
  for (let i = 3; i <= 500; i++) s24.push(i, i);
  tcs.push({ input: `${JSON.stringify(s24)}`, output: '2', is_hidden: true });

  // 25: single element at index 998
  const s25 = [];
  for (let i = 1; i <= 499; i++) s25.push(i, i);
  s25.push(88888, 99999, 99999);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: '88888', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Find Peak Element (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFindPeakElementTCs() {
  const tcs = [
    { input: '[1,2,3,1]', output: '2', is_hidden: false },
    { input: '[1,2,1,3,5,6,4]', output: '5', is_hidden: false },
    { input: '[1]', output: '0', is_hidden: false },
    { input: '[1, 2]', output: '1', is_hidden: true },
    { input: '[2, 1]', output: '0', is_hidden: true },
    { input: '[1, 2, 3]', output: '2', is_hidden: true },
    { input: '[3, 2, 1]', output: '0', is_hidden: true },
    { input: '[1, 3, 2]', output: '1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5]', output: '4', is_hidden: true },
    { input: '[5, 4, 3, 2, 1]', output: '0', is_hidden: true },
    { input: '[1, 3, 20, 4, 1, 0]', output: '2', is_hidden: true },
    { input: '[10, 20, 15, 2, 23, 90, 67]', output: '5', is_hidden: true },
    { input: '[1, 2, 1, 2, 1]', output: '3', is_hidden: true },
    { input: '[1, 5, 2, 8, 3]', output: '3', is_hidden: true },
    { input: '[-10, -5, -2, -8, -12]', output: '2', is_hidden: true },
    { input: '[2, 3, 4, 3, 2]', output: '2', is_hidden: true },
    { input: '[1, 2, 3, 4, 3, 2, 1]', output: '3', is_hidden: true },
    { input: '[100, 90, 80, 70, 60]', output: '0', is_hidden: true },
    { input: '[10, 20, 30, 40, 50, 60]', output: '5', is_hidden: true },
    { input: '[5, 10, 15, 20, 25, 30, 10]', output: '5', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 items increasing up to index 750, then decreasing
  const s21 = [];
  for (let i = 1; i <= 750; i++) s21.push(i);
  for (let i = 749; i >= 500; i--) s21.push(i);
  tcs.push({ input: `${JSON.stringify(s21)}`, output: '749', is_hidden: true });

  // 22: strictly increasing 1000 items (peak at 999)
  const s22 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s22)}`, output: '999', is_hidden: true });

  // 23: strictly decreasing 1000 items (peak at 0)
  const s23 = Array.from({ length: 1000 }, (_, i) => 1000 - i);
  tcs.push({ input: `${JSON.stringify(s23)}`, output: '0', is_hidden: true });

  // 24: peak at index 1 in 1000 items
  const s24 = [1, 100000];
  for (let i = 998; i >= 1; i--) s24.push(i);
  tcs.push({ input: `${JSON.stringify(s24)}`, output: '1', is_hidden: true });

  // 25: peak in middle of 1000 items
  const s25 = [];
  for (let i = 1; i <= 500; i++) s25.push(i);
  for (let i = 499; i >= 1; i--) s25.push(i);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: '499', is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Sqrt(x) (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSqrtXTCs() {
  const tcs = [
    { input: '4', output: '2', is_hidden: false },
    { input: '8', output: '2', is_hidden: false },
    { input: '0', output: '0', is_hidden: false },
    { input: '1', output: '1', is_hidden: true },
    { input: '2', output: '1', is_hidden: true },
    { input: '3', output: '1', is_hidden: true },
    { input: '5', output: '2', is_hidden: true },
    { input: '9', output: '3', is_hidden: true },
    { input: '15', output: '3', is_hidden: true },
    { input: '16', output: '4', is_hidden: true },
    { input: '25', output: '5', is_hidden: true },
    { input: '26', output: '5', is_hidden: true },
    { input: '48', output: '6', is_hidden: true },
    { input: '49', output: '7', is_hidden: true },
    { input: '99', output: '9', is_hidden: true },
    { input: '100', output: '10', is_hidden: true },
    { input: '101', output: '10', is_hidden: true },
    { input: '256', output: '16', is_hidden: true },
    { input: '1000', output: '31', is_hidden: true },
    { input: '10000', output: '100', is_hidden: true },
    { input: '65536', output: '256', is_hidden: true },
    { input: '100000', output: '316', is_hidden: true },
    { input: '1000000', output: '1000', is_hidden: true },
    { input: '2147395599', output: '46339', is_hidden: true }, // close to sqrt(2^31 - 1)
    { input: '2147483647', output: '46340', is_hidden: true }, // INT_MAX: 2^31 - 1
  ];
  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Koko Eating Bananas (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateKokoTCs() {
  const tcs = [
    { input: '[3,6,7,11], 8', output: '4', is_hidden: false },
    { input: '[30,11,23,4,20], 5', output: '30', is_hidden: false },
    { input: '[30,11,23,4,20], 6', output: '23', is_hidden: false },
    { input: '[100], 1', output: '100', is_hidden: true },
    { input: '[100], 2', output: '50', is_hidden: true },
    { input: '[100], 100', output: '1', is_hidden: true },
    { input: '[1, 1, 1, 1], 4', output: '1', is_hidden: true },
    { input: '[312884470], 312884469', output: '2', is_hidden: true },
    { input: '[312884470], 968709470', output: '1', is_hidden: true },
    { input: '[10, 20, 30], 6', output: '10', is_hidden: true },
    { input: '[10, 20, 30], 3', output: '30', is_hidden: true },
    { input: '[10, 20, 30], 10', output: '7', is_hidden: true },
    { input: '[5, 5, 5, 5, 5], 5', output: '5', is_hidden: true },
    { input: '[5, 5, 5, 5, 5], 10', output: '3', is_hidden: true },
    { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10', output: '10', is_hidden: true },
    { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 15', output: '5', is_hidden: true },
    { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 20', output: '4', is_hidden: true },
    { input: '[1000000000], 2', output: '500000000', is_hidden: true },
    { input: '[2, 2], 2', output: '2', is_hidden: true },
    { input: '[2, 2], 3', output: '2', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 piles of 100 bananas, h = 1000 -> k = 100
  const s21 = new Array(1000).fill(100);
  tcs.push({ input: `${JSON.stringify(s21)}, 1000`, output: '100', is_hidden: true });

  // 22: 1000 piles of 100 bananas, h = 2000 -> k = 50
  tcs.push({ input: `${JSON.stringify(s21)}, 2000`, output: '50', is_hidden: true });

  // 23: 1000 piles of 1000 bananas, h = 1500 -> k = 667 (ceil(1000/667)=2, 1000*2 = 2000 > 1500; k = 1000/1=1000 -> 1000 <= 1500)
  // calculate expected for s23
  function getKokoSpeed(piles, h) {
    let l = 1, r = Math.max(...piles), ans = r;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      let hours = 0;
      for (const p of piles) hours += Math.ceil(p / m);
      if (hours <= h) { ans = m; r = m - 1; }
      else l = m + 1;
    }
    return ans;
  }
  const s23 = new Array(1000).fill(1000);
  tcs.push({ input: `${JSON.stringify(s23)}, 1500`, output: String(getKokoSpeed(s23, 1500)), is_hidden: true });

  // 24: mixed piles up to 10^9
  const s24 = [1000000000, 1000000000, 1000000000, 1000000000];
  tcs.push({ input: `${JSON.stringify(s24)}, 8`, output: '500000000', is_hidden: true });

  // 25: 1000 piles with varied values 1..1000, h = 2000
  const s25 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s25)}, 2000`, output: String(getKokoSpeed(s25, 2000)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Find Kth Rotation',
    slug: 'find-kth-rotation',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[5, 1, 2, 3, 4]',
    sample_output: '1',
    description: `Given an increasing sorted rotated array \`nums\` of distinct integers. The array is rotated an unknown number of times (\`k\` times), between \`0\` and \`nums.length - 1\`.

Find the value of \`k\` (i.e. the number of times the sorted array was rotated clockwise).

Note that rotating an array \`1\` time results in \`[nums[n-1], nums[0], ..., nums[n-2]]\`.

### **Example 1:**
**Input:** nums = [5, 1, 2, 3, 4]
**Output:** 1
**Explanation:** The original sorted array was [1, 2, 3, 4, 5] and it was rotated 1 time clockwise.

### **Example 2:**
**Input:** nums = [4, 5, 6, 7, 0, 1, 2]
**Output:** 4
**Explanation:** The original sorted array was [0, 1, 2, 4, 5, 6, 7] and it was rotated 4 times.

### **Example 3:**
**Input:** nums = [1, 2, 3, 4, 5]
**Output:** 0
**Explanation:** The array is not rotated, so k = 0.

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-10⁹ <= nums[i] <= 10⁹\`
- All elements in \`nums\` are distinct.`,
    hints: [
      'The number of rotations in an increasing sorted array is equal to the index of the minimum element.',
      'Use binary search to locate the minimum element in O(log n) time.',
      'If nums[mid] > nums[high], the minimum element lies in the right half (low = mid + 1). Otherwise high = mid.'
    ],
    testCases: generateFindKthRotationTCs(),
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
  return low;
}
`
  },
  {
    title: 'Single Element in a Sorted Array',
    slug: 'single-element-in-a-sorted-array',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[1,1,2,3,3,4,4,8,8]',
    sample_output: '2',
    description: `You are given a sorted array consisting of only integers where every element appears exactly twice, except for one element which appears exactly once.

Return the single element that appears only once.

Your solution must run in \`O(log n)\` time and \`O(1)\` space.

### **Example 1:**
**Input:** nums = [1,1,2,3,3,4,4,8,8]
**Output:** 2

### **Example 2:**
**Input:** nums = [3,3,7,7,10,11,11]
**Output:** 10

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`0 <= nums[i] <= 10⁵\``,
    hints: [
      'Before the single element, pairs start at even indices (even, odd). After the single element, pairs start at odd indices (odd, even).',
      'If mid is even and nums[mid] === nums[mid + 1], the single element is to the right.',
      'If mid is odd and nums[mid] === nums[mid - 1], the single element is to the right.'
    ],
    testCases: generateSingleElementTCs(),
    solutionCode: `
function solution(nums) {
  let low = 0, high = nums.length - 1;
  while (low < high) {
    let mid = Math.floor((low + high) / 2);
    if (mid % 2 === 1) mid--;
    if (nums[mid] === nums[mid + 1]) {
      low = mid + 2;
    } else {
      high = mid;
    }
  }
  return nums[low];
}
`
  },
  {
    title: 'Find Peak Element',
    slug: 'find-peak-element',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[1,2,3,1]',
    sample_output: '2',
    description: `A peak element is an element that is strictly greater than its neighbors.

Given a **0-indexed** integer array \`nums\`, find a peak element, and return its index. If the array contains multiple peaks, return the index to **any of the peaks**.

You may imagine that \`nums[-1] = nums[n] = -∞\`. In other words, an element is always considered to be strictly greater than a neighbor that is outside the array.

You must write an algorithm that runs in \`O(log n)\` time.

### **Example 1:**
**Input:** nums = [1,2,3,1]
**Output:** 2
**Explanation:** 3 is a peak element and your function should return the index number 2.

### **Example 2:**
**Input:** nums = [1,2,1,3,5,6,4]
**Output:** 5
**Explanation:** Your function can return either index number 1 where the peak element is 2, or index number 5 where the peak element is 6.

### **Constraints:**
- \`1 <= nums.length <= 1000\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\`
- \`nums[i] != nums[i + 1]\` for all valid \`i\`.`,
    hints: [
      'If nums[mid] < nums[mid + 1], there must be a peak on the right side because elements are increasing.',
      'Otherwise, there must be a peak on the left side (including mid).'
    ],
    testCases: generateFindPeakElementTCs(),
    solutionCode: `
function solution(nums) {
  let low = 0, high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] < nums[mid + 1]) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
`
  },
  {
    title: 'Sqrt(x)',
    slug: 'sqrt-x',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '4',
    sample_output: '2',
    description: `Given a non-negative integer \`x\`, return the square root of \`x\` rounded down to the nearest integer. The returned integer should be **non-negative** as well.

You **must not use** any built-in exponent function or operator.
- For example, do not use \`pow(x, 0.5)\` in c++ or \`x ** 0.5\` in python.

### **Example 1:**
**Input:** x = 4
**Output:** 2
**Explanation:** The square root of 4 is 2, so we return 2.

### **Example 2:**
**Input:** x = 8
**Output:** 2
**Explanation:** The square root of 8 is 2.82842..., and since we round it down to the nearest integer, 2 is returned.

### **Constraints:**
- \`0 <= x <= 2³¹ - 1\``,
    hints: [
      'Use binary search in the range [1, x / 2].',
      'For mid, if mid * mid <= x, record mid as potential answer and search right (low = mid + 1).',
      'Otherwise, search left (high = mid - 1).'
    ],
    testCases: generateSqrtXTCs(),
    solutionCode: `
function solution(x) {
  if (x === 0 || x === 1) return x;
  let low = 1, high = Math.floor(x / 2), ans = 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid * mid === x) return mid;
    if (mid * mid < x) {
      ans = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return ans;
}
`
  },
  {
    title: 'Koko Eating Bananas',
    slug: 'koko-eating-bananas',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[3,6,7,11], 8',
    sample_output: '4',
    description: `Koko loves to eat bananas. There are \`n\` piles of bananas, the \`i\`th pile has \`piles[i]\` bananas. The guards have gone and will come back in \`h\` hours.

Koko can decide her bananas-per-hour eating speed of \`k\`. Each hour, she chooses some pile of bananas and eats \`k\` bananas from that pile. If the pile has less than \`k\` bananas, she eats all of them instead and will not eat any more bananas during this hour.

Koko likes to eat slowly but still wants to finish eating all the bananas before the guards return.

Return the minimum integer \`k\` such that she can eat all the bananas within \`h\` hours.

### **Example 1:**
**Input:** piles = [3,6,7,11], h = 8
**Output:** 4

### **Example 2:**
**Input:** piles = [30,11,23,4,20], h = 5
**Output:** 30

### **Example 3:**
**Input:** piles = [30,11,23,4,20], h = 6
**Output:** 23

### **Constraints:**
- \`1 <= piles.length <= 10⁴\`
- \`piles.length <= h <= 10⁹\`
- \`1 <= piles[i] <= 10⁹\``,
    hints: [
      'The possible values of k range from 1 to max(piles).',
      'Use binary search on this answer range [1, max(piles)].',
      'For a candidate speed mid, calculate total hours needed: sum of ceil(pile / mid). If total <= h, record mid and search for a smaller speed (high = mid - 1).'
    ],
    testCases: generateKokoTCs(),
    solutionCode: `
function solution(piles, h) {
  let low = 1, high = Math.max(...piles);
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let hours = 0;
    for (let i = 0; i < piles.length; i++) {
      hours += Math.ceil(piles[i] / mid);
    }
    if (hours <= h) {
      ans = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return ans;
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 3 (5 Problems)...');

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
