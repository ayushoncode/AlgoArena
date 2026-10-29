/**
 * src/components/mascot/useMascotEvents.js
 *
 * Phase C — Event-Reaction Engine
 *
 * Responsibilities:
 *  - Observes user interactions and page events to trigger contextual tips:
 *      * Language tab clicked: "Same logic, different syntax."
 *      * Demo duel verdict reached: "The left side finished first."
 *      * Calculator changed: "A win against a higher rated rival earns more points."
 *      * Main CTA hover: expression becomes alert for 600ms and eyes glance toward CTA.
 *      * Fast scroll: eyes glance in scroll direction.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { EVENT_TIPS } from '../../content/mascot.js'

export function useMascotEvents({
  active = true,
  isTourActive = false,
  onShowTip,
  setExpressionFor,
} = {}) {
  const [ctaHovered, setCtaHovered] = useState(false)
  const [scrollDir, setScrollDir] = useState(0) // -1 up, 1 down, 0 neutral
  const lastScrollYRef = useRef(0)
  const lastScrollTimeRef = useRef(Date.now())
  const scrollResetTimerRef = useRef(null)
  const duelVerdictTriggeredRef = useRef(false)
  const lastLangClickTimeRef = useRef(0)

  // ── 1. Hover on Main CTA ──────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const handlePointerOver = (e) => {
      const cta = e.target.closest('.cta, .final-cta-btn')
      if (cta) {
        setCtaHovered(true)
        setExpressionFor?.('alert', 600)
      }
    }

    const handlePointerOut = (e) => {
      const cta = e.target.closest('.cta, .final-cta-btn')
      if (cta) {
        setCtaHovered(false)
      }
    }

    document.addEventListener('pointerover', handlePointerOver, { passive: true })
    document.addEventListener('pointerout', handlePointerOut, { passive: true })

    return () => {
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('pointerout', handlePointerOut)
    }
  }, [active, setExpressionFor])

  // ── 2. Fast scroll eye tracking ───────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const handleScroll = () => {
      const now = Date.now()
      const currentY = window.scrollY
      const dy = currentY - lastScrollYRef.current
      const dt = Math.max(1, now - lastScrollTimeRef.current)
      const velocity = Math.abs(dy / dt)

      lastScrollYRef.current = currentY
      lastScrollTimeRef.current = now

      // If scrolling fast (velocity > 1.2 px/ms)
      if (velocity > 1.2 && Math.abs(dy) > 15) {
        setScrollDir(dy > 0 ? 1 : -1)
        clearTimeout(scrollResetTimerRef.current)
        scrollResetTimerRef.current = setTimeout(() => {
          setScrollDir(0)
        }, 300)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollResetTimerRef.current)
    }
  }, [active])

  // ── 3. Language tab click in Sandbox ──────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const handleClick = (e) => {
      if (isTourActive) return
      const tab = e.target.closest('.sandbox-tab-btn, #sandbox button[role="tab"]')
      if (!tab) return

      const now = Date.now()
      if (now - lastLangClickTimeRef.current < 20000) return // avoid spamming
      lastLangClickTimeRef.current = now

      onShowTip?.(EVENT_TIPS.languageTabClicked, { isManual: false })
    }

    document.addEventListener('click', handleClick, { passive: true })
    return () => document.removeEventListener('click', handleClick)
  }, [active, isTourActive, onShowTip])

  // ── 4. Demo duel verdict reached ──────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const checkVerdict = () => {
      if (duelVerdictTriggeredRef.current || isTourActive) return
      const duelEl = document.getElementById('duel')
      if (!duelEl) return

      const accepted = duelEl.querySelector('.verdict-tag.accepted')
      if (accepted) {
        duelVerdictTriggeredRef.current = true
        onShowTip?.(EVENT_TIPS.demoDuelVerdict('left'), { isManual: false })
      }
    }

    const duelSection = document.getElementById('duel')
    if (!duelSection) return

    const observer = new MutationObserver(checkVerdict)
    observer.observe(duelSection, { childList: true, subtree: true, characterData: true })

    // Also check on interval while duel is running
    const interval = setInterval(checkVerdict, 1000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [active, isTourActive, onShowTip])

  // ── 5. Calculator changed event ───────────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const handleCalcChange = (e) => {
      if (isTourActive) return
      const ratingsEl = document.getElementById('ratings')
      if (ratingsEl && ratingsEl.contains(e.target)) {
        onShowTip?.(EVENT_TIPS.calculatorChanged, { isManual: false })
      }
    }

    const handleCustomCalc = () => {
      if (!isTourActive) {
        onShowTip?.(EVENT_TIPS.calculatorChanged, { isManual: false })
      }
    }

    document.addEventListener('input', handleCalcChange, { passive: true })
    window.addEventListener('mascot:calculator-changed', handleCustomCalc)

    return () => {
      document.removeEventListener('input', handleCalcChange)
      window.removeEventListener('mascot:calculator-changed', handleCustomCalc)
    }
  }, [active, isTourActive, onShowTip])

  return {
    ctaHovered,
    scrollDir,
  }
}

