import React from 'react'

function AlertIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2l6.5 12H1.5L8 2z" />
      <path d="M8 6.5v3" />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function ConnectionBannerV2({ connected }) {
  if (connected) return null

  return (
    <div
      className="battle-v2__conn-banner battle-v2__conn-banner--warn"
      role="status"
      aria-live="polite"
    >
      <AlertIcon size={12} />
      <span>Reconnecting to game server...</span>
    </div>
  )
}

