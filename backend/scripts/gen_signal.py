import json
import random

def solve(s):
    from collections import Counter
    c = Counter(s)
    for i, char in enumerate(s):
        if c[char] == 1:
            return i
    return -1

ts = []
def add_case(ts, solve_fn, args):
    res = solve_fn(*args)
    ts.append({"input": ", ".join(json.dumps(a) for a in args), "output": json.dumps(res), "is_hidden": True})

add_case(ts, solve, ["leetcode"])
add_case(ts, solve, ["loveleetcode"])
add_case(ts, solve, ["aabb"])
add_case(ts, solve, [""])

for tc in ts:
    tc["is_hidden"] = True
ts[0]["is_hidden"] = False
ts[1]["is_hidden"] = False
ts[2]["is_hidden"] = False

# Add 25 hidden cases
import string
def rand_string(length, chars):
    return "".join(random.choice(chars) for _ in range(length))

random.seed(42)
for _ in range(10):
    add_case(ts, solve, [rand_string(random.randint(1, 20), string.ascii_lowercase)])
for _ in range(10):
    add_case(ts, solve, [rand_string(random.randint(100, 500), string.ascii_lowercase)])

# Edge cases
add_case(ts, solve, ["a" * 10000])
add_case(ts, solve, ["a" * 9999 + "b"])
add_case(ts, solve, ["b" + "a" * 9999])

def brute_force(s):
    for i in range(len(s)):
        found = False
        for j in range(len(s)):
            if i != j and s[i] == s[j]:
                found = True
                break
        if not found:
            return i
    return -1

# 200+ Cross checks
for _ in range(200):
    tc_arg = rand_string(random.randint(1, 50), string.ascii_lowercase)
    assert solve(tc_arg) == brute_force(tc_arg), f"Mismatch on {tc_arg}"

# Constraint checker
for tc in ts:
    arg = json.loads(f'[{tc["input"]}]')[0]
    assert 0 <= len(arg) <= 10000, f"Constraint violated: {len(arg)}"

data = {
  "title": "Identify Unique Signal",
  "topic": "strings",
  "difficulty": "easy",
  "statement": "A stream of lowercase English letters is received as a string `s`. You need to find the index of the first character that appears exactly once in the entire stream.\n\nIf such a character exists, return its 0-based index. If all characters repeat at least once, or if the string is empty, return `-1`.",
  "constraints": [
    "0 <= s.length <= 10000",
    "s consists of lowercase English letters."
  ],
  "examples": [
    {
      "input": "\"leetcode\"",
      "output": "0",
      "explanation": "The first non-repeating character is 'l' at index 0."
    },
    {
      "input": "\"loveleetcode\"",
      "output": "2",
      "explanation": "The first non-repeating character is 'v' at index 2."
    },
    {
      "input": "\"aabb\"",
      "output": "-1",
      "explanation": "All characters repeat, so return -1."
    }
  ],
  "hints": ["Count the frequency of each character in a first pass.", "Iterate through the string again to find the first character with a frequency of 1."],
  "referenceSolutions": {
    "python": "def solution(s):\n    c = {}\n    for char in s:\n        c[char] = c.get(char, 0) + 1\n    for i, char in enumerate(s):\n        if c[char] == 1:\n            return i\n    return -1",
    "javascript": "function solution(s) {\n    const c = {};\n    for (let char of s) c[char] = (c[char] || 0) + 1;\n    for (let i = 0; i < s.length; i++) {\n        if (c[s[i]] === 1) return i;\n    }\n    return -1;\n}",
    "java": "class Solution {\n    public int solution(String s) {\n        int[] c = new int[26];\n        for (int i = 0; i < s.length(); i++) c[s.charAt(i) - 'a']++;\n        for (int i = 0; i < s.length(); i++) {\n            if (c[s.charAt(i) - 'a'] == 1) return i;\n        }\n        return -1;\n    }\n}",
    "cpp": "#include <string>\n#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int solution(string s) {\n        vector<int> c(26, 0);\n        for (char ch : s) c[ch - 'a']++;\n        for (int i = 0; i < s.length(); i++) {\n            if (c[s[i] - 'a'] == 1) return i;\n        }\n        return -1;\n    }\n};"
  },
  "bruteForceSolution": {
    "language": "python",
    "code": "def solution(s):\n    for i in range(len(s)):\n        found = False\n        for j in range(len(s)):\n            if i != j and s[i] == s[j]:\n                found = True\n                break\n        if not found:\n            return i\n    return -1"
  },
  "testSuite": ts
}

with open("../private/solutions/identify-unique-signal.json", "w") as f:
    json.dump(data, f, indent=2)
