/**
 * frontend/src/components/PremiumBadge.jsx
 *
 * Premium member badge component:
 * - Small custom mark (hexagon outline with short bar)
 * - Word "Premium" in 11px monospace
 * - Color: var(--gold, #ffd696)
 * - Tooltip / title: "Premium member"
 * - No glow, no crown, no sparkle, zero animations, no text gradients
 */

import React from 'react'
import { IconHexagonBadge } from './icons'

export default function PremiumBadge({ size = 'sm', className = '', showLabel = true }) {
  const iconSize = size === 'xs' ? 12 : 13

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono select-none ${className}`}
      title="Premium member"
      aria-label="Premium member"
      style={{
        color: 'var(--gold, #ffd696)',
        verticalAlign: 'middle',
        lineHeight: 1
      }}
    >
      <IconHexagonBadge size={iconSize} />
      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            textTransform: 'none'
          }}
        >
          Premium
        </span>
      )}
    </span>
  )
}

