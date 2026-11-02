/**
 * backend/scripts/seed_striver_bs_batch7_25tc.js
 * Seeds and validates the next 5 Binary Search problems (Step 4.3 & Advanced BS)
 * Each problem gets exactly 25 curated test cases with 100% judge pass.
 *
 * Problems:
 * 1. Matrix Median (matrix-median)
 * 2. Find Minimum in Rotated Sorted Array II (find-minimum-in-rotated-sorted-array-ii)
 * 3. H-Index II (h-index-ii)
 * 4. Heaters (heaters)
 * 5. Find Right Interval (find-right-interval)
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });
const { evaluateSubmission } = require('../services/judge');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Matrix Median (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateMatrixMedianTCs() {
  function matrixMedian(mat) {
    const r = mat.length, c = mat[0].length;
    let min = mat[0][0], max = mat[0][c - 1];
    for (let i = 1; i < r; i++) {
      min = Math.min(min, mat[i][0]);
      max = Math.max(max, mat[i][c - 1]);
    }
    const desired = Math.floor((r * c + 1) / 2);
    let low = min, high = max;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let count = 0;
      for (let i = 0; i < r; i++) {
        let l = 0, h = c - 1, ub = c;
        while (l <= h) {
          const m = Math.floor((l + h) / 2);
          if (mat[i][m] > mid) {
            ub = m;
            h = m - 1;
          } else {
            l = m + 1;
          }
        }
        count += ub;
      }
      if (count < desired) low = mid + 1;
      else high = mid - 1;
    }
    return low;
  }

  const raw = [
    [[[1, 3, 5], [2, 6, 9], [3, 6, 9]]],
    [[[1, 3, 4], [2, 5, 6], [7, 8, 9]]],
    [[[1]]],
    [[[1, 2, 3]]],
    [[[1], [2], [3]]],
    [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]],
    [[[2, 3, 5], [1, 4, 8], [6, 7, 9]]],
    [[[1, 10, 20], [2, 15, 25], [3, 18, 30]]],
    [[[5, 11, 20], [1, 2, 3], [15, 16, 17]]],
    [[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15]]],
    [[[10, 20, 30], [5, 15, 25], [1, 2, 3]]],
    [[[1, 1, 2], [2, 3, 3], [3, 4, 4]]],
    [[[100, 200, 300], [150, 250, 350], [120, 220, 320]]],
    [[[1, 4, 7], [2, 5, 8], [3, 6, 9]]],
    [[[5, 5, 5], [5, 5, 5], [5, 5, 5]]],
    [[[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]],
    [[[1, 2, 7], [3, 4, 8], [5, 6, 9]]],
    [[[2, 4, 6], [1, 3, 5], [7, 8, 9]]],
    [[[10, 30, 50], [20, 40, 60], [15, 25, 35]]],
    [[[1, 5, 9, 13, 17], [2, 6, 10, 14, 18], [3, 7, 11, 15, 19]]]
  ];

  const tcs = raw.map(([mat], idx) => ({
    input: `${JSON.stringify(mat)}`,
    output: String(matrixMedian(mat)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 19 rows x 19 cols where mat[r][c] = r * 19 + c + 1 -> median is 181
  const s21 = Array.from({ length: 19 }, (_, r) => 
    Array.from({ length: 19 }, (_, c) => r * 19 + c + 1)
  );
  tcs.push({ input: `${JSON.stringify(s21)}`, output: String(matrixMedian(s21)), is_hidden: true });

  // 22: 21 rows x 21 cols all 42 -> median is 42
  const s22 = Array.from({ length: 21 }, () => new Array(21).fill(42));
  tcs.push({ input: `${JSON.stringify(s22)}`, output: String(matrixMedian(s22)), is_hidden: true });

  // 23: 15 rows x 15 cols, odd numbers 1, 3, 5...
  const s23 = Array.from({ length: 15 }, (_, r) => 
    Array.from({ length: 15 }, (_, c) => (r * 15 + c) * 2 + 1)
  );
  tcs.push({ input: `${JSON.stringify(s23)}`, output: String(matrixMedian(s23)), is_hidden: true });

  // 24: 1 row x 99 cols 1..99 -> median is 50
  const s24 = [Array.from({ length: 99 }, (_, i) => i + 1)];
  tcs.push({ input: `${JSON.stringify(s24)}`, output: String(matrixMedian(s24)), is_hidden: true });

  // 25: 99 rows x 1 col 1..99 -> median is 50
  const s25 = Array.from({ length: 99 }, (_, i) => [i + 1]);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: String(matrixMedian(s25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Find Minimum in Rotated Sorted Array II (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFindMinRotatedIICountTCs() {
  function findMinII(nums) {
    let low = 0, high = nums.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (nums[mid] > nums[high]) {
        low = mid + 1;
      } else if (nums[mid] < nums[high]) {
        high = mid;
      } else {
        high--;
      }
    }
    return nums[low];
  }

  const raw = [
    [[1, 3, 5]],
    [[2, 2, 2, 0, 1]],
    [[10]],
    [[3, 1, 3]],
    [[1, 1, 1, 1, 1]],
    [[3, 3, 1, 3]],
    [[1, 3, 3]],
    [[3, 3, 3, 3, 1, 3]],
    [[2, 2, 2, 2, 2, 2]],
    [[4, 5, 6, 7, 0, 1, 2]],
    [[10, 1, 10, 10, 10]],
    [[2, 0, 1, 1, 2]],
    [[-1, -1, -1, -5, -1]],
    [[-10, -5, 0, 5, 10]],
    [[0, 5, 10, -10, -5]],
    [[2, 2, 3, 1, 2]],
    [[1, 2, 0, 0, 1]],
    [[100, 100, 50, 100]],
    [[5, 6, 7, 8, 1, 2, 3, 4]],
    [[2, 2, 2, 2, 0, 2]]
  ];

  const tcs = raw.map(([nums], idx) => ({
    input: `${JSON.stringify(nums)}`,
    output: String(findMinII(nums)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 items all 5 except index 750 has 1
  const s21 = new Array(1000).fill(5);
  s21[750] = 1;
  tcs.push({ input: `${JSON.stringify(s21)}`, output: String(findMinII(s21)), is_hidden: true });

  // 22: 1000 items rotated at index 500
  const s22 = [];
  for (let i = 501; i <= 1000; i++) s22.push(i);
  for (let i = 1; i <= 500; i++) s22.push(i);
  tcs.push({ input: `${JSON.stringify(s22)}`, output: String(findMinII(s22)), is_hidden: true });

  // 23: 1000 items strictly decreasing step then flat
  const s23 = new Array(1000).fill(100);
  s23[999] = -50;
  tcs.push({ input: `${JSON.stringify(s23)}`, output: String(findMinII(s23)), is_hidden: true });

  // 24: 1000 items all 7 except index 0 is -10
  const s24 = new Array(1000).fill(7);
  s24[0] = -10;
  tcs.push({ input: `${JSON.stringify(s24)}`, output: String(findMinII(s24)), is_hidden: true });

  // 25: 1000 items all 0
  const s25 = new Array(1000).fill(0);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: String(findMinII(s25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. H-Index II (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateHIndexIICountTCs() {
  function hIndex(citations) {
    const n = citations.length;
    let low = 0, high = n - 1, ans = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (citations[mid] >= n - mid) {
        ans = n - mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[0, 1, 3, 5, 6]],
    [[1, 2, 100]],
    [[0]],
    [[100]],
    [[0, 0]],
    [[1, 1]],
    [[1, 2, 3, 4, 5]],
    [[0, 0, 4, 4]],
    [[11, 15]],
    [[0, 0, 0, 0]],
    [[1, 1, 1, 1, 1]],
    [[2, 2, 2, 2, 2]],
    [[0, 1, 2, 5, 6]],
    [[10, 20, 30, 40, 50]],
    [[0, 0, 1]],
    [[1, 4, 7, 9]],
    [[0, 2, 3, 4]],
    [[3, 3, 3, 3, 3]],
    [[1, 2, 3]],
    [[0, 1]]
  ];

  const tcs = raw.map(([citations], idx) => ({
    input: `${JSON.stringify(citations)}`,
    output: String(hIndex(citations)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 papers all with 1000 citations -> h = 1000
  const s21 = new Array(1000).fill(1000);
  tcs.push({ input: `${JSON.stringify(s21)}`, output: String(hIndex(s21)), is_hidden: true });

  // 22: 1000 papers all with 0 citations -> h = 0
  const s22 = new Array(1000).fill(0);
  tcs.push({ input: `${JSON.stringify(s22)}`, output: String(hIndex(s22)), is_hidden: true });

  // 23: 1000 papers 1..1000 -> h = 500
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23)}`, output: String(hIndex(s23)), is_hidden: true });

  // 24: 1000 papers with 500 zeros followed by 500 1000s -> h = 500
  const s24 = [...new Array(500).fill(0), ...new Array(500).fill(1000)];
  tcs.push({ input: `${JSON.stringify(s24)}`, output: String(hIndex(s24)), is_hidden: true });

  // 25: 1000 papers all with 10 citations -> h = 10
  const s25 = new Array(1000).fill(10);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: String(hIndex(s25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Heaters (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateHeatersCountTCs() {
  function findRadius(houses, heaters) {
    const hs = [...houses].sort((a, b) => a - b);
    const ht = [...heaters].sort((a, b) => a - b);
    let maxRadius = 0;
    for (const h of hs) {
      let l = 0, r = ht.length - 1;
      while (l <= r) {
        const m = Math.floor((l + r) / 2);
        if (ht[m] === h) { l = m; break; }
        if (ht[m] < h) l = m + 1;
        else r = m - 1;
      }
      const dist1 = l < ht.length ? Math.abs(ht[l] - h) : Infinity;
      const dist2 = l > 0 ? Math.abs(ht[l - 1] - h) : Infinity;
      const dist3 = r >= 0 && r < ht.length ? Math.abs(ht[r] - h) : Infinity;
      maxRadius = Math.max(maxRadius, Math.min(dist1, dist2, dist3));
    }
    return maxRadius;
  }

  const raw = [
    [[1, 2, 3], [2]],
    [[1, 2, 3, 4], [1, 4]],
    [[1, 5], [2]],
    [[1], [1]],
    [[1], [10]],
    [[1, 10], [5]],
    [[2, 4, 6], [1, 3, 5]],
    [[1, 2, 3, 5, 15], [2, 30]],
    [[10, 20, 30], [15, 25]],
    [[100], [100]],
    [[5, 10, 15], [1, 20]],
    [[1, 1000000000], [500000000]],
    [[2, 8, 4], [1, 5, 9]],
    [[1, 2, 3, 4, 5], [3]],
    [[1, 2, 3, 4, 5], [1, 5]],
    [[10, 20, 30, 40], [10, 40]],
    [[1, 3, 5, 7, 9], [2, 4, 6, 8]],
    [[10], [1, 20]],
    [[5, 15, 25], [10, 20]],
    [[100, 300, 500], [200, 400]]
  ];

  const tcs = raw.map(([houses, heaters], idx) => ({
    input: `${JSON.stringify(houses)}, ${JSON.stringify(heaters)}`,
    output: String(findRadius(houses, heaters)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 houses at 1..1000, 1 heater at 500 -> radius is 499
  const s21H = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s21H)}, [500]`, output: String(findRadius(s21H, [500])), is_hidden: true });

  // 22: 1000 houses at 1..1000, 2 heaters at 1 and 1000 -> radius is 500
  tcs.push({ input: `${JSON.stringify(s21H)}, [1, 1000]`, output: String(findRadius(s21H, [1, 1000])), is_hidden: true });

  // 23: 1000 houses at 1..1000, heaters at every 10th house -> radius is 5
  const s23Heaters = Array.from({ length: 100 }, (_, i) => i * 10 + 5);
  tcs.push({ input: `${JSON.stringify(s21H)}, ${JSON.stringify(s23Heaters)}`, output: String(findRadius(s21H, s23Heaters)), is_hidden: true });

  // 24: 1000 houses all at position 100, 1 heater at 150 -> radius 50
  const s24H = new Array(1000).fill(100);
  tcs.push({ input: `${JSON.stringify(s24H)}, [150]`, output: String(findRadius(s24H, [150])), is_hidden: true });

  // 25: 1000 houses at odd positions, 1000 heaters at even positions -> radius 1
  const s25H = Array.from({ length: 500 }, (_, i) => i * 2 + 1);
  const s25Heat = Array.from({ length: 500 }, (_, i) => (i + 1) * 2);
  tcs.push({ input: `${JSON.stringify(s25H)}, ${JSON.stringify(s25Heat)}`, output: String(findRadius(s25H, s25Heat)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Find Right Interval (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateFindRightIntervalCountTCs() {
  function findRightInterval(intervals) {
    const n = intervals.length;
    const starts = intervals.map((intv, idx) => ({ start: intv[0], idx })).sort((a, b) => a.start - b.start);
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
      const target = intervals[i][1];
      let l = 0, r = n - 1, ans = -1;
      while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (starts[mid].start >= target) {
          ans = starts[mid].idx;
          r = mid - 1;
        } else {
          l = mid + 1;
        }
      }
      result[i] = ans;
    }
    return result;
  }

  const raw = [
    [[[1, 2]]],
    [[[3, 4], [2, 3], [1, 2]]],
    [[[1, 4], [2, 3], [3, 4]]],
    [[[1, 1]]],
    [[[1, 2], [2, 3], [3, 4]]],
    [[[1, 10], [2, 5], [5, 8], [9, 12]]],
    [[[5, 6], [1, 2], [3, 4]]],
    [[[10, 20], [20, 30]]],
    [[[1, 3], [4, 6], [7, 9]]],
    [[[2, 3], [4, 5], [1, 2]]],
    [[[1, 5], [6, 10], [11, 15]]],
    [[[1, 100]]],
    [[[-10, -5], [-5, 0], [0, 5]]],
    [[[-20, -10], [-5, 5], [10, 20]]],
    [[[1, 2], [3, 5], [4, 6], [7, 8]]],
    [[[10, 15], [5, 9], [20, 25]]],
    [[[2, 4], [1, 2], [4, 6]]],
    [[[1, 6], [2, 3], [4, 5], [7, 8]]],
    [[[3, 5], [1, 2], [6, 7], [2, 3]]],
    [[[10, 11], [11, 12], [12, 13]]]
  ];

  const tcs = raw.map(([intervals], idx) => ({
    input: `${JSON.stringify(intervals)}`,
    output: JSON.stringify(findRightInterval(intervals)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 500 contiguous intervals [i, i+1] -> each has right interval i+1, except last has -1
  const s21 = Array.from({ length: 500 }, (_, i) => [i, i + 1]);
  tcs.push({ input: `${JSON.stringify(s21)}`, output: JSON.stringify(findRightInterval(s21)), is_hidden: true });

  // 22: 500 intervals [2*i, 2*i + 1] -> each has right interval i+1, except last has -1
  const s22 = Array.from({ length: 500 }, (_, i) => [2 * i, 2 * i + 1]);
  tcs.push({ input: `${JSON.stringify(s22)}`, output: JSON.stringify(findRightInterval(s22)), is_hidden: true });

  // 23: 500 reverse ordered intervals
  const s23 = Array.from({ length: 500 }, (_, i) => [500 - i, 500 - i + 1]);
  tcs.push({ input: `${JSON.stringify(s23)}`, output: JSON.stringify(findRightInterval(s23)), is_hidden: true });

  // 24: 500 overlapping intervals [i, 1000] -> all end at 1000, no interval starts >= 1000 -> all -1
  const s24 = Array.from({ length: 500 }, (_, i) => [i, 1000]);
  tcs.push({ input: `${JSON.stringify(s24)}`, output: JSON.stringify(findRightInterval(s24)), is_hidden: true });

  // 25: 500 single-point intervals [i, i] -> each right interval is itself
  const s25 = Array.from({ length: 500 }, (_, i) => [i, i]);
  tcs.push({ input: `${JSON.stringify(s25)}`, output: JSON.stringify(findRightInterval(s25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS (100% LeetCode Parity)
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Matrix Median',
    slug: 'matrix-median',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[[1, 3, 5], [2, 6, 9], [3, 6, 9]]',
    sample_output: '5',
    description: `Given a row-wise sorted matrix \`mat\` of size \`r x c\`, where \`r\` and \`c\` are always **odd integers**, find the **median** of the matrix.

The median of a collection of numbers is the middle value when the numbers are sorted in non-decreasing order.

### **Example 1:**
**Input:** mat = [[1, 3, 5], [2, 6, 9], [3, 6, 9]]
**Output:** 5
**Explanation:** Sorting all elements gives [1, 2, 3, 3, 5, 6, 6, 9, 9]. The median is the 5th element, which is 5.

### **Example 2:**
**Input:** mat = [[1, 3, 4], [2, 5, 6], [7, 8, 9]]
**Output:** 5

### **Constraints:**
- \`r == mat.length\`
- \`c == mat[i].length\`
- \`1 <= r, c <= 1000\`
- \`r * c\` is odd.
- \`1 <= mat[i][j] <= 2000\`
- Each row of \`mat\` is sorted in non-decreasing order.`,
    hints: [
      'The median element will have at least (r * c + 1) / 2 elements smaller than or equal to it in the matrix.',
      'Binary search over the value range [min_element, max_element].',
      'For a candidate mid, count how many elements across all rows are <= mid using binary search (upper bound) on each row.'
    ],
    testCases: generateMatrixMedianTCs(),
    solutionCode: `
function solution(mat) {
  const r = mat.length, c = mat[0].length;
  let min = mat[0][0], max = mat[0][c - 1];
  for (let i = 1; i < r; i++) {
    min = Math.min(min, mat[i][0]);
    max = Math.max(max, mat[i][c - 1]);
  }
  const desired = Math.floor((r * c + 1) / 2);
  let low = min, high = max;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let count = 0;
    for (let i = 0; i < r; i++) {
      let l = 0, h = c - 1, ub = c;
      while (l <= h) {
        const m = Math.floor((l + h) / 2);
        if (mat[i][m] > mid) {
          ub = m;
          h = m - 1;
        } else {
          l = m + 1;
        }
      }
      count += ub;
    }
    if (count < desired) low = mid + 1;
    else high = mid - 1;
  }
  return low;
}
`
  },
  {
    title: 'Find Minimum in Rotated Sorted Array II',
    slug: 'find-minimum-in-rotated-sorted-array-ii',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[2, 2, 2, 0, 1]',
    sample_output: '0',
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times. For example, the array \`nums = [0,1,4,4,5,6,7]\` might become:
- \`[4,5,6,7,0,1,4]\` if it was rotated 4 times.
- \`[0,1,4,4,5,6,7]\` if it was rotated 7 times.

Notice that rotating an array \`[a[0], a[1], a[2], ..., a[n-1]]\` 1 time results in the array \`[a[n-1], a[0], a[1], a[2], ..., a[n-2]]\`.

Given the sorted rotated array \`nums\` that may contain **duplicates**, return *the minimum element of this array*.

You must decrease the overall operation steps as much as possible.

### **Example 1:**
**Input:** nums = [1,3,5]
**Output:** 1

### **Example 2:**
**Input:** nums = [2,2,2,0,1]
**Output:** 0

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 5000\`
- \`-5000 <= nums[i] <= 5000\`
- \`nums\` is sorted and rotated between \`1\` and \`n\` times.`,
    hints: [
      'Compare nums[mid] with nums[high].',
      'If nums[mid] > nums[high], the minimum must be in the right half (low = mid + 1).',
      'If nums[mid] < nums[high], the minimum is in the left half (high = mid).',
      'If nums[mid] == nums[high], we cannot be sure, so safely decrement high (high--).'
    ],
    testCases: generateFindMinRotatedIICountTCs(),
    solutionCode: `
function solution(nums) {
  let low = 0, high = nums.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] > nums[high]) {
      low = mid + 1;
    } else if (nums[mid] < nums[high]) {
      high = mid;
    } else {
      high--;
    }
  }
  return nums[low];
}
`
  },
  {
    title: 'H-Index II',
    slug: 'h-index-ii',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[0, 1, 3, 5, 6]',
    sample_output: '3',
    description: `Given an array of integers \`citations\` where \`citations[i]\` is the number of citations a researcher received for their \`i\`th paper and \`citations\` is sorted in **ascending order**, return *the researcher's h-index*.

According to the definition of h-index: A scientist has an index \`h\` if \`h\` of their \`n\` papers have at least \`h\` citations each, and the other \`n - h\` papers have no more than \`h\` citations each.

If there are several possible values for \`h\`, the maximum one is taken as the h-index.

You must write an algorithm that runs in \`O(log n)\` time.

### **Example 1:**
**Input:** citations = [0,1,3,5,6]
**Output:** 3
**Explanation:** [0,1,3,5,6] means the researcher has 5 papers in total and each of them had received 0, 1, 3, 5, 6 citations respectively.
Since the research has 3 papers with at least 3 citations each and the remaining two with no more than 3 citations each, their h-index is 3.

### **Example 2:**
**Input:** citations = [1,2,100]
**Output:** 2

### **Constraints:**
- \`n == citations.length\`
- \`1 <= n <= 10⁵\`
- \`0 <= citations[i] <= 1000\`
- \`citations\` is sorted in ascending order.`,
    hints: [
      'At index mid, there are n - mid papers with citation >= citations[mid].',
      'If citations[mid] >= n - mid, this could be a valid h-index, try searching left for a larger n - mid.',
      'Otherwise search right.'
    ],
    testCases: generateHIndexIICountTCs(),
    solutionCode: `
function solution(citations) {
  const n = citations.length;
  let low = 0, high = n - 1, ans = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (citations[mid] >= n - mid) {
      ans = n - mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return ans;
}
`
  },
  {
    title: 'Heaters',
    slug: 'heaters',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[1, 2, 3], [2]',
    sample_output: '1',
    description: `Winter is coming! During the contest, your first job is to design a standard horizontal radius of heaters before winter comes.

Every house can be warmed, as long as the house is situated within the heater's warm radius range. 

Given the positions of \`houses\` and \`heaters\` on a horizontal line, return *the minimum radius range of heaters needed so that all houses are covered by at least one heater*.

**Note:** All the \`heaters\` will follow your radius standard and the warm radius will be the same.

### **Example 1:**
**Input:** houses = [1,2,3], heaters = [2]
**Output:** 1
**Explanation:** The only heater was placed in the position 2, and if we use the radius 1 standard, then all the houses can be warmed.

### **Example 2:**
**Input:** houses = [1,2,3,4], heaters = [1,4]
**Output:** 1
**Explanation:** The two heaters were placed at positions 1 and 4. We need radius 1 standard to warm houses 2 and 3.

### **Example 3:**
**Input:** houses = [1,5], heaters = [2]
**Output:** 3

### **Constraints:**
- \`1 <= houses.length, heaters.length <= 3 * 10⁴\`
- \`1 <= houses[i], heaters[i] <= 10⁹\``,
    hints: [
      'Sort the heaters array.',
      'For each house, use binary search to find the closest heater to its left and right.',
      'The minimum radius needed for that house is the distance to the closest heater. The answer is the maximum over all houses.'
    ],
    testCases: generateHeatersCountTCs(),
    solutionCode: `
function solution(houses, heaters) {
  const hs = [...houses].sort((a, b) => a - b);
  const ht = [...heaters].sort((a, b) => a - b);
  let maxRadius = 0;
  for (const h of hs) {
    let l = 0, r = ht.length - 1;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      if (ht[m] === h) { l = m; break; }
      if (ht[m] < h) l = m + 1;
      else r = m - 1;
    }
    const dist1 = l < ht.length ? Math.abs(ht[l] - h) : Infinity;
    const dist2 = l > 0 ? Math.abs(ht[l - 1] - h) : Infinity;
    const dist3 = r >= 0 && r < ht.length ? Math.abs(ht[r] - h) : Infinity;
    maxRadius = Math.max(maxRadius, Math.min(dist1, dist2, dist3));
  }
  return maxRadius;
}
`
  },
  {
    title: 'Find Right Interval',
    slug: 'find-right-interval',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[[3, 4], [2, 3], [1, 2]]',
    sample_output: '[-1, 0, 1]',
    description: `You are given an array of \`intervals\`, where \`intervals[i] = [start_i, end_i]\` and each \`start_i\` is **unique**.

The **right interval** for an interval \`i\` is an interval \`j\` such that \`start_j >= end_i\` and \`start_j\` is **minimized**. Note that \`i\` can equal \`j\`.

Return *an array of right interval indices for each interval \`i\`*. If no right interval exists for interval \`i\`, then put \`-1\` at index \`i\`.

### **Example 1:**
**Input:** intervals = [[1,2]]
**Output:** [-1]
**Explanation:** There is only one interval in the collection, so it cannot have a right interval.

### **Example 2:**
**Input:** intervals = [[3,4],[2,3],[1,2]]
**Output:** [-1,0,1]
**Explanation:** There is no right interval for [3,4].
The right interval for [2,3] is [3,4] since start_0 = 3 is the smallest start >= 3.
The right interval for [1,2] is [2,3] since start_1 = 2 is the smallest start >= 2.

### **Example 3:**
**Input:** intervals = [[1,4],[2,3],[3,4]]
**Output:** [-1,2,-1]

### **Constraints:**
- \`1 <= intervals.length <= 2 * 10⁴\`
- \`intervals[i].length == 2\`
- \`-10⁶ <= start_i <= end_i <= 10⁶\`
- The start point of each interval is **unique**.`,
    hints: [
      'Store each interval start along with its original index.',
      'Sort the stored start points.',
      'For each interval, binary search for the smallest start point that is >= end point.'
    ],
    testCases: generateFindRightIntervalCountTCs(),
    solutionCode: `
function solution(intervals) {
  const n = intervals.length;
  const starts = intervals.map((intv, idx) => ({ start: intv[0], idx })).sort((a, b) => a.start - b.start);
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const target = intervals[i][1];
    let l = 0, r = n - 1, ans = -1;
    while (l <= r) {
      const mid = Math.floor((l + r) / 2);
      if (starts[mid].start >= target) {
        ans = starts[mid].idx;
        r = mid - 1;
      } else {
        l = mid + 1;
      }
    }
    result[i] = ans;
  }
  return result;
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 7 (5 Problems)...');

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

