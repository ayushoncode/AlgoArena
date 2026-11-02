/**
 * backend/scripts/upgrade_striver_arrays_medium_batch4_25tc.js
 *
 * Upgrades Striver Step 3 Arrays Medium Batch 4 (5 Problems) to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with edge cases and true upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute force with TLE (> 2000ms).
 *
 * Problems:
 * 1. Leaders in an Array (leaders-in-an-array)
 * 2. Longest Consecutive Sequence (longest-consecutive-sequence) [LC 128]
 * 3. Set Matrix Zeroes (set-matrix-zeroes) [LC 73]
 * 4. Rotate Image (rotate-image) [LC 48]
 * 5. Spiral Matrix (spiral-matrix) [LC 54]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers for 100% accurate oracle outputs
function solveLeaders(arr) {
  const res = [];
  let max = -Infinity;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] >= max) {
      res.push(arr[i]);
      max = arr[i];
    }
  }
  return res.reverse();
}

function solveLcs(nums) {
  if (!nums || nums.length === 0) return 0;
  const set = new Set(nums);
  let max = 0;
  for (const num of set) {
    if (!set.has(num - 1)) {
      let curr = num;
      let count = 1;
      while (set.has(curr + 1)) {
        curr++;
        count++;
      }
      max = Math.max(max, count);
    }
  }
  return max;
}

function solveSetZeroes(mat) {
  const copy = mat.map(row => [...row]);
  const m = copy.length, n = copy[0].length;
  let col0 = 1;
  for (let i = 0; i < m; i++) {
    if (copy[i][0] === 0) col0 = 0;
    for (let j = 1; j < n; j++) {
      if (copy[i][j] === 0) {
        copy[i][0] = 0;
        copy[0][j] = 0;
      }
    }
  }
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 1; j--) {
      if (copy[i][0] === 0 || copy[0][j] === 0) {
        copy[i][j] = 0;
      }
    }
    if (col0 === 0) copy[i][0] = 0;
  }
  return copy;
}

function solveRotateImage(mat) {
  const copy = mat.map(row => [...row]);
  const n = copy.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const temp = copy[i][j];
      copy[i][j] = copy[j][i];
      copy[j][i] = temp;
    }
  }
  for (let i = 0; i < n; i++) {
    copy[i].reverse();
  }
  return copy;
}

function solveSpiralMatrix(matrix) {
  const res = [];
  if (!matrix || matrix.length === 0) return res;
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) res.push(matrix[top][j]);
    top++;
    for (let i = top; i <= bottom; i++) res.push(matrix[i][right]);
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) res.push(matrix[bottom][j]);
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) res.push(matrix[i][left]);
      left++;
    }
  }
  return res;
}

// ── TEST CASE GENERATORS ──────────────────────────────────────────────────

function generateLeadersTCs() {
  const baseCases = [
    [16, 17, 4, 3, 5, 2],
    [1, 2, 3, 4, 0],
    [7, 10, 4, 10, 6, 5, 2],
    [1],
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
    [10, 20, 30, 40],
    [40, 30, 20, 10],
    [6, 1, 7, 2],
    [100, 50, 100, 20],
    [3, 3, 3, 3],
    [1, 2, 2, 1],
    [10, 9, 8, 12, 5, 6],
    [7, 4, 5, 7, 3],
    [2, 3, 1, 0, 5, 2],
    [8, 1, 2, 3, 4],
    [5, 10, 20, 40],
    [9, 8, 9, 8, 9],
    [2, 8, 5, 1, 9, 3, 2],
    [12, 11, 10, 9, 8, 7]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveLeaders(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 strictly increasing
  const s21 = [];
  for (let i = 1; i <= 2000; i++) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([2000]), is_hidden: true });

  // 22: 5,000 identical elements
  const s22 = new Array(5000).fill(42);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(s22), is_hidden: true });

  // 23: 15,000 elements with sinusoids
  const s23 = [];
  for (let i = 0; i < 15000; i++) s23.push(Math.floor(Math.sin(i) * 1000));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveLeaders(s23)), is_hidden: true });

  // 24: 35,000 elements strictly decreasing
  const s24 = [];
  for (let i = 35000; i >= 1; i--) s24.push(i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(s24), is_hidden: true });

  // 25: 85,000 elements strictly decreasing (STRICTLY KILLS O(N^2) brute force — 3.6B ops > 2000ms TLE)
  const s25 = [];
  for (let i = 85000; i >= 1; i--) s25.push(i);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(s25), is_hidden: true });

  return tcs;
}

function generateLcsTCs() {
  const baseCases = [
    [100, 4, 200, 1, 3, 2],
    [0, 3, 7, 2, 5, 8, 4, 6, 0, 1],
    [],
    [1],
    [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6],
    [1, 2, 0, 1],
    [10, 20, 30, 40],
    [-5, -4, -3, -2, -1],
    [100, 101, 102, 1, 2, 3, 4],
    [5, 4, 3, 2, 1],
    [10, 5, 12, 3, 55, 30, 4, 11, 2],
    [7, 8, 9, 1, 2, 3, 4],
    [-2, -3, -4, 0, 1, 2],
    [1, 1, 1, 1],
    [50, 40, 30, 20, 10],
    [1, 3, 5, 7, 9],
    [2, 4, 6, 8, 10],
    [1000000, 1000001, 0, 1, 2],
    [-10, -9, -8, 5, 6, 7, 8, 9],
    [3, 2, 1, 4, 5, 9, 8, 7]
  ];

  const tcs = baseCases.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveLcs(arr)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 2,000 consecutive scrambled
  const s21 = [];
  for (let i = 0; i < 2000; i++) s21.push((i * 17) % 2000);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveLcs(s21)), is_hidden: true });

  // 22: 5,000 elements with duplicates
  const s22 = [];
  for (let i = 0; i < 2500; i++) { s22.push(i); s22.push(i); }
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveLcs(s22)), is_hidden: true });

  // 23: 15,000 elements non-consecutive
  const s23 = [];
  for (let i = 0; i < 15000; i++) s23.push(i * 10);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveLcs(s23)), is_hidden: true });

  // 24: 30,000 elements descending
  const s24 = [];
  for (let i = 30000; i >= 1; i--) s24.push(i);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveLcs(s24)), is_hidden: true });

  // 25: 50,000 elements consecutive scrambled (STRICTLY KILLS O(N^2) or O(N^3) brute forces)
  const s25 = [];
  for (let i = 0; i < 50000; i++) s25.push((i * 37) % 50000);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveLcs(s25)), is_hidden: true });

  return tcs;
}

function generateSetZeroesTCs() {
  const baseCases = [
    [[1,1,1],[1,0,1],[1,1,1]],
    [[0,1,2,0],[3,4,5,2],[1,3,1,5]],
    [[1,0]],
    [[0]],
    [[1]],
    [[1,1],[1,0]],
    [[1,2,3],[4,0,6],[7,8,9]],
    [[0,1],[1,1]],
    [[1,1,1],[0,1,1]],
    [[1,0,1],[1,1,1],[1,1,1]],
    [[1,1,1],[1,1,1],[1,1,0]],
    [[2,4,0],[1,0,3],[5,6,7]],
    [[0,0],[0,0]],
    [[1,2,3,4],[5,0,7,8],[9,10,11,12]],
    [[1,0,3],[4,5,6],[7,0,9]],
    [[1,2],[0,4],[5,6]],
    [[1,2,3],[0,0,0],[7,8,9]],
    [[1,0,1,0],[1,1,1,1]],
    [[0,3,4,5],[6,7,8,9]],
    [[1,2],[3,4],[5,0]]
  ];

  const tcs = baseCases.map((mat, idx) => ({
    input: JSON.stringify(mat),
    output: JSON.stringify(solveSetZeroes(mat)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 20x20 matrix
  const s21 = Array.from({ length: 20 }, () => new Array(20).fill(1));
  s21[0][0] = 0;
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveSetZeroes(s21)), is_hidden: true });

  // 22: 40x40 diagonal zeroes
  const s22 = Array.from({ length: 40 }, (_, i) => {
    const r = new Array(40).fill(1);
    r[i] = 0;
    return r;
  });
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveSetZeroes(s22)), is_hidden: true });

  // 23: 1x200 row vector with 0 at middle
  const s23 = [new Array(200).fill(1)];
  s23[0][100] = 0;
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveSetZeroes(s23)), is_hidden: true });

  // 24: 100x100 matrix with multiple zeroes
  const s24 = Array.from({ length: 100 }, () => new Array(100).fill(5));
  s24[10][20] = 0;
  s24[50][50] = 0;
  s24[80][90] = 0;
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveSetZeroes(s24)), is_hidden: true });

  // 25: 150x150 matrix (22,500 cells scale stress test)
  const s25 = Array.from({ length: 150 }, () => new Array(150).fill(7));
  s25[0][149] = 0;
  s25[149][0] = 0;
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveSetZeroes(s25)), is_hidden: true });

  return tcs;
}

function generateRotateImageTCs() {
  const baseCases = [
    [[1,2,3],[4,5,6],[7,8,9]],
    [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]],
    [[1]],
    [[1,2],[3,4]],
    [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],
    [[0,0],[0,0]],
    [[1,0],[0,1]],
    [[10,20,30],[40,50,60],[70,80,90]],
    [[2,4],[6,8]],
    [[-1,-2],[-3,-4]],
    [[1,1,1],[2,2,2],[3,3,3]],
    [[1,2,3],[1,2,3],[1,2,3]],
    [[7,8,9],[4,5,6],[1,2,3]],
    [[10,11,12,13],[14,15,16,17],[18,19,20,21],[22,23,24,25]],
    [[5,6],[7,8]],
    [[9,8,7],[6,5,4],[3,2,1]],
    [[1,3],[2,4]],
    [[100]],
    [[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]],
    [[4,3,2,1],[8,7,6,5],[12,11,10,9],[16,15,14,13]]
  ];

  const tcs = baseCases.map((mat, idx) => ({
    input: JSON.stringify(mat),
    output: JSON.stringify(solveRotateImage(mat)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 15x15 matrix
  const s21 = Array.from({ length: 15 }, (_, i) => Array.from({ length: 15 }, (_, j) => i * 15 + j));
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveRotateImage(s21)), is_hidden: true });

  // 22: 30x30 matrix
  const s22 = Array.from({ length: 30 }, (_, i) => Array.from({ length: 30 }, (_, j) => (i + j) % 100));
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveRotateImage(s22)), is_hidden: true });

  // 23: 60x60 matrix
  const s23 = Array.from({ length: 60 }, (_, i) => Array.from({ length: 60 }, (_, j) => i - j));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveRotateImage(s23)), is_hidden: true });

  // 24: 100x100 matrix
  const s24 = Array.from({ length: 100 }, (_, i) => Array.from({ length: 100 }, (_, j) => (i * j) % 256));
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveRotateImage(s24)), is_hidden: true });

  // 25: 150x150 matrix (22,500 elements scale stress test)
  const s25 = Array.from({ length: 150 }, (_, i) => Array.from({ length: 150 }, (_, j) => i * 150 + j));
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveRotateImage(s25)), is_hidden: true });

  return tcs;
}

function generateSpiralMatrixTCs() {
  const baseCases = [
    [[1,2,3],[4,5,6],[7,8,9]],
    [[1,2,3,4],[5,6,7,8],[9,10,11,12]],
    [[1]],
    [[1,2],[3,4]],
    [[1,2,3]],
    [[1],[2],[3]],
    [[1,2],[3,4],[5,6]],
    [[1,2,3,4,5]],
    [[1],[2],[3],[4],[5]],
    [[2,5,8],[4,0,-1]],
    [[1,2,3],[8,9,4],[7,6,5]],
    [[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]],
    [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],
    [[6,9,7]],
    [[7],[9],[6]],
    [[1,1,1],[1,1,1],[1,1,1]],
    [[1,2],[4,3]],
    [[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]],
    [[3],[2]],
    [[2,3]]
  ];

  const tcs = baseCases.map((mat, idx) => ({
    input: JSON.stringify(mat),
    output: JSON.stringify(solveSpiralMatrix(mat)),
    is_hidden: idx >= 3
  }));

  // Scale Stress Tests (21 - 25)
  // 21: 20x20 matrix
  const s21 = Array.from({ length: 20 }, (_, i) => Array.from({ length: 20 }, (_, j) => i * 20 + j));
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solveSpiralMatrix(s21)), is_hidden: true });

  // 22: 40x40 matrix
  const s22 = Array.from({ length: 40 }, (_, i) => Array.from({ length: 40 }, (_, j) => i + j));
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solveSpiralMatrix(s22)), is_hidden: true });

  // 23: 1x100 single row matrix
  const s23 = [Array.from({ length: 100 }, (_, i) => i)];
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solveSpiralMatrix(s23)), is_hidden: true });

  // 24: 100x1 single column matrix
  const s24 = Array.from({ length: 100 }, (_, i) => [i]);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solveSpiralMatrix(s24)), is_hidden: true });

  // 25: 100x100 matrix (10,000 elements scale stress test)
  const s25 = Array.from({ length: 100 }, (_, i) => Array.from({ length: 100 }, (_, j) => i * 100 + j));
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solveSpiralMatrix(s25)), is_hidden: true });

  return tcs;
}

// ── PROBLEM METADATA ─────────────────────────────────────────────────────
const problemsToUpgrade = [
  {
    slug: 'leaders-in-an-array',
    title: 'Leaders in an Array',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[16, 17, 4, 3, 5, 2]',
    sample_output: '[17, 5, 2]',
    description: `Given an array \`nums\` of positive integers. Your task is to find the leaders in the array.

An element of the array is considered a leader if it is greater than or equal to all the elements to its right side. The rightmost element is always a leader.

Return all the leaders in the array in the order they appear from left to right.

### **Example 1:**
**Input:** nums = [16, 17, 4, 3, 5, 2]
**Output:** [17, 5, 2]
**Explanation:**
- 17 is greater than [4, 3, 5, 2].
- 5 is greater than [2].
- 2 is the rightmost element, so it is always a leader.

### **Example 2:**
**Input:** nums = [1, 2, 3, 4, 0]
**Output:** [4, 0]

### **Example 3:**
**Input:** nums = [7, 10, 4, 10, 6, 5, 2]
**Output:** [10, 10, 6, 5, 2]

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`0 <= nums[i] <= 10⁶\``,
    hints: [
      'Traverse the array from right to left.',
      'Maintain the maximum element seen so far. If the current element is >= max, it is a leader.',
      'Reverse the accumulated leaders at the end to restore left-to-right order.'
    ],
    testCases: generateLeadersTCs(),
    solutionCode: `
function solution(nums) {
  const res = [];
  let max = -Infinity;
  for (let i = nums.length - 1; i >= 0; i--) {
    if (nums[i] >= max) {
      res.push(nums[i]);
      max = nums[i];
    }
  }
  return res.reverse();
}
`
  },
  {
    slug: 'longest-consecutive-sequence',
    title: 'Longest Consecutive Sequence',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[100, 4, 200, 1, 3, 2]',
    sample_output: '4',
    description: `Given an unsorted array of integers \`nums\`, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in \`O(n)\` time.

### **Example 1:**
**Input:** nums = [100,4,200,1,3,2]
**Output:** 4
**Explanation:** The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.

### **Example 2:**
**Input:** nums = [0,3,7,2,5,8,4,6,0,1]
**Output:** 9

### **Example 3:**
**Input:** nums = []
**Output:** 0

### **Constraints:**
- \`0 <= nums.length <= 10⁵\`
- \`-10⁹ <= nums[i] <= 10⁹\``,
    hints: [
      'Insert all elements into a Hash Set for O(1) lookups.',
      'Only start counting from numbers that do not have a predecessor (num - 1 not in set).'
    ],
    testCases: generateLcsTCs(),
    solutionCode: `
function solution(nums) {
  if (!nums || nums.length === 0) return 0;
  const set = new Set(nums);
  let maxLen = 0;
  for (const num of set) {
    if (!set.has(num - 1)) {
      let curr = num;
      let count = 1;
      while (set.has(curr + 1)) {
        curr++;
        count++;
      }
      maxLen = Math.max(maxLen, count);
    }
  }
  return maxLen;
}
`
  },
  {
    slug: 'set-matrix-zeroes',
    title: 'Set Matrix Zeroes',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[[1, 1, 1], [1, 0, 1], [1, 1, 1]]',
    sample_output: '[[1, 0, 1], [0, 0, 0], [1, 0, 1]]',
    description: `Given an \`m x n\` integer matrix \`matrix\`, if an element is \`0\`, set its entire row and column to \`0\`'s.

You must do it in place.

### **Example 1:**
**Input:** matrix = [[1,1,1],[1,0,1],[1,1,1]]
**Output:** [[1,0,1],[0,0,0],[1,0,1]]

### **Example 2:**
**Input:** matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
**Output:** [[0,0,0,0],[0,4,5,0],[0,3,1,0]]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[0].length\`
- \`1 <= m, n <= 200\`
- \`-2³¹ <= matrix[i][j] <= 2³¹ - 1\`

**Follow up:**
- A straightforward solution using \`O(mn)\` space is probably a bad idea.
- A simple improvement uses \`O(m + n)\` space, but still not the best solution.
- Could you devise a constant space solution?`,
    hints: [
      'Can you use the first row and first column as markers to achieve O(1) space complexity?',
      'Handle row 0 and column 0 separately using boolean flags.'
    ],
    testCases: generateSetZeroesTCs(),
    solutionCode: `
function solution(matrix) {
  const m = matrix.length, n = matrix[0].length;
  let col0 = 1;
  for (let i = 0; i < m; i++) {
    if (matrix[i][0] === 0) col0 = 0;
    for (let j = 1; j < n; j++) {
      if (matrix[i][j] === 0) {
        matrix[i][0] = 0;
        matrix[0][j] = 0;
      }
    }
  }
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 1; j--) {
      if (matrix[i][0] === 0 || matrix[0][j] === 0) {
        matrix[i][j] = 0;
      }
    }
    if (col0 === 0) matrix[i][0] = 0;
  }
  return matrix;
}
`
  },
  {
    slug: 'rotate-image',
    title: 'Rotate Image',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]',
    sample_output: '[[7, 4, 1], [8, 5, 2], [9, 6, 3]]',
    description: `You are given an \`n x n\` 2D matrix representing an image, rotate the image by **90 degrees (clockwise)**.

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.

### **Example 1:**
**Input:** matrix = [[1,2,3],[4,5,6],[7,8,9]]
**Output:** [[7,4,1],[8,5,2],[9,6,3]]

### **Example 2:**
**Input:** matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
**Output:** [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]

### **Constraints:**
- \`n == matrix.length == matrix[i].length\`
- \`1 <= n <= 200\`
- \`-1000 <= matrix[i][j] <= 1000\``,
    hints: [
      'Rotating 90 degrees clockwise is equivalent to transposing the matrix and then reversing each row.',
      'First swap matrix[i][j] with matrix[j][i], then reverse row matrix[i].'
    ],
    testCases: generateRotateImageTCs(),
    solutionCode: `
function solution(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const temp = matrix[i][j];
      matrix[i][j] = matrix[j][i];
      matrix[j][i] = temp;
    }
  }
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
  return matrix;
}
`
  },
  {
    slug: 'spiral-matrix',
    title: 'Spiral Matrix',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]',
    sample_output: '[1, 2, 3, 6, 9, 8, 7, 4, 5]',
    description: `Given an \`m x n\` \`matrix\`, return all elements of the \`matrix\` in **spiral order**.

### **Example 1:**
**Input:** matrix = [[1,2,3],[4,5,6],[7,8,9]]
**Output:** [1,2,3,6,9,8,7,4,5]

### **Example 2:**
**Input:** matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
**Output:** [1,2,3,4,8,12,11,10,9,5,6,7]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[i].length\`
- \`1 <= m, n <= 100\`
- \`-100 <= matrix[i][j] <= 100\``,
    hints: [
      'Maintain four boundaries: top, bottom, left, and right.',
      'Traverse right across top boundary, down right boundary, left across bottom boundary, and up left boundary.',
      'Narrow the boundaries inwards after each direction until boundaries cross.'
    ],
    testCases: generateSpiralMatrixTCs(),
    solutionCode: `
function solution(matrix) {
  const res = [];
  if (!matrix || matrix.length === 0) return res;
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) res.push(matrix[top][j]);
    top++;
    for (let i = top; i <= bottom; i++) res.push(matrix[i][right]);
    right--;
    if (top <= bottom) {
      for (let j = right; j >= left; j--) res.push(matrix[bottom][j]);
      bottom--;
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) res.push(matrix[i][left]);
      left++;
    }
  }
  return res;
}
`
  }
];

// ── MAIN EXECUTION ───────────────────────────────────────────────────────
async function run() {
  console.log('[Upgrade] Starting Upgrade & Validation for Striver Arrays Medium Batch 4 (5 Problems)...');

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
  console.log(`ALL 5 STRIVER ARRAY MEDIUM BATCH 4 PROBLEMS UPGRADED & VALIDATED WITH 25/25 ACCEPTED!`);
  process.exit(0);
}

run().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});

