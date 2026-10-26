import { useEffect, useRef } from 'react'

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

/**
 * useScrollDepth — Global manager for the AlgoArena 3D scroll-driven depth system.
 * 1. Detects CSS animation-timeline: view() native support.
 * 2. Manages ?motion=off, ?motion=debug, ?motion=fallback query flags.
 * 3. Applies mobile lite-mode (< 900px, < 4 cores) and prefers-reduced-motion.
 * 4. Runs a single shared IntersectionObserver + rAF throttled scroll listener fallback
 *    for Firefox and older Safari. Never runs per-frame work on off-screen sections.
 */
export function useScrollDepth(searchOverride) {
  const activeElementsRef = useRef(new Set())
  const observerRef = useRef(null)
  const rafIdRef = useRef(null)

  const search = searchOverride !== undefined ? searchOverride : (typeof window !== 'undefined' ? window.location.search : '')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(search)
    const isMotionOff = params.get('motion') === 'off'
    const isMotionDebug = params.get('motion') === 'debug'
    const isMotionFallback = params.get('motion') === 'fallback'

    const rootEl = document.documentElement

    // 1. Query param flags
    if (isMotionOff) rootEl.classList.add('motion-off')
    if (isMotionDebug) rootEl.classList.add('motion-debug')

    // 2. Reduced motion & capability detection
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      rootEl.classList.add('motion-off')
    }

    const isLowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) || window.innerWidth < 900
    if (isLowPower) {
      rootEl.classList.add('motion-lite')
    }

    // 3. Feature detection for native CSS scroll-driven animations
    const hasNativeSupport = typeof CSS !== 'undefined' &&
      CSS.supports &&
      CSS.supports('animation-timeline', 'view()')

    const shouldUseFallback = isMotionFallback || !hasNativeSupport
    if (shouldUseFallback) {
      rootEl.classList.add('motion-fallback')
    }

    // If motion is off or reduced motion, skip all listener registration
    if (isMotionOff || prefersReducedMotion) {
      return () => {
        rootEl.classList.remove('motion-off', 'motion-debug', 'motion-lite', 'motion-fallback')
        document.querySelectorAll('.depth-debug-pill').forEach((p) => p.remove())
      }
    }

    // 4. Update function for active intersecting sections (Fallback path)
    const updateActiveSections = () => {
      const vh = window.innerHeight

      activeElementsRef.current.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const sectionH = rect.height || vh

        // Enter progression: entry 0% (top at vh) to entry 38% (traveled 38% into view)
        const enterTravelTarget = Math.min(sectionH, vh) * 0.38
        const enterDist = vh - rect.top
        const pEnter = clamp(enterDist / Math.max(1, enterTravelTarget), 0, 1)

        // Hairline draw progression: entry 10% to entry 40%
        const pHairline = clamp((pEnter - 0.25) / 0.75, 0, 1)

        // Exit progression: exit 40% to exit 100%
        // Bottom reaches vh when leaving starts; top leaves viewport.
        const exitStart = -(sectionH * 0.40)
        const exitEnd = -sectionH
        let pExit = 0
        if (rect.top <= exitStart) {
          pExit = clamp((exitStart - rect.top) / Math.max(1, (exitStart - exitEnd)), 0, 1)
        }

        // Apply CSS custom properties
        el.style.setProperty('--p-enter', pEnter.toFixed(4))
        el.style.setProperty('--p-exit', pExit.toFixed(4))
        el.style.setProperty('--p-hairline', pHairline.toFixed(4))

        // Settled state flag: exact crisp vectors (transform: none) when fully in view
        const isSettled = pEnter >= 0.999 && pExit <= 0.001
        if (isSettled) {
          el.classList.add('is-settled')
        } else {
          el.classList.remove('is-settled')
        }

        // Debug badge update if debug mode active
        if (isMotionDebug) {
          let badge = el.querySelector('.depth-debug-pill')
          if (!badge) {
            badge = document.createElement('div')
            badge.className = 'depth-debug-pill'
            el.appendChild(badge)
          }
          const id = el.dataset.depthId || 'section'
          const mode = hasNativeSupport && !isMotionFallback ? 'CSS view()' : 'JS rAF'
          badge.textContent = `[${id}] In:${pEnter.toFixed(2)} Out:${pExit.toFixed(2)} [${isSettled ? 'SETTLED' : '3D'}] (${mode})`
        }
      })
    }

    const onScroll = () => {
      if (rafIdRef.current) return
      rafIdRef.current = requestAnimationFrame(() => {
        updateActiveSections()
        rafIdRef.current = null
      })
    }

    // 5. IntersectionObserver to only track sections near viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          if (entry.isIntersecting) {
            activeElementsRef.current.add(el)
            el.classList.add('is-near-viewport')
          } else {
            activeElementsRef.current.delete(el)
            el.classList.remove('is-near-viewport')

            // When off-screen, write stationary terminal values
            const rect = el.getBoundingClientRect()
            if (rect.top > window.innerHeight) {
              // Below viewport: fully in initial enter state
              el.style.setProperty('--p-enter', '0')
              el.style.setProperty('--p-exit', '0')
              el.classList.remove('is-settled')
            } else if (rect.bottom < 0) {
              // Above viewport: fully in exit state
              el.style.setProperty('--p-enter', '1')
              el.style.setProperty('--p-exit', '1')
              el.classList.remove('is-settled')
            }
          }
        })
        // Immediately compute for newly intersecting elements
        updateActiveSections()
      },
      { rootMargin: '120px 0px 120px 0px', threshold: 0 }
    )

    // Observe all .depth-stage elements currently in DOM
    const observedSet = new WeakSet()
    const attachStage = (el) => {
      if (el && !observedSet.has(el)) {
        observedSet.add(el)
        observerRef.current?.observe(el)
      }
    }

    document.querySelectorAll('.depth-stage').forEach(attachStage)

    // MutationObserver to automatically discover lazy-loaded sections
    const mutationObs = new MutationObserver((mutations) => {
      let foundNewStage = false
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.classList?.contains('depth-debug-pill')) continue
            if (node.classList?.contains('depth-stage')) {
              attachStage(node)
              foundNewStage = true
            }
            const innerStages = node.querySelectorAll?.('.depth-stage')
            if (innerStages && innerStages.length > 0) {
              innerStages.forEach(attachStage)
              foundNewStage = true
            }
          }
        }
      }
      if (foundNewStage) {
        updateActiveSections()
      }
    })

    mutationObs.observe(document.body, { childList: true, subtree: true })

    // Listen to scroll and resize
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // Initial settlement run (e.g. for page refresh in middle or hash anchor jump)
    updateActiveSections()

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mutationObs.disconnect()
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      activeElementsRef.current.clear()
      rootEl.classList.remove('motion-off', 'motion-debug', 'motion-lite', 'motion-fallback')
      document.querySelectorAll('.depth-debug-pill').forEach((p) => p.remove())
    }
  }, [search])
}
