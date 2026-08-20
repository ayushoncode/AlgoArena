/**
 * routes/problems.js — problem listing + single problem + run
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/problems/stats — real-time problem count & topic breakdown
router.get('/stats', async (_req, res) => {
  try {
    const { rows: countRows } = await db.query(`SELECT COUNT(*)::int as total FROM problems`)
    const { rows: testRows } = await db.query(`SELECT COUNT(*)::int as total FROM test_cases`)
    const { rows: topicRows } = await db.query(`SELECT topic, COUNT(*)::int as count FROM problems GROUP BY topic`)
    const { rows: diffRows } = await db.query(`SELECT difficulty, COUNT(*)::int as count FROM problems GROUP BY difficulty`)
    return res.json({
      totalProblems: countRows[0]?.total || 0,
      totalTestCases: testRows[0]?.total || 0,
      byTopic: Object.fromEntries(topicRows.map(r => [r.topic, r.count])),
      byDifficulty: Object.fromEntries(diffRows.map(r => [r.difficulty, r.count])),
    })
  } catch (err) {
    console.error('[GET /problems/stats]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/problems/daily — today's deterministic daily challenge from DB
router.get('/daily', async (_req, res) => {
  try {
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    const { rows: problems } = await db.query(
      `SELECT id, title, topic, difficulty, description, sample_input, sample_output
       FROM problems ORDER BY id ASC`
    )
    if (!problems.length) {
      return res.status(404).json({ message: 'No problems available' })
    }
    const dailyProblem = problems[doy % problems.length]
    return res.json(dailyProblem)
  } catch (err) {
    console.error('[GET /problems/daily]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

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
                    if (l !== null && l !== undefined) { curr.left = new TreeNode(l); q.push(curr.left); }
                  }
                  if (i < arr.length) {
                    const r = arr[i++];
                    if (r !== null && r !== undefined) { curr.right = new TreeNode(r); q.push(curr.right); }
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
                if (v !== null && v !== undefined) { curr.next = new ListNode(v); curr = curr.next; }
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
                  if (node) { res.push(node.val); q.push(node.left || null); q.push(node.right || null); }
                  else { res.push(null); }
                }
                while (res.length > 0 && res[res.length - 1] === null) res.pop();
                return res;
              }
              if (obj instanceof ListNode || (typeof obj === 'object' && 'next' in obj && 'val' in obj)) {
                const res = [];
                let curr = obj;
                while (curr) { res.push(curr.val); curr = curr.next; }
                return res;
              }
              return obj;
            }

            ${code}

            let __fn = typeof solution === 'function' ? solution :
                       (typeof Solution === 'function' ? (new Solution().solution || Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== 'constructor').map(m => new Solution()[m])[0]) : null);
            if (!__fn) throw new Error("No function named 'solution' found.");

            const __rawArgs = [${tc.input}];
            let __ret;
            try {
              __ret = __fn(...__rawArgs);
            } catch (err) {
              const __converted = __rawArgs.map(arg => {
                if (Array.isArray(arg)) {
                  if (arg.includes(null)) return __buildTree(arg);
                  return __buildList(arg) || arg;
                }
                return arg;
              });
              __ret = __fn(...__converted);
            }
            result = __serialize(__ret);
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
