import React from 'react'
import { IconCheck, IconClose, IconClock, IconMinus } from '../../components/icons/index.jsx'

/**
 * IntelOutcomeMark: Semantic outcome indicator
 * ─────────────────────────────────────────────
 * Outcomes:
 * - Selected / Offer: "Got the offer" (green text + check mark)
 * - Rejected: "Rejected" (red text + cross mark)
 * - Waiting: "Waiting" (amber text + clock mark)
 * - Withdrew: "Withdrew" (muted grey text + dash mark)
 *
 * Rules:
 * - Word plus custom mark
 * - Semantic color token on text and mark
 * - Preserves test compatibility classes (.intel-outcome-solid, etc.)
 */
export default function IntelOutcomeMark({ outcome, className = '' }) {
  const normalized = (outcome || '').toLowerCase().trim()

  if (normalized === 'selected' || normalized === 'offer' || normalized === 'got the offer') {
    return (
      <span className={`intel-meta-item intel-outcome-mark intel-outcome-ok intel-outcome-solid ${className}`}>
        <IconCheck size={14} aria-hidden="true" />
        <span>Got the offer</span>
      </span>
    )
  }

  if (normalized === 'rejected') {
    return (
      <span className={`intel-meta-item intel-outcome-mark intel-outcome-bad intel-outcome-hollow ${className}`}>
        <IconClose size={14} aria-hidden="true" />
        <span>Rejected</span>
      </span>
    )
  }

  if (normalized === 'waiting') {
    return (
      <span className={`intel-meta-item intel-outcome-mark intel-outcome-warn intel-outcome-dashed ${className}`}>
        <IconClock size={14} aria-hidden="true" />
        <span>Waiting</span>
      </span>
    )
  }

  if (normalized === 'withdrew') {
    return (
      <span className={`intel-meta-item intel-outcome-mark intel-outcome-muted ${className}`}>
        <IconMinus size={14} aria-hidden="true" />
        <span>Withdrew</span>
      </span>
    )
  }

  return (
    <span className={`intel-meta-item intel-outcome-mark intel-outcome-muted intel-outcome-hollow ${className}`}>
      <IconMinus size={14} aria-hidden="true" />
      <span>{outcome || 'Report'}</span>
    </span>
  )
}
