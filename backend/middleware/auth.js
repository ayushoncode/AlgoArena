/**
 * middleware/auth.js — JWT verification middleware
 *
 * Attaches the decoded payload to req.user on success.
 * Protected routes call `authMiddleware` before their handler.
 *
 * Usage:
 *   router.get('/me', authMiddleware, (req, res) => res.json(req.user))
 */

const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.slice(7) // strip "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, username, elo_rating, iat, exp }
    next()
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expired — please log in again'
      : 'Invalid token'
    return res.status(401).json({ message })
  }
}

module.exports = authMiddleware
