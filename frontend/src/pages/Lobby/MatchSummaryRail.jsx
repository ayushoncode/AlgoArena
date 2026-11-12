import React from 'react'

const SWINGS = {
  easy: { win: '+12 Elo', lose: '−12 Elo' },
  medium: { win: '+18 Elo', lose: '−18 Elo' },
  hard: { win: '+25 Elo', lose: '−25 Elo' }
}

export default function MatchSummaryRail({
  selectedTopicObj,
  selectedTopicId,
  diff,
  diffObj,
  onStartQueue,
  queuing,
  isAuthenticated = true,
}) {
  const swings = SWINGS[diff] || SWINGS.medium

  return (
    <aside className="lobby-v2-rail-col" aria-label="Match Summary and Deployment">
      <div className="lobby-v2-rail-card">
        <h3 className="lobby-v2-rail-title">Match summary</h3>

        <dl className="lobby-v2-summary-dl">
          <dt className="lobby-v2-summary-dt">Topic</dt>
          <dd className="lobby-v2-summary-dd">
            {selectedTopicObj ? selectedTopicObj.label : 'Any topic'}
          </dd>

          <dt className="lobby-v2-summary-dt">Difficulty</dt>
          <dd className="lobby-v2-summary-dd">
            {diffObj ? diffObj.label : 'Medium'}
          </dd>

          <dt className="lobby-v2-summary-dt">Win</dt>
          <dd className="lobby-v2-summary-dd is-mono is-win">
            {swings.win}
          </dd>

          <dt className="lobby-v2-summary-dt">Lose</dt>
          <dd className="lobby-v2-summary-dd is-mono is-loss">
            {swings.lose}
          </dd>
        </dl>

        <button
          id="find-match-btn"
          type="button"
          className="lobby-v2-deploy-btn"
          onClick={onStartQueue}
          disabled={isAuthenticated && (!selectedTopicId || queuing)}
        >
          {!isAuthenticated
            ? 'Sign in to Play'
            : selectedTopicId
              ? 'Find Match'
              : 'Choose a topic to begin'}
        </button>

        {!isAuthenticated ? (
          <p className="lobby-v2-disabled-hint" style={{ color: 'var(--feat, #ffd696)' }}>
            Sign in to access the arena and enter matchmaking
          </p>
        ) : !selectedTopicId ? (
          <p className="lobby-v2-disabled-hint">
            Please select a topic from above
          </p>
        ) : null}
      </div>
    </aside>
  )
}
