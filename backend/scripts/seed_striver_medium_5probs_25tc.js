/**
 * seed_striver_medium_5probs_25tc.js
 * Seeds and validates the next 5 Striver A2Z Array Medium problems with exactly 25 test cases each.
 *
 * Problems:
 * 1. Majority Element (majority-element)
 * 2. Maximum Subarray (maximum-subarray)
 * 3. Best Time to Buy and Sell Stock (best-time-to-buy-and-sell-stock)
 * 4. Rearrange Array Elements by Sign (rearrange-array-elements-by-sign)
 * 5. Next Permutation (next-permutation)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

function generateMajorityElementTCs() {
  const tcs = [
    { input: '[3, 2, 3]', output: '3', is_hidden: false },
    { input: '[2, 2, 1, 1, 1, 2, 2]', output: '2', is_hidden: false },
    { input: '[1]', output: '1', is_hidden: false },
    { input: '[6, 5, 5]', output: '5', is_hidden: true },
    { input: '[1, 1, 2, 1, 3, 5, 1]', output: '1', is_hidden: true },
    { input: '[7, 7, 7, 7]', output: '7', is_hidden: true },
    { input: '[-1, -1, 2]', output: '-1', is_hidden: true },
    { input: '[100, 100, 100, -100]', output: '100', is_hidden: true },
    { input: '[0, 0, 0, 1, 0]', output: '0', is_hidden: true },
    { input: '[-5, -5, -5, -5, 1, 2, 3]', output: '-5', is_hidden: true },
    { input: '[4, 4, 2, 4, 3, 4, 4]', output: '4', is_hidden: true },
    { input: '[8, 8, 7, 7, 7]', output: '7', is_hidden: true },
    { input: '[9, 9, 9, 1, 2, 3, 9, 9, 9]', output: '9', is_hidden: true },
    { input: '[-10, 20, -10, -10, 30, -10, -10]', output: '-10', is_hidden: true },
    { input: '[1, 2, 1, 2, 1, 2, 1]', output: '1', is_hidden: true },
    { input: '[500, 500, 500, 500, 500]', output: '500', is_hidden: true },
    { input: '[-1, -2, -1, -1, 3]', output: '-1', is_hidden: true },
    { input: '[42, 42, 42, 1]', output: '42', is_hidden: true },
    { input: '[10, 10, 20, 10, 20, 10, 10]', output: '10', is_hidden: true },
    { input: '[999999, 999999, 1]', output: '999999', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1001 elements with 501 '7's
  const s21 = new Array(500).fill(1).concat(new Array(501).fill(7));
  tcs.push({ input: JSON.stringify(s21), output: '7', is_hidden: true });

  // 22: 2001 elements with 1001 '-42's
  const s22 = new Array(1000).fill(0).concat(new Array(1001).fill(-42));
  tcs.push({ input: JSON.stringify(s22), output: '-42', is_hidden: true });

  // 23: 5001 elements with 2501 '123's
  const s23 = new Array(2500).fill(99).concat(new Array(2501).fill(123));
  tcs.push({ input: JSON.stringify(s23), output: '123', is_hidden: true });

  // 24: 10001 elements with 5001 '88's
  const s24 = new Array(5000).fill(-1).concat(new Array(5001).fill(88));
  tcs.push({ input: JSON.stringify(s24), output: '88', is_hidden: true });

  // 25: 20001 elements with 10001 '999's
  const s25 = new Array(10000).fill(2).concat(new Array(10001).fill(999));
  tcs.push({ input: JSON.stringify(s25), output: '999', is_hidden: true });

  return tcs;
}

function generateMaximumSubarrayTCs() {
  const tcs = [
    { input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]', output: '6', is_hidden: false },
    { input: '[1]', output: '1', is_hidden: false },
    { input: '[5, 4, -1, 7, 8]', output: '23', is_hidden: false },
    { input: '[-1]', output: '-1', is_hidden: true },
    { input: '[-5, -4, -3, -2, -1]', output: '-1', is_hidden: true },
    { input: '[1, 2, 3, 4, 5]', output: '15', is_hidden: true },
    { input: '[-2, -1]', output: '-1', is_hidden: true },
    { input: '[0, 0, 0, 0]', output: '0', is_hidden: true },
    { input: '[-1, 0, -2]', output: '0', is_hidden: true },
    { input: '[-2, 1]', output: '1', is_hidden: true },
    { input: '[-1, 2, -3, 4, -1, 2, 1, -5, 4]', output: '6', is_hidden: true },
    { input: '[8, -19, 5, -4, 20]', output: '21', is_hidden: true },
    { input: '[-2, -3, 4, -1, -2, 1, 5, -3]', output: '7', is_hidden: true },
    { input: '[100, -50, 200, -300, 400]', output: '400', is_hidden: true },
    { input: '[-3, -2, 0, -1]', output: '0', is_hidden: true },
    { input: '[31, -41, 59, 26, -53, 58, 97, -93, -23, 84]', output: '187', is_hidden: true },
    { input: '[-10, 2, -3, 1, 5, -2, 7, -9, 6]', output: '11', is_hidden: true },
    { input: '[-5, 10, -5, 10, -5]', output: '15', is_hidden: true },
    { input: '[-100, -200, -300]', output: '-100', is_hidden: true },
    { input: '[10, -2, 3, -4, 5, -1, 6]', output: '17', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 all 1s -> 1000
  const s21 = new Array(1000).fill(1);
  tcs.push({ input: JSON.stringify(s21), output: '1000', is_hidden: true });

  // 22: 2000 all -2s -> -2
  const s22 = new Array(2000).fill(-2);
  tcs.push({ input: JSON.stringify(s22), output: '-2', is_hidden: true });

  // 23: 3000 elements alternating [2, -1] -> 1500 + 1 = 1501
  const s23 = [];
  for (let i = 0; i < 1500; i++) { s23.push(2); s23.push(-1); }
  let max23 = 0, cur23 = 0;
  for (const x of s23) { cur23 = Math.max(x, cur23 + x); max23 = Math.max(max23, cur23); }
  tcs.push({ input: JSON.stringify(s23), output: String(max23), is_hidden: true });

  // 24: 5000 elements with a big peak in the middle
  const s24 = new Array(2000).fill(-5).concat([50, 100, 200]).concat(new Array(2997).fill(-10));
  tcs.push({ input: JSON.stringify(s24), output: '350', is_hidden: true });

  // 25: 10000 elements
  const s25 = new Array(5000).fill(-1).concat(new Array(5000).fill(2));
  tcs.push({ input: JSON.stringify(s25), output: '10000', is_hidden: true });

  return tcs;
}

function generateStockTCs() {
  const tcs = [
    { input: '[7, 1, 5, 3, 6, 4]', output: '5', is_hidden: false },
    { input: '[7, 6, 4, 3, 1]', output: '0', is_hidden: false },
    { input: '[1, 2]', output: '1', is_hidden: false },
    { input: '[2, 1, 4]', output: '3', is_hidden: true },
    { input: '[2, 4, 1]', output: '2', is_hidden: true },
    { input: '[1]', output: '0', is_hidden: true },
    { input: '[3, 2, 6, 5, 0, 3]', output: '4', is_hidden: true },
    { input: '[1, 2, 3, 4, 5]', output: '4', is_hidden: true },
    { input: '[5, 4, 3, 2, 1, 10]', output: '9', is_hidden: true },
    { input: '[10, 0, 100, 0, 50]', output: '100', is_hidden: true },
    { input: '[8, 2, 9, 1, 7]', output: '7', is_hidden: true },
    { input: '[100, 180, 260, 310, 40, 535, 695]', output: '655', is_hidden: true },
    { input: '[1, 1, 1, 1]', output: '0', is_hidden: true },
    { input: '[3, 3, 5, 0, 0, 3, 1, 4]', output: '4', is_hidden: true },
    { input: '[6, 1, 3, 2, 4, 7]', output: '6', is_hidden: true },
    { input: '[4, 7, 1, 2]', output: '3', is_hidden: true },
    { input: '[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]', output: '0', is_hidden: true },
    { input: '[2, 1, 2, 1, 0, 1, 2]', output: '2', is_hidden: true },
    { input: '[1, 10000]', output: '9999', is_hidden: true },
    { input: '[5, 2, 10, 1, 6]', output: '8', is_hidden: true },
  ];

  // Stress tests (21 - 25)
  // 21: 1000 strictly decreasing -> 0
  const s21 = [];
  for (let i = 1000; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: '0', is_hidden: true });

  // 22: 2000 strictly increasing -> 1999
  const s22 = [];
  for (let i = 1; i <= 2000; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: '1999', is_hidden: true });

  // 23: 5000 elements with minimum at index 100 and maximum at index 4000
  const s23 = new Array(100).fill(500).concat([1]).concat(new Array(3899).fill(200)).concat([10000]).concat(new Array(999).fill(100));
  tcs.push({ input: JSON.stringify(s23), output: '9999', is_hidden: true });

  // 24: 10000 elements all identical -> 0
  const s24 = new Array(10000).fill(42);
  tcs.push({ input: JSON.stringify(s24), output: '0', is_hidden: true });

  // 25: 20000 elements
  const s25 = [100000].concat(new Array(19998).fill(500)).concat([100000]);
  tcs.push({ input: JSON.stringify(s25), output: '99500', is_hidden: true });

  return tcs;
}

function generateRearrangeTCs() {
  const tcs = [
    { input: '[3, 1, -2, -5, 2, -4]', output: '[3, -2, 1, -5, 2, -4]', is_hidden: false },
    { input: '[-1, 1]', output: '[1, -1]', is_hidden: false },
    { input: '[1, -1, 2, -2]', output: '[1, -1, 2, -2]', is_hidden: false },
    { input: '[2, -3, 4, -5]', output: '[2, -3, 4, -5]', is_hidden: true },
    { input: '[-2, 3, -4, 5]', output: '[3, -2, 5, -4]', is_hidden: true },
    { input: '[1, 2, 3, -1, -2, -3]', output: '[1, -1, 2, -2, 3, -3]', is_hidden: true },
    { input: '[-1, -2, -3, 1, 2, 3]', output: '[1, -1, 2, -2, 3, -3]', is_hidden: true },
    { input: '[10, -20, 30, -40, 50, -60]', output: '[10, -20, 30, -40, 50, -60]', is_hidden: true },
    { input: '[-5, -10, 15, 20]', output: '[15, -5, 20, -10]', is_hidden: true },
    { input: '[100, -100]', output: '[100, -100]', is_hidden: true },
    { input: '[1, -2, 3, -4, 5, -6, 7, -8]', output: '[1, -2, 3, -4, 5, -6, 7, -8]', is_hidden: true },
    { input: '[-8, -6, -4, -2, 1, 3, 5, 7]', output: '[1, -8, 3, -6, 5, -4, 7, -2]', is_hidden: true },
    { input: '[5, -1, 6, -2, 7, -3]', output: '[5, -1, 6, -2, 7, -3]', is_hidden: true },
    { input: '[-1, 5, -2, 6, -3, 7]', output: '[5, -1, 6, -2, 7, -3]', is_hidden: true },
    { input: '[2, 4, 6, -1, -3, -5]', output: '[2, -1, 4, -3, 6, -5]', is_hidden: true },
    { input: '[-10, 10, -20, 20, -30, 30]', output: '[10, -10, 20, -20, 30, -30]', is_hidden: true },
    { input: '[7, -7, 8, -8, 9, -9]', output: '[7, -7, 8, -8, 9, -9]', is_hidden: true },
    { input: '[-50, 50, -100, 100]', output: '[50, -50, 100, -100]', is_hidden: true },
    { input: '[1, 3, -2, -4]', output: '[1, -2, 3, -4]', is_hidden: true },
    { input: '[-3, 1, -5, 2, -7, 4]', output: '[1, -3, 2, -5, 4, -7]', is_hidden: true },
  ];

  function solveRearrange(arr) {
    const pos = arr.filter(x => x > 0);
    const neg = arr.filter(x => x < 0);
    const res = [];
    for (let i = 0; i < pos.length; i++) {
      res.push(pos[i], neg[i]);
    }
    return res;
  }

  // Stress tests (21 - 25)
  // 21: 100 elements
  const s21 = [];
  for (let i = 1; i <= 50; i++) s21.push(i, -i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveRearrange(s21)), is_hidden: true });

  // 22: 200 elements, all negatives first then all positives
  const s22 = [];
  for (let i = 1; i <= 100; i++) s22.push(-i);
  for (let i = 1; i <= 100; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveRearrange(s22)), is_hidden: true });

  // 23: 500 elements
  const s23 = [];
  for (let i = 1; i <= 250; i++) s23.push(i * 2);
  for (let i = 1; i <= 250; i++) s23.push(-i * 2);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveRearrange(s23)), is_hidden: true });

  // 24: 1000 elements
  const s24 = [];
  for (let i = 1; i <= 500; i++) s24.push(i);
  for (let i = 1; i <= 500; i++) s24.push(-i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveRearrange(s24)), is_hidden: true });

  // 25: 2000 elements stress TLE
  const s25 = [];
  for (let i = 1; i <= 1000; i++) s25.push(i, -i);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveRearrange(s25)), is_hidden: true });

  return tcs;
}

function generateNextPermutationTCs() {
  function solveNextPerm(arr) {
    const a = [...arr];
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
    [3, 1, 2],
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveNextPerm(arr)),
    is_hidden: idx >= 3,
  }));

  // Stress tests (21 - 25)
  // 21: 100 elements sorted ascending
  const s21 = [];
  for (let i = 1; i <= 100; i++) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveNextPerm(s21)), is_hidden: true });

  // 22: 100 elements sorted descending
  const s22 = [];
  for (let i = 100; i >= 1; i--) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveNextPerm(s22)), is_hidden: true });

  // 23: 200 elements with identical numbers
  const s23 = new Array(100).fill(1).concat(new Array(100).fill(2));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveNextPerm(s23)), is_hidden: true });

  // 24: 500 elements
  const s24 = [];
  for (let i = 1; i <= 250; i++) s24.push(i);
  for (let i = 500; i >= 251; i--) s24.push(i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveNextPerm(s24)), is_hidden: true });

  // 25: 1000 elements stress TLE
  const s25 = [];
  for (let i = 1; i <= 998; i++) s25.push(i);
  s25.push(1000, 999);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveNextPerm(s25)), is_hidden: true });

  return tcs;
}

const PROBLEMS = [
  {
    title: 'Majority Element',
    slug: 'majority-element',
    topic: 'arrays',
    difficulty: 'medium',
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

**Follow-up:** Could you solve the problem in linear time and in \`O(1)\` space (Moore's Voting Algorithm)?`,
    hints: [
      'Can you count frequencies using a hash map?',
      "Can Moore's Voting Algorithm find the candidate in O(N) time and O(1) space?"
    ],
    sample_input: '[3, 2, 3]',
    sample_output: '3',
    testCases: generateMajorityElementTCs(),
    solutionCode: `function solution(nums) {
      let count = 0, candidate = null;
      for (const num of nums) {
        if (count === 0) candidate = num;
        count += (num === candidate) ? 1 : -1;
      }
      return candidate;
    }`
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    topic: 'arrays',
    difficulty: 'medium',
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

**Follow up:** If you have figured out the \`O(n)\` solution, try coding another solution using the divide and conquer approach, which is more subtle.`,
    hints: [
      "Kadane's algorithm keeps track of the current subarray sum.",
      'If the current sum drops below zero, reset it to zero as it cannot contribute positively to any future subarray.'
    ],
    sample_input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]',
    sample_output: '6',
    testCases: generateMaximumSubarrayTCs(),
    solutionCode: `function solution(nums) {
      let maxSoFar = nums[0];
      let curr = nums[0];
      for (let i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        maxSoFar = Math.max(maxSoFar, curr);
      }
      return maxSoFar;
    }`
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    topic: 'arrays',
    difficulty: 'easy',
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
      'At each day, the potential profit is prices[i] - minPrice.'
    ],
    sample_input: '[7, 1, 5, 3, 6, 4]',
    sample_output: '5',
    testCases: generateStockTCs(),
    solutionCode: `function solution(prices) {
      let minPrice = Infinity;
      let maxProfit = 0;
      for (const p of prices) {
        if (p < minPrice) minPrice = p;
        else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
      }
      return maxProfit;
    }`
  },
  {
    title: 'Rearrange Array Elements by Sign',
    slug: 'rearrange-array-elements-by-sign',
    topic: 'arrays',
    difficulty: 'medium',
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
      'Maintain two pointers: posIndex starting at 0, and negIndex starting at 1.'
    ],
    sample_input: '[3, 1, -2, -5, 2, -4]',
    sample_output: '[3, -2, 1, -5, 2, -4]',
    testCases: generateRearrangeTCs(),
    solutionCode: `function solution(nums) {
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
    }`
  },
  {
    title: 'Next Permutation',
    slug: 'next-permutation',
    topic: 'arrays',
    difficulty: 'medium',
    description: `A **permutation** of an array of integers is an arrangement of its members into a sequence or linear order.

- For example, for \`arr = [1,2,3]\`, the following are all the permutations of \`arr\`: \`[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]\`.

The **next permutation** of an array of integers is the next lexicographically greater permutation of its integer. More formally, if all the permutations of the array are sorted in one container according to their lexicographical order, then the next permutation of that array is the permutation that follows it in the sorted container. If such arrangement is not possible, the array must be rearranged as the lowest possible order (i.e., sorted in ascending order).

- For example, the next permutation of \`arr = [1,2,3]\` is \`[1,3,2]\`.
- Similarly, the next permutation of \`arr = [2,3,1]\` is \`[3,1,2]\`.
- While the next permutation of \`arr = [3,2,1]\` is \`[1,2,3]\` because \`[3,2,1]\` does not have a lexicographical larger rearrangement.

Given an array of integers \`nums\`, *find the next permutation of* \`nums\`.

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
- \`1 <= nums.length <= 100\`
- \`0 <= nums[i] <= 100\``,
    hints: [
      'Find the first decreasing element from the right: a[i] < a[i + 1].',
      'Find the element just larger than a[i] from the right: a[j] > a[i], swap them.',
      'Reverse the suffix starting from i + 1.'
    ],
    sample_input: '[1, 2, 3]',
    sample_output: '[1, 3, 2]',
    testCases: generateNextPermutationTCs(),
    solutionCode: `function solution(nums) {
      let i = nums.length - 2;
      while (i >= 0 && nums[i] >= nums[i + 1]) i--;
      if (i >= 0) {
        let j = nums.length - 1;
        while (nums[j] <= nums[i]) j--;
        const temp = nums[i]; nums[i] = nums[j]; nums[j] = temp;
      }
      let l = i + 1, r = nums.length - 1;
      while (l < r) {
        const temp = nums[l]; nums[l] = nums[r]; nums[r] = temp;
        l++; r--;
      }
      return nums;
    }`
  }
];

async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for 5 Medium Striver Array Problems...');

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

  console.log('\n========================================\nALL 5 PROBLEMS SEEDED & VALIDATED WITH 25/25 ACCEPTED!\n');
  process.exit(0);
}

seedAndVerify().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
