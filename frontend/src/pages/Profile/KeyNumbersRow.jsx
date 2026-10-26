import React, { useMemo } from 'react'

export default function KeyNumbersRow({
  totalMatches = 0,
  wins = 0,
  losses = 0,
  wr = 0,
  streak = 0,
  activeDates = new Set(),
  favTopicTitle = 'None',
}) {
  // Compute best streak deterministically from activity dates
  const bestStreak = useMemo(() => {
    if (!activeDates || activeDates.size === 0) return streak || 0
    const sorted = Array.from(activeDates).sort()
    let max = 1
    let curr = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const next = new Date(sorted[i])
      const diff = Math.round((next - prev) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        curr++
        if (curr > max) max = curr
      } else if (diff > 1) {
        curr = 1
      }
    }
    return Math.max(max, streak || 0)
  }, [activeDates, streak])

  const topRow = [
    { label: 'MATCHES', val: totalMatches, color: '#ffffff', type: 'matches' },
    { label: 'WINS', val: wins, color: '#10b981', type: 'wins' },
    { label: 'LOSSES', val: losses, color: '#f43f5e', type: 'losses' },
    { label: 'WIN RATE', val: `${wr}%`, color: '#2dd4bf', type: 'winrate' },
  ]

  const bottomRow = [
    { label: 'CURRENT STREAK', val: streak, unit: streak === 1 ? 'day' : 'days', color: '#f59e0b', type: 'streak' },
    { label: 'BEST STREAK', val: bestStreak, unit: bestStreak === 1 ? 'day' : 'days', color: '#a855f7', type: 'beststreak' },
    { label: 'FAVOURITE TOPIC', val: favTopicTitle, color: '#38bdf8', type: 'topic', isTopic: true },
  ]

  return (
    <div className="profile-key-numbers-card">
      {/* Top 4-stat row */}
      <div className="key-numbers-grid-top">
        {topRow.map(c => (
          <div
            key={c.label}
            className={`key-stat-cell key-stat-${c.type}`}
            style={{ '--accent-col': c.color }}
          >
            <span className="key-stat-label">{c.label}</span>
            <span className="key-stat-value" style={{ color: c.color }}>
              {typeof c.val === 'number' ? Number(c.val).toLocaleString() : c.val}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom 3-stat row */}
      <div className="key-numbers-grid-bottom">
        {bottomRow.map(c => (
          <div
            key={c.label}
            className={`key-stat-cell key-stat-${c.type}`}
            style={{ '--accent-col': c.color }}
          >
            <span className="key-stat-label">{c.label}</span>
            <span
              className={`key-stat-value ${c.isTopic ? 'topic-val' : ''}`}
              style={{ color: c.color }}
            >
              {typeof c.val === 'number' ? Number(c.val).toLocaleString() : c.val}
              {c.unit && <span className="key-stat-unit"> {c.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
