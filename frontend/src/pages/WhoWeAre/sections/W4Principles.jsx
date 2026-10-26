import React, { useState, useRef, useEffect, useCallback } from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const { w4Principles } = WHO_CONFIG

export default function W4Principles({ onSelectPrinciple }) {
  const items = w4Principles?.items || []
  const [activeTab, setActiveTab] = useState(0)
  const [displayTab, setDisplayTab] = useState(0)
  const [flipPhase, setFlipPhase] = useState('idle') // 'idle' | 'out' | 'in'
  const tabButtonRefs = useRef([])

  const handleSelectTab = useCallback((idx) => {
    if (idx === activeTab) return
    setActiveTab(idx)
    if (onSelectPrinciple) onSelectPrinciple(idx)

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayTab(idx)
      return
    }

    // 3D Flip on Y-axis (400ms total: rotateY 0 to 90 in 200ms, then -90 to 0 in 200ms)
    setFlipPhase('out')
    setTimeout(() => {
      setDisplayTab(idx)
      setFlipPhase('in')
      setTimeout(() => {
        setFlipPhase('idle')
      }, 200)
    }, 200)
  }, [activeTab, onSelectPrinciple])

  // Keyboard navigation for tabs (role="tablist")
  const handleKeyDown = (e, idx) => {
    let nextIdx = idx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIdx = (idx + 1) % items.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIdx = (idx - 1 + items.length) % items.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIdx = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIdx = items.length - 1
    } else {
      return
    }

    handleSelectTab(nextIdx)
    if (tabButtonRefs.current[nextIdx]) {
      tabButtonRefs.current[nextIdx].focus()
    }
  }

  const currentItem = items[displayTab] || items[0]

  return (
    <section className="who-section who-principles-section surface-bg-1" aria-labelledby="principles-heading">
      <div className="who-container">
        
        {/* Section Header */}
        <div className="who-principles-header">
          <span className="who-kicker">{w4Principles.kicker}</span>
          <h2 id="principles-heading" className="who-section-title">{w4Principles.title}</h2>
          <p className="who-lead-paragraph">{w4Principles.subtitle}</p>
        </div>

        {/* Numbered Tabs Row (01 to 04) */}
        <div
          className="who-principles-tabs"
          role="tablist"
          aria-label="Architectural and fairness principles"
        >
          {items.map((item, idx) => {
            const isSelected = activeTab === idx
            return (
              <button
                key={item.id}
                ref={(el) => (tabButtonRefs.current[idx] = el)}
                role="tab"
                id={`principle-tab-${item.id}`}
                aria-selected={isSelected}
                aria-controls={`principle-panel-${item.id}`}
                tabIndex={isSelected ? 0 : -1}
                className={`who-principle-tab-btn ${isSelected ? 'is-active' : ''}`}
                onClick={() => handleSelectTab(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
              >
                <span className="who-tab-num">{item.number}</span>
                <span className="who-tab-title">{item.title}</span>
              </button>
            )
          })}
        </div>

        {/* 3D Flip Card Panel Container */}
        <div className="who-flip-stage">
          <div
            id={`principle-panel-${currentItem.id}`}
            role="tabpanel"
            aria-labelledby={`principle-tab-${currentItem.id}`}
            aria-live="polite"
            className={`who-flip-card ${flipPhase === 'out' ? 'is-flipping-out' : flipPhase === 'in' ? 'is-flipping-in' : ''}`}
          >
            
            {/* Top: Principle Title & Single Sentence */}
            <div className="who-flip-header">
              <span className="who-flip-num-badge">PRINCIPLE {currentItem.number}</span>
              <h3 className="who-flip-title">{currentItem.title}</h3>
              <p className="who-flip-sentence">{currentItem.sentence}</p>
              <div className="who-proof-citation">
                <span>{currentItem.proof}</span>
              </div>
            </div>

            {/* Bottom: Live Visual Proof Widget */}
            <div className="who-flip-visual-proof">
              
              {/* Proof 01: Synchronous Dispatch (Two Mini Identical Editors Labelled "Demo") */}
              {currentItem.id === 'dispatch' && (
                <div className="who-proof-editors-wrap" aria-label="Live Demo: Synchronous Dispatch">
                  <div className="who-proof-badge-row">
                    <span className="who-demo-badge">Demo</span>
                    <span className="who-proof-note">Identical problem payload emitted simultaneously</span>
                  </div>
                  
                  <div className="who-proof-dual-editors">
                    {/* Player 1 Editor */}
                    <div className="who-mini-editor">
                      <div className="who-mini-editor-bar">
                        <span className="who-editor-player">Player 1 (C++)</span>
                        <span className="who-editor-status">Passed 25/25</span>
                      </div>
                      <pre className="who-mini-code" tabIndex={0} role="region" aria-label="Player 1 C++ demo code">
{`// Problem #209: Two Sum
vector<int> twoSum(vector<int>& nums, int target) {
  unordered_map<int, int> seen;
  for (int i = 0; i < nums.size(); i++) {
    int complement = target - nums[i];
    if (seen.count(complement)) return {seen[complement], i};
    seen[nums[i]] = i;
  }
  return {};
}`}
                      </pre>
                    </div>

                    {/* Player 2 Editor */}
                    <div className="who-mini-editor">
                      <div className="who-mini-editor-bar">
                        <span className="who-editor-player">Player 2 (Python)</span>
                        <span className="who-editor-status">Running 25/25</span>
                      </div>
                      <pre className="who-mini-code" tabIndex={0} role="region" aria-label="Player 2 Python demo code">
{`# Problem #209: Two Sum
def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
    return []`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Proof 02: Open Elo Standard (Live Interactive Calculation) */}
              {currentItem.id === 'elo' && (
                <div className="who-proof-elo-wrap" aria-label="Live Elo Calculation Model">
                  <div className="who-proof-badge-row">
                    <span className="who-demo-badge">Verified Formula</span>
                    <span className="who-proof-note">Logistic probability curve from backend/utils/elo.js</span>
                  </div>

                  <div className="who-elo-calc-card">
                    <div className="who-elo-inputs-grid">
                      <div className="who-elo-col">
                        <span className="who-elo-label">Player 1 Rating</span>
                        <span className="who-elo-val">1420 Elo</span>
                        <span className="who-elo-sub">Expected Win: 46.4%</span>
                      </div>
                      <div className="who-elo-vs">VS</div>
                      <div className="who-elo-col">
                        <span className="who-elo-label">Player 2 Rating</span>
                        <span className="who-elo-val">1445 Elo</span>
                        <span className="who-elo-sub">Expected Win: 53.6%</span>
                      </div>
                    </div>

                    <div className="who-elo-formula-box">
                      <span className="who-formula-text">
                        R' = R + K * (Actual - Expected) = 1420 + 32 * (1.0 - 0.464) = +17 Elo
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Proof 03: Docker Sandbox (Verified Definition List) */}
              {currentItem.id === 'sandbox' && (
                <div className="who-proof-sandbox-wrap" aria-label="Docker Sandbox Runtime Limits">
                  <div className="who-proof-badge-row">
                    <span className="who-demo-badge">Container Policy</span>
                    <span className="who-proof-note">Linux cgroup boundaries from workers/sandbox.js</span>
                  </div>

                  <dl className="who-sandbox-limits-dl">
                    <div className="who-sandbox-limit-row">
                      <dt className="who-sandbox-term">Memory Ceiling</dt>
                      <dd className="who-sandbox-def">256 MB (cgroup enforced, OOM terminated)</dd>
                    </div>
                    <div className="who-sandbox-limit-row">
                      <dt className="who-sandbox-term">CPU Allocation</dt>
                      <dd className="who-sandbox-def">0.5 Core Quota (50,000 / 100,000 us)</dd>
                    </div>
                    <div className="who-sandbox-limit-row">
                      <dt className="who-sandbox-term">Network Access</dt>
                      <dd className="who-sandbox-def">Disabled (--network none, 0 sockets)</dd>
                    </div>
                    <div className="who-sandbox-limit-row">
                      <dt className="who-sandbox-term">Root Filesystem</dt>
                      <dd className="who-sandbox-def">Read-only mount with 64MB tmpfs scratch</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Proof 04: Fair Play (Numbered Plain Rows) */}
              {currentItem.id === 'fairplay' && (
                <div className="who-proof-fairplay-wrap" aria-label="Fair Play Competition Rules">
                  <div className="who-proof-badge-row">
                    <span className="who-demo-badge">Integrity Rules</span>
                    <span className="who-proof-note">Settlement guarantees enforced in backend/socket/match.js</span>
                  </div>

                  <ol className="who-fairplay-list">
                    <li className="who-fairplay-row">
                      <span className="who-fairplay-idx">01</span>
                      <span className="who-fairplay-text">Simultaneous test suite dispatch: neither competitor receives advance problem access.</span>
                    </li>
                    <li className="who-fairplay-row">
                      <span className="who-fairplay-idx">02</span>
                      <span className="who-fairplay-text">Deterministic test settlement: 100% of hidden test cases must pass for match resolution.</span>
                    </li>
                    <li className="who-fairplay-row">
                      <span className="who-fairplay-idx">03</span>
                      <span className="who-fairplay-text">Active disconnect rule: socket dropping during active duel yields immediate forfeit.</span>
                    </li>
                    <li className="who-fairplay-row">
                      <span className="who-fairplay-idx">04</span>
                      <span className="who-fairplay-text">Cryptographic match record: permanent unalterable audit log written to PostgreSQL.</span>
                    </li>
                  </ol>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
