/**
 * routes/auth.js — /api/auth/register, /api/auth/login, /api/auth/send-otp, /api/auth/verify-otp, & /api/auth/firebase
 */

const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const db       = require('../db')
const mailer   = require('../utils/mailer')
const router   = express.Router()

// In-memory OTP storage: Map<emailOrPhone, { code: string, expiresAt: number, attempts: number }>
const otpStore = new Map()

// Pending registrations awaiting email verification
// Map<email, { username, passwordHash, otp, expiresAt, attempts }>
const pendingRegistrations = new Map()

// Optional Firebase Admin SDK initialization
let firebaseAdmin = null
try {
  const admin = require('firebase-admin')
  if (process.env.FIREBASE_PROJECT_ID && (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) {
    let credential
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    } else {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      })
    }
    admin.initializeApp({ credential })
    firebaseAdmin = admin
    console.log('✓ Firebase Admin initialized successfully')
  }
} catch (e) {
  console.warn('Firebase Admin not initialized (using fallback OTP mode):', e.message)
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, elo_rating: user.elo_rating },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ── POST /api/auth/send-otp ──────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes validity

    otpStore.set(cleanEmail, { code: otp, expiresAt, attempts: 0 })

    // Send real email — falls back to console if SMTP not configured
    const mailResult = await mailer.sendLoginOtp(cleanEmail, otp)
    console.log(`🔑 [OTP] ${cleanEmail} -> ${otp} (Valid 5m) | email sent: ${mailResult.sent}`)

    return res.status(200).json({
      message: 'OTP sent to your email',
      email: cleanEmail,
      // Only expose devOtp in the API response when SMTP is not configured (dev/local)
      devOtp: mailResult.devOnly ? otp : undefined,
    })
  } catch (err) {
    console.error('[POST /auth/send-otp]', err)
    return res.status(500).json({ message: 'Failed to send OTP' })
  }
})

// ── POST /api/auth/send-registration-otp ─────────────────────
// Validate fields and send a verification OTP before creating the account
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' })
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 3–30 chars (letters, numbers, underscore)' })
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanUsername = username.trim().toLowerCase()

    // Check for conflicts before sending the OTP
    const { rows: conflict } = await db.query(
      `SELECT username, email FROM users WHERE username = $1 OR email = $2`,
      [cleanUsername, cleanEmail]
    )
    if (conflict.length > 0) {
      const field = conflict[0].email === cleanEmail ? 'email' : 'username'
      return res.status(409).json({ message: `That ${field} is already taken` })
    }

    // Hash password now so it's ready when they verify
    const passwordHash = await bcrypt.hash(password, 12)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    pendingRegistrations.set(cleanEmail, { username: cleanUsername, passwordHash, otp, expiresAt, attempts: 0 })

    const mailResult = await mailer.sendEmailVerificationOtp(cleanEmail, otp)
    console.log(`📧 [REG OTP] ${cleanEmail} -> ${otp} | email sent: ${mailResult.sent}`)

    return res.status(200).json({
      message: 'Verification code sent to your email',
      email: cleanEmail,
      devOtp: mailResult.devOnly ? otp : undefined,
    })
  } catch (err) {
    console.error('[POST /auth/send-registration-otp]', err)
    return res.status(500).json({ message: 'Failed to send verification code' })
  }
})

// ── POST /api/auth/verify-otp ────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, username } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP are required' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const record = otpStore.get(cleanEmail)

    if (!record) {
      return res.status(400).json({ message: 'OTP has expired or was never requested. Please click resend.' })
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail)
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' })
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanEmail)
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' })
    }

    if (record.code !== String(otp).trim()) {
      record.attempts++
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' })
    }

    // OTP is valid — consume it
    otpStore.delete(cleanEmail)

    // Check if user exists
    const { rows: existing } = await db.query(
      `SELECT id, username, email, elo_rating, wins, losses FROM users WHERE email = $1`,
      [cleanEmail]
    )

    let user = existing[0]
    let isNewUser = false

    if (!user) {
      // Create new user with username or fallback
      let chosenUsername = username ? String(username).trim().toLowerCase() : cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20)
      if (chosenUsername.length < 3) chosenUsername = 'player_' + Math.floor(1000 + Math.random() * 9000)

      // Ensure username uniqueness
      const { rows: userConflict } = await db.query(`SELECT id FROM users WHERE username = $1`, [chosenUsername])
      if (userConflict.length > 0) {
        chosenUsername = `${chosenUsername}_${Math.floor(100 + Math.random() * 900)}`
      }

      const dummyHash = await bcrypt.hash('otp-auth-' + Math.random(), 10)
      const { rows: created } = await db.query(
        `INSERT INTO users (username, email, password, elo_rating, is_username_set)
         VALUES ($1, $2, $3, 1200, FALSE)
         RETURNING id, username, email, elo_rating, wins, losses, is_username_set, created_at`,
        [chosenUsername, cleanEmail, dummyHash]
      )
      user = created[0]
      isNewUser = true
    } else {
      isNewUser = !user.is_username_set
    }

    const token = signToken(user)
    return res.status(200).json({ token, user, isNewUser })
  } catch (err) {
    console.error('[POST /auth/verify-otp]', err)
    return res.status(500).json({ message: 'Failed to verify OTP' })
  }
})

// ── POST /api/auth/firebase ──────────────────────────────────
router.post('/firebase', async (req, res) => {
  try {
    const { idToken, username } = req.body
    if (!idToken) {
      return res.status(400).json({ message: 'Firebase idToken is required' })
    }

    let decodedEmail = null
    let firebaseUid = null

    if (firebaseAdmin) {
      const decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
      firebaseUid = decoded.uid
      decodedEmail = decoded.email || `${decoded.uid}@firebase.algoarena.dev`
    } else {
      // Decode JWT payload without verification if Admin SDK not setup
      try {
        const parts = idToken.split('.')
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
        firebaseUid = payload.sub || payload.user_id
        decodedEmail = payload.email || `${firebaseUid}@firebase.algoarena.dev`
      } catch {
        return res.status(400).json({ message: 'Invalid Firebase ID token format' })
      }
    }

    const cleanEmail = decodedEmail.toLowerCase()

    // Look up by firebase_uid or email
    const { rows: existing } = await db.query(
      `SELECT id, username, email, elo_rating, wins, losses, firebase_uid, is_username_set
       FROM users WHERE firebase_uid = $1 OR email = $2`,
      [firebaseUid, cleanEmail]
    )

    let user = existing[0]
    let isNewUser = false

    if (!user) {
      let chosenUsername = username ? String(username).trim().toLowerCase() : cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20)
      if (chosenUsername.length < 3) chosenUsername = 'player_' + Math.floor(1000 + Math.random() * 9000)

      const { rows: userConflict } = await db.query(`SELECT id FROM users WHERE username = $1`, [chosenUsername])
      if (userConflict.length > 0) {
        chosenUsername = `${chosenUsername}_${Math.floor(100 + Math.random() * 900)}`
      }

      const dummyHash = await bcrypt.hash('firebase-auth-' + Math.random(), 10)
      const { rows: created } = await db.query(
        `INSERT INTO users (username, email, password, firebase_uid, elo_rating, is_username_set)
         VALUES ($1, $2, $3, $4, 1200, FALSE)
         RETURNING id, username, email, elo_rating, wins, losses, is_username_set, created_at`,
        [chosenUsername, cleanEmail, dummyHash, firebaseUid]
      )
      user = created[0]
      isNewUser = true
    } else {
      if (!user.firebase_uid && firebaseUid) {
        await db.query(`UPDATE users SET firebase_uid = $1 WHERE id = $2`, [firebaseUid, user.id])
      }
      isNewUser = !user.is_username_set
    }

    const token = signToken(user)
    return res.status(200).json({ token, user, isNewUser })
  } catch (err) {
    console.error('[POST /auth/firebase]', err)
    return res.status(500).json({ message: 'Firebase authentication failed' })
  }
})

// ── POST /api/auth/register ──────────────────────────────────
// Now verifies the OTP sent by /send-registration-otp before creating the account
router.post('/register', async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const pending = pendingRegistrations.get(cleanEmail)

    if (!pending) {
      return res.status(400).json({ message: 'Verification code expired. Please go back and try again.' })
    }
    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(cleanEmail)
      return res.status(400).json({ message: 'Verification code has expired. Please go back and try again.' })
    }
    if (pending.attempts >= 5) {
      pendingRegistrations.delete(cleanEmail)
      return res.status(429).json({ message: 'Too many wrong attempts. Please restart registration.' })
    }
    if (pending.otp !== String(otp).trim()) {
      pending.attempts++
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' })
    }

    // Valid — consume the pending registration and create the account
    pendingRegistrations.delete(cleanEmail)

    const { rows } = await db.query(
      `INSERT INTO users (username, email, password, is_username_set)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, username, email, elo_rating, wins, losses, is_username_set, created_at`,
      [pending.username, cleanEmail, pending.passwordHash]
    )
    const user = rows[0]
    const token = signToken(user)

    return res.status(201).json({ token, user })
  } catch (err) {
    if (err.code === '23505') {
      const field = err.detail?.includes('username') ? 'username' : 'email'
      return res.status(409).json({ message: `${field} already taken` })
    }
    console.error('[POST /auth/register]', err)
    return res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    const { rows } = await db.query(
      `SELECT id, username, email, password, elo_rating, wins, losses, is_username_set
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )
    const user = rows[0]

    const passwordToCheck = user?.password || '$2a$12$invalidhashpadding00000000000000000000000000000000000'
    const valid = await bcrypt.compare(password, passwordToCheck)

    if (!user || !valid) {
      return res.status(401).json({ message: 'invalid email or password' })
    }

    const token = signToken(user)
    const { password: _, ...safeUser } = user

    return res.status(200).json({ token, user: safeUser })
  } catch (err) {
    console.error('[POST /auth/login]', err)
    return res.status(500).json({ message: 'internal server error' })
  }
})

// ── POST /api/auth/forgot-password ───────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Check if user exists
    const { rows } = await db.query(`SELECT id FROM users WHERE email = $1`, [cleanEmail])
    if (!rows.length) {
      return res.status(404).json({ message: 'No account found with this email address' })
    }

    // Generate 6-digit reset OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes validity

    otpStore.set(`reset_${cleanEmail}`, { code: otp, expiresAt, attempts: 0 })

    // Send real email
    const mailResult = await mailer.sendPasswordResetOtp(cleanEmail, otp)
    console.log(`🔑 [RESET OTP] ${cleanEmail} -> ${otp} | email sent: ${mailResult.sent}`)

    return res.status(200).json({
      message: 'Password reset code sent to your email',
      email: cleanEmail,
      devOtp: mailResult.devOnly ? otp : undefined,
    })
  } catch (err) {
    console.error('[POST /auth/forgot-password]', err)
    return res.status(500).json({ message: 'Failed to process forgot password request' })
  }
})

// ── POST /api/auth/reset-password ────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const key = `reset_${cleanEmail}`
    const record = otpStore.get(key)

    if (!record) {
      return res.status(400).json({ message: 'Reset code expired or not requested. Please request a new code.' })
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key)
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' })
    }

    if (record.attempts >= 5) {
      otpStore.delete(key)
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' })
    }

    if (record.code !== String(otp).trim()) {
      record.attempts++
      return res.status(400).json({ message: 'Invalid reset code. Please check and try again.' })
    }

    // Valid code -> consume it
    otpStore.delete(key)

    // Hash new password and update user
    const hash = await bcrypt.hash(newPassword, 12)
    const { rows } = await db.query(
      `UPDATE users SET password = $1 WHERE email = $2
       RETURNING id, username, email, elo_rating, wins, losses`,
      [hash, cleanEmail]
    )

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = rows[0]
    const token = signToken(user)

    return res.status(200).json({
      message: 'Password reset successful! You are now signed in.',
      token,
      user,
    })
  } catch (err) {
    console.error('[POST /auth/reset-password]', err)
    return res.status(500).json({ message: 'Failed to reset password' })
  }
})

module.exports = router


