import React, { useMemo } from 'react'

export default function TopicBreakdownV2({
  topicFreq = {},
  matches = [],
}) {
  // Compute match counts and win rates per topic
  const topicStats = useMemo(() => {
    const statsMap = {}

    // First collect from matches
    if (Array.isArray(matches)) {
      matches.forEach(m => {
        if (!m.topic) return
        const key = m.topic
        if (!statsMap[key]) {
          statsMap[key] = { key, total: 0, wins: 0 }
        }
        statsMap[key].total++
        const res = (m.result || '').toUpperCase()
        if (res === 'WIN' || res === 'VICTORY') {
          statsMap[key].wins++
        }
      })
    }

    // Merge any topicFreq keys not in matches
    Object.entries(topicFreq).forEach(([key, count]) => {
      if (!statsMap[key]) {
        statsMap[key] = { key, total: count, wins: 0 }
      } else if (count > statsMap[key].total) {
        // topicFreq might have a larger historical count
        statsMap[key].total = count
      }
    })

    // Sort descending by total matches
    return Object.values(statsMap)
      .map(t => {
        const title = t.key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const winRate = t.total > 0 ? Math.round((t.wins / t.total) * 100) : 0
        return {
          ...t,
          title,
          winRate,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [topicFreq, matches])

  return (
    <div className="profile-topics-card">
      <div className="topics-card-header">
        <h3 className="section-title">Topics</h3>
        <span className="topics-count-badge">
          {topicStats.length} {topicStats.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {topicStats.length === 0 ? (
        <div className="profile-topics-empty">
          <p className="profile-empty-text">No topic data recorded yet.</p>
        </div>
      ) : (
        <div className="profile-topics-list">
          {topicStats.slice(0, 6).map((topic, index) => {
            const isMostPlayed = index === 0

            return (
              <div key={topic.key} className="profile-topic-row">
                <div className="topic-row-info">
                  <div className="topic-title-wrap">
                    <span className="topic-name">{topic.title}</span>
                    {isMostPlayed && (
                      <span className="topic-badge-most-played">Most played</span>
                    )}
                  </div>
                  <span className="topic-match-count">
                    {topic.total} {topic.total === 1 ? 'match' : 'matches'}
                  </span>
                </div>

                <div className="topic-bar-wrap">
                  <div className="topic-progress-track">
                    <div
                      className="topic-progress-fill"
                      style={{ width: `${Math.min(100, Math.max(0, topic.winRate))}%` }}
                    />
                  </div>
                  <span className="topic-win-rate-text">{topic.winRate}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
