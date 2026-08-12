-- ═══════════════════════════════════════════════════════════════
-- AlgoArena — Seed 10 problems + test cases
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

-- ── Arrays ────────────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Two Sum',
  E'Given an array of integers `nums` and a target integer `target`, return the **indices** of the two numbers that add up to `target`.\n\nYou may assume each input has exactly one solution, and you may not use the same element twice.\n\n**Example:**\n```\nnums = [2,7,11,15], target = 9\nOutput: [0,1]\n```\n\n**Constraints:**\n- 2 ≤ nums.length ≤ 10⁴\n- -10⁹ ≤ nums[i] ≤ 10⁹',
  'arrays', 'easy',
  '[2,7,11,15]\n9',
  '[0,1]'
) RETURNING id;

-- ── Strings ───────────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Valid Anagram',
  E'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn **anagram** is a word formed by rearranging the letters of another.\n\n**Example:**\n```\ns = "anagram", t = "nagaram"\nOutput: true\n```\n\n**Constraints:**\n- 1 ≤ s.length, t.length ≤ 5 × 10⁴\n- s and t consist of lowercase English letters',
  'strings', 'easy',
  '"anagram"\n"nagaram"',
  'true'
) RETURNING id;

-- ── Binary Search ────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Binary Search',
  E'Given a sorted array of integers `nums` and a target, return the index of `target`. If it does not exist, return `-1`. You must write an algorithm with **O(log n)** runtime.\n\n**Example:**\n```\nnums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n```\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 10⁴\n- All integers in nums are unique\n- nums is sorted in ascending order',
  'binary-search', 'easy',
  '[-1,0,3,5,9,12]\n9',
  '4'
) RETURNING id;

-- ── Linked Lists ──────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Reverse Linked List',
  E'Given the head of a singly linked list, reverse the list, and return the reversed list.\n\n**Example:**\n```\nInput:  1 → 2 → 3 → 4 → 5\nOutput: 5 → 4 → 3 → 2 → 1\n```\n\n**Constraints:**\n- 0 ≤ Node.val ≤ 50\n- The number of nodes is in the range [0, 5000]',
  'linked-lists', 'easy',
  '[1,2,3,4,5]',
  '[5,4,3,2,1]'
) RETURNING id;

-- ── Trees ─────────────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Maximum Depth of Binary Tree',
  E'Given the `root` of a binary tree, return its **maximum depth** — the number of nodes along the longest path from root to the farthest leaf node.\n\n**Example:**\n```\n    3\n   / \\\n  9  20\n    /  \\\n   15   7\nOutput: 3\n```\n\n**Constraints:**\n- The number of nodes is in the range [0, 10⁴]\n- -100 ≤ Node.val ≤ 100',
  'trees', 'easy',
  '[3,9,20,null,null,15,7]',
  '3'
) RETURNING id;

-- ── Graphs ────────────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Number of Islands',
  E'Given an `m × n` grid of `"1"` (land) and `"0"` (water), count the **number of islands**. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.\n\n**Example:**\n```\ngrid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]\nOutput: 3\n```\n\n**Constraints:**\n- 1 ≤ m, n ≤ 300\n- grid[i][j] is "0" or "1"',
  'graphs', 'medium',
  '[["1","1","0"],["0","1","0"],["0","0","1"]]',
  '2'
) RETURNING id;

-- ── DP ────────────────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Coin Change',
  E'You are given an integer array `coins` representing coins of different denominations and an integer `amount`. Return the **fewest number of coins** needed to make up that amount. If it cannot be made up, return `-1`.\n\n**Example:**\n```\ncoins = [1,5,11], amount = 15\nOutput: 3  (5 + 5 + 5)\n```\n\n**Constraints:**\n- 1 ≤ coins.length ≤ 12\n- 1 ≤ coins[i] ≤ 2³¹ − 1\n- 0 ≤ amount ≤ 10⁴',
  'dp', 'medium',
  '[1,5,11]\n15',
  '3'
) RETURNING id;

-- ── Arrays (medium) ───────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Best Time to Buy and Sell Stock',
  E'You are given an array `prices` where `prices[i]` is the price of a stock on day `i`. Return the **maximum profit** you can achieve. If no profit is possible, return `0`.\n\n**Example:**\n```\nprices = [7,1,5,3,6,4]\nOutput: 5  (buy at 1, sell at 6)\n```\n\n**Constraints:**\n- 1 ≤ prices.length ≤ 10⁵\n- 0 ≤ prices[i] ≤ 10⁴',
  'arrays', 'easy',
  '[7,1,5,3,6,4]',
  '5'
) RETURNING id;

-- ── Sorting ───────────────────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Merge Intervals',
  E'Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals and return an array of the **non-overlapping intervals**.\n\n**Example:**\n```\nintervals = [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]\n```\n\n**Constraints:**\n- 1 ≤ intervals.length ≤ 10⁴\n- 0 ≤ start ≤ end ≤ 10⁴',
  'sorting', 'medium',
  '[[1,3],[2,6],[8,10],[15,18]]',
  '[[1,6],[8,10],[15,18]]'
) RETURNING id;

-- ── Binary Search (medium) ────────────────────────────────────
INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Search in Rotated Sorted Array',
  E'An integer array `nums` was sorted in ascending order, then rotated at some pivot. Given `nums` and a target, return the **index** of target, or `-1` if not found. Must be **O(log n)**.\n\n**Example:**\n```\nnums = [4,5,6,7,0,1,2], target = 0\nOutput: 4\n```\n\n**Constraints:**\n- 1 ≤ nums.length ≤ 5000\n- All values in nums are unique',
  'binary-search', 'medium',
  '[4,5,6,7,0,1,2]\n0',
  '4'
) RETURNING id;

-- ── Verify ────────────────────────────────────────────────────
SELECT title, topic, difficulty FROM problems ORDER BY topic, difficulty;
