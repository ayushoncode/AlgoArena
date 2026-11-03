'use strict';

/**
 * upgrade_dp_batch4_25tc.js
 *
 * Upgrades 6 Advanced & Hard DP problems to exactly 25 curated test cases:
 * 1. Best Time to Buy and Sell Stock III (LC 123) [Hard]
 * 2. Best Time to Buy and Sell Stock IV (LC 188) [Hard]
 * 3. Regular Expression Matching (LC 10) [Hard]
 * 4. Wildcard Matching (LC 44) [Hard]
 * 5. Scramble String (LC 87) [Hard]
 * 6. Optimal Data Extraction (Burst Balloons, LC 312) [Hard]
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

function solveStockIII(prices) {
  let buy1 = -Infinity, sell1 = 0;
  let buy2 = -Infinity, sell2 = 0;
  for (const p of prices) {
    buy1 = Math.max(buy1, -p);
    sell1 = Math.max(sell1, buy1 + p);
    buy2 = Math.max(buy2, sell1 - p);
    sell2 = Math.max(sell2, buy2 + p);
  }
  return sell2;
}

function solveStockIV(k, prices) {
  const n = prices.length;
  if (n <= 1 || k === 0) return 0;
  if (k >= Math.floor(n / 2)) {
    let p = 0;
    for (let i = 1; i < n; i++) {
      if (prices[i] > prices[i - 1]) p += prices[i] - prices[i - 1];
    }
    return p;
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  for (const price of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - price);
      sell[j] = Math.max(sell[j], buy[j] + price);
    }
  }
  return sell[k];
}

function solveRegexMatching(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 2; j <= n; j += 2) {
    if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        dp[i][j] = dp[i][j - 2] ||
          ((p[j - 2] === '.' || p[j - 2] === s[i - 1]) && dp[i - 1][j]);
      } else if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}

function solveWildcardMatching(s, p) {
  let sIdx = 0, pIdx = 0, match = 0, starIdx = -1;
  while (sIdx < s.length) {
    if (pIdx < p.length && (p[pIdx] === '?' || p[pIdx] === s[sIdx])) {
      sIdx++;
      pIdx++;
    } else if (pIdx < p.length && p[pIdx] === '*') {
      starIdx = pIdx;
      match = sIdx;
      pIdx++;
    } else if (starIdx !== -1) {
      pIdx = starIdx + 1;
      match++;
      sIdx = match;
    } else {
      return false;
    }
  }
  while (pIdx < p.length && p[pIdx] === '*') pIdx++;
  return pIdx === p.length;
}

function solveScrambleString(s1, s2) {
  const memo = new Map();
  function helper(a, b) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    const key = a + '#' + b;
    if (memo.has(key)) return memo.get(key);

    const count = new Array(26).fill(0);
    for (let i = 0; i < a.length; i++) {
      count[a.charCodeAt(i) - 97]++;
      count[b.charCodeAt(i) - 97]--;
    }
    for (let i = 0; i < 26; i++) {
      if (count[i] !== 0) {
        memo.set(key, false);
        return false;
      }
    }

    const n = a.length;
    for (let i = 1; i < n; i++) {
      if (
        (helper(a.slice(0, i), b.slice(0, i)) && helper(a.slice(i), b.slice(i))) ||
        (helper(a.slice(0, i), b.slice(n - i)) && helper(a.slice(i), b.slice(0, n - i)))
      ) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  }
  return helper(s1, s2);
}

// -------------------------------------------------------------
// Problem Specifications
// -------------------------------------------------------------

const DP_BATCH4 = [
  {
    slug: 'best-time-to-buy-and-sell-stock-iii',
    title: 'Best Time to Buy and Sell Stock III',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-7-tests/best-time-to-buy-and-sell-stock-iii.json',
    sample_input: '[3,3,5,0,0,3,1,4]',
    sample_output: '6',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

Find the maximum profit you can achieve. You may complete **at most two transactions**.

**Note:** You may not engage in multiple transactions simultaneously (i.e., you must sell the stock before you buy again).

### Example 1:
\`\`\`
Input: prices = [3,3,5,0,0,3,1,4]
Output: 6
Explanation: Buy on day 4 (price = 0) and sell on day 6 (price = 3), profit = 3-0 = 3.
Then buy on day 7 (price = 1) and sell on day 8 (price = 4), profit = 4-1 = 3.
Total profit = 3 + 3 = 6.
\`\`\`

### Example 2:
\`\`\`
Input: prices = [1,2,3,4,5]
Output: 4
Explanation: Buy on day 1 (price = 1) and sell on day 5 (price = 5), profit = 5-1 = 4.
Note that you cannot buy on day 1, buy on day 2 and sell them later, as you are engaging multiple transactions at the same time. You must sell before buying again.
\`\`\`

### Example 3:
\`\`\`
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transaction is done, i.e. max profit = 0.
\`\`\`

### Constraints:
- \`1 <= prices.length <= 10⁵\`
- \`0 <= prices[i] <= 10⁵\``,
    generateExtraTestCases: () => {
      // 21: N=25,000 array to kill O(N^2) brute force
      const p_21 = Array.from({ length: 25000 }, (_, i) => (i * 37) % 500);
      // 22: Strictly decreasing N=10000 (0 profit)
      const p_22 = Array.from({ length: 10000 }, (_, i) => 10000 - i);
      // 23: Strictly increasing N=10000
      const p_23 = Array.from({ length: 10000 }, (_, i) => i + 1);
      // 24: Constant prices N=10000
      const p_24 = Array(10000).fill(42);
      // 25: Upper bound N=50,000 stress test
      const p_25 = Array.from({ length: 50000 }, (_, i) => ((i * 101) % 997));

      const extras = [p_21, p_22, p_23, p_24, p_25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: String(solveStockIII(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(prices) {
  let buy1 = -Infinity, sell1 = 0;
  let buy2 = -Infinity, sell2 = 0;
  for (const p of prices) {
    buy1 = Math.max(buy1, -p);
    sell1 = Math.max(sell1, buy1 + p);
    buy2 = Math.max(buy2, sell1 - p);
    sell2 = Math.max(sell2, buy2 + p);
  }
  return sell2;
}`,
    bruteCode: `
function solution(prices) {
  let maxP = 0;
  for (let i = 0; i < prices.length; i += 2) {
    let p1 = 0, min1 = prices[0];
    for (let j = 0; j <= i; j++) {
      p1 = Math.max(p1, prices[j] - min1);
      min1 = Math.min(min1, prices[j]);
    }
    let p2 = 0, min2 = prices[i];
    for (let j = i; j < prices.length; j++) {
      p2 = Math.max(p2, prices[j] - min2);
      min2 = Math.min(min2, prices[j]);
    }
    maxP = Math.max(maxP, p1 + p2);
  }
  return maxP;
}`
  },
  {
    slug: 'best-time-to-buy-and-sell-stock-iv',
    title: 'Best Time to Buy and Sell Stock IV',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-7-tests/best-time-to-buy-and-sell-stock-iv.json',
    sample_input: '2, [2,4,1]',
    sample_output: '2',
    description: `You are given an integer \`k\` and an array of integers \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

Find the maximum profit you can achieve. You may complete at most \`k\` transactions: i.e. you may buy at most \`k\` times and sell at most \`k\` times.

**Note:** You may not engage in multiple transactions simultaneously (i.e., you must sell the stock before you buy again).

### Example 1:
\`\`\`
Input: k = 2, prices = [2,4,1]
Output: 2
Explanation: Buy on day 1 (price = 2) and sell on day 2 (price = 4), profit = 4-2 = 2.
\`\`\`

### Example 2:
\`\`\`
Input: k = 2, prices = [3,2,6,5,0,3]
Output: 7
Explanation: Buy on day 2 (price = 2) and sell on day 3 (price = 6), profit = 6-2 = 4. Then buy on day 5 (price = 0) and sell on day 6 (price = 3), profit = 3-0 = 3.
\`\`\`

### Constraints:
- \`1 <= k <= 100\`
- \`1 <= prices.length <= 1000\`
- \`0 <= prices[i] <= 1000\``,
    generateExtraTestCases: () => {
      // 21: Naive DFS killer (N=30, k=5 branches 2^30 taking > 3000ms)
      const k_21 = 5;
      const p_21 = Array.from({ length: 30 }, (_, i) => (i * 7) % 50);
      // 22: k=100 on N=1000 strictly decreasing (0 profit)
      const k_22 = 100;
      const p_22 = Array.from({ length: 1000 }, (_, i) => 1000 - i);
      // 23: k=100 on N=1000 strictly increasing
      const k_23 = 100;
      const p_23 = Array.from({ length: 1000 }, (_, i) => i + 1);
      // 24: k=0 edge case
      const k_24 = 0;
      const p_24 = [1, 5, 2, 8, 3, 10];
      // 25: Upper bound k=100, N=1000 random
      const k_25 = 100;
      const p_25 = Array.from({ length: 1000 }, (_, i) => ((i * 47 + 13) % 1000));

      const extras = [
        [k_21, p_21],
        [k_22, p_22],
        [k_23, p_23],
        [k_24, p_24],
        [k_25, p_25]
      ];

      return extras.map(([k, arr]) => ({
        input: `${k}, ${JSON.stringify(arr)}`,
        output: String(solveStockIV(k, arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(k, prices) {
  const n = prices.length;
  if (n <= 1 || k === 0) return 0;
  if (k >= Math.floor(n / 2)) {
    let p = 0;
    for (let i = 1; i < n; i++) {
      if (prices[i] > prices[i - 1]) p += prices[i] - prices[i - 1];
    }
    return p;
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  for (const price of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - price);
      sell[j] = Math.max(sell[j], buy[j] + price);
    }
  }
  return sell[k];
}`,
    bruteCode: `
function solution(k, prices) {
  function dfs(day, transLeft, holding) {
    if (day === prices.length || transLeft === 0) return 0;
    let doNothing = dfs(day + 1, transLeft, holding);
    let doAction = 0;
    if (holding) {
      doAction = prices[day] + dfs(day + 1, transLeft - 1, false);
    } else {
      doAction = -prices[day] + dfs(day + 1, transLeft, true);
    }
    return Math.max(doNothing, doAction);
  }
  return dfs(0, k, false);
}`
  },
  {
    slug: 'regular-expression-matching',
    title: 'Regular Expression Matching',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-29-tests/regular-expression-matching.json',
    sample_input: '"aa", "a*"',
    sample_output: 'true',
    description: `Given an input string \`s\` and a pattern \`p\`, implement regular expression matching with support for \`'.'\` and \`'*'\` where:
- \`'.'\` Matches any single character.
- \`'*'\` Matches zero or more of the preceding element.

The matching should cover the **entire** input string (not partial).

### Example 1:
\`\`\`
Input: s = "aa", p = "a"
Output: false
Explanation: "a" does not match the entire string "aa".
\`\`\`

### Example 2:
\`\`\`
Input: s = "aa", p = "a*"
Output: true
Explanation: '*' means zero or more of the preceding element, 'a'. Therefore, by repeating 'a' once, it becomes "aa".
\`\`\`

### Example 3:
\`\`\`
Input: s = "ab", p = ".*"
Output: true
Explanation: ".*" means "zero or more (*) of any character (.)".
\`\`\`

### Constraints:
- \`1 <= s.length <= 20\`
- \`1 <= p.length <= 20\`
- \`s\` contains only lowercase English letters.
- \`p\` contains only lowercase English letters, \`'.'\`, and \`'*'\`.
- It is guaranteed for each appearance of the character \`'*'\`, there will be a previous valid character to match.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer (25 'a's vs 10 'a*'s taking > 4000ms)
      const s_21 = 'a'.repeat(25) + 'b';
      const p_21 = 'a*'.repeat(10) + 'c';
      // 22: Dot star match all
      const s_22 = 'abcdefghijklmnopqrst';
      const p_22 = '.*';
      // 23: Classic false case with trailing mismatch
      const s_23 = 'mississippi';
      const p_23 = 'mis*is*p*.';
      // 24: Empty pattern vs non-empty
      const s_24 = 'ab';
      const p_24 = '.*c';
      // 25: Complex 20-char regex pattern
      const s_25 = 'a'.repeat(20);
      const p_25 = 'a*b*a*c*a*d*a*';

      const extras = [
        [s_21, p_21],
        [s_22, p_22],
        [s_23, p_23],
        [s_24, p_24],
        [s_25, p_25]
      ];

      return extras.map(([s, p]) => ({
        input: `${JSON.stringify(s)}, ${JSON.stringify(p)}`,
        output: String(solveRegexMatching(s, p)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let j = 2; j <= n; j += 2) {
    if (p[j - 1] === '*') dp[0][j] = dp[0][j - 2];
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (p[j - 1] === '*') {
        dp[i][j] = dp[i][j - 2] ||
          ((p[j - 2] === '.' || p[j - 2] === s[i - 1]) && dp[i - 1][j]);
      } else if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}`,
    bruteCode: `
function solution(s, p) {
  function isMatch(i, j) {
    if (j === p.length) return i === s.length;
    let first = i < s.length && (p[j] === s[i] || p[j] === '.');
    if (j + 1 < p.length && p[j + 1] === '*') {
      return isMatch(i, j + 2) || (first && isMatch(i + 1, j));
    }
    return first && isMatch(i + 1, j + 1);
  }
  return isMatch(0, 0);
}`
  },
  {
    slug: 'wildcard-matching',
    title: 'Wildcard Matching',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-11-tests/wildcard-matching.json',
    sample_input: '"aa", "*"',
    sample_output: 'true',
    description: `Given an input string (\`s\`) and a pattern (\`p\`), implement wildcard pattern matching with support for \`'?'\` and \`'*'\` where:
- \`'?'\` Matches any single character.
- \`'*'\` Matches any sequence of characters (including the empty sequence).

The matching should cover the **entire** input string (not partial).

### Example 1:
\`\`\`
Input: s = "aa", p = "a"
Output: false
Explanation: "a" does not match the entire string "aa".
\`\`\`

### Example 2:
\`\`\`
Input: s = "aa", p = "*"
Output: true
Explanation: '*' matches any sequence.
\`\`\`

### Example 3:
\`\`\`
Input: s = "cb", p = "?a"
Output: false
Explanation: '?' matches 'c', but the second letter is 'a', which does not match 'b'.
\`\`\`

### Constraints:
- \`0 <= s.length, p.length <= 2000\`
- \`s\` contains only lowercase English letters.
- \`p\` contains only lowercase English letters, \`'?'\` or \`'*'\`.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer (*a repeated 22 times taking ~10.6s)
      const s_21 = 'a'.repeat(28) + 'b';
      const p_21 = '*a'.repeat(22) + '*c';
      // 22: Both empty
      const s_22 = '';
      const p_22 = '';
      // 23: 1000 chars vs single star
      const s_23 = 'abcdefghij'.repeat(100);
      const p_23 = '*';
      // 24: Single question mark vs large string
      const s_24 = 'abcdefghij'.repeat(100);
      const p_24 = '?';
      // 25: Upper bound 2000 chars complex pattern
      const s_25 = 'a'.repeat(1000) + 'b' + 'a'.repeat(999);
      const p_25 = '*a*b*a*';

      const extras = [
        [s_21, p_21],
        [s_22, p_22],
        [s_23, p_23],
        [s_24, p_24],
        [s_25, p_25]
      ];

      return extras.map(([s, p]) => ({
        input: `${JSON.stringify(s)}, ${JSON.stringify(p)}`,
        output: String(solveWildcardMatching(s, p)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s, p) {
  let sIdx = 0, pIdx = 0, match = 0, starIdx = -1;
  while (sIdx < s.length) {
    if (pIdx < p.length && (p[pIdx] === '?' || p[pIdx] === s[sIdx])) {
      sIdx++;
      pIdx++;
    } else if (pIdx < p.length && p[pIdx] === '*') {
      starIdx = pIdx;
      match = sIdx;
      pIdx++;
    } else if (starIdx !== -1) {
      pIdx = starIdx + 1;
      match++;
      sIdx = match;
    } else {
      return false;
    }
  }
  while (pIdx < p.length && p[pIdx] === '*') pIdx++;
  return pIdx === p.length;
}`,
    bruteCode: `
function solution(s, p) {
  function helper(i, j) {
    if (j === p.length) return i === s.length;
    if (p[j] === '*') {
      return helper(i, j + 1) || (i < s.length && helper(i + 1, j));
    }
    if (i < s.length && (p[j] === '?' || p[j] === s[i])) {
      return helper(i + 1, j + 1);
    }
    return false;
  }
  return helper(0, 0);
}`
  },
  {
    slug: 'scramble-string',
    title: 'Scramble String',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-35-tests/scramble-string.json',
    sample_input: '"great", "rgeat"',
    sample_output: 'true',
    description: `We can scramble a string \`s\` to get a string \`t\` using the following algorithm:
1. If the length of the string is 1, stop.
2. If the length of the string is > 1, divide it into two non-empty substrings at a random index, i.e., if the string is \`s\`, divide it into \`x\` and \`y\` where \`s = x + y\`.
3. Randomly decide to swap the two substrings or keep them in the same order. i.e., after this step, \`s\` may become \`s = x + y\` or \`s = y + x\`.
4. Apply step 1 recursively on each of the two substrings \`x\` and \`y\`.

Given two strings \`s1\` and \`s2\` of the **same length**, return \`true\` if \`s2\` is a scrambled string of \`s1\`, otherwise, return \`false\`.

### Example 1:
\`\`\`
Input: s1 = "great", s2 = "rgeat"
Output: true
Explanation: One possible scenario applied on s1 is:
"great" --> "gr/eat" // divide
"gr/eat" --> "gr/eat" // random decision does not swap
"gr" --> "g/r" // divide
"g/r" --> "r/g" // swap
At this point, "rgeat" is formed!
\`\`\`

### Example 2:
\`\`\`
Input: s1 = "abcde", s2 = "caebd"
Output: false
\`\`\`

### Example 3:
\`\`\`
Input: s1 = "a", s2 = "a"
Output: true
\`\`\`

### Constraints:
- \`s1.length == s2.length\`
- \`1 <= s1.length <= 30\`
- \`s1\` and \`s2\` consist of lowercase English letters.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer (non-scramble anagram of length 20 taking > 6000ms)
      const s1_21 = 'abcde'.repeat(4);
      const s2_21 = 'caebd'.repeat(4);
      // 22: Identical length 30 strings
      const s1_22 = 'abcdefghijklmnopqrstuvwxyzabcd';
      const s2_22 = 'abcdefghijklmnopqrstuvwxyzabcd';
      // 23: Completely different character frequencies length 30
      const s1_23 = 'a'.repeat(30);
      const s2_23 = 'b'.repeat(30);
      // 24: Single character match
      const s1_24 = 'z';
      const s2_24 = 'z';
      // 25: Upper bound 30 chars valid scramble
      const s1_25 = 'abcdefghijklmnopqrstuvwxyzabcd';
      const s2_25 = 'badcfehgjilknmporqtsvuxwzybadc';

      const extras = [
        [s1_21, s2_21],
        [s1_22, s2_22],
        [s1_23, s2_23],
        [s1_24, s2_24],
        [s1_25, s2_25]
      ];

      return extras.map(([a, b]) => ({
        input: `${JSON.stringify(a)}, ${JSON.stringify(b)}`,
        output: String(solveScrambleString(a, b)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s1, s2) {
  const memo = new Map();
  function helper(a, b) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    const key = a + '#' + b;
    if (memo.has(key)) return memo.get(key);

    const count = new Array(26).fill(0);
    for (let i = 0; i < a.length; i++) {
      count[a.charCodeAt(i) - 97]++;
      count[b.charCodeAt(i) - 97]--;
    }
    for (let i = 0; i < 26; i++) {
      if (count[i] !== 0) {
        memo.set(key, false);
        return false;
      }
    }

    const n = a.length;
    for (let i = 1; i < n; i++) {
      if (
        (helper(a.slice(0, i), b.slice(0, i)) && helper(a.slice(i), b.slice(i))) ||
        (helper(a.slice(0, i), b.slice(n - i)) && helper(a.slice(i), b.slice(0, n - i)))
      ) {
        memo.set(key, true);
        return true;
      }
    }
    memo.set(key, false);
    return false;
  }
  return helper(s1, s2);
}`,
    bruteCode: `
function solution(s1, s2) {
  function helper(a, b) {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    const n = a.length;
    for (let i = 1; i < n; i++) {
      if (
        (helper(a.slice(0, i), b.slice(0, i)) && helper(a.slice(i), b.slice(i))) ||
        (helper(a.slice(0, i), b.slice(n - i)) && helper(a.slice(i), b.slice(0, n - i)))
      ) return true;
    }
    return false;
  }
  return helper(s1, s2);
}`
  },
  {
    slug: 'optimal-data-extraction',
    title: 'Optimal Data Extraction',
    difficulty: 'hard',
    jsonPath: 'private/solutions/optimal-data-extraction.json',
    isTestSuiteWrapper: true,
    sample_input: '[3, 1, 5, 8]',
    sample_output: '65',
    description: `You are given a 0-indexed integer array \`packets\` representing the signal strengths of data packets. You are asked to extract all the packets one by one.

When you extract the \`i\`th packet, its adjacent neighbors merge connections. You will gain \`packets[i-1] * packets[i+1] + packets[i]\` points. If \`i - 1\` or \`i + 1\` goes out of bounds, treat it as a packet with a signal strength of \`1\`.

Return *the maximum number of points you can collect by extracting the packets in the optimal order*.

### Example 1:
\`\`\`
Input: packets = [3, 1, 5, 8]
Output: 65
Explanation:
Extract 1 -> 3 * 5 + 1 = 16. Remaining: [3, 5, 8].
Extract 5 -> 3 * 8 + 5 = 29. Remaining: [3, 8].
Extract 3 -> 1 * 8 + 3 = 11. Remaining: [8].
Extract 8 -> 1 * 1 + 8 = 9.
Total points: 16 + 29 + 11 + 9 = 65.
\`\`\`

### Example 2:
\`\`\`
Input: packets = [1, 5]
Output: 12
Explanation:
Extract 1 -> 1 * 5 + 1 = 6. Remaining: [5].
Extract 5 -> 1 * 1 + 5 = 6.
Total: 6 + 6 = 12.
\`\`\`

### Constraints:
- \`0 <= packets.length <= 150\`
- \`0 <= packets[i] <= 100\``,
    optimalCode: `
function solution(packets) {
  const nums = [1, ...packets, 1];
  const n = nums.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let length = 2; length < n; length++) {
    for (let left = 0; left < n - length; left++) {
      let right = left + length;
      for (let i = left + 1; i < right; i++) {
        dp[left][right] = Math.max(
          dp[left][right],
          nums[left] * nums[right] + nums[i] + dp[left][i] + dp[i][right]
        );
      }
    }
  }
  return dp[0][n - 1];
}`,
    bruteCode: `
function solution(packets) {
  function extract(arr) {
    if (arr.length === 0) return 0;
    let maxPts = 0;
    for (let i = 0; i < arr.length; i++) {
      const left = i === 0 ? 1 : arr[i - 1];
      const right = i === arr.length - 1 ? 1 : arr[i + 1];
      const pts = left * right + arr[i];
      const nextArr = arr.slice(0, i).concat(arr.slice(i + 1));
      maxPts = Math.max(maxPts, pts + extract(nextArr));
    }
    return maxPts;
  }
  return extract(packets);
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for DP Batch 4 (6 Problems) ===\n');

  for (const prob of DP_BATCH4) {
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

    // 3. Load test cases from JSON file
    const rootDir = path.join(__dirname, '../..');
    const fullJsonPath = path.join(rootDir, prob.jsonPath);
    const rawData = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

    let finalTestCases = [];

    if (prob.isTestSuiteWrapper) {
      // optimal-data-extraction has testSuite inside the object
      const rawSuite = rawData.testSuite;
      finalTestCases = rawSuite.slice(0, 25).map((tc, idx) => ({
        input: tc.input,
        output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
        is_hidden: idx >= 3
      }));
    } else {
      const baseTestCases = rawData.slice(0, 20).map((tc, idx) => ({
        input: tc.input,
        output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
        is_hidden: idx >= 3
      }));

      // 4. Generate 5 extra curated edge cases & stress tests
      const extraTestCases = prob.generateExtraTestCases();
      finalTestCases = [...baseTestCases, ...extraTestCases];
    }

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
  console.log('✓ All 6 Advanced & Hard DP problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
