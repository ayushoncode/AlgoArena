import React, { useMemo } from 'react'

/**
 * IntelInsightsStrip: Plain ruled summary computed purely from loaded list
 * ──────────────────────────────────────────────────────────────────────────
 * Shows "Most reported companies" and "Most asked topics".
 * Hidden if reports list is small (< 4). Zero network requests.
 */
export default function IntelInsightsStrip({ reports }) {
  const insights = useMemo(() => {
    if (!reports || reports.length < 4) return null

    // Compute top companies
    const companyCounts = {}
    reports.forEach((r) => {
      if (r.company) {
        const name = r.company.trim()
        companyCounts[name] = (companyCounts[name] || 0) + 1
      }
    })
    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    // Compute top topics across all rounds & questions
    const topicCounts = {}
    reports.forEach((r) => {
      if (Array.isArray(r.rounds)) {
        r.rounds.forEach((rnd) => {
          if (Array.isArray(rnd.questions)) {
            rnd.questions.forEach((q) => {
              if (q.topic) {
                const t = q.topic.trim()
                topicCounts[t] = (topicCounts[t] || 0) + 1
              }
            })
          }
        })
      }
    })
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    if (topCompanies.length === 0 && topTopics.length === 0) return null

    return { topCompanies, topTopics }
  }, [reports])

  if (!insights) return null

  return (
    <div className="intel-insights-strip" aria-label="Loaded report insights">
      {insights.topCompanies.length > 0 && (
        <div className="intel-insights-block">
          <h2 className="intel-insights-title">Most reported companies</h2>
          <ul className="intel-insights-list">
            {insights.topCompanies.map(([comp, count]) => (
              <li key={comp} className="intel-insights-item">
                <span>{comp}</span>
                <span className="intel-insights-count">{count} {count === 1 ? 'report' : 'reports'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.topTopics.length > 0 && (
        <div className="intel-insights-block">
          <h2 className="intel-insights-title">Most asked topics</h2>
          <ul className="intel-insights-list">
            {insights.topTopics.map(([topic, count]) => (
              <li key={topic} className="intel-insights-item">
                <span>{topic}</span>
                <span className="intel-insights-count">{count} {count === 1 ? 'question' : 'questions'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
