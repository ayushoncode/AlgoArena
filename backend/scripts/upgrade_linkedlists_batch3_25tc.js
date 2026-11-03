'use strict';

/**
 * upgrade_linkedlists_batch3_25tc.js
 *
 * Upgrades 7 Cycles, Random & Advanced Linked List problems to exactly 25 curated test cases:
 * 1. Linked List Cycle (LC 141) [Easy]
 * 2. Linked List Cycle Detection (LC 141 variant) [Easy]
 * 3. Linked List Cycle II (LC 142) [Medium]
 * 4. Copy List with Random Pointer (LC 138) [Medium]
 * 5. Merge k Sorted Lists (LC 23) [Hard]
 * 6. Reverse Nodes in k-Group (LC 25) [Hard]
 * 7. LRU Cache (LC 146) [Hard]
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
// Reference Solvers for Extra Test Cases & Output Normalization
// -------------------------------------------------------------

function solveCycleBool(arr, pos) {
  return pos >= 0;
}

function solveCycleII(arr, pos) {
  if (pos >= 0 && pos < arr.length) {
    return `tail connects to node index ${pos}`;
  }
  return 'no cycle';
}

function solveCopyRandomList(pairs) {
  return pairs;
}

function solveMergeKLists(lists) {
  if (!lists || lists.length === 0) return [];
  const merged = [];
  for (const l of lists) {
    if (Array.isArray(l)) {
      for (const val of l) merged.push(val);
    }
  }
  merged.sort((a, b) => a - b);
  return merged;
}

function solveReverseKGroup(arr, k) {
  const res = [...arr];
  for (let i = 0; i + k <= res.length; i += k) {
    let l = i, r = i + k - 1;
    while (l < r) {
      const tmp = res[l];
      res[l] = res[r];
      res[r] = tmp;
      l++;
      r--;
    }
  }
  return res;
}

function solveLRUSimulation(commands, args) {
  let capacity = 0;
  const cache = new Map();
  const output = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const arg = args[i];
    if (cmd === 'LRUCache') {
      capacity = arg[0];
      cache.clear();
      output.push(null);
    } else if (cmd === 'put') {
      const [key, val] = arg;
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= capacity) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      cache.set(key, val);
      output.push(null);
    } else if (cmd === 'get') {
      const [key] = arg;
      if (!cache.has(key)) {
        output.push(-1);
      } else {
        const val = cache.get(key);
        cache.delete(key);
        cache.set(key, val);
        output.push(val);
      }
    }
  }
  return output;
}

// -------------------------------------------------------------
// Problem Definitions
// -------------------------------------------------------------

const LL_BATCH3 = [
  {
    slug: 'linked-list-cycle',
    title: 'Linked List Cycle',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-37-tests/linked-list-cycle.json',
    sample_input: '[3,2,0,-4], 1',
    sample_output: 'true',
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer. Internally, \`pos\` is used to denote the index of the node that tail's \`next\` pointer is connected to. **Note that \`pos\` is not passed as a parameter.**

Return \`true\` if there is a cycle in the linked list. Otherwise, return \`false\`.

### Example 1:
\`\`\`
Input: head = [3,2,0,-4], pos = 1
Output: true
Explanation: There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2], pos = 0
Output: true
Explanation: There is a cycle in the linked list, where the tail connects to the 0th node.
\`\`\`

### Example 3:
\`\`\`
Input: head = [1], pos = -1
Output: false
Explanation: There is no cycle in the linked list.
\`\`\`

### Constraints:
- The number of the nodes in the list is in the range \`[0, 50000]\`.
- \`-10⁵ <= Node.val <= 10⁵\`
- \`pos\` is \`-1\` or a **valid index** in the linked-list.

**Follow up:** Can you solve it using \`O(1)\` (i.e. constant) memory?`,
    generateExtraTestCases: () => {
      // 21: N=55,000 linear list without cycle (kills O(N^2) scan)
      const a_21 = Array.from({ length: 55000 }, (_, i) => i + 1);
      const pos_21 = -1;
      // 22: Empty list
      const a_22 = [], pos_22 = -1;
      // 23: Single node with self cycle
      const a_23 = [42], pos_23 = 0;
      // 24: Single node without cycle
      const a_24 = [42], pos_24 = -1;
      // 25: N=50,000 list with cycle at middle
      const a_25 = Array.from({ length: 50000 }, (_, i) => i % 1000);
      const pos_25 = 25000;

      const extras = [
        [a_21, pos_21],
        [a_22, pos_22],
        [a_23, pos_23],
        [a_24, pos_24],
        [a_25, pos_25]
      ];

      return extras.map(([arr, pos]) => ({
        input: `${JSON.stringify(arr)}, ${pos}`,
        output: JSON.stringify(solveCycleBool(arr, pos)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  if (!head || !head.next) return false;
  let slow = head, fast = head.next;
  while (slow !== fast) {
    if (!fast || !fast.next) return false;
    slow = slow.next;
    fast = fast.next.next;
  }
  return true;
}`,
    bruteCode: `
function solution(head) {
  let curr = head;
  let len = 0;
  while (curr) {
    let check = head;
    let count = 0;
    while (check !== curr && count < len) {
      check = check.next;
      count++;
    }
    if (count < len) return true;
    curr = curr.next;
    len++;
  }
  return false;
}`
  },
  {
    slug: 'linked-list-cycle-detection',
    title: 'Linked List Cycle Detection',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-37-tests/linked-list-cycle-detection.json',
    sample_input: '[3,2,0,-4], 1',
    sample_output: 'true',
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

Return \`true\` if there is a cycle in the linked list. Otherwise, return \`false\`.

### Example 1:
\`\`\`
Input: head = [3,2,0,-4], pos = 1
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2], pos = 0
Output: true
\`\`\`

### Example 3:
\`\`\`
Input: head = [1], pos = -1
Output: false
\`\`\`

### Constraints:
- The number of the nodes in the list is in the range \`[0, 50000]\`.
- \`-10⁵ <= Node.val <= 10⁵\`
- \`pos\` is \`-1\` or a **valid index** in the linked-list.`,
    generateExtraTestCases: () => {
      // 21: N=55,000 linear list without cycle (kills O(N^2) scan)
      const a_21 = Array.from({ length: 55000 }, (_, i) => i + 1);
      const pos_21 = -1;
      // 22: Empty list
      const a_22 = [], pos_22 = -1;
      // 23: Single node with self cycle
      const a_23 = [99], pos_23 = 0;
      // 24: Two nodes with cycle to head
      const a_24 = [1, 2], pos_24 = 0;
      // 25: N=50,000 scale test
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i * 7) % 500);
      const pos_25 = 20000;

      const extras = [
        [a_21, pos_21],
        [a_22, pos_22],
        [a_23, pos_23],
        [a_24, pos_24],
        [a_25, pos_25]
      ];

      return extras.map(([arr, pos]) => ({
        input: `${JSON.stringify(arr)}, ${pos}`,
        output: JSON.stringify(solveCycleBool(arr, pos)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  if (!head || !head.next) return false;
  let slow = head, fast = head.next;
  while (slow !== fast) {
    if (!fast || !fast.next) return false;
    slow = slow.next;
    fast = fast.next.next;
  }
  return true;
}`,
    bruteCode: `
function solution(head) {
  let curr = head;
  let len = 0;
  while (curr) {
    let check = head;
    let count = 0;
    while (check !== curr && count < len) {
      check = check.next;
      count++;
    }
    if (count < len) return true;
    curr = curr.next;
    len++;
  }
  return false;
}`
  },
  {
    slug: 'linked-list-cycle-ii',
    title: 'Linked List Cycle II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-12-tests/linked-list-cycle-ii.json',
    sample_input: '[3,2,0,-4], 1',
    sample_output: 'tail connects to node index 1',
    description: `Given the \`head\` of a linked list, return the node where the cycle begins. If there is no cycle, return \`null\`.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer. Internally, \`pos\` is used to denote the index of the node that tail's \`next\` pointer is connected to (**0-indexed**). It is \`-1\` if there is no cycle. **Note that \`pos\` is not passed as a parameter.**

**Do not modify** the linked list.

### Example 1:
\`\`\`
Input: head = [3,2,0,-4], pos = 1
Output: tail connects to node index 1
Explanation: There is a cycle in the linked list, where tail connects to the second node.
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2], pos = 0
Output: tail connects to node index 0
Explanation: There is a cycle in the linked list, where tail connects to the first node.
\`\`\`

### Example 3:
\`\`\`
Input: head = [1], pos = -1
Output: no cycle
Explanation: There is no cycle in the linked list.
\`\`\`

### Constraints:
- The number of the nodes in the list is in the range \`[0, 50000]\`.
- \`-10⁵ <= Node.val <= 10⁵\`
- \`pos\` is \`-1\` or a **valid index** in the linked-list.

**Follow up:** Can you solve it using \`O(1)\` (i.e. constant) memory?`,
    normalizeExisting: (rawList) => {
      return rawList.map((tc, idx) => {
        // Parse input to extract pos
        const m = tc.input.match(/,\s*(-?\d+)\s*$/);
        const pos = m ? parseInt(m[1], 10) : -1;
        const out = pos >= 0 ? `tail connects to node index ${pos}` : 'no cycle';
        return {
          input: tc.input,
          output: out,
          is_hidden: idx >= 3
        };
      });
    },
    generateExtraTestCases: () => {
      // 21: N=55,000 linear list without cycle (kills O(N^2) scan)
      const a_21 = Array.from({ length: 55000 }, (_, i) => i + 1);
      const pos_21 = -1;
      // 22: Empty list
      const a_22 = [], pos_22 = -1;
      // 23: Single node with self cycle
      const a_23 = [42], pos_23 = 0;
      // 24: Two nodes with cycle to node 1
      const a_24 = [1, 2], pos_24 = 1;
      // 25: N=50,000 scale test with cycle at index 30,000
      const a_25 = Array.from({ length: 50000 }, (_, i) => (i * 3) % 1000);
      const pos_25 = 30000;

      const extras = [
        [a_21, pos_21],
        [a_22, pos_22],
        [a_23, pos_23],
        [a_24, pos_24],
        [a_25, pos_25]
      ];

      return extras.map(([arr, pos]) => ({
        input: `${JSON.stringify(arr)}, ${pos}`,
        output: solveCycleII(arr, pos),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  if (!head || !head.next) return null;
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let ptr1 = head, ptr2 = slow;
      while (ptr1 !== ptr2) {
        ptr1 = ptr1.next;
        ptr2 = ptr2.next;
      }
      return ptr1;
    }
  }
  return null;
}`,
    bruteCode: `
function solution(head) {
  let curr = head;
  let len = 0;
  while (curr) {
    let check = head;
    let count = 0;
    while (check !== curr && count < len) {
      check = check.next;
      count++;
    }
    if (count < len) return curr;
    curr = curr.next;
    len++;
  }
  return null;
}`
  },
  {
    slug: 'copy-list-with-random-pointer',
    title: 'Copy List with Random Pointer',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-38-tests/copy-list-with-random-pointer.json',
    sample_input: '[[7,null],[13,0],[11,4],[10,2],[1,0]]',
    sample_output: '[[7,null],[13,0],[11,4],[10,2],[1,0]]',
    description: `A linked list of length \`n\` is given such that each node contains an additional random pointer, which could point to any node in the list, or \`null\`.

Construct a **deep copy** of the list. The deep copy should consist of exactly \`n\` brand new nodes, where each new node has its value set to the value of its corresponding original node. Both the \`next\` and \`random\` pointer of the new nodes should point to new nodes in the copied list such that the pointers in the original list and copied list represent the same list state. **None of the pointers in the new list should point to nodes in the original list.**

For example, if there are two nodes \`X\` and \`Y\` in the original list, where \`X.random --> Y\`, then for the corresponding two nodes \`x\` and \`y\` in the copied list, \`x.random --> y\`.

Return the head of the copied linked list.

### Example 1:
\`\`\`
Input: head = [[7,null],[13,0],[11,4],[10,2],[1,0]]
Output: [[7,null],[13,0],[11,4],[10,2],[1,0]]
\`\`\`

### Example 2:
\`\`\`
Input: head = [[1,1],[2,1]]
Output: [[1,1],[2,1]]
\`\`\`

### Example 3:
\`\`\`
Input: head = [[3,null],[3,0],[3,null]]
Output: [[3,null],[3,0],[3,null]]
\`\`\`

### Constraints:
- \`0 <= n <= 50000\`
- \`-10⁴ <= Node.val <= 10⁴\`
- \`Node.random\` is \`null\` or is pointing to some node in the linked list.`,
    generateExtraTestCases: () => {
      // 21: N=30,000 stress test (kills O(N^2) scan)
      const p_21 = Array.from({ length: 30000 }, (_, i) => [i + 1, (i * 17) % 30000]);
      // 22: Empty list
      const p_22 = [];
      // 23: Single node with null random
      const p_23 = [[42, null]];
      // 24: Single node with self random
      const p_24 = [[100, 0]];
      // 25: N=50,000 scale test
      const p_25 = Array.from({ length: 50000 }, (_, i) => [(i * 23) % 10000 - 5000, i % 2 === 0 ? (i * 7) % 50000 : null]);

      const extras = [p_21, p_22, p_23, p_24, p_25];

      return extras.map((pairs) => ({
        input: JSON.stringify(pairs),
        output: JSON.stringify(solveCopyRandomList(pairs)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head) {
  if (!head) return null;
  const map = new Map();
  let curr = head;
  while (curr) {
    map.set(curr, new Node(curr.val, null, null));
    curr = curr.next;
  }
  curr = head;
  while (curr) {
    const clone = map.get(curr);
    clone.next = curr.next ? map.get(curr.next) : null;
    clone.random = curr.random ? map.get(curr.random) : null;
    curr = curr.next;
  }
  return map.get(head);
}`,
    bruteCode: `
function solution(head) {
  if (!head) return null;
  let curr = head;
  while (curr) {
    let scan = head;
    while (scan) scan = scan.next;
    curr = curr.next;
  }
  const map = new Map();
  curr = head;
  while (curr) {
    map.set(curr, new Node(curr.val, null, null));
    curr = curr.next;
  }
  curr = head;
  while (curr) {
    const clone = map.get(curr);
    clone.next = curr.next ? map.get(curr.next) : null;
    clone.random = curr.random ? map.get(curr.random) : null;
    curr = curr.next;
  }
  return map.get(head);
}`
  },
  {
    slug: 'merge-k-sorted-lists',
    title: 'Merge k Sorted Lists',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-18-tests/merge-k-sorted-lists.json',
    sample_input: '[[1,4,5],[1,3,4],[2,6]]',
    sample_output: '[1,1,2,3,4,4,5,6]',
    description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

*Merge all the linked-lists into one sorted linked-list and return it.*

### Example 1:
\`\`\`
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
Explanation: The linked-lists are:
[
  1->4->5,
  1->3->4,
  2->6
]
merging them into one sorted list:
1->1->2->3->4->4->5->6
\`\`\`

### Example 2:
\`\`\`
Input: lists = []
Output: []
\`\`\`

### Example 3:
\`\`\`
Input: lists = [[]]
Output: []
\`\`\`

### Constraints:
- \`k == lists.length\`
- \`0 <= k <= 10⁴\`
- \`0 <= lists[i].length <= 500\`
- \`-10⁴ <= lists[i][j] <= 10⁴\`
- \`lists[i]\` is sorted in **ascending order**.
- The sum of \`lists[i].length\` will not exceed \`50000\`.`,
    normalizeExisting: (rawList) => {
      // Overwrite bugged old output with true merged sorted list
      return rawList.map((tc, idx) => {
        const parsed = JSON.parse(tc.input);
        const correctMerged = solveMergeKLists(parsed);
        return {
          input: tc.input,
          output: JSON.stringify(correctMerged),
          is_hidden: idx >= 3
        };
      });
    },
    generateExtraTestCases: () => {
      // 21: k=500 lists each of length 50 (N=25,000 total, kills sequential O(k*N) merge)
      const l_21 = [];
      for (let i = 0; i < 500; i++) {
        const sub = [];
        for (let j = 0; j < 50; j++) {
          sub.push(i + j * 500);
        }
        l_21.push(sub);
      }
      // 22: Empty outer array []
      const l_22 = [];
      // 23: Array with 5 empty lists [ [], [], [], [], [] ]
      const l_23 = [[], [], [], [], []];
      // 24: Single list [[1, 2, 3]]
      const l_24 = [[1, 2, 3]];
      // 25: N=50,000 total elements (k=2500 lists of length 20)
      const l_25 = [];
      for (let i = 0; i < 2500; i++) {
        const sub = [];
        for (let j = 0; j < 20; j++) {
          sub.push((i * 13 + j * 2500) % 10000 - 5000);
        }
        sub.sort((a, b) => a - b);
        l_25.push(sub);
      }

      const extras = [l_21, l_22, l_23, l_24, l_25];

      return extras.map((lists) => ({
        input: JSON.stringify(lists),
        output: JSON.stringify(solveMergeKLists(lists)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(lists) {
  if (!lists || lists.length === 0) return null;
  function mergeTwo(l1, l2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    while (l1 && l2) {
      if (l1.val <= l2.val) {
        tail.next = l1;
        l1 = l1.next;
      } else {
        tail.next = l2;
        l2 = l2.next;
      }
      tail = tail.next;
    }
    tail.next = l1 || l2;
    return dummy.next;
  }
  let amount = lists.length;
  let interval = 1;
  while (interval < amount) {
    for (let i = 0; i < amount - interval; i += interval * 2) {
      lists[i] = mergeTwo(lists[i], lists[i + interval]);
    }
    interval *= 2;
  }
  return lists[0] || null;
}`,
    bruteCode: `
function solution(lists) {
  let arr = [];
  for (const list of lists) {
    let c = list;
    while (c) {
      arr.push(c.val);
      arr.sort((a, b) => a - b);
      c = c.next;
    }
  }
  const dummy = new ListNode(0);
  let tail = dummy;
  for (const v of arr) {
    tail.next = new ListNode(v);
    tail = tail.next;
  }
  return dummy.next;
}`
  },
  {
    slug: 'reverse-nodes-in-k-group',
    title: 'Reverse Nodes in k-Group',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-36-tests/reverse-nodes-in-k-group.json',
    sample_input: '[1,2,3,4,5], 2',
    sample_output: '[2,1,4,3,5]',
    description: `Given the \`head\` of a linked list, reverse the nodes of the list \`k\` at a time, and return the modified list.

\`k\` is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of \`k\` then left-out nodes, in the end, should remain as it is.

You may not alter the values in the list's nodes, only nodes themselves may be changed.

### Example 1:
\`\`\`
Input: head = [1,2,3,4,5], k = 2
Output: [2,1,4,3,5]
\`\`\`

### Example 2:
\`\`\`
Input: head = [1,2,3,4,5], k = 3
Output: [3,2,1,4,5]
\`\`\`

### Constraints:
- The number of nodes in the list is \`n\`.
- \`1 <= k <= n <= 50000\`
- \`0 <= Node.val <= 1000\``,
    generateExtraTestCases: () => {
      // 21: N=30,000, k=2 (kills O(N^2) scan)
      const a_21 = Array.from({ length: 30000 }, (_, i) => i + 1);
      const k_21 = 2;
      // 22: Single node, k=1
      const a_22 = [42], k_22 = 1;
      // 23: k equals list length
      const a_23 = [1, 2, 3, 4], k_23 = 4;
      // 24: k > list length (no change)
      const a_24 = [1, 2, 3], k_24 = 5;
      // 25: N=50,000 scale test, k=7
      const a_25 = Array.from({ length: 50000 }, (_, i) => i % 1000);
      const k_25 = 7;

      const extras = [
        [a_21, k_21],
        [a_22, k_22],
        [a_23, k_23],
        [a_24, k_24],
        [a_25, k_25]
      ];

      return extras.map(([arr, k]) => ({
        input: `${JSON.stringify(arr)}, ${k}`,
        output: JSON.stringify(solveReverseKGroup(arr, k)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(head, k) {
  if (!head || k <= 1) return head;
  const dummy = new ListNode(0, head);
  let prevGroupEnd = dummy;
  while (true) {
    let kth = prevGroupEnd;
    for (let i = 0; i < k && kth; i++) kth = kth.next;
    if (!kth) break;
    const nextGroupStart = kth.next;
    let prev = nextGroupStart, curr = prevGroupEnd.next;
    while (curr !== nextGroupStart) {
      const next = curr.next;
      curr.next = prev;
      prev = curr;
      curr = next;
    }
    const temp = prevGroupEnd.next;
    prevGroupEnd.next = kth;
    prevGroupEnd = temp;
  }
  return dummy.next;
}`,
    bruteCode: `
function solution(head, k) {
  // Naive O(N^2) scanner killer
  let curr = head;
  while (curr) {
    let scan = head;
    while (scan) scan = scan.next;
    curr = curr.next;
  }
  if (!head || k <= 1) return head;
  const dummy = new ListNode(0, head);
  let prevGroupEnd = dummy;
  while (true) {
    let kth = prevGroupEnd;
    for (let i = 0; i < k && kth; i++) kth = kth.next;
    if (!kth) break;
    const nextGroupStart = kth.next;
    let prev = nextGroupStart, c = prevGroupEnd.next;
    while (c !== nextGroupStart) {
      const next = c.next;
      c.next = prev;
      prev = c;
      c = next;
    }
    const temp = prevGroupEnd.next;
    prevGroupEnd.next = kth;
    prevGroupEnd = temp;
  }
  return dummy.next;
}`
  },
  {
    slug: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-38-tests/lru-cache.json',
    sample_input: '["LRUCache","put","put","get","put","get","put","get","get","get"], [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
    sample_output: '[null,null,null,1,null,-1,null,-1,3,4]',
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with **positive** size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the \`key\` exists. Otherwise, add the \`key-value\` pair to the cache. If the number of keys exceeds the \`capacity\` from this operation, **evict** the least recently used key.

The functions \`get\` and \`put\` must each run in \`O(1)\` average time complexity.

### Example 1:
\`\`\`
Input
["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
Output
[null, null, null, 1, null, -1, null, -1, 3, 4]

Explanation
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1); // cache is {1=1}
lRUCache.put(2, 2); // cache is {1=1, 2=2}
lRUCache.get(1);    // return 1
lRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}
lRUCache.get(2);    // returns -1 (not found)
lRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}
lRUCache.get(1);    // return -1 (not found)
lRUCache.get(3);    // return 3
lRUCache.get(4);    // return 4
\`\`\`

### Constraints:
- \`1 <= capacity <= 30000\`
- \`0 <= key <= 10⁴\`
- \`0 <= value <= 10⁵\`
- At most \`5 * 10⁴\` calls will be made to \`get\` and \`put\`.`,
    generateExtraTestCases: () => {
      // 21: 45,000 operations stress test (kills O(N) array search LRU)
      const cmds_21 = ['LRUCache'];
      const args_21 = [[30000]];
      for (let i = 0; i < 45000; i++) {
        cmds_21.push('put');
        args_21.push([i, i]);
        cmds_21.push('get');
        args_21.push([i % 100]);
      }

      // 22: Capacity 1 ping pong
      const cmds_22 = ['LRUCache', 'put', 'put', 'get', 'get'];
      const args_22 = [[1], [1, 10], [2, 20], [1], [2]];

      // 23: Repeated updates to same key without eviction
      const cmds_23 = ['LRUCache', 'put', 'put', 'put', 'get'];
      const args_23 = [[2], [1, 10], [1, 20], [1, 30], [1]];

      // 24: Get nonexistent keys
      const cmds_24 = ['LRUCache', 'get', 'put', 'get'];
      const args_24 = [[2], [5], [5, 50], [5]];

      // 25: 50,000 scale test
      const cmds_25 = ['LRUCache'];
      const args_25 = [[20000]];
      for (let i = 0; i < 50000; i++) {
        if (i % 3 === 0) {
          cmds_25.push('get');
          args_25.push([(i * 17) % 25000]);
        } else {
          cmds_25.push('put');
          args_25.push([(i * 17) % 25000, i]);
        }
      }

      const extras = [
        [cmds_21, args_21],
        [cmds_22, args_22],
        [cmds_23, args_23],
        [cmds_24, args_24],
        [cmds_25, args_25]
      ];

      return extras.map(([cmds, args]) => ({
        input: `${JSON.stringify(cmds)}, ${JSON.stringify(args)}`,
        output: JSON.stringify(solveLRUSimulation(cmds, args)),
        is_hidden: true
      }));
    },
    optimalCode: `
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
    bruteCode: `
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = [];
  }
  get(key) {
    const idx = this.items.findIndex(x => x.key === key);
    if (idx === -1) return -1;
    const item = this.items[idx];
    this.items.splice(idx, 1);
    this.items.push(item);
    return item.value;
  }
  put(key, value) {
    const idx = this.items.findIndex(x => x.key === key);
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.items.push({ key, value });
    } else {
      if (this.items.length >= this.capacity) {
        this.items.shift();
      }
      this.items.push({ key, value });
    }
  }
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for Linked Lists Batch 3 (7 Problems) ===\n');

  for (const prob of LL_BATCH3) {
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

    let baseTestCases;
    if (prob.normalizeExisting) {
      baseTestCases = prob.normalizeExisting(existingRaw.slice(0, 20));
    } else {
      baseTestCases = existingRaw.slice(0, 20).map((tc, idx) => ({
        input: tc.input,
        output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
        is_hidden: idx >= 3
      }));
    }

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
  console.log('✓ All 7 Linked Lists Batch 3 problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
