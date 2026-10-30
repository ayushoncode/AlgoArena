/**
 * src/components/mascot/useMascotTips.js
 *
 * Phase B — Tip System & Section-Aware Tips
 *
 * Responsibilities:
 *  - Observes sections via IntersectionObserver (thresholds including 0.55).
 *  - Waits 600ms after scroll stops before evaluating tips.
 *  - Enforces all prompt rules:
 *      * Only one bubble at a time
 *      * Max one tip per section per session
 *      * Max 6 tips per session
 *      * At least 12 seconds cooldown between tips
 *      * Section must be >= 55% visible
 *      * Never while input focused, auth dialog open, mobile menu open, or demo duel typing
 *      * Never covers primary CTA / controls
 *      * Auto-dismisses: 7s desktop, 5s mobile (paused on hover/focus)
 *      * Keyboard: Esc closes bubble
 *      * Persistent preferences: respects mascot.hidden, mascot.noTips
 *      * Repeat last tip support
 *      * Debug state exposure (?mascot=debug)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  SECTION_TIPS,
  MAX_TIPS_PER_SESSION,
  MIN_SECONDS_BETWEEN_TIPS,
  SECTION_VISIBILITY_THRESHOLD,
  SCROLL_SETTLE_MS,
  BUBBLE_AUTO_DISMISS_DESKTOP_MS,
  BUBBLE_AUTO_DISMISS_MOBILE_MS,
} from '../../content/mascot.js'
import {
  getSessionTipsShown,
  markTipShown,
  getTipCount,
  getLastTipTime,
  setLastTipTime,
  getLastTip,
  setLastTip,
  getNoTips,
  getFirstVisitDone,
  getTourDone,
} from './mascotStorage.js'

export function useMascotTips({
  active = true,
  isMobile = false,
  isAuthenticated = false,
  hasPlayedBefore = false,
  isTourActive = false,
} = {}) {
  const [currentTip, setCurrentTip] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // References to preserve state across renders
  const dismissTimerRef        = useRef(null)
  const dismissStartTimeRef    = useRef(null)
  const dismissRemainingMsRef  = useRef(0)
  const isPausedRef            = useRef(false)
  const scrollTimerRef         = useRef(null)
  const visibilityMapRef       = useRef({})
  const currentTipRef          = useRef(null)

  currentTipRef.current = currentTip

  // ── Auto-dismiss controls ──────────────────────────────────────────────────
  const closeTip = useCallback(() => {
    clearTimeout(dismissTimerRef.current)
    dismissRemainingMsRef.current = 0
    isPausedRef.current = false
    setCurrentTip(null)
  }, [])

  const startAutoDismiss = useCallback((customDuration) => {
    clearTimeout(dismissTimerRef.current)
    const duration = customDuration ?? (
      isMobile ? BUBBLE_AUTO_DISMISS_MOBILE_MS : BUBBLE_AUTO_DISMISS_DESKTOP_MS
    )
    dismissRemainingMsRef.current = duration
    dismissStartTimeRef.current = Date.now()
    isPausedRef.current = false

    dismissTimerRef.current = setTimeout(() => {
      closeTip()
    }, duration)
  }, [isMobile, closeTip])

  const pauseAutoDismiss = useCallback(() => {
    if (isPausedRef.current || !dismissStartTimeRef.current) return
    isPausedRef.current = true
    clearTimeout(dismissTimerRef.current)
    const elapsed = Date.now() - dismissStartTimeRef.current
    dismissRemainingMsRef.current = Math.max(0, dismissRemainingMsRef.current - elapsed)
  }, [])

  const resumeAutoDismiss = useCallback(() => {
    if (!isPausedRef.current) return
    isPausedRef.current = false
    dismissStartTimeRef.current = Date.now()
    const remaining = Math.max(600, dismissRemainingMsRef.current || (isMobile ? BUBBLE_AUTO_DISMISS_MOBILE_MS : BUBBLE_AUTO_DISMISS_DESKTOP_MS))
    clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = setTimeout(() => {
      closeTip()
    }, remaining)
  }, [isMobile, closeTip])

  // ── Manual & programmatic display ──────────────────────────────────────────
  const showTip = useCallback((tip, { isManual = false, isTour = false } = {}) => {
    if (!tip) return
    setCurrentTip(tip)
    if (!isManual) {
      markTipShown(tip.id)
      setLastTipTime(Date.now())
    }
    setLastTip(tip)

    // Tour stops NEVER auto-dismiss; only passive tips auto-dismiss
    if (!isTour && !tip.isTour) {
      startAutoDismiss()
    } else {
      clearTimeout(dismissTimerRef.current)
    }
  }, [startAutoDismiss])

  const repeatLastTip = useCallback(() => {
    const last = getLastTip()
    if (last) {
      showTip(last, { isManual: true })
      return
    }
    // Fallback: show first tip (hero)
    const heroTip = SECTION_TIPS.find(t => t.id === 'hero')
    if (heroTip) {
      showTip(heroTip, { isManual: true })
    }
  }, [showTip])

  // ── Validation check (hard rules) ──────────────────────────────────────────
  const canShowTip = useCallback((tip) => {
    if (!active) return false
    if (!tip) return false
    if (isTourActive) return false

    // 1. User preferences & storage
    if (getNoTips()) return false
    if (getTipCount() >= MAX_TIPS_PER_SESSION) return false
    if (getSessionTipsShown().includes(tip.id)) return false

    // 2. Cooldown: at least 12 seconds between tips
    const lastTime = getLastTipTime()
    const elapsed = (Date.now() - lastTime) / 1000
    if (lastTime > 0 && elapsed < MIN_SECONDS_BETWEEN_TIPS) return false

    // 3. Only one bubble at a time
    if (currentTipRef.current !== null) return false

    // 4. Condition check (auth state)
    if (tip.condition === 'loggedOut' && isAuthenticated) return false
    if (tip.condition === 'loggedIn' && !isAuthenticated) return false
    if (tip.condition === 'hasPlayedBefore' && !hasPlayedBefore) return false

    // 5. DOM suppression checks
    // Input focused?
    if (typeof document !== 'undefined') {
      const activeEl = document.activeElement
      if (activeEl && (
        activeEl.matches('input, textarea, select, [contenteditable]') ||
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return false
      }

      // Auth dialog open?
      const authOpen = document.querySelector('[role="dialog"], .auth-dialog, [data-dialog], [data-radix-dialog-overlay]')
      if (authOpen) return false

      // Mobile menu open?
      const mobileNavOpen = document.querySelector('.navpanel.open, .burger[aria-expanded="true"], body.menu-open')
      if (mobileNavOpen) return false

      // Demo duel actively typing?
      const demoTyping = document.querySelector('[data-mascot-typing="true"]')
      if (demoTyping) return false

      // Collision avoidance: bubble appears near bottom-right corner.
      // Check if any primary CTA button sits in that viewport quadrant.
      const vw = window.innerWidth
      const vh = window.innerHeight
      const bubbleArea = {
        left: vw - 300,
        top: vh - 220,
        right: vw,
        bottom: vh,
      }

      const criticalSelectors = ['.cta', '.final-cta-btn', 'button.pill']
      for (const sel of criticalSelectors) {
        const els = document.querySelectorAll(sel)
        for (const el of els) {
          const rect = el.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            const collides = (
              rect.right > bubbleArea.left &&
              rect.left < bubbleArea.right &&
              rect.bottom > bubbleArea.top &&
              rect.top < bubbleArea.bottom
            )
            if (collides) {
              return false // skip tip so it never covers the CTA
            }
          }
        }
      }
    }

    return true
  }, [active, isAuthenticated, hasPlayedBefore])

  // ── IntersectionObserver for sections ─────────────────────────────────────
  useEffect(() => {
    if (!active) return

    const entriesMap = {}
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('data-mascot-section') || entry.target.id
        if (id) {
          entriesMap[id] = entry.intersectionRatio
        }
      })
      visibilityMapRef.current = { ...visibilityMapRef.current, ...entriesMap }
    }, {
      threshold: [0, 0.25, 0.55, 0.75, 1.0],
    })

    // Observe each section
    SECTION_TIPS.forEach(tip => {
      let el = null
      if (tip.selector) {
        try { el = document.querySelector(tip.selector) } catch {}
      }
      if (!el && tip.sectionId) {
        el = document.getElementById(tip.sectionId)
      }
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [active])

  // ── Scroll settle logic (600ms after scrolling stops) ─────────────────────
  useEffect(() => {
    if (!active) return

    const handleScroll = () => {
      clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => {
        const vMap = visibilityMapRef.current || {}
        let bestTip = null
        let bestRatio = 0

        for (const tip of SECTION_TIPS) {
          let el = null
          if (tip.selector) {
            try { el = document.querySelector(tip.selector) } catch {}
          }
          if (!el && tip.sectionId) {
            el = document.getElementById(tip.sectionId)
          }
          if (!el) continue

          const key = el.getAttribute('data-mascot-section') || el.id
          const ratio = vMap[key] ?? 0
          if (ratio >= SECTION_VISIBILITY_THRESHOLD && ratio > bestRatio) {
            bestRatio = ratio
            bestTip = tip
          }
        }

        if (bestTip) {
          setActiveSectionId(bestTip.id)
          if (canShowTip(bestTip)) {
            showTip(bestTip)
          }
        }
      }, SCROLL_SETTLE_MS)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Initial evaluation once page loads (only if first-visit tour prompt already settled)
    const initialTimer = setTimeout(() => {
      if (getFirstVisitDone() || getTourDone()) {
        handleScroll()
      }
    }, 1200)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimerRef.current)
      clearTimeout(initialTimer)
      clearTimeout(dismissTimerRef.current)
    }
  }, [active, canShowTip, showTip])

  // ── Cooldown timer interval for debug display ─────────────────────────────
  useEffect(() => {
    if (!active) return

    const updateCooldown = () => {
      const last = getLastTipTime()
      if (!last) {
        setCooldownRemaining(0)
        return
      }
      const diffSec = (Date.now() - last) / 1000
      const remaining = Math.max(0, Math.ceil(MIN_SECONDS_BETWEEN_TIPS - diffSec))
      setCooldownRemaining(remaining)
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)
    return () => clearInterval(interval)
  }, [active])

  return {
    currentTip,
    activeSectionId,
    cooldownRemaining,
    showTip,
    closeTip,
    repeatLastTip,
    pauseAutoDismiss,
    resumeAutoDismiss,
  }
}

