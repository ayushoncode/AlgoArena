import React from 'react'
import { Link } from 'react-router-dom'
import LobbyHeader from './LobbyHeader'
import TopicGrid from './TopicGrid'
import DifficultySegment from './DifficultySegment'
import MatchSummaryRail from './MatchSummaryRail'
import QuickArenaThreeCol from './QuickArenaThreeCol'
import LiveArenaQueue from './LiveArenaQueue'
import StriverSheetView from '../../components/StriverSheetView'
import { IconSwords, IconCheck, IconClose, IconCode, IconShield, IconTrophy, IconPlay, IconLock } from '../../components/icons'
import { usePremium } from '../../hooks/usePremium'
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
  isAuthenticated = true,
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

  // Live Queue & Socket
  onAcceptChallenge,
  on,
  off,
  emit,
}) {
  const { isPremium, isPremiumEnabled, openLockedModal } = usePremium()
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

        {/* 1.5 LIVE ARENA QUEUE ACTIVITY TICKER */}
        <LiveArenaQueue
          user={user}
          queuing={queuing}
          onAcceptChallenge={onAcceptChallenge}
          onCancelQueue={onCancelQueue}
          on={on}
          off={off}
          emit={emit}
        />

        {!isAuthenticated && (
          <div
            className="lobby-v2-guest-banner"
            style={{
              background: 'var(--bg-1, #080d1a)',
              border: '1px solid rgba(196, 214, 232, 0.18)',
              borderRadius: '8px',
              padding: '12px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--feat, #e2ebf5)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Guest View
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--sub, #a2a9b8)', lineHeight: '1.4' }}>
                You are viewing AlgoArena as a guest. Sign in to queue for live 1v1 duels and climb the leaderboard.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartQueue}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                padding: '0 16px',
                background: '#ffffff',
                color: '#02060f',
                fontWeight: 600,
                fontSize: '12.5px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Sign in to Duel
            </button>
          </div>
        )}

        {/* 2. MODE SELECTOR (Quick Arena vs Striver Sheet vs Private Duel) */}
        <div className="lobby-v2-mode-selector" role="tablist" aria-label="Game Modes">
          <button
            type="button"
            role="tab"
            aria-selected={lobbyTab === 'random'}
            onClick={() => setLobbyTab && setLobbyTab('random')}
            className={`lobby-v2-mode-tab ${lobbyTab === 'random' ? 'is-active' : ''}`}
          >
            <IconSwords size={15} />
            <span><span className="hidden sm:inline">Quick Arena</span><span className="sm:hidden">Quick</span></span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={lobbyTab === 'striver'}
            onClick={() => setLobbyTab && setLobbyTab('striver')}
            className={`lobby-v2-mode-tab lobby-v2-striver-tab ${lobbyTab === 'striver' ? 'is-active' : ''}`}
          >
            <IconCode size={15} />
            <span><span className="hidden sm:inline">Striver A2Z Sheet</span><span className="sm:hidden">Striver</span></span>
            {isPremiumEnabled && !isPremium && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300 ml-1">
                <IconLock size={11} />
                <span>Premium</span>
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={lobbyTab === 'custom'}
            onClick={() => setLobbyTab && setLobbyTab('custom')}
            className={`lobby-v2-mode-tab ${lobbyTab === 'custom' ? 'is-active' : ''}`}
          >
            <IconShield size={15} />
            <span><span className="hidden sm:inline">Private Duel</span><span className="sm:hidden">Private</span></span>
          </button>
        </div>

        {/* 3. CONTENT AREA */}
        {lobbyTab === 'custom' ? (
          <div className="lobby-v2-private-section">
            <div className="lobby-v2-private-hero">
              <h2 className="lobby-v2-private-title">Private Duels</h2>
              <p className="lobby-v2-private-subtitle">
                Unranked 1v1 duels with friends. No Elo at stake.
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

                  <h3 className="lobby-v2-private-card-title">Create Room</h3>

                  <p className="lobby-v2-private-card-desc">
                    Pick a topic &amp; difficulty to generate a 6-character room code.
                  </p>

                  {/* 1. Topic Picker */}
                  <div className="lobby-v2-private-picker-section">
                    <div className="lobby-v2-private-picker-head">
                      <span className="lobby-v2-private-picker-title">Topic</span>
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
                  </div>

                  {/* 2. Difficulty Picker */}
                  <div className="lobby-v2-private-picker-section">
                    <div className="lobby-v2-private-picker-head">
                      <span className="lobby-v2-private-picker-title">Difficulty</span>
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
                    <span>Create Room</span>
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

                  <h3 className="lobby-v2-private-card-title">Join Room</h3>

                  <p className="lobby-v2-private-card-desc">
                    Enter a friend's 6-character room code to start coding instantly.
                  </p>
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
            {isPremiumEnabled && !isPremium && (
              <div
                style={{
                  background: 'var(--bg-1, #080d1a)',
                  border: '1px solid rgba(255, 214, 150, 0.35)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: 'rgba(255, 214, 150, 0.1)',
                      border: '1px solid rgba(255, 214, 150, 0.3)',
                      color: 'var(--gold, #ffd696)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <IconLock size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-display, Sora, sans-serif)', fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                        Striver A2Z Sheet Curriculum
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10.5px',
                          textTransform: 'uppercase',
                          color: 'var(--gold, #ffd696)',
                          background: 'rgba(255, 214, 150, 0.1)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 214, 150, 0.25)',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Preview Mode
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--sub, #a2a9b8)', lineHeight: '1.4' }}>
                      Browse the full topic breakdown freely. AlgoArena Premium is required to launch 1v1 duels on sheet questions.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '16px', fontWeight: 700, color: 'var(--gold, #ffd696)' }}>
                      ₹39 <span style={{ fontSize: '11px', color: 'var(--sub, #a2a9b8)', fontWeight: 400 }}>/ month</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--sub, #a2a9b8)' }}>Launch Offer</div>
                  </div>
                  <Link
                    to="/premium"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      padding: '0 18px',
                      background: 'var(--gold, #ffd696)',
                      color: '#080d1a',
                      fontWeight: 700,
                      fontSize: '13px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                  >
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}

            <StriverSheetView
              striverData={striverData}
              loading={striverLoading}
              onBattleProblem={onBattleProblem}
              onBattleRandom={onBattleRandomFromSheet}
              queuingProblemId={queuingProblem?.id}
              isQueuing={queuing}
              isGated={isPremiumEnabled && !isPremium}
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
              isAuthenticated={isAuthenticated}
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
            isAuthenticated={isAuthenticated}
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
              disabled={isAuthenticated && (!topic || queuing)}
            >
              <IconSwords size={13} />
              <span>
                {queuing
                  ? 'Searching...'
                  : !isAuthenticated
                    ? 'Sign in to Play'
                    : topic
                      ? 'Find Match'
                      : 'Choose Topic'}
              </span>
            </button>
          </aside>
        )}

      </main>
    </div>
  )
}
