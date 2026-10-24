const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Reference solutions to guarantee 100% correct expected outputs for all test cases
function solveMaxConsecutiveOnes(nums) {
  let max = 0, cur = 0;
  for (const n of nums) {
    if (n === 1) { cur++; if (cur > max) max = cur; }
    else cur = 0;
  }
  return max;
}

function solveLongestSubarrayWithSumK(nums, k) {
  let map = new Map();
  let maxLen = 0, sum = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    if (sum === k) maxLen = i + 1;
    if (map.has(sum - k)) {
      maxLen = Math.max(maxLen, i - map.get(sum - k));
    }
    if (!map.has(sum)) map.set(sum, i);
  }
  return maxLen;
}

function solveSingleNumber(nums) {
  let xor = 0;
  for (const n of nums) xor ^= n;
  return xor;
}

function solveTwoSum(nums, target) {
  let map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [-1, -1];
}

function solveSortColors(nums) {
  let copy = [...nums];
  return copy.sort((a, b) => a - b);
}

// ── 5 Target Questions Definitions ──────────────────────────────────
const questions = [
  {
    slug: 'max-consecutive-ones',
    title: 'Max Consecutive Ones',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given a binary array \`nums\`, return the maximum number of consecutive \`1\`'s in the array.

### Example 1
\`\`\`
Input: nums = [1, 1, 0, 1, 1, 1]
Output: 3
Explanation: The first two digits or the last three digits are consecutive 1s. The maximum number of consecutive 1s is 3.
\`\`\`

### Example 2
\`\`\`
Input: nums = [1, 0, 1, 1, 0, 1]
Output: 2
Explanation: The maximum consecutive 1s is 2.
\`\`\`

### Example 3
\`\`\`
Input: nums = [0, 0, 0]
Output: 0
Explanation: There are no 1s in the array.
\`\`\`

### Constraints
- \`1 <= nums.length <= 10^5\`
- \`nums[i]\` is either \`0\` or \`1\`.

### Hints
1. You need to maintain a current count of 1's as you iterate through the array.
2. Whenever you encounter a 0, reset the current count to 0.
3. Update the maximum count observed so far after checking each element. Time complexity is O(N) and space complexity is O(1).
`,
    sample_input: '[1, 1, 0, 1, 1, 1]',
    sample_output: '3',
    hints: [
      'Maintain a running counter of consecutive 1s.',
      'Reset the counter to 0 whenever a 0 is encountered.',
      'Keep track of the maximum counter value observed.'
    ],
    generateTestCases: () => {
      const inputs = [
        [1, 1, 0, 1, 1, 1],
        [1, 0, 1, 1, 0, 1],
        [0, 0, 0],
        [1],
        [0],
        [1, 1, 1, 1],
        [0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 1],
        [0, 1, 1, 1, 1, 0, 1, 1],
        [1, 1, 1, 0, 0, 1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
        [1, 0, 1, 1, 1, 0, 0, 1, 1],
        [0, 0, 0, 1, 1, 1, 1, 1, 0, 0],
        [1, 1, 1, 1, 0, 1, 1, 1, 1],
        [0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        Array(50).fill([0, 1]).flat(),
        Array(500).fill(1),
        [...Array(400).fill(0), ...Array(75).fill(1), ...Array(525).fill(0)] // 1000 length TLE stress test
      ];
      return inputs.map((arr, idx) => ({
        input: JSON.stringify(arr),
        output: String(solveMaxConsecutiveOnes(arr)),
        is_hidden: idx >= 3
      }));
    }
  },
  {
    slug: 'longest-subarray-with-given-sum',
    title: 'Longest Subarray with Given Sum K',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given an array of integers \`nums\` and an integer \`k\`, find the length of the **longest subarray** whose elements sum up to \`k\`. If no such subarray exists, return \`0\`.

### Example 1
\`\`\`
Input: nums = [10, 5, 2, 7, 1, 9], k = 15
Output: 4
Explanation: The subarray [5, 2, 7, 1] has a sum of 15 and length 4.
\`\`\`

### Example 2
\`\`\`
Input: nums = [-1, 2, 3], k = 6
Output: 0
Explanation: There is no subarray with sum 6.
\`\`\`

### Example 3
\`\`\`
Input: nums = [1, 2, 3, 1, 1, 1, 1], k = 3
Output: 3
Explanation: The longest subarray with sum 3 is [1, 1, 1], which has length 3.
\`\`\`

### Constraints
- \`1 <= nums.length <= 10^5\`
- \`-10^5 <= nums[i] <= 10^5\`
- \`-10^9 <= k <= 10^9\`

### Hints
1. For an optimal solution handling both positive and negative values, use a Prefix Sum with a Hash Map.
2. Store the first index where each prefix sum appears.
3. If \`current_prefix_sum - k\` has been seen before at index \`prev_idx\`, the subarray from \`prev_idx + 1\` to \`i\` has sum \`k\`. Length is \`i - prev_idx\`. Time complexity is O(N) and space complexity is O(N).
`,
    sample_input: '[10, 5, 2, 7, 1, 9], 15',
    sample_output: '4',
    hints: [
      'Think about using prefix sums.',
      'Store each prefix sum and its earliest index in a hash map.',
      'If (prefixSum - k) exists in the map, a valid subarray ends at the current index.'
    ],
    generateTestCases: () => {
      const cases = [
        { nums: [10, 5, 2, 7, 1, 9], k: 15 },
        { nums: [-1, 2, 3], k: 6 },
        { nums: [1, 2, 3, 1, 1, 1, 1], k: 3 },
        { nums: [2, 0, 0, 3], k: 3 },
        { nums: [1, -1, 1], k: 1 },
        { nums: [5], k: 5 },
        { nums: [5], k: 3 },
        { nums: [1, 2, 3, 4, 5], k: 9 },
        { nums: [1, 1, 1, 1, 1], k: 3 },
        { nums: [-5, 8, -14, 2, 4, 12], k: -5 },
        { nums: [0, 0, 0, 0], k: 0 },
        { nums: [1, 4, 0, 0, 3, 10, 5], k: 7 },
        { nums: [-1, -2, -3], k: -5 },
        { nums: [3, 1, 2, 5, 1, 1, 1, 3], k: 3 },
        { nums: [10, -10, 10, -10, 10], k: 0 },
        { nums: [2, 3, 5, 1, 9], k: 10 },
        { nums: [1, 2, 1, 2, 1], k: 3 },
        { nums: [1, 2, 3, 7, 5], k: 12 },
        { nums: [1, -1, 5, -2, 3], k: 3 },
        { nums: [-2, -1, 2, 1], k: 1 },
        { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], k: 15 },
        { nums: [-3, 2, 3, 1, 6], k: 6 },
        { nums: Array(200).fill(1), k: 50 },
        { nums: Array(250).fill([1, -1]).flat(), k: 0 },
        { nums: [...Array(400).fill(1), ...Array(600).fill(2)], k: 250 } // 1000 length TLE stress test
      ];
      return cases.map((c, idx) => ({
        input: `${JSON.stringify(c.nums)}, ${c.k}`,
        output: String(solveLongestSubarrayWithSumK(c.nums, c.k)),
        is_hidden: idx >= 3
      }));
    }
  },
  {
    slug: 'single-number',
    title: 'Single Number',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given a non-empty array of integers \`nums\`, every element appears **twice** except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.

### Example 1
\`\`\`
Input: nums = [2, 2, 1]
Output: 1
Explanation: 1 appears only once, while 2 appears twice.
\`\`\`

### Example 2
\`\`\`
Input: nums = [4, 1, 2, 1, 2]
Output: 4
Explanation: 4 appears only once.
\`\`\`

### Example 3
\`\`\`
Input: nums = [1]
Output: 1
Explanation: 1 is the only element in the array.
\`\`\`

### Constraints
- \`1 <= nums.length <= 3 * 10^4\`
- \`-3 * 10^4 <= nums[i] <= 3 * 10^4\`
- Each element in the array appears twice except for one element which appears only once.

### Hints
1. Think about the XOR bitwise operator: \`a ^ a = 0\` and \`a ^ 0 = a\`.
2. Because XOR is commutative and associative, all pairs of equal numbers will cancel each other out to 0.
3. What remains after XORing every number in the array is the unique number! Time complexity is O(N) and space complexity is O(1).
`,
    sample_input: '[2, 2, 1]',
    sample_output: '1',
    hints: [
      'Consider the bitwise XOR operator properties: a ^ a = 0 and a ^ 0 = a.',
      'XOR is commutative and associative.',
      'XOR all elements in the array; duplicate pairs will cancel each other out.'
    ],
    generateTestCases: () => {
      const inputs = [
        [2, 2, 1],
        [4, 1, 2, 1, 2],
        [1],
        [-1],
        [-1, -1, -2],
        [0, 1, 0],
        [7, 3, 5, 3, 5],
        [10, 20, 30, 20, 10],
        [-5, 3, -5],
        [99, 99, 88, 88, 77],
        [1, 2, 3, 4, 5, 4, 3, 2, 1],
        [100, -100, 200, 100, -100],
        [0, 0, 42],
        [-999, -999, 0],
        [11, 22, 33, 44, 55, 44, 33, 22, 11],
        [2, 1, 2, 3, 3],
        [-10, -20, -10, -30, -20],
        [1, 3, 1, -1, 3],
        [50000, 2, 50000],
        [-30000, -30000, -50000],
        [9, 8, 7, 9, 8],
        [100, 200, 300, 400, 300, 200, 100],
        [...Array(100).fill(0).flatMap((_, i) => [i + 1, i + 1]), 9999], // 201 elements
        [...Array(250).fill(0).flatMap((_, i) => [-i - 1, -i - 1]), -7777], // 501 elements
        [...Array(499).fill(0).flatMap((_, i) => [i + 5, i + 5]), 42] // 999 elements TLE stress test
      ];
      return inputs.map((arr, idx) => ({
        input: JSON.stringify(arr),
        output: String(solveSingleNumber(arr)),
        is_hidden: idx >= 3
      }));
    }
  },
  {
    slug: 'two-sum',
    title: 'Two Sum',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given an array of integers \`nums\` and an integer \`target\`, return **indices of the two numbers** such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

### Example 2
\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
Explanation: Because nums[1] + nums[2] == 6, we return [1, 2].
\`\`\`

### Example 3
\`\`\`
Input: nums = [3, 3], target = 6
Output: [0, 1]
Explanation: Because nums[0] + nums[1] == 6, we return [0, 1].
\`\`\`

### Constraints
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**

### Hints
1. A brute force approach checks all pairs in O(N^2) time. Can you do it faster?
2. Use a Hash Map to store each number and its index as you iterate through the array.
3. For each number \`nums[i]\`, check if \`target - nums[i]\` already exists in the Hash Map. Time complexity is O(N) and space complexity is O(N).
`,
    sample_input: '[2, 7, 11, 15], 9',
    sample_output: '[0, 1]',
    hints: [
      'Try checking if target - current_element exists in a hash map.',
      'Store each element index in the map as you iterate.',
      'Return the complement index and current index when found.'
    ],
    generateTestCases: () => {
      const cases = [
        { nums: [2, 7, 11, 15], target: 9 },
        { nums: [3, 2, 4], target: 6 },
        { nums: [3, 3], target: 6 },
        { nums: [1, 5, 9, 13], target: 14 },
        { nums: [-1, -2, -3, -4, -5], target: -8 },
        { nums: [0, 4, 3, 0], target: 0 },
        { nums: [-3, 4, 3, 90], target: 0 },
        { nums: [10, 20, 30, 40], target: 50 },
        { nums: [5, 75, 25], target: 100 },
        { nums: [1, 2, 3, 4, 6], target: 10 },
        { nums: [-10, 7, 19, 15], target: 9 },
        { nums: [100, 200, 300, 400], target: 700 },
        { nums: [1, 3, 5, 7, 9, 11], target: 20 },
        { nums: [2, 5, 5, 11], target: 10 },
        { nums: [-5, 10, -3, 8], target: 5 },
        { nums: [15, 25, 35, 45, 55], target: 80 },
        { nums: [1, 4, 7, 11, 15], target: 26 },
        { nums: [8, 12, 16, 20], target: 36 },
        { nums: [-100, 50, -50, 100], target: 0 },
        { nums: [7, 14, 21, 28, 35], target: 42 },
        { nums: [1, 1000, 2000, 3], target: 4 },
        { nums: [6, 3, 8, 2, 1], target: 5 },
        { nums: [...Array(198).fill(100), 2, 3], target: 5 },
        { nums: [-9999, ...Array(498).fill(1), -1], target: -10000 },
        { nums: [1, ...Array(998).fill(0), 99], target: 100 } // 1000 length TLE stress test
      ];
      return cases.map((c, idx) => ({
        input: `${JSON.stringify(c.nums)}, ${c.target}`,
        output: JSON.stringify(solveTwoSum(c.nums, c.target)),
        is_hidden: idx >= 3
      }));
    }
  },
  {
    slug: 'sort-colors',
    title: 'Sort Colors',
    topic: 'arrays',
    difficulty: 'medium',
    statement: `Given an array \`nums\` with \`n\` objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue.

We will use the integers \`0\`, \`1\`, and \`2\` to represent the color red, white, and blue, respectively.

You must solve this problem without using the library's sort function.

### Example 1
\`\`\`
Input: nums = [2, 0, 2, 1, 1, 0]
Output: [0, 0, 1, 1, 2, 2]
Explanation: The sorted array has all 0s first, then 1s, then 2s.
\`\`\`

### Example 2
\`\`\`
Input: nums = [2, 0, 1]
Output: [0, 1, 2]
Explanation: The colors are arranged in non-decreasing order.
\`\`\`

### Example 3
\`\`\`
Input: nums = [0]
Output: [0]
Explanation: Single element array is trivially sorted.
\`\`\`

### Constraints
- \`n == nums.length\`
- \`1 <= n <= 300\`
- \`nums[i]\` is either \`0\`, \`1\`, or \`2\`.

### Hints
1. A rather straight forward solution is a two-pass algorithm using counting sort (count number of 0s, 1s, and 2s).
2. Could you come up with a one-pass algorithm using only constant extra space?
3. Use the Dutch National Flag algorithm: maintain three pointers \`low\`, \`mid\`, and \`high\`. Swap 0s to the front, 2s to the back, and advance pointers. Time complexity is O(N) and space complexity is O(1).
`,
    sample_input: '[2, 0, 2, 1, 1, 0]',
    sample_output: '[0, 0, 1, 1, 2, 2]',
    hints: [
      'You can count the occurrences of 0, 1, and 2, but can you do it in one pass?',
      'Use the Dutch National Flag 3-pointer algorithm (low, mid, high).',
      'Swap 0s with low, 2s with high, and keep 1s in the middle.'
    ],
    generateTestCases: () => {
      const inputs = [
        [2, 0, 2, 1, 1, 0],
        [2, 0, 1],
        [0],
        [1],
        [2],
        [1, 0],
        [2, 1],
        [2, 0],
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2],
        [0, 1, 2],
        [2, 1, 0],
        [1, 2, 0],
        [2, 2, 1, 1, 0, 0],
        [0, 2, 1, 0, 2, 1],
        [1, 1, 0, 2, 0, 1, 2, 1, 0],
        [2, 0, 2, 0, 2, 0],
        [1, 2, 1, 2, 1, 2],
        [0, 1, 0, 1, 0, 1],
        [2, 1, 2, 0, 1, 0, 2, 0, 1, 2],
        [1, 0, 2, 1, 0, 2, 1, 0, 2],
        [...Array(50).fill(2), ...Array(50).fill(1), ...Array(50).fill(0)],
        [...Array(100).fill(0), ...Array(100).fill(2), ...Array(100).fill(1)],
        [...Array(200).fill(2), ...Array(200).fill(0), ...Array(200).fill(1)] // 600 elements stress test
      ];
      return inputs.map((arr, idx) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveSortColors(arr)),
        is_hidden: idx >= 3
      }));
    }
  }
];

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const q of questions) {
      const res = await client.query('SELECT id FROM problems WHERE slug = $1', [q.slug]);
      let problemId;

      if (res.rows.length > 0) {
        problemId = res.rows[0].id;
        await client.query(
          `UPDATE problems 
           SET title = $1, topic = $2, difficulty = $3, description = $4, sample_input = $5, sample_output = $6, hints = $7 
           WHERE id = $8`,
          [q.title, q.topic, q.difficulty, q.statement, q.sample_input, q.sample_output, JSON.stringify(q.hints), problemId]
        );
        console.log(`[Seed] Updated ${q.slug} (${problemId})`);
      } else {
        const ins = await client.query(
          `INSERT INTO problems (title, slug, topic, difficulty, description, sample_input, sample_output, hints, min_rating, max_rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 9999) RETURNING id`,
          [q.title, q.slug, q.topic, q.difficulty, q.statement, q.sample_input, q.sample_output, JSON.stringify(q.hints)]
        );
        problemId = ins.rows[0].id;
        console.log(`[Seed] Inserted ${q.slug} (${problemId})`);
      }

      // Re-seed all 25 test cases
      await client.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
      const tcs = q.generateTestCases();
      for (const tc of tcs) {
        await client.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
          [problemId, tc.input, tc.output, tc.is_hidden]
        );
      }
      console.log(`[Seed] Added ${tcs.length} test cases for ${q.slug}`);
    }

    // Top up linear-search, union-of-two-sorted-arrays, missing-number, and rotate-array to 25 test cases as well
    const topUps = [
      {
        slug: 'rotate-array',
        extraTCs: [
          { input: '[1, 2, 3], 4', output: '[3,1,2]' },
          { input: '[1, 2, 3, 4, 5], 10', output: '[1,2,3,4,5]' },
          { input: '[-1, -2, -3, -4], 3', output: '[-2,-3,-4,-1]' },
          { input: '[100], 50', output: '[100]' },
          { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 7', output: '[4,5,6,7,8,9,10,1,2,3]' }
        ]
      },
      {
        slug: 'linear-search',
        extraTCs: [
          { input: '[2, 4, 6, 8, 10], 6', output: '2' },
          { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1', output: '0' },
          { input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10', output: '9' },
          { input: '[-10, -20, -30], -30', output: '2' },
          { input: '[0, 0, 0, 1], 1', output: '3' },
          { input: '[5, 5, 5, 5], 5', output: '0' },
          { input: '[100, 200, 300], 50', output: '-1' },
          { input: '[1, 3, 5, 7, 9], 4', output: '-1' },
          { input: '[99], 99', output: '0' },
          { input: `${JSON.stringify(Array(200).fill(1).concat([99]))}, 99`, output: '200' }
        ]
      },
      {
        slug: 'missing-number',
        extraTCs: [
          { input: '[0, 1, 2, 4]', output: '3' },
          { input: '[1, 2, 3]', output: '0' },
          { input: '[0, 1, 2, 3, 4, 6]', output: '5' },
          { input: '[6, 5, 4, 3, 2, 0]', output: '1' },
          { input: '[1, 0, 3]', output: '2' },
          { input: '[0, 2, 3, 4]', output: '1' },
          { input: '[4, 3, 1, 0]', output: '2' },
          { input: '[2, 3, 1, 5, 0]', output: '4' },
          { input: '[0, 1, 2, 3, 4, 5, 6, 7, 9]', output: '8' },
          { input: `${JSON.stringify(Array.from({length: 201}, (_, i) => i === 150 ? 201 : i))}`, output: '150' }
        ]
      },
      {
        slug: 'union-of-two-sorted-arrays',
        extraTCs: [
          { input: '[1, 2], [2, 3]', output: '[1,2,3]' },
          { input: '[3, 5, 8], [2, 8, 9, 10]', output: '[2,3,5,8,9,10]' },
          { input: '[-5, -1, 0], [-2, 0, 4]', output: '[-5,-2,-1,0,4]' },
          { input: '[1, 1, 1], [1, 1, 1]', output: '[1]' },
          { input: '[0], [1]', output: '[0,1]' },
          { input: '[2, 4, 6], [1, 3, 5]', output: '[1,2,3,4,5,6]' },
          { input: '[10, 20], [5, 15, 25]', output: '[5,10,15,20,25]' },
          { input: '[-10, 0, 10], [-5, 0, 5]', output: '[-10,-5,0,5,10]' },
          { input: '[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]', output: '[1,2,3,4,5,6,7,8,9,10]' },
          { input: `${JSON.stringify(Array.from({length: 100}, (_, i) => i * 2))}, ${JSON.stringify(Array.from({length: 100}, (_, i) => i * 2 + 1))}`, output: JSON.stringify(Array.from({length: 200}, (_, i) => i)) }
        ]
      }
    ];

    for (const top of topUps) {
      const pRes = await client.query('SELECT id FROM problems WHERE slug = $1', [top.slug]);
      if (pRes.rows.length > 0) {
        const pid = pRes.rows[0].id;
        for (const tc of top.extraTCs) {
          await client.query(
            'INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, true)',
            [pid, tc.input, tc.output]
          );
        }
        console.log(`[TopUp] Added ${top.extraTCs.length} extra test cases to ${top.slug}`);
      }
    }

    await client.query('COMMIT');
    console.log('[Seed] All questions and 25 test cases successfully committed to DB!');

    // Check counts
    const { rows: verifyCounts } = await client.query(`
      SELECT p.slug, p.difficulty, count(t.id) as test_case_count 
      FROM problems p 
      LEFT JOIN test_cases t ON t.problem_id = p.id 
      WHERE p.slug IN (
        'largest-element-in-an-array',
        'second-largest-element-in-an-array',
        'check-if-array-is-sorted-and-rotated',
        'remove-duplicates-from-sorted-array',
        'left-rotate-an-array-by-one',
        'rotate-array',
        'move-zeroes',
        'linear-search',
        'union-of-two-sorted-arrays',
        'missing-number',
        'max-consecutive-ones',
        'longest-subarray-with-given-sum',
        'single-number',
        'two-sum',
        'sort-colors'
      )
      GROUP BY p.slug, p.difficulty
      ORDER BY test_case_count ASC
    `);
    console.table(verifyCounts);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
