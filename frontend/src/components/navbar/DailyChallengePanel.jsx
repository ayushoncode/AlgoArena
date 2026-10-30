import { useRef, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { IconClose } from '../icons'
import { cleanTaskPreview, getUtcMidnightCountdown } from './navData'

/**
 * DailyChallengePanel — Daily challenge popover (340px) & mobile bottom sheet
 * Shows live countdown to 00:00 UTC, problem title, preview, and streak info.
 */
export default function DailyChallengePanel({
  isOpen,
  onClose,
  triggerRef,
  streak = 0,
  bestStreak = 0,
  dailyProblem,
  isLoading = false,
  onStart
}) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const titleRef = useRef(null)
  const [countdown, setCountdown] = useState(getUtcMidnightCountdown)

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 639px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Live countdown timer — stops when closed and on unmount
  useEffect(() => {
    if (!isOpen) return
    setCountdown(getUtcMidnightCountdown())
    const interval = setInterval(() => {
      setCountdown(getUtcMidnightCountdown())
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  // Focus management and outside click
  useEffect(() => {
    if (!isOpen) return

    // Move focus to title
    setTimeout(() => {
      titleRef.current?.focus()
    }, 30)

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef?.current?.focus()
      }

      // Tab trapping on mobile
      if (isMobile && e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    function handleMouseDown(e) {
      if (
        !isMobile &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('touchstart', handleMouseDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('touchstart', handleMouseDown)
    }
  }, [isOpen, isMobile, onClose, triggerRef])

  if (!isOpen) return null

  const title = dailyProblem?.title || "Today's algorithmic problem"
  const topic = dailyProblem?.topic || 'general'
  const difficulty = (dailyProblem?.difficulty || 'medium').toLowerCase()
  const rawDescription = dailyProblem?.description || ''
  const previewText = cleanTaskPreview(rawDescription) || 'Complete today\'s challenge to keep your streak active.'

  const diffClass =
    difficulty === 'easy'
      ? 'nav-v2-diff-ok'
      : difficulty === 'hard'
        ? 'nav-v2-diff-bad'
        : 'nav-v2-diff-warn'

  function handleStartClick() {
    onClose()
    if (onStart) {
      onStart()
    } else {
      navigate('/lobby')
    }
  }

  function handleLobbyClick() {
    onClose()
    navigate('/lobby')
  }

  const content = (
    <div
      ref={panelRef}
      className={isMobile ? 'nav-v2-daily-sheet' : 'nav-v2-daily-popover'}
      role="dialog"
      aria-label="Daily challenge"
    >
      {/* 1. Overline & Countdown */}
      <div className="nav-v2-daily-top-row">
        <span className="nav-v2-daily-overline">Daily challenge</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="nav-v2-daily-reset">Resets in {countdown}</span>
          {isMobile && (
            <button
              type="button"
              className="nav-v2-sheet-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <IconClose size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Problem Title & Metadata */}
      <div>
        <h3
          ref={titleRef}
          tabIndex={-1}
          className="nav-v2-daily-title"
        >
          {title}
        </h3>
        <div className="nav-v2-daily-meta" style={{ marginTop: '4px' }}>
          <span className="nav-v2-daily-topic">{topic}</span>
          <span>·</span>
          <span className={`nav-v2-daily-diff ${diffClass}`}>{difficulty}</span>
        </div>
      </div>

      {/* 3. Task Preview */}
      <p
        className="nav-v2-daily-preview"
        title={rawDescription}
      >
        {previewText}
      </p>

      {/* 4. Mode Line */}
      <div className="nav-v2-daily-mode-line">
        Ranked duel. Same rating rules as other matches.
      </div>

      {/* 5. Streak Line */}
      <div className="nav-v2-daily-streak-line">
        {streak} day streak, best {bestStreak}
      </div>

      {/* 6. Actions */}
      <div className="nav-v2-daily-actions">
        <button
          type="button"
          id="nav-daily-start-btn"
          className="nav-v2-daily-start-btn"
          onClick={handleStartClick}
        >
          Start
        </button>
        <button
          type="button"
          className="nav-v2-daily-lobby-link"
          onClick={handleLobbyClick}
        >
          View in Lobby
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="nav-v2-sheet-scrim" onClick={onClose} aria-hidden="true" />
        {content}
      </>
    )
  }

  return content
}

