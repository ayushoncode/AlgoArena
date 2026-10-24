/**
 * seed_striver_medium_batch2_25tc.js
 * Seeds and validates the next 5 Striver A2Z Array Medium problems with exactly 25 test cases each.
 *
 * Problems:
 * 1. Leaders in an Array (leaders-in-an-array)
 * 2. Longest Consecutive Sequence (longest-consecutive-sequence)
 * 3. Set Matrix Zeroes (set-matrix-zeroes)
 * 4. Rotate Image (rotate-image)
 * 5. Spiral Matrix (spiral-matrix)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

function generateLeadersTCs() {
  function solve(arr) {
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
    output: JSON.stringify(solve(arr)),
    is_hidden: idx >= 3,
  }));

  // Stress tests (21 - 25)
  // 21: 500 strictly increasing -> only the last element
  const s21 = [];
  for (let i = 1; i <= 500; i++) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([500]), is_hidden: true });

  // 22: 500 strictly decreasing -> all elements are leaders
  const s22 = [];
  for (let i = 500; i >= 1; i--) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(s22), is_hidden: true });

  // 23: 1000 identical elements -> all are leaders
  const s23 = new Array(1000).fill(42);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(s23), is_hidden: true });

  // 24: 2000 elements with leaders spaced every 200 elements
  const s24 = [];
  for (let i = 0; i < 2000; i++) s24.push(i % 200);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve(s24)), is_hidden: true });

  // 25: 5000 elements stress TLE
  const s25 = [];
  for (let i = 0; i < 5000; i++) s25.push(Math.floor(Math.sin(i) * 1000));
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve(s25)), is_hidden: true });

  return tcs;
}

function generateLcsTCs() {
  function solve(nums) {
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
    output: String(solve(arr)),
    is_hidden: idx >= 3,
  }));

  // Stress tests (21 - 25)
  // 21: 1000 consecutive numbers scrambled
  const s21 = [];
  for (let i = 0; i < 1000; i++) s21.push(i * 3 % 1000);
  tcs.push({ input: JSON.stringify(s21), output: '1000', is_hidden: true });

  // 22: 2000 elements with 2 consecutive blocks of 500
  const s22 = [];
  for (let i = 0; i < 500; i++) s22.push(i);
  for (let i = 0; i < 500; i++) s22.push(i + 10000);
  tcs.push({ input: JSON.stringify(s22), output: '500', is_hidden: true });

  // 23: 3000 elements with lots of duplicates
  const s23 = [];
  for (let i = 0; i < 1000; i++) { s23.push(i); s23.push(i); s23.push(i); }
  tcs.push({ input: JSON.stringify(s23), output: '1000', is_hidden: true });

  // 24: 5000 elements all distinct non-consecutive
  const s24 = [];
  for (let i = 0; i < 5000; i++) s24.push(i * 5);
  tcs.push({ input: JSON.stringify(s24), output: '1', is_hidden: true });

  // 25: 10000 consecutive numbers stress TLE
  const s25 = [];
  for (let i = 10000; i >= 1; i--) s25.push(i);
  tcs.push({ input: JSON.stringify(s25), output: '10000', is_hidden: true });

  return tcs;
}

function generateSetZeroesTCs() {
  function solve(mat) {
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
    output: JSON.stringify(solve(mat)),
    is_hidden: idx >= 3,
  }));

  // Stress tests (21 - 25)
  // 21: 20x20 all 1s except corner 0
  const s21 = Array.from({ length: 20 }, () => new Array(20).fill(1));
  s21[0][0] = 0;
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solve(s21)), is_hidden: true });

  // 22: 30x30 diagonal 0s -> whole matrix becomes 0
  const s22 = Array.from({ length: 30 }, (_, i) => {
    const r = new Array(30).fill(1);
    r[i] = 0;
    return r;
  });
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solve(s22)), is_hidden: true });

  // 23: 50x50 with center 0
  const s23 = Array.from({ length: 50 }, () => new Array(50).fill(5));
  s23[25][25] = 0;
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solve(s23)), is_hidden: true });

  // 24: 1x100 matrix with 0 at index 50
  const s24 = [new Array(100).fill(1)];
  s24[0][50] = 0;
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve(s24)), is_hidden: true });

  // 25: 100x1 matrix with 0 at index 50
  const s25 = Array.from({ length: 100 }, (_, i) => [i === 50 ? 0 : 1]);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve(s25)), is_hidden: true });

  return tcs;
}

function generateRotateImageTCs() {
  function solve(mat) {
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
    output: JSON.stringify(solve(mat)),
    is_hidden: idx >= 3,
  }));

  // Stress tests (21 - 25)
  // 21: 10x10 matrix
  const s21 = Array.from({ length: 10 }, (_, i) => Array.from({ length: 10 }, (_, j) => i * 10 + j));
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solve(s21)), is_hidden: true });

  // 22: 15x15 matrix
  const s22 = Array.from({ length: 15 }, (_, i) => Array.from({ length: 15 }, (_, j) => (i + j) % 7));
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solve(s22)), is_hidden: true });

  // 23: 20x20 matrix
  const s23 = Array.from({ length: 20 }, (_, i) => Array.from({ length: 20 }, (_, j) => i === j ? 1 : 0));
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solve(s23)), is_hidden: true });

  // 24: 30x30 matrix
  const s24 = Array.from({ length: 30 }, (_, i) => Array.from({ length: 30 }, (_, j) => i * j));
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve(s24)), is_hidden: true });

  // 25: 50x50 matrix stress TLE
  const s25 = Array.from({ length: 50 }, (_, i) => Array.from({ length: 50 }, (_, j) => i - j));
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve(s25)), is_hidden: true });

  return tcs;
}

function generateSpiralMatrixTCs() {
  function solve(matrix) {
    if (!matrix || matrix.length === 0) return [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;
    const res = [];
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

  const baseCases = [
    [[1,2,3],[4,5,6],[7,8,9]],
    [[1,2,3,4],[5,6,7,8],[9,10,11,12]],
    [[1]],
    [[1,2],[3,4]],
    [[1,2,3,4,5]],
    [[1],[2],[3],[4],[5]],
    [[2,5,8],[4,0,-1]],
    [[1,2,3],[4,5,6]],
    [[7,9,6],[1,5,7],[3,2,4]],
    [[1,2],[3,4],[5,6]],
    [[1,2,3,4],[5,6,7,8]],
    [[1,2],[3,4],[5,6],[7,8]],
    [[6,9,7]],
    [[1,2,3],[8,9,4],[7,6,5]],
    [[1,2,3,4,5,6]],
    [[10,20],[30,40]],
    [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],
    [[5,1,9,11],[2,4,8,10],[13,3,6,7]],
    [[3],[2]],
    [[2,3,4],[5,6,7],[8,9,10],[11,12,13]]
  ];

  const tcs = baseCases.map((mat, idx) => ({
    input: JSON.stringify(mat),
    output: JSON.stringify(solve(mat)),
    is_hidden: idx >= 3,
  }));

  // Stress tests (21 - 25)
  // 21: 10x10 matrix
  const s21 = Array.from({ length: 10 }, (_, i) => Array.from({ length: 10 }, (_, j) => i * 10 + j + 1));
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(solve(s21)), is_hidden: true });

  // 22: 1x50 row matrix
  const s22 = [Array.from({ length: 50 }, (_, i) => i + 1)];
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(solve(s22)), is_hidden: true });

  // 23: 50x1 col matrix
  const s23 = Array.from({ length: 50 }, (_, i) => [i + 1]);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(solve(s23)), is_hidden: true });

  // 24: 20x20 matrix
  const s24 = Array.from({ length: 20 }, (_, i) => Array.from({ length: 20 }, (_, j) => (i * 20 + j)));
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve(s24)), is_hidden: true });

  // 25: 30x30 matrix stress TLE
  const s25 = Array.from({ length: 30 }, (_, i) => Array.from({ length: 30 }, (_, j) => i + j));
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve(s25)), is_hidden: true });

  return tcs;
}

const PROBLEMS = [
  {
    title: 'Leaders in an Array',
    slug: 'leaders-in-an-array',
    topic: 'arrays',
    difficulty: 'medium',
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
      'Maintain the maximum element seen so far. If the current element is >= max, it is a leader.'
    ],
    sample_input: '[16, 17, 4, 3, 5, 2]',
    sample_output: '[17, 5, 2]',
    testCases: generateLeadersTCs(),
    solutionCode: `function solution(nums) {
      const res = [];
      let max = -Infinity;
      for (let i = nums.length - 1; i >= 0; i--) {
        if (nums[i] >= max) {
          res.push(nums[i]);
          max = nums[i];
        }
      }
      return res.reverse();
    }`
  },
  {
    title: 'Longest Consecutive Sequence',
    slug: 'longest-consecutive-sequence',
    topic: 'arrays',
    difficulty: 'medium',
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
    sample_input: '[100, 4, 200, 1, 3, 2]',
    sample_output: '4',
    testCases: generateLcsTCs(),
    solutionCode: `function solution(nums) {
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
    }`
  },
  {
    title: 'Set Matrix Zeroes',
    slug: 'set-matrix-zeroes',
    topic: 'arrays',
    difficulty: 'medium',
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
- \`-2³¹ <= matrix[i][j] <= 2³¹ - 1\``,
    hints: [
      'Can you use the first row and first column as markers to achieve O(1) space complexity?',
      'Handle row 0 and column 0 separately using boolean flags.'
    ],
    sample_input: '[[1, 1, 1], [1, 0, 1], [1, 1, 1]]',
    sample_output: '[[1, 0, 1], [0, 0, 0], [1, 0, 1]]',
    testCases: generateSetZeroesTCs(),
    solutionCode: `function solution(matrix) {
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
    }`
  },
  {
    title: 'Rotate Image',
    slug: 'rotate-image',
    topic: 'arrays',
    difficulty: 'medium',
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
- \`1 <= n <= 20\`
- \`-1000 <= matrix[i][j] <= 1000\``,
    hints: [
      'Rotating 90 degrees clockwise is equivalent to transposing the matrix and then reversing each row.',
      'First swap matrix[i][j] with matrix[j][i], then reverse row matrix[i].'
    ],
    sample_input: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]',
    sample_output: '[[7, 4, 1], [8, 5, 2], [9, 6, 3]]',
    testCases: generateRotateImageTCs(),
    solutionCode: `function solution(matrix) {
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
    }`
  },
  {
    title: 'Spiral Matrix',
    slug: 'spiral-matrix',
    topic: 'arrays',
    difficulty: 'medium',
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
- \`1 <= m, n <= 10\`
- \`-100 <= matrix[i][j] <= 100\``,
    hints: [
      'Maintain four boundaries: top, bottom, left, and right.',
      'Iterate along top row, right column, bottom row (right to left), and left column (bottom to top), shrinking boundaries at each step.'
    ],
    sample_input: '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]',
    sample_output: '[1, 2, 3, 6, 9, 8, 7, 4, 5]',
    testCases: generateSpiralMatrixTCs(),
    solutionCode: `function solution(matrix) {
      if (!matrix || matrix.length === 0) return [];
      let top = 0, bottom = matrix.length - 1;
      let left = 0, right = matrix[0].length - 1;
      const res = [];
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
    }`
  }
];

async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Striver Array Medium Batch 2...');

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
