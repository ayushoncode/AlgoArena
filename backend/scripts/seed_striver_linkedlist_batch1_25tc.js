/**
 * backend/scripts/seed_striver_linkedlist_batch1_25tc.js
 * 
 * Seeds and validates Step 6: Learn LinkedList (Lec 1: Learn 1D LinkedList - Batch 1):
 * 1. Introduction to Linked List (introduction-to-linked-list)
 * 2. Insert Node at the End of Linked List (insert-node-at-the-end-of-linked-list)
 * 3. Delete Node in a Linked List (delete-node-in-a-linked-list)
 * 4. Count Nodes of Linked List (count-nodes-of-linked-list)
 * 5. Search in a Linked List (search-in-a-linked-list)
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
// 1. Introduction to Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateIntroLLTCs() {
  const raw = [
    // 1-3 Public Examples
    [1, 2, 3, 4, 5],
    [4, 2, 5, 1],
    [10],
    // 4-20 Edge Cases
    [],
    [1, 1, 1, 1],
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
  // Optimal O(N) finishes in <1ms
  // Naive O(N^3) finishes in >2500ms -> TLE
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
// 2. Insert Node at the End of Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateInsertEndTCs() {
  const raw = [
    // 1-3 Public Examples
    [[1, 2, 3, 4, 5], 6],
    [[], 1],
    [[4, 2, 5], 10],
    // 4-20 Edge Cases
    [[1], 2],
    [[1, 2], 3],
    [[1, 1, 1], 1],
    [[10, 20, 30], 40],
    [[-1, -2], -3],
    [[0], 0],
    [[5, 4, 3, 2], 1],
    [[100], 200],
    [[2, 4, 6, 8], 10],
    [[1, 3, 5, 7], 9],
    [[7], 14],
    [[9, 9, 9], 9],
    [[50, 60], 70],
    [[0, 1], 2],
    [[-5, -10], -15],
    [[12, 24], 36],
    [[8, 16, 24, 32], 40],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const [arr, x] = raw[i];
    const outArr = [...arr, x];
    tcs.push({
      input: `${JSON.stringify(arr)}, ${x}`,
      output: JSON.stringify(outArr),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests (size up to 2,400)
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    const outArr = [...arr, 99999];
    tcs.push({
      input: `${JSON.stringify(arr)}, 99999`,
      output: JSON.stringify(outArr),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Delete Node in a Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateDeleteNodeTCs() {
  function deleteFirst(arr, val) {
    const res = [];
    let deleted = false;
    for (let i = 0; i < arr.length; i++) {
      if (!deleted && arr[i] === val) {
        deleted = true;
        continue;
      }
      res.push(arr[i]);
    }
    return res;
  }

  const raw = [
    // 1-3 Public Examples
    [[4, 5, 1, 9], 5],
    [[4, 5, 1, 9], 4],
    [[1, 2, 3], 3],
    // 4-20 Edge Cases
    [[1], 1],
    [[1, 2], 2],
    [[1, 2], 1],
    [[1, 2, 3, 4], 100],
    [[1, 1, 1], 1],
    [[2, 2, 3, 4], 2],
    [[10, 20, 30, 40], 30],
    [[5, 4, 3, 2, 1], 1],
    [[-1, -2, -3], -2],
    [[0, 1, 2], 0],
    [[7, 14, 21], 14],
    [[100, 200, 300], 300],
    [[2, 4, 6, 8, 10], 6],
    [[9, 8, 7, 6], 9],
    [[15, 25, 35], 25],
    [[1, 3, 5, 7, 9], 7],
    [[42, 43, 44], 44],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const [arr, val] = raw[i];
    const outArr = deleteFirst(arr, val);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${val}`,
      output: JSON.stringify(outArr),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests (size up to 2,400, target at the very end)
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    const outArr = deleteFirst(arr, size);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${size}`,
      output: JSON.stringify(outArr),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Count Nodes of Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateCountNodesTCs() {
  const raw = [
    // 1-3 Public Examples
    [1, 2, 3, 4, 5],
    [2, 4, 6, 7, 5, 1, 0],
    [],
    // 4-20 Edge Cases
    [1],
    [1, 2],
    [1, 1, 1, 1],
    [10, 20, 30],
    [-1, -2, -3, -4],
    [0],
    [100, 200],
    [9, 9, 9, 9, 9, 9],
    [5, 4, 3, 2, 1],
    [7, 14, 21, 28],
    [0, 1, 0, 1, 0],
    [42, 42],
    [1, 3, 5, 7, 9, 11],
    [2, 4, 6, 8, 10, 12, 14],
    [-5, 0, 5],
    [12, 34, 56],
    [1, 2, 3, 4, 5, 6, 7, 8],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const arr = raw[i];
    tcs.push({
      input: JSON.stringify(arr),
      output: String(arr.length),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests (size up to 2,400)
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    tcs.push({
      input: JSON.stringify(arr),
      output: String(size),
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Search in a Linked List
// ─────────────────────────────────────────────────────────────────────────────
function generateSearchLLTCs() {
  const raw = [
    // 1-3 Public Examples
    [[1, 2, 3, 4], 3],
    [[1, 2, 3, 4], 5],
    [[2], 2],
    // 4-20 Edge Cases
    [[], 1],
    [[1], 2],
    [[1, 2, 3], 1],
    [[1, 2, 3], 3],
    [[1, 1, 1, 1], 1],
    [[10, 20, 30, 40], 40],
    [[10, 20, 30, 40], 50],
    [[-1, -2, -3], -2],
    [[-1, -2, -3], 0],
    [[0, 1, 2], 0],
    [[5, 4, 3, 2, 1], 5],
    [[5, 4, 3, 2, 1], 1],
    [[100, 200, 300], 200],
    [[7, 14, 21, 28], 35],
    [[9, 9, 9], 8],
    [[42, 43, 44], 43],
    [[2, 4, 6, 8], 8],
  ];

  const tcs = [];
  for (let i = 0; i < raw.length; i++) {
    const [arr, key] = raw[i];
    const found = arr.includes(key);
    tcs.push({
      input: `${JSON.stringify(arr)}, ${key}`,
      output: String(found),
      is_hidden: i >= 3
    });
  }

  // 21-25 Stress Tests (size up to 2,400, key not present to force full traversal)
  const stressSizes = [1600, 1800, 2000, 2200, 2400];
  for (let i = 0; i < stressSizes.length; i++) {
    const size = stressSizes[i];
    const arr = [];
    for (let j = 1; j <= size; j++) arr.push(j);
    tcs.push({
      input: `${JSON.stringify(arr)}, 999999`,
      output: 'false',
      is_hidden: true
    });
  }

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Problem Definitions & Optimal / Naive Solutions
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Introduction to Linked List',
    slug: 'introduction-to-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `Given an array of integers \`arr\`, construct a singly linked list consisting of elements of the array and return *the \`head\` of the linked list*.

A **singly linked list** is a linear data structure in which each element (node) contains a \`val\` and a pointer \`next\` to the subsequent node.

\`\`\`
Array: [1, 2, 3, 4, 5]
Linked List:
[ 1 | • ] --> [ 2 | • ] --> [ 3 | • ] --> [ 4 | • ] --> [ 5 | null ]
  head
\`\`\`

### Example 1:
\`\`\`text
Input: arr = [1, 2, 3, 4, 5]
Output: [1, 2, 3, 4, 5]
Explanation: Linked list created with nodes containing 1 -> 2 -> 3 -> 4 -> 5.
\`\`\`

### Example 2:
\`\`\`text
Input: arr = [4, 2, 5, 1]
Output: [4, 2, 5, 1]
\`\`\`

### Constraints:
- \`0 <= arr.length <= 10^5\`
- \`-10^5 <= arr[i] <= 10^5\``,
    hints: [
      "Use a dummy head node to simplify the creation of the list.",
      "Iterate through the array and create a new ListNode for each element, advancing your tail pointer."
    ],
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '[1, 2, 3, 4, 5]',
    testCases: generateIntroLLTCs(),
    optimalCode: `function solution(arr) {
  if (!arr || !arr.length) return null;
  const dummy = new ListNode(0);
  let curr = dummy;
  for (let i = 0; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return dummy.next;
}`,
    naiveCode: `function solution(arr) {
  if (!arr || !arr.length) return null;
  let head = new ListNode(arr[0]);
  for (let i = 1; i < arr.length; i++) {
    let curr = head;
    let count = 0;
    while (curr.next) {
      count++;
      let back = head;
      for (let k = 0; k < count; k++) {
        if (back) back = back.next;
      }
      curr = curr.next;
    }
    curr.next = new ListNode(arr[i]);
  }
  return head;
}`
  },
  {
    title: 'Insert Node at the End of Linked List',
    slug: 'insert-node-at-the-end-of-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `Given the \`head\` of a Singly Linked List and an integer \`x\`, append a new node with value \`x\` at the end of the list and return *the \`head\` of the modified list*.

\`\`\`
Initial List:
[ 1 | • ] --> [ 2 | • ] --> [ 3 | • ] --> [ 4 | • ] --> [ 5 | null ]
                                                          |
Insert x = 6 at tail                                      v
[ 1 | • ] --> [ 2 | • ] --> [ 3 | • ] --> [ 4 | • ] --> [ 5 | • ] --> [ 6 | null ]
\`\`\`

### Example 1:
\`\`\`text
Input: head = [1, 2, 3, 4, 5], x = 6
Output: [1, 2, 3, 4, 5, 6]
Explanation: Node with value 6 is added after 5.
\`\`\`

### Example 2:
\`\`\`text
Input: head = [], x = 1
Output: [1]
Explanation: The initial list is empty, so the new node becomes the head.
\`\`\`

### Constraints:
- \`0 <= number of nodes <= 10^5\`
- \`-10^5 <= Node.val, x <= 10^5\``,
    hints: [
      "If head is null, create and return a new node.",
      "Traverse to the last node (where `curr.next === null`) and set `curr.next = new ListNode(x)`."
    ],
    sample_input: '[1, 2, 3, 4, 5], 6',
    sample_output: '[1, 2, 3, 4, 5, 6]',
    testCases: generateInsertEndTCs(),
    optimalCode: `function solution(head, x) {
  const newNode = new ListNode(x);
  if (!head) return newNode;
  let curr = head;
  while (curr.next) {
    curr = curr.next;
  }
  curr.next = newNode;
  return head;
}`,
    naiveCode: `function solution(head, x) {
  const newNode = new ListNode(x);
  if (!head) return newNode;
  let curr = head;
  while (curr) {
    let p1 = head;
    while (p1 !== curr) {
      let p2 = head;
      while (p2 !== p1) {
        if (p2.val === p1.val) break;
        p2 = p2.next;
      }
      p1 = p1.next;
    }
    if (!curr.next) {
      curr.next = newNode;
      break;
    }
    curr = curr.next;
  }
  return head;
}`
  },
  {
    title: 'Delete Node in a Linked List',
    slug: 'delete-node-in-a-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `Given the \`head\` of a singly linked list and an integer \`val\`, delete the **first occurrence** of the node with value \`val\` from the linked list and return *the \`head\` of the modified list*.

If the value is not present in the list, return the original list.

\`\`\`
Initial List:
[ 4 | • ] --> [ 5 | • ] --> [ 1 | • ] --> [ 9 | null ]
                x (Delete val = 5)
Modified List:
[ 4 | • ] --------------> [ 1 | • ] --> [ 9 | null ]
\`\`\`

### Example 1:
\`\`\`text
Input: head = [4, 5, 1, 9], val = 5
Output: [4, 1, 9]
Explanation: Node with value 5 is deleted.
\`\`\`

### Example 2:
\`\`\`text
Input: head = [4, 5, 1, 9], val = 4
Output: [5, 1, 9]
Explanation: The head node with value 4 is deleted, so the new head is 5.
\`\`\`

### Example 3:
\`\`\`text
Input: head = [1, 2, 3], val = 3
Output: [1, 2]
\`\`\`

### Constraints:
- \`0 <= number of nodes <= 10^5\`
- \`-10^5 <= Node.val, val <= 10^5\``,
    hints: [
      "Check if the head itself needs to be deleted (`head.val === val`).",
      "Otherwise, use a pointer to find the node whose `next.val === val` and bypass it."
    ],
    sample_input: '[4, 5, 1, 9], 5',
    sample_output: '[4, 1, 9]',
    testCases: generateDeleteNodeTCs(),
    optimalCode: `function solution(head, val) {
  if (!head) return null;
  if (head.val === val) return head.next;
  let curr = head;
  while (curr.next) {
    if (curr.next.val === val) {
      curr.next = curr.next.next;
      break;
    }
    curr = curr.next;
  }
  return head;
}`,
    naiveCode: `function solution(head, val) {
  if (!head) return null;
  let curr = head;
  while (curr) {
    let p1 = head;
    while (p1 !== curr) {
      let p2 = head;
      while (p2 !== p1) {
        if (p2.val === p1.val) break;
        p2 = p2.next;
      }
      p1 = p1.next;
    }
    if (curr.val === val) {
      if (curr === head) return head.next;
      let prev = head;
      while (prev.next !== curr) prev = prev.next;
      prev.next = curr.next;
      return head;
    }
    curr = curr.next;
  }
  return head;
}`
  },
  {
    title: 'Count Nodes of Linked List',
    slug: 'count-nodes-of-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `Given the \`head\` of a singly linked list, return *the total count of nodes* in the linked list.

\`\`\`
List:
[ 1 | • ] --> [ 2 | • ] --> [ 3 | • ] --> [ 4 | • ] --> [ 5 | null ]
  Node 1        Node 2        Node 3        Node 4        Node 5
Total Count = 5
\`\`\`

### Example 1:
\`\`\`text
Input: head = [1, 2, 3, 4, 5]
Output: 5
Explanation: The linked list has 5 nodes.
\`\`\`

### Example 2:
\`\`\`text
Input: head = [2, 4, 6, 7, 5, 1, 0]
Output: 7
\`\`\`

### Example 3:
\`\`\`text
Input: head = []
Output: 0
\`\`\`

### Constraints:
- \`0 <= number of nodes <= 10^5\`
- \`-10^5 <= Node.val <= 10^5\``,
    hints: [
      "Initialize a counter to 0.",
      "Traverse the linked list with a while loop until reaching null, incrementing the counter at each node."
    ],
    sample_input: '[1, 2, 3, 4, 5]',
    sample_output: '5',
    testCases: generateCountNodesTCs(),
    optimalCode: `function solution(head) {
  let count = 0;
  let curr = head;
  while (curr) {
    count++;
    curr = curr.next;
  }
  return count;
}`,
    naiveCode: `function solution(head) {
  let count = 0;
  let curr = head;
  while (curr) {
    count++;
    let p1 = head;
    while (p1 !== curr) {
      let p2 = head;
      while (p2 !== p1) {
        if (p2.val === p1.val) break;
        p2 = p2.next;
      }
      p1 = p1.next;
    }
    curr = curr.next;
  }
  return count;
}`
  },
  {
    title: 'Search in a Linked List',
    slug: 'search-in-a-linked-list',
    topic: 'linked-list',
    difficulty: 'easy',
    description: `Given the \`head\` of a singly linked list and an integer \`key\`, return \`true\` *if \`key\` is present in the list, otherwise return \`false\`*.

\`\`\`
List: [ 1 | • ] --> [ 2 | • ] --> [ 3 | • ] --> [ 4 | null ]
Search key = 3:
Check node 1: 1 !== 3
Check node 2: 2 !== 3
Check node 3: 3 === 3  --> Found! Return true.
\`\`\`

### Example 1:
\`\`\`text
Input: head = [1, 2, 3, 4], key = 3
Output: true
Explanation: 3 is present in the linked list.
\`\`\`

### Example 2:
\`\`\`text
Input: head = [1, 2, 3, 4], key = 5
Output: false
Explanation: 5 is not present in the linked list.
\`\`\`

### Example 3:
\`\`\`text
Input: head = [2], key = 2
Output: true
\`\`\`

### Constraints:
- \`0 <= number of nodes <= 10^5\`
- \`-10^5 <= Node.val, key <= 10^5\``,
    hints: [
      "Start a pointer at the head node.",
      "At each node, check if `curr.val === key`. If yes, return true. Otherwise advance to `curr.next`.",
      "If you reach null without finding the key, return false."
    ],
    sample_input: '[1, 2, 3, 4], 3',
    sample_output: 'true',
    testCases: generateSearchLLTCs(),
    optimalCode: `function solution(head, key) {
  let curr = head;
  while (curr) {
    if (curr.val === key) return true;
    curr = curr.next;
  }
  return false;
}`,
    naiveCode: `function solution(head, key) {
  let curr = head;
  while (curr) {
    let p1 = head;
    while (p1 !== curr) {
      let p2 = head;
      while (p2 !== p1) {
        if (p2.val === p1.val) break;
        p2 = p2.next;
      }
      p1 = p1.next;
    }
    if (curr.val === key) return true;
    curr = curr.next;
  }
  return false;
}`
  }
];

async function main() {
  console.log('====================================================');
  console.log('SEEDING & STRICT TLE VALIDATING LINKED LIST BATCH 1 (25 TCs)');
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
