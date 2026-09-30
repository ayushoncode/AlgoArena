import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════
   1. ARENA CORE (Central Floating Hex Emblem)
═══════════════════════════════════════════════════ */
function ArenaCore({ isHovered, scrollProgress }) {
  const outerRef = useRef()
  const innerRef = useRef()
  const groupRef = useRef()

  // Materials with disposal tracking
  const outerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#E11D48',
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  }), [])

  const innerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#38BDF8',
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  }), [])

  const coreGlowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#F5B942',
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  }), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.25
      outerRef.current.rotation.z = Math.sin(t * 0.15) * 0.1
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.4
      innerRef.current.rotation.x = Math.cos(t * 0.2) * 0.15
    }
    if (groupRef.current) {
      // Gentle Y floating
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.2
      // Scroll effect: scale up & fade out
      const targetScale = 1 + scrollProgress * 1.5
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.1))

      // Update opacity on scroll
      const fadeOpacity = Math.max(0, 0.35 * (1 - scrollProgress * 1.2))
      outerMat.opacity = isHovered ? fadeOpacity * 1.3 : fadeOpacity
      innerMat.opacity = isHovered ? fadeOpacity * 1.4 : fadeOpacity * 1.2
    }
  })

  // Clean up materials on unmount
  useEffect(() => {
    return () => {
      outerMat.dispose()
      innerMat.dispose()
      coreGlowMat.dispose()
    }
  }, [outerMat, innerMat, coreGlowMat])

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Outer Hexagonal Prism / Cylinder */}
      <mesh ref={outerRef} material={outerMat}>
        <cylinderGeometry args={[2.2, 2.2, 0.8, 6, 2, true]} />
      </mesh>

      {/* Inner Counter-Rotating Hex Ring */}
      <mesh ref={innerRef} material={innerMat}>
        <cylinderGeometry args={[1.4, 1.4, 0.5, 6, 1, true]} />
      </mesh>

      {/* Center Torus Knot Emblem Accent */}
      <mesh material={coreGlowMat} rotation={[Math.PI / 4, 0, 0]}>
        <torusKnotGeometry args={[0.7, 0.15, 64, 6]} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════
   2. ENERGY STREAMS & COLLISION LIGHT
═══════════════════════════════════════════════════ */
function EnergyStreams({ count, isHovered }) {
  const pointsRedRef = useRef()
  const pointsBlueRef = useRef()
  const collisionLightRef = useRef()

  // Generate initial particle data
  const { redData, blueData } = useMemo(() => {
    const rPos = new Float32Array(count * 3)
    const rVel = new Float32Array(count * 3)

    const bPos = new Float32Array(count * 3)
    const bVel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Red particles (Left -> Center)
      rPos[i * 3] = -14 + Math.random() * 6
      rPos[i * 3 + 1] = (Math.random() - 0.5) * 5
      rPos[i * 3 + 2] = (Math.random() - 0.5) * 4
      rVel[i * 3] = 0.06 + Math.random() * 0.08
      rVel[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      rVel[i * 3 + 2] = (Math.random() - 0.5) * 0.02

      // Blue particles (Right -> Center)
      bPos[i * 3] = 14 - Math.random() * 6
      bPos[i * 3 + 1] = (Math.random() - 0.5) * 5
      bPos[i * 3 + 2] = (Math.random() - 0.5) * 4
      bVel[i * 3] = -(0.06 + Math.random() * 0.08)
      bVel[i * 3 + 1] = (Math.random() - 0.5) * 0.02
      bVel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }

    return {
      redData: { pos: rPos, vel: rVel },
      blueData: { pos: bPos, vel: bVel },
    }
  }, [count])

  // Custom Particle Texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame((state) => {
    const speedMult = isHovered ? 1.6 : 1.0
    const time = state.clock.getElapsedTime()

    // Update Red Stream
    if (pointsRedRef.current) {
      const pos = pointsRedRef.current.geometry.attributes.position.array
      const { vel } = redData

      for (let i = 0; i < count; i++) {
        const idx = i * 3
        pos[idx] += vel[idx] * speedMult
        pos[idx + 1] += Math.sin(time * 2 + pos[idx]) * 0.015 + vel[idx + 1]
        pos[idx + 2] += Math.cos(time * 2 + pos[idx]) * 0.015 + vel[idx + 2]

        // Collision at center -> reset back to left edge
        if (pos[idx] >= 0) {
          pos[idx] = -14 - Math.random() * 4
          pos[idx + 1] = (Math.random() - 0.5) * 5
          pos[idx + 2] = (Math.random() - 0.5) * 4
        }
      }
      pointsRedRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Update Blue Stream
    if (pointsBlueRef.current) {
      const pos = pointsBlueRef.current.geometry.attributes.position.array
      const { vel } = blueData

      for (let i = 0; i < count; i++) {
        const idx = i * 3
        pos[idx] += vel[idx] * speedMult
        pos[idx + 1] += Math.sin(time * 2 + pos[idx]) * 0.015 + vel[idx + 1]
        pos[idx + 2] += Math.cos(time * 2 + pos[idx]) * 0.015 + vel[idx + 2]

        // Collision at center -> reset back to right edge
        if (pos[idx] <= 0) {
          pos[idx] = 14 + Math.random() * 4
          pos[idx + 1] = (Math.random() - 0.5) * 5
          pos[idx + 2] = (Math.random() - 0.5) * 4
        }
      }
      pointsBlueRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Collision point light pulse
    if (collisionLightRef.current) {
      const pulse = Math.sin(time * 5) * 0.5 + 1.5
      collisionLightRef.current.intensity = isHovered ? pulse * 2.2 : pulse * 1.4
      // Alternate color between red and blue
      const tCol = (Math.sin(time * 3) + 1) / 2
      collisionLightRef.current.color.setHSL(tCol > 0.5 ? 0.96 : 0.55, 0.9, 0.6)
    }
  })

  useEffect(() => {
    return () => {
      particleTexture.dispose()
    }
  }, [particleTexture])

  return (
    <group>
      {/* Collision Point Light */}
      <pointLight ref={collisionLightRef} position={[0, 0, 0]} distance={12} decay={2} />

      {/* Red Stream */}
      <points ref={pointsRedRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[redData.pos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#E11D48"
          map={particleTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.2}
        />
      </points>

      {/* Blue Stream */}
      <points ref={pointsBlueRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[blueData.pos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#38BDF8"
          map={particleTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.2}
        />
      </points>
    </group>
  )
}

/* ═══════════════════════════════════════════════════
   3. GRID FLOOR (Perspective Infinite Grid)
═══════════════════════════════════════════════════ */
function GridFloor() {
  const meshRef = useRef()
  const matRef = useRef()

  const gridShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#38BDF8') },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec3 vWorldPos;
      void main() {
        vec2 coord = vWorldPos.xz;
        coord.y -= uTime * 1.8; // Grid scrolling velocity
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        float line = min(grid.x, grid.y);
        float c = 1.0 - min(line, 1.0);
        
        // Distance fog fadeout
        float dist = length(vWorldPos.xz);
        float alpha = c * smoothstep(28.0, 4.0, dist) * 0.28;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  }), [])

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50, 60, 60]} />
      <shaderMaterial
        ref={matRef}
        args={[gridShader]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════
   4. AMBIENT DUST (Floating Gold Sparks)
═══════════════════════════════════════════════════ */
function AmbientDust({ count }) {
  const pointsRef = useRef()

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
      vel[i * 3] = (Math.random() - 0.5) * 0.005
      vel[i * 3 + 1] = 0.003 + Math.random() * 0.008
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.005
    }
    return { positions: pos, velocities: vel }
  }, [count])

  useFrame(() => {
    if (pointsRef.current) {
      const pos = pointsRef.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const idx = i * 3
        pos[idx] += velocities[idx]
        pos[idx + 1] += velocities[idx + 1]
        pos[idx + 2] += velocities[idx + 2]

        if (pos[idx + 1] > 5) {
          pos[idx + 1] = -5
          pos[idx] = (Math.random() - 0.5) * 20
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#F5B942"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ═══════════════════════════════════════════════════
   5. CAMERA PARALLAX RIG
═══════════════════════════════════════════════════ */
function CameraRig({ mousePos }) {
  useFrame((state) => {
    const targetX = mousePos.current.x * -0.5
    const targetY = mousePos.current.y * 0.4
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

/* ═══════════════════════════════════════════════════
   MAIN 3D CANVAS SCENE
═══════════════════════════════════════════════════ */
export default function HeroScene3D({ isHovered = false }) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isLowPower, setIsLowPower] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [webGLSupported, setWebGLSupported] = useState(true)

  const mousePos = useRef({ x: 0, y: 0 })

  // Hardware and Preference Detection
  useEffect(() => {
    // Check low power / mobile
    const lowPower =
      (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
      window.innerWidth < 768
    setIsLowPower(lowPower)

    // Check reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)
    const handleMotionChange = (e) => setReducedMotion(e.matches)
    motionQuery.addEventListener('change', handleMotionChange)

    // WebGL support check
    try {
      const canvas = document.createElement('canvas')
      const hasWebGL = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
      setWebGLSupported(hasWebGL)
    } catch (e) {
      setWebGLSupported(false)
    }

    // Mouse listener for parallax
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }

    // Scroll tracking
    const handleScroll = () => {
      const scrolled = window.scrollY
      const heroHeight = window.innerHeight
      const progress = Math.min(Math.max(scrolled / heroHeight, 0), 1)
      setScrollProgress(progress)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // If reduced motion or no WebGL, fall back gracefully
  if (reducedMotion || !webGLSupported) {
    return null
  }

  const streamParticleCount = isLowPower ? 120 : 250
  const dustParticleCount = isLowPower ? 50 : 80

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={['#05070F']} />
        <fog attach="fog" args={['#05070F', 6, 26]} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.6} color="#38BDF8" />

        {/* Parallax Rig */}
        <CameraRig mousePos={mousePos} />

        {/* 3D Scene Elements */}
        <ArenaCore isHovered={isHovered} scrollProgress={scrollProgress} />
        <EnergyStreams count={streamParticleCount} isHovered={isHovered} />
        <GridFloor />
        <AmbientDust count={dustParticleCount} />

        {/* Postprocessing Effects */}
        <EffectComposer disableNormalPass>
          <Bloom
            intensity={isHovered ? 1.3 : 0.85}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.8}
            height={300}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.85} />
          <ChromaticAberration offset={isHovered ? [0.0015, 0.0015] : [0.0006, 0.0006]} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
