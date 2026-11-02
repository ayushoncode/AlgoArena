/**
 * backend/scripts/upgrade_striver_arrays_hard_batch5_25tc.js
 *
 * Upgrades Striver Step 3 Arrays Hard Batch 5 (4 Problems) to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests (N = 50,000 to 75,000).
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute force with TLE (> 2000ms).
 *
 * Problems:
 * 1. Largest Subarray with 0 Sum (largest-subarray-with-0-sum)
 * 2. Subarrays with XOR K (subarrays-with-xor-k)
 * 3. Find Missing and Repeated Values (find-missing-and-repeated-values) [LC 2965]
 * 4. Count Inversions (count-inversions)
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers
function solveLargestSubarray0Sum(nums) {
  const map = new Map();
  let maxLen = 0;
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (sum === 0) {
      maxLen = i + 1;
    } else if (map.has(sum)) {
      maxLen = Math.max(maxLen, i - map.get(sum));
    } else {
      map.set(sum, i);
    }
  }
  return maxLen;
}

function solveSubarraysWithXorK(nums, k) {
  let count = 0;
  let xor = 0;
  const map = new Map();
  map.set(0, 1);
  for (const num of nums) {
    xor ^= num;
    const target = xor ^ k;
    if (map.has(target)) {
      count += map.get(target);
    }
    map.set(xor, (map.get(xor) || 0) + 1);
  }
  return count;
}

function solveMissingRepeating(nums) {
  const n = nums.length;
  let a = -1, b = -1;
  const count = new Int32Array(n + 1);
  for (const num of nums) count[num]++;
  for (let i = 1; i <= n; i++) {
    if (count[i] === 2) a = i;
    else if (count[i] === 0) b = i;
  }
  return [a, b];
}

function solveCountInversions(nums) {
  if (!nums || nums.length <= 1) return 0;
  function mergeSort(arr, low, high) {
    if (low >= high) return 0;
    const mid = Math.floor((low + high) / 2);
    let invCount = mergeSort(arr, low, mid) + mergeSort(arr, mid + 1, high);
    const temp = [];
    let left = low, right = mid + 1;
    while (left <= mid && right <= high) {
      if (arr[left] <= arr[right]) {
        temp.push(arr[left++]);
      } else {
        invCount += (mid - left + 1);
        temp.push(arr[right++]);
      }
    }
    while (left <= mid) temp.push(arr[left++]);
    while (right <= high) temp.push(arr[right++]);
    for (let k = 0; k < temp.length; k++) {
      arr[low + k] = temp[k];
    }
    return invCount;
  }
  return mergeSort([...nums], 0, nums.length - 1);
}

// ── TEST CASE GENERATORS ──────────────────────────────────────────────────

function generateLargestSubarray0SumCases() {
  const baseCases = [
    [15, -2, 2, -8, 1, 7, 10, 23],
    [2, 10, 4],
    [1, 0, 3],
    [0],
    [1, -1],
    [1, 2, 3],
    [-1, -2, -3],
    [0, 0, 0, 0],
    [1, 2, -3, 3, -1, -2],
    [1, 3, -5, 6, -2],
    [1, -1, 1, -1, 1, -1],
    [4, 2, -3, 1, 6],
    [-2, 2, -8, 1, 7, 10, 23],
    [2, 8, -3, -5, 2, -4, 6, 1, 2, 1, -3, 4],
    [1, -1, 3, 2, -2, -8, 1, 7, 10, 23],
    [-1, 1, -1, 1],
    [10, -10, 20, -20, 30, -30],
    [3, 1, -2, -5, 2, -4],
    [5, -3, 2, 1, -4, 2, -1],
    [9, -3, 3, -1, 6, -5]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveLargestSubarray0Sum([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 zeros
  const s21 = new Array(2000).fill(0);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(2000), is_hidden: true });

  // 22: 5,000 alternating 1 and -1
  const s22 = [];
  for (let i = 0; i < 5000; i++) s22.push(i % 2 === 0 ? 1 : -1);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(5000), is_hidden: true });

  // 23: 15,000 elements with giant 0-sum subarray
  const s23 = new Array(15000).fill(1);
  s23[500] = 5000;
  s23[14500] = -5000;
  for (let i = 501; i < 14500; i++) s23[i] = (i % 2 === 0 ? 2 : -2);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveLargestSubarray0Sum([...s23])), is_hidden: true });

  // 24: 35,000 pseudo-random elements
  const s24 = [];
  for (let i = 0; i < 35000; i++) s24.push((i * 17) % 21 - 10);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveLargestSubarray0Sum([...s24])), is_hidden: true });

  // 25: 75,000 elements (STRICTLY KILLS O(N^2) brute force — 2.8B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push(i % 3 === 0 ? 2 : -1);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveLargestSubarray0Sum([...s25])), is_hidden: true });

  return tcs;
}

function generateSubarraysWithXorKCases() {
  const baseCases = [
    { nums: [4, 2, 2, 6, 4], k: 6 },
    { nums: [5, 6, 7, 8, 9], k: 5 },
    { nums: [1, 1, 1, 1], k: 0 },
    { nums: [1], k: 1 },
    { nums: [1], k: 0 },
    { nums: [2, 2, 2], k: 2 },
    { nums: [0, 0, 0, 0], k: 0 },
    { nums: [1, 2, 3, 4, 5], k: 3 },
    { nums: [3, 2, 2, 3, 5], k: 4 },
    { nums: [1, 2, 4, 8, 16], k: 7 },
    { nums: [7, 7, 7, 7, 7], k: 7 },
    { nums: [10, 5, 2, 7, 1, 9], k: 8 },
    { nums: [15, 20, 25, 30], k: 10 },
    { nums: [5, 3, 8, 3, 10], k: 8 },
    { nums: [1, 3, 5, 7, 9, 11], k: 2 },
    { nums: [6, 3, 1, 8, 2], k: 5 },
    { nums: [4, 2, 2, 6, 4, 2, 6], k: 6 },
    { nums: [12, 10, 8, 6, 4, 2], k: 14 },
    { nums: [100, 200, 300, 400], k: 100 },
    { nums: [1, 2, 1, 2, 1, 2], k: 3 }
  ];

  const tcs = baseCases.map(({ nums, k }, idx) => ({
    input: `${JSON.stringify(nums)}, ${k}`,
    output: JSON.stringify(solveSubarraysWithXorK([...nums], k)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 zeros, k = 0
  const s21 = new Array(2000).fill(0);
  tcs.push({ input: `${JSON.stringify(s21)}, 0`, output: JSON.stringify((2000 * 2001) / 2), is_hidden: true });

  // 22: 5,000 ones, k = 1
  const s22 = new Array(5000).fill(1);
  tcs.push({ input: `${JSON.stringify(s22)}, 1`, output: JSON.stringify(solveSubarraysWithXorK(s22, 1)), is_hidden: true });

  // 23: 15,000 power of twos
  const s23 = [];
  for (let i = 0; i < 15000; i++) s23.push(1 << (i % 20));
  tcs.push({ input: `${JSON.stringify(s23)}, 15`, output: JSON.stringify(solveSubarraysWithXorK(s23, 15)), is_hidden: true });

  // 24: 35,000 elements, k = 12
  const s24 = [];
  for (let i = 0; i < 35000; i++) s24.push((i * 13) % 31);
  tcs.push({ input: `${JSON.stringify(s24)}, 12`, output: JSON.stringify(solveSubarraysWithXorK(s24, 12)), is_hidden: true });

  // 25: 85,000 elements (STRICTLY KILLS O(N^2) brute force — 3.6B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 85000; i++) s25.push((i * 37) % 63);
  tcs.push({ input: `${JSON.stringify(s25)}, 25`, output: JSON.stringify(solveSubarraysWithXorK(s25, 25)), is_hidden: true });

  return tcs;
}

function generateMissingRepeatingCases() {
  const baseCases = [
    [1, 3, 3],
    [2, 2],
    [4, 3, 6, 2, 1, 1],
    [1, 1],
    [3, 1, 2, 5, 3],
    [2, 3, 1, 5, 1],
    [1, 2, 3, 4, 5, 6, 7, 8, 8],
    [9, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [2, 1, 3, 4, 5, 6, 7, 8, 8],
    [5, 4, 3, 2, 2],
    [1, 4, 3, 5, 5],
    [6, 5, 4, 3, 2, 6],
    [1, 2, 4, 4],
    [2, 3, 4, 2],
    [1, 2, 3, 4, 5, 6, 7, 7],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 2],
    [1, 3, 4, 5, 6, 7, 8, 9, 10, 1],
    [8, 7, 6, 5, 4, 3, 2, 1, 8],
    [3, 2, 1, 4, 5, 6, 7, 8, 9, 10, 10],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveMissingRepeating([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 elements
  const s21 = [];
  for (let i = 1; i <= 1999; i++) s21.push(i);
  s21.push(1);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([1, 2000]), is_hidden: true });

  // 22: 5,000 elements
  const s22 = [];
  for (let i = 2; i <= 5000; i++) s22.push(i);
  s22.push(5000);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify([5000, 1]), is_hidden: true });

  // 23: 15,000 elements
  const s23 = [];
  for (let i = 1; i <= 15000; i++) {
    if (i === 7777) s23.push(42);
    else s23.push(i);
  }
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify([42, 7777]), is_hidden: true });

  // 24: 35,000 elements
  const s24 = [];
  for (let i = 1; i <= 35000; i++) {
    if (i === 15000) s24.push(9999);
    else s24.push(i);
  }
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify([9999, 15000]), is_hidden: true });

  // 25: 60,000 elements scale stress test
  const s25 = [];
  for (let i = 1; i <= 60000; i++) {
    if (i === 30000) s25.push(12345);
    else s25.push(i);
  }
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify([12345, 30000]), is_hidden: true });

  return tcs;
}

function generateCountInversionsCases() {
  const baseCases = [
    [2, 4, 1, 3, 5],
    [2, 3, 4, 5, 6],
    [10, 10, 10],
    [5, 4, 3, 2, 1],
    [1],
    [],
    [1, 20, 6, 4, 5],
    [8, 4, 2, 1],
    [3, 1, 2],
    [1, 3, 2, 3, 1],
    [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [1, 2, 3, 5, 4],
    [9, 8, 7, 6, 5],
    [2, 1],
    [1, 2],
    [6, 3, 9, 2, 10],
    [10, 3, 2, 1, 5, 6],
    [4, 3, 2, 1, 0],
    [10, 9, 8, 1, 2, 3],
    [7, 1, 5, 3, 6, 4]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveCountInversions([...arr])),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 strictly decreasing
  const s21 = [];
  for (let i = 2000; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify((2000 * 1999) / 2), is_hidden: true });

  // 22: 5,000 strictly increasing (0 inversions)
  const s22 = [];
  for (let i = 1; i <= 5000; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(0), is_hidden: true });

  // 23: 15,000 identical elements
  const s23 = new Array(15000).fill(42);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(0), is_hidden: true });

  // 24: 35,000 elements first half large, second half small
  const s24 = [...new Array(17500).fill(100), ...new Array(17500).fill(1)];
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(17500 * 17500), is_hidden: true });

  // 25: 75,000 pseudo-random elements (STRICTLY KILLS O(N^2) brute force — 2.8B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 0; i < 75000; i++) s25.push((i * 47) % 500);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveCountInversions([...s25])), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'largest-subarray-with-0-sum',
    title: 'Largest Subarray with 0 Sum',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[15, -2, 2, -8, 1, 7, 10, 23]',
    sample_output: '5',
    description: `Given an array \`arr\` of integers, find the length of the longest subarray with sum equal to \`0\`.

If no such subarray exists, return \`0\`.

### **Example 1:**
**Input:** arr = [15, -2, 2, -8, 1, 7, 10, 23]
**Output:** 5
**Explanation:** The largest subarray with sum 0 is \`[-2, 2, -8, 1, 7]\` which has a length of 5.

### **Example 2:**
**Input:** arr = [2, 10, 4]
**Output:** 0
**Explanation:** There is no subarray with sum 0.

### **Example 3:**
**Input:** arr = [1, 0, 3]
**Output:** 1
**Explanation:** The subarray \`[0]\` has sum 0 and length 1.

### **Constraints:**
- \`1 <= arr.length <= 10⁵\`
- \`-10⁴ <= arr[i] <= 10⁴\``,
    hints: [
      'Use a prefix sum and a hash map storing the earliest index each prefix sum was seen.',
      'If the current prefix sum is 0, the subarray is from 0 to i.',
      'If the prefix sum has been seen before at index j, the subarray from j + 1 to i has sum 0.'
    ],
    testCases: generateLargestSubarray0SumCases(),
    solutionCode: `
function solution(arr) {
  const map = new Map();
  let maxLen = 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (sum === 0) {
      maxLen = i + 1;
    } else if (map.has(sum)) {
      maxLen = Math.max(maxLen, i - map.get(sum));
    } else {
      map.set(sum, i);
    }
  }
  return maxLen;
}
`
  },
  {
    slug: 'subarrays-with-xor-k',
    title: 'Subarrays with XOR K',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[4, 2, 2, 6, 4], 6',
    sample_output: '4',
    description: `Given an array of integers \`nums\` and an integer \`k\`, find the total number of continuous subarrays whose bitwise XOR sum equals \`k\`.

### **Example 1:**
**Input:** nums = [4, 2, 2, 6, 4], k = 6
**Output:** 4
**Explanation:** The subarrays with XOR sum 6 are:
- [4, 2] (4 ^ 2 = 6)
- [4, 2, 2, 6, 4] (4 ^ 2 ^ 2 ^ 6 ^ 4 = 6)
- [2, 2, 6] (2 ^ 2 ^ 6 = 6)
- [6] (6 = 6)

### **Example 2:**
**Input:** nums = [5, 6, 7, 8, 9], k = 5
**Output:** 2

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`0 <= nums[i] <= 10⁵\`
- \`0 <= k <= 10⁵\``,
    hints: [
      'If prefix XOR up to index i is xr, we need to find how many previous prefixes had XOR equal to xr ^ k.',
      'Maintain a frequency map of prefix XOR values initialized with { 0: 1 }.'
    ],
    testCases: generateSubarraysWithXorKCases(),
    solutionCode: `
function solution(nums, k) {
  let count = 0;
  let xor = 0;
  const map = new Map();
  map.set(0, 1);
  for (const num of nums) {
    xor ^= num;
    const target = xor ^ k;
    if (map.has(target)) {
      count += map.get(target);
    }
    map.set(xor, (map.get(xor) || 0) + 1);
  }
  return count;
}
`
  },
  {
    slug: 'find-missing-and-repeated-values',
    title: 'Find Missing and Repeated Values',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1, 3, 3]',
    sample_output: '[3, 2]',
    description: `You are given a **0-indexed** 1D integer array \`nums\` of size \`n\` containing numbers from \`1\` to \`n\`. Each integer appears exactly once except \`a\` which appears twice and \`b\` which is missing. The array is unsorted.

Return a number array of size 2 where the first element is the repeated number \`a\` and the second element is the missing number \`b\`.

### **Example 1:**
**Input:** nums = [1, 3, 3]
**Output:** [3, 2]
**Explanation:** 3 is repeated and 2 is missing.

### **Example 2:**
**Input:** nums = [4, 3, 6, 2, 1, 1]
**Output:** [1, 5]
**Explanation:** 1 is repeated and 5 is missing.

### **Constraints:**
- \`2 <= n <= 10⁵\`
- \`1 <= nums[i] <= n\``,
    hints: [
      'You can count frequencies using a hash map or direct array indexing since elements are 1 to n.',
      'Can you also solve it in O(1) extra space using mathematical sums: sum(1..n) and sum_squares(1..n)?'
    ],
    testCases: generateMissingRepeatingCases(),
    solutionCode: `
function solution(nums) {
  const n = nums.length;
  let a = -1, b = -1;
  const count = new Int32Array(n + 1);
  for (const num of nums) count[num]++;
  for (let i = 1; i <= n; i++) {
    if (count[i] === 2) a = i;
    else if (count[i] === 0) b = i;
  }
  return [a, b];
}
`
  },
  {
    slug: 'count-inversions',
    title: 'Count Inversions',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[2, 4, 1, 3, 5]',
    sample_output: '3',
    description: `Given an integer array \`arr\`, return the number of **inversions** in the array.

Two elements \`arr[i]\` and \`arr[j]\` form an inversion if \`arr[i] > arr[j]\` and \`i < j\`.

In other words, an inversion indicates how far (or close) the array is from being sorted. If the array is already sorted, the inversion count is 0. If the array is sorted in the reverse order, the inversion count is maximum.

### **Example 1:**
**Input:** arr = [2, 4, 1, 3, 5]
**Output:** 3
**Explanation:** The inversions are (2, 1), (4, 1), and (4, 3).

### **Example 2:**
**Input:** arr = [2, 3, 4, 5, 6]
**Output:** 0
**Explanation:** As the sequence is already sorted so there is no inversion count.

### **Example 3:**
**Input:** arr = [10, 10, 10]
**Output:** 0
**Explanation:** As all the elements of array are same, so there is no inversion count.

### **Constraints:**
- \`1 <= arr.length <= 10⁵\`
- \`1 <= arr[i] <= 10⁹\``,
    hints: [
      'A brute force O(N^2) solution will check all pairs (i, j) where i < j.',
      'Can we enhance the Merge Sort algorithm to count inversions while merging in O(N log N)?',
      'During the merge step, if arr[left] > arr[right], all remaining elements from left to mid also form inversions with arr[right].'
    ],
    testCases: generateCountInversionsCases(),
    solutionCode: `
function solution(arr) {
  if (!arr || arr.length <= 1) return 0;
  function mergeSort(a, low, high) {
    if (low >= high) return 0;
    const mid = Math.floor((low + high) / 2);
    let invCount = mergeSort(a, low, mid) + mergeSort(a, mid + 1, high);
    const temp = [];
    let left = low, right = mid + 1;
    while (left <= mid && right <= high) {
      if (a[left] <= a[right]) {
        temp.push(a[left++]);
      } else {
        invCount += (mid - left + 1);
        temp.push(a[right++]);
      }
    }
    while (left <= mid) temp.push(a[left++]);
    while (right <= high) temp.push(a[right++]);
    for (let k = 0; k < temp.length; k++) {
      a[low + k] = temp[k];
    }
    return invCount;
  }
  return mergeSort(arr, 0, arr.length - 1);
}
`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Hard Batch 5 (4 Problems)...');

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
  console.log(`ALL 4 STRIVER ARRAY HARD BATCH 5 PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
