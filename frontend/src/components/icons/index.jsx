import React from 'react'

/**
 * AlgoArena Custom Inline SVG Icon Set
 * ───────────────────────────────────────────
 * Specifications:
 * - 20x20 viewBox
 * - 1.5px stroke width
 * - Square line caps, miter joins (matching hero chevron aesthetics)
 * - Single color via currentColor
 * - Zero external libraries
 */

const baseSvgProps = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': 'true',
}

export function IconArrowRight({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M3 10H16.5" />
      <path d="M11.5 5L16.5 10L11.5 15" />
    </svg>
  )
}

export function IconChevronRight({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M7.5 4.5L13 10L7.5 15.5" />
    </svg>
  )
}

export function IconChevronLeft({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M12.5 4.5L7 10L12.5 15.5" />
    </svg>
  )
}

export function IconChevronDown({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M4.5 7.5L10 13L15.5 7.5" />
    </svg>
  )
}

export function IconPlus({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M10 4V16" />
      <path d="M4 10H16" />
    </svg>
  )
}

export function IconMinus({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M4 10H16" />
    </svg>
  )
}

export function IconPlay({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <polygon points="6,4 16,10 6,16" strokeLinejoin="miter" />
    </svg>
  )
}

export function IconPause({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <rect x="5" y="4" width="3" height="12" />
      <rect x="12" y="4" width="3" height="12" />
    </svg>
  )
}

export function IconRestart({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M3.5 10C3.5 6.41 6.41 3.5 10 3.5C13.59 3.5 16.5 6.41 16.5 10C16.5 13.59 13.59 16.5 10 16.5C7.2 16.5 4.8 14.73 3.9 12.2" />
      <polyline points="2 7 3.5 3.5 7 5" />
    </svg>
  )
}

export function IconCopy({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <rect x="7" y="7" width="10" height="10" />
      <path d="M3 13V3H13" />
    </svg>
  )
}

export function IconCheck({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <polyline points="4 11 8.5 15.5 16.5 5.5" />
    </svg>
  )
}

export function IconCode({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <polyline points="6 6 2 10 6 14" />
      <polyline points="14 6 18 10 14 14" />
      <line x1="12" y1="4" x2="8" y2="16" />
    </svg>
  )
}

export function IconShield({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M10 2.5L3.5 5.5V10.5C3.5 14.5 6.5 17.5 10 18.5C13.5 17.5 16.5 14.5 16.5 10.5V5.5L10 2.5Z" />
    </svg>
  )
}

export function IconTrophy({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M5 4H15V9C15 11.8 12.8 14 10 14C7.2 14 5 11.8 5 9V4Z" />
      <path d="M5 6H2.5C2.5 8.2 4.3 10 6.5 10" />
      <path d="M15 6H17.5C17.5 8.2 15.7 10 13.5 10" />
      <line x1="10" y1="14" x2="10" y2="17.5" />
      <line x1="6.5" y1="17.5" x2="13.5" y2="17.5" />
    </svg>
  )
}

export function IconSearch({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <circle cx="8.5" cy="8.5" r="5" />
      <line x1="12" y1="12" x2="16.5" y2="16.5" />
    </svg>
  )
}

export function IconClose({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" />
      <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" />
    </svg>
  )
}

export function IconSwords({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <line x1="3.5" y1="3.5" x2="13.5" y2="13.5" />
      <line x1="16.5" y1="3.5" x2="6.5" y2="13.5" />
      <line x1="2" y1="18" x2="5" y2="15" />
      <line x1="18" y1="18" x2="15" y2="15" />
    </svg>
  )
}

export function IconShuffle({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M13 3H17V7" />
      <path d="M3 17L7 13L17 3" />
      <path d="M13 17H17V13" />
      <path d="M3 3L7 7L17 17" />
    </svg>
  )
}

export function IconBook({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M3 4.5C4.5 3.5 7 3.5 10 5V17C7 15.5 4.5 15.5 3 16.5V4.5Z" />
      <path d="M17 4.5C15.5 3.5 13 3.5 10 5V17C13 15.5 15.5 15.5 17 16.5V4.5Z" />
    </svg>
  )
}

export function IconLock({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <rect x="4" y="9" width="12" height="9" />
      <path d="M7 9V5.5C7 3.84 8.34 2.5 10 2.5C11.66 2.5 13 3.84 13 5.5V9" />
    </svg>
  )
}

export function IconHexagonBadge({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
      <polygon points="8,1.5 14,4.9 14,11.1 8,14.5 2,11.1 2,4.9" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" strokeWidth="1.2" />
    </svg>
  )
}

export function IconBookmark({ size = 20, filled = false, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps} fill={filled ? 'currentColor' : 'none'}>
      <path d="M5 3.5H15V17L10 13.5L5 17V3.5Z" />
    </svg>
  )
}

export function IconThumbsUp({ size = 20, filled = false, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps} fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 9V17H3V9H6Z" />
      <path d="M6 17H14.5C15.3 17 16 16.3 16 15.5L16.8 11.5C16.9 10.7 16.3 10 15.5 10H11.5V5.5C11.5 4.4 10.6 3.5 9.5 3.5L7.5 7.5L6 9" />
    </svg>
  )
}

export function IconFilter({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M3 4H17L11.5 10.5V16L8.5 17.5V10.5L3 4Z" />
    </svg>
  )
}

export function IconExternalLink({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M9 4H4V16H16V11" />
      <path d="M11 4H16V9" />
      <path d="M16 4L9 11" />
    </svg>
  )
}

export function IconCalendar({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <rect x="3" y="5" width="14" height="12" />
      <line x1="3" y1="9" x2="17" y2="9" />
      <line x1="7" y1="3" x2="7" y2="6" />
      <line x1="13" y1="3" x2="13" y2="6" />
    </svg>
  )
}

export function IconMapPin({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M10 2.5C7 2.5 4.5 5 4.5 8C4.5 12.5 10 17.5 10 17.5C10 17.5 15.5 12.5 15.5 8C15.5 5 13 2.5 10 2.5Z" />
      <circle cx="10" cy="8" r="2.5" />
    </svg>
  )
}

export function IconClock({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <circle cx="10" cy="10" r="7" />
      <polyline points="10 6 10 10 13 10" />
    </svg>
  )
}

export function IconFlag({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <line x1="4" y1="3" x2="4" y2="17" />
      <path d="M4 4H15L12 8L15 12H4" />
    </svg>
  )
}

export function IconEdit({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M13.5 3.5L16.5 6.5L6.5 16.5H3.5V13.5L13.5 3.5Z" />
    </svg>
  )
}

export function IconTrash({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <line x1="3" y1="5.5" x2="17" y2="5.5" />
      <path d="M7.5 5.5V3.5H12.5V5.5" />
      <path d="M4.5 5.5L5.5 16.5H14.5L15.5 5.5" />
      <line x1="8.5" y1="8.5" x2="8.5" y2="13.5" />
      <line x1="11.5" y1="8.5" x2="11.5" y2="13.5" />
    </svg>
  )
}

export function IconFlame({ size = 20, filled = false, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps} fill={filled ? 'currentColor' : 'none'}>
      <path d="M10 2.5C10 2.5 13.5 6 13.5 10C13.5 11.5 12.8 13 11.8 14C11.5 12.5 10.5 11.2 9.2 10.5C9 12.5 8 14 6.5 15C5.5 13.8 5 12 5 10C5 6.5 8 4 10 2.5Z" />
    </svg>
  )
}

export function IconUser({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <circle cx="10" cy="6.5" r="3.5" />
      <path d="M4 17C4 13.5 6.5 12.5 10 12.5C13.5 12.5 16 13.5 16 17" />
    </svg>
  )
}

export function IconFileText({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M4 3H12L16 7V17H4V3Z" />
      <polyline points="12 3 12 7 16 7" />
      <line x1="7" y1="11" x2="13" y2="11" />
      <line x1="7" y1="14" x2="11" y2="14" />
    </svg>
  )
}

export function IconLogOut({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M8 4H4V16H8" />
      <polyline points="12 7 15.5 10 12 13" />
      <line x1="15.5" y1="10" x2="7" y2="10" />
    </svg>
  )
}

export function IconSun({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <circle cx="10" cy="10" r="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="10" y1="16" x2="10" y2="18" />
      <line x1="2" y1="10" x2="4" y2="10" />
      <line x1="16" y1="10" x2="18" y2="10" />
      <line x1="4.34" y1="4.34" x2="5.76" y2="5.76" />
      <line x1="14.24" y1="14.24" x2="15.66" y2="15.66" />
      <line x1="4.34" y1="15.66" x2="5.76" y2="14.24" />
      <line x1="14.24" y1="5.76" x2="15.66" y2="4.34" />
    </svg>
  )
}

export function IconMoon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseSvgProps}>
      <path d="M16 11.5C15.2 14.5 12.5 16.5 9.5 16.5C6 16.5 3.5 14 3.5 10.5C3.5 7.5 5.5 4.8 8.5 4C8 5.2 8 6.8 8.5 8C9.5 10.5 12 11.5 14.5 11C15 11.2 15.5 11.4 16 11.5Z" />
    </svg>
  )
}
