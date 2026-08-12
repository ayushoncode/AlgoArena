/**
 * routes/problems.js — problem listing + single problem
 * Stub: real queries added Week 3 (Day 15) when problems table is seeded.
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/problems — list problems (filter by topic/difficulty, with fallback)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { topic, difficulty } = req.query

    // Try exact match first
    if (topic && difficulty) {
      const { rows } = await db.query(
        `SELECT id, title, topic, difficulty, description, sample_input, sample_output
         FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 5`,
        [topic, difficulty]
      )
      // If exact match found, return it
      if (rows.length) return res.json(rows)

      // Fallback: same topic, any difficulty
      const { rows: fallback } = await db.query(
        `SELECT id, title, topic, difficulty, description, sample_input, sample_output
         FROM problems WHERE topic = $1 ORDER BY RANDOM() LIMIT 5`,
        [topic]
      )
      return res.json(fallback)
    }

    // Generic list with optional filters
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
