/**
 * backend/scripts/seed_striver_bs_batch5_25tc.js
 * Seeds and validates the next 5 Striver A2Z Binary Search problems (Step 4.2: BS on Answers)
 * Each problem gets exactly 25 curated test cases with 100% judge pass.
 *
 * Problems:
 * 1. Aggressive Cows (aggressive-cows)
 * 2. Book Allocation Problem (book-allocation-problem)
 * 3. Split Array Largest Sum (split-array-largest-sum)
 * 4. Painter's Partition Problem (painter-s-partition-problem)
 * 5. Kth Element of Two Sorted Arrays (kth-element-of-two-sorted-arrays)
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });
const { evaluateSubmission } = require('../services/judge');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Aggressive Cows (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateAggressiveCowsTCs() {
  function aggressiveCows(stalls, k) {
    const s = [...stalls].sort((a, b) => a - b);
    let low = 1, high = s[s.length - 1] - s[0];
    let ans = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let count = 1, last = s[0];
      for (let i = 1; i < s.length; i++) {
        if (s[i] - last >= mid) {
          count++;
          last = s[i];
        }
      }
      if (count >= k) {
        ans = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return ans;
  }

  const raw = [
    [[0, 3, 4, 7, 10, 9], 4],
    [[1, 2, 8, 4, 9], 3],
    [[4, 2, 1, 3, 6], 2],
    [[1, 2], 2],
    [[1, 100], 2],
    [[1, 2, 3], 2],
    [[1, 2, 3], 3],
    [[10, 20, 30, 40, 50], 5],
    [[10, 20, 30, 40, 50], 2],
    [[10, 20, 30, 40, 50], 3],
    [[2, 14, 8, 20, 32], 3],
    [[5, 17, 100, 11], 2],
    [[1, 5, 9, 13, 17], 5],
    [[1, 5, 9, 13, 17], 3],
    [[1, 10, 20, 100, 1000], 3],
    [[1, 10, 20, 100, 1000], 4],
    [[50, 100, 150, 200], 2],
    [[1, 1000000000], 2],
    [[1, 500000000, 1000000000], 3],
    [[3, 6, 9, 12, 15, 18], 4]
  ];

  const tcs = raw.map(([stalls, k], idx) => ({
    input: `${JSON.stringify(stalls)}, ${k}`,
    output: String(aggressiveCows(stalls, k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 stalls evenly spaced by 5, k = 500
  const s21 = Array.from({ length: 1000 }, (_, i) => i * 5);
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: String(aggressiveCows(s21, 500)), is_hidden: true });

  // 22: 1000 stalls evenly spaced by 10, k = 1000
  const s22 = Array.from({ length: 1000 }, (_, i) => (i + 1) * 10);
  tcs.push({ input: `${JSON.stringify(s22)}, 1000`, output: String(aggressiveCows(s22, 1000)), is_hidden: true });

  // 23: 1000 stalls 1..1000, k = 2
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23)}, 2`, output: String(aggressiveCows(s23, 2)), is_hidden: true });

  // 24: 1000 stalls 1..1000, k = 10
  tcs.push({ input: `${JSON.stringify(s23)}, 10`, output: String(aggressiveCows(s23, 10)), is_hidden: true });

  // 25: 1000 stalls 1..1000, k = 100
  tcs.push({ input: `${JSON.stringify(s23)}, 100`, output: String(aggressiveCows(s23, 100)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Book Allocation Problem (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateBookAllocationTCs() {
  function allocateBooks(arr, m) {
    if (m > arr.length) return -1;
    let low = Math.max(...arr), high = arr.reduce((a, b) => a + b, 0);
    let ans = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let students = 1, pages = 0;
      for (const p of arr) {
        if (pages + p > mid) {
          students++;
          pages = p;
        } else {
          pages += p;
        }
      }
      if (students <= m) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[12, 34, 67, 90], 2],
    [[25, 46, 28, 49, 24], 4],
    [[10, 20, 30, 40], 2],
    [[10, 20, 30], 4], // m > arr.length -> -1
    [[10], 1],
    [[10], 2], // -1
    [[100, 200, 300], 1],
    [[100, 200, 300], 3],
    [[5, 5, 5, 5], 2],
    [[5, 5, 5, 5], 4],
    [[15, 17, 20], 2],
    [[12, 34, 67, 90], 1],
    [[12, 34, 67, 90], 4],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9], 3],
    [[1, 2, 3, 4, 5, 6, 7, 8, 9], 5],
    [[50, 50, 50, 50, 50, 50], 3],
    [[20, 10, 30, 50, 40], 2],
    [[20, 10, 30, 50, 40], 3],
    [[100, 100, 100, 100, 100], 5],
    [[10, 10, 10, 10, 10], 1]
  ];

  const tcs = raw.map(([arr, m], idx) => ({
    input: `${JSON.stringify(arr)}, ${m}`,
    output: String(allocateBooks(arr, m)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 books with 10 pages each, m = 100 -> 100
  const s21 = new Array(1000).fill(10);
  tcs.push({ input: `${JSON.stringify(s21)}, 100`, output: String(allocateBooks(s21, 100)), is_hidden: true });

  // 22: 1000 books with 10 pages each, m = 500 -> 20
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: String(allocateBooks(s21, 500)), is_hidden: true });

  // 23: 1000 books 1..1000 pages, m = 10
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23)}, 10`, output: String(allocateBooks(s23, 10)), is_hidden: true });

  // 24: 1000 books 1..1000 pages, m = 100
  tcs.push({ input: `${JSON.stringify(s23)}, 100`, output: String(allocateBooks(s23, 100)), is_hidden: true });

  // 25: 1000 books 1..1000 pages, m = 500
  tcs.push({ input: `${JSON.stringify(s23)}, 500`, output: String(allocateBooks(s23, 500)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Split Array Largest Sum (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSplitArrayTCs() {
  function splitArray(nums, k) {
    let low = Math.max(...nums), high = nums.reduce((a, b) => a + b, 0);
    let ans = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let parts = 1, sum = 0;
      for (const x of nums) {
        if (sum + x > mid) {
          parts++;
          sum = x;
        } else {
          sum += x;
        }
      }
      if (parts <= k) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[7,2,5,10,8], 2],
    [[1,2,3,4,5], 2],
    [[1,4,4], 3],
    [[10], 1],
    [[1, 2, 3, 4, 5], 1],
    [[1, 2, 3, 4, 5], 5],
    [[10, 20, 30, 40], 2],
    [[10, 20, 30, 40], 3],
    [[5, 5, 5, 5], 2],
    [[2, 3, 1, 2, 4, 3], 5],
    [[1, 100, 1], 2],
    [[1, 100, 1], 3],
    [[10, 10, 10, 10, 10], 3],
    [[100, 200, 300, 400], 2],
    [[2, 1, 5, 1, 2, 2, 2], 3],
    [[1, 2, 1, 2, 1, 2], 2],
    [[1, 2, 1, 2, 1, 2], 3],
    [[9, 1, 8, 2, 7, 3], 3],
    [[9, 1, 8, 2, 7, 3], 2],
    [[100, 100, 100], 1]
  ];

  const tcs = raw.map(([nums, k], idx) => ({
    input: `${JSON.stringify(nums)}, ${k}`,
    output: String(splitArray(nums, k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 items with value 5, k = 100 -> 50
  const s21 = new Array(1000).fill(5);
  tcs.push({ input: `${JSON.stringify(s21)}, 100`, output: String(splitArray(s21, 100)), is_hidden: true });

  // 22: 1000 items with value 5, k = 500 -> 10
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: String(splitArray(s21, 500)), is_hidden: true });

  // 23: 1000 items 1..1000, k = 10
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23)}, 10`, output: String(splitArray(s23, 10)), is_hidden: true });

  // 24: 1000 items 1..1000, k = 50
  tcs.push({ input: `${JSON.stringify(s23)}, 50`, output: String(splitArray(s23, 50)), is_hidden: true });

  // 25: 1000 items 1..1000, k = 200
  tcs.push({ input: `${JSON.stringify(s23)}, 200`, output: String(splitArray(s23, 200)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Painter's Partition Problem (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generatePaintersPartitionTCs() {
  function paint(boards, k) {
    let low = Math.max(...boards), high = boards.reduce((a, b) => a + b, 0);
    let ans = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let painters = 1, current = 0;
      for (const b of boards) {
        if (current + b > mid) {
          painters++;
          current = b;
        } else {
          current += b;
        }
      }
      if (painters <= k) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[10, 20, 30, 40], 2],
    [[5, 5, 5, 5], 2],
    [[10, 10, 10, 10], 4],
    [[100], 1],
    [[10, 20, 30], 1],
    [[10, 20, 30], 3],
    [[1, 8, 11, 3], 10],
    [[1, 8, 11, 3], 2],
    [[5, 10, 30, 20, 15], 3],
    [[5, 10, 30, 20, 15], 2],
    [[40, 30, 20, 10], 2],
    [[2, 1, 5, 6, 2, 3], 2],
    [[2, 1, 5, 6, 2, 3], 3],
    [[15, 17, 20], 2],
    [[25, 46, 28, 49, 24], 4],
    [[100, 200, 300, 400], 2],
    [[100, 200, 300, 400], 3],
    [[10, 10, 10, 10, 10, 10], 2],
    [[10, 10, 10, 10, 10, 10], 3],
    [[50, 100, 150], 2]
  ];

  const tcs = raw.map(([boards, k], idx) => ({
    input: `${JSON.stringify(boards)}, ${k}`,
    output: String(paint(boards, k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 boards of length 20, k = 100
  const s21 = new Array(1000).fill(20);
  tcs.push({ input: `${JSON.stringify(s21)}, 100`, output: String(paint(s21, 100)), is_hidden: true });

  // 22: 1000 boards of length 20, k = 500
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: String(paint(s21, 500)), is_hidden: true });

  // 23: 1000 boards 1..1000, k = 15
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23)}, 15`, output: String(paint(s23, 15)), is_hidden: true });

  // 24: 1000 boards 1..1000, k = 75
  tcs.push({ input: `${JSON.stringify(s23)}, 75`, output: String(paint(s23, 75)), is_hidden: true });

  // 25: 1000 boards 1..1000, k = 250
  tcs.push({ input: `${JSON.stringify(s23)}, 250`, output: String(paint(s23, 250)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Kth Element of Two Sorted Arrays (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateKthElementTCs() {
  function kthElement(nums1, nums2, k) {
    if (nums1.length > nums2.length) return kthElement(nums2, nums1, k);
    const n = nums1.length, m = nums2.length;
    let low = Math.max(0, k - m), high = Math.min(k, n);
    while (low <= high) {
      const cut1 = Math.floor((low + high) / 2);
      const cut2 = k - cut1;
      const l1 = cut1 === 0 ? -Infinity : nums1[cut1 - 1];
      const l2 = cut2 === 0 ? -Infinity : nums2[cut2 - 1];
      const r1 = cut1 === n ? Infinity : nums1[cut1];
      const r2 = cut2 === m ? Infinity : nums2[cut2];
      if (l1 <= r2 && l2 <= r1) {
        return Math.max(l1, l2);
      } else if (l1 > r2) {
        high = cut1 - 1;
      } else {
        low = cut1 + 1;
      }
    }
    return -1;
  }

  const raw = [
    [[2, 3, 6, 7, 9], [1, 4, 8, 10], 5],
    [[100, 112, 256, 349, 770], [72, 86, 113, 119, 265, 445, 892], 7],
    [[1, 3], [2], 2],
    [[1], [2], 1],
    [[1], [2], 2],
    [[], [1, 2, 3, 4, 5], 3],
    [[1, 2, 3, 4, 5], [], 1],
    [[1, 2, 3, 4, 5], [], 5],
    [[2, 4, 6], [1, 3, 5], 1],
    [[2, 4, 6], [1, 3, 5], 6],
    [[2, 4, 6], [1, 3, 5], 3],
    [[10, 20, 30], [5, 15, 25, 35], 4],
    [[1, 2], [3, 4], 3],
    [[5, 8, 9], [4, 7, 8], 4],
    [[2, 3, 4], [1, 3, 5], 1],
    [[2, 3, 4], [1, 3, 5], 6],
    [[1, 1, 1], [1, 1, 1], 3],
    [[10, 100], [20, 200, 300], 3],
    [[1, 2, 3, 4, 5, 6, 7], [8, 9, 10], 5],
    [[1, 2, 3, 4, 5, 6, 7], [8, 9, 10], 10]
  ];

  const tcs = raw.map(([nums1, nums2, k], idx) => ({
    input: `${JSON.stringify(nums1)}, ${JSON.stringify(nums2)}, ${k}`,
    output: String(kthElement(nums1, nums2, k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 500 even numbers + 500 odd numbers, k = 500
  const evens = Array.from({ length: 500 }, (_, i) => (i + 1) * 2);
  const odds = Array.from({ length: 500 }, (_, i) => i * 2 + 1);
  tcs.push({ input: `${JSON.stringify(evens)}, ${JSON.stringify(odds)}, 500`, output: String(kthElement(evens, odds, 500)), is_hidden: true });

  // 22: 500 even numbers + 500 odd numbers, k = 1000
  tcs.push({ input: `${JSON.stringify(evens)}, ${JSON.stringify(odds)}, 1000`, output: String(kthElement(evens, odds, 1000)), is_hidden: true });

  // 23: 500 even numbers + 500 odd numbers, k = 1
  tcs.push({ input: `${JSON.stringify(evens)}, ${JSON.stringify(odds)}, 1`, output: String(kthElement(evens, odds, 1)), is_hidden: true });

  // 24: 1000 numbers 1..1000 + empty, k = 750
  const s24 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s24)}, [], 750`, output: String(kthElement(s24, [], 750)), is_hidden: true });

  // 25: 500 numbers 1..500 + 500 numbers 501..1000, k = 600
  const s25A = Array.from({ length: 500 }, (_, i) => i + 1);
  const s25B = Array.from({ length: 500 }, (_, i) => i + 501);
  tcs.push({ input: `${JSON.stringify(s25A)}, ${JSON.stringify(s25B)}, 600`, output: String(kthElement(s25A, s25B, 600)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Aggressive Cows',
    slug: 'aggressive-cows',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[0, 3, 4, 7, 10, 9], 4',
    sample_output: '3',
    description: `You are given an array \`stalls\` of integers where \`stalls[i]\` denotes the position of the \`i\`th stall. You are also given an integer \`k\` which denotes the number of aggressive cows.

Assign stalls to \`k\` cows such that the **minimum distance** between any two of them is the **maximum possible**.

Return the maximum possible minimum distance between cows.

### **Example 1:**
**Input:** stalls = [0, 3, 4, 7, 10, 9], k = 4
**Output:** 3
**Explanation:** The sorted stalls positions are [0, 3, 4, 7, 9, 10].
We can place 4 cows at stalls [0, 3, 7, 10] with minimum distance 3.

### **Example 2:**
**Input:** stalls = [1, 2, 8, 4, 9], k = 3
**Output:** 3
**Explanation:** Stalls are at [1, 2, 4, 8, 9]. We can place 3 cows at [1, 4, 8] or [1, 4, 9]. The minimum distance is 3.

### **Example 3:**
**Input:** stalls = [4, 2, 1, 3, 6], k = 2
**Output:** 5
**Explanation:** Stalls sorted: [1, 2, 3, 4, 6]. We can place 2 cows at 1 and 6, distance is 5.

### **Constraints:**
- \`2 <= stalls.length <= 10⁵\`
- \`0 <= stalls[i] <= 10⁹\`
- \`2 <= k <= stalls.length\``,
    hints: [
      'Sort the stalls array first.',
      'Binary search on the answer: min possible distance is 1, max is stalls[last] - stalls[0].',
      'For mid, greedily place cows from left to right whenever the distance from the previous placed cow is >= mid.'
    ],
    testCases: generateAggressiveCowsTCs(),
    solutionCode: `
function solution(stalls, k) {
  stalls.sort((a, b) => a - b);
  let low = 1, high = stalls[stalls.length - 1] - stalls[0];
  let ans = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let count = 1, last = stalls[0];
    for (let i = 1; i < stalls.length; i++) {
      if (stalls[i] - last >= mid) {
        count++;
        last = stalls[i];
      }
    }
    if (count >= k) {
      ans = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return ans;
}
`
  },
  {
    title: 'Book Allocation Problem',
    slug: 'book-allocation-problem',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[12, 34, 67, 90], 2',
    sample_output: '113',
    description: `Given an array \`arr\` of integers where \`arr[i]\` denotes the number of pages in the \`i\`th book, and an integer \`m\` denoting the number of students.

Allocate books such that:
1. Each student gets **at least one** book.
2. Each book should be allocated to **only one** student.
3. Book allocation should be in a **contiguous** manner.

Allocate books to \`m\` students such that the **maximum number of pages allocated to a student is minimum**.
If it is not possible to allocate books (e.g. \`m > arr.length\`), return \`-1\`.

### **Example 1:**
**Input:** arr = [12, 34, 67, 90], m = 2
**Output:** 113
**Explanation:** 
Possible allocations:
- Student 1: [12], Student 2: [34, 67, 90] -> max pages = 191
- Student 1: [12, 34], Student 2: [67, 90] -> max pages = 157
- Student 1: [12, 34, 67], Student 2: [90] -> max pages = 113
The minimum of maximum pages is 113.

### **Example 2:**
**Input:** arr = [25, 46, 28, 49, 24], m = 4
**Output:** 71

### **Constraints:**
- \`1 <= arr.length <= 10⁵\`
- \`1 <= arr[i] <= 10⁹\`
- \`1 <= m <= 10⁵\``,
    hints: [
      'If m > arr.length, return -1 as every student must get at least one book.',
      'Binary search range: low = max(arr), high = sum(arr).',
      'For candidate mid, count how many students are needed. If students <= m, try smaller max pages.'
    ],
    testCases: generateBookAllocationTCs(),
    solutionCode: `
function solution(arr, m) {
  if (m > arr.length) return -1;
  let low = Math.max(...arr), high = arr.reduce((a, b) => a + b, 0);
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let students = 1, pages = 0;
    for (const p of arr) {
      if (pages + p > mid) {
        students++;
        pages = p;
      } else {
        pages += p;
      }
    }
    if (students <= m) {
      ans = mid;
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
    title: 'Split Array Largest Sum',
    slug: 'split-array-largest-sum',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[7,2,5,10,8], 2',
    sample_output: '18',
    description: `Given an integer array \`nums\` and an integer \`k\`, split \`nums\` into \`k\` non-empty subarrays such that the largest sum of any subarray is **minimized**.

Return *the minimized largest sum of the split*.

A **subarray** is a contiguous part of the array.

### **Example 1:**
**Input:** nums = [7,2,5,10,8], k = 2
**Output:** 18
**Explanation:** There are four ways to split nums into two subarrays:
- [7] and [2,5,10,8], where the largest sum among the two subarrays is 25.
- [7,2] and [5,10,8], where the largest sum among the two subarrays is 23.
- [7,2,5] and [10,8], where the largest sum among the two subarrays is 18.
- [7,2,5,10] and [8], where the largest sum among the two subarrays is 24.
The best way is to split it into [7,2,5] and [10,8], where the largest sum is 18.

### **Example 2:**
**Input:** nums = [1,2,3,4,5], k = 2
**Output:** 9
**Explanation:** The best split is [1,2,3] and [4,5], where the largest sum is 9.

### **Constraints:**
- \`1 <= nums.length <= 1000\`
- \`0 <= nums[i] <= 10⁶\`
- \`1 <= k <= min(50, nums.length)\``,
    hints: [
      'Binary search range: min answer is max(nums), max answer is sum(nums).',
      'For mid, greedily count how many subarrays are needed so that no subarray sum exceeds mid.',
      'If subarrays <= k, search lower half (high = mid - 1).'
    ],
    testCases: generateSplitArrayTCs(),
    solutionCode: `
function solution(nums, k) {
  let low = Math.max(...nums), high = nums.reduce((a, b) => a + b, 0);
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let parts = 1, sum = 0;
    for (const x of nums) {
      if (sum + x > mid) {
        parts++;
        sum = x;
      } else {
        sum += x;
      }
    }
    if (parts <= k) {
      ans = mid;
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
    title: "Painter's Partition Problem",
    slug: 'painter-s-partition-problem',
    topic: 'binary-search',
    difficulty: 'hard',
    sample_input: '[10, 20, 30, 40], 2',
    sample_output: '60',
    description: `Given an array \`boards\` where each element represents the length of each board, and an integer \`k\` representing the number of painters.

Each painter takes 1 unit of time to paint 1 unit of board. A painter can only paint **contiguous** sections of boards.

Find the **minimum time** required to paint all boards with \`k\` painters.

### **Example 1:**
**Input:** boards = [10, 20, 30, 40], k = 2
**Output:** 60
**Explanation:** 
Painter 1 can paint boards [10, 20, 30] in 60 units of time.
Painter 2 can paint boards [40] in 40 units of time.
The total time required is max(60, 40) = 60.

### **Example 2:**
**Input:** boards = [5, 5, 5, 5], k = 2
**Output:** 10
**Explanation:** Both painters paint 2 boards each (time = 10).

### **Constraints:**
- \`1 <= boards.length <= 10⁵\`
- \`1 <= boards[i] <= 10⁵\`
- \`1 <= k <= boards.length\``,
    hints: [
      'This problem is mathematically identical to the Book Allocation Problem / Split Array Largest Sum.',
      'Binary search range: low = max(boards), high = sum(boards).',
      'For mid, greedily find how many painters are needed. If painters <= k, adjust high = mid - 1.'
    ],
    testCases: generatePaintersPartitionTCs(),
    solutionCode: `
function solution(boards, k) {
  let low = Math.max(...boards), high = boards.reduce((a, b) => a + b, 0);
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let painters = 1, current = 0;
    for (const b of boards) {
      if (current + b > mid) {
        painters++;
        current = b;
      } else {
        current += b;
      }
    }
    if (painters <= k) {
      ans = mid;
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
    title: 'Kth Element of Two Sorted Arrays',
    slug: 'kth-element-of-two-sorted-arrays',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[2, 3, 6, 7, 9], [1, 4, 8, 10], 5',
    sample_output: '6',
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of sizes \`m\` and \`n\` respectively, and an element \`k\`.

Find the element that would be at the \`k\`th position of the final combined sorted array.

You must write an algorithm that runs in \`O(log(min(m, n)))\` time complexity.

### **Example 1:**
**Input:** nums1 = [2, 3, 6, 7, 9], nums2 = [1, 4, 8, 10], k = 5
**Output:** 6
**Explanation:** The final sorted array would be [1, 2, 3, 4, 6, 7, 8, 9, 10]. The 5th element of this array is 6.

### **Example 2:**
**Input:** nums1 = [100, 112, 256, 349, 770], nums2 = [72, 86, 113, 119, 265, 445, 892], k = 7
**Output:** 256
**Explanation:** The 7th element in the combined sorted order is 256.

### **Constraints:**
- \`0 <= nums1.length, nums2.length <= 1000\`
- \`1 <= nums1.length + nums2.length <= 2000\`
- \`1 <= k <= nums1.length + nums2.length\`
- \`-10⁹ <= nums1[i], nums2[i] <= 10⁹\``,
    hints: [
      'Ensure binary search runs on the smaller array by swapping if nums1.length > nums2.length.',
      'Binary search range for cut1: low = max(0, k - m), high = min(k, n).',
      'Partition both arrays into cut1 and cut2 = k - cut1 elements such that max(left1, left2) <= min(right1, right2).'
    ],
    testCases: generateKthElementTCs(),
    solutionCode: `
function solution(nums1, nums2, k) {
  if (nums1.length > nums2.length) return solution(nums2, nums1, k);
  const n = nums1.length, m = nums2.length;
  let low = Math.max(0, k - m), high = Math.min(k, n);
  while (low <= high) {
    const cut1 = Math.floor((low + high) / 2);
    const cut2 = k - cut1;
    const l1 = cut1 === 0 ? -Infinity : nums1[cut1 - 1];
    const l2 = cut2 === 0 ? -Infinity : nums2[cut2 - 1];
    const r1 = cut1 === n ? Infinity : nums1[cut1];
    const r2 = cut2 === m ? Infinity : nums2[cut2];
    if (l1 <= r2 && l2 <= r1) {
      return Math.max(l1, l2);
    } else if (l1 > r2) {
      high = cut1 - 1;
    } else {
      low = cut1 + 1;
    }
  }
  return -1;
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 5 (5 Problems)...');

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

