/**
 * backend/scripts/seed_striver_strings_batch1_25tc.js
 * 
 * Seeds and validates the first 5 questions of Step 5 (Strings) from Striver A2Z DSA Sheet:
 * 1. Remove Outermost Parentheses (remove-outermost-parentheses, LC 1021)
 * 2. Reverse Words in a String (reverse-words-in-a-string, LC 151)
 * 3. Largest Odd Number in String (largest-odd-number-in-string, LC 1903)
 * 4. Longest Common Prefix (longest-common-prefix, LC 14)
 * 5. Isomorphic Strings (isomorphic-strings, LC 205)
 *
 * Each problem gets:
 * - LeetCode standard description with examples, constraints & ASCII visualization diagrams
 * - Exactly 25 curated test cases (1-3 public, 4-20 edge cases, 21-25 stress scale tests)
 * - Optimal solution validation: 25/25 ACCEPTED (< 400ms)
 * - Naive solution validation: strictly TIME_LIMIT_EXCEEDED (> 2000ms)
 */

const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });
const { evaluateSubmission } = require('../services/judge');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Remove Outermost Parentheses (LC 1021)
// ─────────────────────────────────────────────────────────────────────────────
function generateRemoveOuterParenthesesTCs() {
  function removeOuterParentheses(s) {
    let res = "";
    let opened = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') {
        if (opened > 0) res += '(';
        opened++;
      } else {
        if (opened > 1) res += ')';
        opened--;
      }
    }
    return res;
  }

  const raw = [
    "(()())(())",
    "(()())(())(()(()))",
    "()()",
    "((()))",
    "()",
    "((()()))",
    "(()(()))",
    "()()()()()",
    "((()))((()))",
    "((()())(())())",
    "(()())",
    "((())(()))",
    "()(())",
    "((((()))))",
    "((()))()",
    "()((()))",
    "(()())(())()",
    "((((()))()()))",
    "()()()(())()",
    "((())())"
  ];

  const tcs = raw.map((s, idx) => ({
    input: JSON.stringify(s),
    output: removeOuterParentheses(s),
    is_hidden: idx >= 3
  }));

  // 21: 15,000 primitives of "()" -> empty string
  const s21 = "()".repeat(15000);
  tcs.push({ input: JSON.stringify(s21), output: removeOuterParentheses(s21), is_hidden: true });

  // 22: Deeply nested single primitive: 35,000 '(' followed by 35,000 ')' -> outer stripped
  const s22 = "(".repeat(35000) + ")".repeat(35000);
  tcs.push({ input: JSON.stringify(s22), output: removeOuterParentheses(s22), is_hidden: true });

  // 23: 10,000 primitives of "(())" -> "()".repeat(10000)
  const s23 = "(())".repeat(10000);
  tcs.push({ input: JSON.stringify(s23), output: removeOuterParentheses(s23), is_hidden: true });

  // 24: Single primitive containing 20,000 pairs of "()" inside: "(" + "()".repeat(20000) + ")"
  const s24 = "(" + "()".repeat(20000) + ")";
  tcs.push({ input: JSON.stringify(s24), output: removeOuterParentheses(s24), is_hidden: true });

  // 25: Massive single primitive nested 45,000 deep: "(" x 45000 + ")" x 45000
  const s25 = "(".repeat(45000) + ")".repeat(45000);
  tcs.push({ input: JSON.stringify(s25), output: removeOuterParentheses(s25), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Reverse Words in a String (LC 151)
// ─────────────────────────────────────────────────────────────────────────────
function generateReverseWordsTCs() {
  function reverseWords(s) {
    return s.trim().split(/\s+/).reverse().join(" ");
  }

  const raw = [
    "the sky is blue",
    "  hello world  ",
    "a good   example",
    "  Bob    Loves  Alice   ",
    "Alice",
    "   single   ",
    "EPY2giL",
    "  1 2 3 4 5  ",
    "a b c d e",
    "   multiple     spaces      between     words   ",
    "   space one  space two   space three ",
    "word",
    "  a  ",
    "alpha beta gamma delta epsilon",
    "one  two   three    four     five",
    "a   b   c   d",
    "leading   and   trailing   ",
    "mixed   LENGTH   words   HEre",
    "noLeadingNoTrailing",
    "first   second    third"
  ];

  const tcs = raw.map((s, idx) => ({
    input: JSON.stringify(s),
    output: reverseWords(s),
    is_hidden: idx >= 3
  }));

  // 21: 50,000 words: w0 w1 w2 ... w49999
  const words21 = Array.from({ length: 50000 }, (_, i) => "w" + i);
  const s21 = words21.join(" ");
  tcs.push({ input: JSON.stringify(s21), output: reverseWords(s21), is_hidden: true });

  // 22: 45,000 single character words
  const words22 = Array.from({ length: 45000 }, (_, i) => String.fromCharCode(97 + (i % 26)));
  const s22 = words22.join(" ");
  tcs.push({ input: JSON.stringify(s22), output: reverseWords(s22), is_hidden: true });

  // 23: 40,000 words with extra multiple random spaces
  const words23 = Array.from({ length: 40000 }, (_, i) => "item" + i);
  const s23 = "   " + words23.join("    ") + "   ";
  tcs.push({ input: JSON.stringify(s23), output: reverseWords(s23), is_hidden: true });

  // 24: 40,000 words with 100 leading and trailing spaces
  const words24 = Array.from({ length: 40000 }, (_, i) => "v" + i);
  const s24 = " ".repeat(100) + words24.join("  ") + " ".repeat(100);
  tcs.push({ input: JSON.stringify(s24), output: reverseWords(s24), is_hidden: true });

  // 25: 55,000 words
  const words25 = Array.from({ length: 55000 }, (_, i) => "x" + i);
  const s25 = words25.join(" ");
  tcs.push({ input: JSON.stringify(s25), output: reverseWords(s25), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Largest Odd Number in String (LC 1903)
// ─────────────────────────────────────────────────────────────────────────────
function generateLargestOddNumberTCs() {
  function largestOddNumber(num) {
    for (let i = num.length - 1; i >= 0; i--) {
      if ((num.charCodeAt(i) - 48) % 2 !== 0) {
        return num.slice(0, i + 1);
      }
    }
    return "";
  }

  const raw = [
    "52",
    "4206",
    "35427",
    "1",
    "2",
    "10000000",
    "2048",
    "13579",
    "24680",
    "754238",
    "9876543210",
    "102",
    "239537672423884969653287101",
    "22222222222222222222222222222222222222222222222222",
    "22222222222222222222222222222222222222222222222221",
    "12222222222222222222222222222222222222222222222222",
    "4206108",
    "70000",
    "846201",
    "5042"
  ];

  const tcs = raw.map((s, idx) => ({
    input: JSON.stringify(s),
    output: largestOddNumber(s),
    is_hidden: idx >= 3
  }));

  // 21: 60,000 digits all even -> ""
  const s21 = "2".repeat(60000);
  tcs.push({ input: JSON.stringify(s21), output: largestOddNumber(s21), is_hidden: true });

  // 22: 60,000 digits all even with '1' at index 0 -> "1"
  const s22 = "1" + "2".repeat(59999);
  tcs.push({ input: JSON.stringify(s22), output: largestOddNumber(s22), is_hidden: true });

  // 23: 60,000 digits all even with '7' at the very end -> full string
  const s23 = "2".repeat(59999) + "7";
  tcs.push({ input: JSON.stringify(s23), output: largestOddNumber(s23), is_hidden: true });

  // 24: 50,000 alternating digits 2,4,6,8 ending with 9
  const s24 = "2468".repeat(12500).slice(0, 49999) + "9";
  tcs.push({ input: JSON.stringify(s24), output: largestOddNumber(s24), is_hidden: true });

  // 25: 65,000 digits all even -> ""
  const s25 = "4".repeat(65000);
  tcs.push({ input: JSON.stringify(s25), output: largestOddNumber(s25), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Longest Common Prefix (LC 14)
// ─────────────────────────────────────────────────────────────────────────────
function generateLongestCommonPrefixTCs() {
  function longestCommonPrefix(strs) {
    if (!strs || strs.length === 0) return "";
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
      while (strs[i].indexOf(prefix) !== 0) {
        prefix = prefix.slice(0, -1);
        if (prefix === "") return "";
      }
    }
    return prefix;
  }

  const raw = [
    ["flower", "flow", "flight"],
    ["dog", "racecar", "car"],
    [""],
    ["a"],
    ["a", "a"],
    ["ab", "a"],
    ["cir", "car"],
    ["interspecies", "interstellar", "interstate"],
    ["throne", "throne"],
    ["reflower", "flow", "flight"],
    ["interview", "internet", "internal", "interval"],
    ["prefix", "prefixes", "prefixing"],
    ["same", "same", "same", "same", "same"],
    ["a", "b", "c"],
    ["alphabet", "alpha", "alphanumeric"],
    ["apple", "ape", "april"],
    ["geeksforgeeks", "geeks", "geek", "geezer"],
    ["", "b"],
    ["aa", "aa"],
    ["aaa", "aa", "aaa"]
  ];

  const tcs = raw.map((strs, idx) => ({
    input: JSON.stringify(strs),
    output: longestCommonPrefix(strs),
    is_hidden: idx >= 3
  }));

  // 21: 2,500 strings, each of length 600, with identical prefix of length 200
  const pref21 = "x".repeat(200);
  const suff21 = "y".repeat(400);
  const s21 = Array.from({ length: 2500 }, () => pref21 + suff21);
  tcs.push({ input: JSON.stringify(s21), output: longestCommonPrefix(s21), is_hidden: true });

  // 22: 2,500 strings of length 500, common prefix of 50 chars, then different
  const pref22 = "m".repeat(50);
  const s22 = Array.from({ length: 2500 }, (_, i) => pref22 + String.fromCharCode(97 + (i % 26)) + "k".repeat(449));
  tcs.push({ input: JSON.stringify(s22), output: longestCommonPrefix(s22), is_hidden: true });

  // 23: 2,000 strings where first string is "a" and all others are "b" x 500 -> ""
  const s23 = ["a", ...Array.from({ length: 1999 }, () => "b".repeat(500))];
  tcs.push({ input: JSON.stringify(s23), output: longestCommonPrefix(s23), is_hidden: true });

  // 24: 2,500 strings of length 600 all identical "z" x 600
  const s24 = Array.from({ length: 2500 }, () => "z".repeat(600));
  tcs.push({ input: JSON.stringify(s24), output: longestCommonPrefix(s24), is_hidden: true });

  // 25: 2,500 strings where the 2,500th string differs at index 150
  const pref25 = "p".repeat(150);
  const s25 = Array.from({ length: 2499 }, () => pref25 + "a".repeat(450));
  s25.push(pref25 + "b".repeat(450));
  tcs.push({ input: JSON.stringify(s25), output: longestCommonPrefix(s25), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Isomorphic Strings (LC 205)
// ─────────────────────────────────────────────────────────────────────────────
function generateIsomorphicStringsTCs() {
  function isIsomorphic(s, t) {
    if (s.length !== t.length) return false;
    const mapST = new Map();
    const mapTS = new Map();
    for (let i = 0; i < s.length; i++) {
      const c1 = s[i], c2 = t[i];
      if (mapST.has(c1) && mapST.get(c1) !== c2) return false;
      if (mapTS.has(c2) && mapTS.get(c2) !== c1) return false;
      mapST.set(c1, c2);
      mapTS.set(c2, c1);
    }
    return true;
  }

  const raw = [
    ["egg", "add"],
    ["foo", "bar"],
    ["paper", "title"],
    ["badc", "baba"],
    ["a", "a"],
    ["ab", "aa"],
    ["aa", "ab"],
    ["bbbaaaba", "aaabbbba"],
    ["abcdefghijklmnopqrstuvwxyz", "bcdefghijklmnopqrstuvwxyza"],
    ["abcdefghijklmnopqrstuvwxyz", "abcdefghijklmnopqrstuvwxyz"],
    ["aae", "ccd"],
    ["13", "42"],
    ["11", "22"],
    ["12", "11"],
    ["ab", "ca"],
    ["aba", "baa"],
    ["abacaba", "xyxzxzy"],
    ["abacaba", "xyxzxyz"],
    ["abacaba", "xyxzxyx"],
    ["qwertyuiopasdfghjklzxcvbnm", "mnbvcxzlkjhgfdsapoiuytrewq"]
  ];

  const tcs = raw.map(([s, t], idx) => ({
    input: `${JSON.stringify(s)}, ${JSON.stringify(t)}`,
    output: String(isIsomorphic(s, t)),
    is_hidden: idx >= 3
  }));

  // 21: N = 35,000 repeating cycle mapped to another repeating cycle -> true
  const n21 = 35000;
  const s21 = "abcdefghijklmnopqrstuvwxyz".repeat(Math.ceil(n21 / 26)).slice(0, n21);
  const t21 = "bcdefghijklmnopqrstuvwxyza".repeat(Math.ceil(n21 / 26)).slice(0, n21);
  tcs.push({ input: `${JSON.stringify(s21)}, ${JSON.stringify(t21)}`, output: String(isIsomorphic(s21, t21)), is_hidden: true });

  // 22: N = 35,000 repeating cycle where the last char violates mapping -> false
  const s22 = s21;
  const t22 = t21.slice(0, -1) + "!";
  tcs.push({ input: `${JSON.stringify(s22)}, ${JSON.stringify(t22)}`, output: String(isIsomorphic(s22, t22)), is_hidden: true });

  // 23: N = 40,000 single repeated char -> true
  const s23 = "a".repeat(40000);
  const t23 = "b".repeat(40000);
  tcs.push({ input: `${JSON.stringify(s23)}, ${JSON.stringify(t23)}`, output: String(isIsomorphic(s23, t23)), is_hidden: true });

  // 24: N = 40,000 one mismatch at the very end -> false
  const s24 = "a".repeat(39999) + "b";
  const t24 = "c".repeat(40000);
  tcs.push({ input: `${JSON.stringify(s24)}, ${JSON.stringify(t24)}`, output: String(isIsomorphic(s24, t24)), is_hidden: true });

  // 25: N = 45,000 alternating digits mapped to letters -> true
  const s25 = "01".repeat(22500);
  const t25 = "xy".repeat(22500);
  tcs.push({ input: `${JSON.stringify(s25)}, ${JSON.stringify(t25)}`, output: String(isIsomorphic(s25, t25)), is_hidden: true });

  return tcs;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEMS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Remove Outermost Parentheses',
    slug: 'remove-outermost-parentheses',
    topic: 'strings',
    difficulty: 'easy',
    sample_input: '"(()())(())"',
    sample_output: '"()()()"',
    description: `A valid parentheses string is either empty \`""\`, \`"("\` + \`A\` + \`")"\`, or \`A\` + \`B\`, where \`A\` and \`B\` are valid parentheses strings, and \`+\` represents string concatenation.

- For example, \`""\`, \`"()"\`, \`"(())()"\`, and \`"(()(()))"\` are all valid parentheses strings.

A valid parentheses string \`s\` is **primitive** if it is nonempty, and it cannot be split into two or more nonempty valid parentheses strings.

Given a valid parentheses string \`s\`, consider its primitive decomposition: \`s = P₁ + P₂ + ... + Pₖ\`, where \`Pᵢ\` are primitive valid parentheses strings.

Return \`s\` *after removing the outermost parentheses of every primitive string in the primitive decomposition of* \`s\`.

### Primitive Decomposition Diagram:
\`\`\`
Input: "(()())(())"

Step 1: Identify Primitives:
[ ( ( ) ( ) ) ]   +   [ ( ( ) ) ]
  │         │           │     │
  └─outer───┘           └outer┘
       ↓                   ↓
   ( ) ( )                ( )

Concatenated Result: "()()()"
\`\`\`

### Example 1:
\`\`\`
Input: s = "(()())(())"
Output: "()()()"
Explanation: 
The input string is "(()())(())", with primitive decomposition "(()())" + "(())".
After removing outer parentheses of each part, this is "()()" + "()" = "()()()".
\`\`\`

### Example 2:
\`\`\`
Input: s = "(()())(())(()(()))"
Output: "()()()()(())"
Explanation: 
The input string is "(()())(())(()(()))", with primitive decomposition "(()())" + "(())" + "(()(()))".
After removing outer parentheses of each part, this is "()()" + "()" + "()(())" = "()()()()(())".
\`\`\`

### Example 3:
\`\`\`
Input: s = "()()"
Output: ""
Explanation: 
The input string is "()()", with primitive decomposition "()" + "()".
After removing outer parentheses of each part, this is "" + "" = "".
\`\`\`

### Constraints:
- \`1 <= s.length <= 10⁵\`
- \`s[i]\` is either \`'('\` or \`')'\`.
- \`s\` is a valid parentheses string.`,
    hints: [
      'Can you track the balance of open parentheses as you iterate through the string?',
      'An opening parenthesis belongs to the inner content only if opened count is already > 0.',
      'A closing parenthesis belongs to the inner content only if opened count is > 1 before decrementing.'
    ],
    testCases: generateRemoveOuterParenthesesTCs(),
    optimalCode: `
function solution(s) {
  let res = "";
  let opened = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      if (opened > 0) res += '(';
      opened++;
    } else {
      if (opened > 1) res += ')';
      opened--;
    }
  }
  return res;
}
`,
    naiveCode: `
function solution(s) {
  let res = "";
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length) {
      let sub = s.slice(i, j + 1);
      let b = 0, valid = true;
      for (let k = 0; k < sub.length; k++) {
        if (sub[k] === '(') b++;
        else b--;
        if (b < 0) { valid = false; break; }
      }
      if (b === 0 && valid) {
        res += s.slice(i + 1, j);
        i = j + 1;
        break;
      }
      j++;
    }
  }
  return res;
}
`
  },
  {
    title: 'Reverse Words in a String',
    slug: 'reverse-words-in-a-string',
    topic: 'strings',
    difficulty: 'medium',
    sample_input: '"the sky is blue"',
    sample_output: '"blue is sky the"',
    description: `Given an input string \`s\`, reverse the order of the **words**.

A **word** is defined as a sequence of non-space characters. The **words** in \`s\` will be separated by at least one space.

Return *a string of the words in reverse order concatenated by a single space*.

**Note** that \`s\` may contain leading or trailing spaces or multiple spaces between two words. The returned string should only have a single space separating the words. Do not include any extra spaces.

### Word Reversal Diagram:
\`\`\`
Input String:
"  the   sky   is   blue  "
     ↓
Tokenize Words (ignoring extra spaces):
["the", "sky", "is", "blue"]
     ↓
Reverse Order of Words:
["blue", "is", "sky", "the"]
     ↓
Join with Single Space:
"blue is sky the"
\`\`\`

### Example 1:
\`\`\`
Input: s = "the sky is blue"
Output: "blue is sky the"
\`\`\`

### Example 2:
\`\`\`
Input: s = "  hello world  "
Output: "world hello"
Explanation: Your reversed string should not contain leading or trailing spaces.
\`\`\`

### Example 3:
\`\`\`
Input: s = "a good   example"
Output: "example good a"
Explanation: You need to reduce multiple spaces between two words to a single space in the reversed string.
\`\`\`

### Constraints:
- \`1 <= s.length <= 10⁵\`
- \`s\` contains English letters (upper-case and lower-case), digits, and spaces \`' '\`.
- There is **at least one** word in \`s\`.

**Follow-up:** If the string data type is mutable in your language, can you solve it in-place with \`O(1)\` extra space?`,
    hints: [
      'Trim leading/trailing whitespaces.',
      'Split words by multiple consecutive spaces.',
      'Reverse the extracted sequence of words and join them with a single space.'
    ],
    testCases: generateReverseWordsTCs(),
    optimalCode: `
function solution(s) {
  return s.trim().split(/\\s+/).reverse().join(" ");
}
`,
    naiveCode: `
function solution(s) {
  const words = [];
  let current = "";
  for (let i = 0; i <= s.length; i++) {
    if (i < s.length && s[i] !== ' ') {
      current += s[i];
    } else if (current.length > 0) {
      for (let j = words.length; j > 0; j--) {
        words[j] = words[j - 1];
      }
      words[0] = current;
      current = "";
    }
  }
  return words.join(" ");
}
`
  },
  {
    title: 'Largest Odd Number in String',
    slug: 'largest-odd-number-in-string',
    topic: 'strings',
    difficulty: 'easy',
    sample_input: '"52"',
    sample_output: '"5"',
    description: `You are given a string \`num\`, representing a large integer. Return the *largest-valued odd integer (as a string) that is a **non-empty substring** of* \`num\`, *or an empty string* \`""\` *if no odd integer exists*.

A **substring** is a contiguous sequence of characters within a string.

### Inspection Diagram:
\`\`\`
Number: " 3  5  4  2  7 "
                      ^
                      └─ Rightmost odd digit ('7') at index 4!
Prefix up to index 4 is the largest odd number: "35427"

Number: " 5  2 "
          ^
          └─ Rightmost odd digit ('5') at index 0.
Prefix up to index 0: "5"
\`\`\`

### Example 1:
\`\`\`
Input: num = "52"
Output: "5"
Explanation: The only non-empty substrings are "5", "2", and "52". "5" is the only odd number.
\`\`\`

### Example 2:
\`\`\`
Input: num = "4206"
Output: ""
Explanation: There are no odd numbers in "4206".
\`\`\`

### Example 3:
\`\`\`
Input: num = "35427"
Output: "35427"
Explanation: "35427" is already an odd number.
\`\`\`

### Constraints:
- \`1 <= num.length <= 10⁵\`
- \`num\` only consists of digits and does not contain any leading zeros.`,
    hints: [
      'In any decimal number, oddness is entirely determined by its last digit.',
      'To maximize the value, the substring must start at index 0 (as many most-significant digits as possible).',
      'Scan from the rightmost digit towards index 0; return the prefix as soon as an odd digit is encountered.'
    ],
    testCases: generateLargestOddNumberTCs(),
    optimalCode: `
function solution(num) {
  for (let i = num.length - 1; i >= 0; i--) {
    if ((num.charCodeAt(i) - 48) % 2 !== 0) {
      return num.slice(0, i + 1);
    }
  }
  return "";
}
`,
    naiveCode: `
function solution(num) {
  let best = "";
  for (let i = 0; i < num.length; i++) {
    for (let j = i; j < num.length; j++) {
      let last = num.charCodeAt(j) - 48;
      if (last % 2 !== 0) {
        let candidate = num.slice(i, j + 1);
        if (candidate.length > best.length) best = candidate;
      }
    }
  }
  return best;
}
`
  },
  {
    title: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    topic: 'strings',
    difficulty: 'easy',
    sample_input: '["flower","flow","flight"]',
    sample_output: '"fl"',
    description: `Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string \`""\`.

### Matching Alignment Diagram:
\`\`\`
Index:     0   1   2   3   4   5
--------------------------------
str[0]:    f   l   o   w   e   r
str[1]:    f   l   o   w
str[2]:    f   l   i   g   h   t
           ▲   ▲   ▲
           │   │   └─ Mismatch! ('o' vs 'i')
           └───┴───── Common Prefix: "fl"
\`\`\`

### Example 1:
\`\`\`
Input: strs = ["flower","flow","flight"]
Output: "fl"
\`\`\`

### Example 2:
\`\`\`
Input: strs = ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.
\`\`\`

### Constraints:
- \`1 <= strs.length <= 200\`
- \`0 <= strs[i].length <= 200\`
- \`strs[i]\` consists of only lowercase English letters if it is non-empty.`,
    hints: [
      'Take the first string as your initial prefix.',
      'Iterate through the remaining strings and shrink the prefix until each string starts with it.',
      'If prefix becomes empty, no common prefix exists.'
    ],
    testCases: generateLongestCommonPrefixTCs(),
    optimalCode: `
function solution(strs) {
  if (!strs || strs.length === 0) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (prefix === "") return "";
    }
  }
  return prefix;
}
`,
    naiveCode: `
function solution(strs) {
  if (!strs || strs.length === 0) return "";
  let naiveAns = strs[0];
  for (let i = 0; i < strs.length; i++) {
    for (let j = i + 1; j < strs.length; j++) {
      let matchLen = 0;
      while (matchLen < strs[i].length && matchLen < strs[j].length && strs[i][matchLen] === strs[j][matchLen]) {
        matchLen++;
      }
      if (matchLen < naiveAns.length) naiveAns = strs[i].slice(0, matchLen);
    }
  }
  return naiveAns;
}
`
  },
  {
    title: 'Isomorphic Strings',
    slug: 'isomorphic-strings',
    topic: 'strings',
    difficulty: 'easy',
    sample_input: '"egg", "add"',
    sample_output: 'true',
    description: `Given two strings \`s\` and \`t\`, *determine if they are isomorphic*.

Two strings \`s\` and \`t\` are isomorphic if the characters in \`s\` can be replaced to get \`t\`.

All occurrences of a character must be replaced with another character while preserving the order of characters. No two characters may map to the same character, but a character may map to itself.

### Character Bijection Diagram:
\`\`\`
Valid Bijection (1-to-1):
s = "e g g"
     │ │ │
     ▼ ▼ ▼
t = "a d d"

Mapping:
'e' ──► 'a'
'g' ──► 'd'
Result: true (Consistent 1-to-1 bijection)

Invalid Mapping:
s = "f o o"
t = "b a r"
'o' maps to both 'a' and 'r' ──► Conflict! Result: false
\`\`\`

### Example 1:
\`\`\`
Input: s = "egg", t = "add"
Output: true
Explanation:
The strings s and t can be made identical by:
- Mapping 'e' to 'a'.
- Mapping 'g' to 'd'.
\`\`\`

### Example 2:
\`\`\`
Input: s = "foo", t = "bar"
Output: false
Explanation:
The strings s and t can not be made identical as 'o' needs to be mapped to both 'a' and 'r'.
\`\`\`

### Example 3:
\`\`\`
Input: s = "paper", t = "title"
Output: true
\`\`\`

### Constraints:
- \`1 <= s.length <= 5 * 10⁴\`
- \`t.length == s.length\`
- \`s\` and \`t\` consist of any valid ascii character.`,
    hints: [
      'Two strings are isomorphic if there is a 1-to-1 correspondence (bijection) between characters.',
      'Maintain two maps: one from s to t, and one from t to s.',
      'If any character has already been mapped to a different character in either direction, return false.'
    ],
    testCases: generateIsomorphicStringsTCs(),
    optimalCode: `
function solution(s, t) {
  if (s.length !== t.length) return false;
  const mapST = new Map();
  const mapTS = new Map();
  for (let i = 0; i < s.length; i++) {
    const c1 = s[i], c2 = t[i];
    if (mapST.has(c1) && mapST.get(c1) !== c2) return false;
    if (mapTS.has(c2) && mapTS.get(c2) !== c1) return false;
    mapST.set(c1, c2);
    mapTS.set(c2, c1);
  }
  return true;
}
`,
    naiveCode: `
function solution(s, t) {
  if (s.length !== t.length) return false;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j < s.length; j++) {
      if ((s[i] === s[j]) !== (t[i] === t[j])) {
        return false;
      }
    }
  }
  return true;
}
`
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION & VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[Seed] Seeding and verifying Step 5 Strings Batch 1 (5 Problems)...');

  for (const p of PROBLEMS) {
    console.log(`\n========================================\n[Problem] Processing: ${p.title} (${p.slug})`);

    // 1. Check if problem already exists
    const { rows: existing } = await pool.query(
      `SELECT id FROM problems WHERE slug = $1`,
      [p.slug]
    );

    let problemId;
    if (existing.length > 0) {
      problemId = existing[0].id;
      console.log(`  -> Found existing in DB with ID: ${problemId}. Updating fields...`);
      await pool.query(
        `UPDATE problems
         SET title = $1, topic = $2, difficulty = $3, description = $4, hints = $5,
             sample_input = $6, sample_output = $7
         WHERE id = $8`,
        [p.title, p.topic, p.difficulty, p.description, JSON.stringify(p.hints), p.sample_input, p.sample_output, problemId]
      );
    } else {
      console.log(`  -> Inserting new problem into DB...`);
      const { rows: inserted } = await pool.query(
        `INSERT INTO problems (title, slug, topic, difficulty, description, hints, sample_input, sample_output)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [p.title, p.slug, p.topic, p.difficulty, p.description, JSON.stringify(p.hints), p.sample_input, p.sample_output]
      );
      problemId = inserted[0].id;
      console.log(`  -> Inserted with ID: ${problemId}`);
    }

    // 2. Clear old test cases
    const { rowCount: deletedCount } = await pool.query(
      `DELETE FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );
    if (deletedCount > 0) {
      console.log(`  -> Cleared ${deletedCount} existing test cases.`);
    }

    // 3. Insert 25 curated test cases
    console.log(`  -> Inserting ${p.testCases.length} curated test cases...`);
    for (const tc of p.testCases) {
      await pool.query(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }

    // 4. Verify test case count in DB
    const { rows: countCheck } = await pool.query(
      `SELECT count(*) FROM test_cases WHERE problem_id = $1`,
      [problemId]
    );
    console.log(`  -> Verified in DB: count = ${countCheck[0].count} test cases.`);

    // 5. Query back test cases and run Judge evaluation on OPTIMAL code
    console.log(`  -> Evaluating OPTIMAL solution...`);
    const optResult = await evaluateSubmission(problemId, p.optimalCode, 'javascript');
    console.log(`  -> Optimal Verdict: ${optResult.verdict} (${optResult.passedTests}/${optResult.totalTests} passed in ${optResult.runtimeMs}ms)`);

    if (optResult.verdict !== 'ACCEPTED' || optResult.passedTests !== 25) {
      console.error(`  [ERROR] Problem ${p.title} failed OPTIMAL validation!`);
      const firstFailed = optResult.testResults.find(t => !t.passed);
      console.error('  First failed test:', firstFailed);
      process.exit(1);
    }

    // 6. Run Judge evaluation on NAIVE code to strictly verify TLE
    console.log(`  -> Evaluating NAIVE solution (expecting strictly TIME_LIMIT_EXCEEDED)...`);
    const naiveResult = await evaluateSubmission(problemId, p.naiveCode, 'javascript');
    console.log(`  -> Naive Verdict: ${naiveResult.verdict} (${naiveResult.passedTests}/${naiveResult.totalTests} passed in ${naiveResult.runtimeMs}ms)`);

    if (naiveResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
      console.error(`  [ERROR] Problem ${p.title} naive solution DID NOT trigger TLE! Verdict was: ${naiveResult.verdict}`);
      process.exit(1);
    }

    console.log(`  -> SUCCESS! Both Optimal (25/25 ACCEPTED) and Naive (strictly TLE) verified for ${p.title}`);
  }

  console.log('\n========================================\nALL 5 PROBLEMS SUCCESSFULLY SEEDED, TESTED & TLE-VERIFIED!\n');
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
