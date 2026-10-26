import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HOME_CONFIG } from '../../../content/home'
import { IconPlay, IconPause, IconRestart } from '../../../components/icons'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s1Duel } = HOME_CONFIG
const REPLAY_DURATION_SEC = 18

export default function DuelSection() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [timeSec, setTimeSec] = useState(0)
  const [inView, setInView] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const sectionRef = useRef(null)
  const panelRef = useRef(null)
  const rafIdRef = useRef(null)
  const lastTimestampRef = useRef(null)

  // 1. Reduced motion check
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mq.matches)
    if (mq.matches) {
      setTimeSec(13.5) // Static final accepted frame
      setIsPlaying(false)
    }

    const handler = (e) => {
      setIsReducedMotion(e.matches)
      if (e.matches) {
        setTimeSec(13.5)
        setIsPlaying(false)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // 2. IntersectionObserver to pause replay when scrolled off-screen
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 3. Document visibility listener: pause when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPlaying(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])



  // 5. Main 18-second replay animation loop
  useEffect(() => {
    if (isReducedMotion || !isPlaying || !inView) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      lastTimestampRef.current = null
      return
    }

    const tick = (now) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = now
      }
      const delta = (now - lastTimestampRef.current) / 1000
      lastTimestampRef.current = now

      setTimeSec((prev) => {
        const next = prev + delta
        return next >= REPLAY_DURATION_SEC ? 0 : next
      })

      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [isPlaying, inView, isReducedMotion])

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleRestart = useCallback(() => {
    setTimeSec(0)
    setIsPlaying(true)
  }, [])

  // Timeline Progress Calculations
  // Code typing: 0.5s to 9.5s
  const typingProgressA = Math.max(0, Math.min(1, (timeSec - 0.5) / 8.5))
  const typingProgressB = Math.max(0, Math.min(1, (timeSec - 0.8) / 8.0))

  const codeCharsA = Math.floor(s1Duel.playerA.code.length * typingProgressA)
  const currentCodeA = s1Duel.playerA.code.slice(0, codeCharsA)

  const codeCharsB = Math.floor(s1Duel.playerB.code.length * typingProgressB)
  const currentCodeB = s1Duel.playerB.code.slice(0, codeCharsB)

  // Test progression: 9.0s to 12.0s
  let testsA = 0
  let isAcceptedA = false
  if (timeSec >= 12.0) {
    testsA = 25
    isAcceptedA = true
  } else if (timeSec >= 9.0) {
    testsA = Math.min(24, Math.floor(((timeSec - 9.0) / 3.0) * 25))
  }

  let testsB = 0
  if (timeSec >= 13.0) {
    testsB = 21
  } else if (timeSec >= 9.5) {
    testsB = Math.min(21, Math.floor(((timeSec - 9.5) / 3.5) * 22))
  }

  // Timer clock format (00:00 to 00:18)
  const seconds = Math.floor(timeSec)
  const tenths = Math.floor((timeSec % 1) * 10)
  const clockFormatted = `00:${seconds < 10 ? '0' : ''}${seconds}.${tenths}`

  return (
    <section ref={sectionRef} className="home-section surface-bg-1" id="duel">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s1-duel" enter={true} exit={true}>
        <div className="section-container">
          
          {/* Editorial Heading */}
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s1Duel.kicker}</span>
            <h2 className="section-title">{s1Duel.title}</h2>
            <p className="section-body">{s1Duel.body}</p>
          </div>

          {/* 3D Tilted Framed Product Panel */}
          <div className="duel-perspective-wrap">
            <div ref={panelRef} className="duel-panel-3d depth-visual-panel anim-enter">
            
            {/* Top Bar: Problem metadata & live clock */}
            <div className="duel-top-meta">
              <div className="duel-demo-tag">
                <span className="duel-demo-dot" />
                <span>{s1Duel.demoLabel}</span>
              </div>
              <div className="duel-problem-spec">
                <span className="duel-problem-name">{s1Duel.problem.title}</span>
                <span className="duel-problem-diff">{s1Duel.problem.difficulty}</span>
                <span>Limit: {s1Duel.problem.timeLimit}</span>
              </div>
              <div className="duel-clock">
                <span>{clockFormatted}</span>
              </div>
            </div>

            {/* Problem Briefing Bar */}
            <div className="duel-briefing">
              <p>{s1Duel.problem.statement}</p>
            </div>

            {/* Dual Split Editors: Player A (You) vs Player B (Rival) */}
            <div className="duel-editors-split">
              
              {/* Left Pane: Player A (JavaScript, You) */}
              <div className="editor-pane">
                <div className="editor-pane-header">
                  <div className="pane-user-label">
                    <span className="pane-user-name user-gold">{s1Duel.playerA.username}</span>
                    <span className="pane-rating">{s1Duel.playerA.rating} Elo</span>
                  </div>
                  <span className="pane-filename">solution.js</span>
                </div>

                <div className="editor-code-body">
                  {currentCodeA.split('\n').map((line, idx) => (
                    <div key={idx} className="code-line">
                      <span className="code-lineno">{idx + 1}</span>
                      <span className="code-text">
                        {renderSyntaxTokens(line, 'js')}
                        {idx === currentCodeA.split('\n').length - 1 && typingProgressA < 1 && (
                          <span className="typing-cursor" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="editor-pane-footer">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="test-progress-bar">
                      <div
                        className="test-progress-fill"
                        style={{ width: `${(testsA / 25) * 100}%` }}
                      />
                    </div>
                    <span>{testsA}/25 tests</span>
                  </div>

                  <div>
                    {isAcceptedA ? (
                      <span className="verdict-tag accepted">
                        ACCEPTED
                        <span className="rating-delta-pill">+{s1Duel.playerA.gain} Elo</span>
                      </span>
                    ) : (
                      <span className="verdict-tag running">
                        {testsA > 0 ? 'Evaluating' : 'Typing'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane: Player B (Python, Rival) */}
              <div className="editor-pane">
                <div className="editor-pane-header">
                  <div className="pane-user-label">
                    <span className="pane-user-name user-blue">{s1Duel.playerB.username}</span>
                    <span className="pane-rating">{s1Duel.playerB.rating} Elo</span>
                  </div>
                  <span className="pane-filename">solution.py</span>
                </div>

                <div className="editor-code-body">
                  {currentCodeB.split('\n').map((line, idx) => (
                    <div key={idx} className="code-line">
                      <span className="code-lineno">{idx + 1}</span>
                      <span className="code-text">
                        {renderSyntaxTokens(line, 'py')}
                        {idx === currentCodeB.split('\n').length - 1 && typingProgressB < 1 && (
                          <span className="typing-cursor" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="editor-pane-footer">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="test-progress-bar">
                      <div
                        className="test-progress-fill fill-blue"
                        style={{ width: `${(testsB / 25) * 100}%` }}
                      />
                    </div>
                    <span>{testsB}/25 tests</span>
                  </div>

                  <div>
                    {isAcceptedA ? (
                      <span className="verdict-tag running" style={{ color: 'var(--sub)' }}>
                        21/25 Defeated
                      </span>
                    ) : (
                      <span className="verdict-tag running">
                        {testsB > 0 ? 'Evaluating' : 'Typing'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Replay Controls Row */}
            <div className="duel-controls-bar">
              <div className="duel-controls-left">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="duel-btn"
                  aria-label={isPlaying ? 'Pause demo replay' : 'Play demo replay'}
                >
                  {isPlaying ? <IconPause size={14} /> : <IconPlay size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="duel-btn"
                  aria-label="Restart demo replay"
                >
                  <IconRestart size={14} />
                  <span>Restart</span>
                </button>
              </div>

              <div className="duel-progress-indicator">
                <span>Replay: {timeSec.toFixed(1)}s / {REPLAY_DURATION_SEC}.0s</span>
              </div>
            </div>

          </div>
        </div>

        </div>
      </DepthSection>
    </section>
  )
}

/**
 * Lightweight token tinting (2-3 calm palette colors, no external heavy libraries)
 */
function renderSyntaxTokens(line, lang) {
  if (!line) return line
  const parts = line.split(/(\s+|[(),:{}[\];=+-]+)/)

  const jsKw = new Set(['function', 'const', 'let', 'for', 'if', 'return', 'new'])
  const pyKw = new Set(['class', 'def', 'for', 'in', 'if', 'return'])

  return parts.map((part, i) => {
    if ((lang === 'js' && jsKw.has(part)) || (lang === 'py' && pyKw.has(part))) {
      return <span key={i} className="syntax-kw">{part}</span>
    }
    if (part === 'solution' || part === 'twoSum' || part === 'Map') {
      return <span key={i} className="syntax-fn">{part}</span>
    }
    if (part.startsWith('//') || part.startsWith('#')) {
      return <span key={i} className="syntax-comment">{part}</span>
    }
    return part
  })
}
