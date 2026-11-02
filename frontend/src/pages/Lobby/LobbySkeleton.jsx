import React from 'react'
import './Lobby.css'
import './QuickArenaThreeCol.css'

/**
 * LobbySkeleton — True-to-layout skeleton for AlgoArena Lobby
 * Replaces old raw military/red loading screen with platform-consistent tonal shimmer.
 */
export default function LobbySkeleton() {
  return (
    <div className="lobby-v2" aria-busy="true" aria-label="Loading arena lobby">
      <main className="lobby-v2-main" id="lobby-v2-content">
        {/* 1. Header Row Skeleton */}
        <div className="lobby-v2-header-block">
          <div className="lobby-v2-header-left" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="lobby-v2-skeleton-box" style={{ width: 110, height: 12, borderRadius: 3 }} />
            <div className="lobby-v2-skeleton-box" style={{ width: 240, height: 32, borderRadius: 4 }} />
            <div className="lobby-v2-skeleton-box" style={{ width: 360, height: 14, borderRadius: 3 }} />
          </div>

          <div className="lobby-v2-header-right">
            <div className="lobby-v2-stats-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="lobby-v2-skeleton-box" style={{ width: 50, height: 18, borderRadius: 3 }} />
                <div className="lobby-v2-skeleton-box" style={{ width: 8, height: 8, borderRadius: '50%' }} />
              </div>
              <div className="lobby-v2-skeleton-box" style={{ width: 90, height: 12, borderRadius: 3 }} />
            </div>
          </div>
        </div>

        {/* 2. Mode Selector Skeleton */}
        <div className="lobby-v2-mode-selector" style={{ pointerEvents: 'none' }}>
          <div className="lobby-v2-mode-tab is-active" style={{ width: 160, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="lobby-v2-skeleton-box" style={{ width: 14, height: 14, borderRadius: 3 }} />
            <div className="lobby-v2-skeleton-box" style={{ width: 80, height: 14, borderRadius: 3 }} />
          </div>
          <div className="lobby-v2-mode-tab" style={{ width: 180, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="lobby-v2-skeleton-box" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <div className="lobby-v2-skeleton-box" style={{ width: 100, height: 14, borderRadius: 3 }} />
          </div>
          <div className="lobby-v2-mode-tab" style={{ width: 150, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="lobby-v2-skeleton-box" style={{ width: 14, height: 14, borderRadius: 3 }} />
            <div className="lobby-v2-skeleton-box" style={{ width: 75, height: 14, borderRadius: 3 }} />
          </div>
        </div>

        {/* 3. Three-Column Grid Skeleton */}
        <section className="quick-arena-block" aria-hidden="true">
          <div className="quick-arena-grid">
            {/* Column 1: Topics */}
            <div className="quick-arena-col quick-arena-col-topic">
              <header className="quick-arena-col-head">
                <div className="quick-arena-col-title-wrap">
                  <span className="quick-arena-step">1</span>
                  <div className="lobby-v2-skeleton-box" style={{ width: 60, height: 16, borderRadius: 3 }} />
                </div>
              </header>

              <div className="quick-arena-topic-list" style={{ pointerEvents: 'none' }}>
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="quick-arena-topic-row" style={{ cursor: 'default' }}>
                    <div className="quick-arena-topic-left">
                      <div className="lobby-v2-skeleton-box" style={{ width: 80 + (idx % 4) * 20, height: 14, borderRadius: 3 }} />
                    </div>
                    <div className="quick-arena-topic-right">
                      <div className="lobby-v2-skeleton-box" style={{ width: 28, height: 12, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="quick-arena-scroll-footer">
                <div className="lobby-v2-skeleton-box" style={{ width: 140, height: 11, borderRadius: 2 }} />
              </div>
            </div>

            {/* Column 2: Difficulty */}
            <div className="quick-arena-col quick-arena-col-diff">
              <header className="quick-arena-col-head">
                <div className="quick-arena-col-title-wrap">
                  <span className="quick-arena-step">2</span>
                  <div className="lobby-v2-skeleton-box" style={{ width: 80, height: 16, borderRadius: 3 }} />
                </div>
              </header>

              <div className="quick-arena-diff-stack" style={{ pointerEvents: 'none' }}>
                {['Easy', 'Medium', 'Hard'].map((label, idx) => (
                  <div key={idx} className={`quick-arena-diff-card ${idx === 1 ? 'is-selected' : ''}`} style={{ cursor: 'default' }}>
                    <div className="quick-arena-diff-header-line">
                      <div className="lobby-v2-skeleton-box" style={{ width: 60, height: 16, borderRadius: 3 }} />
                      <div className="lobby-v2-skeleton-box" style={{ width: 55, height: 12, borderRadius: 3 }} />
                    </div>
                    <div className="quick-arena-diff-swing-mono">
                      <div className="lobby-v2-skeleton-box" style={{ width: 120, height: 12, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Summary Rail */}
            <div className="quick-arena-col quick-arena-col-summary">
              <header className="quick-arena-col-head">
                <div className="quick-arena-col-title-wrap">
                  <span className="quick-arena-step">3</span>
                  <div className="lobby-v2-skeleton-box" style={{ width: 110, height: 16, borderRadius: 3 }} />
                </div>
              </header>

              <div className="quick-arena-summary-body" style={{ pointerEvents: 'none' }}>
                <div className="quick-arena-dl">
                  <div className="quick-arena-dl-row">
                    <div className="lobby-v2-skeleton-box" style={{ width: 45, height: 12, borderRadius: 2 }} />
                    <div className="lobby-v2-skeleton-box" style={{ width: 100, height: 16, borderRadius: 3 }} />
                    <div className="lobby-v2-skeleton-box" style={{ width: 180, height: 12, borderRadius: 2 }} />
                  </div>

                  <div className="quick-arena-dl-row">
                    <div className="lobby-v2-skeleton-box" style={{ width: 65, height: 12, borderRadius: 2 }} />
                    <div className="lobby-v2-skeleton-box" style={{ width: 80, height: 16, borderRadius: 3 }} />
                  </div>

                  <div className="quick-arena-dl-row">
                    <div className="lobby-v2-skeleton-box" style={{ width: 120, height: 12, borderRadius: 2 }} />
                    <div className="lobby-v2-skeleton-box" style={{ width: 160, height: 14, borderRadius: 2 }} />
                  </div>
                </div>

                <div className="quick-arena-summary-cta">
                  <div className="lobby-v2-skeleton-box" style={{ width: '100%', height: 48, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

