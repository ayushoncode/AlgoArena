/**
 * routes/matches.js — match history + single match
 * Stub: full match creation/resolution happens via Socket.io (Week 3–8).
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/matches — authenticated user's match history
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.id, m.topic, m.status, m.started_at, m.ended_at,
              m.winner_id,
              p1.username AS player_one, p2.username AS player_two,
              prob.title  AS problem_title
       FROM matches m
       JOIN users    p1   ON p1.id   = m.player_one_id
       JOIN users    p2   ON p2.id   = m.player_two_id
       JOIN problems prob ON prob.id = m.problem_id
       WHERE m.player_one_id = $1 OR m.player_two_id = $1
       ORDER BY m.started_at DESC
       LIMIT 50`,
      [req.user.id]
    )
    return res.json(rows)
  } catch (err) {
    console.error('[GET /matches]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/matches/:id — single match detail
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows: [match] } = await db.query(
      `SELECT * FROM matches WHERE id = $1`, [req.params.id]
    )
    if (!match) return res.status(404).json({ message: 'match not found' })

    // Only players in that match can see the detail
    if (match.player_one_id !== req.user.id && match.player_two_id !== req.user.id) {
      return res.status(403).json({ message: 'forbidden' })
    }

    const { rows: submissions } = await db.query(
      `SELECT id, user_id, language, status, verdict, runtime_ms, memory_kb, submitted_at
       FROM submissions WHERE match_id = $1 ORDER BY submitted_at`,
      [req.params.id]
    )
    return res.json({ ...match, submissions })
  } catch (err) {
    console.error('[GET /matches/:id]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/matches/live-queue — returns current open challenges waiting in matchmaking queue
router.get('/live-queue', (_req, res) => {
  try {
    const { getActiveQueueChallenges } = require('../socket/matchmaking')
    return res.json(getActiveQueueChallenges())
  } catch (err) {
    console.error('[GET /matches/live-queue]', err)
    return res.json([])
  }
})

module.exports = router
