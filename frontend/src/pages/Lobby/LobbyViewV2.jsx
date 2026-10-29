import React from 'react'
import LobbyHeader from './LobbyHeader'
import TopicGrid from './TopicGrid'
import DifficultySegment from './DifficultySegment'
import MatchSummaryRail from './MatchSummaryRail'
import QuickArenaThreeCol from './QuickArenaThreeCol'
import StriverSheetView from '../../components/StriverSheetView'
import { IconSwords, IconCheck, IconClose, IconCode, IconShield, IconTrophy, IconPlay } from '../../components/icons'
import striver3dAvatar from '../../assets/striver-3d.png'
import './Lobby.css'

function cleanPreview(raw) {
  if (!raw) return ''
  return raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+\s+.*$/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/Example \d+:[\s\S]*?(?=(Example \d+:|Constraints:|$))/gi, '')
    .replace(/Constraints:[\s\S]*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) + '...'
}

const SWINGS = {
  easy: { win: '+12 Elo', lose: '−12 Elo' },
  medium: { win: '+18 Elo', lose: '−18 Elo' },
  hard: { win: '+25 Elo', lose: '−25 Elo' }
}

export default function LobbyViewV2({
  // User & System
  user,
  connected,
  live,

  // Mode Selection
  lobbyTab = 'random',
  setLobbyTab,

  // Striver Sheet
  striverData,
  striverLoading,
  onBattleProblem,
  onBattleRandomFromSheet,
  queuingProblem,

  // Topics & Diff
  topics,
  topic,
  diff,
  selectedTopicObj,
  diffObj,

  // Handlers
  onSelectTopic,
  onSelectDiff,
  onStartQueue,
  onCancelQueue,
  onSurpriseMe,

  // Daily Challenge
  dailyProblem,
  dailyObj,
  isDailySelected,

  // Overlays & Modal
  queuing,
  matchFoundData,
  onMatchComplete,
  onOpenCustomModal,

  // Search Ref
  desktopSearchRef,
}) {
  const dailyPreviewText = dailyProblem?.description
    ? cleanPreview(dailyProblem.description)
    : 'Complete the featured algorithm problem to earn arena rating points.'

  const swings = SWINGS[diff] || SWINGS.medium

  const isLegacyQuickArena = typeof window !== 'undefined' && (
    window.location.search.includes('ui=legacy') ||
    window.location.search.includes('ui=2col')
  )

  return (
    <div className="lobby-v2">
      <main className="lobby-v2-main" id="lobby-v2-content">
        
        {/* 1. HEADER ROW */}
        <LobbyHeader
          user={user}
          connected={connected}
          live={live}
          desktopSearchRef={desktopSearchRef}
        />

        {/* 2. MODE SELECTOR (Quick Arena vs Striver Sheet vs Private Duel) */}
        <div className="lobby-v2-mode-selector">
          <button
            type="button"
            onClick={() => setLobbyTab && setLobbyTab('random')}
            className={`lobby-v2-mode-tab ${lobbyTab === 'random' ? 'is-active' : ''}`}
          >
            <IconSwords size={14} />
            <span><span className="hidden sm:inline">Quick Arena</span><span className="sm:hidden">Quick</span></span>
            <span className="lobby-v2-mode-pill">Topic & Diff</span>
          </button>

          <button
            type="button"
            onClick={() => setLobbyTab && setLobbyTab('striver')}
            className={`lobby-v2-mode-tab lobby-v2-striver-tab ${lobbyTab === 'striver' ? 'is-active' : ''}`}
          >
            <div className="lobby-v2-striver-mascot-wrap" aria-hidden="true">
              <img
                src={striver3dAvatar}
                alt=""
                className="lobby-v2-striver-mascot"
              />
            </div>
            <IconCode size={14} />
            <span><span className="hidden sm:inline">Striver A2Z Sheet</span><span className="sm:hidden">Striver</span></span>
            <span className="lobby-v2-mode-pill">Curriculum</span>
          </button>

          <button
            type="button"
            onClick={() => setLobbyTab && setLobbyTab('custom')}
            className={`lobby-v2-mode-tab ${lobbyTab === 'custom' ? 'is-active' : ''}`}
          >
            <IconShield size={14} />
            <span><span className="hidden sm:inline">Private Duel</span><span className="sm:hidden">Private</span></span>
            <span className="lobby-v2-mode-pill">Custom Room</span>
          </button>
        </div>

        {/* 3. CONTENT AREA */}
        {lobbyTab === 'custom' ? (
          <div className="lobby-v2-private-section">
            <div className="lobby-v2-private-hero">
              <div className="lobby-v2-overline">Head-to-head match</div>
              <h2 className="lobby-v2-private-title">Private Duels</h2>
              <p className="lobby-v2-private-subtitle">
                Host a private duel room with custom topics, or enter a peer's 6-character room code to clash head-to-head. Match results are unranked with zero Elo rating risk.
              </p>
            </div>

            <div className="lobby-v2-private-grid">
              {/* Card 1: Create a Room */}
              <div className="lobby-v2-private-card">
                <div>
                  <div className="lobby-v2-feature-head">
                    <span className="lobby-v2-feature-badge">Host Duel</span>
                    <span className="lobby-v2-feature-badge">Unranked</span>
                  </div>

                  <h3 className="lobby-v2-private-card-title">Create Private Room</h3>

                  <p className="lobby-v2-private-card-desc">
                    Choose a topic and difficulty, then generate a secret 6-character code to share with your rival.
                  </p>

                  {/* 1. Topic Picker */}
                  <div className="lobby-v2-private-picker-section">
                    <div className="lobby-v2-private-picker-head">
                      <span className="lobby-v2-private-picker-title">Choose Topic</span>
                      {selectedTopicObj && (
                        <span className="lobby-v2-private-picker-current">
                          {selectedTopicObj.label}
                        </span>
                      )}
                    </div>

                    <div className="lobby-v2-private-topic-chips" role="radiogroup" aria-label="Select duel topic">
                      {topics.map((t) => {
                        const isSelected = topic === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`lobby-v2-topic-chip ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => onSelectTopic(t.id)}
                          >
                            <span>{t.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {selectedTopicObj && (
                      <p className="lobby-v2-private-topic-desc">
                        {selectedTopicObj.desc}
                      </p>
                    )}
                  </div>

                  {/* 2. Difficulty Picker */}
                  <div className="lobby-v2-private-picker-section">
                    <div className="lobby-v2-private-picker-head">
                      <span className="lobby-v2-private-picker-title">Choose Difficulty</span>
                    </div>

                    <div className="lobby-v2-private-diff-row" role="radiogroup" aria-label="Select duel difficulty">
                      {[
                        { id: 'easy', label: 'Easy', dot: '#22c55e' },
                        { id: 'medium', label: 'Medium', dot: '#f59e0b' },
                        { id: 'hard', label: 'Hard', dot: '#f43f5e' },
                      ].map((d) => {
                        const isSelected = diff === d.id
                        return (
                          <button
                            key={d.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`lobby-v2-private-diff-btn ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => onSelectDiff(d.id)}
                          >
                            <span
                              className="lobby-v2-private-diff-dot"
                              style={{ background: d.dot }}
                              aria-hidden="true"
                            />
                            <span>{d.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="lobby-v2-btn-primary w-full"
                    onClick={() => {
                      if (!topic && topics.length > 0) {
                        onSelectTopic(topics[0].id)
                      }
                      onOpenCustomModal && onOpenCustomModal('create')
                    }}
                  >
                    <IconSwords size={14} />
                    <span>Create Room & Generate Code</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Join a Room */}
              <div className="lobby-v2-private-card">
                <div>
                  <div className="lobby-v2-feature-head">
                    <span className="lobby-v2-feature-badge">Challenger</span>
                    <span className="lobby-v2-feature-badge">Direct Connect</span>
                  </div>

                  <h3 className="lobby-v2-private-card-title">Join with Code</h3>

                  <p className="lobby-v2-private-card-desc">
                    Have a room code from a friend? Enter the 6-character room code to join their custom match and start coding instantly.
                  </p>

                  <div className="lobby-v2-private-rules">
                    <div className="lobby-v2-private-rule-item">
                      <span className="lobby-v2-status-dot is-connected" />
                      <span>Zero Elo rating penalty on defeat</span>
                    </div>
                    <div className="lobby-v2-private-rule-item">
                      <span className="lobby-v2-status-dot is-connected" />
                      <span>Live sync and real-time pass detection</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="lobby-v2-btn-secondary w-full"
                    style={{ height: '44px', justifyContent: 'center' }}
                    onClick={() => onOpenCustomModal && onOpenCustomModal('join')}
                  >
                    <IconShield size={14} />
                    <span>Enter Room Code</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : lobbyTab === 'striver' ? (
          <div className="lobby-v2-striver-wrap">
            <StriverSheetView
              striverData={striverData}
              loading={striverLoading}
              onBattleProblem={onBattleProblem}
              onBattleRandom={onBattleRandomFromSheet}
              queuingProblemId={queuingProblem?.id}
              isQueuing={queuing}
            />
          </div>
        ) : isLegacyQuickArena ? (
          /* 2-COLUMN MAIN GRID (8 columns left, 4 columns right rail) - Legacy Fallback */
          <div className="lobby-v2-grid">
            {/* LEFT CONTENT COLUMN */}
            <div className="lobby-v2-content-col">
              {/* Topic Selection Grid (9 primary cells) */}
              <TopicGrid
                topics={topics}
                selectedTopicId={topic}
                onSelectTopic={onSelectTopic}
                onSurpriseMe={onSurpriseMe}
              />

              {/* Difficulty Segment (Easy, Medium, Hard) */}
              <DifficultySegment
                selectedDiff={diff}
                onSelectDiff={onSelectDiff}
              />
            </div>

            {/* RIGHT SUMMARY RAIL (Sticky) */}
            <MatchSummaryRail
              selectedTopicObj={selectedTopicObj}
              selectedTopicId={topic}
              diff={diff}
              diffObj={diffObj}
              onStartQueue={onStartQueue}
              queuing={queuing}
            />
          </div>
        ) : (
          /* 3-COLUMN PRESENTATIONAL GRID (1 Topic, 2 Difficulty, 3 Match summary) */
          <QuickArenaThreeCol
            topics={topics}
            topic={topic}
            diff={diff}
            selectedTopicObj={selectedTopicObj}
            diffObj={diffObj}
            onSelectTopic={onSelectTopic}
            onSelectDiff={onSelectDiff}
            onStartQueue={onStartQueue}
            onSurpriseMe={onSurpriseMe}
            queuing={queuing}
          />
        )}

        {/* Mobile Sticky Quick Match Action Bar (Only for legacy 2-column fallback on mobile) */}
        {isLegacyQuickArena && lobbyTab !== 'striver' && lobbyTab !== 'custom' && (
          <aside className="lobby-v2-mobile-bottom-bar" aria-label="Mobile Quick Match Actions">
            <div className="lobby-v2-mobile-summary">
              <span className="lobby-v2-mobile-summary-topic">
                {selectedTopicObj ? selectedTopicObj.label : 'Any Topic'}
              </span>
              <span className="lobby-v2-mobile-summary-meta">
                <span>{diffObj ? diffObj.label : 'Medium'}</span>
                <span>·</span>
                <span style={{ color: '#22c55e' }}>{swings.win}</span>
                <span>·</span>
                <span style={{ color: '#ef4444' }}>{swings.lose}</span>
              </span>
            </div>
            <button
              id="mobile-find-match-btn"
              type="button"
              className="lobby-v2-mobile-find-btn"
              onClick={onStartQueue}
              disabled={!topic || queuing}
            >
              <IconSwords size={13} />
              <span>{queuing ? 'Searching...' : (topic ? 'Find Match' : 'Choose Topic')}</span>
            </button>
          </aside>
        )}

      </main>
    </div>
  )
}
