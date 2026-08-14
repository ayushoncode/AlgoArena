/**
 * socket/match.js — in-match socket events, DB persistence, real code evaluation, & forfeit recovery
 */

'use strict'

const db                   = require('../db')
const { calculateElo }      = require('../utils/elo')
const { evaluateSubmission } = require('../services/judge')

// ── In-memory active matches ───────────────────────────────────
// Map<roomId, { dbMatchId, problemId, topic, difficulty, players, isCustom, submissions, startedAt, disconnectTimers }>
const activeMatches = new Map()

/* ── Create match row in DB ──────────────────────────────────── */
async function createMatchRow({ playerOneId, playerTwoId, topic, difficulty }) {
  try {
    const { rows: problems } = await db.query(
      `SELECT id FROM problems
       WHERE topic = $1 AND difficulty = $2
       ORDER BY RANDOM()
       LIMIT 1`,
      [topic, difficulty]
    )
    const problemId = problems[0]?.id ?? null

    const { rows } = await db.query(
      `INSERT INTO matches (player_one_id, player_two_id, problem_id, topic, difficulty, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [playerOneId, playerTwoId, problemId, topic, difficulty]
    )
    const matchId = rows[0].id
    console.log(`[DB] match created  id=${matchId}  topic=${topic}:${difficulty}  problemId=${problemId}`)
    return { matchId, problemId }
  } catch (err) {
    console.error('[DB] createMatchRow failed:', err.message)
    return { matchId: null, problemId: null }
  }
}

/* ── Resolve match: update Elo, write history, finish match row ─ */
async function resolveMatch({ dbMatchId, winner, loser, winnerDelta, loserDelta, isCustom = false }) {
  if (!dbMatchId) return

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    if (!isCustom) {
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
    }

    // Close match row
    await client.query(
      `UPDATE matches
       SET status = 'finished', winner_id = $1, ended_at = NOW()
       WHERE id = $2`,
      [winner.userId, dbMatchId]
    )

    await client.query('COMMIT')
    console.log(`[DB] match resolved  id=${dbMatchId}  winner=${winner.username}  custom=${isCustom}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[DB] resolveMatch transaction failed:', err.message)
  } finally {
    client.release()
  }
}

/* ════════════════════════════════════════════════
   REGISTER SOCKET HANDLERS
════════════════════════════════════════════════ */
function registerMatch(io) {
  io._createMatchRow = createMatchRow

  io.on('connection', (socket) => {
    const { id: userId, username, elo_rating } = socket.user

    /* ── rejoin_match (clear disconnect timer if reconnected) ────── */
    socket.on('rejoin_match', ({ roomId }) => {
      const match = activeMatches.get(roomId)
      if (!match) return

      socket.join(roomId)

      if (match.disconnectTimers && match.disconnectTimers.has(userId)) {
        clearTimeout(match.disconnectTimers.get(userId))
        match.disconnectTimers.delete(userId)
        console.log(`[Match] player reconnected user=${username} room=${roomId}`)
        io.to(roomId).emit('player_reconnected', { userId, username })
      }
    })

    /* ── code_change (typing & line count indicators) ────────── */
    socket.on('code_change', ({ roomId, lineCount, charCount, isTyping }) => {
      socket.to(roomId).emit('opponent_code_change', {
        userId,
        username,
        lineCount,
        charCount,
        isTyping,
      })
    })

    /* ── submit_code ──────────────────────────────────────── */
    socket.on('submit_code', async ({ roomId, code, language, topic, difficulty }) => {
      console.log(`[Match] submit_code  user=${username}  room=${roomId}  lang=${language}`)

      if (!activeMatches.has(roomId)) {
        activeMatches.set(roomId, {
          dbMatchId:   null,
          problemId:   null,
          topic,
          difficulty,
          submissions: new Map(),
          startedAt:   Date.now(),
        })
      }
      const match = activeMatches.get(roomId)
      if (match.submissions.get(userId) === 'ACCEPTED') return

      // Look up problem ID if not cached
      let targetProblemId = match.problemId
      if (!targetProblemId) {
        const { rows } = await db.query(
          `SELECT id FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY created_at DESC LIMIT 1`,
          [topic, difficulty]
        )
        targetProblemId = rows[0]?.id ?? null
        match.problemId = targetProblemId
      }

      // ── Real Code Judge Evaluation ───────────────────────
      const judgeResult = await evaluateSubmission(targetProblemId, code, language)
      const verdict = judgeResult.verdict

      match.submissions.set(userId, verdict)

      console.log(`[Match] verdict user=${username} verdict=${verdict} (${judgeResult.passedTests}/${judgeResult.totalTests} tests) room=${roomId}`)

      // ── Save submission to DB ─────────────────────────────
      if (match.dbMatchId && targetProblemId) {
        try {
          await db.query(
            `INSERT INTO submissions (match_id, user_id, problem_id, code, language, status, verdict, runtime_ms)
             VALUES ($1, $2, $3, $4, $5, 'done', $6, $7)`,
            [match.dbMatchId, userId, targetProblemId, code, language, verdict, judgeResult.runtimeMs]
          )
        } catch (dbErr) {
          console.error('[DB] Failed to insert submission:', dbErr.message)
        }
      }

      // Broadcast verdict & test case details to room
      io.to(roomId).emit('submission_result', {
        userId,
        username,
        verdict,
        totalTests: judgeResult.totalTests,
        passedTests: judgeResult.passedTests,
        testResults: judgeResult.testResults,
        runtimeMs: judgeResult.runtimeMs,
      })

      // ── If ACCEPTED → End Match ───────────────────────────
      if (verdict === 'ACCEPTED') {
        const sockets = io.sockets.adapter.rooms.get(roomId)
        let opponent  = null
        for (const sid of (sockets ?? [])) {
          const s = io.sockets.sockets.get(sid)
          if (s && s.user.id !== userId) { opponent = s.user; break }
        }

        // Clear any disconnect timers
        if (match.disconnectTimers) {
          for (const timer of match.disconnectTimers.values()) clearTimeout(timer)
        }

        const isCustom = match.isCustom || roomId.includes('custom')
        const winnerRating = elo_rating    ?? 1200
        const loserRating  = opponent?.elo_rating ?? 1200
        const { winnerDelta: rawWinDelta, loserDelta: rawLossDelta } = calculateElo({ winnerRating, loserRating })

        const winnerDelta = isCustom ? 0 : rawWinDelta
        const loserDelta  = isCustom ? 0 : rawLossDelta

        const payload = {
          roomId,
          topic,
          difficulty,
          isCustom,
          winner: { userId, username,            rating: winnerRating, delta: winnerDelta },
          loser:  opponent
            ? { userId: opponent.id, username: opponent.username, rating: loserRating, delta: loserDelta }
            : null,
        }

        io.to(roomId).emit('match_end', payload)
        console.log(`[Match] ENDED winner=${username}(+${winnerDelta}) loser=${opponent?.username ?? '?'}(${loserDelta}) room=${roomId} custom=${isCustom}`)

        await resolveMatch({
          dbMatchId:   match.dbMatchId,
          winner:      payload.winner,
          loser:       payload.loser ?? { userId: null, rating: loserRating },
          winnerDelta,
          loserDelta,
          isCustom,
        })

        activeMatches.delete(roomId)
      }
    })

    /* ── Disconnect & Forfeit Recovery ───────────────────── */
    socket.on('disconnect', (reason) => {
      for (const [roomId, match] of activeMatches.entries()) {
        const isParticipant = match.players?.some(p => p.userId === userId)
        if (!isParticipant) continue

        // Ignore if user already solved it
        if (match.submissions.get(userId) === 'ACCEPTED') continue

        console.log(`[Match] player disconnected user=${username} room=${roomId} reason=${reason}`)

        if (!match.disconnectTimers) match.disconnectTimers = new Map()

        // Broadcast disconnect alert to room
        io.to(roomId).emit('player_disconnected', {
          userId,
          username,
          gracePeriodSec: 30,
        })

        // 30-Second Forfeit Countdown Timer
        const timer = setTimeout(async () => {
          if (!activeMatches.has(roomId)) return

          console.log(`[Match] FORFEIT EXPIRED user=${username} room=${roomId}`)
          const opponent = match.players?.find(p => p.userId !== userId)
          if (!opponent) return

          const isCustom = match.isCustom || roomId.includes('custom')
          const winnerRating = opponent.rating ?? 1200
          const loserRating  = elo_rating ?? 1200
          const { winnerDelta: rawWinDelta, loserDelta: rawLossDelta } = calculateElo({ winnerRating, loserRating })

          const winnerDelta = isCustom ? 0 : rawWinDelta
          const loserDelta  = isCustom ? 0 : rawLossDelta

          const payload = {
            roomId,
            topic: match.topic,
            difficulty: match.difficulty,
            isCustom,
            isForfeit: true,
            forfeitUser: username,
            winner: { userId: opponent.userId, username: opponent.username, rating: winnerRating, delta: winnerDelta },
            loser:  { userId, username, rating: loserRating, delta: loserDelta },
          }

          io.to(roomId).emit('match_end', payload)
          console.log(`[Match] FORFEIT ENDED winner=${opponent.username}(+${winnerDelta}) loser=${username}(${loserDelta}) room=${roomId}`)

          await resolveMatch({
            dbMatchId: match.dbMatchId,
            winner: payload.winner,
            loser: payload.loser,
            winnerDelta,
            loserDelta,
            isCustom,
          })

          activeMatches.delete(roomId)
        }, 30_000)

        match.disconnectTimers.set(userId, timer)
      }
    })
  })
}

/* ── Called by matchmaking or customRoom when a room is created ─ */
function trackRoom(roomId, dbMatchId, problemId, isCustom = false, players = []) {
  if (activeMatches.has(roomId)) {
    const entry = activeMatches.get(roomId)
    entry.dbMatchId = dbMatchId
    if (problemId) entry.problemId = problemId
    entry.isCustom = isCustom
    if (players.length) entry.players = players
  } else {
    activeMatches.set(roomId, { dbMatchId, problemId, isCustom, players, submissions: new Map(), startedAt: Date.now() })
  }
}

module.exports = { registerMatch, trackRoom }
