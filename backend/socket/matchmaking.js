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
const { trackRoom, isUserInActiveMatch } = require('./match')

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

/** Remove a socketId or userId from every queue bucket */
function removeFromQueues(socketId, userId = null) {
  for (const [key, bucket] of queues.entries()) {
    const before = bucket.length
    const filtered = bucket.filter(e => e.socketId !== socketId && (!userId || e.userId !== userId))
    if (filtered.length !== before) {
      queues.set(key, filtered)
      console.log(`[Queue] removed socket=${socketId} user=${userId} from ${key} (${before} → ${filtered.length})`)
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
    if (candidate.socketId === newEntry.socketId || candidate.userId === newEntry.userId) continue

    // Use the LARGER band (the player who has been waiting longer)
    const band = Math.max(currentBand(candidate.joinedAt), currentBand(newEntry.joinedAt))
    const diff = Math.abs(candidate.rating - newEntry.rating)

    if (diff <= band) return { opponent: candidate, index: i }
  }
  return null
}

/**
 * Execute a match between two waiting entries
 */
async function executeMatch(io, entryA, entryB, topic, difficulty) {
  const roomId = makeRoomId()
  const socketA = io.sockets.sockets.get(entryA.socketId)
  const socketB = io.sockets.sockets.get(entryB.socketId)

  if (socketA) socketA.join(roomId)
  if (socketB) socketB.join(roomId)

  try {
    const { rows: problems } = await db.query(
      `SELECT id FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 1`,
      [topic, difficulty]
    )
    const problemId = problems[0]?.id ?? null
    const { rows } = await db.query(
      `INSERT INTO matches (player_one_id, player_two_id, problem_id, topic, difficulty, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
      [entryA.userId, entryB.userId, problemId, topic, difficulty]
    )
    const dbMatchId = rows[0]?.id ?? null

    const matchPayload = {
      roomId,
      topic,
      difficulty,
      problemId,
      dbMatchId,
      players: [
        { userId: entryA.userId, username: entryA.username, rating: entryA.rating, avatar_seed: entryA.avatar_seed, avatar_style: entryA.avatar_style },
        { userId: entryB.userId, username: entryB.username, rating: entryB.rating, avatar_seed: entryB.avatar_seed, avatar_style: entryB.avatar_style },
      ],
    }

    trackRoom(roomId, dbMatchId, problemId, false, matchPayload.players, topic, difficulty)
    console.log(`[DB] match row created id=${dbMatchId} room=${roomId} prob=${problemId}`)

    // Emit to room and directly to both sockets to guarantee arrival
    io.to(roomId).emit('match_found', matchPayload)
    if (socketA) socketA.emit('match_found', matchPayload)
    if (socketB) socketB.emit('match_found', matchPayload)
  } catch (err) {
    console.error('[DB] createMatchRow failed:', err.message)
    const fallbackPayload = {
      roomId,
      topic,
      difficulty,
      problemId: null,
      players: [
        { userId: entryA.userId, username: entryA.username, rating: entryA.rating, avatar_seed: entryA.avatar_seed, avatar_style: entryA.avatar_style },
        { userId: entryB.userId, username: entryB.username, rating: entryB.rating, avatar_seed: entryB.avatar_seed, avatar_style: entryB.avatar_style },
      ],
    }
    trackRoom(roomId, null, null, false, fallbackPayload.players, topic, difficulty)
    io.to(roomId).emit('match_found', fallbackPayload)
    if (socketA) socketA.emit('match_found', fallbackPayload)
    if (socketB) socketB.emit('match_found', fallbackPayload)
  }

  console.log(`[Queue] MATCH ${entryA.username} (${entryA.rating}) vs ${entryB.username} (${entryB.rating}) room=${roomId}`)
}

/**
 * Periodically evaluate waiting queues to match players whose Elo bands expanded
 */
function sweepQueues(io) {
  for (const [topicKey, bucket] of queues.entries()) {
    if (bucket.length < 2) continue
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const p1 = bucket[i]
        const p2 = bucket[j]
        if (p1.socketId === p2.socketId || p1.userId === p2.userId) continue
        const band = Math.max(currentBand(p1.joinedAt), currentBand(p2.joinedAt))
        const diff = Math.abs(p1.rating - p2.rating)
        if (diff <= band) {
          bucket.splice(j, 1)
          bucket.splice(i, 1)
          const [t, d] = topicKey.split(':')
          executeMatch(io, p1, p2, t, d)
          return
        }
      }
    }
  }
}

/* ════════════════════════════════════════════════
   REGISTER
════════════════════════════════════════════════ */
function registerMatchmaking(io) {
  // Start queue evaluation interval (every 1s)
  setInterval(() => sweepQueues(io), 1000)

  io.on('connection', (socket) => {
    const { id: userId, username, elo_rating } = socket.user

    console.log(`[Socket] authed  user=${username}  id=${socket.id}  transport=${socket.conn.transport.name}`)

    // ── Multiple Tab Support ─────────────────────
    // Removed single active session enforcement so users can open multiple tabs.

    /* ── join_queue ─────────────────────────────────────── */
    socket.on('join_queue', async ({ topic, difficulty }) => {
      let rating = elo_rating ?? 1200
      let avatar_seed = socket.user.avatar_seed ?? null
      let avatar_style = socket.user.avatar_style ?? null
      try {
        const { rows } = await db.query('SELECT elo_rating, avatar_seed, avatar_style FROM users WHERE id = $1', [userId])
        if (rows[0]) {
          rating = Number(rows[0].elo_rating) || rating
          socket.user.elo_rating = rating
          avatar_seed = rows[0].avatar_seed ?? avatar_seed
          avatar_style = rows[0].avatar_style ?? avatar_style
          socket.user.avatar_seed = avatar_seed
          socket.user.avatar_style = avatar_style
        }
      } catch (err) {
        console.warn('[Queue] Could not fetch fresh user info from DB:', err.message)
      }

      const topicKey = `${topic}:${difficulty}`

      // Guard: don't let user join if they are already in an active match
      if (isUserInActiveMatch(userId)) {
        console.warn(`[Queue] User ${username} tried to join queue while in active match`)
        return
      }

      // Guard: don't let same user join twice from any window
      removeFromQueues(socket.id, userId)

      const newEntry = {
        socketId:   socket.id,
        userId,
        username,
        rating,
        avatar_seed,
        avatar_style,
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
        executeMatch(io, newEntry, opponent, topic, difficulty)
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
