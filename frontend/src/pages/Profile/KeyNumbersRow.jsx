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
  // bestStreak and favTopicTitle are retained as props for data integrity
  // but the bottom row (streak/topic boxes) is intentionally not rendered

  const topRow = [
    { label: 'MATCHES', val: totalMatches, color: '#ffffff', type: 'matches' },
    { label: 'WINS', val: wins, color: '#10b981', type: 'wins' },
    { label: 'LOSSES', val: losses, color: '#f43f5e', type: 'losses' },
    { label: 'WIN RATE', val: `${wr}%`, color: '#2dd4bf', type: 'winrate' },
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
    </div>
  )
}
