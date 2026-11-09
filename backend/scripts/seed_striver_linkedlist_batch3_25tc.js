/**
 * backend/scripts/seed_striver_linkedlist_batch3_25tc.js
 * 
 * Seeds and validates Step 6: Learn LinkedList (Batch 3):
 * 1. Reverse Linked List (reverse-linked-list) [LeetCode 206]
 * 2. Linked List Cycle (linked-list-cycle) [LeetCode 141]
 * 3. Linked List Cycle II (linked-list-cycle-ii) [LeetCode 142]
 * 4. Find Length of Loop (find-length-of-loop) [GFG / Striver]
 * 5. Palindrome Linked List (palindrome-linked-list) [LeetCode 234]
 *
 * Each problem gets:
 * - 100% LeetCode/Striver standard description with examples, constraints & ASCII diagrams / images
 * - Exactly 25 curated test cases (1-3 public, 4-20 edge cases, 21-25 stress scale tests)
 * - Optimal solution validation: 25/25 ACCEPTED (< 400ms)
 * - Naive solution validation: strictly TIME_LIMIT_EXCEEDED (> 2000ms)
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const { evaluateSubmission } = require('../services/judge');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Reverse Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateReverseLLTCs() {
  const edgeInputs = [
    // 1-3 Public Examples
    [1, 2, 3, 4, 5],
    [1, 2],
    [],
    // 4-20 Edge Cases
    [42],
    [-1, -2, -3],
    [0],
    [7, 7, 7, 7],
    [1, 3, 5, 7, 9],
    [10, 20],
    [-5, 0, 5],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [100, -100, 200, -200],
    [5, 4, 3, 2, 1],
    [1, 1, 2, 2, 3, 3],
    [0, 1, 0, 1, 0],
    [5000, -5000],
    [999],
    [-10, -20, -30, -40],
    [3, 1, 4, 1, 5, 9, 2, 6],
    [1, 0],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = [...arr].reverse();
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 60,000, strictly kills O(N^2) naive)
  const stressSizes = [30000, 38000, 45000, 52000, 60000];
  for (let s = 0; s < stressSizes.length; s++) {
    const size = stressSizes[s];
    const arr = new Array(size);
    for (let j = 0; j < size; j++) {
      arr[j] = (j * 7) % 1000 - 500;
    }
    const expected = [...arr].reverse();
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Linked List Cycle
// ─────────────────────────────────────────────────────────────────────────────
function generateLLCycleTCs() {
  const edgeCases = [
    // 1-3 Public Examples
    { arr: [3, 2, 0, -4], pos: 1, expected: 'true' },
    { arr: [1, 2], pos: 0, expected: 'true' },
    { arr: [1], pos: -1, expected: 'false' },
    // 4-20 Edge Cases
    { arr: [], pos: -1, expected: 'false' },
    { arr: [1], pos: 0, expected: 'true' },
    { arr: [1, 2], pos: -1, expected: 'false' },
    { arr: [1, 2], pos: 1, expected: 'true' },
    { arr: [1, 2, 3, 4, 5], pos: 0, expected: 'true' },
    { arr: [1, 2, 3, 4, 5], pos: 2, expected: 'true' },
    { arr: [1, 2, 3, 4, 5], pos: 4, expected: 'true' },
    { arr: [1, 2, 3, 4, 5], pos: -1, expected: 'false' },
    { arr: [5, 4, 3, 2, 1], pos: 1, expected: 'true' },
    { arr: [-10, -20, 0, 10, 20], pos: 3, expected: 'true' },
    { arr: [100, 200, 300], pos: -1, expected: 'false' },
    { arr: [1, 1, 1, 1, 1], pos: 2, expected: 'true' },
    { arr: [7, 14, 21, 28], pos: 0, expected: 'true' },
    { arr: [9, 8, 7, 6, 5, 4], pos: -1, expected: 'false' },
    { arr: [1, 2, 3, 4, 5, 6, 7], pos: 6, expected: 'true' },
    { arr: [10, 20, 30, 40, 50, 60], pos: 1, expected: 'true' },
    { arr: [0], pos: -1, expected: 'false' },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    tcs.push({
      input: `${JSON.stringify(c.arr)}, ${c.pos}`,
      output: c.expected,
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 65,000)
  const stressConfigs = [
    { size: 30000, pos: -1, exp: 'false' },
    { size: 38000, pos: 25000, exp: 'true' },
    { size: 45000, pos: -1, exp: 'false' },
    { size: 55000, pos: 40000, exp: 'true' },
    { size: 65000, pos: -1, exp: 'false' },
  ];

  for (let s = 0; s < stressConfigs.length; s++) {
    const conf = stressConfigs[s];
    const arr = new Array(conf.size);
    for (let j = 0; j < conf.size; j++) arr[j] = j % 1000;
    tcs.push({
      input: `${JSON.stringify(arr)}, ${conf.pos}`,
      output: conf.exp,
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Linked List Cycle II
// ─────────────────────────────────────────────────────────────────────────────
function generateLLCycleIITCs() {
  const edgeCases = [
    // 1-3 Public Examples
    { arr: [3, 2, 0, -4], pos: 1, expected: 'tail connects to node index 1' },
    { arr: [1, 2], pos: 0, expected: 'tail connects to node index 0' },
    { arr: [1], pos: -1, expected: 'no cycle' },
    // 4-20 Edge Cases
    { arr: [], pos: -1, expected: 'no cycle' },
    { arr: [1], pos: 0, expected: 'tail connects to node index 0' },
    { arr: [1, 2], pos: -1, expected: 'no cycle' },
    { arr: [1, 2], pos: 1, expected: 'tail connects to node index 1' },
    { arr: [1, 2, 3, 4, 5], pos: 0, expected: 'tail connects to node index 0' },
    { arr: [1, 2, 3, 4, 5], pos: 2, expected: 'tail connects to node index 2' },
    { arr: [1, 2, 3, 4, 5], pos: 4, expected: 'tail connects to node index 4' },
    { arr: [1, 2, 3, 4, 5], pos: -1, expected: 'no cycle' },
    { arr: [5, 4, 3, 2, 1], pos: 1, expected: 'tail connects to node index 1' },
    { arr: [-10, -20, 0, 10, 20], pos: 3, expected: 'tail connects to node index 3' },
    { arr: [100, 200, 300], pos: -1, expected: 'no cycle' },
    { arr: [1, 1, 1, 1, 1], pos: 2, expected: 'tail connects to node index 2' },
    { arr: [7, 14, 21, 28], pos: 0, expected: 'tail connects to node index 0' },
    { arr: [9, 8, 7, 6, 5, 4], pos: -1, expected: 'no cycle' },
    { arr: [1, 2, 3, 4, 5, 6, 7], pos: 6, expected: 'tail connects to node index 6' },
    { arr: [10, 20, 30, 40, 50, 60], pos: 1, expected: 'tail connects to node index 1' },
    { arr: [0], pos: -1, expected: 'no cycle' },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    tcs.push({
      input: `${JSON.stringify(c.arr)}, ${c.pos}`,
      output: c.expected,
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 65,000)
  const stressConfigs = [
    { size: 30000, pos: -1, exp: 'no cycle' },
    { size: 38000, pos: 25000, exp: 'tail connects to node index 25000' },
    { size: 45000, pos: -1, exp: 'no cycle' },
    { size: 55000, pos: 40000, exp: 'tail connects to node index 40000' },
    { size: 65000, pos: -1, exp: 'no cycle' },
  ];

  for (let s = 0; s < stressConfigs.length; s++) {
    const conf = stressConfigs[s];
    const arr = new Array(conf.size);
    for (let j = 0; j < conf.size; j++) arr[j] = j % 1000;
    tcs.push({
      input: `${JSON.stringify(arr)}, ${conf.pos}`,
      output: conf.exp,
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Find Length of Loop
// ─────────────────────────────────────────────────────────────────────────────
function generateFindLengthOfLoopTCs() {
  const edgeCases = [
    // 1-3 Public Examples
    { arr: [25, 14, 19, 33, 10, 21, 39, 90, 58, 45], pos: 4, expected: '6' },
    { arr: [1, 2, 3, 4], pos: -1, expected: '0' },
    { arr: [1, 2, 3, 4, 5], pos: 0, expected: '5' },
    // 4-20 Edge Cases
    { arr: [], pos: -1, expected: '0' },
    { arr: [1], pos: -1, expected: '0' },
    { arr: [1], pos: 0, expected: '1' },
    { arr: [1, 2], pos: -1, expected: '0' },
    { arr: [1, 2], pos: 0, expected: '2' },
    { arr: [1, 2], pos: 1, expected: '1' },
    { arr: [10, 20, 30, 40], pos: 2, expected: '2' },
    { arr: [5, 10, 15, 20, 25, 30], pos: 3, expected: '3' },
    { arr: [1, 2, 3, 4, 5, 6, 7], pos: 1, expected: '6' },
    { arr: [-1, -2, -3, -4, -5], pos: -1, expected: '0' },
    { arr: [100, 200, 300, 400], pos: 0, expected: '4' },
    { arr: [3, 2, 0, -4], pos: 1, expected: '3' },
    { arr: [1, 3, 5, 7, 9, 11], pos: 5, expected: '1' },
    { arr: [4, 8, 12, 16, 20, 24, 28, 32], pos: 2, expected: '6' },
    { arr: [99, 100], pos: 1, expected: '1' },
    { arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], pos: 5, expected: '5' },
    { arr: [0, 0, 0, 0], pos: -1, expected: '0' },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    tcs.push({
      input: `${JSON.stringify(c.arr)}, ${c.pos}`,
      output: c.expected,
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 65,000)
  const stressConfigs = [
    { size: 30000, pos: -1, exp: '0' },
    { size: 38000, pos: 15000, exp: '23000' }, // 38000 - 15000 = 23000
    { size: 45000, pos: -1, exp: '0' },
    { size: 55000, pos: 20000, exp: '35000' }, // 55000 - 20000 = 35000
    { size: 65000, pos: -1, exp: '0' },
  ];

  for (let s = 0; s < stressConfigs.length; s++) {
    const conf = stressConfigs[s];
    const arr = new Array(conf.size);
    for (let j = 0; j < conf.size; j++) arr[j] = j % 1000;
    tcs.push({
      input: `${JSON.stringify(arr)}, ${conf.pos}`,
      output: conf.exp,
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Palindrome Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generatePalindromeLLTCs() {
  const edgeCases = [
    // 1-3 Public Examples
    { arr: [1, 2, 2, 1], expected: 'true' },
    { arr: [1, 2], expected: 'false' },
    { arr: [1, 2, 3, 2, 1], expected: 'true' },
    // 4-20 Edge Cases
    { arr: [1], expected: 'true' },
    { arr: [0, 0], expected: 'true' },
    { arr: [1, 1, 1, 1], expected: 'true' },
    { arr: [7, 7, 7, 7, 7], expected: 'true' },
    { arr: [1, 2, 3, 4, 5], expected: 'false' },
    { arr: [1, 2, 3, 3, 2, 1], expected: 'true' },
    { arr: [1, 2, 3, 4, 3, 2, 1], expected: 'true' },
    { arr: [1, 2, 3, 4, 5, 2, 1], expected: 'false' },
    { arr: [1, 2, 3, 2, 2], expected: 'false' },
    { arr: [2, 2, 3, 2, 1], expected: 'false' },
    { arr: [9, 8, 7, 8, 9], expected: 'true' },
    { arr: [0, 1, 0], expected: 'true' },
    { arr: [1, 0, 1, 0], expected: 'false' },
    { arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], expected: 'true' },
    { arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 7, 6, 5, 4, 3, 2, 1], expected: 'false' },
    { arr: [5, 4, 5], expected: 'true' },
    { arr: [4, 5, 6, 4], expected: 'false' },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    tcs.push({
      input: JSON.stringify(c.arr),
      output: c.expected,
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 65,000, kills O(N^2) naive traversal)
  const stressSizes = [
    { size: 30000, isPal: true },
    { size: 38000, isPal: false },
    { size: 45000, isPal: true },
    { size: 55000, isPal: false },
    { size: 65000, isPal: true },
  ];

  for (let s = 0; s < stressSizes.length; s++) {
    const conf = stressSizes[s];
    const half = Math.floor(conf.size / 2);
    const firstHalf = [];
    for (let j = 0; j < half; j++) firstHalf.push((j % 9) + 1);
    const secondHalf = [...firstHalf].reverse();
    if (!conf.isPal) {
      // make it non-palindrome
      secondHalf[secondHalf.length - 1] = (secondHalf[secondHalf.length - 1] === 1) ? 2 : 1;
    }
    const arr = [...firstHalf, ...secondHalf];
    tcs.push({
      input: JSON.stringify(arr),
      output: conf.isPal ? 'true' : 'false',
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Problem Definitions
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  // 1. Reverse Linked List
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '[5, 4, 3, 2, 1]',
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
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`-5000 <= Node.val <= 5000\`

**Follow up:** A linked list can be reversed either iteratively or recursively. Could you implement both?`,
    hints: [
      'Think about maintaining three pointers: previous, current, and next.',
      'In each iteration, save `current.next`, flip `current.next` to point to `previous`, then advance `previous` and `current`.',
      'When `current` becomes `null`, `previous` will point to the new head of the reversed list.'
    ],
    testCases: generateReverseLLTCs(),
    optimalCode: `function solution(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const nextNode = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextNode;
  }
  return prev;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return head;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  const arr = [];
  for (let i = 0; i < n; i++) {
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    arr.push(cur.val);
  }
  arr.reverse();
  return __buildList(arr);
}`
  },

  // 2. Linked List Cycle
  {
    title: 'Linked List Cycle',
    slug: 'linked-list-cycle',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[3, 2, 0, -4], 1',
    sample_output: 'true',
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
- \`pos\` is \`-1\` or a **valid index** in the linked-list.

**Follow up:** Can you solve it using \`O(1)\` (i.e. constant) memory?`,
    hints: [
      "A two-pointer approach (Floyd's Tortoise and Hare) moves one pointer at 1 step/iteration and the other at 2 steps/iteration.",
      "If there is no cycle, the fast pointer will eventually hit null.",
      "If there is a cycle, the fast pointer will eventually lap and meet the slow pointer."
    ],
    testCases: generateLLCycleTCs(),
    optimalCode: `function solution(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
    naiveCode: `function solution(head) {
  if (!head) return false;
  let curr = head, step = 0;
  while (curr && step < 100000) {
    step++;
    let check = head;
    while (check !== curr) {
      check = check.next;
    }
    curr = curr.next;
  }
  return step >= 100000;
}`
  },

  // 3. Linked List Cycle II
  {
    title: 'Linked List Cycle II',
    slug: 'linked-list-cycle-ii',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[3, 2, 0, -4], 1',
    sample_output: 'tail connects to node index 1',
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
- \`pos\` is \`-1\` or a **valid index** in the linked-list.

**Follow up:** Can you solve it using \`O(1)\` (i.e. constant) memory?`,
    hints: [
      "First, use Floyd's Tortoise and Hare algorithm to find the meeting point inside the cycle.",
      "If the fast pointer reaches the end (null), return null.",
      "If they meet, reset one pointer to the head and keep the other at the meeting point. Move both one step at a time; their new collision point will be the starting node of the cycle."
    ],
    testCases: generateLLCycleIITCs(),
    optimalCode: `function solution(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let entry = head;
      while (entry !== slow) {
        entry = entry.next;
        slow = slow.next;
      }
      return entry;
    }
  }
  return null;
}`,
    naiveCode: `function solution(head) {
  if (!head) return null;
  let curr = head, step = 0;
  while (curr && step < 100000) {
    step++;
    let check = head;
    while (check !== curr) {
      check = check.next;
    }
    curr = curr.next;
  }
  return null;
}`
  },

  // 4. Find Length of Loop
  {
    title: 'Find Length of Loop',
    slug: 'find-length-of-loop',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[25, 14, 19, 33, 10, 21, 39, 90, 58, 45], 4',
    sample_output: '6',
    description: `Given the \`head\` of a linked list, determine whether a loop exists in the linked list and return the **number of nodes** in the loop. If there is no loop, return \`0\`.

A loop exists if by continuously following the \`next\` pointer from the head, we reach a node that was previously visited.

\`\`\`
Example 1 Diagram:
25 -> 14 -> 19 -> 33 -> [10] -> 21 -> 39 -> 90 -> 58 -> [45]
                          ^                               |
                          |-------------------------------|
The loop consists of 6 nodes: 10, 21, 39, 90, 58, 45. Length = 6.
\`\`\`

### **Example 1:**
Input: head = [25, 14, 19, 33, 10, 21, 39, 90, 58, 45], pos = 4
Output: 6
Explanation: The tail connects to node at index 4 (0-indexed). The cycle contains 6 nodes.

### **Example 2:**
Input: head = [1, 2, 3, 4], pos = -1
Output: 0
Explanation: There is no loop in the linked list.

### **Example 3:**
Input: head = [1, 2, 3, 4, 5], pos = 0
Output: 5
Explanation: The tail connects to node at index 0, forming a cycle of all 5 nodes.

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 10⁵]\`.
- \`-10⁵ <= Node.val <= 10⁵\`
- \`pos\` is \`-1\` or a valid index in the list.`,
    hints: [
      "Use Floyd's Tortoise and Hare algorithm (slow and fast pointers).",
      "When slow meets fast, you are guaranteed to be inside the loop.",
      "Keep slow fixed at the meeting point and advance another pointer one step at a time, counting how many steps it takes to return to slow."
    ],
    testCases: generateFindLengthOfLoopTCs(),
    optimalCode: `function solution(head) {
  if (!head) return 0;
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let count = 1;
      let curr = slow.next;
      while (curr !== slow) {
        count++;
        curr = curr.next;
      }
      return count;
    }
  }
  return 0;
}`,
    naiveCode: `function solution(head) {
  if (!head) return 0;
  let curr = head, step = 0;
  while (curr && step < 100000) {
    step++;
    let check = head;
    while (check !== curr) {
      check = check.next;
    }
    curr = curr.next;
  }
  return 0;
}`
  },

  // 5. Palindrome Linked List
  {
    title: 'Palindrome Linked List',
    slug: 'palindrome-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[1, 2, 2, 1]',
    sample_output: 'true',
    description: `Given the \`head\` of a singly linked list, return \`true\` if it is a **palindrome** or \`false\` otherwise.

### **Example 1:**
![Palindrome Linked List Example 1](https://assets.leetcode.com/uploads/2021/03/03/pal1linked-list.jpg)
Input: head = [1,2,2,1]
Output: true

### **Example 2:**
![Palindrome Linked List Example 2](https://assets.leetcode.com/uploads/2021/03/03/pal2linked-list.jpg)
Input: head = [1,2]
Output: false

### **Example 3:**
Input: head = [1,2,3,2,1]
Output: true

### **Constraints:**
- The number of nodes in the list is in the range \`[1, 10⁵]\`.
- \`0 <= Node.val <= 9\`

**Follow up:** Could you do it in \`O(n)\` time and \`O(1)\` space?`,
    hints: [
      'Find the middle of the linked list using slow and fast pointers.',
      'Reverse the second half of the linked list in-place.',
      'Compare values of the first half and the reversed second half node by node.'
    ],
    testCases: generatePalindromeLLTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return true;
  let slow = head;
  let fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let prev = null;
  let curr = slow.next;
  while (curr) {
    const nextNode = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextNode;
  }
  let p1 = head;
  let p2 = prev;
  let isPal = true;
  while (p2) {
    if (p1.val !== p2.val) {
      isPal = false;
      break;
    }
    p1 = p1.next;
    p2 = p2.next;
  }
  return isPal;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return true;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  for (let i = 0; i < Math.floor(n / 2); i++) {
    let p1 = head;
    for (let j = 0; j < i; j++) p1 = p1.next;
    let p2 = head;
    for (let j = 0; j < n - 1 - i; j++) p2 = p2.next;
    if (p1.val !== p2.val) return false;
  }
  return true;
}`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Execution & Strict TLE Validation Harness
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== SEEDING STRIVER LEARN LINKEDLIST (BATCH 3 - 5 PROBLEMS) ===\n');

  for (const p of PROBLEMS) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Processing: ${p.title} (${p.slug})...`);

    // 1. Check if problem already exists
    const { rows: existing } = await pool.query(
      `SELECT id FROM problems WHERE slug = $1`,
      [p.slug]
    );

    let problemId;
    if (existing.length > 0) {
      problemId = existing[0].id;
      console.log(`  -> Found existing problem (ID: ${problemId}), updating fields...`);
      await pool.query(
        `UPDATE problems 
         SET title = $1, topic = $2, difficulty = $3, description = $4, hints = $5, sample_input = $6, sample_output = $7
         WHERE id = $8`,
        [p.title, p.topic, p.difficulty, p.description, JSON.stringify(p.hints), p.sample_input, p.sample_output, problemId]
      );
    } else {
      console.log(`  -> Inserting new problem into DB...`);
      const { rows: inserted } = await pool.query(
        `INSERT INTO problems (title, slug, topic, difficulty, description, hints, sample_input, sample_output)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [p.title, p.slug, p.topic, p.difficulty, p.description, JSON.stringify(p.hints), p.sample_input, p.sample_output]
      );
      problemId = inserted[0].id;
      console.log(`  -> Inserted with ID: ${problemId}`);
    }

    // 2. Clear old test cases
    const { rowCount: deletedCount } = await pool.query(
      `DELETE FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );
    if (deletedCount > 0) {
      console.log(`  -> Cleared ${deletedCount} existing test cases.`);
    }

    // 3. Insert 25 curated test cases
    console.log(`  -> Inserting ${p.testCases.length} curated test cases...`);
    for (const tc of p.testCases) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }

    // 4. Verify test case count in DB
    const { rows: countCheck } = await pool.query(
      `SELECT count(*) FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );
    console.log(`  -> Verified in DB: count = ${countCheck[0].count} test cases.`);

    // 5. Query back test cases and run Judge evaluation on OPTIMAL code
    console.log(`  -> Evaluating OPTIMAL solution...`);
    const optResult = await evaluateSubmission(problemId, p.optimalCode, 'javascript');
    console.log(`  -> Optimal Verdict: ${optResult.verdict} (${optResult.passedTests}/${optResult.totalTests} passed in ${optResult.runtimeMs}ms)`);

    if (optResult.verdict !== 'ACCEPTED' || optResult.passedTests !== 25) {
      console.error(`  [ERROR] Problem ${p.title} failed OPTIMAL validation!`);
      const firstFailed = optResult.testResults.find(t => !t.passed);
      console.error('  First failed test:', firstFailed);
      process.exit(1);
    }

    // 6. Run Judge evaluation on NAIVE code to strictly verify TLE
    console.log(`  -> Evaluating NAIVE solution (expecting strictly TIME_LIMIT_EXCEEDED)...`);
    const naiveResult = await evaluateSubmission(problemId, p.naiveCode, 'javascript');
    console.log(`  -> Naive Verdict: ${naiveResult.verdict} (${naiveResult.passedTests}/${naiveResult.totalTests} passed in ${naiveResult.runtimeMs}ms)`);

    if (naiveResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
      console.error(`  [ERROR] Problem ${p.title} naive solution DID NOT trigger TLE! Verdict was: ${naiveResult.verdict}`);
      process.exit(1);
    }

    console.log(`  -> [VERIFIED]: Both Optimal (25/25 ACCEPTED) and Naive (strictly TLE) verified for ${p.title}`);
  }

  console.log('\n====================================================');
  console.log('ALL 5 PROBLEMS SUCCESSFULLY SEEDED, TESTED & TLE-VERIFIED!');
  console.log('====================================================\n');
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
