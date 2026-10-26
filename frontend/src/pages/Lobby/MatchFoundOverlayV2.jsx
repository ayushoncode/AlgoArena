import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { UserAvatar, getArenaTier } from '../../utils/avatar'
import './Lobby.css'

export default function MatchFoundOverlayV2({ matchData, onComplete }) {
  const { user } = useAuth()
  const [countdown, setCountdown] = useState(3)
  const [isFinishing, setIsFinishing] = useState(false)

  const players = matchData?.players || []
  const you = players.find(p => p.username === user?.username) || players[0] || { username: user?.username || 'You', rating: user?.elo_rating || 1200 }
  const opponent = players.find(p => p.username !== user?.username) || players[1] || { username: 'RivalCoder', rating: 1200 }

  const youRating = Number(you.rating) || 1200
  const oppRating = Number(opponent.rating) || 1200
  const youTier = getArenaTier(youRating)
  const oppTier = getArenaTier(oppRating)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          setIsFinishing(true)
          setTimeout(() => onComplete(), 350)
          return 0
        }
        return c - 1
      })
    }, 900)
    return () => clearInterval(timer)
  }, [onComplete])

  const topicLabel = matchData?.topic ? String(matchData.topic).toUpperCase() : 'GENERAL'
  const diffLabel = matchData?.difficulty ? String(matchData.difficulty).toUpperCase() : 'MEDIUM'

  return (
    <div
      role="region"
      aria-live="assertive"
      aria-label="Match found announcement"
      className={`lobby-v2-matchfound-overlay ${isFinishing ? 'is-finishing' : ''}`}
    >
      <div className="lobby-v2-matchfound-frame">
        {/* Banner */}
        <div className="lobby-v2-overlay-header">
          <span className="lobby-v2-overlay-kicker" style={{ color: 'var(--gold, #ffd696)' }}>
            Match Found · 1v1 Duel
          </span>
          <h2 className="lobby-v2-overlay-title">
            Entering battle arena.
          </h2>
          <p className="lobby-v2-overlay-subtitle">
            Topic: {topicLabel} / Difficulty: {diffLabel}
          </p>
        </div>

        {/* VS Face-Off Cards */}
        <div className="lobby-v2-clash-grid">
          {/* You */}
          <div className="lobby-v2-clash-card">
            <span className="lobby-v2-clash-tag" style={{ color: youTier.col }}>YOU</span>
            <div className="lobby-v2-clash-avatar">
              <UserAvatar
                username={you.username}
                seed={you.avatar_seed}
                style={you.avatar_style}
                elo={youRating}
                size={64}
              />
            </div>
            <h3 className="lobby-v2-clash-name">{you.username}</h3>
            <span className="lobby-v2-clash-rating" style={{ color: youTier.col }}>
              {youRating} Elo · {youTier.name}
            </span>
          </div>

          {/* Countdown & VS */}
          <div className="lobby-v2-clash-center">
            <span className="lobby-v2-clash-vs-label">VS</span>
            <div className="lobby-v2-countdown-circle">
              <span className="lobby-v2-countdown-num">
                {countdown > 0 ? countdown : 0}
              </span>
            </div>
            <span className="lobby-v2-countdown-status">
              {countdown > 0 ? 'Entering Arena' : 'Battle Starting'}
            </span>
          </div>

          {/* Opponent */}
          <div className="lobby-v2-clash-card">
            <span className="lobby-v2-clash-tag" style={{ color: oppTier.col }}>RIVAL</span>
            <div className="lobby-v2-clash-avatar">
              <UserAvatar
                username={opponent.username}
                seed={opponent.avatar_seed}
                style={opponent.avatar_style}
                elo={oppRating}
                size={64}
              />
            </div>
            <h3 className="lobby-v2-clash-name">{opponent.username}</h3>
            <span className="lobby-v2-clash-rating" style={{ color: oppTier.col }}>
              {oppRating} Elo · {oppTier.name}
            </span>
          </div>
        </div>

        <div className="lobby-v2-matchfound-footer">
          <span>Initializing battle workspace...</span>
        </div>
      </div>
    </div>
  )
}
