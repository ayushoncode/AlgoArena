/**
 * routes/auth.js — /api/auth/register and /api/auth/login
 *
 * Day 6 will wire these endpoints to the real database.
 * For now the routes are scaffolded with full validation logic
 * so Day 6 is just swapping the mock response for real db.query calls.
 */

const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const db       = require('../db')
const router   = express.Router()

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // ── Validation ──────────────────────────────────────────
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' })
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ message: 'username must be 3–30 chars, letters/numbers/underscore' })
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'invalid email address' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'password must be at least 6 characters' })
    }

    // ── Hash password ────────────────────────────────────────
    const hash = await bcrypt.hash(password, 12)

    // ── Insert user (Day 5: DATABASE_URL must be set) ────────
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, elo_rating, wins, losses, created_at`,
      [username.toLowerCase(), email.toLowerCase(), hash]
    )
    const user = rows[0]

    // ── Sign JWT ─────────────────────────────────────────────
    const token = jwt.sign(
      { id: user.id, username: user.username, elo_rating: user.elo_rating },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    return res.status(201).json({ token, user })
  } catch (err) {
    // PostgreSQL unique constraint violation codes
    if (err.code === '23505') {
      const field = err.detail?.includes('username') ? 'username' : 'email'
      return res.status(409).json({ message: `${field} already taken` })
    }
    console.error('[POST /auth/register]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    // ── Look up user ─────────────────────────────────────────
    const { rows } = await db.query(
      `SELECT id, username, email, password, elo_rating, wins, losses
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )
    const user = rows[0]

    // Constant-time comparison even when user doesn't exist (prevents timing attacks)
    const passwordToCheck = user?.password || '$2a$12$invalidhashpadding00000000000000000000000000000000000'
    const valid = await bcrypt.compare(password, passwordToCheck)

    if (!user || !valid) {
      return res.status(401).json({ message: 'invalid email or password' })
    }

    // ── Sign JWT ─────────────────────────────────────────────
    const token = jwt.sign(
      { id: user.id, username: user.username, elo_rating: user.elo_rating },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Don't return the hashed password
    const { password: _, ...safeUser } = user

    return res.status(200).json({ token, user: safeUser })
  } catch (err) {
    console.error('[POST /auth/login]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

module.exports = router
