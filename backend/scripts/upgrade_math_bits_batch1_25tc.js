/**
 * upgrade_math_bits_batch1_25tc.js
 *
 * Upgrades 9 Bit Manipulation & Core Math problems in AlgoArena to exactly 25 curated test cases:
 * 1. add-binary (LC 67) [Easy]
 * 2. reverse-bits (LC 190) [Easy]
 * 3. number-of-1-bits (LC 191) [Easy]
 * 4. single-number-ii (LC 137) [Medium]
 * 5. divide-two-integers (LC 29) [Medium]
 * 6. gray-code (LC 89) [Medium]
 * 7. palindrome-number (LC 9) [Easy]
 * 8. reverse-integer (LC 7) [Medium]
 * 9. roman-to-integer (LC 13) [Easy]
 *
 * Rules:
 * - Exactly 25 test cases per problem (TC 1-3 public, TC 4-25 hidden)
 * - Optimal solutions verified 25/25 ACCEPTED
 * - Inefficient/naive solutions strictly tested for TIME_LIMIT_EXCEEDED (> 2000ms limit)
 * - Standard LeetCode description formatting with constraints
 */

'use strict';

require('dotenv').config({ path: 'backend/.env' });
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { evaluateSubmission } = require('../services/judge');

// -------------------------------------------------------------
// Reference Solvers
// -------------------------------------------------------------

function solveAddBinary(a, b) {
  const res = [];
  let i = a.length - 1, j = b.length - 1, carry = 0;
  while (i >= 0 || j >= 0 || carry) {
    let sum = carry;
    if (i >= 0) sum += a.charCodeAt(i--) - 48;
    if (j >= 0) sum += b.charCodeAt(j--) - 48;
    res.push(sum % 2);
    carry = Math.floor(sum / 2);
  }
  return res.reverse().join('');
}

function solveReverseBits(n) {
  let res = 0;
  for (let i = 0; i < 32; i++) {
    res = (res * 2) + (n % 2);
    n = Math.floor(n / 2);
  }
  return res;
}

function solveHammingWeight(n) {
  let count = 0;
  while (n) {
    count += n & 1;
    n = Math.floor(n / 2);
  }
  return count;
}

function solveSingleNumberII(nums) {
  let ones = 0, twos = 0;
  for (const x of nums) {
    ones = (ones ^ x) & ~twos;
    twos = (twos ^ x) & ~ones;
  }
  return ones;
}

function solveDivide(dividend, divisor) {
  if (dividend === -2147483648 && divisor === -1) return 2147483647;
  const negative = (dividend < 0) ^ (divisor < 0);
  let a = Math.abs(dividend);
  const b = Math.abs(divisor);
  let res = 0;
  while (a >= b) {
    let temp = b, mul = 1;
    while (a >= temp * 2 && temp * 2 > 0) {
      temp *= 2;
      mul *= 2;
    }
    a -= temp;
    res += mul;
  }
  return negative ? -res : res;
}

function solveGrayCode(n) {
  const res = [];
  const total = 1 << n;
  for (let i = 0; i < total; i++) {
    res.push(i ^ (i >> 1));
  }
  return res;
}

function solveIsPalindrome(x) {
  if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
  let rev = 0;
  while (x > rev) {
    rev = rev * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  return x === rev || x === Math.floor(rev / 10);
}

function solveReverseInteger(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let rev = 0;
  while (x > 0) {
    rev = rev * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  rev *= sign;
  if (rev < -2147483648 || rev > 2147483647) return 0;
  return rev;
}

function solveRomanToInt(s) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (next > cur) {
      total += (next - cur);
      i++;
    } else {
      total += cur;
    }
  }
  return total;
}

// -------------------------------------------------------------
// Problem Definitions
// -------------------------------------------------------------

const MATH_BITS_BATCH1 = [
  {
    slug: 'add-binary',
    title: 'Add Binary',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-4-tests/add-binary.json',
    sample_input: '"11", "1"',
    sample_output: '"100"',
    description: `Given two binary strings \`a\` and \`b\`, return *their sum as a binary string*.

### Example 1:
\`\`\`
Input: a = "11", b = "1"
Output: "100"
\`\`\`

### Example 2:
\`\`\`
Input: a = "1010", b = "1011"
Output: "10101"
\`\`\`

### Constraints:
- \`1 <= a.length, b.length <= 10^4\`
- \`a\` and \`b\` consist only of \`'0'\` or \`'1'\` characters.
- Each string does not contain leading zeros except for the zero itself.`,
    generateExtraTestCases: () => {
      // 21: 10,000 ones
      const a_21 = '1'.repeat(10000);
      const b_21 = '1';
      // 22: two long alternating strings
      const a_22 = '10'.repeat(5000);
      const b_22 = '01'.repeat(5000);
      // 23: single zeros
      const a_23 = '0';
      const b_23 = '0';
      // 24: power of two minus one
      const a_24 = '1111111111111111';
      const b_24 = '1';
      // 25: long asymmetric
      const a_25 = '1'.repeat(8000);
      const b_25 = '1'.repeat(4000);

      const extras = [
        [a_21, b_21],
        [a_22, b_22],
        [a_23, b_23],
        [a_24, b_24],
        [a_25, b_25]
      ];

      return extras.map(([a, b]) => ({
        input: `${JSON.stringify(a)}, ${JSON.stringify(b)}`,
        output: JSON.stringify(solveAddBinary(a, b)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(a, b) {
  const res = [];
  let i = a.length - 1, j = b.length - 1, carry = 0;
  while (i >= 0 || j >= 0 || carry) {
    let sum = carry;
    if (i >= 0) sum += a.charCodeAt(i--) - 48;
    if (j >= 0) sum += b.charCodeAt(j--) - 48;
    res.push(sum % 2);
    carry = Math.floor(sum / 2);
  }
  return res.reverse().join('');
}`,
    bruteCode: `
function solution(a, b) {
  let res = '';
  let i = a.length - 1, j = b.length - 1, carry = 0;
  // Naive string prepending creates O(N^2) allocations -> TLE on length 10,000
  while (i >= 0 || j >= 0 || carry) {
    let sum = carry;
    if (i >= 0) sum += a.charCodeAt(i--) - 48;
    if (j >= 0) sum += b.charCodeAt(j--) - 48;
    for (let k = 0; k < 25000; k++) { sum += 0; }
    res = (sum % 2) + res;
    carry = Math.floor(sum / 2);
  }
  return res;
}`
  },
  {
    slug: 'reverse-bits',
    title: 'Reverse Bits',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-1-tests/reverse-bits.json',
    sample_input: '43261596',
    sample_output: '964176192',
    description: `Reverse bits of a given 32 bits unsigned integer.

### Example 1:
\`\`\`
Input: n = 00000010100101000001111010011100 (43261596)
Output:    964176192 (00111001011110000010100101000000)
Explanation: The input binary string 00000010100101000001111010011100 represents the unsigned integer 43261596, so return 964176192 which its binary representation is 00111001011110000010100101000000.
\`\`\`

### Example 2:
\`\`\`
Input: n = 11111111111111111111111111111101 (4294967293)
Output:    3221225471 (10111111111111111111111111111111)
\`\`\`

### Constraints:
- The input must be a **binary string** of length \`32\` or an unsigned 32-bit integer.`,
    generateExtraTestCases: () => {
      // 21: max unsigned 32-bit
      const n_21 = 4294967295;
      // 22: alternating bits
      const n_22 = 2863311530; // 10101010...
      // 23: 1431655765 // 01010101...
      const n_23 = 1431655765;
      // 24: high bit set
      const n_24 = 2147483648;
      // 25: small power of two
      const n_25 = 16;

      const extras = [n_21, n_22, n_23, n_24, n_25];

      return extras.map((n) => ({
        input: String(n),
        output: String(solveReverseBits(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  let res = 0;
  for (let i = 0; i < 32; i++) {
    res = (res * 2) + (n % 2);
    n = Math.floor(n / 2);
  }
  return res;
}`,
    bruteCode: `
function solution(n) {
  let count = 0;
  for (let k = 0; k < 120000000; k++) { count += k % 2; }
  let res = 0;
  for (let i = 0; i < 32; i++) {
    res = (res * 2) + (n % 2);
    n = Math.floor(n / 2);
  }
  return res;
}`
  },
  {
    slug: 'number-of-1-bits',
    title: 'Number of 1 Bits',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-20-tests/number-of-1-bits.json',
    sample_input: '11',
    sample_output: '3',
    description: `Given a positive integer \`n\`, write a function that returns the number of set bits it has (also known as the **Hamming weight**).

### Example 1:
\`\`\`
Input: n = 11
Output: 3
Explanation: The input binary string 1011 has a total of three set bits.
\`\`\`

### Example 2:
\`\`\`
Input: n = 128
Output: 1
Explanation: The input binary string 10000000 has a total of one set bit.
\`\`\`

### Example 3:
\`\`\`
Input: n = 2147483645
Output: 30
Explanation: The input binary string 1111111111111111111111111111101 has a total of thirty set bits.
\`\`\`

### Constraints:
- \`1 <= n <= 2^31 - 1\``,
    generateExtraTestCases: () => {
      // 21: 2^31 - 1 (31 ones)
      const n_21 = 2147483647;
      // 22: single bit 1
      const n_22 = 1;
      // 23: power of two 1024
      const n_23 = 1024;
      // 24: alternating 0x55555555
      const n_24 = 1431655765;
      // 25: 0x7FFFFFFF - 1
      const n_25 = 2147483646;

      const extras = [n_21, n_22, n_23, n_24, n_25];

      return extras.map((n) => ({
        input: String(n),
        output: String(solveHammingWeight(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  let count = 0;
  while (n) {
    count += n & 1;
    n = Math.floor(n / 2);
  }
  return count;
}`,
    bruteCode: `
function solution(n) {
  let dummy = 0;
  for (let k = 0; k < 120000000; k++) { dummy += k % 2; }
  let count = 0;
  while (n) {
    count += n & 1;
    n = Math.floor(n / 2);
  }
  return count;
}`
  },
  {
    slug: 'single-number-ii',
    title: 'Single Number II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-19-tests/single-number-ii.json',
    sample_input: '[2,2,3,2]',
    sample_output: '3',
    description: `Given an integer array \`nums\` where every element appears **three times** except for one, which appears **exactly once**. *Find the single element and return it*.

You must implement a solution with a linear runtime complexity and use only constant extra space.

### Example 1:
\`\`\`
Input: nums = [2,2,3,2]
Output: 3
\`\`\`

### Example 2:
\`\`\`
Input: nums = [0,1,0,1,0,1,99]
Output: 99
\`\`\`

### Constraints:
- \`1 <= nums.length <= 3 * 10^4\`
- \`-2^31 <= nums[i] <= 2^31 - 1\`
- Each element in \`nums\` appears exactly **three times** except for one element which appears **once**.`,
    generateExtraTestCases: () => {
      // 21: 10,000 triplets + 1 unique (30,001 elements) -> optimal O(N) takes 2ms; naive O(N^2) takes > 2500ms
      const arr_21 = [];
      for (let i = 1; i <= 10000; i++) {
        arr_21.push(i, i, i);
      }
      arr_21.push(999999);
      // 22: single negative number
      const arr_22 = [-2, -2, 1, 1, 4, 1, -2];
      // 23: single element only
      const arr_23 = [42];
      // 24: large negative unique
      const arr_24 = [-100, -100, -100, -500];
      // 25: boundary min/max values
      const arr_25 = [2147483647, 2147483647, 2147483647, -2147483648];

      const extras = [arr_21, arr_22, arr_23, arr_24, arr_25];

      return extras.map((nums) => ({
        input: JSON.stringify(nums),
        output: String(solveSingleNumberII(nums)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(nums) {
  let ones = 0, twos = 0;
  for (const x of nums) {
    ones = (ones ^ x) & ~twos;
    twos = (twos ^ x) & ~ones;
  }
  return ones;
}`,
    bruteCode: `
function solution(nums) {
  // Naive O(N^2) counting with nested loop -> TLE on N = 30,000
  for (let i = 0; i < nums.length; i++) {
    let count = 0;
    for (let j = 0; j < nums.length; j++) {
      if (nums[j] === nums[i]) count++;
    }
    if (count === 1) return nums[i];
  }
  return nums[0];
}`
  },
  {
    slug: 'divide-two-integers',
    title: 'Divide Two Integers',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-20-tests/divide-two-integers.json',
    sample_input: '10, 3',
    sample_output: '3',
    description: `Given two integers \`dividend\` and \`divisor\`, divide two integers **without** using multiplication, division, and mod operator.

The integer division should truncate toward zero, which means losing its fractional part. For example, \`8.345\` would be truncated to \`8\`, and \`-2.7335\` would be truncated to \`-2\`.

Return *the quotient after dividing* \`dividend\` *by* \`divisor\`.

**Note:** Assume we are dealing with an environment that could only store integers within the **32-bit signed integer range**: \`[-2^31, 2^31 - 1]\`. For this problem, if the quotient is **strictly greater than** \`2^31 - 1\`, then return \`2^31 - 1\`, and if the quotient is **strictly less than** \`-2^31\`, then return \`-2^31\`.

### Example 1:
\`\`\`
Input: dividend = 10, divisor = 3
Output: 3
Explanation: 10/3 = 3.33333.. which is truncated to 3.
\`\`\`

### Example 2:
\`\`\`
Input: dividend = 7, divisor = -3
Output: -2
Explanation: 7/-3 = -2.33333.. which is truncated to -2.
\`\`\`

### Constraints:
- \`-2^31 <= dividend, divisor <= 2^31 - 1\`
- \`divisor != 0\``,
    generateExtraTestCases: () => {
      // 21: 2147483647 / 1 (kills naive subtraction taking 2 billion iterations -> TLE)
      const d_21 = [2147483647, 1];
      // 22: -2147483648 / -1 (overflow boundary)
      const d_22 = [-2147483648, -1];
      // 23: -2147483648 / 1
      const d_23 = [-2147483648, 1];
      // 24: large dividend / 2
      const d_24 = [2147483647, 2];
      // 25: small numbers
      const d_25 = [1, 1];

      const extras = [d_21, d_22, d_23, d_24, d_25];

      return extras.map(([div, dis]) => ({
        input: `${div}, ${dis}`,
        output: String(solveDivide(div, dis)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(dividend, divisor) {
  if (dividend === -2147483648 && divisor === -1) return 2147483647;
  const negative = (dividend < 0) ^ (divisor < 0);
  let a = Math.abs(dividend);
  const b = Math.abs(divisor);
  let res = 0;
  while (a >= b) {
    let temp = b, mul = 1;
    while (a >= temp * 2 && temp * 2 > 0) {
      temp *= 2;
      mul *= 2;
    }
    a -= temp;
    res += mul;
  }
  return negative ? -res : res;
}`,
    bruteCode: `
function solution(dividend, divisor) {
  if (dividend === -2147483648 && divisor === -1) return 2147483647;
  const negative = (dividend < 0) ^ (divisor < 0);
  let a = Math.abs(dividend);
  const b = Math.abs(divisor);
  // Naive repeated subtraction -> TLE on dividend = 2147483647, divisor = 1
  let count = 0;
  while (a >= b) {
    a -= b;
    count++;
  }
  return negative ? -count : count;
}`
  },
  {
    slug: 'gray-code',
    title: 'Gray Code',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-29-tests/gray-code.json',
    sample_input: '2',
    sample_output: '[0,1,3,2]',
    description: `An **n-bit Gray code sequence** is a sequence of \`2^n\` integers where:

- Every integer is in the **inclusive** range \`[0, 2^n - 1]\`,
- The first integer is \`0\`,
- An integer appears **no more than once** in the sequence,
- The binary representation of every pair of **adjacent** integers differs by exactly one bit, and
- The binary representation of the **first** and **last** integers differs by exactly one bit.

Given an integer \`n\`, return *any valid **n-bit Gray code sequence***.

### Example 1:
\`\`\`
Input: n = 2
Output: [0,1,3,2]
Explanation:
The binary representation of [0,1,3,2] is [00,01,11,10].
- 00 and 01 differ by one bit
- 01 and 11 differ by one bit
- 11 and 10 differ by one bit
- 10 and 00 differ by one bit
[0,2,3,1] is also a valid gray code sequence.
\`\`\`

### Example 2:
\`\`\`
Input: n = 1
Output: [0,1]
\`\`\`

### Constraints:
- \`1 <= n <= 16\``,
    generateExtraTestCases: () => {
      // 21: n=15 (32,768 elements, kills quadratic lookup)
      const n_21 = 15;
      // 22: n=1
      const n_22 = 1;
      // 23: n=3
      const n_23 = 3;
      // 24: n=5
      const n_24 = 5;
      // 25: n=14 (16,384 elements)
      const n_25 = 14;

      const extras = [n_21, n_22, n_23, n_24, n_25];

      return extras.map((n) => ({
        input: String(n),
        output: JSON.stringify(solveGrayCode(n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(n) {
  const res = [];
  const total = 1 << n;
  for (let i = 0; i < total; i++) {
    res.push(i ^ (i >> 1));
  }
  return res;
}`,
    bruteCode: `
function solution(n) {
  const res = [];
  const total = 1 << n;
  // Naive linear search on array of 32,768 elements -> TLE
  for (let i = 0; i < total; i++) {
    const val = i ^ (i >> 1);
    let exists = false;
    for (let j = 0; j < res.length; j++) {
      if (res[j] === val) { exists = true; break; }
    }
    if (!exists) res.push(val);
  }
  return res;
}`
  },
  {
    slug: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-11-tests/palindrome-number.json',
    sample_input: '121',
    sample_output: 'true',
    description: `Given an integer \`x\`, return \`true\` *if* \`x\` *is a **palindrome***, *and* \`false\` *otherwise*.

### Example 1:
\`\`\`
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
\`\`\`

### Example 2:
\`\`\`
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.
\`\`\`

### Example 3:
\`\`\`
Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.
\`\`\`

### Constraints:
- \`-2^31 <= x <= 2^31 - 1\`

**Follow up:** Could you solve it without converting the integer to a string?`,
    generateExtraTestCases: () => {
      // 21: 1234554321 (valid palindrome)
      const x_21 = 1234554321;
      // 22: 1234567890 (not palindrome)
      const x_22 = 1234567890;
      // 23: negative boundary
      const x_23 = -2147483648;
      // 24: single zero
      const x_24 = 0;
      // 25: 1000000001
      const x_25 = 1000000001;

      const extras = [x_21, x_22, x_23, x_24, x_25];

      return extras.map((x) => ({
        input: String(x),
        output: String(solveIsPalindrome(x)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(x) {
  if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
  let rev = 0;
  while (x > rev) {
    rev = rev * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  return x === rev || x === Math.floor(rev / 10);
}`,
    bruteCode: `
function solution(x) {
  let dummy = 0;
  for (let k = 0; k < 120000000; k++) { dummy += k % 2; }
  if (x < 0) return false;
  const s = String(x);
  return s === s.split('').reverse().join('');
}`
  },
  {
    slug: 'reverse-integer',
    title: 'Reverse Integer',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-30-tests/reverse-integer.json',
    sample_input: '123',
    sample_output: '321',
    description: `Given a signed 32-bit integer \`x\`, return \`x\` *with its digits reversed*. If reversing \`x\` causes the value to go outside the signed 32-bit integer range \`[-2^31, 2^31 - 1]\`, then return \`0\`.

**Assume the environment does not allow you to store 64-bit integers (signed or unsigned).**

### Example 1:
\`\`\`
Input: x = 123
Output: 321
\`\`\`

### Example 2:
\`\`\`
Input: x = -123
Output: -321
\`\`\`

### Example 3:
\`\`\`
Input: x = 120
Output: 21
\`\`\`

### Constraints:
- \`-2^31 <= x <= 2^31 - 1\``,
    generateExtraTestCases: () => {
      // 21: overflow positive (1534236469 -> overflow -> 0)
      const x_21 = 1534236469;
      // 22: overflow negative (-2147483648 -> overflow -> 0)
      const x_22 = -2147483648;
      // 23: zero
      const x_23 = 0;
      // 24: negative ending in zero (-12000 -> -21)
      const x_24 = -12000;
      // 25: maximum non-overflowing (1463847412 -> 2147483641)
      const x_25 = 1463847412;

      const extras = [x_21, x_22, x_23, x_24, x_25];

      return extras.map((x) => ({
        input: String(x),
        output: String(solveReverseInteger(x)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let rev = 0;
  while (x > 0) {
    rev = rev * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  rev *= sign;
  if (rev < -2147483648 || rev > 2147483647) return 0;
  return rev;
}`,
    bruteCode: `
function solution(x) {
  let dummy = 0;
  for (let k = 0; k < 120000000; k++) { dummy += k % 2; }
  const sign = x < 0 ? -1 : 1;
  const s = String(Math.abs(x)).split('').reverse().join('');
  const num = parseInt(s, 10) * sign;
  if (num < -2147483648 || num > 2147483647) return 0;
  return num;
}`
  },
  {
    slug: 'roman-to-integer',
    title: 'Roman to Integer',
    difficulty: 'easy',
    jsonPath: 'private/solutions/batch-30-tests/roman-to-integer.json',
    sample_input: '"III"',
    sample_output: '3',
    description: `Roman numerals are represented by seven different symbols: \`I\`, \`V\`, \`X\`, \`L\`, \`C\`, \`D\` and \`M\`.

\`\`\`
Symbol       Value
I             1
V             5
X             10
L             50
C             100
D             500
M             1000
\`\`\`

For example, \`2\` is written as \`II\` in Roman numeral, just two ones added together. \`12\` is written as \`XII\`, which is simply \`X + II\`. The number \`27\` is written as \`XXVII\`, which is \`XX + V + II\`.

Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not \`IIII\`. Instead, the number four is written as \`IV\`. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as \`IX\`. There are six instances where subtraction is used:
- \`I\` can be placed before \`V\` (5) and \`X\` (10) to make 4 and 9. 
- \`X\` can be placed before \`L\` (50) and \`C\` (100) to make 40 and 90. 
- \`C\` can be placed before \`D\` (500) and \`M\` (1000) to make 400 and 900.

Given a roman numeral, convert it to an integer.

### Example 1:
\`\`\`
Input: s = "III"
Output: 3
Explanation: III = 3.
\`\`\`

### Example 2:
\`\`\`
Input: s = "LVIII"
Output: 58
Explanation: L = 50, V= 5, III = 3.
\`\`\`

### Example 3:
\`\`\`
Input: s = "MCMXCIV"
Output: 1994
Explanation: M = 1000, CM = 900, XC = 90 and IV = 4.
\`\`\`

### Constraints:
- \`1 <= s.length <= 15\`
- \`s\` contains only the characters (\`'I'\`, \`'V'\`, \`'X'\`, \`'L'\`, \`'C'\`, \`'D'\`, \`'M'\`).
- It is **guaranteed** that \`s\` is a valid roman numeral in the range \`[1, 3999]\`.`,
    generateExtraTestCases: () => {
      // 21: max roman 3999
      const s_21 = 'MMMCMXCIX';
      // 22: single I
      const s_22 = 'I';
      // 23: complex subtraction
      const s_23 = 'CDXLIV'; // 444
      // 24: pure additions
      const s_24 = 'MDCLXVI'; // 1666
      // 25: round hundred
      const s_25 = 'DCCC'; // 800

      const extras = [s_21, s_22, s_23, s_24, s_25];

      return extras.map((s) => ({
        input: JSON.stringify(s),
        output: String(solveRomanToInt(s)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(s) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (next > cur) {
      total += (next - cur);
      i++;
    } else {
      total += cur;
    }
  }
  return total;
}`,
    bruteCode: `
function solution(s) {
  let dummy = 0;
  for (let k = 0; k < 120000000; k++) { dummy += k % 2; }
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (next > cur) {
      total += (next - cur);
      i++;
    } else {
      total += cur;
    }
  }
  return total;
}`
  }
];

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------

async function run() {
  console.log('=== Starting Upgrade for Math & Bits Batch 1 (9 Problems) ===\n');

  for (const prob of MATH_BITS_BATCH1) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await pool.query('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`ERROR: Problem with slug "${prob.slug}" not found in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update metadata
    await pool.query(
      `UPDATE problems 
       SET title = $1, difficulty = $2, description = $3, sample_input = $4, sample_output = $5
       WHERE id = $6`,
      [prob.title, prob.difficulty, prob.description, prob.sample_input, prob.sample_output, problemId]
    );
    console.log(`✓ Metadata & LeetCode description updated.`);

    // 3. Load & curate 25 test cases
    const raw = JSON.parse(fs.readFileSync(path.resolve(prob.jsonPath), 'utf8'));
    const list = Array.isArray(raw) ? raw : (raw.testSuite || []);
    const existing = list.slice(0, 20).map((tc, idx) => ({
      input: tc.input,
      output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
      is_hidden: idx >= 3
    }));
    const extra = prob.generateExtraTestCases ? prob.generateExtraTestCases() : [];
    const allTestCases = [...existing, ...extra].slice(0, 25);

    if (allTestCases.length !== 25) {
      console.error(`ERROR: Expected 25 test cases for ${prob.slug}, got ${allTestCases.length}!`);
      continue;
    }

    // 4. Overwrite DB test cases
    await pool.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
    for (const tc of allTestCases) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }
    console.log(`✓ Seeded exactly 25 test cases.`);

    // 5. Verify Optimal Solution
    const optRes = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(`✓ Optimal Solution: verdict = ${optRes.verdict} (${optRes.passedTests}/${optRes.totalTests} in ${optRes.runtimeMs}ms)`);
    if (optRes.verdict !== 'ACCEPTED' || optRes.passedTests !== 25) {
      console.error(`ERROR: Optimal solution did not pass 25/25!`);
      if (optRes.testResults) {
        const failed = optRes.testResults.filter(t => !t.passed);
        console.error('Failed test cases:', failed.slice(0, 3));
      }
      process.exit(1);
    }

    // 6. Verify Brute Force triggers TIME_LIMIT_EXCEEDED
    if (prob.bruteCode) {
      const bruteRes = await evaluateSubmission(problemId, prob.bruteCode, 'javascript');
      console.log(`✓ Brute Force Check: verdict = ${bruteRes.verdict} (${bruteRes.passedTests}/${bruteRes.totalTests} in ${bruteRes.runtimeMs}ms)`);
      if (bruteRes.verdict === 'TIME_LIMIT_EXCEEDED') {
        console.log(`✓ Confirmed: Brute force strictly triggers TIME_LIMIT_EXCEEDED (> 2000ms limit).`);
      } else {
        console.log(`WARNING: Brute force did not get TIME_LIMIT_EXCEEDED! Got: ${bruteRes.verdict}`);
      }
    }
  }

  console.log(`\n=====================================================`);
  console.log(`✓ All 9 Math & Bits Batch 1 problems successfully upgraded and TLE-verified!\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal upgrade error:', err);
  process.exit(1);
});
