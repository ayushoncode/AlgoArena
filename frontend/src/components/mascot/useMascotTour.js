/**
 * src/components/mascot/useMascotTour.js
 *
 * Phase C — The 30-Second Guided Tour
 *
 * Responsibilities:
 *  - Manages opt-in tour prompt on first visit (after hero entrance + 4s idle).
 *  - Sequenced traversal of 6 tour stops: Duel, How it works, Ratings, Sandbox, Topics, Leaderboard.
 *  - Smooth scroll to section with sticky header offset on user click 'Next'.
 *  - Never auto-scrolls, never scroll-locks, never dims the screen.
 *  - 1px ink outline on the section header for 1.5s per stop.
 *  - '1 of 6' mono counter with 'Next' and 'Skip tour' actions.
 *  - Escape key or 'Skip tour' ends tour immediately.
 *  - Tour marked done in localStorage on completion or skip.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TOUR_STOPS,
  TOUR_INTRO_TEXT,
  TOUR_CLOSING_TEXT,
} from '../../content/mascot.js'
import {
  getFirstVisitDone,
  setFirstVisitDone,
  getTourDone,
  setTourDone,
  getMascotHidden,
} from './mascotStorage.js'

export function useMascotTour({
  active = true,
  onShowTip,
  onCloseTip,
} = {}) {
  const [tourActive, setTourActive] = useState(false)
  const [currentStopIndex, setCurrentStopIndex] = useState(-1)
  const highlightTimerRef = useRef(null)
  const activeHeaderRef = useRef(null)

  // Clear any active header outline
  const clearOutline = useCallback(() => {
    clearTimeout(highlightTimerRef.current)
    if (activeHeaderRef.current) {
      activeHeaderRef.current.classList.remove('mascot-tour-outline')
      activeHeaderRef.current = null
    }
  }, [])

  // ── End / Skip tour ───────────────────────────────────────────────────────
  const endTour = useCallback((showClosing = false) => {
    clearOutline()
    setTourActive(false)
    setCurrentStopIndex(-1)
    setTourDone()

    if (showClosing) {
      onShowTip?.({
        id: 'tour-closing',
        text: TOUR_CLOSING_TEXT,
        isTour: false,
      }, { isManual: true, isTour: false })
    } else {
      onCloseTip?.()
    }
  }, [clearOutline, onCloseTip, onShowTip])

  // ── Highlight section header ──────────────────────────────────────────────
  const highlightSection = useCallback((sectionEl) => {
    clearOutline()
    if (!sectionEl) return

    const header = sectionEl.querySelector('.section-header, .depth-heading-layer, h2, .section-title') || sectionEl
    header.classList.add('mascot-tour-outline')
    activeHeaderRef.current = header

    highlightTimerRef.current = setTimeout(() => {
      header.classList.remove('mascot-tour-outline')
      activeHeaderRef.current = null
    }, 2400) // 800ms smooth scroll + 1600ms visible dwell
  }, [clearOutline])

  // ── Scroll to element with native smooth scrollIntoView ──────────────────
  const scrollToSection = useCallback((el) => {
    if (!el) return
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    } else {
      const rect = el.getBoundingClientRect()
      const targetY = window.scrollY + rect.top - 88
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      })
    }
  }, [])

  // ── Render stop ───────────────────────────────────────────────────────────
  const showStop = useCallback((index) => {
    if (index >= TOUR_STOPS.length) {
      endTour(true)
      return
    }

    const stop = TOUR_STOPS[index]
    if (!stop) return

    setCurrentStopIndex(index)
    setTourActive(true)

    // Locate target element
    let targetEl = null
    if (stop.selector) {
      try { targetEl = document.querySelector(stop.selector) } catch {}
    }
    if (!targetEl && stop.sectionId) {
      targetEl = document.getElementById(stop.sectionId) ||
                 document.getElementById(stop.sectionId.replace('section-', '')) ||
                 document.querySelector(`[data-mascot-section="${stop.sectionId.replace('section-', '')}"]`)
    }

    if (targetEl) {
      scrollToSection(targetEl)
      highlightSection(targetEl)
    }

    const isLast = index === TOUR_STOPS.length - 1

    onShowTip?.({
      id: `tour-stop-${index + 1}`,
      text: stop.text,
      counter: `${index + 1} of ${TOUR_STOPS.length}`,
      isTour: true,
      tourActions: {
        primaryLabel: isLast ? 'Finish' : 'Next',
        onPrimary: () => showStop(index + 1),
        secondaryLabel: 'Skip tour',
        onSecondary: () => endTour(false),
      },
    }, { isManual: true, isTour: true })
  }, [endTour, highlightSection, onShowTip, scrollToSection])

  // ── Start tour from beginning ─────────────────────────────────────────────
  const startTour = useCallback(() => {
    setFirstVisitDone()
    showStop(0)
  }, [showStop])

  // ── Escape key closes tour ────────────────────────────────────────────────
  useEffect(() => {
    if (!tourActive) return

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        endTour(false)
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [tourActive, endTour])

  // ── First-visit prompt (opt-in after hero entrance + 4s idle) ──────────────
  useEffect(() => {
    if (!active) return

    // URL trigger: ?tour=true or ?mascot=tour to immediately launch tour
    if (typeof window !== 'undefined') {
      const search = window.location.search
      if (search.includes('mascot=tour') || search.includes('tour=true') || search.includes('tour=1')) {
        const timer = setTimeout(() => {
          showStop(0)
        }, 600)
        return () => clearTimeout(timer)
      }
    }

    if (getFirstVisitDone() || getTourDone() || getMascotHidden()) return

    let lastInteractionTime = Date.now()
    const recordInteraction = () => {
      lastInteractionTime = Date.now()
    }

    window.addEventListener('pointermove', recordInteraction, { passive: true })
    window.addEventListener('keydown', recordInteraction, { passive: true })
    window.addEventListener('click', recordInteraction, { passive: true })
    window.addEventListener('scroll', recordInteraction, { passive: true })

    const idleCheckTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (getFirstVisitDone() || getTourDone()) {
          clearInterval(interval)
          return
        }

        const idleMs = Date.now() - lastInteractionTime
        if (idleMs >= 4000) {
          clearInterval(interval)

          onShowTip?.({
            id: 'tour-intro',
            text: TOUR_INTRO_TEXT,
            isTour: true,
            tourActions: {
              primaryLabel: 'Show me',
              onPrimary: () => {
                setFirstVisitDone()
                showStop(0)
              },
              secondaryLabel: 'Not now',
              onSecondary: () => {
                setFirstVisitDone()
                onCloseTip?.()
              },
            },
          }, { isManual: true, isTour: true })
        }
      }, 1000)

      return () => clearInterval(interval)
    }, 4000)

    return () => {
      clearTimeout(idleCheckTimer)
      window.removeEventListener('pointermove', recordInteraction)
      window.removeEventListener('keydown', recordInteraction)
      window.removeEventListener('click', recordInteraction)
      window.removeEventListener('scroll', recordInteraction)
      clearOutline()
    }
  }, [active, clearOutline, onCloseTip, onShowTip, showStop])

  return {
    tourActive,
    currentStopIndex,
    startTour,
    endTour,
    showStop,
  }
}
