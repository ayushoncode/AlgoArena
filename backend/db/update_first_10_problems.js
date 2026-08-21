'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const UPDATES = [
  // ── Problem 1: Balanced Binary Tree ──────────────────────────────────────
  {
    id: '0002a98e-b5f8-4c05-9fdb-460dc26ecfeb',
    title: 'Balanced Binary Tree',
    topic: 'trees',
    difficulty: 'easy',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: 'true',
    description: `Given a binary tree, determine if it is **height-balanced**.

A **height-balanced** binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.

---

### **Example 1:**
\`\`\`
Input: root = [3,9,20,null,null,15,7]
Output: true
Explanation: The depth of the left subtree is 1, and the depth of the right subtree is 2. The difference is <= 1.
\`\`\`

### **Example 2:**
\`\`\`
Input: root = [1,2,2,3,3,null,null,4,4]
Output: false
Explanation: The left subtree has height 3 while the right subtree has height 1. The difference is 2 (> 1), so it is not balanced.
\`\`\`

### **Example 3:**
\`\`\`
Input: root = []
Output: true
Explanation: An empty tree is height-balanced by definition.
\`\`\`

---

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-10⁴ <= Node.val <= 10⁴\``,
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: 'true', is_hidden: false },
      { input: '[1,2,2,3,3,null,null,4,4]', output: 'false', is_hidden: false },
      { input: '[]', output: 'true', is_hidden: true },
      { input: '[1,2,3,4,5,6,null,8]', output: 'true', is_hidden: true },
    ]
  },

  // ── Problem 2: Subsets II ────────────────────────────────────────────────
  {
    id: '0162c72d-a377-4a83-b4b9-2fbdcb376161',
    title: 'Subsets II',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1,2,2]',
    sample_output: '[[],[1],[1,2],[1,2,2],[2],[2,2]]',
    description: `Given an integer array \`nums\` that may contain duplicates, return *all possible subsets (the power set)*.

The solution set **must not** contain duplicate subsets. Return the solution in **any order**.

---

### **Example 1:**
\`\`\`
Input: nums = [1,2,2]
Output: [[],[1],[1,2],[1,2,2],[2],[2,2]]
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [0]
Output: [[],[0]]
\`\`\`

---

### **Constraints:**
- \`1 <= nums.length <= 10\`
- \`-10 <= nums[i] <= 10\``,
    test_cases: [
      { input: '[1,2,2]', output: '[[],[1],[1,2],[1,2,2],[2],[2,2]]', is_hidden: false },
      { input: '[0]', output: '[[],[0]]', is_hidden: false },
      { input: '[4,4,4,1,4]', output: '[[],[1],[1,4],[1,4,4],[1,4,4,4],[1,4,4,4,4],[4],[4,4],[4,4,4],[4,4,4,4]]', is_hidden: true },
    ]
  },

  // ── Problem 3: Merge Sorted Array ────────────────────────────────────────
  {
    id: '0310e807-616a-483b-8646-d3a87dd671ce',
    title: 'Merge Sorted Array',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1,2,3,0,0,0], 3, [2,5,6], 3',
    sample_output: '[1,2,2,3,5,6]',
    description: `You are given two integer arrays \`nums1\` and \`nums2\`, sorted in non-decreasing order, and two integers \`m\` and \`n\`, representing the number of initial elements in \`nums1\` and \`nums2\` respectively.

Merge \`nums1\` and \`nums2\` into a single array sorted in non-decreasing order.

Return the merged array \`nums1\`.

---

### **Example 1:**
\`\`\`
Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
Output: [1,2,2,3,5,6]
Explanation: The arrays we are merging are [1,2,3] and [2,5,6].
The result of the merge is [1,2,2,3,5,6].
\`\`\`

### **Example 2:**
\`\`\`
Input: nums1 = [1], m = 1, nums2 = [], n = 0
Output: [1]
Explanation: The arrays we are merging are [1] and [].
The result of the merge is [1].
\`\`\`

### **Example 3:**
\`\`\`
Input: nums1 = [0], m = 0, nums2 = [1], n = 1
Output: [1]
Explanation: The arrays we are merging are [] and [1].
The result of the merge is [1].
\`\`\`

---

### **Constraints:**
- \`nums1.length == m + n\`
- \`nums2.length == n\`
- \`0 <= m, n <= 200\`
- \`1 <= m + n <= 200\`
- \`-10⁹ <= nums1[i], nums2[j] <= 10⁹\``,
    test_cases: [
      { input: '[1,2,3,0,0,0], 3, [2,5,6], 3', output: '[1,2,2,3,5,6]', is_hidden: false },
      { input: '[1], 1, [], 0', output: '[1]', is_hidden: false },
      { input: '[0], 0, [1], 1', output: '[1]', is_hidden: true },
      { input: '[4,5,6,0,0,0], 3, [1,2,3], 3', output: '[1,2,3,4,5,6]', is_hidden: true },
    ]
  },

  // ── Problem 4: Unique Binary Search Trees ────────────────────────────────
  {
    id: '05c30946-2aa2-4132-88e2-ac249333e925',
    title: 'Unique Binary Search Trees',
    topic: 'dp',
    difficulty: 'medium',
    sample_input: '3',
    sample_output: '5',
    description: `Given an integer \`n\`, return *the number of structurally unique **BST**'s (binary search trees) which have exactly \`n\` nodes of unique values from \`1\` to \`n\`*.

---

### **Example 1:**
\`\`\`
Input: n = 3
Output: 5
Explanation: The 5 unique BST structures with 3 nodes are:
1. 1 -> 3 -> 2
2. 3 -> 2 -> 1
3. 3 -> 1 -> 2
4. 1 -> 2 -> 3
5. 2 -> 1, 2 -> 3
\`\`\`

### **Example 2:**
\`\`\`
Input: n = 1
Output: 1
\`\`\`

---

### **Constraints:**
- \`1 <= n <= 19\``,
    test_cases: [
      { input: '3', output: '5', is_hidden: false },
      { input: '1', output: '1', is_hidden: false },
      { input: '4', output: '14', is_hidden: true },
      { input: '5', output: '42', is_hidden: true },
    ]
  },

  // ── Problem 5: Remove Duplicates from Sorted Array II ────────────────────
  {
    id: '08381beb-a20f-417a-bd06-493c0ed313a4',
    title: 'Remove Duplicates from Sorted Array II',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1,1,1,2,2,3]',
    sample_output: '5',
    description: `Given an integer array \`nums\` sorted in non-decreasing order, remove some duplicates **in-place** such that each unique element appears **at most twice**. The relative order of the elements should be kept the same.

Return \`k\` *after placing the final result in the first \`k\` slots of \`nums\`*.

---

### **Example 1:**
\`\`\`
Input: nums = [1,1,1,2,2,3]
Output: 5
Explanation: Your function should return k = 5, with the first five elements of nums being 1, 1, 2, 2, and 3 respectively.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [0,0,1,1,1,1,2,3,3]
Output: 7
Explanation: Your function should return k = 7, with the first seven elements of nums being 0, 0, 1, 1, 2, 3, and 3 respectively.
\`\`\`

---

### **Constraints:**
- \`1 <= nums.length <= 3 * 10⁴\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- \`nums\` is sorted in **non-decreasing** order.`,
    test_cases: [
      { input: '[1,1,1,2,2,3]', output: '5', is_hidden: false },
      { input: '[0,0,1,1,1,1,2,3,3]', output: '7', is_hidden: true },
      { input: '[1,1,1]', output: '2', is_hidden: true },
      { input: '[1,2,3]', output: '3', is_hidden: true },
    ]
  },

  // ── Problem 6: Word Break II ─────────────────────────────────────────────
  {
    id: '08fcd732-b1d7-4267-b627-df0c0df4e4e9',
    title: 'Word Break II',
    topic: 'strings',
    difficulty: 'hard',
    sample_input: '"catsanddog", ["cat","cats","and","sand","dog"]',
    sample_output: '["cats and dog","cat sand dog"]',
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, add spaces in \`s\` to construct a sentence where each word is a valid dictionary word. Return *all such possible sentences in **any order***.

Note that the same word in the dictionary may be reused multiple times in the segmentation.

---

### **Example 1:**
\`\`\`
Input: s = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]
Output: ["cats and dog","cat sand dog"]
\`\`\`

### **Example 2:**
\`\`\`
Input: s = "pineapplepenapple", wordDict = ["apple","pen","applepen","pine","pineapple"]
Output: ["pine apple pen apple","pineapple pen apple","pine applepen apple"]
Explanation: Note that you are allowed to reuse a dictionary word.
\`\`\`

### **Example 3:**
\`\`\`
Input: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
Output: []
\`\`\`

---

### **Constraints:**
- \`1 <= s.length <= 20\`
- \`1 <= wordDict.length <= 1000\`
- \`1 <= wordDict[i].length <= 10\`
- \`s\` and \`wordDict[i]\` consist of only lowercase English letters.
- All the strings of \`wordDict\` are **unique**.`,
    test_cases: [
      { input: '"catsanddog", ["cat","cats","and","sand","dog"]', output: '["cats and dog","cat sand dog"]', is_hidden: false },
      { input: '"pineapplepenapple", ["apple","pen","applepen","pine","pineapple"]', output: '["pine apple pen apple","pineapple pen apple","pine applepen apple"]', is_hidden: false },
      { input: '"catsandog", ["cats","dog","sand","and","cat"]', output: '[]', is_hidden: true },
    ]
  },

  // ── Problem 7: 4Sum ──────────────────────────────────────────────────────
  {
    id: '0ac1b804-69d2-40ed-b4ae-d765d434de1b',
    title: '4Sum',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '[1,0,-1,0,-2,2], 0',
    sample_output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]',
    description: `Given an array \`nums\` of \`n\` integers, return *an array of all the **unique** quadruplets* \`[nums[a], nums[b], nums[c], nums[d]]\` such that:

- \`0 <= a, b, c, d < n\`
- \`a\`, \`b\`, \`c\`, and \`d\` are **distinct**.
- \`nums[a] + nums[b] + nums[c] + nums[d] == target\`

You may return the answer in **any order**.

---

### **Example 1:**
\`\`\`
Input: nums = [1,0,-1,0,-2,2], target = 0
Output: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [2,2,2,2,2], target = 8
Output: [[2,2,2,2]]
\`\`\`

---

### **Constraints:**
- \`1 <= nums.length <= 200\`
- \`-10⁹ <= nums[i] <= 10⁹\`
- \`-10⁹ <= target <= 10⁹\``,
    test_cases: [
      { input: '[1,0,-1,0,-2,2], 0', output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]', is_hidden: false },
      { input: '[2,2,2,2,2], 8', output: '[[2,2,2,2]]', is_hidden: false },
      { input: '[0,0,0,0], 0', output: '[[0,0,0,0]]', is_hidden: true },
    ]
  },

  // ── Problem 8: Spiral Matrix II ──────────────────────────────────────────
  {
    id: '0b56da28-56ad-440e-b027-940cb976a42f',
    title: 'Spiral Matrix II',
    topic: 'arrays',
    difficulty: 'medium',
    sample_input: '3',
    sample_output: '[[1,2,3],[8,9,4],[7,6,5]]',
    description: `Given a positive integer \`n\`, generate an \`n x n\` matrix filled with elements from \`1\` to \`n²\` in spiral order.

---

### **Example 1:**
\`\`\`
Input: n = 3
Output: [[1,2,3],[8,9,4],[7,6,5]]
Explanation: The matrix is:
[ 1, 2, 3 ]
[ 8, 9, 4 ]
[ 7, 6, 5 ]
\`\`\`

### **Example 2:**
\`\`\`
Input: n = 1
Output: [[1]]
\`\`\`

---

### **Constraints:**
- \`1 <= n <= 20\``,
    test_cases: [
      { input: '3', output: '[[1,2,3],[8,9,4],[7,6,5]]', is_hidden: false },
      { input: '1', output: '[[1]]', is_hidden: false },
      { input: '4', output: '[[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]]', is_hidden: true },
    ]
  },

  // ── Problem 9: Remove Duplicates from Sorted Array ───────────────────────
  {
    id: '0e1c4530-3093-4db8-ab32-374aaf250718',
    title: 'Remove Duplicates from Sorted Array',
    topic: 'arrays',
    difficulty: 'easy',
    sample_input: '[1,1,2]',
    sample_output: '2',
    description: `Given an integer array \`nums\` sorted in non-decreasing order, remove the duplicates **in-place** such that each unique element appears only **once**. The relative order of the elements should be kept the same.

Return \`k\` *after placing the final result in the first \`k\` slots of \`nums\`*.

---

### **Example 1:**
\`\`\`
Input: nums = [1,1,2]
Output: 2
Explanation: Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.
\`\`\`

### **Example 2:**
\`\`\`
Input: nums = [0,0,1,1,1,2,2,3,3,4]
Output: 5
Explanation: Your function should return k = 5, with the first five elements of nums being 0, 1, 2, 3, and 4 respectively.
\`\`\`

---

### **Constraints:**
- \`1 <= nums.length <= 3 * 10⁴\`
- \`-100 <= nums[i] <= 100\`
- \`nums\` is sorted in **non-decreasing** order.`,
    test_cases: [
      { input: '[1,1,2]', output: '2', is_hidden: false },
      { input: '[0,0,1,1,1,2,2,3,3,4]', output: '5', is_hidden: true },
      { input: '[1]', output: '1', is_hidden: true },
      { input: '[1,2,3]', output: '3', is_hidden: true },
    ]
  },

  // ── Problem 10: Excel Sheet Column Number ────────────────────────────────
  {
    id: '0e3d7bef-beea-4cbe-93bd-0ea521011b29',
    title: 'Excel Sheet Column Number',
    topic: 'strings',
    difficulty: 'easy',
    sample_input: '"A"',
    sample_output: '1',
    description: `Given a string \`columnTitle\` that represents the column title as appears in an Excel sheet, return *its corresponding column number*.

For example:
\`\`\`
A -> 1
B -> 2
C -> 3
...
Z -> 26
AA -> 27
AB -> 28 
...
\`\`\`

---

### **Example 1:**
\`\`\`
Input: columnTitle = "A"
Output: 1
\`\`\`

### **Example 2:**
\`\`\`
Input: columnTitle = "AB"
Output: 28
\`\`\`

### **Example 3:**
\`\`\`
Input: columnTitle = "ZY"
Output: 701
\`\`\`

---

### **Constraints:**
- \`1 <= columnTitle.length <= 7\`
- \`columnTitle\` consists only of uppercase English letters.
- \`columnTitle\` is in the range \`["A", "FXSHRXW"]\`.`,
    test_cases: [
      { input: '"A"', output: '1', is_hidden: false },
      { input: '"AB"', output: '28', is_hidden: true },
      { input: '"ZY"', output: '701', is_hidden: true },
      { input: '"FXSHRXW"', output: '2147483647', is_hidden: true },
    ]
  },
];

async function applyUpdates() {
  console.log(`Applying LeetCode-grade updates to ${UPDATES.length} problems...`);
  
  for (const item of UPDATES) {
    // 1. Update problem
    await pool.query(
      `UPDATE problems 
       SET title = $1, topic = $2, difficulty = $3, description = $4, sample_input = $5, sample_output = $6
       WHERE id = $7`,
      [item.title, item.topic, item.difficulty, item.description, item.sample_input, item.sample_output, item.id]
    );

    // 2. Refresh test cases
    await pool.query(`DELETE FROM test_cases WHERE problem_id = $1`, [item.id]);
    for (const tc of item.test_cases) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
        [item.id, tc.input, tc.output, tc.is_hidden]
      );
    }

    console.log(`✓ Updated "${item.title}" (${item.id}) with ${item.test_cases.length} test cases`);
  }

  console.log('All 10 problems successfully updated in database!');
  await pool.end();
}

applyUpdates().catch(err => {
  console.error('Failed to update problems:', err);
  process.exit(1);
});
