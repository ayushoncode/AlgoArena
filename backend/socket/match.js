/**
 * socket/match.js — in-match socket events + DB persistence
 *
 * Flow:
 *  1. match_found (from matchmaking) → create match row in DB
 *  2. submit_code → stub judge → emit submission_result
 *  3. ACCEPTED → resolveMatch() → update users Elo, insert elo_history, finish match row
 *
 * Day 43: replace stubJudge with real BullMQ + Docker sandbox.
 */

'use strict'

const db             = require('../db')
const { calculateElo } = require('../utils/elo')

// ── In-memory active matches ───────────────────────────────────
// Map<roomId, { dbMatchId, topic, difficulty, submissions, startedAt }>
const activeMatches = new Map()

/* ── Stub judge ────────────────────────────────────────────────
 * Real implementation: BullMQ → Docker sandbox → stdout compare
 */
function stubJudge(code) {
  const untouched = ['write your solution here', '# write your solution here']
  if (untouched.some(s => code.includes(s))) return 'WRONG_ANSWER'
  const r = Math.random()
  if (r < 0.65) return 'ACCEPTED'
  if (r < 0.80) return 'WRONG_ANSWER'
  if (r < 0.90) return 'TIME_LIMIT_EXCEEDED'
  return 'RUNTIME_ERROR'
}

/* ── Create match row in DB ────────────────────────────────────
 * Called when match_found fires (both sockets join the room).
 * Returns the new match UUID.
 */
async function createMatchRow({ playerOneId, playerTwoId, topic, difficulty }) {
  try {
    // Pick a random problem for the topic + difficulty
    const { rows: problems } = await db.query(
      `SELECT id FROM problems
       WHERE topic = $1 AND difficulty = $2
       ORDER BY RANDOM()
       LIMIT 1`,
      [topic, difficulty]
    )
    const problemId = problems[0]?.id ?? null  // null if no seed yet

    const { rows } = await db.query(
      `INSERT INTO matches (player_one_id, player_two_id, problem_id, topic, difficulty, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [playerOneId, playerTwoId, problemId, topic, difficulty]
    )
    const matchId = rows[0].id
    console.log(`[DB] match created  id=${matchId}  topic=${topic}:${difficulty}`)
    return matchId
  } catch (err) {
    console.error('[DB] createMatchRow failed:', err.message)
    return null
  }
}

/* ── Resolve match: update Elo, write history, finish match row ─ */
async function resolveMatch({ dbMatchId, winner, loser, winnerDelta, loserDelta }) {
  if (!dbMatchId) return   // no DB row, skip gracefully

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    // Update winner
    await client.query(
      `UPDATE users
       SET elo_rating = elo_rating + $1, wins = wins + 1
       WHERE id = $2`,
      [winnerDelta, winner.userId]
    )
    // Update loser
    await client.query(
      `UPDATE users
       SET elo_rating = GREATEST(100, elo_rating + $1), losses = losses + 1
       WHERE id = $2`,
      [loserDelta, loser.userId]
    )

    // Elo history rows
    await client.query(
      `INSERT INTO elo_history (user_id, match_id, old_rating, new_rating, delta)
       VALUES ($1, $2, $3, $4, $5)`,
      [winner.userId, dbMatchId, winner.rating, winner.rating + winnerDelta, winnerDelta]
    )
    if (loser.userId) {
      await client.query(
        `INSERT INTO elo_history (user_id, match_id, old_rating, new_rating, delta)
         VALUES ($1, $2, $3, $4, $5)`,
        [loser.userId, dbMatchId, loser.rating, loser.rating + loserDelta, loserDelta]
      )
    }

    // Close match row
    await client.query(
      `UPDATE matches
       SET status = 'finished', winner_id = $1, ended_at = NOW()
       WHERE id = $2`,
      [winner.userId, dbMatchId]
    )

    await client.query('COMMIT')
    console.log(`[DB] match resolved  id=${dbMatchId}  winner=${winner.username}  Δ${winnerDelta}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[DB] resolveMatch transaction failed:', err.message)
  } finally {
    client.release()
  }
}

/* ════════════════════════════════════════════════
   REGISTER
════════════════════════════════════════════════ */
function registerMatch(io) {
  // Hook into matchmaking: when a room is created, persist to DB
  // We expose createMatchRow so matchmaking.js can call it
  io._createMatchRow = createMatchRow

  io.on('connection', (socket) => {
    const { id: userId, username, elo_rating } = socket.user

    /* ── submit_code ──────────────────────────────────────── */
    socket.on('submit_code', async ({ roomId, code, language, topic, difficulty }) => {
      console.log(`[Match] submit_code  user=${username}  room=${roomId}  lang=${language}`)

      if (!activeMatches.has(roomId)) {
        activeMatches.set(roomId, {
          dbMatchId:   null,   // set by matchmaking when room was created
          topic,
          difficulty,
          submissions: new Map(),
          startedAt:   Date.now(),
        })
      }
      const match = activeMatches.get(roomId)
      if (match.submissions.get(userId) === 'ACCEPTED') return

      const verdict = stubJudge(code)
      match.submissions.set(userId, verdict)

      console.log(`[Match] verdict  user=${username}  verdict=${verdict}  room=${roomId}`)

      io.to(roomId).emit('submission_result', { userId, username, verdict })

      if (verdict === 'ACCEPTED') {
        // Find opponent socket
        const sockets = io.sockets.adapter.rooms.get(roomId)
        let opponent  = null
        for (const sid of (sockets ?? [])) {
          const s = io.sockets.sockets.get(sid)
          if (s && s.user.id !== userId) { opponent = s.user; break }
        }

        const winnerRating = elo_rating    ?? 1200
        const loserRating  = opponent?.elo_rating ?? 1200
        const { winnerDelta, loserDelta } = calculateElo({ winnerRating, loserRating })

        const payload = {
          roomId,
          topic,
          difficulty,
          winner: { userId, username,            rating: winnerRating, delta: winnerDelta },
          loser:  opponent
            ? { userId: opponent.id, username: opponent.username, rating: loserRating, delta: loserDelta }
            : null,
        }

        io.to(roomId).emit('match_end', payload)
        console.log(`[Match] ENDED  winner=${username}(+${winnerDelta})  loser=${opponent?.username ?? '?'}(${loserDelta})  room=${roomId}`)

        // Persist to DB
        await resolveMatch({
          dbMatchId:   match.dbMatchId,
          winner:      payload.winner,
          loser:       payload.loser ?? { userId: null, rating: loserRating },
          winnerDelta,
          loserDelta,
        })

        activeMatches.delete(roomId)
      }
    })
  })
}

/* ── Called by matchmaking when a room is created ────────────── */
function trackRoom(roomId, dbMatchId) {
  if (activeMatches.has(roomId)) {
    activeMatches.get(roomId).dbMatchId = dbMatchId
  } else {
    activeMatches.set(roomId, { dbMatchId, submissions: new Map(), startedAt: Date.now() })
  }
}

module.exports = { registerMatch, trackRoom }
