import React, { useState, useRef, useEffect, useCallback } from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const { w3Story } = WHO_CONFIG

export default function W3Story({ onScrubberChange }) {
  const milestones = w3Story?.milestones || []
  const [activeIdx, setActiveIdx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [expandedMobileIdx, setExpandedMobileIdx] = useState(0)
  const railRef = useRef(null)

  // Guard: if fewer than 2 milestones, show single story sentence without timeline
  if (!milestones || milestones.length < 2) {
    return (
      <section className="who-section who-story-section" aria-labelledby="story-heading">
        <div className="who-container">
          <span className="who-kicker">{w3Story?.kicker || '03 / STORY'}</span>
          <h2 id="story-heading" className="who-section-title">{w3Story?.title || 'Our Story'}</h2>
          <p className="who-lead-paragraph">{w3Story?.storySentence}</p>
        </div>
      </section>
    )
  }

  const current = milestones[activeIdx] || milestones[0]

  const updateScrubberFromPointer = useCallback((clientX) => {
    if (!railRef.current) return
    const rect = railRef.current.getBoundingClientRect()
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const progress = rect.width > 0 ? relativeX / rect.width : 0
    const rawIdx = Math.round(progress * (milestones.length - 1))
    const nextIdx = Math.max(0, Math.min(milestones.length - 1, rawIdx))

    setActiveIdx(nextIdx)
    setExpandedMobileIdx(nextIdx)
    if (onScrubberChange) {
      onScrubberChange(progress)
    }
  }, [milestones.length, onScrubberChange])

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    updateScrubberFromPointer(e.clientX)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    updateScrubberFromPointer(e.clientX)
  }

  const handlePointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
    setIsDragging(false)
  }

  // Keyboard navigation for role="slider"
  const handleKeyDown = (e) => {
    let nextIdx = activeIdx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIdx = Math.min(milestones.length - 1, activeIdx + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIdx = Math.max(0, activeIdx - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIdx = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIdx = milestones.length - 1
    } else {
      return
    }

    setActiveIdx(nextIdx)
    setExpandedMobileIdx(nextIdx)
    if (onScrubberChange) {
      onScrubberChange(nextIdx / (milestones.length - 1))
    }
  }

  // Calculate percentage for scrubber thumb position
  const scrubberPercent = milestones.length > 1
    ? (activeIdx / (milestones.length - 1)) * 100
    : 0

  return (
    <section className="who-section who-story-section" aria-labelledby="story-heading">
      <div className="who-container">
        
        {/* Section Header */}
        <div className="who-story-header">
          <span className="who-kicker">{w3Story.kicker}</span>
          <h2 id="story-heading" className="who-section-title">{w3Story.title}</h2>
          <p className="who-lead-paragraph">{w3Story.storySentence}</p>
        </div>

        {/* Desktop Scrubbable Timeline */}
        <div className="who-timeline-desktop">
          
          {/* Active Milestone Card (Big JetBrains Mono Date + 1 Sentence) */}
          <div
            key={current.date}
            className="who-timeline-active-panel who-story-crossfade"
            aria-live="polite"
          >
            <div className="who-timeline-panel-top">
              <span className="who-timeline-date">{current.date}</span>
              <span className="who-timeline-step-badge">MILESTONE 0{activeIdx + 1}</span>
            </div>
            <h3 className="who-timeline-title">{current.title}</h3>
            <p className="who-timeline-sentence">{current.sentence}</p>
          </div>

          {/* Horizontal Timeline Rail with Draggable Scrubber */}
          <div className="who-timeline-track-wrap">
            <div
              ref={railRef}
              className="who-timeline-rail"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Rail Line */}
              <div className="who-timeline-rail-line" />

              {/* Progress Fill Line */}
              <div
                className="who-timeline-fill-line"
                style={{ width: `${scrubberPercent}%` }}
              />

              {/* Milestone Ticks */}
              {milestones.map((m, idx) => {
                const tickPercent = (idx / (milestones.length - 1)) * 100
                const isPassed = idx <= activeIdx
                return (
                  <button
                    key={m.date}
                    type="button"
                    className={`who-timeline-tick ${isPassed ? 'is-passed' : ''} ${idx === activeIdx ? 'is-active' : ''}`}
                    style={{ left: `${tickPercent}%` }}
                    onClick={() => {
                      setActiveIdx(idx)
                      if (onScrubberChange) onScrubberChange(idx / (milestones.length - 1))
                    }}
                    aria-label={`Jump to milestone ${m.date}: ${m.title}`}
                  >
                    <span className="who-tick-dot" />
                    <span className="who-tick-label">{m.date}</span>
                  </button>
                )
              })}

              {/* Draggable Scrubber Thumb */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Timeline milestone scrubber"
                aria-valuemin={0}
                aria-valuemax={milestones.length - 1}
                aria-valuenow={activeIdx}
                aria-valuetext={`${current.date}: ${current.title}`}
                className="who-timeline-scrubber"
                style={{ left: `${scrubberPercent}%` }}
                onKeyDown={handleKeyDown}
              >
                <div className="who-scrubber-inner" />
              </div>

            </div>

            <div className="who-timeline-hint">
              <span>Drag scrubber or use arrow keys to scrub history</span>
            </div>
          </div>

        </div>

        {/* Mobile Vertical List (< 769px) */}
        <div className="who-timeline-mobile-list" role="list" aria-label="Milestones timeline">
          {milestones.map((m, idx) => {
            const isOpen = expandedMobileIdx === idx
            return (
              <div
                key={m.date}
                className={`who-mobile-milestone-item ${isOpen ? 'is-open' : ''}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="who-mobile-milestone-btn"
                  onClick={() => setExpandedMobileIdx(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="who-mobile-date">{m.date}</span>
                  <span className="who-mobile-title">{m.title}</span>
                  <span className="who-mobile-toggle" aria-hidden="true">{isOpen ? '-' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="who-mobile-milestone-content">
                    <p className="who-timeline-sentence">{m.sentence}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
