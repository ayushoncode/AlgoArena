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
router.get('/leaderboard', async (req, res) => {
  try {
    const instituteFilter = req.query.institute ? String(req.query.institute).trim() : null;
    let query = `
      SELECT id, username, elo_rating, wins, losses, avatar_seed, avatar_style, institute,
             RANK() OVER (ORDER BY elo_rating DESC) AS rank
      FROM users
    `;
    const params = [];
    if (instituteFilter) {
      query += ` WHERE institute ILIKE $1`;
      params.push(`%${instituteFilter}%`);
    }
    query += ` ORDER BY elo_rating DESC LIMIT 20`;
    const { rows } = await db.query(query, params);
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
      `SELECT id, username, email, elo_rating, wins, losses, is_username_set, avatar_seed, avatar_style, institute, institute_locked, created_at
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
       LEFT JOIN (
         SELECT DISTINCT ON (match_id, user_id) match_id, user_id, delta
         FROM elo_history
         ORDER BY match_id, user_id, created_at DESC
       ) e ON e.match_id = m.id AND e.user_id = $1
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

// GET /api/users/check-username?username=xyz — live username availability check
router.get('/check-username', authMiddleware, async (req, res) => {
  try {
    const username = String(req.query.username || '').trim().toLowerCase()
    if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.json({ available: false, message: 'Username must be 3–30 chars (letters, numbers, underscore)' })
    }
    const { rows } = await db.query(
      `SELECT id FROM users WHERE LOWER(username) = $1 AND id != $2`,
      [username, req.user.id]
    )
    if (rows.length > 0) {
      return res.json({ available: false, message: 'This username is already taken' })
    }
    return res.json({ available: true, message: 'Username is available!' })
  } catch (err) {
    console.error('[GET /users/check-username]', err)
    return res.status(500).json({ available: false, message: 'Error checking username' })
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

// PATCH /api/users/me/institute — one-time initial institute setup
router.patch('/me/institute', authMiddleware, async (req, res) => {
  try {
    const { institute } = req.body
    if (!institute) {
      return res.status(400).json({ message: 'Institute is required' })
    }

    const cleanInstitute = String(institute).trim()

    // Check if user already locked their institute
    const { rows: userCheck } = await db.query(
      `SELECT institute_locked FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (userCheck[0]?.institute_locked) {
      return res.status(403).json({ message: 'Your institute is permanently fixed and cannot be changed.' })
    }

    const { rows: updated } = await db.query(
      `UPDATE users SET institute = $1, institute_locked = TRUE WHERE id = $2
       RETURNING id, username, email, elo_rating, wins, losses, is_username_set, avatar_seed, avatar_style, institute, institute_locked, created_at`,
      [cleanInstitute, req.user.id]
    )

    if (!updated.length) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ message: 'Institute permanently set', user: updated[0] })
  } catch (err) {
    console.error('[PATCH /users/me/institute]', err)
    return res.status(500).json({ message: 'Failed to set institute' })
  }
})

// PATCH /api/users/me/avatar — update avatar seed and style
router.patch('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar_seed, avatar_style } = req.body
    if (!avatar_seed) {
      return res.status(400).json({ message: 'avatar_seed is required' })
    }
    const cleanSeed = String(avatar_seed).trim().slice(0, 100)
    const cleanStyle = String(avatar_style || 'adventurer').trim().slice(0, 50)

    const { rows } = await db.query(
      `UPDATE users
       SET avatar_seed = $1, avatar_style = $2
       WHERE id = $3
       RETURNING id, username, email, elo_rating, wins, losses, is_username_set, avatar_seed, avatar_style, created_at`,
      [cleanSeed, cleanStyle, req.user.id]
    )

    if (!rows[0]) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json({ message: 'Avatar updated successfully', user: rows[0] })
  } catch (err) {
    console.error('[PATCH /users/me/avatar]', err)
    return res.status(500).json({ message: 'Failed to update avatar' })
  }
})

// GET /api/users/search?q=username — public username autocomplete (top 8 matches with true global rank)
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase()
    if (!q || q.length < 1) return res.json([])
    const { rows } = await db.query(
      `WITH ranked_users AS (
         SELECT id, username, elo_rating, wins, losses, avatar_seed, avatar_style, institute,
                RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
         FROM users
       )
       SELECT username, elo_rating, wins, losses, avatar_seed, avatar_style, institute, rank
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
                u.avatar_seed, u.avatar_style, u.institute,
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
       LEFT JOIN (
         SELECT DISTINCT ON (match_id, user_id) match_id, user_id, delta
         FROM elo_history
         ORDER BY match_id, user_id, created_at DESC
       ) e ON e.match_id = m.id AND e.user_id = $1
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

