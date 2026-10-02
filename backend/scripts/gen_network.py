import json, random

def add_case(ts, solve, args, hidden=True):
    args_json = ", ".join(json.dumps(a, separators=(',', ':')) for a in args)
    ts.append({
        "input": args_json,
        "output": json.dumps(solve(*args), separators=(',', ':')),
        "is_hidden": hidden
    })

def gen_network():
    ts = []
    def solve(times, n, k):
        import heapq
        adj = {i: [] for i in range(1, n+1)}
        for u, v, w in times:
            adj[u].append((v, w))
        dist = {i: float('inf') for i in range(1, n+1)}
        dist[k] = 0
        pq = [(0, k)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]: continue
            for v, w in adj[u]:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    heapq.heappush(pq, (dist[v], v))
        ans = max(dist.values())
        return ans if ans < float('inf') else -1
        
    add_case(ts, solve, [[[2,1,1],[2,3,1],[3,4,1]], 4, 2], False)
    add_case(ts, solve, [[[1,2,1]], 2, 1], False)
    add_case(ts, solve, [[[1,2,1]], 2, 2], False)
    
    # 20 Hidden
    for _ in range(25):
        n = random.randint(2, 50)
        times = []
        for u in range(1, n+1):
            for v in range(1, n+1):
                if u != v and random.random() < 0.2:
                    times.append([u, v, random.randint(1, 100)])
        add_case(ts, solve, [times, n, random.randint(1, n)])
        
    # Stress test (n=100)
    n = 100
    times = []
    for u in range(1, n+1):
        for v in range(1, n+1):
            if u != v:
                times.append([u, v, random.randint(1, 10)])
    add_case(ts, solve, [times, n, 1])
    
    data = {
      "title": "Network Delay Tracker",
      "topic": "graphs",
      "difficulty": "medium",
      "statement": "You are given a network of `n` nodes, labeled from `1` to `n`. You are also given `times`, a list of travel times as directed edges `times[i] = (u, v, w)`, where `u` is the source node, `v` is the target node, and `w` is the time it takes for a signal to travel from source to target.\n\nWe will send a signal from a given node `k`. Return the minimum time it takes for all the `n` nodes to receive the signal. If it is impossible for all the `n` nodes to receive the signal, return `-1`.",
      "constraints": [
        "1 <= k <= n <= 100",
        "1 <= times.length <= 6000",
        "times[i].length == 3",
        "1 <= u, v <= n",
        "0 <= w <= 100"
      ],
      "examples": [{"input": "[[2,1,1],[2,3,1],[3,4,1]], 4, 2", "output": "2"}],
      "hints": ["We can use Dijkstra's algorithm to find the shortest path from our source to all other nodes."],
      "referenceSolutions": {
        "python": "import heapq\ndef solution(times, n, k):\n    adj = {i: [] for i in range(1, n+1)}\n    for u, v, w in times:\n        adj[u].append((v, w))\n    dist = {i: float('inf') for i in range(1, n+1)}\n    dist[k] = 0\n    pq = [(0, k)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in adj[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                heapq.heappush(pq, (dist[v], v))\n    ans = max(dist.values())\n    return ans if ans < float('inf') else -1",
        "javascript": "function solution(times, n, k) {\n    const dist = new Array(n+1).fill(Infinity);\n    dist[k] = 0;\n    for(let i=1; i<=n; i++) {\n        for(const [u,v,w] of times) {\n            if (dist[u] !== Infinity && dist[u] + w < dist[v]) dist[v] = dist[u] + w;\n        }\n    }\n    let ans = 0;\n    for(let i=1; i<=n; i++) {\n        if (dist[i] === Infinity) return -1;\n        ans = Math.max(ans, dist[i]);\n    }\n    return ans;\n}",
        "java": "class Solution {\n    public int solution(int[][] times, int n, int k) {\n        int[] dist = new int[n+1];\n        java.util.Arrays.fill(dist, Integer.MAX_VALUE);\n        dist[k] = 0;\n        for (int i=1; i<=n; i++) {\n            for (int[] t : times) {\n                if (dist[t[0]] != Integer.MAX_VALUE && dist[t[0]] + t[2] < dist[t[1]]) {\n                    dist[t[1]] = dist[t[0]] + t[2];\n                }\n            }\n        }\n        int ans = 0;\n        for (int i=1; i<=n; i++) {\n            if (dist[i] == Integer.MAX_VALUE) return -1;\n            ans = Math.max(ans, dist[i]);\n        }\n        return ans;\n    }\n}",
        "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    int solution(vector<vector<int>>& times, int n, int k) {\n        vector<int> dist(n+1, 1e9);\n        dist[k] = 0;\n        for(int i=1; i<=n; i++) {\n            for(auto& t : times) {\n                if(dist[t[0]] != 1e9 && dist[t[0]] + t[2] < dist[t[1]])\n                    dist[t[1]] = dist[t[0]] + t[2];\n            }\n        }\n        int ans = 0;\n        for(int i=1; i<=n; i++) {\n            if(dist[i] == 1e9) return -1;\n            ans = max(ans, dist[i]);\n        }\n        return ans;\n    }\n};"
      },
      "bruteForceSolution": {
          "language": "python",
          "code": "def solution(times, n, k):\n    ans = float('inf')\n    import itertools\n    # Bellman Ford naive N^3\n    dist = {i: float('inf') for i in range(1, n+1)}\n    dist[k] = 0\n    for _ in range(n):\n        for u, v, w in times:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n    ans = max(dist.values())\n    return ans if ans != float('inf') else -1"
      },
      "testSuite": ts
    }
    with open('../private/solutions/network-delay-tracker.json', 'w') as f:
        json.dump(data, f, indent=2)

gen_network()
