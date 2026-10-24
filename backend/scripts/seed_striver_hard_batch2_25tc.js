/**
 * seed_striver_hard_batch2_25tc.js
 * Seeds and validates 5 Striver A2Z Array problems with exactly 25 test cases each.
 *
 * Problems:
 * 1. Majority Element II (majority-element-ii)
 * 2. Merge Intervals (merge-intervals)
 * 3. Maximum Product Subarray (maximum-product-subarray)
 * 4. Reverse Pairs (reverse-pairs)
 * 5. Subarray Sum Equals K (subarray-sum-equals-k)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// ==========================================
// 1. MAJORITY ELEMENT II
// ==========================================
function generateMajorityElementIICases() {
  function solve(nums) {
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

  const baseCases = [
    [3, 2, 3],
    [1],
    [1, 2],
    [2, 2],
    [1, 2, 3],
    [1, 1, 1, 3, 3, 2, 2, 2],
    [0, 0, 0],
    [-1, -1, -1],
    [-1, 1, 1, 1, 2, 1],
    [4, 4, 2, 4, 3, 4, 1],
    [1, 2, 3, 4, 5, 6],
    [2, 1, 1, 3, 1, 4, 5, 6],
    [8, 8, 7, 7, 7],
    [6, 6, 6, 7, 7],
    [-2, -2, -2, -1, -1],
    [10, 10, 20, 20, 30],
    [1, 2, 1, 2, 1, 2, 1, 2, 3],
    [5, 4, 3, 2, 1, 5, 5, 5, 5],
    [9, 8, 7, 9, 8, 9, 8, 9, 8],
    [100, 200, 300, 100, 200, 100, 200]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 identical elements
  const s21 = new Array(1000).fill(7);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([7]), is_hidden: true });

  // 22: 1200 elements with two majorities (450 of '1', 450 of '2', 300 of '3')
  const s22 = [...new Array(450).fill(1), ...new Array(450).fill(2), ...new Array(300).fill(3)];
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify([1, 2]), is_hidden: true });

  // 23: 1500 distinct elements -> []
  const s23 = [];
  for (let i = 1; i <= 1500; i++) s23.push(i);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify([]), is_hidden: true });

  // 24: Alternating sequence 2000 elements with single majority
  const s24 = [];
  for (let i = 0; i < 2000; i++) s24.push(i % 2 === 0 ? 99 : i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify([99]), is_hidden: true });

  // 25: 5000 elements stress
  const s25 = [];
  for (let i = 0; i < 5000; i++) s25.push(i < 2000 ? 42 : i < 4000 ? 100 : i);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify([42, 100]), is_hidden: true });

  return tcs;
}

// ==========================================
// 2. MERGE INTERVALS
// ==========================================
function generateMergeIntervalsCases() {
  function solve(intervals) {
    if (!intervals || intervals.length <= 1) return intervals || [];
    intervals.sort((a, b) => a[0] - b[0]);
    const res = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = res[res.length - 1];
      const curr = intervals[i];
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1]);
      } else {
        res.push(curr);
      }
    }
    return res;
  }

  const baseCases = [
    [[1, 3], [2, 6], [8, 10], [15, 18]],
    [[1, 4], [4, 5]],
    [[1, 4], [0, 4]],
    [[1, 4], [2, 3]],
    [[1, 4], [0, 2], [3, 5]],
    [[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]],
    [[1, 3]],
    [],
    [[1, 4], [0, 0]],
    [[2, 3], [2, 2], [3, 3], [1, 3], [5, 7], [2, 2], [4, 6]],
    [[1, 10], [2, 3], [4, 5], [6, 7]],
    [[1, 2], [3, 4], [5, 6], [7, 8]],
    [[1, 4], [5, 6]],
    [[1, 3], [0, 2], [2, 3], [4, 6], [4, 5], [5, 5], [0, 2], [3, 3]],
    [[1, 5], [2, 4], [3, 6]],
    [[5, 8], [1, 4], [7, 9]],
    [[1, 1], [1, 1]],
    [[1, 2], [2, 3], [3, 4], [4, 5]],
    [[10, 20], [5, 15], [1, 6]],
    [[3, 5], [0, 0], [4, 4], [0, 2], [5, 6], [1, 4]]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solve(arr.map(x => [...x]))),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 disjoint intervals
  const s21 = [];
  for (let i = 0; i < 100; i++) s21.push([i * 3, i * 3 + 1]);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solve(s21.map(x => [...x]))), is_hidden: true });

  // 22: 200 fully overlapping intervals all within [0, 1000]
  const s22 = [[0, 1000]];
  for (let i = 1; i < 200; i++) s22.push([i, i + 5]);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify([[0, 1000]]), is_hidden: true });

  // 23: 500 contiguous intervals [0, 1], [1, 2], ..., [499, 500] -> [0, 500]
  const s23 = [];
  for (let i = 0; i < 500; i++) s23.push([i, i + 1]);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify([[0, 500]]), is_hidden: true });

  // 24: 1000 pairs of intervals
  const s24 = [];
  for (let i = 0; i < 1000; i++) s24.push([i * 2, i * 2 + 2]);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify([[0, 2000]]), is_hidden: true });

  // 25: 2000 scrambled intervals
  const s25 = [];
  for (let i = 0; i < 2000; i++) {
    const start = (i * 37) % 500;
    s25.push([start, start + 10]);
  }
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve(s25.map(x => [...x]))), is_hidden: true });

  return tcs;
}

// ==========================================
// 3. MAXIMUM PRODUCT SUBARRAY
// ==========================================
function generateMaxProductSubarrayCases() {
  function solve(nums) {
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
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 alternating 1 and -1 (even number -> product 1)
  const s21 = [];
  for (let i = 0; i < 100; i++) s21.push(i % 2 === 0 ? 1 : -1);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(1), is_hidden: true });

  // 22: 200 ones with single 2 -> 2
  const s22 = new Array(200).fill(1);
  s22[100] = 2;
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(2), is_hidden: true });

  // 23: 500 negative ones -> 1
  const s23 = new Array(500).fill(-1);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(1), is_hidden: true });

  // 24: 1000 zeros with a 5 in middle -> 5
  const s24 = new Array(1000).fill(0);
  s24[500] = 5;
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(5), is_hidden: true });

  // 25: 2000 elements alternating between 1, -1, and 2
  const s25 = [];
  for (let i = 0; i < 2000; i++) s25.push(i % 5 === 0 ? -1 : 1);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(1), is_hidden: true });

  return tcs;
}

// ==========================================
// 4. REVERSE PAIRS
// ==========================================
function generateReversePairsCases() {
  function solve(nums) {
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
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 500 strictly decreasing [500..1]
  const s21 = [];
  for (let i = 500; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solve([...s21])), is_hidden: true });

  // 22: 500 strictly increasing [1..500] -> 0
  const s22 = [];
  for (let i = 1; i <= 500; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(0), is_hidden: true });

  // 23: 1000 identical elements -> 0
  const s23 = new Array(1000).fill(10);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(0), is_hidden: true });

  // 24: 1500 elements with high values in first half, 1 in second half
  const s24 = [...new Array(750).fill(100), ...new Array(750).fill(1)];
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(750 * 750), is_hidden: true });

  // 25: 2000 elements pseudo-random stress
  const s25 = [];
  for (let i = 0; i < 2000; i++) s25.push((i * 47) % 500);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve([...s25])), is_hidden: true });

  return tcs;
}

// ==========================================
// 5. SUBARRAY SUM EQUALS K
// ==========================================
function generateSubarraySumKCases() {
  function solve(nums, k) {
    let count = 0;
    let sum = 0;
    const map = new Map();
    map.set(0, 1);
    for (const num of nums) {
      sum += num;
      if (map.has(sum - k)) {
        count += map.get(sum - k);
      }
      map.set(sum, (map.get(sum) || 0) + 1);
    }
    return count;
  }

  const baseCases = [
    { nums: [1, 1, 1], k: 2 },
    { nums: [1, 2, 3], k: 3 },
    { nums: [1, -1, 0], k: 0 },
    { nums: [1], k: 0 },
    { nums: [1], k: 1 },
    { nums: [-1, -1, 1], k: 0 },
    { nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 },
    { nums: [0, 0, 0, 0, 0], k: 0 },
    { nums: [1, 2, 1, 2, 1], k: 3 },
    { nums: [10, 2, -2, -20, 10], k: -10 },
    { nums: [1, 2, 3, 4, 5], k: 15 },
    { nums: [1, 2, 3, 4, 5], k: 16 },
    { nums: [-1, 2, 3, -2, 4], k: 5 },
    { nums: [0, 0, 1, 0, 0], k: 1 },
    { nums: [2, 2, 2, 2], k: 4 },
    { nums: [-5, 5, -5, 5], k: 0 },
    { nums: [100, -50, 25, 25, -100], k: 0 },
    { nums: [4, 5, 0, -2, -3, 1], k: 5 },
    { nums: [-2, -3, 5, 0, 4, -4], k: 0 },
    { nums: [1, 0, 1, 0, 1], k: 2 }
  ];

  const tcs = baseCases.map(({ nums, k }, idx) => ({
    input: `${JSON.stringify(nums)}, ${k}`,
    output: JSON.stringify(solve([...nums], k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 zeros, k = 0 -> (100 * 101) / 2 = 5050
  const s21 = new Array(100).fill(0);
  tcs.push({ input: `${JSON.stringify(s21)}, 0`, output: JSON.stringify(5050), is_hidden: true });

  // 22: 500 ones, k = 50
  const s22 = new Array(500).fill(1);
  tcs.push({ input: `${JSON.stringify(s22)}, 50`, output: JSON.stringify(500 - 50 + 1), is_hidden: true });

  // 23: 1000 alternating 1 and -1, k = 0
  const s23 = [];
  for (let i = 0; i < 1000; i++) s23.push(i % 2 === 0 ? 1 : -1);
  tcs.push({ input: `${JSON.stringify(s23)}, 0`, output: JSON.stringify(solve([...s23], 0)), is_hidden: true });

  // 24: 1500 elements target k = 100
  const s24 = [];
  for (let i = 0; i < 1500; i++) s24.push((i * 7) % 19 - 9);
  tcs.push({ input: `${JSON.stringify(s24)}, 100`, output: JSON.stringify(solve([...s24], 100)), is_hidden: true });

  // 25: 3000 elements stress
  const s25 = [];
  for (let i = 0; i < 3000; i++) s25.push((i * 13) % 23 - 11);
  tcs.push({ input: `${JSON.stringify(s25)}, 0`, output: JSON.stringify(solve([...s25], 0)), is_hidden: true });

  return tcs;
}

// Problem definitions
const PROBLEMS = [
  {
    slug: 'majority-element-ii',
    title: 'Majority Element II',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[3, 2, 3]',
    sample_output: '[3]',
    hints: [
      "There can be at most two majority elements appearing more than n / 3 times.",
      "Use an extended Boyer-Moore Voting Algorithm with two candidate variables and two counters.",
      "After finding the two candidates, make a second pass through the array to verify if their counts exceed n / 3."
    ],
    description: `Given an integer array of size \`n\`, find all elements that appear more than \`⌊ n/3 ⌋\` times.

### Example 1
\`\`\`
Input: nums = [3,2,3]
Output: [3]
\`\`\`

### Example 2
\`\`\`
Input: nums = [1]
Output: [1]
\`\`\`

### Example 3
\`\`\`
Input: nums = [1,2]
Output: [1,2]
\`\`\`

### Constraints
- \`1 <= nums.length <= 5 * 10⁴\`
- \`-10⁹ <= nums[i] <= 10⁹\`
`,
    testCases: generateMajorityElementIICases(),
    solutionCode: `function solution(nums) {
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
    }`
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[[1, 3], [2, 6], [8, 10], [15, 18]]',
    sample_output: '[[1, 6], [8, 10], [15, 18]]',
    hints: [
      "Sort the intervals based on the start time.",
      "Iterate through the sorted intervals. If the current interval overlaps with the last interval in the result (curr.start <= last.end), merge them by taking the maximum end.",
      "Otherwise, push the current interval as a new separate interval."
    ],
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

### Example 1
\`\`\`
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].
\`\`\`

### Example 2
\`\`\`
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
Explanation: Intervals [1,4] and [4,5] are considered overlapping.
\`\`\`

### Constraints
- \`1 <= intervals.length <= 10⁴\`
- \`intervals[i].length == 2\`
- \`0 <= start_i <= end_i <= 10⁴\`
`,
    testCases: generateMergeIntervalsCases(),
    solutionCode: `function solution(intervals) {
      if (!intervals || intervals.length <= 1) return intervals || [];
      intervals.sort((a, b) => a[0] - b[0]);
      const res = [intervals[0]];
      for (let i = 1; i < intervals.length; i++) {
        const prev = res[res.length - 1];
        const curr = intervals[i];
        if (curr[0] <= prev[1]) {
          prev[1] = Math.max(prev[1], curr[1]);
        } else {
          res.push(curr);
        }
      }
      return res;
    }`
  },
  {
    slug: 'maximum-product-subarray',
    title: 'Maximum Product Subarray',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[2, 3, -2, 4]',
    sample_output: '6',
    hints: [
      "A negative number can turn a very small negative product into a very large positive product.",
      "Maintain both the maximum and minimum product up to the current index.",
      "When encountering a negative number, swap the maximum and minimum products before updating."
    ],
    description: `Given an integer array \`nums\`, find a subarray that has the largest product, and return the product.

The test cases are generated so that the answer will fit in a 32-bit integer.

### Example 1
\`\`\`
Input: nums = [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.
\`\`\`

### Example 2
\`\`\`
Input: nums = [-2,0,-1]
Output: 0
Explanation: The result cannot be 2, because [-2,-1] is not a subarray.
\`\`\`

### Constraints
- \`1 <= nums.length <= 2 * 10⁴\`
- \`-10 <= nums[i] <= 10\`
`,
    testCases: generateMaxProductSubarrayCases(),
    solutionCode: `function solution(nums) {
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
    }`
  },
  {
    slug: 'reverse-pairs',
    title: 'Reverse Pairs',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[1, 3, 2, 3, 1]',
    sample_output: '2',
    hints: [
      "Counting pairs naively takes O(n²), which will TLE.",
      "Modify Merge Sort to count reverse pairs during the merge step.",
      "For each element in the left sorted half, advance a pointer in the right sorted half while nums[i] > 2 * nums[j]."
    ],
    description: `Given an integer array \`nums\`, return the number of **reverse pairs** in the array.

A reverse pair is a pair \`(i, j)\` where:
- \`0 <= i < j < nums.length\` and
- \`nums[i] > 2 * nums[j]\`.

### Example 1
\`\`\`
Input: nums = [1,3,2,3,1]
Output: 2
Explanation: The reverse pairs are:
(1, 4) --> nums[1] = 3, nums[4] = 1, 3 > 2 * 1
(3, 4) --> nums[3] = 3, nums[4] = 1, 3 > 2 * 1
\`\`\`

### Example 2
\`\`\`
Input: nums = [2,4,3,5,1]
Output: 3
Explanation: The reverse pairs are:
(1, 4) --> nums[1] = 4, nums[4] = 1, 4 > 2 * 1
(2, 4) --> nums[2] = 3, nums[4] = 1, 3 > 2 * 1
(3, 4) --> nums[3] = 5, nums[4] = 1, 5 > 2 * 1
\`\`\`

### Constraints
- \`1 <= nums.length <= 5 * 10⁴\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\`
`,
    testCases: generateReversePairsCases(),
    solutionCode: `function solution(nums) {
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
      "Use prefix sums: sum[i..j] = prefix[j] - prefix[i - 1] == k.",
      "This implies prefix[i - 1] = prefix[j] - k.",
      "Maintain a hash map of prefix sum frequencies as you iterate through the array."
    ],
    description: `Given an array of integers \`nums\` and an integer \`k\`, return the total number of subarrays whose sum equals to \`k\`.

A subarray is a contiguous **non-empty** sequence of elements within an array.

### Example 1
\`\`\`
Input: nums = [1,1,1], k = 2
Output: 2
\`\`\`

### Example 2
\`\`\`
Input: nums = [1,2,3], k = 3
Output: 2
\`\`\`

### Constraints
- \`1 <= nums.length <= 2 * 10⁴\`
- \`-1000 <= nums[i] <= 1000\`
- \`-10⁷ <= k <= 10⁷\`
`,
    testCases: generateSubarraySumKCases(),
    solutionCode: `function solution(nums, k) {
      let count = 0;
      let sum = 0;
      const map = new Map();
      map.set(0, 1);
      for (const num of nums) {
        sum += num;
        if (map.has(sum - k)) {
          count += map.get(sum - k);
        }
        map.set(sum, (map.get(sum) || 0) + 1);
      }
      return count;
    }`
  }
];

async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Striver Array Hard Batch 2 (5 problems)...');

  for (const prob of PROBLEMS) {
    console.log(`\n========================================\n[Problem] Processing: ${prob.title} (${prob.slug})`);

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

    await db.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
    console.log(`  -> Inserting ${prob.testCases.length} test cases...`);

    for (const tc of prob.testCases) {
      await db.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }

    const { rows: countRows } = await db.query('SELECT count(*) FROM test_cases WHERE problem_id = $1', [problemId]);
    console.log(`  -> Verified in DB: count = ${countRows[0].count} test cases.`);

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
