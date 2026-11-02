/**
 * backend/scripts/seed_striver_bs_batch6_25tc.js
 * Seeds and validates the next 5 Striver A2Z Binary Search problems (Step 4.2 & Step 4.3)
 * Each problem gets exactly 25 curated test cases with 100% judge pass.
 *
 * Problems:
 * 1. Median of Two Sorted Arrays (median-of-two-sorted-arrays) - Step 4.2
 * 2. Row with Maximum 1s (row-with-max-1s) - Step 4.3
 * 3. Search a 2D Matrix (search-a-2d-matrix) - Step 4.3
 * 4. Search a 2D Matrix II (search-a-2d-matrix-ii) - Step 4.3
 * 5. Find a Peak Element II (find-a-peak-element-ii) - Step 4.3
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });
const { evaluateSubmission } = require('../services/judge');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Median of Two Sorted Arrays (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateMedianTwoSortedTCs() {
  function findMedianSortedArrays(nums1, nums2) {
    if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
    const n = nums1.length, m = nums2.length;
    let low = 0, high = n;
    while (low <= high) {
      const cut1 = Math.floor((low + high) / 2);
      const cut2 = Math.floor((n + m + 1) / 2) - cut1;
      const l1 = cut1 === 0 ? -Infinity : nums1[cut1 - 1];
      const l2 = cut2 === 0 ? -Infinity : nums2[cut2 - 1];
      const r1 = cut1 === n ? Infinity : nums1[cut1];
      const r2 = cut2 === m ? Infinity : nums2[cut2];
      if (l1 <= r2 && l2 <= r1) {
        if ((n + m) % 2 === 0) {
          const med = (Math.max(l1, l2) + Math.min(r1, r2)) / 2;
          return Number.isInteger(med) ? String(med) : String(med);
        } else {
          return String(Math.max(l1, l2));
        }
      } else if (l1 > r2) {
        high = cut1 - 1;
      } else {
        low = cut1 + 1;
      }
    }
    return '0';
  }

  const raw = [
    [[1, 3], [2]],
    [[1, 2], [3, 4]],
    [[0, 0], [0, 0]],
    [[], [1]],
    [[2], []],
    [[1, 2, 5, 6, 8], [13, 17, 30, 45]],
    [[10], [20, 30, 40, 50]],
    [[1, 3, 5], [2, 4, 6]],
    [[-5, -3, -1], [2, 4, 6]],
    [[-10, -5], [-2, -1]],
    [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]],
    [[1, 1, 1], [1, 1, 1]],
    [[100, 200], [300, 400, 500, 600]],
    [[5], [1, 2, 3, 4, 6, 7, 8]],
    [[1, 2], [1, 2, 3]],
    [[2, 2, 2], [2, 2, 2, 2]],
    [[10, 20, 30], [5, 15, 25]],
    [[1000], [1000]],
    [[-100, 0, 100], [-50, 50]],
    [[1, 4, 7, 10], [2, 3, 8, 9]]
  ];

  const tcs = raw.map(([nums1, nums2], idx) => ({
    input: `${JSON.stringify(nums1)}, ${JSON.stringify(nums2)}`,
    output: findMedianSortedArrays(nums1, nums2),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 500 evens + 500 odds 1..1000 -> median is 500.5
  const s21A = Array.from({ length: 500 }, (_, i) => (i + 1) * 2);
  const s21B = Array.from({ length: 500 }, (_, i) => i * 2 + 1);
  tcs.push({ input: `${JSON.stringify(s21A)}, ${JSON.stringify(s21B)}`, output: findMedianSortedArrays(s21A, s21B), is_hidden: true });

  // 22: 1000 elements 1..1000 + empty -> median is 500.5
  const s22 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s22)}, []`, output: findMedianSortedArrays(s22, []), is_hidden: true });

  // 23: 1 element [1000] + 999 elements 1..999 -> median is 500.5
  const s23A = [1000];
  const s23B = Array.from({ length: 999 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23A)}, ${JSON.stringify(s23B)}`, output: findMedianSortedArrays(s23A, s23B), is_hidden: true });

  // 24: 500 negative elements + 500 positive elements
  const s24A = Array.from({ length: 500 }, (_, i) => -500 + i);
  const s24B = Array.from({ length: 500 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s24A)}, ${JSON.stringify(s24B)}`, output: findMedianSortedArrays(s24A, s24B), is_hidden: true });

  // 25: 501 elements 1..501 + empty -> median is 251
  const s25 = Array.from({ length: 501 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s25)}, []`, output: findMedianSortedArrays(s25, []), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Row with Maximum 1s (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateRowWithMax1sTCs() {
  function rowWithMax1s(mat) {
    const n = mat.length;
    if (n === 0) return -1;
    const m = mat[0].length;
    let maxCount = 0;
    let ansIdx = -1;
    for (let i = 0; i < n; i++) {
      let low = 0, high = m - 1, firstOne = m;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (mat[i][mid] === 1) {
          firstOne = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
      const count = m - firstOne;
      if (count > maxCount) {
        maxCount = count;
        ansIdx = i;
      }
    }
    return ansIdx;
  }

  const raw = [
    [[[0, 1, 1, 1], [0, 0, 1, 1], [1, 1, 1, 1], [0, 0, 0, 0]]],
    [[[0, 0], [1, 1]]],
    [[[0, 0], [0, 0]]], // no 1s -> -1
    [[[1, 1, 1], [0, 1, 1], [0, 0, 1]]],
    [[[0], [0], [0]]],
    [[[1], [1], [1]]], // tie at 0 -> 0
    [[[0, 0, 0, 1], [0, 1, 1, 1], [0, 0, 1, 1]]],
    [[[0, 1], [0, 1], [0, 1]]],
    [[[0, 0, 0], [0, 0, 1], [0, 1, 1]]],
    [[[0, 0, 0, 0, 0], [0, 0, 0, 0, 1], [0, 0, 0, 1, 1]]],
    [[[1, 1, 1, 1, 1]]],
    [[[0, 0, 0, 0, 0]]],
    [[[0, 1, 1], [1, 1, 1], [0, 0, 0]]],
    [[[0, 0, 1, 1], [0, 0, 0, 1], [1, 1, 1, 1]]],
    [[[0, 0, 0], [1, 1, 1], [0, 1, 1], [1, 1, 1]]],
    [[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1]]],
    [[[0, 0, 1], [0, 0, 0], [0, 0, 0]]],
    [[[0, 1, 1, 1, 1], [0, 0, 1, 1, 1], [0, 0, 0, 1, 1]]],
    [[[0, 0, 0, 0], [0, 0, 1, 1], [0, 1, 1, 1], [1, 1, 1, 1]]],
    [[[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]]
  ];

  const tcs = raw.map(([mat], idx) => ({
    input: `${JSON.stringify(mat)}`,
    output: String(rowWithMax1s(mat)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 rows, 100 cols, row 42 has all 1s
  const s21 = Array.from({ length: 100 }, (_, r) => 
    Array.from({ length: 100 }, () => (r === 42 ? 1 : 0))
  );
  tcs.push({ input: `${JSON.stringify(s21)}`, output: String(rowWithMax1s(s21)), is_hidden: true });

  // 22: 100 rows, 100 cols, row 99 has 50 ones (rest have <= 40)
  const s22 = Array.from({ length: 100 }, (_, r) => {
    const ones = r === 99 ? 50 : 20;
    return Array.from({ length: 100 }, (_, c) => (c >= 100 - ones ? 1 : 0));
  });
  tcs.push({ input: `${JSON.stringify(s22)}`, output: String(rowWithMax1s(s22)), is_hidden: true });

  // 23: 100 rows, 100 cols, strictly increasing number of 1s (row 99 has max)
  const s23 = Array.from({ length: 100 }, (_, r) => 
    Array.from({ length: 100 }, (_, c) => (c >= 100 - r ? 1 : 0))
  );
  tcs.push({ input: `${JSON.stringify(s23)}`, output: String(rowWithMax1s(s23)), is_hidden: true });

  // 24: 100 rows, 100 cols, strictly decreasing number of 1s (row 0 has max)
  const s24 = Array.from({ length: 100 }, (_, r) => 
    Array.from({ length: 100 }, (_, c) => (c >= r ? 1 : 0))
  );
  tcs.push({ input: `${JSON.stringify(s24)}`, output: String(rowWithMax1s(s24)), is_hidden: true });

  // 25: 100 rows, 100 cols, all zeros -> -1
  const s25 = Array.from({ length: 100 }, () => new Array(100).fill(0));
  tcs.push({ input: `${JSON.stringify(s25)}`, output: String(rowWithMax1s(s25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Search a 2D Matrix (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSearch2DMatrixTCs() {
  function searchMatrix(matrix, target) {
    const m = matrix.length;
    if (m === 0) return false;
    const n = matrix[0].length;
    let low = 0, high = m * n - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const val = matrix[Math.floor(mid / n)][mid % n];
      if (val === target) return true;
      if (val < target) low = mid + 1;
      else high = mid - 1;
    }
    return false;
  }

  const raw = [
    [[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3],
    [[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 13],
    [[[1]], 1],
    [[[1]], 2],
    [[[1, 3]], 3],
    [[[1], [3]], 3],
    [[[1, 3, 5, 7]], 4],
    [[[1, 3, 5, 7]], 7],
    [[[1, 3, 5, 7]], 0],
    [[[1, 3, 5, 7]], 8],
    [[[10, 20], [30, 40]], 20],
    [[[10, 20], [30, 40]], 25],
    [[[-10, -5], [-2, 0], [2, 5]], -5],
    [[[-10, -5], [-2, 0], [2, 5]], -1],
    [[[100, 200, 300], [400, 500, 600]], 500],
    [[[100, 200, 300], [400, 500, 600]], 350],
    [[[-50, -40], [-30, -20], [-10, 0]], -20],
    [[[-50, -40], [-30, -20], [-10, 0]], 10],
    [[[1, 2, 3, 4], [5, 6, 7, 8]], 8],
    [[[1, 2, 3, 4], [5, 6, 7, 8]], 1]
  ];

  const tcs = raw.map(([matrix, target], idx) => ({
    input: `${JSON.stringify(matrix)}, ${target}`,
    output: String(searchMatrix(matrix, target)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 x 100 matrix 1..10000, target 5000 -> true
  const s21 = [];
  let cur = 1;
  for (let r = 0; r < 100; r++) {
    const row = [];
    for (let c = 0; c < 100; c++) row.push(cur++);
    s21.push(row);
  }
  tcs.push({ input: `${JSON.stringify(s21)}, 5000`, output: String(searchMatrix(s21, 5000)), is_hidden: true });

  // 22: target 10001 -> false
  tcs.push({ input: `${JSON.stringify(s21)}, 10001`, output: String(searchMatrix(s21, 10001)), is_hidden: true });

  // 23: target 1 -> true
  tcs.push({ input: `${JSON.stringify(s21)}, 1`, output: String(searchMatrix(s21, 1)), is_hidden: true });

  // 24: target 10000 -> true
  tcs.push({ input: `${JSON.stringify(s21)}, 10000`, output: String(searchMatrix(s21, 10000)), is_hidden: true });

  // 25: 100 x 100 matrix with all even numbers, target 5001 (odd) -> false
  const s25 = [];
  let curEven = 2;
  for (let r = 0; r < 100; r++) {
    const row = [];
    for (let c = 0; c < 100; c++) { row.push(curEven); curEven += 2; }
    s25.push(row);
  }
  tcs.push({ input: `${JSON.stringify(s25)}, 5001`, output: String(searchMatrix(s25, 5001)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Search a 2D Matrix II (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSearch2DMatrixIICountTCs() {
  function searchMatrixII(matrix, target) {
    const m = matrix.length;
    if (m === 0) return false;
    const n = matrix[0].length;
    let row = 0, col = n - 1;
    while (row < m && col >= 0) {
      const val = matrix[row][col];
      if (val === target) return true;
      if (val > target) col--;
      else row++;
    }
    return false;
  }

  const raw = [
    [[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], 5],
    [[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], 20],
    [[[-5]], -5],
    [[[-5]], -10],
    [[[-1, 3]], 3],
    [[[1], [2], [3]], 2],
    [[[1], [2], [3]], 4],
    [[[1, 2, 3, 4, 5]], 4],
    [[[1, 2, 3, 4, 5]], 6],
    [[[1, 3, 5], [2, 4, 6], [7, 8, 9]], 4],
    [[[1, 3, 5], [2, 4, 6], [7, 8, 9]], 10],
    [[[5, 6, 7], [8, 9, 10], [11, 12, 13]], 5],
    [[[5, 6, 7], [8, 9, 10], [11, 12, 13]], 13],
    [[[1, 4], [2, 5]], 2],
    [[[1, 4], [2, 5]], 3],
    [[[-10, -5], [-8, 0]], -8],
    [[[-10, -5], [-8, 0]], 5],
    [[[10, 20, 30], [15, 25, 35], [27, 29, 37], [32, 33, 39]], 29],
    [[[10, 20, 30], [15, 25, 35], [27, 29, 37], [32, 33, 39]], 100],
    [[[2, 5, 8], [4, 7, 10], [6, 9, 12]], 9]
  ];

  const tcs = raw.map(([matrix, target], idx) => ({
    input: `${JSON.stringify(matrix)}, ${target}`,
    output: String(searchMatrixII(matrix, target)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 x 100 table where mat[i][j] = i + j
  const s21 = Array.from({ length: 100 }, (_, r) => 
    Array.from({ length: 100 }, (_, c) => r + c)
  );
  tcs.push({ input: `${JSON.stringify(s21)}, 99`, output: String(searchMatrixII(s21, 99)), is_hidden: true });

  // 22: target 200 (max is 99 + 99 = 198) -> false
  tcs.push({ input: `${JSON.stringify(s21)}, 200`, output: String(searchMatrixII(s21, 200)), is_hidden: true });

  // 23: target 0 -> true (at 0,0)
  tcs.push({ input: `${JSON.stringify(s21)}, 0`, output: String(searchMatrixII(s21, 0)), is_hidden: true });

  // 24: target 198 -> true (at 99,99)
  tcs.push({ input: `${JSON.stringify(s21)}, 198`, output: String(searchMatrixII(s21, 198)), is_hidden: true });

  // 25: 100 x 100 table with only even values r*2 + c*2, target 51 (odd) -> false
  const s25 = Array.from({ length: 100 }, (_, r) => 
    Array.from({ length: 100 }, (_, c) => (r + c) * 2)
  );
  tcs.push({ input: `${JSON.stringify(s25)}, 51`, output: String(searchMatrixII(s25, 51)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Find a Peak Element II (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFindPeakElementIICountTCs() {
  function findPeakGrid(mat) {
    const m = mat.length, n = mat[0].length;
    let low = 0, high = n - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let maxRow = 0;
      for (let i = 0; i < m; i++) {
        if (mat[i][mid] > mat[maxRow][mid]) maxRow = i;
      }
      const left = mid > 0 ? mat[maxRow][mid - 1] : -1;
      const right = mid < n - 1 ? mat[maxRow][mid + 1] : -1;
      if (mat[maxRow][mid] > left && mat[maxRow][mid] > right) {
        return [maxRow, mid];
      } else if (left > mat[maxRow][mid]) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return [-1, -1];
  }

  const raw = [
    [[[1, 4], [3, 2]]],
    [[[10, 20, 15], [21, 30, 14], [7, 16, 32]]],
    [[[5]]],
    [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]],
    [[[9, 8, 7], [6, 5, 4], [3, 2, 1]]],
    [[[1, 5, 3], [4, 8, 6], [2, 7, 0]]],
    [[[10, 50, 40], [20, 30, 60]]],
    [[[1, 2], [3, 4]]],
    [[[4, 3], [2, 1]]],
    [[[1, 3, 2], [4, 6, 5]]],
    [[[100, 200, 150], [300, 500, 400], [250, 450, 350]]],
    [[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]],
    [[[5, 4, 3, 2, 1], [10, 9, 8, 7, 6]]],
    [[[2, 4, 6, 8], [1, 3, 5, 7]]],
    [[[1, 4, 3], [6, 5, 2], [7, 8, 9]]],
    [[[10, 20], [30, 40], [50, 60]]],
    [[[60, 50], [40, 30], [20, 10]]],
    [[[1, 10, 2], [3, 20, 4], [5, 30, 6]]],
    [[[50, 40, 30], [60, 70, 80], [10, 20, 90]]],
    [[[15, 25, 35], [45, 55, 65], [75, 85, 95]]]
  ];

  const tcs = raw.map(([mat], idx) => ({
    input: `${JSON.stringify(mat)}`,
    output: JSON.stringify(findPeakGrid(mat)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 50 x 50 matrix strictly increasing to bottom-right
  const s21 = Array.from({ length: 50 }, (_, r) => 
    Array.from({ length: 50 }, (_, c) => r * 50 + c + 1)
  );
  tcs.push({ input: `${JSON.stringify(s21)}`, output: JSON.stringify(findPeakGrid(s21)), is_hidden: true });

  // 22: 50 x 50 matrix strictly decreasing from top-left
  const s22 = Array.from({ length: 50 }, (_, r) => 
    Array.from({ length: 50 }, (_, c) => 2500 - (r * 50 + c))
  );
  tcs.push({ input: `${JSON.stringify(s22)}`, output: JSON.stringify(findPeakGrid(s22)), is_hidden: true });

  // 23: 50 x 50 matrix with single max peak in center at [25, 25]
  const s23 = Array.from({ length: 50 }, (_, r) => 
    Array.from({ length: 50 }, (_, c) => 10000 - (Math.abs(r - 25) + Math.abs(c - 25)))
  );
  tcs.push({ input: `${JSON.stringify(s23)}`, output: JSON.stringify(findPeakGrid(s23)), is_hidden: true });

  // 24: 1 x 100 row matrix
  const s24 = [Array.from({ length: 100 }, (_, i) => (i < 50 ? i + 1 : 100 - i))];
  tcs.push({ input: `${JSON.stringify(s24)}`, output: JSON.stringify(findPeakGrid(s24)), is_hidden: true });

  // 25: 100 x 1 column matrix
  const s25 = Array.from({ length: 100 }, (_, i) => [i < 50 ? i + 1 : 100 - i]);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: JSON.stringify(findPeakGrid(s25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[1, 3], [2]',
    sample_output: '2',
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return **the median** of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.

### **Example 1:**
**Input:** nums1 = [1,3], nums2 = [2]
**Output:** 2
**Explanation:** merged array = [1,2,3] and median is 2.

### **Example 2:**
**Input:** nums1 = [1,2], nums2 = [3,4]
**Output:** 2.5
**Explanation:** merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.

### **Constraints:**
- \`nums1.length == m\`
- \`nums2.length == n\`
- \`0 <= m <= 1000\`
- \`0 <= n <= 1000\`
- \`1 <= m + n <= 2000\`
- \`-10⁶ <= nums1[i], nums2[i] <= 10⁶\``,
    hints: [
      'The naive approach of merging takes O(m + n) time. To achieve O(log(min(m, n))), use binary search on the shorter array.',
      'Partition both arrays such that the left half has (m + n + 1) // 2 elements and all elements in the left half are <= all elements in the right half.',
      'Find a partition where maxLeft1 <= minRight2 and maxLeft2 <= minRight1. If the total number of elements is odd, the median is max(maxLeft1, maxLeft2). If even, it is the average of max(maxLeft1, maxLeft2) and min(minRight1, minRight2).'
    ],
    testCases: generateMedianTwoSortedTCs(),
    solutionCode: `
function solution(nums1, nums2) {
  if (nums1.length > nums2.length) return solution(nums2, nums1);
  const n = nums1.length, m = nums2.length;
  let low = 0, high = n;
  while (low <= high) {
    const cut1 = Math.floor((low + high) / 2);
    const cut2 = Math.floor((n + m + 1) / 2) - cut1;
    const l1 = cut1 === 0 ? -Infinity : nums1[cut1 - 1];
    const l2 = cut2 === 0 ? -Infinity : nums2[cut2 - 1];
    const r1 = cut1 === n ? Infinity : nums1[cut1];
    const r2 = cut2 === m ? Infinity : nums2[cut2];
    if (l1 <= r2 && l2 <= r1) {
      if ((n + m) % 2 === 0) {
        return (Math.max(l1, l2) + Math.min(r1, r2)) / 2;
      } else {
        return Math.max(l1, l2);
      }
    } else if (l1 > r2) {
      high = cut1 - 1;
    } else {
      low = cut1 + 1;
    }
  }
  return 0;
}
`
  },
  {
    title: 'Row with Maximum 1s',
    slug: 'row-with-max-1s',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[[0, 1, 1, 1], [0, 0, 1, 1], [1, 1, 1, 1], [0, 0, 0, 0]]',
    sample_output: '2',
    description: `You are given a 2D binary matrix \`mat\` of dimensions \`n x m\`, where each row is sorted in non-decreasing order (consisting of 0s followed by 1s).

Find the 0-based index of the **first row** that has the maximum number of 1s. If multiple rows have the same maximum count of 1s, return the row with the **smallest index**.
If no row contains any 1, return \`-1\`.

### **Example 1:**
**Input:** mat = [[0, 1, 1, 1], [0, 0, 1, 1], [1, 1, 1, 1], [0, 0, 0, 0]]
**Output:** 2
**Explanation:** Row 2 has 4 ones, which is the maximum among all rows.

### **Example 2:**
**Input:** mat = [[0, 0], [1, 1]]
**Output:** 1

### **Example 3:**
**Input:** mat = [[0, 0], [0, 0]]
**Output:** -1
**Explanation:** None of the rows contain any 1s, so return -1.

### **Constraints:**
- \`1 <= n, m <= 1000\`
- \`mat[i][j]\` is either \`0\` or \`1\`.
- Each row of \`mat\` is sorted in non-decreasing order.`,
    hints: [
      'Since each row is sorted, use binary search (lower bound) to find the first occurrence of 1 in each row.',
      'The number of 1s in row i is m - firstIndex(1).',
      'Track the row index with the strictly greater count of 1s. If tie, keep the smaller row index.'
    ],
    testCases: generateRowWithMax1sTCs(),
    solutionCode: `
function solution(mat) {
  const n = mat.length;
  if (n === 0) return -1;
  const m = mat[0].length;
  let maxCount = 0;
  let ansIdx = -1;
  for (let i = 0; i < n; i++) {
    let low = 0, high = m - 1, firstOne = m;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (mat[i][mid] === 1) {
        firstOne = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    const count = m - firstOne;
    if (count > maxCount) {
      maxCount = count;
      ansIdx = i;
    }
  }
  return ansIdx;
}
`
  },
  {
    title: 'Search a 2D Matrix',
    slug: 'search-a-2d-matrix',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3',
    sample_output: 'true',
    description: `You are given an \`m x n\` integer matrix \`matrix\` with the following two properties:
- Each row is sorted in non-decreasing order.
- The first integer of each row is greater than the last integer of the previous row.

Given an integer \`target\`, return \`true\` if \`target\` is in \`matrix\` or \`false\` otherwise.

You must write a solution in \`O(log(m * n))\` time complexity.

### **Example 1:**
**Input:** matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3
**Output:** true

### **Example 2:**
**Input:** matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13
**Output:** false

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[i].length\`
- \`1 <= m, n <= 100\`
- \`-10⁴ <= matrix[i][j], target <= 10⁴\``,
    hints: [
      'The matrix can be viewed as a flattened 1D sorted array of length m * n.',
      'Use standard binary search from low = 0 to high = m * n - 1.',
      'Convert 1D index mid to 2D indices: row = mid / n, col = mid % n.'
    ],
    testCases: generateSearch2DMatrixTCs(),
    solutionCode: `
function solution(matrix, target) {
  const m = matrix.length;
  if (m === 0) return false;
  const n = matrix[0].length;
  let low = 0, high = m * n - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const val = matrix[Math.floor(mid / n)][mid % n];
    if (val === target) return true;
    if (val < target) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}
`
  },
  {
    title: 'Search a 2D Matrix II',
    slug: 'search-a-2d-matrix-ii',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], 5',
    sample_output: 'true',
    description: `Write an efficient algorithm that searches for a value \`target\` in an \`m x n\` integer matrix \`matrix\`. This matrix has the following properties:
- Integers in each row are sorted in ascending from left to right.
- Integers in each column are sorted in ascending from top to bottom.

### **Example 1:**
**Input:** matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 5
**Output:** true

### **Example 2:**
**Input:** matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 20
**Output:** false

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[i].length\`
- \`1 <= n, m <= 300\`
- \`-10⁹ <= matrix[i][j], target <= 10⁹\``,
    hints: [
      'Start from the top-right corner (row = 0, col = n - 1).',
      'If matrix[row][col] == target, return true.',
      'If matrix[row][col] > target, all elements below in this column are larger, so move left (col--).',
      'If matrix[row][col] < target, all elements to the left in this row are smaller, so move down (row++).'
    ],
    testCases: generateSearch2DMatrixIICountTCs(),
    solutionCode: `
function solution(matrix, target) {
  const m = matrix.length;
  if (m === 0) return false;
  const n = matrix[0].length;
  let row = 0, col = n - 1;
  while (row < m && col >= 0) {
    const val = matrix[row][col];
    if (val === target) return true;
    if (val > target) col--;
    else row++;
  }
  return false;
}
`
  },
  {
    title: 'Find a Peak Element II',
    slug: 'find-a-peak-element-ii',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[[1, 4], [3, 2]]',
    sample_output: '[1, 0]',
    description: `A **peak element** in a 2D grid is an element that is **strictly greater** than all of its adjacent neighbors to the left, right, top, and bottom.

Given a **0-indexed** \`m x n\` matrix \`mat\` where no two adjacent cells are equal, find **any peak element** \`mat[i][j]\` and return the length 2 array \`[i, j]\`.

You may assume that the entire grid is surrounded by an outer perimeter with the value \`-1\` in each cell.

You must write an algorithm that runs in \`O(m * log(n))\` or \`O(n * log(m))\` time.

### **Example 1:**
**Input:** mat = [[1, 4], [3, 2]]
**Output:** [1, 0]
**Explanation:** Both 3 and 4 are peak elements. [1, 0] and [0, 1] are both acceptable answers.

### **Example 2:**
**Input:** mat = [[10, 20, 15], [21, 30, 14], [7, 16, 32]]
**Output:** [1, 1]
**Explanation:** 30 and 32 are peak elements. [1, 1] and [2, 2] are both acceptable answers.

### **Constraints:**
- \`m == mat.length\`
- \`n == mat[i].length\`
- \`1 <= m, n <= 500\`
- \`1 <= mat[i][j] <= 10⁵\`
- No two adjacent cells are equal.`,
    hints: [
      'Apply binary search on the columns: pick mid = (low + high) / 2.',
      'Find the maximum element in column mid (say at row maxRow).',
      'Compare mat[maxRow][mid] with its horizontal neighbors (mid - 1 and mid + 1).',
      'If it is greater than both, you have found a peak! If left is larger, search left half; otherwise search right half.'
    ],
    testCases: generateFindPeakElementIICountTCs(),
    solutionCode: `
function solution(mat) {
  const m = mat.length, n = mat[0].length;
  let low = 0, high = n - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let maxRow = 0;
    for (let i = 0; i < m; i++) {
      if (mat[i][mid] > mat[maxRow][mid]) maxRow = i;
    }
    const left = mid > 0 ? mat[maxRow][mid - 1] : -1;
    const right = mid < n - 1 ? mat[maxRow][mid + 1] : -1;
    if (mat[maxRow][mid] > left && mat[maxRow][mid] > right) {
      return [maxRow, mid];
    } else if (left > mat[maxRow][mid]) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return [-1, -1];
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 6 (5 Problems)...');

  for (const p of PROBLEMS) {
    console.log(`\n========================================\n[Problem] Processing: ${p.title} (${p.slug})`);

    // 1. Check if problem already exists
    const { rows: existing } = await pool.query(
      `SELECT id FROM problems WHERE slug = $1`,
      [p.slug]
    );

    let problemId;
    if (existing.length > 0) {
      problemId = existing[0].id;
      console.log(`  -> Found existing in DB with ID: ${problemId}. Updating fields...`);
      await pool.query(
        `UPDATE problems
         SET title = $1, topic = $2, difficulty = $3, description = $4, hints = $5,
             sample_input = $6, sample_output = $7
         WHERE id = $8`,
        [p.title, p.topic, p.difficulty, p.description, JSON.stringify(p.hints), p.sample_input, p.sample_output, problemId]
      );
    } else {
      console.log(`  -> Inserting new problem into DB...`);
      const { rows: inserted } = await pool.query(
        `INSERT INTO problems (title, slug, topic, difficulty, description, hints, sample_input, sample_output)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [p.title, p.slug, p.topic, p.difficulty, p.description, JSON.stringify(p.hints), p.sample_input, p.sample_output]
      );
      problemId = inserted[0].id;
      console.log(`  -> Inserted with ID: ${problemId}`);
    }

    // 2. Clear old test cases
    const { rowCount: deletedCount } = await pool.query(
      `DELETE FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );
    if (deletedCount > 0) {
      console.log(`  -> Cleared ${deletedCount} existing test cases.`);
    }

    // 3. Insert 25 curated test cases
    console.log(`  -> Inserting ${p.testCases.length} test cases...`);
    for (const tc of p.testCases) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }

    // 4. Verify test case count in DB
    const { rows: countCheck } = await pool.query(
      `SELECT count(*) FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );
    console.log(`  -> Verified in DB: count = ${countCheck[0].count} test cases.`);

    // 5. Query back test cases and run Judge evaluation
    const evalResult = await evaluateSubmission(problemId, p.solutionCode, 'javascript');
    console.log(`  -> Judge Verdict: ${evalResult.verdict} (${evalResult.passedTests}/${evalResult.totalTests} tests passed in ${evalResult.runtimeMs}ms)`);

    if (evalResult.verdict !== 'ACCEPTED' || evalResult.passedTests !== 25) {
      console.error(`  [ERROR] Problem ${p.title} failed validation!`);
      const firstFailed = evalResult.testResults.find(t => !t.passed);
      console.error('  First failed test:', firstFailed);
      process.exit(1);
    }

    console.log(`  -> SUCCESS! 25/25 ACCEPTED for ${p.title}`);
  }

  console.log('\n========================================\nALL 5 BINARY SEARCH PROBLEMS SEEDED & VALIDATED WITH 25/25 ACCEPTED!\n');
  await pool.end();
}

main().catch(err => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});

