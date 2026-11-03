import React from 'react'

/**
 * ArenaEmblem — Official 3D Animated Vector Emblem for AlgoArena
 * Features:
 * - 3D faceted isometric hexagon with dual lighting (Gold Left / Cyan Right)
 * - Chiseled titanium "A" monolith with kinetic laser slash
 * - Smooth CSS 3D perspective floating & breathing energy animation
 * - 100% vector crispness, transparent background (no box borders)
 */
export function ArenaEmblem({
  size = 32,
  glow = true,
  animate = true,
  className = '',
  style = {},
}) {
  const reactId = React.useId()
  const uid = 'ae_' + reactId.replace(/[^a-zA-Z0-9_-]/g, '')
  const pixelSize = typeof size === 'number' ? `${size}px` : size

  const glowGold = `${uid}_glow_gold`
  const glowCyan = `${uid}_glow_cyan`
  const goldRim = `${uid}_gold_rim`
  const goldWall = `${uid}_gold_wall`
  const cyanRim = `${uid}_cyan_rim`
  const cyanWall = `${uid}_cyan_wall`
  const chromeLeft = `${uid}_chrome_left`
  const chromeRight = `${uid}_chrome_right`
  const slashBeam = `${uid}_slash_beam`

  return (
    <div
      className={`aa-emblem-3d-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '700px',
        width: pixelSize,
        height: pixelSize,
        ...style,
      }}
    >
      <svg
        className={`aa-emblem-3d-svg ${animate ? 'aa-emblem-animated' : ''}`}
        viewBox="0 0 160 160"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transformStyle: 'preserve-3d',
          filter: glow
            ? 'drop-shadow(0 0 10px rgba(255, 214, 150, 0.35)) drop-shadow(0 0 16px rgba(140, 196, 255, 0.45))'
            : 'none',
        }}
        aria-label="AlgoArena emblem"
      >
        <defs>
          {/* Dual Glow Filters */}
          <filter id={glowGold} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={glowCyan} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gold Lighting Gradients */}
          <linearGradient id={goldRim} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5db" />
            <stop offset="35%" stopColor="#ffd696" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id={goldWall} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1e1b18" stopOpacity="0.95" />
          </linearGradient>

          {/* Cyan Lighting Gradients */}
          <linearGradient id={cyanRim} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="35%" stopColor="#8cc4ff" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id={cyanWall} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#091428" stopOpacity="0.95" />
          </linearGradient>

          {/* Titanium Monolith Gradients */}
          <linearGradient id={chromeLeft} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="80%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id={chromeRight} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="80%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Kinetic Slash Energy Beam */}
          <linearGradient id={slashBeam} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffd696" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#8cc4ff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* Ambient Subtle Outer Glow lines */}
        <path
          d="M80 18 L136 50 L136 114 L80 146 L24 114 L24 50 Z"
          stroke={`url(#${goldRim})`}
          strokeWidth="2"
          opacity="0.3"
          filter={`url(#${glowGold})`}
        />
        <path
          d="M80 18 L136 50 L136 114 L80 146"
          stroke={`url(#${cyanRim})`}
          strokeWidth="3"
          opacity="0.45"
          filter={`url(#${glowCyan})`}
        />

        {/* 1. Outer 3D Hex Bevel Wall — Left Side (Gold) */}
        <polygon
          points="80,18 24,50 24,114 80,146 80,134 36,107 36,57 80,31"
          fill={`url(#${goldWall})`}
        />
        <path
          d="M80 18 L24 50 L24 114 L80 146"
          stroke={`url(#${goldRim})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Outer 3D Hex Bevel Wall — Right Side (Cyan) */}
        <polygon
          points="80,18 136,50 136,114 80,146 80,134 124,107 124,57 80,31"
          fill={`url(#${cyanWall})`}
        />
        <path
          d="M80 18 L136 50 L136 114 L80 146"
          stroke={`url(#${cyanRim})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. Inner Hex Recessed Core Trench */}
        <polygon
          points="80,31 124,57 124,107 80,134 36,107 36,57"
          fill="#1a1a1a"
          opacity="0.9"
        />

        {/* 4. Central 3D "A" Monolith */}
        {/* Left Pillar (Lit with white-gold chrome) */}
        <polygon
          points="80,42 80,56 54,112 42,112"
          fill={`url(#${chromeLeft})`}
        />
        <line
          x1="80"
          y1="42"
          x2="42"
          y2="112"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Right Pillar (Lit with white-cyan chrome) */}
        <polygon
          points="80,42 80,56 106,112 118,112"
          fill={`url(#${chromeRight})`}
        />
        <line
          x1="80"
          y1="42"
          x2="118"
          y2="112"
          stroke="#93c5fd"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* A-Apex Chiseled Peak (Center Cap) */}
        <polygon
          points="80,40 73,54 80,59 87,54"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Inner Triangular Recess */}
        <polygon
          points="80,62 67,90 93,90"
          fill="#1a1a1a"
        />

        {/* 5. Iconic Kinetic 3D Slash (Light Beam cutting through) */}
        <polygon
          points="38,98 84,72 128,64 92,84 56,104"
          fill={`url(#${slashBeam})`}
          filter={`url(#${glowCyan})`}
        />
        <line
          x1="36"
          y1="100"
          x2="132"
          y2="62"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="132"
          cy="62"
          r="3"
          fill="#ffffff"
          filter={`url(#${glowCyan})`}
        />
      </svg>
    </div>
  )
}

/**
 * ArenaLogo — Full Brand Logo Component
 * Renders Emblem + "ALGO" + "ARENA" + optional tagline
 */
export function ArenaLogo({
  size = 'md',
  layout = 'horizontal',
  showTagline = false,
  glow = true,
  animate = true,
  className = '',
  style = {},
}) {
  const emblemSizes = { sm: 24, md: 32, lg: 44, xl: 64 }
  const fontSizes = {
    sm: { main: 15, tagline: 8 },
    md: { main: 20, tagline: 9 },
    lg: { main: 28, tagline: 11 },
    xl: { main: 42, tagline: 14 },
  }

  const emblemSize = typeof size === 'number' ? size : (emblemSizes[size] ?? 32)
  const fonts = typeof size === 'number'
    ? { main: Math.round(size * 0.65), tagline: Math.max(8, Math.round(size * 0.28)) }
    : (fontSizes[size] ?? fontSizes.md)

  return (
    <div
      className={`inline-flex ${layout === 'stacked' ? 'flex-col items-center' : 'items-center'} gap-2.5 ${className}`}
      style={style}
    >
      <ArenaEmblem size={emblemSize} glow={glow} animate={animate} />

      <div className="flex flex-col justify-center" style={{ lineHeight: 1 }}>
        {/* Wordmark */}
        <div
          style={{
            fontFamily: 'var(--font-display, "Sora", sans-serif)',
            fontSize: fonts.main,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--ink, #ffffff)',
          }}
        >
          <span>ALGOARENA</span>
        </div>

        {/* Tagline */}
        {showTagline && (
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: fonts.tagline,
              fontWeight: 500,
              color: '#64748b',
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
