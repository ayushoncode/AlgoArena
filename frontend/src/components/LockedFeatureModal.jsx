/**
 * frontend/src/components/LockedFeatureModal.jsx
 *
 * Plain dialog displayed when user attempts to access a gated feature:
 * - Solid surface, hairline border
 * - Accessible focus trapping, Esc key listener
 * - Clean, concise explanation (not text-heavy or AI-bloated)
 * - Authentic ₹ currency symbol and struck ₹100 launch pricing
 * - "View Premium" and "Close" actions
 */

import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock, IconClose } from './icons'

const FEATURE_TITLES = {
  sheet_1v1: 'Striver A2Z 1v1 Battle',
  sheet: 'Striver A2Z Curriculum',
  voice_chat: 'Live Voice Communication',
  default: 'Premium Feature'
}

const FEATURE_DESCRIPTIONS = {
  sheet_1v1: 'Duel 1v1 on curated curriculum problems with live judge verdicts.',
  sheet: 'Structured curriculum topic breakdown and problem indexing.',
  voice_chat: 'Real-time 1v1 voice communication during live matches.',
  default: 'Curated curriculum indexing and question-by-question duel matchmaking.'
}

export default function LockedFeatureModal({ isOpen, onClose, featureKey = 'sheet_1v1' }) {
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

  const title = FEATURE_TITLES[featureKey] || FEATURE_TITLES.default
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
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'none'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-lg p-6 relative"
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

        {/* Lock Mark & Overline */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="flex items-center justify-center w-6 h-6 rounded"
            style={{
              background: 'rgba(255, 214, 150, 0.1)',
              border: '1px solid var(--gold, #ffd696)',
              color: 'var(--gold, #ffd696)'
            }}
          >
            <IconLock size={12} />
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gold, #ffd696)',
              fontWeight: 600
            }}
          >
            Premium Feature
          </span>
        </div>

        {/* Title */}
        <h2
          id="locked-modal-title"
          className="text-base font-semibold mb-1.5"
          style={{
            fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
            color: 'var(--ink, #ffffff)'
          }}
        >
          {title}
        </h2>

        {/* Concise Description */}
        <p
          id="locked-modal-desc"
          className="text-xs leading-relaxed mb-4"
          style={{
            color: 'var(--sub, #a2a9b8)',
            fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)'
          }}
        >
          {description}
        </p>

        {/* Price Card */}
        <div
          className="rounded p-3 mb-5"
          style={{
            background: 'var(--bg-2, #0d1527)',
            border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.12))'
          }}
        >
          <div className="flex items-baseline justify-between mb-1">
            <span
              style={{
                fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
                fontSize: '11px',
                color: 'var(--sub, #a2a9b8)'
              }}
            >
              Launch price
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12px',
                  color: 'var(--muted, #6d778d)',
                  textDecoration: 'line-through'
                }}
              >
                ₹100
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--gold, #ffd696)'
                }}
              >
                ₹39
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--sub, #a2a9b8)'
                }}
              >
                / month
              </span>
            </div>
          </div>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--muted, #6d778d)',
              margin: 0,
              lineHeight: 1.4
            }}
          >
            First 100 subscribers. Cancel anytime from billing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs transition-colors"
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
            className="px-4 py-1.5 rounded text-xs font-semibold transition-colors"
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
