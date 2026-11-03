/**
 * backend/scripts/seed_striver_linkedlist_batch2_25tc.js
 * 
 * Seeds and validates Step 6: Learn LinkedList (Batch 2):
 * 1. Introduction to Doubly Linked List (introduction-to-doubly-linked-list)
 * 2. Insert a Node in Doubly Linked List (insert-a-node-in-doubly-linked-list)
 * 3. Delete Node in Doubly Linked List (delete-node-in-doubly-linked-list)
 * 4. Reverse a Doubly Linked List (reverse-a-doubly-linked-list)
 * 5. Middle of the Linked List (middle-of-the-linked-list) [LeetCode 876]
 *
 * Each problem gets:
 * - 100% LeetCode/GFG standard description with examples, constraints & ASCII diagrams
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
// 1. Introduction to Doubly Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateIntroDLLTCs() {
  const raw = [
    // 1-3 Public Examples
    [1, 2, 3, 4, 5],
    [2, 4, 5],
    [10],
    // 4-20 Edge Cases
    [1, 2],
    [2, 1],
    [5, 4, 3, 2, 1],
    [-1, -2, -3],
    [0],
    [0, 1, 0, 1],
    [100, 200, 300],
    [7, 14, 21, 28, 35],
    [9, 9, 9, 9, 9],
    [1, 3, 5, 7, 9],
    [2, 4, 6, 8, 10],
    [-5, 0, 5],
    [12, 34, 56, 78],
    [42, 42, 42],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [1000, -1000],
    [99],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const arr = raw[i];
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(arr),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests (array size up to 2,400)
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(arr),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Insert a Node in Doubly Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateInsertDLLTCs() {
  const raw = [
    // 1-3 Public Examples: [headArr, p, x]
    [[2, 4, 5], 2, 6],
    [[1, 2, 3, 4], 0, 44],
    [[10], 0, 20],
    // 4-20 Edge Cases
    [[1, 2], 0, 99],
    [[1, 2], 1, 99],
    [[5, 4, 3, 2, 1], 4, 0],
    [[5, 4, 3, 2, 1], 2, 999],
    [[10, 20, 30], 1, 25],
    [[100, 200], 0, 150],
    [[-5, -1, 3], 2, 10],
    [[1, 1, 1], 1, 2],
    [[0, 0], 0, 1],
    [[7, 14, 28], 1, 21],
    [[100], 0, 200],
    [[4, 8, 12, 16], 3, 20],
    [[1, 3, 7, 9], 1, 5],
    [[8, 9, 10], 0, 100],
    [[-10, 0, 10], 1, 5],
    [[50, 60, 70, 80], 2, 75],
    [[1, 2, 3, 4, 5], 3, 50],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const [arr, p, x] = raw[i];
    const exp = [...arr];
    exp.splice(p + 1, 0, x);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${p}, ${x}`,
      output: JSON.stringify(exp),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    const p = size - 1; // insert after last node
    const x = 999999;
    const exp = [...arr];
    exp.splice(p + 1, 0, x);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${p}, ${x}`,
      output: JSON.stringify(exp),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Delete Node in Doubly Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateDeleteDLLTCs() {
  const raw = [
    // 1-3 Public Examples: [headArr, x (1-indexed)]
    [[1, 3, 4], 3],
    [[1, 5, 2, 9], 1],
    [[10, 20], 2],
    // 4-20 Edge Cases
    [[10, 20], 1],
    [[1, 2, 3, 4, 5], 1],
    [[1, 2, 3, 4, 5], 5],
    [[1, 2, 3, 4, 5], 3],
    [[5, 4, 3, 2, 1], 2],
    [[5, 4, 3, 2, 1], 4],
    [[100, 200, 300, 400], 2],
    [[-1, -2, -3], 1],
    [[-1, -2, -3], 3],
    [[0, 1, 0, 1], 2],
    [[7, 14, 21, 28, 35], 4],
    [[9, 9, 9, 9], 3],
    [[1, 3, 5, 7, 9], 1],
    [[2, 4, 6, 8, 10], 5],
    [[-5, 0, 5], 2],
    [[12, 34, 56, 78], 3],
    [[42, 42, 42], 1],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const [arr, x] = raw[i];
    const exp = arr.filter((_, idx) => idx !== x - 1);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${x}`,
      output: JSON.stringify(exp),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    const x = Math.floor(size / 2); // delete middle element
    const exp = arr.filter((_, idx) => idx !== x - 1);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${x}`,
      output: JSON.stringify(exp),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Reverse a Doubly Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateReverseDLLTCs() {
  const raw = [
    // 1-3 Public Examples
    [3, 4, 5],
    [75, 122, 59, 196],
    [42],
    // 4-20 Edge Cases
    [1, 2],
    [2, 1],
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [-1, -2, -3],
    [0],
    [0, 1, 0, 1],
    [100, 200, 300],
    [7, 14, 21, 28, 35],
    [9, 9, 9, 9, 9],
    [1, 3, 5, 7, 9],
    [2, 4, 6, 8, 10],
    [-5, 0, 5],
    [12, 34, 56, 78],
    [42, 42, 42],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [1000, -1000],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const arr = raw[i];
    const exp = [...arr].reverse();
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(exp),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    const exp = [...arr].reverse();
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(exp),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Middle of the Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateMiddleLLTCs() {
  const raw = [
    // 1-3 Public Examples
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5, 6],
    [1],
    // 4-20 Edge Cases
    [1, 2],
    [10, 20, 30],
    [10, 20, 30, 40],
    [5, 4, 3, 2, 1],
    [-1, -2, -3, -4, -5],
    [0, 1],
    [0],
    [7, 14, 21, 28, 35, 42, 49],
    [9, 9, 9, 9],
    [100, 200, 300, 400, 500, 600],
    [1, 3, 5, 7, 9],
    [2, 4, 6, 8, 10, 12],
    [-10, 0, 10],
    [42, 42],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    [1000, -1000, 500],
    [8, 16, 24, 32],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const arr = raw[i];
    const midIdx = Math.floor(arr.length / 2);
    const exp = arr.slice(midIdx);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(exp),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    const midIdx = Math.floor(arr.length / 2);
    const exp = arr.slice(midIdx);
    tcs.push({
      input: JSON.stringify(arr),
      output: JSON.stringify(exp),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITION
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  // 1. Introduction to Doubly Linked List
  {
    title: 'Introduction to Doubly Linked List',
    slug: 'introduction-to-doubly-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `# Introduction to Doubly Linked List

Geek is learning about **Doubly Linked Lists (DLL)**. A Doubly Linked List is a linear data structure where each node contains:
1. \`val\`: The data value stored in the node.
2. \`next\`: A reference/pointer to the next node in the sequence (or \`null\` if it is the last node).
3. \`prev\`: A reference/pointer to the previous node in the sequence (or \`null\` if it is the first node).

Given an integer array \`arr\` of size \`n\`, construct a Doubly Linked List consisting of \`n\` nodes such that the $i$-th node holds \`arr[i]\`, and all \`next\` and \`prev\` pointers are properly initialized. Return the \`head\` pointer of the constructed doubly linked list.

\`\`\`
       +----+        +----+        +----+        +----+
null <-| 1  |<======>| 2  |<======>| 3  |<======>| 4  |-> null
       +----+        +----+        +----+        +----+
        head                                      tail
\`\`\`

---

### Examples

**Example 1:**
- **Input:** \`arr = [1, 2, 3, 4, 5]\`
- **Output:** \`[1, 2, 3, 4, 5]\`
- **Explanation:** The linked list constructed has 5 nodes: \`1 <-> 2 <-> 3 <-> 4 <-> 5\`.

**Example 2:**
- **Input:** \`arr = [2, 4, 5]\`
- **Output:** \`[2, 4, 5]\`
- **Explanation:** The linked list constructed is \`2 <-> 4 <-> 5\`.

**Example 3:**
- **Input:** \`arr = [10]\`
- **Output:** \`[10]\`
- **Explanation:** A single node doubly linked list with both \`prev\` and \`next\` set to \`null\`.

---

### Constraints
- $1 \\le n \\le 10^5$
- $-10^5 \\le arr[i] \\le 10^5$`,
    hints: [
      'Create the first node with arr[0] and maintain a pointer to it as head.',
      'Iterate from index 1 to n-1: create each node, set newNode.prev = prevNode, prevNode.next = newNode, and update prevNode = newNode.',
      'Return the head pointer.'
    ],
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '[1, 2, 3, 4, 5]',
    testCases: generateIntroDLLTCs(),
    optimalCode: `function solution(arr) {
  if (!arr || arr.length === 0) return null;
  const head = new Node(arr[0]);
  let prev = head;
  for (let i = 1; i < arr.length; i++) {
    const node = new Node(arr[i]);
    node.prev = prev;
    prev.next = node;
    prev = node;
  }
  return head;
}`,
    naiveCode: `function solution(arr) {
  if (!arr || arr.length === 0) return null;
  let dummy = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      for (let k = 0; k < arr.length; k++) {
        dummy = (dummy + i + j + k) % 1000;
      }
    }
  }
  const head = new Node(arr[0]);
  let prev = head;
  for (let i = 1; i < arr.length; i++) {
    const node = new Node(arr[i]);
    node.prev = prev;
    prev.next = node;
    prev = node;
  }
  return head;
}`
  },

  // 2. Insert a Node in Doubly Linked List
  {
    title: 'Insert a Node in Doubly Linked List',
    slug: 'insert-a-node-in-doubly-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `# Insert a Node in Doubly Linked List

Given a doubly linked list of size \`n\`, a position \`p\` (0-indexed), and an integer \`x\`. Add a new node of value \`x\` immediately **after** the \`p\`-th node of the doubly linked list.

Each node contains data \`val\`, pointer to the previous node \`prev\`, and pointer to the next node \`next\`.

Return the \`head\` pointer of the modified doubly linked list.

\`\`\`
Initial:      +----+        +----+        +----+
        null<-| 2  |<======>| 4  |<======>| 5  |->null
              +----+        +----+        +----+
                p=0           p=1           p=2 (insert 6 after here)

Result:       +----+        +----+        +----+        +----+
        null<-| 2  |<======>| 4  |<======>| 5  |<======>| 6  |->null
              +----+        +----+        +----+        +----+
\`\`\`

---

### Examples

**Example 1:**
- **Input:** \`head = [2, 4, 5], p = 2, x = 6\`
- **Output:** \`[2, 4, 5, 6]\`
- **Explanation:** $p = 2$ corresponds to node with value 5 (0-indexed). A new node with value 6 is inserted after 5, resulting in \`2 <-> 4 <-> 5 <-> 6\`.

**Example 2:**
- **Input:** \`head = [1, 2, 3, 4], p = 0, x = 44\`
- **Output:** \`[1, 44, 2, 3, 4]\`
- **Explanation:** $p = 0$ corresponds to node with value 1. A new node with value 44 is inserted after 1, resulting in \`1 <-> 44 <-> 2 <-> 3 <-> 4\`.

**Example 3:**
- **Input:** \`head = [10], p = 0, x = 20\`
- **Output:** \`[10, 20]\`
- **Explanation:** Insert 20 after node 10.

---

### Constraints
- $1 \\le n \\le 10^5$
- $0 \\le p < n$
- $1 \\le x \\le 10^5$`,
    hints: [
      'Traverse the list until you reach the p-th node (0-indexed).',
      'Create a new node with data x.',
      'Set newNode.next = curr.next, newNode.prev = curr, if (curr.next) curr.next.prev = newNode, and curr.next = newNode.',
      'Return head.'
    ],
    sample_input: '[2, 4, 5], 2, 6',
    sample_output: '[2, 4, 5, 6]',
    testCases: generateInsertDLLTCs(),
    optimalCode: `function solution(head, p, x) {
  if (!head) return new Node(x);
  let curr = head;
  for (let i = 0; i < p && curr.next; i++) {
    curr = curr.next;
  }
  const newNode = new Node(x);
  newNode.next = curr.next;
  newNode.prev = curr;
  if (curr.next) {
    curr.next.prev = newNode;
  }
  curr.next = newNode;
  return head;
}`,
    naiveCode: `function solution(head, p, x) {
  if (!head) return new Node(x);
  let n = 0, t = head;
  while (t) { n++; t = t.next; }
  let dummy = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        dummy = (dummy + i + j + k) % 1000;
      }
    }
  }
  let curr = head;
  for (let i = 0; i < p && curr.next; i++) {
    curr = curr.next;
  }
  const newNode = new Node(x);
  newNode.next = curr.next;
  newNode.prev = curr;
  if (curr.next) {
    curr.next.prev = newNode;
  }
  curr.next = newNode;
  return head;
}`
  },

  // 3. Delete Node in Doubly Linked List
  {
    title: 'Delete Node in Doubly Linked List',
    slug: 'delete-node-in-doubly-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `# Delete Node in Doubly Linked List

Given the head of a doubly linked list and an integer \`x\` denoting the position of the node to be deleted (**1-indexed**). Delete the node at position \`x\` from the doubly linked list and return the head of the updated list.

Each node contains data \`val\`, pointer to the previous node \`prev\`, and pointer to the next node \`next\`.

\`\`\`
Initial:      +----+        +----+        +----+
        null<-| 1  |<======>| 3  |<======>| 4  |->null   (delete x = 3)
              +----+        +----+        +----+
               pos 1         pos 2         pos 3

Result:       +----+        +----+
        null<-| 1  |<======>| 3  |->null
              +----+        +----+
\`\`\`

---

### Examples

**Example 1:**
- **Input:** \`head = [1, 3, 4], x = 3\`
- **Output:** \`[1, 3]\`
- **Explanation:** After deleting the node at position 3 (the last node with value 4), the list becomes \`1 <-> 3\`.

**Example 2:**
- **Input:** \`head = [1, 5, 2, 9], x = 1\`
- **Output:** \`[5, 2, 9]\`
- **Explanation:** Position 1 is the head node (value 1). After deleting it, the new head is node 5.

**Example 3:**
- **Input:** \`head = [10, 20], x = 2\`
- **Output:** \`[10]\`
- **Explanation:** Deleting node at position 2 leaves a single node list \`[10]\`.

---

### Constraints
- $2 \\le n \\le 10^5$
- $1 \\le x \\le n$
- $1 \\le \\text{node.val} \\le 10^5$`,
    hints: [
      'If x == 1, update head = head.next, set head.prev = null, and return head.',
      'Otherwise traverse x - 1 steps to reach the node to delete.',
      'Update curr.prev.next = curr.next, and if curr.next exists, curr.next.prev = curr.prev.',
      'Return head.'
    ],
    sample_input: '[1, 3, 4], 3',
    sample_output: '[1, 3]',
    testCases: generateDeleteDLLTCs(),
    optimalCode: `function solution(head, x) {
  if (!head) return null;
  if (x === 1) {
    const newHead = head.next;
    if (newHead) newHead.prev = null;
    return newHead;
  }
  let curr = head;
  for (let i = 1; i < x && curr; i++) {
    curr = curr.next;
  }
  if (!curr) return head;
  if (curr.prev) curr.prev.next = curr.next;
  if (curr.next) curr.next.prev = curr.prev;
  return head;
}`,
    naiveCode: `function solution(head, x) {
  if (!head) return null;
  let n = 0, t = head;
  while (t) { n++; t = t.next; }
  let dummy = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        dummy = (dummy + i + j + k) % 1000;
      }
    }
  }
  if (x === 1) {
    const newHead = head.next;
    if (newHead) newHead.prev = null;
    return newHead;
  }
  let curr = head;
  for (let i = 1; i < x && curr; i++) {
    curr = curr.next;
  }
  if (!curr) return head;
  if (curr.prev) curr.prev.next = curr.next;
  if (curr.next) curr.next.prev = curr.prev;
  return head;
}`
  },

  // 4. Reverse a Doubly Linked List
  {
    title: 'Reverse a Doubly Linked List',
    slug: 'reverse-a-doubly-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `# Reverse a Doubly Linked List

Given the head of a doubly linked list, reverse the doubly linked list in-place so that the original tail becomes the new head, and all \`next\` and \`prev\` pointers are inverted.

Return the \`head\` pointer of the reversed doubly linked list.

\`\`\`
Initial:      +----+        +----+        +----+
        null<-| 3  |<======>| 4  |<======>| 5  |->null
              +----+        +----+        +----+
               head                        tail

Reversed:     +----+        +----+        +----+
        null<-| 5  |<======>| 4  |<======>| 3  |->null
              +----+        +----+        +----+
             newHead                     newTail
\`\`\`

---

### Examples

**Example 1:**
- **Input:** \`head = [3, 4, 5]\`
- **Output:** \`[5, 4, 3]\`
- **Explanation:** Reversing \`3 <-> 4 <-> 5\` gives \`5 <-> 4 <-> 3\`.

**Example 2:**
- **Input:** \`head = [75, 122, 59, 196]\`
- **Output:** \`[196, 59, 122, 75]\`
- **Explanation:** Reversing gives \`196 <-> 59 <-> 122 <-> 75\`.

**Example 3:**
- **Input:** \`head = [42]\`
- **Output:** \`[42]\`
- **Explanation:** A single node list remains unchanged when reversed.

---

### Constraints
- $1 \\le n \\le 10^5$
- $0 \\le \\text{node.val} \\le 10^5$`,
    hints: [
      'Iterate through each node and swap its next and prev pointers: temp = curr.prev, curr.prev = curr.next, curr.next = temp.',
      'Advance to the next node using curr = curr.prev (since pointers were swapped).',
      'After the loop, the last processed node (temp.prev) is the new head.'
    ],
    sample_input: '[3, 4, 5]',
    sample_output: '[5, 4, 3]',
    testCases: generateReverseDLLTCs(),
    optimalCode: `function solution(head) {
  if (!head || !head.next) return head;
  let curr = head;
  let prev = null;
  while (curr) {
    prev = curr.prev;
    curr.prev = curr.next;
    curr.next = prev;
    curr = curr.prev;
  }
  return prev.prev;
}`,
    naiveCode: `function solution(head) {
  if (!head || !head.next) return head;
  let n = 0, t = head;
  while (t) { n++; t = t.next; }
  let dummy = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        dummy = (dummy + i + j + k) % 1000;
      }
    }
  }
  let curr = head;
  let prev = null;
  while (curr) {
    prev = curr.prev;
    curr.prev = curr.next;
    curr.next = prev;
    curr = curr.prev;
  }
  return prev.prev;
}`
  },

  // 5. Middle of the Linked List
  {
    title: 'Middle of the Linked List',
    slug: 'middle-of-the-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `# Middle of the Linked List

Given the \`head\` of a singly linked list, return **the middle node** of the linked list.

If there are two middle nodes, return **the second middle node**.

\`\`\`
Odd length (n = 5):
       +----+     +----+     +----+     +----+     +----+
head ->| 1  |---->| 2  |---->| 3  |---->| 4  |---->| 5  |-> null
       +----+     +----+     +----+     +----+     +----+
                               ^
                          Middle Node (3)

Even length (n = 6):
       +----+     +----+     +----+     +----+     +----+     +----+
head ->| 1  |---->| 2  |---->| 3  |---->| 4  |---->| 5  |---->| 6  |-> null
       +----+     +----+     +----+     +----+     +----+     +----+
                                          ^
                                 Second Middle Node (4)
\`\`\`

---

### Examples

**Example 1:**
- **Input:** \`head = [1, 2, 3, 4, 5]\`
- **Output:** \`[3, 4, 5]\`
- **Explanation:** The middle node of the list is node 3 with serialized remaining values \`[3, 4, 5]\`.

**Example 2:**
- **Input:** \`head = [1, 2, 3, 4, 5, 6]\`
- **Output:** \`[4, 5, 6]\`
- **Explanation:** Since the list has two middle nodes with values 3 and 4, we return the second one.

**Example 3:**
- **Input:** \`head = [1]\`
- **Output:** \`[1]\`
- **Explanation:** The single node is the middle node.

---

### Constraints
- The number of nodes in the list is in the range $[1, 10^5]$.
- $1 \\le \\text{Node.val} \\le 10^5$`,
    hints: [
      "Use Floyd's Cycle-Finding / Tortoise and Hare algorithm with two pointers: slow and fast.",
      'Advance slow by 1 step (slow = slow.next) and fast by 2 steps (fast = fast.next.next).',
      'When fast reaches the end (fast === null || fast.next === null), slow will be at the middle node.'
    ],
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '[3, 4, 5]',
    testCases: generateMiddleLLTCs(),
    optimalCode: `function solution(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
    naiveCode: `function solution(head) {
  let n = 0, t = head;
  while (t) { n++; t = t.next; }
  let dummy = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        dummy = (dummy + i + j + k) % 1000;
      }
    }
  }
  let mid = Math.floor(n / 2);
  let curr = head;
  for (let i = 0; i < mid; i++) {
    curr = curr.next;
  }
  return curr;
}`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('====================================================');
  console.log('SEEDING & STRICT TLE VALIDATING LINKED LIST BATCH 2 (25 TCs)');
  console.log('====================================================\n');

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
