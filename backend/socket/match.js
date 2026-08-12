/**
 * socket/match.js — in-match socket events
 *
 * Handles submit_code from either player in a room:
 *   1. Emits submission_result back to the room (stub judge for now)
 *   2. If ACCEPTED → emits match_end to the whole room
 *
 * Day 43: replace stub judge with real test-case runner (BullMQ + sandbox).
 * Day 43: update Elo in DB after match_end.
 */

'use strict'

const { calculateElo } = require('../utils/elo')

// ── In-memory match state ──────────────────────────────────
// Map<roomId, MatchState>
// MatchState = { players: [...], submissions: Map<userId, verdict>, startedAt }
const activeMatches = new Map()

/* ── Stub judge ────────────────────────────────────────────
 * Real implementation: BullMQ job → Docker sandbox → compare stdout
 * For now: weighted random so the demo works end-to-end.
 * ACCEPTED probability = 0.65 (feels realistic for first submit)
 */
function stubJudge(code, language) {
  // If code is the unmodified template stub → always wrong
  const untouched = [
    'write your solution here',
    '# write your solution here',
  ]
  if (untouched.some(s => code.includes(s))) {
    return 'WRONG_ANSWER'
  }
  // Otherwise weighted random
  const r = Math.random()
  if (r < 0.65) return 'ACCEPTED'
  if (r < 0.80) return 'WRONG_ANSWER'
  if (r < 0.90) return 'TIME_LIMIT_EXCEEDED'
  return 'RUNTIME_ERROR'
}

function registerMatch(io) {
  io.on('connection', (socket) => {

    /* ── submit_code ──────────────────────────────────────── */
    socket.on('submit_code', ({ roomId, code, language, topic, difficulty }) => {
      const { id: userId, username, elo_rating } = socket.user

      console.log(`[Match] submit_code  user=${username}  room=${roomId}  lang=${language}`)

      // Initialise match state if not already tracked
      if (!activeMatches.has(roomId)) {
        activeMatches.set(roomId, {
          topic,
          difficulty,
          submissions: new Map(),  // userId → verdict
          startedAt: Date.now(),
        })
      }
      const match = activeMatches.get(roomId)

      // Don't allow re-submitting after an ACCEPTED
      if (match.submissions.get(userId) === 'ACCEPTED') return

      // ── Run stub judge ────────────────────────────────────
      const verdict = stubJudge(code, language)
      match.submissions.set(userId, verdict)

      console.log(`[Match] verdict  user=${username}  verdict=${verdict}  room=${roomId}`)

      // Broadcast result to everyone in the room
      io.to(roomId).emit('submission_result', {
        userId,
        username,
        verdict,
      })

      // ── If ACCEPTED → end the match ───────────────────────
      if (verdict === 'ACCEPTED') {
        // Find opponent in the room
        const sockets = io.sockets.adapter.rooms.get(roomId)
        let opponent  = null

        for (const sid of (sockets ?? [])) {
          const s = io.sockets.sockets.get(sid)
          if (s && s.user.id !== userId) {
            opponent = s.user
            break
          }
        }

        // Compute Elo deltas
        const winnerRating  = elo_rating      ?? 1200
        const loserRating   = opponent?.elo_rating ?? 1200
        const { winnerDelta, loserDelta } = calculateElo({ winnerRating, loserRating })

        const payload = {
          roomId,
          topic,
          difficulty,
          winner:  { userId, username, rating: winnerRating, delta: winnerDelta },
          loser:   opponent
            ? { userId: opponent.id, username: opponent.username, rating: loserRating, delta: loserDelta }
            : null,
        }

        io.to(roomId).emit('match_end', payload)

        console.log(
          `[Match] ENDED  winner=${username}(+${winnerDelta})  loser=${opponent?.username ?? '?'}(${loserDelta})  room=${roomId}`
        )

        // Clean up
        activeMatches.delete(roomId)
      }
    })
  })
}

/** Expose for /queue-stats equivalent (future admin panel) */
function matchStats() {
  const stats = {}
  for (const [roomId, m] of activeMatches.entries()) {
    stats[roomId] = {
      topic: m.topic,
      difficulty: m.difficulty,
      ageSeconds: Math.round((Date.now() - m.startedAt) / 1000),
      submissions: Object.fromEntries(m.submissions),
    }
  }
  return stats
}

module.exports = { registerMatch, matchStats }
