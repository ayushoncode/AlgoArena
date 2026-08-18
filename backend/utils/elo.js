/**
 * utils/elo.js — Competitive Coding Elo Rating Model (LeetCode / Codeforces Style)
 *
 * Factors in:
 *   1. Dynamic K-Factor (placement matches vs established vs high-tier)
 *   2. Expected outcome probability E_A vs E_B
 *   3. Problem Difficulty Multipliers: Easy (0.85x), Medium (1.0x), Hard (1.3x)
 *   4. Speed Bonus: Scaled bonus for fast solves under 5m / 10m / 20m
 *   5. Submission Accuracy Penalty: Small penalty for repeated failed test runs
 *   6. Partial Score Resolution for Timeout Draws
 */

'use strict'

/**
 * kFactor(matchCount, rating) → K value
 */
function kFactor(matchCount, rating) {
  if (matchCount < 5)   return 48  // Placement calibration matches
  if (matchCount < 15)  return 36
  if (rating   > 2000)  return 16  // Grandmaster tier stability
  if (rating   > 1600)  return 24  // Expert tier
  return 32
}

/**
 * difficultyMultiplier(difficulty)
 * Rewards harder problems with higher Elo gains and softer penalties.
 */
function difficultyMultiplier(difficulty) {
  if (!difficulty) return 1.0
  const d = String(difficulty).toLowerCase()
  if (d === 'hard')   return 1.30
  if (d === 'easy')   return 0.85
  return 1.00
}

/**
 * speedBonus(solveTimeSec)
 * Speed bonus based on solve time relative to 30-minute (1800s) match duration.
 */
function speedBonus(solveTimeSec) {
  if (typeof solveTimeSec !== 'number' || solveTimeSec <= 0) return 0
  if (solveTimeSec <= 300)  return 5   // Solved within 5 minutes
  if (solveTimeSec <= 600)  return 3   // Solved within 10 minutes
  if (solveTimeSec <= 1200) return 1   // Solved within 20 minutes
  return 0
}

/**
 * expectedScore(ratingA, ratingB) → probability A beats B (0–1)
 */
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * getRankTier(rating) → Badge metadata
 */
function getRankTier(rating) {
  const r = Number(rating) || 1200
  if (r >= 2000) return { title: 'Grandmaster',      color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)' }
  if (r >= 1800) return { title: 'Candidate Master', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' }
  if (r >= 1600) return { title: 'Expert',           color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' }
  if (r >= 1400) return { title: 'Specialist',       color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)' }
  if (r >= 1200) return { title: 'Apprentice',       color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' }
  return { title: 'Novice', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.3)' }
}

/**
 * calculateElo({
 *   winnerRating,
 *   loserRating,
 *   winnerMatches = 0,
 *   loserMatches = 0,
 *   difficulty = 'medium',
 *   solveTimeSec = null,
 *   wrongAttempts = 0,
 *   isDraw = false,
 *   scoreA = 1,
 *   scoreB = 0,
 * })
 */
function calculateElo({
  winnerRating,
  loserRating,
  winnerMatches = 0,
  loserMatches = 0,
  difficulty = 'medium',
  solveTimeSec = null,
  wrongAttempts = 0,
  isDraw = false,
  scoreA = 1,
  scoreB = 0,
}) {
  const kW = kFactor(winnerMatches, winnerRating)
  const kL = kFactor(loserMatches,  loserRating)

  const expectedW = expectedScore(winnerRating, loserRating)
  const expectedL = 1 - expectedW

  const diffMult = difficultyMultiplier(difficulty)
  const speed    = speedBonus(solveTimeSec)
  const penalty  = Math.min(4, Math.max(0, (wrongAttempts || 0) * 1))

  let winnerDelta, loserDelta

  if (isDraw) {
    winnerDelta = Math.round(kW * (scoreA - expectedW) * diffMult)
    loserDelta  = Math.round(kL * (scoreB - expectedL) * diffMult)
  } else {
    const rawWinDelta  = kW * (1 - expectedW) * diffMult
    const rawLossDelta = kL * (0 - expectedL) * diffMult

    winnerDelta = Math.max(2, Math.round(rawWinDelta + speed - penalty))
    loserDelta  = Math.min(-2, Math.round(rawLossDelta))
  }

  return {
    winnerDelta,
    loserDelta,
    newWinnerRating: Math.max(100, winnerRating + winnerDelta),
    newLoserRating:  Math.max(100, loserRating + loserDelta),
  }
}

module.exports = {
  calculateElo,
  kFactor,
  expectedScore,
  difficultyMultiplier,
  speedBonus,
  getRankTier,
}

