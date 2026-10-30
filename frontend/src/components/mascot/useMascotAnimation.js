/**
 * src/components/mascot/useMascotAnimation.js
 *
 * Manages:
 *  - Blink loop (setTimeout chain, paused on document.hidden)
 *  - Eye tracking (rAF lerp, stops 400ms after pointer stops)
 *  - Low-power detection (hardwareConcurrency < 4 or avg frame > 24ms)
 *  - prefers-reduced-motion support
 *  - Idle sleepy state (25s without scroll or pointer movement)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ── helpers ───────────────────────────────────────────────────────────────────
function rand(min, max) {
  return min + Math.random() * (max - min)
}

function detectReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function detectLowPower() {
  const cores = window.navigator.hardwareConcurrency ?? 4
  return cores < 4
}

function isTouchDevice() {
  return window.navigator.maxTouchPoints > 0
}

// ── hook ──────────────────────────────────────────────────────────────────────
export function useMascotAnimation({ active = true } = {}) {
  const reducedMotion = detectReducedMotion()
  const lowPower      = detectLowPower()

  // ── State ─────────────────────────────────────────────────────────────────
  const [blinking,    setBlinking]    = useState(false)
  const [eyeOffsetX,  setEyeOffsetX]  = useState(0)
  const [eyeOffsetY,  setEyeOffsetY]  = useState(0)
  const [expression,  setExpression]  = useState('neutral')
  const [isLowPower,  setIsLowPower]  = useState(lowPower)

  // ── Refs (stable across renders, zero re-render cost) ─────────────────────
  const blinkTimerRef     = useRef(null)
  const rafRef            = useRef(null)
  const targetXRef        = useRef(0)
  const targetYRef        = useRef(0)
  const currentXRef       = useRef(0)
  const currentYRef       = useRef(0)
  const pointerActiveRef  = useRef(false)
  const pointerStopTimer  = useRef(null)
  const idleTimer         = useRef(null)
  const mascotHoveredRef  = useRef(false)
  const frameTimes        = useRef([])
  const lastFrameTime     = useRef(0)
  const expressionTimerRef = useRef(null)

  // ── Low power frame-time sampler ──────────────────────────────────────────
  const sampleFrame = useCallback((ts) => {
    if (lastFrameTime.current > 0) {
      const dt = ts - lastFrameTime.current
      frameTimes.current.push(dt)
      if (frameTimes.current.length > 30) frameTimes.current.shift()
      const avg = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
      if (avg > 24) setIsLowPower(true)
    }
    lastFrameTime.current = ts
  }, [])

  // ── Blink ─────────────────────────────────────────────────────────────────
  const scheduleBlink = useCallback(() => {
    if (reducedMotion || !active) return

    const delay = rand(2800, 6500)
    blinkTimerRef.current = setTimeout(() => {
      if (document.hidden || mascotHoveredRef.current) {
        scheduleBlink()
        return
      }
      // Execute blink (close 110ms, open 130ms)
      setBlinking(true)
      blinkTimerRef.current = setTimeout(() => {
        setBlinking(false)
        // 1-in-6 chance of double blink
        if (Math.random() < 1 / 6) {
          blinkTimerRef.current = setTimeout(() => {
            setBlinking(true)
            blinkTimerRef.current = setTimeout(() => {
              setBlinking(false)
              scheduleBlink()
            }, 130)
          }, 180) // gap between double blinks
        } else {
          scheduleBlink()
        }
      }, 130)
    }, delay)
  }, [reducedMotion, active])

  // ── Eye tracking rAF loop ─────────────────────────────────────────────────
  const lerp = (a, b, t) => a + (b - a) * t
  const LERP_FACTOR = 0.12
  const MAX_OFFSET  = 3

  const runTrackingLoop = useCallback(() => {
    if (reducedMotion || isTouchDevice() || !active) return

    const tick = (ts) => {
      sampleFrame(ts)
      const cx = lerp(currentXRef.current, targetXRef.current, LERP_FACTOR)
      const cy = lerp(currentYRef.current, targetYRef.current, LERP_FACTOR)
      currentXRef.current = cx
      currentYRef.current = cy
      setEyeOffsetX(Math.round(cx * 100) / 100)
      setEyeOffsetY(Math.round(cy * 100) / 100)

      // Continue only while pointer is active
      if (pointerActiveRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [reducedMotion, active, sampleFrame])

  const handlePointerMove = useCallback((e) => {
    if (reducedMotion || isTouchDevice() || !active) return

    // Map pointer to eye offset (-MAX_OFFSET .. +MAX_OFFSET)
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const dx = (e.clientX - cx) / (window.innerWidth / 2)
    const dy = (e.clientY - cy) / (window.innerHeight / 2)
    targetXRef.current = dx * MAX_OFFSET
    targetYRef.current = dy * MAX_OFFSET

    // Start rAF if not running
    if (!pointerActiveRef.current) {
      pointerActiveRef.current = true
      runTrackingLoop()
    }

    // Reset the 400ms stop timer
    clearTimeout(pointerStopTimer.current)
    pointerStopTimer.current = setTimeout(() => {
      pointerActiveRef.current = false
      targetXRef.current = 0
      targetYRef.current = 0
    }, 400)
  }, [reducedMotion, active, runTrackingLoop])

  // ── Idle / sleepy ─────────────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (expression === 'sleepy') {
      setExpression('neutral')
    }
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      setExpression('sleepy')
    }, 25000)
  }, [expression])

  // ── Transient expression helper ───────────────────────────────────────────
  const setExpressionFor = useCallback((expr, durationMs) => {
    clearTimeout(expressionTimerRef.current)
    setExpression(expr)
    expressionTimerRef.current = setTimeout(() => {
      setExpression('neutral')
    }, durationMs)
  }, [])

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    // Blink loop
    scheduleBlink()

    // Pointer tracking (passive)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // Idle timer
    resetIdleTimer()
    window.addEventListener('scroll', resetIdleTimer, { passive: true })
    window.addEventListener('pointermove', resetIdleTimer, { passive: true })

    // Page visibility (pause blink when tab hidden)
    const handleVisChange = () => {
      if (!document.hidden) {
        scheduleBlink()
      }
    }
    document.addEventListener('visibilitychange', handleVisChange)

    return () => {
      clearTimeout(blinkTimerRef.current)
      clearTimeout(pointerStopTimer.current)
      clearTimeout(idleTimer.current)
      clearTimeout(expressionTimerRef.current)
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('scroll', resetIdleTimer)
      window.removeEventListener('pointermove', resetIdleTimer)
      document.removeEventListener('visibilitychange', handleVisChange)
    }
  }, [active, scheduleBlink, handlePointerMove, resetIdleTimer])

  // ── Mascot hover state (eyes stay open) ───────────────────────────────────
  const onMascotEnter = useCallback(() => {
    mascotHoveredRef.current = true
    setExpressionFor('happy', 800)
  }, [setExpressionFor])

  const onMascotLeave = useCallback(() => {
    mascotHoveredRef.current = false
  }, [])

  return {
    blinking,
    eyeOffsetX,
    eyeOffsetY,
    expression,
    isLowPower,
    reducedMotion,
    // public setters
    setExpression,
    setExpressionFor,
    onMascotEnter,
    onMascotLeave,
  }
}
