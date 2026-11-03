'use strict';

/**
 * upgrade_trees_batch4_25tc.js
 *
 * Upgrades 7 Construction, Restructuring & Hard Tree problems to exactly 25 curated test cases:
 * 1. Construct Binary Tree from Preorder and Inorder Traversal (LC 105)
 * 2. Construct Binary Tree from Inorder and Postorder Traversal (LC 106)
 * 3. Flatten Binary Tree to Linked List (LC 114)
 * 4. Recover Binary Search Tree (LC 99)
 * 5. Unique Binary Search Trees II (LC 95)
 * 6. Binary Tree Maximum Path Sum (LC 124)
 * 7. Serialize and Deserialize Binary Tree (LC 297)
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

function calcMaxPathSum(root) {
  let maxSum = -Infinity;
  function maxGain(node) {
    if (!node) return 0;
    const leftGain = Math.max(maxGain(node.left), 0);
    const rightGain = Math.max(maxGain(node.right), 0);
    const priceNewpath = node.val + leftGain + rightGain;
    maxSum = Math.max(maxSum, priceNewpath);
    return node.val + Math.max(leftGain, rightGain);
  }
  maxGain(root);
  return maxSum;
}

function solveUniqueBSTsII(n) {
  if (n === 0) return [];
  function generate(start, end) {
    const allTrees = [];
    if (start > end) {
      allTrees.push(null);
      return allTrees;
    }
    for (let i = start; i <= end; i++) {
      const leftTrees = generate(start, i - 1);
      const rightTrees = generate(i + 1, end);
      for (const l of leftTrees) {
        for (const r of rightTrees) {
          const currentTree = new TreeNode(i);
          currentTree.left = l;
          currentTree.right = r;
          allTrees.push(currentTree);
        }
      }
    }
    return allTrees;
  }
  return generate(1, n);
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const TREES_BATCH4 = [
  {
    slug: 'construct-binary-tree-from-preorder-and-inorder-traversal',
    title: 'Construct Binary Tree from Preorder and Inorder Traversal',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-36-tests/construct-binary-tree-from-preorder-and-inorder-traversal.json',
    sample_input: '[3,9,20,15,7], [9,3,15,20,7]',
    sample_output: '[3,9,20,null,null,15,7]',
    description: `Given two integer arrays \`preorder\` and \`inorder\` where \`preorder\` is the preorder traversal of a binary tree and \`inorder\` is the inorder traversal of the same tree, construct and return *the binary tree*.

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
**Output:** [3,9,20,null,null,15,7]

### Example 2:
**Input:** preorder = [-1], inorder = [-1]
**Output:** [-1]

### Constraints:
- \`1 <= preorder.length <= 3000\`
- \`inorder.length == preorder.length\`
- \`-3000 <= preorder[i], inorder[i] <= 3000\`
- \`preorder\` and \`inorder\` consist of **unique** values.
- Each value of \`inorder\` also appears in \`preorder\`.
- \`preorder\` is **guaranteed** to be the preorder traversal of the tree.
- \`inorder\` is **guaranteed** to be the inorder traversal of the tree.`,
    generateExtraTestCases: () => {
      // 21: Full tree depth 6
      const t21 = buildFullTree(6);
      const pre21 = treePreorder(t21);
      const in21 = treeInorder(t21);
      const exp21 = serializeTree(t21);

      // 22: Left-skewed tree depth 100
      const t22 = buildSkewedTree(100, true);
      const pre22 = treePreorder(t22);
      const in22 = treeInorder(t22);
      const exp22 = serializeTree(t22);

      // 23: Right-skewed tree depth 100
      const t23 = buildSkewedTree(100, false);
      const pre23 = treePreorder(t23);
      const in23 = treeInorder(t23);
      const exp23 = serializeTree(t23);

      // 24: Balanced BST with 31 distinct values
      function buildBST(l, r) {
        if (l > r) return null;
        const mid = Math.floor((l + r) / 2);
        const node = new TreeNode(mid);
        node.left = buildBST(l, mid - 1);
        node.right = buildBST(mid + 1, r);
        return node;
      }
      const t24 = buildBST(1, 31);
      const pre24 = treePreorder(t24);
      const in24 = treeInorder(t24);
      const exp24 = serializeTree(t24);

      // 25: Full tree depth 8 (255 nodes)
      const t25 = buildFullTree(8);
      const pre25 = treePreorder(t25);
      const in25 = treeInorder(t25);
      const exp25 = serializeTree(t25);

      return [
        { input: `${JSON.stringify(pre21)}, ${JSON.stringify(in21)}`, output: JSON.stringify(exp21), is_hidden: true },
        { input: `${JSON.stringify(pre22)}, ${JSON.stringify(in22)}`, output: JSON.stringify(exp22), is_hidden: true },
        { input: `${JSON.stringify(pre23)}, ${JSON.stringify(in23)}`, output: JSON.stringify(exp23), is_hidden: true },
        { input: `${JSON.stringify(pre24)}, ${JSON.stringify(in24)}`, output: JSON.stringify(exp24), is_hidden: true },
        { input: `${JSON.stringify(pre25)}, ${JSON.stringify(in25)}`, output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(preorder, inorder) {
  if (!preorder.length || !inorder.length) return null;
  const rootVal = preorder[0];
  const root = new TreeNode(rootVal);
  const mid = inorder.indexOf(rootVal);
  root.left = solution(preorder.slice(1, mid + 1), inorder.slice(0, mid));
  root.right = solution(preorder.slice(mid + 1), inorder.slice(mid + 1));
  return root;
}`
  },
  {
    slug: 'construct-binary-tree-from-inorder-and-postorder-traversal',
    title: 'Construct Binary Tree from Inorder and Postorder Traversal',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-36-tests/construct-binary-tree-from-inorder-and-postorder-traversal.json',
    sample_input: '[9,3,15,20,7], [9,15,7,20,3]',
    sample_output: '[3,9,20,null,null,15,7]',
    description: `Given two integer arrays \`inorder\` and \`postorder\` where \`inorder\` is the inorder traversal of a binary tree and \`postorder\` is the postorder traversal of the same tree, construct and return *the binary tree*.

### Example 1:
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]
**Output:** [3,9,20,null,null,15,7]

### Example 2:
**Input:** inorder = [-1], postorder = [-1]
**Output:** [-1]

### Constraints:
- \`1 <= inorder.length <= 3000\`
- \`postorder.length == inorder.length\`
- \`-3000 <= inorder[i], postorder[i] <= 3000\`
- \`inorder\` and \`postorder\` consist of **unique** values.
- Each value of \`postorder\` also appears in \`inorder\`.
- \`inorder\` is **guaranteed** to be the inorder traversal of the tree.
- \`postorder\` is **guaranteed** to be the postorder traversal of the tree.`,
    generateExtraTestCases: () => {
      // 21: Full tree depth 6
      const t21 = buildFullTree(6);
      const in21 = treeInorder(t21);
      const post21 = treePostorder(t21);
      const exp21 = serializeTree(t21);

      // 22: Left-skewed tree depth 100
      const t22 = buildSkewedTree(100, true);
      const in22 = treeInorder(t22);
      const post22 = treePostorder(t22);
      const exp22 = serializeTree(t22);

      // 23: Right-skewed tree depth 100
      const t23 = buildSkewedTree(100, false);
      const in23 = treeInorder(t23);
      const post23 = treePostorder(t23);
      const exp23 = serializeTree(t23);

      // 24: Balanced BST with 31 distinct values
      function buildBST(l, r) {
        if (l > r) return null;
        const mid = Math.floor((l + r) / 2);
        const node = new TreeNode(mid);
        node.left = buildBST(l, mid - 1);
        node.right = buildBST(mid + 1, r);
        return node;
      }
      const t24 = buildBST(1, 31);
      const in24 = treeInorder(t24);
      const post24 = treePostorder(t24);
      const exp24 = serializeTree(t24);

      // 25: Full tree depth 8 (255 nodes)
      const t25 = buildFullTree(8);
      const in25 = treeInorder(t25);
      const post25 = treePostorder(t25);
      const exp25 = serializeTree(t25);

      return [
        { input: `${JSON.stringify(in21)}, ${JSON.stringify(post21)}`, output: JSON.stringify(exp21), is_hidden: true },
        { input: `${JSON.stringify(in22)}, ${JSON.stringify(post22)}`, output: JSON.stringify(exp22), is_hidden: true },
        { input: `${JSON.stringify(in23)}, ${JSON.stringify(post23)}`, output: JSON.stringify(exp23), is_hidden: true },
        { input: `${JSON.stringify(in24)}, ${JSON.stringify(post24)}`, output: JSON.stringify(exp24), is_hidden: true },
        { input: `${JSON.stringify(in25)}, ${JSON.stringify(post25)}`, output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(inorder, postorder) {
  if (!inorder.length || !postorder.length) return null;
  const rootVal = postorder[postorder.length - 1];
  const root = new TreeNode(rootVal);
  const mid = inorder.indexOf(rootVal);
  root.left = solution(inorder.slice(0, mid), postorder.slice(0, mid));
  root.right = solution(inorder.slice(mid + 1), postorder.slice(mid, postorder.length - 1));
  return root;
}`
  },
  {
    slug: 'flatten-binary-tree-to-linked-list',
    title: 'Flatten Binary Tree to Linked List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-13-tests/flatten-binary-tree-to-linked-list.json',
    sample_input: '[1,2,5,3,4,null,6]',
    sample_output: '[1,null,2,null,3,null,4,null,5,null,6]',
    description: `Given the \`root\` of a binary tree, flatten the tree into a "linked list":
- The "linked list" should use the same \`TreeNode\` class where the \`right\` child pointer points to the next node in the list and the \`left\` child pointer is always \`null\`.
- The "linked list" should be in the same order as a **preorder traversal** of the binary tree.

### Example 1:
\`\`\`
       1                  1
      / \\                  \\
     2   5       ==>        2
    / \\   \\                  \\
   3   4   6                  3
                               \\
                                4
                                 \\
                                  5
                                   \\
                                    6
\`\`\`
**Input:** root = [1,2,5,3,4,null,6]
**Output:** [1,null,2,null,3,null,4,null,5,null,6]

### Example 2:
**Input:** root = []
**Output:** []

### Example 3:
**Input:** root = [0]
**Output:** [0]

### Constraints:
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-100 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      function flatten(root) {
        let curr = root;
        while (curr) {
          if (curr.left) {
            let pre = curr.left;
            while (pre.right) pre = pre.right;
            pre.right = curr.right;
            curr.right = curr.left;
            curr.left = null;
          }
          curr = curr.right;
        }
        return root;
      }

      // 21: Full tree depth 5
      const t21 = buildFullTree(5);
      const exp21 = serializeTree(flatten(buildFullTree(5)));

      // 22: Left-skewed tree depth 80
      const t22 = buildSkewedTree(80, true);
      const exp22 = serializeTree(flatten(buildSkewedTree(80, true)));

      // 23: Right-skewed tree depth 80
      const t23 = buildSkewedTree(80, false);
      const exp23 = serializeTree(flatten(buildSkewedTree(80, false)));

      // 24: Zigzag tree
      const t24 = new TreeNode(1, new TreeNode(2, null, new TreeNode(3, new TreeNode(4), null)), null);
      const exp24 = serializeTree(flatten(new TreeNode(1, new TreeNode(2, null, new TreeNode(3, new TreeNode(4), null)), null)));

      // 25: Full tree depth 7 (127 nodes)
      const t25 = buildFullTree(7);
      const exp25 = serializeTree(flatten(buildFullTree(7)));

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
  let curr = root;
  while (curr) {
    if (curr.left) {
      let pre = curr.left;
      while (pre.right) pre = pre.right;
      pre.right = curr.right;
      curr.right = curr.left;
      curr.left = null;
    }
    curr = curr.right;
  }
  return root;
}`
  },
  {
    slug: 'recover-binary-search-tree',
    title: 'Recover Binary Search Tree',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-36-tests/recover-binary-search-tree.json',
    sample_input: '[1,3,null,null,2]',
    sample_output: '[3,1,null,null,2]',
    description: `You are given the \`root\` of a binary search tree (BST), where the values of **exactly two** nodes of the tree were swapped by mistake. *Recover the tree without changing its structure*.

### Example 1:
\`\`\`
     1                  3
    /                  /
   3         ==>      1
    \\                  \\
     2                  2
\`\`\`
**Input:** root = [1,3,null,null,2]
**Output:** [3,1,null,null,2]
**Explanation:** 3 cannot be a left child of 1 because 3 > 1. Swapping 1 and 3 makes the BST valid.

### Example 2:
\`\`\`
       3                  2
      / \\                / \\
     1   4      ==>     1   4
        /                  /
       2                  3
\`\`\`
**Input:** root = [3,1,4,null,null,2]
**Output:** [2,1,4,null,null,3]
**Explanation:** 2 cannot be in the right subtree for 3 because 2 < 3. Swapping 2 and 3 makes the BST valid.

### Constraints:
- The number of nodes in the tree is in the range \`[2, 1000]\`.
- \`-2³¹ <= Node.val <= 2³¹ - 1\``,
    generateExtraTestCases: () => {
      function recover(root) {
        let first = null, second = null, prev = null;
        function inorder(node) {
          if (!node) return;
          inorder(node.left);
          if (prev && prev.val > node.val) {
            if (!first) first = prev;
            second = node;
          }
          prev = node;
          inorder(node.right);
        }
        inorder(root);
        if (first && second) {
          const temp = first.val;
          first.val = second.val;
          second.val = temp;
        }
        return root;
      }

      function buildBST(l, r) {
        if (l > r) return null;
        const mid = Math.floor((l + r) / 2);
        const node = new TreeNode(mid * 10);
        node.left = buildBST(l, mid - 1);
        node.right = buildBST(mid + 1, r);
        return node;
      }

      // 21: Full BST of 15 nodes, root and rightmost leaf swapped
      const t21 = buildBST(1, 15);
      const exp21 = serializeTree(buildBST(1, 15));
      let rightmost21 = t21;
      while (rightmost21.right) rightmost21 = rightmost21.right;
      const tmp21 = t21.val;
      t21.val = rightmost21.val;
      rightmost21.val = tmp21;

      // 22: Full BST of 31 nodes, two adjacent nodes swapped
      const t22 = buildBST(1, 31);
      const exp22 = serializeTree(buildBST(1, 31));
      const tmp22 = t22.left.val;
      t22.left.val = t22.left.right.val;
      t22.left.right.val = tmp22;

      // 23: Left-skewed BST of 20 nodes with first and last swapped
      const t23 = new TreeNode(200);
      let c23 = t23;
      for (let i = 19; i >= 1; i--) {
        c23.left = new TreeNode(i * 10);
        c23 = c23.left;
      }
      const exp23 = serializeTree(new TreeNode(200));
      // Swap root and deepest leaf
      const tmp23 = t23.val;
      t23.val = c23.val;
      c23.val = tmp23;
      const exp23Solved = serializeTree(recover(t23));

      // 24: Right-skewed BST of 20 nodes
      const t24 = new TreeNode(10);
      let c24 = t24;
      for (let i = 2; i <= 20; i++) {
        c24.right = new TreeNode(i * 10);
        c24 = c24.right;
      }
      const tmp24 = t24.val;
      t24.val = c24.val;
      c24.val = tmp24;
      const exp24Solved = serializeTree(recover(t24));

      // 25: Full BST of 63 nodes, root and left child swapped
      const t25 = buildBST(1, 63);
      const exp25 = serializeTree(buildBST(1, 63));
      const tmp25 = t25.val;
      t25.val = t25.left.val;
      t25.left.val = tmp25;

      return [
        { input: JSON.stringify(serializeTree(t21)), output: JSON.stringify(exp21), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: JSON.stringify(exp22), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: JSON.stringify(exp23Solved), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: JSON.stringify(exp24Solved), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: JSON.stringify(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  let first = null, second = null, prev = null;
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    if (prev && prev.val > node.val) {
      if (!first) first = prev;
      second = node;
    }
    prev = node;
    inorder(node.right);
  }
  inorder(root);
  if (first && second) {
    const temp = first.val;
    first.val = second.val;
    second.val = temp;
  }
  return root;
}`
  },
  {
    slug: 'unique-binary-search-trees-ii',
    title: 'Unique Binary Search Trees II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-22-tests/unique-binary-search-trees-ii.json',
    sample_input: '3',
    sample_output: '[{"val":1,"left":null,"right":{"val":2,"left":null,"right":{"val":3,"left":null,"right":null}}},{"val":1,"left":null,"right":{"val":3,"left":{"val":2,"left":null,"right":null},"right":null}},{"val":2,"left":{"val":1,"left":null,"right":null},"right":{"val":3,"left":null,"right":null}},{"val":3,"left":{"val":1,"left":null,"right":{"val":2,"left":null,"right":null}},"right":null},{"val":3,"left":{"val":2,"left":{"val":1,"left":null,"right":null},"right":null},"right":null}]',
    description: `Given an integer \`n\`, return *all the structurally unique **BST**'s (binary search trees), which has exactly* \`n\` *nodes of unique values from* \`1\` *to* \`n\`. Return the answer in **any order**.

### Example 1:
\`\`\`
   1         3     3      2      1
    \\       /     /      / \\      \\
     3     2     1      1   3      2
    /     /       \\                 \\
   2     1         2                 3
\`\`\`
**Input:** n = 3
**Output:** [[1,null,2,null,3],[1,null,3,2],[2,1,3],[3,1,null,null,2],[3,2,null,1]]

### Example 2:
**Input:** n = 1
**Output:** [[1]]

### Constraints:
- \`1 <= n <= 8\``,
    generateExtraTestCases: () => {
      return [
        { input: '8', output: JSON.stringify(solveUniqueBSTsII(8)), is_hidden: true },
        { input: '1', output: JSON.stringify(solveUniqueBSTsII(1)), is_hidden: true },
        { input: '4', output: JSON.stringify(solveUniqueBSTsII(4)), is_hidden: true },
        { input: '5', output: JSON.stringify(solveUniqueBSTsII(5)), is_hidden: true },
        { input: '6', output: JSON.stringify(solveUniqueBSTsII(6)), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(n) {
  if (n === 0) return [];
  function generate(start, end) {
    const allTrees = [];
    if (start > end) {
      allTrees.push(null);
      return allTrees;
    }
    for (let i = start; i <= end; i++) {
      const leftTrees = generate(start, i - 1);
      const rightTrees = generate(i + 1, end);
      for (const l of leftTrees) {
        for (const r of rightTrees) {
          const currentTree = new TreeNode(i);
          currentTree.left = l;
          currentTree.right = r;
          allTrees.push(currentTree);
        }
      }
    }
    return allTrees;
  }
  return generate(1, n);
}`
  },
  {
    slug: 'binary-tree-maximum-path-sum',
    title: 'Binary Tree Maximum Path Sum',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-8-tests/binary-tree-maximum-path-sum.json',
    sample_input: '[1,2,3]',
    sample_output: '6',
    description: `A **path** in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence **at most once**. Note that the path does not need to pass through the root.

The **path sum** of a path is the sum of the node's values in the path.

Given the \`root\` of a binary tree, return *the maximum **path sum** of any non-empty path*.

### Example 1:
\`\`\`
       1
      / \\
     2   3
\`\`\`
**Input:** root = [1,2,3]
**Output:** 6
**Explanation:** The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6.

### Example 2:
\`\`\`
       -10
       /  \\
      9   20
         /  \\
        15   7
\`\`\`
**Input:** root = [-10,9,20,null,null,15,7]
**Output:** 42
**Explanation:** The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42.

### Constraints:
- The number of nodes in the tree is in the range \`[1, 3 * 10⁴]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      // 21: Full tree depth 6 all positive values (sum = 63 * 10)
      const t21 = buildFullTree(6, () => 10);
      const exp21 = calcMaxPathSum(t21);

      // 22: Full tree depth 6 all negative values (max is least negative)
      const t22 = buildFullTree(6, (d, i) => -i);
      const exp22 = calcMaxPathSum(t22);

      // 23: Left-skewed tree depth 150 with positive values
      const t23 = buildSkewedTree(150, true, 5);
      const exp23 = calcMaxPathSum(t23);

      // 24: Tree where root is large negative, left branch is large positive
      const t24 = new TreeNode(-500, buildFullTree(5, () => 20), buildFullTree(5, () => 10));
      const exp24 = calcMaxPathSum(t24);

      // 25: Full tree depth 8 with varied positive and negative values
      const t25 = buildFullTree(8, (d, i) => (i % 2 === 0 ? i * 2 : -i));
      const exp25 = calcMaxPathSum(t25);

      return [
        { input: JSON.stringify(serializeTree(t21)), output: String(exp21), is_hidden: true },
        { input: JSON.stringify(serializeTree(t22)), output: String(exp22), is_hidden: true },
        { input: JSON.stringify(serializeTree(t23)), output: String(exp23), is_hidden: true },
        { input: JSON.stringify(serializeTree(t24)), output: String(exp24), is_hidden: true },
        { input: JSON.stringify(serializeTree(t25)), output: String(exp25), is_hidden: true },
      ];
    },
    optimalCode: `
function solution(root) {
  let maxSum = -Infinity;
  function maxGain(node) {
    if (!node) return 0;
    const leftGain = Math.max(maxGain(node.left), 0);
    const rightGain = Math.max(maxGain(node.right), 0);
    const priceNewpath = node.val + leftGain + rightGain;
    maxSum = Math.max(maxSum, priceNewpath);
    return node.val + Math.max(leftGain, rightGain);
  }
  maxGain(root);
  return maxSum;
}`
  },
  {
    slug: 'serialize-and-deserialize-binary-tree',
    title: 'Serialize and Deserialize Binary Tree',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-38-tests/serialize-and-deserialize-binary-tree.json',
    sample_input: '[1,2,3,null,null,4,5]',
    sample_output: '[1,2,3,null,null,4,5]',
    description: `Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.

Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.

### Example 1:
\`\`\`
       1
      / \\
     2   3
        / \\
       4   5
\`\`\`
**Input:** root = [1,2,3,null,null,4,5]
**Output:** [1,2,3,null,null,4,5]

### Example 2:
**Input:** root = []
**Output:** []

### Constraints:
- The number of nodes in the tree is in the range \`[0, 10⁴]\`.
- \`-1000 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      // 21: Full tree depth 6
      const t21 = buildFullTree(6);
      const exp21 = serializeTree(t21);

      // 22: Left-skewed tree depth 120
      const t22 = buildSkewedTree(120, true);
      const exp22 = serializeTree(t22);

      // 23: Right-skewed tree depth 120
      const t23 = buildSkewedTree(120, false);
      const exp23 = serializeTree(t23);

      // 24: Tree with negative values and zeros
      const t24 = new TreeNode(0, new TreeNode(-10, new TreeNode(25), null), new TreeNode(50, null, new TreeNode(-5)));
      const exp24 = serializeTree(t24);

      // 25: Full tree depth 8 (255 nodes)
      const t25 = buildFullTree(8);
      const exp25 = serializeTree(t25);

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
  function serialize(node) {
    if (!node) return 'null';
    return node.val + ',' + serialize(node.left) + ',' + serialize(node.right);
  }
  function deserialize(data) {
    const list = data.split(',');
    function build() {
      const val = list.shift();
      if (val === 'null' || !val) return null;
      const node = new TreeNode(Number(val));
      node.left = build();
      node.right = build();
      return node;
    }
    return build();
  }
  return deserialize(serialize(root));
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Trees Batch 4 (7 Problems) ===\n');

  for (const prob of TREES_BATCH4) {
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
  console.log('✓ All 7 Construction, Restructuring & Hard Tree problems successfully upgraded and verified (25/25 ACCEPTED)!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

