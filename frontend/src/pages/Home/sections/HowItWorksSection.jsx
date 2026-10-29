import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HOME_CONFIG } from '../../../content/home'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s2HowItWorks, s4Sandbox } = HOME_CONFIG

export default function HowItWorksSection() {
  const [activeStage, setActiveStage] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const trackRef = useRef(null)

  // 1. Reduced motion & mobile breakpoint detection
  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqMobile = window.matchMedia('(max-width: 1023px)')

    setIsReducedMotion(mqMotion.matches)
    setIsMobile(mqMobile.matches)

    const handleMotion = (e) => setIsReducedMotion(e.matches)
    const handleMobile = (e) => setIsMobile(e.matches)

    mqMotion.addEventListener('change', handleMotion)
    mqMobile.addEventListener('change', handleMobile)

    return () => {
      mqMotion.removeEventListener('change', handleMotion)
      mqMobile.removeEventListener('change', handleMobile)
    }
  }, [])

  // 2. Desktop pinned scroll tracking (300vh track height)
  useEffect(() => {
    if (isReducedMotion || isMobile) return

    const handleScroll = () => {
      const track = trackRef.current
      if (!track) return

      const rect = track.getBoundingClientRect()
      const scrollableDistance = rect.height - window.innerHeight
      if (scrollableDistance <= 0) return

      // Distance scrolled into the track
      const scrolled = -rect.top
      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance))

      // 4 stages mapped to [0..0.25), [0.25..0.50), [0.50..0.75), [0.75..1.0]
      const stageIdx = Math.min(3, Math.floor(progress * 4))
      setActiveStage(stageIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isReducedMotion, isMobile])

  // Scroll to a specific stage on tick click
  const handleTickClick = useCallback((index) => {
    const track = trackRef.current
    if (!track || isMobile) return

    const trackTop = track.getBoundingClientRect().top + window.scrollY
    const scrollableDistance = track.offsetHeight - window.innerHeight
    const targetScrollY = trackTop + (index / 3) * scrollableDistance

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    })
  }, [isMobile])

  const stage = s2HowItWorks.stages[activeStage]

  return (
    <section className="home-section" id="how-it-runs" data-mascot-section="howItRuns">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      
      {/* Editorial Section Header wrapped in DepthSection */}
      <DepthSection id="s2-how-header" enter={true} exit={false}>
        <div className="section-container">
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s2HowItWorks.kicker}</span>
            <h2 className="section-title">{s2HowItWorks.title}</h2>
          </div>
        </div>
      </DepthSection>

      {/* Desktop Pinned Scroll Sequence (300vh) */}
      {!isMobile ? (
        <div ref={trackRef} className="how-pinned-track">
          <div className="how-sticky-container">
            <div className="how-grid-layout">
              
              {/* Left Column: Progress spine & active stage narrative */}
              <div className="how-left-rail">
                <div className="how-progress-spine" aria-hidden="true">
                  <div className="how-spine-line" />
                  <div
                    className="how-spine-fill"
                    style={{ height: `${(activeStage / 3) * 100}%` }}
                  />
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTickClick(i)}
                      className={`how-tick-node ${activeStage >= i ? 'active' : ''}`}
                      aria-label={`Jump to stage ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="how-narrative-content" aria-live="polite">
                  <div className="how-stage-index">{stage.index}</div>
                  <h3 className="how-stage-title">{stage.name}</h3>
                  <p className="how-stage-summary">{stage.summary}</p>
                  
                  <div className="how-spec-tag">
                    <span className="how-spec-label">{stage.detailKey}</span>
                    <span className="how-spec-value">{stage.detailValue}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D-Tilted Inspection Panel with rotateY (+/- 8deg) crossfade */}
              <div className="how-panel-perspective">
                <div className={`how-inspect-card ${activeStage % 2 === 0 ? 'stage-rot-neg' : 'stage-rot-pos'}`}>
                  <div className="how-inspect-header">
                    <span>STAGE {stage.index} / {stage.name}</span>
                    <span style={{ color: 'var(--gold)' }}>ACTIVE TELEMETRY</span>
                  </div>

                  {/* Cross-fading stage content */}
                  {activeStage === 0 && <StageQueueInspection />}
                  {activeStage === 1 && <StageSandboxInspection limits={s4Sandbox.limits} />}
                  {activeStage === 2 && <StageTelemetryInspection />}
                  {activeStage === 3 && <StageSettlementInspection />}

                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* Mobile / Tablet / Reduced Motion Fallback: Unpinned Ruled Rows */
        <div className="section-container">
          <div className="how-mobile-stages-list">
            {s2HowItWorks.stages.map((st, i) => (
              <div key={i} className="how-mobile-stage-item">
                <div className="how-stage-index">{st.index}</div>
                <h3 className="how-stage-title">{st.name}</h3>
                <p className="how-stage-summary">{st.summary}</p>
                <div className="how-spec-tag" style={{ marginBottom: '20px' }}>
                  <span className="how-spec-label">{st.detailKey}</span>
                  <span className="how-spec-value">{st.detailValue}</span>
                </div>
                
                <div className="how-inspect-card" style={{ transform: 'none' }}>
                  {i === 0 && <StageQueueInspection />}
                  {i === 1 && <StageSandboxInspection limits={s4Sandbox.limits} />}
                  {i === 2 && <StageTelemetryInspection />}
                  {i === 3 && <StageSettlementInspection />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  )
}

/**
 * Stage 1: Matchmaking queue window on an Elo axis ruler
 */
function StageQueueInspection() {
  return (
    <div className="ruler-container">
      <div className="ruler-title">RATING SEARCH AXIS (ADAPTIVE WINDOW)</div>
      <div className="ruler-axis">
        <div className="ruler-search-window" />
        
        {/* Ruler tick marks */}
        <div className="ruler-tick major" style={{ left: '10%' }}>
          <span className="ruler-tick-label">1250</span>
        </div>
        <div className="ruler-tick" style={{ left: '20%' }} />
        <div className="ruler-tick major" style={{ left: '30%' }}>
          <span className="ruler-tick-label">1350</span>
        </div>
        <div className="ruler-tick" style={{ left: '40%' }} />
        <div className="ruler-tick major" style={{ left: '50%' }}>
          <span className="ruler-tick-label">1420</span>
        </div>
        <div className="ruler-tick" style={{ left: '60%' }} />
        <div className="ruler-tick major" style={{ left: '70%' }}>
          <span className="ruler-tick-label">1500</span>
        </div>
        <div className="ruler-tick" style={{ left: '80%' }} />
        <div className="ruler-tick major" style={{ left: '90%' }}>
          <span className="ruler-tick-label">1600</span>
        </div>

        {/* User pointer */}
        <div className="ruler-user-marker">
          <span className="ruler-marker-label">YOU (1420)</span>
          <div style={{ width: '2px', height: '14px', background: 'var(--gold)' }} />
        </div>
      </div>

      <div className="ruler-lock-notice">
        <span>Rival locked: 1445 Elo</span>
        <span style={{ color: 'var(--blue)' }}>RTT: 24ms</span>
      </div>
    </div>
  )
}

/**
 * Stage 2: Sandbox enforced limits table
 */
function StageSandboxInspection({ limits }) {
  return (
    <div>
      <table className="sandbox-spec-table">
        <tbody>
          {limits.slice(0, 6).map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Stage 3: Live telemetry progress bars
 */
function StageTelemetryInspection() {
  return (
    <div>
      <div className="telemetry-row">
        <div className="telemetry-label">
          <span style={{ color: 'var(--gold)' }}>YOU: 25 / 25 test cases</span>
          <span>100% Passed</span>
        </div>
        <div className="telemetry-bar-bg">
          <div className="telemetry-bar-fill gold" style={{ width: '100%' }} />
        </div>
      </div>

      <div className="telemetry-row">
        <div className="telemetry-label">
          <span style={{ color: 'var(--blue)' }}>RIVAL: 21 / 25 test cases</span>
          <span>84% Passed</span>
        </div>
        <div className="telemetry-bar-bg">
          <div className="telemetry-bar-fill blue" style={{ width: '84%' }} />
        </div>
      </div>

      <div style={{ marginTop: '24px', fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--sub)' }}>
        Streaming test status events over secure WebSocket connection with delta updates.
      </div>
    </div>
  )
}

/**
 * Stage 4: Rating settlement calculation breakdown
 */
function StageSettlementInspection() {
  return (
    <div className="settlement-card">
      <div className="settlement-row">
        <span style={{ color: 'var(--sub)' }}>Starting Rating</span>
        <span>1420 Elo</span>
      </div>
      <div className="settlement-row">
        <span style={{ color: 'var(--sub)' }}>Opponent Rating</span>
        <span style={{ color: 'var(--blue)' }}>1445 Elo (+25 Gap)</span>
      </div>
      <div className="settlement-row">
        <span style={{ color: 'var(--sub)' }}>Expected Score</span>
        <span>0.464</span>
      </div>
      <div className="settlement-row">
        <span style={{ color: 'var(--sub)' }}>Speed Bonus</span>
        <span style={{ color: 'var(--gold)' }}>+3 (Under 10m)</span>
      </div>
      <div className="settlement-row highlight">
        <span>Settled Rating</span>
        <span>1444 Elo (+24)</span>
      </div>
    </div>
  )
}
