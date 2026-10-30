/**
 * frontend/src/components/LockedFeatureModal.jsx
 *
 * Plain dialog displayed when user attempts to access a gated feature:
 * - Solid surface, hairline border
 * - Accessible focus trapping, Esc key listener
 * - Concrete explanation of feature and price
 * - "View Premium" and "Not now" actions
 * - No countdowns, no preselected options, no hidden fees
 */

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock, IconClose } from './icons'

const FEATURE_DESCRIPTIONS = {
  sheet: 'Access to the structured A2Z Sheet curriculum, problem breakdown, and curriculum indexing.',
  sheet_1v1: 'Challenge rivals 1v1 on A2Z Sheet questions chosen question by question with real-time verdicts.',
  default: 'Access to curated curriculum indexing and question-by-question duel matchmaking.'
}

export default function LockedFeatureModal({ isOpen, onClose, featureKey = 'sheet' }) {
  const navigate = useNavigate()
  const modalRef = useRef(null)
  const primaryBtnRef = useRef(null)

  // Focus trap and Escape listener
  useEffect(() => {
    if (!isOpen) return

    const prevActiveElement = document.activeElement
    const timer = setTimeout(() => {
      primaryBtnRef.current?.focus()
    }, 40)

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      prevActiveElement?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const description = FEATURE_DESCRIPTIONS[featureKey] || FEATURE_DESCRIPTIONS.default

  function handleGoPremium() {
    onClose()
    navigate('/premium')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-modal-title"
      aria-describedby="locked-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(2, 6, 15, 0.75)',
        backdropFilter: 'none'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-lg p-6 relative"
        style={{
          background: 'var(--bg-1, #080d1a)',
          border: '1px solid var(--hair, rgba(196, 214, 232, 0.16))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 transition-colors"
          style={{
            color: 'var(--sub, #a2a9b8)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ink, #ffffff)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sub, #a2a9b8)')}
        >
          <IconClose size={16} />
        </button>

        {/* Lock Mark & Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="flex items-center justify-center w-8 h-8 rounded"
            style={{
              background: 'rgba(255, 214, 150, 0.08)',
              border: '1px solid var(--gold, #ffd696)',
              color: 'var(--gold, #ffd696)'
            }}
          >
            <IconLock size={15} />
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gold, #ffd696)'
            }}
          >
            Premium Feature
          </span>
        </div>

        <h2
          id="locked-modal-title"
          className="text-lg font-semibold mb-2"
          style={{
            fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
            color: 'var(--ink, #ffffff)'
          }}
        >
          Premium feature
        </h2>

        <p
          id="locked-modal-desc"
          className="text-sm leading-relaxed mb-4"
          style={{
            color: 'var(--sub, #a2a9b8)',
            fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)'
          }}
        >
          {description} AlgoArena Premium is available from ₹39 per month with no competitive changes to rating or matchmaking.
        </p>

        <div
          className="rounded p-3 mb-6"
          style={{
            background: 'var(--bg-2, #0d1527)',
            border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.08))'
          }}
        >
          <div className="flex items-baseline justify-between mb-1">
            <span
              style={{
                fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
                fontSize: '12px',
                color: 'var(--sub, #a2a9b8)'
              }}
            >
              Monthly subscription
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink, #ffffff)'
              }}
            >
              ₹39 / month
            </span>
          </div>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--muted, #6d778d)',
              margin: 0
            }}
          >
            Launch price for the first 100 subscribers (standard 50). Cancel anytime from your account.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm transition-colors"
            style={{
              fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
              color: 'var(--sub, #a2a9b8)',
              background: 'transparent',
              border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.16))',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ink, #ffffff)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sub, #a2a9b8)')}
          >
            Close
          </button>

          <button
            ref={primaryBtnRef}
            type="button"
            onClick={handleGoPremium}
            className="px-5 py-2 rounded text-sm font-semibold transition-colors"
            style={{
              fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
              background: 'var(--gold, #ffd696)',
              color: '#080d1a',
              border: '1px solid var(--gold, #ffd696)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#e6c185')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--gold, #ffd696)')}
          >
            View Premium
          </button>
        </div>
      </div>
    </div>
  )
}
