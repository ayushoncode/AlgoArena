import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import LeetCodeProblemView from '../../components/LeetCodeProblemView'

function ChevronIcon({ collapsed, size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 0.2s ease',
      }}
      aria-hidden="true"
    >
      <path d="M4 2l4 4-4 4" />
    </svg>
  )
}

export default function ProblemPanelV2({
  problemId,
  topic,
  difficulty,
  forcedWidth,
  collapsed,
  onToggleCollapse,
  onProblemLoaded,
}) {
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    let url = ''
    if (problemId) {
      url = `/api/problems/${problemId}`
    } else if (topic) {
      url = `/api/problems?topic=${topic}&difficulty=${difficulty || 'medium'}`
    } else {
      url = `/api/problems`
    }

    setLoading(true)
    api
      .get(url)
      .then(({ data }) => {
        let prob = Array.isArray(data) ? data[0] : data
        if (prob) {
          setProblem(prob)
          if (onProblemLoaded) onProblemLoaded(prob)
        } else {
          return api.get('/api/problems').then(({ data: allProbs }) => {
            const fallback = Array.isArray(allProbs) ? allProbs[0] : allProbs
            if (fallback) {
              setProblem(fallback)
              if (onProblemLoaded) onProblemLoaded(fallback)
            }
          })
        }
      })
      .catch(() => {
        api
          .get('/api/problems')
          .then(({ data: allProbs }) => {
            const fallback = Array.isArray(allProbs) ? allProbs[0] : allProbs
            if (fallback) {
              setProblem(fallback)
              if (onProblemLoaded) onProblemLoaded(fallback)
            }
          })
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [problemId, topic, difficulty])

  return (
    <aside
      className="battle-v2__problem-panel"
      style={{
        width: collapsed ? 40 : (forcedWidth || 340),
        minWidth: collapsed ? 40 : 260,
      }}
      aria-label="Problem Description"
    >
      {/* Strip to collapse / expand */}
      <div
        onClick={onToggleCollapse}
        className="battle-v2__problem-strip"
        title={collapsed ? 'Expand problem' : 'Collapse problem'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleCollapse()
          }
        }}
      >
        {!collapsed && <span className="battle-v2__problem-title-tag">Problem</span>}
        <ChevronIcon collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Tab bar */}
          {problem && (
            <div className="battle-v2__problem-tabbar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'description'}
                onClick={() => setActiveTab('description')}
                className="battle-v2__tab-btn"
              >
                Description
              </button>
            </div>
          )}

          {/* Content */}
          <div className="battle-v2__problem-body" style={{ scrollbarWidth: 'thin' }}>
            {loading ? (
              <div className="space-y-4 pt-2">
                <div style={{ height: 22, width: '70%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                <div style={{ height: 16, width: '30%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                <div className="space-y-2 pt-2">
                  <div style={{ height: 12, width: '100%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                  <div style={{ height: 12, width: '90%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                </div>
              </div>
            ) : problem && activeTab === 'description' ? (
              <LeetCodeProblemView problem={problem} difficulty={difficulty} topic={topic} />
            ) : !problem ? (
              <p className="font-mono text-xs text-[var(--c-text-dim)] py-4">No problem found</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Collapsed vertical indicator */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              color: 'var(--c-border2, rgba(255, 255, 255, 0.25))',
              fontSize: 10,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Problem
          </span>
        </div>
      )}
    </aside>
  )
}

