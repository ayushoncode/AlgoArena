/**
 * src/components/mascot/MascotWidget.jsx
 *
 * The full mascot widget: face button + bubble + menu.
 * This component is lazy-loaded and only rendered when shouldShowMascot() is true.
 *
 * Phase A scope: character, animations, hide toggle, menu skeleton.
 * Tip system and tour are wired via props/callbacks (implemented in Phase B/C).
 */

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import MascotFace from './MascotFace.jsx'
import { useMascotAnimation } from './useMascotAnimation.js'
import {
  getMascotHidden,
  setMascotHidden,
  getNoTips,
  setNoTips,
  getTourDone,
} from './mascotStorage.js'
import './mascot.css'

const MASCOT_SIZE_DESKTOP = 64
const MASCOT_SIZE_MOBILE  = 48

function useMobileSize() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 600)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)')
    const handler = (e) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

// ── MascotWidget ──────────────────────────────────────────────────────────────
export default function MascotWidget({
  // Phase B/C: these props will be supplied by MascotProvider
  currentTip       = null,   // { text, actionLabel?, actionHref? } | null
  onTipClose       = null,
  onTipAction      = null,
  onMenuTakeTour   = null,
  onMenuRepeatTip  = null,
  debugInfo        = null,   // string | null (from ?mascot=debug)
  // External expression override (e.g. hover on CTA -> alert)
  expressionOverride = null,
}) {
  const isMobile  = useMobileSize()
  const size      = isMobile ? MASCOT_SIZE_MOBILE : MASCOT_SIZE_DESKTOP
  const menuId    = useId()

  // ── Persistence state ─────────────────────────────────────────────────────
  const [hidden,  setHiddenState]  = useState(() => getMascotHidden())
  const [noTips,  setNoTipsState]  = useState(() => getNoTips())
  const [menuOpen, setMenuOpen]    = useState(false)

  // ── Bubble visibility (animated) ──────────────────────────────────────────
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const bubbleTimerRef = useRef(null)

  useEffect(() => {
    if (currentTip) {
      // Tiny delay so CSS transition fires
      requestAnimationFrame(() => setBubbleVisible(true))
    } else {
      setBubbleVisible(false)
    }
    return () => clearTimeout(bubbleTimerRef.current)
  }, [currentTip])

  // ── Animation hook ────────────────────────────────────────────────────────
  const {
    blinking,
    eyeOffsetX,
    eyeOffsetY,
    expression,
    isLowPower,
    reducedMotion,
    setExpressionFor,
    onMascotEnter,
    onMascotLeave,
  } = useMascotAnimation({ active: !hidden })

  const activeExpression = expressionOverride ?? expression

  // ── Menu keyboard handling ────────────────────────────────────────────────
  const menuRef       = useRef(null)
  const mascotBtnRef  = useRef(null)

  const openMenu  = useCallback(() => setMenuOpen(true),  [])
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    mascotBtnRef.current?.focus()
  }, [])

  const handleBtnClick = useCallback(() => {
    if (menuOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }, [menuOpen, openMenu, closeMenu])

  // Close menu on Esc or outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') closeMenu()
    }
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          mascotBtnRef.current && !mascotBtnRef.current.contains(e.target)) {
        closeMenu()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handleOutside)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handleOutside)
    }
  }, [menuOpen, closeMenu])

  // ── Bubble keyboard handling ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentTip) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onTipClose?.()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [currentTip, onTipClose])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleHideGuide = useCallback(() => {
    setMascotHidden(true)
    setHiddenState(true)
    closeMenu()
  }, [closeMenu])

  const handleShowGuide = useCallback(() => {
    setMascotHidden(false)
    setHiddenState(false)
  }, [])

  const handleNoTips = useCallback(() => {
    setNoTips(true)
    setNoTipsState(true)
    onTipClose?.()
    closeMenu()
  }, [closeMenu, onTipClose])

  const handleRepeatTip = useCallback(() => {
    onMenuRepeatTip?.()
    closeMenu()
  }, [onMenuRepeatTip, closeMenu])

  const handleTakeTour = useCallback(() => {
    onMenuTakeTour?.()
    closeMenu()
  }, [onMenuTakeTour, closeMenu])

  // ── Render: hidden state ──────────────────────────────────────────────────
  if (hidden) {
    return (
      // Small "show guide" toggle rendered in footer via portal in Phase B
      // For Phase A, render a minimal fixed toggle
      <div className="mascot-root" style={{ width: 'auto', minHeight: 'auto' }}>
        <button
          className="mascot-toggle-btn"
          style={{ pointerEvents: 'auto' }}
          onClick={handleShowGuide}
          aria-label="Show the guide"
        >
          Show guide
        </button>
      </div>
    )
  }

  return (
    <div
      className="mascot-root"
      role="complementary"
      aria-label="Page guide"
    >
      {/* ── Debug badge ──────────────────────────────────────────────── */}
      {debugInfo && (
        <div className="mascot-debug-badge" aria-hidden="true">
          {debugInfo}
        </div>
      )}

      {/* ── Tip bubble ───────────────────────────────────────────────── */}
      {currentTip && (
        <div className="mascot-bubble-wrap">
          <div
            className={`mascot-bubble${bubbleVisible ? ' mascot-bubble-visible' : ''}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="mascot-bubble-text">{currentTip.text}</p>
            {currentTip.actionLabel && (
              <button
                className="mascot-bubble-action"
                onClick={() => onTipAction?.(currentTip)}
                type="button"
              >
                {currentTip.actionLabel}
              </button>
            )}
            {currentTip.counter && (
              <span className="mascot-tour-counter">{currentTip.counter}</span>
            )}
            <button
              className="mascot-bubble-close"
              onClick={onTipClose}
              aria-label="Close tip"
              type="button"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="9" y2="9" />
                <line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Mascot menu popover ──────────────────────────────────────── */}
      <div
        ref={menuRef}
        id={menuId}
        className={`mascot-menu${menuOpen ? ' mascot-menu-open' : ''}`}
        role="menu"
        aria-label="Guide menu"
      >
        <button
          className="mascot-menu-row"
          role="menuitem"
          onClick={handleTakeTour}
          type="button"
        >
          Take the 30 second tour
        </button>
        <button
          className="mascot-menu-row"
          role="menuitem"
          onClick={handleRepeatTip}
          type="button"
        >
          Repeat the last tip
        </button>
        <button
          className="mascot-menu-row mascot-menu-row-dim"
          role="menuitem"
          onClick={handleHideGuide}
          type="button"
        >
          Hide the guide
        </button>
        <button
          className="mascot-menu-row mascot-menu-row-dim"
          role="menuitem"
          onClick={handleNoTips}
          type="button"
        >
          Don't show tips
        </button>
      </div>

      {/* ── Face button (float wrapper) ──────────────────────────────── */}
      <div className={`mascot-button-wrap${(isLowPower || reducedMotion) ? ' mascot-no-float' : ''}`}>
        <button
          ref={mascotBtnRef}
          className="mascot-btn"
          aria-label="Guide menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={handleBtnClick}
          onPointerEnter={onMascotEnter}
          onPointerLeave={onMascotLeave}
          type="button"
        >
          <MascotFace
            expression={activeExpression}
            eyeOffsetX={eyeOffsetX}
            eyeOffsetY={eyeOffsetY}
            blinking={blinking}
            lowPower={isLowPower}
            size={size}
          />
        </button>
      </div>
    </div>
  )
}
