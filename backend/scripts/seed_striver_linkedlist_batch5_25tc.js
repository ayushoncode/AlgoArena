/**
 * backend/scripts/seed_striver_linkedlist_batch5_25tc.js
 * 
 * Seeds and validates Step 6: Linked List (Batch 5):
 * 1. Add 1 to a Linked List (add-1-to-a-linked-list) [GFG / Striver]
 * 2. Add Two Numbers (add-two-numbers) [LeetCode 2]
 * 3. Delete all occurrences of a key in a doubly linked list (delete-all-occurrences-of-a-key-in-dll) [GFG / Striver]
 * 4. Find pairs with given sum in doubly linked list (find-pairs-with-given-sum-in-doubly-linked-list) [GFG / Striver]
 * 5. Remove duplicates from a sorted doubly linked list (remove-duplicates-from-a-sorted-doubly-linked-list) [GFG / Striver]
 *
 * Each problem gets:
 * - 100% LeetCode/Striver standard description with examples, constraints & official LC CDN images / ASCII diagrams
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
// 1. Add 1 to a Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateAdd1TCs() {
  function solveAdd1(arr) {
    if (!arr || arr.length === 0) return [1];
    const copy = [...arr];
    let carry = 1;
    for (let i = copy.length - 1; i >= 0; i--) {
      const sum = copy[i] + carry;
      copy[i] = sum % 10;
      carry = Math.floor(sum / 10);
    }
    if (carry > 0) copy.unshift(carry);
    return copy;
  }

  const edgeInputs = [
    // 1-3 Public Examples
    [4, 5, 6],
    [9, 9, 9],
    [0],
    // 4-20 Edge Cases
    [1],
    [9],
    [1, 9],
    [1, 8, 9],
    [8, 9, 9],
    [9, 9, 9, 9],
    [1, 2, 3, 4, 5],
    [1, 0, 0, 0],
    [9, 0, 9],
    [5, 4, 3, 2, 1],
    [1, 9, 9, 9, 9],
    [2, 0],
    [7, 9],
    [9, 9],
    [3, 4, 9],
    [1, 1, 1, 1],
    [6, 9, 9, 9],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = solveAdd1(arr);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 68,000)
  const stressSizes = [30000, 38000, 48000, 58000, 68000];
  for (let s = 0; s < stressSizes.length; s++) {
    const size = stressSizes[s];
    const arr = new Array(size);
    for (let j = 0; j < size; j++) {
      arr[j] = (j % 9) + 1; // 1 to 9
    }
    const expected = solveAdd1(arr);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Add Two Numbers
// ─────────────────────────────────────────────────────────────────────────────
function generateAddTwoNumbersTCs() {
  function solveAddTwo(l1, l2) {
    const res = [];
    let carry = 0;
    let i = 0;
    while (i < l1.length || i < l2.length || carry) {
      const v1 = i < l1.length ? l1[i] : 0;
      const v2 = i < l2.length ? l2[i] : 0;
      const sum = v1 + v2 + carry;
      res.push(sum % 10);
      carry = Math.floor(sum / 10);
      i++;
    }
    return res;
  }

  const edgeCases = [
    // 1-3 Public Examples
    { l1: [2, 4, 3], l2: [5, 6, 4] },
    { l1: [0], l2: [0] },
    { l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] },
    // 4-20 Edge Cases
    { l1: [1], l2: [9] },
    { l1: [5], l2: [5] },
    { l1: [1, 8], l2: [0] },
    { l1: [9], l2: [1, 9, 9] },
    { l1: [1, 2, 3], l2: [4, 5, 6] },
    { l1: [9, 9], l2: [1] },
    { l1: [2, 4], l2: [5, 6, 4] },
    { l1: [1, 0, 1], l2: [9, 9] },
    { l1: [7], l2: [8] },
    { l1: [1, 2, 3, 4], l2: [5, 6, 7, 8] },
    { l1: [0], l2: [7, 3] },
    { l1: [5, 6], l2: [5, 4] },
    { l1: [9, 9, 9], l2: [9, 9, 9] },
    { l1: [1], l2: [9, 9, 9, 9] },
    { l1: [3, 7], l2: [9, 2] },
    { l1: [1, 2, 3], l2: [0] },
    { l1: [8, 9, 9], l2: [2] },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    const expected = solveAddTwo(c.l1, c.l2);
    tcs.push({
      input: `${JSON.stringify(c.l1)}, ${JSON.stringify(c.l2)}`,
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 68,000)
  const stressSizes = [30000, 38000, 48000, 58000, 68000];
  for (let s = 0; s < stressSizes.length; s++) {
    const size = stressSizes[s];
    const l1 = new Array(size);
    const l2 = new Array(size);
    for (let j = 0; j < size; j++) {
      l1[j] = (j * 3) % 10;
      l2[j] = (j * 7) % 10;
    }
    const expected = solveAddTwo(l1, l2);
    tcs.push({
      input: `${JSON.stringify(l1)}, ${JSON.stringify(l2)}`,
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Delete all occurrences of a key in a doubly linked list
// ─────────────────────────────────────────────────────────────────────────────
function generateDeleteAllOccurTCs() {
  function solveDeleteAll(arr, key) {
    if (!arr || arr.length === 0) return [];
    return arr.filter(x => x !== key);
  }

  const edgeCases = [
    // 1-3 Public Examples
    { arr: [2, 2, 10, 8, 4, 2, 5, 2], key: 2 },
    { arr: [9, 1, 3, 4, 5, 1, 8, 4], key: 9 },
    { arr: [5, 5, 5], key: 5 },
    // 4-20 Edge Cases
    { arr: [1], key: 1 },
    { arr: [1], key: 2 },
    { arr: [1, 2], key: 1 },
    { arr: [1, 2], key: 2 },
    { arr: [1, 2, 3], key: 2 },
    { arr: [1, 2, 3], key: 4 },
    { arr: [2, 2, 2, 3], key: 2 },
    { arr: [3, 2, 2, 2], key: 2 },
    { arr: [10, 20, 10, 30, 10], key: 10 },
    { arr: [0, 0, 1, 0, 2, 0], key: 0 },
    { arr: [-1, -2, -1, -3], key: -1 },
    { arr: [4, 4, 4, 4], key: 4 },
    { arr: [1, 3, 5, 7], key: 5 },
    { arr: [7, 8, 7, 8, 7], key: 7 },
    { arr: [99, 100], key: 100 },
    { arr: [1, 2, 3, 4, 5, 2], key: 2 },
    { arr: [6, 6, 1, 6, 6], key: 6 },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    const expected = solveDeleteAll(c.arr, c.key);
    tcs.push({
      input: `${JSON.stringify(c.arr)}, ${c.key}`,
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 68,000)
  const stressSizes = [30000, 38000, 48000, 58000, 68000];
  for (let s = 0; s < stressSizes.length; s++) {
    const size = stressSizes[s];
    const arr = new Array(size);
    for (let j = 0; j < size; j++) arr[j] = j % 5; // keys 0..4
    const key = 2;
    const expected = solveDeleteAll(arr, key);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${key}`,
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Find pairs with given sum in doubly linked list
// ─────────────────────────────────────────────────────────────────────────────
function generateFindPairsTCs() {
  function solvePairs(arr, target) {
    const res = [];
    let l = 0, r = arr.length - 1;
    while (l < r) {
      const sum = arr[l] + arr[r];
      if (sum === target) {
        res.push([arr[l], arr[r]]);
        l++;
        r--;
      } else if (sum < target) {
        l++;
      } else {
        r--;
      }
    }
    return res;
  }

  const edgeCases = [
    // 1-3 Public Examples
    { arr: [1, 2, 4, 5, 6, 8, 9], target: 7 },
    { arr: [1, 5, 6], target: 6 },
    { arr: [1, 2, 3], target: 10 },
    // 4-20 Edge Cases
    { arr: [1, 2], target: 3 },
    { arr: [1, 2], target: 4 },
    { arr: [1], target: 1 },
    { arr: [2, 4, 6, 8, 10], target: 12 },
    { arr: [1, 3, 5, 7, 9], target: 10 },
    { arr: [1, 2, 3, 4, 5], target: 6 },
    { arr: [1, 2, 3, 4, 5], target: 5 },
    { arr: [10, 20, 30, 40], target: 50 },
    { arr: [1, 4, 7, 10, 13], target: 14 },
    { arr: [3, 5, 7, 9], target: 12 },
    { arr: [1, 2, 3, 4, 5, 6, 7, 8], target: 9 },
    { arr: [2, 5, 8, 11, 14], target: 16 },
    { arr: [5, 10, 15, 20], target: 25 },
    { arr: [1, 6, 7, 8], target: 10 },
    { arr: [4, 8, 12, 16], target: 20 },
    { arr: [1, 2, 4, 7, 11], target: 8 },
    { arr: [2, 3, 5, 8, 13], target: 10 },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    const expected = solvePairs(c.arr, c.target);
    tcs.push({
      input: `${JSON.stringify(c.arr)}, ${c.target}`,
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 68,000)
  const stressSizes = [30000, 38000, 48000, 58000, 68000];
  for (let s = 0; s < stressSizes.length; s++) {
    const size = stressSizes[s];
    const arr = new Array(size);
    for (let j = 0; j < size; j++) arr[j] = j * 2 + 1; // distinct sorted odd numbers
    const target = (size - 1) * 2; // will have multiple matches
    const expected = solvePairs(arr, target);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${target}`,
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Remove duplicates from a sorted doubly linked list
// ─────────────────────────────────────────────────────────────────────────────
function generateRemoveDuplicatesDLLTCs() {
  function solveRemoveDup(arr) {
    if (!arr || arr.length === 0) return [];
    const res = [];
    for (let i = 0; i < arr.length; i++) {
      if (res.length === 0 || res[res.length - 1] !== arr[i]) {
        res.push(arr[i]);
      }
    }
    return res;
  }

  const edgeInputs = [
    // 1-3 Public Examples
    [1, 1, 1, 2, 3, 4],
    [1, 2, 2, 3, 3, 4, 4],
    [1],
    // 4-20 Edge Cases
    [],
    [1, 1],
    [1, 2],
    [1, 1, 1, 1],
    [1, 1, 2, 2],
    [1, 2, 3, 4, 5],
    [0, 0, 0, 1, 1, 2],
    [-5, -5, -3, -3, 0],
    [7, 7, 8, 9, 9, 9],
    [2, 2, 2, 2, 2],
    [10, 20, 20, 30],
    [1, 1, 1, 2, 2, 2, 3, 3, 3],
    [42, 42, 99],
    [1, 2, 2, 2, 3],
    [3, 3, 4, 5, 5],
    [100, 100, 200, 200, 300],
    [1, 2, 3, 3, 3, 3],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = solveRemoveDup(arr);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 68,000)
  const stressSizes = [30000, 38000, 48000, 58000, 68000];
  for (let s = 0; s < stressSizes.length; s++) {
    const size = stressSizes[s];
    const arr = new Array(size);
    for (let j = 0; j < size; j++) {
      arr[j] = Math.floor(j / 3); // lots of consecutive duplicates
    }
    const expected = solveRemoveDup(arr);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Problem Definitions
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  // 1. Add 1 to a Linked List
  {
    title: 'Add 1 to a Linked List',
    slug: 'add-1-to-a-linked-list',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[4, 5, 6]',
    sample_output: '[4, 5, 7]',
    description: `A number \`N\` is represented in a linked list such that each digit corresponds to a node in the linked list. You need to add 1 to the number represented by the linked list and return the head of the modified list.

The most significant digit is at the head of the list.

\`\`\`
Example 1 Diagram:
Initial: 4 -> 5 -> 6
+ 1    : 4 -> 5 -> 7
\`\`\`

### **Example 1:**
Input: head = [4, 5, 6]
Output: [4, 5, 7]
Explanation: 456 + 1 = 457.

### **Example 2:**
Input: head = [9, 9, 9]
Output: [1, 0, 0, 0]
Explanation: 999 + 1 = 1000.

### **Example 3:**
Input: head = [0]
Output: [1]

### **Constraints:**
- \`1 <= N <= 10⁵\`
- \`0 <= Node.val <= 9\``,
    hints: [
      'A simple approach is to reverse the linked list, add 1 with carry propagation, and reverse it back.',
      'Alternatively, use recursion to propagate the carry from the tail back to the head.',
      'If a carry remains after the head node, create a new node with value 1 and make it the new head.'
    ],
    testCases: generateAdd1TCs(),
    optimalCode: `function solution(head) {
  function reverse(node) {
    let prev = null, curr = node;
    while (curr) {
      const nxt = curr.next;
      curr.next = prev;
      prev = curr;
      curr = nxt;
    }
    return prev;
  }
  let rev = reverse(head);
  let curr = rev, carry = 1;
  while (curr && carry) {
    const sum = curr.val + carry;
    curr.val = sum % 10;
    carry = Math.floor(sum / 10);
    if (!curr.next && carry) {
      curr.next = new ListNode(carry);
      carry = 0;
    }
    curr = curr.next;
  }
  return reverse(rev);
}`,
    naiveCode: `function solution(head) {
  if (!head) return head;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  const arr = [];
  for (let i = 0; i < n; i++) {
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    arr.push(cur.val);
  }
  let carry = 1;
  for (let i = arr.length - 1; i >= 0; i--) {
    const sum = arr[i] + carry;
    arr[i] = sum % 10;
    carry = Math.floor(sum / 10);
  }
  if (carry > 0) arr.unshift(carry);
  return __buildList(arr);
}`
  },

  // 2. Add Two Numbers
  {
    title: 'Add Two Numbers',
    slug: 'add-two-numbers',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[2, 4, 3], [5, 6, 4]',
    sample_output: '[7, 0, 8]',
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
- It is guaranteed that the list represents a number that does not have leading zeros.`,
    hints: [
      'Maintain a `carry` variable (initially 0) as you traverse both lists in lockstep.',
      'At each step, calculate `sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry`, append `sum % 10` to your result, and set `carry = Math.floor(sum / 10)`.',
      'Remember to append a final node if `carry > 0` after both lists are exhausted.'
    ],
    testCases: generateAddTwoNumbersTCs(),
    optimalCode: `function solution(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  let carry = 0;
  while (l1 || l2 || carry) {
    let sum = carry;
    if (l1) { sum += l1.val; l1 = l1.next; }
    if (l2) { sum += l2.val; l2 = l2.next; }
    curr.next = new ListNode(sum % 10);
    carry = Math.floor(sum / 10);
    curr = curr.next;
  }
  return dummy.next;
}`,
    naiveCode: `function solution(l1, l2) {
  let n1 = 0, c1 = l1;
  while (c1) { n1++; c1 = c1.next; }
  let n2 = 0, c2 = l2;
  while (c2) { n2++; c2 = c2.next; }
  const maxLen = Math.max(n1, n2);
  const arr = [];
  let carry = 0;
  for (let i = 0; i < maxLen; i++) {
    let p1 = l1;
    for (let j = 0; j < i && p1; j++) p1 = p1.next;
    let p2 = l2;
    for (let j = 0; j < i && p2; j++) p2 = p2.next;
    const v1 = p1 ? p1.val : 0;
    const v2 = p2 ? p2.val : 0;
    const sum = v1 + v2 + carry;
    arr.push(sum % 10);
    carry = Math.floor(sum / 10);
  }
  if (carry > 0) arr.push(carry);
  return __buildList(arr);
}`
  },

  // 3. Delete all occurrences of a key in a doubly linked list
  {
    title: 'Delete all occurrences of a key in a doubly linked list',
    slug: 'delete-all-occurrences-of-a-key-in-dll',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[2, 2, 10, 8, 4, 2, 5, 2], 2',
    sample_output: '[10, 8, 4, 5]',
    description: `You are given the \`head\` of a doubly Linked List and a \`key\`. Your task is to delete all occurrences of the given key and return the new doubly Linked List.

\`\`\`
Example 1 Diagram:
Initial: 2 <-> 2 <-> 10 <-> 8 <-> 4 <-> 2 <-> 5 <-> 2
Key    : 2
Output : 10 <-> 8 <-> 4 <-> 5
\`\`\`

### **Example 1:**
Input: head = [2, 2, 10, 8, 4, 2, 5, 2], key = 2
Output: [10, 8, 4, 5]
Explanation: All occurrences of 2 have been deleted.

### **Example 2:**
Input: head = [9, 1, 3, 4, 5, 1, 8, 4], key = 9
Output: [1, 3, 4, 5, 1, 8, 4]

### **Example 3:**
Input: head = [5, 5, 5], key = 5
Output: []

### **Constraints:**
- \`1 <= N <= 10⁵\`
- \`-10⁵ <= Node.val, key <= 10⁵\``,
    hints: [
      'Traverse the doubly linked list node by node.',
      'If `curr.val === key`: update `curr.prev.next = curr.next` (if prev exists) and `curr.next.prev = curr.prev` (if next exists).',
      'If `curr` is the head, update `head = curr.next`.'
    ],
    testCases: generateDeleteAllOccurTCs(),
    optimalCode: `function solution(head, key) {
  let curr = head;
  while (curr) {
    if (curr.val === key) {
      if (curr === head) {
        head = head.next;
        if (head) head.prev = null;
      } else {
        const nextNode = curr.next;
        const prevNode = curr.prev;
        if (prevNode) prevNode.next = nextNode;
        if (nextNode) nextNode.prev = prevNode;
      }
    }
    curr = curr.next;
  }
  return head;
}`,
    naiveCode: `function solution(head, key) {
  if (!head) return null;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  const arr = [];
  for (let i = 0; i < n; i++) {
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    if (cur.val !== key) arr.push(cur.val);
  }
  return __buildList(arr);
}`
  },

  // 4. Find pairs with given sum in doubly linked list
  {
    title: 'Find pairs with given sum in doubly linked list',
    slug: 'find-pairs-with-given-sum-in-doubly-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[1, 2, 4, 5, 6, 8, 9], 7',
    sample_output: '[[1, 6], [2, 5]]',
    description: `Given a sorted doubly linked list of positive distinct elements, find all pairs in the doubly linked list whose sum is equal to a given value \`target\`.

Return the pairs sorted by their first element in ascending order.

\`\`\`
Example 1 Diagram:
List  : 1 <-> 2 <-> 4 <-> 5 <-> 6 <-> 8 <-> 9
Target: 7
Pairs : (1, 6) and (2, 5)
\`\`\`

### **Example 1:**
Input: head = [1, 2, 4, 5, 6, 8, 9], target = 7
Output: [[1, 6], [2, 5]]
Explanation: The two pairs are (1, 6) and (2, 5) which sum to 7.

### **Example 2:**
Input: head = [1, 5, 6], target = 6
Output: [[1, 5]]

### **Example 3:**
Input: head = [1, 2, 3], target = 10
Output: []

### **Constraints:**
- \`1 <= N <= 10⁵\`
- \`1 <= Node.val <= 10⁵\`
- \`1 <= target <= 2 * 10⁵\``,
    hints: [
      'Since the doubly linked list is already sorted, use two pointers: `left` starting at `head` and `right` starting at the `tail`.',
      'Compute `sum = left.val + right.val`. If `sum === target`, record `[left.val, right.val]`, move `left = left.next` and `right = right.prev`.',
      'If `sum < target`, advance `left = left.next`. If `sum > target`, move `right = right.prev`. Stop when `left.val >= right.val`.'
    ],
    testCases: generateFindPairsTCs(),
    optimalCode: `function solution(head, target) {
  if (!head || !head.next) return [];
  let left = head;
  let right = head;
  while (right.next) right = right.next;
  const res = [];
  while (left && right && left !== right && left.prev !== right) {
    const sum = left.val + right.val;
    if (sum === target) {
      res.push([left.val, right.val]);
      left = left.next;
      right = right.prev;
    } else if (sum < target) {
      left = left.next;
    } else {
      right = right.prev;
    }
  }
  return res;
}`,
    naiveCode: `function solution(head, target) {
  const res = [];
  let p1 = head;
  while (p1) {
    let p2 = p1.next;
    while (p2) {
      if (p1.val + p2.val === target) {
        res.push([p1.val, p2.val]);
      }
      p2 = p2.next;
    }
    p1 = p1.next;
  }
  return res;
}`
  },

  // 5. Remove duplicates from a sorted doubly linked list
  {
    title: 'Remove duplicates from a sorted doubly linked list',
    slug: 'remove-duplicates-from-a-sorted-doubly-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[1, 1, 1, 2, 3, 4]',
    sample_output: '[1, 2, 3, 4]',
    description: `Given a doubly linked list of \`N\` nodes sorted by values, remove all duplicate nodes present in the linked list in-place and return the head.

\`\`\`
Example 1 Diagram:
Initial: 1 <-> 1 <-> 1 <-> 2 <-> 3 <-> 4
Output : 1 <-> 2 <-> 3 <-> 4
\`\`\`

### **Example 1:**
Input: head = [1, 1, 1, 2, 3, 4]
Output: [1, 2, 3, 4]
Explanation: Only the first occurrence of node with value 1 is retained.

### **Example 2:**
Input: head = [1, 2, 2, 3, 3, 4, 4]
Output: [1, 2, 3, 4]

### **Example 3:**
Input: head = [1]
Output: [1]

### **Constraints:**
- \`0 <= N <= 10⁵\`
- \`-10⁵ <= Node.val <= 10⁵\``,
    hints: [
      'Iterate through the list using pointer `curr`.',
      'While `curr.next` exists and has the same value (`curr.val === curr.next.val`), skip the duplicate node: `curr.next = curr.next.next` and update `curr.next.prev = curr`.',
      'When values differ, simply advance `curr = curr.next`.'
    ],
    testCases: generateRemoveDuplicatesDLLTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return head;
  let curr = head;
  while (curr && curr.next) {
    if (curr.val === curr.next.val) {
      const nextNext = curr.next.next;
      curr.next = nextNext;
      if (nextNext) nextNext.prev = curr;
    } else {
      curr = curr.next;
    }
  }
  return head;
}`,
    naiveCode: `function solution(head) {
  if (!head) return null;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  const arr = [];
  for (let i = 0; i < n; i++) {
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    if (arr.length === 0 || arr[arr.length - 1] !== cur.val) {
      arr.push(cur.val);
    }
  }
  return __buildList(arr);
}`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Execution & Strict TLE Validation Harness
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== SEEDING STRIVER LINKEDLIST (BATCH 5 - 5 PROBLEMS) ===\n');

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
