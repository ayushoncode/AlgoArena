/**
 * routes/users.js — user profile + stats
 * Stub: GET /api/users/:id  (full implementation in Week 9)
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/users/leaderboard — top 20 by Elo (public)
router.get('/leaderboard', async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, elo_rating, wins, losses,
              RANK() OVER (ORDER BY elo_rating DESC) AS rank
       FROM users
       ORDER BY elo_rating DESC
       LIMIT 20`
    )
    return res.json(rows)
  } catch (err) {
    console.error('[GET /users/leaderboard]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/me — current authenticated user's full profile
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

// GET /api/users/me/history — last 20 matches for the logged-in user
router.get('/me/history', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         m.id, m.topic, m.difficulty, m.started_at, m.ended_at, m.status,
         CASE WHEN m.winner_id = $1 THEN 'WIN' ELSE 'LOSS' END AS result,
         u_opp.username AS opponent,
         e.delta       AS elo_delta
       FROM matches m
       JOIN users u_opp ON (
         CASE WHEN m.player_one_id = $1 THEN m.player_two_id ELSE m.player_one_id END
         = u_opp.id
       )
       LEFT JOIN elo_history e ON e.match_id = m.id AND e.user_id = $1
       WHERE (m.player_one_id = $1 OR m.player_two_id = $1)
         AND m.status = 'finished'
       ORDER BY m.ended_at DESC
       LIMIT 20`,
      [req.user.id]
    )
    return res.json(rows)
  } catch (err) {
    console.error('[GET /users/me/history]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/me/elo-history — rating history points for chart
router.get('/me/elo-history', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT created_at AS date, new_rating AS rating, delta
       FROM elo_history
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.id]
    )
    return res.json(rows)
  } catch (err) {
    console.error('[GET /users/me/elo-history]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// PATCH /api/users/me/username — update username
router.patch('/me/username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body
    if (!username) {
      return res.status(400).json({ message: 'Username is required' })
    }

    const cleanUsername = String(username).trim().toLowerCase()
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({ message: 'Username must be 3–30 chars (letters, numbers, underscores only)' })
    }

    // Check if taken by another user
    const { rows: conflict } = await db.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [cleanUsername, req.user.id]
    )
    if (conflict.length > 0) {
      return res.status(409).json({ message: 'This username is already taken. Please pick another one.' })
    }

    const { rows: updated } = await db.query(
      `UPDATE users SET username = $1 WHERE id = $2
       RETURNING id, username, email, elo_rating, wins, losses, created_at`,
      [cleanUsername, req.user.id]
    )

    if (!updated.length) {
      return res.status(404).json({ message: 'User not found' })
    }

    const jwt = require('jsonwebtoken')
    const user = updated[0]
    const token = jwt.sign(
      { id: user.id, username: user.username, elo_rating: user.elo_rating },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    return res.status(200).json({ message: 'Username updated successfully', user, token })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This username is already taken.' })
    }
    console.error('[PATCH /users/me/username]', err)
    return res.status(500).json({ message: 'Failed to update username' })
  }
})

module.exports = router

