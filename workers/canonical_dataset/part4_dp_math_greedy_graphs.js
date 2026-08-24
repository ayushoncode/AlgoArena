'use strict';

/**
 * Canonical specifications for DP, Math, Greedy, Graphs, and Bit Manipulation.
 */
module.exports = [
  {
    title: 'Climbing Stairs',
    topic: 'dp',
    difficulty: 'easy',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?

### **Example 1:**
**Input:** n = 2
**Output:** 2
**Explanation:** There are two ways to climb to the top.
1. 1 step + 1 step
2. 2 steps

### **Example 2:**
**Input:** n = 3
**Output:** 3
**Explanation:** There are three ways to climb to the top.
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step

### **Constraints:**
- \`1 <= n <= 45\``,
    sample_input: '2',
    sample_output: '2',
    test_cases: [
      { input: '2', output: '2', is_hidden: false },
      { input: '3', output: '3', is_hidden: false },
      { input: '1', output: '1', is_hidden: false },
      { input: '4', output: '5', is_hidden: true },
      { input: '5', output: '8', is_hidden: true }
    ],
    solutions: {
      js: `function solution(n) {
        if (n <= 2) return n;
        let a = 1, b = 2;
        for (let i = 3; i <= n; i++) {
          const c = a + b;
          a = b;
          b = c;
        }
        return b;
      }`,
      py: `class Solution:
    def solution(self, n: int) -> int:
        if n <= 2: return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
      java: `class Solution {
        public int solution(int n) {
          if (n <= 2) return n;
          int a = 1, b = 2;
          for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
          }
          return b;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(int n) {
          if (n <= 2) return n;
          int a = 1, b = 2;
          for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
          }
          return b;
        }
      };`
    }
  },

  {
    title: 'Coin Change',
    topic: 'dp',
    difficulty: 'medium',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.

### **Example 1:**
**Input:** coins = [1,2,5], amount = 11
**Output:** 3
**Explanation:** 11 = 5 + 5 + 1

### **Example 2:**
**Input:** coins = [2], amount = 3
**Output:** -1

### **Example 3:**
**Input:** coins = [1], amount = 0
**Output:** 0

### **Constraints:**
- \`1 <= coins.length <= 12\`
- \`1 <= coins[i] <= 2³¹ - 1\`
- \`0 <= amount <= 10⁴\``,
    sample_input: '[1,2,5], 11',
    sample_output: '3',
    test_cases: [
      { input: '[1,2,5], 11', output: '3', is_hidden: false },
      { input: '[2], 3', output: '-1', is_hidden: false },
      { input: '[1], 0', output: '0', is_hidden: false },
      { input: '[2,5,10,1], 27', output: '4', is_hidden: true }
    ],
    solutions: {
      js: `function solution(coins, amount) {
        const dp = new Array(amount + 1).fill(Infinity);
        dp[0] = 0;
        for (const coin of coins) {
          for (let i = coin; i <= amount; i++) {
            dp[i] = Math.min(dp[i], dp[i - coin] + 1);
          }
        }
        return dp[amount] === Infinity ? -1 : dp[amount];
      }`,
      py: `class Solution:
    def solution(self, coins: List[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for coin in coins:
            for i in range(coin, amount + 1):
                dp[i] = min(dp[i], dp[i - coin] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1`,
      java: `class Solution {
        public int solution(int[] coins, int amount) {
          int[] dp = new int[amount + 1];
          Arrays.fill(dp, amount + 1);
          dp[0] = 0;
          for (int coin : coins) {
            for (int i = coin; i <= amount; i++) {
              dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
          }
          return dp[amount] > amount ? -1 : dp[amount];
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& coins, int amount) {
          vector<int> dp(amount + 1, amount + 1);
          dp[0] = 0;
          for (int coin : coins) {
            for (int i = coin; i <= amount; i++) {
              dp[i] = min(dp[i], dp[i - coin] + 1);
            }
          }
          return dp[amount] > amount ? -1 : dp[amount];
        }
      };`
    }
  },

  {
    title: 'Unique Paths',
    topic: 'dp',
    difficulty: 'medium',
    description: `There is a robot on an \`m x n\` grid. The robot is initially located at the **top-left corner** (i.e., \`grid[0][0]\`). The robot tries to move to the **bottom-right corner** (i.e., \`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time.

Given the two integers \`m\` and \`n\`, return *the number of possible unique paths that the robot can take to reach the bottom-right corner*.

The test cases are generated so that the answer will be less than or equal to \`2 * 10⁹\`.

### **Example 1:**
**Input:** m = 3, n = 7
**Output:** 28

### **Example 2:**
**Input:** m = 3, n = 2
**Output:** 3
**Explanation:** From the top-left corner, there are a total of 3 ways to reach the bottom-right corner:
1. Right -> Down -> Down
2. Down -> Down -> Right
3. Down -> Right -> Down

### **Constraints:**
- \`1 <= m, n <= 100\``,
    sample_input: '3, 7',
    sample_output: '28',
    test_cases: [
      { input: '3, 7', output: '28', is_hidden: false },
      { input: '3, 2', output: '3', is_hidden: false },
      { input: '1, 1', output: '1', is_hidden: false },
      { input: '2, 3', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(m, n) {
        const dp = new Array(n).fill(1);
        for (let i = 1; i < m; i++) {
          for (let j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
          }
        }
        return dp[n - 1];
      }`,
      py: `class Solution:
    def solution(self, m: int, n: int) -> int:
        dp = [1] * n
        for _ in range(1, m):
            for j in range(1, n):
                dp[j] += dp[j - 1]
        return dp[-1]`,
      java: `class Solution {
        public int solution(int m, int n) {
          int[] dp = new int[n];
          Arrays.fill(dp, 1);
          for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
              dp[j] += dp[j - 1];
            }
          }
          return dp[n - 1];
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(int m, int n) {
          vector<int> dp(n, 1);
          for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
              dp[j] += dp[j - 1];
            }
          }
          return dp[n - 1];
        }
      };`
    }
  },

  {
    title: 'Minimum Path Sum',
    topic: 'dp',
    difficulty: 'medium',
    description: `Given a \`m x n\` \`grid\` filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.

**Note:** You can only move either down or right at any point in time.

### **Example 1:**
\`\`\`
1 3 1
1 5 1
4 2 1
\`\`\`
**Input:** grid = [[1,3,1],[1,5,1],[4,2,1]]
**Output:** 7
**Explanation:** Because the path 1 -> 3 -> 1 -> 1 -> 1 minimizes the sum (1 + 3 + 1 + 1 + 1 = 7).

### **Example 2:**
**Input:** grid = [[1,2,3],[4,5,6]]
**Output:** 12

### **Constraints:**
- \`m == grid.length\`
- \`n == grid[i].length\`
- \`1 <= m, n <= 200\`
- \`0 <= grid[i][j] <= 200\``,
    sample_input: '[[1,3,1],[1,5,1],[4,2,1]]',
    sample_output: '7',
    test_cases: [
      { input: '[[1,3,1],[1,5,1],[4,2,1]]', output: '7', is_hidden: false },
      { input: '[[1,2,3],[4,5,6]]', output: '12', is_hidden: false },
      { input: '[[5]]', output: '5', is_hidden: false },
      { input: '[[1,2],[1,1]]', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(grid) {
        const m = grid.length, n = grid[0].length;
        const dp = new Array(n).fill(0);
        dp[0] = grid[0][0];
        for (let j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
        for (let i = 1; i < m; i++) {
          dp[0] += grid[i][0];
          for (let j = 1; j < n; j++) {
            dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
          }
        }
        return dp[n - 1];
      }`,
      py: `class Solution:
    def solution(self, grid: List[List[int]]) -> int:
        m, n = len(grid), len(grid[0])
        dp = [0] * n
        dp[0] = grid[0][0]
        for j in range(1, n): dp[j] = dp[j - 1] + grid[0][j]
        for i in range(1, m):
            dp[0] += grid[i][0]
            for j in range(1, n):
                dp[j] = min(dp[j], dp[j - 1]) + grid[i][j]
        return dp[-1]`,
      java: `class Solution {
        public int solution(int[][] grid) {
          int m = grid.length, n = grid[0].length;
          int[] dp = new int[n];
          dp[0] = grid[0][0];
          for (int j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
          for (int i = 1; i < m; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < n; j++) {
              dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
            }
          }
          return dp[n - 1];
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<vector<int>>& grid) {
          int m = grid.size(), n = grid[0].size();
          vector<int> dp(n, 0);
          dp[0] = grid[0][0];
          for (int j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
          for (int i = 1; i < m; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < n; j++) {
              dp[j] = min(dp[j], dp[j - 1]) + grid[i][j];
            }
          }
          return dp[n - 1];
        }
      };`
    }
  },

  {
    title: 'Edit Distance',
    topic: 'dp',
    difficulty: 'medium',
    description: `Given two strings \`word1\` and \`word2\`, return *the minimum number of operations required to convert \`word1\` to \`word2\`*.

You have the following three operations permitted on a word:
- Insert a character
- Delete a character
- Replace a character

### **Example 1:**
**Input:** word1 = "horse", word2 = "ros"
**Output:** 3
**Explanation:**
horse -> rorse (replace 'h' with 'r')
rorse -> rose (remove 'r')
rose -> ros (remove 'e')

### **Example 2:**
**Input:** word1 = "intention", word2 = "execution"
**Output:** 5
**Explanation:**
intention -> inention (remove 't')
inention -> enention (replace 'i' with 'e')
enention -> exention (replace 'n' with 'x')
exention -> exection (replace 'n' with 'c')
exection -> execution (insert 'u')

### **Constraints:**
- \`0 <= word1.length, word2.length <= 500\`
- \`word1\` and \`word2\` consist of lowercase English letters.`,
    sample_input: '"horse", "ros"',
    sample_output: '3',
    test_cases: [
      { input: '"horse", "ros"', output: '3', is_hidden: false },
      { input: '"intention", "execution"', output: '5', is_hidden: false },
      { input: '\"\", \"\"', output: '0', is_hidden: false },
      { input: '"a", "b"', output: '1', is_hidden: true }
    ],
    solutions: {
      js: `function solution(word1, word2) {
        const m = word1.length, n = word2.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
        return dp[m][n];
      }`,
      py: `class Solution:
    def solution(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1): dp[i][0] = i
        for j in range(n + 1): dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
                else:
                    dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        return dp[m][n]`,
      java: `class Solution {
        public int solution(String word1, String word2) {
          int m = word1.length(), n = word2.length();
          int[][] dp = new int[m + 1][n + 1];
          for (int i = 0; i <= m; i++) dp[i][0] = i;
          for (int j = 0; j <= n; j++) dp[0][j] = j;
          for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
              if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1];
              else dp[i][j] = 1 + Math.min(dp[i - 1][j], Math.min(dp[i][j - 1], dp[i - 1][j - 1]));
            }
          }
          return dp[m][n];
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(string word1, string word2) {
          int m = word1.size(), n = word2.size();
          vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
          for (int i = 0; i <= m; i++) dp[i][0] = i;
          for (int j = 0; j <= n; j++) dp[0][j] = j;
          for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
              if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
              else dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
            }
          }
          return dp[m][n];
        }
      };`
    }
  },

  {
    title: 'Number of Islands',
    topic: 'graphs',
    difficulty: 'medium',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

### **Example 1:**
**Input:** grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
**Output:** 1

### **Example 2:**
**Input:** grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
**Output:** 3

### **Constraints:**
- \`m == grid.length\`
- \`n == grid[i].length\`
- \`1 <= m, n <= 300\`
- \`grid[i][j]\` is \`'0'\` or \`'1'\`.`,
    sample_input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
    sample_output: '1',
    test_cases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1', is_hidden: false },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3', is_hidden: false },
      { input: '[["1"]]', output: '1', is_hidden: false },
      { input: '[["0"]]', output: '0', is_hidden: true }
    ],
    solutions: {
      js: `function solution(grid) {
        if (!grid.length) return 0;
        let count = 0;
        const m = grid.length, n = grid[0].length;
        function dfs(r, c) {
          if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== '1') return;
          grid[r][c] = '0';
          dfs(r + 1, c);
          dfs(r - 1, c);
          dfs(r, c + 1);
          dfs(r, c - 1);
        }
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (grid[i][j] === '1') {
              count++;
              dfs(i, j);
            }
          }
        }
        return count;
      }`,
      py: `class Solution:
    def solution(self, grid: List[List[str]]) -> int:
        if not grid: return 0
        m, n = len(grid), len(grid[0])
        count = 0
        def dfs(r, c):
            if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1': return
            grid[r][c] = '0'
            dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1)
        for i in range(m):
            for j in range(n):
                if grid[i][j] == '1':
                    count += 1
                    dfs(i, j)
        return count`,
      java: `class Solution {
        public int solution(char[][] grid) {
          if (grid == null || grid.length == 0) return 0;
          int m = grid.length, n = grid[0].length, count = 0;
          for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
              if (grid[i][j] == '1') {
                count++;
                dfs(grid, i, j, m, n);
              }
            }
          }
          return count;
        }
        private void dfs(char[][] grid, int r, int c, int m, int n) {
          if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1') return;
          grid[r][c] = '0';
          dfs(grid, r + 1, c, m, n);
          dfs(grid, r - 1, c, m, n);
          dfs(grid, r, c + 1, m, n);
          dfs(grid, r, c - 1, m, n);
        }
      }`,
      cpp: `class Solution {
      public:
        void dfs(vector<vector<char>>& grid, int r, int c, int m, int n) {
          if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1') return;
          grid[r][c] = '0';
          dfs(grid, r + 1, c, m, n);
          dfs(grid, r - 1, c, m, n);
          dfs(grid, r, c + 1, m, n);
          dfs(grid, r, c - 1, m, n);
        }
        int solution(vector<vector<char>>& grid) {
          if (grid.empty()) return 0;
          int m = grid.size(), n = grid[0].size(), count = 0;
          for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
              if (grid[i][j] == '1') {
                count++;
                dfs(grid, i, j, m, n);
              }
            }
          }
          return count;
        }
      };`
    }
  }
];
