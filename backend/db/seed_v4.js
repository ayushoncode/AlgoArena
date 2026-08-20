/**
 * backend/db/seed_v4.js — 10 new LeetCode-style problems with comprehensive test cases
 * Run: cd backend && node db/seed_v4.js
 */

'use strict'

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

const PROBLEMS = [
  /* ──────── ARRAYS · HARD ──────── */
  {
    title: 'Trapping Rain Water',
    topic: 'arrays', difficulty: 'hard',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

**Example 1:**
\`\`\`
Input:  height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
\`\`\`

**Example 2:**
\`\`\`
Input:  height = [4,2,0,3,2,5]
Output: 9
\`\`\`

**Constraints:**
- \`1 ≤ n ≤ 2 × 10⁴\`
- \`0 ≤ height[i] ≤ 10⁵\`

**Key Insight:** For each position, trapped water = \`min(maxLeft, maxRight) − height[i]\`. Use two-pointer approach for O(n) time, O(1) space.`,
    sample_input: '[0,1,0,2,1,0,1,3,2,1,2,1]', sample_output: '6',
    cases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6',  is_hidden: false },
      { input: '[4,2,0,3,2,5]',             output: '9',  is_hidden: false },
      { input: '[3,0,2,0,4]',               output: '7',  is_hidden: false },
      { input: '[0,0,0,0]',                 output: '0',  is_hidden: true  },
      { input: '[1,0,1]',                   output: '1',  is_hidden: true  },
      { input: '[5,4,1,2]',                 output: '1',  is_hidden: true  },
      { input: '[0,7,1,4,6]',               output: '7',  is_hidden: true  },
      { input: '[2,0,2]',                   output: '2',  is_hidden: true  },
      { input: '[1,0,0,0,1]',               output: '3',  is_hidden: true  },
      { input: '[4,9,4,5,0,6,6,5]',         output: '10', is_hidden: true  },
    ],
  },

  /* ──────── ARRAYS · HARD ──────── */
  {
    title: 'Median of Two Sorted Arrays',
    topic: 'arrays', difficulty: 'hard',
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of sizes \`m\` and \`n\`, return the **median** of the two sorted arrays. The solution must run in **O(log(m + n))** time.

**Example 1:**
\`\`\`
nums1 = [1,3], nums2 = [2]
Output: 2.0   (merged: [1,2,3])
\`\`\`

**Example 2:**
\`\`\`
nums1 = [1,2], nums2 = [3,4]
Output: 2.5   (merged: [1,2,3,4])
\`\`\`

**Constraints:**
- \`0 ≤ m, n ≤ 1000\`,  \`1 ≤ m + n ≤ 2000\`
- \`−10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶\`

**Key Insight:** Binary search on the smaller array to find the correct partition such that all left elements ≤ all right elements across both arrays. The median is the midpoint of the merge boundary.`,
    sample_input: '[1,3], [2]', sample_output: '2.0',
    cases: [
      { input: '[1,3], [2]',           output: '2.0',     is_hidden: false },
      { input: '[1,2], [3,4]',         output: '2.5',     is_hidden: false },
      { input: '[0,0], [0,0]',         output: '0.0',     is_hidden: false },
      { input: '[], [1]',              output: '1.0',     is_hidden: true  },
      { input: '[2], []',              output: '2.0',     is_hidden: true  },
      { input: '[1,3,5,7], [2,4,6,8]', output: '4.5',    is_hidden: true  },
      { input: '[1,2,6], [3,4,5]',     output: '3.5',    is_hidden: true  },
      { input: '[100000], [100001]',   output: '100000.5',is_hidden: true  },
    ],
  },

  /* ──────── STRINGS · HARD ──────── */
  {
    title: 'Minimum Window Substring',
    topic: 'strings', difficulty: 'hard',
    description: `Given two strings \`s\` and \`t\`, return the **minimum window substring** of \`s\` such that every character in \`t\` (including duplicates) is included in the window. If no such window exists, return \`""\`.

**Example 1:**
\`\`\`
s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
\`\`\`

**Example 2:**
\`\`\`
s = "a", t = "a"  →  Output: "a"
s = "a", t = "aa" →  Output: ""
\`\`\`

**Constraints:**
- \`1 ≤ s.length, t.length ≤ 10⁵\`
- \`s\` and \`t\` consist of uppercase/lowercase English letters

**Key Insight:** Sliding window — expand right to collect all chars of \`t\`, then shrink left to minimize. Track formed/required counts.`,
    sample_input: '"ADOBECODEBANC", "ABC"', sample_output: '"BANC"',
    cases: [
      { input: '"ADOBECODEBANC", "ABC"',          output: '"BANC"',  is_hidden: false },
      { input: '"a", "a"',                        output: '"a"',     is_hidden: false },
      { input: '"a", "aa"',                       output: '""',      is_hidden: false },
      { input: '"AAABBBCC", "ABC"',               output: '"BBC"',   is_hidden: true  },
      { input: '"aa", "aa"',                      output: '"aa"',    is_hidden: true  },
      { input: '"bba", "ab"',                     output: '"ba"',    is_hidden: true  },
      { input: '"cabwefgewcwaefgcf", "cae"',       output: '"cwae"',  is_hidden: true  },
      { input: '"xyz", "z"',                      output: '"z"',     is_hidden: true  },
    ],
  },

  /* ──────── STRINGS · MEDIUM ──────── */
  {
    title: 'Group Anagrams',
    topic: 'strings', difficulty: 'medium',
    description: `Given an array of strings \`strs\`, group the **anagrams** together. You can return the answer in **any order**.

An anagram uses all the original letters exactly once (rearranged).

**Example:**
\`\`\`
Input:  ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
\`\`\`

**Constraints:**
- \`1 ≤ strs.length ≤ 10⁴\`
- \`0 ≤ strs[i].length ≤ 100\`
- \`strs[i]\` consists of lowercase English letters

**Key Insight:** Sort each string's characters and use as a hash map key. All anagrams share the same sorted signature.`,
    sample_input: '["eat","tea","tan","ate","nat","bat"]',
    sample_output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
    cases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', is_hidden: false },
      { input: '[""]',                                  output: '[[""]]',                                    is_hidden: false },
      { input: '["a"]',                                 output: '[["a"]]',                                   is_hidden: false },
      { input: '["abc","bca","cab","xyz","yzx"]',       output: '[["abc","bca","cab"],["xyz","yzx"]]',        is_hidden: true  },
      { input: '["ab","ba","aa"]',                      output: '[["ab","ba"],["aa"]]',                       is_hidden: true  },
      { input: '["one","neo","eon","two"]',              output: '[["one","neo","eon"],["two"]]',              is_hidden: true  },
    ],
  },

  /* ──────── LINKED-LISTS · MEDIUM ──────── */
  {
    title: 'Add Two Numbers',
    topic: 'linked-lists', difficulty: 'medium',
    description: `You are given two **non-empty** linked lists of non-negative integers stored in **reverse order**. Add the two numbers and return their sum as a linked list (also in reverse order).

**Example 1:**
\`\`\`
l1 = [2,4,3]  →  342
l2 = [5,6,4]  →  465
Sum = 807  →  Output: [7,0,8]
\`\`\`

**Example 2:**
\`\`\`
l1 = [9,9,9,9,9], l2 = [9,9,9,9]
Output: [8,9,9,9,0,1]
\`\`\`

**Constraints:**
- 1 ≤ number of nodes ≤ 100 in each list
- 0 ≤ Node.val ≤ 9, no leading zeros

**Note:** For our sandbox, inputs/output are plain integer arrays representing digit lists.`,
    sample_input: '[2,4,3], [5,6,4]', sample_output: '[7,0,8]',
    cases: [
      { input: '[2,4,3], [5,6,4]',       output: '[7,0,8]',       is_hidden: false },
      { input: '[0], [0]',                output: '[0]',           is_hidden: false },
      { input: '[9,9,9,9,9], [9,9,9,9]', output: '[8,9,9,9,0,1]', is_hidden: false },
      { input: '[1], [9,9]',             output: '[0,0,1]',       is_hidden: true  },
      { input: '[5], [5]',               output: '[0,1]',         is_hidden: true  },
      { input: '[1,8], [0]',             output: '[1,8]',         is_hidden: true  },
      { input: '[9,9], [1]',             output: '[0,0,1]',       is_hidden: true  },
    ],
  },

  /* ──────── TREES · HARD ──────── */
  {
    title: 'Binary Tree Maximum Path Sum',
    topic: 'trees', difficulty: 'hard',
    description: `A **path** in a binary tree is a sequence of nodes where each adjacent pair shares an edge. Nodes can appear at most once. The **path sum** is the sum of all node values.

Return the **maximum path sum** over any non-empty path.

**Example 1:**
\`\`\`
     1
    / \\
   2   3
Output: 6  (path 2→1→3)
\`\`\`

**Example 2:**
\`\`\`
      -10
      /  \\
     9   20
        /  \\
       15   7
Output: 42  (path 15→20→7)
\`\`\`

**Constraints:**
- 1 to 3×10⁴ nodes, −1000 ≤ Node.val ≤ 1000

**Note:** Input is a level-order array (null for missing nodes).`,
    sample_input: '[1,2,3]', sample_output: '6',
    cases: [
      { input: '[1,2,3]',                          output: '6',   is_hidden: false },
      { input: '[-10,9,20,null,null,15,7]',        output: '42',  is_hidden: false },
      { input: '[1]',                              output: '1',   is_hidden: false },
      { input: '[-3]',                             output: '-3',  is_hidden: true  },
      { input: '[5,4,8,11,null,13,4,7,2,null,null,null,1]', output: '48', is_hidden: true },
      { input: '[-1,-2,-3]',                      output: '-1',  is_hidden: true  },
      { input: '[2,-1]',                           output: '2',   is_hidden: true  },
    ],
  },

  /* ──────── TREES · MEDIUM ──────── */
  {
    title: 'Validate Binary Search Tree',
    topic: 'trees', difficulty: 'medium',
    description: `Given the root of a binary tree, determine if it is a valid **Binary Search Tree (BST)**.

A valid BST requires:
- Left subtree only contains nodes with keys **strictly less than** the node's key.
- Right subtree only contains nodes with keys **strictly greater than** the node's key.
- Both subtrees must themselves be valid BSTs.

**Example 1:**
\`\`\`
    2
   / \\
  1   3
Output: true
\`\`\`

**Example 2:**
\`\`\`
    5
   / \\
  1   4
     / \\
    3   6
Output: false  (node 4 violates 4 < 5 constraint)
\`\`\`

**Constraints:**
- −2³¹ ≤ Node.val ≤ 2³¹ − 1
- 1 to 10⁴ nodes

**Note:** Input is a level-order array.`,
    sample_input: '[2,1,3]', sample_output: 'true',
    cases: [
      { input: '[2,1,3]',               output: 'true',  is_hidden: false },
      { input: '[5,1,4,null,null,3,6]', output: 'false', is_hidden: false },
      { input: '[1]',                   output: 'true',  is_hidden: false },
      { input: '[5,4,6,null,null,3,7]', output: 'false', is_hidden: true  },
      { input: '[2,2,2]',               output: 'false', is_hidden: true  },
      { input: '[10,5,15,null,null,6,20]', output: 'false', is_hidden: true },
      { input: '[100,-100,200]',        output: 'true',  is_hidden: true  },
      { input: '[1,null,1]',           output: 'false', is_hidden: true  },
    ],
  },

  /* ──────── DP · HARD ──────── */
  {
    title: 'Longest Increasing Subsequence',
    topic: 'dp', difficulty: 'hard',
    description: `Given an integer array \`nums\`, return the length of the **longest strictly increasing subsequence**.

A subsequence keeps relative order but need not be contiguous.

**Example 1:**
\`\`\`
nums = [10,9,2,5,3,7,101,18]
Output: 4   (e.g. [2,3,7,101])
\`\`\`

**Example 2:**
\`\`\`
nums = [0,1,0,3,2,3]
Output: 4   ([0,1,2,3])
\`\`\`

**Example 3:**
\`\`\`
nums = [7,7,7,7,7]
Output: 1
\`\`\`

**Constraints:**
- \`1 ≤ nums.length ≤ 2500\`, \`−10⁴ ≤ nums[i] ≤ 10⁴\`

**Key Insight:** O(n²) DP with \`dp[i] = max(dp[j]+1) for j<i, nums[j]<nums[i]\`. Optimal O(n log n) uses binary search on a "tails" array (patience sort).`,
    sample_input: '[10,9,2,5,3,7,101,18]', sample_output: '4',
    cases: [
      { input: '[10,9,2,5,3,7,101,18]', output: '4', is_hidden: false },
      { input: '[0,1,0,3,2,3]',         output: '4', is_hidden: false },
      { input: '[7,7,7,7,7,7,7]',       output: '1', is_hidden: false },
      { input: '[1,3,6,7,9,4,10,5,6]',  output: '6', is_hidden: true  },
      { input: '[3,10,2,1,20]',          output: '3', is_hidden: true  },
      { input: '[50,3,10,7,40,80]',      output: '4', is_hidden: true  },
      { input: '[1]',                    output: '1', is_hidden: true  },
      { input: '[5,4,3,2,1]',           output: '1', is_hidden: true  },
      { input: '[1,2,3,4,5]',           output: '5', is_hidden: true  },
      { input: '[2,2,2,5,5,5,6]',       output: '3', is_hidden: true  },
    ],
  },

  /* ──────── DP · MEDIUM ──────── */
  {
    title: 'Unique Paths',
    topic: 'dp', difficulty: 'medium',
    description: `A robot starts at the **top-left** of an \`m × n\` grid and must reach the **bottom-right**. It can only move **right** or **down** at each step.

Return the number of **unique paths**.

**Example 1:**
\`\`\`
m = 3, n = 7  →  Output: 28
\`\`\`

**Example 2:**
\`\`\`
m = 3, n = 2
Paths: R→D→D, D→R→D, D→D→R  →  Output: 3
\`\`\`

**Constraints:**
- \`1 ≤ m, n ≤ 100\`

**Key Insight:** \`dp[i][j] = dp[i-1][j] + dp[i][j-1]\` (from above + from left). The answer equals the binomial coefficient \`C(m+n-2, m-1)\`.`,
    sample_input: '3, 7', sample_output: '28',
    cases: [
      { input: '3, 7',   output: '28',   is_hidden: false },
      { input: '3, 2',   output: '3',    is_hidden: false },
      { input: '1, 1',   output: '1',    is_hidden: false },
      { input: '2, 2',   output: '2',    is_hidden: true  },
      { input: '10, 10', output: '48620',is_hidden: true  },
      { input: '1, 100', output: '1',    is_hidden: true  },
      { input: '100, 1', output: '1',    is_hidden: true  },
      { input: '5, 5',   output: '70',   is_hidden: true  },
      { input: '4, 3',   output: '10',   is_hidden: true  },
    ],
  },

  /* ──────── GRAPHS · HARD ──────── */
  {
    title: 'Word Ladder',
    topic: 'graphs', difficulty: 'hard',
    description: `A **transformation sequence** from \`beginWord\` to \`endWord\` (using \`wordList\`) is a sequence where:
- Every adjacent pair of words differs by **exactly one letter**
- Every word in the sequence must be in \`wordList\`

Return the **length of the shortest transformation sequence**, or \`0\` if impossible.

**Example 1:**
\`\`\`
beginWord = "hit", endWord = "cog"
wordList  = ["hot","dot","dog","lot","log","cog"]
Output: 5   (hit → hot → dot → dog → cog)
\`\`\`

**Example 2:**
\`\`\`
beginWord = "hit", endWord = "cog"
wordList  = ["hot","dot","dog","lot","log"]
Output: 0   ("cog" not in wordList)
\`\`\`

**Constraints:**
- \`1 ≤ beginWord.length ≤ 10\`
- All words have the same length
- \`1 ≤ wordList.length ≤ 5000\`

**Key Insight:** BFS level-by-level. At each step try all one-letter mutations; if in wordSet → enqueue. Level count gives shortest path length.`,
    sample_input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]',
    sample_output: '5',
    cases: [
      { input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', output: '5', is_hidden: false },
      { input: '"hit", "cog", ["hot","dot","dog","lot","log"]',       output: '0', is_hidden: false },
      { input: '"a", "c", ["a","b","c"]',                            output: '2', is_hidden: false },
      { input: '"hot", "dog", ["hot","dog"]',                         output: '0', is_hidden: true  },
      { input: '"hot", "dog", ["hot","hog","dog"]',                   output: '3', is_hidden: true  },
      { input: '"abc", "abc", ["abc"]',                               output: '1', is_hidden: true  },
    ],
  },
]

async function seed() {
  const client = await pool.connect()
  let problemsInserted = 0, problemsSkipped = 0, casesInserted = 0, casesReplaced = 0
  console.log('\n🌱  Seeding ' + PROBLEMS.length + ' new problems …\n')
  try {
    await client.query('BEGIN')
    for (const p of PROBLEMS) {
      const { rows: existing } = await client.query('SELECT id FROM problems WHERE title = $1', [p.title])
      let problemId
      if (existing.length > 0) {
        problemId = existing[0].id
        problemsSkipped++
        console.log('  ⟳  (exists) ' + p.title)
      } else {
        const { rows } = await client.query(
          'INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [p.title, p.description, p.topic, p.difficulty, p.sample_input, p.sample_output]
        )
        problemId = rows[0].id
        problemsInserted++
        console.log('  +  (new)    ' + p.title + '  [' + p.topic + '/' + p.difficulty + ']')
      }
      const { rowCount: deleted } = await client.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId])
      casesReplaced += deleted
      for (const tc of p.cases) {
        await client.query('INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)', [problemId, tc.input, tc.output, tc.is_hidden])
        casesInserted++
      }
    }
    await client.query('COMMIT')
    console.log('\n╔══════════════════════════════════════════════╗')
    console.log('║  Seed v4 complete                            ║')
    console.log('║  Problems new:     ' + String(problemsInserted).padEnd(26) + '║')
    console.log('║  Problems skipped: ' + String(problemsSkipped).padEnd(26) + '║')
    console.log('║  Test cases added: ' + String(casesInserted).padEnd(26) + '║')
    console.log('╚══════════════════════════════════════════════╝\n')
    const { rows: coverage } = await client.query(`
      SELECT topic, difficulty, COUNT(*) AS problems,
             SUM((SELECT COUNT(*) FROM test_cases t WHERE t.problem_id = p.id)) AS test_cases
      FROM problems p GROUP BY topic, difficulty ORDER BY topic, difficulty
    `)
    console.log('Final coverage:')
    coverage.forEach(r => console.log('  ' + r.topic.padEnd(17) + ' ' + r.difficulty.padEnd(8) + ' ' + String(r.problems).padEnd(3) + ' problems  ' + r.test_cases + ' tests'))
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('\n✗ Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}
seed()
