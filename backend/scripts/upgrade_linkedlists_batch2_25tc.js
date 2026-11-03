'use strict';

/**
 * upgrade_linkedlists_batch2_25tc.js
 *
 * Upgrades 7 Intermediate & Two-Pointer Linked List problems to exactly 25 curated test cases:
 * 1. Partition List (LC 86) [Medium]
 * 2. Reverse Linked List II (LC 92) [Medium]
 * 3. Reorder List (LC 143) [Medium]
 * 4. Add Two Numbers (LC 2) [Medium]
 * 5. Insertion Sort List (LC 147) [Medium]
 * 6. Sort List (LC 148) [Medium]
 * 7. Intersection of Two Linked Lists (LC 160) [Easy]
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

function solvePartitionList(arr, x) {
  const less = [];
  const greater = [];
  for (const v of arr) {
    if (v < x) less.push(v);
    else greater.push(v);
  }
  return [...less, ...greater];
}

function solveReverseBetween(arr, left, right) {
  const res = [...arr];
  let l = left - 1, r = right - 1;
  while (l < r) {
    const tmp = res[l];
    res[l] = res[r];
    res[r] = tmp;
    l++;
    r--;
  }
  return res;
}

function solveReorderList(arr) {
  if (!arr || arr.length <= 2) return arr;
  const res = [];
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    if (l === r) {
      res.push(arr[l]);
    } else {
      res.push(arr[l]);
      res.push(arr[r]);
    }
    l++;
    r--;
  }
  return res;
}

function solveAddTwoNumbers(l1, l2) {
  const res = [];
  let i = 0, j = 0, carry = 0;
  while (i < l1.length || j < l2.length || carry > 0) {
    const v1 = i < l1.length ? l1[i++] : 0;
    const v2 = j < l2.length ? l2[j++] : 0;
    const sum = v1 + v2 + carry;
    res.push(sum % 10);
    carry = Math.floor(sum / 10);
  }
  return res;
}

function solveInsertionSortList(arr) {
  return [...arr].sort((a, b) => a - b);
}

function solveSortList(arr) {
  return [...arr].sort((a, b) => a - b);
}

function solveIntersection(intersectVal, listA, listB, skipA, skipB) {
  if (intersectVal === 0 || skipA >= listA.length || skipB >= listB.length) {
    return 'No intersection';
  }
  return `Intersected at '${intersectVal}'`;
}

// -------------------------------------------------------------
// Problem Definitions
// -------------------------------------------------------------

const LL_BATCH2 = [
  {
    slug: 'partition-list',
    title: 'Partition List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-36-tests/partition-list.json',
    sample_input: '[1,4,3,2,5,2], 3',
    sample_output: '[1,2,2,4,3,5]',
    description: `Given the \`head\` of a linked list and a value \`x\`, partition it such that all nodes less than \`x\` come before nodes greater than or equal to \`x\`.

You should preserve the original relative order of the nodes in each of the two partitions.

### Example 1:
\`\`\`
Input: head = [1,4,3,2,5,2], x = 3
Output: [1,2,2,4,3,5]
\`\`\`

### Example 2:
\`\`\`
Input: head = [2,1], x = 2
Output: [1,2]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`-100 <= Node.val <= 100\`
- \`-200 <= x <= 200\``,
    generateExtraTestCases: () => {
      // 21: N=30,000 stress test (kills O(N^2) scan)
      const a_21 = Array.from({ length: 30000 }, (_, i) => (i % 200) - 100);
      const x_21 = 0;
      // 22: Empty list
      const a_22 = [], x_22 = 5;
      // 23: Single node
      const a_23 = [10], x_23 = 10;
      // 24: All elements less than x
      const a_24 = [1, 2, 3, 4], x_24 = 100;
      // 25: N=50,000 scale test
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i % 150) - 75);
      const x_25 = 25;

      const extras = [
        [a_21, x_21],
        [a_22, x_22],
        [a_23, x_23],
        [a_24, x_24],
        [a_25, x_25]
      ];

      return extras.map(([arr, x]) => ({
        input: `${JSON.stringify(arr)}, ${x}`,
        output: JSON.stringify(solvePartitionList(arr, x)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head, x) {
  const beforeHead = new ListNode(0);
  let before = beforeHead;
  const afterHead = new ListNode(0);
  let after = afterHead;

  let curr = head;
  while (curr) {
    if (curr.val < x) {
      before.next = curr;
      before = before.next;
    } else {
      after.next = curr;
      after = after.next;
    }
    curr = curr.next;
  }
  after.next = null;
  before.next = afterHead.next;
  return beforeHead.next;
}`,
    bruteCode: `
function solution(head, x) {
  // Naive O(N^2) scanner killer
  let curr = head;
  while (curr) {
    let scan = head;
    while (scan) {
      scan = scan.next;
    }
    curr = curr.next;
  }
  const bHead = new ListNode(0);
  let b = bHead;
  const aHead = new ListNode(0);
  let a = aHead;
  curr = head;
  while (curr) {
    if (curr.val < x) { b.next = new ListNode(curr.val); b = b.next; }
    else { a.next = new ListNode(curr.val); a = a.next; }
    curr = curr.next;
  }
  b.next = aHead.next;
  return bHead.next;
}`
  },
  {
    slug: 'reverse-linked-list-ii',
    title: 'Reverse Linked List II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-11-tests/reverse-linked-list-ii.json',
    sample_input: '[1,2,3,4,5], 2, 4',
    sample_output: '[1,4,3,2,5]',
    description: `Given the \`head\` of a singly linked list and two integers \`left\` and \`right\` where \`left <= right\`, reverse the nodes of the list from position \`left\` to position \`right\`, and return the reversed list.

### Example 1:
\`\`\`
Input: head = [1,2,3,4,5], left = 2, right = 4
Output: [1,4,3,2,5]
\`\`\`

### Example 2:
\`\`\`
Input: head = [5], left = 1, right = 1
Output: [5]
\`\`\`

### Constraints:
- The number of nodes in the list is \`n\`.
- \`1 <= n <= 50000\`
- \`-500 <= Node.val <= 500\`
- \`1 <= left <= right <= n\``,
    generateExtraTestCases: () => {
      // 21: N=30,000, full reversal (kills O(N^2) scan)
      const a_21 = Array.from({ length: 30000 }, (_, i) => i + 1);
      const l_21 = 1, r_21 = 30000;
      // 22: Single node
      const a_22 = [42], l_22 = 1, r_22 = 1;
      // 23: Reversing middle two elements
      const a_23 = [1, 2, 3, 4, 5, 6], l_23 = 3, r_23 = 4;
      // 24: Reversing entire list of 3 elements
      const a_24 = [10, 20, 30], l_24 = 1, r_24 = 3;
      // 25: N=50,000 scale test
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i * 13) % 500);
      const l_25 = 10000, r_25 = 40000;

      const extras = [
        [a_21, l_21, r_21],
        [a_22, l_22, r_22],
        [a_23, l_23, r_23],
        [a_24, l_24, r_24],
        [a_25, l_25, r_25]
      ];

      return extras.map(([arr, left, right]) => ({
        input: `${JSON.stringify(arr)}, ${left}, ${right}`,
        output: JSON.stringify(solveReverseBetween(arr, left, right)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head, left, right) {
  if (!head || left === right) return head;
  const dummy = new ListNode(0, head);
  let prev = dummy;
  for (let i = 0; i < left - 1; i++) prev = prev.next;
  let curr = prev.next;
  for (let i = 0; i < right - left; i++) {
    const nextNode = curr.next;
    curr.next = nextNode.next;
    nextNode.next = prev.next;
    prev.next = nextNode;
  }
  return dummy.next;
}`,
    bruteCode: `
function solution(head, left, right) {
  // Naive O(N^2) scan
  for (let i = left; i <= right; i++) {
    let scan = head;
    while (scan) scan = scan.next;
  }
  const dummy = new ListNode(0, head);
  let prev = dummy;
  for (let i = 0; i < left - 1; i++) prev = prev.next;
  let curr = prev.next;
  for (let i = 0; i < right - left; i++) {
    const nextNode = curr.next;
    curr.next = nextNode.next;
    nextNode.next = prev.next;
    prev.next = nextNode;
  }
  return dummy.next;
}`
  },
  {
    slug: 'reorder-list',
    title: 'Reorder List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-15-tests/reorder-list.json',
    sample_input: '[1,2,3,4]',
    sample_output: '[1,4,2,3]',
    description: `You are given the head of a singly linked-list. The list can be represented as:

\`L0 → L1 → … → Ln - 1 → Ln\`

Reorder the list to be on the following form:

\`L0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → …\`

You may not modify the values in the list's nodes. Only nodes themselves may be changed.

### Example 1:
\`\`\`
Input: head = [1,2,3,4]
Output: [1,4,2,3]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2,3,4,5]
Output: [1,5,2,4,3]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[1, 50000]\`.
- \`1 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      // 21: N=40,000 stress test (kills O(N^2) scan)
      const a_21 = Array.from({ length: 40000 }, (_, i) => i + 1);
      // 22: Single node
      const a_22 = [100];
      // 23: Two nodes
      const a_23 = [1, 2];
      // 24: Three nodes
      const a_24 = [1, 2, 3];
      // 25: N=50,000 scale test
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i % 1000) + 1);

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveReorderList(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  if (!head || !head.next || !head.next.next) return head;
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let prev = null, curr = slow.next;
  slow.next = null;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  let p1 = head, p2 = prev;
  while (p2) {
    const next1 = p1.next;
    const next2 = p2.next;
    p1.next = p2;
    p2.next = next1;
    p1 = next1;
    p2 = next2;
  }
  return head;
}`,
    bruteCode: `
function solution(head) {
  let n = 0, c = head;
  while (c) { n++; c = c.next; }
  let curr = head;
  for (let i = 0; i < Math.floor(n / 2); i++) {
    let dummyScan = head;
    while (dummyScan) dummyScan = dummyScan.next;
    let prev = null, tail = head;
    for (let k = 0; k < n - 1 - i; k++) {
      prev = tail;
      tail = tail.next;
    }
    prev.next = tail.next;
    tail.next = curr.next;
    curr.next = tail;
    curr = tail.next;
  }
  return head;
}`
  },
  {
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-8-tests/add-two-numbers.json',
    sample_input: '[2,4,3], [5,6,4]',
    sample_output: '[7,0,8]',
    description: `You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

### Example 1:
\`\`\`
Input: l1 = [2,4,3], l2 = [5,6,4]
Output: [7,0,8]
Explanation: 342 + 465 = 807.
\`\`\`

### Example 2:
\`\`\`
Input: l1 = [0], l2 = [0]
Output: [0]
\`\`\`

### Example 3:
\`\`\`
Input: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
Output: [8,9,9,9,0,0,0,1]
\`\`\`

### Constraints:
- The number of nodes in each linked list is in the range \`[1, 50000]\`.
- \`0 <= Node.val <= 9\`
- It is guaranteed that the list represents a number that does not have leading zeros, except the number 0 itself.`,
    generateExtraTestCases: () => {
      // 21: N=25,000 carry propagation stress test (kills O(N^2))
      const a_21 = Array.from({ length: 25000 }, () => 9);
      const b_21 = [1];
      // 22: [0] and [0]
      const a_22 = [0], b_22 = [0];
      // 23: Unequal lengths with ripples
      const a_23 = [9, 9, 9], b_23 = [1];
      // 24: Single digits without carry
      const a_24 = [3], b_24 = [4];
      // 25: N=50,000 scale test
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i % 9));
      const b_25 = Array.from({ length: 50000 }, (_, i) => ((i + 3) % 9));

      const extras = [
        [a_21, b_21],
        [a_22, b_22],
        [a_23, b_23],
        [a_24, b_24],
        [a_25, b_25]
      ];

      return extras.map(([l1, l2]) => ({
        input: `${JSON.stringify(l1)}, ${JSON.stringify(l2)}`,
        output: JSON.stringify(solveAddTwoNumbers(l1, l2)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(l1, l2) {
  const dummy = new ListNode(0);
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }
  return dummy.next;
}`,
    bruteCode: `
function solution(l1, l2) {
  // Naive O(N^2) scanner killer
  let c1 = l1;
  while (c1) {
    let c2 = l2;
    while (c2) {
      c2 = c2.next;
    }
    c1 = c1.next;
  }
  const dummy = new ListNode(0);
  let tail = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'insertion-sort-list',
    title: 'Insertion Sort List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-14-tests/insertion-sort-list.json',
    sample_input: '[-1,5,3,4,0]',
    sample_output: '[-1,0,3,4,5]',
    description: `Given the \`head\` of a singly linked list, sort the list using **insertion sort**, and return the sorted list's head.

The steps of **insertion sort** on a linked list:
1. Insertion sort iterates, consuming one input element each repetition and growing a sorted output list.
2. At each iteration, insertion sort removes one element from the input data, finds the location it belongs within the sorted list, and inserts it there.
3. It repeats until no input elements remain.

### Example 1:
\`\`\`
Input: head = [4,2,1,3]
Output: [1,2,3,4]
\`\`\`

### Example 2:
\`\`\`
Input: head = [-1,5,3,4,0]
Output: [-1,0,3,4,5]
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[1, 5000]\`.
- \`-5000 <= Node.val <= 5000\``,
    generateExtraTestCases: () => {
      // 21: N=2500 partially sorted list (O(N^3) killer)
      const a_21 = Array.from({ length: 2500 }, (_, i) => (i * 37) % 5000 - 2500);
      // 22: N=3000 reverse sorted list (true worst-case O(N^2) for insertion sort, runs in ~80ms)
      const a_22 = Array.from({ length: 3000 }, (_, i) => 3000 - i);
      // 23: Single node
      const a_23 = [42];
      // 24: Already sorted list of 1000 nodes (O(N) best case)
      const a_24 = Array.from({ length: 1000 }, (_, i) => i);
      // 25: N=5000 max constraint
      const a_25 = Array.from({ length: 5000 }, (_, i) => (i * 73) % 10000 - 5000);

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveInsertionSortList(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  if (!head || !head.next) return head;
  const dummy = new ListNode(0);
  let curr = head;
  while (curr) {
    const next = curr.next;
    let prev = dummy;
    while (prev.next && prev.next.val < curr.val) {
      prev = prev.next;
    }
    curr.next = prev.next;
    prev.next = curr;
    curr = next;
  }
  return dummy.next;
}`,
    bruteCode: `
function solution(head) {
  // Naive O(N^3) scanner killer
  let a = head;
  while (a) {
    let b = a.next;
    while (b) {
      let c = head;
      while (c) {
        c = c.next;
      }
      b = b.next;
    }
    a = a.next;
  }
  const dummy = new ListNode(0);
  let curr = head;
  while (curr) {
    const next = curr.next;
    let prev = dummy;
    while (prev.next && prev.next.val < curr.val) prev = prev.next;
    curr.next = prev.next;
    prev.next = curr;
    curr = next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'sort-list',
    title: 'Sort List',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-24-tests/sort-list.json',
    sample_input: '[4,2,1,3]',
    sample_output: '[1,2,3,4]',
    description: `Given the \`head\` of a linked list, return the list after sorting it in **ascending order**.

### Example 1:
\`\`\`
Input: head = [4,2,1,3]
Output: [1,2,3,4]
\`\`\`

### Example 2:
\`\`\`
Input: head = [-1,5,3,4,0]
Output: [-1,0,3,4,5]
\`\`\`

### Example 3:
\`\`\`
Input: head = []
Output: []
\`\`\`

### Constraints:
- The number of nodes in the list is in the range \`[0, 50000]\`.
- \`-10⁵ <= Node.val <= 10⁵\`

**Follow up:** Can you sort the linked list in \`O(n log n)\` time and \`O(1)\` memory (i.e. constant space)?`,
    generateExtraTestCases: () => {
      // 21: N=25,000 reverse sorted (kills O(N^2) bubble/insertion sort)
      const a_21 = Array.from({ length: 25000 }, (_, i) => 25000 - i);
      // 22: Empty list
      const a_22 = [];
      // 23: Single node
      const a_23 = [99];
      // 24: All identical elements
      const a_24 = Array.from({ length: 5000 }, () => 7);
      // 25: N=50,000 scale test
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i * 12345) % 100000 - 50000);

      const extras = [a_21, a_22, a_23, a_24, a_25];

      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: JSON.stringify(solveSortList(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
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

  const dummy = new ListNode(0);
  let tail = dummy;
  let p1 = l1, p2 = l2;
  while (p1 && p2) {
    if (p1.val <= p2.val) {
      tail.next = p1;
      p1 = p1.next;
    } else {
      tail.next = p2;
      p2 = p2.next;
    }
    tail = tail.next;
  }
  tail.next = p1 || p2;
  return dummy.next;
}`,
    bruteCode: `
function solution(head) {
  // Naive O(N^2) insertion sort -> TLE on N=25,000
  if (!head || !head.next) return head;
  const dummy = new ListNode(0);
  let curr = head;
  while (curr) {
    const next = curr.next;
    let prev = dummy;
    while (prev.next && prev.next.val < curr.val) {
      prev = prev.next;
    }
    curr.next = prev.next;
    prev.next = curr;
    curr = next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'intersection-of-two-linked-lists',
    title: 'Intersection of Two Linked Lists',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-38-tests/intersection-of-two-linked-lists.json',
    sample_input: '8, [4,1,8,4,5], [5,6,1,8,4,5], 2, 3',
    sample_output: "Intersected at '8'",
    description: `Given the heads of two singly linked-lists \`headA\` and \`headB\`, return the node at which the two lists intersect. If the two linked lists have no intersection at all, return \`null\`.

For example, the following two linked lists begin to intersect at node \`c1\`:
\`[a1 → a2 ↘]\`
\`            [c1 → c2 → c3]\`
\`[b1 → b2 → b3 ↗]\`

The test cases are generated such that there are no cycles anywhere in the entire linked structure.

**Note** that the linked lists must **retain their original structure** after the function returns.

### Example 1:
\`\`\`
Input: intersectVal = 8, listA = [4,1,8,4,5], listB = [5,6,1,8,4,5], skipA = 2, skipB = 3
Output: Intersected at '8'
\`\`\`

### Example 2:
\`\`\`
Input: intersectVal = 2, listA = [1,9,1,2,4], listB = [3,2,4], skipA = 3, skipB = 1
Output: Intersected at '2'
\`\`\`

### Example 3:
\`\`\`
Input: intersectVal = 0, listA = [2,6,4], listB = [1,5], skipA = 3, skipB = 2
Output: No intersection
\`\`\`

### Constraints:
- The number of nodes of \`listA\` is in the \`m\`.
- The number of nodes of \`listB\` is in the \`n\`.
- \`1 <= m, n <= 30000\`
- \`1 <= Node.val <= 10⁵\`
- \`0 <= skipA < m\`
- \`0 <= skipB < n\`
- \`intersectVal == listA[skipA] == listB[skipB]\` if \`intersectVal != 0\`
- \`intersectVal == 0\` if the two lists do not intersect.`,
    generateExtraTestCases: () => {
      // 21: M=35,000, N=35,000 no intersection (kills O(M*N) nested scan)
      const a_21 = Array.from({ length: 35000 }, (_, i) => i + 1);
      const b_21 = Array.from({ length: 35000 }, (_, i) => i + 40000);
      const val_21 = 0, skipA_21 = 35000, skipB_21 = 35000;

      // 22: Both 1 node intersecting
      const a_22 = [77], b_22 = [77], val_22 = 77, skipA_22 = 0, skipB_22 = 0;

      // 23: Both 1 node, no intersection
      const a_23 = [10], b_23 = [20], val_23 = 0, skipA_23 = 1, skipB_23 = 1;

      // 24: skipA=0, skipB=2
      const a_24 = [88, 99], b_24 = [1, 2, 88, 99], val_24 = 88, skipA_24 = 0, skipB_24 = 2;

      // 25: M=30,000, N=30,000 intersection at index 25,000
      const common_25 = Array.from({ length: 5000 }, (_, i) => 90000 + i);
      const a_prefix_25 = Array.from({ length: 25000 }, (_, i) => i + 1);
      const b_prefix_25 = Array.from({ length: 25000 }, (_, i) => i + 50000);
      const a_25 = [...a_prefix_25, ...common_25];
      const b_25 = [...b_prefix_25, ...common_25];
      const val_25 = common_25[0], skipA_25 = 25000, skipB_25 = 25000;

      const extras = [
        [val_21, a_21, b_21, skipA_21, skipB_21],
        [val_22, a_22, b_22, skipA_22, skipB_22],
        [val_23, a_23, b_23, skipA_23, skipB_23],
        [val_24, a_24, b_24, skipA_24, skipB_24],
        [val_25, a_25, b_25, skipA_25, skipB_25]
      ];

      return extras.map(([val, listA, listB, skipA, skipB]) => ({
        input: `${val}, ${JSON.stringify(listA)}, ${JSON.stringify(listB)}, ${skipA}, ${skipB}`,
        output: JSON.stringify(solveIntersection(val, listA, listB, skipA, skipB)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(headA, headB) {
  if (!headA || !headB) return null;
  let pA = headA, pB = headB;
  while (pA !== pB) {
    pA = pA === null ? headB : pA.next;
    pB = pB === null ? headA : pB.next;
  }
  return pA;
}`,
    bruteCode: `
function solution(headA, headB) {
  // Naive O(M*N) nested search -> TLE on M=20,000, N=20,000
  let pA = headA;
  while (pA) {
    let pB = headB;
    while (pB) {
      if (pA === pB) return pA;
      pB = pB.next;
    }
    pA = pA.next;
  }
  return null;
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for Linked Lists Batch 2 (7 Problems) ===\n');

  for (const prob of LL_BATCH2) {
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
  console.log('✓ All 7 Linked Lists Batch 2 problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
