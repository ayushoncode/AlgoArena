'use strict';

/**
 * upgrade_trees_batch3_25tc.js
 *
 * Upgrades 7 BST & Node Pointer problems to exactly 25 curated test cases:
 * 1. Validate Binary Search Tree (LC 98)
 * 2. Lowest Common Ancestor of BST (LC 235)
 * 3. Convert Sorted Array to Binary Search Tree (LC 108)
 * 4. Convert Sorted List to Binary Search Tree (LC 109)
 * 5. Sum Root to Leaf Numbers (LC 129)
 * 6. Populating Next Right Pointers in Each Node (LC 116)
 * 7. Populating Next Right Pointers in Each Node II (LC 117)
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

function TreeNode(val, left, right, next) {
  this.val = val === undefined ? 0 : val;
  this.left = left === undefined ? null : left;
  this.right = right === undefined ? null : right;
  this.next = next === undefined ? null : next;
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

function serializeTreeNext(root) {
  const res = [];
  let leftmost = root;
  while (leftmost) {
    let curr = leftmost;
    let nextLeftmost = null;
    while (curr) {
      res.push(curr.val);
      if (!nextLeftmost) {
        if (curr.left) nextLeftmost = curr.left;
        else if (curr.right) nextLeftmost = curr.right;
      }
      curr = curr.next;
    }
    res.push('#');
    if (!nextLeftmost) {
      let temp = leftmost;
      while (temp && !nextLeftmost) {
        if (temp.left) nextLeftmost = temp.left;
        else if (temp.right) nextLeftmost = temp.right;
        temp = temp.next;
      }
    }
    leftmost = nextLeftmost;
  }
  return res;
}

function buildBSTFromArray(nums) {
  if (!nums || !nums.length) return null;
  function build(l, r) {
    if (l > r) return null;
    const mid = Math.floor((l + r) / 2);
    const node = new TreeNode(nums[mid]);
    node.left = build(l, mid - 1);
    node.right = build(mid + 1, r);
    return node;
  }
  return build(0, nums.length - 1);
}

function buildBSTFromListHelper(nums) {
  if (!nums || !nums.length) return null;
  function build(l, r) {
    if (l > r) return null;
    const mid = Math.floor((l + r + 1) / 2);
    const node = new TreeNode(nums[mid]);
    node.left = build(l, mid - 1);
    node.right = build(mid + 1, r);
    return node;
  }
  return build(0, nums.length - 1);
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const TREES_BATCH3 = [
  {
    slug: 'validate-binary-search-tree',
    title: 'Validate Binary Search Tree',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-35-tests/validate-binary-search-tree.json',
    sample_input: '[2,1,3]',
    sample_output: 'true',
    description: `Given the \`root\` of a binary tree, determine if it is a valid binary search tree (BST).

A **valid BST** is defined as follows:
- The left subtree of a node contains only nodes with keys **less than** the node's key.
- The right subtree of a node contains only nodes with keys **greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

### Example 1:
\`\`\`
     2
    / \\
   1   3
\`\`\`
**Input:** root = [2,1,3]
**Output:** true

### Example 2:
\`\`\`
     5
    / \\
   1   4
      / \\
     3   6
\`\`\`
**Input:** root = [5,1,4,null,null,3,6]
**Output:** false
**Explanation:** The root node's value is 5 but its right child's value is 4.

### Constraints:
- The number of nodes in the tree is in the range \`[1, 10⁴]\`.
- \`-2³¹ <= Node.val <= 2³¹ - 1\``,
    generateExtraTestCases: () => {
      // 21: Large valid BST with 127 nodes
      const nums21 = Array.from({ length: 127 }, (_, i) => i * 10);
      const t21 = buildBSTFromArray(nums21);
      // 22: Large BST with 127 nodes, but rightmost node violates BST property
      const t22 = buildBSTFromArray(nums21);
      let curr = t22;
      while (curr.right) curr = curr.right;
      curr.val = -500;
      // 23: Left-skewed decreasing tree (valid BST)
      const t23 = new TreeNode(500);
      let c23 = t23;
      for (let i = 499; i >= 300; i--) {
        c23.left = new TreeNode(i);
        c23 = c23.left;
      }
      // 24: Tree with duplicate values: [2, 2, 2] -> false
      const t24 = new TreeNode(2, new TreeNode(2), new TreeNode(2));
      // 25: Large valid BST with 255 nodes
      const nums25 = Array.from({ length: 255 }, (_, i) => (i - 128) * 100);
      const t25 = buildBSTFromArray(nums25);

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
  function validate(node, min, max) {
    if (!node) return true;
    if ((min !== null && node.val <= min) || (max !== null && node.val >= max)) return false;
    return validate(node.left, min, node.val) && validate(node.right, node.val, max);
  }
  return validate(root, null, null);
}`
  },
  {
    slug: 'lowest-common-ancestor-of-bst',
    title: 'Lowest Common Ancestor of BST',
    difficulty: 'medium',
    sample_input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 8',
    sample_output: '6',
    description: `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.

According to the **definition of LCA on Wikipedia**: "The lowest common ancestor is defined between two nodes \`p\` and \`q\` as the lowest node in \`T\` that has both \`p\` and \`q\` as descendants (where we allow **a node to be a descendant of itself**)."

### Example 1:
\`\`\`
        6
      /   \\
     2     8
    / \\   / \\
   0   4 7   9
      / \\
     3   5
\`\`\`
**Input:** root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8
**Output:** 6
**Explanation:** The LCA of nodes 2 and 8 is 6.

### Example 2:
\`\`\`
        6
      /   \\
     2     8
    / \\   / \\
   0   4 7   9
      / \\
     3   5
\`\`\`
**Input:** root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4
**Output:** 2
**Explanation:** The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself according to the LCA definition.

### Example 3:
**Input:** root = [2,1], p = 2, q = 1
**Output:** 2

### Constraints:
- The number of nodes in the tree is in the range \`[2, 10⁵]\`.
- \`-10⁹ <= Node.val <= 10⁹\`
- All \`Node.val\` are **unique**.
- \`p != q\`
- \`p\` and \`q\` will exist in the BST.`,
    customTestCases: () => {
      // Curate clean 25 test cases for LCA with correct values
      const bst1 = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5];
      const tcs = [
        // 1-3: Samples
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 8', output: '6', is_hidden: false },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 4', output: '2', is_hidden: false },
        { input: '[2,1], 2, 1', output: '2', is_hidden: false },

        // 4-10: Subtree queries on bst1
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 0, 5', output: '2', is_hidden: true },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 3, 5', output: '4', is_hidden: true },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 7, 9', output: '8', is_hidden: true },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 0, 9', output: '6', is_hidden: true },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 4, 5', output: '4', is_hidden: true },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 8, 7', output: '8', is_hidden: true },
        { input: '[6,2,8,0,4,7,9,null,null,3,5], 3, 4', output: '4', is_hidden: true },

        // 11-15: Linear / small BSTs
        { input: '[5,3,6,2,4,null,null,1], 1, 4', output: '3', is_hidden: true },
        { input: '[5,3,6,2,4,null,null,1], 1, 6', output: '5', is_hidden: true },
        { input: '[5,3,6,2,4,null,null,1], 2, 1', output: '2', is_hidden: true },
        { input: '[10,5,15,null,null,12,20], 12, 20', output: '15', is_hidden: true },
        { input: '[10,5,15,null,null,12,20], 5, 12', output: '10', is_hidden: true },

        // 16-20: Negative and 0 values
        { input: '[0,-5,5,-10,-2,2,10], -10, -2', output: '-5', is_hidden: true },
        { input: '[0,-5,5,-10,-2,2,10], -10, 10', output: '0', is_hidden: true },
        { input: '[0,-5,5,-10,-2,2,10], 2, 10', output: '5', is_hidden: true },
        { input: '[0,-5,5,-10,-2,2,10], -5, -2', output: '-5', is_hidden: true },
        { input: '[0,-5,5,-10,-2,2,10], -2, 2', output: '0', is_hidden: true },

        // 21-25: Larger BSTs
        { input: '[20,10,30,5,15,25,35,2,8,12,18,22,28,32,38], 2, 18', output: '10', is_hidden: true },
        { input: '[20,10,30,5,15,25,35,2,8,12,18,22,28,32,38], 22, 38', output: '30', is_hidden: true },
        { input: '[20,10,30,5,15,25,35,2,8,12,18,22,28,32,38], 8, 28', output: '20', is_hidden: true },
        { input: '[20,10,30,5,15,25,35,2,8,12,18,22,28,32,38], 32, 35', output: '35', is_hidden: true },
        { input: '[20,10,30,5,15,25,35,2,8,12,18,22,28,32,38], 12, 15', output: '15', is_hidden: true },
      ];
      return tcs;
    },
    optimalCode: `
function solution(root, p, q) {
  const pVal = typeof p === 'object' && p ? p.val : p;
  const qVal = typeof q === 'object' && q ? q.val : q;
  let curr = root;
  while (curr) {
    if (pVal < curr.val && qVal < curr.val) curr = curr.left;
    else if (pVal > curr.val && qVal > curr.val) curr = curr.right;
    else return curr.val;
  }
  return null;
}`
  },
  {
    slug: 'convert-sorted-array-to-binary-search-tree',
    title: 'Convert Sorted Array to Binary Search Tree',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-20-tests/convert-sorted-array-to-binary-search-tree.json',
    sample_input: '[-10,-3,0,5,9]',
    sample_output: '[0,-3,9,-10,null,5]',
    description: `Given an integer array \`nums\` where the elements are sorted in **ascending order**, convert it to a **height-balanced** binary search tree.

### Example 1:
\`\`\`
        0
      /   \\
    -3     9
    /     /
  -10    5
\`\`\`
**Input:** nums = [-10,-3,0,5,9]
**Output:** [0,-3,9,-10,null,5]
**Explanation:** [0,-10,5,null,-3,null,9] is also accepted.

### Example 2:
\`\`\`
     3       1
    /         \\
   1     or    3
\`\`\`
**Input:** nums = [1,3]
**Output:** [3,1]

### Constraints:
- \`1 <= nums.length <= 10⁴\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- \`nums\` is sorted in a **strictly increasing** order.`,
    generateExtraTestCases: () => {
      // 21: Array of 15 elements
      const a21 = Array.from({ length: 15 }, (_, i) => i * 2);
      const exp21 = serializeTree(buildBSTFromArray(a21));
      // 22: Array of 31 elements
      const a22 = Array.from({ length: 31 }, (_, i) => i * 3 - 50);
      const exp22 = serializeTree(buildBSTFromArray(a22));
      // 23: Array with negative numbers
      const a23 = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
      const exp23 = serializeTree(buildBSTFromArray(a23));
      // 24: Array of 63 elements
      const a24 = Array.from({ length: 63 }, (_, i) => i);
      const exp24 = serializeTree(buildBSTFromArray(a24));
      // 25: Array of 127 elements
      const a25 = Array.from({ length: 127 }, (_, i) => i * 5);
      const exp25 = serializeTree(buildBSTFromArray(a25));

      return [
        { input: JSON.stringify(a21), output: JSON.stringify(exp21), is_hidden: true },
        { input: JSON.stringify(a22), output: JSON.stringify(exp22), is_hidden: true },
        { input: JSON.stringify(a23), output: JSON.stringify(exp23), is_hidden: true },
        { input: JSON.stringify(a24), output: JSON.stringify(exp24), is_hidden: true },
        { input: JSON.stringify(a25), output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(nums) {
  if (!nums || !nums.length) return null;
  function build(left, right) {
    if (left > right) return null;
    const mid = Math.floor((left + right) / 2);
    const node = new TreeNode(nums[mid]);
    node.left = build(left, mid - 1);
    node.right = build(mid + 1, right);
    return node;
  }
  return build(0, nums.length - 1);
}`
  },
  {
    slug: 'convert-sorted-list-to-binary-search-tree',
    title: 'Convert Sorted List to Binary Search Tree',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-14-tests/convert-sorted-list-to-binary-search-tree.json',
    sample_input: '[-10,-3,0,5,9]',
    sample_output: '[0,-3,9,-10,null,5]',
    description: `Given the \`head\` of a singly linked list where elements are sorted in **ascending order**, convert it to a **height-balanced** binary search tree.

### Example 1:
\`\`\`
        0
      /   \\
    -3     9
    /     /
  -10    5
\`\`\`
**Input:** head = [-10,-3,0,5,9]
**Output:** [0,-3,9,-10,null,5]

### Example 2:
**Input:** head = []
**Output:** []

### Constraints:
- The number of nodes in \`head\` is in the range \`[0, 2 * 10⁴]\`.
- \`-10⁵ <= Node.val <= 10⁵\``,
    generateExtraTestCases: () => {
      // 21: List of 15 elements
      const a21 = Array.from({ length: 15 }, (_, i) => i * 2);
      const exp21 = serializeTree(buildBSTFromListHelper(a21));
      // 22: List of 31 elements
      const a22 = Array.from({ length: 31 }, (_, i) => i * 3 - 50);
      const exp22 = serializeTree(buildBSTFromListHelper(a22));
      // 23: List with negative numbers
      const a23 = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
      const exp23 = serializeTree(buildBSTFromListHelper(a23));
      // 24: List of 63 elements
      const a24 = Array.from({ length: 63 }, (_, i) => i);
      const exp24 = serializeTree(buildBSTFromListHelper(a24));
      // 25: List of 127 elements
      const a25 = Array.from({ length: 127 }, (_, i) => i * 5);
      const exp25 = serializeTree(buildBSTFromListHelper(a25));

      return [
        { input: JSON.stringify(a21), output: JSON.stringify(exp21), is_hidden: true },
        { input: JSON.stringify(a22), output: JSON.stringify(exp22), is_hidden: true },
        { input: JSON.stringify(a23), output: JSON.stringify(exp23), is_hidden: true },
        { input: JSON.stringify(a24), output: JSON.stringify(exp24), is_hidden: true },
        { input: JSON.stringify(a25), output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(head) {
  const nums = [];
  let curr = head;
  while (curr) { nums.push(curr.val); curr = curr.next; }
  function helper(l, r) {
    if (l > r) return null;
    const mid = Math.floor((l + r + 1) / 2);
    const node = new TreeNode(nums[mid]);
    node.left = helper(l, mid - 1);
    node.right = helper(mid + 1, r);
    return node;
  }
  return helper(0, nums.length - 1);
}`
  },
  {
    slug: 'sum-root-to-leaf-numbers',
    title: 'Sum Root to Leaf Numbers',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-27-tests/sum-root-to-leaf-numbers.json',
    sample_input: '[1,2,3]',
    sample_output: '25',
    description: `You are given the \`root\` of a binary tree containing digits from \`0\` to \`9\` only.

Each root-to-leaf path in the tree represents a number.
- For example, the root-to-leaf path \`1 -> 2 -> 3\` represents the number \`123\`.

Return *the total sum of all root-to-leaf numbers*. Test cases are generated so that the answer will fit in a **32-bit** integer.

A **leaf** node is a node with no children.

### Example 1:
\`\`\`
     1
    / \\
   2   3
\`\`\`
**Input:** root = [1,2,3]
**Output:** 25
**Explanation:**
The root-to-leaf path 1->2 represents the number 12.
The root-to-leaf path 1->3 represents the number 13.
Therefore, sum = 12 + 13 = 25.

### Example 2:
\`\`\`
       4
      / \\
     9   0
    / \\
   5   1
\`\`\`
**Input:** root = [4,9,0,5,1]
**Output:** 1026
**Explanation:**
The root-to-leaf path 4->9->5 represents the number 495.
The root-to-leaf path 4->9->1 represents the number 491.
The root-to-leaf path 4->0 represents the number 40.
Therefore, sum = 495 + 491 + 40 = 1026.

### Constraints:
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`0 <= Node.val <= 9\`
- The depth of the tree will not exceed \`10\`.`,
    generateExtraTestCases: () => {
      function calcSum(root) {
        function dfs(node, cur) {
          if (!node) return 0;
          cur = cur * 10 + node.val;
          if (!node.left && !node.right) return cur;
          return dfs(node.left, cur) + dfs(node.right, cur);
        }
        return dfs(root, 0);
      }

      // 21: Full tree depth 5 with all 1s
      const t21 = buildFullTree(5, () => 1);
      // 22: Skewed tree depth 7 with digits 1..7 -> 1234567
      const t22 = new TreeNode(1);
      let c22 = t22;
      for (let i = 2; i <= 7; i++) {
        c22.left = new TreeNode(i);
        c22 = c22.left;
      }
      // 23: Full tree depth 6 with alternating digits
      const t23 = buildFullTree(6, (d, i) => (i % 9) + 1);
      // 24: Tree with lots of zeros
      const t24 = new TreeNode(1, new TreeNode(0, new TreeNode(0), new TreeNode(5)), new TreeNode(0, null, new TreeNode(2)));
      // 25: Full tree depth 7 with varied digits
      const t25 = buildFullTree(7, (d, i) => ((d * 3 + i) % 9) + 1);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: String(calcSum(t21)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: String(calcSum(t22)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: String(calcSum(t23)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: String(calcSum(t24)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: String(calcSum(t25)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  function dfs(node, currSum) {
    if (!node) return 0;
    currSum = currSum * 10 + node.val;
    if (!node.left && !node.right) return currSum;
    return dfs(node.left, currSum) + dfs(node.right, currSum);
  }
  return dfs(root, 0);
}`
  },
  {
    slug: 'populating-next-right-pointers-in-each-node',
    title: 'Populating Next Right Pointers in Each Node',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-16-tests/populating-next-right-pointers-in-each-node.json',
    sample_input: '[1,2,3,4,5,6,7]',
    sample_output: '[1,2,3,4,5,6,7]',
    description: `You are given a **perfect binary tree** where all leaves are on the same level, and every parent has two children. The binary tree has the following definition:

\`\`\`c
struct Node {
  int val;
  Node *left;
  Node *right;
  Node *next;
};
\`\`\`

Populate each next pointer to point to its next right node. If there is no next right node, the next pointer should be set to \`NULL\`.

Initially, all next pointers are set to \`NULL\`.

### Example 1:
\`\`\`
        1 ---> NULL
       / \\
      2 -> 3 -> NULL
     / \\  / \\
    4->5->6->7 -> NULL
\`\`\`
**Input:** root = [1,2,3,4,5,6,7]
**Output:** [1,2,3,4,5,6,7]

### Example 2:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 2¹² - 1]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      // Perfect binary trees of depth 4, 5, 6, 7, 8
      const t21 = buildFullTree(4);
      const t22 = buildFullTree(5);
      const t23 = buildFullTree(6);
      const t24 = buildFullTree(7);
      const t25 = buildFullTree(8);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(serializeTree(t21)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(serializeTree(t22)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(serializeTree(t23)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(serializeTree(t24)), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(serializeTree(t25)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return null;
  let leftmost = root;
  while (leftmost.left) {
    let head = leftmost;
    while (head) {
      head.left.next = head.right;
      if (head.next) {
        head.right.next = head.next.left;
      }
      head = head.next;
    }
    leftmost = leftmost.left;
  }
  return root;
}`
  },
  {
    slug: 'populating-next-right-pointers-in-each-node-ii',
    title: 'Populating Next Right Pointers in Each Node II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-37-tests/populating-next-right-pointers-in-each-node-ii.json',
    sample_input: '[1,2,3,4,5,null,7]',
    sample_output: '[1,"#",2,3,"#",4,5,7,"#"]',
    description: `Given a binary tree:

\`\`\`c
struct Node {
  int val;
  Node *left;
  Node *right;
  Node *next;
};
\`\`\`

Populate each next pointer to point to its next right node. If there is no next right node, the next pointer should be set to \`NULL\`.

Initially, all next pointers are set to \`NULL\`.

### Example 1:
\`\`\`
        1 ---> NULL
       / \\
      2 -> 3 -> NULL
     / \\    \\
    4 -> 5 -> 7 -> NULL
\`\`\`
**Input:** root = [1,2,3,4,5,null,7]
**Output:** [1,"#",2,3,"#",4,5,7,"#"]

### Example 2:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 6000]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      function populate(root) {
        if (!root) return null;
        let curr = root;
        while (curr) {
          const dummy = new TreeNode(0);
          let tail = dummy;
          while (curr) {
            if (curr.left) { tail.next = curr.left; tail = tail.next; }
            if (curr.right) { tail.next = curr.right; tail = tail.next; }
            curr = curr.next;
          }
          curr = dummy.next;
        }
        return root;
      }

      // 21: Full tree depth 5
      const t21 = buildFullTree(5);
      populate(t21);
      const exp21 = serializeTreeNext(t21);

      // 22: Left-skewed tree depth 20
      const t22 = buildSkewedTree(20, true);
      populate(t22);
      const exp22 = serializeTreeNext(t22);

      // 23: Right-skewed tree depth 20
      const t23 = buildSkewedTree(20, false);
      populate(t23);
      const exp23 = serializeTreeNext(t23);

      // 24: Irregular tree with gaps
      const t24 = new TreeNode(1,
        new TreeNode(2, new TreeNode(4), null),
        new TreeNode(3, null, new TreeNode(5))
      );
      populate(t24);
      const exp24 = serializeTreeNext(t24);

      // 25: Full tree depth 6
      const t25 = buildFullTree(6);
      populate(t25);
      const exp25 = serializeTreeNext(t25);

      return [
        { input: JSON.stringify(serializeTree(buildFullTree(5))), output: JSON.stringify(exp21), is_hidden: true },
        { input: JSON.stringify(serializeTree(buildSkewedTree(20, true))), output: JSON.stringify(exp22), is_hidden: true },
        { input: JSON.stringify(serializeTree(buildSkewedTree(20, false))), output: JSON.stringify(exp23), is_hidden: true },
        { input: JSON.stringify(serializeTree(new TreeNode(1, new TreeNode(2, new TreeNode(4), null), new TreeNode(3, null, new TreeNode(5))))), output: JSON.stringify(exp24), is_hidden: true },
        { input: JSON.stringify(serializeTree(buildFullTree(6))), output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  if (!root) return null;
  let curr = root;
  while (curr) {
    const dummy = new TreeNode(0);
    let tail = dummy;
    while (curr) {
      if (curr.left) {
        tail.next = curr.left;
        tail = tail.next;
      }
      if (curr.right) {
        tail.next = curr.right;
        tail = tail.next;
      }
      curr = curr.next;
    }
    curr = dummy.next;
  }
  return root;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Trees Batch 3 (7 Problems) ===\n');

  for (const prob of TREES_BATCH3) {
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

    let finalTestCases;
    if (prob.customTestCases) {
      finalTestCases = prob.customTestCases();
    } else {
      // Load 20 existing test cases from JSON file
      const rootDir = path.join(__dirname, '../..');
      const fullJsonPath = path.join(rootDir, prob.jsonPath);
      const existingRaw = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

      const baseTestCases = existingRaw.slice(0, 20).map((tc, idx) => ({
        input: tc.input,
        output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
        is_hidden: idx >= 3
      }));

      const extraTestCases = prob.generateExtraTestCases();
      finalTestCases = [...baseTestCases, ...extraTestCases];
    }

    if (finalTestCases.length !== 25) {
      throw new Error(`Expected exactly 25 test cases for ${prob.slug}, got ${finalTestCases.length}`);
    }

    // 3. Delete and seed exactly 25 test cases
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

    // 4. Validate Optimal Solution with Judge
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
  console.log('✓ All 7 BST & Node Pointer problems successfully upgraded and verified (25/25 ACCEPTED)!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

