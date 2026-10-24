import React from 'react'

/**
 * ArenaEmblem — Official SVG Emblem for AlgoArena
 * Clean split-hex design: Red left / Cyan right, no yellow
 */
export function ArenaEmblem({ size = 32, glow = false, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: glow
          ? 'drop-shadow(0 0 10px rgba(225,29,72,0.6)) drop-shadow(0 0 18px rgba(0,194,255,0.35))'
          : 'none',
        ...style,
      }}
      aria-label="AlgoArena emblem"
    >
      {/* Dark background hex */}
      <polygon
        points="60,5 106,30 106,90 60,115 14,90 14,30"
        fill="rgba(8,12,28,0.85)"
      />

      {/* Outer hex border — left half red */}
      <path
        d="M60 5 L14 30 L14 90 L60 115"
        stroke="#E11D48"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Outer hex border — right half cyan */}
      <path
        d="M60 5 L106 30 L106 90 L60 115"
        stroke="#00C2FF"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner 'A' — left leg, red */}
      <path
        d="M60 28 L36 88"
        stroke="#E11D48"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Inner 'A' — right leg, cyan */}
      <path
        d="M60 28 L84 88"
        stroke="#00C2FF"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Letter 'A' — Horizontal Crossbar (Gold) */}
      <line
        x1="41"
        y1="68"
        x2="79"
        y2="68"
        stroke="#F5B942"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * ArenaLogo — Full Brand Logo Component
 * Renders Emblem + "ALGO" (Red) + "ARENA" (Blue) + optional tagline
 */
export function ArenaLogo({
  size = 'md',        // 'sm' | 'md' | 'lg' | 'xl' | number
  layout = 'horizontal',
  showTagline = false,
  glow = false,
  className = '',
  style = {},
}) {
  const emblemSizes = { sm: 22, md: 30, lg: 42, xl: 60 }
  const fontSizes = {
    sm: { main: 15, tagline: 8 },
    md: { main: 20, tagline: 9 },
    lg: { main: 28, tagline: 11 },
    xl: { main: 42, tagline: 14 },
  }

  const emblemSize = typeof size === 'number' ? size : (emblemSizes[size] ?? 30)
  const fonts = typeof size === 'number'
    ? { main: Math.round(size * 0.65), tagline: Math.max(8, Math.round(size * 0.28)) }
    : (fontSizes[size] ?? fontSizes.md)

  return (
    <div
      className={`inline-flex ${layout === 'stacked' ? 'flex-col items-center' : 'items-center'} gap-2.5 ${className}`}
      style={style}
    >
      <ArenaEmblem size={emblemSize} glow={glow} />

      <div className="flex flex-col justify-center" style={{ lineHeight: 1 }}>
        {/* Wordmark */}
        <div
          style={{
            fontFamily: 'var(--font-display, "Inter", sans-serif)',
            fontSize: fonts.main,
            fontWeight: 900,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--c-red)' }}>ALGO</span>
          <span style={{ color: 'var(--c-blue)' }}>ARENA</span>
        </div>

        {/* Tagline */}
        {showTagline && (
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: fonts.tagline,
              fontWeight: 500,
              color: 'var(--c-text-mute)',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              marginTop: 4,
              whiteSpace: 'nowrap',
            }}
          >
            CODE · DUEL · CONQUER
          </div>
        )}
      </div>
    </div>
  )
}

export default ArenaLogo
