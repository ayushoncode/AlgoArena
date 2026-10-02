import json, random

def solution(intervals):
    if not intervals: return []
    intervals.sort(key=lambda x: x[0])
    res = [intervals[0]]
    for i in range(1, len(intervals)):
        last = res[-1]
        curr = intervals[i]
        if curr[0] <= last[1]:
            last[1] = max(last[1], curr[1])
        else:
            res.append(curr)
    return res

testSuite = []
def add_case(intervals, hidden=True):
    testSuite.append({
        "input": json.dumps(intervals, separators=(',', ':')),
        "output": json.dumps(solution(intervals), separators=(',', ':')),
        "is_hidden": hidden
    })

# 3 Visible tests
add_case([[1,3],[2,6],[8,10],[15,18]], False)
add_case([[1,4],[4,5]], False)
add_case([[1,4],[0,4]], False)

# Edge cases
add_case([]) # Empty
add_case([[1,5]]) # One
add_case([[1,4],[2,3]]) # Fully contained

# Negatives
add_case([[-5,-2], [-3,0], [1,3]])

# All overlapping
add_case([[1,10],[2,9],[3,8],[4,7]])

# No overlapping
add_case([[1,2],[3,4],[5,6],[7,8]])

# Exact touches
add_case([[1,2],[2,3],[3,4]])

# Random cases
random.seed(42)
for _ in range(15):
    case = []
    for _ in range(random.randint(10, 50)):
        start = random.randint(-100, 100)
        end = start + random.randint(0, 50)
        case.append([start, end])
    add_case(case)

# Max size stress test (N=10^4)
stress = []
for _ in range(10000):
    start = random.randint(-10000, 10000)
    end = start + random.randint(0, 100)
    stress.append([start, end])
add_case(stress)

def brute_force(intervals):
    if not intervals: return []
    n = len(intervals)
    adj = {i: [] for i in range(n)}
    for i in range(n):
        for j in range(i + 1, n):
            if max(intervals[i][0], intervals[j][0]) <= min(intervals[i][1], intervals[j][1]):
                adj[i].append(j)
                adj[j].append(i)
    visited = set()
    res = []
    for i in range(n):
        if i not in visited:
            comp_start, comp_end = intervals[i]
            q = [i]
            visited.add(i)
            while q:
                curr = q.pop(0)
                comp_start = min(comp_start, intervals[curr][0])
                comp_end = max(comp_end, intervals[curr][1])
                for nxt in adj[curr]:
                    if nxt not in visited:
                        visited.add(nxt)
                        q.append(nxt)
            res.append([comp_start, comp_end])
    res.sort(key=lambda x: x[0])
    return res

# 200+ Cross checks
for _ in range(200):
    case = []
    for _ in range(random.randint(0, 50)):
        start = random.randint(-50, 50)
        end = start + random.randint(0, 20)
        case.append([start, end])
    assert solution(case) == brute_force(case), f"Mismatch on {case}"

# Constraint checker
for tc in testSuite:
    args = json.loads(tc["input"])
    assert 0 <= len(args) <= 10000, f"Constraint violated: len={len(args)}"
    for interval in args:
        assert len(interval) == 2, "Constraint violated: len!=2"
        assert -10**5 <= interval[0] <= interval[1] <= 10**5, f"Constraint violated: bounds {interval}"

data = {
  "title": "Consolidate Time Blocks",
  "topic": "arrays",
  "difficulty": "medium",
  "statement": "Given an array of `time_blocks` where each block is represented as `[start, end]`, merge all overlapping blocks and return an array of the non-overlapping blocks that cover all the original time intervals exactly.\n\nOverlapping blocks include those that only touch (e.g., `[1, 4]` and `[4, 5]` overlap and should be merged into `[1, 5]`). The input array may not be sorted.\n\nReturn the final consolidated array of time blocks, sorted by their start times.",
  "constraints": [
    "0 <= time_blocks.length <= 10^4",
    "time_blocks[i].length == 2",
    "-10^5 <= start <= end <= 10^5",
    "The input array may be unsorted and can contain duplicate blocks."
  ],
  "examples": [
    {
      "input": "[[1,3],[2,6],[8,10],[15,18]]",
      "output": "[[1,6],[8,10],[15,18]]",
      "explanation": "Since blocks [1,3] and [2,6] overlap, merge them into [1,6]."
    }
  ],
  "hints": [
    "Sort the blocks by their start time.",
    "Iterate through the sorted blocks and merge if the current block's start time is <= the previous block's end time."
  ],
  "referenceSolutions": {
    "python": "def solution(intervals):\n    if not intervals: return []\n    intervals.sort(key=lambda x: x[0])\n    res = [intervals[0]]\n    for i in range(1, len(intervals)):\n        if intervals[i][0] <= res[-1][1]:\n            res[-1][1] = max(res[-1][1], intervals[i][1])\n        else:\n            res.append(intervals[i])\n    return res",
    "javascript": "function solution(intervals) {\n    if (!intervals.length) return [];\n    intervals.sort((a, b) => a[0] - b[0]);\n    const res = [intervals[0]];\n    for (let i = 1; i < intervals.length; i++) {\n        const last = res[res.length - 1];\n        if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n        else res.push(intervals[i]);\n    }\n    return res;\n}",
    "java": "class Solution {\n    public int[][] solution(int[][] intervals) {\n        if (intervals.length == 0) return new int[0][0];\n        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));\n        java.util.List<int[]> res = new java.util.ArrayList<>();\n        res.add(intervals[0]);\n        for (int i = 1; i < intervals.length; i++) {\n            int[] last = res.get(res.size() - 1);\n            if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n            else res.add(intervals[i]);\n        }\n        return res.toArray(new int[res.size()][]);\n    }\n}",
    "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> solution(vector<vector<int>>& intervals) {\n        if (intervals.empty()) return {};\n        sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });\n        vector<vector<int>> res = {intervals[0]};\n        for (size_t i = 1; i < intervals.size(); i++) {\n            if (intervals[i][0] <= res.back()[1]) res.back()[1] = max(res.back()[1], intervals[i][1]);\n            else res.push_back(intervals[i]);\n        }\n        return res;\n    }\n};"
  },
  "bruteForceSolution": {
    "language": "python",
    "code": "def solution(intervals):\n    if not intervals: return []\n    # O(N^2) naive graph components approach\n    n = len(intervals)\n    adj = {i: [] for i in range(n)}\n    for i in range(n):\n        for j in range(i + 1, n):\n            if max(intervals[i][0], intervals[j][0]) <= min(intervals[i][1], intervals[j][1]):\n                adj[i].append(j)\n                adj[j].append(i)\n    visited = set()\n    res = []\n    for i in range(n):\n        if i not in visited:\n            comp_start, comp_end = intervals[i]\n            q = [i]\n            visited.add(i)\n            while q:\n                curr = q.pop(0)\n                comp_start = min(comp_start, intervals[curr][0])\n                comp_end = max(comp_end, intervals[curr][1])\n                for nxt in adj[curr]:\n                    if nxt not in visited:\n                        visited.add(nxt)\n                        q.append(nxt)\n            res.append([comp_start, comp_end])\n    res.sort(key=lambda x: x[0])\n    return res"
  },
  "testSuite": testSuite
}

with open('../private/solutions/consolidate-time-blocks.json', 'w') as f:
    json.dump(data, f, indent=2)
