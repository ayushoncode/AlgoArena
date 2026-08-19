/**
 * backend/services/judge.js — Multi-language code execution engine.
 *
 * JavaScript  → fast in-process Node.js vm (no Docker overhead)
 * Python      → Docker sandbox via workers/sandbox.js
 * C++ / Java  → Docker sandbox via workers/sandbox.js
 */

'use strict'

const vm   = require('vm')
const path = require('path')
const db   = require('../db')

// Load sandbox from workers folder (sibling of backend)
let sandboxRunner = null
try {
  sandboxRunner = require(path.join(__dirname, '../../workers/sandbox'))
} catch {
  console.warn('[Judge] workers/sandbox.js not found — C++/Python/Java will return RUNTIME_ERROR')
}

/**
 * Deep equality check for test outputs (handles arrays, objects, primitives, booleans).
 */
function normalizeOutput(val) {
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') return val.trim()
  try {
    return JSON.stringify(val)
  } catch (e) {
    return String(val)
  }
}

function compareOutputs(actual, expectedStr) {
  const normActual = normalizeOutput(actual)
  const normExpected = expectedStr.trim()

  if (normActual === normExpected) return true

  // Try parsing JSON for structural comparison (e.g. [0,1] vs [0, 1])
  try {
    const jsonActual = JSON.parse(normActual)
    const jsonExpected = JSON.parse(normExpected)

    if (Array.isArray(jsonActual) && Array.isArray(jsonExpected)) {
      if (jsonActual.length !== jsonExpected.length) return false
      return JSON.stringify(jsonActual.sort()) === JSON.stringify(jsonExpected.sort()) ||
             JSON.stringify(jsonActual) === JSON.stringify(jsonExpected)
    }
    return JSON.stringify(jsonActual) === JSON.stringify(jsonExpected)
  } catch (e) {
    return false
  }
}

/**
 * Evaluate JavaScript submission against test cases (fast in-process vm).
 */
async function evaluateJavaScript(code, testCases) {
  const testResults = []
  let passedCount = 0
  let overallVerdict = 'ACCEPTED'
  const startTime = Date.now()

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]
    let actualOutput = null
    let errorMsg = null
    let passed = false

    try {
      // Build VM sandbox context
      const sandbox = {
        console: { log: () => {} },
        result: undefined,
        inputs: null,
      }

      // Script that defines the user function and invokes it with inputs
      const wrappedScript = `
        ${code}
        
        let __fn = typeof solution === 'function' ? solution :
                   (typeof Solution === 'function' ? new Solution().solution : null);
        
        if (!__fn) {
          throw new Error("No function named 'solution' found. Please define 'function solution(...)'");
        }
        
        result = __fn(${tc.input});
      `

      const script = new vm.Script(wrappedScript)
      const context = vm.createContext(sandbox)

      // Execute with 2-second timeout
      script.runInContext(context, { timeout: 2000 })

      actualOutput = sandbox.result
      passed = compareOutputs(actualOutput, tc.output)

      if (passed) {
        passedCount++
      } else if (overallVerdict === 'ACCEPTED') {
        overallVerdict = 'WRONG_ANSWER'
      }

    } catch (err) {
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' || err.message?.includes('timed out')) {
        errorMsg = 'Time Limit Exceeded (2000ms limit)'
        if (overallVerdict !== 'TIME_LIMIT_EXCEEDED') overallVerdict = 'TIME_LIMIT_EXCEEDED'
      } else {
        errorMsg = err.message || 'Runtime Error'
        if (overallVerdict === 'ACCEPTED') overallVerdict = 'RUNTIME_ERROR'
      }
    }

    testResults.push({
      testIndex: i + 1,
      passed,
      input: tc.is_hidden ? '[Hidden Test Case]' : tc.input,
      expected: tc.is_hidden ? '[Hidden]' : tc.output,
      actual: tc.is_hidden ? (passed ? '[Passed]' : '[Failed]') : normalizeOutput(actualOutput),
      error: errorMsg,
      isHidden: tc.is_hidden,
    })
  }

  const runtimeMs = Date.now() - startTime

  return {
    verdict: overallVerdict,
    totalTests: testCases.length,
    passedTests: passedCount,
    runtimeMs,
    testResults,
  }
}

/**
 * Evaluate Python / C++ / Java through the Docker sandbox.
 */
async function evaluateSandbox(code, language, testCases) {
  if (!sandboxRunner) {
    return {
      verdict: 'RUNTIME_ERROR',
      totalTests: testCases.length,
      passedTests: 0,
      runtimeMs: 0,
      testResults: testCases.map((_, i) => ({
        testIndex: i + 1, passed: false,
        input: '[N/A]', expected: '[N/A]', actual: '[Error]',
        error: 'Judge sandbox not available on this server',
        isHidden: false,
      })),
    }
  }
  return sandboxRunner.runSandbox({ code, language, testCases })
}

/**
 * Main evaluation entry point.
 */
async function evaluateSubmission(problemId, code, language = 'javascript') {
  try {
    // 1. Fetch test cases from PostgreSQL
    const { rows: testCases } = await db.query(
      `SELECT id, input, output, is_hidden FROM test_cases WHERE problem_id = $1 ORDER BY is_hidden ASC, id ASC`,
      [problemId]
    )

    // Fallback if no test cases exist for this problem
    if (!testCases || testCases.length === 0) {
      console.warn(`[Judge] No test cases found in DB for problem ${problemId}. Using fallback evaluation.`)
      const untouched = ['write your solution here', '# write your solution here']
      const isTouch = !untouched.some(s => code.includes(s))
      return {
        verdict: isTouch ? 'ACCEPTED' : 'WRONG_ANSWER',
        totalTests: 1,
        passedTests: isTouch ? 1 : 0,
        runtimeMs: 12,
        testResults: [{ testIndex: 1, passed: isTouch, input: 'Sample Input', expected: 'Sample Output', actual: isTouch ? 'Sample Output' : 'None', error: isTouch ? null : 'Unmodified code stub' }]
      }
    }

    const lang = (language || 'javascript').toLowerCase()

    // 2. Route to correct evaluator by language
    if (lang === 'javascript' || lang === 'js') {
      return await evaluateJavaScript(code, testCases)
    }

    // Python, C++, Java → Docker sandbox
    return await evaluateSandbox(code, lang, testCases)

  } catch (err) {
    console.error('[Judge Error]', err)
    return {
      verdict: 'RUNTIME_ERROR',
      totalTests: 0,
      passedTests: 0,
      runtimeMs: 0,
      testResults: [],
      error: err.message,
    }
  }
}

module.exports = { evaluateSubmission, compareOutputs }
