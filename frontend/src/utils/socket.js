/**
 * utils/socket.js — Socket.io-client singleton
 *
 * One socket per app lifetime. Starts disconnected (autoConnect: false).
 * Connect after auth: socket.connect()
 * Disconnect on logout: socket.disconnect()
 *
 * Day 9: JWT injected into the socket.auth handshake payload so the
 * backend can verify identity before accepting the connection.
 */

import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const socket = io(BACKEND_URL, {
  autoConnect:         false,
  transports:          ['websocket', 'polling'],
  withCredentials:     true,
  reconnectionAttempts: 5,
  reconnectionDelay:   1500,

  // ── Day 9: JWT handshake ────────────────────────────────
  // socket.auth is re-read before every connection attempt (including reconnects),
  // so if the token is refreshed the new value is picked up automatically.
  auth: (cb) => {
    const token = localStorage.getItem('aa_token')
    cb({ token: token ?? '' })
  },
})

// ── Dev-only lifecycle logging ─────────────────────────────
if (import.meta.env.DEV) {
  socket.on('connect',          ()  => console.log('[Socket] connected  ✓', socket.id))
  socket.on('disconnect',       (r) => console.log('[Socket] disconnected', r))
  socket.on('connect_error',    (e) => console.warn('[Socket] connect_error:', e.message))
  socket.on('reconnect',        (n) => console.log(`[Socket] reconnected after ${n} tries`))
  socket.on('reconnect_failed', ()  => console.error('[Socket] gave up reconnecting'))
}

export default socket
