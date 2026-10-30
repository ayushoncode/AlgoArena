/**
 * backend/scripts/seed_striver_bs_batch4_25tc.js
 * Seeds and validates the next 5 Striver A2Z Binary Search problems (Step 4.2: BS on Answers)
 * Each problem gets exactly 25 curated test cases with 100% judge pass.
 *
 * Problems:
 * 1. Find Nth Root of M (nth-root-of-an-integer)
 * 2. Minimum Number of Days to Make m Bouquets (minimum-number-of-days-to-make-m-bouquets)
 * 3. Find the Smallest Divisor Given a Threshold (find-the-smallest-divisor-given-a-threshold)
 * 4. Capacity To Ship Packages Within D Days (capacity-to-ship-packages-within-d-days)
 * 5. Kth Missing Positive Number (kth-missing-positive-number)
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });
const { evaluateSubmission } = require('../services/judge');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Find Nth Root of M (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateNthRootTCs() {
  function nthRoot(n, m) {
    let low = 1, high = m;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let val = 1;
      let overflow = false;
      for (let i = 0; i < n; i++) {
        val *= mid;
        if (val > m) { overflow = true; break; }
      }
      if (!overflow && val === m) return mid;
      if (overflow || val > m) high = mid - 1;
      else low = mid + 1;
    }
    return -1;
  }

  const raw = [
    [3, 27],
    [4, 69],
    [2, 16],
    [1, 14],
    [1, 1],
    [5, 1],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [3, 8],
    [3, 9],
    [3, 125],
    [4, 16],
    [4, 81],
    [5, 32],
    [5, 243],
    [6, 64],
    [10, 1024],
    [9, 19683],
    [30, 1073741824],
    [30, 1073741823],
    [2, 1000000000],
    [3, 1000000000]
  ];

  return raw.map(([n, m], idx) => ({
    input: `${n}, ${m}`,
    output: String(nthRoot(n, m)),
    is_hidden: idx >= 3
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Minimum Number of Days to Make m Bouquets (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateBouquetsTCs() {
  function minDaysBouquets(bloomDay, m, k) {
    if (m * k > bloomDay.length) return -1;
    let low = Math.min(...bloomDay), high = Math.max(...bloomDay);
    let ans = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let bouquets = 0, count = 0;
      for (let i = 0; i < bloomDay.length; i++) {
        if (bloomDay[i] <= mid) {
          count++;
          if (count === k) {
            bouquets++;
            count = 0;
          }
        } else {
          count = 0;
        }
      }
      if (bouquets >= m) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[1,10,3,10,2], 3, 1],
    [[1,10,3,10,2], 3, 2],
    [[7,7,7,7,12,7,7], 2, 3],
    [[1,2,3], 2, 2],
    [[5], 2, 1],
    [[100], 1, 1],
    [[1, 2], 1, 2],
    [[2, 1], 1, 2],
    [[1, 2], 2, 1],
    [[5, 5, 5, 5], 2, 2],
    [[10, 10, 10], 1, 3],
    [[1, 10, 1, 10, 1], 3, 1],
    [[1, 10, 1, 10, 1], 2, 2],
    [[1, 2, 4, 9, 3, 4, 1], 2, 2],
    [[10, 20, 30, 40, 50], 2, 2],
    [[1000000000, 1000000000], 1, 2],
    [[5, 1, 3, 2, 4], 3, 1],
    [[5, 1, 3, 2, 4], 2, 2],
    [[1, 2, 3, 4, 5, 6], 3, 2],
    [[10, 10, 10, 10, 10, 10], 2, 3]
  ];

  const tcs = raw.map(([bloomDay, m, k], idx) => ({
    input: `${JSON.stringify(bloomDay)}, ${m}, ${k}`,
    output: String(minDaysBouquets(bloomDay, m, k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 flowers blooming at 100, m = 500, k = 2
  const s21 = new Array(1000).fill(100);
  tcs.push({ input: `${JSON.stringify(s21)}, 500, 2`, output: String(minDaysBouquets(s21, 500, 2)), is_hidden: true });

  // 22: 1000 flowers blooming 1..1000, m = 500, k = 1
  const s22 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s22)}, 500, 1`, output: String(minDaysBouquets(s22, 500, 1)), is_hidden: true });

  // 23: 1000 flowers blooming 1..1000, m = 100, k = 10
  tcs.push({ input: `${JSON.stringify(s22)}, 100, 10`, output: String(minDaysBouquets(s22, 100, 10)), is_hidden: true });

  // 24: 1000 flowers alternating 1 and 1000, m = 250, k = 2 -> impossible because no two adjacent 1s
  const s24 = Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? 1 : 1000));
  tcs.push({ input: `${JSON.stringify(s24)}, 500, 2`, output: String(minDaysBouquets(s24, 500, 2)), is_hidden: true });

  // 25: 1000 flowers alternating 1 and 1000, m = 500, k = 1
  tcs.push({ input: `${JSON.stringify(s24)}, 500, 1`, output: String(minDaysBouquets(s24, 500, 1)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Find the Smallest Divisor Given a Threshold (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateSmallestDivisorTCs() {
  function smallestDivisor(nums, threshold) {
    let low = 1, high = Math.max(...nums);
    let ans = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let sum = 0;
      for (const num of nums) sum += Math.ceil(num / mid);
      if (sum <= threshold) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[1,2,5,9], 6],
    [[44,22,33,11,1], 5],
    [[10], 1],
    [[10], 2],
    [[10], 10],
    [[1], 1],
    [[2, 3, 5, 7, 11], 5],
    [[2, 3, 5, 7, 11], 100],
    [[1, 1, 1, 1], 4],
    [[19], 3],
    [[21212,10101,30303,50505], 1000000],
    [[2, 4, 6, 8, 10], 10],
    [[5, 10, 15, 20], 10],
    [[100, 200, 300, 400], 10],
    [[100, 200, 300, 400], 4],
    [[7, 13, 29, 41], 7],
    [[1000000], 1],
    [[1000000, 1000000], 2],
    [[9, 9, 9, 9, 9], 5],
    [[9, 9, 9, 9, 9], 10]
  ];

  const tcs = raw.map(([nums, threshold], idx) => ({
    input: `${JSON.stringify(nums)}, ${threshold}`,
    output: String(smallestDivisor(nums, threshold)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 elements all 100, threshold = 1000
  const s21 = new Array(1000).fill(100);
  tcs.push({ input: `${JSON.stringify(s21)}, 1000`, output: String(smallestDivisor(s21, 1000)), is_hidden: true });

  // 22: 1000 elements all 100, threshold = 2000
  tcs.push({ input: `${JSON.stringify(s21)}, 2000`, output: String(smallestDivisor(s21, 2000)), is_hidden: true });

  // 23: 1000 elements 1..1000, threshold = 1000
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s23)}, 1000`, output: String(smallestDivisor(s23, 1000)), is_hidden: true });

  // 24: 1000 elements 1..1000, threshold = 2000
  tcs.push({ input: `${JSON.stringify(s23)}, 2000`, output: String(smallestDivisor(s23, 2000)), is_hidden: true });

  // 25: 1000 elements 1..1000, threshold = 5000
  tcs.push({ input: `${JSON.stringify(s23)}, 5000`, output: String(smallestDivisor(s23, 5000)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Capacity To Ship Packages Within D Days (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateShipWithinDaysTCs() {
  function shipWithinDays(weights, days) {
    let low = Math.max(...weights);
    let high = weights.reduce((a, b) => a + b, 0);
    let ans = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      let neededDays = 1, currentWeight = 0;
      for (const w of weights) {
        if (currentWeight + w > mid) {
          neededDays++;
          currentWeight = w;
        } else {
          currentWeight += w;
        }
      }
      if (neededDays <= days) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return ans;
  }

  const raw = [
    [[1,2,3,4,5,6,7,8,9,10], 5],
    [[3,2,2,4,1,4], 3],
    [[1,2,3,1,1], 4],
    [[10], 1],
    [[500], 1],
    [[1, 2, 3, 4, 5], 1],
    [[1, 2, 3, 4, 5], 5],
    [[10, 20, 30], 3],
    [[10, 10, 10, 10, 10], 2],
    [[5, 5, 5, 5, 5, 5], 3],
    [[10, 50, 100, 20, 40], 2],
    [[10, 50, 100, 20, 40], 3],
    [[10, 50, 100, 20, 40], 5],
    [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 5],
    [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 2],
    [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 1],
    [[100, 200, 300, 400, 500], 2],
    [[100, 200, 300, 400, 500], 3],
    [[100, 200, 300, 400, 500], 4],
    [[100, 200, 300, 400, 500], 5]
  ];

  const tcs = raw.map(([weights, days], idx) => ({
    input: `${JSON.stringify(weights)}, ${days}`,
    output: String(shipWithinDays(weights, days)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 packages of weight 10, days = 100
  const s21 = new Array(1000).fill(10);
  tcs.push({ input: `${JSON.stringify(s21)}, 100`, output: String(shipWithinDays(s21, 100)), is_hidden: true });

  // 22: 1000 packages of weight 10, days = 500
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: String(shipWithinDays(s21, 500)), is_hidden: true });

  // 23: 1000 packages 1..500 repeated, days = 10
  const s23 = [];
  for (let i = 1; i <= 500; i++) s23.push(i);
  for (let i = 1; i <= 500; i++) s23.push(i);
  tcs.push({ input: `${JSON.stringify(s23)}, 10`, output: String(shipWithinDays(s23, 10)), is_hidden: true });

  // 24: 1000 packages 1..500 repeated, days = 50
  tcs.push({ input: `${JSON.stringify(s23)}, 50`, output: String(shipWithinDays(s23, 50)), is_hidden: true });

  // 25: 1000 packages 1..500 repeated, days = 250
  tcs.push({ input: `${JSON.stringify(s23)}, 250`, output: String(shipWithinDays(s23, 250)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Kth Missing Positive Number (25 TCs)
// ─────────────────────────────────────────────────────────────────────────────
function generateKthMissingTCs() {
  function findKthPositive(arr, k) {
    let low = 0, high = arr.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const missing = arr[mid] - (mid + 1);
      if (missing < k) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return low + k;
  }

  const raw = [
    [[2,3,4,7,11], 5],
    [[1,2,3,4], 2],
    [[5,6,7], 1],
    [[5,6,7], 4],
    [[5,6,7], 5],
    [[1], 1],
    [[2], 1],
    [[2], 2],
    [[1], 5],
    [[1, 3], 1],
    [[1, 3], 2],
    [[2, 4, 6, 8, 10], 1],
    [[2, 4, 6, 8, 10], 3],
    [[2, 4, 6, 8, 10], 6],
    [[10, 20, 30], 5],
    [[10, 20, 30], 15],
    [[10, 20, 30], 25],
    [[100, 200, 300], 1],
    [[100, 200, 300], 99],
    [[100, 200, 300], 100]
  ];

  const tcs = raw.map(([arr, k], idx) => ({
    input: `${JSON.stringify(arr)}, ${k}`,
    output: String(findKthPositive(arr, k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 1000 consecutive even numbers 2, 4, 6 ... 2000, k = 1 -> 1
  const s21 = Array.from({ length: 1000 }, (_, i) => (i + 1) * 2);
  tcs.push({ input: `${JSON.stringify(s21)}, 1`, output: String(findKthPositive(s21, 1)), is_hidden: true });

  // 22: 1000 consecutive even numbers 2, 4, 6 ... 2000, k = 500 -> 999
  tcs.push({ input: `${JSON.stringify(s21)}, 500`, output: String(findKthPositive(s21, 500)), is_hidden: true });

  // 23: 1000 consecutive numbers starting from 500 (500..1499), k = 100 -> 100
  const s23 = Array.from({ length: 1000 }, (_, i) => i + 500);
  tcs.push({ input: `${JSON.stringify(s23)}, 100`, output: String(findKthPositive(s23, 100)), is_hidden: true });

  // 24: 1000 consecutive numbers 1..1000, k = 500 -> 1500
  const s24 = Array.from({ length: 1000 }, (_, i) => i + 1);
  tcs.push({ input: `${JSON.stringify(s24)}, 500`, output: String(findKthPositive(s24, 500)), is_hidden: true });

  // 25: 1000 consecutive numbers 1..1000, k = 1000 -> 2000
  tcs.push({ input: `${JSON.stringify(s24)}, 1000`, output: String(findKthPositive(s24, 1000)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Find Nth Root of M',
    slug: 'nth-root-of-an-integer',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '3, 27',
    sample_output: '3',
    description: `You are given two positive integers \`n\` and \`m\`. You have to find the \`n\`th root of \`m\`.

If the \`n\`th root of \`m\` is not an integer, return \`-1\`.
That is, find an integer \`x\` such that \`xⁿ = m\`. If no such integer exists, return \`-1\`.

### **Example 1:**
**Input:** n = 3, m = 27
**Output:** 3
**Explanation:** 3³ = 27, so 3 is the 3rd root of 27.

### **Example 2:**
**Input:** n = 4, m = 69
**Output:** -1
**Explanation:** 4th root of 69 is not an integer because 2⁴ = 16 and 3⁴ = 81.

### **Example 3:**
**Input:** n = 2, m = 16
**Output:** 4
**Explanation:** 4² = 16.

### **Constraints:**
- \`1 <= n <= 30\`
- \`1 <= m <= 10⁹\``,
    hints: [
      'Use binary search over the range [1, m].',
      'For mid, compute mid^n without overflowing: if the running product exceeds m, break early and mark it as greater than m.',
      'If mid^n == m, return mid. Otherwise adjust low/high accordingly.'
    ],
    testCases: generateNthRootTCs(),
    solutionCode: `
function solution(n, m) {
  let low = 1, high = m;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let val = 1;
    let overflow = false;
    for (let i = 0; i < n; i++) {
      val *= mid;
      if (val > m) { overflow = true; break; }
    }
    if (!overflow && val === m) return mid;
    if (overflow || val > m) high = mid - 1;
    else low = mid + 1;
  }
  return -1;
}
`
  },
  {
    title: 'Minimum Number of Days to Make m Bouquets',
    slug: 'minimum-number-of-days-to-make-m-bouquets',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[1,10,3,10,2], 3, 1',
    sample_output: '3',
    description: `You are given an integer array \`bloomDay\`, an integer \`m\` and an integer \`k\`.

You want to make \`m\` bouquets. To make a bouquet, you need to use \`k\` **adjacent** flowers from the garden.

The garden consists of \`n\` flowers, the \`i\`th flower will bloom in the \`bloomDay[i]\` and then can be used in **exactly one** bouquet.

Return *the minimum number of days you need to wait to be able to make \`m\` bouquets from the garden*. If it is impossible to make \`m\` bouquets return \`-1\`.

### **Example 1:**
**Input:** bloomDay = [1,10,3,10,2], m = 3, k = 1
**Output:** 3
**Explanation:** Let us see what happened in the first three days:
- Day 1: [x, _, _, _, _] // 1 bouquet made of [0]
- Day 2: [x, _, _, _, x] // 2 bouquets made of [0] and [4]
- Day 3: [x, _, x, _, x] // 3 bouquets made of [0], [2] and [4]
We can make 3 bouquets at Day 3.

### **Example 2:**
**Input:** bloomDay = [1,10,3,10,2], m = 3, k = 2
**Output:** -1
**Explanation:** We need 3 bouquets each should have 2 flowers. That means we need 6 flowers. We only have 5 flowers so it is impossible to get the needed bouquets and we return -1.

### **Example 3:**
**Input:** bloomDay = [7,7,7,7,12,7,7], m = 2, k = 3
**Output:** 12
**Explanation:** We need 2 bouquets each should have 3 flowers.
Here is the garden after each day:
- Day 7: [x, x, x, x, _, x, x]
We can make one bouquet of the first three flowers that bloomed. We cannot make another bouquet from the remaining flowers that bloomed on day 7 because they are not adjacent.
- Day 12: [x, x, x, x, x, x, x]
It is obvious that we can make two bouquets in different ways.

### **Constraints:**
- \`bloomDay.length == n\`
- \`1 <= n <= 10⁵\`
- \`1 <= bloomDay[i] <= 10⁹\`
- \`1 <= m <= 10⁶\`
- \`1 <= k <= n\``,
    hints: [
      'If m * k > bloomDay.length, it is impossible to make m bouquets, return -1.',
      'Binary search on the answer: min day is min(bloomDay) and max day is max(bloomDay).',
      'For a candidate day, count how many bouquets of k adjacent bloomed flowers can be made.'
    ],
    testCases: generateBouquetsTCs(),
    solutionCode: `
function solution(bloomDay, m, k) {
  if (m * k > bloomDay.length) return -1;
  let low = Math.min(...bloomDay), high = Math.max(...bloomDay);
  let ans = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let bouquets = 0, count = 0;
    for (let i = 0; i < bloomDay.length; i++) {
      if (bloomDay[i] <= mid) {
        count++;
        if (count === k) {
          bouquets++;
          count = 0;
        }
      } else {
        count = 0;
      }
    }
    if (bouquets >= m) {
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
    title: 'Find the Smallest Divisor Given a Threshold',
    slug: 'find-the-smallest-divisor-given-a-threshold',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[1,2,5,9], 6',
    sample_output: '5',
    description: `Given an array of integers \`nums\` and an integer \`threshold\`, we will choose a positive integer \`divisor\`, divide all the array by it, and sum the division's result. Find the **smallest** \`divisor\` such that the result mentioned above is less than or equal to \`threshold\`.

Each result of division is rounded to the nearest integer greater than or equal to that element. (For example: \`7/3 = 3\` and \`10/2 = 5\`).

The test cases are generated so that there will be an answer.

### **Example 1:**
**Input:** nums = [1,2,5,9], threshold = 6
**Output:** 5
**Explanation:** We can get a sum to 17 (1+2+5+9) if the divisor is 1. 
If the divisor is 4 we can get a sum of 7 (1+1+2+3) and if the divisor is 5 the sum will be 5 (1+1+1+2).

### **Example 2:**
**Input:** nums = [44,22,33,11,1], threshold = 5
**Output:** 44

### **Constraints:**
- \`1 <= nums.length <= 5 * 10⁴\`
- \`1 <= nums[i] <= 10⁶\`
- \`nums.length <= threshold <= 10⁶\``,
    hints: [
      'The divisor can range from 1 to max(nums).',
      'Binary search for the smallest divisor in range [1, max(nums)].',
      'For mid, sum ceil(num / mid) for all num in nums. If sum <= threshold, try smaller divisor.'
    ],
    testCases: generateSmallestDivisorTCs(),
    solutionCode: `
function solution(nums, threshold) {
  let low = 1, high = Math.max(...nums);
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let sum = 0;
    for (const num of nums) sum += Math.ceil(num / mid);
    if (sum <= threshold) {
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
    title: 'Capacity To Ship Packages Within D Days',
    slug: 'capacity-to-ship-packages-within-d-days',
    topic: 'binary-search',
    difficulty: 'medium',
    sample_input: '[1,2,3,4,5,6,7,8,9,10], 5',
    sample_output: '15',
    description: `A conveyor belt has packages that must be shipped from one port to another within \`days\` days.

The \`i\`th package on the conveyor belt has a weight of \`weights[i]\`. Each day, we load the ship with packages on the conveyor belt (in the order given by \`weights\`). We may not load more weight than the maximum weight capacity of the ship.

Return the least weight capacity of the ship that will result in all the packages on the conveyor belt being shipped within \`days\` days.

### **Example 1:**
**Input:** weights = [1,2,3,4,5,6,7,8,9,10], days = 5
**Output:** 15
**Explanation:** A ship capacity of 15 is the minimum to ship all the packages in 5 days like this:
1st day: 1, 2, 3, 4, 5
2nd day: 6, 7
3rd day: 8
4th day: 9
5th day: 10
Note that the cargo must be shipped in the order given, so using a ship of capacity 14 and splitting the packages into parts like (2, 3, 4, 5), (1, 6, 7), (8), (9), (10) is not allowed.

### **Example 2:**
**Input:** weights = [3,2,2,4,1,4], days = 3
**Output:** 6
**Explanation:** A ship capacity of 6 is the minimum to ship all the packages in 3 days like this:
1st day: 3, 2
2nd day: 2, 4
3rd day: 1, 4

### **Example 3:**
**Input:** weights = [1,2,3,1,1], days = 4
**Output:** 3
**Explanation:**
1st day: 1
2nd day: 2
3rd day: 3
4th day: 1, 1

### **Constraints:**
- \`1 <= days <= weights.length <= 5 * 10⁴\`
- \`1 <= weights[i] <= 500\``,
    hints: [
      'Minimum possible capacity is max(weights) because we must ship every package.',
      'Maximum possible capacity is sum(weights) (ships everything in 1 day).',
      'Binary search for capacity in range [max(weights), sum(weights)].'
    ],
    testCases: generateShipWithinDaysTCs(),
    solutionCode: `
function solution(weights, days) {
  let low = Math.max(...weights);
  let high = weights.reduce((a, b) => a + b, 0);
  let ans = high;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let neededDays = 1, currentWeight = 0;
    for (const w of weights) {
      if (currentWeight + w > mid) {
        neededDays++;
        currentWeight = w;
      } else {
        currentWeight += w;
      }
    }
    if (neededDays <= days) {
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
    title: 'Kth Missing Positive Number',
    slug: 'kth-missing-positive-number',
    topic: 'binary-search',
    difficulty: 'easy',
    sample_input: '[2,3,4,7,11], 5',
    sample_output: '9',
    description: `Given an array \`arr\` of positive integers sorted in a **strictly increasing order**, and an integer \`k\`.

Return the \`k\`th **positive integer** that is missing from this array.

### **Example 1:**
**Input:** arr = [2,3,4,7,11], k = 5
**Output:** 9
**Explanation:** The missing positive integers are [1,5,6,8,9,10,12,13,...]. The 5th missing positive integer is 9.

### **Example 2:**
**Input:** arr = [1,2,3,4], k = 2
**Output:** 6
**Explanation:** The missing positive integers are [5,6,7,...]. The 2nd missing positive integer is 6.

### **Constraints:**
- \`1 <= arr.length <= 1000\`
- \`1 <= arr[i] <= 1000\`
- \`1 <= k <= 1000\`
- \`arr[i] < arr[j]\` for \`1 <= i < j <= arr.length\``,
    hints: [
      'At index mid, the number of missing numbers up to arr[mid] is arr[mid] - (mid + 1).',
      'If missing < k, we need more missing numbers, so search right (low = mid + 1).',
      'Otherwise search left (high = mid - 1). After binary search, answer is low + k.'
    ],
    testCases: generateKthMissingTCs(),
    solutionCode: `
function solution(arr, k) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const missing = arr[mid] - (mid + 1);
    if (missing < k) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return low + k;
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[Seed] Starting Seeding & Validation for Binary Search Batch 4 (5 Problems)...');

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
    const { rows: dbTestCases } = await pool.query(
      `SELECT id, input, output, is_hidden FROM test_cases WHERE problem_id = $1 ORDER BY id ASC`,
      [problemId]
    );

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
