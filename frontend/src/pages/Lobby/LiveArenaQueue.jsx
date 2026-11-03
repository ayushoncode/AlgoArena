import React, { useState, useEffect } from 'react'
import { UserAvatar } from '../../utils/avatar'
import { getTierForRating } from '../../lib/tiers'
import { IconSwords } from '../../components/icons'
import api from '../../utils/api'

export default function LiveArenaQueue({
  user,
  queuing,
  onAcceptChallenge,
  onCancelQueue,
  on,
  off,
  emit,
}) {
  const [challenges, setChallenges] = useState([])
  const [now, setNow] = useState(Date.now())

  // 1. Initial fetch from /api/matches/live-queue
  useEffect(() => {
    let mounted = true
    api.get('/api/matches/live-queue')
      .then(({ data }) => {
        if (mounted && Array.isArray(data)) {
          setChallenges(data)
        }
      })
      .catch(() => {
        // Fallback silently if endpoint is unavailable
      })
    return () => { mounted = false }
  }, [])

  // 2. Real-time updates from WebSocket 'live_queue_update'
  useEffect(() => {
    if (!on || !off) return

    function handleLiveQueue(data) {
      if (Array.isArray(data)) {
        setChallenges(data)
      }
    }

    on('live_queue_update', handleLiveQueue)
    if (emit) {
      emit('get_live_queue')
    }

    return () => {
      off('live_queue_update', handleLiveQueue)
    }
  }, [on, off, emit])

  // 3. 1-second interval to update waiting time display
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function formatWaitTime(queuedAt) {
    if (!queuedAt) return 'Just now'
    const diffSec = Math.max(0, Math.floor((now - new Date(queuedAt).getTime()) / 1000))
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    return `${diffMin}m ago`
  }

  function getDiffColor(diff) {
    switch ((diff || '').toLowerCase()) {
      case 'easy':
        return '#22c55e'
      case 'hard':
        return '#f43f5e'
      case 'medium':
      default:
        return '#f59e0b'
    }
  }

  const activeRivals = challenges.filter(c => c.userId !== user?.id)
  const myQueueEntry = challenges.find(c => c.userId === user?.id)

  return (
    <section className="live-arena-queue" aria-label="Live Arena Queue Activity">
      <div className="live-queue-bar">
        {/* Radar Status Header */}
        <div className="live-queue-header">
          <span className="live-queue-beacon" aria-hidden="true">
            <span className={challenges.length > 0 ? "live-queue-pulse" : ""} />
            <span className={`live-queue-dot ${challenges.length === 0 ? "is-idle" : ""}`} />
          </span>
          <span className="live-queue-title">Live Duels</span>
          <span className={`live-queue-count-pill ${challenges.length === 0 ? "is-idle" : ""}`}>
            {challenges.length} active
          </span>
        </div>

        {/* Challenge Cards / Idle Status */}
        <div className="live-queue-feed">
          {challenges.length > 0 ? (
            challenges.map((c) => {
              const isMe = c.userId === user?.id
              const tier = getTierForRating(c.rating || 1200)
              const diffColor = getDiffColor(c.difficulty)

              return (
                <div
                  key={c.id || `${c.userId}-${c.bucketKey}`}
                  className={`live-challenge-card ${isMe ? 'is-my-challenge' : ''}`}
                >
                  <div className="live-challenge-user">
                    <UserAvatar
                      username={c.username || 'Warrior'}
                      seed={c.avatarSeed}
                      style={c.avatarStyle}
                      elo={c.rating || 1200}
                      size={24}
                    />
                    <div className="live-challenge-meta">
                      <span className="live-challenge-name">
                        {c.username || 'Warrior'}
                        {isMe && <span className="live-challenge-you-tag">You</span>}
                      </span>
                      <span className="live-challenge-rating" style={{ color: tier.color }}>
                        {c.rating || 1200} Elo
                      </span>
                    </div>
                  </div>

                  <div className="live-challenge-target">
                    {c.problemTitle ? (
                      <span className="live-challenge-topic truncate" title={c.problemTitle}>
                        {c.problemTitle}
                      </span>
                    ) : (
                      <span className="live-challenge-topic">
                        {(c.topic || 'General').replace(/[-_]/g, ' ')}
                      </span>
                    )}
                    <span
                      className="live-challenge-diff-pill"
                      style={{ color: diffColor, borderColor: `${diffColor}44` }}
                    >
                      {c.difficulty || 'medium'}
                    </span>
                    <span className="live-challenge-timer">
                      {formatWaitTime(c.queuedAt)}
                    </span>
                  </div>

                  <div className="live-challenge-actions">
                    {isMe ? (
                      <button
                        type="button"
                        onClick={onCancelQueue}
                        className="btn-cancel-challenge"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAcceptChallenge && onAcceptChallenge(c)}
                        className="btn-accept-challenge"
                        title="Accept this duel instantly"
                      >
                        <IconSwords size={12} />
                        <span>Accept Duel</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="live-queue-empty">
              <span className="live-queue-empty-text">
                No one is dueling right now
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
