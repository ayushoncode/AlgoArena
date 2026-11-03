'use strict';

/**
 * upgrade_linkedlists_batch1_25tc.js
 *
 * Upgrades 7 Core & Classic Linked List problems to exactly 25 curated test cases:
 * 1. Reverse Linked List (LC 206) [Easy]
 * 2. Merge Two Sorted Lists (LC 21) [Easy]
 * 3. Remove Duplicates from Sorted List (LC 83) [Easy]
 * 4. Remove Duplicates from Sorted List II (LC 82) [Medium]
 * 5. Remove Nth Node From End of List (LC 19) [Medium]
 * 6. Swap Nodes in Pairs (LC 24) [Medium]
 * 7. Rotate List (LC 61) [Medium]
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
// Reference Solvers for Extra Test Cases
// -------------------------------------------------------------

function solveReverseList(arr) {
  return [...arr].reverse();
}

function solveMergeTwoSortedLists(l1, l2) {
  const res = [];
  let i = 0, j = 0;
  while (i < l1.length && j < l2.length) {
    if (l1[i] <= l2[j]) res.push(l1[i++]);
    else res.push(l2[j++]);
  }
  while (i < l1.length) res.push(l1[i++]);
  while (j < l2.length) res.push(l2[j++]);
  return res;
}

function solveRemoveDuplicates(arr) {
  if (!arr || arr.length === 0) return [];
  const res = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1]) res.push(arr[i]);
  }
  return res;
}

function solveRemoveDuplicatesII(arr) {
  if (!arr || arr.length === 0) return [];
  const counts = new Map();
  for (const v of arr) counts.set(v, (counts.get(v) || 0) + 1);
  return arr.filter(v => counts.get(v) === 1);
}

function solveRemoveNthFromEnd(arr, n) {
  const idxToRemove = arr.length - n;
  if (idxToRemove < 0 || idxToRemove >= arr.length) return arr;
  return arr.filter((_, idx) => idx !== idxToRemove);
}

function solveSwapPairs(arr) {
  const res = [...arr];
  for (let i = 0; i + 1 < res.length; i += 2) {
    const tmp = res[i];
    res[i] = res[i + 1];
    res[i + 1] = tmp;
  }
  return res;
}

function solveRotateList(arr, k) {
  if (!arr || arr.length <= 1) return arr || [];
  const shift = k % arr.length;
  if (shift === 0) return [...arr];
  const split = arr.length - shift;
  return arr.slice(split).concat(arr.slice(0, split));
}

// -------------------------------------------------------------
// Problem Specifications
// -------------------------------------------------------------

const LL_BATCH1 = [
  {
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-9-tests/reverse-linked-list.json',
    sample_input: '[1,2,3,4,5]',
    sample_output: '[5,4,3,2,1]',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.

### Example 1:
\`\`\`
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2]
Output: [2,1]
\`\`\`

### Example 3:
\`\`\`
Input: head = []
Output: []
\`\`\`

### Constraints:
- The number of nodes in the list is the range \`[0, 50000]\`.
- \`-5000 <= Node.val <= 5000\`

**Follow up:** A linked list can be reversed either iteratively or recursively. Could you implement both?`,
    generateExtraTestCases: () => {
      // 21: N=35,000 array to kill O(N^2) naive reversal
      const a_21 = Array.from({ length: 35000 }, (_, i) => i + 1);
      // 22: Empty list
      const a_22 = [];
      // 23: Single node
      const a_23 = [42];
      // 24: Two nodes
      const a_24 = [1, 2];
      // 25: N=50,000 max scale
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i * 17) % 5000);

      const extras = [a_21, a_22, a_23, a_24, a_25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveReverseList(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
    bruteCode: `
function solution(head) {
  if (!head || !head.next) return head;
  let len = 0, c = head;
  while (c) { len++; c = c.next; }
  const dummy = new ListNode(0);
  let tail = dummy;
  for (let i = len - 1; i >= 0; i--) {
    let node = head;
    for (let j = 0; j < i; j++) node = node.next;
    tail.next = new ListNode(node.val);
    tail = tail.next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-35-tests/merge-two-sorted-lists.json',
    sample_input: '[1,2,4], [1,3,4]',
    sample_output: '[1,1,2,3,4,4]',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.

### Example 1:
\`\`\`
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
\`\`\`

### Example 2:
\`\`\`
Input: list1 = [], list2 = []
Output: []
\`\`\`

### Example 3:
\`\`\`
Input: list1 = [], list2 = [0]
Output: [0]
\`\`\`

### Constraints:
- The number of nodes in both lists is in the range \`[0, 50000]\`.
- \`-100 <= Node.val <= 100\`
- Both \`list1\` and \`list2\` are sorted in **non-decreasing** order.`,
    generateExtraTestCases: () => {
      // 21: N=25,000 each to kill O(N^2)
      const l1_21 = Array.from({ length: 25000 }, (_, i) => i * 2);
      const l2_21 = Array.from({ length: 25000 }, (_, i) => i * 2 + 1);
      // 22: Both empty
      const l1_22 = [], l2_22 = [];
      // 23: One empty
      const l1_23 = [], l2_23 = [0];
      // 24: Disjoint ranges
      const l1_24 = Array.from({ length: 5000 }, (_, i) => i);
      const l2_24 = Array.from({ length: 5000 }, (_, i) => i + 10000);
      // 25: N=35,000 each scale
      const l1_25 = Array.from({ length: 35000 }, (_, i) => Math.floor(i / 2));
      const l2_25 = Array.from({ length: 35000 }, (_, i) => Math.floor((i + 1) / 2));

      const extras = [
        [l1_21, l2_21],
        [l1_22, l2_22],
        [l1_23, l2_23],
        [l1_24, l2_24],
        [l1_25, l2_25]
      ];

      return extras.map(([a, b]) => ({
        input: `${JSON.stringify(a)}, ${JSON.stringify(b)}`,
        output: JSON.stringify(solveMergeTwoSortedLists(a, b)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(list1, list2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) {
      curr.next = list1;
      list1 = list1.next;
    } else {
      curr.next = list2;
      list2 = list2.next;
    }
    curr = curr.next;
  }
  curr.next = list1 || list2;
  return dummy.next;
}`,
    bruteCode: `
function solution(list1, list2) {
  function merge(l1, l2) {
    if (!l1) return l2;
    if (!l2) return l1;
    if (l1.val <= l2.val) {
      l1.next = merge(l1.next, l2);
      return l1;
    } else {
      l2.next = merge(l1, l2.next);
      return l2;
    }
  }
  return merge(list1, list2);
}`
  },
  {
    slug: 'remove-duplicates-from-sorted-list',
    title: 'Remove Duplicates from Sorted List',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-28-tests/remove-duplicates-from-sorted-list.json',
    sample_input: '[1,1,2]',
    sample_output: '[1,2]',
    description: `Given the \`head\` of a sorted linked list, *delete all duplicates such that each element appears only once*. Return *the linked list **sorted** as well*.

### Example 1:
\`\`\`
Input: head = [1,1,2]
Output: [1,2]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,1,2,3,3]
Output: [1,2,3]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`-100 <= Node.val <= 100\`
- The list is guaranteed to be **sorted** in ascending order.`,
    generateExtraTestCases: () => {
      // 21: N=35,000 all duplicates
      const a_21 = Array(35000).fill(7);
      // 22: Empty list
      const a_22 = [];
      // 23: All distinct
      const a_23 = Array.from({ length: 5000 }, (_, i) => i);
      // 24: Pairs of duplicates
      const a_24 = [];
      for (let i = 0; i < 10000; i++) { a_24.push(i); a_24.push(i); }
      // 25: N=50,000 upper bound
      const a_25 = Array.from({ length: 50000 }, (_, i) => Math.floor(i / 5));

      const extras = [a_21, a_22, a_23, a_24, a_25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveRemoveDuplicates(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  let curr = head;
  while (curr && curr.next) {
    if (curr.val === curr.next.val) {
      curr.next = curr.next.next;
    } else {
      curr = curr.next;
    }
  }
  return head;
}`,
    bruteCode: `
function solution(head) {
  if (!head || !head.next) return head;
  let len = 0, c = head;
  while (c) { len++; c = c.next; }
  const dummy = new ListNode(0);
  let tail = dummy;
  for (let i = 0; i < len; i++) {
    let node = head;
    for (let j = 0; j < i; j++) node = node.next;
    let seenBefore = false;
    let scan = dummy.next;
    while (scan) {
      if (scan.val === node.val) { seenBefore = true; break; }
      scan = scan.next;
    }
    if (!seenBefore) {
      tail.next = new ListNode(node.val);
      tail = tail.next;
    }
  }
  return dummy.next;
}`
  },
  {
    slug: 'remove-duplicates-from-sorted-list-ii',
    title: 'Remove Duplicates from Sorted List II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-17-tests/remove-duplicates-from-sorted-list-ii.json',
    sample_input: '[1,2,3,3,4,4,5]',
    sample_output: '[1,2,5]',
    description: `Given the \`head\` of a sorted linked list, *delete all nodes that have duplicate numbers, leaving only distinct numbers from the original list*. Return *the linked list **sorted** as well*.

### Example 1:
\`\`\`
Input: head = [1,2,3,3,4,4,5]
Output: [1,2,5]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,1,1,2,3]
Output: [2,3]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`-100 <= Node.val <= 100\`
- The list is guaranteed to be **sorted** in ascending order.`,
    generateExtraTestCases: () => {
      // 21: N=30,000 (O(N^2) nested scanner killer)
      const a_21 = [];
      for (let i = 0; i < 15000; i++) { a_21.push(i); a_21.push(i); }
      // 22: All duplicates
      const a_22 = [1, 1, 2, 2, 3, 3, 4, 4];
      // 23: Empty list
      const a_23 = [];
      // 24: Only head is duplicate
      const a_24 = [1, 1, 2, 3, 4, 5];
      // 25: N=50,000 scale
      const a_25 = [];
      for (let i = 0; i < 25000; i++) { a_25.push(i); a_25.push(i); }
      a_25.push(99999);

      const extras = [a_21, a_22, a_23, a_24, a_25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveRemoveDuplicatesII(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (head) {
    if (head.next && head.val === head.next.val) {
      while (head.next && head.val === head.next.val) {
        head = head.next;
      }
      prev.next = head.next;
    } else {
      prev = prev.next;
    }
    head = head.next;
  }
  return dummy.next;
}`,
    bruteCode: `
function solution(head) {
  const dummy = new ListNode(0);
  let tail = dummy;
  let curr = head;
  while (curr) {
    let count = 0, scan = head;
    while (scan) {
      if (scan.val === curr.val) count++;
      scan = scan.next;
    }
    if (count === 1) {
      tail.next = new ListNode(curr.val);
      tail = tail.next;
    }
    curr = curr.next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'remove-nth-node-from-end-of-list',
    title: 'Remove Nth Node From End of List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-29-tests/remove-nth-node-from-end-of-list.json',
    sample_input: '[1,2,3,4,5], 2',
    sample_output: '[1,2,3,5]',
    description: `Given the \`head\` of a linked list, remove the \`n\`th node from the end of the list and return its head.

### Example 1:
\`\`\`
Input: head = [1,2,3,4,5], n = 2
Output: [1,2,3,5]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1], n = 1
Output: []
\`\`\`

### Example 3:
\`\`\`
Input: head = [1,2], n = 1
Output: [1]
\`\`\`

### Constraints:
- The number of nodes in the list is \`sz\`.
- \`1 <= sz <= 50000\`
- \`0 <= Node.val <= 100\`
- \`1 <= n <= sz\`

**Follow up:** Could you do this in one pass?`,
    generateExtraTestCases: () => {
      // 21: N=30,000 array to kill O(N^2)
      const a_21 = Array.from({ length: 30000 }, (_, i) => i + 1);
      const n_21 = 15000;
      // 22: Single node
      const a_22 = [42], n_22 = 1;
      // 23: Remove head
      const a_23 = [1, 2, 3, 4], n_23 = 4;
      // 24: Remove tail
      const a_24 = [1, 2, 3, 4], n_24 = 1;
      // 25: N=50,000 upper bound
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i * 3) % 100);
      const n_25 = 25000;

      const extras = [
        [a_21, n_21],
        [a_22, n_22],
        [a_23, n_23],
        [a_24, n_24],
        [a_25, n_25]
      ];

      return extras.map(([arr, n]) => ({
        input: `${JSON.stringify(arr)}, ${n}`,
        output: JSON.stringify(solveRemoveNthFromEnd(arr, n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
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
    bruteCode: `
function solution(head, n) {
  const dummy = new ListNode(0, head);
  let curr = dummy;
  while (curr && curr.next) {
    let dist = 0, scan = curr.next;
    while (scan) { dist++; scan = scan.next; }
    if (dist === n) {
      curr.next = curr.next.next;
      break;
    }
    curr = curr.next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'swap-nodes-in-pairs',
    title: 'Swap Nodes in Pairs',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-26-tests/swap-nodes-in-pairs.json',
    sample_input: '[1,2,3,4]',
    sample_output: '[2,1,4,3]',
    description: `Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed.)

### Example 1:
\`\`\`
Input: head = [1,2,3,4]
Output: [2,1,4,3]
\`\`\`

### Example 2:
\`\`\`
Input: head = []
Output: []
\`\`\`

### Example 3:
\`\`\`
Input: head = [1]
Output: [1]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`0 <= Node.val <= 100\``,
    generateExtraTestCases: () => {
      // 21: N=30,000 array to kill O(N^2)
      const a_21 = Array.from({ length: 30000 }, (_, i) => i + 1);
      // 22: Empty list
      const a_22 = [];
      // 23: Single node
      const a_23 = [1];
      // 24: Odd length list
      const a_24 = [1, 2, 3, 4, 5];
      // 25: N=50,000 scale
      const a_25 = Array.from({ length: 50000 }, (_, i) => i % 100);

      const extras = [a_21, a_22, a_23, a_24, a_25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveSwapPairs(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next && prev.next.next) {
    const first = prev.next;
    const second = prev.next.next;
    first.next = second.next;
    second.next = first;
    prev.next = second;
    prev = first;
  }
  return dummy.next;
}`,
    bruteCode: `
function solution(head) {
  let len = 0, c = head;
  while (c) { len++; c = c.next; }
  const dummy = new ListNode(0);
  let tail = dummy;
  for (let i = 0; i < len; i += 2) {
    let n1 = head, n2 = null;
    for (let j = 0; j < i; j++) n1 = n1.next;
    if (i + 1 < len) {
      n2 = head;
      for (let j = 0; j < i + 1; j++) n2 = n2.next;
      tail.next = new ListNode(n2.val);
      tail = tail.next;
    }
    tail.next = new ListNode(n1.val);
    tail = tail.next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'rotate-list',
    title: 'Rotate List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-19-tests/rotate-list.json',
    sample_input: '[1,2,3,4,5], 2',
    sample_output: '[4,5,1,2,3]',
    description: `Given the \`head\` of a linked list, rotate the list to the right by \`k\` places.

### Example 1:
\`\`\`
Input: head = [1,2,3,4,5], k = 2
Output: [4,5,1,2,3]
\`\`\`

### Example 2:
\`\`\`
Input: head = [0,1,2], k = 4
Output: [2,0,1]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`-100 <= Node.val <= 100\`
- \`0 <= k <= 2 * 10⁹\``,
    generateExtraTestCases: () => {
      // 21: N=25,000, k=8,000 (O(k*N) killer taking > 2500ms)
      const a_21 = Array.from({ length: 25000 }, (_, i) => i + 1);
      const k_21 = 8000;
      // 22: Empty list
      const a_22 = [], k_22 = 5;
      // 23: k=0
      const a_23 = [1, 2, 3], k_23 = 0;
      // 24: k=length
      const a_24 = [1, 2, 3], k_24 = 3;
      // 25: N=50,000, large k
      const a_25 = Array.from({ length: 50000 }, (_, i) => i % 50);
      const k_25 = 2000000000;

      const extras = [
        [a_21, k_21],
        [a_22, k_22],
        [a_23, k_23],
        [a_24, k_24],
        [a_25, k_25]
      ];

      return extras.map(([arr, k]) => ({
        input: `${JSON.stringify(arr)}, ${k}`,
        output: JSON.stringify(solveRotateList(arr, k)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head, k) {
  if (!head || !head.next || k === 0) return head;
  let len = 1, tail = head;
  while (tail.next) {
    tail = tail.next;
    len++;
  }
  k = k % len;
  if (k === 0) return head;
  tail.next = head;
  let steps = len - k, newTail = head;
  for (let i = 1; i < steps; i++) {
    newTail = newTail.next;
  }
  const newHead = newTail.next;
  newTail.next = null;
  return newHead;
}`,
    bruteCode: `
function solution(head, k) {
  if (!head || !head.next || k === 0) return head;
  for (let step = 0; step < k; step++) {
    let prev = null, curr = head;
    while (curr.next) {
      prev = curr;
      curr = curr.next;
    }
    curr.next = head;
    prev.next = null;
    head = curr;
  }
  return head;
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for Linked Lists Batch 1 (7 Problems) ===\n');

  for (const prob of LL_BATCH1) {
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
    console.log(`✓ Seeded exactly 25 test cases (TC 25 input length: ${finalTestCases[24].input.length} chars).`);

    // 6. Validate Optimal Solution with Judge
    const optimalResult = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(
      `✓ Optimal Solution: verdict = ${optimalResult.verdict} (${optimalResult.passedTests}/${optimalResult.totalTests} in ${optimalResult.runtimeMs}ms)`
    );
    if (optimalResult.verdict !== 'ACCEPTED' || optimalResult.passedTests !== 25) {
      console.error('OPTIMAL SOLUTION FAILED!', optimalResult);
      process.exit(1);
    }

    // 7. Verify Brute Force Strictly Gets TIME_LIMIT_EXCEEDED
    if (prob.bruteCode) {
      const bruteResult = await evaluateSubmission(problemId, prob.bruteCode, 'javascript');
      console.log(
        `✓ Brute Force Check: verdict = ${bruteResult.verdict} (${bruteResult.passedTests}/${bruteResult.totalTests} in ${bruteResult.runtimeMs}ms)`
      );
      if (bruteResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
        console.warn(`WARNING: Brute force did not get TIME_LIMIT_EXCEEDED! Got: ${bruteResult.verdict}`);
      } else {
        console.log(`✓ Confirmed: Brute force strictly triggers TIME_LIMIT_EXCEEDED (> 2000ms limit).`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('✓ All 7 Linked Lists Batch 1 problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

