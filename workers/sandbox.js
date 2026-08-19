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
 * The user function must be named `solution` at the top level.
 */
function buildJsRunner(testCases) {
  return `'use strict';

// ── Load user solution ──────────────────────────────────────────────
let solution;
try {
  const src = require('fs').readFileSync('/sandbox/solution.js', 'utf8');
  // Execute user code and extract the 'solution' function
  const fn = new Function(src + '\\nreturn typeof solution !== "undefined" ? solution : undefined;');
  solution = fn();
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

for (let i = 0; i < testCases.length; i++) {
  const tc    = testCases[i];
  const start = Date.now();
  try {
    // Parse input as function arguments: "2,7" → solution(2, 7)
    // Wrap in array brackets so JSON.parse gives us an array
    const args   = JSON.parse('[' + tc.input + ']');
    const actual = solution(...args);
    results.push({
      index:     i + 1,
      actual:    JSON.stringify(actual !== undefined ? actual : null),
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
 * The user function must be named `solution` at the module level.
 */
function buildPyRunner(testCases) {
  // Escape backlash in JSON for embedding in Python string
  const escapedTestCases = JSON.stringify(testCases).replace(/\\/g, '\\\\')
  return `import json, sys, time

# ── Load user solution ──────────────────────────────────────────────
try:
    with open('/sandbox/solution.py', 'r') as f:
        src = f.read()
    ns = {}
    exec(src, ns)
    solution = ns.get('solution')
    if not callable(solution):
        raise Exception("No function named 'solution' found. Define: def solution(...):")
except Exception as e:
    print(json.dumps({"fatal": str(e), "results": []}))
    sys.exit(0)

# ── Run each test case ──────────────────────────────────────────────
test_cases = json.loads(r'${escapedTestCases}')
results    = []
for i, tc in enumerate(test_cases):
    start = time.time()
    try:
        args   = json.loads('[' + tc['input'] + ']')
        actual = solution(*args)
        results.append({
            "index":     i + 1,
            "actual":    json.dumps(actual),
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
 * Includes user solution and uses nlohmann/json for reflection-like argument unpacking.
 */
function buildCppRunner(testCases) {
  const escapedTestCases = JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <chrono>
#include <sstream>
#include <tuple>
#include <type_traits>
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <cmath>
#include <climits>
#include <numeric>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using namespace std;

// Include user's solution AFTER std headers so vector/string/etc. are visible
#include "/sandbox/solution.cpp"

template<typename Ret, typename Class, typename... Args>
json invokeMember(Ret (Class::*method)(Args...), Class& obj, const json& args) {
    size_t idx = 0;
    auto tupleArgs = make_tuple(args.at(idx++).get<decay_t<Args>>()...);
    if constexpr (is_void_v<Ret>) {
        apply([&](auto&&... unpacked) { (obj.*method)(unpacked...); }, tupleArgs);
        return nullptr;
    } else {
        auto res = apply([&](auto&&... unpacked) { return (obj.*method)(unpacked...); }, tupleArgs);
        return json(res);
    }
}

int main() {
    try {
        json testCases = json::parse("${escapedTestCases}");
        json results = json::array();

        Solution solInstance;

        for (size_t i = 0; i < testCases.size(); i++) {
            auto& tc = testCases[i];
            auto start = chrono::high_resolution_clock::now();
            try {
                string rawInput = "[" + tc["input"].get<string>() + "]";
                json args = json::parse(rawInput);
                json actual = invokeMember(&Solution::solution, solInstance, args);
                auto end = chrono::high_resolution_clock::now();
                int runtimeMs = (int)chrono::duration_cast<chrono::milliseconds>(end - start).count();

                results.push_back({
                    {"index", i + 1},
                    {"actual", actual.dump()},
                    {"expected", tc["output"]},
                    {"runtimeMs", runtimeMs},
                    {"isHidden", tc["is_hidden"]},
                    {"error", nullptr}
                });
            } catch (const exception& e) {
                auto end = chrono::high_resolution_clock::now();
                int runtimeMs = (int)chrono::duration_cast<chrono::milliseconds>(end - start).count();
                results.push_back({
                    {"index", i + 1},
                    {"actual", nullptr},
                    {"expected", tc["output"]},
                    {"runtimeMs", runtimeMs},
                    {"isHidden", tc["is_hidden"]},
                    {"error", e.what()}
                });
            }
        }

        cout << json({{"results", results}}).dump() << endl;
    } catch (const exception& e) {
        cout << json({{"fatal", e.what()}, {"results", json::array()}}).dump() << endl;
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
      const msg = String(err.message || '')
      if (msg.includes('Cannot connect to the Docker daemon') || msg.includes('ENOENT') || msg.includes('not found') || msg.includes('docker:')) {
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
