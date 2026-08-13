-- Run this in Supabase SQL Editor to add the missing arrays:medium problem
-- (and any other common topic:difficulty combos that may be missing)

INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Container With Most Water',
  E'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container that **holds the most water**.\n\nReturn the **maximum amount of water** a container can store.\n\n**Example:**\n```\nheight = [1,8,6,2,5,4,8,3,7]\nOutput: 49\n(lines at index 1 and 8: min(8,7) * (8-1) = 49)\n```\n\n**Constraints:**\n- n == height.length\n- 2 ≤ n ≤ 10⁵\n- 0 ≤ height[i] ≤ 10⁴',
  'arrays', 'medium',
  '[1,8,6,2,5,4,8,3,7]',
  '49'
);

INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Longest Substring Without Repeating Characters',
  E'Given a string `s`, find the length of the **longest substring** without repeating characters.\n\n**Example:**\n```\ns = "abcabcbb"\nOutput: 3  ("abc")\n```\n\n**Constraints:**\n- 0 ≤ s.length ≤ 5 × 10⁴\n- s consists of English letters, digits, symbols and spaces',
  'strings', 'medium',
  '"abcabcbb"',
  '3'
);

INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Lowest Common Ancestor of BST',
  E'Given a binary search tree (BST), find the **lowest common ancestor** (LCA) of two given nodes `p` and `q`.\n\nThe LCA is defined as the lowest node that has both `p` and `q` as descendants.\n\n**Example:**\n```\nroot = [6,2,8,0,4,7,9], p = 2, q = 8\nOutput: 6\n```\n\n**Constraints:**\n- The number of nodes is in [2, 10⁵]\n- -10⁹ ≤ Node.val ≤ 10⁹\n- p ≠ q, both values exist in the BST',
  'trees', 'medium',
  '[6,2,8,0,4,7,9]\n2\n8',
  '6'
);

INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
VALUES (
  'Find Minimum in Rotated Sorted Array',
  E'Suppose an array of length `n` sorted in ascending order is rotated at some pivot. Given the array `nums`, return the **minimum element**. You must write an algorithm that runs in **O(log n)**.\n\n**Example:**\n```\nnums = [3,4,5,1,2]\nOutput: 1\n```\n\n**Constraints:**\n- n == nums.length\n- 1 ≤ n ≤ 5000\n- All integers in nums are unique',
  'binary-search', 'easy',
  '[3,4,5,1,2]',
  '1'
);

-- Verify all problems
SELECT title, topic, difficulty FROM problems ORDER BY topic, difficulty;
