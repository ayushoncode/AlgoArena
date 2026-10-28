import React from 'react'

/**
 * IntelMonogram: Square company monogram drawn with CSS hairline
 * ───────────────────────────────────────────────────────────────
 * Renders 1-2 clean uppercase characters in mono.
 * No external company logos or images.
 */
export default function IntelMonogram({ name }) {
  const clean = (name || 'C').trim()
  const initials = clean.length >= 2 ? clean.slice(0, 2).toUpperCase() : clean.slice(0, 1).toUpperCase()

  return (
    <span className="intel-company-monogram" aria-hidden="true">
      {initials}
    </span>
  )
}
