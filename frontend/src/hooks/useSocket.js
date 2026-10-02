/**
 * hooks/useSocket.js
 *
 * Connects the singleton socket when the user is authenticated,
 * disconnects when they log out, and exposes:
 *
 *   const { connected, emit, on, off } = useSocket()
 *
 * Usage example (Day 11 — Lobby matchmaking):
 *   const { emit } = useSocket()
 *   emit('join_queue', { topic, difficulty, rating })
 *
 * Usage example (Day 22 — match events):
 *   const { on, off } = useSocket()
 *   useEffect(() => {
 *     on('match_found', handler)
 *     return () => off('match_found', handler)
 *   }, [])
 */

import { useEffect, useState, useCallback } from 'react'
import socket from '../utils/socket'
import { useAuth } from './useAuth'

export function useSocket() {
  const { isAuthenticated, logout } = useAuth()
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    // Connect when authenticated, disconnect when not
    if (isAuthenticated && !socket.connected) {
      socket.connect()
    } else if (!isAuthenticated && socket.connected) {
      socket.disconnect()
    }

    // Track connection state for consumers
    function onConnect()     { setConnected(true)  }
    function onDisconnect()  { setConnected(false) }
    function onForceLogout({ message }) {
      console.warn('[Socket] force_logout received:', message)
      // Removed logout() to prevent localStorage clearing across tabs
      socket.disconnect()
    }

    socket.on('connect',      onConnect)
    socket.on('disconnect',   onDisconnect)
    socket.on('force_logout', onForceLogout)

    return () => {
      socket.off('connect',      onConnect)
      socket.off('disconnect',   onDisconnect)
      socket.off('force_logout', onForceLogout)
    }
  }, [isAuthenticated, logout])

  /** emit(event, data) — fire-and-forget */
  const emit = useCallback((event, data) => {
    if (!socket.connected) {
      console.warn(`[Socket] tried to emit "${event}" but socket is not connected`)
      return
    }
    socket.emit(event, data)
  }, [])

  /** on(event, handler) — register a listener */
  const on = useCallback((event, handler) => {
    socket.on(event, handler)
  }, [])

  /** off(event, handler) — remove a listener */
  const off = useCallback((event, handler) => {
    socket.off(event, handler)
  }, [])

  return { connected, emit, on, off, socket }
}
