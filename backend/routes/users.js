/**
 * routes/users.js — user profile + stats
 * Stub: GET /api/users/:id  (full implementation in Week 9)
 */

const express        = require('express')
const authMiddleware = require('../middleware/auth')
const db             = require('../db')
const router         = express.Router()

// GET /api/users/stats — live platform statistics
router.get('/stats', async (_req, res) => {
  try {
    const { rows: userCount } = await db.query(`SELECT COUNT(*)::int as total FROM users`)
    const { rows: matchCount } = await db.query(`SELECT COUNT(*)::int as total FROM matches WHERE status = 'finished'`)
    const { rows: subCount } = await db.query(`SELECT COUNT(*)::int as total FROM submissions`)
    return res.json({
      totalUsers: userCount[0]?.total || 0,
      totalMatches: matchCount[0]?.total || 0,
      totalSubmissions: subCount[0]?.total || 0,
    })
  } catch (err) {
    console.error('[GET /users/stats]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

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
      `SELECT id, username, email, elo_rating, wins, losses, is_username_set, created_at
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
      `SELECT
         e.id,
         e.created_at AS date,
         e.new_rating AS rating,
         e.old_rating,
         e.delta,
         m.topic,
         m.difficulty,
         u_opp.username AS opponent
       FROM elo_history e
       LEFT JOIN matches m ON m.id = e.match_id
       LEFT JOIN users u_opp ON (
         CASE WHEN m.player_one_id = $1 THEN m.player_two_id ELSE m.player_one_id END = u_opp.id
       )
       WHERE e.user_id = $1
       ORDER BY e.created_at ASC`,
      [req.user.id]
    )

    if (rows.length > 0) {
      return res.json(rows)
    }

    // Fallback: If no explicit elo_history rows yet, compute from matches history
    const { rows: matchRows } = await db.query(
      `SELECT
         m.id,
         m.started_at,
         m.ended_at AS date,
         m.topic,
         m.difficulty,
         CASE WHEN m.winner_id = $1 THEN 'WIN' ELSE 'LOSS' END AS result,
         u_opp.username AS opponent
       FROM matches m
       JOIN users u_opp ON (
         CASE WHEN m.player_one_id = $1 THEN m.player_two_id ELSE m.player_one_id END = u_opp.id
       )
       WHERE (m.player_one_id = $1 OR m.player_two_id = $1)
         AND m.status = 'finished'
       ORDER BY m.ended_at ASC`,
      [req.user.id]
    )

    if (matchRows.length > 0) {
      let currentElo = 1200
      const history = matchRows.map(m => {
        const delta = m.result === 'WIN' ? 18 : -18
        const oldRating = currentElo
        currentElo += delta
        return {
          id: m.id,
          date: m.date,
          rating: currentElo,
          old_rating: oldRating,
          delta,
          topic: m.topic,
          difficulty: m.difficulty,
          opponent: m.opponent,
        }
      })
      return res.json(history)
    }

    return res.json([])
  } catch (err) {
    console.error('[GET /users/me/elo-history]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// PATCH /api/users/me/username — one-time initial handle setup (cannot be changed once set)
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

    // Check if user already locked their username
    const { rows: userCheck } = await db.query(
      `SELECT is_username_set FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (userCheck[0]?.is_username_set) {
      return res.status(403).json({ message: 'Your username is permanently fixed and cannot be changed.' })
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
      `UPDATE users SET username = $1, is_username_set = TRUE WHERE id = $2
       RETURNING id, username, email, elo_rating, wins, losses, is_username_set, created_at`,
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

    return res.status(200).json({ message: 'Username permanently set', user, token })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'This username is already taken.' })
    }
    console.error('[PATCH /users/me/username]', err)
    return res.status(500).json({ message: 'Failed to set username' })
  }
})

// GET /api/users/search?q=username — public username autocomplete (top 8 matches with true global rank)
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase()
    if (!q || q.length < 1) return res.json([])
    const { rows } = await db.query(
      `WITH ranked_users AS (
         SELECT id, username, elo_rating, wins, losses,
                RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
         FROM users
       )
       SELECT username, elo_rating, wins, losses, rank
       FROM ranked_users
       WHERE LOWER(username) LIKE $1
       ORDER BY elo_rating DESC
       LIMIT 8`,
      [`${q}%`]
    )
    return res.json(rows)
  } catch (err) {
    console.error('[GET /users/search]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/:username/profile — public full profile with true global rank
router.get('/:username/profile', async (req, res) => {
  try {
    const username = String(req.params.username).trim().toLowerCase()
    const { rows } = await db.query(
      `WITH ranked_users AS (
         SELECT u.id, u.username, u.elo_rating, u.wins, u.losses, u.created_at, u.is_username_set,
                RANK() OVER (ORDER BY u.elo_rating DESC, u.id ASC) AS rank
         FROM users u
       )
       SELECT * FROM ranked_users
       WHERE LOWER(username) = $1`,
      [username]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Player not found' })

    const user = rows[0]
    const total = (user.wins || 0) + (user.losses || 0)

    return res.json({
      ...user,
      total_matches: total,
      win_rate: total > 0 ? Math.round((user.wins / total) * 100) : 0,
    })
  } catch (err) {
    console.error('[GET /users/:username/profile]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/:username/history — public match history by username
router.get('/:username/history', async (req, res) => {
  try {
    const username = String(req.params.username).trim().toLowerCase()
    const { rows: uRows } = await db.query(
      `SELECT id FROM users WHERE LOWER(username) = $1`,
      [username]
    )
    if (!uRows[0]) return res.status(404).json({ message: 'User not found' })
    const targetUserId = uRows[0].id

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
      [targetUserId]
    )
    return res.json(rows)
  } catch (err) {
    console.error('[GET /users/:username/history]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/:username/elo-history — public rating history points for chart by username
router.get('/:username/elo-history', async (req, res) => {
  try {
    const username = String(req.params.username).trim().toLowerCase()
    const { rows: uRows } = await db.query(
      `SELECT id, elo_rating FROM users WHERE LOWER(username) = $1`,
      [username]
    )
    if (!uRows[0]) return res.status(404).json({ message: 'User not found' })
    const targetUserId = uRows[0].id

    const { rows } = await db.query(
      `SELECT
         e.id,
         e.created_at AS date,
         e.new_rating AS rating,
         e.old_rating,
         e.delta,
         m.topic,
         m.difficulty,
         u_opp.username AS opponent
       FROM elo_history e
       LEFT JOIN matches m ON m.id = e.match_id
       LEFT JOIN users u_opp ON (
         CASE WHEN m.player_one_id = $1 THEN m.player_two_id ELSE m.player_one_id END = u_opp.id
       )
       WHERE e.user_id = $1
       ORDER BY e.created_at ASC`,
      [targetUserId]
    )

    if (rows.length > 0) {
      return res.json(rows)
    }

    // Fallback: If no explicit elo_history rows yet, compute from matches history
    const { rows: matchRows } = await db.query(
      `SELECT
         m.id,
         m.started_at,
         m.ended_at AS date,
         m.topic,
         m.difficulty,
         CASE WHEN m.winner_id = $1 THEN 'WIN' ELSE 'LOSS' END AS result,
         u_opp.username AS opponent
       FROM matches m
       JOIN users u_opp ON (
         CASE WHEN m.player_one_id = $1 THEN m.player_two_id ELSE m.player_one_id END = u_opp.id
       )
       WHERE (m.player_one_id = $1 OR m.player_two_id = $1)
         AND m.status = 'finished'
       ORDER BY m.ended_at ASC`,
      [targetUserId]
    )

    if (matchRows.length > 0) {
      let currentElo = 1200
      const history = matchRows.map(m => {
        const delta = m.result === 'WIN' ? 18 : -18
        const oldRating = currentElo
        currentElo += delta
        return {
          id: m.id,
          date: m.date,
          rating: currentElo,
          old_rating: oldRating,
          delta,
          topic: m.topic,
          difficulty: m.difficulty,
          opponent: m.opponent,
        }
      })
      return res.json(history)
    }

    return res.json([])
  } catch (err) {
    console.error('[GET /users/:username/elo-history]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

module.exports = router

