/**
 * routes/users.js — user profile + stats
 * Stub: GET /api/users/:id  (full implementation in Week 9)
 */

const express = require('express')
const authMiddleware = require('../middleware/auth')
const db = require('../db')
const router = express.Router()

// GET /api/users/stats — live platform statistics
router.get('/stats', async (_req, res) => {
  try {
    const { rows: userCount } = await db.query(`SELECT COUNT(*)::int as total FROM users`)
    const { rows: matchCount } = await db.query(`SELECT COUNT(*)::int as total FROM matches WHERE status = 'finished'`)
    const { rows: subCount } = await db.query(`SELECT COUNT(*)::int as total FROM submissions`)
    const io = _req.app.get('io')
    let onlineUsers = 0
    if (io) {
      const sockets = await io.fetchSockets()
      onlineUsers = new Set(sockets.map(s => s.user?.id).filter(Boolean)).size
    }

    return res.json({
      totalUsers: userCount[0]?.total || 0,
      onlineUsers: onlineUsers,
      totalMatches: matchCount[0]?.total || 0,
      totalSubmissions: subCount[0]?.total || 0,
    })
  } catch (err) {
    console.error('[GET /users/stats]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// GET /api/users/leaderboard — top players by Elo (public, only active players with >= 1 match)
router.get('/leaderboard', async (req, res) => {
  try {
    const instituteFilter = req.query.institute ? String(req.query.institute).trim() : null;
    let query = `
      SELECT id, username, elo_rating, wins, losses, avatar_seed, avatar_style, institute,
             RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
      FROM users
      WHERE (COALESCE(wins, 0) + COALESCE(losses, 0)) > 0
    `;
    const params = [];
    if (instituteFilter) {
      query += ` AND institute ILIKE $1`;
      params.push(`%${instituteFilter}%`);
    }
    query += ` ORDER BY elo_rating DESC, id ASC LIMIT 100`;
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
      `WITH ranked_users AS (
         SELECT id,
                RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
         FROM users
         WHERE (COALESCE(wins, 0) + COALESCE(losses, 0)) > 0
       )
       SELECT u.id, u.username, u.email, u.elo_rating, u.wins, u.losses, u.is_username_set,
              u.avatar_seed, u.avatar_style, u.institute, u.institute_locked,
              u.display_name, u.bio, u.website, u.github, u.linkedin, u.location,
              u.leetcode, u.codeforces, u.codechef, u.created_at,
              r.rank
       FROM users u
       LEFT JOIN ranked_users r ON r.id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'user not found' })
    let friendsCount = 0;
    try {
      const { getFriendCount } = require('../services/social');
      friendsCount = await getFriendCount(req.user.id);
    } catch (_) {}
    return res.json({ ...rows[0], friends_count: friendsCount })
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

// PATCH /api/users/me/profile — update profile details (display_name, bio, website, github, linkedin, location, institute, leetcode, codeforces, codechef)
router.patch('/me/profile', authMiddleware, async (req, res) => {
  try {
    const { display_name, bio, website, github, linkedin, location, institute, leetcode, codeforces, codechef } = req.body

    const cleanDisplayName = display_name !== undefined ? String(display_name).trim().slice(0, 100) : undefined
    const cleanBio = bio !== undefined ? String(bio).trim().slice(0, 500) : undefined
    const cleanWebsite = website !== undefined ? String(website).trim().slice(0, 255) : undefined
    const cleanGithub = github !== undefined ? String(github).trim().replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '').slice(0, 100) : undefined
    const cleanLinkedin = linkedin !== undefined ? String(linkedin).trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '').slice(0, 100) : undefined
    const cleanLocation = location !== undefined ? String(location).trim().slice(0, 100) : undefined
    const cleanInstitute = institute !== undefined ? String(institute).trim().slice(0, 255) : undefined
    const cleanLeetcode = leetcode !== undefined ? String(leetcode).trim().replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/, '').replace(/\/$/, '').slice(0, 100) : undefined
    const cleanCodeforces = codeforces !== undefined ? String(codeforces).trim().replace(/^https?:\/\/(www\.)?codeforces\.com\/profile\//, '').replace(/\/$/, '').slice(0, 100) : undefined
    const cleanCodechef = codechef !== undefined ? String(codechef).trim().replace(/^https?:\/\/(www\.)?codechef\.com\/users\//, '').replace(/\/$/, '').slice(0, 100) : undefined

    const updates = []
    const params = []
    let pIdx = 1

    if (cleanDisplayName !== undefined) {
      updates.push(`display_name = $${pIdx++}`)
      params.push(cleanDisplayName)
    }
    if (cleanBio !== undefined) {
      updates.push(`bio = $${pIdx++}`)
      params.push(cleanBio)
    }
    if (cleanWebsite !== undefined) {
      updates.push(`website = $${pIdx++}`)
      params.push(cleanWebsite)
    }
    if (cleanGithub !== undefined) {
      updates.push(`github = $${pIdx++}`)
      params.push(cleanGithub)
    }
    if (cleanLinkedin !== undefined) {
      updates.push(`linkedin = $${pIdx++}`)
      params.push(cleanLinkedin)
    }
    if (cleanLocation !== undefined) {
      updates.push(`location = $${pIdx++}`)
      params.push(cleanLocation)
    }
    if (cleanLeetcode !== undefined) {
      updates.push(`leetcode = $${pIdx++}`)
      params.push(cleanLeetcode)
    }
    if (cleanCodeforces !== undefined) {
      updates.push(`codeforces = $${pIdx++}`)
      params.push(cleanCodeforces)
    }
    if (cleanCodechef !== undefined) {
      updates.push(`codechef = $${pIdx++}`)
      params.push(cleanCodechef)
    }
    if (cleanInstitute !== undefined) {
      const checkInst = await db.query(
        `SELECT institute, institute_locked FROM users WHERE id = $1`,
        [req.user.id]
      )
      if (!checkInst.rows[0]?.institute_locked && !checkInst.rows[0]?.institute) {
        updates.push(`institute = $${pIdx++}`)
        params.push(cleanInstitute)
        updates.push(`institute_locked = TRUE`)
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No profile fields provided to update' })
    }

    params.push(req.user.id)
    await db.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${pIdx}`,
      params
    )

    const updatedUser = await db.query(
      `WITH ranked_users AS (
         SELECT id,
                RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
         FROM users
         WHERE (COALESCE(wins, 0) + COALESCE(losses, 0)) > 0
       )
       SELECT u.id, u.username, u.email, u.elo_rating, u.wins, u.losses, u.is_username_set,
              u.avatar_seed, u.avatar_style, u.institute, u.institute_locked,
              u.display_name, u.bio, u.website, u.github, u.linkedin, u.location,
              u.leetcode, u.codeforces, u.codechef, u.created_at,
              r.rank
       FROM users u
       LEFT JOIN ranked_users r ON r.id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    )

    if (!updatedUser.rows[0]) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser.rows[0] })
  } catch (err) {
    console.error('[PATCH /users/me/profile]', err)
    return res.status(500).json({ message: 'Failed to update profile' })
  }
})

// GET /api/users/search?q=username — public username autocomplete (top 8 matches with true global rank)
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase()
    if (!q || q.length < 1) return res.json([])
    const { rows } = await db.query(
      `WITH ranked_users AS (
         SELECT id,
                RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
         FROM users
         WHERE (COALESCE(wins, 0) + COALESCE(losses, 0)) > 0
       )
       SELECT u.username, u.elo_rating, u.wins, u.losses, u.avatar_seed, u.avatar_style, u.institute,
              r.rank
       FROM users u
       LEFT JOIN ranked_users r ON r.id = u.id
       WHERE LOWER(u.username) LIKE $1
       ORDER BY u.elo_rating DESC
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
         SELECT id,
                RANK() OVER (ORDER BY elo_rating DESC, id ASC) AS rank
         FROM users
         WHERE (COALESCE(wins, 0) + COALESCE(losses, 0)) > 0
       )
       SELECT u.id, u.username, u.elo_rating, u.wins, u.losses, u.created_at, u.is_username_set,
              u.avatar_seed, u.avatar_style, u.institute,
              u.display_name, u.bio, u.website, u.github, u.linkedin, u.location,
              u.leetcode, u.codeforces, u.codechef,
              r.rank
       FROM users u
       LEFT JOIN ranked_users r ON r.id = u.id
       WHERE LOWER(u.username) = $1`,
      [username]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Player not found' })

    const user = rows[0]
    const total = (user.wins || 0) + (user.losses || 0)
    let friendsCount = 0;
    try {
      const { getFriendCount } = require('../services/social');
      friendsCount = await getFriendCount(user.id);
    } catch (_) {}

    return res.json({
      ...user,
      total_matches: total,
      win_rate: total > 0 ? Math.round((user.wins / total) * 100) : 0,
      friends_count: friendsCount,
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

// ── GET /api/users/:username/friends ─────────────────────────────────────────
// Public/friends list with privacy enforcement, search filter, and cursor pagination
router.get('/:username/friends', authMiddleware, async (req, res) => {
  const socialConfig = require('../config/social');
  if (!socialConfig.isFriendsEnabled) {
    return res.status(404).json({
      error: 'FEATURE_DISABLED',
      message: 'Friends feature is currently disabled.'
    });
  }

  const viewerId = req.user.id;
  const targetUsername = String(req.params.username || '').trim().toLowerCase();
  const searchQ = req.query.q ? String(req.query.q).trim().toLowerCase() : null;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

  try {
    const { rows: targetUsers } = await db.query(
      `SELECT id, username FROM users WHERE LOWER(username) = $1;`,
      [targetUsername]
    );

    if (targetUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUser = targetUsers[0];
    const {
      canViewFriendsList,
      areFriends,
      getRelationshipStatus,
      getMutualFriendsCount,
      getFriendCount
    } = require('../services/social');

    const allowed = await canViewFriendsList(viewerId, targetUser.id);
    if (!allowed) {
      return res.status(403).json({
        error: 'PRIVATE_FRIENDS',
        message: `${targetUser.username} keeps their friends private.`
      });
    }

    let query = `
      WITH friend_records AS (
        SELECT
          f.id as friendship_id,
          f.created_at as friendship_created_at,
          CASE WHEN f.user_low = $1 THEN f.user_high ELSE f.user_low END AS friend_id
        FROM friendships f
        WHERE (f.user_low = $1 OR f.user_high = $1)
          AND f.status = 'accepted'
      ),
      ranked_friends AS (
        SELECT
          u.id, u.username, u.elo_rating, u.avatar_seed, u.avatar_style,
          fr.friendship_created_at,
          RANK() OVER (ORDER BY u.elo_rating DESC, u.id ASC) AS rank,
          EXISTS(
            SELECT 1 FROM subscriptions s
            WHERE s.user_id = u.id AND s.status = 'active' AND s.current_period_end > NOW()
          ) AS is_premium
        FROM friend_records fr
        JOIN users u ON u.id = fr.friend_id
        WHERE 1=1
    `;

    const params = [targetUser.id];
    let pIdx = 2;

    if (searchQ) {
      query += ` AND LOWER(u.username) LIKE $${pIdx++}`;
      params.push(`%${searchQ}%`);
    }

    if (cursor) {
      query += ` AND fr.friendship_created_at < $${pIdx++}`;
      params.push(cursor);
    }

    query += `
      )
      SELECT * FROM ranked_friends
      ORDER BY friendship_created_at DESC
      LIMIT $${pIdx};
    `;
    params.push(limit);

    const { rows } = await db.query(query, params);

    // Populate relation and mutual flags for viewer
    const items = await Promise.all(
      rows.map(async (r) => {
        const isSelf = r.id === viewerId;
        const relation = isSelf ? 'self' : await getRelationshipStatus(viewerId, r.id);
        const isMutual = isSelf ? false : await areFriends(viewerId, r.id);
        const mutualCount = isSelf ? 0 : await getMutualFriendsCount(viewerId, r.id);

        return {
          id: r.id,
          username: r.username,
          eloRating: r.elo_rating,
          elo_rating: r.elo_rating,
          rank: Number(r.rank),
          avatarSeed: r.avatar_seed,
          avatar_seed: r.avatar_seed,
          avatarStyle: r.avatar_style,
          avatar_style: r.avatar_style,
          isPremium: Boolean(r.is_premium),
          is_premium: Boolean(r.is_premium),
          relation,
          isMutual,
          is_mutual: isMutual,
          mutualCount,
          mutual_count: mutualCount,
          friendshipCreatedAt: r.friendship_created_at,
          friendship_created_at: r.friendship_created_at
        };
      })
    );

    const nextCursor = items.length === limit ? items[items.length - 1].friendshipCreatedAt : null;
    const totalCount = await getFriendCount(targetUser.id);

    return res.json({
      targetUser: { id: targetUser.id, username: targetUser.username },
      items,
      friends: items,
      totalCount,
      count: totalCount,
      nextCursor
    });
  } catch (err) {
    console.error('[GET /api/users/:username/friends error]:', err.message);
    return res.status(500).json({ message: 'Failed to load friends list' });
  }
});

module.exports = router


