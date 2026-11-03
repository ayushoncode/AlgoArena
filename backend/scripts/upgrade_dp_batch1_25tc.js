'use strict';

/**
 * upgrade_dp_batch1_25tc.js
 *
 * Upgrades 6 Core 1D & Linear DP problems to exactly 25 curated test cases:
 * 1. Climbing Stairs (LC 70) [Easy]
 * 2. House Robber (LC 198) [Medium]
 * 3. Coin Change (LC 322) [Medium]
 * 4. Decode Ways (LC 91) [Medium]
 * 5. Longest Increasing Subsequence (LC 300) [Medium]
 * 6. Word Break (LC 139) [Medium]
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

function solveClimbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}

function solveHouseRobber(nums) {
  if (!nums || !nums.length) return 0;
  let prev1 = 0, prev2 = 0;
  for (const num of nums) {
    const tmp = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = tmp;
  }
  return prev1;
}

function solveCoinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

function solveDecodeWays(s) {
  if (!s || s[0] === '0') return 0;
  let prev2 = 1, prev1 = 1;
  for (let i = 1; i < s.length; i++) {
    let curr = 0;
    const one = Number(s[i]);
    const two = Number(s.substring(i - 1, i + 1));
    if (one >= 1 && one <= 9) curr += prev1;
    if (two >= 10 && two <= 26) curr += prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

function solveLIS(nums) {
  if (!nums || !nums.length) return 0;
  const tails = [];
  for (const x of nums) {
    let l = 0, r = tails.length;
    while (l < r) {
      const mid = (l + r) >> 1;
      if (tails[mid] < x) l = mid + 1;
      else r = mid;
    }
    tails[l] = x;
  }
  return tails.length;
}

function solveWordBreak(s, wordDict) {
  const dict = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && dict.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const DP_BATCH1 = [
  {
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-5-tests/climbing-stairs.json',
    sample_input: '2',
    sample_output: '2',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### Example 1:
\`\`\`
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top.
1. 1 step + 1 step
2. 2 steps
\`\`\`

### Example 2:
\`\`\`
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top.
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
\`\`\`

### Constraints:
- \`1 <= n <= 45\``,
    generateExtraTestCases: () => {
      const nums = [38, 40, 42, 44, 45];
      return nums.map((n) => ({
        input: String(n),
        output: String(solveClimbStairs(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}`,
    bruteCode: `
function solution(n) {
  if (n <= 2) return n;
  return solution(n - 1) + solution(n - 2);
}`
  },
  {
    slug: 'house-robber',
    title: 'House Robber',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-30-tests/house-robber.json',
    sample_input: '[1,2,3,1]',
    sample_output: '4',
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and **it will automatically contact the police if two adjacent houses were broken into on the same night**.

Given an integer array \`nums\` representing the amount of money of each house, return *the maximum amount of money you can rob tonight **without alerting the police***.

### Example 1:
\`\`\`
Input: nums = [1,2,3,1]
Output: 4
Explanation: Rob house 1 (money = 1) and then rob house 3 (money = 3).
Total amount you can rob = 1 + 3 = 4.
\`\`\`

### Example 2:
\`\`\`
Input: nums = [2,7,9,3,1]
Output: 12
Explanation: Rob house 1 (money = 2), rob house 3 (money = 9) and rob house 5 (money = 1).
Total amount you can rob = 2 + 9 + 1 = 12.
\`\`\`

### Constraints:
- \`1 <= nums.length <= 100\`
- \`0 <= nums[i] <= 400\``,
    generateExtraTestCases: () => {
      const tc21 = Array(35).fill(10);
      const tc22 = Array.from({ length: 42 }, (_, i) => (i % 2 === 0 ? 100 : 1));
      const tc23 = Array.from({ length: 50 }, (_, i) => (i * 7) % 400);
      const tc24 = Array.from({ length: 70 }, (_, i) => (i * 13) % 400);
      const tc25 = Array.from({ length: 100 }, (_, i) => (i * 37) % 400);

      const extras = [tc21, tc22, tc23, tc24, tc25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: String(solveHouseRobber(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  if (!nums || !nums.length) return 0;
  let prev1 = 0, prev2 = 0;
  for (const num of nums) {
    const tmp = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = tmp;
  }
  return prev1;
}`,
    bruteCode: `
function solution(nums) {
  function rob(i) {
    if (i >= nums.length) return 0;
    return Math.max(nums[i] + rob(i + 2), rob(i + 1));
  }
  return rob(0);
}`
  },
  {
    slug: 'coin-change',
    title: 'Coin Change',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-5-tests/coin-change.json',
    sample_input: '[1,2,5], 11',
    sample_output: '3',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### Example 1:
\`\`\`
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
\`\`\`

### Example 2:
\`\`\`
Input: coins = [2], amount = 3
Output: -1
\`\`\`

### Example 3:
\`\`\`
Input: coins = [1], amount = 0
Output: 0
\`\`\`

### Constraints:
- \`1 <= coins.length <= 12\`
- \`1 <= coins[i] <= 2³¹ - 1\`
- \`0 <= amount <= 10⁴\``,
    generateExtraTestCases: () => {
      const tc21 = { coins: [1, 2, 5], amount: 100 };
      const tc22 = { coins: [2], amount: 3 };
      const tc23 = { coins: [186, 419, 83, 408], amount: 6249 };
      const tc24 = { coins: [1, 5, 10, 25], amount: 9999 };
      const tc25 = { coins: [1, 2, 5], amount: 10000 };

      const extras = [tc21, tc22, tc23, tc24, tc25];
      return extras.map((e) => ({
        input: `${JSON.stringify(e.coins)}, ${e.amount}`,
        output: String(solveCoinChange(e.coins, e.amount)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
    bruteCode: `
function solution(coins, amount) {
  function helper(rem) {
    if (rem === 0) return 0;
    if (rem < 0) return -1;
    let minCoins = Infinity;
    for (const c of coins) {
      const res = helper(rem - c);
      if (res >= 0) minCoins = Math.min(minCoins, 1 + res);
    }
    return minCoins === Infinity ? -1 : minCoins;
  }
  return helper(amount);
}`
  },
  {
    slug: 'decode-ways',
    title: 'Decode Ways',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-29-tests/decode-ways.json',
    sample_input: '"12"',
    sample_output: '2',
    description: `A message containing letters from \`A-Z\` can be encoded into numbers using the following mapping:
- \`'A' -> "1"\`
- \`'B' -> "2"\`
- ...
- \`'Z' -> "26"\`

To decode an encoded message, all the digits must be grouped then mapped back into letters using the reverse of the mapping above (there may be multiple ways). For example, \`"11106"\` can be mapped into:
- \`"AAJF"\` with the grouping \`(1, 1, 10, 6)\`
- \`"KJF"\` with the grouping \`(11, 10, 6)\`

Note that the grouping \`(1, 11, 06)\` is invalid because \`"06"\` cannot be mapped into \`'F'\` since \`"6"\` is different from \`"06"\`.

Given a string \`s\` containing only digits, return *the **number of ways** to decode it*.

The test cases are generated so that the answer fits in a **32-bit** integer.

### Example 1:
\`\`\`
Input: s = "12"
Output: 2
Explanation: "12" could be decoded as "AB" (1 2) or "L" (12).
\`\`\`

### Example 2:
\`\`\`
Input: s = "226"
Output: 3
Explanation: "226" could be decoded as "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).
\`\`\`

### Example 3:
\`\`\`
Input: s = "06"
Output: 0
Explanation: "06" cannot be mapped to "F" because of the leading zero ("6" is different from "06").
\`\`\`

### Constraints:
- \`1 <= s.length <= 100\`
- \`s\` contains only digits and may contain leading zero(s).`,
    generateExtraTestCases: () => {
      const tc21 = '1'.repeat(30);
      const tc22 = '1'.repeat(35);
      const tc23 = '1'.repeat(40);
      const tc24 = '1'.repeat(43);
      const tc25 = '1'.repeat(45);

      const extras = [tc21, tc22, tc23, tc24, tc25];
      return extras.map((str) => ({
        input: JSON.stringify(str),
        output: String(solveDecodeWays(str)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s) {
  if (!s || s[0] === '0') return 0;
  let prev2 = 1, prev1 = 1;
  for (let i = 1; i < s.length; i++) {
    let curr = 0;
    const one = Number(s[i]);
    const two = Number(s.substring(i - 1, i + 1));
    if (one >= 1 && one <= 9) curr += prev1;
    if (two >= 10 && two <= 26) curr += prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}`,
    bruteCode: `
function solution(s) {
  function decode(i) {
    if (i === s.length) return 1;
    if (s[i] === '0') return 0;
    let ways = decode(i + 1);
    if (i + 1 < s.length) {
      const two = Number(s.substring(i, i + 2));
      if (two <= 26) ways += decode(i + 2);
    }
    return ways;
  }
  return decode(0);
}`
  },
  {
    slug: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-24-tests/longest-increasing-subsequence.json',
    sample_input: '[10,9,2,5,3,7,101,18]',
    sample_output: '4',
    description: `Given an integer array \`nums\`, return *the length of the longest **strictly increasing subsequence***.

### Example 1:
\`\`\`
Input: nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: The longest increasing subsequence is [2,3,7,101], therefore the length is 4.
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0,1,0,3,2,3]
Output: 4
\`\`\`

### Example 3:
\`\`\`
Input: nums = [7,7,7,7,7,7,7]
Output: 1
\`\`\`

### Constraints:
- \`1 <= nums.length <= 2500\`
- \`-10⁴ <= nums[i] <= 10⁴\``,
    generateExtraTestCases: () => {
      // 21: Strictly increasing 300 elements
      const tc21 = Array.from({ length: 300 }, (_, i) => i);
      // 22: Strictly decreasing 300 elements
      const tc22 = Array.from({ length: 300 }, (_, i) => 300 - i);
      // 23: Repeating elements
      const tc23 = Array.from({ length: 500 }, (_, i) => (i % 25));
      // 24: Array of 1000 pseudo-random numbers
      const tc24 = Array.from({ length: 1000 }, (_, i) => (i * 37) % 500);
      // 25: Massive upper-bound scale test (N = 2500 elements)
      const tc25 = Array.from({ length: 2500 }, (_, i) => (i * 101) % 1000);

      const extras = [tc21, tc22, tc23, tc24, tc25];
      return extras.map((arr) => ({
        input: JSON.stringify(arr),
        output: String(solveLIS(arr)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  if (!nums || !nums.length) return 0;
  const tails = [];
  for (const x of nums) {
    let l = 0, r = tails.length;
    while (l < r) {
      const mid = (l + r) >> 1;
      if (tails[mid] < x) l = mid + 1;
      else r = mid;
    }
    tails[l] = x;
  }
  return tails.length;
}`,
    bruteCode: `
function solution(nums) {
  function helper(prevIdx, currIdx) {
    if (currIdx === nums.length) return 0;
    let taken = 0;
    if (prevIdx < 0 || nums[currIdx] > nums[prevIdx]) {
      taken = 1 + helper(currIdx, currIdx + 1);
    }
    const notTaken = helper(prevIdx, currIdx + 1);
    return Math.max(taken, notTaken);
  }
  return helper(-1, 0);
}`
  },
  {
    slug: 'word-break',
    title: 'Word Break',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-16-tests/word-break.json',
    sample_input: '"leetcode", ["leet","code"]',
    sample_output: 'true',
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.

### Example 1:
\`\`\`
Input: s = "leetcode", wordDict = ["leet","code"]
Output: true
Explanation: Return true because "leetcode" can be segmented as "leet code".
\`\`\`

### Example 2:
\`\`\`
Input: s = "applepenapple", wordDict = ["apple","pen"]
Output: true
Explanation: Return true because "applepenapple" can be segmented as "apple pen apple".
Note that you are allowed to reuse a dictionary word.
\`\`\`

### Example 3:
\`\`\`
Input: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
Output: false
\`\`\`

### Constraints:
- \`1 <= s.length <= 300\`
- \`1 <= wordDict.length <= 1000\`
- \`1 <= wordDict[i].length <= 20\`
- \`s\` and \`wordDict[i]\` consist of only lowercase English letters.
- All the strings of \`wordDict\` are **unique**.`,
    generateExtraTestCases: () => {
      const tc21 = { s: 'a'.repeat(30) + 'b', dict: ['a', 'aa', 'aaa', 'aaaa'] };
      const tc22 = { s: 'a'.repeat(50) + 'b', dict: ['a', 'aa', 'aaa', 'aaaa', 'aaaaa'] };
      const tc23 = { s: 'a'.repeat(80), dict: ['a', 'aa', 'aaa'] };
      const tc24 = { s: 'catsandog', dict: ['cats', 'dog', 'sand', 'and', 'cat'] };
      // 25: Classic LeetCode TLE killer: exponential branching with no matching suffix
      const tc25 = {
        s: 'a'.repeat(140) + 'b',
        dict: ['a', 'aa', 'aaa', 'aaaa', 'aaaaa', 'aaaaaa', 'aaaaaaa', 'aaaaaaaa', 'aaaaaaaaa', 'aaaaaaaaaa']
      };

      const extras = [tc21, tc22, tc23, tc24, tc25];
      return extras.map((e) => ({
        input: `${JSON.stringify(e.s)}, ${JSON.stringify(e.dict)}`,
        output: String(solveWordBreak(e.s, e.dict)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s, wordDict) {
  const dict = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && dict.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}`,
    bruteCode: `
function solution(s, wordDict) {
  const dict = new Set(wordDict);
  function canBreak(start) {
    if (start === s.length) return true;
    for (let end = start + 1; end <= s.length; end++) {
      if (dict.has(s.substring(start, end)) && canBreak(end)) {
        return true;
      }
    }
    return false;
  }
  return canBreak(0);
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for DP Batch 1 (6 Problems) ===\n');

  for (const prob of DP_BATCH1) {
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
    console.log(`✓ Seeded exactly 25 test cases (TC 25 length: ${finalTestCases[24].input.length} chars).`);

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
  console.log('✓ All 6 Core DP problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
