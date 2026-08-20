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
async function resolveMatch({ dbMatchId, winner, loser, isCustom = false, difficulty = 'medium', solveTimeSec = null }) {
  let winnerOldRating = winner?.rating ?? 1200
  let loserOldRating  = loser?.rating ?? 1200
  let winnerDelta = 0
  let loserDelta  = 0
  let winnerNewRating = winnerOldRating
  let loserNewRating  = loserOldRating

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    let winnerMatches = 0
    let loserMatches  = 0

    if (winner?.userId) {
      const { rows } = await client.query(
        `SELECT id, username, elo_rating, wins, losses FROM users WHERE id = $1 FOR UPDATE`,
        [winner.userId]
      )
      if (rows[0]) {
        winnerOldRating = Number(rows[0].elo_rating) || 1200
        winnerMatches   = (Number(rows[0].wins) || 0) + (Number(rows[0].losses) || 0)
      }
    }

    if (loser?.userId) {
      const { rows } = await client.query(
        `SELECT id, username, elo_rating, wins, losses FROM users WHERE id = $1 FOR UPDATE`,
        [loser.userId]
      )
      if (rows[0]) {
        loserOldRating = Number(rows[0].elo_rating) || 1200
        loserMatches   = (Number(rows[0].wins) || 0) + (Number(rows[0].losses) || 0)
      }
    }

    if (!isCustom && winner?.userId) {
      const calculated = calculateElo({
        winnerRating: winnerOldRating,
        loserRating:  loserOldRating,
        winnerMatches,
        loserMatches,
        difficulty,
        solveTimeSec,
      })
      winnerDelta     = calculated.winnerDelta
      loserDelta      = calculated.loserDelta
      winnerNewRating = calculated.newWinnerRating
      loserNewRating  = calculated.newLoserRating

      // Update winner
      await client.query(
        `UPDATE users
         SET elo_rating = $1, wins = wins + 1
         WHERE id = $2`,
        [winnerNewRating, winner.userId]
      )

      // Update loser
      if (loser?.userId) {
        await client.query(
          `UPDATE users
           SET elo_rating = $1, losses = losses + 1
           WHERE id = $2`,
          [loserNewRating, loser.userId]
        )
      }

      // Record in elo_history
      if (dbMatchId) {
        await client.query(
          `INSERT INTO elo_history (user_id, match_id, old_rating, new_rating, delta)
           VALUES ($1, $2, $3, $4, $5)`,
          [winner.userId, dbMatchId, winnerOldRating, winnerNewRating, winnerDelta]
        )
        if (loser?.userId) {
          await client.query(
            `INSERT INTO elo_history (user_id, match_id, old_rating, new_rating, delta)
             VALUES ($1, $2, $3, $4, $5)`,
            [loser.userId, dbMatchId, loserOldRating, loserNewRating, loserDelta]
          )
        }
      }
    }

    // Close match row
    if (dbMatchId && winner?.userId) {
      await client.query(
        `UPDATE matches
         SET status = 'finished', winner_id = $1, ended_at = NOW()
         WHERE id = $2`,
        [winner.userId, dbMatchId]
      )
    }

    await client.query('COMMIT')
    console.log(`[DB] match resolved id=${dbMatchId} winner=${winner?.username}(${winnerOldRating}->${winnerNewRating}, +${winnerDelta}) loser=${loser?.username}(${loserOldRating}->${loserNewRating}, ${loserDelta}) custom=${isCustom}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[DB] resolveMatch transaction failed:', err.message)
  } finally {
    client.release()
  }

  return {
    winnerDelta,
    loserDelta,
    winnerOldRating,
    winnerNewRating,
    loserOldRating,
    loserNewRating,
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
    socket.on('rejoin_match', async ({ roomId }) => {
      if (roomId) socket.join(roomId)

      const match = activeMatches.get(roomId)
      if (match) {
        if (match.disconnectTimers && match.disconnectTimers.has(userId)) {
          clearTimeout(match.disconnectTimers.get(userId))
          match.disconnectTimers.delete(userId)
          console.log(`[Match] player reconnected user=${username} room=${roomId}`)
          io.to(roomId).emit('player_reconnected', { userId, username })
        }

        socket.emit('match_state_restored', {
          roomId,
          dbMatchId: match.dbMatchId,
          problemId: match.problemId,
          topic: match.topic || 'arrays',
          difficulty: match.difficulty || 'medium',
          isCustom: match.isCustom || false,
          players: match.players || [],
          startedAt: match.startedAt,
        })
      } else if (roomId) {
        try {
          const { rows } = await db.query(
            `SELECT m.*, u1.username as p1_name, u2.username as p2_name,
                    w.username as winner_name, l.username as loser_name
             FROM matches m
             LEFT JOIN users u1 ON u1.id = m.player_one_id
             LEFT JOIN users u2 ON u2.id = m.player_two_id
             LEFT JOIN users w ON w.id = m.winner_id
             LEFT JOIN users l ON l.id = (CASE WHEN m.winner_id = m.player_one_id THEN m.player_two_id ELSE m.player_one_id END)
             WHERE (m.player_one_id = $1 OR m.player_two_id = $1)
             ORDER BY m.created_at DESC LIMIT 1`,
            [userId]
          )
          if (rows.length && rows[0].status !== 'active') {
            const m = rows[0]
            socket.emit('match_end', {
              roomId,
              topic: m.topic,
              difficulty: m.difficulty,
              winner: { userId: m.winner_id, username: m.winner_name },
              loser: { userId: m.winner_id === m.player_one_id ? m.player_two_id : m.player_one_id, username: m.loser_name },
            })
          }
        } catch (err) {
          console.error('[rejoin_match DB lookup failed]', err.message)
        }
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

    /* ── resign_match ─────────────────────────────────────── */
    socket.on('resign_match', async ({ roomId }) => {
      console.log(`[Match] resign_match user=${username} room=${roomId}`)
      const match = activeMatches.get(roomId) || {}

      // Find opponent from match.players or socket room
      let opponent = match.players?.find(p => p.userId !== userId)
      if (!opponent && roomId) {
        const sockets = io.sockets.adapter.rooms.get(roomId)
        for (const sid of (sockets ?? [])) {
          const s = io.sockets.sockets.get(sid)
          if (s && s.user.id !== userId) {
            opponent = { userId: s.user.id, username: s.user.username, rating: s.user.elo_rating }
            break
          }
        }
      }

      if (match.disconnectTimers) {
        for (const timer of match.disconnectTimers.values()) clearTimeout(timer)
      }

      const isCustom = match.isCustom || String(roomId).includes('custom')
      const difficulty = match.difficulty || 'medium'

      const winnerInfo = opponent ? { userId: opponent.userId, username: opponent.username } : { userId: null, username: 'Opponent' }
      const loserInfo  = { userId, username }

      const resolved = await resolveMatch({
        dbMatchId: match.dbMatchId,
        winner: winnerInfo,
        loser: loserInfo,
        isCustom,
        difficulty,
      })

      const payload = {
        roomId,
        topic: match.topic || 'arrays',
        difficulty,
        isCustom,
        isForfeit: true,
        forfeitUser: username,
        winner: {
          userId: winnerInfo.userId,
          username: winnerInfo.username,
          oldRating: resolved.winnerOldRating,
          rating: resolved.winnerOldRating,
          newRating: resolved.winnerNewRating,
          delta: resolved.winnerDelta,
        },
        loser: {
          userId: loserInfo.userId,
          username: loserInfo.username,
          oldRating: resolved.loserOldRating,
          rating: resolved.loserOldRating,
          newRating: resolved.loserNewRating,
          delta: resolved.loserDelta,
        },
      }

      // Emit to room and directly to resigning socket
      io.to(roomId).emit('match_end', payload)
      socket.emit('match_end', payload)

      console.log(`[Match] RESIGNED ENDED winner=${payload.winner.username} loser=${username} room=${roomId}`)
      activeMatches.delete(roomId)
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
        let opponent = null
        const oppPlayer = match?.players?.find(p => p.userId !== userId)
        if (oppPlayer) {
          opponent = { id: oppPlayer.userId, username: oppPlayer.username }
        } else {
          const sockets = io.sockets.adapter.rooms.get(roomId)
          for (const sid of (sockets ?? [])) {
            const s = io.sockets.sockets.get(sid)
            if (s && s.user && s.user.id !== userId) { opponent = s.user; break }
          }
        }

        // Clear any disconnect timers
        if (match.disconnectTimers) {
          for (const timer of match.disconnectTimers.values()) clearTimeout(timer)
        }

        const isCustom = match.isCustom || roomId.includes('custom')
        const solveTimeSec = Math.round((Date.now() - (match.startedAt || Date.now())) / 1000)

        const winnerInfo = { userId, username }
        const loserInfo  = opponent ? { userId: opponent.id || opponent.userId, username: opponent.username } : null

        const resolved = await resolveMatch({
          dbMatchId: match.dbMatchId,
          winner: winnerInfo,
          loser: loserInfo,
          isCustom,
          difficulty: difficulty || match.difficulty || 'medium',
          solveTimeSec,
        })

        const payload = {
          roomId,
          topic: topic || match.topic || 'arrays',
          difficulty: difficulty || match.difficulty || 'medium',
          isCustom,
          winner: {
            userId: winnerInfo.userId,
            username: winnerInfo.username,
            oldRating: resolved.winnerOldRating,
            rating: resolved.winnerOldRating,
            newRating: resolved.winnerNewRating,
            delta: resolved.winnerDelta,
          },
          loser: loserInfo ? {
            userId: loserInfo.userId,
            username: loserInfo.username,
            oldRating: resolved.loserOldRating,
            rating: resolved.loserOldRating,
            newRating: resolved.loserNewRating,
            delta: resolved.loserDelta,
          } : null,
        }

        io.to(roomId).emit('match_end', payload)
        console.log(`[Match] ENDED winner=${username}(+${resolved.winnerDelta}) loser=${loserInfo?.username ?? '?'}(${resolved.loserDelta}) room=${roomId} custom=${isCustom}`)

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
          const difficulty = match.difficulty || 'medium'

          const winnerInfo = { userId: opponent.userId, username: opponent.username }
          const loserInfo  = { userId, username }

          const resolved = await resolveMatch({
            dbMatchId: match.dbMatchId,
            winner: winnerInfo,
            loser: loserInfo,
            isCustom,
            difficulty,
          })

          const payload = {
            roomId,
            topic: match.topic,
            difficulty,
            isCustom,
            isForfeit: true,
            forfeitUser: username,
            winner: {
              userId: winnerInfo.userId,
              username: winnerInfo.username,
              oldRating: resolved.winnerOldRating,
              rating: resolved.winnerOldRating,
              newRating: resolved.winnerNewRating,
              delta: resolved.winnerDelta,
            },
            loser: {
              userId: loserInfo.userId,
              username: loserInfo.username,
              oldRating: resolved.loserOldRating,
              rating: resolved.loserOldRating,
              newRating: resolved.loserNewRating,
              delta: resolved.loserDelta,
            },
          }

          io.to(roomId).emit('match_end', payload)
          console.log(`[Match] FORFEIT ENDED winner=${opponent.username}(+${resolved.winnerDelta}) loser=${username}(${resolved.loserDelta}) room=${roomId}`)

          activeMatches.delete(roomId)
        }, 30_000)

        match.disconnectTimers.set(userId, timer)
      }
    })
  })
}

/* ── Called by verdictSubscriber for Docker sandbox verdicts ─── */
async function handleVerdict(payload, io) {
  const { roomId, userId, username, verdict, totalTests, passedTests, testResults, runtimeMs } = payload

  // Broadcast to the match room
  io.to(roomId).emit('submission_result', {
    userId,
    username,
    verdict,
    totalTests,
    passedTests,
    testResults,
    runtimeMs,
  })

  if (verdict === 'ACCEPTED') {
    const match = activeMatches.get(roomId)
    const opponent = match?.players?.find(p => p.userId !== userId)

    if (match?.disconnectTimers) {
      for (const timer of match.disconnectTimers.values()) clearTimeout(timer)
    }

    const isCustom = match?.isCustom || String(roomId).includes('custom')
    const difficulty = match?.difficulty || 'medium'
    const solveTimeSec = Math.round((Date.now() - (match?.startedAt || Date.now())) / 1000)

    const winnerInfo = { userId, username }
    const loserInfo  = opponent ? { userId: opponent.userId, username: opponent.username } : null

    const resolved = await resolveMatch({
      dbMatchId: match?.dbMatchId,
      winner: winnerInfo,
      loser: loserInfo,
      isCustom,
      difficulty,
      solveTimeSec,
    })

    const endPayload = {
      roomId,
      topic: match?.topic,
      difficulty,
      isCustom,
      winner: {
        userId: winnerInfo.userId,
        username: winnerInfo.username,
        oldRating: resolved.winnerOldRating,
        rating: resolved.winnerOldRating,
        newRating: resolved.winnerNewRating,
        delta: resolved.winnerDelta,
      },
      loser: loserInfo ? {
        userId: loserInfo.userId,
        username: loserInfo.username,
        oldRating: resolved.loserOldRating,
        rating: resolved.loserOldRating,
        newRating: resolved.loserNewRating,
        delta: resolved.loserDelta,
      } : null,
    }

    io.to(roomId).emit('match_end', endPayload)
    activeMatches.delete(roomId)
  }
}

/* ── Called by matchmaking or customRoom when a room is created ─ */
function trackRoom(roomId, dbMatchId, problemId, isCustom = false, players = [], topic = 'arrays', difficulty = 'medium') {
  if (activeMatches.has(roomId)) {
    const entry = activeMatches.get(roomId)
    if (dbMatchId) entry.dbMatchId = dbMatchId
    if (problemId) entry.problemId = problemId
    entry.isCustom = isCustom
    if (players.length) entry.players = players
    if (topic) entry.topic = topic
    if (difficulty) entry.difficulty = difficulty
  } else {
    activeMatches.set(roomId, {
      dbMatchId,
      problemId,
      isCustom,
      players,
      topic,
      difficulty,
      submissions: new Map(),
      startedAt: Date.now(),
    })
  }
}

module.exports = { registerMatch, trackRoom, handleVerdict }
