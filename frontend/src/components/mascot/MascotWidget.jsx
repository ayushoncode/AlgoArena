/**
 * src/components/mascot/MascotWidget.jsx
 *
 * The full mascot widget: face button + bubble + menu.
 * This component is lazy-loaded and only rendered when shouldShowMascot() is true.
 *
 * Phase A: character, animations, hide toggle, menu skeleton.
 * Phase B: tip system, auto-dismiss, cooldown, persistent preferences, footer toggle.
 */

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import MascotFace from './MascotFace.jsx'
import { useMascotAnimation } from './useMascotAnimation.js'
import {
  getMascotHidden,
  setMascotHidden,
} from './mascotStorage.js'
import './mascot.css'

const MASCOT_SIZE_DESKTOP = 64
const MASCOT_SIZE_MOBILE  = 48

function useMobileSize() {
  const [mobile, setMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= 600 : false
  ))
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)')
    const handler = (e) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

/**
 * MascotFooterPortal — mounts a tiny toggle in the footer link list.
 * Finds #mascot-footer-slot or [data-mascot="toggle"].
 */
function MascotFooterPortal({ hidden, onToggle }) {
  const [target, setTarget] = useState(null)

  useEffect(() => {
    const findSlot = () => {
      const el = document.getElementById('mascot-footer-slot') ||
                 document.querySelector('[data-mascot="toggle"]')
      if (el) setTarget(el)
    }

    findSlot()
    // In case footer lazy loads
    const interval = setInterval(findSlot, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!target) return null

  return createPortal(
    <button
      type="button"
      className="mascot-toggle-btn"
      onClick={onToggle}
      aria-label={hidden ? 'Show the guide' : 'Hide the guide'}
    >
      {hidden ? 'Show the guide' : 'Hide the guide'}
    </button>,
    target
  )
}

// ── MascotWidget ──────────────────────────────────────────────────────────────
export default function MascotWidget({
  currentTip          = null,   // { text, actionLabel?, actionHref? } | null
  onTipClose          = null,
  onTipAction         = null,
  onTipHoverStart     = null,
  onTipHoverEnd       = null,
  onMenuTakeTour      = null,
  onMenuRepeatTip     = null,
  debugInfo           = null,   // string | null (from ?mascot=debug)
  expressionOverride  = null,
}) {
  const isMobile  = useMobileSize()
  const size      = isMobile ? MASCOT_SIZE_MOBILE : MASCOT_SIZE_DESKTOP
  const menuId    = useId()

  // ── Persistence state ─────────────────────────────────────────────────────
  const [hidden,  setHiddenState]  = useState(() => getMascotHidden())
  const [menuOpen, setMenuOpen]    = useState(false)

  // ── Bubble visibility (animated) ──────────────────────────────────────────
  const [bubbleVisible, setBubbleVisible] = useState(false)
  const bubbleTimerRef = useRef(null)

  useEffect(() => {
    if (currentTip) {
      // Tiny delay so CSS transition fires smoothly
      const raf = requestAnimationFrame(() => setBubbleVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setBubbleVisible(false)
    }
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

  // Friendly greeting expression when mascot first appears on landing page
  useEffect(() => {
    if (reducedMotion || isLowPower) return
    const timer = setTimeout(() => {
      setExpressionFor('happy', 1200)
    }, 750)
    return () => clearTimeout(timer)
  }, [reducedMotion, isLowPower, setExpressionFor])

  const activeExpression = expressionOverride ?? expression

  // ── Menu keyboard handling ────────────────────────────────────────────────
  const menuRef       = useRef(null)
  const mascotBtnRef  = useRef(null)

  const openMenu = useCallback(() => {
    setMenuOpen(true)
    // Focus first item when opening via keyboard
    setTimeout(() => {
      const firstBtn = menuRef.current?.querySelector('button')
      firstBtn?.focus()
    }, 50)
  }, [])

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
      if (e.key === 'Escape') {
        closeMenu()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const buttons = Array.from(menuRef.current?.querySelectorAll('button') || [])
        if (!buttons.length) return
        const idx = buttons.indexOf(document.activeElement)
        const nextIdx = e.key === 'ArrowDown'
          ? (idx + 1) % buttons.length
          : (idx - 1 + buttons.length) % buttons.length
        buttons[nextIdx]?.focus()
      }
    }
    const handleOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        mascotBtnRef.current && !mascotBtnRef.current.contains(e.target)
      ) {
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

  // ── Bubble keyboard handling (Esc closes bubble) ─────────────────────────
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
    onTipClose?.()
    closeMenu()
  }, [closeMenu, onTipClose])

  const handleShowGuide = useCallback(() => {
    setMascotHidden(false)
    setHiddenState(false)
  }, [])

  const handleTakeTour = useCallback(() => {
    onMenuTakeTour?.()
    closeMenu()
  }, [onMenuTakeTour, closeMenu])

  // ── Render: hidden state ──────────────────────────────────────────────────
  if (hidden) {
    return (
      <>
        <MascotFooterPortal hidden={true} onToggle={handleShowGuide} />
        <div className="mascot-root" style={{ width: 'auto', minHeight: 'auto' }}>
          <button
            className="mascot-toggle-btn"
            style={{ pointerEvents: 'auto' }}
            onClick={handleShowGuide}
            aria-label="Show the guide"
            type="button"
          >
            Show guide
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <MascotFooterPortal hidden={false} onToggle={handleHideGuide} />

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
              onPointerEnter={onTipHoverStart}
              onPointerLeave={onTipHoverEnd}
              onFocus={onTipHoverStart}
              onBlur={onTipHoverEnd}
            >
              <p className="mascot-bubble-text">{currentTip.text}</p>
              {currentTip.counter && (
                <span className="mascot-tour-counter">{currentTip.counter}</span>
              )}
              {currentTip.tourActions ? (
                <div className="mascot-tour-actions">
                  <button
                    className="mascot-tour-btn-primary"
                    onClick={currentTip.tourActions.onPrimary}
                    type="button"
                  >
                    {currentTip.tourActions.primaryLabel}
                  </button>
                  <button
                    className="mascot-tour-btn-secondary"
                    onClick={currentTip.tourActions.onSecondary}
                    type="button"
                  >
                    {currentTip.tourActions.secondaryLabel}
                  </button>
                </div>
              ) : currentTip.actionLabel ? (
                <button
                  className="mascot-bubble-action"
                  onClick={() => {
                    if (currentTip.actionHref) {
                      window.location.href = currentTip.actionHref
                    } else {
                      onTipAction?.(currentTip)
                    }
                  }}
                  type="button"
                >
                  {currentTip.actionLabel}
                </button>
              ) : null}
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
            className="mascot-menu-row mascot-menu-row-dim"
            role="menuitem"
            onClick={handleHideGuide}
            type="button"
          >
            Hide the guide
          </button>
        </div>

        {/* ── Face button (float wrapper) ──────────────────────────────── */}
        <div className={`mascot-button-wrap${(isLowPower || reducedMotion) ? ' mascot-no-float' : ''}`}>
          {/* Subtle beacon ping ring on entrance */}
          <span className="mascot-beacon-ring" aria-hidden="true" />
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
    </>
  )
}
