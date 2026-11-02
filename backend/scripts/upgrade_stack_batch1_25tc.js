/**
 * backend/scripts/upgrade_stack_batch1_25tc.js
 *
 * Upgrades the 5 Stack problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with comprehensive edge cases and upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) / O(N^3) brute-force solutions with TLE (> 2000ms).
 *
 * Problems:
 * 1. Largest Rectangle in Histogram (largest-rectangle-in-histogram) [LC 84]
 * 2. Valid Parentheses (valid-parentheses) [LC 20]
 * 3. Longest Valid Parentheses (longest-valid-parentheses) [LC 32]
 * 4. Evaluate Reverse Polish Notation (evaluate-reverse-polish-notation) [LC 150]
 * 5. Simplify Path (simplify-path) [LC 71]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

// Reference Solvers
function solveLargestRectangleArea(heights) {
  const stack = [];
  let maxArea = 0;
  const n = heights.length;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }
  return maxArea;
}

function solveValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '{' || c === '[') {
      stack.push(c);
    } else {
      if (!stack.length || stack.pop() !== map[c]) return false;
    }
  }
  return stack.length === 0;
}

function solveLongestValidParentheses(s) {
  let maxLen = 0;
  const stack = [-1];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i);
    } else {
      stack.pop();
      if (stack.length === 0) {
        stack.push(i);
      } else {
        maxLen = Math.max(maxLen, i - stack[stack.length - 1]);
      }
    }
  }
  return maxLen;
}

function solveEvalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop();
      const a = stack.pop();
      let res = 0;
      if (t === '+') res = a + b;
      else if (t === '-') res = a - b;
      else if (t === '*') res = Math.trunc(a * b);
      else if (t === '/') res = Math.trunc(a / b);
      stack.push(res);
    } else {
      stack.push(Number(t));
    }
  }
  return stack[0];
}

function solveSimplifyPath(filePath) {
  const parts = filePath.split('/');
  const stack = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') {
      if (stack.length) stack.pop();
    } else {
      stack.push(p);
    }
  }
  return '/' + stack.join('/');
}

// -------------------------------------------------------------
// Generators for 25 Test Cases Each
// -------------------------------------------------------------

function generateLargestRectangleHistogramTestCases() {
  const tcs = [
    // 1-5: Basic & LeetCode examples
    [2, 1, 5, 6, 2, 3],
    [2, 4],
    [1],
    [0],
    [5, 5, 5, 5],

    // 6-10: Edge shapes
    [1, 2, 3, 4, 5],
    [5, 4, 3, 2, 1],
    [0, 0, 0, 0],
    [2, 0, 2],
    [1, 2, 3, 2, 1],

    // 11-15: Varied peaks & valleys
    [3, 6, 5, 7, 4, 8, 1, 0],
    [10, 1, 10, 1, 10],
    [100, 100, 1, 100, 100],
    [0, 9, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

    // 16-20: Medium scale
    Array.from({ length: 50 }, (_, i) => (i % 5) + 1),
    Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 10 : 2)),
    Array.from({ length: 200 }, () => 1000),
    Array.from({ length: 500 }, (_, i) => i + 1),
    Array.from({ length: 500 }, (_, i) => 500 - i),

    // 21-24: Upper medium scale
    Array.from({ length: 2000 }, (_, i) => ((i * 17) % 100) + 1),
    Array.from({ length: 5000 }, () => 50),
    Array.from({ length: 10000 }, (_, i) => (i % 10 === 0 ? 1 : 100)),
    Array.from({ length: 20000 }, (_, i) => (i % 2 === 0 ? 500 : 499)),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2)
    Array.from({ length: 75000 }, (_, i) => (i % 1000) + 1)
  ];

  return tcs.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: String(solveLargestRectangleArea(arr)),
    is_hidden: idx >= 3
  }));
}

function generateValidParenthesesTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    '()',
    '()[]{}',
    '(]',
    '([])',
    '([)]',

    // 6-10: Single chars & small unbalanced
    '(',
    ')',
    '[',
    ']',
    '{',

    // 11-15: Edge combinations
    '}{',
    '][',
    ')(',
    '((((',
    '))))',

    // 16-20: Deep nesting & long alternating
    '{[]}',
    '((({{{[[[]]]}}})))',
    '()'.repeat(100),
    '([]{})'.repeat(50),
    '('.repeat(100) + ')'.repeat(99) + ']',

    // 21-24: Large scale
    '('.repeat(2000) + ')'.repeat(2000),
    '()[]{}'.repeat(1000),
    '{[()]}'.repeat(1500),
    '('.repeat(10000) + ')'.repeat(10000),

    // 25: Massive Stress Test (N = 85,000) - regex while(s.includes) O(N^2) will TLE
    '('.repeat(42500) + ')'.repeat(42500)
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveValidParentheses(str)),
    is_hidden: idx >= 3
  }));
}

function generateLongestValidParenthesesTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    '(()',
    ')()())',
    '',
    '()',
    '()()',

    // 6-10: No valid substrings or single chars
    '(',
    ')',
    '(((',
    ')))',
    ')(',

    // 11-15: Compound patterns
    '()(()',
    '(()(((()',
    '((()))',
    '()(())',
    ')()())()()(',

    // 16-20: Medium scale
    '()'.repeat(50),
    '('.repeat(50) + ')'.repeat(50),
    ')('.repeat(50),
    '()'.repeat(100) + '('.repeat(50),
    ')'.repeat(50) + '()'.repeat(100),

    // 21-24: Large scale
    '()'.repeat(2500),
    '('.repeat(5000) + ')'.repeat(5000),
    (')'.repeat(10) + '()'.repeat(2000) + '('.repeat(10)),
    '()'.repeat(10000),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2) brute force
    '('.repeat(37500) + ')'.repeat(37500)
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveLongestValidParentheses(str)),
    is_hidden: idx >= 3
  }));
}

function generateEvalRPNTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    ['2', '1', '+', '3', '*'],
    ['4', '13', '5', '/', '+'],
    ['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+'],
    ['3'],
    ['-4'],

    // 6-10: Negative numbers and truncation
    ['4', '3', '-'],
    ['3', '4', '-'],
    ['7', '-2', '/'],
    ['-7', '2', '/'],
    ['-7', '-2', '/'],

    // 11-15: Multi-operator sequences
    ['2', '3', '+', '4', '*', '5', '-'],
    ['5', '1', '2', '+', '4', '*', '+', '3', '-'],
    ['1', '2', '+', '3', '+', '4', '+', '5', '+'],
    ['100', '2', '/', '5', '/', '2', '/'],
    ['0', '3', '/'],

    // 16-20: Medium scale chains
    Array.from({ length: 50 }, (_, i) => String(i + 1)).concat(Array.from({ length: 49 }, () => '+')),
    Array.from({ length: 100 }, (_, i) => String(i + 1)).concat(Array.from({ length: 99 }, () => '+')),
    ['2', '3', '*'].concat(Array.from({ length: 100 }, () => ['1', '+']).flat()),
    ['1000', '2', '-'].concat(Array.from({ length: 150 }, () => ['0', '+']).flat()),
    Array.from({ length: 300 }, () => '1').concat(Array.from({ length: 299 }, () => '+')),

    // 21-24: Upper scale
    Array.from({ length: 2000 }, () => '2').concat(Array.from({ length: 1999 }, () => '+')),
    Array.from({ length: 5000 }, () => '1').concat(Array.from({ length: 4999 }, () => '+')),
    Array.from({ length: 10000 }, () => '1').concat(Array.from({ length: 9999 }, () => '+')),
    Array.from({ length: 20000 }, () => '1').concat(Array.from({ length: 19999 }, () => '+')),

    // 25: Massive stress test (N = 50,000 tokens) - array.splice O(N^2) will TLE
    Array.from({ length: 25000 }, () => '1').concat(Array.from({ length: 24999 }, () => '+'))
  ];

  return tcs.map((tokens, idx) => ({
    input: JSON.stringify(tokens),
    output: String(solveEvalRPN(tokens)),
    is_hidden: idx >= 3
  }));
}

function generateSimplifyPathTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    '/home/',
    '/../',
    '/home//foo/',
    '/a/./b/../../c/',
    '/a/../../b/../c//.//',

    // 6-10: Edge cases
    '/',
    '///',
    '/a/test/b/../dir//./..//home/.././user/user//',
    '/.../',
    '/...hidden',

    // 11-15: Directory dots
    '/..hidden',
    '/hello./world',
    '/a/b/c/d/../../e',
    '/a/b/c/../../../',
    '/x/y/../../z/',

    // 16-20: Repeated structures
    '/a/b'.repeat(20) + '/',
    '/' + Array.from({ length: 30 }, (_, i) => `dir${i}`).join('/') + '/../..',
    '/' + Array.from({ length: 50 }, () => 'a/..').join(''),
    '/' + Array.from({ length: 100 }, (_, i) => `folder${i}`).join('/'),
    '/' + Array.from({ length: 200 }, () => '.').join('/'),

    // 21-24: Large scale
    '/' + Array.from({ length: 2000 }, (_, i) => `folder${i}`).join('/'),
    '/' + Array.from({ length: 3000 }, () => 'sub/..').join('/'),
    '/' + Array.from({ length: 5000 }, (_, i) => (i % 2 === 0 ? 'node' : '..')).join('/'),
    '/' + Array.from({ length: 10000 }, (_, i) => `f${i}`).join('/'),

    // 25: Massive stress test (N = 50,000 segments)
    '/' + Array.from({ length: 50000 }, (_, i) => (i % 3 === 0 ? 'dir' : i % 3 === 1 ? '..' : '.')).join('/')
  ];

  return tcs.map((p, idx) => ({
    input: JSON.stringify(p),
    output: solveSimplifyPath(p),
    is_hidden: idx >= 3
  }));
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const STACK_PROBLEMS = [
  {
    slug: 'largest-rectangle-in-histogram',
    title: 'Largest Rectangle in Histogram',
    difficulty: 'hard',
    description: `Given an array of integers \`heights\` representing the histogram's bar height where the width of each bar is \`1\`, return *the area of the largest rectangle in the histogram*.

### Example 1:
\`\`\`
Input: heights = [2,1,5,6,2,3]
Output: 10
Explanation: The above is a histogram where width of each bar is 1.
The largest rectangle is shown in the red area, which has an area = 10 units (height 5, width 2: indices 2 and 3).
\`\`\`

### Example 2:
\`\`\`
Input: heights = [2,4]
Output: 4
Explanation: The largest rectangle has an area of 4 (height 4, width 1, or height 2, width 2).
\`\`\`

### Constraints:
- \`1 <= heights.length <= 10^5\`
- \`0 <= heights[i] <= 10^4\`
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '[2,1,5,6,2,3]',
    sample_output: '10',
    generator: generateLargestRectangleHistogramTestCases,
    optimalCode: `
function solution(heights) {
  const stack = [];
  let maxArea = 0;
  const n = heights.length;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      maxArea = Math.max(maxArea, height * width);
    }
    stack.push(i);
  }
  return maxArea;
}`,
    bruteCode: `
function solution(heights) {
  let maxArea = 0;
  for (let i = 0; i < heights.length; i++) {
    let minH = heights[i];
    for (let j = i; j < heights.length; j++) {
      if (heights[j] < minH) minH = heights[j];
      let area = minH * (j - i + 1);
      if (area > maxArea) maxArea = area;
    }
  }
  return maxArea;
}`
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
\`\`\`
Input: s = "()"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 3:
\`\`\`
Input: s = "(]"
Output: false
\`\`\`

### Example 4:
\`\`\`
Input: s = "([])"
Output: true
\`\`\`

### Constraints:
- \`1 <= s.length <= 10^5\`
- \`s\` consists of parentheses only \`'()[]{}'\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '"()"',
    sample_output: 'true',
    generator: generateValidParenthesesTestCases,
    optimalCode: `
function solution(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '{' || c === '[') {
      stack.push(c);
    } else {
      if (!stack.length || stack.pop() !== map[c]) return false;
    }
  }
  return stack.length === 0;
}`,
    bruteCode: `
function solution(s) {
  while (s.includes("()") || s.includes("[]") || s.includes("{}")) {
    s = s.replace("()", "").replace("[]", "").replace("{}", "");
  }
  return s.length === 0;
}`
  },
  {
    slug: 'longest-valid-parentheses',
    title: 'Longest Valid Parentheses',
    difficulty: 'hard',
    description: `Given a string containing just the characters \`'('\` and \`')'\`, return *the length of the longest valid (well-formed) parentheses substring*.

### Example 1:
\`\`\`
Input: s = "(()"
Output: 2
Explanation: The longest valid parentheses substring is "()".
\`\`\`

### Example 2:
\`\`\`
Input: s = ")()())"
Output: 4
Explanation: The longest valid parentheses substring is "()()".
\`\`\`

### Example 3:
\`\`\`
Input: s = ""
Output: 0
\`\`\`

### Constraints:
- \`0 <= s.length <= 10^5\`
- \`s[i]\` is \`'('\`, or \`')'\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\` or \`O(N)\``,
    sample_input: '"(()"',
    sample_output: '2',
    generator: generateLongestValidParenthesesTestCases,
    optimalCode: `
function solution(s) {
  let maxLen = 0;
  const stack = [-1];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i);
    } else {
      stack.pop();
      if (stack.length === 0) {
        stack.push(i);
      } else {
        maxLen = Math.max(maxLen, i - stack[stack.length - 1]);
      }
    }
  }
  return maxLen;
}`,
    bruteCode: `
function solution(s) {
  function isValid(sub) {
    let bal = 0;
    for (let c of sub) {
      if (c === '(') bal++;
      else bal--;
      if (bal < 0) return false;
    }
    return bal === 0;
  }
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 2; j <= s.length; j += 2) {
      if (isValid(s.slice(i, j))) {
        maxLen = Math.max(maxLen, j - i);
      }
    }
  }
  return maxLen;
}`
  },
  {
    slug: 'evaluate-reverse-polish-notation',
    title: 'Evaluate Reverse Polish Notation',
    difficulty: 'medium',
    description: `You are given an array of strings \`tokens\` that represents an arithmetic expression in a **Reverse Polish Notation** (Postfix notation).

Evaluate the expression. Return *an integer that represents the value of the expression*.

**Note that:**
- The valid operators are \`'+'\`, \`'-'\`, \`'*'\`, and \`'/'\`.
- Each operand may be an integer or another expression.
- The division between two integers always **truncates toward zero**.
- There will not be any division by zero.
- The input represents a valid arithmetic expression in a reverse polish notation.
- The answer and all the intermediate calculations can be represented in a **32-bit** integer.

### Example 1:
\`\`\`
Input: tokens = ["2","1","+","3","*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9
\`\`\`

### Example 2:
\`\`\`
Input: tokens = ["4","13","5","/","+"]
Output: 6
Explanation: (4 + (13 / 5)) = 6
\`\`\`

### Example 3:
\`\`\`
Input: tokens = ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]
Output: 22
Explanation: ((10 * (6 / ((9 + 3) * -11))) + 17) + 5
= ((10 * (6 / (12 * -11))) + 17) + 5
= ((10 * (6 / -132)) + 17) + 5
= ((10 * 0) + 17) + 5
= (0 + 17) + 5
= 22
\`\`\`

### Constraints:
- \`1 <= tokens.length <= 10^5\`
- \`tokens[i]\` is either an operator: \`"+"\`, \`"-"\`, \`"*"\`, or \`"/"\`, or an integer in the range \`[-200, 200]\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '["2","1","+","3","*"]',
    sample_output: '9',
    generator: generateEvalRPNTestCases,
    optimalCode: `
function solution(tokens) {
  const stack = [];
  for (const t of tokens) {
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop();
      const a = stack.pop();
      let res = 0;
      if (t === '+') res = a + b;
      else if (t === '-') res = a - b;
      else if (t === '*') res = Math.trunc(a * b);
      else if (t === '/') res = Math.trunc(a / b);
      stack.push(res);
    } else {
      stack.push(Number(t));
    }
  }
  return stack[0];
}`,
    bruteCode: `
function solution(tokens) {
  const list = [...tokens];
  while (list.length > 1) {
    let opIdx = -1;
    for (let i = 0; i < list.length; i++) {
      if (['+', '-', '*', '/'].includes(list[i])) {
        opIdx = i;
        break;
      }
    }
    const a = Number(list[opIdx - 2]);
    const b = Number(list[opIdx - 1]);
    const op = list[opIdx];
    let res = 0;
    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = Math.trunc(a * b);
    else if (op === '/') res = Math.trunc(a / b);
    list.splice(opIdx - 2, 3, String(res));
  }
  return Number(list[0]);
}`
  },
  {
    slug: 'simplify-path',
    title: 'Simplify Path',
    difficulty: 'medium',
    description: `Given an absolute path for a Unix-style file system, which begins with a slash \`'/'\`, transform this path into its **canonical path**.

In Unix-style file systems:
- A single period \`'.'\` refers to the current directory.
- A double period \`'..'\` refers to the directory up a level (the parent directory).
- Multiple consecutive slashes, such as \`'//'\` and \`'///'\`, are treated as a single slash \`'/'\`.
- Any sequence of periods that does not match \`'.'\` or \`'..'\` should be treated as a valid directory or file name. For example, \`'...'\` and \`'....'\` are valid names.

The canonical path should have the following format:
- The path must start with a single slash \`'/'\`.
- Directories within the path must be separated by only one slash \`'/'\`.
- The path must not end with a trailing \`'/'\`, unless it is the root directory.
- The path must not have any \`'.'\` or \`'..'\` used to denote the current or parent directory.

Return *the simplified canonical path*.

### Example 1:
\`\`\`
Input: path = "/home/"
Output: "/home"
Explanation: The trailing slash is removed.
\`\`\`

### Example 2:
\`\`\`
Input: path = "/home//foo/"
Output: "/home/foo"
Explanation: Multiple consecutive slashes are replaced by a single one.
\`\`\`

### Example 3:
\`\`\`
Input: path = "/home/user/Documents/../Pictures"
Output: "/home/user/Pictures"
Explanation: A double period ".." refers to the directory up a level.
\`\`\`

### Example 4:
\`\`\`
Input: path = "/../"
Output: "/"
Explanation: Going one level up from the root directory is not possible.
\`\`\`

### Example 5:
\`\`\`
Input: path = "/.../a/../b/c/../d/./"
Output: "/.../b/d"
Explanation: "..." is a valid name for a directory in this problem.
\`\`\`

### Constraints:
- \`1 <= path.length <= 3 * 10^5\`
- \`path\` consists of English letters, digits, period \`'.'\`, slash \`'/'\` or \`'_'\`.
- \`path\` is a valid absolute Unix path.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '"/home/"',
    sample_output: '"/home"',
    generator: generateSimplifyPathTestCases,
    optimalCode: `
function solution(path) {
  const parts = path.split('/');
  const stack = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') {
      if (stack.length) stack.pop();
    } else {
      stack.push(p);
    }
  }
  return '/' + stack.join('/');
}`,
    bruteCode: `
function solution(path) {
  let s = path;
  while (s.includes('//')) s = s.replace('//', '/');
  while (s.includes('/./')) s = s.replace('/./', '/');
  const parts = s.split('/');
  const stack = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') {
      if (stack.length) stack.pop();
    } else {
      stack.push(p);
    }
  }
  return '/' + stack.join('/');
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Stack Batch 1 (5 Problems) ===\n');

  for (const prob of STACK_PROBLEMS) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await db.query('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`Problem ${prob.slug} NOT FOUND in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update Problem metadata & description
    await db.query(
      `UPDATE problems 
       SET title = $1, difficulty = $2, description = $3, sample_input = $4, sample_output = $5
       WHERE id = $6`,
      [prob.title, prob.difficulty, prob.description, prob.sample_input, prob.sample_output, problemId]
    );
    console.log(`✓ Metadata & LeetCode description updated.`);

    // 3. Delete existing test cases and insert 25 curated test cases
    const testCases = prob.generator();
    if (testCases.length !== 25) {
      throw new Error(`Expected 25 test cases for ${prob.slug}, got ${testCases.length}`);
    }

    await db.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      await db.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }
    console.log(`✓ Seeded exactly 25 test cases (TC 25 length: ${testCases[24].input.length} chars).`);

    // 4. Validate Optimal Solution with Judge
    const optimalResult = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(
      `✓ Optimal Solution: verdict = ${optimalResult.verdict} (${optimalResult.passedTests}/${optimalResult.totalTests} in ${optimalResult.runtimeMs}ms)`
    );
    if (optimalResult.verdict !== 'ACCEPTED' || optimalResult.passedTests !== 25) {
      console.error('OPTIMAL SOLUTION FAILED!', optimalResult);
      process.exit(1);
    }

    // 5. Test Brute Force / Sub-optimal Solution
    if (prob.bruteCode) {
      const bruteResult = await evaluateSubmission(problemId, prob.bruteCode, 'javascript');
      console.log(
        `✓ Brute Force: verdict = ${bruteResult.verdict} (${bruteResult.passedTests}/${bruteResult.totalTests} in ${bruteResult.runtimeMs}ms)`
      );
      if (bruteResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
        console.warn(`WARNING: Brute force did not get TIME_LIMIT_EXCEEDED! Verdict: ${bruteResult.verdict}`);
      } else {
        console.log(`✓ Confirmed: Brute force triggers TIME_LIMIT_EXCEEDED (> 2000ms limit).`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('✓ All 5 Stack problems successfully upgraded and verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

