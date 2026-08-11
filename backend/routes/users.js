/**
 * routes/users.js — user profile + stats
 * Stub: GET /api/users/:id  (full implementation in Week 9)
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/users/me — current authenticated user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, email, elo_rating, wins, losses, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'user not found' })
    return res.json(rows[0])
  } catch (err) {
    console.error('[GET /users/me]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, elo_rating, wins, losses, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'user not found' })
    return res.json(rows[0])
  } catch (err) {
    console.error('[GET /users/:id]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

module.exports = router
