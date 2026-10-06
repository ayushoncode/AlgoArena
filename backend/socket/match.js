/**
 * socket/match.js — in-match socket events, DB persistence, real code evaluation, & forfeit recovery
 */

'use strict'

const db                   = require('../db')
const { calculateElo }      = require('../utils/elo')
const { evaluateSubmission } = require('../services/judge')

// ── In-memory active matches ───────────────────────────────────
// Map<roomId, { dbMatchId, problemId, topic, difficulty, players, isCustom, submissions, evaluating, isResolved, winnerId, matchEndPayload, startedAt, disconnectTimers }>
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

  if (!dbMatchId && !winner?.userId) {
    return { winnerDelta, loserDelta, winnerOldRating, winnerNewRating, loserOldRating, loserNewRating }
  }

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    // ── Concurrency Check: Check if match is already marked 'finished' in DB
    if (dbMatchId) {
      const { rows: matchRows } = await client.query(
        `SELECT id, status, winner_id FROM matches WHERE id = $1 FOR UPDATE`,
        [dbMatchId]
      )
      if (matchRows.length > 0 && matchRows[0].status === 'finished') {
        console.log(`[DB] resolveMatch: match ${dbMatchId} is already resolved. Skipping redundant Elo calculation.`)
        const { rows: eloRows } = await client.query(
          `SELECT user_id, old_rating, new_rating, delta FROM elo_history WHERE match_id = $1`,
          [dbMatchId]
        )
        await client.query('COMMIT')
        const wElo = eloRows.find(r => r.user_id === winner?.userId)
        const lElo = eloRows.find(r => r.user_id === loser?.userId)
        return {
          winnerDelta: wElo?.delta ?? 0,
          loserDelta: lElo?.delta ?? 0,
          winnerOldRating: wElo?.old_rating ?? winnerOldRating,
          winnerNewRating: wElo?.new_rating ?? winnerOldRating,
          loserOldRating: lElo?.old_rating ?? loserOldRating,
          loserNewRating: lElo?.new_rating ?? loserOldRating,
        }
      }
    }

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

    socket.on('check_active_match', () => {
      for (const [roomId, match] of activeMatches.entries()) {
        if (!match.isResolved && match.players?.some(p => String(p.userId) === String(userId))) {
          socket.join(roomId)
          console.log(`[Match] check_active_match → user=${username} has active room=${roomId}`)
          socket.emit('active_match', {
            roomId,
            topic: match.topic,
            difficulty: match.difficulty,
            players: match.players,
            problemId: match.problemId,
            isCustom: match.isCustom || false,
            startedAt: match.startedAt,
          })
          break
        }
      }
    })

    /* ── rejoin_match (clear disconnect timer if reconnected) ────── */
    socket.on('rejoin_match', async ({ roomId }) => {
      if (roomId) socket.join(roomId)

      const match = activeMatches.get(roomId)
      if (match) {
        if (match.disconnectTimers && match.disconnectTimers.has(userId)) {
          clearTimeout(match.disconnectTimers.get(userId))
          match.disconnectTimers.delete(userId)
          match.disconnectDeadlines?.delete(userId)
        }
        // Always tell the room this player is back (clears any stale "Disconnected" UI)
        console.log(`[Match] player (re)joined user=${username} room=${roomId}`)
        io.to(roomId).emit('player_reconnected', { userId, username })

        // If the opponent is currently disconnected, tell this (fresh) client
        if (match.disconnectTimers && match.disconnectDeadlines) {
          for (const [uid] of match.disconnectTimers) {
            if (String(uid) === String(userId)) continue
            const deadline = match.disconnectDeadlines.get(uid)
            const opp = match.players?.find(p => String(p.userId) === String(uid))
            if (deadline && opp) {
              socket.emit('player_disconnected', {
                userId: uid,
                username: opp.username,
                gracePeriodSec: Math.max(1, Math.ceil((deadline - Date.now()) / 1000)),
              })
            }
          }
        }

        if (match.isResolved && match.matchEndPayload) {
          socket.emit('match_end', match.matchEndPayload)
          return
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
             ORDER BY m.started_at DESC LIMIT 1`,
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
          } else {
            // Room is gone from memory (server restart / stale link) — let client leave
            socket.emit('match_not_found', { roomId })
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

      if (match.isResolved) {
        console.log(`[Match] resign_match ignored — match ${roomId} already resolved`)
        return
      }
      match.isResolved = true

      // Find opponent from match.players or socket room
      let opponent = match.players?.find(p => p.userId !== userId)
      if (!opponent && roomId) {
        const sockets = io.sockets.adapter.rooms.get(roomId)
        for (const sid of (sockets ?? [])) {
          const s = io.sockets.sockets.get(sid)
          if (s && s.user && s.user.id !== userId) {
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

      const winnerInfo = opponent ? { userId: opponent.userId, username: opponent.username, rating: opponent.rating } : { userId: null, username: 'Opponent' }
      const loserInfo  = { userId, username, rating: elo_rating }

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

      match.matchEndPayload = payload

      // Emit to room and directly to resigning socket
      io.to(roomId).emit('match_end', payload)
      socket.emit('match_end', payload)

      console.log(`[Match] RESIGNED ENDED winner=${payload.winner.username} loser=${username} room=${roomId}`)
      setTimeout(() => {
        if (activeMatches.get(roomId) === match) activeMatches.delete(roomId)
      }, 60_000)
    })

    /* ── submit_code ──────────────────────────────────────── */
    socket.on('submit_code', async ({ roomId, code, language, topic, difficulty }) => {
      const submittedAt = Date.now()
      console.log(`[Match] submit_code  user=${username}  room=${roomId}  lang=${language}  t=${submittedAt}`)

      if (!activeMatches.has(roomId)) {
        activeMatches.set(roomId, {
          dbMatchId:   null,
          problemId:   null,
          topic:       topic || 'arrays',
          difficulty:  difficulty || 'medium',
          submissions: new Map(),
          evaluating:  new Map(),
          isResolved:  false,
          winnerId:    null,
          matchEndPayload: null,
          startedAt:   Date.now(),
          disconnectTimers: new Map(),
        })
      }
      const match = activeMatches.get(roomId)
      if (!match.evaluating) match.evaluating = new Map()

      // If user already solved it, ignore
      if (match.submissions?.get(userId) === 'ACCEPTED') return

      // Look up problem ID if not cached
      let targetProblemId = match.problemId
      if (!targetProblemId) {
        const { rows } = await db.query(
          `SELECT id FROM problems WHERE topic = $1 AND difficulty = $2 ORDER BY created_at DESC LIMIT 1`,
          [topic || match.topic, difficulty || match.difficulty]
        )
        targetProblemId = rows[0]?.id ?? null
        match.problemId = targetProblemId
      }

      // Broadcast immediate submission notice to both clients so UI shows live judging state
      io.to(roomId).emit('submission_started', {
        userId,
        username,
        submittedAt,
      })

      // Setup tracking promise for this submission evaluation
      let evalResolver
      const evalPromise = new Promise((resolve) => { evalResolver = resolve })
      match.evaluating.set(userId, {
        submittedAt,
        promise: evalPromise,
        resolve: evalResolver,
      })

      // ── Real Code Judge Evaluation ───────────────────────
      const { isQueueActive, submissionQueue } = require('../queues/submission')
      let verdict, judgeResult

      if (isQueueActive()) {
        let submissionId = null
        if (match.dbMatchId && targetProblemId) {
          try {
            const { rows } = await db.query(
              `INSERT INTO submissions (match_id, user_id, problem_id, code, language, status)
               VALUES ($1, $2, $3, $4, $5, 'queued') RETURNING id`,
              [match.dbMatchId, userId, targetProblemId, code, language]
            )
            submissionId = rows[0].id
          } catch (dbErr) {
            console.error('[DB] Failed to insert queued submission:', dbErr.message)
          }
        }
        await submissionQueue.add('submission', {
          submissionId, matchId: match.dbMatchId, roomId, userId, username, problemId: targetProblemId, code, language
        })
        console.log(`[Match] queued submission user=${username} room=${roomId}`)

        // Wait for worker to evaluate and publish verdict to Redis pub/sub
        const res = await evalPromise
        verdict = res.verdict
        judgeResult = res.judgeResult
      } else {
        judgeResult = await evaluateSubmission(targetProblemId, code, language, {
          onProgress: (tr) => {
            io.to(roomId).emit('submission_progress', {
              userId, username, testIndex: tr.testIndex, passed: tr.passed, totalTests: tr.totalTests,
            })
          }
        })
        verdict = judgeResult.verdict
        evalResolver({ verdict, judgeResult })

        // Save submission to DB inline
        if (match.dbMatchId && targetProblemId) {
          try {
            await db.query(
              `INSERT INTO submissions (match_id, user_id, problem_id, code, language, status, verdict, runtime_ms)
               VALUES ($1, $2, $3, $4, $5, 'done', $6, $7)`,
              [match.dbMatchId, userId, targetProblemId, code, language, verdict, judgeResult.runtimeMs]
            )
          } catch (dbErr) {
            console.error('[DB] Failed to insert inline submission:', dbErr.message)
          }
        }
      }

      if (!match.submissions) match.submissions = new Map()
      match.submissions.set(userId, verdict)

      console.log(`[Match] verdict user=${username} verdict=${verdict} (${judgeResult.passedTests}/${judgeResult.totalTests} tests) room=${roomId}`)

      // Broadcast verdict & test case details to room
      io.to(roomId).emit('submission_result', {
        userId, username, verdict, totalTests: judgeResult.totalTests, passedTests: judgeResult.passedTests,
        testResults: judgeResult.testResults, runtimeMs: judgeResult.runtimeMs,
      })

      // ── If ACCEPTED → Win Resolution with Concurrency Protection ──
      if (verdict === 'ACCEPTED') {
        // Concurrency Check: If opponent submitted BEFORE this submission and is still evaluating, wait for them!
        const earlierOppEntry = Array.from(match.evaluating.entries())
          .find(([otherId, entry]) => otherId !== userId && entry.submittedAt < submittedAt)

        if (earlierOppEntry) {
          console.log(`[Match] Concurrency: opponent ${earlierOppEntry[0]} submitted earlier (${earlierOppEntry[1].submittedAt} < ${submittedAt}). Waiting for evaluation...`)
          try {
            const oppResult = await Promise.race([
              earlierOppEntry[1].promise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ])
            if (oppResult && oppResult.verdict === 'ACCEPTED') {
              console.log(`[Match] Earlier opponent submission passed! Opponent wins. Current user did not win the race.`)
            }
          } catch (e) {
            console.log(`[Match] Earlier opponent evaluation timed out or rejected:`, e.message)
          }
        }

        // Check if match is already resolved by another submission or forfeit
        if (!match.isResolved) {
          match.isResolved = true
          match.winnerId = userId

          let opponent = null
          const oppPlayer = match?.players?.find(p => p.userId !== userId)
          if (oppPlayer) {
            opponent = { userId: oppPlayer.userId, username: oppPlayer.username, rating: oppPlayer.rating }
          } else {
            const sockets = io.sockets.adapter.rooms.get(roomId)
            for (const sid of (sockets ?? [])) {
              const s = io.sockets.sockets.get(sid)
              if (s && s.user && s.user.id !== userId) {
                opponent = { userId: s.user.id, username: s.user.username, rating: s.user.elo_rating }
                break
              }
            }
          }

          // Clear any disconnect timers
          if (match.disconnectTimers) {
            for (const timer of match.disconnectTimers.values()) clearTimeout(timer)
          }

          const isCustom = match.isCustom || roomId.includes('custom')
          const solveTimeSec = Math.round((Date.now() - (match.startedAt || Date.now())) / 1000)

          const winnerInfo = { userId, username, rating: elo_rating }
          const loserInfo  = opponent ? { userId: opponent.userId, username: opponent.username, rating: opponent.rating } : null

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

          match.matchEndPayload = payload
          io.to(roomId).emit('match_end', payload)
          console.log(`[Match] ENDED winner=${username}(+${resolved.winnerDelta}) loser=${loserInfo?.username ?? '?'}(${resolved.loserDelta}) room=${roomId} custom=${isCustom}`)

          // Retain match state for 60 seconds so late submissions / queries don't crash
          setTimeout(() => {
            if (activeMatches.get(roomId) === match) activeMatches.delete(roomId)
          }, 60_000)
        } else if (match.matchEndPayload) {
          // Send cached match_end payload to this socket
          socket.emit('match_end', match.matchEndPayload)
        }
      }

      // Cleanup user from evaluating map
      match.evaluating.delete(userId)
    })

    /* ── Disconnect & Forfeit Recovery ───────────────────── */
    socket.on('disconnecting', (reason) => {
      for (const [roomId, match] of activeMatches.entries()) {
        if (!socket.rooms.has(roomId)) continue
        const isParticipant = match.players?.some(p => p.userId === userId)
        if (!isParticipant) continue

        // Ignore if user already solved it or match already ended
        if (match.isResolved || match.submissions?.get(userId) === 'ACCEPTED') continue

        // Reload / new tab race: the new socket may have rejoined BEFORE this old
        // socket's disconnect was detected. If the user still has a live socket
        // in the room, they are not actually gone.
        if (userHasOtherSocketInRoom(io, roomId, userId, socket.id)) {
          console.log(`[Match] stale socket closed for user=${username} room=${roomId} — user still connected, no forfeit timer`)
          continue
        }

        console.log(`[Match] player disconnected user=${username} room=${roomId} reason=${reason}`)

        if (!match.disconnectTimers) match.disconnectTimers = new Map()
        if (!match.disconnectDeadlines) match.disconnectDeadlines = new Map()
        if (match.disconnectTimers.has(userId)) clearTimeout(match.disconnectTimers.get(userId))
        match.disconnectDeadlines.set(userId, Date.now() + 30_000)

        // Broadcast disconnect alert to room
        io.to(roomId).emit('player_disconnected', {
          userId,
          username,
          gracePeriodSec: 30,
        })

        // 30-Second Forfeit Countdown Timer
        const timer = setTimeout(async () => {
          match.disconnectTimers?.delete(userId)
          match.disconnectDeadlines?.delete(userId)
          if (!activeMatches.has(roomId)) return
          if (match.isResolved) return
          // Final safety: user came back on another socket → no forfeit
          if (userHasOtherSocketInRoom(io, roomId, userId, socket.id)) {
            io.to(roomId).emit('player_reconnected', { userId, username })
            return
          }
          match.isResolved = true

          console.log(`[Match] FORFEIT EXPIRED user=${username} room=${roomId}`)
          const opponent = match.players?.find(p => p.userId !== userId)
          if (!opponent) return

          const isCustom = match.isCustom || roomId.includes('custom')
          const difficulty = match.difficulty || 'medium'

          const winnerInfo = { userId: opponent.userId, username: opponent.username, rating: opponent.rating }
          const loserInfo  = { userId, username, rating: elo_rating }

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

          match.matchEndPayload = payload
          io.to(roomId).emit('match_end', payload)
          console.log(`[Match] FORFEIT ENDED winner=${opponent.username}(+${resolved.winnerDelta}) loser=${username}(${resolved.loserDelta}) room=${roomId}`)

          setTimeout(() => {
            if (activeMatches.get(roomId) === match) activeMatches.delete(roomId)
          }, 60_000)
        }, 30_000)

        match.disconnectTimers.set(userId, timer)
      }
    })
  })
}

/* ── Is this user connected to the room via some other socket? ── */
function userHasOtherSocketInRoom(io, roomId, userId, excludeSocketId) {
  const sids = io.sockets.adapter.rooms.get(roomId)
  if (!sids) return false
  for (const sid of sids) {
    if (sid === excludeSocketId) continue
    const s = io.sockets.sockets.get(sid)
    if (s?.connected && String(s.user?.id) === String(userId)) return true
  }
  return false
}

/* ── Called by verdictSubscriber for Docker sandbox verdicts ─── */
async function handleVerdict(payload, io) {
  const { type, roomId, userId, username, verdict, totalTests, passedTests, testResults, runtimeMs, testIndex, passed } = payload

  if (type === 'progress') {
    io.to(roomId).emit('submission_progress', {
      userId,
      username,
      testIndex,
      passed,
      totalTests
    })
    return
  }

  // Find the match and resolve the evaluating promise so submit_code can resume
  const match = activeMatches.get(roomId)
  if (match && match.evaluating && match.evaluating.has(userId)) {
    match.evaluating.get(userId).resolve({
      verdict,
      judgeResult: { totalTests, passedTests, testResults, runtimeMs }
    })
  } else {
    console.warn(`[Match] handleVerdict received for unknown/resolved evaluation room=${roomId} user=${username}`)
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
      evaluating: new Map(),
      isResolved: false,
      winnerId: null,
      matchEndPayload: null,
      startedAt: Date.now(),
      disconnectTimers: new Map(),
    })
  }
}

function isUserInActiveMatch(userId) {
  for (const match of activeMatches.values()) {
    if (!match.isResolved && match.players?.some(p => String(p.userId) === String(userId))) {
      return true
    }
  }
  return false
}

module.exports = { registerMatch, trackRoom, handleVerdict, isUserInActiveMatch }
