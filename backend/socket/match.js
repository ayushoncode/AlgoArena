/**
 * socket/match.js — in-match socket events, DB persistence, verdict handling
 *
 * Two code-evaluation paths (selected at runtime):
 *
 *   PATH A — BullMQ queue (Redis configured, production):
 *     submit_code → insert submission row (pending) → push BullMQ job
 *                 → emit submission_status:"running" immediately
 *                 → worker runs Docker sandbox → publishes to Redis pub/sub
 *                 → verdictSubscriber calls handleVerdict() → emit to room
 *
 *   PATH B — Inline judge (no Redis, local dev fallback):
 *     submit_code → evaluateSubmission() via vm.Script → verdict inline
 *                 → handleVerdict() called directly in the same process
 *
 *  handleVerdict() is shared by both paths:
 *    - emits submission_result to room
 *    - if ACCEPTED: calculates Elo, emits match_end, calls resolveMatch()
 *
 *  Exported: registerMatch, trackRoom, handleVerdict
 */

'use strict'

const db                      = require('../db')
const { calculateElo }        = require('../utils/elo')
const { evaluateSubmission }  = require('../services/judge')
const { submissionQueue,
        isQueueActive }       = require('../queues/submission')

// ── In-memory active matches ───────────────────────────────────────
// Map<roomId, { dbMatchId, problemId, topic, difficulty, players,
//               isCustom, submissions, startedAt, disconnectTimers }>
const activeMatches = new Map()

/* ════════════════════════════════════════════════════════════════════
   DB HELPERS
═══════════════════════════════════════════════════════════════════ */

/** Create a new match row in Postgres (called from matchmaking / customRoom). */
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

/** Update Elo, persist history, close match row — runs in a transaction. */
async function resolveMatch({ dbMatchId, winner, loser, winnerDelta, loserDelta, isCustom = false }) {
  if (!dbMatchId) return

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    if (!isCustom) {
      // Update winner stats
      await client.query(
        `UPDATE users SET elo_rating = elo_rating + $1, wins = wins + 1 WHERE id = $2`,
        [winnerDelta, winner.userId]
      )
      // Update loser stats (floor at 100)
      await client.query(
        `UPDATE users SET elo_rating = GREATEST(100, elo_rating + $1), losses = losses + 1 WHERE id = $2`,
        [loserDelta, loser.userId]
      )
      // Write winner Elo history
      await client.query(
        `INSERT INTO elo_history (user_id, match_id, old_rating, new_rating, delta)
         VALUES ($1, $2, $3, $4, $5)`,
        [winner.userId, dbMatchId, winner.rating, winner.rating + winnerDelta, winnerDelta]
      )
      // Write loser Elo history
      if (loser.userId) {
        await client.query(
          `INSERT INTO elo_history (user_id, match_id, old_rating, new_rating, delta)
           VALUES ($1, $2, $3, $4, $5)`,
          [loser.userId, dbMatchId, loser.rating, loser.rating + loserDelta, loserDelta]
        )
      }
    }

    // Close the match row
    await client.query(
      `UPDATE matches SET status = 'finished', winner_id = $1, ended_at = NOW() WHERE id = $2`,
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

/* ════════════════════════════════════════════════════════════════════
   HANDLE VERDICT
   Shared by both evaluation paths (queue and inline).
   Called with the verdict payload, emits Socket.io events to the room,
   and — if verdict is ACCEPTED — resolves the match and updates Elo.
═══════════════════════════════════════════════════════════════════ */
/**
 * handleVerdict(payload, io)
 *
 * @param {object} payload  { roomId, userId, username, verdict, totalTests,
 *                            passedTests, testResults, runtimeMs, submissionId? }
 * @param {Server} io       Socket.io server instance
 */
async function handleVerdict(payload, io) {
  const {
    roomId, userId, username,
    verdict, totalTests, passedTests, testResults, runtimeMs,
  } = payload

  const match = activeMatches.get(roomId)
  if (!match) {
    // Match may have already ended (duplicate submission race)
    console.warn(`[Match] handleVerdict: no active match for room=${roomId?.slice(0, 20)}`)
    return
  }

  // Guard: ignore if this player already got ACCEPTED (no double-resolves)
  if (match.submissions.get(userId) === 'ACCEPTED') {
    console.log(`[Match] handleVerdict: user=${username} already ACCEPTED — ignoring`)
    return
  }

  match.submissions.set(userId, verdict)
  console.log(
    `[Match] verdict  user=${username}  verdict=${verdict}` +
    `  (${passedTests}/${totalTests} tests)  room=${roomId?.slice(0, 20)}`
  )

  // ── Emit submission_result to both players ─────────────────────
  io.to(roomId).emit('submission_result', {
    userId,
    username,
    verdict,
    totalTests,
    passedTests,
    testResults,
    runtimeMs,
  })

  // ── ACCEPTED → end the match ───────────────────────────────────
  if (verdict === 'ACCEPTED') {
    const winnerPlayer = match.players?.find(p => p.userId === userId)
    const loserPlayer  = match.players?.find(p => p.userId !== userId)

    if (!winnerPlayer) {
      console.error(`[Match] handleVerdict: winner not found in players for room=${roomId}`)
      return
    }

    // Clear any pending disconnect timers
    if (match.disconnectTimers) {
      for (const timer of match.disconnectTimers.values()) clearTimeout(timer)
    }

    const isCustom     = match.isCustom || roomId.includes('custom')
    const winnerRating = winnerPlayer.rating  ?? 1200
    const loserRating  = loserPlayer?.rating  ?? 1200
    const { winnerDelta: rawWin, loserDelta: rawLoss } = calculateElo({ winnerRating, loserRating })

    const winnerDelta = isCustom ? 0 : rawWin
    const loserDelta  = isCustom ? 0 : rawLoss

    const matchEndPayload = {
      roomId,
      topic:      match.topic,
      difficulty: match.difficulty,
      isCustom,
      winner: { userId, username,              rating: winnerRating, delta: winnerDelta },
      loser:  loserPlayer
        ? { userId: loserPlayer.userId, username: loserPlayer.username, rating: loserRating, delta: loserDelta }
        : null,
    }

    io.to(roomId).emit('match_end', matchEndPayload)
    console.log(
      `[Match] ENDED  winner=${username}(+${winnerDelta})` +
      `  loser=${loserPlayer?.username ?? '?'}(${loserDelta})` +
      `  room=${roomId?.slice(0, 20)}  custom=${isCustom}`
    )

    await resolveMatch({
      dbMatchId:  match.dbMatchId,
      winner:     matchEndPayload.winner,
      loser:      matchEndPayload.loser ?? { userId: null, rating: loserRating },
      winnerDelta,
      loserDelta,
      isCustom,
    })

    activeMatches.delete(roomId)
  }
}

/* ════════════════════════════════════════════════════════════════════
   REGISTER SOCKET HANDLERS
═══════════════════════════════════════════════════════════════════ */
function registerMatch(io) {
  io._createMatchRow = createMatchRow

  io.on('connection', (socket) => {
    const { id: userId, username, elo_rating } = socket.user

    /* ── rejoin_match — clears disconnect timer on reconnect ────── */
    socket.on('rejoin_match', ({ roomId }) => {
      const match = activeMatches.get(roomId)
      if (!match) return

      socket.join(roomId)

      if (match.disconnectTimers?.has(userId)) {
        clearTimeout(match.disconnectTimers.get(userId))
        match.disconnectTimers.delete(userId)
        console.log(`[Match] reconnected  user=${username}  room=${roomId?.slice(0, 20)}`)
        io.to(roomId).emit('player_reconnected', { userId, username })
      }
    })

    /* ── code_change — broadcasts typing indicator to opponent ──── */
    socket.on('code_change', ({ roomId, lineCount, charCount, isTyping }) => {
      socket.to(roomId).emit('opponent_code_change', {
        userId,
        username,
        lineCount,
        charCount,
        isTyping,
      })
    })

    /* ── submit_code ────────────────────────────────────────────── */
    socket.on('submit_code', async ({ roomId, code, language, topic, difficulty }) => {
      console.log(`[Match] submit_code  user=${username}  room=${roomId?.slice(0, 20)}  lang=${language}`)

      // Ensure match state exists in memory
      if (!activeMatches.has(roomId)) {
        activeMatches.set(roomId, {
          dbMatchId:   null,
          problemId:   null,
          topic,
          difficulty,
          players:     [],
          isCustom:    false,
          submissions: new Map(),
          startedAt:   Date.now(),
        })
      }
      const match = activeMatches.get(roomId)

      // Guard: already accepted
      if (match.submissions.get(userId) === 'ACCEPTED') return

      // Look up problem ID if not cached yet
      let targetProblemId = match.problemId
      if (!targetProblemId) {
        try {
          const { rows } = await db.query(
            `SELECT id FROM problems
             WHERE topic = $1 AND difficulty = $2
             ORDER BY created_at DESC LIMIT 1`,
            [topic || match.topic, difficulty || match.difficulty]
          )
          targetProblemId = rows[0]?.id ?? null
          match.problemId = targetProblemId
        } catch (err) {
          console.error('[Match] Failed to look up problemId:', err.message)
        }
      }

      /* ────────────────────────────────────────────────────────────
         PATH A — BullMQ queue (Redis active)
         Insert submission row → push job → emit "running" immediately.
         Verdict arrives later via verdictSubscriber → handleVerdict().
      ──────────────────────────────────────────────────────────── */
      if (isQueueActive()) {
        // Insert pending submission row in Postgres
        let submissionId = null
        if (match.dbMatchId && targetProblemId) {
          try {
            const { rows } = await db.query(
              `INSERT INTO submissions
                 (match_id, user_id, problem_id, code, language, status)
               VALUES ($1, $2, $3, $4, $5, 'pending')
               RETURNING id`,
              [match.dbMatchId, userId, targetProblemId, code, language]
            )
            submissionId = rows[0]?.id ?? null
            console.log(`[Match] submission row inserted  id=${submissionId?.slice(0, 8)}  status=pending`)
          } catch (err) {
            console.error('[Match] Failed to insert submission row:', err.message)
          }
        }

        // Emit "running" status immediately — client shows spinner
        io.to(roomId).emit('submission_status', {
          userId,
          username,
          status: 'running',
        })

        // Push job to BullMQ
        try {
          const job = await submissionQueue.add('evaluate', {
            submissionId,
            matchId:   match.dbMatchId,
            roomId,
            userId,
            username,
            problemId: targetProblemId,
            code,
            language,
          })
          console.log(`[Match] job queued  id=${job?.id}  user=${username}  room=${roomId?.slice(0, 20)}`)
        } catch (err) {
          console.error('[Match] Failed to push job to queue:', err.message)
          // Queue push failed — fall through to inline judge
          await _runInlineJudge({ roomId, userId, username, targetProblemId, code, language, match, io })
        }

        return // verdict arrives asynchronously via verdictSubscriber
      }

      /* ────────────────────────────────────────────────────────────
         PATH B — Inline judge fallback (no Redis / local dev)
         Evaluates code synchronously using vm.Script.
         handleVerdict() is called directly in this same process.
      ──────────────────────────────────────────────────────────── */
      await _runInlineJudge({ roomId, userId, username, targetProblemId, code, language, match, io })
    })

    /* ── Disconnect & Forfeit Recovery ──────────────────────────── */
    socket.on('disconnect', (reason) => {
      for (const [roomId, match] of activeMatches.entries()) {
        const isParticipant = match.players?.some(p => p.userId === userId)
        if (!isParticipant) continue

        // Already solved — no forfeit needed
        if (match.submissions.get(userId) === 'ACCEPTED') continue

        console.log(`[Match] player disconnected  user=${username}  room=${roomId?.slice(0, 20)}  reason=${reason}`)

        if (!match.disconnectTimers) match.disconnectTimers = new Map()

        io.to(roomId).emit('player_disconnected', {
          userId,
          username,
          gracePeriodSec: 30,
        })

        // 30-second forfeit timer
        const timer = setTimeout(async () => {
          if (!activeMatches.has(roomId)) return

          console.log(`[Match] FORFEIT EXPIRED  user=${username}  room=${roomId?.slice(0, 20)}`)
          const opponent = match.players?.find(p => p.userId !== userId)
          if (!opponent) return

          const isCustom     = match.isCustom || roomId.includes('custom')
          const winnerRating = opponent.rating ?? 1200
          const loserRating  = elo_rating      ?? 1200
          const { winnerDelta: rawWin, loserDelta: rawLoss } = calculateElo({ winnerRating, loserRating })

          const winnerDelta = isCustom ? 0 : rawWin
          const loserDelta  = isCustom ? 0 : rawLoss

          const payload = {
            roomId,
            topic:       match.topic,
            difficulty:  match.difficulty,
            isCustom,
            isForfeit:   true,
            forfeitUser: username,
            winner: { userId: opponent.userId, username: opponent.username, rating: winnerRating, delta: winnerDelta },
            loser:  { userId, username, rating: loserRating, delta: loserDelta },
          }

          io.to(roomId).emit('match_end', payload)
          console.log(
            `[Match] FORFEIT ENDED  winner=${opponent.username}(+${winnerDelta})` +
            `  loser=${username}(${loserDelta})  room=${roomId?.slice(0, 20)}`
          )

          await resolveMatch({
            dbMatchId:  match.dbMatchId,
            winner:     payload.winner,
            loser:      payload.loser,
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

/* ════════════════════════════════════════════════════════════════════
   INLINE JUDGE HELPER (Path B)
   Isolated so both the main fallback path and queue error recovery
   can call it without duplication.
═══════════════════════════════════════════════════════════════════ */
async function _runInlineJudge({ roomId, userId, username, targetProblemId, code, language, match, io }) {
  // Emit "running" so client shows spinner (matches queue path UX)
  io.to(roomId).emit('submission_status', { userId, username, status: 'running' })

  const judgeResult = await evaluateSubmission(targetProblemId, code, language)
  const verdict     = judgeResult.verdict

  // Persist completed submission row
  if (match.dbMatchId && targetProblemId) {
    try {
      await db.query(
        `INSERT INTO submissions
           (match_id, user_id, problem_id, code, language, status, verdict, runtime_ms)
         VALUES ($1, $2, $3, $4, $5, 'done', $6, $7)`,
        [match.dbMatchId, userId, targetProblemId, code, language, verdict, judgeResult.runtimeMs]
      )
    } catch (dbErr) {
      console.error('[DB] Failed to insert submission:', dbErr.message)
    }
  }

  // handleVerdict is shared — it emits submission_result and handles match end
  await handleVerdict({
    roomId,
    userId,
    username,
    verdict,
    totalTests:  judgeResult.totalTests,
    passedTests: judgeResult.passedTests,
    testResults: judgeResult.testResults,
    runtimeMs:   judgeResult.runtimeMs,
  }, io)
}

/* ════════════════════════════════════════════════════════════════════
   TRACK ROOM
   Called by matchmaking.js and customRoom.js when a room is created.
═══════════════════════════════════════════════════════════════════ */
function trackRoom(roomId, dbMatchId, problemId, isCustom = false, players = []) {
  if (activeMatches.has(roomId)) {
    const entry = activeMatches.get(roomId)
    entry.dbMatchId = dbMatchId
    if (problemId)     entry.problemId = problemId
    entry.isCustom = isCustom
    if (players.length) entry.players  = players
  } else {
    activeMatches.set(roomId, {
      dbMatchId,
      problemId,
      isCustom,
      players,
      submissions:       new Map(),
      startedAt:         Date.now(),
      disconnectTimers:  new Map(),
    })
  }
}

module.exports = { registerMatch, trackRoom, handleVerdict }
