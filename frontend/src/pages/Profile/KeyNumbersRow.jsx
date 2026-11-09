import React from 'react'
import { Link } from 'react-router-dom'

export default function KeyNumbersRow({
  totalMatches = 0,
  wins = 0,
  losses = 0,
  wr = 0,
  streak = 0,
  activeDates = new Set(),
  favTopicTitle = 'None',
  friendsCount = null,
  username = '',
  friendsHidden = false
}) {
  const topRow = [
    { label: 'MATCHES', val: totalMatches, color: 'var(--ink, #ffffff)', type: 'matches' },
    { label: 'WINS', val: wins, color: '#10b981', type: 'wins' },
    { label: 'LOSSES', val: losses, color: '#f43f5e', type: 'losses' },
    { label: 'WIN RATE', val: `${wr}%`, color: '#2dd4bf', type: 'winrate' },
  ]

  if (!friendsHidden) {
    topRow.push({
      label: 'FRIENDS',
      val: friendsCount ?? 0,
      color: 'var(--info, #38bdf8)',
      type: 'friends',
      link: username ? `/profile/${encodeURIComponent(username)}/friends` : null
    })
  }

  return (
    <div className="profile-key-numbers-card">
      {/* 5-stat responsive grid */}
      <div className="key-numbers-grid-top" style={{ gridTemplateColumns: `repeat(${topRow.length}, 1fr)` }}>
        {topRow.map(c => {
          const content = (
            <div
              key={c.label}
              className={`key-stat-cell key-stat-${c.type}`}
              style={{ '--accent-col': c.color }}
            >
              <span className="key-stat-label">{c.label}</span>
              <span className="key-stat-value" style={{ color: c.color, fontFamily: 'var(--font-mono, monospace)' }}>
                {typeof c.val === 'number' ? Number(c.val).toLocaleString() : c.val}
              </span>
            </div>
          )

          if (c.link) {
            return (
              <Link
                key={c.label}
                to={c.link}
                style={{ textDecoration: 'none', color: 'inherit', display: 'contents' }}
                title="View friends list"
              >
                {content}
              </Link>
            )
          }

          return content
        })}
      </div>
    </div>
  )
}
