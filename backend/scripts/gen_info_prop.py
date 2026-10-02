import json
import random
import heapq

def solve(edges, n, startNode):
    adj = {i: [] for i in range(1, n + 1)}
    for u, v, w in edges:
        adj[u].append((v, w))
    
    dist = {i: float('inf') for i in range(1, n + 1)}
    dist[startNode] = 0
    pq = [(0, startNode)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    
    ans = max(dist.values())
    return ans if ans != float('inf') else -1

ts = []
def add_case(ts, solve_fn, args):
    res = solve_fn(*args)
    ts.append({"input": ", ".join(json.dumps(a) for a in args), "output": json.dumps(res), "is_hidden": True})

# Visible examples
add_case(ts, solve, [[[1,2,1]], 2, 1])
add_case(ts, solve, [[[1,2,1]], 2, 2])
add_case(ts, solve, [[[2,1,1],[2,3,1],[3,4,1]], 4, 2])

ts[0]["is_hidden"] = False
ts[1]["is_hidden"] = False
ts[2]["is_hidden"] = False

random.seed(42)

# Unreachable
add_case(ts, solve, [[[1,2,1],[3,4,1]], 4, 1])
# Duplicate edges (pick min)
add_case(ts, solve, [[[1,2,5], [1,2,1], [1,2,10]], 2, 1])
# Self loops
add_case(ts, solve, [[[1,1,10], [1,2,1]], 2, 1])
# Disconnected graph
add_case(ts, solve, [[], 3, 1])

# Random cases N=10 to N=100
for _ in range(20):
    n = random.randint(10, 100)
    edges = []
    # Create a random tree from startNode to ensure it's reachable sometimes
    startNode = random.randint(1, n)
    is_connected = random.choice([True, False])
    
    if is_connected:
        nodes = list(range(1, n+1))
        random.shuffle(nodes)
        nodes.remove(startNode)
        connected = [startNode]
        for u in nodes:
            v = random.choice(connected)
            edges.append([v, u, random.randint(1, 100)])
            connected.append(u)
    
    # Add random extra edges
    for _ in range(random.randint(0, 200)):
        u = random.randint(1, n)
        v = random.randint(1, n)
        w = random.randint(1, 100)
        edges.append([u, v, w])
        
    add_case(ts, solve, [edges, n, startNode])

def brute_force(edges, n, startNode):
    dist = {i: float('inf') for i in range(1, n + 1)}
    dist[startNode] = 0
    for _ in range(n):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    ans = max(dist.values())
    return ans if ans != float('inf') else -1

# 200+ Cross checks
for _ in range(200):
    n = random.randint(1, 10)
    edges = []
    for _ in range(random.randint(0, 20)):
        edges.append([random.randint(1, n), random.randint(1, n), random.randint(0, 10)])
    startNode = random.randint(1, n)
    assert solve(edges, n, startNode) == brute_force(edges, n, startNode), f"Mismatch on {edges}"

# Constraint checker
for tc in ts:
    args = json.loads(f'[{tc["input"]}]')
    edges, n_val, startNode = args[0], args[1], args[2]
    assert 1 <= n_val <= 100, f"Constraint violated: n={n_val}"
    assert 0 <= len(edges) <= 6000, f"Constraint violated: edges.length={len(edges)}"
    for u, v, w in edges:
        assert 1 <= u <= n_val and 1 <= v <= n_val, f"Constraint violated: u,v bounds {u},{v}"
        assert 0 <= w <= 100, f"Constraint violated: w={w}"
    assert 1 <= startNode <= n_val, f"Constraint violated: startNode={startNode}"

data = {
  "title": "Information Propagation Time",
  "topic": "graphs",
  "difficulty": "medium",
  "statement": "There is a network of `n` communication towers labeled from `1` to `n`. You are given an array `edges` where `edges[i] = [u, v, w]` represents a directed transmission link from tower `u` to tower `v` that takes `w` milliseconds.\n\nA signal is broadcast from a `startNode` tower. Return the time it takes for all `n` towers to receive the signal. If it is impossible for all towers to receive the signal, return `-1`.\n\nNote: The input may contain duplicate edges between the same pair of towers, self-loops, and unreachable nodes.",
  "constraints": [
    "1 <= n <= 100",
    "0 <= edges.length <= 6000",
    "edges[i].length == 3",
    "1 <= u, v <= n",
    "0 <= w <= 100",
    "1 <= startNode <= n"
  ],
  "examples": [
    {
      "input": "[[1,2,1]], 2, 1",
      "output": "1",
      "explanation": "Signal reaches node 2 in 1 ms."
    },
    {
      "input": "[[1,2,1]], 2, 2",
      "output": "-1",
      "explanation": "Signal cannot reach node 1 from node 2."
    },
    {
      "input": "[[2,1,1],[2,3,1],[3,4,1]], 4, 2",
      "output": "2",
      "explanation": "Signal reaches 1 and 3 in 1ms, and reaches 4 from 3 in 2ms total."
    }
  ],
  "hints": ["Consider treating this as a shortest path problem.", "Dijkstra's algorithm can find the shortest path from the start node to all other nodes.", "The time required will be the maximum of the shortest paths to all nodes."],
  "referenceSolutions": {
    "python": "import heapq\ndef solution(edges, n, startNode):\n    adj = {i: [] for i in range(1, n + 1)}\n    for u, v, w in edges:\n        adj[u].append((v, w))\n    dist = {i: float('inf') for i in range(1, n + 1)}\n    dist[startNode] = 0\n    pq = [(0, startNode)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist[u]: continue\n        for v, w in adj[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                heapq.heappush(pq, (dist[v], v))\n    ans = max(dist.values())\n    return ans if ans != float('inf') else -1",
    "javascript": "function solution(edges, n, startNode) {\n    const adj = Array.from({length: n + 1}, () => []);\n    for (const [u, v, w] of edges) {\n        adj[u].push([v, w]);\n    }\n    const dist = new Array(n + 1).fill(Infinity);\n    dist[startNode] = 0;\n    // Simple O(N^2) Dijkstra for N <= 100\n    const visited = new Array(n + 1).fill(false);\n    for (let i = 0; i < n; i++) {\n        let u = -1;\n        for (let j = 1; j <= n; j++) {\n            if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;\n        }\n        if (dist[u] === Infinity) break;\n        visited[u] = true;\n        for (const [v, w] of adj[u]) {\n            if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;\n        }\n    }\n    let ans = 0;\n    for (let i = 1; i <= n; i++) ans = Math.max(ans, dist[i]);\n    return ans === Infinity ? -1 : ans;\n}",
    "java": "import java.util.*;\nclass Solution {\n    public int solution(int[][] edges, int n, int startNode) {\n        List<int[]>[] adj = new ArrayList[n + 1];\n        for(int i=1; i<=n; i++) adj[i] = new ArrayList<>();\n        for(int[] e : edges) adj[e[0]].add(new int[]{e[1], e[2]});\n        int[] dist = new int[n + 1];\n        Arrays.fill(dist, Integer.MAX_VALUE);\n        dist[startNode] = 0;\n        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);\n        pq.offer(new int[]{0, startNode});\n        while(!pq.isEmpty()) {\n            int[] curr = pq.poll();\n            int d = curr[0], u = curr[1];\n            if(d > dist[u]) continue;\n            for(int[] next : adj[u]) {\n                int v = next[0], w = next[1];\n                if(dist[u] + w < dist[v]) {\n                    dist[v] = dist[u] + w;\n                    pq.offer(new int[]{dist[v], v});\n                }\n            }\n        }\n        int ans = 0;\n        for(int i=1; i<=n; i++) {\n            if(dist[i] == Integer.MAX_VALUE) return -1;\n            ans = Math.max(ans, dist[i]);\n        }\n        return ans;\n    }\n}",
    "cpp": "#include <vector>\n#include <queue>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    int solution(vector<vector<int>>& edges, int n, int startNode) {\n        vector<vector<pair<int, int>>> adj(n + 1);\n        for (auto& e : edges) {\n            adj[e[0]].push_back({e[1], e[2]});\n        }\n        vector<int> dist(n + 1, 1e9);\n        dist[startNode] = 0;\n        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;\n        pq.push({0, startNode});\n        while (!pq.empty()) {\n            auto [d, u] = pq.top();\n            pq.pop();\n            if (d > dist[u]) continue;\n            for (auto& next : adj[u]) {\n                int v = next.first, w = next.second;\n                if (dist[u] + w < dist[v]) {\n                    dist[v] = dist[u] + w;\n                    pq.push({dist[v], v});\n                }\n            }\n        }\n        int ans = 0;\n        for (int i = 1; i <= n; i++) {\n            if (dist[i] == 1e9) return -1;\n            ans = max(ans, dist[i]);\n        }\n        return ans;\n    }\n};"
  },
  "testSuite": ts
}

with open("../private/solutions/information-propagation-time.json", "w") as f:
    json.dump(data, f, indent=2)
