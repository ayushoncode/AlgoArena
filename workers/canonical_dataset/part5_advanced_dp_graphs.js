'use strict';

/**
 * Canonical specifications for Advanced DP, Graphs, and Complex Linked Lists / Trees.
 */
module.exports = [
  {
    title: 'Word Break',
    topic: 'dp',
    difficulty: 'medium',
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.

### **Example 1:**
**Input:** s = "leetcode", wordDict = ["leet","code"]
**Output:** true
**Explanation:** Return true because "leetcode" can be segmented as "leet code".

### **Example 2:**
**Input:** s = "applepenapple", wordDict = ["apple","pen"]
**Output:** true
**Explanation:** Return true because "applepenapple" can be segmented as "apple pen apple". Note that you are allowed to reuse a dictionary word.

### **Example 3:**
**Input:** s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
**Output:** false

### **Constraints:**
- \`1 <= s.length <= 300\`
- \`1 <= wordDict.length <= 1000\`
- \`1 <= wordDict[i].length <= 20\`
- \`s\` and \`wordDict[i]\` consist of only lowercase English letters.
- All the strings of \`wordDict\` are **unique**.`,
    sample_input: '"leetcode", ["leet","code"]',
    sample_output: 'true',
    test_cases: [
      { input: '"leetcode", ["leet","code"]', output: 'true', is_hidden: false },
      { input: '"applepenapple", ["apple","pen"]', output: 'true', is_hidden: false },
      { input: '"catsandog", ["cats","dog","sand","and","cat"]', output: 'false', is_hidden: false },
      { input: '"a", ["b"]', output: 'false', is_hidden: true }
    ],
    solutions: {
      js: `function solution(s, wordDict) {
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
      py: `class Solution:
    def solution(self, s: str, wordDict: List[str]) -> bool:
        words = set(wordDict)
        dp = [False] * (len(s) + 1)
        dp[0] = True
        for i in range(1, len(s) + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[len(s)]`,
      java: `class Solution {
        public boolean solution(String s, List<String> wordDict) {
          Set<String> dict = new HashSet<>(wordDict);
          boolean[] dp = new boolean[s.length() + 1];
          dp[0] = true;
          for (int i = 1; i <= s.length(); i++) {
            for (int j = 0; j < i; j++) {
              if (dp[j] && dict.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
              }
            }
          }
          return dp[s.length()];
        }
      }`,
      cpp: `class Solution {
      public:
        bool solution(string s, vector<string>& wordDict) {
          unordered_set<string> dict(wordDict.begin(), wordDict.end());
          int n = s.size();
          vector<bool> dp(n + 1, false);
          dp[0] = true;
          for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
              if (dp[j] && dict.count(s.substr(j, i - j))) {
                dp[i] = true;
                break;
              }
            }
          }
          return dp[n];
        }
      };`
    }
  },

  {
    title: 'Word Ladder',
    topic: 'graphs',
    difficulty: 'hard',
    description: `A **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord -> s1 -> s2 -> ... -> sk\` such that:
- Every adjacent pair of words differs by a single letter.
- Every \`si\` for \`1 <= i <= k\` is in \`wordList\`. Note that \`beginWord\` does not need to be in \`wordList\`.
- \`sk == endWord\`

Given two words, \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return *the **number of words** in the **shortest transformation sequence** from* \`beginWord\` *to* \`endWord\`, *or* \`0\` *if no such sequence exists.*

### **Example 1:**
**Input:** beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
**Output:** 5
**Explanation:** One shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which is 5 words long.

### **Example 2:**
**Input:** beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]
**Output:** 0
**Explanation:** The endWord "cog" is not in wordList, therefore there is no valid transformation sequence.

### **Constraints:**
- \`1 <= beginWord.length <= 10\`
- \`endWord.length == beginWord.length\`
- \`1 <= wordList.length <= 5000\`
- \`wordList[i].length == beginWord.length\`
- \`beginWord\`, \`endWord\`, and \`wordList[i]\` consist of lowercase English letters.
- \`beginWord != endWord\`
- All the words in \`wordList\` are **unique**.`,
    sample_input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]',
    sample_output: '5',
    test_cases: [
      { input: '"hit", "cog", ["hot","dot","dog","lot","log","cog"]', output: '5', is_hidden: false },
      { input: '"hit", "cog", ["hot","dot","dog","lot","log"]', output: '0', is_hidden: false },
      { input: '"a", "c", ["a","b","c"]', output: '2', is_hidden: false },
      { input: '"hot", "dog", ["hot","dog"]', output: '0', is_hidden: true }
    ],
    solutions: {
      js: `function solution(beginWord, endWord, wordList) {
        const dict = new Set(wordList);
        if (!dict.has(endWord)) return 0;
        const q = [[beginWord, 1]];
        const visited = new Set([beginWord]);
        const alpha = 'abcdefghijklmnopqrstuvwxyz';
        while (q.length > 0) {
          const [word, level] = q.shift();
          if (word === endWord) return level;
          for (let i = 0; i < word.length; i++) {
            for (let c = 0; c < 26; c++) {
              const next = word.slice(0, i) + alpha[c] + word.slice(i + 1);
              if (dict.has(next) && !visited.has(next)) {
                visited.add(next);
                q.push([next, level + 1]);
              }
            }
          }
        }
        return 0;
      }`,
      py: `class Solution:
    def solution(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        words = set(wordList)
        if endWord not in words: return 0
        q = collections.deque([(beginWord, 1)])
        visited = {beginWord}
        while q:
            word, level = q.popleft()
            if word == endWord: return level
            for i in range(len(word)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    next_w = word[:i] + c + word[i+1:]
                    if next_w in words and next_w not in visited:
                        visited.add(next_w)
                        q.append((next_w, level + 1))
        return 0`,
      java: `class Solution {
        public int solution(String beginWord, String endWord, List<String> wordList) {
          Set<String> words = new HashSet<>(wordList);
          if (!words.contains(endWord)) return 0;
          Queue<String> q = new LinkedList<>();
          q.add(beginWord);
          Set<String> visited = new HashSet<>();
          visited.add(beginWord);
          int level = 1;
          while (!q.isEmpty()) {
            int size = q.size();
            for (int k = 0; k < size; k++) {
              String word = q.poll();
              if (word.equals(endWord)) return level;
              char[] chars = word.toCharArray();
              for (int i = 0; i < chars.length; i++) {
                char old = chars[i];
                for (char c = 'a'; c <= 'z'; c++) {
                  chars[i] = c;
                  String next = new String(chars);
                  if (words.contains(next) && !visited.contains(next)) {
                    visited.add(next);
                    q.add(next);
                  }
                }
                chars[i] = old;
              }
            }
            level++;
          }
          return 0;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(string beginWord, string endWord, vector<string>& wordList) {
          unordered_set<string> words(wordList.begin(), wordList.end());
          if (!words.count(endWord)) return 0;
          queue<pair<string, int>> q;
          q.push({beginWord, 1});
          unordered_set<string> visited;
          visited.insert(beginWord);
          while (!q.empty()) {
            auto [word, level] = q.front();
            q.pop();
            if (word == endWord) return level;
            for (size_t i = 0; i < word.size(); i++) {
              char orig = word[i];
              for (char c = 'a'; c <= 'z'; c++) {
                word[i] = c;
                if (words.count(word) && !visited.count(word)) {
                  visited.insert(word);
                  q.push({word, level + 1});
                }
              }
              word[i] = orig;
            }
          }
          return 0;
        }
      };`
    }
  },

  {
    title: 'House Robber',
    topic: 'dp',
    difficulty: 'medium',
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and **it will automatically contact the police if two adjacent houses were broken into on the same night**.

Given an integer array \`nums\` representing the amount of money of each house, return *the maximum amount of money you can rob tonight **without alerting the police***.

### **Example 1:**
**Input:** nums = [1,2,3,1]
**Output:** 4
**Explanation:** Rob house 1 (money = 1) and then rob house 3 (money = 3).
Total amount you can rob = 1 + 3 = 4.

### **Example 2:**
**Input:** nums = [2,7,9,3,1]
**Output:** 12
**Explanation:** Rob house 1 (money = 2), rob house 3 (money = 9) and rob house 5 (money = 1).
Total amount you can rob = 2 + 9 + 1 = 12.

### **Constraints:**
- \`1 <= nums.length <= 100\`
- \`0 <= nums[i] <= 400\``,
    sample_input: '[1,2,3,1]',
    sample_output: '4',
    test_cases: [
      { input: '[1,2,3,1]', output: '4', is_hidden: false },
      { input: '[2,7,9,3,1]', output: '12', is_hidden: false },
      { input: '[0]', output: '0', is_hidden: false },
      { input: '[2,1,1,2]', output: '4', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        let prev1 = 0, prev2 = 0;
        for (const x of nums) {
          const temp = Math.max(prev1, prev2 + x);
          prev2 = prev1;
          prev1 = temp;
        }
        return prev1;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        prev1, prev2 = 0, 0
        for x in nums:
            prev1, prev2 = max(prev1, prev2 + x), prev1
        return prev1`,
      java: `class Solution {
        public int solution(int[] nums) {
          int prev1 = 0, prev2 = 0;
          for (int x : nums) {
            int t = Math.max(prev1, prev2 + x);
            prev2 = prev1;
            prev1 = t;
          }
          return prev1;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          int prev1 = 0, prev2 = 0;
          for (int x : nums) {
            int t = max(prev1, prev2 + x);
            prev2 = prev1;
            prev1 = t;
          }
          return prev1;
        }
      };`
    }
  },

  {
    title: 'Longest Increasing Subsequence',
    topic: 'dp',
    difficulty: 'medium',
    description: `Given an integer array \`nums\`, return *the length of the longest **strictly increasing subsequence***.

### **Example 1:**
**Input:** nums = [10,9,2,5,3,7,101,18]
**Output:** 4
**Explanation:** The longest increasing subsequence is [2,3,7,101], therefore the length is 4.

### **Example 2:**
**Input:** nums = [0,1,0,3,2,3]
**Output:** 4

### **Example 3:**
**Input:** nums = [7,7,7,7,7,7,7]
**Output:** 1

### **Constraints:**
- \`1 <= nums.length <= 2500\`
- \`-10⁴ <= nums[i] <= 10⁴\``,
    sample_input: '[10,9,2,5,3,7,101,18]',
    sample_output: '4',
    test_cases: [
      { input: '[10,9,2,5,3,7,101,18]', output: '4', is_hidden: false },
      { input: '[0,1,0,3,2,3]', output: '4', is_hidden: false },
      { input: '[7,7,7,7,7,7,7]', output: '1', is_hidden: false },
      { input: '[4,10,4,3,8,9]', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        const tails = [];
        for (const x of nums) {
          let l = 0, r = tails.length;
          while (l < r) {
            const mid = Math.floor((l + r) / 2);
            if (tails[mid] < x) l = mid + 1;
            else r = mid;
          }
          tails[l] = x;
        }
        return tails.length;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        tails = []
        for x in nums:
            idx = bisect.bisect_left(tails, x)
            if idx == len(tails):
                tails.append(x)
            else:
                tails[idx] = x
        return len(tails)`,
      java: `class Solution {
        public int solution(int[] nums) {
          int[] tails = new int[nums.length];
          int size = 0;
          for (int x : nums) {
            int l = 0, r = size;
            while (l < r) {
              int mid = (l + r) / 2;
              if (tails[mid] < x) l = mid + 1;
              else r = mid;
            }
            tails[l] = x;
            if (l == size) size++;
          }
          return size;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          vector<int> tails;
          for (int x : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), x);
            if (it == tails.end()) tails.push_back(x);
            else *it = x;
          }
          return tails.size();
        }
      };`
    }
  },

  {
    title: 'Decode Ways',
    topic: 'dp',
    difficulty: 'medium',
    description: `A message containing letters from \`A-Z\` can be **encoded** into numbers using the following mapping:
\`'A' -> "1"\`
\`'B' -> "2"\`
...
\`'Z' -> "26"\`

To **decode** an encoded message, all the digits must be grouped then mapped back into letters using the reverse of the mapping above.

Given a string \`s\` containing only digits, return *the **number** of ways to **decode** it*.

### **Example 1:**
**Input:** s = "12"
**Output:** 2
**Explanation:** "12" could be decoded as "AB" (1 2) or "L" (12).

### **Example 2:**
**Input:** s = "226"
**Output:** 3
**Explanation:** "226" could be decoded as "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).

### **Example 3:**
**Input:** s = "06"
**Output:** 0
**Explanation:** "06" cannot be mapped to "F" because of the leading zero.

### **Constraints:**
- \`1 <= s.length <= 100\`
- \`s\` contains only digits and may contain leading zero(s).`,
    sample_input: '"12"',
    sample_output: '2',
    test_cases: [
      { input: '"12"', output: '2', is_hidden: false },
      { input: '"226"', output: '3', is_hidden: false },
      { input: '"06"', output: '0', is_hidden: false },
      { input: '"10"', output: '1', is_hidden: true }
    ],
    solutions: {
      js: `function solution(s) {
        if (!s || s[0] === '0') return 0;
        const n = s.length;
        let prev2 = 1, prev1 = 1;
        for (let i = 1; i < n; i++) {
          let curr = 0;
          if (s[i] !== '0') curr += prev1;
          const two = parseInt(s.substring(i - 1, i + 1), 10);
          if (two >= 10 && two <= 26) curr += prev2;
          prev2 = prev1;
          prev1 = curr;
        }
        return prev1;
      }`,
      py: `class Solution:
    def solution(self, s: str) -> int:
        if not s or s[0] == '0': return 0
        prev2, prev1 = 1, 1
        for i in range(1, len(s)):
            curr = 0
            if s[i] != '0': curr += prev1
            if 10 <= int(s[i-1:i+1]) <= 26: curr += prev2
            prev2, prev1 = prev1, curr
        return prev1`,
      java: `class Solution {
        public int solution(String s) {
          if (s == null || s.length() == 0 || s.charAt(0) == '0') return 0;
          int prev2 = 1, prev1 = 1;
          for (int i = 1; i < s.length(); i++) {
            int curr = 0;
            if (s.charAt(i) != '0') curr += prev1;
            int two = Integer.parseInt(s.substring(i - 1, i + 1));
            if (two >= 10 && two <= 26) curr += prev2;
            prev2 = prev1;
            prev1 = curr;
          }
          return prev1;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(string s) {
          if (s.empty() || s[0] == '0') return 0;
          int prev2 = 1, prev1 = 1;
          for (size_t i = 1; i < s.size(); i++) {
            int curr = 0;
            if (s[i] != '0') curr += prev1;
            int two = stoi(s.substr(i - 1, 2));
            if (two >= 10 && two <= 26) curr += prev2;
            prev2 = prev1;
            prev1 = curr;
          }
          return prev1;
        }
      };`
    }
  }
];
