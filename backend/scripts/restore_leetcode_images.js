require('dotenv').config({ path: './backend/.env' });
const pool = require('../db');

/**
 * Script to restore official LeetCode diagram images across all problems in AlgoArena.
 */
const updates = [
  {
    slug: 'rotate-image',
    description: `You are given an \`n x n\` 2D matrix representing an image, rotate the image by **90 degrees (clockwise)**.

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.

### **Example 1:**
![Rotate Image Example 1](https://assets.leetcode.com/uploads/2020/08/28/mat1.jpg)
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]

### **Example 2:**
![Rotate Image Example 2](https://assets.leetcode.com/uploads/2020/08/28/mat2.jpg)
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]

### **Constraints:**
- \`n == matrix.length == matrix[i].length\`
- \`1 <= n <= 200\`
- \`-1000 <= matrix[i][j] <= 1000\``
  },
  {
    slug: 'set-matrix-zeroes',
    description: `Given an \`m x n\` integer matrix \`matrix\`, if an element is \`0\`, set its entire row and column to \`0\`'s.

You must do it in place.

### **Example 1:**
![Set Matrix Zeroes Example 1](https://assets.leetcode.com/uploads/2020/08/17/mat1.jpg)
Input: matrix = [[1,1,1],[1,0,1],[1,1,1]]
Output: [[1,0,1],[0,0,0],[1,0,1]]

### **Example 2:**
![Set Matrix Zeroes Example 2](https://assets.leetcode.com/uploads/2020/08/17/mat2.jpg)
Input: matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
Output: [[0,0,0,0],[0,4,5,0],[0,3,1,0]]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[0].length\`
- \`1 <= m, n <= 200\`
- \`-2³¹ <= matrix[i][j] <= 2³¹ - 1\`

**Follow up:**
- A straightforward solution using \`O(mn)\` space is probably a bad idea.
- A simple improvement uses \`O(m + n)\` space, but still not the best solution.
- Could you devise a constant space solution?`
  },
  {
    slug: 'spiral-matrix',
    description: `Given an \`m x n\` \`matrix\`, return all elements of the \`matrix\` in **spiral order**.

### **Example 1:**
![Spiral Matrix Example 1](https://assets.leetcode.com/uploads/2020/11/13/spiral1.jpg)
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]

### **Example 2:**
![Spiral Matrix Example 2](https://assets.leetcode.com/uploads/2020/11/13/spiral.jpg)
Input: matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[i].length\`
- \`1 <= m, n <= 100\`
- \`-100 <= matrix[i][j] <= 100\``
  },
  {
    slug: 'spiral-matrix-ii',
    description: `Given a positive integer \`n\`, generate an \`n x n\` \`matrix\` filled with elements from \`1\` to \`n^2\` in spiral order.

### **Example 1:**
![Spiral Matrix II Example 1](https://assets.leetcode.com/uploads/2020/11/13/spiraln.jpg)
Input: n = 3
Output: [[1,2,3],[8,9,4],[7,6,5]]

### **Example 2:**
Input: n = 1
Output: [[1]]

### **Constraints:**
- \`1 <= n <= 20\``
  },
  {
    slug: 'pascal-s-triangle',
    description: `Given an integer \`numRows\`, return the first \`numRows\` of **Pascal's triangle**.

In Pascal's triangle, each number is the sum of the two numbers directly above it.

![Pascal's Triangle](https://upload.wikimedia.org/wikipedia/commons/0/0d/PascalTriangleAnimated2.gif)

### **Example 1:**
Input: numRows = 5
Output: [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]

### **Example 2:**
Input: numRows = 1
Output: [[1]]

### **Constraints:**
- \`1 <= numRows <= 30\``
  },
  {
    slug: 'trapping-rain-water',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### **Example 1:**
![Trapping Rain Water Example 1](https://assets.leetcode.com/uploads/2018/10/22/rainwatertrap.png)
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped (blue section).

### **Example 2:**
Input: height = [4,2,0,3,2,5]
Output: 9

### **Constraints:**
- \`n == height.length\`
- \`1 <= n <= 2 * 10⁴\`
- \`0 <= height[i] <= 10⁵\``
  },
  {
    slug: 'container-with-most-water',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.

**Notice** that you may not slant the container.

### **Example 1:**
![Container With Most Water Example 1](https://s3-lc-upload.s3.amazonaws.com/uploads/2018/07/17/question_11.jpg)
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.

### **Example 2:**
Input: height = [1,1]
Output: 1

### **Constraints:**
- \`n == height.length\`
- \`2 <= n <= 10⁵\`
- \`0 <= height[i] <= 10⁴\``
  },
  {
    slug: 'middle-of-the-linked-list',
    description: `Given the \`head\` of a singly linked list, return **the middle node** of the linked list.

If there are two middle nodes, return **the second middle node**.

### **Example 1:**
![Middle of Linked List Example 1](https://assets.leetcode.com/uploads/2021/07/23/lc-midlist1.jpg)
Input: head = [1,2,3,4,5]
Output: [3,4,5]
Explanation: The middle node of the list is node 3 with remaining nodes [3,4,5].

### **Example 2:**
![Middle of Linked List Example 2](https://assets.leetcode.com/uploads/2021/07/23/lc-midlist2.jpg)
Input: head = [1,2,3,4,5,6]
Output: [4,5,6]
Explanation: Since the list has two middle nodes with values 3 and 4, we return the second one.

### **Constraints:**
- The number of nodes in the list is in the range \`[1, 100]\`.
- \`1 <= Node.val <= 100\``
  },
  {
    slug: 'reverse-linked-list',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.

### **Example 1:**
![Reverse Linked List Example 1](https://assets.leetcode.com/uploads/2021/02/19/rev1ex1.jpg)
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

### **Example 2:**
![Reverse Linked List Example 2](https://assets.leetcode.com/uploads/2021/02/19/rev1ex2.jpg)
Input: head = [1,2]
Output: [2,1]

### **Example 3:**
Input: head = []
Output: []

### **Constraints:**
- The number of nodes in the list is the range \`[0, 50000]\`.
- \`-5000 <= Node.val <= 5000\`

**Follow up:** A linked list can be reversed either iteratively or recursively. Could you implement both?`
  },
  {
    slug: 'linked-list-cycle',
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer. Internally, \`pos\` is used to denote the index of the node that tail's \`next\` pointer is connected to. **Note that \`pos\` is not passed as a parameter.**

Return \`true\` *if there is a cycle in the linked list*. Otherwise, return \`false\`.

### **Example 1:**
![Linked List Cycle Example 1](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist.png)
Input: head = [3,2,0,-4], pos = 1
Output: true
Explanation: There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).

### **Example 2:**
![Linked List Cycle Example 2](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist_test2.png)
Input: head = [1,2], pos = 0
Output: true
Explanation: There is a cycle in the linked list, where the tail connects to the 0th node.

### **Example 3:**
![Linked List Cycle Example 3](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist_test3.png)
Input: head = [1], pos = -1
Output: false
Explanation: There is no cycle in the linked list.

### **Constraints:**
- The number of the nodes in the list is in the range \`[0, 10⁴]\`.
- \`-10⁵ <= Node.val <= 10⁵\`
- \`pos\` is \`-1\` or a **valid index** in the linked-list.`
  },
  {
    slug: 'linked-list-cycle-ii',
    description: `Given the \`head\` of a linked list, return *the node where the cycle begins*. If there is no cycle, return \`null\`.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer. Internally, \`pos\` is used to denote the index of the node that tail's \`next\` pointer is connected to. **Note that \`pos\` is not passed as a parameter.**

**Do not modify** the linked list.

### **Example 1:**
![Linked List Cycle II Example 1](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist.png)
Input: head = [3,2,0,-4], pos = 1
Output: tail connects to node index 1
Explanation: There is a cycle in the linked list, where tail connects to the first node.

### **Example 2:**
![Linked List Cycle II Example 2](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist_test2.png)
Input: head = [1,2], pos = 0
Output: tail connects to node index 0
Explanation: There is a cycle in the linked list, where tail connects to the zeroth node.

### **Example 3:**
![Linked List Cycle II Example 3](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist_test3.png)
Input: head = [1], pos = -1
Output: no cycle
Explanation: There is no cycle in the linked list.

### **Constraints:**
- The number of the nodes in the list is in the range \`[0, 10⁴]\`.
- \`-10⁵ <= Node.val <= 10⁵\`
- \`pos\` is \`-1\` or a **valid index** in the linked-list.`
  },
  {
    slug: 'remove-nth-node-from-end-of-list',
    description: `Given the \`head\` of a linked list, remove the \`n\`th node from the end of the list and return its head.

### **Example 1:**
![Remove Nth Node Example 1](https://assets.leetcode.com/uploads/2020/10/03/remove_ex1.jpg)
Input: head = [1,2,3,4,5], n = 2
Output: [1,2,3,5]

### **Example 2:**
Input: head = [1], n = 1
Output: []

### **Example 3:**
Input: head = [1,2], n = 1
Output: [1]

### **Constraints:**
- The number of nodes in the list is \`sz\`.
- \`1 <= sz <= 30\`
- \`0 <= Node.val <= 100\`
- \`1 <= n <= sz\``
  },
  {
    slug: 'delete-node-in-a-linked-list',
    description: `There is a singly-linked list \`head\` and we want to delete a node \`node\` in it.

You are given the node to be deleted \`node\`. You will **not be given access** to the first node of \`head\`.

All the values of the linked list are **unique**, and it is guaranteed that the given node \`node\` is not the last node in the linked list.

Delete the given node. Note that by deleting the node, we do not mean removing it from memory. We mean:
- The value of the given node should not exist in the linked list.
- The number of nodes in the linked list should decrease by one.
- All the values before \`node\` should be in the same order.
- All the values after \`node\` should be in the same order.

### **Example 1:**
![Delete Node Example 1](https://assets.leetcode.com/uploads/2020/09/01/node1.jpg)
Input: head = [4,5,1,9], node = 5
Output: [4,1,9]
Explanation: You are given the second node with value 5, the linked list should become 4 -> 1 -> 9 after calling your function.

### **Example 2:**
![Delete Node Example 2](https://assets.leetcode.com/uploads/2020/09/01/node2.jpg)
Input: head = [4,5,1,9], node = 1
Output: [4,5,9]
Explanation: You are given the third node with value 1, the linked list should become 4 -> 5 -> 9 after calling your function.

### **Constraints:**
- The number of the nodes in the given list is in the range \`[2, 1000]\`.
- \`-1000 <= Node.val <= 1000\`
- The value of each node in the list is **unique**.
- The \`node\` to be deleted is **in the list** and is **not a tail node**.`
  },
  {
    slug: 'intersection-of-two-linked-lists',
    description: `Given the heads of two singly linked-lists \`headA\` and \`headB\`, return *the node at which the two lists intersect*. If the two linked lists have no intersection at all, return \`null\`.

![Intersection Statement](https://assets.leetcode.com/uploads/2021/03/05/160_statement.png)

### **Example 1:**
![Intersection Example 1](https://assets.leetcode.com/uploads/2021/03/05/160_example_1_1.png)
Input: intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2, skipB = 3
Output: Intersected at '8'
Explanation: The intersected node's value is 8.

### **Example 2:**
![Intersection Example 2](https://assets.leetcode.com/uploads/2021/03/05/160_example_2.png)
Input: intersectVal = 2, listA = [1,9,1,2,4], listB = [3,2,4], skipA = 3, skipB = 1
Output: Intersected at '2'
Explanation: The intersected node's value is 2.

### **Example 3:**
![Intersection Example 3](https://assets.leetcode.com/uploads/2021/03/05/160_example_3.png)
Input: intersectVal = 0, listA = [2,6,4], listB = [1,5], skipA = 3, skipB = 2
Output: No intersection
Explanation: The two lists do not intersect, so return null.

### **Constraints:**
- The number of nodes of \`listA\` is in the \`m\`.
- The number of nodes of \`listB\` is in the \`n\`.
- \`1 <= m, n <= 3 * 10⁴\`
- \`1 <= Node.val <= 10⁵\``
  },
  {
    slug: 'add-two-numbers',
    description: `You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

### **Example 1:**
![Add Two Numbers Example 1](https://assets.leetcode.com/uploads/2020/10/02/addtwonumber1.jpg)
Input: l1 = [2,4,3], l2 = [5,6,4]
Output: [7,0,8]
Explanation: 342 + 465 = 807.

### **Example 2:**
Input: l1 = [0], l2 = [0]
Output: [0]

### **Example 3:**
Input: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
Output: [8,9,9,9,0,0,0,1]

### **Constraints:**
- The number of nodes in each linked list is in the range \`[1, 100]\`.
- \`0 <= Node.val <= 9\`
- It is guaranteed that the list represents a number that does not have leading zeros.`
  },
  {
    slug: 'copy-list-with-random-pointer',
    description: `A linked list of length \`n\` is given such that each node contains an additional random pointer, which could point to any node in the list, or \`null\`.

Construct a **deep copy** of the list. The deep copy should consist of exactly \`n\` **brand new** nodes, where each new node has its value set to the value of its corresponding original node. Both the \`next\` and \`random\` pointer of the new nodes should point to new nodes in the copied list such that the pointers in the original list and copied list represent the same list state. **None of the pointers in the new list should point to nodes in the original list.**

Return *the head of the copied linked list*.

### **Example 1:**
![Copy List Example 1](https://assets.leetcode.com/uploads/2019/12/18/e1.png)
Input: head = [[7,null],[13,0],[11,4],[10,2],[1,0]]
Output: [[7,null],[13,0],[11,4],[10,2],[1,0]]

### **Example 2:**
![Copy List Example 2](https://assets.leetcode.com/uploads/2019/12/18/e2.png)
Input: head = [[1,1],[2,1]]
Output: [[1,1],[2,1]]

### **Example 3:**
![Copy List Example 3](https://assets.leetcode.com/uploads/2019/12/18/e3.png)
Input: head = [[3,null],[3,0],[3,null]]
Output: [[3,null],[3,0],[3,null]]

### **Constraints:**
- \`0 <= n <= 1000\`
- \`-10⁴ <= Node.val <= 10⁴\`
- \`Node.random\` is \`null\` or is pointing to some node in the linked list.`
  },
  {
    slug: 'reverse-nodes-in-k-group',
    description: `Given the \`head\` of a linked list, reverse the nodes of the list \`k\` at a time, and return *the modified list*.

\`k\` is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of \`k\` then left-out nodes, in the end, should remain as it is.

You may not alter the values in the list's nodes, only nodes themselves may be changed.

### **Example 1:**
![Reverse Nodes in k-Group Example 1](https://assets.leetcode.com/uploads/2020/10/03/reverse_ex1.jpg)
Input: head = [1,2,3,4,5], k = 2
Output: [2,1,4,3,5]

### **Example 2:**
![Reverse Nodes in k-Group Example 2](https://assets.leetcode.com/uploads/2020/10/03/reverse_ex2.jpg)
Input: head = [1,2,3,4,5], k = 3
Output: [3,2,1,4,5]

### **Constraints:**
- The number of nodes in the list is \`n\`.
- \`1 <= k <= n <= 5000\`
- \`0 <= Node.val <= 1000\``
  },
  {
    slug: 'rotate-list',
    description: `Given the \`head\` of a linked list, rotate the list to the right by \`k\` places.

### **Example 1:**
![Rotate List Example 1](https://assets.leetcode.com/uploads/2020/11/13/rotate1.jpg)
Input: head = [1,2,3,4,5], k = 2
Output: [4,5,1,2,3]

### **Example 2:**
![Rotate List Example 2](https://assets.leetcode.com/uploads/2020/11/13/roate2.jpg)
Input: head = [0,1,2], k = 4
Output: [2,0,1]

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 500]\`.
- \`-100 <= Node.val <= 100\`
- \`0 <= k <= 2 * 10⁹\``
  },
  {
    slug: 'invert-binary-tree',
    description: `Given the \`root\` of a binary tree, invert the tree, and return *its root*.

### **Example 1:**
![Invert Binary Tree Example 1](https://assets.leetcode.com/uploads/2021/03/14/invert1-tree.jpg)
Input: root = [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]

### **Example 2:**
![Invert Binary Tree Example 2](https://assets.leetcode.com/uploads/2021/03/14/invert2-tree.jpg)
Input: root = [2,1,3]
Output: [2,3,1]

### **Example 3:**
Input: root = []
Output: []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    slug: 'maximum-depth-of-binary-tree',
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.

### **Example 1:**
![Max Depth Example 1](https://assets.leetcode.com/uploads/2020/11/26/tmp-tree.jpg)
Input: root = [3,9,20,null,null,15,7]
Output: 3

### **Example 2:**
Input: root = [1,null,2]
Output: 2

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 10⁴]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    slug: 'balanced-binary-tree',
    description: `Given a binary tree, determine if it is **height-balanced**.

A **height-balanced** binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.

### **Example 1:**
![Balanced Tree Example 1](https://assets.leetcode.com/uploads/2020/10/06/balance_1.jpg)
Input: root = [3,9,20,null,null,15,7]
Output: true

### **Example 2:**
![Balanced Tree Example 2](https://assets.leetcode.com/uploads/2020/10/06/balance_2.jpg)
Input: root = [1,2,2,3,3,null,null,4,4]
Output: false

### **Example 3:**
Input: root = []
Output: true

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-10⁴ <= Node.val <= 10⁴\``
  },
  {
    slug: 'same-tree',
    description: `Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.

Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.

### **Example 1:**
![Same Tree Example 1](https://assets.leetcode.com/uploads/2020/12/20/ex1.jpg)
Input: p = [1,2,3], q = [1,2,3]
Output: true

### **Example 2:**
![Same Tree Example 2](https://assets.leetcode.com/uploads/2020/12/20/ex2.jpg)
Input: p = [1,2], q = [1,null,2]
Output: false

### **Example 3:**
![Same Tree Example 3](https://assets.leetcode.com/uploads/2020/12/20/ex3.jpg)
Input: p = [1,2,1], q = [1,1,2]
Output: false

### **Constraints:**
- The number of nodes in both trees is in the range \`[0, 100]\`.
- \`-10⁴ <= Node.val <= 10⁴\``
  },
  {
    slug: 'symmetric-tree',
    description: `Given the \`root\` of a binary tree, *check whether it is a mirror of itself* (i.e., symmetric around its center).

### **Example 1:**
![Symmetric Tree Example 1](https://assets.leetcode.com/uploads/2021/02/19/symtree1.jpg)
Input: root = [1,2,2,3,4,4,3]
Output: true

### **Example 2:**
![Symmetric Tree Example 2](https://assets.leetcode.com/uploads/2021/02/19/symtree2.jpg)
Input: root = [1,2,2,null,3,null,3]
Output: false

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    slug: 'binary-tree-level-order-traversal',
    description: `Given the \`root\` of a binary tree, return *the level order traversal of its nodes' values*. (i.e., from left to right, level by level).

### **Example 1:**
![Level Order Example 1](https://assets.leetcode.com/uploads/2021/02/19/tree1.jpg)
Input: root = [3,9,20,null,null,15,7]
Output: [[3],[9,20],[15,7]]

### **Example 2:**
Input: root = [1]
Output: [[1]]

### **Example 3:**
Input: root = []
Output: []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``
  },
  {
    slug: 'flatten-binary-tree-to-linked-list',
    description: `Given the \`root\` of a binary tree, flatten the tree into a "linked list":
- The "linked list" should use the same \`TreeNode\` class where the \`right\` child pointer points to the next node in the list and the \`left\` child pointer is always \`null\`.
- The "linked list" should be in the same order as a **pre-order traversal** of the binary tree.

### **Example 1:**
![Flatten Tree Example 1](https://assets.leetcode.com/uploads/2021/01/14/flaten.jpg)
Input: root = [1,2,5,3,4,null,6]
Output: [1,null,2,null,3,null,4,null,5,null,6]

### **Example 2:**
Input: root = []
Output: []

### **Example 3:**
Input: root = [0]
Output: [0]

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-100 <= Node.val <= 100\``
  },
  {
    slug: 'validate-binary-search-tree',
    description: `Given the \`root\` of a binary tree, *determine if it is a valid binary search tree (BST)*.

A **valid BST** is defined as follows:
- The left subtree of a node contains only nodes with keys **less than** the node's key.
- The right subtree of a node contains only nodes with keys **greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

### **Example 1:**
![Validate BST Example 1](https://assets.leetcode.com/uploads/2020/12/01/tree1.jpg)
Input: root = [2,1,3]
Output: true

### **Example 2:**
![Validate BST Example 2](https://assets.leetcode.com/uploads/2020/12/01/tree2.jpg)
Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root node's value is 5 but its right child's value is 4.

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 10⁴]\`.
- \`-2³¹ <= Node.val <= 2³¹ - 1\``
  },
  {
    slug: 'lowest-common-ancestor-of-bst',
    description: `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.

According to the **definition of LCA on Wikipedia**: “The lowest common ancestor is defined between two nodes \`p\` and \`q\` as the lowest node in \`T\` that has both \`p\` and \`q\` as descendants (where we allow **a node to be a descendant of itself**).”

### **Example 1:**
![LCA BST Example 1](https://assets.leetcode.com/uploads/2018/12/14/binarysearchtree_improved.png)
Input: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8
Output: 6
Explanation: The LCA of nodes 2 and 8 is 6.

### **Example 2:**
Input: root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4
Output: 2
Explanation: The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself according to the LCA definition.

### **Constraints:**
- The number of nodes in the tree is in the range \`[2, 10⁵]\`.
- \`-10⁹ <= Node.val <= 10⁹\`
- All \`Node.val\` are **unique**.
- \`p != q\`
- \`p\` and \`q\` will exist in the BST.`
  },
  {
    slug: 'binary-tree-maximum-path-sum',
    description: `A **path** in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence **at most once**. Note that the path does not need to pass through the root.

The **path sum** of a path is the sum of the node's values in the path.

Given the \`root\` of a binary tree, return *the maximum **path sum** of any **non-empty** path*.

### **Example 1:**
![Binary Tree Max Path Sum Example 1](https://assets.leetcode.com/uploads/2020/10/13/exx1.jpg)
Input: root = [1,2,3]
Output: 6
Explanation: The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6.

### **Example 2:**
![Binary Tree Max Path Sum Example 2](https://assets.leetcode.com/uploads/2020/10/13/exx2.jpg)
Input: root = [-10,9,20,null,null,15,7]
Output: 42
Explanation: The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42.

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 3 * 10⁴]\`.
- \`-1000 <= Node.val <= 1000\``
  },
  {
    slug: 'clone-graph',
    description: `Given a reference of a node in a **connected** undirected graph.

Return a **deep copy** (clone) of the graph.

Each node in the graph contains a value (\`val\`) and a list (\`List[Node]\`) of its neighbors.

\`\`\`
class Node {
    public int val;
    public List<Node> neighbors;
}
\`\`\`

### **Example 1:**
![Clone Graph Example 1](https://assets.leetcode.com/uploads/2019/11/04/133_clone_graph_question.png)
Input: adjList = [[2,4],[1,3],[2,4],[1,3]]
Output: [[2,4],[1,3],[2,4],[1,3]]
Explanation: There are 4 nodes in the graph.
1st node (val = 1)'s neighbors are 2nd node (val = 2) and 4th node (val = 4).
2nd node (val = 2)'s neighbors are 1st node (val = 1) and 3rd node (val = 3).
3rd node (val = 3)'s neighbors are 2nd node (val = 2) and 4th node (val = 4).
4th node (val = 4)'s neighbors are 1st node (val = 1) and 3rd node (val = 3).

### **Example 2:**
Input: adjList = [[]]
Output: [[]]
Explanation: Note that the input contains one empty list. The graph consists of only one node with val = 1 and it does not have any neighbors.

### **Example 3:**
Input: adjList = []
Output: []
Explanation: This an empty graph, it does not have any nodes.

### **Constraints:**
- The number of nodes in the graph is in the range \`[0, 100]\`.
- \`1 <= Node.val <= 100\`
- \`Node.val\` is unique for each node.
- There are no repeated edges and no self-loops in the graph.
- The Graph is connected and all nodes can be visited starting from the given node.`
  }
];

async function main() {
  console.log('Starting image restoration across ' + updates.length + ' problems...');
  let successCount = 0;
  for (const item of updates) {
    const res = await pool.query('UPDATE problems SET description = $1 WHERE slug = $2', [item.description, item.slug]);
    if (res.rowCount > 0) {
      console.log('✓ Updated ' + item.slug);
      successCount++;
    } else {
      console.warn('✗ Could not find problem with slug: ' + item.slug);
    }
  }
  console.log('\\nSuccessfully updated ' + successCount + ' of ' + updates.length + ' problems with official LeetCode images!');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

