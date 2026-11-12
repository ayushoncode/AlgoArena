/**
 * src/pages/Lobby/QuickArenaThreeCol.jsx
 *
 * Three-column presentational layout for the Quick Arena panel:
 *  - Column 1: Topic (ruled vertical scrollable list, counts, key hints, clear)
 *  - Column 2: Difficulty (stacked large options: Easy, Medium, Hard)
 *  - Column 3: Match summary (definition list, win/loss swings, Find Match)
 *
 * Constraints:
 *  - Pure presentation: same props, handlers, and ids.
 *  - Sora typography, navy tonal surfaces, hairlines.
 *  - Semantic tokens (--ok, --bad, --warn, --info with light-theme support).
 *  - Zero emoji, zero Lucide, zero gradients, zero glow, zero banned words.
 */

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { IconCheck } from '../../components/icons'
import api from '../../utils/api'
import './QuickArenaThreeCol.css'

const DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Easy',
    descriptor: 'Warm-up',
    colorVar: 'var(--ok)',
    swing: '+12 / -12 estimate',
    winSwing: '+12 Elo',
    loseSwing: '-12 Elo',
  },
  {
    id: 'medium',
    label: 'Medium',
    descriptor: 'Balanced',
    colorVar: 'var(--warn)',
    swing: '+18 / -18 estimate',
    winSwing: '+18 Elo',
    loseSwing: '-18 Elo',
  },
  {
    id: 'hard',
    label: 'Hard',
    descriptor: 'Elite',
    colorVar: 'var(--bad)',
    swing: '+25 / -25 estimate',
    winSwing: '+25 Elo',
    loseSwing: '-25 Elo',
  },
]

export default function QuickArenaThreeCol({
  topics = [],
  topic = null,
  diff = 'medium',
  selectedTopicObj = null,
  diffObj = null,
  onSelectTopic,
  onSelectDiff,
  onStartQueue,
  onSurpriseMe,
  queuing = false,
  isAuthenticated = true,
}) {
  const [topicStats, setTopicStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [hiddenCount, setHiddenCount] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const listRef = useRef(null)
  const itemRefs = useRef({})
  const liveRegionId = useId()

  // Fetch real problem counts per topic from /api/problems/stats
  useEffect(() => {
    let isMounted = true
    api.get('/api/problems/stats')
      .then(({ data }) => {
        if (isMounted && data?.byTopic) {
          setTopicStats(data.byTopic)
        }
      })
      .catch(() => {
        // Fallback: show topics without counts, nothing else changes
      })
      .finally(() => {
        if (isMounted) setStatsLoading(false)
      })
    return () => { isMounted = false }
  }, [])

  // Calculate hidden rows below scroll container
  const updateHiddenCount = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const listBottom = list.scrollTop + list.clientHeight
    let hidden = 0
    const children = list.querySelectorAll('.quick-arena-topic-row')
    children.forEach((child) => {
      if (child.offsetTop + child.offsetHeight > listBottom + 4) {
        hidden++
      }
    })
    setHiddenCount(hidden)
  }, [])

  useEffect(() => {
    updateHiddenCount()
    window.addEventListener('resize', updateHiddenCount)
    return () => window.removeEventListener('resize', updateHiddenCount)
  }, [updateHiddenCount, topics, topicStats])

  // Scroll selected topic into view on selection change or restore
  useEffect(() => {
    const activeKey = topic || 'any'
    const targetEl = itemRefs.current[activeKey]
    if (targetEl && listRef.current) {
      const reducedMotion = typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      targetEl.scrollIntoView({
        block: 'nearest',
        behavior: reducedMotion ? 'instant' : 'smooth',
      })
    }
    updateHiddenCount()
  }, [topic, updateHiddenCount])

  // Announce selection changes to screen readers (polite aria-live)
  useEffect(() => {
    const tLabel = selectedTopicObj ? selectedTopicObj.label : 'Any topic'
    const dLabel = diffObj ? diffObj.label : 'Medium'
    setAnnouncement(`Topic ${tLabel}, ${dLabel}`)
  }, [selectedTopicObj, diffObj])

  // Arrow key navigation inside Topic radiogroup
  const handleTopicKeyDown = useCallback((e, currentIndex) => {
    // Array of navigable topic keys: ['any', ...topicIds]
    const allKeys = ['any', ...topics.map(t => t.id)]
    let nextIdx = null

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      nextIdx = (currentIndex + 1) % allKeys.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nextIdx = (currentIndex - 1 + allKeys.length) % allKeys.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIdx = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIdx = allKeys.length - 1
    }

    if (nextIdx !== null) {
      const nextKey = allKeys[nextIdx]
      if (nextKey === 'any') {
        onSurpriseMe ? onSurpriseMe() : onSelectTopic(null)
      } else {
        onSelectTopic(nextKey)
      }
      itemRefs.current[nextKey]?.focus()
    }
  }, [topics, onSelectTopic, onSurpriseMe])

  // Arrow key navigation inside Difficulty radiogroup
  const handleDiffKeyDown = useCallback((e, currentIndex) => {
    let nextIdx = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      nextIdx = (currentIndex + 1) % DIFFICULTIES.length
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIdx = (currentIndex - 1 + DIFFICULTIES.length) % DIFFICULTIES.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIdx = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIdx = DIFFICULTIES.length - 1
    }

    if (nextIdx !== null) {
      const targetDiff = DIFFICULTIES[nextIdx]
      onSelectDiff(targetDiff.id)
    }
  }, [onSelectDiff])

  const currentDiffConfig = DIFFICULTIES.find(d => d.id === diff) || DIFFICULTIES[1]

  return (
    <section className="quick-arena-block" aria-label="Quick Arena Matchmaking">
      {/* Screen reader polite announcement */}
      <div id={liveRegionId} className="quick-arena-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <div className="quick-arena-grid">
        {/* ── COLUMN 1: TOPIC ────────────────────────────────────────── */}
        <div className="quick-arena-col quick-arena-col-topic">
          <header className="quick-arena-col-head">
            <div className="quick-arena-col-title-wrap">
              <span className="quick-arena-step" aria-hidden="true">1</span>
              <h2 className="quick-arena-col-title">Topic</h2>
            </div>
            {topic && (
              <button
                type="button"
                className="quick-arena-clear-btn"
                onClick={() => onSelectTopic(null)}
                aria-label="Clear topic selection"
              >
                Clear selection
              </button>
            )}
          </header>

          <div
            ref={listRef}
            className="quick-arena-topic-list"
            role="radiogroup"
            aria-label="Algorithm problem topics"
            onScroll={updateHiddenCount}
          >
            {/* Any Topic row (First row) */}
            <button
              ref={(el) => { itemRefs.current['any'] = el }}
              type="button"
              role="radio"
              aria-checked={!topic}
              tabIndex={!topic ? 0 : -1}
              className={`quick-arena-topic-row ${!topic ? 'is-selected' : ''}`}
              onClick={onSurpriseMe}
              onKeyDown={(e) => handleTopicKeyDown(e, 0)}
            >
              <div className="quick-arena-topic-left">
                <span className="quick-arena-topic-name">Any topic</span>
              </div>
              <div className="quick-arena-topic-right">
                <span className="quick-arena-keyhint" aria-hidden="true">[9]</span>
                <span className="quick-arena-count-mono">Random</span>
                {!topic && (
                  <span className="quick-arena-check" aria-hidden="true">
                    <IconCheck size={14} />
                  </span>
                )}
              </div>
            </button>

            {/* Ruled list of all topics */}
            {topics.map((t, idx) => {
              const isSelected = topic === t.id
              const count = topicStats ? topicStats[t.id] : null
              const keyHint = idx < 8 ? `[${idx + 1}]` : null

              return (
                <button
                  key={t.id}
                  ref={(el) => { itemRefs.current[t.id] = el }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className={`quick-arena-topic-row ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectTopic(t.id)}
                  onKeyDown={(e) => handleTopicKeyDown(e, idx + 1)}
                >
                  <div className="quick-arena-topic-left">
                    <span className="quick-arena-topic-name">{t.label}</span>
                  </div>
                  <div className="quick-arena-topic-right">
                    {keyHint && (
                      <span className="quick-arena-keyhint" aria-hidden="true">{keyHint}</span>
                    )}
                    {statsLoading ? (
                      <span className="quick-arena-count-skeleton" aria-hidden="true" />
                    ) : count !== null && count !== undefined ? (
                      <span className="quick-arena-count-mono">{count}</span>
                    ) : null}
                    {isSelected && (
                      <span className="quick-arena-check" aria-hidden="true">
                        <IconCheck size={14} />
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Plain mono scroll hint */}
          <div className="quick-arena-scroll-footer" aria-hidden="true">
            {hiddenCount > 0 ? (
              <span className="quick-arena-scroll-hint">
                {hiddenCount} more below, the list scrolls
              </span>
            ) : (
              <span className="quick-arena-scroll-hint quick-arena-scroll-hint-dim">
                All topics visible
              </span>
            )}
          </div>
        </div>

        {/* ── COLUMN 2: DIFFICULTY ───────────────────────────────────── */}
        <div className="quick-arena-col quick-arena-col-diff">
          <header className="quick-arena-col-head">
            <div className="quick-arena-col-title-wrap">
              <span className="quick-arena-step" aria-hidden="true">2</span>
              <h2 className="quick-arena-col-title">Difficulty</h2>
            </div>
          </header>

          <div
            className="quick-arena-diff-stack"
            role="radiogroup"
            aria-label="Match difficulty"
          >
            {DIFFICULTIES.map((d, idx) => {
              const isSelected = diff === d.id

              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className={`quick-arena-diff-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectDiff(d.id)}
                  onKeyDown={(e) => handleDiffKeyDown(e, idx)}
                >
                  <div className="quick-arena-diff-header-line">
                    <span className="quick-arena-diff-word" style={{ color: d.colorVar }}>
                      {d.label}
                    </span>
                    <div className="quick-arena-diff-meta-right">
                      <span className="quick-arena-diff-descriptor">{d.descriptor}</span>
                      {isSelected && (
                        <span className="quick-arena-check" aria-hidden="true">
                          <IconCheck size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="quick-arena-diff-swing-mono">
                    {d.swing}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── COLUMN 3: MATCH SUMMARY ────────────────────────────────── */}
        <div className="quick-arena-col quick-arena-col-summary">
          <header className="quick-arena-col-head">
            <div className="quick-arena-col-title-wrap">
              <span className="quick-arena-step" aria-hidden="true">3</span>
              <h2 className="quick-arena-col-title">Match summary</h2>
            </div>
          </header>

          <div className="quick-arena-summary-body">
            <dl className="quick-arena-dl">
              {/* Topic item */}
              <div className="quick-arena-dl-row">
                <dt className="quick-arena-dt">Topic</dt>
                <dd className="quick-arena-dd">
                  <div className="quick-arena-dd-topic-title">
                    {selectedTopicObj ? selectedTopicObj.label : 'Any topic'}
                  </div>
                  {selectedTopicObj?.desc && (
                    <div className="quick-arena-topic-muted-desc">
                      {selectedTopicObj.desc}
                    </div>
                  )}
                  {selectedTopicObj?.subtopics && (
                    <div className="quick-arena-topic-muted-subtopics">
                      {selectedTopicObj.subtopics.join(' · ')}
                    </div>
                  )}
                </dd>
              </div>

              {/* Difficulty item */}
              <div className="quick-arena-dl-row">
                <dt className="quick-arena-dt">Difficulty</dt>
                <dd className="quick-arena-dd">
                  <span className="quick-arena-diff-highlight" style={{ color: currentDiffConfig.colorVar }}>
                    {diffObj ? diffObj.label : currentDiffConfig.label}
                  </span>
                </dd>
              </div>

              {/* If you win item */}
              <div className="quick-arena-dl-row">
                <dt className="quick-arena-dt">If you win</dt>
                <dd className="quick-arena-dd quick-arena-mono" style={{ color: 'var(--ok)' }}>
                  {currentDiffConfig.winSwing}
                </dd>
              </div>

              {/* If you lose item */}
              <div className="quick-arena-dl-row">
                <dt className="quick-arena-dt">If you lose</dt>
                <dd className="quick-arena-dd quick-arena-mono" style={{ color: 'var(--bad)' }}>
                  {currentDiffConfig.loseSwing}
                </dd>
              </div>
            </dl>

            {/* Primary Action Button */}
            <div className="quick-arena-action-wrap">
              <button
                id="find-match-btn"
                type="button"
                className="quick-arena-find-btn"
                onClick={onStartQueue}
                disabled={isAuthenticated && (!topic || queuing)}
              >
                <span>
                  {queuing
                    ? 'Searching...'
                    : !isAuthenticated
                      ? 'Sign in to Play'
                      : 'Find Match'}
                </span>
              </button>

              {!isAuthenticated ? (
                <p className="quick-arena-helper-line" style={{ color: 'var(--feat, #ffd696)' }}>
                  Sign in to access the arena and start matchmaking
                </p>
              ) : !topic ? (
                <p className="quick-arena-helper-line">
                  Please select a topic to begin
                </p>
              ) : (
                <p className="quick-arena-enter-line">
                  Press Enter to start
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLET & PHONE STICKY BOTTOM BAR (< 900px) ───────────────── */}
      <aside className="quick-arena-mobile-bar" aria-label="Mobile Quick Match Actions">
        <div className="quick-arena-mobile-bar-info">
          <span className="quick-arena-mobile-topic">
            {selectedTopicObj ? selectedTopicObj.label : 'Any topic'}
          </span>
          <span className="quick-arena-mobile-meta">
            <span>{diffObj ? diffObj.label : currentDiffConfig.label}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: 'var(--ok)' }}>Win {currentDiffConfig.winSwing}</span>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--bad)' }}>Lose {currentDiffConfig.loseSwing}</span>
          </span>
        </div>
        <button
          id="mobile-find-match-btn"
          type="button"
          className="quick-arena-mobile-find-btn"
          onClick={onStartQueue}
          disabled={isAuthenticated && (!topic || queuing)}
        >
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
    </section>
  )
}
