import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * useSocket — creates and manages a Socket.io connection.
 * Stub: event wiring (join_queue, match_found, etc.) added in Day 9.
 *
 * @param {boolean} enabled - set to false to skip connecting (e.g. unauthenticated)
 * @returns {{ socket: Socket | null }}
 */
export function useSocket(enabled = true) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      // auth token will be added in Day 9 once backend auth middleware is in place
    })

    socket.on('connect', () => {
      console.log('[Socket] connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket] connection error:', err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled])

  return { socket: socketRef.current }
}
