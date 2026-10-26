import React, { useState, useEffect } from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'
import { SkeletonBlock } from '../../../components/home/Skeleton'

const { w1Intro } = WHO_CONFIG

export default function W1Intro() {
  const [statsData, setStatsData] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)

  // Fetch real platform figures from existing stats endpoint
  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      try {
        const res = await fetch('/api/problems/stats')
        if (res.ok) {
          const json = await res.json()
          if (isMounted && json && typeof json.totalProblems === 'number') {
            setStatsData(json)
          }
        } else {
          if (isMounted) setStatsError(true)
        }
      } catch {
        if (isMounted) setStatsError(true)
      } finally {
        if (isMounted) setStatsLoading(false)
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="who-section who-intro-section" aria-labelledby="who-heading">
      <div className="who-container">
        
        {/* Intro Grid: Left Copy & Right 3D Emblem Anchor */}
        <div className="who-intro-grid">
          
          <div className="who-intro-copy">
            {/* Uppercase Label Row */}
            <span className="who-kicker">{w1Intro.kicker}</span>

            {/* Single Page H1 Reveal */}
            <h1 id="who-heading" className="who-display-title who-reveal-wipe">
              {w1Intro.title}
            </h1>

            {/* One sentence homepage copy */}
            <p className="who-lead-paragraph">
              {w1Intro.lead}
            </p>

            {/* Real Stats Figures (Only rendered if live data exists) */}
            {statsLoading ? (
              <div className="who-stats-row who-stats-loading" aria-label="Loading platform figures">
                <div className="who-stat-col">
                  <SkeletonBlock height={36} width={72} style={{ marginBottom: '8px' }} />
                  <SkeletonBlock height={14} width={110} />
                </div>
                <div className="who-stat-col">
                  <SkeletonBlock height={36} width={88} style={{ marginBottom: '8px' }} />
                  <SkeletonBlock height={14} width={110} />
                </div>
              </div>
            ) : !statsError && statsData ? (
              <div className="who-stats-row" role="region" aria-label="Verified platform statistics">
                <div className="who-stat-col">
                  <span className="who-stat-num">{statsData.totalProblems}</span>
                  <span className="who-stat-label">Curated Problems</span>
                </div>
                <div className="who-stat-col">
                  <span className="who-stat-num">{statsData.totalTestCases?.toLocaleString() || statsData.totalTestCases}</span>
                  <span className="who-stat-label">Verified Test Cases</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Anchor Placeholder for 3D Thread Emblem */}
          <div className="who-intro-visual" aria-hidden="true">
            <div className="who-intro-emblem-anchor">
              <img
                src="/algoarena-emblem.png"
                alt=""
                width="160"
                height="160"
                className="who-mobile-intro-emblem"
              />
              {/* Hint under emblem, hidden on touch */}
              <span className="who-rotate-hint">
                {w1Intro.rotateHint}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
