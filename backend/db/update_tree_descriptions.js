'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const updates = [
  {
    title: 'Binary Tree Maximum Path Sum',
    description: `A **path** in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence **at most once**. Note that the path does not need to pass through the root.

The **path sum** of a path is the sum of the node's values in the path.

Given the \`root\` of a binary tree, return *the maximum **path sum** of any non-empty path*.

### **Example 1:**
\`\`\`
       1
      / \\
     2   3
\`\`\`
**Input:** root = [1,2,3]
**Output:** 6
**Explanation:** The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6.

### **Example 2:**
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

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 3 * 10⁴]\`.
- \`-1000 <= Node.val <= 1000\``
  },
  {
    title: 'Maximum Depth of Binary Tree',
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** 3

### **Example 2:**
\`\`\`
     1
      \\
       2
\`\`\`
**Input:** root = [1,null,2]
**Output:** 2

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 10⁴]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    title: 'Same Tree',
    description: `Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.

Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.

### **Example 1:**
\`\`\`
     1          1
    / \\        / \\
   2   3      2   3
\`\`\`
**Input:** p = [1,2,3], q = [1,2,3]
**Output:** true

### **Example 2:**
\`\`\`
     1          1
    /            \\
   2              2
\`\`\`
**Input:** p = [1,2], q = [1,null,2]
**Output:** false

### **Example 3:**
\`\`\`
     1          1
    / \\        / \\
   2   1      1   2
\`\`\`
**Input:** p = [1,2,1], q = [1,1,2]
**Output:** false

### **Constraints:**
- The number of nodes in both trees is in the range \`[0, 100]\`.
- \`-10⁴ <= Node.val <= 10⁴\``
  },
  {
    title: 'Symmetric Tree',
    description: `Given the \`root\` of a binary tree, *check whether it is a mirror of itself* (i.e., symmetric around its center).

### **Example 1:**
\`\`\`
        1
      /   \\
     2     2
    / \\   / \\
   3   4 4   3
\`\`\`
**Input:** root = [1,2,2,3,4,4,3]
**Output:** true

### **Example 2:**
\`\`\`
        1
      /   \\
     2     2
      \\     \\
       3     3
\`\`\`
**Input:** root = [1,2,2,null,3,null,3]
**Output:** false

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    title: 'Balanced Binary Tree',
    description: `Given a binary tree, determine if it is **height-balanced**.

A **height-balanced** binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** true

### **Example 2:**
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

### **Example 3:**
**Input:** root = []
**Output:** true

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-10⁴ <= Node.val <= 10⁴\``
  },
  {
    title: 'Binary Tree Level Order Traversal',
    description: `Given the \`root\` of a binary tree, return *the level order traversal of its nodes' values*. (i.e., from left to right, level by level).

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[3],[9,20],[15,7]]

### **Example 2:**
**Input:** root = [1]
**Output:** [[1]]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``
  },
  {
    title: 'Path Sum',
    description: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return \`true\` if the tree has a **root-to-leaf** path such that adding up all the values along the path equals \`targetSum\`.

A **leaf** is a node with no children.

### **Example 1:**
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
**Explanation:** The root-to-leaf path with targetSum is: 5 -> 4 -> 11 -> 2 = 22.

### **Example 2:**
\`\`\`
       1
      / \\
     2   3
\`\`\`
**Input:** root = [1,2,3], targetSum = 5
**Output:** false
**Explanation:** There are two root-to-leaf paths:
(1 --> 2): The sum is 3.
(1 --> 3): The sum is 4.
There is no root-to-leaf path with sum = 5.

### **Example 3:**
**Input:** root = [], targetSum = 0
**Output:** false

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-1000 <= Node.val <= 1000\`
- \`-1000 <= targetSum <= 1000\``
  },
  {
    title: 'Validate Binary Search Tree',
    description: `Given the \`root\` of a binary tree, *determine if it is a valid binary search tree (BST)*.

A **valid BST** is defined as follows:
- The left subtree of a node contains only nodes with keys **strictly less than** the node's key.
- The right subtree of a node contains only nodes with keys **strictly greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

### **Example 1:**
\`\`\`
     2
    / \\
   1   3
\`\`\`
**Input:** root = [2,1,3]
**Output:** true

### **Example 2:**
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

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 10⁴]\`.
- \`-2³¹ <= Node.val <= 2³¹ - 1\``
  },
  {
    title: 'Construct Binary Tree from Preorder and Inorder Traversal',
    description: `Given two integer arrays \`preorder\` and \`inorder\` where \`preorder\` is the preorder traversal of a binary tree and \`inorder\` is the inorder traversal of the same tree, construct and return *the binary tree*.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
**Output:** [3,9,20,null,null,15,7]

### **Example 2:**
**Input:** preorder = [-1], inorder = [-1]
**Output:** [-1]

### **Constraints:**
- \`1 <= preorder.length <= 3000\`
- \`inorder.length == preorder.length\`
- \`-3000 <= preorder[i], inorder[i] <= 3000\`
- \`preorder\` and \`inorder\` consist of **unique** values.
- Each value of \`inorder\` also appears in \`preorder\`.
- \`preorder\` is **guaranteed** to be the preorder traversal of the tree.
- \`inorder\` is **guaranteed** to be the inorder traversal of the tree.`
  },
  {
    title: 'Convert Sorted Array to Binary Search Tree',
    description: `Given an integer array \`nums\` where the elements are sorted in **ascending order**, convert *it to a **height-balanced** binary search tree*.

### **Example 1:**
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

### **Example 2:**
\`\`\`
     3
    /
   1
\`\`\`
**Input:** nums = [1,3]
**Output:** [3,1]
**Explanation:** [1,null,3] and [3,1] are both height-balanced BSTs.

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- \`nums\` is sorted in a **strictly increasing** order.`
  },
  {
    title: 'Binary Tree Inorder Traversal',
    description: `Given the \`root\` of a binary tree, return *the inorder traversal of its nodes' values*.

### **Example 1:**
\`\`\`
    1
     \\
      2
     /
    3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [1,3,2]

### **Example 2:**
**Input:** root = [1,2,3,4,5,null,8,null,null,6,7,9]
**Output:** [4,2,6,5,7,1,3,9,8]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Example 4:**
**Input:** root = [1]
**Output:** [1]

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    title: 'Binary Tree Preorder Traversal',
    description: `Given the \`root\` of a binary tree, return *the preorder traversal of its nodes' values*.

### **Example 1:**
\`\`\`
    1
     \\
      2
     /
    3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [1,2,3]

### **Example 2:**
**Input:** root = [1,2,3,4,5,null,8,null,null,6,7,9]
**Output:** [1,2,4,5,6,7,3,8,9]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Example 4:**
**Input:** root = [1]
**Output:** [1]

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    title: 'Binary Tree Postorder Traversal',
    description: `Given the \`root\` of a binary tree, return *the postorder traversal of its nodes' values*.

### **Example 1:**
\`\`\`
    1
     \\
      2
     /
    3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [3,2,1]

### **Example 2:**
**Input:** root = [1,2,3,4,5,null,8,null,null,6,7,9]
**Output:** [4,6,7,5,2,9,8,3,1]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Example 4:**
**Input:** root = [1]
**Output:** [1]

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    title: 'Sum Root to Leaf Numbers',
    description: `You are given the \`root\` of a binary tree containing digits from \`0\` to \`9\` only.

Each root-to-leaf path in the tree represents a number.
- For example, the root-to-leaf path \`1 -> 2 -> 3\` represents the number \`123\`.

Return *the total sum of all root-to-leaf numbers*. Test cases are generated so that the answer will fit in a **32-bit** integer.

A **leaf** node is a node with no children.

### **Example 1:**
\`\`\`
     1
    / \\
   2   3
\`\`\`
**Input:** root = [1,2,3]
**Output:** 25
**Explanation:**
The root-to-leaf path \`1->2\` represents the number \`12\`.
The root-to-leaf path \`1->3\` represents the number \`13\`.
Therefore, sum = 12 + 13 = \`25\`.

### **Example 2:**
\`\`\`
        4
      /   \\
     9     0
    / \\
   5   1
\`\`\`
**Input:** root = [4,9,0,5,1]
**Output:** 1026
**Explanation:**
The root-to-leaf path \`4->9->5\` represents the number 495.
The root-to-leaf path \`4->9->1\` represents the number 491.
The root-to-leaf path \`4->0\` represents the number 40.
Therefore, sum = 495 + 491 + 40 = \`1026\`.

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`0 <= Node.val <= 9\`
- The depth of the tree will not exceed \`10\`.`
  },
  {
    title: 'Minimum Depth of Binary Tree',
    description: `Given a binary tree, find its minimum depth.

The **minimum depth** is the number of nodes along the shortest path from the root node down to the nearest leaf node.

**Note:** A leaf is a node with no children.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** 2

### **Example 2:**
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

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 10⁵]\`.
- \`-1000 <= Node.val <= 1000\``
  },
  {
    title: 'Binary Tree Level Order Traversal II',
    description: `Given the \`root\` of a binary tree, return *the bottom-up level order traversal of its nodes' values*. (i.e., from left to right, level by level from leaf to root).

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[15,7],[9,20],[3]]

### **Example 2:**
**Input:** root = [1]
**Output:** [[1]]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``
  },
  {
    title: 'Binary Tree Zigzag Level Order Traversal',
    description: `Given the \`root\` of a binary tree, return *the zigzag level order traversal of its nodes' values*. (i.e., from left to right, then right to left for the next level and alternate between).

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[3],[20,9],[15,7]]

### **Example 2:**
**Input:** root = [1]
**Output:** [[1]]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``
  }
];

async function main() {
  console.log(`Updating ${updates.length} tree problems with LeetCode-grade formatting...`);
  for (const item of updates) {
    const res = await pool.query(
      'UPDATE problems SET description = $1 WHERE title = $2 RETURNING id, title',
      [item.description, item.title]
    );
    if (res.rows.length > 0) {
      console.log(`✓ Updated "${item.title}"`);
    } else {
      console.log(`✗ Problem not found: "${item.title}"`);
    }
  }
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
