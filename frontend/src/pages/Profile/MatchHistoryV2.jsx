import React, { useState, useMemo } from 'react'
import { UserAvatar } from '../../utils/avatar'

export default function MatchHistoryV2({ matches = [], onNavigate }) {
  const [resultFilter, setResultFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')

  // Extract unique topics from matches for the filter dropdown
  const uniqueTopics = useMemo(() => {
    const set = new Set()
    matches.forEach(m => {
      if (m.topic) set.add(m.topic)
    })
    return Array.from(set).sort()
  }, [matches])

  // Filter matches client-side
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      const res = (m.result || '').toUpperCase()
      const isWin = res === 'WIN' || res === 'VICTORY'
      const isLoss = res === 'LOSS' || res === 'DEFEAT'

      if (resultFilter === 'win' && !isWin) return false
      if (resultFilter === 'loss' && !isLoss) return false
      if (topicFilter !== 'all' && m.topic !== topicFilter) return false

      return true
    })
  }, [matches, resultFilter, topicFilter])

  return (
    <div className="profile-history-card">
      {/* 1. Header & Client-Side Filter Row */}
      <div className="profile-history-header">
        <div className="section-heading-row" style={{ borderBottom: 'none', padding: 0, margin: 0 }}>
          <h2 className="section-title">Match history</h2>
          <span className="profile-history-count">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {matches.length > 0 && (
          <div className="profile-history-filters">
            {/* Result Filter Segmented Control */}
            <div className="profile-filter-tabs" role="tablist" aria-label="Filter by result">
              <button
                type="button"
                role="tab"
                aria-selected={resultFilter === 'all'}
                className={`profile-filter-tab ${resultFilter === 'all' ? 'active' : ''}`}
                onClick={() => setResultFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resultFilter === 'win'}
                className={`profile-filter-tab ${resultFilter === 'win' ? 'active' : ''}`}
                onClick={() => setResultFilter('win')}
              >
                Wins
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resultFilter === 'loss'}
                className={`profile-filter-tab ${resultFilter === 'loss' ? 'active' : ''}`}
                onClick={() => setResultFilter('loss')}
              >
                Losses
              </button>
            </div>

            {/* Topic Filter Select */}
            {uniqueTopics.length > 0 && (
              <select
                className="profile-filter-select"
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                aria-label="Filter by topic"
              >
                <option value="all">All topics</option>
                {uniqueTopics.map(t => (
                  <option key={t} value={t}>
                    {t.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* 2. Ruled Table Container */}
      <div className="profile-history-table-container overflow-y-auto" data-testid="match-history-scroll">
        {matches.length === 0 ? (
          <div className="profile-history-empty">
            <p className="profile-empty-text">No matches yet. Play your first one in the Lobby.</p>
            <button
              type="button"
              className="btn-action"
              onClick={() => onNavigate && onNavigate('/lobby')}
              style={{ background: 'var(--ink)', color: 'var(--bg-0)', fontWeight: 600, padding: '8px 16px', marginTop: 12 }}
            >
              Go to Lobby
            </button>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="profile-history-empty">
            <p className="profile-empty-text">No matches match the selected filter.</p>
            <button
              type="button"
              className="btn-action"
              onClick={() => {
                setResultFilter('all')
                setTopicFilter('all')
              }}
              style={{ padding: '6px 12px', marginTop: 8 }}
            >
              Reset filter
            </button>
          </div>
        ) : (
          <table className="profile-match-table" aria-label="Player match history">
            <thead className="profile-match-thead">
              <tr>
                <th scope="col" className="th-result">Result</th>
                <th scope="col" className="th-opponent">Opponent</th>
                <th scope="col" className="th-topic">Topic</th>
                <th scope="col" className="th-diff">Difficulty</th>
                <th scope="col" className="th-delta">Elo change</th>
                <th scope="col" className="th-date">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((m, idx) => {
                const res = (m.result || '').toUpperCase()
                const isWin = res === 'WIN' || res === 'VICTORY'
                const isLoss = res === 'LOSS' || res === 'DEFEAT'
                const isDraw = res === 'DRAW'
                const label = isWin ? 'Win' : isLoss ? 'Loss' : isDraw ? 'Draw' : (m.result || 'Duel')

                const deltaNum = Number(m.elo_delta || 0)
                const deltaStr = m.elo_delta != null ? (deltaNum > 0 ? `+${deltaNum}` : `${deltaNum}`) : '0'

                const dateStr = m.ended_at
                  ? new Date(m.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Recent'

                const topicStr = m.topic
                  ? m.topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : 'Custom Duel'

                const diffStr = m.difficulty
                  ? m.difficulty.charAt(0).toUpperCase() + m.difficulty.slice(1).toLowerCase()
                  : 'Medium'

                const opponentName = m.opponent || 'Opponent'

                return (
                  <tr
                    key={m.id || idx}
                    className={`profile-match-row ${isWin ? 'row-win' : isLoss ? 'row-loss' : 'row-draw'}`}
                    style={{
                      borderLeft: `3px solid ${isWin ? '#10b981' : isLoss ? '#f43f5e' : '#f59e0b'}`,
                    }}
                  >
                    {/* Desktop / Standard Cells */}
                    <td className="td-result">
                      <div className={`result-pill ${isWin ? 'result-pill-win' : isLoss ? 'result-pill-loss' : 'result-pill-draw'}`}>
                        {isWin ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="2.5 6.5 5 9 9.5 3.5" />
                          </svg>
                        ) : isLoss ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="3" y1="3" x2="9" y2="9" />
                            <line x1="9" y1="3" x2="3" y2="9" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <line x1="3" y1="6" x2="9" y2="6" />
                          </svg>
                        )}
                        <span>{label}</span>
                      </div>
                    </td>

                    <td className="td-opponent">
                      <div className="opponent-cell">
                        <UserAvatar username={opponentName} seed={m.opponent_avatar_seed || m.avatar_seed} style={m.opponent_avatar_style || m.avatar_style} size={22} />
                        <a
                          href={`/profile/${encodeURIComponent(opponentName)}`}
                          onClick={(e) => {
                            e.preventDefault()
                            if (onNavigate) onNavigate(`/profile/${encodeURIComponent(opponentName)}`)
                          }}
                          className="opponent-link"
                          title={`View @${opponentName}'s profile`}
                        >
                          @{opponentName}
                        </a>
                      </div>
                    </td>

                    <td className="td-topic">
                      <span className="topic-text">{topicStr}</span>
                    </td>

                    <td className="td-diff">
                      <span className="diff-text">{diffStr}</span>
                    </td>

                    <td className="td-delta">
                      <span
                        className="delta-mono"
                        style={{ color: deltaNum > 0 ? '#10b981' : deltaNum < 0 ? '#f43f5e' : 'var(--sub)' }}
                      >
                        {deltaStr}
                      </span>
                    </td>

                    <td className="td-date">
                      <span className="date-mono">{dateStr}</span>
                    </td>

                    {/* Mobile Two-Line Layout (shown under 700px via CSS) */}
                    <td className="td-mobile-layout" colSpan="6">
                      <div className="mobile-row-top">
                        <div className="mobile-result-opp">
                          <span className={`mobile-result ${isWin ? 'win' : isLoss ? 'loss' : ''}`}>{label}</span>
                          <UserAvatar username={opponentName} seed={m.opponent_avatar_seed || m.avatar_seed} style={m.opponent_avatar_style || m.avatar_style} size={18} />
                          <a
                            href={`/profile/${encodeURIComponent(opponentName)}`}
                            onClick={(e) => {
                              e.preventDefault()
                              if (onNavigate) onNavigate(`/profile/${encodeURIComponent(opponentName)}`)
                            }}
                            className="opponent-link"
                          >
                            @{opponentName}
                          </a>
                        </div>
                        <span
                          className="delta-mono"
                          style={{ color: deltaNum > 0 ? '#10b981' : deltaNum < 0 ? '#f43f5e' : 'var(--sub)' }}
                        >
                          {deltaStr}
                        </span>
                      </div>
                      <div className="mobile-row-bottom">
                        <span className="topic-text">{topicStr}</span>
                        <span className="meta-dot" aria-hidden="true">•</span>
                        <span className="diff-text">{diffStr}</span>
                        <span className="meta-dot" aria-hidden="true">•</span>
                        <span className="date-mono">{dateStr}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
