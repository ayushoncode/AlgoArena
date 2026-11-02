/**
 * backend/scripts/upgrade_striver_arrays_medium_batch3_25tc.js
 *
 * Upgrades Striver Step 3 Arrays Medium Batch 3 (5 Problems) to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests (N = 40,000 to 50,000).
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute force with TLE (> 2000ms).
 *
 * Problems:
 * 1. Majority Element (majority-element) [LC 169]
 * 2. Maximum Subarray (maximum-subarray) [LC 53]
 * 3. Best Time to Buy and Sell Stock (best-time-to-buy-and-sell-stock) [LC 121]
 * 4. Rearrange Array Elements by Sign (rearrange-array-elements-by-sign) [LC 2149]
 * 5. Next Permutation (next-permutation) [LC 31]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers for 100% accurate oracle outputs
function solveMajorityElement(nums) {
  let candidate = null;
  let count = 0;
  for (const num of nums) {
    if (count === 0) candidate = num;
    count += (num === candidate ? 1 : -1);
  }
  return candidate;
}

function solveMaximumSubarray(nums) {
  let maxSoFar = nums[0];
  let curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSoFar = Math.max(maxSoFar, curr);
  }
  return maxSoFar;
}

function solveBestTimeStock(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p;
    else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
  }
  return maxProfit;
}

function solveRearrange(nums) {
  const res = new Array(nums.length);
  let pos = 0, neg = 1;
  for (const x of nums) {
    if (x > 0) {
      res[pos] = x;
      pos += 2;
    } else {
      res[neg] = x;
      neg += 2;
    }
  }
  return res;
}

function solveNextPermutation(nums) {
  const a = [...nums];
  let i = a.length - 2;
  while (i >= 0 && a[i] >= a[i + 1]) i--;
  if (i >= 0) {
    let j = a.length - 1;
    while (a[j] <= a[i]) j--;
    [a[i], a[j]] = [a[j], a[i]];
  }
  let l = i + 1, r = a.length - 1;
  while (l < r) {
    [a[l], a[r]] = [a[r], a[l]];
    l++; r--;
  }
  return a;
}

// ── TEST CASE GENERATORS ──────────────────────────────────────────────────

function generateMajorityElementTCs() {
  const baseCases = [
    [3, 2, 3],
    [2, 2, 1, 1, 1, 2, 2],
    [1],
    [6, 5, 5],
    [1, 1, 2, 1, 3, 5, 1],
    [7, 7, 7, 7],
    [-1, -1, 2],
    [100, 100, 100, -100],
    [0, 0, 0, 1, 0],
    [-5, -5, -5, -5, 1, 2, 3],
    [4, 4, 2, 4, 3, 4, 4],
    [8, 8, 7, 7, 7],
    [9, 9, 9, 1, 2, 3, 9, 9, 9],
    [-10, 20, -10, -10, 30, -10, -10],
    [1, 2, 1, 2, 1, 2, 1],
    [500, 500, 500, 500, 500],
    [-1, -2, -1, -1, 3],
    [42, 42, 42, 1],
    [10, 10, 20, 10, 20, 10, 10],
    [999999, 999999, 1]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMajorityElement(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 1,001 elements with 501 '7's
  const s21 = new Array(500).fill(1).concat(new Array(501).fill(7));
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveMajorityElement(s21)), is_hidden: true });

  // 22: 5,001 elements with 2,501 '-42's
  const s22 = new Array(2500).fill(10).concat(new Array(2501).fill(-42));
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveMajorityElement(s22)), is_hidden: true });

  // 23: 15,001 elements
  const s23 = new Array(7500).fill(3).concat(new Array(7501).fill(88));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveMajorityElement(s23)), is_hidden: true });

  // 24: 30,001 elements
  const s24 = [];
  for (let i = 0; i < 15000; i++) s24.push(i);
  for (let i = 0; i < 15001; i++) s24.push(777777);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveMajorityElement(s24)), is_hidden: true });

  // 25: 90,001 elements (STRICTLY KILLS O(N^2) brute force — majority element placed at the end)
  // Brute force will check 45,000 distinct elements against 90,001 array => 4.05 Billion ops > 2000ms TLE
  const s25 = [];
  for (let i = 0; i < 45000; i++) s25.push(i);
  for (let i = 0; i < 45001; i++) s25.push(9999999);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveMajorityElement(s25)), is_hidden: true });

  return tcs;
}

function generateMaximumSubarrayTCs() {
  const baseCases = [
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    [1],
    [5, 4, -1, 7, 8],
    [-1],
    [-5, -4, -3, -2, -1],
    [1, 2, 3, 4, 5],
    [-2, -1],
    [0, 0, 0, 0],
    [-1, 0, -2],
    [-2, 1],
    [-1, 2, -3, 4, -1, 2, 1, -5, 4],
    [8, -19, 5, -4, 20],
    [-2, -3, 4, -1, -2, 1, 5, -3],
    [100, -50, 200, -300, 400],
    [-3, -2, 0, -1],
    [31, -41, 59, 26, -53, 58, 97, -93, -23, 84],
    [-10, 2, -3, 1, 5, -2, 7, -9, 6],
    [-5, 10, -5, 10, -5],
    [-100, -200, -300],
    [10, -2, 3, -4, 5, -1, 6]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMaximumSubarray(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 elements all 1s
  const s21 = new Array(2000).fill(1);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveMaximumSubarray(s21)), is_hidden: true });

  // 22: 5,000 elements alternating [2, -1]
  const s22 = [];
  for (let i = 0; i < 2500; i++) { s22.push(2); s22.push(-1); }
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveMaximumSubarray(s22)), is_hidden: true });

  // 23: 10,000 elements with a big peak
  const s23 = new Array(5000).fill(-5).concat([50, 100, 200]).concat(new Array(4997).fill(-10));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveMaximumSubarray(s23)), is_hidden: true });

  // 24: 25,000 elements
  const s24 = [];
  for (let i = 0; i < 25000; i++) s24.push(i % 3 === 0 ? 3 : -2);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveMaximumSubarray(s24)), is_hidden: true });

  // 25: 75,000 elements (STRICTLY KILLS O(N^2) brute force — 2.8 Billion ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push(i % 5 === 0 ? 4 : -1);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveMaximumSubarray(s25)), is_hidden: true });

  return tcs;
}

function generateStockTCs() {
  const baseCases = [
    [7, 1, 5, 3, 6, 4],
    [7, 6, 4, 3, 1],
    [1, 2],
    [2, 1, 4],
    [2, 4, 1],
    [1],
    [3, 2, 6, 5, 0, 3],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1, 10],
    [10, 0, 100, 0, 50],
    [8, 2, 9, 1, 7],
    [100, 180, 260, 310, 40, 535, 695],
    [1, 1, 1, 1],
    [3, 3, 5, 0, 0, 3, 1, 4],
    [6, 1, 3, 2, 4, 7],
    [4, 7, 1, 2],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [2, 1, 2, 1, 0, 1, 2],
    [1, 10000],
    [5, 2, 10, 1, 6]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveBestTimeStock(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 elements strictly descending (profit = 0)
  const s21 = [];
  for (let i = 2000; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveBestTimeStock(s21)), is_hidden: true });

  // 22: 5,000 elements strictly ascending
  const s22 = [];
  for (let i = 1; i <= 5000; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveBestTimeStock(s22)), is_hidden: true });

  // 23: 15,000 elements
  const s23 = new Array(7500).fill(500).concat([1]).concat(new Array(7499).fill(100));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveBestTimeStock(s23)), is_hidden: true });

  // 24: 30,000 elements
  const s24 = [];
  for (let i = 0; i < 30000; i++) s24.push((i * 37) % 10000);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveBestTimeStock(s24)), is_hidden: true });

  // 25: 75,000 elements (STRICTLY KILLS O(N^2) brute force — 2.8 Billion ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push(75000 - i);
  s25[37500] = 1;
  s25[74999] = 99999;
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveBestTimeStock(s25)), is_hidden: true });

  return tcs;
}

function generateRearrangeTCs() {
  const baseCases = [
    [3, 1, -2, -5, 2, -4],
    [-1, 1],
    [1, -1, 2, -2],
    [2, -3, 4, -5],
    [-2, 3, -4, 5],
    [1, 2, 3, -1, -2, -3],
    [-1, -2, -3, 1, 2, 3],
    [10, -20, 30, -40, 50, -60],
    [-5, -10, 15, 20],
    [100, -100],
    [1, -2, 3, -4, 5, -6, 7, -8],
    [-8, -6, -4, -2, 1, 3, 5, 7],
    [5, -1, 6, -2, 7, -3],
    [-1, 5, -2, 6, -3, 7],
    [2, 4, 6, -1, -3, -5],
    [-10, 10, -20, 20, -30, 30],
    [7, -7, 8, -8, 9, -9],
    [-50, 50, -100, 100],
    [1, 3, -2, -4],
    [-3, 1, -5, 2, -7, 4]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveRearrange(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 1,000 elements
  const s21 = [];
  for (let i = 1; i <= 500; i++) s21.push(i, -i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveRearrange(s21)), is_hidden: true });

  // 22: 3,000 elements, all negatives first then all positives
  const s22 = [];
  for (let i = 1; i <= 1500; i++) s22.push(-i);
  for (let i = 1; i <= 1500; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveRearrange(s22)), is_hidden: true });

  // 23: 10,000 elements
  const s23 = [];
  for (let i = 1; i <= 5000; i++) s23.push(i * 2);
  for (let i = 1; i <= 5000; i++) s23.push(-i * 2);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveRearrange(s23)), is_hidden: true });

  // 24: 25,000 elements
  const s24 = [];
  for (let i = 1; i <= 12500; i++) s24.push(i);
  for (let i = 1; i <= 12500; i++) s24.push(-i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveRearrange(s24)), is_hidden: true });

  // 25: 40,000 elements
  const s25 = [];
  for (let i = 1; i <= 20000; i++) s25.push(i, -i);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveRearrange(s25)), is_hidden: true });

  return tcs;
}

function generateNextPermutationTCs() {
  const baseCases = [
    [1, 2, 3],
    [3, 2, 1],
    [1, 1, 5],
    [1],
    [1, 3, 2],
    [2, 3, 1],
    [5, 4, 7, 5, 3, 2],
    [1, 5, 1],
    [1, 2],
    [2, 1],
    [1, 3, 5, 4, 2],
    [4, 3, 2, 1],
    [1, 2, 4, 3],
    [2, 2, 7, 5, 4, 3, 2, 2, 1],
    [1, 5, 8, 4, 7, 6, 5, 3, 1],
    [6, 5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    [2, 1, 3],
    [3, 1, 2]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveNextPermutation(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 1,000 elements sorted ascending
  const s21 = [];
  for (let i = 1; i <= 1000; i++) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveNextPermutation(s21)), is_hidden: true });

  // 22: 3,000 elements sorted descending
  const s22 = [];
  for (let i = 3000; i >= 1; i--) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveNextPermutation(s22)), is_hidden: true });

  // 23: 10,000 elements with identical numbers
  const s23 = new Array(5000).fill(1).concat(new Array(5000).fill(2));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveNextPermutation(s23)), is_hidden: true });

  // 24: 25,000 elements
  const s24 = [];
  for (let i = 1; i <= 12500; i++) s24.push(i);
  for (let i = 25000; i >= 12501; i--) s24.push(i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveNextPermutation(s24)), is_hidden: true });

  // 25: 40,000 elements
  const s25 = [];
  for (let i = 1; i <= 20000; i++) s25.push(i);
  for (let i = 40000; i >= 20001; i--) s25.push(i);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveNextPermutation(s25)), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'majority-element',
    title: 'Majority Element',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[3, 2, 3]',
    sample_output: '3',
    description: `Given an array \`nums\` of size \`n\`, return the majority element.

The majority element is the element that appears more than \`⌊n / 2⌋\` times. You may assume that the majority element always exists in the array.

### **Example 1:**
**Input:** nums = [3,2,3]
**Output:** 3

### **Example 2:**
**Input:** nums = [2,2,1,1,1,2,2]
**Output:** 2

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 5 * 10⁴\`
- \`-10⁹ <= nums[i] <= 10⁹\`

**Follow-up:** Could you solve the problem in linear time and in \`O(1)\` space?`,
    hints: [
      'Try Boyer-Moore Voting Algorithm: maintain a candidate and a counter.',
      'If the counter reaches 0, pick the current element as candidate.',
      'Increment the counter if the element matches candidate, decrement otherwise.'
    ],
    testCases: generateMajorityElementTCs(),
    solutionCode: `
function solution(nums) {
  let candidate = null;
  let count = 0;
  for (const num of nums) {
    if (count === 0) candidate = num;
    count += (num === candidate ? 1 : -1);
  }
  return candidate;
}
`
  },
  {
    slug: 'maximum-subarray',
    title: 'Maximum Subarray',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]',
    sample_output: '6',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

### **Example 1:**
**Input:** nums = [-2,1,-3,4,-1,2,1,-5,4]
**Output:** 6
**Explanation:** The subarray [4,-1,2,1] has the largest sum 6.

### **Example 2:**
**Input:** nums = [1]
**Output:** 1
**Explanation:** The subarray [1] has the largest sum 1.

### **Example 3:**
**Input:** nums = [5,4,-1,7,8]
**Output:** 23
**Explanation:** The subarray [5,4,-1,7,8] has the largest sum 23.

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-10⁴ <= nums[i] <= 10⁴\`

**Follow up:** If you have figured out the \`O(n)\` solution, try coding another solution using the **divide and conquer** approach, which is more subtle.`,
    hints: [
      "Use Kadane's algorithm: iterate through nums maintaining a running sum.",
      'Reset running sum to 0 whenever it dips below 0 (or start fresh at current element).',
      'Keep track of the maximum running sum seen so far.'
    ],
    testCases: generateMaximumSubarrayTCs(),
    solutionCode: `
function solution(nums) {
  let maxSoFar = nums[0];
  let curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSoFar = Math.max(maxSoFar, curr);
  }
  return maxSoFar;
}
`
  },
  {
    slug: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[7, 1, 5, 3, 6, 4]',
    sample_output: '5',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

### **Example 1:**
**Input:** prices = [7,1,5,3,6,4]
**Output:** 5
**Explanation:** Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.

### **Example 2:**
**Input:** prices = [7,6,4,3,1]
**Output:** 0
**Explanation:** In this case, no transactions are done and the max profit = 0.

### **Constraints:**
- \`1 <= prices.length <= 10⁵\`
- \`0 <= prices[i] <= 10⁴\``,
    hints: [
      'Keep track of the minimum buying price seen so far as you iterate through the days.',
      'At each day, the potential profit is prices[i] - minPrice.',
      'Update the overall maximum profit whenever the potential profit is higher.'
    ],
    testCases: generateStockTCs(),
    solutionCode: `
function solution(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p;
    else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
  }
  return maxProfit;
}
`
  },
  {
    slug: 'rearrange-array-elements-by-sign',
    title: 'Rearrange Array Elements by Sign',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[3, 1, -2, -5, 2, -4]',
    sample_output: '[3, -2, 1, -5, 2, -4]',
    description: `You are given a **0-indexed** integer array \`nums\` of **even** length consisting of an **equal** number of positive and negative integers.

You should **rearrange** the elements of \`nums\` such that the modified array follows the given conditions:
1. Every **consecutive pair** of integers have **opposite signs**.
2. For all integers with the same sign, the **order** in which they were present in \`nums\` is **preserved**.
3. The rearranged array begins with a positive integer.

Return the modified array after rearranging the elements to satisfy the aforementioned conditions.

### **Example 1:**
**Input:** nums = [3,1,-2,-5,2,-4]
**Output:** [3,-2,1,-5,2,-4]
**Explanation:**
The positive integers in nums are [3,1,2]. The negative integers are [-2,-5,-4].
The only possible way to rearrange them such that they alternate signs is [3,-2,1,-5,2,-4].

### **Example 2:**
**Input:** nums = [-1,1]
**Output:** [1,-1]
**Explanation:**
1 is the only positive integer and -1 the only negative integer in nums.
So nums is rearranged to [1,-1].

### **Constraints:**
- \`2 <= nums.length <= 2 * 10⁵\`
- \`nums.length\` is even
- \`1 <= |nums[i]| <= 10⁵\`
- \`nums\` consists of **equal** number of positive and negative integers.`,
    hints: [
      'Positive numbers must be placed at even indices (0, 2, 4...) and negative numbers at odd indices (1, 3, 5...).',
      'Maintain two pointers: posIndex starting at 0, and negIndex starting at 1.',
      'Place each element into its corresponding pointer index in a new result array.'
    ],
    testCases: generateRearrangeTCs(),
    solutionCode: `
function solution(nums) {
  const res = new Array(nums.length);
  let pos = 0, neg = 1;
  for (const x of nums) {
    if (x > 0) {
      res[pos] = x;
      pos += 2;
    } else {
      res[neg] = x;
      neg += 2;
    }
  }
  return res;
}
`
  },
  {
    slug: 'next-permutation',
    title: 'Next Permutation',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1, 2, 3]',
    sample_output: '[1, 3, 2]',
    description: `A **permutation** of an array of integers is an arrangement of its members into a sequence or linear order.

- For example, for \`arr = [1,2,3]\`, the following are all the permutations of \`arr\`: \`[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]\`.

The **next permutation** of an array of integers is the next lexicographically greater permutation of its integer. More formally, if all the permutations of the array are sorted in one container according to their lexicographical order, then the next permutation of that array is the permutation that follows it in the sorted container. If such arrangement is not possible, the array must be rearranged as the lowest possible order (i.e., sorted in ascending order).

- For example, the next permutation of \`arr = [1,2,3]\` is \`[1,3,2]\`.
- Similarly, the next permutation of \`arr = [2,3,1]\` is \`[3,1,2]\`.
- While the next permutation of \`arr = [3,2,1]\` is \`[1,2,3]\` because \`[3,2,1]\` does not have a lexicographical larger rearrangement.

Given an array of integers \`nums\`, find the next permutation of \`nums\`.

The replacement must be **in place** and use only constant extra memory.

### **Example 1:**
**Input:** nums = [1,2,3]
**Output:** [1,3,2]

### **Example 2:**
**Input:** nums = [3,2,1]
**Output:** [1,2,3]

### **Example 3:**
**Input:** nums = [1,1,5]
**Output:** [1,5,1]

### **Constraints:**
- \`1 <= nums.length <= 5 * 10⁴\`
- \`0 <= nums[i] <= 100\``,
    hints: [
      'Find the first decreasing element from the right: a[i] < a[i + 1].',
      'Find the number strictly greater than a[i] from the right end, and swap them.',
      'Reverse the sub-array from index i + 1 to the end.'
    ],
    testCases: generateNextPermutationTCs(),
    solutionCode: `
function solution(nums) {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  let l = i + 1, r = nums.length - 1;
  while (l < r) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
    l++; r--;
  }
  return nums;
}
`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Medium Batch 3 (5 Problems)...');

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
  console.log(`ALL 5 STRIVER ARRAY MEDIUM BATCH 3 PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
