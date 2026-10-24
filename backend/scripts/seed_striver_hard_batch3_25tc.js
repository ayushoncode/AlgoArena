/**
 * seed_striver_hard_batch3_25tc.js
 * Seeds and validates the remaining Striver A2Z Array Hard problems with exactly 25 test cases each.
 *
 * Problems:
 * 1. Largest Subarray with 0 Sum (largest-subarray-with-0-sum)
 * 2. Subarrays with XOR K (subarrays-with-xor-k)
 * 3. Find Missing and Repeated Values (find-missing-and-repeated-values)
 * 4. Count Inversions (count-inversions)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// ==========================================
// 1. LARGEST SUBARRAY WITH 0 SUM
// ==========================================
function generateLargestSubarray0SumCases() {
  function solve(nums) {
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
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 zeros -> length 100
  const s21 = new Array(100).fill(0);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify(100), is_hidden: true });

  // 22: 500 alternating 1 and -1 -> length 500
  const s22 = [];
  for (let i = 0; i < 500; i++) s22.push(i % 2 === 0 ? 1 : -1);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(500), is_hidden: true });

  // 23: 1000 all positive numbers -> 0
  const s23 = [];
  for (let i = 1; i <= 1000; i++) s23.push(i);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(0), is_hidden: true });

  // 24: 1500 elements with giant 0-sum subarray from index 100 to 1400
  const s24 = new Array(1500).fill(1);
  s24[100] = 500;
  s24[1400] = -500;
  for (let i = 101; i < 1400; i++) s24[i] = (i % 2 === 0 ? 2 : -2);
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(solve([...s24])), is_hidden: true });

  // 25: 3000 elements pseudo-random stress
  const s25 = [];
  for (let i = 0; i < 3000; i++) s25.push((i * 17) % 21 - 10);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve([...s25])), is_hidden: true });

  return tcs;
}

// ==========================================
// 2. SUBARRAYS WITH XOR K
// ==========================================
function generateSubarraysWithXorKCases() {
  function solve(nums, k) {
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
    output: JSON.stringify(solve([...nums], k)),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 100 zeros, k = 0 -> (100 * 101) / 2 = 5050
  const s21 = new Array(100).fill(0);
  tcs.push({ input: `${JSON.stringify(s21)}, 0`, output: JSON.stringify(5050), is_hidden: true });

  // 22: 500 ones, k = 1 -> subarrays of odd length = 250 * 251 = 62750
  const s22 = new Array(500).fill(1);
  tcs.push({ input: `${JSON.stringify(s22)}, 1`, output: JSON.stringify(solve(s22, 1)), is_hidden: true });

  // 23: 1000 power of twos [1, 2, 4, 8, ...] all distinct bits, k = 15
  const s23 = [];
  for (let i = 0; i < 1000; i++) s23.push(1 << (i % 20));
  tcs.push({ input: `${JSON.stringify(s23)}, 15`, output: JSON.stringify(solve(s23, 15)), is_hidden: true });

  // 24: 1500 elements target k = 12
  const s24 = [];
  for (let i = 0; i < 1500; i++) s24.push((i * 13) % 31);
  tcs.push({ input: `${JSON.stringify(s24)}, 12`, output: JSON.stringify(solve(s24, 12)), is_hidden: true });

  // 25: 3000 elements stress
  const s25 = [];
  for (let i = 0; i < 3000; i++) s25.push((i * 37) % 63);
  tcs.push({ input: `${JSON.stringify(s25)}, 25`, output: JSON.stringify(solve(s25, 25)), is_hidden: true });

  return tcs;
}

// ==========================================
// 3. FIND MISSING AND REPEATED VALUES
// ==========================================
function generateMissingRepeatingCases() {
  function solve(nums) {
    const n = nums.length;
    let a = -1, b = -1;
    const count = new Array(n + 1).fill(0);
    for (const num of nums) count[num]++;
    for (let i = 1; i <= n; i++) {
      if (count[i] === 2) a = i;
      else if (count[i] === 0) b = i;
    }
    return [a, b];
  }

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
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 500 elements, repeat 1, miss 500
  const s21 = [];
  for (let i = 1; i <= 499; i++) s21.push(i);
  s21.push(1);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify([1, 500]), is_hidden: true });

  // 22: 500 elements, repeat 500, miss 1
  const s22 = [];
  for (let i = 2; i <= 500; i++) s22.push(i);
  s22.push(500);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify([500, 1]), is_hidden: true });

  // 23: 1000 elements, repeat 42, miss 777
  const s23 = [];
  for (let i = 1; i <= 1000; i++) {
    if (i === 777) s23.push(42);
    else s23.push(i);
  }
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify([42, 777]), is_hidden: true });

  // 24: 2000 elements shuffled with repeat 999, miss 1000
  const s24 = [];
  for (let i = 1; i <= 2000; i++) {
    if (i === 1000) s24.push(999);
    else s24.push(i);
  }
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify([999, 1000]), is_hidden: true });

  // 25: 5000 elements stress test
  const s25 = [];
  for (let i = 1; i <= 5000; i++) {
    if (i === 2500) s25.push(1234);
    else s25.push(i);
  }
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify([1234, 2500]), is_hidden: true });

  return tcs;
}

// ==========================================
// 4. COUNT INVERSIONS
// ==========================================
function generateCountInversionsCases() {
  function solve(nums) {
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
    output: JSON.stringify(solve([...arr])),
    is_hidden: idx >= 3
  }));

  // Stress tests (21 - 25)
  // 21: 500 strictly decreasing -> 500 * 499 / 2 = 124750
  const s21 = [];
  for (let i = 500; i >= 1; i--) s21.push(i);
  tcs.push({ input: JSON.stringify(s21), output: JSON.stringify((500 * 499) / 2), is_hidden: true });

  // 22: 500 strictly increasing -> 0
  const s22 = [];
  for (let i = 1; i <= 500; i++) s22.push(i);
  tcs.push({ input: JSON.stringify(s22), output: JSON.stringify(0), is_hidden: true });

  // 23: 1000 identical elements -> 0
  const s23 = new Array(1000).fill(42);
  tcs.push({ input: JSON.stringify(s23), output: JSON.stringify(0), is_hidden: true });

  // 24: 1500 elements: first half all 100, second half all 1 -> 750 * 750 = 562500
  const s24 = [...new Array(750).fill(100), ...new Array(750).fill(1)];
  tcs.push({ input: JSON.stringify(s24), output: JSON.stringify(750 * 750), is_hidden: true });

  // 25: 3000 elements pseudo-random stress test
  const s25 = [];
  for (let i = 0; i < 3000; i++) s25.push((i * 47) % 500);
  tcs.push({ input: JSON.stringify(s25), output: JSON.stringify(solve([...s25])), is_hidden: true });

  return tcs;
}

// Problem definitions
const PROBLEMS = [
  {
    slug: 'largest-subarray-with-0-sum',
    title: 'Largest Subarray with 0 Sum',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[15, -2, 2, -8, 1, 7, 10, 23]',
    sample_output: '5',
    hints: [
      "Use prefix sums: if prefix sum at index j equals prefix sum at index i, the sum of elements between i + 1 and j must be 0.",
      "Store the first occurrence of each prefix sum in a hash map.",
      "If the current prefix sum is already in the map at index i, the candidate length is j - i. Update maxLen."
    ],
    description: `Given an array having both positive and negative integers, compute the length of the **largest subarray with sum 0**.

### Example 1
\`\`\`
Input: nums = [15, -2, 2, -8, 1, 7, 10, 23]
Output: 5
Explanation: The largest subarray with sum 0 is [-2, 2, -8, 1, 7] whose length is 5.
\`\`\`

### Example 2
\`\`\`
Input: nums = [2, 10, 4]
Output: 0
Explanation: There is no subarray with 0 sum.
\`\`\`

### Example 3
\`\`\`
Input: nums = [1, 0, 3]
Output: 1
Explanation: The subarray [0] has sum 0 and length 1.
\`\`\`

### Constraints
- \`1 <= nums.length <= 10⁵\`
- \`-1000 <= nums[i] <= 1000\`
`,
    testCases: generateLargestSubarray0SumCases(),
    solutionCode: `function solution(nums) {
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
    }`
  },
  {
    slug: 'subarrays-with-xor-k',
    title: 'Subarrays with XOR K',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[4, 2, 2, 6, 4], 6',
    sample_output: '4',
    hints: [
      "Let prefix XOR up to index i be xr. We need a subarray with XOR k ending at index i.",
      "If xr ^ target = k, then target = xr ^ k.",
      "Maintain a hash map of prefix XOR frequencies as you traverse the array."
    ],
    description: `Given an array of integers \`nums\` and an integer \`k\`, find the total number of subarrays having bitwise XOR equal to \`k\`.

### Example 1
\`\`\`
Input: nums = [4, 2, 2, 6, 4], k = 6
Output: 4
Explanation: The subarrays having XOR 6 are:
- [4, 2] (4 ^ 2 = 6)
- [4, 2, 2, 6, 4] (4 ^ 2 ^ 2 ^ 6 ^ 4 = 6)
- [2, 2, 6] (2 ^ 2 ^ 6 = 6)
- [6] (6 = 6)
\`\`\`

### Example 2
\`\`\`
Input: nums = [5, 6, 7, 8, 9], k = 5
Output: 2
\`\`\`

### Constraints
- \`1 <= nums.length <= 10⁵\`
- \`0 <= nums[i] <= 10⁵\`
- \`0 <= k <= 10⁵\`
`,
    testCases: generateSubarraysWithXorKCases(),
    solutionCode: `function solution(nums, k) {
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
    }`
  },
  {
    slug: 'find-missing-and-repeated-values',
    title: 'Find Missing and Repeated Values',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1, 3, 3]',
    sample_output: '[3, 2]',
    hints: [
      "The array contains integers from 1 to n with exactly one duplicate and one missing value.",
      "Use frequency counting array or math (sum and sum of squares equations).",
      "Return the result as [repeated, missing]."
    ],
    description: `You are given an integer array \`nums\` of size \`n\` containing numbers from \`1\` to \`n\`.

Exactly one number \`a\` appears twice and one number \`b\` is missing.

Return the numbers \`[a, b]\` where \`a\` is the repeating number and \`b\` is the missing number.

### Example 1
\`\`\`
Input: nums = [1, 3, 3]
Output: [3, 2]
Explanation: Number 3 is repeated and number 2 is missing.
\`\`\`

### Example 2
\`\`\`
Input: nums = [2, 2]
Output: [2, 1]
\`\`\`

### Example 3
\`\`\`
Input: nums = [4, 3, 6, 2, 1, 1]
Output: [1, 5]
\`\`\`

### Constraints
- \`2 <= nums.length <= 10⁵\`
- \`1 <= nums[i] <= nums.length\`
`,
    testCases: generateMissingRepeatingCases(),
    solutionCode: `function solution(nums) {
      const n = nums.length;
      let a = -1, b = -1;
      const count = new Array(n + 1).fill(0);
      for (const num of nums) count[num]++;
      for (let i = 1; i <= n; i++) {
        if (count[i] === 2) a = i;
        else if (count[i] === 0) b = i;
      }
      return [a, b];
    }`
  },
  {
    slug: 'count-inversions',
    title: 'Count Inversions',
    topic: 'arrays',
    difficulty: 'hard',
    sample_input: '[2, 4, 1, 3, 5]',
    sample_output: '3',
    hints: [
      "A pair (i, j) is an inversion if i < j and nums[i] > nums[j].",
      "An O(n²) brute force will exceed the time limit for large inputs.",
      "Use modified Merge Sort: during merge, if nums[left] > nums[right], then all remaining elements in the left half are also greater than nums[right]."
    ],
    description: `Given an array of integers \`nums\`, find the **inversion count** of the array.

Inversion Count for an array indicates how far (or close) the array is from being sorted. If the array is already sorted, the inversion count is 0. If the array is sorted in reverse order, the inversion count is maximum.

Formally, two elements \`nums[i]\` and \`nums[j]\` form an inversion if \`nums[i] > nums[j]\` and \`i < j\`.

### Example 1
\`\`\`
Input: nums = [2, 4, 1, 3, 5]
Output: 3
Explanation: The sequence has 3 inversions: (2, 1), (4, 1), (4, 3).
\`\`\`

### Example 2
\`\`\`
Input: nums = [2, 3, 4, 5, 6]
Output: 0
Explanation: As the sequence is already sorted, inversion count is 0.
\`\`\`

### Example 3
\`\`\`
Input: nums = [10, 10, 10]
Output: 0
\`\`\`

### Constraints
- \`1 <= nums.length <= 10⁵\`
- \`-10⁵ <= nums[i] <= 10⁵\`
`,
    testCases: generateCountInversionsCases(),
    solutionCode: `function solution(nums) {
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
    }`
  }
];

async function seedAndVerify() {
  console.log('[Seed] Starting Seeding & Validation for Remaining Striver Array Hard Problems...');

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

  console.log('\n========================================\nALL REMAINING HARD PROBLEMS SEEDED & VALIDATED WITH 25/25 ACCEPTED!\n');
  process.exit(0);
}

seedAndVerify().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
