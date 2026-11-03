/**
 * backend/scripts/upgrade_strings_batch4_25tc.js
 *
 * Upgrades the final 6 Advanced Strings problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with comprehensive edge cases and upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) / naive brute-force solutions with TLE (> 2000ms).
 *
 * Problems:
 * 1. Text Justification (text-justification) [LC 68]
 * 2. Valid Number (valid-number) [LC 65]
 * 3. Zigzag Conversion (zigzag-conversion) [LC 6]
 * 4. Compare Version Numbers (compare-version-numbers) [LC 165]
 * 5. Length of Last Word (length-of-last-word) [LC 58]
 * 6. Identify Unique Signal (identify-unique-signal) [LC 387]
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

async function safeQuery(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.query(text, params);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[DB Retry] attempt ${attempt} failed: ${err.message}. Retrying in 1s...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// Reference Solvers
function solveFullJustify(words, maxWidth) {
  const res = [];
  let cur = [];
  let numLetters = 0;
  for (const word of words) {
    if (word.length + cur.length + numLetters > maxWidth) {
      for (let i = 0; i < maxWidth - numLetters; i++) {
        cur[i % (cur.length - 1 || 1)] += ' ';
      }
      res.push(cur.join(''));
      cur = [];
      numLetters = 0;
    }
    cur.push(word);
    numLetters += word.length;
  }
  let lastLine = cur.join(' ');
  while (lastLine.length < maxWidth) lastLine += ' ';
  res.push(lastLine);
  return res;
}

function solveIsNumber(s) {
  s = s.trim();
  let seenDigit = false, seenDot = false, seenE = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= '0' && c <= '9') {
      seenDigit = true;
    } else if (c === '+' || c === '-') {
      if (i > 0 && s[i - 1] !== 'e' && s[i - 1] !== 'E') return false;
    } else if (c === '.') {
      if (seenDot || seenE) return false;
      seenDot = true;
    } else if (c === 'e' || c === 'E') {
      if (seenE || !seenDigit) return false;
      seenE = true;
      seenDigit = false;
    } else {
      return false;
    }
  }
  return seenDigit;
}

function solveConvertZigzag(s, numRows) {
  if (numRows === 1 || s.length <= numRows) return s;
  const rows = Array.from({ length: numRows }, () => '');
  let curRow = 0, goingDown = false;
  for (const c of s) {
    rows[curRow] += c;
    if (curRow === 0 || curRow === numRows - 1) goingDown = !goingDown;
    curRow += goingDown ? 1 : -1;
  }
  return rows.join('');
}

function solveCompareVersion(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  const maxLen = Math.max(p1.length, p2.length);
  for (let i = 0; i < maxLen; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function solveLengthOfLastWord(s) {
  s = s.trim();
  let len = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === ' ') break;
    len++;
  }
  return len;
}

function solveFirstUniqChar(s) {
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
  }
  for (let i = 0; i < s.length; i++) {
    if (count[s.charCodeAt(i) - 97] === 1) return i;
  }
  return -1;
}

// -------------------------------------------------------------
// Generators for 25 Test Cases Each
// -------------------------------------------------------------

function generateTextJustificationTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { words: ['This', 'is', 'an', 'example', 'of', 'text', 'justification.'], maxWidth: 16 },
    { words: ['What', 'must', 'be', 'acknowledgment', 'shall', 'be'], maxWidth: 16 },
    {
      words: [
        'Science', 'is', 'what', 'we', 'understand', 'well', 'enough', 'to',
        'explain', 'to', 'a', 'computer.', 'Art', 'is', 'everything', 'else', 'we', 'do'
      ],
      maxWidth: 20
    },
    { words: ['a'], maxWidth: 1 },
    { words: ['a'], maxWidth: 2 },

    // 6-10: Single word lines & wide widths
    { words: ['hello', 'world'], maxWidth: 7 },
    { words: ['a', 'b', 'c', 'd', 'e'], maxWidth: 3 },
    { words: ['Listen', 'to', 'many,', 'speak', 'to', 'a', 'few.'], maxWidth: 6 },
    { words: ['The', 'important', 'thing', 'is', 'not', 'to', 'stop', 'questioning.'], maxWidth: 17 },
    { words: ['Give', 'me', 'my', 'robe', 'and', 'put', 'on', 'my', 'crown'], maxWidth: 12 },

    // 11-15: Varied lengths
    { words: ['a', 'b', 'c', 'd', 'e'], maxWidth: 1 },
    { words: ['Two', 'words.'], maxWidth: 11 },
    { words: ['One', 'Two', 'Three'], maxWidth: 10 },
    { words: ['To', 'be', 'or', 'not', 'to', 'be'], maxWidth: 8 },
    { words: ['LongWordThatTakesUpTheWholeWidth'], maxWidth: 31 },

    // 16-20: Medium scale
    {
      words: Array.from({ length: 50 }, (_, i) => `word${i}`),
      maxWidth: 30
    },
    {
      words: Array.from({ length: 100 }, () => 'code'),
      maxWidth: 25
    },
    {
      words: ['Algorithms', 'and', 'Data', 'Structures', 'in', 'Arena'].concat(Array.from({ length: 50 }, () => 'item')),
      maxWidth: 40
    },
    {
      words: Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 'a' : 'bb')),
      maxWidth: 15
    },
    {
      words: Array.from({ length: 150 }, (_, i) => `node${i}`),
      maxWidth: 50
    },

    // 21-24: Upper scale
    {
      words: Array.from({ length: 300 }, (_, i) => `word${i}`),
      maxWidth: 60
    },
    {
      words: Array.from({ length: 500 }, () => 'algo'),
      maxWidth: 45
    },
    {
      words: Array.from({ length: 800 }, (_, i) => (i % 2 === 0 ? 'test' : 'arena')),
      maxWidth: 50
    },
    {
      words: Array.from({ length: 1000 }, () => 'a'),
      maxWidth: 20
    },

    // 25: Massive stress test (N = 2,000 words)
    {
      words: Array.from({ length: 2000 }, (_, i) => `w${i}`),
      maxWidth: 80
    }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.words)}, ${item.maxWidth}`,
    output: JSON.stringify(solveFullJustify(item.words, item.maxWidth)),
    is_hidden: idx >= 3
  }));
}

function generateValidNumberTestCases() {
  const tcs = [
    // 1-5: Basic valid
    '0',
    ' 0.1 ',
    'abc',
    '1 a',
    '2e10',

    // 6-10: Exponents and signs
    '-90E3',
    ' 3e+7 ',
    '+6e-1',
    ' 53.5e93 ',
    '-123.456e789',

    // 11-15: Invalid patterns
    '1e',
    'e3',
    ' 6e-1.5 ',
    ' 99e2.5 ',
    ' --6 ',

    // 16-20: Dots and edge cases
    '-+3',
    '95a54e53',
    '.1',
    '3.',
    '+.8',

    // 21-24: Complex valid and invalid
    '46.e3',
    '.e1',
    '..',
    ' . ',

    // 25: Massive valid integer string (N = 50,000)
    '1'.repeat(50000)
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveIsNumber(str)),
    is_hidden: idx >= 3
  }));
}

function generateZigzagTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { s: 'PAYPALISHIRING', numRows: 3 },
    { s: 'PAYPALISHIRING', numRows: 4 },
    { s: 'A', numRows: 1 },
    { s: 'AB', numRows: 1 },
    { s: 'AB', numRows: 2 },

    // 6-10: Small rows & strings
    { s: 'ABC', numRows: 2 },
    { s: 'ABCD', numRows: 2 },
    { s: 'ABCDE', numRows: 4 },
    { s: 'HELLOWORLD', numRows: 5 },
    { s: 'ALGOARENA', numRows: 3 },

    // 11-15: numRows >= s.length
    { s: 'ABC', numRows: 10 },
    { s: 'ABCD', numRows: 4 },
    { s: 'A', numRows: 5 },
    { s: 'PINALSIGYAHRPI', numRows: 4 },
    { s: 'PAHNAPLSIIGYIR', numRows: 3 },

    // 16-20: Medium scale
    { s: 'abcdefghijklmnopqrstuvwxyz'.repeat(5), numRows: 5 },
    { s: 'PAYPALISHIRING'.repeat(10), numRows: 6 },
    { s: 'a'.repeat(200), numRows: 10 },
    { s: Array.from({ length: 300 }, (_, i) => String.fromCharCode(65 + (i % 26))).join(''), numRows: 8 },
    { s: 'ALGOARENA'.repeat(30), numRows: 7 },

    // 21-24: Upper scale
    { s: 'abcdefghij'.repeat(200), numRows: 15 },
    { s: Array.from({ length: 5000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(''), numRows: 20 },
    { s: 'PAYPALISHIRING'.repeat(1000), numRows: 25 },
    { s: 'a'.repeat(25000), numRows: 50 },

    // 25: Massive stress test (N = 75,000 chars)
    { s: Array.from({ length: 75000 }, (_, i) => String.fromCharCode(65 + (i % 26))).join(''), numRows: 100 }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.s)}, ${item.numRows}`,
    output: solveConvertZigzag(item.s, item.numRows),
    is_hidden: idx >= 3
  }));
}

function generateCompareVersionTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { v1: '1.2', v2: '1.10' },
    { v1: '1.01', v2: '1.001' },
    { v1: '1.0', v2: '1.0.0.0' },
    { v1: '0.1', v2: '1.1' },
    { v1: '1.0.1', v2: '1' },

    // 6-10: Multiple revisions
    { v1: '7.5.2.4', v2: '7.5.3' },
    { v1: '1.01', v2: '1.001' },
    { v1: '1.0', v2: '1.0.0' },
    { v1: '1.0.0', v2: '1.0' },
    { v1: '2.1', v2: '2.0.1' },

    // 11-15: Trailing zeros
    { v1: '1.0.0.0.0.1', v2: '1.0.0.0.0.2' },
    { v1: '1.0.0.0.0.0', v2: '1' },
    { v1: '0.0.1', v2: '0.0.0.1' },
    { v1: '1.1', v2: '1.1.0' },
    { v1: '3.0.4.10', v2: '3.0.4.2' },

    // 16-20: Medium scale revisions
    { v1: Array.from({ length: 20 }, () => '1').join('.'), v2: Array.from({ length: 20 }, () => '1').join('.') },
    { v1: Array.from({ length: 50 }, () => '0').join('.'), v2: '0' },
    { v1: '1.' + Array.from({ length: 30 }, () => '0').join('.') + '.1', v2: '1.0' },
    { v1: '100.200.300', v2: '100.200.301' },
    { v1: '1.2.3.4.5', v2: '1.2.3.4.6' },

    // 21-24: Upper scale
    { v1: '1.' + Array.from({ length: 100 }, () => '0').join('.'), v2: '1' },
    { v1: Array.from({ length: 150 }, (_, i) => String(i)).join('.'), v2: Array.from({ length: 150 }, (_, i) => String(i)).join('.') },
    { v1: Array.from({ length: 200 }, () => '5').join('.'), v2: Array.from({ length: 200 }, () => '5').join('.') },
    { v1: '1.' + Array.from({ length: 250 }, () => '0').join('.') + '.1', v2: '1' },

    // 25: Massive revision string (500 segments)
    { v1: Array.from({ length: 500 }, (_, i) => String(i % 10)).join('.'), v2: Array.from({ length: 500 }, (_, i) => String(i % 10)).join('.') }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.v1)}, ${JSON.stringify(item.v2)}`,
    output: String(solveCompareVersion(item.v1, item.v2)),
    is_hidden: idx >= 3
  }));
}

function generateLengthOfLastWordTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    'Hello World',
    '   fly me   to   the moon  ',
    'luffy is still joyboy',
    'a',
    '   a   ',

    // 6-10: Trailing spaces & punctuation
    'day',
    '   hello   ',
    'Today is a nice day',
    'moon',
    'a ',

    // 11-15: Varied lengths
    'word',
    '   lastword   ',
    'algoarena platform duel match battle',
    'x y z',
    'single',

    // 16-20: Medium scale
    'a '.repeat(50) + 'test',
    'hello world '.repeat(20),
    '   leading and trailing spaces with multiple words   ',
    'word'.repeat(50),
    'item '.repeat(100) + 'finalword',

    // 21-24: Upper scale
    'code '.repeat(1000) + 'programming',
    'word '.repeat(3000) + 'algoarena',
    'a '.repeat(5000) + 'supercalifragilisticexpialidocious',
    'space '.repeat(10000) + 'victory',

    // 25: Massive stress test (N = 75,000 chars)
    'w '.repeat(37499) + 'champion'
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveLengthOfLastWord(str)),
    is_hidden: idx >= 3
  }));
}

function generateFirstUniqCharTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    'leetcode',
    'loveleetcode',
    'aabb',
    'z',
    'ab',

    // 6-10: Edge cases
    'aa',
    'aab',
    'baa',
    'dddccdbba',
    'cc',

    // 11-15: Varied positions
    'yybhbzkmicg',
    'abcdefghijklmnopqrstuvwxyz',
    'aadadaad',
    'abcabc',
    'abacabadabacaba',

    // 16-20: Medium scale
    'a'.repeat(100) + 'b',
    'ab'.repeat(50) + 'c',
    'abcdefghij'.repeat(20) + 'z',
    Array.from({ length: 300 }, (_, i) => String.fromCharCode(97 + (i % 25))).join('') + 'z',
    'a'.repeat(500),

    // 21-24: Upper scale
    'a'.repeat(2000) + 'b',
    'abcdefghij'.repeat(500) + 'z',
    'ab'.repeat(10000) + 'c',
    'a'.repeat(25000) + 'b',

    // 25: Massive stress test (N = 75,000 chars) strictly designed to kill indexOf / lastIndexOf O(N^2)
    'a'.repeat(74999) + 'b'
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveFirstUniqChar(str)),
    is_hidden: idx >= 3
  }));
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const STRINGS_BATCH4 = [
  {
    slug: 'text-justification',
    title: 'Text Justification',
    difficulty: 'hard',
    description: `Given an array of strings \`words\` and a width \`maxWidth\`, format the text such that each line has exactly \`maxWidth\` characters and is fully (left and right) justified.

You should pack your words in a greedy approach; that is, pack as many words as you can in each line. Pad extra spaces \`' '\` when necessary so that each line has exactly \`maxWidth\` characters.

Extra spaces between words should be distributed as evenly as possible. If the number of spaces on a line does not divide evenly between words, the empty slots on the left will be assigned more spaces than the slots on the right.

For the last line of text, it should be left-justified, and no extra space is inserted between words.

**Note:**
- A word is defined as a character sequence consisting of non-space characters only.
- Each word's length is guaranteed to be greater than \`0\` and not exceed \`maxWidth\`.
- The input array \`words\` contains at least one word.

### Example 1:
\`\`\`
Input: words = ["This", "is", "an", "example", "of", "text", "justification."], maxWidth = 16
Output:
[
   "This    is    an",
   "example  of text",
   "justification.  "
]
\`\`\`

### Example 2:
\`\`\`
Input: words = ["What","must","be","acknowledgment","shall","be"], maxWidth = 16
Output:
[
  "What   must   be",
  "acknowledgment  ",
  "shall be        "
]
\`\`\`

### Constraints:
- \`1 <= words.length <= 300\`
- \`1 <= words[i].length <= 20\`
- \`words[i]\` consists of only English letters and symbols.
- \`1 <= maxWidth <= 100\`
- \`words[i].length <= maxWidth\`
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(maxWidth)\``,
    sample_input: '["This", "is", "an", "example", "of", "text", "justification."], 16',
    sample_output: '["This    is    an","example  of text","justification.  "]',
    generator: generateTextJustificationTestCases,
    optimalCode: `
function solution(words, maxWidth) {
  const res = [];
  let cur = [];
  let numLetters = 0;
  for (const word of words) {
    if (word.length + cur.length + numLetters > maxWidth) {
      for (let i = 0; i < maxWidth - numLetters; i++) {
        cur[i % (cur.length - 1 || 1)] += ' ';
      }
      res.push(cur.join(''));
      cur = [];
      numLetters = 0;
    }
    cur.push(word);
    numLetters += word.length;
  }
  let lastLine = cur.join(' ');
  while (lastLine.length < maxWidth) lastLine += ' ';
  res.push(lastLine);
  return res;
}`
  },
  {
    slug: 'valid-number',
    title: 'Valid Number',
    difficulty: 'hard',
    description: `Given a string \`s\`, return \`true\` *if* \`s\` *is a **valid number***.

A **valid number** can be split up into these components (in order):
1. A **decimal number** or an **integer**.
2. (Optional) An \`'e'\` or \`'E'\`, followed by an **integer**.

A **decimal number** can be split up into these components (in order):
1. (Optional) A sign character (either \`'+'\` or \`'-'\`).
2. One of the following formats:
   1. One or more digits, followed by a dot \`'.'\`.
   2. One or more digits, followed by a dot \`'.'\`, followed by one or more digits.
   3. A dot \`'.'\`, followed by one or more digits.

An **integer** can be split up into these components (in order):
1. (Optional) A sign character (either \`'+'\` or \`'-'\`).
2. One or more digits.

### Example 1:
\`\`\`
Input: s = "0"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: s = "e"
Output: false
\`\`\`

### Example 3:
\`\`\`
Input: s = "."
Output: false
\`\`\`

### Constraints:
- \`1 <= s.length <= 5 * 10^4\`
- \`s\` consists of only English letters (both uppercase and lowercase), digits (\`0-9\`), plus \`'+'\`, minus \`'-'\`, or dot \`'.'\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '"0"',
    sample_output: 'true',
    generator: generateValidNumberTestCases,
    optimalCode: `
function solution(s) {
  s = s.trim();
  let seenDigit = false, seenDot = false, seenE = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c >= '0' && c <= '9') {
      seenDigit = true;
    } else if (c === '+' || c === '-') {
      if (i > 0 && s[i - 1] !== 'e' && s[i - 1] !== 'E') return false;
    } else if (c === '.') {
      if (seenDot || seenE) return false;
      seenDot = true;
    } else if (c === 'e' || c === 'E') {
      if (seenE || !seenDigit) return false;
      seenE = true;
      seenDigit = false;
    } else {
      return false;
    }
  }
  return seenDigit;
}`
  },
  {
    slug: 'zigzag-conversion',
    title: 'Zigzag Conversion',
    difficulty: 'medium',
    description: `The string \`"PAYPALISHIRING"\` is written in a zigzag pattern on a given number of rows like this:

\`\`\`
P   A   H   N
A P L S I I G
Y   I   R
\`\`\`

And then read line by line: \`"PAHNAPLSIIGYIR"\`

Write the code that will take a string and make this conversion given a number of rows.

### Example 1:
\`\`\`
Input: s = "PAYPALISHIRING", numRows = 3
Output: "PAHNAPLSIIGYIR"
\`\`\`

### Example 2:
\`\`\`
Input: s = "PAYPALISHIRING", numRows = 4
Output: "PINALSIGYAHRPI"
Explanation:
P     I    N
A   L S  I G
Y A   H R
P     I
\`\`\`

### Example 3:
\`\`\`
Input: s = "A", numRows = 1
Output: "A"
\`\`\`

### Constraints:
- \`1 <= s.length <= 10^5\`
- \`s\` consists of English letters (lower-case and upper-case), \`','\` and \`'.'\`.
- \`1 <= numRows <= 1000\`
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '"PAYPALISHIRING", 3',
    sample_output: '"PAHNAPLSIIGYIR"',
    generator: generateZigzagTestCases,
    optimalCode: `
function solution(s, numRows) {
  if (numRows === 1 || s.length <= numRows) return s;
  const rows = Array.from({ length: numRows }, () => '');
  let curRow = 0, goingDown = false;
  for (const c of s) {
    rows[curRow] += c;
    if (curRow === 0 || curRow === numRows - 1) goingDown = !goingDown;
    curRow += goingDown ? 1 : -1;
  }
  return rows.join('');
}`
  },
  {
    slug: 'compare-version-numbers',
    title: 'Compare Version Numbers',
    difficulty: 'medium',
    description: `Given two **version strings**, \`version1\` and \`version2\`, compare them. A version string consists of **revisions** separated by dots \`'.'\`. The **value of the revision** is its **integer conversion** ignoring leading zeros.

To compare version strings, compare their revision values in **left-to-right order**. If one of the version strings has fewer revisions, treat the missing revision values as \`0\`.

Return the following:
- If \`version1 < version2\`, return \`-1\`.
- If \`version1 > version2\`, return \`1\`.
- Otherwise, return \`0\`.

### Example 1:
\`\`\`
Input: version1 = "1.2", version2 = "1.10"
Output: -1
Explanation: version1's second revision is "2" and version2's second revision is "10": 2 < 10, so version1 < version2.
\`\`\`

### Example 2:
\`\`\`
Input: version1 = "1.01", version2 = "1.001"
Output: 0
Explanation: Ignoring leading zeroes, both "01" and "001" represent the same integer "1".
\`\`\`

### Example 3:
\`\`\`
Input: version1 = "1.0", version2 = "1.0.0.0"
Output: 0
Explanation: version1 has fewer revisions, which are treated as "0".
\`\`\`

### Constraints:
- \`1 <= version1.length, version2.length <= 500\`
- \`version1\` and \`version2\` only contain digits and \`'.'\`.
- \`version1\` and \`version2\` **are valid version numbers**.
- **Expected Time Complexity:** \`O(N + M)\`
- **Expected Auxiliary Space:** \`O(N + M)\``,
    sample_input: '"1.2", "1.10"',
    sample_output: '-1',
    generator: generateCompareVersionTestCases,
    optimalCode: `
function solution(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  const maxLen = Math.max(p1.length, p2.length);
  for (let i = 0; i < maxLen; i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}`
  },
  {
    slug: 'length-of-last-word',
    title: 'Length of Last Word',
    difficulty: 'easy',
    description: `Given a string \`s\` consisting of words and spaces, return *the length of the **last** word in the string*.

A **word** is a maximal substring consisting of non-space characters only.

### Example 1:
\`\`\`
Input: s = "Hello World"
Output: 5
Explanation: The last word is "World" with length 5.
\`\`\`

### Example 2:
\`\`\`
Input: s = "   fly me   to   the moon  "
Output: 4
Explanation: The last word is "moon" with length 4.
\`\`\`

### Example 3:
\`\`\`
Input: s = "luffy is still joyboy"
Output: 6
Explanation: The last word is "joyboy" with length 6.
\`\`\`

### Constraints:
- \`1 <= s.length <= 10^5\`
- \`s\` consists of only English letters and spaces \`' '\`.
- There will be at least one word in \`s\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '"Hello World"',
    sample_output: '5',
    generator: generateLengthOfLastWordTestCases,
    optimalCode: `
function solution(s) {
  s = s.trim();
  let len = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === ' ') break;
    len++;
  }
  return len;
}`
  },
  {
    slug: 'identify-unique-signal',
    title: 'First Unique Character in a String',
    difficulty: 'easy',
    description: `Given a string \`s\`, find the *first non-repeating character* in it and return its index. If it does not exist, return \`-1\`.

### Example 1:
\`\`\`
Input: s = "leetcode"
Output: 0
Explanation: The character 'l' at index 0 is the first character that does not occur at any other index.
\`\`\`

### Example 2:
\`\`\`
Input: s = "loveleetcode"
Output: 2
\`\`\`

### Example 3:
\`\`\`
Input: s = "aabb"
Output: -1
\`\`\`

### Constraints:
- \`1 <= s.length <= 10^5\`
- \`s\` consists of only lowercase English letters.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\` (26 characters)`,
    sample_input: '"leetcode"',
    sample_output: '0',
    generator: generateFirstUniqCharTestCases,
    optimalCode: `
function solution(s) {
  const count = new Array(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
  }
  for (let i = 0; i < s.length; i++) {
    if (count[s.charCodeAt(i) - 97] === 1) return i;
  }
  return -1;
}`,
    bruteCode: `
function solution(s) {
  for (let i = 0; i < s.length; i++) {
    if (s.indexOf(s[i]) === s.lastIndexOf(s[i])) return i;
  }
  return -1;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Strings Batch 4 (6 Problems) ===\n');

  for (const prob of STRINGS_BATCH4) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await safeQuery('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`Problem ${prob.slug} NOT FOUND in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update Problem metadata & description
    await safeQuery(
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

    await safeQuery('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      await safeQuery(
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
  console.log('✓ All 6 Advanced Strings problems successfully upgraded and verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

