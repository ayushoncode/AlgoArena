/**
 * src/lib/tiers.js : Canonical Elo Rank Tier Helper for AlgoArena
 * 
 * Sources of Truth:
 * - backend/utils/elo.js (getRankTier, kFactor)
 * - content/home.js (official tier ladder)
 * 
 * Divisions & Thresholds:
 *   Novice           (NOV)  0-1199   (Threshold 0, baseline K=48 during placement <5 matches)
 *   Apprentice       (APP)  1200-1399 (Threshold 1200, K=32/36)
 *   Specialist       (SPEC) 1400-1599 (Threshold 1400, K=32/36)
 *   Expert           (EXP)  1600-1799 (Threshold 1600, K=24)
 *   Candidate Master (CM)   1800-1999 (Threshold 1800, K=24)
 *   Grandmaster      (GM)   2000+    (Threshold 2000, K=16)
 */

import React from 'react'
import {
  TierMarkNovice,
  TierMarkApprentice,
  TierMarkSpecialist,
  TierMarkExpert,
  TierMarkCandidateMaster,
  TierMarkGrandmaster,
} from '../utils/tierHelper'

export {
  TierMarkNovice,
  TierMarkApprentice,
  TierMarkSpecialist,
  TierMarkExpert,
  TierMarkCandidateMaster,
  TierMarkGrandmaster,
}

export const CANONICAL_TIERS = [
  {
    name: 'Novice',
    code: 'NOV',
    tierNum: '01',
    min: 0,
    max: 1199,
    threshold: 0,
    nextThreshold: 1200,
    nextName: 'Apprentice',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.25)',
    Mark: TierMarkNovice,
  },
  {
    name: 'Apprentice',
    code: 'APP',
    tierNum: '02',
    min: 1200,
    max: 1399,
    threshold: 1200,
    nextThreshold: 1400,
    nextName: 'Specialist',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    Mark: TierMarkApprentice,
  },
  {
    name: 'Specialist',
    code: 'SPEC',
    tierNum: '03',
    min: 1400,
    max: 1599,
    threshold: 1400,
    nextThreshold: 1600,
    nextName: 'Expert',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.25)',
    Mark: TierMarkSpecialist,
  },
  {
    name: 'Expert',
    code: 'EXP',
    tierNum: '04',
    min: 1600,
    max: 1799,
    threshold: 1600,
    nextThreshold: 1800,
    nextName: 'Candidate Master',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.25)',
    Mark: TierMarkExpert,
  },
  {
    name: 'Candidate Master',
    code: 'CM',
    tierNum: '05',
    min: 1800,
    max: 1999,
    threshold: 1800,
    nextThreshold: 2000,
    nextName: 'Grandmaster',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.25)',
    Mark: TierMarkCandidateMaster,
  },
  {
    name: 'Grandmaster',
    code: 'GM',
    tierNum: '06',
    min: 2000,
    max: 9999,
    threshold: 2000,
    nextThreshold: null,
    nextName: null,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.25)',
    Mark: TierMarkGrandmaster,
  },
]

/**
 * Returns canonical tier for a given Elo rating
 * @param {number} rating
 * @returns {object} Tier descriptor
 */
export function getTierForRating(rating) {
  const r = typeof rating === 'number' ? rating : parseInt(rating, 10) || 1200
  for (let i = CANONICAL_TIERS.length - 1; i >= 0; i--) {
    if (r >= CANONICAL_TIERS[i].threshold) {
      return CANONICAL_TIERS[i]
    }
  }
  return CANONICAL_TIERS[0]
}

/**
 * Computes progress within the current tier toward the next threshold
 * @param {number} rating 
 * @param {number} totalMatches
 * @returns {{ pct: number, needed: number, currentName: string, nextName: string|null, isTopTier: boolean, isPlacement: boolean, placementCount: number, label: string }}
 */
export function getTierProgress(rating = 1200, totalMatches = 0) {
  const r = typeof rating === 'number' ? rating : parseInt(rating, 10) || 1200
  const matches = typeof totalMatches === 'number' ? totalMatches : parseInt(totalMatches, 10) || 0

  if (matches < 5) {
    const pct = Math.min(100, Math.max(0, Math.round((matches / 5) * 100)))
    return {
      pct,
      needed: 5 - matches,
      currentName: 'Placement',
      nextName: 'Novice',
      isTopTier: false,
      isPlacement: true,
      placementCount: matches,
      label: `Placement: ${matches} of 5 matches played`,
    }
  }

  const current = getTierForRating(r)

  if (!current.nextThreshold) {
    return {
      pct: 100,
      needed: 0,
      currentName: current.name,
      nextName: null,
      isTopTier: true,
      isPlacement: false,
      placementCount: matches,
      label: 'Highest tier',
    }
  }

  const range = current.nextThreshold - current.threshold
  const elapsed = r - current.threshold
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / range) * 100)))
  const needed = Math.max(0, current.nextThreshold - r)

  return {
    pct,
    needed,
    currentName: current.name,
    nextName: current.nextName,
    isTopTier: false,
    isPlacement: false,
    placementCount: matches,
    label: `${needed} rating points to ${current.nextName}`,
  }
}
