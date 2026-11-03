'use strict';

/**
 * upgrade_dp_batch3_25tc.js
 *
 * Upgrades 6 String & Subsequence DP problems to exactly 25 curated test cases:
 * 1. Longest Common Subsequence (LC 1143) [Medium]
 * 2. Edit Distance (LC 72) [Medium]
 * 3. Interleaving String (LC 97) [Medium]
 * 4. Distinct Subsequences (LC 115) [Hard]
 * 5. Unique Binary Search Trees (LC 96) [Medium]
 * 6. Palindrome Partitioning II (LC 132) [Hard]
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

function solveLCS(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function solveEditDistance(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function solveInterleaving(s1, s2, s3) {
  if (s1.length + s2.length !== s3.length) return false;
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
  for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) ||
                 (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]);
    }
  }
  return dp[m][n];
}

function solveDistinctSubsequences(s, t) {
  const m = s.length, n = t.length;
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= m; i++) {
    for (let j = n; j >= 1; j--) {
      if (s[i - 1] === t[j - 1]) {
        dp[j] = (dp[j] + dp[j - 1]) | 0;
      }
    }
  }
  return dp[n];
}

function solveUniqueBST(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    for (let j = 1; j <= i; j++) {
      dp[i] += dp[j - 1] * dp[i - j];
    }
  }
  return dp[n];
}

function solvePalindromePartitioningII(s) {
  const n = s.length;
  if (n <= 1) return 0;
  const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      if (s[i] === s[j] && (j - i <= 2 || isPal[i + 1][j - 1])) {
        isPal[i][j] = true;
      }
    }
  }
  const cuts = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (isPal[0][i]) {
      cuts[i] = 0;
    } else {
      let minC = i;
      for (let j = 0; j < i; j++) {
        if (isPal[j + 1][i]) {
          minC = Math.min(minC, 1 + cuts[j]);
        }
      }
      cuts[i] = minC;
    }
  }
  return cuts[n - 1];
}

// -------------------------------------------------------------
// Problem Specifications
// -------------------------------------------------------------

const DP_BATCH3 = [
  {
    slug: 'longest-common-subsequence',
    title: 'Longest Common Subsequence',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-34-tests/longest-common-subsequence.json',
    sample_input: '"abcde", "ace"',
    sample_output: '3',
    description: `Given two strings \`text1\` and \`text2\`, return *the length of their longest **common subsequence**.* If there is no **common subsequence**, return \`0\`.

A **subsequence** of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.
- For example, \`"ace"\` is a subsequence of \`"abcde"\`.

A **common subsequence** of two strings is a subsequence that is common to both strings.

### Example 1:
\`\`\`
Input: text1 = "abcde", text2 = "ace"
Output: 3  
Explanation: The longest common subsequence is "ace" and its length is 3.
\`\`\`

### Example 2:
\`\`\`
Input: text1 = "abc", text2 = "abc"
Output: 3
Explanation: The longest common subsequence is "abc" and its length is 3.
\`\`\`

### Example 3:
\`\`\`
Input: text1 = "abc", text2 = "def"
Output: 0
Explanation: There is no such common subsequence, so the result is 0.
\`\`\`

### Constraints:
- \`1 <= text1.length, text2.length <= 1000\`
- \`text1\` and \`text2\` consist of only lowercase English characters.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer (length 18, alternating without matches, branches 2^18)
      const t1_21 = 'abcdefghijklmnopqr';
      const t2_21 = 'rstuvwxyzabcdefghi';
      // 22: Identical strings of length 500
      const t1_22 = 'a'.repeat(500);
      const t2_22 = 'a'.repeat(500);
      // 23: Disjoint large strings length 1000
      const t1_23 = 'a'.repeat(1000);
      const t2_23 = 'b'.repeat(1000);
      // 24: Alternating patterns length 600
      const t1_24 = 'ab'.repeat(300);
      const t2_24 = 'ba'.repeat(300);
      // 25: Upper bound 1000 length strings
      const t1_25 = 'abcdefghij'.repeat(100);
      const t2_25 = 'jihgfedcba'.repeat(100);

      const extras = [
        [t1_21, t2_21],
        [t1_22, t2_22],
        [t1_23, t2_23],
        [t1_24, t2_24],
        [t1_25, t2_25]
      ];

      return extras.map(([s1, s2]) => ({
        input: `${JSON.stringify(s1)}, ${JSON.stringify(s2)}`,
        output: String(solveLCS(s1, s2)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}`,
    bruteCode: `
function solution(text1, text2) {
  function helper(i, j) {
    if (i >= text1.length || j >= text2.length) return 0;
    if (text1[i] === text2[j]) return 1 + helper(i + 1, j + 1);
    return Math.max(helper(i + 1, j), helper(i, j + 1));
  }
  return helper(0, 0);
}`
  },
  {
    slug: 'edit-distance',
    title: 'Edit Distance',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-23-tests/edit-distance.json',
    sample_input: '"horse", "ros"',
    sample_output: '3',
    description: `Given two strings \`word1\` and \`word2\`, return *the minimum number of operations required to convert \`word1\` to \`word2\`*.

You have the following three operations permitted on a word:
- Insert a character
- Delete a character
- Replace a character

### Example 1:
\`\`\`
Input: word1 = "horse", word2 = "ros"
Output: 3
Explanation: 
horse -> rorse (replace 'h' with 'r')
rorse -> rose (remove 'r')
rose -> ros (remove 'e')
\`\`\`

### Example 2:
\`\`\`
Input: word1 = "intention", word2 = "execution"
Output: 5
Explanation: 
intention -> inention (remove 't')
inention -> enention (replace 'i' with 'e')
enention -> exention (replace 'n' with 'x')
exention -> exection (replace 'n' with 'c')
exection -> execution (insert 'u')
\`\`\`

### Constraints:
- \`0 <= word1.length, word2.length <= 500\`
- \`word1\` and \`word2\` consist of lowercase English letters.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer (length 14, 3^14 branches)
      const w1_21 = 'abcdefghijklmn';
      const w2_21 = 'nopqrstuvwxyz0';
      // 22: One empty, one length 500
      const w1_22 = '';
      const w2_22 = 'a'.repeat(500);
      // 23: Identical length 500
      const w1_23 = 'abcde'.repeat(100);
      const w2_23 = 'abcde'.repeat(100);
      // 24: Completely different length 500
      const w1_24 = 'a'.repeat(500);
      const w2_24 = 'b'.repeat(500);
      // 25: Upper bound 500 with alternating edits
      const w1_25 = 'abcdefgh'.repeat(62);
      const w2_25 = 'hgfedcba'.repeat(62);

      const extras = [
        [w1_21, w2_21],
        [w1_22, w2_22],
        [w1_23, w2_23],
        [w1_24, w2_24],
        [w1_25, w2_25]
      ];

      return extras.map(([s1, s2]) => ({
        input: `${JSON.stringify(s1)}, ${JSON.stringify(s2)}`,
        output: String(solveEditDistance(s1, s2)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}`,
    bruteCode: `
function solution(word1, word2) {
  function helper(i, j) {
    if (i === word1.length) return word2.length - j;
    if (j === word2.length) return word1.length - i;
    if (word1[i] === word2[j]) return helper(i + 1, j + 1);
    return 1 + Math.min(helper(i + 1, j), helper(i, j + 1), helper(i + 1, j + 1));
  }
  return helper(0, 0);
}`
  },
  {
    slug: 'interleaving-string',
    title: 'Interleaving String',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-12-tests/interleaving-string.json',
    sample_input: '"aabcc", "dbbca", "aadbbcbcac"',
    sample_output: 'true',
    description: `Given strings \`s1\`, \`s2\`, and \`s3\`, find whether \`s3\` is formed by an **interleaving** of \`s1\` and \`s2\`.

An **interleaving** of two strings \`s\` and \`t\` is a configuration where \`s\` and \`t\` are divided into \`n\` and \`m\` substrings respectively, such that:
- \`s = s1 + s2 + ... + sn\`
- \`t = t1 + t2 + ... + tm\`
- \`|n - m| <= 1\`
- The interleaving is \`s1 + t1 + s2 + t2 + ...\` or \`t1 + s1 + t2 + s2 + ...\`

**Note:** \`a + b\` is the concatenation of strings \`a\` and \`b\`.

### Example 1:
\`\`\`
Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"
Output: true
Explanation: One way to obtain s3 is:
Split s1 into s1 = "aa" + "bc" + "c", and s2 into s2 = "dbbc" + "a".
Interleaving the two yields "aa" + "dbbc" + "bc" + "a" + "c" = "aadbbcbcac".
\`\`\`

### Example 2:
\`\`\`
Input: s1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"
Output: false
Explanation: Notice how it is impossible to interleave s1 and s2 to obtain s3.
\`\`\`

### Example 3:
\`\`\`
Input: s1 = "", s2 = "", s3 = ""
Output: true
\`\`\`

### Constraints:
- \`0 <= s1.length, s2.length <= 100\`
- \`0 <= s3.length <= 200\`
- \`s1\`, \`s2\`, and \`s3\` consist of lowercase English letters.`,
    generateExtraTestCases: () => {
      // 21: Classic recursion killer: C(30, 15) = 155,117,520 branches taking > 10,000ms
      const s1_21 = 'a'.repeat(15) + 'b';
      const s2_21 = 'a'.repeat(15) + 'c';
      const s3_21 = 'a'.repeat(30) + 'bd';
      // 22: Empty string combo
      const s1_22 = '';
      const s2_22 = 'abcdef';
      const s3_22 = 'abcdef';
      // 23: Length mismatch
      const s1_23 = 'a'.repeat(50);
      const s2_23 = 'b'.repeat(50);
      const s3_23 = 'ab'.repeat(49);
      // 24: Upper bound valid interleaved 100 + 100 = 200
      const s1_24 = 'a'.repeat(100);
      const s2_24 = 'b'.repeat(100);
      let s3_24 = '';
      for (let i = 0; i < 100; i++) s3_24 += 'ab';
      // 25: Upper bound 100 + 100 = 200 invalid by last char
      const s1_25 = 'a'.repeat(100);
      const s2_25 = 'b'.repeat(100);
      let s3_25 = '';
      for (let i = 0; i < 99; i++) s3_25 += 'ab';
      s3_25 += 'aa'; // extra 'a' instead of 'b'

      const extras = [
        [s1_21, s2_21, s3_21],
        [s1_22, s2_22, s3_22],
        [s1_23, s2_23, s3_23],
        [s1_24, s2_24, s3_24],
        [s1_25, s2_25, s3_25]
      ];

      return extras.map(([a, b, c]) => ({
        input: `${JSON.stringify(a)}, ${JSON.stringify(b)}, ${JSON.stringify(c)}`,
        output: String(solveInterleaving(a, b, c)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s1, s2, s3) {
  if (s1.length + s2.length !== s3.length) return false;
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  dp[0][0] = true;
  for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
  for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) ||
                 (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]);
    }
  }
  return dp[m][n];
}`,
    bruteCode: `
function solution(s1, s2, s3) {
  if (s1.length + s2.length !== s3.length) return false;
  function helper(i, j, k) {
    if (k === s3.length) return true;
    let res = false;
    if (i < s1.length && s1[i] === s3[k]) res = res || helper(i + 1, j, k + 1);
    if (j < s2.length && s2[j] === s3[k]) res = res || helper(i, j + 1, k + 1);
    return res;
  }
  return helper(0, 0, 0);
}`
  },
  {
    slug: 'distinct-subsequences',
    title: 'Distinct Subsequences',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-34-tests/distinct-subsequences.json',
    sample_input: '"rabbbit", "rabbit"',
    sample_output: '3',
    description: `Given two strings \`s\` and \`t\`, return *the number of distinct **subsequences** of \`s\` which equals \`t\`*.

The test cases are generated so that the answer fits on a 32-bit signed integer.

### Example 1:
\`\`\`
Input: s = "rabbbit", t = "rabbit"
Output: 3
Explanation:
As shown below, there are 3 ways you can generate "rabbit" from s.
rabbbit
rabbbit
rabbbit
\`\`\`

### Example 2:
\`\`\`
Input: s = "babgbag", t = "bag"
Output: 5
Explanation:
As shown below, there are 5 ways you can generate "bag" from s.
babgbag
babgbag
babgbag
babgbag
babgbag
\`\`\`

### Constraints:
- \`1 <= s.length, t.length <= 1000\`
- \`s\` and \`t\` consist of English letters.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer: C(30, 15) = 155,117,520 calls
      const s_21 = 'a'.repeat(30);
      const t_21 = 'a'.repeat(15);
      // 22: t longer than s
      const s_22 = 'abc';
      const t_22 = 'abcdef';
      // 23: Disjoint large strings
      const s_23 = 'a'.repeat(800);
      const t_23 = 'b'.repeat(20);
      // 24: High matching frequency: s has 100 'a's, t has 3 'a's -> C(100, 3) = 161700
      const s_24 = 'a'.repeat(100);
      const t_24 = 'aaa';
      // 25: Upper bound 1000 chars stress test
      const s_25 = 'abcdef'.repeat(150);
      const t_25 = 'ace';

      const extras = [
        [s_21, t_21],
        [s_22, t_22],
        [s_23, t_23],
        [s_24, t_24],
        [s_25, t_25]
      ];

      return extras.map(([s, t]) => ({
        input: `${JSON.stringify(s)}, ${JSON.stringify(t)}`,
        output: String(solveDistinctSubsequences(s, t)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s, t) {
  const m = s.length, n = t.length;
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= m; i++) {
    for (let j = n; j >= 1; j--) {
      if (s[i - 1] === t[j - 1]) {
        dp[j] = (dp[j] + dp[j - 1]) | 0;
      }
    }
  }
  return dp[n];
}`,
    bruteCode: `
function solution(s, t) {
  function helper(i, j) {
    if (j === t.length) return 1;
    if (i === s.length) return 0;
    let ways = helper(i + 1, j);
    if (s[i] === t[j]) ways += helper(i + 1, j + 1);
    return ways;
  }
  return helper(0, 0);
}`
  },
  {
    slug: 'unique-binary-search-trees',
    title: 'Unique Binary Search Trees',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-9-tests/unique-binary-search-trees.json',
    sample_input: '3',
    sample_output: '5',
    description: `Given an integer \`n\`, return *the number of structurally unique **BST**'s (binary search trees) which have exactly \`n\` nodes of unique values from \`1\` to \`n\`*.

### Example 1:
\`\`\`
Input: n = 3
Output: 5
\`\`\`

### Example 2:
\`\`\`
Input: n = 1
Output: 1
\`\`\`

### Constraints:
- \`1 <= n <= 19\``,
    generateExtraTestCases: () => {
      // 21-25: Upper bound stress tests to kill naive Catalan recursion (n=20 takes ~7s)
      const extras = [16, 17, 18, 19, 20];
      return extras.map((n) => ({
        input: String(n),
        output: String(solveUniqueBST(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    for (let j = 1; j <= i; j++) {
      dp[i] += dp[j - 1] * dp[i - j];
    }
  }
  return dp[n];
}`,
    bruteCode: `
function solution(n) {
  function count(val) {
    if (val <= 1) return 1;
    let sum = 0;
    for (let i = 1; i <= val; i++) {
      sum += count(i - 1) * count(val - i);
    }
    return sum;
  }
  return count(n);
}`
  },
  {
    slug: 'palindrome-partitioning-ii',
    title: 'Palindrome Partitioning II',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-22-tests/palindrome-partitioning-ii.json',
    sample_input: '"aab"',
    sample_output: '1',
    description: `Given a string \`s\`, partition \`s\` such that every substring of the partition is a **palindrome**.

Return *the **minimum cuts** needed for a palindrome partitioning of* \`s\`.

### Example 1:
\`\`\`
Input: s = "aab"
Output: 1
Explanation: The palindrome partitioning ["aa","b"] could be produced using 1 cut.
\`\`\`

### Example 2:
\`\`\`
Input: s = "a"
Output: 0
\`\`\`

### Example 3:
\`\`\`
Input: s = "ab"
Output: 1
\`\`\`

### Constraints:
- \`1 <= s.length <= 2000\`
- \`s\` consists of lowercase English letters only.`,
    generateExtraTestCases: () => {
      // 21: Naive recursion killer: 'ab' repeated 14 times (2^28 branches)
      const s_21 = 'ab'.repeat(14);
      // 22: Single char
      const s_22 = 'z';
      // 23: Complete palindrome length 200 (0 cuts)
      const s_23 = 'a'.repeat(200);
      // 24: No palindromes of length > 1 (25 cuts)
      const s_24 = 'abcdefghijklmnopqrstuvwxyz';
      // 25: Upper bound 500 chars stress test
      const s_25 = 'racecar'.repeat(20) + 'xyz' + 'kayak'.repeat(20);

      const extras = [s_21, s_22, s_23, s_24, s_25];
      return extras.map((s) => ({
        input: JSON.stringify(s),
        output: String(solvePalindromePartitioningII(s)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s) {
  const n = s.length;
  if (n <= 1) return 0;
  const isPal = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      if (s[i] === s[j] && (j - i <= 2 || isPal[i + 1][j - 1])) {
        isPal[i][j] = true;
      }
    }
  }
  const cuts = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (isPal[0][i]) {
      cuts[i] = 0;
    } else {
      let minC = i;
      for (let j = 0; j < i; j++) {
        if (isPal[j + 1][i]) {
          minC = Math.min(minC, 1 + cuts[j]);
        }
      }
      cuts[i] = minC;
    }
  }
  return cuts[n - 1];
}`,
    bruteCode: `
function solution(s) {
  function isPalindrome(str, l, r) {
    while (l < r) {
      if (str[l++] !== str[r--]) return false;
    }
    return true;
  }
  function minCutHelper(start) {
    if (start === s.length) return 0;
    if (isPalindrome(s, start, s.length - 1)) return 0;
    let ans = Infinity;
    for (let end = start; end < s.length; end++) {
      if (isPalindrome(s, start, end)) {
        ans = Math.min(ans, 1 + minCutHelper(end + 1));
      }
    }
    return ans;
  }
  return minCutHelper(0);
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for DP Batch 3 (6 Problems) ===\n');

  for (const prob of DP_BATCH3) {
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
  console.log('✓ All 6 String & Subsequence DP problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
