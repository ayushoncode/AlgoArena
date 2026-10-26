import React from 'react'

/**
 * IntelOutcomeMark — Plain ink outcome indicator
 * ───────────────────────────────────────────────
 * Renders outcome with a small custom mark and ink fill:
 * - Selected: solid mark + plain text
 * - Rejected: hollow mark + plain text
 * - Waiting: dashed mark + plain text
 * - Withdrew: muted mark + plain text
 * Zero red/green/amber chips. Single color per text element.
 */
export default function IntelOutcomeMark({ outcome }) {
  const normalized = (outcome || '').toLowerCase()

  if (normalized === 'selected') {
    return (
      <span className="intel-meta-item">
        <span className="intel-outcome-solid" aria-hidden="true" />
        <span>Selected</span>
      </span>
    )
  }

  if (normalized === 'rejected') {
    return (
      <span className="intel-meta-item">
        <span className="intel-outcome-hollow" aria-hidden="true" />
        <span>Rejected</span>
      </span>
    )
  }

  if (normalized === 'waiting') {
    return (
      <span className="intel-meta-item">
        <span className="intel-outcome-dashed" aria-hidden="true" />
        <span>Waiting</span>
      </span>
    )
  }

  return (
    <span className="intel-meta-item">
      <span className="intel-outcome-hollow" aria-hidden="true" />
      <span>{outcome || 'Report'}</span>
    </span>
  )
}
