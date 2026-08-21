'use strict';

/**
 * Canonical specifications for Strings, Anagrams, Backtracking, Subsets, Permutations.
 */
module.exports = [
  {
    title: 'Longest Substring Without Repeating Characters',
    topic: 'strings',
    difficulty: 'medium',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

### **Example 1:**
**Input:** s = "abcabcbb"
**Output:** 3
**Explanation:** The answer is "abc", with the length of 3.

### **Example 2:**
**Input:** s = "bbbbb"
**Output:** 1
**Explanation:** The answer is "b", with the length of 1.

### **Example 3:**
**Input:** s = "pwwkew"
**Output:** 3
**Explanation:** The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.

### **Constraints:**
- \`0 <= s.length <= 5 * 10⁴\`
- \`s\` consists of English letters, digits, symbols and spaces.`,
    sample_input: '"abcabcbb"',
    sample_output: '3',
    test_cases: [
      { input: '"abcabcbb"', output: '3', is_hidden: false },
      { input: '"bbbbb"', output: '1', is_hidden: false },
      { input: '"pwwkew"', output: '3', is_hidden: false },
      { input: '""', output: '0', is_hidden: true },
      { input: '"au"', output: '2', is_hidden: true }
    ],
    solutions: {
      js: `function solution(s) {
        let maxLen = 0, l = 0;
        const set = new Set();
        for (let r = 0; r < s.length; r++) {
          while (set.has(s[r])) {
            set.delete(s[l++]);
          }
          set.add(s[r]);
          maxLen = Math.max(maxLen, r - l + 1);
        }
        return maxLen;
      }`,
      py: `class Solution:
    def solution(self, s: str) -> int:
        seen = set()
        l, max_len = 0, 0
        for r in range(len(s)):
            while s[r] in seen:
                seen.remove(s[l])
                l += 1
            seen.add(s[r])
            max_len = max(max_len, r - l + 1)
        return max_len`,
      java: `class Solution {
        public int solution(String s) {
          Set<Character> seen = new HashSet<>();
          int l = 0, maxLen = 0;
          for (int r = 0; r < s.length(); r++) {
            while (seen.contains(s.charAt(r))) {
              seen.remove(s.charAt(l++));
            }
            seen.add(s.charAt(r));
            maxLen = Math.max(maxLen, r - l + 1);
          }
          return maxLen;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(string s) {
          unordered_set<char> seen;
          int l = 0, maxLen = 0;
          for (int r = 0; r < s.length(); r++) {
            while (seen.count(s[r])) {
              seen.erase(s[l++]);
            }
            seen.insert(s[r]);
            maxLen = max(maxLen, r - l + 1);
          }
          return maxLen;
        }
      };`
    }
  },

  {
    title: 'Longest Palindromic Substring',
    topic: 'strings',
    difficulty: 'medium',
    description: `Given a string \`s\`, return *the longest palindromic substring* in \`s\`.

### **Example 1:**
**Input:** s = "babad"
**Output:** "bab"
**Explanation:** "aba" is also a valid answer.

### **Example 2:**
**Input:** s = "cbbd"
**Output:** "bb"

### **Constraints:**
- \`1 <= s.length <= 1000\`
- \`s\` consist of only digits and English letters.`,
    sample_input: '"babad"',
    sample_output: '"bab"',
    test_cases: [
      { input: '"babad"', output: '"bab"', is_hidden: false },
      { input: '"cbbd"', output: '"bb"', is_hidden: false },
      { input: '"a"', output: '"a"', is_hidden: false },
      { input: '"ac"', output: '"a"', is_hidden: true }
    ],
    solutions: {
      js: `function solution(s) {
        if (!s) return "";
        let start = 0, maxLen = 1;
        function expand(l, r) {
          while (l >= 0 && r < s.length && s[l] === s[r]) {
            if (r - l + 1 > maxLen) {
              start = l;
              maxLen = r - l + 1;
            }
            l--; r++;
          }
        }
        for (let i = 0; i < s.length; i++) {
          expand(i, i);
          expand(i, i + 1);
        }
        return s.substring(start, start + maxLen);
      }`,
      py: `class Solution:
    def solution(self, s: str) -> str:
        if not s: return ""
        start, max_len = 0, 1
        def expand(l, r):
            nonlocal start, max_len
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > max_len:
                    start = l
                    max_len = r - l + 1
                l -= 1; r += 1
        for i in range(len(s)):
            expand(i, i)
            expand(i, i + 1)
        return s[start:start + max_len]`,
      java: `class Solution {
        public String solution(String s) {
          if (s == null || s.length() == 0) return "";
          int start = 0, maxLen = 1;
          for (int i = 0; i < s.length(); i++) {
            for (int[] p : new int[][]{{i, i}, {i, i + 1}}) {
              int l = p[0], r = p[1];
              while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
                if (r - l + 1 > maxLen) {
                  start = l;
                  maxLen = r - l + 1;
                }
                l--; r++;
              }
            }
          }
          return s.substring(start, start + maxLen);
        }
      }`,
      cpp: `class Solution {
      public:
        string solution(string s) {
          if (s.empty()) return "";
          int start = 0, maxLen = 1;
          auto expand = [&](int l, int r) {
            while (l >= 0 && r < s.length() && s[l] == s[r]) {
              if (r - l + 1 > maxLen) {
                start = l;
                maxLen = r - l + 1;
              }
              l--; r++;
            }
          };
          for (int i = 0; i < s.length(); i++) {
            expand(i, i);
            expand(i, i + 1);
          }
          return s.substr(start, maxLen);
        }
      };`
    }
  },

  {
    title: 'Valid Parentheses',
    topic: 'strings',
    difficulty: 'easy',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### **Example 1:**
**Input:** s = "()"
**Output:** true

### **Example 2:**
**Input:** s = "()[]{}"
**Output:** true

### **Example 3:**
**Input:** s = "(]"
**Output:** false

### **Constraints:**
- \`1 <= s.length <= 10⁴\`
- \`s\` consists of parentheses only \`'()[]{}'\`.`,
    sample_input: '"()"',
    sample_output: 'true',
    test_cases: [
      { input: '"()"', output: 'true', is_hidden: false },
      { input: '"()[]{}"', output: 'true', is_hidden: false },
      { input: '"(]"', output: 'false', is_hidden: false },
      { input: '"([)]"', output: 'false', is_hidden: true },
      { input: '"{[]}"', output: 'true', is_hidden: true }
    ],
    solutions: {
      js: `function solution(s) {
        const stack = [];
        const map = { ')': '(', '}': '{', ']': '[' };
        for (const ch of s) {
          if (ch in map) {
            if (stack.pop() !== map[ch]) return false;
          } else {
            stack.push(ch);
          }
        }
        return stack.length === 0;
      }`,
      py: `class Solution:
    def solution(self, s: str) -> bool:
        stack = []
        map = {')': '(', '}': '{', ']': '['}
        for ch in s:
            if ch in map:
                if not stack or stack.pop() != map[ch]:
                    return False
            else:
                stack.append(ch)
        return len(stack) == 0`,
      java: `class Solution {
        public boolean solution(String s) {
          Stack<Character> stack = new Stack<>();
          for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
          }
          return stack.isEmpty();
        }
      }`,
      cpp: `class Solution {
      public:
        bool solution(string s) {
          stack<char> st;
          for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else {
              if (st.empty() || st.top() != c) return false;
              st.pop();
            }
          }
          return st.empty();
        }
      };`
    }
  },

  {
    title: 'Generate Parentheses',
    topic: 'strings',
    difficulty: 'medium',
    description: `Given \`n\` pairs of parentheses, write a function to *generate all combinations of well-formed parentheses*.

### **Example 1:**
**Input:** n = 3
**Output:** ["((()))","(()())","(())()","()(())","()()()"]

### **Example 2:**
**Input:** n = 1
**Output:** ["()"]

### **Constraints:**
- \`1 <= n <= 8\``,
    sample_input: '3',
    sample_output: '["((()))","(()())","(())()","()(())","()()()"]',
    test_cases: [
      { input: '3', output: '["((()))","(()())","(())()","()(())","()()()"]', is_hidden: false },
      { input: '1', output: '["()"]', is_hidden: false },
      { input: '2', output: '["(())","()()"]', is_hidden: false }
    ],
    solutions: {
      js: `function solution(n) {
        const res = [];
        function backtrack(str, open, close) {
          if (str.length === 2 * n) {
            res.push(str);
            return;
          }
          if (open < n) backtrack(str + '(', open + 1, close);
          if (close < open) backtrack(str + ')', open, close + 1);
        }
        backtrack('', 0, 0);
        return res;
      }`,
      py: `class Solution:
    def solution(self, n: int) -> List[str]:
        res = []
        def backtrack(s, open_c, close_c):
            if len(s) == 2 * n:
                res.append(s)
                return
            if open_c < n:
                backtrack(s + '(', open_c + 1, close_c)
            if close_c < open_c:
                backtrack(s + ')', open_c, close_c + 1)
        backtrack('', 0, 0)
        return res`,
      java: `class Solution {
        public List<String> solution(int n) {
          List<String> res = new ArrayList<>();
          backtrack("", 0, 0, n, res);
          return res;
        }
        private void backtrack(String s, int open, int close, int n, List<String> res) {
          if (s.length() == 2 * n) {
            res.add(s);
            return;
          }
          if (open < n) backtrack(s + "(", open + 1, close, n, res);
          if (close < open) backtrack(s + ")", open, close + 1, n, res);
        }
      }`,
      cpp: `class Solution {
      public:
        void backtrack(string s, int open, int close, int n, vector<string>& res) {
          if (s.length() == 2 * n) {
            res.push_back(s);
            return;
          }
          if (open < n) backtrack(s + "(", open + 1, close, n, res);
          if (close < open) backtrack(s + ")", open, close + 1, n, res);
        }
        vector<string> solution(int n) {
          vector<string> res;
          backtrack("", 0, 0, n, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Group Anagrams',
    topic: 'strings',
    difficulty: 'medium',
    description: `Given an array of strings \`strs\`, group **the anagrams** together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

### **Example 1:**
**Input:** strs = ["eat","tea","tan","ate","nat","bat"]
**Output:** [["bat"],["nat","tan"],["ate","eat","tea"]]

### **Example 2:**
**Input:** strs = [""]
**Output:** [[""]]

### **Example 3:**
**Input:** strs = ["a"]
**Output:** [["a"]]

### **Constraints:**
- \`1 <= strs.length <= 10⁴\`
- \`0 <= strs[i].length <= 100\`
- \`strs[i]\` consists of lowercase English letters.`,
    sample_input: '["eat","tea","tan","ate","nat","bat"]',
    sample_output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
    test_cases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', is_hidden: false },
      { input: '[""]', output: '[[""]]', is_hidden: false },
      { input: '["a"]', output: '[["a"]]', is_hidden: false },
      { input: '["ab","ba","c"]', output: '[["ab","ba"],["c"]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(strs) {
        const map = {};
        for (const s of strs) {
          const key = s.split('').sort().join('');
          if (!map[key]) map[key] = [];
          map[key].push(s);
        }
        return Object.values(map);
      }`,
      py: `class Solution:
    def solution(self, strs: List[str]) -> List[List[str]]:
        groups = collections.defaultdict(list)
        for s in strs:
            key = ''.join(sorted(s))
            groups[key].append(s)
        return list(groups.values())`,
      java: `class Solution {
        public List<List<String>> solution(String[] strs) {
          Map<String, List<String>> map = new HashMap<>();
          for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
          }
          return new ArrayList<>(map.values());
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<string>> solution(vector<string>& strs) {
          unordered_map<string, vector<string>> map;
          for (const string& s : strs) {
            string key = s;
            sort(key.begin(), key.end());
            map[key].push_back(s);
          }
          vector<vector<string>> res;
          for (auto& p : map) res.push_back(p.second);
          return res;
        }
      };`
    }
  },

  {
    title: 'Word Break II',
    topic: 'strings',
    difficulty: 'hard',
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, add spaces in \`s\` to construct a sentence where each word is a valid dictionary word. Return all such possible sentences in **any order**.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.

### **Example 1:**
**Input:** s = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]
**Output:** ["cats and dog","cat sand dog"]

### **Example 2:**
**Input:** s = "pineapplepenapple", wordDict = ["apple","pen","applepen","pine","pineapple"]
**Output:** ["pine apple pen apple","pineapple pen apple","pine applepen apple"]
**Explanation:** Note that you are allowed to reuse a dictionary word.

### **Example 3:**
**Input:** s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
**Output:** []

### **Constraints:**
- \`1 <= s.length <= 20\`
- \`1 <= wordDict.length <= 1000\`
- \`1 <= wordDict[i].length <= 10\`
- \`s\` and \`wordDict[i]\` consist of only lowercase English letters.
- All the strings of \`wordDict\` are **unique**.
- Input is generated in a way that the length of the answer doesn't exceed 10⁵.`,
    sample_input: '"catsanddog", ["cat","cats","and","sand","dog"]',
    sample_output: '["cats and dog","cat sand dog"]',
    test_cases: [
      { input: '"catsanddog", ["cat","cats","and","sand","dog"]', output: '["cats and dog","cat sand dog"]', is_hidden: false },
      { input: '"pineapplepenapple", ["apple","pen","applepen","pine","pineapple"]', output: '["pine apple pen apple","pineapple pen apple","pine applepen apple"]', is_hidden: false },
      { input: '"catsandog", ["cats","dog","sand","and","cat"]', output: '[]', is_hidden: false }
    ],
    solutions: {
      js: `function solution(s, wordDict) {
        const dict = new Set(wordDict);
        const memo = new Map();
        function dfs(str) {
          if (memo.has(str)) return memo.get(str);
          if (!str) return [''];
          const res = [];
          for (let i = 1; i <= str.length; i++) {
            const prefix = str.slice(0, i);
            if (dict.has(prefix)) {
              const subRes = dfs(str.slice(i));
              for (const sub of subRes) {
                res.push(prefix + (sub ? ' ' + sub : ''));
              }
            }
          }
          memo.set(str, res);
          return res;
        }
        return dfs(s);
      }`,
      py: `class Solution:
    def solution(self, s: str, wordDict: List[str]) -> List[str]:
        words = set(wordDict)
        memo = {}
        def dfs(string):
            if string in memo: return memo[string]
            if not string: return ['']
            res = []
            for i in range(1, len(string) + 1):
                prefix = string[:i]
                if prefix in words:
                    for sub in dfs(string[i:]):
                        res.append(prefix + (' ' + sub if sub else ''))
            memo[string] = res
            return res
        return dfs(s)`,
      java: `class Solution {
        private Map<String, List<String>> memo = new HashMap<>();
        public List<String> solution(String s, List<String> wordDict) {
          memo.clear();
          Set<String> dict = new HashSet<>(wordDict);
          return dfs(s, dict);
        }
        private List<String> dfs(String s, Set<String> dict) {
          if (memo.containsKey(s)) return memo.get(s);
          if (s.isEmpty()) return Arrays.asList("");
          List<String> res = new ArrayList<>();
          for (int i = 1; i <= s.length(); i++) {
            String prefix = s.substring(0, i);
            if (dict.contains(prefix)) {
              List<String> subList = dfs(s.substring(i), dict);
              for (String sub : subList) {
                res.add(prefix + (sub.isEmpty() ? "" : " " + sub));
              }
            }
          }
          memo.put(s, res);
          return res;
        }
      }`,
      cpp: `class Solution {
      public:
        unordered_map<string, vector<string>> memo;
        vector<string> dfs(string s, const unordered_set<string>& dict) {
          if (memo.count(s)) return memo[s];
          if (s.empty()) return {""};
          vector<string> res;
          for (size_t i = 1; i <= s.length(); i++) {
            string prefix = s.substr(0, i);
            if (dict.count(prefix)) {
              vector<string> subList = dfs(s.substr(i), dict);
              for (const string& sub : subList) {
                res.push_back(prefix + (sub.empty() ? "" : " " + sub));
              }
            }
          }
          memo[s] = res;
          return res;
        }
        vector<string> solution(string s, vector<string>& wordDict) {
          memo.clear();
          unordered_set<string> dict(wordDict.begin(), wordDict.end());
          return dfs(s, dict);
        }
      };`
    }
  },

  {
    title: 'Subsets',
    topic: 'backtracking',
    difficulty: 'medium',
    description: `Given an integer array \`nums\` of **unique** elements, return *all possible subsets (the power set)*.

The solution set **must not** contain duplicate subsets. Return the solution in **any order**.

### **Example 1:**
**Input:** nums = [1,2,3]
**Output:** [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]

### **Example 2:**
**Input:** nums = [0]
**Output:** [[],[0]]

### **Constraints:**
- \`1 <= nums.length <= 10\`
- \`-10 <= nums[i] <= 10\`
- All the numbers of \`nums\` are **unique**.`,
    sample_input: '[1,2,3]',
    sample_output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]',
    test_cases: [
      { input: '[1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]', is_hidden: false },
      { input: '[0]', output: '[[],[0]]', is_hidden: false },
      { input: '[1,2]', output: '[[],[1],[2],[1,2]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        const res = [];
        function backtrack(start, path) {
          res.push([...path]);
          for (let i = start; i < nums.length; i++) {
            path.push(nums[i]);
            backtrack(i + 1, path);
            path.pop();
          }
        }
        backtrack(0, []);
        return res;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> List[List[int]]:
        res = []
        def backtrack(start, path):
            res.append(list(path))
            for i in range(start, len(nums)):
                path.append(nums[i])
                backtrack(i + 1, path)
                path.pop()
        backtrack(0, [])
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(int[] nums) {
          List<List<Integer>> res = new ArrayList<>();
          backtrack(0, nums, new ArrayList<>(), res);
          return res;
        }
        private void backtrack(int start, int[] nums, List<Integer> path, List<List<Integer>> res) {
          res.add(new ArrayList<>(path));
          for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            backtrack(i + 1, nums, path, res);
            path.remove(path.size() - 1);
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void backtrack(int start, vector<int>& nums, vector<int>& path, vector<vector<int>>& res) {
          res.push_back(path);
          for (size_t i = start; i < nums.size(); i++) {
            path.push_back(nums[i]);
            backtrack(i + 1, nums, path, res);
            path.pop_back();
          }
        }
        vector<vector<int>> solution(vector<int>& nums) {
          vector<vector<int>> res;
          vector<int> path;
          backtrack(0, nums, path, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Permutations',
    topic: 'backtracking',
    difficulty: 'medium',
    description: `Given an array \`nums\` of distinct integers, return *all the possible permutations*. You can return the answer in **any order**.

### **Example 1:**
**Input:** nums = [1,2,3]
**Output:** [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]

### **Example 2:**
**Input:** nums = [0,1]
**Output:** [[0,1],[1,0]]

### **Example 3:**
**Input:** nums = [1]
**Output:** [[1]]

### **Constraints:**
- \`1 <= nums.length <= 6\`
- \`-10 <= nums[i] <= 10\`
- All the integers of \`nums\` are **unique**.`,
    sample_input: '[1,2,3]',
    sample_output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
    test_cases: [
      { input: '[1,2,3]', output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]', is_hidden: false },
      { input: '[0,1]', output: '[[0,1],[1,0]]', is_hidden: false },
      { input: '[1]', output: '[[1]]', is_hidden: false }
    ],
    solutions: {
      js: `function solution(nums) {
        const res = [];
        const used = new Array(nums.length).fill(false);
        function backtrack(path) {
          if (path.length === nums.length) {
            res.push([...path]);
            return;
          }
          for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.push(nums[i]);
            backtrack(path);
            path.pop();
            used[i] = false;
          }
        }
        backtrack([]);
        return res;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> List[List[int]]:
        res = []
        used = [False] * len(nums)
        def backtrack(path):
            if len(path) == len(nums):
                res.append(list(path))
                return
            for i in range(len(nums)):
                if not used[i]:
                    used[i] = True
                    path.append(nums[i])
                    backtrack(path)
                    path.pop()
                    used[i] = False
        backtrack([])
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(int[] nums) {
          List<List<Integer>> res = new ArrayList<>();
          boolean[] used = new boolean[nums.length];
          backtrack(nums, used, new ArrayList<>(), res);
          return res;
        }
        private void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
          if (path.size() == nums.length) {
            res.add(new ArrayList<>(path));
            return;
          }
          for (int i = 0; i < nums.length; i++) {
            if (!used[i]) {
              used[i] = true;
              path.add(nums[i]);
              backtrack(nums, used, path, res);
              path.remove(path.size() - 1);
              used[i] = false;
            }
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void backtrack(vector<int>& nums, vector<bool>& used, vector<int>& path, vector<vector<int>>& res) {
          if (path.size() == nums.size()) {
            res.push_back(path);
            return;
          }
          for (size_t i = 0; i < nums.size(); i++) {
            if (!used[i]) {
              used[i] = true;
              path.push_back(nums[i]);
              backtrack(nums, used, path, res);
              path.pop_back();
              used[i] = false;
            }
          }
        }
        vector<vector<int>> solution(vector<int>& nums) {
          vector<vector<int>> res;
          vector<bool> used(nums.size(), false);
          vector<int> path;
          backtrack(nums, used, path, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Combination Sum',
    topic: 'backtracking',
    difficulty: 'medium',
    description: `Given an array of **distinct** integers \`candidates\` and a target integer \`target\`, return *a list of all **unique combinations** of \`candidates\` where the chosen numbers sum to \`target\`*. You may return the combinations in **any order**.

The **same** number may be chosen from \`candidates\` an **unlimited number of times**. Two combinations are unique if the frequency of at least one of the chosen numbers is different.

### **Example 1:**
**Input:** candidates = [2,3,6,7], target = 7
**Output:** [[2,2,3],[7]]
**Explanation:**
2 and 3 are candidates, and 2 + 2 + 3 = 7. Note that 2 can be used multiple times.
7 is a candidate, and 7 = 7.
These are the only two combinations.

### **Example 2:**
**Input:** candidates = [2,3,5], target = 8
**Output:** [[2,2,2,2],[2,3,3],[3,5]]

### **Example 3:**
**Input:** candidates = [2], target = 1
**Output:** []

### **Constraints:**
- \`1 <= candidates.length <= 30\`
- \`2 <= candidates[i] <= 40\`
- All elements of \`candidates\` are **distinct**.
- \`1 <= target <= 40\``,
    sample_input: '[2,3,6,7], 7',
    sample_output: '[[2,2,3],[7]]',
    test_cases: [
      { input: '[2,3,6,7], 7', output: '[[2,2,3],[7]]', is_hidden: false },
      { input: '[2,3,5], 8', output: '[[2,2,2,2],[2,3,3],[3,5]]', is_hidden: false },
      { input: '[2], 1', output: '[]', is_hidden: false },
      { input: '[3,5], 11', output: '[[3,3,5]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(candidates, target) {
        const res = [];
        function backtrack(start, remain, path) {
          if (remain === 0) { res.push([...path]); return; }
          if (remain < 0) return;
          for (let i = start; i < candidates.length; i++) {
            path.push(candidates[i]);
            backtrack(i, remain - candidates[i], path);
            path.pop();
          }
        }
        backtrack(0, target, []);
        return res;
      }`,
      py: `class Solution:
    def solution(self, candidates: List[int], target: int) -> List[List[int]]:
        res = []
        def backtrack(start, remain, path):
            if remain == 0:
                res.append(list(path))
                return
            if remain < 0: return
            for i in range(start, len(candidates)):
                path.append(candidates[i])
                backtrack(i, remain - candidates[i], path)
                path.pop()
        backtrack(0, target, [])
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(int[] candidates, int target) {
          List<List<Integer>> res = new ArrayList<>();
          backtrack(0, target, candidates, new ArrayList<>(), res);
          return res;
        }
        private void backtrack(int start, int remain, int[] candidates, List<Integer> path, List<List<Integer>> res) {
          if (remain == 0) { res.add(new ArrayList<>(path)); return; }
          if (remain < 0) return;
          for (int i = start; i < candidates.length; i++) {
            path.add(candidates[i]);
            backtrack(i, remain - candidates[i], candidates, path, res);
            path.remove(path.size() - 1);
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void backtrack(int start, int remain, vector<int>& candidates, vector<int>& path, vector<vector<int>>& res) {
          if (remain == 0) { res.push_back(path); return; }
          if (remain < 0) return;
          for (size_t i = start; i < candidates.size(); i++) {
            path.push_back(candidates[i]);
            backtrack(i, remain - candidates[i], candidates, path, res);
            path.pop_back();
          }
        }
        vector<vector<int>> solution(vector<int>& candidates, int target) {
          vector<vector<int>> res;
          vector<int> path;
          backtrack(0, target, candidates, path, res);
          return res;
        }
      };`
    }
  }
];
