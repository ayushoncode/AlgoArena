/**
 * socket/customRoom.js — Private custom match room creation & join handlers
 */

'use strict'

const { randomBytes } = require('crypto')
const db = require('../db')
const { trackRoom } = require('./match')

// Map<code, CustomRoomEntry>
// CustomRoomEntry = { code, hostUserId, hostUsername, hostRating, hostSocketId, topic, difficulty, createdAt }
const customRooms = new Map()

/** Generate a clean 6-character room code like "ARENA-8K2Y" */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `ARENA-${code}`
}

function registerCustomRoom(io) {
  io.on('connection', (socket) => {
    const { id: userId, username, elo_rating } = socket.user

    /* ── create_custom_room ───────────────────────────────── */
    socket.on('create_custom_room', async ({ topic, difficulty }) => {
      const code = generateRoomCode()
      const roomId = `room:custom_${code}`

      let hostRating = elo_rating ?? 1200
      try {
        const { rows } = await db.query('SELECT elo_rating FROM users WHERE id = $1', [userId])
        if (rows[0]?.elo_rating) hostRating = Number(rows[0].elo_rating) || 1200
      } catch (err) {}

      const roomEntry = {
        code,
        roomId,
        hostUserId: userId,
        hostUsername: username,
        hostRating,
        hostSocketId: socket.id,
        topic,
        difficulty,
        createdAt: Date.now(),
      }

      customRooms.set(code, roomEntry)
      socket.join(roomId)

      console.log(`[CustomRoom] created code=${code} host=${username} topic=${topic}:${difficulty}`)

      socket.emit('custom_room_created', {
        code,
        roomId,
        topic,
        difficulty,
        hostUsername: username,
      })
    })

    /* ── join_custom_room ─────────────────────────────────── */
    socket.on('join_custom_room', async ({ code }) => {
      const formattedCode = String(code || '').trim().toUpperCase()
      const roomEntry = customRooms.get(formattedCode)

      if (!roomEntry) {
        return socket.emit('custom_room_error', { message: 'Invalid or expired room code' })
      }

      if (roomEntry.hostUserId === userId) {
        return socket.emit('custom_room_error', { message: 'You are already the host of this room' })
      }

      const { roomId, topic, difficulty, hostUserId, hostUsername, hostRating, hostSocketId } = roomEntry

      let guestRating = elo_rating ?? 1200
      try {
        const { rows } = await db.query('SELECT elo_rating FROM users WHERE id = $1', [userId])
        if (rows[0]?.elo_rating) guestRating = Number(rows[0].elo_rating) || 1200
      } catch (err) {}

      // Both sockets join the room
      socket.join(roomId)
      const hostSocket = io.sockets.sockets.get(hostSocketId)
      if (hostSocket) hostSocket.join(roomId)

      console.log(`[CustomRoom] MATCH  host=${hostUsername} vs guest=${username}  code=${formattedCode}`)

      ;(async () => {
        try {
          const { rows: hostRows } = await db.query('SELECT avatar_seed, avatar_style FROM users WHERE id = $1', [hostUserId])
          const { rows: guestRows } = await db.query('SELECT avatar_seed, avatar_style FROM users WHERE id = $1', [userId])
          const hostSeed = hostRows[0]?.avatar_seed ?? null
          const hostStyle = hostRows[0]?.avatar_style ?? null
          const guestSeed = guestRows[0]?.avatar_seed ?? null
          const guestStyle = guestRows[0]?.avatar_style ?? null

          const { rows: problems } = await db.query(
            `SELECT id FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 1`,
            [topic, difficulty]
          )
          const problemId = problems[0]?.id ?? null
          const { rows } = await db.query(
            `INSERT INTO matches (player_one_id, player_two_id, problem_id, topic, difficulty, status)
             VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
            [hostUserId, userId, problemId, topic, difficulty]
          )
          const dbMatchId = rows[0]?.id ?? null

          const matchPayload = {
            roomId,
            topic,
            difficulty,
            problemId,
            dbMatchId,
            isCustom: true,
            players: [
              { userId: hostUserId, username: hostUsername, rating: hostRating, avatar_seed: hostSeed, avatar_style: hostStyle },
              { userId, username, rating: guestRating, avatar_seed: guestSeed, avatar_style: guestStyle },
            ],
          }

          trackRoom(roomId, dbMatchId, problemId, true, matchPayload.players, topic, difficulty)
          console.log(`[DB] custom match row created  id=${dbMatchId}  room=${roomId}  prob=${problemId}`)

          io.to(roomId).emit('match_found', matchPayload)
        } catch (err) {
          console.error('[DB] custom createMatchRow failed:', err.message)
          const fallbackPayload = {
            roomId,
            topic,
            difficulty,
            problemId: null,
            isCustom: true,
            players: [
              { userId: hostUserId, username: hostUsername, rating: hostRating },
              { userId, username, rating: guestRating },
            ],
          }
          trackRoom(roomId, null, null, true, fallbackPayload.players, topic, difficulty)
          io.to(roomId).emit('match_found', fallbackPayload)
        }
      })()

      // Cleanup room code from memory
      customRooms.delete(formattedCode)
    })

    /* ── cancel_custom_room ───────────────────────────────── */
    socket.on('cancel_custom_room', ({ code }) => {
      const formattedCode = String(code || '').trim().toUpperCase()
      const roomEntry = customRooms.get(formattedCode)
      if (roomEntry && roomEntry.hostUserId === userId) {
        customRooms.delete(formattedCode)
        console.log(`[CustomRoom] cancelled code=${formattedCode} host=${username}`)
        socket.emit('custom_room_cancelled')
      }
    })

    /* ── disconnect cleanup ───────────────────────────────── */
    socket.on('disconnect', () => {
      for (const [code, room] of customRooms.entries()) {
        if (room.hostSocketId === socket.id) {
          customRooms.delete(code)
          console.log(`[CustomRoom] host disconnected — removed code=${code}`)
        }
      }
    })
  })
}

module.exports = { registerCustomRoom }
