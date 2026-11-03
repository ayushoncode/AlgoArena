'use strict';

/**
 * upgrade_trees_batch2_25tc.js
 *
 * Upgrades 7 Tree Traversals & Path Sum problems to exactly 25 curated test cases:
 * 1. Binary Tree Preorder Traversal (LC 144)
 * 2. Binary Tree Postorder Traversal (LC 145)
 * 3. Binary Tree Level Order Traversal (LC 102)
 * 4. Binary Tree Level Order Traversal II (LC 107)
 * 5. Binary Tree Zigzag Level Order Traversal (LC 103)
 * 6. Path Sum (LC 112)
 * 7. Path Sum II (LC 113)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

async function safeQuery(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.pool.query(text, params);
    } catch (err) {
      console.warn(`[DB Retry ${attempt}/${maxRetries}] Query failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// -------------------------------------------------------------
// Tree Helper Classes & Generators
// -------------------------------------------------------------

function TreeNode(val, left, right) {
  this.val = val === undefined ? 0 : val;
  this.left = left === undefined ? null : left;
  this.right = right === undefined ? null : right;
}

function buildFullTree(depth, valGen = (d, i) => i) {
  let counter = 1;
  function helper(d) {
    if (d === 0) return null;
    const node = new TreeNode(valGen(d, counter++));
    node.left = helper(d - 1);
    node.right = helper(d - 1);
    return node;
  }
  return helper(depth);
}

function buildSkewedTree(len, isLeft = true, startVal = 1) {
  const root = new TreeNode(startVal);
  let curr = root;
  for (let i = 2; i <= len; i++) {
    const next = new TreeNode(startVal + i - 1);
    if (isLeft) curr.left = next;
    else curr.right = next;
    curr = next;
  }
  return root;
}

function serializeTree(root) {
  if (!root) return [];
  const res = [];
  const q = [root];
  while (q.length > 0) {
    const node = q.shift();
    if (node) {
      res.push(node.val);
      q.push(node.left || null);
      q.push(node.right || null);
    } else {
      res.push(null);
    }
  }
  while (res.length > 0 && res[res.length - 1] === null) res.pop();
  return res;
}

function treePreorder(root) {
  const res = [];
  function dfs(node) {
    if (!node) return;
    res.push(node.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return res;
}

function treePostorder(root) {
  const res = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    dfs(node.right);
    res.push(node.val);
  }
  dfs(root);
  return res;
}

function treeLevelOrder(root) {
  if (!root) return [];
  const res = [];
  const q = [root];
  while (q.length > 0) {
    const len = q.length;
    const level = [];
    for (let i = 0; i < len; i++) {
      const node = q.shift();
      level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    res.push(level);
  }
  return res;
}

function treeZigzagLevelOrder(root) {
  if (!root) return [];
  const res = [];
  const q = [root];
  let leftToRight = true;
  while (q.length > 0) {
    const len = q.length;
    const level = [];
    for (let i = 0; i < len; i++) {
      const node = q.shift();
      if (leftToRight) level.push(node.val);
      else level.unshift(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    res.push(level);
    leftToRight = !leftToRight;
  }
  return res;
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const TREES_BATCH2 = [
  {
    slug: 'binary-tree-preorder-traversal',
    title: 'Binary Tree Preorder Traversal',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-7-tests/binary-tree-preorder-traversal.json',
    sample_input: '[1,null,2,3]',
    sample_output: '[1,2,3]',
    description: `Given the \`root\` of a binary tree, return *the preorder traversal of its nodes' values*.

### Example 1:
\`\`\`
     1
      \\
       2
      /
     3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [1,2,3]

### Example 2:
**Input:** root = []
**Output:** []

### Example 3:
**Input:** root = [1]
**Output:** [1]

### Constraints:
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      const t21 = buildFullTree(6);
      const t22 = buildSkewedTree(200, true);
      const t23 = buildSkewedTree(200, false);
      const t24 = new TreeNode(1, buildFullTree(4), buildFullTree(4));
      const t25 = buildFullTree(8);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(treePreorder(t21)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(treePreorder(t22)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(treePreorder(t23)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(treePreorder(t24)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(treePreorder(t25)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  const res = [];
  function dfs(node) {
    if (!node) return;
    res.push(node.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return res;
}`
  },
  {
    slug: 'binary-tree-postorder-traversal',
    title: 'Binary Tree Postorder Traversal',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-7-tests/binary-tree-postorder-traversal.json',
    sample_input: '[1,null,2,3]',
    sample_output: '[3,2,1]',
    description: `Given the \`root\` of a binary tree, return *the postorder traversal of its nodes' values*.

### Example 1:
\`\`\`
     1
      \\
       2
      /
     3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [3,2,1]

### Example 2:
**Input:** root = []
**Output:** []

### Example 3:
**Input:** root = [1]
**Output:** [1]

### Constraints:
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      const t21 = buildFullTree(6);
      const t22 = buildSkewedTree(200, true);
      const t23 = buildSkewedTree(200, false);
      const t24 = new TreeNode(1, buildFullTree(4), buildFullTree(4));
      const t25 = buildFullTree(8);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(treePostorder(t21)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(treePostorder(t22)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(treePostorder(t23)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(treePostorder(t24)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(treePostorder(t25)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  const res = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    dfs(node.right);
    res.push(node.val);
  }
  dfs(root);
  return res;
}`
  },
  {
    slug: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-8-tests/binary-tree-level-order-traversal.json',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '[[3],[9,20],[15,7]]',
    description: `Given the \`root\` of a binary tree, return *the level order traversal of its nodes' values*. (i.e., from left to right, level by level).

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[3],[9,20],[15,7]]

### Example 2:
**Input:** root = [1]
**Output:** [[1]]

### Example 3:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      const t21 = buildFullTree(6);
      const t22 = buildSkewedTree(120, true);
      const t23 = buildSkewedTree(120, false);
      const t24 = new TreeNode(1, buildFullTree(5), buildFullTree(4));
      const t25 = buildFullTree(8);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(treeLevelOrder(t21)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(treeLevelOrder(t22)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(treeLevelOrder(t23)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(treeLevelOrder(t24)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(treeLevelOrder(t25)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return [];
  const res = [];
  const q = [root];
  while (q.length > 0) {
    const len = q.length;
    const level = [];
    for (let i = 0; i < len; i++) {
      const node = q.shift();
      level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    res.push(level);
  }
  return res;
}`
  },
  {
    slug: 'binary-tree-level-order-traversal-ii',
    title: 'Binary Tree Level Order Traversal II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-8-tests/binary-tree-level-order-traversal-ii.json',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '[[15,7],[9,20],[3]]',
    description: `Given the \`root\` of a binary tree, return *the bottom-up level order traversal of its nodes' values*. (i.e., from left to right, level by level from leaf to root).

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[15,7],[9,20],[3]]

### Example 2:
**Input:** root = [1]
**Output:** [[1]]

### Example 3:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      const t21 = buildFullTree(6);
      const t22 = buildSkewedTree(120, true);
      const t23 = buildSkewedTree(120, false);
      const t24 = new TreeNode(1, buildFullTree(5), buildFullTree(4));
      const t25 = buildFullTree(8);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(treeLevelOrder(t21).reverse()), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(treeLevelOrder(t22).reverse()), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(treeLevelOrder(t23).reverse()), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(treeLevelOrder(t24).reverse()), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(treeLevelOrder(t25).reverse()), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return [];
  const res = [];
  const q = [root];
  while (q.length > 0) {
    const len = q.length;
    const level = [];
    for (let i = 0; i < len; i++) {
      const node = q.shift();
      level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    res.unshift(level);
  }
  return res;
}`
  },
  {
    slug: 'binary-tree-zigzag-level-order-traversal',
    title: 'Binary Tree Zigzag Level Order Traversal',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-21-tests/binary-tree-zigzag-level-order-traversal.json',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '[[3],[20,9],[15,7]]',
    description: `Given the \`root\` of a binary tree, return *the zigzag level order traversal of its nodes' values*. (i.e., from left to right, then right to left for the next level and alternate between).

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[3],[20,9],[15,7]]

### Example 2:
**Input:** root = [1]
**Output:** [[1]]

### Example 3:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      const t21 = buildFullTree(6);
      const t22 = buildSkewedTree(120, true);
      const t23 = buildSkewedTree(120, false);
      const t24 = new TreeNode(1, buildFullTree(5), buildFullTree(4));
      const t25 = buildFullTree(8);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(treeZigzagLevelOrder(t21)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(treeZigzagLevelOrder(t22)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(treeZigzagLevelOrder(t23)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(treeZigzagLevelOrder(t24)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(treeZigzagLevelOrder(t25)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return [];
  const res = [];
  const q = [root];
  let leftToRight = true;
  while (q.length > 0) {
    const len = q.length;
    const level = [];
    for (let i = 0; i < len; i++) {
      const node = q.shift();
      if (leftToRight) {
        level.push(node.val);
      } else {
        level.unshift(node.val);
      }
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    res.push(level);
    leftToRight = !leftToRight;
  }
  return res;
}`
  },
  {
    slug: 'path-sum',
    title: 'Path Sum',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-12-tests/path-sum.json',
    sample_input: '[5,4,8,11,null,13,4,7,2,null,null,null,1], 22',
    sample_output: 'true',
    description: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return \`true\` if the tree has a **root-to-leaf** path such that adding up all the values along the path equals \`targetSum\`.

A **leaf** is a node with no children.

### Example 1:
\`\`\`
       5
      / \\
     4   8
    /   / \\
   11  13  4
  /  \\      \\
 7    2      1
\`\`\`
**Input:** root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22
**Output:** true
**Explanation:** The root-to-leaf path with the target sum is 5 -> 4 -> 11 -> 2.

### Example 2:
\`\`\`
     1
    / \\
   2   3
\`\`\`
**Input:** root = [1,2,3], targetSum = 5
**Output:** false

### Example 3:
**Input:** root = [], targetSum = 0
**Output:** false

### Constraints:
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-1000 <= Node.val <= 1000\`
- \`-1000 <= targetSum <= 1000\``,
    generateExtraTestCases: () => {
      // 21: Skewed tree depth 200, sum = sum(1..200) = 20100 -> true
      const t21 = buildSkewedTree(200, true);
      const target21 = (200 * 201) / 2;
      // 22: Skewed tree depth 200, target off by 1 -> false
      const t22 = buildSkewedTree(200, true);
      const target22 = target21 + 1;
      // 23: Full tree depth 7 with constant node values 2 -> each root-to-leaf path has 7 nodes with sum 14
      const t23 = buildFullTree(7, () => 2);
      const target23 = 14;
      // 24: Same tree depth 7 with targetSum = 6 (internal node matches, but not leaf!) -> false
      const t24 = buildFullTree(7, () => 2);
      const target24 = 6;
      // 25: Balanced tree with negative values
      const t25 = new TreeNode(10, new TreeNode(-5, new TreeNode(15)), new TreeNode(20, new TreeNode(-10)));
      // path 10 -> -5 -> 15 = 20
      // path 10 -> 20 -> -10 = 20
      const target25 = 20;

      return [
        { input: `${JSON.stringify(serializeTree(t21))}, ${target21}`, output: 'true', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t22))}, ${target22}`, output: 'false', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t23))}, ${target23}`, output: 'true', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t24))}, ${target24}`, output: 'false', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t25))}, ${target25}`, output: 'true', is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root, targetSum) {
  if (!root) return false;
  if (!root.left && !root.right) return root.val === targetSum;
  return solution(root.left, targetSum - root.val) || solution(root.right, targetSum - root.val);
}`
  },
  {
    slug: 'path-sum-ii',
    title: 'Path Sum II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-13-tests/path-sum-ii.json',
    sample_input: '[5,4,8,11,null,13,4,7,2,null,null,5,1], 22',
    sample_output: '[[5,4,11,2],[5,8,4,5]]',
    description: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return *all **root-to-leaf** paths where the sum of the node values in the path equals* \`targetSum\`. Each path should be returned as a list of the node values, not node references.

A **root-to-leaf** path is a path starting from the root and ending at any leaf node. A **leaf** is a node with no children.

### Example 1:
\`\`\`
       5
      / \\
     4   8
    /   / \\
   11  13  4
  /  \\    / \\
 7    2  5   1
\`\`\`
**Input:** root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22
**Output:** [[5,4,11,2],[5,8,4,5]]

### Example 2:
\`\`\`
     1
    / \\
   2   3
\`\`\`
**Input:** root = [1,2,3], targetSum = 5
**Output:** []

### Example 3:
**Input:** root = [1,2], targetSum = 0
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-1000 <= Node.val <= 1000\`
- \`-1000 <= targetSum <= 1000\``,
    generateExtraTestCases: () => {
      // 21: Skewed path of depth 50: [1, 2, ..., 50], sum = 1275 -> [[1, 2, ..., 50]]
      const t21 = buildSkewedTree(50, true);
      const exp21 = [Array.from({ length: 50 }, (_, i) => i + 1)];
      const target21 = (50 * 51) / 2;
      // 22: Tree with two distinct paths summing to 10
      const t22 = new TreeNode(5, new TreeNode(2, new TreeNode(3)), new TreeNode(1, new TreeNode(4)));
      const exp22 = [[5, 2, 3], [5, 1, 4]];
      const target22 = 10;
      // 23: Sum matches internal node, but not leaf -> []
      const t23 = new TreeNode(5, new TreeNode(5, new TreeNode(5)), null);
      const exp23 = [];
      const target23 = 10;
      // 24: Single root matching target
      const t24 = new TreeNode(7);
      const exp24 = [[7]];
      const target24 = 7;
      // 25: Tree with 3 paths summing to 15
      const t25 = new TreeNode(5,
        new TreeNode(5, new TreeNode(5), new TreeNode(5)),
        new TreeNode(5, new TreeNode(5), new TreeNode(10))
      );
      // Paths: [5,5,5] -> 15, [5,5,5] -> 15, [5,5,5] -> 15, [5,5,10] -> 20
      const exp25 = [[5, 5, 5], [5, 5, 5], [5, 5, 5]];
      const target25 = 15;

      return [
        { input: `${JSON.stringify(serializeTree(t21))}, ${target21}`, output: JSON.stringify(exp21), is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t22))}, ${target22}`, output: JSON.stringify(exp22), is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t23))}, ${target23}`, output: JSON.stringify(exp23), is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t24))}, ${target24}`, output: JSON.stringify(exp24), is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t25))}, ${target25}`, output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root, targetSum) {
  const res = [];
  function dfs(node, sum, path) {
    if (!node) return;
    path.push(node.val);
    if (!node.left && !node.right && sum === node.val) {
      res.push([...path]);
    } else {
      dfs(node.left, sum - node.val, path);
      dfs(node.right, sum - node.val, path);
    }
    path.pop();
  }
  dfs(root, targetSum, []);
  return res;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Trees Batch 2 (7 Problems) ===\n');

  for (const prob of TREES_BATCH2) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await safeQuery('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`Problem ${prob.slug} NOT FOUND in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update metadata & description
    await safeQuery(
      `UPDATE problems 
       SET title = $1, difficulty = $2, description = $3, sample_input = $4, sample_output = $5
       WHERE id = $6`,
      [prob.title, prob.difficulty, prob.description, prob.sample_input, prob.sample_output, problemId]
    );
    console.log(`✓ Metadata & LeetCode description updated.`);

    // 3. Load 20 existing test cases from JSON file
    const rootDir = path.join(__dirname, '../..');
    const fullJsonPath = path.join(rootDir, prob.jsonPath);
    const existingRaw = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

    const baseTestCases = existingRaw.slice(0, 20).map((tc, idx) => ({
      input: tc.input,
      output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
      is_hidden: idx >= 3
    }));

    // 4. Generate 5 extra curated edge cases & stress tests
    const extraTestCases = prob.generateExtraTestCases();
    const finalTestCases = [...baseTestCases, ...extraTestCases];

    if (finalTestCases.length !== 25) {
      throw new Error(`Expected exactly 25 test cases for ${prob.slug}, got ${finalTestCases.length}`);
    }

    // 5. Delete and seed exactly 25 test cases
    await safeQuery('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    for (let i = 0; i < finalTestCases.length; i++) {
      const tc = finalTestCases[i];
      await safeQuery(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }
    console.log(`✓ Seeded exactly 25 test cases (TC 25 length: ${finalTestCases[24].input.length} chars).`);

    // 6. Validate Optimal Solution with Judge
    const optimalResult = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(
      `✓ Optimal Solution: verdict = ${optimalResult.verdict} (${optimalResult.passedTests}/${optimalResult.totalTests} in ${optimalResult.runtimeMs}ms)`
    );
    if (optimalResult.verdict !== 'ACCEPTED' || optimalResult.passedTests !== 25) {
      console.error('OPTIMAL SOLUTION FAILED!', optimalResult);
      process.exit(1);
    }
  }

  console.log('\n=====================================================');
  console.log('✓ All 7 Tree Traversals & Path Sum problems successfully upgraded and verified (25/25 ACCEPTED)!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

