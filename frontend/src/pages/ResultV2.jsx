import React, { useState, useEffect } from 'react'
import { UserAvatar } from '../utils/avatar'
import { getTierForRating } from '../lib/tiers'
import { useTheme } from '../context/ThemeContext'
import { getDailyChallenge, clearStreakCache } from '../components/navbar/navData'
import './ResultV2.css'

function CheckIcon({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  )
}

function CopyIcon({ size = 12, className = '' }) {
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
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" />
    </svg>
  )
}

function formatTopic(rawTopic) {
  if (!rawTopic || rawTopic === '—' || rawTopic === '-') return 'General'
  return String(rawTopic)
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function formatDifficulty(diff) {
  const d = String(diff || 'medium').toLowerCase()
  if (d === 'easy') return { label: 'Easy', color: 'var(--ok, #10b981)' }
  if (d === 'hard') return { label: 'Hard', color: 'var(--bad, #f43f5e)' }
  return { label: 'Medium', color: 'var(--warn, #f59e0b)' }
}

function getEndCauseText({ isWin, isDraw, isLoss, state, user, oppData }) {
  if (state?.isForfeit) {
    if (state.forfeitUser && user?.username && state.forfeitUser.toLowerCase() === user.username.toLowerCase()) {
      return 'You resigned'
    }
    return 'Rival resigned'
  }
  if (isDraw || state?.result === 'DRAW') {
    return 'Time ran out'
  }
  if (state?.winner?.reason === 'timeout' || state?.reason === 'timeout') {
    return 'Time ran out'
  }
  if (state?.winner?.reason === 'disconnect' || state?.reason === 'disconnect' || oppData?.disconnected) {
    return 'Rival left the match'
  }
  if (isWin) {
    return 'You solved it first'
  }
  if (isLoss) {
    return 'Rival solved it first'
  }
  return 'Match concluded'
}

function AnimatedRating({ value, fromValue }) {
  const [displayValue, setDisplayValue] = useState(fromValue ?? value)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value)
      return
    }
    const start = fromValue ?? value
    const end = value
    if (start === end) {
      setDisplayValue(end)
      return
    }

    const duration = 500
    const startTime = performance.now()

    let frameId
    function update(now) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      }
    }

    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [value, fromValue])

  return <span>{displayValue}</span>
}

export default function ResultV2({
  user,
  state,
  isWin,
  isDraw,
  isLoss,
  myData,
  oppData,
  fromRating,
  toRating,
  myDelta,
  isCustomMatch,
  topic,
  difficulty,
  onPlayAgain,
  onViewProfile,
  onBackToLobby,
}) {
  const [copied, setCopied] = useState(false)

  // Record daily problem completion immediately if this match was today's daily quest
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10)
      const problemTitle = state?.problemTitle || state?.matchState?.problem?.title || state?.matchState?.problem_title || state?.title
      const currentUserId = user?.id || user?._id || user?.user_id || user?.username
      if (currentUserId && problemTitle && typeof window !== 'undefined' && window.localStorage) {
        getDailyChallenge().then(daily => {
          if (daily?.title && daily.title.toLowerCase() === String(problemTitle).toLowerCase()) {
            localStorage.setItem(`aa_daily_done_${currentUserId}_${todayStr}`, 'true')
            clearStreakCache()
          }
        }).catch(() => {})
      }
    } catch { }
  }, [state, user])

  const endCauseText = getEndCauseText({ isWin, isDraw, isLoss, state, user, oppData })
  const formattedTopic = formatTopic(topic)
  const diffCfg = formatDifficulty(difficulty)

  const { theme } = useTheme()
  const oldTier = getTierForRating(fromRating)
  const newTier = getTierForRating(toRating)
  const tierColor = theme === 'light' && newTier.code === 'NOV' ? '#475569' : newTier.color
  const tierChanged = !isCustomMatch && oldTier.name !== newTier.name
  const isPromotion = toRating > fromRating

  const outcomeWord = isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat'
  const outcomeClass = isWin
    ? 'result-v2__outcome--win'
    : isDraw
    ? 'result-v2__outcome--draw'
    : 'result-v2__outcome--loss'

  const metaLabel = state?.isForfeit
    ? 'Match Forfeited'
    : isCustomMatch
    ? 'Casual Duel'
    : isDraw
    ? 'Time Expired'
    : 'Ranked Match'

  const cleanRoomId = state?.roomId ? String(state.roomId).replace(/^room:/, '') : 'match'

  const handleCopyRoomId = () => {
    if (!state?.roomId) return
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanRoomId).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="result-v2">
      <div className="result-v2__container">
        <div className="result-v2__panel">
          {/* Header */}
          <div className="result-v2__header">
            <p className="result-v2__meta-label">{metaLabel}</p>
            <h1 className={`result-v2__outcome-title ${outcomeClass}`}>{outcomeWord}</h1>
            <p className="result-v2__end-cause-line">{endCauseText}</p>
          </div>

          {/* Players VS */}
          <div className="result-v2__players">
            <div className="result-v2__player">
              <UserAvatar
                username={user?.username}
                seed={user?.avatar_seed}
                style={user?.avatar_style}
                size={36}
                isMe={true}
              />
              <div className="result-v2__player-meta">
                <div className="result-v2__player-name-row">
                  <span className="result-v2__player-name font-mono font-bold">
                    {user?.username ?? 'You'}
                  </span>
                  <span className="result-v2__you-pill font-mono">You</span>
                  {isWin && (
                    <span className="result-v2__winner-check" title="Winner">
                      <CheckIcon size={10} />
                    </span>
                  )}
                </div>
                <span className="result-v2__player-rating font-mono text-xs">{fromRating}</span>
              </div>
            </div>

            <span className="result-v2__vs font-mono text-xs uppercase" aria-hidden="true">
              vs
            </span>

            <div className="result-v2__player result-v2__player--rival">
              <div className="result-v2__player-meta text-right">
                <div className="result-v2__player-name-row justify-end">
                  {!isWin && !isDraw && (
                    <span className="result-v2__winner-check" title="Winner">
                      <CheckIcon size={10} />
                    </span>
                  )}
                  <span className="result-v2__rival-name font-mono font-bold">
                    {oppData?.username ?? 'Opponent'}
                  </span>
                </div>
                <span className="result-v2__player-rating font-mono text-xs">
                  {oppData?.rating ?? 1200}
                </span>
              </div>
              <UserAvatar
                username={oppData?.username}
                seed={oppData?.avatar_seed}
                style={oppData?.avatar_style}
                size={36}
                isMe={false}
              />
            </div>
          </div>

          {/* Rating Change */}
          <div className="result-v2__rating-section">
            <p className="result-v2__meta-label">Rating Change</p>
            {isCustomMatch ? (
              <div className="result-v2__rating-block">
                <span className="result-v2__rating-new font-mono" style={{ color: tierColor }}>{fromRating}</span>
                <span className="result-v2__delta font-mono font-bold" style={{ color: 'var(--c-text-mute, #64748b)' }}>
                  Unranked
                </span>
              </div>
            ) : (
              <div className="result-v2__rating-block">
                <span className="result-v2__rating-old">{fromRating}</span>
                <span className="result-v2__rating-arrow" aria-hidden="true">
                  →
                </span>
                <span className="result-v2__rating-new" style={{ color: tierColor }}>
                  <AnimatedRating value={toRating} fromValue={fromRating} />
                </span>
                <span
                  className="result-v2__delta font-mono font-bold"
                  style={{ color: myDelta >= 0 ? 'var(--ok, #10b981)' : 'var(--bad, #f43f5e)' }}
                >
                  ({myDelta > 0 ? `+${myDelta}` : `${myDelta}`})
                </span>
              </div>
            )}

            {!isCustomMatch && (
              <div className="result-v2__tier-line" style={{ color: tierColor, borderColor: `${tierColor}40` }}>
                <newTier.Mark size={14} />
                <span className="font-mono text-xs font-semibold" style={{ color: tierColor }}>
                  {newTier.name}
                </span>
              </div>
            )}

            {tierChanged && (
              <div
                className="result-v2__tier-change font-mono text-xs font-medium"
                style={{ color: isPromotion ? 'var(--ok, #10b981)' : 'var(--bad, #f43f5e)' }}
              >
                {isPromotion ? `Promoted to ${newTier.name}` : `Dropped to ${newTier.name}`}
              </div>
            )}
          </div>

          {/* Details Definition List */}
          <dl className="result-v2__details">
            <div className="result-v2__detail-row">
              <dt className="result-v2__detail-label">Topic</dt>
              <dd className="result-v2__detail-value">{formattedTopic}</dd>
            </div>
            <div className="result-v2__detail-row">
              <dt className="result-v2__detail-label">Difficulty</dt>
              <dd className="result-v2__detail-value" style={{ color: diffCfg.color }}>
                {diffCfg.label}
              </dd>
            </div>
            <div className="result-v2__detail-row">
              <dt className="result-v2__detail-label">Result detail</dt>
              <dd className="result-v2__detail-value">{endCauseText}</dd>
            </div>
            <div className="result-v2__detail-row">
              <dt className="result-v2__detail-label">Room ID</dt>
              <dd className="result-v2__detail-value result-v2__room-cell">
                <span className="font-mono">{cleanRoomId}</span>
                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  className="result-v2__copy-btn"
                  aria-label={copied ? 'Copied room ID' : 'Copy room ID'}
                >
                  {copied ? (
                    <>
                      <CheckIcon size={10} />
                      <span aria-live="polite">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </dd>
            </div>
          </dl>
        </div>

        {/* Action Buttons */}
        <div className="result-v2__actions">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="result-v2__btn-primary"
          >
            Play again
          </button>
          <button
            id="view-profile-btn"
            onClick={onViewProfile}
            className="result-v2__btn-secondary"
          >
            View profile
          </button>
        </div>

        {/* Tertiary action */}
        <div className="result-v2__tertiary">
          <button
            type="button"
            onClick={onBackToLobby}
            className="result-v2__link"
          >
            Back to lobby
          </button>
        </div>

        {/* Loss plain note */}
        {isLoss && (
          <p className="result-v2__loss-note">Study the topic and rematch</p>
        )}
      </div>
    </div>
  )
}

