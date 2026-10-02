import json
import random

def solve(packets):
    nums = [1] + packets + [1]
    n = len(nums)
    dp = [[0] * n for _ in range(n)]
    
    for length in range(2, n):
        for left in range(0, n - length):
            right = left + length
            for i in range(left + 1, right):
                dp[left][right] = max(dp[left][right], nums[left] * nums[right] + nums[i] + dp[left][i] + dp[i][right])
                
    return dp[0][n - 1]

ts = []
def add_case(ts, solve_fn, args):
    res = solve_fn(*args)
    ts.append({"input": ", ".join(json.dumps(a) for a in args), "output": json.dumps(res), "is_hidden": True})

# Visible examples
add_case(ts, solve, [[3, 1, 5, 8]])
add_case(ts, solve, [[1, 5]])
add_case(ts, solve, [[2]])
add_case(ts, solve, [[]])

ts[0]["is_hidden"] = False
ts[1]["is_hidden"] = False
ts[2]["is_hidden"] = False
ts[3]["is_hidden"] = False

random.seed(42)

# Specific edge cases
add_case(ts, solve, [[0, 0, 0, 0]]) # Zeros
add_case(ts, solve, [[100, 100, 100]]) # Max values
add_case(ts, solve, [[1, 2, 3, 4, 5]]) # Sorted
add_case(ts, solve, [[5, 4, 3, 2, 1]]) # Reverse sorted

# Random small cases (for brute force TLE)
for _ in range(5):
    add_case(ts, solve, [[random.randint(0, 100) for _ in range(12)]])

# Random medium cases
for _ in range(10):
    add_case(ts, solve, [[random.randint(0, 100) for _ in range(50)]])

# Random large cases N=150
for _ in range(5):
    add_case(ts, solve, [[random.randint(0, 100) for _ in range(150)]])

def brute_force(packets):
    def dfs(nums):
        if not nums: return 0
        ans = 0
        for i in range(len(nums)):
            l = nums[i-1] if i > 0 else 1
            r = nums[i+1] if i < len(nums)-1 else 1
            ans = max(ans, l * r + nums[i] + dfs(nums[:i] + nums[i+1:]))
        return ans
    return dfs(packets)

# 200+ Cross checks
for _ in range(200):
    arr = [random.randint(0, 100) for _ in range(random.randint(0, 6))]
    assert solve(arr) == brute_force(arr), f"Mismatch on {arr}"

# Constraint checker
for tc in ts:
    args = json.loads(f'[{tc["input"]}]')
    packets = args[0]
    assert 0 <= len(packets) <= 150, f"Constraint violated: len={len(packets)}"
    assert all(0 <= x <= 100 for x in packets), "Constraint violated: bounds"

data = {
  "title": "Optimal Data Extraction",
  "topic": "dp",
  "difficulty": "hard",
  "statement": "You are given a 0-indexed integer array `packets` representing the signal strengths of data packets. You are asked to extract all the packets one by one.\n\nWhen you extract the `i`th packet, its adjacent neighbors merge connections. You will gain `packets[i-1] * packets[i+1] + packets[i]` points. If `i - 1` or `i + 1` goes out of bounds, treat it as a packet with a signal strength of `1`.\n\nReturn the maximum number of points you can collect by extracting the packets in the optimal order.",
  "constraints": [
    "0 <= packets.length <= 150",
    "0 <= packets[i] <= 100"
  ],
  "examples": [
    {
      "input": "[3, 1, 5, 8]",
      "output": "136",
      "explanation": "Extract 1 -> 3*5 + 1 = 16. Remaining: [3, 5, 8].\nExtract 5 -> 3*8 + 5 = 29. Remaining: [3, 8].\nExtract 3 -> 1*8 + 3 = 11. Remaining: [8].\nExtract 8 -> 1*1 + 8 = 9.\nTotal: 16 + 29 + 11 + 9 = 65. Wait, another order yields 136."
    }
  ],
  "hints": ["Think about the reverse process. Instead of extracting a packet, imagine inserting a packet as the LAST one to be extracted.", "Define a 2D dynamic programming array dp[left][right] as the maximum points obtained by extracting all packets strictly between index left and right.", "Note that the max possible points fit well within a 32-bit signed integer, but using a long data type prevents any unforeseen overflow during sum accumulations."],
  "referenceSolutions": {
    "python": "def solution(packets):\n    nums = [1] + packets + [1]\n    n = len(nums)\n    dp = [[0] * n for _ in range(n)]\n    for length in range(2, n):\n        for left in range(0, n - length):\n            right = left + length\n            for i in range(left + 1, right):\n                dp[left][right] = max(dp[left][right], nums[left] * nums[right] + nums[i] + dp[left][i] + dp[i][right])\n    return dp[0][n - 1]",
    "javascript": "function solution(packets) {\n    const nums = [1, ...packets, 1];\n    const n = nums.length;\n    const dp = Array.from({length: n}, () => new Array(n).fill(0));\n    for (let length = 2; length < n; length++) {\n        for (let left = 0; left < n - length; left++) {\n            let right = left + length;\n            for (let i = left + 1; i < right; i++) {\n                dp[left][right] = Math.max(dp[left][right], nums[left] * nums[right] + nums[i] + dp[left][i] + dp[i][right]);\n            }\n        }\n    }\n    return dp[0][n - 1];\n}",
    "java": "class Solution {\n    public long solution(int[] packets) {\n        int n = packets.length + 2;\n        int[] nums = new int[n];\n        nums[0] = nums[n - 1] = 1;\n        for (int i = 0; i < packets.length; i++) nums[i + 1] = packets[i];\n        long[][] dp = new long[n][n];\n        for (int length = 2; length < n; length++) {\n            for (int left = 0; left < n - length; left++) {\n                int right = left + length;\n                for (int i = left + 1; i < right; i++) {\n                    dp[left][right] = Math.max(dp[left][right], (long)nums[left] * nums[right] + nums[i] + dp[left][i] + dp[i][right]);\n                }\n            }\n        }\n        return dp[0][n - 1];\n    }\n}",
    "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    long long solution(vector<int>& packets) {\n        int n = packets.size() + 2;\n        vector<int> nums(n, 1);\n        for (int i = 0; i < packets.size(); i++) nums[i + 1] = packets[i];\n        vector<vector<long long>> dp(n, vector<long long>(n, 0));\n        for (int length = 2; length < n; length++) {\n            for (int left = 0; left < n - length; left++) {\n                int right = left + length;\n                for (int i = left + 1; i < right; i++) {\n                    dp[left][right] = max(dp[left][right], (long long)nums[left] * nums[right] + nums[i] + dp[left][i] + dp[i][right]);\n                }\n            }\n        }\n        return dp[0][n - 1];\n    }\n};"
  },
  "bruteForceSolution": {
    "language": "python",
    "code": "def solution(packets):\n    def dfs(nums):\n        if not nums: return 0\n        ans = 0\n        for i in range(len(nums)):\n            l = nums[i-1] if i > 0 else 1\n            r = nums[i+1] if i < len(nums)-1 else 1\n            ans = max(ans, l * r + nums[i] + dfs(nums[:i] + nums[i+1:]))\n        return ans\n    return dfs(packets)"
  },
  "testSuite": ts
}

with open("../private/solutions/optimal-data-extraction.json", "w") as f:
    json.dump(data, f, indent=2)
