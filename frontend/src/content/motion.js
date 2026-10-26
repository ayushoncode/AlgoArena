/**
 * AlgoArena Motion Design System Configuration
 * Single source of truth for all 3D scroll-driven depth transitions.
 * Tune intensity values here without modifying component implementation code.
 */

export const MOTION_CONFIG = {
  // Entrance transition: section arrives from below and behind, settling flat
  enter: {
    rotateX: '10deg',
    translateY: '56px',
    translateZ: '-140px',
    opacity: 0,
    rangeStart: 'entry 0%',
    rangeEnd: 'entry 38%',
    range: 'entry 0% entry 38%',
  },

  // Exit transition: previous section recedes into depth as next section arrives
  exit: {
    scale: 0.965,
    translateZ: '-90px',
    rotateX: '-3deg',
    opacityTo: 0.55,
    rangeStart: 'exit 40%',
    rangeEnd: 'exit 100%',
    range: 'exit 40% exit 100%',
  },

  // Perspective parameters applied strictly to non-sticky stage wrappers
  perspective: '1400px',
  perspectiveOrigin: '50% 40%',

  // Inner-section layer depth: headings sit at Z=0, visual panels arrive from deeper
  innerDepth: {
    headingTranslateZ: '0px',
    visualTranslateZ: '-60px',
  },

  // Stagger offsets for child lists / grids
  stagger: {
    baseOffsetMs: 60,
    maxDelayMs: 240,
  },

  // Hairline border reveal progression
  hairline: {
    drawRangeStart: 'entry 10%',
    drawRangeEnd: 'entry 40%',
    drawRange: 'entry 10% entry 40%',
  },

  // Hall of Heroes podium plinth rise progression
  plinth: {
    riseZ: '40px',
    riseY: '24px',
  },

  // WebGL emblem scroll-linked rotation range
  emblem: {
    rotationRangeDeg: 25,
  },

  // Lite mode overrides for mobile (<900px) and low concurrency (<4 cores)
  lite: {
    translateY: '24px',
    opacity: 0,
  },
}
