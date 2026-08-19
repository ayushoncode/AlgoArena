/**
 * routes/problems.js — problem listing + single problem + run
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/problems — list problems (filter by topic/difficulty, with fallback)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { topic, difficulty } = req.query

    if (topic && difficulty) {
      const { rows } = await db.query(
        `SELECT id, title, topic, difficulty, description, sample_input, sample_output
         FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 5`,
        [topic, difficulty]
      )
      if (rows.length) return res.json(rows)

      const { rows: fallback } = await db.query(
        `SELECT id, title, topic, difficulty, description, sample_input, sample_output
         FROM problems WHERE topic = $1 ORDER BY RANDOM() LIMIT 5`,
        [topic]
      )
      return res.json(fallback)
    }

    let text    = `SELECT id, title, topic, difficulty FROM problems`
    const params = []
    const where  = []
    if (topic)      { params.push(topic);      where.push(`topic = $${params.length}`) }
    if (difficulty) { params.push(difficulty); where.push(`difficulty = $${params.length}`) }
    if (where.length) text += ' WHERE ' + where.join(' AND ')
    text += ' ORDER BY created_at DESC'

    const { rows } = await db.query(text, params)
    return res.json(rows)
  } catch (err) {
    console.error('[GET /problems]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// POST /api/problems/:id/run — run code against visible sample test cases only (Run button)
router.post('/:id/run', authMiddleware, async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body
    const problemId = req.params.id

    if (!code) return res.status(400).json({ message: 'code is required' })

    // Fetch only visible (non-hidden) test cases — max 3 for Run mode
    const { rows: testCases } = await db.query(
      `SELECT id, input, output, is_hidden FROM test_cases
       WHERE problem_id = $1 AND is_hidden = false
       ORDER BY id ASC LIMIT 3`,
      [problemId]
    )

    if (!testCases.length) {
      return res.json({
        verdict: 'ACCEPTED', passedTests: 0, totalTests: 0,
        runtimeMs: 0, testResults: [],
      })
    }

    const lang = (language || 'javascript').toLowerCase()

    if (lang === 'javascript' || lang === 'js') {
      const vm = require('vm')
      const { compareOutputs } = require('../services/judge')
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
          const sandbox = { console: { log: () => {} }, result: undefined }
          const script = new vm.Script(`
            ${code}
            let __fn = typeof solution === 'function' ? solution :
                       (typeof Solution === 'function' ? new Solution().solution : null);
            if (!__fn) throw new Error("No function named 'solution' found.");
            result = __fn(${tc.input});
          `)
          script.runInContext(vm.createContext(sandbox), { timeout: 3000 })
          actualOutput = sandbox.result
          passed = compareOutputs(actualOutput, tc.output)
          if (passed) passedCount++
          else if (overallVerdict === 'ACCEPTED') overallVerdict = 'WRONG_ANSWER'
        } catch (err) {
          errorMsg = err.message
          if (overallVerdict === 'ACCEPTED') {
            overallVerdict = err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR'
          }
        }

        testResults.push({
          testIndex: i + 1,
          passed,
          input:    tc.input,
          expected: tc.output,
          actual:   actualOutput !== null && actualOutput !== undefined
            ? JSON.stringify(actualOutput) : null,
          error:    errorMsg,
          isHidden: false,
          runtimeMs: 0,
        })
      }

      return res.json({
        verdict: overallVerdict,
        passedTests: passedCount,
        totalTests: testCases.length,
        runtimeMs: Date.now() - startTime,
        testResults,
      })
    }

    // Python, C++, Java → Docker sandbox
    const path = require('path')
    let sandboxRunner = null
    try { sandboxRunner = require(path.join(__dirname, '../../workers/sandbox')) } catch {}

    if (!sandboxRunner) {
      return res.json({ verdict: 'RUNTIME_ERROR', passedTests: 0, totalTests: testCases.length, runtimeMs: 0,
        testResults: testCases.map((_, i) => ({ testIndex: i+1, passed: false, input: _.input, expected: _.output, actual: null, error: 'Sandbox not available', isHidden: false, runtimeMs: 0 })) })
    }

    const result = await sandboxRunner.runSandbox({ code, language: lang, testCases })
    return res.json(result)

  } catch (err) {
    console.error('[POST /problems/:id/run]', err)
    return res.status(500).json({ message: 'internal server error', error: err.message })
  }
})

// GET /api/problems/:id — single problem with visible test cases
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows: [problem] } = await db.query(
      `SELECT * FROM problems WHERE id = $1`, [req.params.id]
    )
    if (!problem) return res.status(404).json({ message: 'problem not found' })

    const { rows: tests } = await db.query(
      `SELECT id, input, output FROM test_cases
       WHERE problem_id = $1 AND is_hidden = false`, [req.params.id]
    )
    return res.json({ ...problem, sample_tests: tests })
  } catch (err) {
    console.error('[GET /problems/:id]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

module.exports = router
