/**
 * src/components/mascot/MascotProvider.jsx
 *
 * Single provider: lazy-loads the mascot chunk after first paint.
 * Observes route, auth state, and app state to decide visibility.
 * Reads ?mascot=debug and ?mascot=off from the URL.
 * Wires the Phase B tip system, Phase C 30-second tour, and event reactions.
 *
 * Mount ONE instance in AppLayout, after <ScrollToTop />.
 * Never touches backend, sockets, auth logic or DB.
 */

import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { useLocation } from 'react-router-dom'
import { shouldShowMascot } from './shouldShowMascot.js'
import { getMascotHidden, getTipCount } from './mascotStorage.js'
import { useMascotTips } from './useMascotTips.js'
import { useMascotTour } from './useMascotTour.js'
import { useMascotEvents } from './useMascotEvents.js'
import { useAuth } from '../../hooks/useAuth'

// Lazy-load the widget chunk -- does NOT affect hero LCP
const MascotWidget = lazy(() => import('./MascotWidget.jsx'))

export default function MascotProvider() {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [hidden]  = useState(() => getMascotHidden())
  const [expressionOverride, setExpressionOverride] = useState(null)

  const hasPlayedBefore = Boolean(
    user?.matchesPlayed > 0 ||
    user?.totalMatches > 0 ||
    user?.stats?.matches > 0
  )

  // ── Query param flags ─────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search)
  const debugMode = params.get('mascot') === 'debug'
  const offMode   = params.get('mascot') === 'off'

  // ── App state for shouldShowMascot ────────────────────────────────────────
  const appState = {
    mascotHidden:    hidden,
    mascotDebugOff:  offMode,
    authDialogOpen:  false,
    mobileMenuOpen:  false,
    isSearchingMatch: false,
    isInMatch:       false,
    isAuthenticated: isAuthenticated,
  }

  const isHomePage = location.pathname === '/'
  const show = isHomePage && !isAuthenticated && shouldShowMascot(location.pathname, appState)

  // ── Temporary expression override helper ──────────────────────────────────
  const handleSetExpression = useCallback((expr, duration = 600) => {
    setExpressionOverride(expr)
    setTimeout(() => {
      setExpressionOverride(null)
    }, duration)
  }, [])

  // ── Phase B: Tip system hook ──────────────────────────────────────────────
  const {
    currentTip,
    activeSectionId,
    cooldownRemaining,
    showTip,
    closeTip,
    repeatLastTip,
    pauseAutoDismiss,
    resumeAutoDismiss,
  } = useMascotTips({
    active: show && isHomePage,
    isMobile: typeof window !== 'undefined' ? window.innerWidth <= 600 : false,
    isAuthenticated,
    hasPlayedBefore,
  })

  // ── Phase C: 30-Second Guided Tour hook ───────────────────────────────────
  const {
    tourActive,
    startTour,
    endTour,
  } = useMascotTour({
    active: show && isHomePage,
    onShowTip: showTip,
    onCloseTip: closeTip,
  })

  // ── Phase C: Event reactions hook ─────────────────────────────────────────
  const { ctaHovered } = useMascotEvents({
    active: show && isHomePage,
    isTourActive: tourActive,
    onShowTip: showTip,
    setExpressionFor: handleSetExpression,
  })

  // ── Lazy mount: defer until after first paint ─────────────────────────────
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setMounted(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    } else {
      const id = requestAnimationFrame(() => {
        setTimeout(() => setMounted(true), 400)
      })
      return () => cancelAnimationFrame(id)
    }
  }, [])

  // ── Debug info string ─────────────────────────────────────────────────────
  const debugInfo = debugMode
    ? `route: ${location.pathname} | sec: ${activeSectionId || 'hero'} | tips: ${getTipCount()}/6 | cd: ${cooldownRemaining}s`
    : null

  if (!mounted || !show) return null

  return (
    <Suspense fallback={null}>
      <MascotWidget
        debugInfo={debugInfo}
        currentTip={currentTip}
        expressionOverride={ctaHovered ? 'alert' : expressionOverride}
        onTipClose={tourActive ? () => endTour(false) : closeTip}
        onTipAction={null}
        onTipHoverStart={pauseAutoDismiss}
        onTipHoverEnd={resumeAutoDismiss}
        onMenuTakeTour={startTour}
        onMenuRepeatTip={repeatLastTip}
      />
    </Suspense>
  )
}
