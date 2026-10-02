import json
import random

def solve(nums, target):
    l = -1
    for i, x in enumerate(nums):
        if x == target:
            if l == -1: l = i
    if l == -1: return [-1, -1]
    r = l
    while r + 1 < len(nums) and nums[r+1] == target:
        r += 1
    return [l, r]

ts = []
def add_case(ts, solve_fn, args):
    res = solve_fn(*args)
    ts.append({"input": ", ".join(json.dumps(a) for a in args), "output": json.dumps(res), "is_hidden": True})

add_case(ts, solve, [[5,7,7,8,8,10], 8])
add_case(ts, solve, [[5,7,7,8,8,10], 6])
add_case(ts, solve, [[], 0])

ts[0]["is_hidden"] = False
ts[1]["is_hidden"] = False
ts[2]["is_hidden"] = False

random.seed(42)
# Duplicates
add_case(ts, solve, [[1,1,1,1,1], 1])
# First/Last
add_case(ts, solve, [[1,2,2,3,4,4,5], 1])
add_case(ts, solve, [[1,2,2,3,4,4,5], 5])
# Out of range
add_case(ts, solve, [[2,3,4], 1])
add_case(ts, solve, [[2,3,4], 5])
# Single element
add_case(ts, solve, [[1], 1])
add_case(ts, solve, [[1], 0])

# Large random sorted arrays
for _ in range(5):
    n = random.randint(100, 500)
    arr = sorted([random.randint(1, 100) for _ in range(n)])
    add_case(ts, solve, [arr, arr[random.randint(0, n-1)]])
for _ in range(5):
    n = random.randint(1000, 5000)
    arr = sorted([random.randint(1, 1000) for _ in range(n)])
    add_case(ts, solve, [arr, -1]) # Not found

# Stress test (N=10000)
n = 10000
add_case(ts, solve, [[5] * n, 5])

def brute_force(nums, target):
    l = -1
    r = -1
    for i, x in enumerate(nums):
        if x == target:
            if l == -1: l = i
            r = i
    return [l, r]

# 200+ Cross checks
for _ in range(200):
    length = random.randint(0, 50)
    arr = sorted([random.randint(1, 20) for _ in range(length)])
    tc_target = random.randint(1, 20)
    assert solve(arr, tc_target) == brute_force(arr, tc_target), f"Mismatch on {arr} {tc_target}"

# Constraint checker
for tc in ts:
    args = json.loads(f'[{tc["input"]}]')
    nums, target = args[0], args[1]
    assert 0 <= len(nums) <= 10000, f"Constraint violated: len={len(nums)}"
    assert all(-10**9 <= x <= 10**9 for x in nums), "Constraint violated: nums bounds"
    assert all(nums[i] <= nums[i+1] for i in range(len(nums)-1)), "Constraint violated: not sorted"
    assert -10**9 <= target <= 10**9, "Constraint violated: target bounds"

data = {
  "title": "Target Value Bounds",
  "topic": "binary-search",
  "difficulty": "easy",
  "statement": "Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value.\n\nIf `target` is not found in the array, return `[-1, -1]`.\n\nYou must write an algorithm with `O(log n)` runtime complexity. Note: The input can contain duplicates, be entirely one value, or be empty.",
  "constraints": [
    "0 <= nums.length <= 10000",
    "-10^9 <= nums[i] <= 10^9",
    "nums is a non-decreasing array.",
    "-10^9 <= target <= 10^9"
  ],
  "examples": [
    {
      "input": "[5,7,7,8,8,10], 8",
      "output": "[3, 4]",
      "explanation": "The target 8 is found at indices 3 and 4."
    },
    {
      "input": "[5,7,7,8,8,10], 6",
      "output": "[-1, -1]",
      "explanation": "The target 6 is not found."
    },
    {
      "input": "[], 0",
      "output": "[-1, -1]",
      "explanation": "The target is not found in an empty array."
    }
  ],
  "hints": ["Try to find the first occurrence of the target using a modified binary search.", "Then, use another binary search to find the last occurrence."],
  "referenceSolutions": {
    "python": "def solution(nums, target):\n    def find(is_first):\n        ans, l, r = -1, 0, len(nums)-1\n        while l <= r:\n            mid = (l + r) // 2\n            if nums[mid] == target:\n                ans = mid\n                if is_first: r = mid - 1\n                else: l = mid + 1\n            elif nums[mid] < target: l = mid + 1\n            else: r = mid - 1\n        return ans\n    return [find(True), find(False)]",
    "javascript": "function solution(nums, target) {\n    const find = (isFirst) => {\n        let ans = -1, l = 0, r = nums.length - 1;\n        while (l <= r) {\n            let mid = (l + r) >> 1;\n            if (nums[mid] === target) {\n                ans = mid;\n                if (isFirst) r = mid - 1;\n                else l = mid + 1;\n            } else if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return ans;\n    };\n    return [find(true), find(false)];\n}",
    "java": "class Solution {\n    private int find(int[] nums, int target, boolean isFirst) {\n        int ans = -1, l = 0, r = nums.length - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) {\n                ans = mid;\n                if (isFirst) r = mid - 1;\n                else l = mid + 1;\n            } else if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return ans;\n    }\n    public int[] solution(int[] nums, int target) {\n        return new int[]{find(nums, target, true), find(nums, target, false)};\n    }\n}",
    "cpp": "#include <vector>\nusing namespace std;\nclass Solution {\n    int find(vector<int>& nums, int target, bool isFirst) {\n        int ans = -1, l = 0, r = nums.size() - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) {\n                ans = mid;\n                if (isFirst) r = mid - 1;\n                else l = mid + 1;\n            } else if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return ans;\n    }\npublic:\n    vector<int> solution(vector<int>& nums, int target) {\n        return {find(nums, target, true), find(nums, target, false)};\n    }\n};"
  },
  "testSuite": ts
}

with open("../private/solutions/target-value-bounds.json", "w") as f:
    json.dump(data, f, indent=2)
