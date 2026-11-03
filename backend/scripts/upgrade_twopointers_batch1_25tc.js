/**
 * backend/scripts/upgrade_twopointers_batch1_25tc.js
 *
 * Upgrades 5 Core Two-Pointers problems to:
 * 1. 100% LeetCode-style descriptions, examples with explanations, and exact constraints.
 * 2. Exactly 25 curated test cases each with comprehensive edge cases and upper-bound scale stress tests.
 * 3. 100% Judge validation (25/25 ACCEPTED).
 * 4. Kills O(N^2) / O(N^3) brute-force solutions with TLE (> 2000ms).
 *
 * Problems:
 * 1. Longest Substring Without Repeating Characters (longest-substring-without-repeating-characters) [LC 3]
 * 2. Container With Most Water (container-with-most-water) [LC 11]
 * 3. 3Sum Closest (3sum-closest) [LC 16]
 * 4. Two Sum II - Input Array Is Sorted (two-sum-ii-input-array-is-sorted) [LC 167]
 * 5. Valid Palindrome (valid-palindrome) [LC 125]
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
function solveLengthOfLongestSubstring(s) {
  let maxLen = 0;
  const lastPos = new Map();
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (lastPos.has(c) && lastPos.get(c) >= left) {
      left = lastPos.get(c) + 1;
    }
    lastPos.set(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}

function solveMaxArea(height) {
  let left = 0, right = height.length - 1;
  let maxArea = 0;
  while (left < right) {
    const h = Math.min(height[left], height[right]);
    const area = h * (right - left);
    if (area > maxArea) maxArea = area;
    if (height[left] < height[right]) left++;
    else right--;
  }
  return maxArea;
}

function solveThreeSumClosest(nums, target) {
  const arr = [...nums].sort((a, b) => a - b);
  let closestSum = arr[0] + arr[1] + arr[2];
  for (let i = 0; i < arr.length - 2; i++) {
    if (i > 0 && arr[i] === arr[i - 1]) continue;
    let left = i + 1, right = arr.length - 1;
    while (left < right) {
      const sum = arr[i] + arr[left] + arr[right];
      if (Math.abs(sum - target) < Math.abs(closestSum - target)) {
        closestSum = sum;
      }
      if (sum < target) left++;
      else if (sum > target) right--;
      else return target;
    }
  }
  return closestSum;
}

function solveTwoSumII(numbers, target) {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}

function solveIsPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    while (left < right && !/[a-zA-Z0-9]/.test(s[left])) left++;
    while (left < right && !/[a-zA-Z0-9]/.test(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}

// -------------------------------------------------------------
// Generators for 25 Test Cases Each
// -------------------------------------------------------------

function generateLongestSubstringTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    'abcabcbb',
    'bbbbb',
    'pwwkew',
    '',
    ' ',

    // 6-10: Short edge cases
    'au',
    'dvdf',
    'c',
    'abba',
    'tmmzuxt',

    // 11-15: Varied character sets
    'abcdefghijklmnopqrstuvwxyz',
    'aA1bB2cC3',
    'abc!@#def!@#',
    'a b c d a b c',
    'aaabbbcccdddeee',

    // 16-20: Medium scale
    'abcdefghijklmnopqrstuvwxyz'.repeat(5),
    'abc'.repeat(50),
    'a' + 'b'.repeat(200) + 'c',
    Array.from({ length: 300 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(''),
    Array.from({ length: 500 }, (_, i) => String.fromCharCode(65 + (i % 26))).join(''),

    // 21-24: Upper scale
    'abcdefghij'.repeat(200),
    Array.from({ length: 5000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join(''),
    Array.from({ length: 10000 }, (_, i) => String.fromCharCode(97 + (i % 10))).join(''),
    Array.from({ length: 20000 }, (_, i) => String.fromCharCode(97 + (i % 5))).join(''),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^3) and O(N^2)
    Array.from({ length: 75000 }, (_, i) => String.fromCharCode(97 + (i % 26))).join('')
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveLengthOfLongestSubstring(str)),
    is_hidden: idx >= 3
  }));
}

function generateContainerWithWaterTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    [1, 8, 6, 2, 5, 4, 8, 3, 7],
    [1, 1],
    [4, 3, 2, 1, 4],
    [1, 2, 1],
    [2, 3, 4, 5, 18, 17, 6],

    // 6-10: Monotonic slopes & symmetric
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [9, 8, 7, 6, 5, 4, 3, 2, 1],
    [5, 5, 5, 5, 5],
    [1, 100, 100, 1],
    [100, 1, 1, 100],

    // 11-15: Tall spikes & flat bottoms
    [1, 2, 100, 1, 1, 100, 2, 1],
    [0, 2, 0],
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 10],
    [1, 2, 4, 3],
    [6, 9, 3, 4, 5, 8],

    // 16-20: Medium scale
    Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? 10 : 20)),
    Array.from({ length: 100 }, (_, i) => i + 1),
    Array.from({ length: 200 }, () => 50),
    Array.from({ length: 500 }, (_, i) => ((i * 37) % 100) + 1),
    Array.from({ length: 1000 }, (_, i) => (i % 5 === 0 ? 1000 : 10)),

    // 21-24: Upper scale
    Array.from({ length: 5000 }, (_, i) => (i % 2 === 0 ? 500 : 100)),
    Array.from({ length: 10000 }, (_, i) => i + 1),
    Array.from({ length: 20000 }, (_, i) => 20000 - i),
    Array.from({ length: 40000 }, (_, i) => ((i * 17) % 5000) + 1),

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2)
    Array.from({ length: 75000 }, (_, i) => (i % 1000) + 1)
  ];

  return tcs.map((arr, idx) => ({
    input: JSON.stringify(arr),
    output: String(solveMaxArea(arr)),
    is_hidden: idx >= 3
  }));
}

function generateThreeSumClosestTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { nums: [-1, 2, 1, -4], target: 1 },
    { nums: [0, 0, 0], target: 1 },
    { nums: [1, 1, 1], target: 100 },
    { nums: [1, 1, 1], target: -100 },
    { nums: [0, 1, 2], target: 3 },

    // 6-10: Small arrays with exact and inexact matches
    { nums: [1, 2, 3, 4, 5], target: 10 },
    { nums: [-5, -4, -3, -2, -1], target: -10 },
    { nums: [-3, -2, -5, 3, -4], target: -1 },
    { nums: [4, 0, 5, -5, 3, 3, 0, -4, -5], target: -2 },
    { nums: [1, 2, 4, 8, 16, 32, 64, 128], target: 82 },

    // 11-15: Duplicates & zeros
    { nums: [0, 2, 1, -3], target: 1 },
    { nums: [1, 1, -1, -1, 3], target: -1 },
    { nums: [1, 1, 1, 0], target: -100 },
    { nums: [-10, 0, -2, 3, -8, 1, -1, 9, -5], target: 0 },
    { nums: [5, 10, 15, 20, 25], target: 44 },

    // 16-20: Medium scale (N = 50 to 200)
    {
      nums: Array.from({ length: 50 }, (_, i) => i - 25),
      target: 10
    },
    {
      nums: Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? i : -i)),
      target: 50
    },
    {
      nums: Array.from({ length: 150 }, (_, i) => i * 3 - 200),
      target: 0
    },
    {
      nums: Array.from({ length: 200 }, (_, i) => ((i * 13) % 200) - 100),
      target: 75
    },
    {
      nums: Array.from({ length: 300 }, (_, i) => i - 150),
      target: -20
    },

    // 21-24: Upper scale (N = 500 to 1500)
    {
      nums: Array.from({ length: 500 }, (_, i) => ((i * 17) % 500) - 250),
      target: 100
    },
    {
      nums: Array.from({ length: 800 }, (_, i) => i - 400),
      target: -50
    },
    {
      nums: Array.from({ length: 1200 }, (_, i) => ((i * 23) % 1000) - 500),
      target: 250
    },
    {
      nums: Array.from({ length: 1800 }, (_, i) => i - 900),
      target: 0
    },

    // 25: Massive stress test (N = 3,000) strictly designed to kill O(N^3)
    {
      nums: Array.from({ length: 3000 }, (_, i) => ((i * 7) % 2000) - 1000),
      target: 350
    }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.nums)}, ${item.target}`,
    output: String(solveThreeSumClosest(item.nums, item.target)),
    is_hidden: idx >= 3
  }));
}

function generateTwoSumIITestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    { nums: [2, 7, 11, 15], target: 9 },
    { nums: [2, 3, 4], target: 6 },
    { nums: [-1, 0], target: -1 },
    { nums: [1, 2], target: 3 },
    { nums: [0, 0, 3, 4], target: 0 },

    // 6-10: Negatives & duplicate elements
    { nums: [-5, -3, 0, 2, 4, 6], target: 1 },
    { nums: [1, 2, 3, 4, 4, 9, 56, 90], target: 8 },
    { nums: [5, 25, 75], target: 100 },
    { nums: [-10, -5, 0, 5, 10], target: 0 },
    { nums: [1, 3, 5, 7, 9, 11], target: 14 },

    // 11-15: End elements matching
    { nums: [-1000, -500, 0, 500, 1000], target: 0 },
    { nums: [1, 2, 3, 4, 5, 6, 7], target: 13 },
    { nums: [1, 2, 3, 4, 5, 6, 7], target: 3 },
    { nums: [-3, 3, 4, 90], target: 0 },
    { nums: [3, 24, 50, 79, 88, 150, 345], target: 200 },

    // 16-20: Medium scale
    {
      nums: Array.from({ length: 50 }, (_, i) => i * 2),
      target: 48
    },
    {
      nums: Array.from({ length: 100 }, (_, i) => i - 50),
      target: 0
    },
    {
      nums: Array.from({ length: 200 }, (_, i) => i * 3),
      target: 300
    },
    {
      nums: Array.from({ length: 500 }, (_, i) => i),
      target: 499
    },
    {
      nums: Array.from({ length: 1000 }, (_, i) => i * 2),
      target: 1000
    },

    // 21-24: Upper scale
    {
      nums: Array.from({ length: 5000 }, (_, i) => i * 2),
      target: 5000
    },
    {
      nums: Array.from({ length: 10000 }, (_, i) => i),
      target: 9999
    },
    {
      nums: Array.from({ length: 20000 }, (_, i) => i * 2),
      target: 20000
    },
    {
      nums: Array.from({ length: 40000 }, (_, i) => i),
      target: 39999
    },

    // 25: Massive stress test (N = 75,000) strictly designed to kill O(N^2) (pair at very end)
    {
      nums: Array.from({ length: 75000 }, (_, i) => i * 2),
      target: (74998 * 2) + (74999 * 2)
    }
  ];

  return tcs.map((item, idx) => ({
    input: `${JSON.stringify(item.nums)}, ${item.target}`,
    output: JSON.stringify(solveTwoSumII(item.nums, item.target)),
    is_hidden: idx >= 3
  }));
}

function generateValidPalindromeTestCases() {
  const tcs = [
    // 1-5: Basic LeetCode examples
    'A man, a plan, a canal: Panama',
    'race a car',
    ' ',
    'a.',
    'ab_a',

    // 6-10: Small edge cases
    '0P',
    'a',
    '.,',
    'Madam, I\'m Adam.',
    'No \'x\' in Nixon',

    // 11-15: Numbers & alphanumeric mix
    '1b1',
    'Was it a car or a cat I saw?',
    'Eva, can I see bees in a cave?',
    'Step on no pets',
    'Top spot',

    // 16-20: Medium scale
    'ab'.repeat(50) + 'ba'.repeat(50),
    'A man, a plan, a canal: Panama. '.repeat(10),
    'a'.repeat(200),
    'a'.repeat(100) + 'b' + 'a'.repeat(100),
    'x'.repeat(100) + 'y'.repeat(100),

    // 21-24: Large scale
    'a'.repeat(5000) + 'b' + 'a'.repeat(5000),
    ('ab'.repeat(2500) + 'ba'.repeat(2500)),
    'A'.repeat(10000) + 'B' + 'A'.repeat(10000),
    'a'.repeat(30000),

    // 25: Massive stress test (N = 85,000)
    'a'.repeat(42500) + 'b' + 'a'.repeat(42499)
  ];

  return tcs.map((str, idx) => ({
    input: JSON.stringify(str),
    output: String(solveIsPalindrome(str)),
    is_hidden: idx >= 3
  }));
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const TWO_POINTERS_PROBLEMS = [
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### Example 1:
\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
\`\`\`

### Example 3:
\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.
\`\`\`

### Constraints:
- \`0 <= s.length <= 10^5\`
- \`s\` consists of English letters, digits, symbols and spaces.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(min(N, Sigma))\``,
    sample_input: '"abcabcbb"',
    sample_output: '3',
    generator: generateLongestSubstringTestCases,
    optimalCode: `
function solution(s) {
  let maxLen = 0;
  const lastPos = new Map();
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (lastPos.has(c) && lastPos.get(c) >= left) {
      left = lastPos.get(c) + 1;
    }
    lastPos.set(c, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    bruteCode: `
function solution(s) {
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      let set = new Set();
      let unique = true;
      for (let k = i; k <= j; k++) {
        if (set.has(s[k])) { unique = false; break; }
        set.add(s[k]);
      }
      if (unique) maxLen = Math.max(maxLen, j - i + 1);
    }
  }
  return maxLen;
}`
  },
  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    difficulty: 'medium',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.

**Notice** that you may not slant the container.

### Example 1:
\`\`\`
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.
\`\`\`

### Example 2:
\`\`\`
Input: height = [1,1]
Output: 1
\`\`\`

### Constraints:
- \`n == height.length\`
- \`2 <= n <= 10^5\`
- \`0 <= height[i] <= 10^4\`
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '[1,8,6,2,5,4,8,3,7]',
    sample_output: '49',
    generator: generateContainerWithWaterTestCases,
    optimalCode: `
function solution(height) {
  let left = 0, right = height.length - 1;
  let maxArea = 0;
  while (left < right) {
    const h = Math.min(height[left], height[right]);
    const area = h * (right - left);
    if (area > maxArea) maxArea = area;
    if (height[left] < height[right]) left++;
    else right--;
  }
  return maxArea;
}`,
    bruteCode: `
function solution(height) {
  let maxArea = 0;
  for (let i = 0; i < height.length; i++) {
    for (let j = i + 1; j < height.length; j++) {
      let area = Math.min(height[i], height[j]) * (j - i);
      if (area > maxArea) maxArea = area;
    }
  }
  return maxArea;
}`
  },
  {
    slug: '3sum-closest',
    title: '3Sum Closest',
    difficulty: 'medium',
    description: `Given an integer array \`nums\` of length \`n\` and an integer \`target\`, find three integers in \`nums\` such that the sum is closest to \`target\`.

Return *the sum of the three integers*.

You may assume that each input would have exactly one solution.

### Example 1:
\`\`\`
Input: nums = [-1,2,1,-4], target = 1
Output: 2
Explanation: The sum that is closest to the target is 2. (-1 + 2 + 1 = 2).
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0,0,0], target = 1
Output: 0
Explanation: The sum that is closest to the target is 0. (0 + 0 + 0 = 0).
\`\`\`

### Constraints:
- \`3 <= nums.length <= 3000\`
- \`-1000 <= nums[i] <= 1000\`
- \`-10^4 <= target <= 10^4\`
- **Expected Time Complexity:** \`O(N^2)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '[-1,2,1,-4], 1',
    sample_output: '2',
    generator: generateThreeSumClosestTestCases,
    optimalCode: `
function solution(nums, target) {
  const arr = [...nums].sort((a, b) => a - b);
  let closestSum = arr[0] + arr[1] + arr[2];
  for (let i = 0; i < arr.length - 2; i++) {
    if (i > 0 && arr[i] === arr[i - 1]) continue;
    let left = i + 1, right = arr.length - 1;
    while (left < right) {
      const sum = arr[i] + arr[left] + arr[right];
      if (Math.abs(sum - target) < Math.abs(closestSum - target)) {
        closestSum = sum;
      }
      if (sum < target) left++;
      else if (sum > target) right--;
      else return target;
    }
  }
  return closestSum;
}`,
    bruteCode: `
function solution(nums, target) {
  let closestSum = nums[0] + nums[1] + nums[2];
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        const sum = nums[i] + nums[j] + nums[k];
        if (Math.abs(sum - target) < Math.abs(closestSum - target)) {
          closestSum = sum;
        }
      }
    }
  }
  return closestSum;
}`
  },
  {
    slug: 'two-sum-ii-input-array-is-sorted',
    title: 'Two Sum II - Input Array Is Sorted',
    difficulty: 'medium',
    description: `Given a **1-indexed** array of integers \`numbers\` that is already **sorted in non-decreasing order**, find two numbers such that they add up to a specific \`target\` number. Let these two numbers be \`numbers[index1]\` and \`numbers[index2]\` where \`1 <= index1 < index2 <= numbers.length\`.

Return *the indices of the two numbers,* \`[index1, index2]\`*, as an integer array of length 2*.

The tests are generated such that there is **exactly one solution**. You **may not** use the same element twice.

Your solution must use only constant extra space.

### Example 1:
\`\`\`
Input: numbers = [2,7,11,15], target = 9
Output: [1,2]
Explanation: The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2].
\`\`\`

### Example 2:
\`\`\`
Input: numbers = [2,3,4], target = 6
Output: [1,3]
Explanation: The sum of 2 and 4 is 6. Therefore index1 = 1, index2 = 3. We return [1, 3].
\`\`\`

### Example 3:
\`\`\`
Input: numbers = [-1,0], target = -1
Output: [1,2]
Explanation: The sum of -1 and 0 is -1. Therefore index1 = 1, index2 = 2. We return [1, 2].
\`\`\`

### Constraints:
- \`2 <= numbers.length <= 10^5\`
- \`-1000 <= numbers[i] <= 1000\`
- \`numbers\` is sorted in **non-decreasing order**.
- \`-1000 <= target <= 1000\`
- The tests are generated such that there is **exactly one solution**.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '[2,7,11,15], 9',
    sample_output: '[1,2]',
    generator: generateTwoSumIITestCases,
    optimalCode: `
function solution(numbers, target) {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
    bruteCode: `
function solution(numbers, target) {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) return [i + 1, j + 1];
    }
  }
  return [];
}`
  },
  {
    slug: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'easy',
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a **palindrome**, or* \`false\` *otherwise*.

### Example 1:
\`\`\`
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
\`\`\`

### Example 2:
\`\`\`
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.
\`\`\`

### Example 3:
\`\`\`
Input: s = " "
Output: true
Explanation: s is an empty string "" after removing non-alphanumeric characters.
Since an empty string reads the same forward and backward, it is a palindrome.
\`\`\`

### Constraints:
- \`1 <= s.length <= 2 * 10^5\`
- \`s\` consists only of printable ASCII characters.
- **Expected Time Complexity:** \`O(N)\`
- **Expected Auxiliary Space:** \`O(1)\``,
    sample_input: '"A man, a plan, a canal: Panama"',
    sample_output: 'true',
    generator: generateValidPalindromeTestCases,
    optimalCode: `
function solution(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    while (left < right && !/[a-zA-Z0-9]/.test(s[left])) left++;
    while (left < right && !/[a-zA-Z0-9]/.test(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}`,
    bruteCode: `
function solution(s) {
  let cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  while (cleaned.length > 1) {
    if (cleaned[0] !== cleaned[cleaned.length - 1]) return false;
    cleaned = cleaned.slice(1, -1);
  }
  return true;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for Two-Pointers Batch 1 (5 Problems) ===\n');

  for (const prob of TWO_POINTERS_PROBLEMS) {
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
  console.log('✓ All 5 Two-Pointers problems successfully upgraded and verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
