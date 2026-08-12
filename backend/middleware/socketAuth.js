/**
 * middleware/socketAuth.js — Socket.io JWT authentication middleware
 *
 * Applied via io.use() before any socket is accepted.
 * On success: attaches decoded payload to socket.user
 *             so every handler knows who the socket belongs to.
 * On failure: calls next(new Error('...')) which Socket.io
 *             turns into a connect_error event on the client.
 *
 * Usage in index.js:
 *   const socketAuth = require('./middleware/socketAuth')
 *   io.use(socketAuth)
 *
 * Usage in handlers:
 *   io.on('connection', (socket) => {
 *     console.log(socket.user.username) // 'ayushoncode'
 *   })
 */

const jwt = require('jsonwebtoken')

function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token

  if (!token) {
    return next(new Error('AUTH_MISSING: no token in socket handshake'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user   = decoded  // { id, username, elo_rating, iat, exp }
    next()
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'AUTH_EXPIRED: token expired — reconnect to refresh'
      : 'AUTH_INVALID: bad token'
    next(new Error(message))
  }
}

module.exports = socketAuth
