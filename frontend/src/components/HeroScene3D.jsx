/**
 * HeroScene3D — Red (Left) vs Blue (Right) Dual Energy + 3D Cyber Floor
 *
 * Effect:
 *  - Left Flank: Crimson Red (#E11D48) energy particles streaming inwards
 *  - Right Flank: Electric Blue (#38BDF8) energy particles streaming inwards
 *  - Bottom: Perspective Scrolling 3D Cyber Grid Floor
 *  - Center: Soft duel collision light pulse
 */

import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════
   1. 3D PERSPECTIVE GRID FLOOR
═══════════════════════════════════════════════════ */
function GridFloor() {
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
        coord.y -= uTime * 1.5;
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        float line = min(grid.x, grid.y);
        float c = 1.0 - min(line, 1.0);
        float dist = length(vWorldPos.xz);
        float alpha = c * smoothstep(28.0, 2.0, dist) * 0.04;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useFrame((state) => {
    gridShader.uniforms.uTime.value = state.clock.getElapsedTime()
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]}>
      <planeGeometry args={[60, 60, 1, 1]} />
      <shaderMaterial {...gridShader} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════
   2. RED (LEFT) & BLUE (RIGHT) ENERGY STREAMS
═══════════════════════════════════════════════════ */
function RedVsBlueStreams({ count = 100, isHovered }) {
  const redPointsRef = useRef()
  const bluePointsRef = useRef()
  const clashLightRef = useRef()

  const { redPositions, bluePositions } = useMemo(() => {
    const rPos = new Float32Array(count * 3)
    const bPos = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Left Red particles
      rPos[i * 3] = -14 + Math.random() * 7     // X: -14 to -7
      rPos[i * 3 + 1] = (Math.random() - 0.5) * 8 // Y
      rPos[i * 3 + 2] = (Math.random() - 0.5) * 6 // Z

      // Right Blue particles
      bPos[i * 3] = 14 - Math.random() * 7      // X: 7 to 14
      bPos[i * 3 + 1] = (Math.random() - 0.5) * 8  // Y
      bPos[i * 3 + 2] = (Math.random() - 0.5) * 6  // Z
    }

    return { redPositions: rPos, bluePositions: bPos }
  }, [count])

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.3, 'rgba(255,255,255,0.7)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const speed = isHovered ? 0.08 : 0.045

    if (redPointsRef.current) {
      const pos = redPointsRef.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const idx = i * 3
        pos[idx] += speed + (i % 5) * 0.005
        pos[idx + 1] += Math.sin(t * 1.5 + idx) * 0.008
        if (pos[idx] >= -0.5) {
          pos[idx] = -14 - Math.random() * 4
          pos[idx + 1] = (Math.random() - 0.5) * 8
        }
      }
      redPointsRef.current.geometry.attributes.position.needsUpdate = true
    }

    if (bluePointsRef.current) {
      const pos = bluePointsRef.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        const idx = i * 3
        pos[idx] -= speed + (i % 5) * 0.005
        pos[idx + 1] += Math.cos(t * 1.5 + idx) * 0.008
        if (pos[idx] <= 0.5) {
          pos[idx] = 14 + Math.random() * 4
          pos[idx + 1] = (Math.random() - 0.5) * 8
        }
      }
      bluePointsRef.current.geometry.attributes.position.needsUpdate = true
    }

    if (clashLightRef.current) {
      clashLightRef.current.intensity = 1.2 + Math.sin(t * 3) * 0.5
    }
  })

  useEffect(() => {
    return () => { particleTexture.dispose() }
  }, [particleTexture])

  return (
    <group>
      <pointLight ref={clashLightRef} position={[0, 0, -2]} intensity={1.5} distance={12} color="#FFFFFF" />
      <pointLight position={[-6, 1, -2]} intensity={2.5} distance={15} color="#E11D48" />
      <pointLight position={[6, -1, -2]} intensity={2.5} distance={15} color="#38BDF8" />

      {/* LEFT RED STREAM */}
      <points ref={redPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[redPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#E11D48"
          map={particleTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.85}
        />
      </points>

      {/* RIGHT BLUE STREAM */}
      <points ref={bluePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bluePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#38BDF8"
          map={particleTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.85}
        />
      </points>
    </group>
  )
}

export default function HeroScene3D({ isHovered = false }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.25} />
        <RedVsBlueStreams count={90} isHovered={isHovered} />
        <GridFloor />
      </Canvas>
    </div>
  )
}
