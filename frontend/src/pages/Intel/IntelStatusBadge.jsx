import React from 'react'
import { IconCheck, IconClose, IconClock } from '../../components/icons/index.jsx'

/**
 * IntelStatusBadge: Author post moderation status indicator
 * ─────────────────────────────────────────────────────────
 * - Approved: green text + check mark, 1px border, 12% tint
 * - Pending review: amber text + clock mark, 1px border, 12% tint
 * - Rejected: red text + cross mark, 1px border, 12% tint (with reason if present)
 */
export default function IntelStatusBadge({ status, reason, className = '' }) {
  const normalized = (status || '').toLowerCase().trim()

  if (normalized === 'approved') {
    return (
      <span className={`intel-status-badge intel-pending-badge intel-status-badge-approved ${className}`}>
        <IconCheck size={12} aria-hidden="true" />
        <span>Approved</span>
      </span>
    )
  }

  if (normalized === 'pending') {
    return (
      <span className={`intel-status-badge intel-pending-badge intel-status-badge-pending ${className}`}>
        <IconClock size={12} aria-hidden="true" />
        <span>Pending review</span>
      </span>
    )
  }

  if (normalized === 'rejected') {
    return (
      <span className={`intel-status-badge intel-pending-badge intel-status-badge-rejected ${className}`} title={reason || undefined}>
        <IconClose size={12} aria-hidden="true" />
        <span>Rejected</span>
        {reason ? <span className="intel-status-reason">({reason})</span> : null}
      </span>
    )
  }

  return null
}
