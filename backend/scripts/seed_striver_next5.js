const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const problemsToSeed = [
  {
    title: 'Linear Search',
    slug: 'linear-search',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given an array of integers \`nums\` and an integer \`k\`, find the index of the first occurrence of \`k\` in the array. If \`k\` is not present in the array, return \`-1\`.

### Example 1
\`\`\`
Input: nums = [1, 2, 3, 4, 5], k = 3
Output: 2
Explanation: 3 is present at index 2 (0-indexed).
\`\`\`

### Example 2
\`\`\`
Input: nums = [5, 4, 3, 2, 1], k = 5
Output: 0
Explanation: 5 is present at index 0.
\`\`\`

### Example 3
\`\`\`
Input: nums = [10, 20, 30, 40], k = 25
Output: -1
Explanation: 25 is not present in the array.
\`\`\`

### Constraints
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= k <= 10^9\`

### Hints
1. Traverse through the array from left to right (index \`0\` to \`n - 1\`).
2. If \`nums[i] === k\`, return \`i\`.
3. If the loop terminates without finding \`k\`, return \`-1\`. Time complexity is O(N) and space complexity is O(1).
`,
    sample_input: '[1, 2, 3, 4, 5], 3',
    sample_output: '2',
    hints: [
      'Iterate through the array from left to right.',
      'Check if the current element equals k; if so, return its index.',
      'If you reach the end without finding k, return -1.'
    ],
    testCases: [
      { input: '[1, 2, 3, 4, 5], 3', output: '2', is_hidden: false },
      { input: '[5, 4, 3, 2, 1], 5', output: '0', is_hidden: false },
      { input: '[10, 20, 30, 40], 25', output: '-1', is_hidden: false },
      { input: '[7], 7', output: '0', is_hidden: true },
      { input: '[7], 8', output: '-1', is_hidden: true },
      { input: '[1, 2, 3, 4, 5], 5', output: '4', is_hidden: true },
      { input: '[-5, -2, 0, 3, 8], -2', output: '1', is_hidden: true },
      { input: '[-5, -2, 0, 3, 8], 0', output: '2', is_hidden: true },
      { input: '[-5, -2, 0, 3, 8], -10', output: '-1', is_hidden: true },
      { input: '[4, 4, 4, 4, 4], 4', output: '0', is_hidden: true },
      { input: '[100, 200, 300, 400, 500, 600], 600', output: '5', is_hidden: true },
      { input: '[1, 3, 5, 7, 9, 11, 13, 15], 8', output: '-1', is_hidden: true },
      { input: '[0, -1, 1, -2, 2], -2', output: '3', is_hidden: true },
      { input: '[42], 42', output: '0', is_hidden: true },
      { input: '[10, 20, 30, 40, 50], 99', output: '-1', is_hidden: true }
    ]
  },
  {
    title: 'Union of Two Sorted Arrays',
    slug: 'union-of-two-sorted-arrays',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given two sorted arrays of integers \`nums1\` and \`nums2\`, return their **union** as a sorted array containing only distinct elements present in either array.

### Example 1
\`\`\`
Input: nums1 = [1, 2, 3, 4, 5], nums2 = [1, 2, 3]
Output: [1, 2, 3, 4, 5]
Explanation: Distinct elements present in either array are 1, 2, 3, 4, 5.
\`\`\`

### Example 2
\`\`\`
Input: nums1 = [2, 2, 3, 4, 5], nums2 = [1, 1, 2, 3, 4]
Output: [1, 2, 3, 4, 5]
Explanation: Distinct elements from both arrays in sorted order are 1, 2, 3, 4, 5.
\`\`\`

### Example 3
\`\`\`
Input: nums1 = [1, 1, 1, 1, 1], nums2 = [2, 2, 2, 2, 2]
Output: [1, 2]
Explanation: The distinct elements are 1 and 2.
\`\`\`

### Constraints
- \`1 <= nums1.length, nums2.length <= 10^5\`
- \`-10^9 <= nums1[i], nums2[i] <= 10^9\`
- Both \`nums1\` and \`nums2\` are sorted in non-decreasing order.

### Hints
1. Use a two-pointer approach: pointer \`i\` for \`nums1\` and pointer \`j\` for \`nums2\`.
2. Compare \`nums1[i]\` and \`nums2[j]\`. Append the smaller element to the result if it hasn't already been added.
3. Advance pointers past duplicates. Time complexity is O(N + M) and space complexity is O(N + M).
`,
    sample_input: '[1, 2, 3, 4, 5], [1, 2, 3]',
    sample_output: '[1, 2, 3, 4, 5]',
    hints: [
      'Use two pointers to traverse both sorted arrays simultaneously.',
      'Only insert elements that are not already equal to the last inserted element.',
      'Handle any leftover elements after one array finishes.'
    ],
    testCases: [
      { input: '[1, 2, 3, 4, 5], [1, 2, 3]', output: '[1,2,3,4,5]', is_hidden: false },
      { input: '[2, 2, 3, 4, 5], [1, 1, 2, 3, 4]', output: '[1,2,3,4,5]', is_hidden: false },
      { input: '[1, 1, 1, 1, 1], [2, 2, 2, 2, 2]', output: '[1,2]', is_hidden: false },
      { input: '[1], [2]', output: '[1,2]', is_hidden: true },
      { input: '[1], [1]', output: '[1]', is_hidden: true },
      { input: '[1, 2, 3], [4, 5, 6]', output: '[1,2,3,4,5,6]', is_hidden: true },
      { input: '[-5, -3, -1], [-4, -2, 0]', output: '[-5,-4,-3,-2,-1,0]', is_hidden: true },
      { input: '[-3, -1, 0, 2], [-3, 0, 5]', output: '[-3,-1,0,2,5]', is_hidden: true },
      { input: '[1, 3, 5, 7], [2, 4, 6, 8]', output: '[1,2,3,4,5,6,7,8]', is_hidden: true },
      { input: '[1, 2, 2, 2, 3], [2, 3, 3, 4]', output: '[1,2,3,4]', is_hidden: true },
      { input: '[5, 10, 15], [5, 10, 15]', output: '[5,10,15]', is_hidden: true },
      { input: '[0], [0, 1]', output: '[0,1]', is_hidden: true },
      { input: '[10], [5, 10, 15, 20]', output: '[5,10,15,20]', is_hidden: true },
      { input: '[-10, -5, 0, 5, 10], [-20, -10, 0, 10, 20]', output: '[-20,-10,-5,0,5,10,20]', is_hidden: true },
      { input: '[1, 4, 5], [2, 3, 6, 7]', output: '[1,2,3,4,5,6,7]', is_hidden: true }
    ]
  },
  {
    title: 'Missing Number',
    slug: 'missing-number',
    topic: 'arrays',
    difficulty: 'easy',
    statement: `Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return *the only number in the range that is missing from the array*.

### Example 1
\`\`\`
Input: nums = [3, 0, 1]
Output: 2
Explanation: n = 3 since there are 3 numbers, so all numbers are in the range [0, 3]. 2 is the missing number in the range since it does not appear in nums.
\`\`\`

### Example 2
\`\`\`
Input: nums = [0, 1]
Output: 2
Explanation: n = 2 since there are 2 numbers, so all numbers are in the range [0, 2]. 2 is the missing number in the range since it does not appear in nums.
\`\`\`

### Example 3
\`\`\`
Input: nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]
Output: 8
Explanation: n = 9 since there are 9 numbers, so all numbers are in the range [0, 9]. 8 is the missing number in the range since it does not appear in nums.
\`\`\`

### Constraints
- \`n == nums.length\`
- \`1 <= n <= 10^4\`
- \`0 <= nums[i] <= n\`
- All the numbers of \`nums\` are **unique**.

### Hints
1. The sum of the first \`n\` integers is given by \`n * (n + 1) / 2\`.
2. Compute the expected sum and subtract the sum of all elements in \`nums\`.
3. The difference is the missing number! Alternatively, use XOR bit manipulation. Time complexity is O(N) and space complexity is O(1).
`,
    sample_input: '[3, 0, 1]',
    sample_output: '2',
    hints: [
      'Calculate the expected sum n * (n + 1) / 2.',
      'Subtract the actual sum of the array from the expected sum.',
      'Or use XOR: XOR all indices 0..n and all numbers in nums; the remaining value is the missing number.'
    ],
    testCases: [
      { input: '[3, 0, 1]', output: '2', is_hidden: false },
      { input: '[0, 1]', output: '2', is_hidden: false },
      { input: '[9, 6, 4, 2, 3, 5, 7, 0, 1]', output: '8', is_hidden: false },
      { input: '[0]', output: '1', is_hidden: true },
      { input: '[1]', output: '0', is_hidden: true },
      { input: '[1, 2]', output: '0', is_hidden: true },
      { input: '[0, 2]', output: '1', is_hidden: true },
      { input: '[0, 1, 2, 3]', output: '4', is_hidden: true },
      { input: '[4, 3, 2, 1]', output: '0', is_hidden: true },
      { input: '[4, 0, 2, 1]', output: '3', is_hidden: true },
      { input: '[5, 4, 3, 2, 1]', output: '0', is_hidden: true },
      { input: '[0, 1, 3, 4, 5, 6, 7, 8, 9]', output: '2', is_hidden: true },
      { input: '[8, 6, 4, 2, 3, 5, 7, 0, 1]', output: '9', is_hidden: true },
      { input: '[2, 0, 1, 4]', output: '3', is_hidden: true },
      { input: '[1, 0, 3, 2, 5]', output: '4', is_hidden: true }
    ]
  }
];

async function runSeed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update rotate-array and move-zeroes difficulty & topic
    await client.query(`
      UPDATE problems 
      SET difficulty = 'easy', topic = 'arrays' 
      WHERE slug IN ('rotate-array', 'move-zeroes')
    `);
    console.log('[Seed] Updated rotate-array and move-zeroes to difficulty=easy, topic=arrays');

    // 2. Insert or update the 3 problems
    for (const p of problemsToSeed) {
      const existing = await client.query('SELECT id FROM problems WHERE slug = $1', [p.slug]);
      let problemId;

      if (existing.rows.length > 0) {
        problemId = existing.rows[0].id;
        await client.query(
          `UPDATE problems 
           SET title = $1, topic = $2, difficulty = $3, description = $4, 
               sample_input = $5, sample_output = $6, hints = $7 
           WHERE id = $8`,
          [p.title, p.topic, p.difficulty, p.statement, p.sample_input, p.sample_output, JSON.stringify(p.hints), problemId]
        );
        console.log(`[Seed] Updated problem ${p.slug} (${problemId})`);
      } else {
        const ins = await client.query(
          `INSERT INTO problems (title, slug, topic, difficulty, description, sample_input, sample_output, hints, min_rating, max_rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 9999)
           RETURNING id`,
          [p.title, p.slug, p.topic, p.difficulty, p.statement, p.sample_input, p.sample_output, JSON.stringify(p.hints)]
        );
        problemId = ins.rows[0].id;
        console.log(`[Seed] Inserted problem ${p.slug} (${problemId})`);
      }

      // Re-seed test cases
      await client.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
      for (const tc of p.testCases) {
        await client.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
          [problemId, tc.input, tc.output, tc.is_hidden]
        );
      }
      console.log(`[Seed] Added ${p.testCases.length} test cases for ${p.slug}`);
    }

    await client.query('COMMIT');
    console.log('[Seed] All questions and test cases successfully committed!');

    // Print all 10 easy problems with their UUIDs
    const { rows: all10 } = await client.query(`
      SELECT id, title, slug, topic, difficulty, sample_input, sample_output 
      FROM problems 
      WHERE slug IN (
        'largest-element-in-an-array',
        'second-largest-element-in-an-array',
        'check-if-array-is-sorted-and-rotated',
        'remove-duplicates-from-sorted-array',
        'left-rotate-an-array-by-one',
        'rotate-array',
        'move-zeroes',
        'linear-search',
        'union-of-two-sorted-arrays',
        'missing-number'
      )
    `);
    console.log('\n--- 10 Striver Arrays (Easy) in DB ---');
    console.table(all10);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runSeed();
