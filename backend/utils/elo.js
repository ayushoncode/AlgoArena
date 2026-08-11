/**
 * utils/elo.js — Elo rating calculation
 *
 * Standard chess Elo formula with variable K-factor:
 *   K = 40  → fewer than 10 matches (provisional player)
 *   K = 32  → default
 *   K = 16  → rating above 2000 (high-rated player)
 *
 * Full implementation in Day 43. Stub exported here so other
 * modules can import it without breaking.
 */

/**
 * kFactor(matchCount, rating) → K value
 */
function kFactor(matchCount, rating) {
  if (matchCount < 10)  return 40
  if (rating   > 2000)  return 16
  return 32
}

/**
 * expectedScore(ratingA, ratingB) → probability A beats B (0–1)
 */
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * calculateElo({ winnerRating, loserRating, winnerMatches, loserMatches })
 * Returns { winnerDelta, loserDelta, newWinnerRating, newLoserRating }
 *
 * Full wiring in Day 43.
 */
function calculateElo({ winnerRating, loserRating, winnerMatches = 0, loserMatches = 0 }) {
  const kW = kFactor(winnerMatches, winnerRating)
  const kL = kFactor(loserMatches,  loserRating)

  const expectedW = expectedScore(winnerRating, loserRating)
  const expectedL = 1 - expectedW

  const winnerDelta = Math.round(kW * (1 - expectedW))
  const loserDelta  = Math.round(kL * (0 - expectedL))

  return {
    winnerDelta,
    loserDelta,
    newWinnerRating: winnerRating + winnerDelta,
    newLoserRating:  Math.max(100, loserRating + loserDelta), // floor at 100
  }
}

module.exports = { calculateElo, kFactor, expectedScore }
