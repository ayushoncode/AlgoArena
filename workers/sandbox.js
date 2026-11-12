/**
 * workers/sandbox.js — Docker sandbox runner
 *
 * Executes user-submitted code in a locked-down Docker container for each submission.
 * The entire test-case suite is bundled into a generated runner script that is mounted
 * read-only into the container. Results are returned as a single JSON line on stdout.
 *
 * ── Security flags (non-negotiable) ─────────────────────────────────────────────────
 *   --network     none        No outbound or inbound network access
 *   --memory      256m        Hard RAM cap — OOM kill if exceeded
 *   --memory-swap 256m        Disables swap (equal to --memory = no swap)
 *   --cpus        0.5         Half a CPU core
 *   --pids-limit  50          Prevents fork bombs (max 50 processes per container)
 *   --read-only               Root filesystem is immutable
 *   --tmpfs /tmp:...          Tiny writable scratch (no exec bit, no suid, 32 MB max)
 *   --rm                      Auto-remove container on exit (no ghost containers)
 *   --user sandbox            Non-root user defined in the image
 *   -v <tmpDir>:/sandbox:ro   User code mounted read-only
 *
 * Node-level child_process kill at SANDBOX_TIMEOUT_MS (default 5000 ms) acts as a
 * belt-and-suspenders backup in case Docker itself hangs (rare but possible).
 *
 * Usage:
 *   const { runSandbox } = require('./sandbox')
 *   const result = await runSandbox({ code, language: 'javascript', testCases })
 *
 * Self-test:
 *   node sandbox.js --test
 *   node sandbox.js --test --test-network
 */

'use strict'

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { randomBytes } = require('crypto')
const { buildJavaRunner } = require('./javaRunner')

const DOCKER_IMAGE = process.env.SANDBOX_IMAGE || 'algoarena-sandbox'
const TIMEOUT_MS = parseInt(process.env.SANDBOX_TIMEOUT_MS, 10) || 8000

/* ═══════════════════════════════════════════════════════════════════
   RUNNER SCRIPT GENERATORS
   One runner per language — injected into the container as a file.
   Receives testCases as embedded JSON, outputs one JSON line to stdout.
═══════════════════════════════════════════════════════════════════ */

/**
 * Build a Node.js runner script.
 * The user function can be named `solution` or defined on `Solution` class.
 */
function buildJsRunner(testCases) {
  return `'use strict';

function TreeNode(val, left, right, next) {
  this.val = (val===undefined ? 0 : val);
  this.left = (left===undefined ? null : left);
  this.right = (right===undefined ? null : right);
  this.next = (next===undefined ? null : next);
}

function ListNode(val, next, prev) {
  this.val = (val===undefined ? 0 : val);
  this.next = (next===undefined ? null : next);
  this.prev = (prev===undefined ? null : prev);
}

function Node(val, neighbors, left, right, next, random) {
  this.val = (val===undefined ? 0 : val);
  this.neighbors = (neighbors===undefined ? [] : neighbors);
  this.left = (left===undefined ? null : left);
  this.right = (right===undefined ? null : right);
  this.next = (next===undefined ? null : next);
  this.random = (random===undefined ? null : random);
}

function __buildTree(arr) {
  if (!Array.isArray(arr) || arr.length === 0 || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const q = [root];
  let i = 1;
  while (q.length > 0 && i < arr.length) {
    const curr = q.shift();
    if (curr) {
      if (i < arr.length) {
        const l = arr[i++];
        if (l !== null && l !== undefined) {
          curr.left = new TreeNode(l);
          q.push(curr.left);
        }
      }
      if (i < arr.length) {
        const r = arr[i++];
        if (r !== null && r !== undefined) {
          curr.right = new TreeNode(r);
          q.push(curr.right);
        }
      }
    }
  }
  return root;
}

function __buildList(arr, pos) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const nodes = [];
  let prev = null;
  for (const v of arr) {
    if (v !== null && v !== undefined) {
      const node = new ListNode(v);
      node.prev = prev;
      if (prev) prev.next = node;
      nodes.push(node);
      prev = node;
    }
  }
  if (typeof pos === 'number' && pos >= 0 && pos < nodes.length) {
    nodes[nodes.length - 1].next = nodes[pos];
  }
  return nodes[0] || null;
}

function __buildIntersectionLists(intersectVal, listA, listB, skipA, skipB) {
  if (!Array.isArray(listA) || !Array.isArray(listB)) return [null, null];
  const nodesA = listA.map(v => new ListNode(v));
  for (let i = 0; i < nodesA.length - 1; i++) nodesA[i].next = nodesA[i + 1];
  const headA = nodesA.length > 0 ? nodesA[0] : null;
  if (typeof intersectVal === 'number' && intersectVal !== 0 && skipA >= 0 && skipA < nodesA.length) {
    const interNode = nodesA[skipA];
    if (skipB === 0) return [headA, interNode];
    const nodesB = [];
    for (let i = 0; i < skipB; i++) nodesB.push(new ListNode(listB[i]));
    for (let i = 0; i < nodesB.length - 1; i++) nodesB[i].next = nodesB[i + 1];
    if (nodesB.length > 0) nodesB[nodesB.length - 1].next = interNode;
    return [headA, nodesB[0] || interNode];
  } else {
    const nodesB = listB.map(v => new ListNode(v));
    for (let i = 0; i < nodesB.length - 1; i++) nodesB[i].next = nodesB[i + 1];
    return [headA, nodesB.length > 0 ? nodesB[0] : null];
  }
}

function __buildListWithRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const nodes = arr.map(item => new Node(item[0], [], null, null, null, null));
  for (let i = 0; i < arr.length; i++) {
    if (i + 1 < nodes.length) nodes[i].next = nodes[i + 1];
    const rIdx = arr[i][1];
    if (typeof rIdx === 'number' && rIdx >= 0 && rIdx < nodes.length) {
      nodes[i].random = nodes[rIdx];
    }
  }
  return nodes[0];
}

function __serializeListWithRandom(head) {
  if (!head) return [];
  const nodes = [];
  const map = new Map();
  let curr = head;
  while (curr && !map.has(curr) && nodes.length < 5000) {
    map.set(curr, nodes.length);
    nodes.push(curr);
    curr = curr.next;
  }
  const res = [];
  for (const node of nodes) {
    const rIdx = node.random ? (map.has(node.random) ? map.get(node.random) : null) : null;
    res.push([node.val, rIdx]);
  }
  return res;
}

function runClassCommands(Cls, commands, args) {
  let instance = null;
  const outputs = [];
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const a = args[i] || [];
    if (cmd === 'LRUCache' || cmd === Cls.name) {
      instance = new Cls(...a);
      outputs.push(null);
    } else if (instance && typeof instance[cmd] === 'function') {
      const res = instance[cmd](...a);
      outputs.push(res !== undefined ? res : null);
    } else {
      outputs.push(null);
    }
  }
  return outputs;
}

function __buildGraph(adjList) {
  if (!Array.isArray(adjList) || adjList.length === 0) return null;
  const nodes = [];
  for (let i = 1; i <= adjList.length; i++) {
    nodes.push(new Node(i, []));
  }
  for (let i = 0; i < adjList.length; i++) {
    const neighbors = adjList[i];
    if (Array.isArray(neighbors)) {
      for (const neighborVal of neighbors) {
        if (neighborVal >= 1 && neighborVal <= nodes.length) {
          nodes[i].neighbors.push(nodes[neighborVal - 1]);
        }
      }
    }
  }
  return nodes[0];
}

function __serialize(obj, expected) {
  if (obj === null || obj === undefined) {
    if (typeof expected === 'string' && expected.trim() === '[]') return [];
    if (typeof expected === 'string' && expected.includes('No intersection')) return "No intersection";
    return null;
  }
  if (typeof expected === 'string' && (expected.includes('Intersected at') || expected.includes('No intersection'))) {
    if (obj && typeof obj === 'object' && 'val' in obj) {
      return "Intersected at '" + obj.val + "'";
    }
    return "No intersection";
  }
  if (typeof obj === 'object' && 'random' in obj && obj.random !== undefined) {
    return __serializeListWithRandom(obj);
  }
  if (typeof obj === 'object' && Array.isArray(obj.neighbors) && 'val' in obj) {
    const map = new Map();
    const q = [obj];
    map.set(obj.val, obj);
    while (q.length > 0) {
      const curr = q.shift();
      if (curr.neighbors) {
        for (const neighbor of curr.neighbors) {
          if (neighbor && !map.has(neighbor.val)) {
            map.set(neighbor.val, neighbor);
            q.push(neighbor);
          }
        }
      }
    }
    const maxVal = Math.max(...map.keys());
    const adj = [];
    for (let i = 1; i <= maxVal; i++) {
      const n = map.get(i);
      adj.push(n ? (n.neighbors || []).filter(Boolean).map(nb => nb.val) : []);
    }
    return adj;
  }
  if (typeof expected === 'string' && (expected.includes('#') || expected.includes('"#"'))) {
    const res = [];
    let leftmost = obj;
    while (leftmost) {
      let curr = leftmost;
      let nextLeftmost = null;
      while (curr) {
        res.push(curr.val);
        if (!nextLeftmost) {
          if (curr.left) nextLeftmost = curr.left;
          else if (curr.right) nextLeftmost = curr.right;
        }
        curr = curr.next;
      }
      res.push('#');
      if (!nextLeftmost) {
        let temp = leftmost;
        while (temp && !nextLeftmost) {
          if (temp.left) nextLeftmost = temp.left;
          else if (temp.right) nextLeftmost = temp.right;
          temp = temp.next;
        }
      }
      leftmost = nextLeftmost;
    }
    return res;
  }
  if (obj instanceof TreeNode || (typeof obj === 'object' && ('left' in obj || 'right' in obj) && 'val' in obj)) {
    const res = [];
    const q = [obj];
    while (q.length > 0) {
      const node = q.shift();
      if (node) {
        res.push(node.val);
        q.push(node.left || null);
        q.push(node.right || null);
      } else {
        res.push(null);
      }
    }
    while (res.length > 0 && res[res.length - 1] === null) res.pop();
    return res;
  }
  if (obj instanceof ListNode || (typeof obj === 'object' && 'next' in obj && 'val' in obj)) {
    const res = [];
    const seen = new Set();
    let curr = obj;
    while (curr && !seen.has(curr) && res.length < 5000) {
      seen.add(curr);
      res.push(curr.val);
      curr = curr.next;
    }
    return res;
  }
  return obj;
}

// ── Load user solution ──────────────────────────────────────────────
let solution;
let src = '';
try {
  src = require('fs').readFileSync('./solution.js', 'utf8');
  const loader = new Function(
    'TreeNode', 'ListNode', 'Node', 'exports', 'module', 'console', 'runClassCommands',
    src + '\\n\\n' +
    'if (typeof solution === "function") return solution;\\n' +
    'if (typeof getIntersectionNode === "function") return getIntersectionNode;\\n' +
    'if (typeof copyRandomList === "function") return copyRandomList;\\n' +
    'if (typeof LRUCache === "function") return (cmds, args) => runClassCommands(LRUCache, cmds, args);\\n' +
    'if (typeof serialize === "function" && typeof deserialize === "function") return (root) => deserialize(serialize(root));\\n' +
    'if (typeof Codec === "function") {\\n' +
    '  const c = new Codec();\\n' +
    '  if (typeof c.serialize === "function" && typeof c.deserialize === "function") return (root) => c.deserialize(c.serialize(root));\\n' +
    '}\\n' +
    'if (typeof Solution === "function") {\\n' +
    '  const inst = new Solution();\\n' +
    '  const methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== "constructor");\\n' +
    '  if (typeof inst.solution === "function") return inst.solution.bind(inst);\\n' +
    '  if (methods.length > 0 && typeof inst[methods[0]] === "function") return inst[methods[0]].bind(inst);\\n' +
    '}\\n' +
    'return undefined;'
  );
  solution = loader(TreeNode, ListNode, Node, {}, {}, { log: () => {} }, runClassCommands);
  if (typeof solution !== 'function') {
    throw new Error("No function named 'solution' found. Please define: function solution(...) { ... }");
  }
} catch (e) {
  process.stdout.write(JSON.stringify({ fatal: e.message, results: [] }) + '\\n');
  process.exit(0);
}

// ── Run each test case ──────────────────────────────────────────────
const testCases = require('./test_cases.json');

const fnSrc = src.replace(/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*/g, '');
const isTreeFn = fnSrc.includes('.left') || fnSrc.includes('.right') || fnSrc.includes('TreeNode') || fnSrc.includes('root');
const isListFn = fnSrc.includes('.next') || fnSrc.includes('ListNode') || fnSrc.includes('head');

let paramNames = [];
try {
  const match = fnSrc.match(/(?:function\\s+solution|\\bsolution)\\s*\\(([^)]*)\\)/i);
  if (match && match[1]) {
    paramNames = match[1].split(',').map(s => s.trim().replace(/^[^a-zA-Z_$]+|[^a-zA-Z0-9_$]+$/g, '').toLowerCase());
  }
} catch {}

for (let i = 0; i < testCases.length; i++) {
  const tc    = testCases[i];
  const start = Date.now();
  let resultObj = null;
  
  try {
    const rawArgs = JSON.parse('[' + tc.input + ']');
    let convertedArgs;
    if (rawArgs.length === 5 && Array.isArray(rawArgs[1]) && Array.isArray(rawArgs[2])) {
      convertedArgs = __buildIntersectionLists(rawArgs[0], rawArgs[1], rawArgs[2], rawArgs[3], rawArgs[4]);
    } else if (rawArgs.length === 2 && Array.isArray(rawArgs[0]) && rawArgs[0].length > 0 && typeof rawArgs[0][0] === 'string') {
      convertedArgs = rawArgs;
    } else if (rawArgs.length === 2 && Array.isArray(rawArgs[0]) && typeof rawArgs[1] === 'number' && (isListFn || ['head', 'list'].includes(paramNames[0] || ''))) {
      const head = __buildList(rawArgs[0], rawArgs[1]);
      convertedArgs = paramNames.length === 1 ? [head] : [head, rawArgs[1]];
    } else {
      convertedArgs = rawArgs.map((arg, argIdx) => {
        if (Array.isArray(arg)) {
          const pName = paramNames[argIdx] || '';
          const isTreeParam = ['root', 'p', 'q', 't1', 't2', 'node', 'tree'].includes(pName);
          const isListParam = ['head', 'l1', 'l2', 'list', 'list1', 'list2', 'heada', 'headb'].includes(pName);
          const isGraphParam = ['node'].includes(pName) || fnSrc.includes('.neighbors');
          const isArrayParam = ['lists', 'preorder', 'inorder', 'postorder', 'nums', 'arr', 'edges', 'matrix', 'grid', 'words', 'dictionary', 'commands', 'args'].includes(pName);

          if (isGraphParam) return __buildGraph(arg);
          if (arg.length > 0 && Array.isArray(arg[0]) && arg[0].length === 2 && (fnSrc.includes('.random') || fnSrc.includes('random') || isListParam)) {
            return __buildListWithRandom(arg);
          }
          if (isTreeParam || arg.includes(null)) return __buildTree(arg);
          if (isListParam) return __buildList(arg);
          if (isTreeFn && !isListParam && !isArrayParam) return __buildTree(arg);
          if (isListFn && !isTreeParam && !isArrayParam) return __buildList(arg);
        }
        return arg;
      });
    }

    const retVal = solution(...convertedArgs);
    const actual = retVal !== undefined ? retVal : (convertedArgs.length > 0 ? convertedArgs[0] : null);
    const serialized = __serialize(actual, tc.output);
    
    resultObj = {
      index:     i + 1,
      actual:    JSON.stringify(serialized !== undefined ? serialized : null),
      expected:  tc.output,
      runtimeMs: Date.now() - start,
      isHidden:  tc.is_hidden,
      error:     null,
    };
  } catch (e) {
    resultObj = {
      index:     i + 1,
      actual:    null,
      expected:  tc.output,
      runtimeMs: Date.now() - start,
      isHidden:  tc.is_hidden,
      error:     e.stack || e.message,
    };
  }
  process.stdout.write(JSON.stringify(resultObj) + '\\n');
}
`
}

/**
 * Build a Python 3 runner script.
 * Supports TreeNode and ListNode conversions and serializers.
 */
function buildPyRunner(testCases) {
  const escapedTestCases = JSON.stringify(testCases).replace(/\\/g, '\\\\')
  return `import json, sys, time, inspect, collections, heapq, bisect, math
from typing import List, Optional, Dict, Set, Tuple

class TreeNode:
    def __init__(self, val=0, left=None, right=None, next=None):
        self.val = val
        self.left = left
        self.right = right
        self.next = next

class ListNode:
    def __init__(self, val=0, next=None, prev=None):
        self.val = val
        self.next = next
        self.prev = prev

class Node:
    def __init__(self, val=0, neighbors=None, left=None, right=None, next=None, random=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        self.left = left
        self.right = right
        self.next = next
        self.random = random

def __build_tree(arr):
    if not isinstance(arr, list) or len(arr) == 0 or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    q = [root]
    i = 1
    while q and i < len(arr):
        curr = q.pop(0)
        if curr:
            if i < len(arr):
                l = arr[i]
                i += 1
                if l is not None:
                    curr.left = TreeNode(l)
                    q.append(curr.left)
            if i < len(arr):
                r = arr[i]
                i += 1
                if r is not None:
                    curr.right = TreeNode(r)
                    q.append(curr.right)
    return root

def __build_list(arr, pos=None):
    if not isinstance(arr, list) or len(arr) == 0:
        return None
    nodes = []
    prev_node = None
    for v in arr:
        if v is not None:
            node = ListNode(v)
            node.prev = prev_node
            if prev_node:
                prev_node.next = node
            nodes.append(node)
            prev_node = node
    if isinstance(pos, int) and 0 <= pos < len(nodes):
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None

def __build_intersection_lists(intersect_val, list_a, list_b, skip_a, skip_b):
    if not isinstance(list_a, list) or not isinstance(list_b, list):
        return None, None
    nodes_a = [ListNode(v) for v in list_a]
    for i in range(len(nodes_a) - 1):
        nodes_a[i].next = nodes_a[i + 1]
    head_a = nodes_a[0] if nodes_a else None
    if isinstance(intersect_val, int) and intersect_val != 0 and 0 <= skip_a < len(nodes_a):
        inter_node = nodes_a[skip_a]
        if skip_b == 0:
            return head_a, inter_node
        nodes_b = [ListNode(list_b[i]) for i in range(skip_b)]
        for i in range(len(nodes_b) - 1):
            nodes_b[i].next = nodes_b[i + 1]
        if nodes_b:
            nodes_b[-1].next = inter_node
        return head_a, (nodes_b[0] if nodes_b else inter_node)
    else:
        nodes_b = [ListNode(v) for v in list_b]
        for i in range(len(nodes_b) - 1):
            nodes_b[i].next = nodes_b[i + 1]
        return head_a, (nodes_b[0] if nodes_b else None)

def __build_list_with_random(arr):
    if not isinstance(arr, list) or len(arr) == 0:
        return None
    nodes = [Node(item[0]) for item in arr]
    for i in range(len(arr)):
        if i + 1 < len(nodes):
            nodes[i].next = nodes[i + 1]
        r_idx = arr[i][1]
        if isinstance(r_idx, int) and 0 <= r_idx < len(nodes):
            nodes[i].random = nodes[r_idx]
    return nodes[0]

def __serialize_list_with_random(head):
    if not head:
        return []
    nodes = []
    node_map = {}
    curr = head
    while curr and curr not in node_map and len(nodes) < 5000:
        node_map[curr] = len(nodes)
        nodes.append(curr)
        curr = curr.next
    res = []
    for node in nodes:
        r_idx = node_map.get(node.random, None) if getattr(node, 'random', None) else None
        res.append([node.val, r_idx])
    return res

def __build_graph(adj_list):
    if not isinstance(adj_list, list) or len(adj_list) == 0:
        return None
    nodes = [Node(i) for i in range(1, len(adj_list) + 1)]
    for i, neighbors in enumerate(adj_list):
        if isinstance(neighbors, list):
            for nb_val in neighbors:
                if 1 <= nb_val <= len(nodes):
                    nodes[i].neighbors.append(nodes[nb_val - 1])
    return nodes[0]

def __serialize(obj, expected=''):
    if obj is None:
        if isinstance(expected, str) and expected.strip() == '[]':
            return []
        if isinstance(expected, str) and 'No intersection' in expected:
            return "No intersection"
        return None
    if isinstance(expected, str) and ('Intersected at' in expected or 'No intersection' in expected):
        if obj is not None and hasattr(obj, 'val'):
            return f"Intersected at '{obj.val}'"
        return "No intersection"
    if hasattr(obj, 'random'):
        return __serialize_list_with_random(obj)
    if hasattr(obj, 'neighbors') and isinstance(getattr(obj, 'neighbors', None), list) and hasattr(obj, 'val'):
        node_map = {}
        q = collections.deque([obj])
        node_map[obj.val] = obj
        while q:
            curr = q.popleft()
            for nb in (curr.neighbors or []):
                if nb and nb.val not in node_map:
                    node_map[nb.val] = nb
                    q.append(nb)
        max_val = max(node_map.keys()) if node_map else 0
        adj = []
        for i in range(1, max_val + 1):
            n = node_map.get(i)
            adj.append([nb.val for nb in (n.neighbors or []) if nb] if n else [])
        return adj
    if isinstance(expected, str) and ('#' in expected or '"#"' in expected):
        res = []
        leftmost = obj
        while leftmost:
            curr = leftmost
            next_leftmost = None
            while curr:
                res.append(curr.val)
                if not next_leftmost:
                    if getattr(curr, 'left', None):
                        next_leftmost = curr.left
                    elif getattr(curr, 'right', None):
                        next_leftmost = curr.right
                curr = getattr(curr, 'next', None)
            res.append('#')
            if not next_leftmost:
                temp = leftmost
                while temp and not next_leftmost:
                    if getattr(temp, 'left', None):
                        next_leftmost = temp.left
                    elif getattr(temp, 'right', None):
                        next_leftmost = temp.right
                    temp = getattr(temp, 'next', None)
            leftmost = next_leftmost
        return res
    if isinstance(obj, TreeNode):
        res = []
        q = collections.deque([obj])
        while q:
            node = q.popleft()
            if node:
                res.append(node.val)
                q.append(node.left)
                q.append(node.right)
            else:
                res.append(None)
        while res and res[-1] is None:
            res.pop()
        return res
    if isinstance(obj, ListNode):
        res = []
        seen = set()
        curr = obj
        while curr and curr not in seen and len(res) < 5000:
            seen.add(curr)
            res.append(curr.val)
            curr = curr.next
        return res
    return obj

# ── Load user solution ──────────────────────────────────────────────
try:
    with open('./solution.py', 'r') as f:
        src = f.read()
    ns = {
        'TreeNode': TreeNode,
        'ListNode': ListNode,
        'Node': Node,
        'List': List,
        'Optional': Optional,
        'Dict': Dict,
        'Set': Set,
        'Tuple': Tuple,
        'collections': collections,
        'heapq': heapq,
        'bisect': bisect,
        'math': math,
    }
    exec(src, ns)
    solution = ns.get('solution')
    if 'LRUCache' in ns and inspect.isclass(ns['LRUCache']):
        Cls = ns['LRUCache']
        def class_runner(commands, args):
            inst = None
            outputs = []
            for cmd, a in zip(commands, args):
                if cmd == 'LRUCache' or cmd == Cls.__name__:
                    inst = Cls(*a)
                    outputs.append(None)
                elif inst and hasattr(inst, cmd) and callable(getattr(inst, cmd)):
                    res = getattr(inst, cmd)(*a)
                    outputs.append(res)
                else:
                    outputs.append(None)
            return outputs
        solution = class_runner
    if 'Codec' in ns and inspect.isclass(ns['Codec']):
        c = ns['Codec']()
        if hasattr(c, 'serialize') and hasattr(c, 'deserialize'):
            solution = lambda root: c.deserialize(c.serialize(root))
    if not callable(solution):
        for fn_name in ['getIntersectionNode', 'copyRandomList']:
            if fn_name in ns and callable(ns[fn_name]):
                solution = ns[fn_name]
                break
    if not callable(solution) and 'Solution' in ns:
        inst = ns['Solution']()
        if hasattr(inst, 'solution') and callable(getattr(inst, 'solution')):
            solution = getattr(inst, 'solution')
        else:
            methods = [m for m in dir(inst) if not m.startswith('_') and callable(getattr(inst, m))]
            if methods:
                solution = getattr(inst, methods[0])
    if not callable(solution):
        raise Exception("No function named 'solution' found. Define: def solution(...):")
except Exception as e:
    print(json.dumps({"fatal": str(e), "results": []}))
    sys.exit(0)

# ── Run each test case ──────────────────────────────────────────────
with open('./test_cases.json', 'r') as f:
    test_cases = json.load(f)

fn_src = src.lower()
is_tree = 'treenode' in fn_src or '.left' in fn_src or '.right' in fn_src or 'root' in fn_src
is_list = 'listnode' in fn_src or '.next' in fn_src or 'head' in fn_src

try:
    sig = inspect.signature(solution)
    param_list = list(sig.parameters.values())
    if param_list and param_list[0].name == 'self':
        param_list = param_list[1:]
except Exception:
    param_list = []

for i, tc in enumerate(test_cases):
    start = time.time()
    try:
        raw_args = json.loads('[' + tc['input'] + ']')
        converted_args = []
        if len(raw_args) == 5 and isinstance(raw_args[1], list) and isinstance(raw_args[2], list):
            converted_args = list(__build_intersection_lists(raw_args[0], raw_args[1], raw_args[2], raw_args[3], raw_args[4]))
        elif len(raw_args) == 2 and isinstance(raw_args[0], list) and len(raw_args[0]) > 0 and isinstance(raw_args[0][0], str):
            converted_args = raw_args
        elif len(raw_args) == 2 and isinstance(raw_args[0], list) and isinstance(raw_args[1], int) and (is_list or (param_list and param_list[0].name.lower() in ('head', 'list'))):
            head = __build_list(raw_args[0], raw_args[1])
            converted_args = [head] if len(param_list) == 1 else [head, raw_args[1]]
        else:
            for arg_idx, arg in enumerate(raw_args):
                p_name = param_list[arg_idx].name.lower() if arg_idx < len(param_list) else ''
                p_anno = str(param_list[arg_idx].annotation) if arg_idx < len(param_list) else ''
                is_tree_param = 'treenode' in p_anno.lower() or p_name in ('root', 'p', 'q', 't1', 't2', 'node', 'tree')
                is_list_param = 'listnode' in p_anno.lower() or p_name in ('head', 'l1', 'l2', 'list', 'list1', 'list2', 'heada', 'headb')
                is_graph_param = p_name in ('node',) or 'neighbors' in fn_src
                is_array_param = p_name in ('lists', 'preorder', 'inorder', 'postorder', 'nums', 'arr', 'edges', 'matrix', 'grid', 'words', 'dictionary', 'commands', 'args')

                if isinstance(arg, list):
                    if is_graph_param:
                        converted_args.append(__build_graph(arg))
                    elif len(arg) > 0 and isinstance(arg[0], list) and len(arg[0]) == 2 and ('random' in fn_src or is_list_param):
                        converted_args.append(__build_list_with_random(arg))
                    elif is_tree_param or None in arg:
                        converted_args.append(__build_tree(arg))
                    elif is_list_param:
                        if p_name == 'lists' or 'list[' in p_anno.lower():
                            converted_args.append([__build_list(item) if isinstance(item, list) else item for item in arg])
                        else:
                            converted_args.append(__build_list(arg))
                    elif is_tree and not is_list_param and not is_array_param:
                        converted_args.append(__build_tree(arg))
                    elif is_list and not is_tree_param and not is_array_param:
                        converted_args.append(__build_list(arg))
                    else:
                        converted_args.append(arg)
                else:
                    converted_args.append(arg)

        ret_val = solution(*converted_args)
        if ret_val is not None:
            actual = ret_val
        elif is_list or is_tree:
            actual = None
        elif len(converted_args) > 0 and isinstance(converted_args[0], (list, dict)):
            actual = converted_args[0]
        else:
            actual = None

        serialized = __serialize(actual, tc.get('output', ''))
        res_obj = {
            "index":     i + 1,
            "actual":    json.dumps(serialized),
            "expected":  tc['output'],
            "runtimeMs": int((time.time() - start) * 1000),
            "isHidden":  tc['is_hidden'],
            "error":     None,
        }
        print(json.dumps(res_obj))
        sys.stdout.flush()
    except Exception as e:
        res_obj = {
            "index":     i + 1,
            "actual":    None,
            "expected":  tc['output'],
            "runtimeMs": int((time.time() - start) * 1000),
            "isHidden":  tc['is_hidden'],
            "error":     str(e),
        }
        print(json.dumps(res_obj))
        sys.stdout.flush()
`
}

/**
 * Build a C++ runner script.
 */
function buildCppRunner(testCases, code = '') {
  const escapedTestCases = JSON.stringify(testCases)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')

  const hasClassSolution = /\b(class|struct)\s+Solution\b/.test(code)
  const classDefine = hasClassSolution ? '#define USE_CLASS_SOLUTION 1\n' : ''

  return `${classDefine}#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <stack>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <algorithm>
#include <numeric>
#include <climits>
#include <cmath>
#include <chrono>
#include <tuple>
#include <type_traits>
#include <nlohmann/json.hpp>
using json = nlohmann::json;
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

struct ListNode {
    int val;
    ListNode *next;
    ListNode *prev;
    ListNode() : val(0), next(nullptr), prev(nullptr) {}
    ListNode(int x) : val(x), next(nullptr), prev(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next), prev(nullptr) {}
    ListNode(int x, ListNode *next, ListNode *prev) : val(x), next(next), prev(prev) {}
};

struct Node {
    int val;
    vector<Node*> neighbors;
    Node* left;
    Node* right;
    Node* next;
    Node* random;
    Node() : val(0), left(nullptr), right(nullptr), next(nullptr), random(nullptr) {}
    Node(int _val) : val(_val), left(nullptr), right(nullptr), next(nullptr), random(nullptr) {}
    Node(int _val, vector<Node*> _neighbors) : val(_val), neighbors(_neighbors), left(nullptr), right(nullptr), next(nullptr), random(nullptr) {}
    Node(int _val, Node* _left, Node* _right, Node* _next) : val(_val), left(_left), right(_right), next(_next), random(nullptr) {}
};

inline TreeNode* __build_tree(const json& j) {
    if (j.is_null() || !j.is_array() || j.empty() || j[0].is_null()) return nullptr;
    TreeNode* root = new TreeNode(j[0].get<int>());
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < j.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (curr) {
            if (i < j.size()) {
                if (!j[i].is_null()) {
                    curr->left = new TreeNode(j[i].get<int>());
                    q.push(curr->left);
                }
                i++;
            }
            if (i < j.size()) {
                if (!j[i].is_null()) {
                    curr->right = new TreeNode(j[i].get<int>());
                    q.push(curr->right);
                }
                i++;
            }
        }
    }
    return root;
}

inline ListNode* __build_list(const json& j) {
    if (j.is_null() || !j.is_array() || j.empty()) return nullptr;
    ListNode* head = nullptr;
    ListNode* prev = nullptr;
    for (const auto& item : j) {
        if (!item.is_null()) {
            ListNode* node = new ListNode(item.get<int>());
            node->prev = prev;
            if (prev) prev->next = node;
            else head = node;
            prev = node;
        }
    }
    return head;
}

inline json __serialize_tree(TreeNode* root) {
    if (!root) return json::array();
    json res = json::array();
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (curr) {
            res.push_back(curr->val);
            q.push(curr->left);
            q.push(curr->right);
        } else {
            res.push_back(nullptr);
        }
    }
    while (!res.empty() && res.back().is_null()) {
        res.erase(res.end() - 1);
    }
    return res;
}

inline json __serialize_list(ListNode* head) {
    if (!head) return json::array();
    json res = json::array();
    ListNode* curr = head;
    unordered_set<ListNode*> seen;
    while (curr && seen.insert(curr).second && res.size() < 5000) {
        res.push_back(curr->val);
        curr = curr->next;
    }
    return res;
}

namespace nlohmann {
    template <>
    struct adl_serializer<TreeNode*> {
        static void to_json(json& j, const TreeNode* ptr) {
            j = __serialize_tree(const_cast<TreeNode*>(ptr));
        }
        static void from_json(const json& j, TreeNode*& ptr) {
            ptr = __build_tree(j);
        }
    };

    template <>
    struct adl_serializer<ListNode*> {
        static void to_json(json& j, const ListNode* ptr) {
            j = __serialize_list(const_cast<ListNode*>(ptr));
        }
        static void from_json(const json& j, ListNode*& ptr) {
            ptr = __build_list(j);
        }
    };
}

// User solution included here
#include "./solution.cpp"

template<typename T>
struct ArgParser {
    static auto parse(const json& j) -> std::decay_t<T> {
        using CleanT = std::decay_t<T>;
        if constexpr (std::is_same_v<CleanT, TreeNode*>) {
            return __build_tree(j);
        } else if constexpr (std::is_same_v<CleanT, ListNode*>) {
            return __build_list(j);
        } else if constexpr (std::is_same_v<CleanT, std::vector<std::vector<char>>>) {
            std::vector<std::vector<char>> res;
            if (!j.is_array()) return res;
            for (const auto& row : j) {
                std::vector<char> r;
                if (row.is_array()) {
                    for (const auto& item : row) {
                        if (item.is_string()) {
                            std::string s = item.get<std::string>();
                            r.push_back(s.empty() ? ' ' : s[0]);
                        } else if (item.is_number()) {
                            r.push_back((char)item.get<int>());
                        }
                    }
                } else if (row.is_string()) {
                    std::string s = row.get<std::string>();
                    for (char c : s) r.push_back(c);
                }
                res.push_back(r);
            }
            return res;
        } else if constexpr (std::is_same_v<CleanT, std::vector<char>>) {
            std::vector<char> res;
            if (j.is_string()) {
                std::string s = j.get<std::string>();
                for (char c : s) res.push_back(c);
            } else if (j.is_array()) {
                for (const auto& item : j) {
                    if (item.is_string()) {
                        std::string s = item.get<std::string>();
                        res.push_back(s.empty() ? ' ' : s[0]);
                    } else if (item.is_number()) {
                        res.push_back((char)item.get<int>());
                    }
                }
            }
            return res;
        } else if constexpr (std::is_same_v<CleanT, char>) {
            if (j.is_string()) {
                std::string s = j.get<std::string>();
                return s.empty() ? ' ' : s[0];
            } else if (j.is_number()) {
                return (char)j.get<int>();
            }
            return ' ';
        } else {
            return j.get<CleanT>();
        }
    }
};

template<typename F, typename Tuple, size_t... I>
json make_and_apply(F&& f, const json& args, std::index_sequence<I...>, Tuple*) {
    auto parsed_tuple = std::make_tuple(ArgParser<std::tuple_element_t<I, Tuple>>::parse(args[I])...);
    using Ret = decltype(std::apply(std::forward<F>(f), parsed_tuple));
    if constexpr (std::is_void_v<Ret>) {
        std::apply(std::forward<F>(f), parsed_tuple);
        if constexpr (sizeof...(I) > 0) {
            return json(std::get<0>(parsed_tuple));
        } else {
            return json(nullptr);
        }
    } else {
        auto res = std::apply(std::forward<F>(f), parsed_tuple);
        if constexpr (std::is_same_v<std::decay_t<Ret>, TreeNode*>) {
            return __serialize_tree(res);
        } else if constexpr (std::is_same_v<std::decay_t<Ret>, ListNode*>) {
            return __serialize_list(res);
        } else {
            return json(res);
        }
    }
}

template<typename Ret, typename... Args>
json run_function(Ret(*fn)(Args...), const json& args) {
    using Tuple = std::tuple<Args...>;
    return make_and_apply(fn, args, std::index_sequence_for<Args...>{}, static_cast<Tuple*>(nullptr));
}

template<typename Ret, typename Class, typename... Args>
json run_function(Ret(Class::*fn)(Args...), Class& inst, const json& args) {
    using Tuple = std::tuple<Args...>;
    auto lambda = [&](auto&&... parsedArgs) -> Ret {
        return (inst.*fn)(std::forward<decltype(parsedArgs)>(parsedArgs)...);
    };
    return make_and_apply(lambda, args, std::index_sequence_for<Args...>{}, static_cast<Tuple*>(nullptr));
}

#include <fstream>
// Concept Dispatcher
json dispatch_exec(const json& args) {
#ifdef USE_CLASS_SOLUTION
    Solution inst;
    return run_function(&Solution::solution, inst, args);
#else
    return run_function(&solution, args);
#endif
}

int main() {
    try {
        ifstream ifs("./test_cases.json");
        json testCases;
        ifs >> testCases;

        for (size_t i = 0; i < testCases.size(); i++) {
            auto& tc = testCases[i];
            auto  t0 = chrono::high_resolution_clock::now();
            try {
                string rawInput = "[" + tc["input"].get<string>() + "]";
                json   args     = json::parse(rawInput);
                json   actual   = dispatch_exec(args);
                int    ms       = (int)chrono::duration_cast<chrono::milliseconds>(
                                    chrono::high_resolution_clock::now() - t0).count();
                json res_obj = {
                    {"index",    (int)(i+1)},
                    {"actual",   actual.dump()},
                    {"expected", tc["output"]},
                    {"runtimeMs", ms},
                    {"isHidden", tc["is_hidden"]},
                    {"error",    nullptr}
                };
                cout << res_obj.dump() << endl;
            } catch (const exception& e) {
                int ms = (int)chrono::duration_cast<chrono::milliseconds>(
                            chrono::high_resolution_clock::now() - t0).count();
                json res_obj = {
                    {"index",    (int)(i+1)},
                    {"actual",   nullptr},
                    {"expected", tc["output"]},
                    {"runtimeMs", ms},
                    {"isHidden", tc["is_hidden"]},
                    {"error",    e.what()}
                };
                cout << res_obj.dump() << endl;
            }
        }
    } catch (const exception& e) {
        cout << json({{"fatal", e.what()}}).dump() << endl;
    }
    return 0;
}
`
}


/* buildJavaRunner is imported from ./javaRunner */
/* ═══════════════════════════════════════════════════════════════════
   OUTPUT COMPARISON
   Flexible but deterministic: handles JSON arrays, numbers, booleans.
 ═══════════════════════════════════════════════════════════════════ */
function normalizeOutput(val) {
  if (val === undefined || val === null) return 'null'
  if (typeof val === 'object') {
    return JSON.stringify(val)
  }
  let s = String(val).trim()
  try {
    let parsed = JSON.parse(s)
    while (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{') || (parsed.startsWith('"') && parsed.endsWith('"')))) {
      try {
        parsed = JSON.parse(parsed)
      } catch {
        break
      }
    }
    return JSON.stringify(parsed)
  } catch {
    return s
  }
}

function canonicalizeVal(v) {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') {
    return Math.round(v * 1e5) / 1e5
  }
  if (typeof v === 'string') {
    return stripQuotes(v)
  }
  if (Array.isArray(v)) {
    const mapped = v.map(canonicalizeVal)
    return mapped.sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
  }
  if (typeof v === 'object') {
    const sortedObj = {}
    Object.keys(v).sort().forEach(k => {
      sortedObj[k] = canonicalizeVal(v[k])
    })
    return sortedObj
  }
  return v
}

function stripQuotes(str) {
  if (str === null || str === undefined) return ''
  let s = String(str).trim()
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('\\"') && s.endsWith('\\"'))) {
    if (s.startsWith('\\"') && s.endsWith('\\"') && s.length >= 4) {
      s = s.slice(2, -2).trim()
    } else if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
      s = s.slice(1, -1).trim()
    } else {
      break
    }
  }
  return s.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function compareOutputs(actual, expected) {
  const a = normalizeOutput(actual)
  const e = normalizeOutput(expected)
  if (a === e) return true

  // Empty collection / null equivalency (for linked lists / trees / optional lists)
  if ((a === 'null' && (e === '[]' || e === 'null')) || (a === '[]' && (e === 'null' || e === '[]'))) return true

  // Deep string match ignoring quotes and JSON escape levels
  if (stripQuotes(actual) === stripQuotes(expected)) return true

  // Canonical unordered & floating comparison (e.g. 3Sum, Subsets, Word Break II, etc.)
  try {
    const pa = JSON.parse(a)
    const pe = JSON.parse(e)
    const ca = JSON.stringify(canonicalizeVal(pa))
    const ce = JSON.stringify(canonicalizeVal(pe))
    if (ca === ce) return true
  } catch { /* not JSON */ }
  return false
}

/* ═══════════════════════════════════════════════════════════════════
   CORE: spawn docker with timeout
 ═══════════════════════════════════════════════════════════════════ */
function spawnWithTimeout(cmd, args, timeoutMs, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, opts)
    const stdoutBufs = []
    const stderrBufs = []
    let leftover = ''

    proc.stdout.on('data', d => {
      stdoutBufs.push(d)
      if (typeof opts.onStdoutLine === 'function') {
        leftover += d.toString('utf8')
        const lines = leftover.split('\n')
        leftover = lines.pop()
        for (const line of lines) {
          if (line.trim()) opts.onStdoutLine(line.trim())
        }
      }
    })
    proc.stderr.on('data', d => stderrBufs.push(d))

    let killed = false
    const timer = setTimeout(() => {
      killed = true
      // SIGKILL bypasses all signal handlers — container stops immediately
      proc.kill('SIGKILL')
      const err = new Error(`Sandbox timed out after ${timeoutMs}ms`)
      err.timedOut = true
      reject(err)
    }, timeoutMs)

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (killed) return   // already rejected
      const stdout = Buffer.concat(stdoutBufs).toString('utf8')
      const stderr = Buffer.concat(stderrBufs).toString('utf8')

      if (code !== 0 && !stdout.trim()) {
        // Non-zero exit with no stdout = runtime error before any output
        const err = new Error(stderr.slice(0, 2000) || `Exited with code ${code}`)
        err.exitCode = code
        err.isRuntime = true
        return reject(err)
      }
      if (stderr.trim()) {
        console.error("[Sandbox STDERR] Code:", code, "Error:\\n", stderr.slice(0, 2000));
      }
      resolve(stdout)
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
 ═══════════════════════════════════════════════════════════════════ */
function makeErrorResult(verdict, testCases, errorMsg, runtimeMs) {
  return {
    verdict,
    totalTests: testCases.length,
    passedTests: 0,
    runtimeMs,
    testResults: testCases.map((tc, i) => ({
      testIndex: i + 1,
      passed: false,
      input: tc.is_hidden ? '[Hidden]' : tc.input,
      expected: tc.is_hidden ? '[Hidden]' : tc.output,
      actual: '[Error]',
      error: errorMsg,
      isHidden: tc.is_hidden,
      runtimeMs: 0,
    })),
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PUBLIC API
 ═══════════════════════════════════════════════════════════════════ */
/**
 * runSandbox({ code, language, testCases })
 *
 * @param   {string}  code       Raw user source code
 * @param   {string}  language   'javascript' | 'python' | 'cpp' | 'java'
 * @param   {Array}   testCases  [{ input, output, is_hidden }, ...]
 * @returns {Promise<{verdict, totalTests, passedTests, runtimeMs, testResults}>}
 */
async function runSandbox({ code, language, testCases, timeLimitMs, onProgress }) {
  const jobId = randomBytes(8).toString('hex')
  const tmpDir = path.join(os.tmpdir(), `aa-${jobId}`)

  fs.mkdirSync(tmpDir, { recursive: true })

  const lang = (language || 'javascript').toLowerCase()
  let codeFile, runnerFile, runnerContent, dockerCompileCmd, dockerRunCmd

  if (lang === 'python' || lang === 'py') {
    codeFile = 'solution.py'
    runnerFile = 'runner.py'
    runnerContent = buildPyRunner(testCases)
    dockerCompileCmd = null
    dockerRunCmd = ['python3', './runner.py']
  } else if (lang === 'cpp' || lang === 'c++') {
    codeFile = 'solution.cpp'
    runnerFile = 'runner.cpp'
    runnerContent = buildCppRunner(testCases, code)
    dockerCompileCmd = ['g++', '-O0', '-std=c++20', './runner.cpp', '-o', '/sandbox/runner']
    dockerRunCmd = ['/sandbox/runner']
  } else if (lang === 'java') {
    codeFile = 'Solution.java'
    runnerFile = 'Runner.java'
    runnerContent = buildJavaRunner(testCases)
    dockerCompileCmd = ['javac', '-d', '/sandbox', './Solution.java', './Runner.java']
    dockerRunCmd = ['java', '-Xmx400m', '-cp', '/sandbox', 'Runner']
  } else {
    codeFile = 'solution.js'
    runnerFile = 'runner.js'
    runnerContent = buildJsRunner(testCases)
    dockerCompileCmd = null
    dockerRunCmd = ['node', './runner.js']
  }

  let userCodeToWrite = code
  if (lang === 'java') {
    // Strip any import lines the user already wrote, then prepend a canonical
    // set at the top of Solution.java — prevents duplicate/nested import errors.
    const strippedCode = code
      .split('\n')
      .filter(line => !line.trimStart().startsWith('import '))
      .join('\n')
    const javaImports = [
      'import java.util.*;',
      'import java.util.stream.*;',
      'import java.lang.reflect.*;',
      '',
    ].join('\n')
    userCodeToWrite = javaImports + strippedCode
  }

  try {
    // ── Development Debug Logging ───────────────────────────────
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_SANDBOX) {
      console.log('\n[Sandbox Debug] Compiling/Running Code');
      console.log('Language:', lang);
      console.log('Test Input (Sample):', testCases[0]?.input);
      console.log('--- Source Code Reaching Compiler ---');
      console.log(userCodeToWrite);
      console.log('-------------------------------------\n');
    } else {
      console.log(`[Sandbox] Running code lang=${lang} tests=${testCases.length}`);
    }

    // ── Write user code and runner to temp dir ─────────────────
    console.log("SANDBOX TMP DIR IS:", tmpDir);
    fs.writeFileSync(path.join(tmpDir, codeFile), userCodeToWrite, 'utf8')
    fs.writeFileSync(path.join(tmpDir, runnerFile), runnerContent, 'utf8')
    fs.writeFileSync(path.join(tmpDir, 'test_cases.json'), JSON.stringify(testCases), 'utf8')

    // ── docker run with all security flags ─────────────────────
    const baseDockerArgs = [
      'run',
      '--network', 'none',            // no internet
      '--memory', '512m',            // 512 MB RAM cap (needed for C++ / Java compilation)
      '--memory-swap', '512m',            // no swap
      '--cpus', '0.5',             // half a CPU core
      '--pids-limit', '50',              // fork bomb prevention
      '--read-only',                      // immutable root filesystem
      '--tmpfs', '/tmp:exec,nosuid,nodev,size=64m', // scratch & binary execution permitted in tmpfs
      '--rm',                             // auto-remove after exit
      '--user', 'sandbox',         // run as non-root
      '-w', '/sandbox',                  // workdir
    ]

    const timeout = timeLimitMs ? Math.max(TIMEOUT_MS, timeLimitMs) : TIMEOUT_MS
    const startTime = Date.now()

    let stdout
    let isDockerUnavailable = false

    // ── 1. Explicit Compilation Phase ────────────────────────────
    if (dockerCompileCmd) {
      const compileArgs = [...baseDockerArgs, '-v', `${tmpDir}:/sandbox:rw`, DOCKER_IMAGE, ...dockerCompileCmd]
      try {
        await spawnWithTimeout('docker', compileArgs, 15000)
      } catch (err) {
        const msg = String(err.message || err.stderr || '')
        if (
          msg.includes('Cannot connect to the Docker daemon') ||
          msg.includes('failed to connect to the docker API') ||
          msg.includes('connect: no such file or directory') ||
          msg.includes('ENOENT') || msg.includes('not found') || msg.includes('docker:')
        ) {
          isDockerUnavailable = true
        } else {
          return makeErrorResult('COMPILATION_ERROR', testCases, err.message, Date.now() - startTime)
        }
      }
    }

    let overallVerdict = 'ACCEPTED'
    let passedCount = 0
    const testResults = []
    let fatalError = null

    const onStdoutLine = (line) => {
      try {
        const r = JSON.parse(line)
        if (r.fatal) {
          fatalError = r.fatal
          return
        }
        if (r.index !== undefined) {
          const passed = !r.error && compareOutputs(r.actual, r.expected)
          if (passed) {
            passedCount++
          } else if (overallVerdict === 'ACCEPTED') {
            overallVerdict = r.error ? 'RUNTIME_ERROR' : 'WRONG_ANSWER'
          }
          const tr = {
            testIndex: r.index,
            passed,
            input: r.isHidden ? '[Hidden]' : (testCases[r.index - 1]?.input ?? ''),
            expected: r.isHidden ? '[Hidden]' : r.expected,
            actual: r.isHidden ? (passed ? '[Passed]' : '[Failed]') : (r.actual ?? '[null]'),
            error: r.error || null,
            isHidden: r.isHidden,
            runtimeMs: r.runtimeMs || 0,
            totalTests: testCases.length,
          }
          testResults.push(tr)
          if (typeof onProgress === 'function') {
            onProgress(tr)
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // ── 2. Explicit Execution Phase ──────────────────────────────
    if (!isDockerUnavailable) {
      const runArgs = [...baseDockerArgs, '-v', `${tmpDir}:/sandbox:ro`, DOCKER_IMAGE, ...dockerRunCmd]
      try {
        stdout = await spawnWithTimeout('docker', runArgs, timeout, { onStdoutLine })
      } catch (err) {
        if (err.timedOut) {
          return makeErrorResult('TIME_LIMIT_EXCEEDED', testCases,
            `Time limit exceeded (${timeout}ms)`, timeout)
        }
        const msg = String(err.message || err.stderr || '')
        if (
          msg.includes('Cannot connect to the Docker daemon') ||
          msg.includes('failed to connect to the docker API') ||
          msg.includes('connect: no such file or directory') ||
          msg.includes('ENOENT') || msg.includes('not found') || msg.includes('docker:')
        ) {
          isDockerUnavailable = true
        } else {
          return makeErrorResult('RUNTIME_ERROR', testCases, err.message, Date.now() - startTime)
        }
      }
    }

    if (isDockerUnavailable) {
      // Fallback: direct runner execution (e.g. inside Railway / cloud container without host Docker socket)
      if (dockerCompileCmd) {
        let localCompileCmd = dockerCompileCmd[0]
        let localCompileArgs = dockerCompileCmd.slice(1).map(arg =>
          arg.replace(new RegExp('/sandbox', 'g'), tmpDir)
        )
        if (lang === 'cpp' || lang === 'c++') {
          const nlohmannDir = path.join(__dirname, 'nlohmann')
          if (fs.existsSync(nlohmannDir)) {
            localCompileArgs.unshift('-I', __dirname)
          }
        }
        try {
          await spawnWithTimeout(localCompileCmd, localCompileArgs, 15000, { cwd: tmpDir })
        } catch (err) {
          return makeErrorResult('COMPILATION_ERROR', testCases, err.message, Date.now() - startTime)
        }
      }

      const localCmd = dockerRunCmd[0].replace(new RegExp('/sandbox', 'g'), tmpDir)
      const localArgs = dockerRunCmd.slice(1).map(arg =>
        arg.replace(new RegExp('/sandbox', 'g'), tmpDir)
      )
      try {
        stdout = await spawnWithTimeout(localCmd, localArgs, TIMEOUT_MS, { cwd: tmpDir, onStdoutLine })
      } catch (err) {
        if (err.timedOut) {
          return makeErrorResult('TIME_LIMIT_EXCEEDED', testCases,
            `Time limit exceeded (${TIMEOUT_MS}ms)`, TIMEOUT_MS)
        }
        return makeErrorResult('RUNTIME_ERROR', testCases, err.message, Date.now() - startTime)
      }
    }

    const totalRuntimeMs = Date.now() - startTime

    if (fatalError) {
      return makeErrorResult('RUNTIME_ERROR', testCases, fatalError, totalRuntimeMs)
    }

    // Fill remaining tests if runner exited early (crash mid-loop)
    for (let i = testResults.length; i < testCases.length; i++) {
      if (overallVerdict === 'ACCEPTED') overallVerdict = 'RUNTIME_ERROR'
      testResults.push({
        testIndex: i + 1,
        passed: false,
        input: testCases[i].is_hidden ? '[Hidden]' : testCases[i].input,
        expected: testCases[i].is_hidden ? '[Hidden]' : testCases[i].output,
        actual: '[No output — runner exited early]',
        error: 'Runner exited before completing all test cases',
        isHidden: testCases[i].is_hidden,
        runtimeMs: 0,
      })
    }

    return {
      verdict: overallVerdict,
      totalTests: testCases.length,
      passedTests: passedCount,
      runtimeMs: totalRuntimeMs,
      testResults,
    }

  } finally {
    // Always clean up temp dir — belt-and-suspenders in case Docker also leaves files
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* best effort */ }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SELF-TEST MODE
   node sandbox.js --test [--test-network]
═══════════════════════════════════════════════════════════════════ */
if (require.main === module) {
  const argv = process.argv.slice(2)
  if (!argv.includes('--test')) {
    console.log('Usage: node sandbox.js --test [--test-network]')
    process.exit(0)
  }

  ; (async () => {
    console.log('\n══════ AlgoArena Sandbox Self-Test ══════\n')

    // ── Test 1: Correct JavaScript solution ─────────────────────
    console.log('Test 1 — Correct JS (Two Sum, HashMap):')
    const r1 = await runSandbox({
      language: 'javascript',
      code: `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
}`,
      testCases: [
        { input: '[2,7,11,15], 9', output: '[0,1]', is_hidden: false },
        { input: '[3,2,4], 6', output: '[1,2]', is_hidden: false },
        { input: '[3,3], 6', output: '[0,1]', is_hidden: false },
      ],
    })
    console.log(
      `  verdict=${r1.verdict}  passed=${r1.passedTests}/${r1.totalTests}  ms=${r1.runtimeMs}`,
      r1.verdict === 'ACCEPTED' ? '✓' : '✗ EXPECTED ACCEPTED'
    )

    // ── Test 2: Wrong answer ─────────────────────────────────────
    console.log('\nTest 2 — Wrong answer JS:')
    const r2 = await runSandbox({
      language: 'javascript',
      code: `function solution(nums, target) { return [0, 0]; }`,
      testCases: [{ input: '[2,7,11,15], 9', output: '[0,1]', is_hidden: false }],
    })
    console.log(
      `  verdict=${r2.verdict}`,
      r2.verdict === 'WRONG_ANSWER' ? '✓' : '✗ EXPECTED WRONG_ANSWER'
    )

    // ── Test 3: Infinite loop → TIME_LIMIT_EXCEEDED ──────────────
    console.log('\nTest 3 — Infinite loop → TLE (wait ~5s):')
    const r3 = await runSandbox({
      language: 'javascript',
      code: `function solution() { while(true) {} }`,
      testCases: [{ input: '[]', output: '0', is_hidden: false }],
    })
    console.log(
      `  verdict=${r3.verdict}  ms=${r3.runtimeMs}`,
      r3.verdict === 'TIME_LIMIT_EXCEEDED' ? '✓' : '✗ EXPECTED TLE'
    )

    // ── Test 4: Runtime error ────────────────────────────────────
    console.log('\nTest 4 — Runtime error JS:')
    const r4 = await runSandbox({
      language: 'javascript',
      code: `function solution(nums) { return nums.nonExistentMethod(); }`,
      testCases: [{ input: '[1,2]', output: '0', is_hidden: false }],
    })
    console.log(
      `  verdict=${r4.verdict}`,
      r4.verdict === 'RUNTIME_ERROR' ? '✓' : '✗ EXPECTED RUNTIME_ERROR'
    )

    // ── Test 5: Correct Python solution ──────────────────────────
    console.log('\nTest 5 — Correct Python (Two Sum):')
    const r5 = await runSandbox({
      language: 'python',
      code: `def solution(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i`,
      testCases: [
        { input: '[2,7,11,15], 9', output: '[0,1]', is_hidden: false },
        { input: '[3,2,4], 6', output: '[1,2]', is_hidden: false },
      ],
    })
    console.log(
      `  verdict=${r5.verdict}  passed=${r5.passedTests}/${r5.totalTests}`,
      r5.verdict === 'ACCEPTED' ? '✓' : '✗ EXPECTED ACCEPTED'
    )

    // ── Test 6: Network blocked (optional) ───────────────────────
    if (argv.includes('--test-network')) {
      console.log('\nTest 6 — Network blocked (JS fetch attempt):')
      const r6 = await runSandbox({
        language: 'javascript',
        code: `const https = require('https');
function solution() {
  return new Promise((res, rej) => {
    https.get('https://example.com', () => res('connected'))
         .on('error', e => rej(e));
  });
}`,
        testCases: [{ input: '[]', output: '"blocked"', is_hidden: false }],
      })
      console.log(
        `  verdict=${r6.verdict}`,
        (r6.verdict === 'WRONG_ANSWER' || r6.verdict === 'RUNTIME_ERROR') ? '✓ (network blocked)' : '✗ NETWORK NOT BLOCKED'
      )
    }

    console.log('\n══════ Self-test complete ══════\n')
  })().catch(err => {
    console.error('[Self-test fatal]', err.message)
    process.exit(1)
  })
}

module.exports = { runSandbox, compareOutputs }
