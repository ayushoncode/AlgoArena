/**
 * seed_striver_hard_batch1_25tc.js
 * Seeds and validates the 5 Striver A2Z Array Hard problems with exactly 25 test cases each.
 *
 * Problems:
 * 1. Pascal's Triangle (pascal-s-triangle)
 * 2. 3Sum (3sum)
 * 3. 4Sum (4sum)
 * 4. First Missing Positive (first-missing-positive)
 * 5. Trapping Rain Water (trapping-rain-water)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// ==========================================
// 1. PASCAL'S TRIANGLE
// ==========================================
function generatePascalTCs() {
  function solve(numRows) {
    const res = [];
    for (let i = 0; i < numRows; i++) {
      const row = new Array(i + 1).fill(1);
      for (let j = 1; j < i; j++) {
        row[j] = res[i - 1][j - 1] + res[i - 1][j];
      }
      res.push(row);
    }
    return res;
  }

  const rowsList = [
    5, 1, 2, 3, 4, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 25, 28, 30
  ];

  return rowsList.map((n, idx) => ({
    input: `${n}`,
    output: JSON.stringify(solve(n)),
    is_hidden: idx >= 3
  }));
}

// ==========================================
// 2. 3SUM
// ==========================================
function generate3SumTCs() {
  function solve(nums) {
    const n = nums.length;
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < n - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      if (nums[i] > 0) break;
      let left = i + 1;
      let right = n - 1;
      while (left < right) {
        const sum = nums[i] + nums[left] + nums[right];
        if (sum === 0) {
          res.push([nums[i], nums[left], nums[right]]);
          while (left < right && nums[left] === nums[left + 1]) left++;
          while (left < right && nums[right] === nums[right - 1]) right--;
          left++;
          right--;
        } else if (sum < 0) {
          left++;
        } else {
          right--;
        }
      }
    }
    return res;
  }

  const baseCases = [
    [-1, 0, 1, 2, -1, -4],
    [0, 1, 1],
    [0, 0, 0],
    [0, 0, 0, 0],
    [-2, 0, 1, 1, 2],
    [-1, 0, 1, 0],
    [-2, 0, 0, 2, 2],
    [1, 2, -2, -1],
    [3, 0, -2, -1, 1, 2],
    [-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6],
    [-1, -1, -1, 2],
    [1, -1, -1, 0],
    [-4, -1, -1, 0, 1, 2],
    [0, 0],
    [],
    [1, 2, 3, 4, 5],
    [-5, -4, -3, -2, -1],
    [-10, 5, 5, 0, -5, 10, -10],
    [-3, 1, 2, -1, 0, 1],
    [2, -1, -1, 2, -1, -1]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 zeros -> only [0,0,0]
  const s21 = new Array(100).fill(0);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([[0, 0, 0]]), is_hidden: true });

  // 22: Pairs summing to zero + zero in middle
  const s22 = [];
  for (let i = 1; i <= 50; i++) {
    s22.push(-i, i);
  }
  s22.push(0);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solve([...s22])), is_hidden: true });

  // 23: 200 random small integers
  const s23 = [];
  for (let i = 0; i < 200; i++) {
    s23.push((i * 17) % 21 - 10);
  }
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solve([...s23])), is_hidden: true });

  // 24: 300 elements
  const s24 = [];
  for (let i = 0; i < 300; i++) {
    s24.push((i * 31) % 41 - 20);
  }
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve([...s24])), is_hidden: true });

  // 25: 3000 elements max constraint stress test (strictly catches O(N^3) brute-force with TLE)
  const s25 = [];
  for (let i = 0; i < 3000; i++) {
    s25.push(i % 2 === 0 ? (i * 2 + 1) : -(i * 2 + 1));
  }
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve([...s25])), is_hidden: true });

  return tcs;
}

// ==========================================
// 3. 4SUM
// ==========================================
function generate4SumTCs() {
  function solve(nums, target) {
    const n = nums.length;
    nums.sort((a, b) => a - b);
    const res = [];
    for (let i = 0; i < n - 3; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      for (let j = i + 1; j < n - 2; j++) {
        if (j > i + 1 && nums[j] === nums[j - 1]) continue;
        let left = j + 1;
        let right = n - 1;
        while (left < right) {
          const sum = nums[i] + nums[j] + nums[left] + nums[right];
          if (sum === target) {
            res.push([nums[i], nums[j], nums[left], nums[right]]);
            while (left < right && nums[left] === nums[left + 1]) left++;
            while (left < right && nums[right] === nums[right - 1]) right--;
            left++;
            right--;
          } else if (sum < target) {
            left++;
          } else {
            right--;
          }
        }
      }
    }
    return res;
  }

  const baseCases = [
    { nums: [1, 0, -1, 0, -2, 2], target: 0 },
    { nums: [2, 2, 2, 2, 2], target: 8 },
    { nums: [1, 2, 3, 4, 5, -1, -2], target: 5 },
    { nums: [0, 0, 0, 0], target: 0 },
    { nums: [1, -2, -5, -4, -3, 3, 3, 2], target: -11 },
    { nums: [-3, -1, 0, 2, 4, 5], target: 0 },
    { nums: [-2, -1, -1, 1, 1, 2, 2], target: 0 },
    { nums: [1, 2, 3, 4], target: 10 },
    { nums: [1, 2, 3, 4], target: 11 },
    { nums: [-5, 5, 4, -3, 0, 0, 4, -2], target: 4 },
    { nums: [0, 0, 0], target: 0 },
    { nums: [], target: 0 },
    { nums: [-1000000000, -1000000000, 1000000000, 1000000000], target: 0 },
    { nums: [1, 0, -1, 0, -2, 2], target: 1 },
    { nums: [-3, -2, -1, 0, 0, 1, 2, 3], target: 0 },
    { nums: [100, 200, 300, 400], target: 1000 },
    { nums: [-1, 2, 2, -5, 0, -1, 4], target: 3 },
    { nums: [0, 1, 5, 0, 1, 5, 5, -4], target: 11 },
    { nums: [-4, -3, -2, -1, 0, 1, 2, 3, 4], target: -5 },
    { nums: [4, 4, 4, 4, 4, 4], target: 16 }
  ];

  const tcs = baseCases.map(({ nums, target }, idx) => ({
    input: `${JSON.stringify(nums)}, ${target}`,
    output: JSON.stringify(solve([...nums], target)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 50 zeros, target 0 -> [[0,0,0,0]]
  const s21 = new Array(50).fill(0);
  tcs.push({ input: `${JSON.stringify(s21)}, 0`, output: JSON.stringify([[0, 0, 0, 0]]), is_hidden: true });

  // 22: 60 elements symmetrical
  const s22 = [];
  for (let i = 1; i <= 30; i++) s22.push(-i, i);
  tcs.push({ input: `${JSON.stringify(s22)}, 0`, output: JSON.stringify(solve([...s22], 0)), is_hidden: true });

  // 23: 80 small integers target 5
  const s23 = [];
  for (let i = 0; i < 80; i++) s23.push((i * 13) % 23 - 11);
  tcs.push({ input: `${JSON.stringify(s23)}, 5`, output: JSON.stringify(solve([...s23], 5)), is_hidden: true });

  // 24: 100 small integers target 0
  const s24 = [];
  for (let i = 0; i < 100; i++) s24.push((i * 17) % 29 - 14);
  tcs.push({ input: `${JSON.stringify(s24)}, 0`, output: JSON.stringify(solve([...s24], 0)), is_hidden: true });

  // 25: 500 elements mixed stress test (strictly catches O(N^4) brute force with TLE in both JS and Java)
  const s25 = [];
  for (let i = 0; i < 500; i++) s25.push((i * 17) % 31 - 15);
  tcs.push({ input: `${JSON.stringify(s25)}, 0`, output: JSON.stringify(solve([...s25], 0)), is_hidden: true });

  return tcs;
}

// ==========================================
// 4. FIRST MISSING POSITIVE
// ==========================================
function generateFirstMissingPositiveTCs() {
  function solve(nums) {
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
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 consecutive 1..1000 -> 1001
  const s21 = [];
  for (let i = 1; i <= 1000; i++) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(1001), is_hidden: true });

  // 22: 1000 consecutive 2..1001 -> 1
  const s22 = [];
  for (let i = 2; i <= 1001; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(1), is_hidden: true });

  // 23: 1000 elements with 500 missing
  const s23 = [];
  for (let i = 1; i <= 1000; i++) {
    if (i !== 500) s23.push(i);
  }
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(500), is_hidden: true });

  // 24: 2000 negative numbers -> 1
  const s24 = [];
  for (let i = 1; i <= 2000; i++) s24.push(-i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(1), is_hidden: true });

  // 25: 5000 shuffled elements stress
  const s25 = [];
  for (let i = 1; i <= 5000; i++) s25.push(i);
  // swap 42 to make missing
  s25[41] = 999999;
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(42), is_hidden: true });

  return tcs;
}

// ==========================================
// 5. TRAPPING RAIN WATER
// ==========================================
function generateTrappingWaterTCs() {
  function solve(height) {
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

  const baseCases = [
    [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
    [4, 2, 0, 3, 2, 5],
    [3, 0, 2, 0, 4],
    [],
    [1],
    [1, 2],
    [2, 1],
    [2, 0, 2],
    [3, 0, 0, 2, 0, 4],
    [5, 4, 1, 2],
    [0, 2, 0],
    [5, 2, 1, 2, 1, 5],
    [4, 2, 3],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [6, 4, 2, 0, 3, 2, 0, 3, 1, 4, 5, 3, 2, 7, 5, 3, 0, 1, 2, 1, 3, 4, 6, 8, 1, 3],
    [10, 0, 10],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [2, 8, 5, 5, 6, 1, 9, 4, 3, 6]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: Giant U-shape 500 tall sides, 500 zeros
  const s21 = [1000, ...new Array(500).fill(0), 1000];
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solve(s21)), is_hidden: true });

  // 22: Sawtooth pattern 1000 bars
  const s22 = [];
  for (let i = 0; i < 1000; i++) s22.push(i % 5);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solve(s22)), is_hidden: true });

  // 23: 1500 strictly increasing
  const s23 = [];
  for (let i = 1; i <= 1500; i++) s23.push(i);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(0), is_hidden: true });

  // 24: 2000 fluctuating heights
  const s24 = [];
  for (let i = 0; i < 2000; i++) s24.push(Math.abs(Math.sin(i) * 50) | 0);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve(s24)), is_hidden: true });

  // 25: 5000 elements stress test
  const s25 = [];
  for (let i = 0; i < 5000; i++) s25.push(Math.abs(Math.cos(i) * 100) | 0);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve(s25)), is_hidden: true });

  return tcs;
}

// Problem definitions
const PROBLEMS = [
  {
    slug: 'pascal-s-triangle',
    title: "Pascal's Triangle",
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '5',
    sample_output: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]',
    hints: [
      "In Pascal's triangle, each number is the sum of the two directly above it.",
      "The first and last element of each row is always 1.",
      "Row i has i + 1 elements. For 0 < j < i, row[j] = prevRow[j - 1] + prevRow[j]."
    ],
    description: `Given an integer \`numRows\`, return the first \`numRows\` of **Pascal's triangle**.

In Pascal's triangle, each number is the sum of the two numbers directly above it.

### Example 1
\`\`\`
Input: numRows = 5
Output: [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]
\`\`\`

### Example 2
\`\`\`
Input: numRows = 1
Output: [[1]]
\`\`\`

### Constraints
- \`1 <= numRows <= 30\`
`,
    testCases: generatePascalTCs(),
    solutionCode: `function solution(numRows) {
      const res = [];
      for (let i = 0; i < numRows; i++) {
        const row = new Array(i + 1).fill(1);
        for (let j = 1; j < i; j++) {
          row[j] = res[i - 1][j - 1] + res[i - 1][j];
        }
        res.push(row);
      }
      return res;
    }`
  },
  {
    slug: '3sum',
    title: '3Sum',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[-1, 0, 1, 2, -1, -4]',
    sample_output: '[[-1, -1, 2], [-1, 0, 1]]',
    hints: [
      "Sort the array first to make duplicate elimination and two-pointer traversal straightforward.",
      "Fix the first element nums[i]. Then use two pointers (left = i + 1, right = n - 1) to find pairs summing to -nums[i].",
      "Skip consecutive duplicate elements for i, left, and right to avoid duplicate triplets."
    ],
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.

### Example 1
\`\`\`
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]
\`\`\`

### Example 2
\`\`\`
Input: nums = [0,1,1]
Output: []
\`\`\`

### Example 3
\`\`\`
Input: nums = [0,0,0]
Output: [[0,0,0]]
\`\`\`

### Constraints
- \`3 <= nums.length <= 3000\`
- \`-10⁵ <= nums[i] <= 10⁵\`
`,
    testCases: generate3SumTCs(),
    solutionCode: `function solution(nums) {
      const n = nums.length;
      nums.sort((a, b) => a - b);
      const res = [];
      for (let i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        if (nums[i] > 0) break;
        let left = i + 1;
        let right = n - 1;
        while (left < right) {
          const sum = nums[i] + nums[left] + nums[right];
          if (sum === 0) {
            res.push([nums[i], nums[left], nums[right]]);
            while (left < right && nums[left] === nums[left + 1]) left++;
            while (left < right && nums[right] === nums[right - 1]) right--;
            left++;
            right--;
          } else if (sum < 0) {
            left++;
          } else {
            right--;
          }
        }
      }
      return res;
    }`
  },
  {
    slug: '4sum',
    title: '4Sum',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1, 0, -1, 0, -2, 2], 0',
    sample_output: '[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]',
    hints: [
      "Similar to 3Sum, sort the array first.",
      "Use two nested loops to fix the first two elements nums[i] and nums[j], then use two pointers for the remaining two elements.",
      "Skip duplicates at every level (for i, for j, and inside the two-pointer loop)."
    ],
    description: `Given an array \`nums\` of \`n\` integers, return an array of all the **unique** quadruplets \`[nums[a], nums[b], nums[c], nums[d]]\` such that:
- \`0 <= a, b, c, d < n\`
- \`a\`, \`b\`, \`c\`, and \`d\` are **distinct**.
- \`nums[a] + nums[b] + nums[c] + nums[d] == target\`

You may return the answer in any order.

### Example 1
\`\`\`
Input: nums = [1,0,-1,0,-2,2], target = 0
Output: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
\`\`\`

### Example 2
\`\`\`
Input: nums = [2,2,2,2,2], target = 8
Output: [[2,2,2,2]]
\`\`\`

### Constraints
- \`1 <= nums.length <= 200\`
- \`-10⁹ <= nums[i] <= 10⁹\`
- \`-10⁹ <= target <= 10⁹\`
`,
    testCases: generate4SumTCs(),
    solutionCode: `function solution(nums, target) {
      const n = nums.length;
      nums.sort((a, b) => a - b);
      const res = [];
      for (let i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        for (let j = i + 1; j < n - 2; j++) {
          if (j > i + 1 && nums[j] === nums[j - 1]) continue;
          let left = j + 1;
          let right = n - 1;
          while (left < right) {
            const sum = nums[i] + nums[j] + nums[left] + nums[right];
            if (sum === target) {
              res.push([nums[i], nums[j], nums[left], nums[right]]);
              while (left < right && nums[left] === nums[left + 1]) left++;
              while (left < right && nums[right] === nums[right - 1]) right--;
              left++;
              right--;
            } else if (sum < target) {
              left++;
            } else {
              right--;
            }
          }
        }
      }
      return res;
    }`
  },
  {
    slug: 'first-missing-positive',
    title: 'First Missing Positive',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[1, 2, 0]',
    sample_output: '3',
    hints: [
      "The answer must always be in the range [1, n + 1] where n is nums.length.",
      "Place each number x in [1, n] at index x - 1 by swapping.",
      "After placing numbers, the first index i where nums[i] != i + 1 corresponds to missing number i + 1."
    ],
    description: `Given an unsorted integer array \`nums\`, return the smallest positive integer that is not present in \`nums\`.

You must implement an algorithm that runs in \`O(n)\` time and uses \`O(1)\` auxiliary space.

### Example 1
\`\`\`
Input: nums = [1,2,0]
Output: 3
Explanation: The numbers in the range [1,2] are all in the array.
\`\`\`

### Example 2
\`\`\`
Input: nums = [3,4,-1,1]
Output: 2
Explanation: 1 is in the array, but 2 is missing.
\`\`\`

### Example 3
\`\`\`
Input: nums = [7,8,9,11,12]
Output: 1
Explanation: The smallest positive integer 1 is missing.
\`\`\`

### Constraints
- \`1 <= nums.length <= 10⁵\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\`
`,
    testCases: generateFirstMissingPositiveTCs(),
    solutionCode: `function solution(nums) {
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
    }`
  },
  {
    slug: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]',
    sample_output: '6',
    hints: [
      "Water trapped at index i depends on min(maxLeft[i], maxRight[i]) - height[i].",
      "Two pointers (left and right) can calculate the trapped water in O(1) extra space.",
      "Advance the pointer with the smaller maximum height."
    ],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example 1
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.
\`\`\`

### Example 2
\`\`\`
Input: height = [4,2,0,3,2,5]
Output: 9
\`\`\`

### Constraints
- \`n == height.length\`
- \`1 <= n <= 2 * 10⁴\`
- \`0 <= height[i] <= 10⁵\`
`,
    testCases: generateTrappingWaterTCs(),
    solutionCode: `function solution(height) {
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
    }`
  }
];

async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Striver Array Hard Batch 1 (5 problems)...');

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

  console.log('\n========================================\nALL 5 HARD PROBLEMS SEEDED & VALIDATED WITH 25/25 ACCEPTED!\n');
  process.exit(0);
}

seedAndVerify().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
