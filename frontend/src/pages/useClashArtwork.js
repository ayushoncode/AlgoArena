/**
 * The Clash: Canvas Background Artwork Engine
 * Real-time 1v1 coding duel background for AlgoArena
 * 10.04s continuous periodic loop:
 * - Gold strands from top corners, Blue strands from bottom corners
 * - Converging at dead centre white flare
 * - Short light streaks with additive blending
 * - Monospace glyphs riding strands
 * - 5s verdict pulse expanding rings
 * - Navy volumetric clouds
 * - DPR capped at 1.75, adaptive throttling, zero per-frame allocations
 */

export function initClashArtwork(canvas) {
  if (!canvas) return () => {}

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return () => {}

  let animationFrameId = null
  let isRunning = true
  let isReducedMotion = false

  // Check reduced motion live
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isReducedMotion = motionQuery.matches
  const handleMotionChange = (e) => {
    isReducedMotion = e.matches
    if (isReducedMotion) {
      drawStaticFrame()
    } else if (!animationFrameId) {
      lastFrameTime = performance.now()
      animationFrameId = requestAnimationFrame(renderLoop)
    }
  }
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener('change', handleMotionChange)
  } else if (motionQuery.addListener) {
    motionQuery.addListener(handleMotionChange)
  }

  // Preallocated config & state
  let width = 0
  let height = 0
  let dpr = 1
  let cx = 0
  let cy = 0

  // Device capability check
  const isLowPower = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4)
  let maxStreaks = 400
  let renderGlyphs = true

  // Performance tracking for adaptive quality
  const frameTimes = new Float32Array(30)
  let frameTimeIdx = 0
  let frameTimeSum = 0
  let lastFrameTime = performance.now()
  let isThrottled = false

  // Monospace code glyphs
  const GLYPHS = ['{', '}', '(', ')', '<', '>', '/', '=', ';', '+', '0', '1', '*', ':', '!']

  // Seeded Pseudo-Random Number Generator (Mulberry32) for reproducible artistic composition
  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  // Generate 24 hand-composed strands (6 per corner)
  // Corner 0: Top-Left (Gold)
  // Corner 1: Top-Right (Gold)
  // Corner 2: Bottom-Left (Blue)
  // Corner 3: Bottom-Right (Blue)
  const STRAND_COUNT = 24
  const strands = []
  const SAMPLES_PER_STRAND = 60

  function buildStrandGeometry() {
    strands.length = 0
    const rng = mulberry32(1337)

    for (let i = 0; i < STRAND_COUNT; i++) {
      const corner = Math.floor(i / 6) // 0..3
      const isGold = corner < 2

      // Start point at or slightly outside corner
      let x0 = 0, y0 = 0
      let cp1x = 0, cp1y = 0
      let cp2x = 0, cp2y = 0

      const spreadX = (rng() - 0.5) * width * 0.25
      const spreadY = (rng() - 0.5) * height * 0.25

      if (corner === 0) { // Top-Left
        x0 = -width * 0.05 + spreadX
        y0 = -height * 0.05 + spreadY
        cp1x = width * (0.15 + rng() * 0.15)
        cp1y = height * (0.05 + rng() * 0.2)
        cp2x = width * (0.35 + rng() * 0.1)
        cp2y = height * (0.3 + rng() * 0.15)
      } else if (corner === 1) { // Top-Right
        x0 = width * 1.05 + spreadX
        y0 = -height * 0.05 + spreadY
        cp1x = width * (0.85 - rng() * 0.15)
        cp1y = height * (0.05 + rng() * 0.2)
        cp2x = width * (0.65 - rng() * 0.1)
        cp2y = height * (0.3 + rng() * 0.15)
      } else if (corner === 2) { // Bottom-Left
        x0 = -width * 0.05 + spreadX
        y0 = height * 1.05 + spreadY
        cp1x = width * (0.15 + rng() * 0.15)
        cp1y = height * (0.95 - rng() * 0.2)
        cp2x = width * (0.35 + rng() * 0.1)
        cp2y = height * (0.7 - rng() * 0.15)
      } else { // Bottom-Right
        x0 = width * 1.05 + spreadX
        y0 = height * 1.05 + spreadY
        cp1x = width * (0.85 - rng() * 0.15)
        cp1y = height * (0.95 - rng() * 0.2)
        cp2x = width * (0.65 - rng() * 0.1)
        cp2y = height * (0.7 - rng() * 0.15)
      }

      // Precompute sample points along cubic Bezier for constant-speed parameterization
      const samples = new Float32Array(SAMPLES_PER_STRAND * 2)
      for (let s = 0; s < SAMPLES_PER_STRAND; s++) {
        const t = s / (SAMPLES_PER_STRAND - 1)
        const mt = 1 - t
        const mt2 = mt * mt
        const mt3 = mt2 * mt
        const t2 = t * t
        const t3 = t2 * t

        const px = mt3 * x0 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * cx
        const py = mt3 * y0 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * cy

        samples[s * 2] = px
        samples[s * 2 + 1] = py
      }

      strands.push({
        corner,
        isGold,
        x0, y0, cp1x, cp1y, cp2x, cp2y,
        samples,
        alpha: 0.12 + rng() * 0.14,
        cycles: 1 + Math.floor(rng() * 3), // Integer cycle counts for continuous loop
        speedMult: 0.8 + rng() * 0.4
      })
    }
  }

  // Preallocate streaks
  const streaks = []
  function initStreaks() {
    streaks.length = 0
    const rng = mulberry32(42)
    const count = isLowPower ? Math.floor(maxStreaks * 0.5) : maxStreaks

    for (let i = 0; i < count; i++) {
      const strandIdx = Math.floor(rng() * STRAND_COUNT)
      const strand = strands[strandIdx]
      const isGlyph = rng() < 0.09 // roughly 1 glyph per 11 streaks

      streaks.push({
        strandIdx,
        strand,
        baseOffset: rng(), // phase offset 0..1
        length: 0.03 + rng() * 0.05, // length along strand (fraction)
        isGold: strand.isGold,
        speed: strand.speedMult * (1 + (rng() - 0.5) * 0.2),
        isGlyph,
        glyphChar: GLYPHS[Math.floor(rng() * GLYPHS.length)],
        glyphSize: 9 + Math.floor(rng() * 3),
        brightness: 0.4 + rng() * 0.5
      })
    }
  }

  // Precomputed volumetric cloud gradient positions
  const clouds = [
    { xRatio: 0.25, yRatio: 0.72, rRatio: 0.45, speedX: 0.015, speedY: 0.008, phaseShift: 0 },
    { xRatio: 0.75, yRatio: 0.80, rRatio: 0.50, speedX: -0.012, speedY: 0.006, phaseShift: 0.33 },
    { xRatio: 0.50, yRatio: 0.88, rRatio: 0.60, speedX: 0.008, speedY: -0.005, phaseShift: 0.66 }
  ]

  function resize() {
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, Math.floor(rect.width))
    height = Math.max(1, Math.floor(rect.height))
    dpr = Math.min(window.devicePixelRatio || 1, 1.75)

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    cx = width * 0.5
    cy = height * 0.5

    // Scale particle count based on area
    const area = width * height
    const desktopArea = 1536 * 1024
    const scale = Math.min(1.2, Math.max(0.4, area / desktopArea))
    maxStreaks = Math.floor((width < 600 ? 280 : 700) * (isLowPower ? 0.5 : 1) * scale)

    buildStrandGeometry()
    initStreaks()

    if (isReducedMotion) {
      drawStaticFrame()
    }
  }

  // ResizeObserver for responsive adaptation
  const ro = new ResizeObserver(() => {
    resize()
  })
  ro.observe(canvas)

  // Fast Bezier sample lookup with linear interpolation
  function getPointOnStrand(strand, t) {
    const clampedT = Math.max(0, Math.min(0.9999, t))
    const indexFloat = clampedT * (SAMPLES_PER_STRAND - 1)
    const idx0 = Math.floor(indexFloat)
    const idx1 = Math.min(SAMPLES_PER_STRAND - 1, idx0 + 1)
    const frac = indexFloat - idx0

    const x0 = strand.samples[idx0 * 2]
    const y0 = strand.samples[idx0 * 2 + 1]
    const x1 = strand.samples[idx1 * 2]
    const y1 = strand.samples[idx1 * 2 + 1]

    return [x0 + (x1 - x0) * frac, y0 + (y1 - y0) * frac]
  }

  // Draw full frame at given loop phase
  function drawFrame(phase) {
    ctx.save()
    ctx.scale(dpr, dpr)

    // Very slow camera push-in: 1.0 to 1.03 periodic
    const pushIn = 1 + 0.03 * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase))
    ctx.translate(cx, cy)
    ctx.scale(pushIn, pushIn)
    ctx.translate(-cx, -cy)

    // 1. Deep navy space background
    const bgGrad = ctx.createRadialGradient(cx, cy * 0.8, 10, cx, cy, Math.max(width, height) * 0.85)
    bgGrad.addColorStop(0, '#0a1a38')
    bgGrad.addColorStop(0.45, '#040d1e')
    bgGrad.addColorStop(1, '#02060f')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, width, height)

    // 2. Rolling volumetric navy clouds in the lower half
    for (let c = 0; c < clouds.length; c++) {
      const cl = clouds[c]
      const driftPhase = (phase + cl.phaseShift) % 1
      const driftX = Math.sin(driftPhase * Math.PI * 2) * width * 0.04
      const driftY = Math.cos(driftPhase * Math.PI * 2) * height * 0.02
      const clX = width * cl.xRatio + driftX
      const clY = height * cl.yRatio + driftY
      const clR = width * cl.rRatio

      const cloudGrad = ctx.createRadialGradient(clX, clY, 0, clX, clY, clR)
      cloudGrad.addColorStop(0, 'rgba(10, 28, 62, 0.22)')
      cloudGrad.addColorStop(0.5, 'rgba(6, 18, 42, 0.12)')
      cloudGrad.addColorStop(1, 'rgba(2, 6, 15, 0)')

      ctx.fillStyle = cloudGrad
      ctx.beginPath()
      ctx.arc(clX, clY, clR, 0, Math.PI * 2)
      ctx.fill()
    }

    // 3. Draw Hairline Guide Strands (Hairline cubic Beziers)
    ctx.lineWidth = 1
    for (let i = 0; i < strands.length; i++) {
      const st = strands[i]
      ctx.strokeStyle = st.isGold
        ? `rgba(255, 214, 150, ${st.alpha * 0.4})`
        : `rgba(140, 196, 255, ${st.alpha * 0.4})`

      ctx.beginPath()
      ctx.moveTo(st.x0, st.y0)
      ctx.bezierCurveTo(st.cp1x, st.cp1y, st.cp2x, st.cp2y, cx, cy)
      ctx.stroke()
    }

    // 4. Draw Traveling Light Streaks (Additive Blending)
    ctx.globalCompositeOperation = 'lighter'

    // Flare bloom: peaks around phase 0.88 - 0.94 then settles back
    const bloomDist = Math.abs(phase - 0.90)
    const bloomFactor = Math.max(0, 1 - bloomDist / 0.10)
    const bloomEase = bloomFactor * bloomFactor

    const activeCount = isThrottled ? Math.floor(streaks.length * 0.5) : streaks.length
    for (let i = 0; i < activeCount; i++) {
      const stk = streaks[i]
      // Periodic travel along strand: 0 (corner) -> 1 (center)
      const travel = (phase * stk.strand.cycles * stk.speed + stk.baseOffset) % 1
      if (travel < 0.01) continue

      const headT = travel
      const tailT = Math.max(0, travel - stk.length)

      const [hx, hy] = getPointOnStrand(stk.strand, headT)
      const [tx, ty] = getPointOnStrand(stk.strand, tailT)

      // Fade out near center before entering the white flare
      const centerProximity = 1 - Math.min(1, Math.hypot(hx - cx, hy - cy) / (width * 0.08))
      const fadeOut = Math.max(0, 1 - centerProximity * 1.5)
      const alpha = stk.brightness * (0.3 + travel * 0.6) * fadeOut

      if (alpha <= 0.01) continue

      const grad = ctx.createLinearGradient(tx, ty, hx, hy)
      if (stk.isGold) {
        grad.addColorStop(0, 'rgba(255, 214, 150, 0)')
        grad.addColorStop(1, `rgba(255, 226, 178, ${alpha})`)
      } else {
        grad.addColorStop(0, 'rgba(140, 196, 255, 0)')
        grad.addColorStop(1, `rgba(180, 220, 255, ${alpha})`)
      }

      ctx.strokeStyle = grad
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(hx, hy)
      ctx.stroke()

      // Sparse code glyph riding the streak
      if (renderGlyphs && !isThrottled && stk.isGlyph && fadeOut > 0.4 && travel > 0.25 && travel < 0.78) {
        ctx.font = `${stk.glyphSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
        ctx.fillStyle = stk.isGold
          ? `rgba(255, 230, 190, ${alpha * 0.42})`
          : `rgba(180, 220, 255, ${alpha * 0.42})`
        ctx.fillText(stk.glyphChar, hx + 3, hy - 3)
      }
    }

    // 5. Verdict Pulse: Thin ring expands from centre every ~5 seconds (twice per 10.04s loop)
    const pulsePhase1 = (phase * 2) % 1 // 0..1 every 5.02s
    if (pulsePhase1 > 0.01) {
      const pulseRadius = pulsePhase1 * Math.min(width, height) * 0.65
      const pulseAlpha = Math.sin(pulsePhase1 * Math.PI) * 0.32 * (1 - pulsePhase1)
      if (pulseAlpha > 0.005) {
        ctx.strokeStyle = `rgba(220, 238, 255, ${pulseAlpha})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // 6. Centre Verdict Flare (White-hot point, brightest region in canvas)
    const baseFlareR = Math.max(12, Math.min(width, height) * 0.04)
    const flareR = baseFlareR * (1 + bloomEase * 0.7)
    const coreFlareR = Math.max(3, baseFlareR * 0.22 * (1 + bloomEase * 0.5))

    // Wide atmospheric glow
    const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flareR * 3.5)
    outerGrad.addColorStop(0, `rgba(255, 248, 230, ${0.45 + bloomEase * 0.35})`)
    outerGrad.addColorStop(0.25, `rgba(210, 235, 255, ${0.20 + bloomEase * 0.2})`)
    outerGrad.addColorStop(0.65, `rgba(140, 190, 255, ${0.05 + bloomEase * 0.1})`)
    outerGrad.addColorStop(1, 'rgba(10, 24, 50, 0)')
    ctx.fillStyle = outerGrad
    ctx.beginPath()
    ctx.arc(cx, cy, flareR * 3.5, 0, Math.PI * 2)
    ctx.fill()

    // Inner hot core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreFlareR * 2)
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    coreGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.9)')
    coreGrad.addColorStop(0.7, `rgba(255, 240, 210, ${0.6 + bloomEase * 0.3})`)
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.arc(cx, cy, coreFlareR * 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Draw static frame for reduced motion
  function drawStaticFrame() {
    drawFrame(0.42)
  }

  // Render loop
  function renderLoop(now) {
    if (!isRunning) return

    // Calculate frame delta and track FPS for adaptive quality
    const delta = now - lastFrameTime
    lastFrameTime = now

    frameTimeSum -= frameTimes[frameTimeIdx]
    frameTimes[frameTimeIdx] = delta
    frameTimeSum += delta
    frameTimeIdx = (frameTimeIdx + 1) % 30

    // Adaptive quality check over 30 frames
    const avgFrameTime = frameTimeSum / 30
    if (avgFrameTime > 24 && !isThrottled) {
      isThrottled = true
      renderGlyphs = false
    } else if (avgFrameTime < 18 && isThrottled) {
      isThrottled = false
      renderGlyphs = true
    }

    // 10.04s continuous periodic loop: phase in [0, 1)
    const phase = (now % 10040) / 10040

    drawFrame(phase)

    animationFrameId = requestAnimationFrame(renderLoop)
  }

  // Page visibility listener: pause when tab hidden
  const handleVisibility = () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    } else {
      if (!isReducedMotion && isRunning && !animationFrameId) {
        lastFrameTime = performance.now()
        animationFrameId = requestAnimationFrame(renderLoop)
      }
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)

  // Initial draw and start
  resize()
  if (isReducedMotion) {
    drawStaticFrame()
  } else {
    lastFrameTime = performance.now()
    animationFrameId = requestAnimationFrame(renderLoop)
  }

  // Teardown / Cleanup
  return () => {
    isRunning = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    document.removeEventListener('visibilitychange', handleVisibility)
    if (motionQuery.removeEventListener) {
      motionQuery.removeEventListener('change', handleMotionChange)
    } else if (motionQuery.removeListener) {
      motionQuery.removeListener(handleMotionChange)
    }
    ro.disconnect()
  }
}
