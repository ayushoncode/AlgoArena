import React, { useState, useEffect } from 'react'
import { UserAvatar } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'
import { IconShield } from '../../components/icons'
import './Leaderboard.css'

function CountUpNumber({ value, isInitialMount }) {
  const [displayVal, setDisplayVal] = useState(() => (isInitialMount ? Math.max(0, value - 120) : value))

  useEffect(() => {
    if (!isInitialMount) {
      setDisplayVal(value)
      return
    }

    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplayVal(value)
      return
    }

    const startVal = Math.max(0, value - 120)
    const duration = 500
    const startTimestamp = performance.now()
    let rafId = null

    const step = (now) => {
      const elapsed = now - startTimestamp
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (value - startVal) * ease)
      setDisplayVal(current)

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        setDisplayVal(value)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [value, isInitialMount])

  return <>{displayVal}</>
}

export default function PodiumPlinth({ rank, player, isInitialMount, onSelect }) {
  const isFirst = rank === 1
  const isEmpty = !player
  const tier = player ? getEloTier(player.elo_rating) : null
  const TierMark = tier ? tier.Mark : null

  const totalMatches = player ? (player.wins ?? 0) + (player.losses ?? 0) : 0
  const winRate = totalMatches > 0 ? Math.round(((player.wins ?? 0) / totalMatches) * 100) : 0

  const ariaLabel = isEmpty
    ? `Rank ${rank}, Open`
    : `Rank ${rank}, ${player.username}, ${player.elo_rating} rating${player.institute ? `, ${player.institute}` : ''}`

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isEmpty && onSelect) {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      className={`lb-plinth-wrap plinth-rank-${rank} ${isEmpty ? 'is-open-spot' : ''}`}
      onClick={!isEmpty ? onSelect : undefined}
      onKeyDown={handleKeyDown}
      role={!isEmpty ? 'link' : undefined}
      tabIndex={!isEmpty ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {/* Plinth Card Head */}
      <div className="lb-plinth-card">
        {isEmpty ? (
          <>
            <div className="lb-plinth-top-block">
              <div className="lb-plinth-left-cluster">
                <span className="lb-phone-rank">#{rank}</span>
                <div className="lb-plinth-avatar is-empty">
                  <span className="lb-empty-dash">-</span>
                </div>
                <div className="lb-plinth-identity">
                  <div className="lb-plinth-user is-empty">Open</div>
                </div>
              </div>
              <div className="lb-plinth-rating is-empty">--</div>
            </div>
            <div className="lb-plinth-meta is-empty">
              <span>Unclaimed</span>
            </div>
          </>
        ) : (
          <>
            <div className="lb-plinth-top-block">
              <div className="lb-plinth-left-cluster">
                <span className="lb-phone-rank">#{rank}</span>
                <div
                  className={`lb-plinth-avatar ${isFirst ? 'is-first-avatar' : ''}`}
                  style={{ borderColor: isFirst ? 'rgba(255, 214, 150, 0.7)' : tier.color }}
                >
                  <UserAvatar
                    username={player.username}
                    seed={player.avatar_seed}
                    style={player.avatar_style}
                    elo={player.elo_rating}
                    size={isFirst ? 64 : 52}
                  />
                </div>
                <div className="lb-plinth-identity">
                  <div className="lb-plinth-user">{player.username}</div>
                  {player.institute && (
                    <div className="lb-plinth-institute" title={player.institute}>
                      <IconShield size={11} className="lb-institute-shield" />
                      <span className="lb-institute-text">{player.institute}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="lb-plinth-rating" style={{ color: tier.color }}>
                <CountUpNumber value={player.elo_rating} isInitialMount={isInitialMount} />
              </div>
            </div>

            <div className="lb-plinth-meta">
              <span className="lb-plinth-tier" style={{ color: tier.color }}>
                {TierMark && <TierMark size={12} className="lb-tier-icon" />}
                <span>{tier.name}</span>
              </span>
              <div className="lb-plinth-stats-group">
                <span className="lb-plinth-record">{player.wins ?? 0}W {player.losses ?? 0}L</span>
                <span className="lb-plinth-sep">·</span>
                <span className="lb-plinth-wr">{winRate}% WR</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3D Pedestal Body */}
      <div className={`lb-plinth-pedestal plinth-pedestal-${rank}`} aria-hidden="true">
        <div className="lb-pedestal-top-cap" />
        <div className="lb-pedestal-left-bevel" />
        <div className="lb-pedestal-right-bevel" />
        <div className="lb-plinth-front-face">
          <span className="lb-plinth-num">{rank}</span>
        </div>
      </div>
    </div>
  )
}
