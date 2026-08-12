/**
 * socket/matchmaking.js — In-memory matchmaking queue
 *
 * Data model:
 *   queues: Map<topicKey, WaitingEntry[]>
 *   topicKey = `${topic}:${difficulty}`   e.g. "arrays:medium"
 *
 * WaitingEntry = {
 *   socketId  : string
 *   userId    : number
 *   username  : string
 *   rating    : number
 *   topic     : string
 *   difficulty: string
 *   joinedAt  : number   (Date.now())
 * }
 *
 * Matching algorithm:
 *   1. Player emits join_queue → entry pushed onto their topicKey queue
 *   2. Scan queue for the oldest waiting player within the current Elo band
 *      band = 100 + floor(waitSeconds / 10) × 100   (grows every 10 s)
 *   3. If match found → create room, emit match_found to both, remove both
 *   4. On disconnect → remove from all queues
 *
 * Room ID = `room:${matchId}` where matchId is a small random hex string.
 * Day 43: replace with DB-persisted match rows.
 */

'use strict'

const { randomBytes } = require('crypto')

// ── In-memory queue ────────────────────────────────────────────
// Map<topicKey, WaitingEntry[]>
const queues = new Map()

/** Current Elo band for a player who joined at `joinedAt` */
function currentBand(joinedAt) {
  const waitSec = (Date.now() - joinedAt) / 1000
  return 100 + Math.floor(waitSec / 10) * 100   // grows by 100 every 10 s
}

/** Generate a short match room ID */
function makeRoomId() {
  return `room:${randomBytes(6).toString('hex')}`
}

/** Remove a socketId from every queue bucket */
function removeFromQueues(socketId) {
  for (const [key, bucket] of queues.entries()) {
    const before = bucket.length
    const filtered = bucket.filter(e => e.socketId !== socketId)
    if (filtered.length !== before) {
      queues.set(key, filtered)
      console.log(`[Queue] removed ${socketId} from ${key} (${before} → ${filtered.length})`)
    }
  }
}

/**
 * Try to find a match for a new entrant in the given bucket.
 * Returns the matched WaitingEntry or null.
 */
function findOpponent(bucket, newEntry) {
  for (let i = 0; i < bucket.length; i++) {
    const candidate = bucket[i]
    if (candidate.socketId === newEntry.socketId) continue

    // Use the LARGER band (the player who has been waiting longer)
    const band = Math.max(currentBand(candidate.joinedAt), currentBand(newEntry.joinedAt))
    const diff = Math.abs(candidate.rating - newEntry.rating)

    if (diff <= band) return { opponent: candidate, index: i }
  }
  return null
}

/* ════════════════════════════════════════════════
   REGISTER
════════════════════════════════════════════════ */
function registerMatchmaking(io) {
  io.on('connection', (socket) => {
    const { id: userId, username, elo_rating } = socket.user

    console.log(`[Socket] authed  user=${username}  id=${socket.id}  transport=${socket.conn.transport.name}`)

    /* ── join_queue ─────────────────────────────────────── */
    socket.on('join_queue', ({ topic, difficulty }) => {
      const rating = elo_rating ?? 1200    // use the JWT payload rating
      const topicKey = `${topic}:${difficulty}`

      // Guard: don't let same user join twice
      removeFromQueues(socket.id)

      const newEntry = {
        socketId:   socket.id,
        userId,
        username,
        rating,
        topic,
        difficulty,
        joinedAt:   Date.now(),
      }

      if (!queues.has(topicKey)) queues.set(topicKey, [])
      const bucket = queues.get(topicKey)

      console.log(`[Queue] ${username} (${rating}) → ${topicKey}  queue size before: ${bucket.length}`)

      // Attempt immediate match
      const result = findOpponent(bucket, newEntry)

      if (result) {
        // ── Match found! ──────────────────────────────────
        const { opponent, index } = result
        bucket.splice(index, 1)   // remove opponent from queue

        const roomId = makeRoomId()

        // Both players join the Socket.io room
        socket.join(roomId)
        io.sockets.sockets.get(opponent.socketId)?.join(roomId)

        const matchPayload = {
          roomId,
          topic,
          difficulty,
          players: [
            { userId: newEntry.userId,  username: newEntry.username,  rating: newEntry.rating  },
            { userId: opponent.userId,  username: opponent.username,  rating: opponent.rating  },
          ],
        }

        io.to(roomId).emit('match_found', matchPayload)

        console.log(`[Queue] MATCH  ${username} (${rating}) vs ${opponent.username} (${opponent.rating})  room=${roomId}  topic=${topicKey}`)
      } else {
        // ── No match yet — push into queue ────────────────
        bucket.push(newEntry)
        socket.emit('queue_status', { status: 'waiting', position: bucket.length, topic, difficulty })
        console.log(`[Queue] waiting  ${username}  ${topicKey}  queue size: ${bucket.length}`)
      }
    })

    /* ── leave_queue ────────────────────────────────────── */
    socket.on('leave_queue', () => {
      removeFromQueues(socket.id)
      socket.emit('queue_status', { status: 'cancelled' })
      console.log(`[Queue] ${username} left queue`)
    })

    /* ── disconnect ─────────────────────────────────────── */
    socket.on('disconnect', (reason) => {
      removeFromQueues(socket.id)
      console.log(`[Socket] disconnected  user=${username}  id=${socket.id}  reason=${reason}`)
    })
  })
}

/* ── Debug helper — exposed for /health or tests ──────── */
function queueStats() {
  const stats = {}
  for (const [key, bucket] of queues.entries()) {
    stats[key] = bucket.map(e => ({ username: e.username, rating: e.rating, waitSec: Math.round((Date.now() - e.joinedAt) / 1000) }))
  }
  return stats
}

module.exports = { registerMatchmaking, queueStats }
