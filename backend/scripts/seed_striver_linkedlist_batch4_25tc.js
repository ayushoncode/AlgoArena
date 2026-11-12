/**
 * backend/scripts/seed_striver_linkedlist_batch4_25tc.js
 * 
 * Seeds and validates Step 6: Learn LinkedList (Batch 4 - Medium Problems):
 * 1. Odd Even Linked List (odd-even-linked-list) [LeetCode 328]
 * 2. Remove Nth Node From End of List (remove-nth-node-from-end-of-list) [LeetCode 19]
 * 3. Delete the Middle Node of a Linked List (delete-the-middle-node-of-a-linked-list) [LeetCode 2095]
 * 4. Sort List (sort-list) [LeetCode 148]
 * 5. Sort a linked list of 0s, 1s and 2s (sort-a-linked-list-of-0s-1s-or-2s) [GFG / Striver]
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
// 1. Odd Even Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateOddEvenLLTCs() {
  function solveOddEven(arr) {
    if (!arr || arr.length <= 1) return arr;
    const odds = [];
    const evens = [];
    for (let i = 0; i < arr.length; i++) {
      if (i % 2 === 0) odds.push(arr[i]); // 1st, 3rd, 5th... (0-indexed even is 1-indexed odd)
      else evens.push(arr[i]);
    }
    return odds.concat(evens);
  }

  const edgeInputs = [
    // 1-3 Public Examples
    [1, 2, 3, 4, 5],
    [2, 1, 3, 5, 6, 4, 7],
    [],
    // 4-20 Edge Cases
    [1],
    [1, 2],
    [1, 2, 3],
    [1, 2, 3, 4],
    [0],
    [-1, -2, -3, -4, -5],
    [10, 20],
    [5, 5, 5, 5, 5],
    [7],
    [1, 10, 2, 20, 3, 30],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    [0, 1, 0, 1, 0],
    [100, -100, 200, -200],
    [42, 99],
    [1, 2, 3, 4, 5, 6, 7, 8],
    [1, 3, 5, 7, 9],
    [2, 4, 6, 8, 10],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = solveOddEven(arr);
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
      arr[j] = (j * 13) % 1000 - 500;
    }
    const expected = solveOddEven(arr);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Remove Nth Node From End of List
// ─────────────────────────────────────────────────────────────────────────────
function generateRemoveNthTCs() {
  function solveRemoveNth(arr, n) {
    if (!arr || arr.length === 0) return [];
    const targetIdx = arr.length - n;
    const res = [];
    for (let i = 0; i < arr.length; i++) {
      if (i !== targetIdx) res.push(arr[i]);
    }
    return res;
  }

  const edgeCases = [
    // 1-3 Public Examples
    { arr: [1, 2, 3, 4, 5], n: 2 },
    { arr: [1], n: 1 },
    { arr: [1, 2], n: 1 },
    // 4-20 Edge Cases
    { arr: [1, 2], n: 2 }, // remove head
    { arr: [1, 2, 3], n: 3 }, // remove head
    { arr: [1, 2, 3], n: 2 }, // remove middle
    { arr: [1, 2, 3], n: 1 }, // remove tail
    { arr: [10, 20, 30, 40, 50], n: 5 }, // remove head
    { arr: [1, 2, 3, 4], n: 2 },
    { arr: [-5, -4, -3, -2, -1], n: 4 },
    { arr: [7, 7, 7, 7], n: 1 },
    { arr: [1, 2, 3, 4, 5, 6], n: 3 },
    { arr: [1, 2, 3, 4, 5, 6, 7], n: 1 },
    { arr: [1, 2, 3, 4, 5, 6, 7], n: 7 },
    { arr: [99, 100], n: 2 },
    { arr: [1, 3, 5, 7, 9, 11, 13, 15], n: 4 },
    { arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], n: 5 },
    { arr: [0, 0, 0], n: 2 },
    { arr: [1, -1, 2, -2], n: 3 },
    { arr: [4, 3, 2, 1], n: 1 },
  ];

  const tcs = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const c = edgeCases[i];
    const expected = solveRemoveNth(c.arr, c.n);
    tcs.push({
      input: `${JSON.stringify(c.arr)}, ${c.n}`,
      output: JSON.stringify(expected),
      is_hidden: i >= 3,
    });
  }

  // 21-25 Stress Scale Tests (N = 30,000 to 68,000)
  const stressSizes = [
    { size: 30000, n: 1 },
    { size: 38000, n: 38000 }, // remove head
    { size: 48000, n: 24000 }, // remove middle
    { size: 58000, n: 5000 },
    { size: 68000, n: 68000 }, // remove head
  ];

  for (let s = 0; s < stressSizes.length; s++) {
    const conf = stressSizes[s];
    const arr = new Array(conf.size);
    for (let j = 0; j < conf.size; j++) arr[j] = j % 1000;
    const expected = solveRemoveNth(arr, conf.n);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${conf.n}`,
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Delete the Middle Node of a Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateDeleteMidLLTCs() {
  function solveDeleteMid(arr) {
    if (!arr || arr.length <= 1) return [];
    const midIdx = Math.floor(arr.length / 2);
    const res = [];
    for (let i = 0; i < arr.length; i++) {
      if (i !== midIdx) res.push(arr[i]);
    }
    return res;
  }

  const edgeInputs = [
    // 1-3 Public Examples
    [1, 3, 4, 7, 1, 2, 6],
    [1, 2, 3, 4],
    [2, 1],
    // 4-20 Edge Cases
    [1],
    [1, 2, 3],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5, 6],
    [-1, -2, -3],
    [0, 0, 0, 0],
    [5, 10, 15, 20, 25, 30, 35],
    [100, 200],
    [42],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    [1, 1, 1, 1, 1, 1],
    [10, 20, 30, 40],
    [7, 14, 21],
    [1, 2, 3, 4, 5, 6, 7, 8],
    [5, 4, 3, 2, 1],
    [3, 1, 4, 1, 5, 9],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = solveDeleteMid(arr);
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
    for (let j = 0; j < size; j++) arr[j] = (j * 17) % 1000 - 500;
    const expected = solveDeleteMid(arr);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Sort List
// ─────────────────────────────────────────────────────────────────────────────
function generateSortListTCs() {
  const edgeInputs = [
    // 1-3 Public Examples
    [4, 2, 1, 3],
    [-1, 5, 3, 4, 0],
    [],
    // 4-20 Edge Cases
    [1],
    [2, 1],
    [1, 2],
    [3, 2, 1],
    [1, 3, 2],
    [0, 0, 0],
    [-5, -1, -10, 0, 5],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [1, 1, 2, 2, 3, 3],
    [5, 5, 5, 5],
    [100, -100, 50, -50],
    [1, 2, 3, 4, 5],
    [9, 1, 8, 2, 7, 3, 6, 4, 5],
    [42, 13, 7],
    [20, 10],
    [0, -1],
    [-10, -20, -30],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = [...arr].sort((a, b) => a - b);
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
      // reverse / pseudo-random descending pattern (worst case for bubble sort)
      arr[j] = size - j;
    }
    const expected = [...arr].sort((a, b) => a - b);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(expected),
      is_hidden: true,
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sort a linked list of 0s, 1s and 2s
// ─────────────────────────────────────────────────────────────────────────────
function generateSort012LLTCs() {
  const edgeInputs = [
    // 1-3 Public Examples
    [1, 2, 2, 1, 2, 0, 2, 2],
    [2, 2, 0, 1],
    [0],
    // 4-20 Edge Cases
    [],
    [1],
    [2],
    [0, 1, 2],
    [2, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
    [2, 2, 2],
    [1, 0],
    [2, 0],
    [2, 1],
    [0, 2, 1, 0, 2, 1],
    [1, 2, 0, 1, 2, 0],
    [2, 2, 1, 1, 0, 0],
    [0, 0, 1, 1, 2, 2],
    [1, 0, 2, 1, 0, 2],
    [2, 0, 1, 2, 0, 1, 2, 0, 1],
  ];

  const tcs = [];
  for (let i = 0; i < edgeInputs.length; i++) {
    const arr = edgeInputs[i];
    const expected = [...arr].sort((a, b) => a - b);
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
      // reverse pattern: 2, 2, ... 1, 1, ... 0, 0
      arr[j] = (j * 7) % 3;
    }
    const expected = [...arr].sort((a, b) => a - b);
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
  // 1. Odd Even Linked List
  {
    title: 'Odd Even Linked List',
    slug: 'odd-even-linked-list',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '[1, 3, 5, 2, 4]',
    description: `Given the \`head\` of a singly linked list, group all the nodes with odd indices together followed by the nodes with even indices, and return *the reordered list*.

The **first** node is considered **odd**, and the **second** node is **even**, and so on.

Note that the relative order inside both the even and odd groups should remain as it was in the input.

You must solve the problem in \`O(1)\` extra space complexity and \`O(n)\` time complexity.

### **Example 1:**
![Odd Even Linked List Example 1](https://assets.leetcode.com/uploads/2021/03/10/oddeven-linked-list.jpg)
Input: head = [1,2,3,4,5]
Output: [1,3,5,2,4]

### **Example 2:**
![Odd Even Linked List Example 2](https://assets.leetcode.com/uploads/2021/03/10/oddeven2-linked-list.jpg)
Input: head = [2,1,3,5,6,4,7]
Output: [2,3,6,7,1,5,4]

### **Example 3:**
Input: head = []
Output: []

### **Constraints:**
- The number of nodes in the linked list is in the range \`[0, 10⁴]\`.
- \`-10⁶ <= Node.val <= 10⁶\``,
    hints: [
      'Maintain two pointers, `odd` and `even`, starting at the 1st and 2nd nodes respectively.',
      'Also keep track of `evenHead` so you can connect the tail of the odd list to the head of the even list at the end.',
      'In each iteration, link `odd.next = even.next`, advance `odd`, link `even.next = odd.next`, and advance `even`.'
    ],
    testCases: generateOddEvenLLTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return head;
  let odd = head;
  let even = head.next;
  let evenHead = even;
  while (even && even.next) {
    odd.next = even.next;
    odd = odd.next;
    even.next = odd.next;
    even = even.next;
  }
  odd.next = evenHead;
  return head;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return head;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  const arr = [];
  for (let i = 0; i < n; i += 2) {
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    arr.push(cur.val);
  }
  for (let i = 1; i < n; i += 2) {
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    arr.push(cur.val);
  }
  return __buildList(arr);
}`
  },

  // 2. Remove Nth Node From End of List
  {
    title: 'Remove Nth Node From End of List',
    slug: 'remove-nth-node-from-end-of-list',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[1, 2, 3, 4, 5], 2',
    sample_output: '[1, 2, 3, 5]',
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
- \`1 <= sz <= 30\`.
- \`0 <= Node.val <= 100\`
- \`1 <= n <= sz\`

**Follow up:** Could you do this in one pass?`,
    hints: [
      'Use a two-pointer technique with a `fast` and a `slow` pointer.',
      'Advance the `fast` pointer `n + 1` steps ahead from a dummy node before starting the `slow` pointer.',
      'When `fast` reaches `null`, `slow.next` is precisely the node to be removed. Simply link `slow.next = slow.next.next`.'
    ],
    testCases: generateRemoveNthTCs(),
    optimalCode: `function solution(head, n) {
  const dummy = new ListNode(0);
  dummy.next = head;
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i <= n; i++) {
    fast = fast.next;
  }
  while (fast) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}`,
    naiveCode: `function solution(head, n) {
  if (!head) return null;
  let len = 0, c = head;
  while (c) { len++; c = c.next; }
  const targetIdx = len - n;
  const arr = [];
  for (let i = 0; i < len; i++) {
    if (i === targetIdx) continue;
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    arr.push(cur.val);
  }
  return __buildList(arr);
}`
  },

  // 3. Delete the Middle Node of a Linked List
  {
    title: 'Delete the Middle Node of a Linked List',
    slug: 'delete-the-middle-node-of-a-linked-list',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[1, 3, 4, 7, 1, 2, 6]',
    sample_output: '[1, 3, 4, 1, 2, 6]',
    description: `You are given the \`head\` of a linked list. **Delete** the **middle node**, and return the \`head\` of the modified linked list.

The **middle node** of a linked list of size \`n\` is the \`⌊n / 2⌋\`th node from the **start** using **0-based indexing**, where \`⌊x⌋\` denotes the largest integer less than or equal to \`x\`.

- For \`n\` = 1, 2, 3, 4, and 5, the 0-based indices of the middle nodes are 0, 1, 1, 2, and 2, respectively.

### **Example 1:**
![Delete Middle Node Example 1](https://assets.leetcode.com/uploads/2021/11/16/eg1drawio.png)
Input: head = [1,3,4,7,1,2,6]
Output: [1,3,4,1,2,6]
Explanation: The middle node is node with value 7 at index 3 (0-indexed). Deleting it leaves [1,3,4,1,2,6].

### **Example 2:**
![Delete Middle Node Example 2](https://assets.leetcode.com/uploads/2021/11/16/eg2drawio.png)
Input: head = [1,2,3,4]
Output: [1,2,4]
Explanation: For n = 4, the middle node is at index 2 (value 3). Deleting it leaves [1,2,4].

### **Example 3:**
![Delete Middle Node Example 3](https://assets.leetcode.com/uploads/2021/11/16/eg3drawio.png)
Input: head = [2,1]
Output: [2]
Explanation: For n = 2, the middle node is at index 1 (value 1). Deleting it leaves [2].

### **Constraints:**
- The number of nodes in the list is in the range \`[1, 10⁵]\`.
- \`1 <= Node.val <= 10⁵\``,
    hints: [
      'If the list has only 1 node (`!head.next`), deleting the middle leaves an empty list; return `null`.',
      'Use Floyd’s slow and fast pointers. While `fast` moves 2 steps, `slow` moves 1 step.',
      'Maintain a `prev` pointer right behind `slow`. When `fast` reaches the end, `prev.next = slow.next` removes the middle node.'
    ],
    testCases: generateDeleteMidLLTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return null;
  let slow = head;
  let fast = head;
  let prev = null;
  while (fast && fast.next) {
    prev = slow;
    slow = slow.next;
    fast = fast.next.next;
  }
  prev.next = slow.next;
  return head;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return null;
  let len = 0, c = head;
  while (c) { len++; c = c.next; }
  const midIdx = Math.floor(len / 2);
  const arr = [];
  for (let i = 0; i < len; i++) {
    if (i === midIdx) continue;
    let cur = head;
    for (let j = 0; j < i; j++) cur = cur.next;
    arr.push(cur.val);
  }
  return __buildList(arr);
}`
  },

  // 4. Sort List
  {
    title: 'Sort List',
    slug: 'sort-list',
    topic: 'linked-list',
    difficulty: 'medium',
    sample_input: '[4, 2, 1, 3]',
    sample_output: '[1, 2, 3, 4]',
    description: `Given the \`head\` of a linked list, return *the list after sorting it in **ascending order***.

### **Example 1:**
![Sort List Example 1](https://assets.leetcode.com/uploads/2020/09/14/sort_list_1.jpg)
Input: head = [4,2,1,3]
Output: [1,2,3,4]

### **Example 2:**
![Sort List Example 2](https://assets.leetcode.com/uploads/2020/09/14/sort_list_2.jpg)
Input: head = [-1,5,3,4,0]
Output: [-1,0,3,4,5]

### **Example 3:**
Input: head = []
Output: []

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 5 * 10⁴]\`.
- \`-10⁵ <= Node.val <= 10⁵\`

**Follow up:** Can you sort the linked list in \`O(n logn)\` time and \`O(1)\` memory (i.e. constant space)?`,
    hints: [
      'Merge Sort is ideal for singly linked lists because it can merge two lists in `O(1)` auxiliary space without shifting elements.',
      'Split the list into two halves using slow and fast pointers: find the middle, break the link (`prev.next = null`).',
      'Recursively sort each half and merge the two sorted sublists with a standard two-pointer merge.'
    ],
    testCases: generateSortListTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return head;
  let prev = null, slow = head, fast = head;
  while (fast && fast.next) {
    prev = slow;
    slow = slow.next;
    fast = fast.next.next;
  }
  prev.next = null;
  const l1 = solution(head);
  const l2 = solution(slow);
  return merge(l1, l2);
}
function merge(l1, l2) {
  const dummy = new ListNode(0);
  let cur = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) {
      cur.next = l1;
      l1 = l1.next;
    } else {
      cur.next = l2;
      l2 = l2.next;
    }
    cur = cur.next;
  }
  cur.next = l1 || l2;
  return dummy.next;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return head;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  for (let i = 0; i < n; i++) {
    let cur = head;
    while (cur && cur.next) {
      if (cur.val > cur.next.val) {
        const t = cur.val;
        cur.val = cur.next.val;
        cur.next.val = t;
      }
      cur = cur.next;
    }
  }
  return head;
}`
  },

  // 5. Sort a linked list of 0s, 1s and 2s
  {
    title: 'Sort a linked list of 0s, 1s and 2s',
    slug: 'sort-a-linked-list-of-0s-1s-or-2s',
    topic: 'linked-list',
    difficulty: 'easy',
    sample_input: '[1, 2, 2, 1, 2, 0, 2, 2]',
    sample_output: '[0, 1, 1, 2, 2, 2, 2, 2]',
    description: `Given the \`head\` of a linked list of \`N\` nodes where each node contains only \`0\`, \`1\`, or \`2\`, sort the linked list in **ascending order** and return the head.

Try to solve it in \`O(N)\` time complexity and \`O(1)\` auxiliary space by rearranging links.

\`\`\`
Example 1 Diagram:
Initial: 1 -> 2 -> 2 -> 1 -> 2 -> 0 -> 2 -> 2
Sorted:  0 -> 1 -> 1 -> 2 -> 2 -> 2 -> 2 -> 2
\`\`\`

### **Example 1:**
Input: head = [1,2,2,1,2,0,2,2]
Output: [0,1,1,2,2,2,2,2]
Explanation: The sorted list has 0s first, followed by 1s, and then 2s.

### **Example 2:**
Input: head = [2,2,0,1]
Output: [0,1,2,2]

### **Example 3:**
Input: head = [0]
Output: [0]

### **Constraints:**
- \`1 <= N <= 10⁵\`
- \`0 <= Node.val <= 2\``,
    hints: [
      'Create three dummy heads: `zeroHead`, `oneHead`, and `twoHead`.',
      'Traverse the linked list and append each node to its corresponding bucket list depending on its value (0, 1, or 2).',
      'Connect `zeroTail.next = oneHead.next || twoHead.next`, `oneTail.next = twoHead.next`, and `twoTail.next = null`.'
    ],
    testCases: generateSort012LLTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return head;
  const zeroDummy = new ListNode(0);
  const oneDummy = new ListNode(0);
  const twoDummy = new ListNode(0);
  let zero = zeroDummy, one = oneDummy, two = twoDummy;
  let curr = head;
  while (curr) {
    if (curr.val === 0) { zero.next = curr; zero = zero.next; }
    else if (curr.val === 1) { one.next = curr; one = one.next; }
    else { two.next = curr; two = two.next; }
    curr = curr.next;
  }
  two.next = null;
  one.next = twoDummy.next;
  zero.next = oneDummy.next || twoDummy.next;
  return zeroDummy.next;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return head;
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  for (let i = 0; i < n; i++) {
    let cur = head;
    while (cur && cur.next) {
      if (cur.val > cur.next.val) {
        const t = cur.val;
        cur.val = cur.next.val;
        cur.next.val = t;
      }
      cur = cur.next;
    }
  }
  return head;
}`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Execution & Strict TLE Validation Harness
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== SEEDING STRIVER LEARN LINKEDLIST (BATCH 4 - 5 PROBLEMS) ===\n');

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
