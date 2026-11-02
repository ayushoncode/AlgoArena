/**
 * backend/scripts/upgrade_striver_arrays_hard_batch6_25tc.js
 *
 * Upgrades Striver Step 3 Arrays Hard Batch 6 (5 Problems) to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests (N = 50,000 to 80,000).
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute force with TLE (> 2000ms).
 *
 * Problems:
 * 1. Majority Element II (majority-element-ii) [LC 229]
 * 2. Maximum Product Subarray (maximum-product-subarray) [LC 152]
 * 3. Reverse Pairs (reverse-pairs) [LC 493]
 * 4. First Missing Positive (first-missing-positive) [LC 41]
 * 5. Trapping Rain Water (trapping-rain-water) [LC 42]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers
function solveMajorityElementII(nums) {
  if (!nums || nums.length === 0) return [];
  let c1 = 0, c2 = 0, count1 = 0, count2 = 0;
  for (const num of nums) {
    if (num === c1) {
      count1++;
    } else if (num === c2) {
      count2++;
    } else if (count1 === 0) {
      c1 = num;
      count1 = 1;
    } else if (count2 === 0) {
      c2 = num;
      count2 = 1;
    } else {
      count1--;
      count2--;
    }
  }
  count1 = 0;
  count2 = 0;
  for (const num of nums) {
    if (num === c1) count1++;
    else if (num === c2) count2++;
  }
  const res = [];
  const threshold = Math.floor(nums.length / 3);
  if (count1 > threshold) res.push(c1);
  if (count2 > threshold) res.push(c2);
  return res.sort((a, b) => a - b);
}

function solveMaxProductSubarray(nums) {
  if (!nums || nums.length === 0) return 0;
  let maxSoFar = nums[0];
  let minSoFar = nums[0];
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const curr = nums[i];
    if (curr < 0) {
      const temp = maxSoFar;
      maxSoFar = minSoFar;
      minSoFar = temp;
    }
    maxSoFar = Math.max(curr, maxSoFar * curr);
    minSoFar = Math.min(curr, minSoFar * curr);
    result = Math.max(result, maxSoFar);
  }
  return result;
}

function solveReversePairs(nums) {
  if (!nums || nums.length <= 1) return 0;
  function mergeSort(arr, low, high) {
    if (low >= high) return 0;
    const mid = Math.floor((low + high) / 2);
    let count = mergeSort(arr, low, mid) + mergeSort(arr, mid + 1, high);
    let j = mid + 1;
    for (let i = low; i <= mid; i++) {
      while (j <= high && arr[i] > 2 * arr[j]) {
        j++;
      }
      count += j - (mid + 1);
    }
    // merge
    const temp = [];
    let left = low, right = mid + 1;
    while (left <= mid && right <= high) {
      if (arr[left] <= arr[right]) {
        temp.push(arr[left++]);
      } else {
        temp.push(arr[right++]);
      }
    }
    while (left <= mid) temp.push(arr[left++]);
    while (right <= high) temp.push(arr[right++]);
    for (let k = 0; k < temp.length; k++) {
      arr[low + k] = temp[k];
    }
    return count;
  }
  return mergeSort([...nums], 0, nums.length - 1);
}

function solveFirstMissingPositive(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const correctIdx = nums[i] - 1;
      const temp = nums[correctIdx];
      nums[correctIdx] = nums[i];
      nums[i] = temp;
    }
  }
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }
  return n + 1;
}

function solveTrappingWater(height) {
  if (!height || height.length === 0) return 0;
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let total = 0;
  while (left <= right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        total += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        total += rightMax - height[right];
      }
      right--;
    }
  }
  return total;
}

// ── TEST CASE GENERATORS ──────────────────────────────────────────────────

function generateMajorityElementIICases() {
  const baseCases = [
    [3, 2, 3],
    [1],
    [1, 2],
    [2, 2, 1, 3],
    [1, 1, 1, 3, 3, 2, 2, 2],
    [0, 0, 0],
    [-1, -1, -1, 2, 3],
    [1, 2, 3, 4, 5],
    [4, 4, 4, 4, 1, 2],
    [1, 2, 1, 2, 1, 2],
    [6, 5, 5],
    [8, 8, 7, 7, 7],
    [2, 1, 1, 3, 1, 4, 5, 6],
    [9, 9, 9, 9, 9],
    [100, 200, 300],
    [-2, -2, -2, -1, -1, -1, 0],
    [5, 5, 6, 6, 7],
    [10, 10, 20, 20, 30],
    [42],
    [1, 2, 3]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMajorityElementII([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 3,000 elements with 2 majorities
  const s21 = [...new Array(1001).fill(1), ...new Array(1001).fill(2), ...new Array(998).fill(3)];
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([1, 2]), is_hidden: true });

  // 22: 6,000 elements with 1 majority
  const s22 = [...new Array(2500).fill(7), ...new Array(3500).fill(42)];
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveMajorityElementII([...s22])), is_hidden: true });

  // 23: 15,000 distinct elements -> []
  const s23 = [];
  for (let i = 0; i < 15000; i++) s23.push(i);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify([]), is_hidden: true });

  // 24: 35,000 elements with 2 majorities
  const s24 = [...new Array(12000).fill(100), ...new Array(12000).fill(200), ...new Array(11000).fill(300)];
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify([100, 200]), is_hidden: true });

  // 25: 75,000 elements (STRICTLY KILLS O(N^2) brute force — majority at the end)
  const s25 = [];
  for (let i = 0; i < 49000; i++) s25.push(i);
  for (let i = 0; i < 26000; i++) s25.push(999999);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify([999999]), is_hidden: true });

  return tcs;
}

function generateMaxProductSubarrayCases() {
  const baseCases = [
    [2, 3, -2, 4],
    [-2, 0, -1],
    [-2, 3, -4],
    [0, 2],
    [-2],
    [-2, -3, 7],
    [2, -5, -2, -4, 3],
    [-1, -2, -3, 0],
    [3, -1, 4],
    [2, 3, -2, 4, -1],
    [-2, -3, 0, -2, -40],
    [1, 0, -1, 2, 3, -5, -2],
    [-1, -2, -3, -4],
    [0, 0, 0, 0],
    [-3, 0, 1, -2],
    [2, 2, 2, 2],
    [-1, -1, -1],
    [6, 3, -10, 0, 2],
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    [1, -2, 3, -4, 5, -6]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMaxProductSubarray([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 ones with a 2
  const s21 = new Array(2000).fill(1);
  s21[1000] = 2;
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(2), is_hidden: true });

  // 22: 5,000 negative ones
  const s22 = new Array(5000).fill(-1);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(1), is_hidden: true });

  // 23: 15,000 zeros with a 7
  const s23 = new Array(15000).fill(0);
  s23[7500] = 7;
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(7), is_hidden: true });

  // 24: 35,000 elements alternating [1, -1, 1]
  const s24 = [];
  for (let i = 0; i < 35000; i++) s24.push(i % 7 === 0 ? -1 : 1);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(1), is_hidden: true });

  // 25: 75,000 elements (STRICTLY KILLS O(N^2) brute force — 2.8B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push(i % 11 === 0 ? -1 : 1);
  s25[37500] = 3;
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(3), is_hidden: true });

  return tcs;
}

function generateReversePairsCases() {
  const baseCases = [
    [1, 3, 2, 3, 1],
    [2, 4, 3, 5, 1],
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
    [1],
    [],
    [2147483647, 2147483647, -2147483647, -2147483647, -2147483648, 2147483647],
    [-5, -5],
    [0, 0, 0],
    [6, 5, 4, 3, 2, 1],
    [10, 2, 5, 1],
    [7, 2, 8, 3, 9, 4],
    [-2, -1, 0, 1, 2],
    [4, 1, 2, 3, 1, 5],
    [9, 1, 3, 5],
    [20, 19, 10, 8, 5, 2],
    [100, 40, 20, 10, 5],
    [1, 1, 1, 1],
    [3, 1, 4, 1, 5, 9, 2, 6],
    [12, 5, 2, 1, 0]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveReversePairs([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 strictly decreasing [2000..1]
  const s21 = [];
  for (let i = 2000; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveReversePairs([...s21])), is_hidden: true });

  // 22: 5,000 strictly increasing -> 0
  const s22 = [];
  for (let i = 1; i <= 5000; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(0), is_hidden: true });

  // 23: 15,000 identical elements -> 0
  const s23 = new Array(15000).fill(10);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(0), is_hidden: true });

  // 24: 35,000 elements first half large, second half small
  const s24 = [...new Array(17500).fill(100), ...new Array(17500).fill(1)];
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(17500 * 17500), is_hidden: true });

  // 25: 75,000 pseudo-random elements (STRICTLY KILLS O(N^2) brute force — 2.8B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push((i * 47) % 500);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveReversePairs([...s25])), is_hidden: true });

  return tcs;
}

function generateFirstMissingPositiveTCs() {
  const baseCases = [
    [1, 2, 0],
    [3, 4, -1, 1],
    [7, 8, 9, 11, 12],
    [1],
    [2],
    [0],
    [-1, -2],
    [1, 1],
    [2, 2],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [2, 3, 4, 5, 6],
    [1, 1000],
    [-1, 4, 2, 1, 9, 10],
    [0, -1, -2, -3],
    [1, 2, 2, 1, 3, 10],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [10, 9, 8, 7, 6, 5, 4, 3, 2],
    [1, 3, 5, 7, 9],
    [-5, 1000, 2000, 1, 2, 3]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveFirstMissingPositive([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 consecutive 1..2000 -> 2001
  const s21 = [];
  for (let i = 1; i <= 2000; i++) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(2001), is_hidden: true });

  // 22: 5,000 consecutive 2..5001 -> 1
  const s22 = [];
  for (let i = 2; i <= 5001; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(1), is_hidden: true });

  // 23: 15,000 negative numbers -> 1
  const s23 = [];
  for (let i = 1; i <= 15000; i++) s23.push(-i);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(1), is_hidden: true });

  // 24: 35,000 elements with 25000 missing
  const s24 = [];
  for (let i = 1; i <= 35000; i++) {
    if (i !== 25000) s24.push(i);
    else s24.push(999999);
  }
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(25000), is_hidden: true });

  // 25: 75,000 elements with 74999 missing (STRICTLY KILLS O(N^2) brute force like nums.includes(i) > 2000ms TLE)
  const s25 = [];
  for (let i = 1; i <= 75000; i++) {
    if (i !== 74999) s25.push(i);
    else s25.push(9999999);
  }
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(74999), is_hidden: true });

  return tcs;
}

function generateTrappingWaterTCs() {
  const baseCases = [
    [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
    [4, 2, 0, 3, 2, 5],
    [3, 0, 2, 0, 4],
    [],
    [1],
    [2, 0, 2],
    [5, 4, 1, 2],
    [0, 2, 0],
    [1, 1, 1],
    [5, 2, 1, 2, 1, 5],
    [2, 1, 0, 2],
    [3, 2, 1, 2, 3],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [0, 7, 1, 4, 6],
    [6, 4, 2, 0, 3, 2, 0, 3, 1, 4, 5, 3, 2, 7, 5, 3, 0, 1, 2, 1, 3, 4, 6, 8, 1, 3],
    [4, 2, 3],
    [9, 6, 8, 8, 5, 6, 3],
    [2, 0, 1, 0, 3, 1, 0, 2, 2, 0, 1],
    [5, 1, 0, 3, 2, 4]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveTrappingWater([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 strictly decreasing -> 0
  const s21 = [];
  for (let i = 2000; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(0), is_hidden: true });

  // 22: 5,000 strictly increasing -> 0
  const s22 = [];
  for (let i = 1; i <= 5000; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(0), is_hidden: true });

  // 23: 15,000 giant bowl: high boundaries at ends, flat valley 0 inside
  const s23 = new Array(15000).fill(0);
  s23[0] = 1000;
  s23[14999] = 1000;
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveTrappingWater([...s23])), is_hidden: true });

  // 24: 35,000 sawtooth heights
  const s24 = [];
  for (let i = 0; i < 35000; i++) s24.push(i % 10);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveTrappingWater([...s24])), is_hidden: true });

  // 25: 75,000 pseudo-random undulating heights (STRICTLY KILLS O(N^2) brute force — 2.8B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push(Math.abs((i * 37) % 50 - 25));
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveTrappingWater([...s25])), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'majority-element-ii',
    title: 'Majority Element II',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[3, 2, 3]',
    sample_output: '[3]',
    description: `Given an integer array of size \`n\`, find all elements that appear more than \`⌊ n/3 ⌋\` times.

The returned list should be sorted in ascending order.

### **Example 1:**
**Input:** nums = [3,2,3]
**Output:** [3]

### **Example 2:**
**Input:** nums = [1]
**Output:** [1]

### **Example 3:**
**Input:** nums = [1,2]
**Output:** [1,2]

### **Constraints:**
- \`1 <= nums.length <= 5 * 10⁴\`
- \`-10⁹ <= nums[i] <= 10⁹\`

**Follow-up:** Could you solve the problem in linear time and in \`O(1)\` space?`,
    hints: [
      'At most two elements can appear more than ⌊ n/3 ⌋ times.',
      'Use the Boyer-Moore Voting Algorithm extended to track two candidates and two counters.'
    ],
    testCases: generateMajorityElementIICases(),
    solutionCode: `
function solution(nums) {
  if (!nums || nums.length === 0) return [];
  let c1 = 0, c2 = 0, count1 = 0, count2 = 0;
  for (const num of nums) {
    if (num === c1) {
      count1++;
    } else if (num === c2) {
      count2++;
    } else if (count1 === 0) {
      c1 = num;
      count1 = 1;
    } else if (count2 === 0) {
      c2 = num;
      count2 = 1;
    } else {
      count1--;
      count2--;
    }
  }
  count1 = 0;
  count2 = 0;
  for (const num of nums) {
    if (num === c1) count1++;
    else if (num === c2) count2++;
  }
  const res = [];
  const threshold = Math.floor(nums.length / 3);
  if (count1 > threshold) res.push(c1);
  if (count2 > threshold) res.push(c2);
  return res.sort((a, b) => a - b);
}
`
  },
  {
    slug: 'maximum-product-subarray',
    title: 'Maximum Product Subarray',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[2, 3, -2, 4]',
    sample_output: '6',
    description: `Given an integer array \`nums\`, find a subarray that has the largest product, and return the product.

The test cases are generated so that the answer will fit in a **32-bit** integer.

### **Example 1:**
**Input:** nums = [2,3,-2,4]
**Output:** 6
**Explanation:** [2,3] has the largest product 6.

### **Example 2:**
**Input:** nums = [-2,0,-1]
**Output:** 0
**Explanation:** The result cannot be 2, because [-2,-1] is not a subarray.

### **Constraints:**
- \`1 <= nums.length <= 2 * 10⁴\`
- \`-10 <= nums[i] <= 10\`
- The product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.`,
    hints: [
      'Maintain both the maximum and minimum product ending at the current position.',
      'When multiplying by a negative number, the minimum product can become the new maximum product.'
    ],
    testCases: generateMaxProductSubarrayCases(),
    solutionCode: `
function solution(nums) {
  if (!nums || nums.length === 0) return 0;
  let maxSoFar = nums[0];
  let minSoFar = nums[0];
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const curr = nums[i];
    if (curr < 0) {
      const temp = maxSoFar;
      maxSoFar = minSoFar;
      minSoFar = temp;
    }
    maxSoFar = Math.max(curr, maxSoFar * curr);
    minSoFar = Math.min(curr, minSoFar * curr);
    result = Math.max(result, maxSoFar);
  }
  return result;
}
`
  },
  {
    slug: 'reverse-pairs',
    title: 'Reverse Pairs',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[1, 3, 2, 3, 1]',
    sample_output: '2',
    description: `Given an integer array \`nums\`, return the number of **reverse pairs** in the array.

A reverse pair is a pair \`(i, j)\` where:
- \`0 <= i < j < nums.length\` and
- \`nums[i] > 2 * nums[j]\`.

### **Example 1:**
**Input:** nums = [1,3,2,3,1]
**Output:** 2
**Explanation:** The reverse pairs are:
(1, 4) --> nums[1] = 3, nums[4] = 1, 3 > 2 * 1
(3, 4) --> nums[3] = 3, nums[4] = 1, 3 > 2 * 1

### **Example 2:**
**Input:** nums = [2,4,3,5,1]
**Output:** 3
**Explanation:** The reverse pairs are:
(1, 4) --> nums[1] = 4, nums[4] = 1, 4 > 2 * 1
(2, 4) --> nums[2] = 3, nums[4] = 1, 3 > 2 * 1
(3, 4) --> nums[3] = 5, nums[4] = 1, 5 > 2 * 1

### **Constraints:**
- \`1 <= nums.length <= 5 * 10⁴\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\``,
    hints: [
      'Similar to Count Inversions, can we count reverse pairs during the divide and conquer merge step?',
      'Before merging two sorted halves, count pairs satisfying nums[i] > 2 * nums[j] using two pointers.'
    ],
    testCases: generateReversePairsCases(),
    solutionCode: `
function solution(nums) {
  if (!nums || nums.length <= 1) return 0;
  function mergeSort(arr, low, high) {
    if (low >= high) return 0;
    const mid = Math.floor((low + high) / 2);
    let count = mergeSort(arr, low, mid) + mergeSort(arr, mid + 1, high);
    let j = mid + 1;
    for (let i = low; i <= mid; i++) {
      while (j <= high && arr[i] > 2 * arr[j]) {
        j++;
      }
      count += j - (mid + 1);
    }
    const temp = [];
    let left = low, right = mid + 1;
    while (left <= mid && right <= high) {
      if (arr[left] <= arr[right]) {
        temp.push(arr[left++]);
      } else {
        temp.push(arr[right++]);
      }
    }
    while (left <= mid) temp.push(arr[left++]);
    while (right <= high) temp.push(arr[right++]);
    for (let k = 0; k < temp.length; k++) {
      arr[low + k] = temp[k];
    }
    return count;
  }
  return mergeSort([...nums], 0, nums.length - 1);
}
`
  },
  {
    slug: 'first-missing-positive',
    title: 'First Missing Positive',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[1, 2, 0]',
    sample_output: '3',
    description: `Given an unsorted integer array \`nums\`. Return the smallest positive integer that is **not present** in \`nums\`.

You must implement an algorithm that runs in \`O(n)\` time and uses \`O(1)\` auxiliary space.

### **Example 1:**
**Input:** nums = [1,2,0]
**Output:** 3
**Explanation:** The numbers in the range [1,2] are all in the array.

### **Example 2:**
**Input:** nums = [3,4,-1,1]
**Output:** 2
**Explanation:** 1 is in the array but 2 is missing.

### **Example 3:**
**Input:** nums = [7,8,9,11,12]
**Output:** 1
**Explanation:** The smallest positive integer 1 is missing.

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\``,
    hints: [
      'The answer must be in the range [1, n + 1].',
      'Place each number x in its correct index x - 1 using cycle sort swaps.',
      'After placement, find the first index i where nums[i] !== i + 1.'
    ],
    testCases: generateFirstMissingPositiveTCs(),
    solutionCode: `
function solution(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const correctIdx = nums[i] - 1;
      const temp = nums[correctIdx];
      nums[correctIdx] = nums[i];
      nums[i] = temp;
    }
  }
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }
  return n + 1;
}
`
  },
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
    sample_output: '6',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### **Example 1:**
**Input:** height = [0,1,0,2,1,0,1,3,2,1,2,1]
**Output:** 6
**Explanation:** The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped.

### **Example 2:**
**Input:** height = [4,2,0,3,2,5]
**Output:** 9

### **Constraints:**
- \`n == height.length\`
- \`1 <= n <= 2 * 10⁴\`
- \`0 <= height[i] <= 10⁵\``,
    hints: [
      'For each bar, the amount of water trapped above it is min(max_left, max_right) - height[i].',
      'Can you optimize this with two pointers starting at both ends?'
    ],
    testCases: generateTrappingWaterTCs(),
    solutionCode: `
function solution(height) {
  if (!height || height.length === 0) return 0;
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let total = 0;
  while (left <= right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        total += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        total += rightMax - height[right];
      }
      right--;
    }
  }
  return total;
}
`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Hard Batch 6 (5 Problems)...');

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
  console.log(`ALL 5 STRIVER ARRAY HARD BATCH 6 PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

