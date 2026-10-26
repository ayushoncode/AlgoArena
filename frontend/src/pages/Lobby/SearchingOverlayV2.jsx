import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { UserAvatar, getArenaTier } from '../../utils/avatar'
import { IconClose } from '../../components/icons'
import './Lobby.css'

function useQueueTimer(running) {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!running) {
      setSec(0)
      return
    }
    const t = setInterval(() => setSec(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  return { sec, band: Math.floor(sec / 10) * 100 + 100 }
}

export default function SearchingOverlayV2({
  topic,
  difficulty = 'medium',
  rating = 1200,
  problem = null,
  onCancel,
}) {
  const { user } = useAuth()
  const { sec, band } = useQueueTimer(true)
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')

  const currentRating = Number(rating) || 1200
  const userTier = getArenaTier(currentRating)
  const username = user?.username || 'Player'

  // Rating search window calculations (Adaptive Window matching Homepage S2)
  const windowMin = Math.max(0, currentRating - band)
  const windowMax = currentRating + band
  // Ruler axis spans currentRating ± 400
  const halfSpanPercent = Math.min(48, (band / 800) * 100)
  const leftPercent = Math.max(2, 50 - halfSpanPercent)
  const rightPercent = Math.max(2, 50 - halfSpanPercent)

  const diffLabel = String(difficulty || 'medium').charAt(0).toUpperCase() + String(difficulty || 'medium').slice(1)
  const topicLabel = topic ? String(topic).charAt(0).toUpperCase() + String(topic).slice(1) : 'Any topic'

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Searching for rival matchmaking queue"
      className="lobby-v2-searching-overlay"
    >
      <div className="lobby-v2-searching-frame">
        {/* Overline & Heading */}
        <div className="lobby-v2-overlay-header">
          <span className="lobby-v2-overlay-kicker">Matchmaking Queue</span>
          <h2 className="lobby-v2-overlay-title">
            {problem ? 'Targeting specific duel' : 'Searching for a rival'}
          </h2>
          <p className="lobby-v2-overlay-subtitle">
            {problem ? (
              <>Locked on Striver problem: <strong style={{ color: 'var(--ink, #ffffff)' }}>{problem.title}</strong></>
            ) : (
              <>Scanning arena for opponents near your <strong style={{ color: userTier.col }}>{userTier.name} ({currentRating})</strong> rating.</>
            )}
          </p>
        </div>

        {/* Selected Match Parameters */}
        <div className="lobby-v2-searching-tags">
          <span className="lobby-v2-searching-tag">
            <span>Topic:</span>
            <strong>{topicLabel}</strong>
          </span>
          <span className="lobby-v2-searching-tag">
            <span>Difficulty:</span>
            <strong>{diffLabel}</strong>
          </span>
          <span className="lobby-v2-searching-tag">
            <span>Rating:</span>
            <strong>{currentRating}</strong>
          </span>
        </div>

        {/* Rating Search Ruler (Homepage S2 Adaptive Window) */}
        <div className="lobby-v2-ruler-block">
          <div className="ruler-title">RATING SEARCH AXIS (ADAPTIVE WINDOW)</div>
          <div className="ruler-axis">
            <div
              className="ruler-search-window"
              style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
            />
            {/* Tick marks */}
            <div className="ruler-tick major" style={{ left: '12.5%' }}>
              <span className="ruler-tick-label">{Math.max(0, currentRating - 300)}</span>
            </div>
            <div className="ruler-tick" style={{ left: '25%' }}>
              <span className="ruler-tick-label">{Math.max(0, currentRating - 200)}</span>
            </div>
            <div className="ruler-tick major" style={{ left: '37.5%' }}>
              <span className="ruler-tick-label">{Math.max(0, currentRating - 100)}</span>
            </div>
            <div className="ruler-tick major" style={{ left: '50%' }}>
              <span className="ruler-tick-label">{currentRating}</span>
            </div>
            <div className="ruler-tick major" style={{ left: '62.5%' }}>
              <span className="ruler-tick-label">{currentRating + 100}</span>
            </div>
            <div className="ruler-tick" style={{ left: '75%' }}>
              <span className="ruler-tick-label">{currentRating + 200}</span>
            </div>
            <div className="ruler-tick major" style={{ left: '87.5%' }}>
              <span className="ruler-tick-label">{currentRating + 300}</span>
            </div>

            {/* User marker pointer */}
            <div className="ruler-user-marker" style={{ left: '50%' }}>
              <span className="ruler-marker-label">YOU ({currentRating})</span>
              <div style={{ width: '2px', height: '14px', background: 'var(--gold, #ffd696)' }} />
            </div>
          </div>

          <div className="ruler-lock-notice">
            <span>Target window: {windowMin} - {windowMax} Elo (±{band})</span>
            <span style={{ color: 'var(--gold, #ffd696)' }}>Elapsed: {mm}:{ss}</span>
          </div>
        </div>

        {/* VS Face-Off Inspection Cards */}
        <div className="lobby-v2-searching-vs-grid">
          {/* You */}
          <div className="lobby-v2-vs-card is-you">
            <div className="lobby-v2-vs-avatar-wrap">
              <UserAvatar
                username={username}
                seed={user?.avatar_seed}
                style={user?.avatar_style}
                elo={currentRating}
                size={44}
              />
            </div>
            <div className="lobby-v2-vs-meta">
              <span className="lobby-v2-vs-role">You</span>
              <h4 className="lobby-v2-vs-name">{username}</h4>
              <span className="lobby-v2-vs-elo" style={{ color: userTier.col }}>
                {currentRating} Elo · {userTier.name}
              </span>
            </div>
          </div>

          {/* VS Divider + Tabular Timer */}
          <div className="lobby-v2-vs-center">
            <span className="lobby-v2-vs-badge">VS</span>
            <span className="lobby-v2-vs-timer">{mm}:{ss}</span>
          </div>

          {/* Opponent placeholder */}
          <div className="lobby-v2-vs-card is-opponent">
            <div className="lobby-v2-vs-placeholder-avatar">
              ?
            </div>
            <div className="lobby-v2-vs-meta">
              <span className="lobby-v2-vs-role">Rival</span>
              <h4 className="lobby-v2-vs-name">Matching...</h4>
              <span className="lobby-v2-vs-elo">
                ~{currentRating} Elo (Scanning)
              </span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="lobby-v2-searching-actions">
          <button
            type="button"
            onClick={onCancel}
            className="lobby-v2-cancel-btn"
          >
            <IconClose size={14} />
            <span>Cancel Queue</span>
          </button>
        </div>
      </div>
    </div>
  )
}
