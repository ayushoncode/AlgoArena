/**
 * EmblemPoses.js: 3D Thread Poses Configuration for AlgoArena "Who We Are"
 * Each pose specifies [x, y, z] position in world units, [rx, ry, rz] Euler rotation,
 * scale factor, and rim light boost multiplier.
 * Poses are smoothly interpolated via damped lerp driven by scroll progress.
 */

export const EMBLEM_POSES = [
  {
    id: 'w1-intro',
    sectionId: 'w1Intro',
    name: 'W1 Intro: Floating Core',
    scrollRange: [0.0, 0.16],
    position: [2.05, 0.15, 0.0],
    rotation: [0.15, -0.32, 0.0],
    scale: 1.02,
    rimBoost: 1.0,
    idleSpeed: 0.35,
  },
  {
    id: 'w2-team',
    sectionId: 'w2Team',
    name: 'W2 Team: Docked Beside Selector',
    scrollRange: [0.16, 0.38],
    position: [1.8, -0.1, -0.3],
    rotation: [0.22, -0.68, 0.06],
    scale: 0.82,
    rimBoost: 1.05,
    idleSpeed: 0.1,
  },
  {
    id: 'w3-story',
    sectionId: 'w3Story',
    name: 'W3 Story: Edge-on Timeline Rail',
    scrollRange: [0.38, 0.62],
    position: [0.0, -1.15, 0.0],
    rotation: [0.0, Math.PI / 2, 0.0], // 90deg edge-on thin profile
    scale: 0.62,
    rimBoost: 1.1,
    idleSpeed: 0.0,
  },
  {
    id: 'w4-principles',
    sectionId: 'w4Principles',
    name: 'W4 Principles: Front Facing 90deg Turn',
    scrollRange: [0.62, 0.82],
    position: [0.0, 0.05, -0.2],
    rotation: [0.0, 0.0, 0.0],
    scale: 0.68,
    rimBoost: 1.0,
    idleSpeed: 0.0,
  },
  {
    id: 'w5-stack',
    sectionId: 'w5Stack',
    name: 'W5 Stack: Compact Bottom Right',
    scrollRange: [0.82, 0.92],
    position: [1.65, -1.35, -0.4],
    rotation: [0.22, -0.42, 0.0],
    scale: 0.55,
    rimBoost: 1.0,
    idleSpeed: 0.08,
  },
  {
    id: 'w6-contact',
    sectionId: 'w6Contact',
    name: 'W6 Contact: Settled CTA Accent',
    scrollRange: [0.92, 1.0],
    position: [1.9, -1.65, 0.0],
    rotation: [0.12, -0.22, 0.0],
    scale: 0.58,
    rimBoost: 1.5,
    idleSpeed: 0.05,
  },
]

/**
 * Finds the bounding poses and computes lerped transform targets.
 */
export function getInterpolatedPose(progress, teamMemberIdx = 0, principleIdx = 0, ctaHovered = false, scrubberProgress = 0) {
  const p = Math.max(0, Math.min(1, progress))
  
  // Find which segment p falls in
  let fromPose = EMBLEM_POSES[0]
  let toPose = EMBLEM_POSES[EMBLEM_POSES.length - 1]
  let segProgress = 0

  for (let i = 0; i < EMBLEM_POSES.length - 1; i++) {
    const cur = EMBLEM_POSES[i]
    const next = EMBLEM_POSES[i + 1]
    const midFrom = cur.scrollRange[0]
    const midTo = next.scrollRange[0]
    if (p >= midFrom && p <= midTo) {
      fromPose = cur
      toPose = next
      const span = midTo - midFrom
      segProgress = span > 0 ? (p - midFrom) / span : 0
      break
    }
  }

  // Smooth ease-in-out curve
  const t = segProgress < 0.5 
    ? 2 * segProgress * segProgress 
    : -1 + (4 - 2 * segProgress) * segProgress

  const lerp = (a, b, factor) => a + (b - a) * factor

  const targetPos = [
    lerp(fromPose.position[0], toPose.position[0], t),
    lerp(fromPose.position[1], toPose.position[1], t),
    lerp(fromPose.position[2], toPose.position[2], t),
  ]

  let targetRot = [
    lerp(fromPose.rotation[0], toPose.rotation[0], t),
    lerp(fromPose.rotation[1], toPose.rotation[1], t),
    lerp(fromPose.rotation[2], toPose.rotation[2], t),
  ]

  // Team: turn slightly toward currently selected member
  if (p >= 0.16 && p <= 0.38) {
    const memberTurnY = (teamMemberIdx - 1.5) * 0.12
    const memberTurnX = (teamMemberIdx - 1.5) * 0.04
    targetRot[1] += memberTurnY
    targetRot[0] += memberTurnX
  }

  // Story: slides along timeline rail and rotates edge-on tied to scrubber position
  if (p >= 0.38 && p <= 0.62) {
    targetPos[0] = (scrubberProgress - 0.5) * 2.8
    targetRot[1] = Math.PI / 2 + (scrubberProgress - 0.5) * 0.6
  }

  // Principles: turn by 90deg on Y axis for each active principle
  if (p >= 0.62 && p <= 0.82) {
    targetRot[1] = (principleIdx * Math.PI) / 2
  }

  const targetScale = lerp(fromPose.scale, toPose.scale, t)
  let targetRim = lerp(fromPose.rimBoost, toPose.rimBoost, t)

  // W6 Contact CTA hover/focus rim light boost
  if (ctaHovered && p > 0.88) {
    targetRim = Math.max(targetRim, 2.0)
  }

  return {
    pos: targetPos,
    rot: targetRot,
    scale: targetScale,
    rim: targetRim,
    activePoseName: p < 0.16 ? fromPose.name : (segProgress > 0.5 ? toPose.name : fromPose.name),
  }
}
