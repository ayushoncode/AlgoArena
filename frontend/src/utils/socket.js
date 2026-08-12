/**
 * utils/socket.js — Socket.io-client singleton
 *
 * We create ONE socket instance for the entire app lifetime.
 * Components never call `io()` directly — they import this module.
 *
 * The socket starts disconnected (autoConnect: false).
 * Call socket.connect() when the user is authenticated (see useSocket.js).
 * Call socket.disconnect() on logout.
 *
 * Why a singleton?
 *   If every component called io() it would open multiple WebSocket connections.
 *   A singleton means one TCP connection shared across all hooks and pages.
 */

import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const socket = io(BACKEND_URL, {
  autoConnect: false,          // we connect manually after auth
  transports: ['websocket', 'polling'],  // prefer WS, fall back to long-poll
  withCredentials: true,       // send cookies if we ever add them
  reconnectionAttempts: 5,     // give up after 5 failed reconnects
  reconnectionDelay: 1500,     // wait 1.5s between attempts
})

// ── Dev-only lifecycle logging ─────────────────────────────────
if (import.meta.env.DEV) {
  socket.on('connect',           ()  => console.log('[Socket] connected  ✓', socket.id))
  socket.on('disconnect',        (r) => console.log('[Socket] disconnected', r))
  socket.on('connect_error',     (e) => console.warn('[Socket] connect_error', e.message))
  socket.on('reconnect',         (n) => console.log(`[Socket] reconnected after ${n} attempts`))
  socket.on('reconnect_failed',  ()  => console.error('[Socket] reconnection failed — gave up'))
}

export default socket
