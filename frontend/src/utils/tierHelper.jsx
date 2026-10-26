import React from 'react'

/**
 * AlgoArena Shared Elo Rank Tier Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical tier system aligned with the official homepage ladder (content/home.js):
 * Tier 06: Grandmaster      (GM)   2000+
 * Tier 05: Candidate Master (CM)   1800-1999
 * Tier 04: Expert           (EXP)  1600-1799
 * Tier 03: Specialist       (SPEC) 1400-1599
 * Tier 02: Apprentice       (APP)  1200-1399
 * Tier 01: Novice           (NOV)  0-1199
 *
 * Tier marks: Single-stroke SVG marks, ink-color (currentColor), square line caps,
 * zero external libraries, zero emojis.
 */

const baseSvgProps = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': 'true',
}

export function TierMarkNovice({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M3 10L8 5L13 10" />
    </svg>
  )
}

export function TierMarkApprentice({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M3 8L8 3L13 8" />
      <path d="M3 13L8 8L13 13" />
    </svg>
  )
}

export function TierMarkSpecialist({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <polygon points="8,2.5 14,13.5 2,13.5" />
    </svg>
  )
}

export function TierMarkExpert({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <polygon points="8,2 14,8 8,14 2,8" />
    </svg>
  )
}

export function TierMarkCandidateMaster({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M2.5 13H13.5L12 5L8 9L4 5L2.5 13Z" />
    </svg>
  )
}

export function TierMarkGrandmaster({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <polygon points="8,1.5 10,6 14.5,8 10,10 8,14.5 6,10 1.5,8 6,6" />
    </svg>
  )
}

export const TIER_LADDER = [
  {
    code: 'GM',
    name: 'Grandmaster',
    tierNum: '06',
    min: 2000,
    max: null,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    Mark: TierMarkGrandmaster,
  },
  {
    code: 'CM',
    name: 'Candidate Master',
    tierNum: '05',
    min: 1800,
    max: 1999,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.3)',
    Mark: TierMarkCandidateMaster,
  },
  {
    code: 'EXP',
    name: 'Expert',
    tierNum: '04',
    min: 1600,
    max: 1799,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
    Mark: TierMarkExpert,
  },
  {
    code: 'SPEC',
    name: 'Specialist',
    tierNum: '03',
    min: 1400,
    max: 1599,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    Mark: TierMarkSpecialist,
  },
  {
    code: 'APP',
    name: 'Apprentice',
    tierNum: '02',
    min: 1200,
    max: 1399,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    Mark: TierMarkApprentice,
  },
  {
    code: 'NOV',
    name: 'Novice',
    tierNum: '01',
    min: 0,
    max: 1199,
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
    Mark: TierMarkNovice,
  },
]

/**
 * Returns canonical tier descriptor for an Elo rating
 * @param {number} elo
 * @returns {object} Tier descriptor with code, name, tierNum, min, max, Mark, color, bg, border
 */
export function getEloTier(elo) {
  const numericElo = typeof elo === 'number' ? elo : parseInt(elo, 10) || 0
  for (const tier of TIER_LADDER) {
    if (numericElo >= tier.min) {
      return tier
    }
  }
  return TIER_LADDER[TIER_LADDER.length - 1]
}
