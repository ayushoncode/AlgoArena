import React, { useEffect, useRef } from 'react'

function AlertIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2l6.5 12H1.5L8 2z" />
      <path d="M8 6.5v3" />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FlagIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 14.5V2.5h9l-2 4 2 4H2.5" />
    </svg>
  )
}

export default function ResignModalV2({ isOpen, onClose, onConfirm }) {
  const cancelBtnRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    cancelBtnRef.current?.focus()

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="battle-v2__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resign-modal-title"
    >
      <div className="battle-v2__modal-dialog">
        <h2 id="resign-modal-title" className="battle-v2__modal-title">
          <AlertIcon size={16} />
          <span>Confirm Resignation</span>
        </h2>
        <p className="battle-v2__modal-body">
          Your rival wins and your Elo will be affected. Are you sure you want to resign this match?
        </p>
        <div className="battle-v2__modal-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="battle-v2__modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="battle-v2__modal-btn-confirm"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <FlagIcon size={12} />
              <span>Resign & Exit</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

