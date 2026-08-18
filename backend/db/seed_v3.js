/**
 * backend/db/seed_v3.js — Comprehensive problem + test case seed
 *
 * Adds 30 problems across all 8 topics × 3 difficulties,
 * with 5–7 test cases per problem (mix of visible + hidden).
 *
 * All inputs use the sandbox calling convention:
 *   function solution(...args) where args = JSON.parse('[' + input + ']')
 *
 * Run:
 *   cd backend && node db/seed_v3.js
 */

'use strict'

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

// ═══════════════════════════════════════════════════════════════════
// PROBLEMS DATA
// Each entry: { title, description, topic, difficulty, sample_input,
//               sample_output, cases: [{ input, output, is_hidden }] }
//
// Input format: comma-separated JS literal args passed to solution()
//   e.g. '[1,2,3], 6'  → solution([1,2,3], 6)
// ═══════════════════════════════════════════════════════════════════
const PROBLEMS = [

  /* ──────────────────────────── ARRAYS ─────────────────────────── */
  {
    title: 'Two Sum',
    topic: 'arrays', difficulty: 'easy',
    description: `Given an array of integers \`nums\` and a target integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

You may assume each input has exactly one solution, and you may not use the same element twice. Return the answer in any order.

**Example:**
\`\`\`
nums = [2,7,11,15], target = 9
Output: [0,1]
\`\`\`

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴
- −10⁹ ≤ nums[i] ≤ 10⁹
- Exactly one valid answer exists`,
    sample_input: '[2,7,11,15], 9', sample_output: '[0,1]',
    cases: [
      { input: '[2,7,11,15], 9',   output: '[0,1]',  is_hidden: false },
      { input: '[3,2,4], 6',       output: '[1,2]',  is_hidden: false },
      { input: '[3,3], 6',         output: '[0,1]',  is_hidden: false },
      { input: '[1,2,3,4,5], 9',   output: '[3,4]',  is_hidden: true  },
      { input: '[-1,-2,-3,-4,-5], -8', output: '[2,4]', is_hidden: true },
      { input: '[0,4,3,0], 0',     output: '[0,3]',  is_hidden: true  },
    ],
  },

  {
    title: 'Best Time to Buy and Sell Stock',
    topic: 'arrays', difficulty: 'easy',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a stock on day \`i\`. Return the **maximum profit** you can achieve from one buy-sell transaction. If no profit is possible, return \`0\`.

**Example:**
\`\`\`
prices = [7,1,5,3,6,4]
Output: 5  (buy day 1 at 1, sell day 4 at 6)
\`\`\`

**Constraints:**
- 1 ≤ prices.length ≤ 10⁵
- 0 ≤ prices[i] ≤ 10⁴`,
    sample_input: '[7,1,5,3,6,4]', sample_output: '5',
    cases: [
      { input: '[7,1,5,3,6,4]', output: '5', is_hidden: false },
      { input: '[7,6,4,3,1]',   output: '0', is_hidden: false },
      { input: '[1,2]',         output: '1', is_hidden: false },
      { input: '[2,4,1]',       output: '2', is_hidden: true  },
      { input: '[3,3,3,3]',     output: '0', is_hidden: true  },
      { input: '[1,2,3,4,5]',   output: '4', is_hidden: true  },
    ],
  },

  {
    title: 'Container With Most Water',
    topic: 'arrays', difficulty: 'medium',
    description: `You are given an integer array \`height\` of length \`n\`. Find two lines that together with the x-axis form a container that **holds the most water**. Return the maximum amount of water.

**Example:**
\`\`\`
height = [1,8,6,2,5,4,8,3,7]
Output: 49
\`\`\`

**Constraints:**
- 2 ≤ n ≤ 10⁵
- 0 ≤ height[i] ≤ 10⁴`,
    sample_input: '[1,8,6,2,5,4,8,3,7]', sample_output: '49',
    cases: [
      { input: '[1,8,6,2,5,4,8,3,7]', output: '49', is_hidden: false },
      { input: '[1,1]',               output: '1',  is_hidden: false },
      { input: '[4,3,2,1,4]',         output: '16', is_hidden: false },
      { input: '[1,2,1]',             output: '2',  is_hidden: true  },
      { input: '[1,3,2,5,25,24,5]',   output: '24', is_hidden: true  },
      { input: '[2,3,4,5,18,17,6]',   output: '17', is_hidden: true  },
    ],
  },

  {
    title: 'Maximum Subarray',
    topic: 'arrays', difficulty: 'medium',
    description: `Given an integer array \`nums\`, find the **contiguous subarray** with the largest sum and return its sum. (Kadane's algorithm)

**Example:**
\`\`\`
nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6  (subarray [4,-1,2,1])
\`\`\`

**Constraints:**
- 1 ≤ nums.length ≤ 10⁵
- −10⁴ ≤ nums[i] ≤ 10⁴`,
    sample_input: '[-2,1,-3,4,-1,2,1,-5,4]', sample_output: '6',
    cases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6',  is_hidden: false },
      { input: '[1]',                      output: '1',  is_hidden: false },
      { input: '[5,4,-1,7,8]',             output: '23', is_hidden: false },
      { input: '[-1,-2,-3]',               output: '-1', is_hidden: true  },
      { input: '[1,-1,1,-1,1]',            output: '1',  is_hidden: true  },
      { input: '[0,0,0]',                  output: '0',  is_hidden: true  },
    ],
  },

  {
    title: 'Product of Array Except Self',
    topic: 'arrays', difficulty: 'hard',
    description: `Given an integer array \`nums\`, return an array \`output\` where \`output[i]\` is the product of all elements except \`nums[i]\`. You must solve it in **O(n)** without using the division operator.

**Example:**
\`\`\`
nums = [1,2,3,4]
Output: [24,12,8,6]
\`\`\`

**Constraints:**
- 2 ≤ nums.length ≤ 10⁵
- −30 ≤ nums[i] ≤ 30
- The product of any prefix/suffix fits in a 32-bit integer`,
    sample_input: '[1,2,3,4]', sample_output: '[24,12,8,6]',
    cases: [
      { input: '[1,2,3,4]',    output: '[24,12,8,6]',   is_hidden: false },
      { input: '[-1,1,0,-3,3]', output: '[0,0,9,0,0]',  is_hidden: false },
      { input: '[2,3,4,5]',    output: '[60,40,30,24]', is_hidden: false },
      { input: '[1,1,1,1]',    output: '[1,1,1,1]',     is_hidden: true  },
      { input: '[0,0]',        output: '[0,0]',          is_hidden: true  },
      { input: '[2,2,2]',      output: '[4,4,4]',        is_hidden: true  },
    ],
  },

  /* ──────────────────────────── STRINGS ────────────────────────── */
  {
    title: 'Valid Anagram',
    topic: 'strings', difficulty: 'easy',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

**Example:**
\`\`\`
s = "anagram", t = "nagaram"
Output: true
\`\`\`

**Constraints:**
- 1 ≤ s.length, t.length ≤ 5 × 10⁴
- s and t consist of lowercase English letters`,
    sample_input: '"anagram", "nagaram"', sample_output: 'true',
    cases: [
      { input: '"anagram", "nagaram"', output: 'true',  is_hidden: false },
      { input: '"rat", "car"',         output: 'false', is_hidden: false },
      { input: '"a", "a"',             output: 'true',  is_hidden: false },
      { input: '"ab", "a"',            output: 'false', is_hidden: true  },
      { input: '"listen", "silent"',   output: 'true',  is_hidden: true  },
      { input: '"hello", "ollhe"',     output: 'true',  is_hidden: true  },
      { input: '"aaz", "zza"',         output: 'false', is_hidden: true  },
    ],
  },

  {
    title: 'Longest Substring Without Repeating Characters',
    topic: 'strings', difficulty: 'medium',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

**Example:**
\`\`\`
s = "abcabcbb"
Output: 3  ("abc")
\`\`\`

**Constraints:**
- 0 ≤ s.length ≤ 5 × 10⁴
- s consists of English letters, digits, symbols and spaces`,
    sample_input: '"abcabcbb"', sample_output: '3',
    cases: [
      { input: '"abcabcbb"', output: '3', is_hidden: false },
      { input: '"bbbbb"',    output: '1', is_hidden: false },
      { input: '"pwwkew"',   output: '3', is_hidden: false },
      { input: '""',         output: '0', is_hidden: true  },
      { input: '" "',        output: '1', is_hidden: true  },
      { input: '"dvdf"',     output: '3', is_hidden: true  },
      { input: '"aab"',      output: '2', is_hidden: true  },
    ],
  },

  {
    title: 'Valid Parentheses',
    topic: 'strings', difficulty: 'easy',
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is **valid**.

An input string is valid if:
1. Open brackets are closed by the same type of brackets
2. Open brackets are closed in the correct order
3. Every close bracket has a corresponding open bracket

**Example:**
\`\`\`
s = "()[]{}"
Output: true
\`\`\`

**Constraints:**
- 1 ≤ s.length ≤ 10⁴
- s consists of parentheses only`,
    sample_input: '"()[]{}"', sample_output: 'true',
    cases: [
      { input: '"()[]{}"',  output: 'true',  is_hidden: false },
      { input: '"(]"',      output: 'false', is_hidden: false },
      { input: '"([])"',    output: 'true',  is_hidden: false },
      { input: '"{[]}"',    output: 'true',  is_hidden: true  },
      { input: '"([)]"',    output: 'false', is_hidden: true  },
      { input: '"{"',       output: 'false', is_hidden: true  },
      { input: '"]"',       output: 'false', is_hidden: true  },
    ],
  },

  {
    title: 'Longest Palindromic Substring',
    topic: 'strings', difficulty: 'medium',
    description: `Given a string \`s\`, return the **longest palindromic substring** in \`s\`.

**Example:**
\`\`\`
s = "babad"
Output: "bab"  (or "aba" — both are valid)
\`\`\`

**Constraints:**
- 1 ≤ s.length ≤ 1000
- s consists of digits and English letters`,
    sample_input: '"babad"', sample_output: '"bab"',
    cases: [
      { input: '"babad"',   output: '"bab"',   is_hidden: false },
      { input: '"cbbd"',    output: '"bb"',    is_hidden: false },
      { input: '"a"',       output: '"a"',     is_hidden: false },
      { input: '"racecar"', output: '"racecar"', is_hidden: true },
      { input: '"abcba"',   output: '"abcba"', is_hidden: true  },
      { input: '"ac"',      output: '"a"',     is_hidden: true  },
    ],
  },

  {
    title: 'Word Break',
    topic: 'strings', difficulty: 'hard',
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

**Example:**
\`\`\`
s = "leetcode", wordDict = ["leet","code"]
Output: true
\`\`\`

**Constraints:**
- 1 ≤ s.length ≤ 300
- 1 ≤ wordDict.length ≤ 1000
- 1 ≤ wordDict[i].length ≤ 20`,
    sample_input: '"leetcode", ["leet","code"]', sample_output: 'true',
    cases: [
      { input: '"leetcode", ["leet","code"]',       output: 'true',  is_hidden: false },
      { input: '"applepenapple", ["apple","pen"]',   output: 'true',  is_hidden: false },
      { input: '"catsandog", ["cats","dog","sand","and","cat"]', output: 'false', is_hidden: false },
      { input: '"cars", ["car","ca","rs"]',          output: 'true',  is_hidden: true  },
      { input: '"a", ["b"]',                        output: 'false', is_hidden: true  },
      { input: '"aaaa", ["a","aa"]',                output: 'true',  is_hidden: true  },
    ],
  },

  /* ──────────────────────────── LINKED LISTS ───────────────────── */
  {
    title: 'Reverse Linked List',
    topic: 'linked-lists', difficulty: 'easy',
    description: `Given the head of a singly linked list (represented as an array), reverse the list.

**Example:**
\`\`\`
Input:  [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 5000
- −5000 ≤ Node.val ≤ 5000`,
    sample_input: '[1,2,3,4,5]', sample_output: '[5,4,3,2,1]',
    cases: [
      { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]', is_hidden: false },
      { input: '[1,2]',       output: '[2,1]',        is_hidden: false },
      { input: '[1]',         output: '[1]',           is_hidden: false },
      { input: '[]',          output: '[]',            is_hidden: true  },
      { input: '[1,2,3]',     output: '[3,2,1]',       is_hidden: true  },
      { input: '[5,4,3,2,1]', output: '[1,2,3,4,5]',  is_hidden: true  },
    ],
  },

  {
    title: 'Linked List Cycle Detection',
    topic: 'linked-lists', difficulty: 'easy',
    description: `Given a linked list represented as an array \`vals\` and an index \`pos\` (the index the tail connects to, forming a cycle; -1 if no cycle), determine if the linked list has a cycle.

**Example:**
\`\`\`
vals = [3,2,0,-4], pos = 1
Output: true  (tail connects to index 1)
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 10⁴
- −10⁵ ≤ Node.val ≤ 10⁵
- pos is -1 or a valid index`,
    sample_input: '[3,2,0,-4], 1', sample_output: 'true',
    cases: [
      { input: '[3,2,0,-4], 1', output: 'true',  is_hidden: false },
      { input: '[1,2], 0',      output: 'true',  is_hidden: false },
      { input: '[1], -1',       output: 'false', is_hidden: false },
      { input: '[], -1',        output: 'false', is_hidden: true  },
      { input: '[1,2,3], -1',   output: 'false', is_hidden: true  },
      { input: '[1,2,3], 0',    output: 'true',  is_hidden: true  },
    ],
  },

  {
    title: 'Merge Two Sorted Lists',
    topic: 'linked-lists', difficulty: 'easy',
    description: `You are given the heads of two sorted linked lists. Merge the two lists into one **sorted** list. Return the merged list.

**Example:**
\`\`\`
list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 50
- −100 ≤ Node.val ≤ 100
- Both lists are sorted in non-decreasing order`,
    sample_input: '[1,2,4], [1,3,4]', sample_output: '[1,1,2,3,4,4]',
    cases: [
      { input: '[1,2,4], [1,3,4]', output: '[1,1,2,3,4,4]', is_hidden: false },
      { input: '[], []',           output: '[]',             is_hidden: false },
      { input: '[], [0]',          output: '[0]',            is_hidden: false },
      { input: '[1], [2]',         output: '[1,2]',          is_hidden: true  },
      { input: '[2], [1]',         output: '[1,2]',          is_hidden: true  },
      { input: '[1,3,5], [2,4,6]', output: '[1,2,3,4,5,6]', is_hidden: true  },
    ],
  },

  {
    title: 'Remove Nth Node From End of List',
    topic: 'linked-lists', difficulty: 'medium',
    description: `Given the head of a linked list (as array), remove the **nth node from the end** of the list and return the new list.

**Example:**
\`\`\`
list = [1,2,3,4,5], n = 2
Output: [1,2,3,5]
\`\`\`

**Constraints:**
- 1 ≤ nodes ≤ 30
- 0 ≤ Node.val ≤ 100
- 1 ≤ n ≤ nodes`,
    sample_input: '[1,2,3,4,5], 2', sample_output: '[1,2,3,5]',
    cases: [
      { input: '[1,2,3,4,5], 2', output: '[1,2,3,5]', is_hidden: false },
      { input: '[1], 1',         output: '[]',         is_hidden: false },
      { input: '[1,2], 1',       output: '[1]',        is_hidden: false },
      { input: '[1,2], 2',       output: '[2]',        is_hidden: true  },
      { input: '[1,2,3], 3',     output: '[2,3]',      is_hidden: true  },
      { input: '[1,2,3,4], 1',   output: '[1,2,3]',   is_hidden: true  },
    ],
  },

  {
    title: 'LRU Cache',
    topic: 'linked-lists', difficulty: 'hard',
    description: `Design a data structure for a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(capacity)\` — Initialize with positive capacity
- \`get(key)\` — Return value if key exists, else -1
- \`put(key, value)\` — Insert/update; evict LRU if over capacity

Both operations must run in **O(1)** average time.

**Example:**
\`\`\`
ops    = ["LRUCache","put","put","get","put","get","put","get","get","get"]
inputs = [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]
Output = [null,null,null,1,null,-1,null,-1,3,4]
\`\`\`

**Constraints:**
- 1 ≤ capacity ≤ 3000
- 0 ≤ key ≤ 10⁴`,
    sample_input: '["LRUCache","put","put","get","put","get","put","get","get","get"], [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
    sample_output: '[null,null,null,1,null,-1,null,-1,3,4]',
    cases: [
      {
        input:  '["LRUCache","put","put","get","put","get","put","get","get","get"], [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: '[null,null,null,1,null,-1,null,-1,3,4]',
        is_hidden: false,
      },
      {
        input:  '["LRUCache","put","get"], [[1],[2,1],[2]]',
        output: '[null,null,1]',
        is_hidden: false,
      },
      {
        input:  '["LRUCache","put","put","put","get","get"], [[2],[1,10],[2,20],[3,30],[1],[2]]',
        output: '[null,null,null,null,-1,20]',
        is_hidden: true,
      },
    ],
  },

  /* ──────────────────────────── TREES ──────────────────────────── */
  {
    title: 'Maximum Depth of Binary Tree',
    topic: 'trees', difficulty: 'easy',
    description: `Given the \`root\` of a binary tree (as level-order array), return its **maximum depth** — the number of nodes along the longest path from root to a leaf.

**Example:**
\`\`\`
root = [3,9,20,null,null,15,7]
Output: 3
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 10⁴
- −100 ≤ Node.val ≤ 100`,
    sample_input: '[3,9,20,null,null,15,7]', sample_output: '3',
    cases: [
      { input: '[3,9,20,null,null,15,7]', output: '3', is_hidden: false },
      { input: '[1,null,2]',              output: '2', is_hidden: false },
      { input: '[]',                      output: '0', is_hidden: false },
      { input: '[0]',                     output: '1', is_hidden: true  },
      { input: '[1,2,3,4,5]',             output: '3', is_hidden: true  },
      { input: '[1,2,null,3,null,4]',     output: '4', is_hidden: true  },
    ],
  },

  {
    title: 'Invert Binary Tree',
    topic: 'trees', difficulty: 'easy',
    description: `Given the \`root\` of a binary tree (level-order array), invert the tree and return the root (as level-order array).

**Example:**
\`\`\`
Input:  [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 100
- −100 ≤ Node.val ≤ 100`,
    sample_input: '[4,2,7,1,3,6,9]', sample_output: '[4,7,2,9,6,3,1]',
    cases: [
      { input: '[4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]', is_hidden: false },
      { input: '[2,1,3]',         output: '[2,3,1]',          is_hidden: false },
      { input: '[]',              output: '[]',               is_hidden: false },
      { input: '[1]',             output: '[1]',              is_hidden: true  },
      { input: '[1,2]',           output: '[1,null,2]',       is_hidden: true  },
    ],
  },

  {
    title: 'Validate Binary Search Tree',
    topic: 'trees', difficulty: 'medium',
    description: `Given the \`root\` of a binary tree (level-order array), determine if it is a **valid binary search tree (BST)**.

A valid BST: left subtree has only nodes with keys **less than** the node's key; right subtree has only nodes with keys **greater than** the node's key; both subtrees must also be BSTs.

**Example:**
\`\`\`
root = [2,1,3]
Output: true
\`\`\`

**Constraints:**
- 1 ≤ nodes ≤ 10⁴
- −2³¹ ≤ Node.val ≤ 2³¹ − 1`,
    sample_input: '[2,1,3]', sample_output: 'true',
    cases: [
      { input: '[2,1,3]',             output: 'true',  is_hidden: false },
      { input: '[5,1,4,null,null,3,6]', output: 'false', is_hidden: false },
      { input: '[1]',                 output: 'true',  is_hidden: false },
      { input: '[5,4,6,null,null,3,7]', output: 'false', is_hidden: true },
      { input: '[3,1,5,0,2,4,6]',     output: 'true',  is_hidden: true  },
      { input: '[1,1]',               output: 'false', is_hidden: true  },
    ],
  },

  {
    title: 'Binary Tree Level Order Traversal',
    topic: 'trees', difficulty: 'medium',
    description: `Given the \`root\` of a binary tree (level-order array), return the **level-order traversal** of its node values as a list of lists.

**Example:**
\`\`\`
root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 2000
- −1000 ≤ Node.val ≤ 1000`,
    sample_input: '[3,9,20,null,null,15,7]', sample_output: '[[3],[9,20],[15,7]]',
    cases: [
      { input: '[3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', is_hidden: false },
      { input: '[1]',                     output: '[[1]]',               is_hidden: false },
      { input: '[]',                      output: '[]',                  is_hidden: false },
      { input: '[1,2,3,4,5]',             output: '[[1],[2,3],[4,5]]',   is_hidden: true  },
      { input: '[1,null,2,null,3]',       output: '[[1],[2],[3]]',       is_hidden: true  },
    ],
  },

  {
    title: 'Serialize and Deserialize Binary Tree',
    topic: 'trees', difficulty: 'hard',
    description: `Design an algorithm to **serialize** and **deserialize** a binary tree. Implement a \`solution\` function that accepts a level-order array, serializes the tree to a string, deserializes it back, and returns the level-order array — the round-trip output must match the input.

**Example:**
\`\`\`
root = [1,2,3,null,null,4,5]
Output: [1,2,3,null,null,4,5]  (round-trip)
\`\`\``,
    sample_input: '[1,2,3,null,null,4,5]', sample_output: '[1,2,3,null,null,4,5]',
    cases: [
      { input: '[1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]', is_hidden: false },
      { input: '[1]',                  output: '[1]',                   is_hidden: false },
      { input: '[]',                   output: '[]',                    is_hidden: false },
      { input: '[1,2,3]',              output: '[1,2,3]',               is_hidden: true  },
    ],
  },

  /* ──────────────────────────── GRAPHS ─────────────────────────── */
  {
    title: 'Number of Islands',
    topic: 'graphs', difficulty: 'medium',
    description: `Given an \`m × n\` grid of \`"1"\` (land) and \`"0"\` (water), count the **number of islands**. An island is formed by connecting adjacent lands horizontally or vertically.

**Example:**
\`\`\`
grid = [["1","1","0"],["0","1","0"],["0","0","1"]]
Output: 2
\`\`\`

**Constraints:**
- 1 ≤ m, n ≤ 300
- grid[i][j] is "0" or "1"`,
    sample_input: '[["1","1","0"],["0","1","0"],["0","0","1"]]', sample_output: '2',
    cases: [
      { input: '[["1","1","0"],["0","1","0"],["0","0","1"]]',         output: '2', is_hidden: false },
      { input: '[["1","1","1"],["0","1","0"],["1","1","1"]]',         output: '1', is_hidden: false },
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1', is_hidden: false },
      { input: '[["0","0","0"],["0","0","0"]]',                       output: '0', is_hidden: true  },
      { input: '[["1","0","1"],["0","0","0"],["1","0","1"]]',         output: '4', is_hidden: true  },
    ],
  },

  {
    title: 'Clone Graph',
    topic: 'graphs', difficulty: 'medium',
    description: `Given an adjacency list representing an undirected connected graph (as array of arrays, where index = node-1, values = 1-indexed neighbors), return the adjacency list of the cloned graph.

**Example:**
\`\`\`
adjList = [[2,4],[1,3],[2,4],[1,3]]
Output:  [[2,4],[1,3],[2,4],[1,3]]
\`\`\`

**Constraints:**
- 0 ≤ nodes ≤ 100
- 1 ≤ Node.val ≤ 100
- No repeated edges, no self-loops`,
    sample_input: '[[2,4],[1,3],[2,4],[1,3]]', sample_output: '[[2,4],[1,3],[2,4],[1,3]]',
    cases: [
      { input: '[[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', is_hidden: false },
      { input: '[[]]',                      output: '[[]]',                      is_hidden: false },
      { input: '[]',                        output: '[]',                        is_hidden: false },
      { input: '[[2],[1]]',                 output: '[[2],[1]]',                 is_hidden: true  },
    ],
  },

  {
    title: 'Course Schedule',
    topic: 'graphs', difficulty: 'medium',
    description: `There are \`numCourses\` courses labeled 0 to numCourses-1. Given \`prerequisites\` (pairs [a, b] meaning "must take b before a"), determine if you can finish all courses.

**Example:**
\`\`\`
numCourses = 2, prerequisites = [[1,0]]
Output: true
\`\`\`

**Constraints:**
- 1 ≤ numCourses ≤ 2000
- 0 ≤ prerequisites.length ≤ 5000`,
    sample_input: '2, [[1,0]]', sample_output: 'true',
    cases: [
      { input: '2, [[1,0]]',               output: 'true',  is_hidden: false },
      { input: '2, [[1,0],[0,1]]',          output: 'false', is_hidden: false },
      { input: '1, []',                    output: 'true',  is_hidden: false },
      { input: '3, [[1,0],[2,1]]',          output: 'true',  is_hidden: true  },
      { input: '3, [[1,0],[2,1],[0,2]]',    output: 'false', is_hidden: true  },
      { input: '5, [[1,4],[2,4],[3,1],[3,2]]', output: 'true', is_hidden: true },
    ],
  },

  {
    title: 'Word Ladder',
    topic: 'graphs', difficulty: 'hard',
    description: `Given a \`beginWord\`, an \`endWord\`, and a \`wordList\`, return the **number of words** in the shortest transformation sequence from beginWord to endWord. Return 0 if no path. Each step changes exactly one letter; each intermediate word must be in wordList.

**Example:**
\`\`\`
beginWord = "hit", endWord = "cog"
wordList  = ["hot","dot","dog","lot","log","cog"]
Output: 5  (hit→hot→dot→dog→cog)
\`\`\``,
    sample_input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', sample_output: '5',
    cases: [
      { input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', output: '5', is_hidden: false },
      { input: '"hit", "cog", ["hot","dot","dog","lot","log"]',       output: '0', is_hidden: false },
      { input: '"a", "c", ["a","b","c"]',                            output: '2', is_hidden: false },
      { input: '"hot", "dog", ["hot","dog","dot"]',                  output: '3', is_hidden: true  },
    ],
  },

  /* ──────────────────────────── DYNAMIC PROGRAMMING ────────────── */
  {
    title: 'Climbing Stairs',
    topic: 'dp', difficulty: 'easy',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can climb 1 or 2 steps. Return the number of **distinct ways** to climb to the top.

**Example:**
\`\`\`
n = 3
Output: 3  (1+1+1, 1+2, 2+1)
\`\`\`

**Constraints:**
- 1 ≤ n ≤ 45`,
    sample_input: '3', sample_output: '3',
    cases: [
      { input: '1',  output: '1',  is_hidden: false },
      { input: '2',  output: '2',  is_hidden: false },
      { input: '3',  output: '3',  is_hidden: false },
      { input: '4',  output: '5',  is_hidden: true  },
      { input: '5',  output: '8',  is_hidden: true  },
      { input: '10', output: '89', is_hidden: true  },
      { input: '45', output: '1836311903', is_hidden: true },
    ],
  },

  {
    title: 'Coin Change',
    topic: 'dp', difficulty: 'medium',
    description: `You are given an integer array \`coins\` and an integer \`amount\`. Return the **fewest number of coins** needed to make up that amount. If it cannot be made up, return \`-1\`.

**Example:**
\`\`\`
coins = [1,5,11], amount = 15
Output: 3  (5+5+5)
\`\`\`

**Constraints:**
- 1 ≤ coins.length ≤ 12
- 0 ≤ amount ≤ 10⁴`,
    sample_input: '[1,5,11], 15', sample_output: '3',
    cases: [
      { input: '[1,5,11], 15', output: '3',  is_hidden: false },
      { input: '[2], 3',       output: '-1', is_hidden: false },
      { input: '[1], 0',       output: '0',  is_hidden: false },
      { input: '[1,2,5], 11',  output: '3',  is_hidden: true  },
      { input: '[186,419,83,408], 6249', output: '20', is_hidden: true },
      { input: '[1], 1',       output: '1',  is_hidden: true  },
      { input: '[2,5,10,1], 27', output: '4', is_hidden: true },
    ],
  },

  {
    title: 'Longest Increasing Subsequence',
    topic: 'dp', difficulty: 'medium',
    description: `Given an integer array \`nums\`, return the length of the **longest strictly increasing subsequence**.

**Example:**
\`\`\`
nums = [10,9,2,5,3,7,101,18]
Output: 4  ([2,3,7,101])
\`\`\`

**Constraints:**
- 1 ≤ nums.length ≤ 2500
- −10⁴ ≤ nums[i] ≤ 10⁴`,
    sample_input: '[10,9,2,5,3,7,101,18]', sample_output: '4',
    cases: [
      { input: '[10,9,2,5,3,7,101,18]', output: '4', is_hidden: false },
      { input: '[0,1,0,3,2,3]',         output: '4', is_hidden: false },
      { input: '[7,7,7,7,7,7,7]',       output: '1', is_hidden: false },
      { input: '[1,2,3,4,5]',           output: '5', is_hidden: true  },
      { input: '[5,4,3,2,1]',           output: '1', is_hidden: true  },
      { input: '[1,3,6,7,9,4,10,5,6]',  output: '6', is_hidden: true  },
    ],
  },

  {
    title: 'Longest Common Subsequence',
    topic: 'dp', difficulty: 'hard',
    description: `Given two strings \`text1\` and \`text2\`, return the length of their **longest common subsequence**. If there is no common subsequence, return 0.

**Example:**
\`\`\`
text1 = "abcde", text2 = "ace"
Output: 3  ("ace")
\`\`\`

**Constraints:**
- 1 ≤ text1.length, text2.length ≤ 1000
- text1 and text2 consist of lowercase English only`,
    sample_input: '"abcde", "ace"', sample_output: '3',
    cases: [
      { input: '"abcde", "ace"',  output: '3', is_hidden: false },
      { input: '"abc", "abc"',    output: '3', is_hidden: false },
      { input: '"abc", "def"',    output: '0', is_hidden: false },
      { input: '"bsbininm", "jmjkbkjkv"', output: '1', is_hidden: true },
      { input: '"oxcpqrsvwf", "shmtulqrypy"', output: '2', is_hidden: true },
    ],
  },

  /* ──────────────────────────── BINARY SEARCH ──────────────────── */
  {
    title: 'Binary Search',
    topic: 'binary-search', difficulty: 'easy',
    description: `Given a sorted array of integers \`nums\` and a \`target\`, return its index. If it does not exist, return \`-1\`. Must run in **O(log n)**.

**Example:**
\`\`\`
nums = [-1,0,3,5,9,12], target = 9
Output: 4
\`\`\`

**Constraints:**
- 1 ≤ nums.length ≤ 10⁴
- All integers are unique
- nums is sorted in ascending order`,
    sample_input: '[-1,0,3,5,9,12], 9', sample_output: '4',
    cases: [
      { input: '[-1,0,3,5,9,12], 9',  output: '4',  is_hidden: false },
      { input: '[-1,0,3,5,9,12], 2',  output: '-1', is_hidden: false },
      { input: '[5], 5',              output: '0',  is_hidden: false },
      { input: '[1,2,3,4,5], 1',      output: '0',  is_hidden: true  },
      { input: '[1,2,3,4,5], 5',      output: '4',  is_hidden: true  },
      { input: '[1,2,3,4,5], 6',      output: '-1', is_hidden: true  },
      { input: '[2,4,6,8,10], 7',     output: '-1', is_hidden: true  },
    ],
  },

  {
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'binary-search', difficulty: 'easy',
    description: `Given a sorted array rotated at some pivot, find the **minimum element**. Must run in **O(log n)**.

**Example:**
\`\`\`
nums = [3,4,5,1,2]
Output: 1
\`\`\`

**Constraints:**
- 1 ≤ nums.length ≤ 5000
- All integers are unique`,
    sample_input: '[3,4,5,1,2]', sample_output: '1',
    cases: [
      { input: '[3,4,5,1,2]',    output: '1',  is_hidden: false },
      { input: '[4,5,6,7,0,1,2]', output: '0', is_hidden: false },
      { input: '[11,13,15,17]',  output: '11', is_hidden: false },
      { input: '[2,1]',          output: '1',  is_hidden: true  },
      { input: '[1]',            output: '1',  is_hidden: true  },
      { input: '[5,1,2,3,4]',    output: '1',  is_hidden: true  },
    ],
  },

  {
    title: 'Search in Rotated Sorted Array',
    topic: 'binary-search', difficulty: 'medium',
    description: `A sorted array was rotated at some pivot. Given \`nums\` and a \`target\`, return the **index** of target, or \`-1\`. Must run in **O(log n)**.

**Example:**
\`\`\`
nums = [4,5,6,7,0,1,2], target = 0
Output: 4
\`\`\`

**Constraints:**
- 1 ≤ nums.length ≤ 5000
- All values are unique`,
    sample_input: '[4,5,6,7,0,1,2], 0', sample_output: '4',
    cases: [
      { input: '[4,5,6,7,0,1,2], 0',  output: '4',  is_hidden: false },
      { input: '[4,5,6,7,0,1,2], 3',  output: '-1', is_hidden: false },
      { input: '[1], 0',              output: '-1', is_hidden: false },
      { input: '[3,1], 1',            output: '1',  is_hidden: true  },
      { input: '[3,5,1], 3',          output: '0',  is_hidden: true  },
      { input: '[1,2,3,4,5,6,7], 4',  output: '3',  is_hidden: true  },
      { input: '[6,7,1,2,3,4,5], 1',  output: '2',  is_hidden: true  },
    ],
  },

  {
    title: 'Median of Two Sorted Arrays',
    topic: 'binary-search', difficulty: 'hard',
    description: `Given two sorted arrays \`nums1\` and \`nums2\`, return the **median** of the two sorted arrays. Must run in **O(log(m+n))**.

**Example:**
\`\`\`
nums1 = [1,3], nums2 = [2]
Output: 2.0
\`\`\`

**Constraints:**
- 0 ≤ nums1.length, nums2.length ≤ 1000
- -10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶`,
    sample_input: '[1,3], [2]', sample_output: '2',
    cases: [
      { input: '[1,3], [2]',         output: '2',   is_hidden: false },
      { input: '[1,2], [3,4]',       output: '2.5', is_hidden: false },
      { input: '[0,0], [0,0]',       output: '0',   is_hidden: false },
      { input: '[], [1]',            output: '1',   is_hidden: true  },
      { input: '[2], []',            output: '2',   is_hidden: true  },
      { input: '[1,2,3,4,5], [1,2,3,4,5]', output: '3', is_hidden: true },
    ],
  },

  /* ──────────────────────────── SORTING ────────────────────────── */
  {
    title: 'Merge Intervals',
    topic: 'sorting', difficulty: 'medium',
    description: `Given an array of \`intervals\` where \`intervals[i] = [start, end]\`, merge all overlapping intervals.

**Example:**
\`\`\`
intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
\`\`\`

**Constraints:**
- 1 ≤ intervals.length ≤ 10⁴
- 0 ≤ start ≤ end ≤ 10⁴`,
    sample_input: '[[1,3],[2,6],[8,10],[15,18]]', sample_output: '[[1,6],[8,10],[15,18]]',
    cases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', is_hidden: false },
      { input: '[[1,4],[4,5]]',               output: '[[1,5]]',               is_hidden: false },
      { input: '[[1,4],[2,3]]',               output: '[[1,4]]',               is_hidden: false },
      { input: '[[1,4],[0,4]]',               output: '[[0,4]]',               is_hidden: true  },
      { input: '[[1,4],[0,2],[3,5]]',         output: '[[0,5]]',               is_hidden: true  },
      { input: '[[1,4],[5,6]]',               output: '[[1,4],[5,6]]',         is_hidden: true  },
    ],
  },

  {
    title: 'Sort Colors (Dutch Flag)',
    topic: 'sorting', difficulty: 'easy',
    description: `Given an array \`nums\` with values 0 (red), 1 (white), 2 (blue), sort them **in-place** so all 0s come first, then 1s, then 2s. Use the Dutch National Flag algorithm — one pass, O(1) space.

**Example:**
\`\`\`
nums = [2,0,2,1,1,0]
Output: [0,0,1,1,2,2]
\`\`\`

**Constraints:**
- 1 ≤ nums.length ≤ 300
- nums[i] is 0, 1, or 2`,
    sample_input: '[2,0,2,1,1,0]', sample_output: '[0,0,1,1,2,2]',
    cases: [
      { input: '[2,0,2,1,1,0]', output: '[0,0,1,1,2,2]', is_hidden: false },
      { input: '[2,0,1]',       output: '[0,1,2]',        is_hidden: false },
      { input: '[0]',           output: '[0]',            is_hidden: false },
      { input: '[1,2,0]',       output: '[0,1,2]',        is_hidden: true  },
      { input: '[2,2,2]',       output: '[2,2,2]',        is_hidden: true  },
      { input: '[0,0,0]',       output: '[0,0,0]',        is_hidden: true  },
    ],
  },

  {
    title: 'Kth Largest Element in an Array',
    topic: 'sorting', difficulty: 'medium',
    description: `Given an integer array \`nums\` and an integer \`k\`, return the **kth largest element** in the array (not the kth distinct).

**Example:**
\`\`\`
nums = [3,2,1,5,6,4], k = 2
Output: 5
\`\`\`

**Constraints:**
- 1 ≤ k ≤ nums.length ≤ 10⁵
- −10⁴ ≤ nums[i] ≤ 10⁴`,
    sample_input: '[3,2,1,5,6,4], 2', sample_output: '5',
    cases: [
      { input: '[3,2,1,5,6,4], 2',   output: '5', is_hidden: false },
      { input: '[3,2,3,1,2,4,5,5,6], 4', output: '4', is_hidden: false },
      { input: '[1], 1',             output: '1', is_hidden: false },
      { input: '[2,1], 2',           output: '1', is_hidden: true  },
      { input: '[5,5,5,5], 2',       output: '5', is_hidden: true  },
      { input: '[-1,-2,-3,-4,-5], 3', output: '-3', is_hidden: true },
    ],
  },

  {
    title: 'Largest Rectangle in Histogram',
    topic: 'sorting', difficulty: 'hard',
    description: `Given an array of integers \`heights\` representing the histogram's bar heights, find the **largest rectangle** in the histogram.

**Example:**
\`\`\`
heights = [2,1,5,6,2,3]
Output: 10
\`\`\`

**Constraints:**
- 1 ≤ heights.length ≤ 10⁵
- 0 ≤ heights[i] ≤ 10⁴`,
    sample_input: '[2,1,5,6,2,3]', sample_output: '10',
    cases: [
      { input: '[2,1,5,6,2,3]', output: '10', is_hidden: false },
      { input: '[2,4]',         output: '4',  is_hidden: false },
      { input: '[1]',           output: '1',  is_hidden: false },
      { input: '[0,9]',         output: '9',  is_hidden: true  },
      { input: '[6,2,5,4,5,1,6]', output: '12', is_hidden: true },
      { input: '[1,1,1,1,1]',  output: '5',  is_hidden: true  },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════
// SEED RUNNER
// ═══════════════════════════════════════════════════════════════════
async function seed() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let problemsInserted = 0
    let problemsSkipped  = 0
    let casesInserted    = 0
    let casesReplaced    = 0

    for (const p of PROBLEMS) {
      // ── Upsert problem (skip if title already exists) ──────────
      const { rows: existing } = await client.query(
        'SELECT id FROM problems WHERE title = $1',
        [p.title]
      )

      let problemId

      if (existing.length > 0) {
        problemId = existing[0].id
        problemsSkipped++
        console.log(`  ⟳  (exists) ${p.title}`)
      } else {
        const { rows } = await client.query(
          `INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [p.title, p.description, p.topic, p.difficulty, p.sample_input, p.sample_output]
        )
        problemId = rows[0].id
        problemsInserted++
        console.log(`  +  (new)    ${p.title}  [${p.topic}/${p.difficulty}]`)
      }

      // ── Delete + re-insert test cases ─────────────────────────
      const { rowCount: deleted } = await client.query(
        'DELETE FROM test_cases WHERE problem_id = $1',
        [problemId]
      )
      casesReplaced += deleted

      for (const tc of p.cases) {
        await client.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden)
           VALUES ($1, $2, $3, $4)`,
          [problemId, tc.input, tc.output, tc.is_hidden]
        )
        casesInserted++
      }
    }

    await client.query('COMMIT')

    console.log(`
╔══════════════════════════════════════════════╗
║  Seed v3 complete                            ║
╠══════════════════════════════════════════════╣
║  Problems new:     ${String(problemsInserted).padEnd(26)}║
║  Problems skipped: ${String(problemsSkipped).padEnd(26)}║
║  Test cases added: ${String(casesInserted).padEnd(26)}║
║  Test cases replaced: ${String(casesReplaced).padEnd(23)}║
╚══════════════════════════════════════════════╝
`)

    // ── Verify coverage ────────────────────────────────────────
    const { rows: coverage } = await client.query(`
      SELECT topic, difficulty, COUNT(*) AS problems,
             SUM((SELECT COUNT(*) FROM test_cases t WHERE t.problem_id = p.id)) AS test_cases
      FROM problems p
      GROUP BY topic, difficulty
      ORDER BY topic, difficulty
    `)
    console.log('Coverage:')
    console.log('  Topic             Diff    Problems  Tests')
    console.log('  ─────────────────────────────────────────')
    for (const r of coverage) {
      console.log(
        `  ${r.topic.padEnd(17)} ${r.difficulty.padEnd(7)} ${String(r.problems).padEnd(10)}${r.test_cases}`
      )
    }

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('\n✗ Seed failed — rolled back:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
