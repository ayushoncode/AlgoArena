/**
 * src/components/mascot/MascotFace.jsx
 *
 * Inline SVG robot head redrawn from the reference image.
 * Flat fills only, using design tokens from home-tokens.css.
 * Expressions are CSS data-states, not separate images.
 *
 * Props:
 *   expression  'neutral'|'happy'|'thinking'|'alert'|'sleepy'
 *   eyeOffsetX  number  pupil shift in px (from eye tracking, -3..3)
 *   eyeOffsetY  number  pupil shift in px (from eye tracking, -3..3)
 *   blinking    boolean  when true, eyes are closed (scaleY)
 *   lowPower    boolean  remove eye glow filter
 *   size        number  px (default 64)
 */

import React from 'react'

export default function MascotFace({
  expression = 'neutral',
  eyeOffsetX = 0,
  eyeOffsetY = 0,
  blinking = false,
  lowPower = false,
  size = 64,
}) {
  // Colour tokens (flat fills only)
  const C = {
    headDark:   '#060d1c',   // --bg-1
    headMid:    '#0a1428',   // --bg-2
    headLight:  '#0d1a35',   // slightly lighter for top plate
    earDark:    '#060d1c',
    earAccent:  '#0f1e3a',
    socketDark: '#020609',   // deep socket recess
    eyeBlue:    'rgba(140,196,255,1)',     // --blue
    eyeBlueHi:  'rgba(220,240,255,0.90)', // inner highlight
    gold:       'rgba(255,214,150,1)',     // --gold
    goldDim:    'rgba(255,214,150,0.55)',
    rimLine:    'rgba(140,196,255,0.45)',
    edgeHi:     'rgba(255,255,255,0.06)', // very subtle edge
  }

  // Expression-driven overrides
  const isHappy    = expression === 'happy'
  const isThinking = expression === 'thinking'
  const isAlert    = expression === 'alert'
  const isSleepy   = expression === 'sleepy'

  // Head tilt: happy 3deg, thinking -3deg
  const headRotate = isHappy ? 3 : isThinking ? -3 : 0

  // Eye scale: alert = 10% larger; sleepy = 60% (used via CSS, here as a data attr)
  // Blinking closes eyes to scaleY 0.08
  const eyeScaleY = blinking ? 0.08 : isSleepy ? 0.60 : isAlert ? 1.10 : 1.0
  const eyeScaleX = isAlert ? 1.08 : 1.0

  // Eye look direction for expressions (when no pointer data)
  // thinking = up-left, others = neutral
  const exprOffsetX = isThinking ? -1.5 : 0
  const exprOffsetY = isThinking ? -1.5 : 0
  const finalOffX = eyeOffsetX + exprOffsetX
  const finalOffY = eyeOffsetY + exprOffsetY

  // Glow filter id (unique per instance to avoid SVG id collisions)
  const filterId = 'mascot-eye-glow'

  return (
    <svg
      className={`mascot-face expr-${expression}`}
      data-expression={expression}
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        transform: `rotate(${headRotate}deg)`,
        transition: 'transform 180ms ease',
        overflow: 'visible',
      }}
      data-expression={expression}
    >
      <defs>
        {/* Eye glow filter -- disabled in low power mode */}
        {!lowPower && (
          <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}

        {/* Happy eye overlay clip (slight curve on bottom edge, makes eyes look rounder) */}
        <clipPath id="mascot-eye-clip-l">
          <rect x="10" y="24" width="16" height="14" rx="2" />
        </clipPath>
        <clipPath id="mascot-eye-clip-r">
          <rect x="38" y="24" width="16" height="14" rx="2" />
        </clipPath>
      </defs>

      {/* ── Layer 1: Main head body ────────────────────────────────────────── */}
      {/* Outer body - rounded square */}
      <rect
        x="6" y="10" width="52" height="52"
        rx="9" ry="9"
        fill={C.headDark}
      />

      {/* Slight face surface (lighter) */}
      <rect
        x="8" y="13" width="48" height="47"
        rx="7" ry="7"
        fill={C.headMid}
      />

      {/* ── Layer 2: Top plate ────────────────────────────────────────────── */}
      <rect
        x="14" y="8" width="36" height="14"
        rx="5" ry="5"
        fill={C.headLight}
      />
      {/* Top plate inner highlight */}
      <rect
        x="15" y="9" width="34" height="5"
        rx="3" ry="3"
        fill={C.edgeHi}
      />

      {/* ── Layer 3: Left ear piece ───────────────────────────────────────── */}
      <path
        d="M6 28 L2 30 L2 42 L6 44 Z"
        fill={C.earDark}
      />
      <path
        d="M6 30 L3.5 31.5 L3.5 40.5 L6 42 Z"
        fill={C.earAccent}
      />
      {/* Left ear gold slash accent */}
      <line
        x1="3.5" y1="34" x2="6" y2="31"
        stroke={C.gold} strokeWidth="1.2" strokeLinecap="round"
      />
      <line
        x1="3.5" y1="37.5" x2="6" y2="34.5"
        stroke={C.goldDim} strokeWidth="0.9" strokeLinecap="round"
      />

      {/* ── Layer 4: Right ear piece ──────────────────────────────────────── */}
      <path
        d="M58 28 L62 30 L62 42 L58 44 Z"
        fill={C.earDark}
      />
      <path
        d="M58 30 L60.5 31.5 L60.5 40.5 L58 42 Z"
        fill={C.earAccent}
      />
      {/* Right ear gold slash accent */}
      <line
        x1="60.5" y1="34" x2="58" y2="31"
        stroke={C.gold} strokeWidth="1.2" strokeLinecap="round"
      />
      <line
        x1="60.5" y1="37.5" x2="58" y2="34.5"
        stroke={C.goldDim} strokeWidth="0.9" strokeLinecap="round"
      />

      {/* ── Layer 5: Eye sockets (dark recesses) ──────────────────────────── */}
      {/* Left socket - angular hexagonal shape */}
      <path
        d="M11 27 L13 24 L24 24 L26 27 L26 37 L24 39 L13 39 L11 37 Z"
        fill={C.socketDark}
      />
      {/* Right socket */}
      <path
        d="M38 27 L40 24 L51 24 L53 27 L53 37 L51 39 L40 39 L38 37 Z"
        fill={C.socketDark}
      />

      {/* ── Layer 6: Left eye ────────────────────────────────────────────────
          transform-box:fill-box + transform-origin:center for blink scaleY */}
      <g
        style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 50%',
          transform: `scaleY(${eyeScaleY}) scaleX(${eyeScaleX})`,
          transition: blinking
            ? 'transform 110ms ease'
            : `transform ${expression === 'neutral' ? '180ms' : '180ms'} ease`,
        }}
        filter={!lowPower ? `url(#${filterId})` : undefined}
      >
        {/* Eye shape */}
        <path
          d="M12 28 L14 25.5 L23 25.5 L25 28 L25 36 L23 38 L14 38 L12 36 Z"
          fill={C.eyeBlue}
          clipPath="url(#mascot-eye-clip-l)"
        />
        {/* Happy overlay - slight eyelid curve */}
        {isHappy && (
          <path
            d="M12 28 Q18.5 25 25 28"
            fill={C.headMid}
            opacity="0.55"
          />
        )}
        {/* Pupil / highlight - moves with cursor */}
        <ellipse
          cx={18.5 + finalOffX}
          cy={31.5 + finalOffY}
          rx="3.5"
          ry="3.5"
          fill={C.eyeBlueHi}
          opacity="0.85"
        />
        {/* Inner bright spot */}
        <ellipse
          cx={17.5 + finalOffX}
          cy={30.0 + finalOffY}
          rx="1.2"
          ry="1.2"
          fill="rgba(255,255,255,0.95)"
        />
      </g>

      {/* ── Layer 7: Right eye ─────────────────────────────────────────────── */}
      <g
        style={{
          transformBox: 'fill-box',
          transformOrigin: '50% 50%',
          transform: `scaleY(${eyeScaleY}) scaleX(${eyeScaleX})`,
          transition: blinking
            ? 'transform 110ms ease'
            : 'transform 180ms ease',
        }}
        filter={!lowPower ? `url(#${filterId})` : undefined}
      >
        <path
          d="M39 28 L41 25.5 L50 25.5 L52 28 L52 36 L50 38 L41 38 L39 36 Z"
          fill={C.eyeBlue}
          clipPath="url(#mascot-eye-clip-r)"
        />
        {isHappy && (
          <path
            d="M39 28 Q45.5 25 52 28"
            fill={C.headMid}
            opacity="0.55"
          />
        )}
        <ellipse
          cx={45.5 + finalOffX}
          cy={31.5 + finalOffY}
          rx="3.5"
          ry="3.5"
          fill={C.eyeBlueHi}
          opacity="0.85"
        />
        <ellipse
          cx={44.5 + finalOffX}
          cy={30.0 + finalOffY}
          rx="1.2"
          ry="1.2"
          fill="rgba(255,255,255,0.95)"
        />
      </g>

      {/* ── Layer 8: Gold accent slashes (top corners) ────────────────────── */}
      {/* Left top slash */}
      <line
        x1="13" y1="14" x2="18" y2="9"
        stroke={C.gold} strokeWidth="1.5" strokeLinecap="round"
      />
      <line
        x1="16" y1="14" x2="20" y2="10"
        stroke={C.goldDim} strokeWidth="0.9" strokeLinecap="round"
      />
      {/* Right top slash */}
      <line
        x1="51" y1="14" x2="46" y2="9"
        stroke={C.gold} strokeWidth="1.5" strokeLinecap="round"
      />
      <line
        x1="48" y1="14" x2="44" y2="10"
        stroke={C.goldDim} strokeWidth="0.9" strokeLinecap="round"
      />

      {/* ── Layer 9: Rim lines (bottom corners, ice blue) ─────────────────── */}
      <line
        x1="8" y1="58" x2="20" y2="62"
        stroke={C.rimLine} strokeWidth="1" strokeLinecap="round"
      />
      <line
        x1="56" y1="58" x2="44" y2="62"
        stroke={C.rimLine} strokeWidth="1" strokeLinecap="round"
      />
      {/* Subtle horizontal base line */}
      <line
        x1="12" y1="61.5" x2="52" y2="61.5"
        stroke={C.rimLine} strokeWidth="0.6" opacity="0.6"
      />

      {/* ── Edge highlight (very subtle white on top edge) ────────────────── */}
      <path
        d="M14 8.5 Q32 7 50 8.5"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    </svg>
  )
}
