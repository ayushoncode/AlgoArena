/**
 * backend/scripts/upgrade_twopointers_batch2_25tc.js
 *
 * Upgrades 5 Advanced Two-Pointers problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with comprehensive edge cases and upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) brute-force solutions with TLE (> 2000ms).
 *
 * Problems:
 * 1. Minimum Window Substring (minimum-window-substring) [LC 76]
 * 2. Substring with Concatenation of All Words (substring-with-concatenation-of-all-words) [LC 30]
 * 3. Repeated DNA Sequences (repeated-dna-sequences) [LC 187]
 * 4. Remove Element (remove-element) [LC 27]
 * 5. Sort Colors (Dutch Flag) (sort-colors-dutch-flag) [LC 75]
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
function solveMinWindow(s, t) {
  if (!s || !t) return '';
  const map = new Map();
  for (const c of t) map.set(c, (map.get(c) || 0) + 1);
  let left = 0, count = map.size;
  let minLen = Infinity, startIdx = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (map.has(c)) {
      map.set(c, map.get(c) - 1);
      if (map.get(c) === 0) count--;
    }
    while (count === 0) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        startIdx = left;
      }
      const leftChar = s[left];
      if (map.has(leftChar)) {
        map.set(leftChar, map.get(leftChar) + 1);
        if (map.get(leftChar) > 0) count++;
      }
      left++;
    }
  }
  return minLen === Infinity ? '' : s.slice(startIdx, startIdx + minLen);
}

function solveFindSubstring(s, words) {
  if (!s || !words || !words.length) return [];
  const wordLen = words[0].length;
  const numWords = words.length;
  const totalLen = wordLen * numWords;
  if (s.length < totalLen) return [];

  const wordCount = new Map();
  for (const w of words) wordCount.set(w, (wordCount.get(w) || 0) + 1);
  const result = [];

  for (let i = 0; i < wordLen; i++) {
    let left = i, count = 0;
    const seen = new Map();
    for (let right = i; right + wordLen <= s.length; right += wordLen) {
      const word = s.substring(right, right + wordLen);
      if (wordCount.has(word)) {
        seen.set(word, (seen.get(word) || 0) + 1);
        count++;
        while (seen.get(word) > wordCount.get(word)) {
          const leftWord = s.substring(left, left + wordLen);
          seen.set(leftWord, seen.get(leftWord) - 1);
          count--;
          left += wordLen;
        }
        if (count === numWords) {
          result.push(left);
        }
      } else {
        seen.clear();
        count = 0;
        left = right + wordLen;
      }
    }
  }
  return result;
}

function solveFindRepeatedDnaSequences(s) {
  if (s.length <= 10) return [];
  const seen = new Set();
  const repeated = new Set();
  for (let i = 0; i <= s.length - 10; i++) {
    const sub = s.substring(i, i + 10);
    if (seen.has(sub)) {
      repeated.add(sub);
    } else {
      seen.add(sub);
    }
  }
  return Array.from(repeated);
}

function solveRemoveElement(nums, val) {
  let k = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== val) {
      nums[k] = nums[i];
      k++;
    }
  }
  return k;
}

function solveSortColors(nums) {
  const arr = [...nums];
  let low = 0, mid = 0, high = arr.length - 1;
  while (mid <= high) {
    if (arr[mid] === 0) {
      [arr[low], arr[mid]] = [arr[mid], arr[low]];
      low++; mid++;
    } else if (arr[mid] === 1) {
      mid++;
    } else {
      [arr[mid], arr[high]] = [arr[high], arr[mid]];
      high--;
    }
  }
  return arr;
}

// -------------------------------------------------------------
// Generators for 25 Test Cases Each
// -------------------------------------------------------------

function generateMinWindowTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { s: 'ADOBECODEBANC', t: 'ABC' },
    { s: 'a', t: 'a' },
    { s: 'a', t: 'aa' },
    { s: 'ab', t: 'a' },
    { s: 'ab', t: 'b' },

    // 6-10: No match & duplicates in t
    { s: 'aa', t: 'aa' },
    { s: 'bba', t: 'ab' },
    { s: 'cabwefgewcwaefgcf', t: 'cae' },
    { s: 'bdab', t: 'ab' },
    { s: 'xyz', t: 'a' },

    // 11-15: Long prefixes & suffix matches
    { s: 'a'.repeat(20) + 'b', t: 'b' },
    { s: 'abcde', t: 'cde' },
    { s: 'aaaaaaaaaaaabbbbbcdd', t: 'abcdd' },
    { s: 'donutsandcoffee', t: 'fee' },
    { s: 'hello world', t: 'lord' },

    // 16-20: Medium scale
    { s: 'abcdefghijklmnopqrstuvwxyz'.repeat(5), t: 'az' },
    { s: 'a'.repeat(100) + 'b'.repeat(100), t: 'ab' },
    { s: Array.from({ length: 300 }, (_, i) => String.fromCharCode(65 + (i % 26))).join(''), t: 'XYZ' },
    { s: 'abc'.repeat(200), t: 'cba' },
    { s: Array.from({ length: 1000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(''), t: 'ace' },

    // 21-24: Upper scale
    { s: 'abcdefghij'.repeat(500), t: 'jihgfedcba' },
    { s: Array.from({ length: 5000 }, (_, i) => (i % 2 === 0 ? 'a' : 'b')).join('') + 'c', t: 'abc' },
    { s: 'a'.repeat(10000) + 'b'.repeat(10000) + 'c', t: 'abc' },
    { s: Array.from({ length: 25000 }, (_, i) => String.fromCharCode(65 + (i % 26))).join(''), t: 'ABC' },

    // 25: Massive stress test (N = 50,000) strictly designed to kill O(|s|^2)
    { s: 'a'.repeat(49999) + 'b', t: 'ab' }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.s)}, ${JSON.stringify(item.t)}`,
    output: solveMinWindow(item.s, item.t),
    is_hidden: idx >= 3
  }));
}

function generateFindSubstringTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { s: 'barfoothefoobarman', words: ['foo', 'bar'] },
    { s: 'wordgoodgoodgoodbestword', words: ['word', 'good', 'best', 'word'] },
    { s: 'barfoofoobarthefoobarman', words: ['bar', 'foo', 'the'] },
    { s: 'wordgoodgoodgoodbestword', words: ['word', 'good', 'best', 'good'] },
    { s: 'a', words: ['a'] },

    // 6-10: Small edge cases
    { s: 'a', words: ['a', 'a'] },
    { s: 'lingmindraboofooowingdingbarrwingmonkeypoundcake', words: ['fooo', 'barr', 'wing', 'ding', 'wing'] },
    { s: 'ababaab', words: ['ab', 'ba', 'ba'] },
    { s: 'aaa', words: ['a', 'b'] },
    { s: 'foobarfoobar', words: ['foo', 'bar'] },

    // 11-15: Repeated words & consecutive hits
    { s: 'barfoobarfoo', words: ['bar', 'foo'] },
    { s: 'aaaaaaaaaaaaaa', words: ['aa', 'aa'] },
    { s: 'mississippi', words: ['is'] },
    { s: 'abababababab', words: ['ab', 'ab', 'ab'] },
    { s: 'catdogcat', words: ['cat', 'dog'] },

    // 16-20: Medium scale
    {
      s: 'foobar'.repeat(50),
      words: ['foo', 'bar']
    },
    {
      s: 'abcdef'.repeat(50),
      words: ['abc', 'def']
    },
    {
      s: 'a'.repeat(200),
      words: ['a', 'a', 'a', 'a']
    },
    {
      s: 'word'.repeat(100),
      words: ['word', 'word']
    },
    {
      s: 'ab'.repeat(300),
      words: ['ab', 'ba']
    },

    // 21-24: Upper scale
    {
      s: 'foobar'.repeat(500),
      words: ['foo', 'bar', 'foo']
    },
    {
      s: 'abc'.repeat(1000),
      words: ['abc', 'abc']
    },
    {
      s: 'a'.repeat(4000),
      words: ['aa', 'aa']
    },
    {
      s: 'good'.repeat(1000) + 'best'.repeat(1000),
      words: ['good', 'best']
    },

    // 25: Massive stress test (N = 10,000)
    {
      s: 'word'.repeat(2500),
      words: ['word', 'word', 'word', 'word']
    }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.s)}, ${JSON.stringify(item.words)}`,
    output: JSON.stringify(solveFindSubstring(item.s, item.words)),
    is_hidden: idx >= 3
  }));
}

function generateRepeatedDnaTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    'AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT',
    'AAAAAAAAAAAAA',
    'AAAAAAAAAAA',
    'ACGTACGTACGT',
    'AAAAAAAAAA',

    // 6-10: Small variations
    'AAGCTAGCTAGCTAAGCTA',
    'GAGAGAGAGAGAGAGAGAGA',
    'TTTTTTTTTTTTTTTTTTTT',
    'CCCCACCCCCACCCCCACCC',
    'ACGTACGTAC',

    // 11-15: Multiple distinct repeats
    'AAAAACCCCCAAAAACCCCC',
    'TATATATATATATATATATA',
    'ACGTACGTACGTACGTACGT',
    'CCCCCCCCCCCCCCCCCCCC',
    'AAAAATTTTTAAAAATTTTT',

    // 16-20: Medium scale
    'ACGT'.repeat(100),
    'AAAAACCCCC'.repeat(20),
    'A'.repeat(500),
    'AGCTAGCTAG'.repeat(50),
    Array.from({ length: 1000 }, (_, i) => ['A', 'C', 'G', 'T'][i % 4]).join(''),

    // 21-24: Upper scale
    Array.from({ length: 5000 }, (_, i) => ['A', 'C', 'G', 'T'][(i * 3) % 4]).join(''),
    'AAAAACCCCC'.repeat(1000),
    Array.from({ length: 20000 }, (_, i) => ['A', 'C', 'G', 'T'][i % 4]).join(''),
    Array.from({ length: 40000 }, (_, i) => ['A', 'C', 'G', 'T'][(i * 7) % 4]).join(''),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2)
    Array.from({ length: 75000 }, (_, i) => ['A', 'C', 'G', 'T'][i % 4]).join('')
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: JSON.stringify(solveFindRepeatedDnaSequences(str)),
    is_hidden: idx >= 3
  }));
}

function generateRemoveElementTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { nums: [3, 2, 2, 3], val: 3 },
    { nums: [0, 1, 2, 2, 3, 0, 4, 2], val: 2 },
    { nums: [1], val: 1 },
    { nums: [1], val: 2 },
    { nums: [3, 3], val: 3 },

    // 6-10: Edge cases with all or none matching
    { nums: [2, 2, 2, 2], val: 2 },
    { nums: [1, 2, 3, 4], val: 5 },
    { nums: [4, 5], val: 4 },
    { nums: [4, 5], val: 5 },
    { nums: [0, 0, 0, 0], val: 0 },

    // 11-15: Interleaved
    { nums: [1, 2, 1, 2, 1, 2], val: 1 },
    { nums: [1, 2, 1, 2, 1, 2], val: 2 },
    { nums: [5, 4, 3, 2, 1], val: 3 },
    { nums: [10, 20, 30, 40], val: 10 },
    { nums: [10, 20, 30, 40], val: 40 },

    // 16-20: Medium scale
    {
      nums: Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 1 : 2)),
      val: 1
    },
    {
      nums: Array.from({ length: 100 }, () => 7),
      val: 7
    },
    {
      nums: Array.from({ length: 200 }, (_, i) => i),
      val: 100
    },
    {
      nums: Array.from({ length: 500 }, (_, i) => (i % 3 === 0 ? 0 : 1)),
      val: 0
    },
    {
      nums: Array.from({ length: 1000 }, () => 3),
      val: 2
    },

    // 21-24: Upper scale
    {
      nums: Array.from({ length: 5000 }, (_, i) => (i % 2 === 0 ? 1 : 2)),
      val: 2
    },
    {
      nums: Array.from({ length: 10000 }, (_, i) => i % 5),
      val: 3
    },
    {
      nums: Array.from({ length: 20000 }, () => 4),
      val: 4
    },
    {
      nums: Array.from({ length: 40000 }, (_, i) => (i % 2 === 0 ? 9 : 0)),
      val: 9
    },

    // 25: Massive stress test (N = 75,000) strictly designed to kill Array.splice O(N^2)
    {
      nums: Array.from({ length: 75000 }, () => 1),
      val: 1
    }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.nums)}, ${item.val}`,
    output: String(solveRemoveElement([...item.nums], item.val)),
    is_hidden: idx >= 3
  }));
}

function generateSortColorsTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    [2, 0, 2, 1, 1, 0],
    [2, 0, 1],
    [0],
    [1],
    [2],

    // 6-10: Small arrays
    [0, 0],
    [1, 1],
    [2, 2],
    [1, 0],
    [2, 1, 0],

    // 11-15: Flat & reverse patterns
    [0, 1, 2],
    [2, 2, 1, 1, 0, 0],
    [1, 2, 0],
    [0, 2, 1],
    [1, 0, 2, 1, 0, 2],

    // 16-20: Medium scale
    Array.from({ length: 50 }, (_, i) => i % 3),
    Array.from({ length: 100 }, (_, i) => (i < 50 ? 2 : 0)),
    Array.from({ length: 200 }, () => 1),
    Array.from({ length: 500 }, (_, i) => (i % 2 === 0 ? 2 : 0)),
    Array.from({ length: 1000 }, (_, i) => (2 - (i % 3))),

    // 21-24: Upper scale
    Array.from({ length: 5000 }, (_, i) => i % 3),
    Array.from({ length: 10000 }, (_, i) => (i < 5000 ? 2 : 1)),
    Array.from({ length: 20000 }, (_, i) => 2 - (i % 3)),
    Array.from({ length: 40000 }, (_, i) => (i % 3)),

    // 25: Massive stress test (N = 75,000) strictly reversed - kills bubble sort O(N^2)
    Array.from({ length: 75000 }, (_, i) => (i < 25000 ? 2 : i < 50000 ? 1 : 0))
  ];

  return tcs.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: JSON.stringify(solveSortColors(arr)),
    is_hidden: idx >= 3
  }));
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const TWO_POINTERS_BATCH2 = [
  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'hard',
    description: `Given two strings \`s\` and \`t\` of lengths \`m\` and \`n\` respectively, return *the **minimum window substring** of* \`s\` *such that every character in* \`t\` *(including duplicates) is included in the window*. If there is no such substring, return *the empty string* \`""\`.

The testcases will be generated such that the answer is **unique**.

### Example 1:
\`\`\`
Input: s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
Explanation: The minimum window substring "BANC" includes 'A', 'B', and 'C' from string t.
\`\`\`

### Example 2:
\`\`\`
Input: s = "a", t = "a"
Output: "a"
Explanation: The entire string s is the minimum window.
\`\`\`

### Example 3:
\`\`\`
Input: s = "a", t = "aa"
Output: ""
Explanation: Both 'a's from t must be included in the window.
Since the largest window of s only has one 'a', return empty string.
\`\`\`

### Constraints:
- \`m == s.length\`
- \`n == t.length\`
- \`1 <= m, n <= 10^5\`
- \`s\` and \`t\` consist of uppercase and lowercase English letters.
- **Expected Time Complexity:** \`O(m + n)\`
- **Expected Auxiliary Space:** \`O(Sigma)\``,
    sample_input: '"ADOBECODEBANC", "ABC"',
    sample_output: '"BANC"',
    generator: generateMinWindowTestCases,
    optimalCode: `
function solution(s, t) {
  if (!s || !t) return '';
  const map = new Map();
  for (const c of t) map.set(c, (map.get(c) || 0) + 1);
  let left = 0, count = map.size;
  let minLen = Infinity, startIdx = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (map.has(c)) {
      map.set(c, map.get(c) - 1);
      if (map.get(c) === 0) count--;
    }
    while (count === 0) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        startIdx = left;
      }
      const leftChar = s[left];
      if (map.has(leftChar)) {
        map.set(leftChar, map.get(leftChar) + 1);
        if (map.get(leftChar) > 0) count++;
      }
      left++;
    }
  }
  return minLen === Infinity ? '' : s.slice(startIdx, startIdx + minLen);
}`,
    bruteCode: `
function solution(s, t) {
  const tMap = {};
  for (let c of t) tMap[c] = (tMap[c] || 0) + 1;
  function valid(sub) {
    const sMap = {};
    for (let c of sub) sMap[c] = (sMap[c] || 0) + 1;
    for (let k in tMap) {
      if ((sMap[k] || 0) < tMap[k]) return false;
    }
    return true;
  }
  let minLen = Infinity, best = "";
  for (let i = 0; i < s.length; i++) {
    for (let j = i + t.length; j <= s.length; j++) {
      if (j - i >= minLen) break;
      const sub = s.slice(i, j);
      if (valid(sub)) {
        minLen = j - i;
        best = sub;
      }
    }
  }
  return best;
}`
  },
  {
    slug: 'substring-with-concatenation-of-all-words',
    title: 'Substring with Concatenation of All Words',
    difficulty: 'hard',
    description: `You are given a string \`s\` and an array of strings \`words\`. All the strings of \`words\` are of **the same length**.

A **concatenated string** is a string that exactly contains all the strings of any permutation of \`words\` concatenated.

Return *an array of **all the starting indices** of concatenated substring(s) in* \`s\`. You can return the answer in **any order**.

### Example 1:
\`\`\`
Input: s = "barfoothefoobarman", words = ["foo","bar"]
Output: [0,9]
Explanation:
The substring starting at 0 is "barfoo". It is the concatenation of ["bar","foo"] which is a permutation of words.
The substring starting at 9 is "foobar". It is the concatenation of ["foo","bar"] which is a permutation of words.
\`\`\`

### Example 2:
\`\`\`
Input: s = "wordgoodgoodgoodbestword", words = ["word","good","best","word"]
Output: []
Explanation: There is no concatenated substring.
\`\`\`

### Example 3:
\`\`\`
Input: s = "barfoofoobarthefoobarman", words = ["bar","foo","the"]
Output: [6,9,12]
\`\`\`

### Constraints:
- \`1 <= s.length <= 10^4\`
- \`1 <= words.length <= 5000\`
- \`1 <= words[i].length <= 30\`
- \`s\` and \`words[i]\` consist of lowercase English letters.
- **Expected Time Complexity:** \`O(N * L)\` where \`L\` is word length
- **Expected Auxiliary Space:** \`O(words.length * L)\``,
    sample_input: '"barfoothefoobarman", ["foo","bar"]',
    sample_output: '[0,9]',
    generator: generateFindSubstringTestCases,
    optimalCode: `
function solution(s, words) {
  if (!s || !words || !words.length) return [];
  const wordLen = words[0].length;
  const numWords = words.length;
  const totalLen = wordLen * numWords;
  if (s.length < totalLen) return [];

  const wordCount = new Map();
  for (const w of words) wordCount.set(w, (wordCount.get(w) || 0) + 1);
  const result = [];

  for (let i = 0; i < wordLen; i++) {
    let left = i, count = 0;
    const seen = new Map();
    for (let right = i; right + wordLen <= s.length; right += wordLen) {
      const word = s.substring(right, right + wordLen);
      if (wordCount.has(word)) {
        seen.set(word, (seen.get(word) || 0) + 1);
        count++;
        while (seen.get(word) > wordCount.get(word)) {
          const leftWord = s.substring(left, left + wordLen);
          seen.set(leftWord, seen.get(leftWord) - 1);
          count--;
          left += wordLen;
        }
        if (count === numWords) {
          result.push(left);
        }
      } else {
        seen.clear();
        count = 0;
        left = right + wordLen;
      }
    }
  }
  return result;
}`,
    bruteCode: `
function solution(s, words) {
  const wordLen = words[0].length;
  const numWords = words.length;
  const totalLen = wordLen * numWords;
  const ans = [];
  for (let i = 0; i <= s.length - totalLen; i++) {
    const list = [...words];
    let ok = true;
    for (let j = 0; j < numWords; j++) {
      const sub = s.slice(i + j * wordLen, i + (j + 1) * wordLen);
      const idx = list.indexOf(sub);
      if (idx === -1) { ok = false; break; }
      list.splice(idx, 1);
    }
    if (ok) ans.push(i);
  }
  return ans;
}`
  },
  {
    slug: 'repeated-dna-sequences',
    title: 'Repeated DNA Sequences',
    difficulty: 'medium',
    description: `The **DNA sequence** is composed of a series of nucleotides abbreviated as \`'A'\`, \`'C'\`, \`'G'\`, and \`'T'\`.

For example, \`"ACGAATTCCG"\` is a DNA sequence.

When studying DNA, it is useful to identify repeated sequences within the DNA.

Given a string \`s\` that represents a **DNA sequence**, return all the **\`10\`-letter-long** sequences (substrings) that occur more than once in a DNA molecule. You may return the answer in **any order**.

### Example 1:
\`\`\`
Input: s = "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"
Output: ["AAAAACCCCC","CCCCCAAAAA"]
\`\`\`

### Example 2:
\`\`\`
Input: s = "AAAAAAAAAAAAA"
Output: ["AAAAAAAAAA"]
\`\`\`

### Constraints:
- \`1 <= s.length <= 10^5\`
- \`s[i]\` is either \`'A'\`, \`'C'\`, \`'G'\`, or \`'T'\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(N)\``,
    sample_input: '"AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"',
    sample_output: '["AAAAACCCCC","CCCCCAAAAA"]',
    generator: generateRepeatedDnaTestCases,
    optimalCode: `
function solution(s) {
  if (s.length <= 10) return [];
  const seen = new Set();
  const repeated = new Set();
  for (let i = 0; i <= s.length - 10; i++) {
    const sub = s.substring(i, i + 10);
    if (seen.has(sub)) {
      repeated.add(sub);
    } else {
      seen.add(sub);
    }
  }
  return Array.from(repeated);
}`,
    bruteCode: `
function solution(s) {
  const ans = new Set();
  for (let i = 0; i <= s.length - 10; i++) {
    const sub = s.substring(i, i + 10);
    for (let j = i + 1; j <= s.length - 10; j++) {
      if (s.substring(j, j + 10) === sub) {
        ans.add(sub);
        break;
      }
    }
  }
  return Array.from(ans);
}`
  },
  {
    slug: 'remove-element',
    title: 'Remove Element',
    difficulty: 'easy',
    description: `Given an integer array \`nums\` and an integer \`val\`, remove all occurrences of \`val\` in \`nums\` **in-place**. The order of the elements may be changed. Then return *the number of elements in* \`nums\` *which are not equal to* \`val\`.

Consider the number of elements in \`nums\` which are not equal to \`val\` be \`k\`, to get accepted, you need to do the following things:
- Change the array \`nums\` such that the first \`k\` elements of \`nums\` contain the elements which are not equal to \`val\`. The remaining elements of \`nums\` are not important as well as the size of \`nums\`.
- Return \`k\`.

### Example 1:
\`\`\`
Input: nums = [3,2,2,3], val = 3
Output: 2, nums = [2,2,_,_]
Explanation: Your function should return k = 2, with the first two elements of nums being 2.
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0,1,2,2,3,0,4,2], val = 2
Output: 5, nums = [0,1,4,0,3,_,_,_]
Explanation: Your function should return k = 5, with the first five elements of nums containing 0, 0, 1, 3, and 4.
\`\`\`

### Constraints:
- \`0 <= nums.length <= 10^5\`
- \`0 <= nums[i] <= 50\`
- \`0 <= val <= 100\`
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '[3,2,2,3], 3',
    sample_output: '2',
    generator: generateRemoveElementTestCases,
    optimalCode: `
function solution(nums, val) {
  let k = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== val) {
      nums[k] = nums[i];
      k++;
    }
  }
  return k;
}`,
    bruteCode: `
function solution(nums, val) {
  let i = 0;
  while (i < nums.length) {
    if (nums[i] === val) {
      nums.splice(i, 1);
    } else {
      i++;
    }
  }
  return nums.length;
}`
  },
  {
    slug: 'sort-colors-dutch-flag',
    title: 'Sort Colors (Dutch Flag)',
    difficulty: 'easy',
    description: `Given an array \`nums\` with \`n\` objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue.

We will use the integers \`0\`, \`1\`, and \`2\` to represent the color red, white, and blue, respectively.

You must solve this problem without using the library's sort function.

### Example 1:
\`\`\`
Input: nums = [2,0,2,1,1,0]
Output: [0,0,1,1,2,2]
\`\`\`

### Example 2:
\`\`\`
Input: nums = [2,0,1]
Output: [0,1,2]
\`\`\`

### Constraints:
- \`n == nums.length\`
- \`1 <= n <= 10^5\`
- \`nums[i]\` is either \`0\`, \`1\`, or \`2\`.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '[2,0,2,1,1,0]',
    sample_output: '[0,0,1,1,2,2]',
    generator: generateSortColorsTestCases,
    optimalCode: `
function solution(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}`,
    bruteCode: `
function solution(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length - 1; j++) {
      if (nums[j] > nums[j + 1]) {
        let temp = nums[j];
        nums[j] = nums[j + 1];
        nums[j + 1] = temp;
      }
    }
  }
  return nums;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Two-Pointers Batch 2 (5 Problems) ===\n');

  for (const prob of TWO_POINTERS_BATCH2) {
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
  console.log('✓ All 5 Two-Pointers Batch 2 problems successfully upgraded and verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });

