/**
 * src/components/mascot/MascotProvider.jsx
 *
 * Single provider: lazy-loads the mascot chunk after first paint.
 * Observes route, auth state, and app state to decide visibility.
 * Reads ?mascot=debug and ?mascot=off from the URL.
 *
 * Mount ONE instance in AppLayout, after <ScrollToTop />.
 * Never touches backend, sockets, auth logic or DB.
 */

import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import { useLocation } from 'react-router-dom'
import { shouldShowMascot } from './shouldShowMascot.js'
import { getMascotHidden } from './mascotStorage.js'

// Lazy-load the widget chunk -- does NOT affect hero LCP
const MascotWidget = lazy(() => import('./MascotWidget.jsx'))

export default function MascotProvider() {
  const location = useLocation()
  const [mounted, setMounted] = useState(false)
  const [hidden,  setHidden]  = useState(() => getMascotHidden())

  // ── Query param flags ─────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search)
  const debugMode = params.get('mascot') === 'debug'
  const offMode   = params.get('mascot') === 'off'

  // ── App state for shouldShowMascot ────────────────────────────────────────
  // In Phase A we only track the route and the hidden flag.
  // Phase B will add authDialogOpen, mobileMenuOpen, isSearchingMatch etc.
  const appState = {
    mascotHidden:    hidden,
    mascotDebugOff:  offMode,
    authDialogOpen:  false,  // Phase B: supplied via context
    mobileMenuOpen:  false,  // Phase B: supplied via context
    isSearchingMatch: false, // Phase B: supplied via context
    isInMatch:       false,  // Phase B: supplied via context
  }

  const show = shouldShowMascot(location.pathname, appState)

  // ── Lazy mount: defer until after first paint ─────────────────────────────
  useEffect(() => {
    // requestIdleCallback if available, else rAF fallback
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
    ? `route: ${location.pathname}\nshow: ${show}\nhidden: ${hidden}`
    : null

  if (!mounted || !show) return null

  return (
    <Suspense fallback={null}>
      <MascotWidget
        debugInfo={debugInfo}
        // Phase B: tip system props will be added here
        currentTip={null}
        onTipClose={null}
        onTipAction={null}
        onMenuTakeTour={null}
        onMenuRepeatTip={null}
      />
    </Suspense>
  )
}
