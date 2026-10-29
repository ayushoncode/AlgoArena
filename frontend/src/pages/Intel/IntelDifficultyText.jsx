import React from 'react'

/**
 * IntelDifficultyText: Word only difficulty with semantic color
 * ─────────────────────────────────────────────────────────────
 * - Easy: green text (--ok)
 * - Medium: amber text (--warn)
 * - Hard: red text (--bad)
 * Word only, no pill background.
 */
export default function IntelDifficultyText({ difficulty, className = '' }) {
  if (!difficulty) return null
  const normalized = difficulty.toLowerCase().trim()

  let colorClass = 'intel-diff-medium'
  let label = 'Medium'

  if (normalized === 'easy') {
    colorClass = 'intel-diff-easy'
    label = 'Easy'
  } else if (normalized === 'hard') {
    colorClass = 'intel-diff-hard'
    label = 'Hard'
  } else if (normalized === 'medium') {
    colorClass = 'intel-diff-medium'
    label = 'Medium'
  } else {
    label = difficulty
  }

  return (
    <span className={`intel-meta-item intel-difficulty-text ${colorClass} ${className}`}>
      {label}
    </span>
  )
}
