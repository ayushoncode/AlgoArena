/**
 * routes/problems.js — problem listing + single problem
 * Stub: real queries added Week 3 (Day 15) when problems table is seeded.
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/problems — list problems (filter by topic/difficulty)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { topic, difficulty } = req.query
    let text   = `SELECT id, title, topic, difficulty, min_rating, max_rating FROM problems`
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
