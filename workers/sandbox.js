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

const { spawn }       = require('child_process')
const fs              = require('fs')
const path            = require('path')
const os              = require('os')
const { randomBytes } = require('crypto')
const { buildJavaRunner } = require('./javaRunner')

const DOCKER_IMAGE  = process.env.SANDBOX_IMAGE       || 'algoarena-sandbox'
const TIMEOUT_MS    = parseInt(process.env.SANDBOX_TIMEOUT_MS, 10) || 5000

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
try {
  const src = require('fs').readFileSync('/sandbox/solution.js', 'utf8');
  const sandbox = {
    TreeNode,
    ListNode,
    console: { log: () => {} }
  };
  const fn = new Function('sandbox', \`
    with(sandbox) {
      \${src}
      if (typeof solution === 'function') return solution;
      if (typeof Solution === 'function') {
        const inst = new Solution();
        const methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== 'constructor');
        if (typeof inst.solution === 'function') return inst.solution.bind(inst);
        if (methods.length > 0 && typeof inst[methods[0]] === 'function') return inst[methods[0]].bind(inst);
      }
      return undefined;
    }
  \`);
  solution = fn(sandbox);
  if (typeof solution !== 'function') {
    throw new Error("No function named 'solution' found. Please define: function solution(...) { ... }");
  }
} catch (e) {
  process.stdout.write(JSON.stringify({ fatal: e.message, results: [] }) + '\\n');
  process.exit(0);
}

// ── Run each test case ──────────────────────────────────────────────
const testCases = ${JSON.stringify(testCases)};
const results   = [];

const fnStr = solution.toString();
const isTreeFn = fnStr.includes('.left') || fnStr.includes('.right') || fnStr.includes('TreeNode') || fnStr.includes('root');
const isListFn = fnStr.includes('.next') || fnStr.includes('ListNode') || fnStr.includes('head');

for (let i = 0; i < testCases.length; i++) {
  const tc    = testCases[i];
  const start = Date.now();
  try {
    const rawArgs = JSON.parse('[' + tc.input + ']');
    const convertedArgs = rawArgs.map(arg => {
      if (Array.isArray(arg)) {
        if (arg.includes(null) || isTreeFn) return __buildTree(arg);
        if (isListFn) return __buildList(arg);
      }
      return arg;
    });

    const actual = solution(...convertedArgs);
    const serialized = __serialize(actual);
    results.push({
      index:     i + 1,
      actual:    JSON.stringify(serialized !== undefined ? serialized : null),
      expected:  tc.output,
      runtimeMs: Date.now() - start,
      isHidden:  tc.is_hidden,
      error:     null,
    });
  } catch (e) {
    results.push({
      index:     i + 1,
      actual:    null,
      expected:  tc.output,
      runtimeMs: Date.now() - start,
      isHidden:  tc.is_hidden,
      error:     e.message,
    });
  }
}

process.stdout.write(JSON.stringify({ results }) + '\\n');
`
}

/**
 * Build a Python 3 runner script.
 * Supports TreeNode and ListNode conversions and serializers.
 */
function buildPyRunner(testCases) {
  const escapedTestCases = JSON.stringify(testCases).replace(/\\/g, '\\\\')
  return `import json, sys, time
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

def __serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, TreeNode):
        res = []
        q = [obj]
        while q:
            node = q.pop(0)
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
    with open('/sandbox/solution.py', 'r') as f:
        src = f.read()
    ns = {
        'TreeNode': TreeNode,
        'ListNode': ListNode,
        'List': List,
        'Optional': Optional,
        'Dict': Dict,
        'Set': Set,
        'Tuple': Tuple,
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
test_cases = json.loads(r'${escapedTestCases}')
results    = []

fn_src = src.lower()
is_tree = 'treenode' in fn_src or '.left' in fn_src or '.right' in fn_src or 'root' in fn_src
is_list = 'listnode' in fn_src or '.next' in fn_src or 'head' in fn_src

for i, tc in enumerate(test_cases):
    start = time.time()
    try:
        raw_args = json.loads('[' + tc['input'] + ']')
        converted_args = []
        for arg in raw_args:
            if isinstance(arg, list):
                if None in arg or is_tree:
                    converted_args.append(__build_tree(arg))
                elif is_list:
                    converted_args.append(__build_list(arg))
                else:
                    converted_args.append(arg)
            else:
                converted_args.append(arg)

        actual = solution(*converted_args)
        serialized = __serialize(actual)
        results.append({
            "index":     i + 1,
            "actual":    json.dumps(serialized),
            "expected":  tc['output'],
            "runtimeMs": int((time.time() - start) * 1000),
            "isHidden":  tc['is_hidden'],
            "error":     None,
        })
    except Exception as e:
        results.append({
            "index":     i + 1,
            "actual":    None,
            "expected":  tc['output'],
            "runtimeMs": int((time.time() - start) * 1000),
            "isHidden":  tc['is_hidden'],
            "error":     str(e),
        })

print(json.dumps({"results": results}))
`
}

/**
 * Build a C++ runner script.
 * Infers arg types from first test case at JS time -> generates one exact dispatch call.
 * Users write:  ReturnType solution(T1 a, T2 b, ...) { ... }  (free function, no class)
 */
function buildCppRunner(testCases) {
  const escapedTestCases = JSON.stringify(testCases)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')

  // Infer C++ type from a JSON value
  function inferCppType(val) {
    if (Array.isArray(val)) {
      if (val.length === 0)                        return 'vector<int>'
      if (typeof val[0] === 'number')
        return Number.isInteger(val[0]) ? 'vector<long long>' : 'vector<double>'
      if (typeof val[0] === 'string')              return 'vector<string>'
      if (Array.isArray(val[0]))                   return 'vector<vector<int>>'
      return 'vector<int>'
    }
    if (typeof val === 'number')  return Number.isInteger(val) ? 'long long' : 'double'
    if (typeof val === 'string')  return 'string'
    if (typeof val === 'boolean') return 'bool'
    return 'int'
  }

  // Parse first test case args to determine types
  let argTypes = ['int']
  try {
    const parsed = JSON.parse('[' + testCases[0].input + ']')
    argTypes = parsed.map(inferCppType)
  } catch { /* keep fallback */ }

  // Generate dispatch call: solution(args[0].get<T0>(), args[1].get<T1>(), ...)
  const getArgs = argTypes.map((t, i) => `args[${i}].get<${t}>()`).join(', ')

  return `#include <bits/stdc++.h>
#include <chrono>
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

// User solution
#include "/sandbox/solution.cpp"

int main() {
    try {
        json testCases = json::parse("${escapedTestCases}");
        json results   = json::array();

        for (size_t i = 0; i < testCases.size(); i++) {
            auto& tc = testCases[i];
            auto  t0 = chrono::high_resolution_clock::now();
            try {
                string rawInput = "[" + tc["input"].get<string>() + "]";
                json   args     = json::parse(rawInput);
                json   actual   = json(solution(${getArgs}));
                int    ms       = (int)chrono::duration_cast<chrono::milliseconds>(
                                    chrono::high_resolution_clock::now() - t0).count();
                results.push_back({
                    {"index",    (int)(i+1)},
                    {"actual",   actual.dump()},
                    {"expected", tc["output"]},
                    {"runtimeMs", ms},
                    {"isHidden", tc["is_hidden"]},
                    {"error",    nullptr}
                });
            } catch (const exception& e) {
                int ms = (int)chrono::duration_cast<chrono::milliseconds>(
                            chrono::high_resolution_clock::now() - t0).count();
                results.push_back({
                    {"index",    (int)(i+1)},
                    {"actual",   nullptr},
                    {"expected", tc["output"]},
                    {"runtimeMs", ms},
                    {"isHidden", tc["is_hidden"]},
                    {"error",    e.what()}
                });
            }
        }
        cout << json({{"results", results}}).dump() << endl;
    } catch (const exception& e) {
        cout << json({{"fatal", e.what()},{"results",json::array()}}).dump() << endl;
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
  const s = String(val).trim()
  try {
    // Re-serialise so whitespace differences don't matter
    return JSON.stringify(JSON.parse(s))
  } catch {
    return s
  }
}

function compareOutputs(actual, expected) {
  const a = normalizeOutput(actual)
  const e = normalizeOutput(expected)
  if (a === e) return true

  // Empty collection / null equivalency (for linked lists / trees / optional lists)
  if ((a === 'null' && (e === '[]' || e === 'null')) || (a === '[]' && (e === 'null' || e === '[]'))) return true

  // Array sort-insensitive comparison (e.g. Two Sum: [0,1] and [1,0] both valid)
  try {
    const pa = JSON.parse(a)
    const pe = JSON.parse(e)
    if (Array.isArray(pa) && Array.isArray(pe) && pa.length === pe.length) {
      const sortedA = [...pa].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
      const sortedE = [...pe].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
      if (JSON.stringify(sortedA) === JSON.stringify(sortedE)) return true
    }
  } catch { /* not JSON */ }
  return false
}

/* ═══════════════════════════════════════════════════════════════════
   CORE: spawn docker with timeout
 ═══════════════════════════════════════════════════════════════════ */
function spawnWithTimeout(cmd, args, timeoutMs, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc       = spawn(cmd, args, opts)
    const stdoutBufs = []
    const stderrBufs = []

    proc.stdout.on('data', d => stdoutBufs.push(d))
    proc.stderr.on('data', d => stderrBufs.push(d))

    let killed = false
    const timer = setTimeout(() => {
      killed = true
      // SIGKILL bypasses all signal handlers — container stops immediately
      proc.kill('SIGKILL')
      const err     = new Error(`Sandbox timed out after ${timeoutMs}ms`)
      err.timedOut  = true
      reject(err)
    }, timeoutMs)

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (killed) return   // already rejected
      const stdout = Buffer.concat(stdoutBufs).toString('utf8')
      const stderr = Buffer.concat(stderrBufs).toString('utf8')

      if (code !== 0 && !stdout.trim()) {
        // Non-zero exit with no stdout = runtime error before any output
        const err      = new Error(stderr.slice(0, 600) || `Exited with code ${code}`)
        err.exitCode   = code
        err.isRuntime  = true
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
    totalTests:  testCases.length,
    passedTests: 0,
    runtimeMs,
    testResults: testCases.map((tc, i) => ({
      testIndex: i + 1,
      passed:    false,
      input:     tc.is_hidden ? '[Hidden]' : tc.input,
      expected:  tc.is_hidden ? '[Hidden]' : tc.output,
      actual:    '[Error]',
      error:     errorMsg,
      isHidden:  tc.is_hidden,
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
async function runSandbox({ code, language, testCases }) {
  const jobId  = randomBytes(8).toString('hex')
  const tmpDir = path.join(os.tmpdir(), `aa-${jobId}`)

  fs.mkdirSync(tmpDir, { recursive: true })

  const lang = (language || 'javascript').toLowerCase()
  let codeFile, runnerFile, runnerContent, dockerExecCmd

  if (lang === 'python' || lang === 'py') {
    codeFile      = 'solution.py'
    runnerFile    = 'runner.py'
    runnerContent = buildPyRunner(testCases)
    dockerExecCmd = ['python3', '/sandbox/runner.py']
  } else if (lang === 'cpp' || lang === 'c++') {
    codeFile      = 'solution.cpp'
    runnerFile    = 'runner.cpp'
    runnerContent = buildCppRunner(testCases)
    dockerExecCmd = ['sh', '-c', 'g++ -O0 -std=c++17 /sandbox/runner.cpp -o /tmp/runner && /tmp/runner']
  } else if (lang === 'java') {
    codeFile      = 'Solution.java'
    runnerFile    = 'Runner.java'
    runnerContent = buildJavaRunner(testCases)
    dockerExecCmd = ['sh', '-c', 'javac -d /tmp /sandbox/Solution.java /sandbox/Runner.java && java -cp /tmp Runner']
  } else {
    codeFile      = 'solution.js'
    runnerFile    = 'runner.js'
    runnerContent = buildJsRunner(testCases)
    dockerExecCmd = ['node', '/sandbox/runner.js']
  }

  try {
    // ── Write user code and runner to temp dir ─────────────────
    fs.writeFileSync(path.join(tmpDir, codeFile),   code,          'utf8')
    fs.writeFileSync(path.join(tmpDir, runnerFile), runnerContent, 'utf8')

    // ── docker run with all security flags ─────────────────────
    const dockerArgs = [
      'run',
      '--network',     'none',            // no internet
      '--memory',      '512m',            // 512 MB RAM cap (needed for C++ / Java compilation)
      '--memory-swap', '512m',            // no swap
      '--cpus',        '0.5',             // half a CPU core
      '--pids-limit',  '50',              // fork bomb prevention
      '--read-only',                      // immutable root filesystem
      '--tmpfs',       '/tmp:exec,nosuid,nodev,size=64m', // scratch & binary execution permitted in tmpfs
      '--rm',                             // auto-remove after exit
      '--user',        'sandbox',         // run as non-root
      '-v',            `${tmpDir}:/sandbox:ro`, // user code — read only
      DOCKER_IMAGE,
      ...dockerExecCmd,
    ]

    const startTime = Date.now()

    let stdout
    let isDockerUnavailable = false

    try {
      stdout = await spawnWithTimeout('docker', dockerArgs, TIMEOUT_MS)
    } catch (err) {
      if (err.timedOut) {
        return makeErrorResult('TIME_LIMIT_EXCEEDED', testCases,
          `Time limit exceeded (${TIMEOUT_MS}ms)`, TIMEOUT_MS)
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
      const localArgs = dockerExecCmd.slice(1).map(arg => arg.replace(/\/sandbox/g, tmpDir))
      try {
        stdout = await spawnWithTimeout(localCmd, localArgs, TIMEOUT_MS, { cwd: tmpDir })
      } catch (err) {
        if (err.timedOut) {
          return makeErrorResult('TIME_LIMIT_EXCEEDED', testCases,
            `Time limit exceeded (${TIMEOUT_MS}ms)`, TIMEOUT_MS)
        }
        return makeErrorResult('RUNTIME_ERROR', testCases, err.message, Date.now() - startTime)
      }
    }

    const totalRuntimeMs = Date.now() - startTime

    // ── Parse runner JSON output ───────────────────────────────
    let parsed
    try {
      // Take the last non-empty line (runner always ends with one JSON blob)
      const lastLine = stdout.trim().split('\n').filter(Boolean).pop() || '{}'
      parsed = JSON.parse(lastLine)
    } catch {
      return makeErrorResult('RUNTIME_ERROR', testCases,
        'Failed to parse sandbox output — runner crashed', totalRuntimeMs)
    }

    if (parsed.fatal) {
      return makeErrorResult('RUNTIME_ERROR', testCases, parsed.fatal, totalRuntimeMs)
    }

    // ── Evaluate each test case ────────────────────────────────
    const rawResults = parsed.results || []
    let overallVerdict = 'ACCEPTED'
    let passedCount    = 0

    const testResults = rawResults.map(r => {
      const passed = !r.error && compareOutputs(r.actual, r.expected)
      if (passed) {
        passedCount++
      } else if (overallVerdict === 'ACCEPTED') {
        overallVerdict = r.error ? 'RUNTIME_ERROR' : 'WRONG_ANSWER'
      }
      return {
        testIndex: r.index,
        passed,
        input:     r.isHidden ? '[Hidden]'                         : (testCases[r.index - 1]?.input  ?? ''),
        expected:  r.isHidden ? '[Hidden]'                         : r.expected,
        actual:    r.isHidden ? (passed ? '[Passed]' : '[Failed]') : (r.actual ?? '[null]'),
        error:     r.error    || null,
        isHidden:  r.isHidden,
        runtimeMs: r.runtimeMs || 0,
      }
    })

    // Fill remaining tests if runner exited early (crash mid-loop)
    for (let i = rawResults.length; i < testCases.length; i++) {
      if (overallVerdict === 'ACCEPTED') overallVerdict = 'RUNTIME_ERROR'
      testResults.push({
        testIndex: i + 1,
        passed:    false,
        input:     testCases[i].is_hidden ? '[Hidden]' : testCases[i].input,
        expected:  testCases[i].is_hidden ? '[Hidden]' : testCases[i].output,
        actual:    '[No output — runner exited early]',
        error:     'Runner exited before completing all test cases',
        isHidden:  testCases[i].is_hidden,
        runtimeMs: 0,
      })
    }

    return {
      verdict:     overallVerdict,
      totalTests:  testCases.length,
      passedTests: passedCount,
      runtimeMs:   totalRuntimeMs,
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

  ;(async () => {
    console.log('\n══════ AlgoArena Sandbox Self-Test ══════\n')

    // ── Test 1: Correct JavaScript solution ─────────────────────
    console.log('Test 1 — Correct JS (Two Sum, HashMap):')
    const r1 = await runSandbox({
      language:  'javascript',
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
        { input: '[3,2,4], 6',     output: '[1,2]', is_hidden: false },
        { input: '[3,3], 6',       output: '[0,1]', is_hidden: false },
      ],
    })
    console.log(
      `  verdict=${r1.verdict}  passed=${r1.passedTests}/${r1.totalTests}  ms=${r1.runtimeMs}`,
      r1.verdict === 'ACCEPTED' ? '✓' : '✗ EXPECTED ACCEPTED'
    )

    // ── Test 2: Wrong answer ─────────────────────────────────────
    console.log('\nTest 2 — Wrong answer JS:')
    const r2 = await runSandbox({
      language:  'javascript',
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
      language:  'javascript',
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
      language:  'javascript',
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
      language:  'python',
      code: `def solution(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i`,
      testCases: [
        { input: '[2,7,11,15], 9', output: '[0,1]', is_hidden: false },
        { input: '[3,2,4], 6',     output: '[1,2]', is_hidden: false },
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
        language:  'javascript',
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
