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
const db              = require('../db')
const { trackRoom }   = require('./match')

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
    socket.on('join_queue', async ({ topic, difficulty }) => {
      let rating = elo_rating ?? 1200
      try {
        const { rows } = await db.query('SELECT elo_rating FROM users WHERE id = $1', [userId])
        if (rows[0]?.elo_rating) {
          rating = Number(rows[0].elo_rating) || 1200
          socket.user.elo_rating = rating
        }
      } catch (err) {
        console.warn('[Queue] Could not fetch fresh rating from DB:', err.message)
      }

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
          // problemId filled in below after DB insert
        }

        io.to(roomId).emit('match_found', matchPayload)

        // Persist match to DB and link to room state; then update problem
        ;(async () => {
          try {
            const { rows: problems } = await db.query(
              `SELECT id FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 1`,
              [topic, difficulty]
            )
            const problemId = problems[0]?.id ?? null
            const { rows } = await db.query(
              `INSERT INTO matches (player_one_id, player_two_id, problem_id, topic, difficulty, status)
               VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
              [newEntry.userId, opponent.userId, problemId, topic, difficulty]
            )
            const dbMatchId = rows[0]?.id ?? null
            if (dbMatchId) {
              trackRoom(roomId, dbMatchId, problemId, false, matchPayload.players, topic, difficulty)
              console.log(`[DB] match row created  id=${dbMatchId}  room=${roomId}  prob=${problemId}`)
              // Now that we know problemId, push an update so clients can pin the exact problem
              io.to(roomId).emit('match_problem_set', { roomId, problemId })
            }
          } catch (err) {
            console.error('[DB] createMatchRow failed:', err.message)
          }
        })()

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
