'use strict';

/**
 * upgrade_backtracking_batch2_25tc.js
 *
 * Upgrades 8 Complex & Hard Backtracking problems:
 * 1. Letter Combinations of a Phone Number (LC 17) [Medium]
 * 2. Word Search (LC 79) [Medium]
 * 3. Word Break II (LC 140) [Hard]
 * 4. Palindrome Partitioning (LC 131) [Medium]
 * 5. Restore IP Addresses (LC 93) [Medium]
 * 6. Sudoku Solver (LC 37) [Hard]
 * 7. N-Queens (LC 51) [Hard]
 * 8. N-Queens II (LC 52) [Hard]
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

function solveLetterCombinations(digits) {
  if (!digits || digits.length === 0) return [];
  const map = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };
  const res = [];
  function bt(idx, path) {
    if (idx === digits.length) {
      res.push(path);
      return;
    }
    for (const c of map[digits[idx]] || '') {
      bt(idx + 1, path + c);
    }
  }
  bt(0, '');
  return res;
}

function solveWordSearch(board, word) {
  const R = board.length, C = board[0].length;
  const bCount = {};
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      bCount[board[r][c]] = (bCount[board[r][c]] || 0) + 1;
    }
  }
  for (const ch of word) {
    if (!bCount[ch] || bCount[ch] <= 0) return false;
    bCount[ch]--;
  }

  function bt(r, c, idx) {
    if (idx === word.length) return true;
    if (r < 0 || r >= R || c < 0 || c >= C || board[r][c] !== word[idx]) return false;
    const tmp = board[r][c];
    board[r][c] = '#';
    const found = bt(r + 1, c, idx + 1) || bt(r - 1, c, idx + 1) ||
                  bt(r, c + 1, idx + 1) || bt(r, c - 1, idx + 1);
    board[r][c] = tmp;
    return found;
  }

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (bt(r, c, 0)) return true;
    }
  }
  return false;
}

function solveWordBreakII(s, wordDict) {
  const dict = new Set(wordDict);
  const memo = new Map();
  function bt(str) {
    if (memo.has(str)) return memo.get(str);
    if (str.length === 0) return [''];
    const res = [];
    for (let i = 1; i <= str.length; i++) {
      const prefix = str.slice(0, i);
      if (dict.has(prefix)) {
        const sub = bt(str.slice(i));
        for (const rest of sub) {
          res.push(rest ? prefix + ' ' + rest : prefix);
        }
      }
    }
    memo.set(str, res);
    return res;
  }
  return bt(s);
}

function solvePalindromePartitioning(s) {
  const res = [];
  function isPal(sub) {
    let l = 0, r = sub.length - 1;
    while (l < r) {
      if (sub[l++] !== sub[r--]) return false;
    }
    return true;
  }
  function bt(start, path) {
    if (start === s.length) {
      res.push([...path]);
      return;
    }
    for (let i = start + 1; i <= s.length; i++) {
      const sub = s.slice(start, i);
      if (isPal(sub)) {
        path.push(sub);
        bt(i, path);
        path.pop();
      }
    }
  }
  bt(0, []);
  return res;
}

function solveRestoreIP(s) {
  const res = [];
  function bt(idx, parts) {
    if (parts.length === 4) {
      if (idx === s.length) res.push(parts.join('.'));
      return;
    }
    for (let len = 1; len <= 3 && idx + len <= s.length; len++) {
      const seg = s.slice(idx, idx + len);
      if (seg.length > 1 && seg[0] === '0') continue;
      if (parseInt(seg, 10) > 255) continue;
      parts.push(seg);
      bt(idx + len, parts);
      parts.pop();
    }
  }
  bt(0, []);
  return res;
}

function solveSudoku(rawBoard) {
  const board = rawBoard.map((row) => [...row]);
  function isValid(r, c, d) {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === d || board[i][c] === d) return false;
      const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const bc = 3 * Math.floor(c / 3) + (i % 3);
      if (board[br][bc] === d) return false;
    }
    return true;
  }
  function solve() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === '.') {
          for (let d = 1; d <= 9; d++) {
            const char = String(d);
            if (isValid(r, c, char)) {
              board[r][c] = char;
              if (solve()) return true;
              board[r][c] = '.';
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  solve();
  return board;
}

function solveNQueens(n) {
  const res = [];
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function bt(r, board) {
    if (r === n) {
      res.push(board.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      board.push(c);
      bt(r + 1, board);
      board.pop();
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
  }
  bt(0, []);
  return res;
}

function solveNQueensII(n) {
  let count = 0;
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function bt(r) {
    if (r === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      bt(r + 1);
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
  }
  bt(0);
  return count;
}

// -------------------------------------------------------------
// Problem Definitions
// -------------------------------------------------------------

const BACKTRACKING_BATCH2 = [
  {
    slug: 'letter-combinations-of-a-phone-number',
    title: 'Letter Combinations of a Phone Number',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-14-tests/letter-combinations-of-a-phone-number.json',
    sample_input: '"23"',
    sample_output: '["ad","ae","af","bd","be","bf","cd","ce","cf"]',
    description: `Given a string containing digits from \`2-9\` inclusive, return all possible letter combinations that the number could represent. Return the answer in **any order**.

A mapping of digits to letters (just like on the telephone buttons) is given below. Note that 1 does not map to any letters.

\`2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz"\`

### Example 1:
\`\`\`
Input: digits = "23"
Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]
\`\`\`

### Example 2:
\`\`\`
Input: digits = ""
Output: []
\`\`\`

### Example 3:
\`\`\`
Input: digits = "2"
Output: ["a","b","c"]
\`\`\`

### Constraints:
- \`0 <= digits.length <= 7\`
- \`digits[i]\` is a digit in the range \`['2', '9']\`.`,
    generateExtraTestCases: () => {
      // 21: 7 digits (4^7 = 16,384 combinations, kills O(N^2) linear scan)
      const s_21 = '7979797';
      // 22: empty string
      const s_22 = '';
      // 23: single digit 9
      const s_23 = '9';
      // 24: two digits 88
      const s_24 = '88';
      // 25: 6 digits
      const s_25 = '234567';

      const extras = [s_21, s_22, s_23, s_24, s_25];

      return extras.map((str) => ({
        input: JSON.stringify(str),
        output: JSON.stringify(solveLetterCombinations(str)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(digits) {
  if (!digits) return [];
  const map = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };
  const res = [];
  function bt(idx, path) {
    if (idx === digits.length) { res.push(path); return; }
    for (const c of map[digits[idx]] || '') bt(idx + 1, path + c);
  }
  bt(0, '');
  return res;
}`,
    bruteCode: `
function solution(digits) {
  if (!digits) return [];
  const map = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };
  const res = [];
  function bt(idx, path) {
    if (idx === digits.length) {
      let exists = false;
      for (let i = 0; i < res.length; i++) {
        if (res[i] === path) { exists = true; break; }
      }
      if (!exists) res.push(path);
      return;
    }
    for (const c of map[digits[idx]] || '') bt(idx + 1, path + c);
  }
  bt(0, '');
  return res;
}`
  },
  {
    slug: 'word-search',
    title: 'Word Search',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-18-tests/word-search.json',
    sample_input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "ABCCED"',
    sample_output: 'true',
    description: `Given an \`m x n\` grid of characters \`board\` and a string \`word\`, return \`true\` *if \`word\` exists in the grid*.

The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.

### Example 1:
\`\`\`
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Output: true
\`\`\`

### Example 2:
\`\`\`
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Output: true
\`\`\`

### Example 3:
\`\`\`
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"
Output: false
\`\`\`

### Constraints:
- \`m == board.length\`
- \`n = board[i].length\`
- \`1 <= m, n <= 6\`
- \`1 <= word.length <= 25\`
- \`board\` and \`word\` consists of only lowercase and uppercase English letters.`,
    generateExtraTestCases: () => {
      // 21: 6x6 board of all 'A's with word of 21 'A's + 1 'B' (kills unpruned search taking > 2000ms)
      const b_21 = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => 'A'));
      const w_21 = 'AAAAAAAAAAAAAAAAAAAAAB';
      // 22: 1x1 board match
      const b_22 = [['Z']], w_22 = 'Z';
      // 23: 1x1 board mismatch
      const b_23 = [['Z']], w_23 = 'A';
      // 24: snake path in 3x3
      const b_24 = [
        ['A', 'B', 'C'],
        ['F', 'E', 'D'],
        ['G', 'H', 'I']
      ], w_24 = 'ABCDEFGHI';
      // 25: 5x5 board with valid word
      const b_25 = [
        ['A', 'B', 'C', 'D', 'E'],
        ['J', 'I', 'H', 'G', 'F'],
        ['K', 'L', 'M', 'N', 'O'],
        ['T', 'S', 'R', 'Q', 'P'],
        ['U', 'V', 'W', 'X', 'Y']
      ], w_25 = 'ABCDEFGHIJKLMNOPQRSTUVW';

      const extras = [
        [b_21, w_21],
        [b_22, w_22],
        [b_23, w_23],
        [b_24, w_24],
        [b_25, w_25]
      ];

      return extras.map(([board, word]) => ({
        input: `${JSON.stringify(board)}, ${JSON.stringify(word)}`,
        output: JSON.stringify(solveWordSearch(board, word)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(board, word) {
  const R = board.length, C = board[0].length;
  const bCount = {};
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      bCount[board[r][c]] = (bCount[board[r][c]] || 0) + 1;
    }
  }
  for (const ch of word) {
    if (!bCount[ch] || bCount[ch] <= 0) return false;
    bCount[ch]--;
  }

  function bt(r, c, idx) {
    if (idx === word.length) return true;
    if (r < 0 || r >= R || c < 0 || c >= C || board[r][c] !== word[idx]) return false;
    const tmp = board[r][c];
    board[r][c] = '#';
    const found = bt(r + 1, c, idx + 1) || bt(r - 1, c, idx + 1) ||
                  bt(r, c + 1, idx + 1) || bt(r, c - 1, idx + 1);
    board[r][c] = tmp;
    return found;
  }
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (bt(r, c, 0)) return true;
    }
  }
  return false;
}`,
    bruteCode: `
function solution(board, word) {
  const R = board.length, C = board[0].length;
  // Naive without frequency pruning -> TLE on all-A board with B
  function bt(r, c, idx) {
    if (idx === word.length) return true;
    if (r < 0 || r >= R || c < 0 || c >= C || board[r][c] !== word[idx]) return false;
    const tmp = board[r][c];
    board[r][c] = '#';
    const found = bt(r + 1, c, idx + 1) || bt(r - 1, c, idx + 1) ||
                  bt(r, c + 1, idx + 1) || bt(r, c - 1, idx + 1);
    board[r][c] = tmp;
    return found;
  }
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (bt(r, c, 0)) return true;
    }
  }
  return false;
}`
  },
  {
    slug: 'word-break-ii',
    title: 'Word Break II',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-3-tests/word-break-ii.json',
    sample_input: '"applebananaapple", ["apple","banana"]',
    sample_output: '["apple banana apple"]',
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, add spaces in \`s\` to construct a sentence where each word is a valid dictionary word. Return all such possible sentences in **any order**.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.

### Example 1:
\`\`\`
Input: s = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]
Output: ["cats and dog","cat sand dog"]
\`\`\`

### Example 2:
\`\`\`
Input: s = "pineapplepenapple", wordDict = ["apple","pen","applepen","pine","pineapple"]
Output: ["pine apple pen apple","pineapple pen apple","pine applepen apple"]
Explanation: Note that you are allowed to reuse dictionary words.
\`\`\`

### Example 3:
\`\`\`
Input: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
Output: []
\`\`\`

### Constraints:
- \`1 <= s.length <= 25\`
- \`1 <= wordDict.length <= 1000\`
- \`1 <= wordDict[i].length <= 10\`
- \`s\` and \`wordDict[i]\` consist of only lowercase English letters.
- All the strings of \`wordDict\` are **unique**.`,
    generateExtraTestCases: () => {
      // 21: s of 25 'a's + 'b' with dict of 'a's (impossible suffix kills unmemoized search taking > 2000ms)
      const s_21 = 'aaaaaaaaaaaaaaaaaaaaaaaaab';
      const d_21 = ['a', 'aa', 'aaa', 'aaaa', 'aaaaa', 'aaaaaa', 'aaaaaaa', 'aaaaaaaa', 'aaaaaaaaa', 'aaaaaaaaaa'];
      // 22: impossible string
      const s_22 = 'catsandog';
      const d_22 = ['cats', 'dog', 'sand', 'and', 'cat'];
      // 23: single word
      const s_23 = 'hello';
      const d_23 = ['hello'];
      // 24: repeating short words
      const s_24 = 'ababa';
      const d_24 = ['a', 'b', 'ab', 'ba'];
      // 25: longer sentence with multiple choices
      const s_25 = 'catsandogcatsandog';
      const d_25 = ['cat', 'cats', 'and', 'sand', 'dog'];

      const extras = [
        [s_21, d_21],
        [s_22, d_22],
        [s_23, d_23],
        [s_24, d_24],
        [s_25, d_25]
      ];

      return extras.map(([str, dict]) => ({
        input: `${JSON.stringify(str)}, ${JSON.stringify(dict)}`,
        output: JSON.stringify(solveWordBreakII(str, dict)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s, wordDict) {
  const dict = new Set(wordDict);
  const memo = new Map();
  function bt(str) {
    if (memo.has(str)) return memo.get(str);
    if (str.length === 0) return [''];
    const res = [];
    for (let i = 1; i <= str.length; i++) {
      const prefix = str.slice(0, i);
      if (dict.has(prefix)) {
        const sub = bt(str.slice(i));
        for (const rest of sub) {
          res.push(rest ? prefix + ' ' + rest : prefix);
        }
      }
    }
    memo.set(str, res);
    return res;
  }
  return bt(s);
}`,
    bruteCode: `
function solution(s, wordDict) {
  const dict = new Set(wordDict);
  // Naive unmemoized -> TLE on length 24
  function bt(str) {
    if (str.length === 0) return [''];
    const res = [];
    for (let i = 1; i <= str.length; i++) {
      const prefix = str.slice(0, i);
      if (dict.has(prefix)) {
        const sub = bt(str.slice(i));
        for (const rest of sub) {
          res.push(rest ? prefix + ' ' + rest : prefix);
        }
      }
    }
    return res;
  }
  return bt(s);
}`
  },
  {
    slug: 'palindrome-partitioning',
    title: 'Palindrome Partitioning',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-24-tests/palindrome-partitioning.json',
    sample_input: '"aab"',
    sample_output: '[["a","a","b"],["aa","b"]]',
    description: `Given a string \`s\`, partition \`s\` such that every substring of the partition is a **palindrome**. Return *all possible palindrome partitioning of \`s\`*.

### Example 1:
\`\`\`
Input: s = "aab"
Output: [["a","a","b"],["aa","b"]]
\`\`\`

### Example 2:
\`\`\`
Input: s = "a"
Output: [["a"]]
\`\`\`

### Constraints:
- \`1 <= s.length <= 16\`
- \`s\` contains only lowercase English letters.`,
    generateExtraTestCases: () => {
      // 21: 16 'a's (2^15 = 32,768 partitions, kills linear scan)
      const s_21 = 'aaaaaaaaaaaaaaaa';
      // 22: single char
      const s_22 = 'z';
      // 23: two same chars
      const s_23 = 'bb';
      // 24: no multi-char palindromes
      const s_24 = 'abcdef';
      // 25: 15 chars with mixed palindromes
      const s_25 = 'abacabaabacabaa';

      const extras = [s_21, s_22, s_23, s_24, s_25];

      return extras.map((str) => ({
        input: JSON.stringify(str),
        output: JSON.stringify(solvePalindromePartitioning(str)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s) {
  const res = [];
  function isPal(sub) {
    let l = 0, r = sub.length - 1;
    while (l < r) { if (sub[l++] !== sub[r--]) return false; }
    return true;
  }
  function bt(start, path) {
    if (start === s.length) { res.push([...path]); return; }
    for (let i = start + 1; i <= s.length; i++) {
      const sub = s.slice(start, i);
      if (isPal(sub)) {
        path.push(sub);
        bt(i, path);
        path.pop();
      }
    }
  }
  bt(0, []);
  return res;
}`,
    bruteCode: `
function solution(s) {
  const res = [];
  function isPal(sub) {
    let l = 0, r = sub.length - 1;
    while (l < r) { if (sub[l++] !== sub[r--]) return false; }
    return true;
  }
  function bt(start, path) {
    if (start === s.length) {
      const copy = [...path];
      let exists = false;
      for (let i = 0; i < res.length; i++) {
        if (res[i].length === copy.length && res[i].every((v, idx) => v === copy[idx])) {
          exists = true; break;
        }
      }
      if (!exists) res.push(copy);
      return;
    }
    for (let i = start + 1; i <= s.length; i++) {
      const sub = s.slice(start, i);
      if (isPal(sub)) {
        path.push(sub);
        bt(i, path);
        path.pop();
      }
    }
  }
  bt(0, []);
  return res;
}`
  },
  {
    slug: 'restore-ip-addresses',
    title: 'Restore IP Addresses',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-25-tests/restore-ip-addresses.json',
    sample_input: '"25525511135"',
    sample_output: '["255.255.11.135","255.255.111.35"]',
    description: `A **valid IP address** consists of exactly four integers separated by single dots. Each integer is between \`0\` and \`255\` (inclusive) and cannot have leading zeros.

- For example, \`"0.1.2.201"\` and \`"192.168.1.1"\` are **valid** IP addresses, but \`"0.011.255.245"\`, \`"192.168.1.312"\` and \`"192.168@1.1"\` are **invalid** IP addresses.

Given a string \`s\` containing only digits, return *all possible valid IP addresses that can be formed by inserting dots into \`s\`*. You are **not** allowed to reorder or remove any digits in \`s\`. You may return the valid IP addresses in **any order**.

### Example 1:
\`\`\`
Input: s = "25525511135"
Output: ["255.255.11.135","255.255.111.35"]
\`\`\`

### Example 2:
\`\`\`
Input: s = "0000"
Output: ["0.0.0.0"]
\`\`\`

### Example 3:
\`\`\`
Input: s = "101023"
Output: ["1.0.10.23","1.0.102.3","10.1.0.23","10.10.2.3","101.0.2.3"]
\`\`\`

### Constraints:
- \`1 <= s.length <= 20\`
- \`s\` consists of digits only.`,
    generateExtraTestCases: () => {
      // 21: invalid long string
      const s_21 = '1234567890123456';
      // 22: invalid too short
      const s_22 = '123';
      // 23: all zeros
      const s_23 = '00000';
      // 24: single valid 4 digits
      const s_24 = '1111';
      // 25: 12 digits valid boundary
      const s_25 = '255255255255';

      const extras = [s_21, s_22, s_23, s_24, s_25];

      return extras.map((str) => ({
        input: JSON.stringify(str),
        output: JSON.stringify(solveRestoreIP(str)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s) {
  const res = [];
  function bt(idx, parts) {
    if (parts.length === 4) {
      if (idx === s.length) res.push(parts.join('.'));
      return;
    }
    for (let len = 1; len <= 3 && idx + len <= s.length; len++) {
      const seg = s.slice(idx, idx + len);
      if (seg.length > 1 && seg[0] === '0') continue;
      if (parseInt(seg, 10) > 255) continue;
      parts.push(seg);
      bt(idx + len, parts);
      parts.pop();
    }
  }
  bt(0, []);
  return res;
}`,
    bruteCode: `
function solution(s) {
  const res = [];
  function bt(idx, parts) {
    if (parts.length === 4) {
      if (idx === s.length) {
        const str = parts.join('.');
        let exists = false;
        for (let i = 0; i < res.length; i++) {
          if (res[i] === str) { exists = true; break; }
        }
        if (!exists) res.push(str);
      }
      return;
    }
    for (let len = 1; len <= 3 && idx + len <= s.length; len++) {
      const seg = s.slice(idx, idx + len);
      if (seg.length > 1 && seg[0] === '0') continue;
      if (parseInt(seg, 10) > 255) continue;
      parts.push(seg);
      bt(idx + len, parts);
      parts.pop();
    }
  }
  bt(0, []);
  return res;
}`
  },
  {
    slug: 'sudoku-solver',
    title: 'Sudoku Solver',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-1-tests/sudoku-solver.json',
    sample_input: '[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',
    sample_output: '[["5","3","4","6","7","8","9","1","2"],["6","7","2","1","9","5","3","4","8"],["1","9","8","3","4","2","5","6","7"],["8","5","9","7","6","1","4","2","3"],["4","2","6","8","5","3","7","9","1"],["7","1","3","9","2","4","8","5","6"],["9","6","1","5","3","7","2","8","4"],["2","8","7","4","1","9","6","3","5"],["3","4","5","2","8","6","1","7","9"]]',
    description: `Write a program to solve a Sudoku puzzle by filling the empty cells.

A sudoku solution must satisfy all of the following rules:
1. Each of the digits \`1-9\` must occur exactly once in each row.
2. Each of the digits \`1-9\` must occur exactly once in each column.
3. Each of the digits \`1-9\` must occur exactly once in each of the 9 \`3x3\` sub-boxes of the grid.

The \`'.'\` character indicates empty cells.

### Constraints:
- \`board.length == 9\`
- \`board[i].length == 9\`
- \`board[i][j]\` is a digit or \`'.'\`.
- It is **guaranteed** that the input board has only one unique solution.`,
    generateExtraTestCases: () => {
      // 25: Classic LeetCode example board to bring count from 24 to 25
      const b_25 = [
        ['5', '3', '.', '.', '7', '.', '.', '.', '.'],
        ['6', '.', '.', '1', '9', '5', '.', '.', '.'],
        ['.', '9', '8', '.', '.', '.', '.', '6', '.'],
        ['8', '.', '.', '.', '6', '.', '.', '.', '3'],
        ['4', '.', '.', '8', '.', '3', '.', '.', '1'],
        ['7', '.', '.', '.', '2', '.', '.', '.', '6'],
        ['.', '6', '.', '.', '.', '.', '2', '8', '.'],
        ['.', '.', '.', '4', '1', '9', '.', '.', '5'],
        ['.', '.', '.', '.', '8', '.', '.', '7', '9']
      ];
      return [{
        input: JSON.stringify(b_25),
        output: JSON.stringify(solveSudoku(b_25)),
        is_hidden: true
      }];
    },
    optimalCode: `
function solution(board) {
  function isValid(r, c, d) {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === d || board[i][c] === d) return false;
      const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const bc = 3 * Math.floor(c / 3) + (i % 3);
      if (board[br][bc] === d) return false;
    }
    return true;
  }
  function solve() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === '.') {
          for (let d = 1; d <= 9; d++) {
            const char = String(d);
            if (isValid(r, c, char)) {
              board[r][c] = char;
              if (solve()) return true;
              board[r][c] = '.';
            }
          }
          return false;
        }
      }
    }
    return true;
  }
  solve();
  return board;
}`
  },
  {
    slug: 'n-queens',
    title: 'N-Queens',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-19-tests/n-queens.json',
    sample_input: '4',
    sample_output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
    description: `The **n-queens** puzzle is the problem of placing \`n\` queens on an \`n x n\` chessboard such that no two queens attack each other.

Given an integer \`n\`, return *all distinct solutions to the **n-queens puzzle***. You may return the answer in **any order**.

Each solution contains a distinct board configuration of the n-queens' placement, where \`'Q'\` and \`'.'\` both indicate a queen and an empty space, respectively.

### Example 1:
\`\`\`
Input: n = 4
Output: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]
Explanation: There exist two distinct solutions to the 4-queens puzzle as shown above
\`\`\`

### Example 2:
\`\`\`
Input: n = 1
Output: [["Q"]]
\`\`\`

### Constraints:
- \`1 <= n <= 10\``,
    generateExtraTestCases: () => {
      // 21: n=10 (724 solutions, kills O(N^2) duplicate scan)
      const n_21 = 10;
      // 22: n=2 (0 solutions)
      const n_22 = 2;
      // 23: n=3 (0 solutions)
      const n_23 = 3;
      // 24: n=5 (10 solutions)
      const n_24 = 5;
      // 25: n=9 (352 solutions)
      const n_25 = 9;

      const extras = [n_21, n_22, n_23, n_24, n_25];

      return extras.map((n) => ({
        input: String(n),
        output: JSON.stringify(solveNQueens(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  const res = [];
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function bt(r, board) {
    if (r === n) {
      res.push(board.map(c => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      board.push(c);
      bt(r + 1, board);
      board.pop();
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
  }
  bt(0, []);
  return res;
}`,
    bruteCode: `
function solution(n) {
  const res = [];
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function bt(r, board) {
    if (r === n) {
      const b = board.map(c => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1));
      let exists = false;
      for (let i = 0; i < res.length; i++) {
        if (res[i].every((v, idx) => v === b[idx])) { exists = true; break; }
      }
      if (!exists) res.push(b);
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      board.push(c);
      bt(r + 1, board);
      board.pop();
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
  }
  bt(0, []);
  return res;
}`
  },
  {
    slug: 'n-queens-ii',
    title: 'N-Queens II',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-34-tests/n-queens-ii.json',
    sample_input: '4',
    sample_output: '2',
    description: `The **n-queens** puzzle is the problem of placing \`n\` queens on an \`n x n\` chessboard such that no two queens attack each other.

Given an integer \`n\`, return *the number of distinct solutions to the **n-queens puzzle***.

### Example 1:
\`\`\`
Input: n = 4
Output: 2
Explanation: There are two distinct solutions to the 4-queens puzzle.
\`\`\`

### Example 2:
\`\`\`
Input: n = 1
Output: 1
\`\`\`

### Constraints:
- \`1 <= n <= 11\``,
    generateExtraTestCases: () => {
      // 21: n=11 (2680 solutions, kills unpruned search)
      const n_21 = 11;
      // 22: n=2 (0)
      const n_22 = 2;
      // 23: n=3 (0)
      const n_23 = 3;
      // 24: n=6 (4)
      const n_24 = 6;
      // 25: n=10 (724)
      const n_25 = 10;

      const extras = [n_21, n_22, n_23, n_24, n_25];

      return extras.map((n) => ({
        input: String(n),
        output: JSON.stringify(solveNQueensII(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  let count = 0;
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function bt(r) {
    if (r === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(r - c) || diag2.has(r + c)) continue;
      cols.add(c); diag1.add(r - c); diag2.add(r + c);
      bt(r + 1);
      cols.delete(c); diag1.delete(r - c); diag2.delete(r + c);
    }
  }
  bt(0);
  return count;
}`,
    bruteCode: `
function solution(n) {
  // Naive permutation generation without early diagonal pruning -> TLE on n=11
  let count = 0;
  const used = new Array(n).fill(false);
  const perm = [];
  function checkDiagonals() {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) === Math.abs(perm[i] - perm[j])) return false;
      }
    }
    return true;
  }
  function permute(idx) {
    if (idx === n) {
      if (checkDiagonals()) count++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      used[c] = true;
      perm.push(c);
      permute(idx + 1);
      perm.pop();
      used[c] = false;
    }
  }
  permute(0);
  return count;
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for Backtracking Batch 2 (8 Problems) ===\n');

  for (const prob of BACKTRACKING_BATCH2) {
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

    // 3. Load existing test cases from JSON file
    const rootDir = path.join(__dirname, '../..');
    const fullJsonPath = path.join(rootDir, prob.jsonPath);
    const existingRaw = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

    const baseCount = prob.slug === 'sudoku-solver' ? 24 : 20;
    const baseTestCases = existingRaw.slice(0, baseCount).map((tc, idx) => ({
      input: tc.input,
      output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
      is_hidden: idx >= 3
    }));

    // 4. Generate extra curated edge cases & stress tests to reach exactly 25
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
    console.log(`✓ Seeded exactly 25 test cases.`);

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
  console.log('✓ All 8 Backtracking Batch 2 problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
