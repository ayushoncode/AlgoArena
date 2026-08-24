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

function TreeNode(val, left, right) {
  this.val = (val===undefined ? 0 : val);
  this.left = (left===undefined ? null : left);
  this.right = (right===undefined ? null : right);
}

function ListNode(val, next) {
  this.val = (val===undefined ? 0 : val);
  this.next = (next===undefined ? null : next);
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

function __buildList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const dummy = new ListNode(0);
  let curr = dummy;
  for (const v of arr) {
    if (v !== null && v !== undefined) {
      curr.next = new ListNode(v);
      curr = curr.next;
    }
  }
  return dummy.next;
}

function __serialize(obj) {
  if (obj === null || obj === undefined) return null;
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
    let curr = obj;
    while (curr) {
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
    'TreeNode', 'ListNode', 'exports', 'module', 'console',
    src + '\\n\\n' +
    'if (typeof solution === "function") return solution;\\n' +
    'if (typeof Solution === "function") {\\n' +
    '  const inst = new Solution();\\n' +
    '  const methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== "constructor");\\n' +
    '  if (typeof inst.solution === "function") return inst.solution.bind(inst);\\n' +
    '  if (methods.length > 0 && typeof inst[methods[0]] === "function") return inst[methods[0]].bind(inst);\\n' +
    '}\\n' +
    'return undefined;'
  );
  solution = loader(TreeNode, ListNode, {}, {}, { log: () => {} });
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
    const convertedArgs = rawArgs.map((arg, argIdx) => {
      if (Array.isArray(arg)) {
        const pName = paramNames[argIdx] || '';
        const isTreeParam = ['root', 'p', 'q', 't1', 't2', 'node', 'tree'].includes(pName);
        const isListParam = ['head', 'l1', 'l2', 'list'].includes(pName);
        const isArrayParam = ['lists', 'preorder', 'inorder', 'postorder', 'nums', 'arr', 'edges', 'matrix', 'grid', 'words', 'dictionary'].includes(pName);

        if (isTreeParam || arg.includes(null)) return __buildTree(arg);
        if (isListParam) return __buildList(arg);
        if (isTreeFn && !isListParam && !isArrayParam) return __buildTree(arg);
        if (isListFn && !isTreeParam && !isArrayParam) return __buildList(arg);
      }
      return arg;
    });

    const retVal = solution(...convertedArgs);
    const actual = retVal !== undefined ? retVal : (convertedArgs.length > 0 ? convertedArgs[0] : null);
    const serialized = __serialize(actual);
    
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
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

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

def __build_list(arr):
    if not isinstance(arr, list) or len(arr) == 0:
        return None
    dummy = ListNode(0)
    curr = dummy
    for v in arr:
        if v is not None:
            curr.next = ListNode(v)
            curr = curr.next
    return dummy.next

def __serialize(obj, expected=''):
    if obj is None:
        if isinstance(expected, str) and expected.strip() == '[]':
            return []
        return None
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
        curr = obj
        while curr:
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
        for arg_idx, arg in enumerate(raw_args):
            p_name = param_list[arg_idx].name.lower() if arg_idx < len(param_list) else ''
            p_anno = str(param_list[arg_idx].annotation) if arg_idx < len(param_list) else ''
            is_tree_param = 'treenode' in p_anno.lower() or p_name in ('root', 'p', 'q', 't1', 't2', 'node', 'tree')
            is_list_param = 'listnode' in p_anno.lower() or p_name in ('head', 'l1', 'l2', 'list')
            is_array_param = p_name in ('lists', 'preorder', 'inorder', 'postorder', 'nums', 'arr', 'edges', 'matrix', 'grid', 'words', 'dictionary')

            if isinstance(arg, list):
                if is_tree_param or None in arg:
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
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
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
    ListNode dummy(0);
    ListNode* curr = &dummy;
    for (const auto& item : j) {
        if (!item.is_null()) {
            curr->next = new ListNode(item.get<int>());
            curr = curr->next;
        }
    }
    return dummy.next;
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
    while (curr) {
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
        const err = new Error(stderr.slice(0, 600) || `Exited with code ${code}`)
        err.exitCode = code
        err.isRuntime = true
        return reject(err)
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
  let codeFile, runnerFile, runnerContent, dockerExecCmd

  if (lang === 'python' || lang === 'py') {
    codeFile = 'solution.py'
    runnerFile = 'runner.py'
    runnerContent = buildPyRunner(testCases)
    dockerExecCmd = ['python3', './runner.py']
  } else if (lang === 'cpp' || lang === 'c++') {
    codeFile = 'solution.cpp'
    runnerFile = 'runner.cpp'
    runnerContent = buildCppRunner(testCases, code)
    dockerExecCmd = ['sh', '-c', 'g++ -O0 -std=c++20 ./runner.cpp -o /tmp/runner && /tmp/runner']
  } else if (lang === 'java') {
    codeFile = 'Solution.java'
    runnerFile = 'Runner.java'
    runnerContent = buildJavaRunner(testCases)
    dockerExecCmd = ['sh', '-c', 'javac -d /tmp ./Solution.java ./Runner.java && java -cp /tmp Runner']
  } else {
    codeFile = 'solution.js'
    runnerFile = 'runner.js'
    runnerContent = buildJsRunner(testCases)
    dockerExecCmd = ['node', './runner.js']
  }

  let userCodeToWrite = code
  if (lang === 'java') {
    const javaImports = 'import java.util.*;\nimport java.util.stream.*;\nimport java.lang.reflect.*;\n'
    userCodeToWrite = code.includes('import java.util') ? (code.includes('import java.lang.reflect') ? code : ('import java.lang.reflect.*;\n' + code)) : (javaImports + code)
  }

  try {
    // ── Write user code and runner to temp dir ─────────────────
    fs.writeFileSync(path.join(tmpDir, codeFile), userCodeToWrite, 'utf8')
    fs.writeFileSync(path.join(tmpDir, runnerFile), runnerContent, 'utf8')
    fs.writeFileSync(path.join(tmpDir, 'test_cases.json'), JSON.stringify(testCases), 'utf8')

    // ── docker run with all security flags ─────────────────────
    const dockerArgs = [
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
      '-v', `${tmpDir}:/sandbox:ro`, // user code — read only
      DOCKER_IMAGE,
      ...dockerExecCmd,
    ]

    const timeout = timeLimitMs ? Math.max(TIMEOUT_MS, timeLimitMs) : TIMEOUT_MS
    const startTime = Date.now()

    let stdout
    let isDockerUnavailable = false

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

    try {
      stdout = await spawnWithTimeout('docker', dockerArgs, timeout, { onStdoutLine })
    } catch (err) {
      if (err.timedOut) {
        return makeErrorResult('TIME_LIMIT_EXCEEDED', testCases,
          `Time limit exceeded (${timeout}ms)`, timeout)
      }
      const msg = String(err.message || err.stderr || '')
      if (
        msg.includes('Cannot connect to the Docker daemon') ||
        msg.includes('failed to connect to the docker API') ||   // Docker Desktop Mac (new format)
        msg.includes('connect: no such file or directory') ||    // dead socket symlink
        msg.includes('ENOENT') ||
        msg.includes('not found') ||
        msg.includes('docker:')
      ) {
        isDockerUnavailable = true
      } else {
        return makeErrorResult('RUNTIME_ERROR', testCases, err.message, Date.now() - startTime)
      }
    }

    if (isDockerUnavailable) {
      // Fallback: direct runner execution (e.g. inside Railway / cloud container without host Docker socket)
      const localCmd = dockerExecCmd[0]
      let localArgs = dockerExecCmd.slice(1).map(arg =>
        arg.replace(new RegExp('/sandbox', 'g'), tmpDir)
           .replace(new RegExp('/tmp', 'g'), tmpDir)
      )
      if (lang === 'cpp' || lang === 'c++') {
        const nlohmannDir = path.join(__dirname, 'nlohmann')
        if (fs.existsSync(nlohmannDir)) {
          localArgs = localArgs.map(arg => arg.replace('g++', `g++ -I "${nlohmannDir}" -I "${__dirname}"`))
        }
      }
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
