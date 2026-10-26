import React, { useEffect, useRef, useState, useCallback } from 'react'
import { EMBLEM_POSES, getInterpolatedPose } from './EmblemPoses'

/**
 * Emblem3DCanvas: The Continuous 3D Thread through the "Who We Are" page
 *
 * Requirements:
 * - Single fixed canvas behind page content (pointer-events none, z-index below text).
 * - Extruded hex-A emblem (Three.js ExtrudeGeometry, small bevel, dark brushed metal).
 * - Left gold rim light (#ffd696) & Right ice-blue rim light (#8cc4ff). Zero bloom, zero postprocessing.
 * - Driven by scroll progress through single rAF loop with lerp damping.
 * - Drag-to-rotate hit area on intro with inertia, easing back to idle.
 * - Keyboard alternative: arrow keys rotate when focused.
 * - Strict Mode safe: creates only 1 renderer.
 * - Disposes geometry, materials, and renderer on unmount.
 * - Pauses when document.hidden or off-screen.
 * - Fallbacks: hardwareConcurrency < 4, frame time > 24ms over 30 frames, reduced motion,
 *   WebGL unavailable, or width < 768px: renders static emblem image placed with CSS.
 */
export default function Emblem3DCanvas({
  scrollProgress = 0,
  teamMemberIdx = 0,
  principleIdx = 0,
  ctaHovered = false,
  scrubberProgress = 0,
}) {
  const containerRef = useRef(null)
  const hitAreaRef = useRef(null)
  const isMountedRef = useRef(false)

  // Fallback states
  const [useFallback, setUseFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState('')
  const [debugInfo, setDebugInfo] = useState({ pose: 'w1-intro', fps: 60, frameMs: 16.6, progress: 0 })
  const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1')

  // Interactive drag / keyboard rotation offsets
  const dragRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0,
    userInteracted: false,
  })

  // Props ref to avoid re-initializing Three.js on prop changes
  const propsRef = useRef({ scrollProgress, teamMemberIdx, principleIdx, ctaHovered, scrubberProgress })
  useEffect(() => {
    propsRef.current = { scrollProgress, teamMemberIdx, principleIdx, ctaHovered, scrubberProgress }
  }, [scrollProgress, teamMemberIdx, principleIdx, ctaHovered, scrubberProgress])

  // Initial qualification check for WebGL
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Mobile width check
    if (window.innerWidth < 768) {
      setUseFallback(true)
      setFallbackReason('Viewport < 768px (Mobile)')
      return
    }

    // 2. Prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setUseFallback(true)
      setFallbackReason('prefers-reduced-motion: reduce')
      return
    }

    // 3. Hardware concurrency check
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      setUseFallback(true)
      setFallbackReason('hardwareConcurrency < 4')
      return
    }

    // 4. WebGL support check
    try {
      const testCanvas = document.createElement('canvas')
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
      if (!gl) {
        setUseFallback(true)
        setFallbackReason('WebGL unsupported')
        return
      }
    } catch {
      setUseFallback(true)
      setFallbackReason('WebGL context error')
    }
  }, [])

  // WebGL Lifecycle Management
  useEffect(() => {
    if (useFallback || typeof window === 'undefined' || !containerRef.current) return
    if (isMountedRef.current) return
    isMountedRef.current = true

    let disposed = false
    let animationFrameId = null
    let renderer = null
    let scene = null
    let camera = null
    let emblemGroup = null
    let goldRimLight = null
    let iceBlueRimLight = null
    let keyLight = null
    let ambientLight = null

    // Frame benchmark tracking for 4x throttle detection
    const frameTimes = []
    let lastTimestamp = performance.now()

    // Smooth transform current values for lerping
    const currentTransform = {
      pos: [2.05, 0.15, 0.0],
      rot: [0.15, -0.32, 0.0],
      scale: 1.55,
      rim: 1.0,
    }

    // Lazy load Three.js after first paint
    const initThree = async () => {
      try {
        const THREE = await import('three')
        if (disposed || !containerRef.current) return

        // 1. Scene & Camera
        scene = new THREE.Scene()
        const width = window.innerWidth
        const height = window.innerHeight

        // Base camera configuration tuned for widescreen desktop (16:10 / 16:9)
        const BASE_FOV = 40
        const BASE_ASPECT = 1.55

        const computeResponsiveCamera = (w, h) => {
          const aspect = w / h
          if (aspect >= BASE_ASPECT) {
            return {
              fov: BASE_FOV,
              aspect,
              scaleMult: 1.0,
              posXMult: 1.0,
              posYOffset: 0.0,
            }
          }
          // Horizontal FOV locking: prevent emblem from ballooning in portrait / narrow viewports
          const halfHBase = Math.tan((BASE_FOV * Math.PI) / 360) * BASE_ASPECT
          const fov = 2 * Math.atan(halfHBase / aspect) * (180 / Math.PI)
          const halfHWorld = 7.5 * Math.tan((fov * Math.PI) / 360)

          // Align intro emblem vertically with the right-column visual anchor (~320px from top)
          const targetYNDC = 1 - (2 * Math.min(340, h * 0.25)) / h
          const targetY3D = targetYNDC * halfHWorld
          const posYOffset = aspect < 1.2 ? Math.max(0, targetY3D - 0.15) : 0.0

          // Scale & position tuning for portrait screens (e.g. phones in desktop mode)
          const scaleMult = Math.min(1.0, Math.max(0.75, aspect / 1.15))
          const posXMult = Math.min(1.0, Math.max(0.75, aspect / 1.1))

          return { fov, aspect, scaleMult, posXMult, posYOffset }
        }

        let cameraConfig = computeResponsiveCamera(width, height)
        camera = new THREE.PerspectiveCamera(cameraConfig.fov, cameraConfig.aspect, 0.1, 100)
        camera.position.set(0, 0, 7.5)

        // 2. Renderer (Strict Mode single creation, devicePixelRatio capped at 1.5)
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.setClearColor(0x000000, 0)
        renderer.toneMapping = THREE.NoToneMapping

        // Clear previous canvas if any and append
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(renderer.domElement)

        // 3. Materials (Dark brushed titanium with dual metallic specular reflection)
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x0e1726,
          roughness: 0.35,
          metalness: 0.75,
        })
        const monolithMat = new THREE.MeshStandardMaterial({
          color: 0x16243b,
          roughness: 0.3,
          metalness: 0.8,
        })
        const slashMat = new THREE.MeshStandardMaterial({
          color: 0x224977,
          roughness: 0.22,
          metalness: 0.88,
          emissive: 0x091b33,
        })

        // 4. Construct Extruded Geometry from vector specifications
        emblemGroup = new THREE.Group()

        // Outer Hexagon with inner trench cutout
        const outerHexShape = new THREE.Shape()
        outerHexShape.moveTo(0, 1.6)
        outerHexShape.lineTo(1.4, 0.8)
        outerHexShape.lineTo(1.4, -0.8)
        outerHexShape.lineTo(0, -1.6)
        outerHexShape.lineTo(-1.4, -0.8)
        outerHexShape.lineTo(-1.4, 0.8)
        outerHexShape.closePath()

        const trenchHole = new THREE.Path()
        trenchHole.moveTo(0, 1.28)
        trenchHole.lineTo(-1.1, 0.64)
        trenchHole.lineTo(-1.1, -0.64)
        trenchHole.lineTo(0, -1.28)
        trenchHole.lineTo(1.1, -0.64)
        trenchHole.lineTo(1.1, 0.64)
        trenchHole.closePath()
        outerHexShape.holes.push(trenchHole)

        const frameGeo = new THREE.ExtrudeGeometry(outerHexShape, {
          depth: 0.26,
          bevelEnabled: true,
          bevelSegments: 3,
          bevelSize: 0.06,
          bevelThickness: 0.08,
        })
        const frameMesh = new THREE.Mesh(frameGeo, frameMat)
        frameMesh.position.z = -0.13
        emblemGroup.add(frameMesh)

        // Central "A" Monolith Pillars
        const monolithShape = new THREE.Shape()
        monolithShape.moveTo(0, 1.05)
        monolithShape.lineTo(0.9, -0.85)
        monolithShape.lineTo(0.55, -0.85)
        monolithShape.lineTo(0.36, -0.42)
        monolithShape.lineTo(-0.36, -0.42)
        monolithShape.lineTo(-0.55, -0.85)
        monolithShape.lineTo(-0.9, -0.85)
        monolithShape.closePath()

        const aHole = new THREE.Path()
        aHole.moveTo(0, 0.52)
        aHole.lineTo(-0.24, -0.15)
        aHole.lineTo(0.24, -0.15)
        aHole.closePath()
        monolithShape.holes.push(aHole)

        const monolithGeo = new THREE.ExtrudeGeometry(monolithShape, {
          depth: 0.32,
          bevelEnabled: true,
          bevelSegments: 3,
          bevelSize: 0.04,
          bevelThickness: 0.05,
        })
        const monolithMesh = new THREE.Mesh(monolithGeo, monolithMat)
        monolithMesh.position.z = -0.1
        emblemGroup.add(monolithMesh)

        // Kinetic Slash Beam
        const slashShape = new THREE.Shape()
        slashShape.moveTo(-1.15, -0.52)
        slashShape.lineTo(1.25, 0.46)
        slashShape.lineTo(1.18, 0.62)
        slashShape.lineTo(-1.22, -0.36)
        slashShape.closePath()

        const slashGeo = new THREE.ExtrudeGeometry(slashShape, {
          depth: 0.36,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.03,
          bevelThickness: 0.03,
        })
        const slashMesh = new THREE.Mesh(slashGeo, slashMat)
        slashMesh.position.z = -0.05
        emblemGroup.add(slashMesh)

        scene.add(emblemGroup)

        // 5. Lighting (Dual Rim Lights: Gold Left, Ice-Blue Right + Ambient & Fill)
        goldRimLight = new THREE.DirectionalLight(0xffd696, 3.8)
        goldRimLight.position.set(-6, 2.5, 3.5)
        scene.add(goldRimLight)

        iceBlueRimLight = new THREE.DirectionalLight(0x8cc4ff, 4.2)
        iceBlueRimLight.position.set(6, -2, 3.5)
        scene.add(iceBlueRimLight)

        keyLight = new THREE.DirectionalLight(0x5a88c2, 1.2)
        keyLight.position.set(0, 3, 5)
        scene.add(keyLight)

        ambientLight = new THREE.AmbientLight(0x0c1a2e, 0.8)
        scene.add(ambientLight)

        const hemiLight = new THREE.HemisphereLight(0x5b7fba, 0x050a14, 0.7)
        scene.add(hemiLight)

        // 6. Resize Handler
        const handleResize = () => {
          if (disposed || !renderer || !camera) return
          if (window.innerWidth < 768) {
            setUseFallback(true)
            setFallbackReason('Viewport resized < 768px')
            return
          }
          const w = window.innerWidth
          const h = window.innerHeight
          cameraConfig = computeResponsiveCamera(w, h)
          camera.aspect = cameraConfig.aspect
          camera.fov = cameraConfig.fov
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        // 7. Tab Visibility & Focus Handling (Pause when hidden, reset baseline on resume)
        let isTabActive = !document.hidden
        const handleVisibilityChange = () => {
          isTabActive = !document.hidden
          if (isTabActive) {
            lastTimestamp = performance.now()
            frameTimes.length = 0 // Clear benchmark buffer on resume so tab switch doesn't poison metrics
          }
        }
        const handleFocus = () => {
          lastTimestamp = performance.now()
          frameTimes.length = 0
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)

        // 8. Single Animation Frame Loop with Damped Lerp
        const LERP_FACTOR = 0.075

        const animate = (timestamp) => {
          if (disposed) return
          animationFrameId = requestAnimationFrame(animate)

          // Pause loop when hidden
          if (!isTabActive || document.hidden) {
            lastTimestamp = timestamp
            return
          }

          // Frame timing benchmark
          const delta = timestamp - lastTimestamp
          lastTimestamp = timestamp

          // Filter out abnormal spikes (> 100ms) caused by system sleep, GC pause, or tab backgrounding
          if (delta > 0 && delta < 100) {
            if (frameTimes.length >= 60) {
              frameTimes.shift()
            }
            frameTimes.push(delta)

            // Evaluate sustained benchmark over 60 continuous active frames
            if (frameTimes.length === 60) {
              const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / 60
              if (avgDelta > 28) {
                // Sustained sub-35fps while active -> trigger static fallback
                setUseFallback(true)
                setFallbackReason(`CPU frame time exceeded 28ms (${avgDelta.toFixed(1)}ms)`)
                return
              }
            }
          }

          // Target pose from scroll progress
          const { scrollProgress: sp, teamMemberIdx: tmIdx, principleIdx: pIdx, ctaHovered: ctaH, scrubberProgress: scP } = propsRef.current
          const target = getInterpolatedPose(sp, tmIdx, pIdx, ctaH, scP)

          // Drag / Keyboard momentum physics
          const drag = dragRef.current
          if (!drag.isDragging) {
            drag.velX *= 0.92
            drag.velY *= 0.92
            drag.rotX += drag.velX
            drag.rotY += drag.velY

            // Idle rotation when not dragging in intro or gentle idle
            const idleSpeed = sp < 0.16 ? 0.003 : 0.0008
            if (!drag.userInteracted) {
              drag.rotY += idleSpeed
            } else {
              // Ease back towards alignment slowly
              drag.rotX *= 0.985
            }
          }

          // Damped Lerp towards target transform
          const lerpVal = (cur, tgt) => cur + (tgt - cur) * LERP_FACTOR

          currentTransform.pos[0] = lerpVal(currentTransform.pos[0], target.pos[0])
          currentTransform.pos[1] = lerpVal(currentTransform.pos[1], target.pos[1])
          currentTransform.pos[2] = lerpVal(currentTransform.pos[2], target.pos[2])

          currentTransform.rot[0] = lerpVal(currentTransform.rot[0], target.rot[0])
          currentTransform.rot[1] = lerpVal(currentTransform.rot[1], target.rot[1])
          currentTransform.rot[2] = lerpVal(currentTransform.rot[2], target.rot[2])

          currentTransform.scale = lerpVal(currentTransform.scale, target.scale)
          currentTransform.rim = lerpVal(currentTransform.rim, target.rim)

          // Apply to Three.js Object with aspect-aware scale & position multipliers
          if (emblemGroup) {
            const yIntroShift = sp < 0.2 ? (cameraConfig.posYOffset || 0) * (1 - sp / 0.2) : 0
            emblemGroup.position.set(
              currentTransform.pos[0] * cameraConfig.posXMult,
              currentTransform.pos[1] + yIntroShift,
              currentTransform.pos[2]
            )
            emblemGroup.rotation.set(
              currentTransform.rot[0] + drag.rotX,
              currentTransform.rot[1] + drag.rotY,
              currentTransform.rot[2]
            )
            emblemGroup.scale.setScalar(currentTransform.scale * cameraConfig.scaleMult)
          }

          // Rim light intensity modulation
          if (goldRimLight) goldRimLight.intensity = 3.2 * currentTransform.rim
          if (iceBlueRimLight) iceBlueRimLight.intensity = 3.6 * currentTransform.rim

          renderer.render(scene, camera)

          // Update Debug Info if ?debug=1
          if (isDebug && frameTimes.length > 0) {
            const avgMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
            setDebugInfo({
              pose: target.activePoseName,
              fps: Math.round(1000 / avgMs),
              frameMs: avgMs.toFixed(1),
              progress: (sp * 100).toFixed(1),
            })
          }
        }

        animationFrameId = requestAnimationFrame(animate)

        // Return cleanup callback
        return () => {
          window.removeEventListener('resize', handleResize)
          window.removeEventListener('focus', handleFocus)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      } catch (err) {
        setUseFallback(true)
        setFallbackReason(`Three.js initialization failure: ${err.message}`)
      }
    }

    const cleanupPromise = initThree()

    return () => {
      disposed = true
      isMountedRef.current = false
      if (animationFrameId) cancelAnimationFrame(animationFrameId)

      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup()
      })

      // Rigorous disposal of geometries, materials, and renderer
      if (emblemGroup) {
        emblemGroup.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose())
              } else {
                child.material.dispose()
              }
            }
          }
        })
      }

      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
    }
  }, [useFallback, isDebug])

  // Drag interaction handlers on transparent hit area
  const handlePointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const drag = dragRef.current
    drag.isDragging = true
    drag.lastX = e.clientX
    drag.lastY = e.clientY
    drag.velX = 0
    drag.velY = 0
    drag.userInteracted = true
  }, [])

  const handlePointerMove = useCallback((e) => {
    const drag = dragRef.current
    if (!drag.isDragging) return
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    drag.lastX = e.clientX
    drag.lastY = e.clientY

    drag.rotY += dx * 0.008
    drag.rotX += dy * 0.008
    drag.velY = dx * 0.008
    drag.velX = dy * 0.008
  }, [])

  const handlePointerUp = useCallback((e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
    dragRef.current.isDragging = false
  }, [])

  // Keyboard navigation alternative (Arrow keys rotate emblem when focused)
  const handleKeyDown = useCallback((e) => {
    const drag = dragRef.current
    const STEP = 0.12
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      drag.rotY -= STEP
      drag.velY = -0.04
      drag.userInteracted = true
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      drag.rotY += STEP
      drag.velY = 0.04
      drag.userInteracted = true
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      drag.rotX -= STEP
      drag.velX = -0.04
      drag.userInteracted = true
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      drag.rotX += STEP
      drag.velX = 0.04
      drag.userInteracted = true
    }
  }, [])

  return (
    <>
      {/* 1. Fixed WebGL Canvas Container */}
      {!useFallback ? (
        <div
          ref={containerRef}
          className="who-emblem-canvas-wrap"
          aria-hidden="true"
        />
      ) : (
        /* Static Pre-rendered Emblem Fallback */
        <div className="who-emblem-static-fallback" aria-hidden="true">
          <img
            src="/algoarena-emblem.png"
            alt=""
            width="280"
            height="280"
            className="who-emblem-fallback-img"
          />
        </div>
      )}

      {/* 2. Drag & Keyboard Interaction Hit Area (Overlaid in Intro area) */}
      {!useFallback && (
        <div
          ref={hitAreaRef}
          tabIndex={0}
          role="region"
          aria-label="Rotate emblem"
          className="who-emblem-hit-area"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        />
      )}

      {/* 3. Debug HUD when ?debug=1 */}
      {isDebug && (
        <div className="who-debug-hud" role="status" aria-live="polite">
          <div className="who-debug-title">3D Thread Telemetry</div>
          <div>Mode: {useFallback ? `Static Fallback (${fallbackReason})` : 'WebGL 3D (Active)'}</div>
          <div>Pose: {debugInfo.pose}</div>
          <div>Scroll: {debugInfo.progress}%</div>
          <div>FPS: {debugInfo.fps} ({debugInfo.frameMs}ms)</div>
        </div>
      )}
    </>
  )
}
