/**
 * routes/problems.js — problem listing + single problem + run
 */

const express = require('express')
const authMiddleware = require('../middleware/auth')
const requirePremium = require('../middleware/requirePremium')
const db = require('../db')
const router = express.Router()

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

// GET /api/problems/daily — today's deterministic daily challenge from DB (synchronized with 00:00 UTC 24hr reset)
router.get('/daily', async (_req, res) => {
  try {
    const utcDay = Math.floor(Date.now() / 86400000)
    const { rows: problems } = await db.query(
      `SELECT id, title, topic, difficulty, description, sample_input, sample_output, hints
       FROM problems ORDER BY id ASC`
    )
    if (!problems.length) {
      return res.status(404).json({ message: 'No problems available' })
    }
    const dailyProblem = problems[utcDay % problems.length]
    return res.json(dailyProblem)
  } catch (err) {
    console.error('[GET /problems/daily]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/problems/striver-sheet — returns Striver A2Z curriculum populated with live DB problem rows
router.get('/striver-sheet', requirePremium('sheet'), async (_req, res) => {
  try {
    const { rows: allProbs } = await db.query(
      `SELECT id, title, slug, topic, difficulty, sample_input, sample_output
       FROM problems ORDER BY created_at ASC`
    )
    const probMap = new Map()
    for (const p of allProbs) {
      if (p.slug) probMap.set(p.slug, p)
      probMap.set(p.title.toLowerCase(), p)
    }

    const CURRICULUM = [
      {
        id: 'step-3-arrays',
        title: 'Arrays',
        topic: 'arrays',
        icon: 'Brackets',
        badge: 'Curriculum Ready',
        subsections: [
          {
            title: 'Easy Problems',
            problems: [
              'largest-element-in-an-array',
              'second-largest-element-in-an-array',
              'check-if-array-is-sorted-and-rotated',
              'remove-duplicates-from-sorted-array',
              'left-rotate-an-array-by-one',
              'rotate-array',
              'move-zeroes',
              'linear-search',
              'union-of-two-sorted-arrays',
              'missing-number',
              'max-consecutive-ones',
              'longest-subarray-with-given-sum',
              'single-number'
            ]
          },
          {
            title: 'Medium Problems',
            problems: [
              'two-sum',
              'sort-colors',
              'majority-element',
              'maximum-subarray',
              'best-time-to-buy-and-sell-stock',
              'rearrange-array-elements-by-sign',
              'next-permutation',
              'leaders-in-an-array',
              'longest-consecutive-sequence',
              'set-matrix-zeroes',
              'rotate-image',
              'spiral-matrix',
              'subarray-sum-equals-k'
            ]
          },
          {
            title: 'Hard Problems',
            problems: [
              'pascal-s-triangle',
              'majority-element-ii',
              '3sum',
              '4sum',
              'largest-subarray-with-0-sum',
              'subarrays-with-xor-k',
              'merge-intervals',
              'merge-sorted-array',
              'find-missing-and-repeated-values',
              'count-inversions',
              'reverse-pairs',
              'maximum-product-subarray',
              'first-missing-positive',
              'trapping-rain-water'
            ]
          }
        ]
      },
      {
        id: 'step-4-binary-search',
        title: 'Binary Search',
        topic: 'binary-search',
        icon: 'Search',
        badge: 'Curriculum Ready',
        subsections: [
          {
            title: 'BS on 1D Arrays',
            problems: [
              'binary-search',
              'lower-bound',
              'upper-bound',
              'search-insert-position',
              'floor-and-ceil-in-sorted-array',
              'find-first-and-last-position-of-element-in-sorted-array',
              'count-occurrences-in-sorted-array',
              'search-in-rotated-sorted-array',
              'search-in-rotated-sorted-array-ii',
              'find-minimum-in-rotated-sorted-array',
              'find-minimum-in-rotated-sorted-array-ii',
              'find-kth-rotation',
              'single-element-in-a-sorted-array',
              'find-peak-element'
            ]
          },
          {
            title: 'Find Answers by BS in Search Space',
            problems: [
              'sqrt-x',
              'nth-root-of-an-integer',
              'koko-eating-bananas',
              'minimum-number-of-days-to-make-m-bouquets',
              'find-the-smallest-divisor-given-a-threshold',
              'capacity-to-ship-packages-within-d-days',
              'kth-missing-positive-number',
              'aggressive-cows',
              'book-allocation-problem',
              'split-array-largest-sum',
              'painter-s-partition-problem',
              'kth-element-of-two-sorted-arrays',
              'median-of-two-sorted-arrays'
            ]
          },
          {
            title: 'Find Peak / BS on 2D Arrays',
            problems: [
              'row-with-max-1s',
              'search-a-2d-matrix',
              'search-a-2d-matrix-ii',
              'find-a-peak-element-ii',
              'matrix-median'
            ]
          },
          {
            title: 'Advanced Binary Search & Interval Space',
            problems: [
              'h-index-ii',
              'heaters',
              'find-right-interval'
            ]
          }
        ]
      },
      {
        id: 'step-5-strings',
        title: 'Strings',
        topic: 'strings',
        icon: 'Type',
        badge: 'Curriculum Ready',
        subsections: [
          {
            title: 'Basic and Easy String Problems',
            problems: [
              'remove-outermost-parentheses',
              'reverse-words-in-a-string',
              'largest-odd-number-in-string',
              'longest-common-prefix',
              'isomorphic-strings',
              'rotate-string',
              'valid-anagram'
            ]
          },
          {
            title: 'Medium String Problems',
            problems: [
              'sort-characters-by-frequency',
              'maximum-nesting-depth-of-the-parentheses',
              'roman-to-integer',
              'string-to-integer-atoi',
              'count-number-of-substrings',
              'longest-palindromic-substring',
              'sum-of-beauty-of-all-substrings',
              'find-the-index-of-the-first-occurrence-in-a-string'
            ]
          }
        ]
      },
      {
        id: 'step-6-learn-linkedlist',
        title: 'Learn LinkedList',
        topic: 'linked-list',
        icon: 'Link',
        badge: 'Curriculum Ready',
        subsections: [
          {
            title: 'Learn 1D LinkedList',
            problems: [
              'introduction-to-linked-list',
              'insert-node-at-the-end-of-linked-list',
              'delete-node-in-a-linked-list',
              'count-nodes-of-linked-list',
              'search-in-a-linked-list'
            ]
          },
          {
            title: 'Learn Doubly LinkedList',
            problems: [
              'introduction-to-doubly-linked-list',
              'insert-a-node-in-doubly-linked-list',
              'delete-node-in-doubly-linked-list',
              'reverse-a-doubly-linked-list'
            ]
          },
          {
            title: 'Medium Problems of LL',
            problems: [
              'middle-of-the-linked-list'
            ]
          }
        ]
      }
    ]

    const result = CURRICULUM.map(step => ({
      ...step,
      subsections: step.subsections.map(sub => ({
        ...sub,
        problems: sub.problems
          .map(slug => probMap.get(slug) || probMap.get(slug.replace(/-/g, ' ')))
          .filter(Boolean)
      }))
    }))

    return res.json(result)
  } catch (err) {
    console.error('[GET /problems/striver-sheet]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/problems — list problems (filter by topic/difficulty, with fallback)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { topic, difficulty } = req.query

    if (topic && difficulty) {
      const { rows } = await db.query(
        `SELECT id, title, topic, difficulty, description, sample_input, sample_output, hints
         FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 5`,
        [topic, difficulty]
      )
      if (rows.length) return res.json(rows)

      const { rows: fallback } = await db.query(
        `SELECT id, title, topic, difficulty, description, sample_input, sample_output, hints
         FROM problems WHERE topic = $1 ORDER BY RANDOM() LIMIT 5`,
        [topic]
      )
      return res.json(fallback)
    }

    let text = `SELECT id, title, topic, difficulty FROM problems`
    const params = []
    const where = []
    if (topic) { params.push(topic); where.push(`topic = $${params.length}`) }
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
    const rawId = req.params.id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)
    let problemId = rawId
    if (!isUuid) {
      const { rows: prob } = await db.query('SELECT id FROM problems WHERE slug = $1', [rawId])
      if (prob[0]) problemId = prob[0].id
    }

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
          const sandbox = { console: { log: () => { } }, result: undefined }
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
          input: tc.input,
          expected: tc.output,
          actual: actualOutput !== null && actualOutput !== undefined
            ? JSON.stringify(actualOutput) : null,
          error: errorMsg,
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
    try { sandboxRunner = require(path.join(__dirname, '../../workers/sandbox')) } catch { }

    if (!sandboxRunner) {
      return res.json({
        verdict: 'RUNTIME_ERROR', passedTests: 0, totalTests: testCases.length, runtimeMs: 0,
        testResults: testCases.map((_, i) => ({ testIndex: i + 1, passed: false, input: _.input, expected: _.output, actual: null, error: 'Sandbox not available', isHidden: false, runtimeMs: 0 }))
      })
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)
    const { rows: [problem] } = await db.query(
      isUuid
        ? `SELECT id, title, topic, difficulty, description, min_rating, max_rating, sample_input, sample_output, created_at, slug, hints FROM problems WHERE id = $1`
        : `SELECT id, title, topic, difficulty, description, min_rating, max_rating, sample_input, sample_output, created_at, slug, hints FROM problems WHERE slug = $1`,
      [req.params.id]
    )
    if (!problem) return res.status(404).json({ message: 'problem not found' })

    const { rows: tests } = await db.query(
      `SELECT id, input, output FROM test_cases
       WHERE problem_id = $1 AND is_hidden = false`, [problem.id]
    )
    return res.json({ ...problem, sample_tests: tests })
  } catch (err) {
    console.error('[GET /problems/:id]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/problems/:id/hints — get hints for a problem
router.get('/:id/hints', authMiddleware, async (req, res) => {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)
    const { rows: [problem] } = await db.query(
      isUuid
        ? `SELECT hints FROM problems WHERE id = $1`
        : `SELECT hints FROM problems WHERE slug = $1`,
      [req.params.id]
    )
    if (!problem) return res.status(404).json({ message: 'problem not found' })
    return res.json(problem.hints || [])
  } catch (err) {
    console.error('[GET /problems/:id/hints]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

module.exports = router
