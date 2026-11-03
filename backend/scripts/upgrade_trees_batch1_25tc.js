'use strict';

/**
 * upgrade_trees_batch1_25tc.js
 *
 * Upgrades 7 Classic Tree Properties & Traversals problems to exactly 25 curated test cases:
 * 1. Maximum Depth of Binary Tree (LC 104)
 * 2. Minimum Depth of Binary Tree (LC 111)
 * 3. Balanced Binary Tree (LC 110)
 * 4. Same Tree (LC 100)
 * 5. Symmetric Tree (LC 101)
 * 6. Invert Binary Tree (LC 226)
 * 7. Binary Tree Inorder Traversal (LC 94)
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

function treeInorder(root) {
  const res = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    res.push(node.val);
    dfs(node.right);
  }
  dfs(root);
  return res;
}

function treeInvert(node) {
  if (!node) return null;
  const left = treeInvert(node.left);
  const right = treeInvert(node.right);
  node.left = right;
  node.right = left;
  return node;
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const TREES_BATCH1 = [
  {
    slug: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-35-tests/maximum-depth-of-binary-tree.json',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '3',
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** 3

### Example 2:
\`\`\`
     1
      \\
       2
\`\`\`
**Input:** root = [1,null,2]
**Output:** 2

### Constraints:
- The number of nodes in the tree is in the range \`[0, 10⁴]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      // 5 extra test cases (TC 21-25)
      // 21: Full binary tree depth 7
      const t21 = buildFullTree(7);
      // 22: Left-skewed tree depth 300
      const t22 = buildSkewedTree(300, true);
      // 23: Right-skewed tree depth 500
      const t23 = buildSkewedTree(500, false);
      // 24: Unbalanced tree: left depth 400, right depth 2
      const t24 = new TreeNode(1);
      t24.left = buildSkewedTree(399, true);
      t24.right = new TreeNode(2);
      // 25: Large full binary tree depth 10 (1023 nodes)
      const t25 = buildFullTree(10);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: '7', is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: '300', is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: '500', is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: '400', is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: '10', is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return 0;
  return 1 + Math.max(solution(root.left), solution(root.right));
}`
  },
  {
    slug: 'minimum-depth-of-binary-tree',
    title: 'Minimum Depth of Binary Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-35-tests/minimum-depth-of-binary-tree.json',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '2',
    description: `Given a binary tree, find its minimum depth.

The **minimum depth** is the number of nodes along the shortest path from the root node down to the nearest leaf node.

**Note:** A leaf is a node with no children.

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** 2

### Example 2:
\`\`\`
     2
      \\
       3
        \\
         4
          \\
           5
            \\
             6
\`\`\`
**Input:** root = [2,null,3,null,4,null,5,null,6]
**Output:** 5

### Constraints:
- The number of nodes in the tree is in the range \`[0, 10⁵]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      // 21: Right-skewed chain of length 400
      const t21 = buildSkewedTree(400, false);
      // 22: Left-skewed chain of length 600
      const t22 = buildSkewedTree(600, true);
      // 23: Full binary tree of depth 9
      const t23 = buildFullTree(9);
      // 24: Unbalanced tree: left branch depth 500, right branch is single leaf node
      const t24 = new TreeNode(1);
      t24.left = buildSkewedTree(499, true);
      t24.right = new TreeNode(2);
      // 25: Tree where left subtree has depth 300, right subtree has depth 4
      const t25 = new TreeNode(1);
      t25.left = buildSkewedTree(299, true);
      t25.right = buildFullTree(3);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: '400', is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: '600', is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: '9', is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: '2', is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: '4', is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return 0;
  if (!root.left) return 1 + solution(root.right);
  if (!root.right) return 1 + solution(root.left);
  return 1 + Math.min(solution(root.left), solution(root.right));
}`
  },
  {
    slug: 'balanced-binary-tree',
    title: 'Balanced Binary Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-8-tests/balanced-binary-tree.json',
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: 'true',
    description: `Given a binary tree, determine if it is **height-balanced**.

A **height-balanced** binary tree is defined as a binary tree in which the depth of the two subtrees of every node never differs by more than one.

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** true

### Example 2:
\`\`\`
            1
          /   \\
         2     2
        / \\
       3   3
      / \\
     4   4
\`\`\`
**Input:** root = [1,2,2,3,3,null,null,4,4]
**Output:** false

### Example 3:
**Input:** root = []
**Output:** true

### Constraints:
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-10⁴ <= Node.val <= 10⁴\``,
    generateExtraTestCases: () => {
      // 21: Full binary tree depth 8 (255 nodes) -> true
      const t21 = buildFullTree(8);
      // 22: Left-skewed tree depth 300 -> false
      const t22 = buildSkewedTree(300, true);
      // 23: Full binary tree depth 10 (1023 nodes) -> true
      const t23 = buildFullTree(10);
      // 24: Balanced tree depth 7, except rightmost leaf has a 3-node extra chain making it unbalanced -> false
      const t24 = buildFullTree(7);
      let curr = t24;
      while (curr.right) curr = curr.right;
      curr.right = new TreeNode(99);
      curr.right.right = new TreeNode(100);
      curr.right.right.right = new TreeNode(101);
      // 25: Tree where left child has depth 8 full tree, right child has depth 7 full tree -> true
      const t25 = new TreeNode(1);
      t25.left = buildFullTree(8);
      t25.right = buildFullTree(7);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: 'true', is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: 'false', is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: 'true', is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: 'false', is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: 'true', is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  function height(node) {
    if (!node) return 0;
    const l = height(node.left);
    if (l === -1) return -1;
    const r = height(node.right);
    if (r === -1) return -1;
    if (Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
  }
  return height(root) !== -1;
}`
  },
  {
    slug: 'same-tree',
    title: 'Same Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-16-tests/same-tree.json',
    sample_input: '[1,2,3], [1,2,3]',
    sample_output: 'true',
    description: `Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.

Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.

### Example 1:
\`\`\`
     1          1
    / \\        / \\
   2   3      2   3
\`\`\`
**Input:** p = [1,2,3], q = [1,2,3]
**Output:** true

### Example 2:
\`\`\`
     1          1
    /            \\
   2              2
\`\`\`
**Input:** p = [1,2], q = [1,null,2]
**Output:** false

### Example 3:
\`\`\`
     1          1
    / \\        / \\
   2   1      1   2
\`\`\`
**Input:** p = [1,2,1], q = [1,1,2]
**Output:** false

### Constraints:
- The number of nodes in both trees is in the range \`[0, 100]\`.
- \`-10⁴ <= Node.val <= 10⁴\``,
    generateExtraTestCases: () => {
      // 21: Large identical full binary trees of depth 8 (255 nodes) -> true
      const t21a = buildFullTree(8);
      const t21b = buildFullTree(8);
      // 22: Large full binary trees of depth 8 differing at rightmost leaf -> false
      const t22a = buildFullTree(8);
      const t22b = buildFullTree(8);
      let currb = t22b;
      while (currb.right) currb = currb.right;
      currb.val = 99999;
      // 23: Identical skewed trees of depth 300 -> true
      const t23a = buildSkewedTree(300, true);
      const t23b = buildSkewedTree(300, true);
      // 24: Skewed trees of depth 300 differing at very last node -> false
      const t24a = buildSkewedTree(300, true);
      const t24b = buildSkewedTree(300, true);
      let cur4b = t24b;
      while (cur4b.left) cur4b = cur4b.left;
      cur4b.val = -8888;
      // 25: Large identical balanced trees depth 9 (511 nodes) -> true
      const t25a = buildFullTree(9);
      const t25b = buildFullTree(9);

      return [
        { input: `${JSON.stringify(serializeTree(t21a))}, ${JSON.stringify(serializeTree(t21b))}`, output: 'true', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t22a))}, ${JSON.stringify(serializeTree(t22b))}`, output: 'false', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t23a))}, ${JSON.stringify(serializeTree(t23b))}`, output: 'true', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t24a))}, ${JSON.stringify(serializeTree(t24b))}`, output: 'false', is_hidden: true },
        { input: `${JSON.stringify(serializeTree(t25a))}, ${JSON.stringify(serializeTree(t25b))}`, output: 'true', is_hidden: true },
      ];
    },
    optimalCode: `
function solution(p, q) {
  if (!p && !q) return true;
  if (!p || !q || p.val !== q.val) return false;
  return solution(p.left, q.left) && solution(p.right, q.right);
}`
  },
  {
    slug: 'symmetric-tree',
    title: 'Symmetric Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-28-tests/symmetric-tree.json',
    sample_input: '[1,2,2,3,4,4,3]',
    sample_output: 'true',
    description: `Given the \`root\` of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).

### Example 1:
\`\`\`
        1
      /   \\
     2     2
    / \\   / \\
   3   4 4   3
\`\`\`
**Input:** root = [1,2,2,3,4,4,3]
**Output:** true

### Example 2:
\`\`\`
        1
      /   \\
     2     2
      \\     \\
       3     3
\`\`\`
**Input:** root = [1,2,2,null,3,null,3]
**Output:** false

### Constraints:
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      // Helper to build symmetric tree of given depth
      function buildSymmetric(depth) {
        if (depth === 0) return null;
        function helper(d, val) {
          if (d === 0) return null;
          const leftNode = new TreeNode(val);
          const rightNode = new TreeNode(val);
          if (d > 1) {
            const innerLeft = helper(d - 1, val * 2);
            const innerRight = helper(d - 1, val * 2 + 1);
            leftNode.left = innerLeft ? innerLeft.left : null;
            leftNode.right = innerRight ? innerRight.left : null;
            rightNode.left = innerRight ? innerRight.right : null;
            rightNode.right = innerLeft ? innerLeft.right : null;
          }
          return { left: leftNode, right: rightNode };
        }
        const root = new TreeNode(1);
        if (depth > 1) {
          function buildSym(d, v) {
            if (d === 0) return null;
            const node = new TreeNode(v);
            node.left = buildSym(d - 1, v * 2);
            node.right = buildSym(d - 1, v * 2 + 1);
            return node;
          }
          function mirror(node) {
            if (!node) return null;
            const m = new TreeNode(node.val);
            m.left = mirror(node.right);
            m.right = mirror(node.left);
            return m;
          }
          const leftSub = buildSym(depth - 1, 2);
          root.left = leftSub;
          root.right = mirror(leftSub);
        }
        return root;
      }

      // 21: Symmetric tree depth 7
      const t21 = buildSymmetric(7);
      // 22: Symmetric tree depth 7 with rightmost leaf modified
      const t22 = buildSymmetric(7);
      let curr = t22;
      while (curr.right) curr = curr.right;
      curr.val = 999;
      // 23: Symmetric zigzag tree
      const t23 = new TreeNode(1);
      t23.left = new TreeNode(2, null, new TreeNode(3));
      t23.right = new TreeNode(2, new TreeNode(3), null);
      // 24: Symmetric tree depth 8
      const t24 = buildSymmetric(8);
      // 25: Massive symmetric tree depth 9 (511 nodes)
      const t25 = buildSymmetric(9);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: 'true', is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: 'false', is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: 'true', is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: 'true', is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: 'true', is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return true;
  function isMirror(t1, t2) {
    if (!t1 && !t2) return true;
    if (!t1 || !t2 || t1.val !== t2.val) return false;
    return isMirror(t1.left, t2.right) && isMirror(t1.right, t2.left);
  }
  return isMirror(root.left, root.right);
}`
  },
  {
    slug: 'invert-binary-tree',
    title: 'Invert Binary Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-26-tests/invert-binary-tree.json',
    sample_input: '[4,2,7,1,3,6,9]',
    sample_output: '[4,7,2,9,6,3,1]',
    description: `Given the \`root\` of a binary tree, invert the tree, and return *its root*.

### Example 1:
\`\`\`
       4                   4
     /   \\               /   \\
    2     7     ==>     7     2
   / \\   / \\           / \\   / \\
  1   3 6   9         9   6 3   1
\`\`\`
**Input:** root = [4,2,7,1,3,6,9]
**Output:** [4,7,2,9,6,3,1]

### Example 2:
\`\`\`
     2           2
    / \\   ==>   / \\
   1   3       3   1
\`\`\`
**Input:** root = [2,1,3]
**Output:** [2,3,1]

### Example 3:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      // 21: Full tree depth 6
      const t21 = buildFullTree(6);
      const exp21 = serializeTree(treeInvert(buildFullTree(6)));
      // 22: Left-skewed tree depth 150
      const t22 = buildSkewedTree(150, true);
      const exp22 = serializeTree(treeInvert(buildSkewedTree(150, true)));
      // 23: Right-skewed tree depth 150
      const t23 = buildSkewedTree(150, false);
      const exp23 = serializeTree(treeInvert(buildSkewedTree(150, false)));
      // 24: Single root with two leaves
      const t24 = new TreeNode(10, new TreeNode(20), new TreeNode(30));
      const exp24 = [10, 30, 20];
      // 25: Full tree depth 8 (255 nodes)
      const t25 = buildFullTree(8);
      const exp25 = serializeTree(treeInvert(buildFullTree(8)));

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(exp21), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(exp22), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(exp23), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(exp24), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return null;
  const left = solution(root.left);
  const right = solution(root.right);
  root.left = right;
  root.right = left;
  return root;
}`
  },
  {
    slug: 'binary-tree-inorder-traversal',
    title: 'Binary Tree Inorder Traversal',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-7-tests/binary-tree-inorder-traversal.json',
    sample_input: '[1,null,2,3]',
    sample_output: '[1,3,2]',
    description: `Given the \`root\` of a binary tree, return *the inorder traversal of its nodes' values*.

### Example 1:
\`\`\`
     1
      \\
       2
      /
     3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [1,3,2]

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
      // 21: Full binary tree depth 6
      const t21 = buildFullTree(6);
      const exp21 = treeInorder(t21);
      // 22: Left-skewed tree depth 200 (inorder is reverse order)
      const t22 = buildSkewedTree(200, true);
      const exp22 = treeInorder(t22);
      // 23: Right-skewed tree depth 200 (inorder is forward order)
      const t23 = buildSkewedTree(200, false);
      const exp23 = treeInorder(t23);
      // 24: Balanced BST with 127 nodes (inorder is sorted)
      function buildBST(l, r) {
        if (l > r) return null;
        const mid = Math.floor((l + r) / 2);
        const node = new TreeNode(mid);
        node.left = buildBST(l, mid - 1);
        node.right = buildBST(mid + 1, r);
        return node;
      }
      const t24 = buildBST(1, 127);
      const exp24 = treeInorder(t24);
      // 25: Full binary tree depth 8 (255 nodes)
      const t25 = buildFullTree(8);
      const exp25 = treeInorder(t25);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(exp21), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(exp22), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(exp23), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(exp24), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  const res = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    res.push(node.val);
    dfs(node.right);
  }
  dfs(root);
  return res;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Trees Batch 1 (7 Problems) ===\n');

  for (const prob of TREES_BATCH1) {
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
  console.log('✓ All 7 Classic Tree problems successfully upgraded and verified (25/25 ACCEPTED)!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

