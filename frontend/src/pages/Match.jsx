import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'
import { UserAvatar, getUserEmoji } from '../utils/avatar'
import LeetCodeProblemView from '../components/LeetCodeProblemView'
import { buildStarterTemplate, TEMPLATES } from '../utils/problemSignatures'
import { Flag, Play, ChevronUp, Clock, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { RankBadge, DiffChip, VerdictChip, getArenaTier } from '../components/ui'

import { ArenaLogo } from '../components/ArenaLogo'

/* ════════════════════════════════════════════════
   MATCH TIMER
════════════════════════════════════════════════ */
const MATCH_DURATION = 30 * 60 // 30 minutes in seconds

function useMatchTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  const remaining = Math.max(0, MATCH_DURATION - elapsed)
  const pct = ((MATCH_DURATION - remaining) / MATCH_DURATION) * 100
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const urgent = remaining < 300 // last 5 minutes
  return { display: `${mm}:${ss}`, pct, urgent, remaining }
}

/* ════════════════════════════════════════════════
   MONACO EDITOR THEME
════════════════════════════════════════════════ */
function defineTheme(monaco) {
  monaco.editor.defineTheme('algoarena', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '4A5878', fontStyle: 'italic' },
      { token: 'keyword', foreground: '38BDF8' },
      { token: 'string', foreground: 'a3e635' },
      { token: 'number', foreground: 'E11D48' },
      { token: 'function', foreground: 'F5B942' },
      { token: 'type', foreground: 'c084fc' },
      { token: 'variable', foreground: 'E2E8F4' },
      { token: 'delimiter', foreground: '8B9ABB' },
      { token: 'operator', foreground: '8B9ABB' },
    ],
    colors: {
      'editor.background': '#0B1120',
      'editor.foreground': '#E2E8F4',
      'editorLineNumber.foreground': '#4A5878',
      'editorLineNumber.activeForeground': '#E11D48',
      'editor.selectionBackground': '#E11D4830',
      'editor.lineHighlightBackground': '#121A2E',
      'editorCursor.foreground': '#E11D48',
      'editorGutter.background': '#0B1120',
      'scrollbarSlider.background': '#1B254080',
      'scrollbarSlider.hoverBackground': '#243356AA',
    },
  })
}

/* ════════════════════════════════════════════════
   LANGUAGES CONFIG
════════════════════════════════════════════════ */

const LANGS = [
  { id: 'javascript', label: 'JS' },
  { id: 'python', label: 'PY' },
  { id: 'java', label: 'JV' },
  { id: 'cpp', label: 'C++' },
]

/* ════════════════════════════════════════════════
   VERDICT BADGE
════════════════════════════════════════════════ */
function VerdictBadge({ verdict, progress }) {
  if (!verdict) return null

  const cfg = {
    ACCEPTED: { col: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', label: 'ACCEPTED' },
    WRONG_ANSWER: { col: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)', label: 'WRONG ANSWER' },
    RUNTIME_ERROR: { col: '#f43f5e', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)', label: 'RUNTIME ERROR' },
    COMPILATION_ERROR: { col: '#eab308', bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', label: 'COMPILATION ERROR' },
    TIME_LIMIT_EXCEEDED: { col: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: 'TIME LIMIT' },
    PENDING: { col: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'JUDGING...' },
  }
  const v = cfg[verdict] ?? cfg.PENDING

  const displayLabel = verdict === 'PENDING' && progress
    ? `JUDGING (${progress.testIndex}/${progress.totalTests})`
    : v.label

  return (
    <span className="font-mono text-[11px] font-bold px-3 py-1.5 verdict-in"
      style={{ background: v.bg, color: v.col, border: `1px solid ${v.border}`, borderRadius: 3 }}>
      {displayLabel}
    </span>
  )
}

/* ════════════════════════════════════════════════
   RESULTS DRAWER — LeetCode style (Run + Submit)
 ════════════════════════════════════════════════ */
function ResultsDrawer({ runResult, submitResult, submitting, submitProgress, onClose }) {
  const [tab, setTab] = useState(submitting || submitResult ? 'submit' : 'run')

  useEffect(() => {
    if (submitting) setTab('submit')
  }, [submitting])

  useEffect(() => {
    if (submitResult) setTab('submit')
  }, [submitResult])

  useEffect(() => {
    if (runResult && !submitting && !submitResult) setTab('run')
  }, [runResult, submitting, submitResult])

  if (!runResult && !submitResult && !submitting) return null

  const isLiveJudging = submitting && tab === 'submit'

  const verdictCfg = {
    ACCEPTED: { col: '#10b981', label: 'Accepted ✓' },
    WRONG_ANSWER: { col: '#f43f5e', label: 'Wrong Answer ✗' },
    TIME_LIMIT_EXCEEDED: { col: '#f59e0b', label: 'Time Limit Exceeded' },
    RUNTIME_ERROR: { col: '#f43f5e', label: 'Runtime Error' },
    COMPILATION_ERROR: { col: '#eab308', label: 'Compilation Error' },
    PENDING: { col: '#6b7280', label: 'Judging…' },
  }

  const details = tab === 'run' ? runResult : submitResult
  const vc = verdictCfg[details?.verdict] ?? verdictCfg.PENDING
  const passed = details?.passedTests ?? 0
  const total = details?.totalTests ?? 0

  const currentTest = submitProgress?.testIndex || 1
  const totalTestsCount = submitProgress?.totalTests || total || 0
  const progressPercent = totalTestsCount > 0 ? Math.min(100, Math.round((currentTest / totalTestsCount) * 100)) : 15

  return (
    <div className="shrink-0 border-t" style={{ background: '#0a0c14', borderColor: '#1e2130', maxHeight: 250, display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ background: '#07080c', borderBottom: '1px solid #1e2130' }}>
        <div className="flex items-center gap-1">
          {runResult && (
            <button onClick={() => setTab('run')}
              className="font-mono text-[10px] px-2.5 py-1 transition-all"
              style={{
                borderRadius: 3, background: tab === 'run' ? '#1e2130' : 'transparent',
                color: tab === 'run' ? '#dde1ea' : '#4b5563', border: `1px solid ${tab === 'run' ? '#374151' : 'transparent'}`
              }}>
              ▶ Run
            </button>
          )}
          {(submitResult || submitting) && (
            <button onClick={() => setTab('submit')}
              className="font-mono text-[10px] px-2.5 py-1 transition-all flex items-center gap-1.5"
              style={{
                borderRadius: 3, background: tab === 'submit' ? '#1e2130' : 'transparent',
                color: tab === 'submit' ? '#dde1ea' : '#4b5563', border: `1px solid ${tab === 'submit' ? '#374151' : 'transparent'}`
              }}>
              {isLiveJudging && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
              ⬆ Submit {isLiveJudging ? `(${currentTest}/${totalTestsCount || '...'})` : ''}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLiveJudging ? (
            <span className="font-mono text-[10px] font-bold flex items-center gap-1.5" style={{ color: '#10b981' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Judging ({currentTest}/${totalTestsCount || '...'})
            </span>
          ) : details && (
            <span className="font-mono text-[10px] font-bold" style={{ color: vc.col }}>{vc.label}</span>
          )}
          {!isLiveJudging && details && total > 0 && (
            <span className="font-mono text-[9px]" style={{ color: '#9ca3af' }}>
              {passed}/{total} cases · {details.runtimeMs || 0}ms
            </span>
          )}
          <button onClick={onClose} className="font-mono text-[11px] hover:text-white transition-colors" style={{ color: '#4b5563' }}>✕</button>
        </div>
      </div>

      {/* Live Judging Progress Bar (LeetCode Style) */}
      {isLiveJudging ? (
        <div className="flex-1 flex flex-col justify-center px-6 py-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400">Evaluating Test Cases...</span>
              <span className="text-gray-400 text-[11px]">Passing {currentTest} of {totalTestsCount || '...'}</span>
            </div>
            <span className="text-emerald-400 font-bold tabular-nums">{progressPercent}%</span>
          </div>

          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#1e2130', border: '1px solid #2e3346' }}>
            <div
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #10b981, #22d3ee)',
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)'
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Running isolated test container...</span>
            <span className="text-cyan-400/80">Test #{currentTest} active</span>
          </div>
        </div>
      ) : (
        /* Test case list */
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2" style={{ scrollbarWidth: 'thin' }}>
          {details?.testResults?.map((tc, idx) => {
            const isHiddenFailed = tc.isHidden && !tc.passed
            const borderCol = tc.passed ? 'rgba(16,185,129,0.25)' : tc.error ? 'rgba(244,63,94,0.35)' : 'rgba(245,158,11,0.3)'
            return (
              <div key={idx} className="rounded overflow-hidden" style={{ border: `1px solid ${borderCol}`, background: '#0d0f17' }}>
                {/* Row header */}
                <div className="flex items-center justify-between px-3 py-1.5" style={{ background: tc.passed ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)' }}>
                  <span className="font-mono text-[10px] font-bold" style={{ color: tc.passed ? '#10b981' : '#f43f5e' }}>
                    {tc.passed ? '✓' : '✗'} Test {tc.testIndex}{tc.isHidden ? ' (Hidden)' : ''}
                  </span>
                  {tc.runtimeMs > 0 && <span className="font-mono text-[9px]" style={{ color: '#4b5563' }}>{tc.runtimeMs}ms</span>}
                </div>

                {/* Test content */}
                {!isHiddenFailed && !tc.isHidden && (
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="font-mono text-[10px]">
                      <span style={{ color: '#4b5563' }}>Input  </span>
                      <code style={{ color: '#22d3ee' }}>{typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input ?? '')}</code>
                    </div>
                    <div className="font-mono text-[10px]">
                      <span style={{ color: '#4b5563' }}>Expected </span>
                      <code style={{ color: '#10b981' }}>{typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : String(tc.expected ?? '')}</code>
                    </div>
                    {!tc.passed && (
                      <div className="font-mono text-[10px]">
                        <span style={{ color: '#4b5563' }}>Got  </span>
                        <code style={{ color: tc.error ? '#f43f5e' : '#f59e0b' }}>
                          {tc.error ? tc.error.slice(0, 120) : (typeof tc.actual === 'object' ? JSON.stringify(tc.actual) : String(tc.actual ?? 'null'))}
                        </code>
                      </div>
                    )}
                  </div>
                )}
                {isHiddenFailed && (
                  <div className="px-3 py-2 font-mono text-[10px]" style={{ color: '#6b7280' }}>
                    {tc.error ? `Error: ${tc.error.slice(0, 100)}` : 'Output does not match expected'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
/* ════════════════════════════════════════════════
   PLAYER PANEL HEADER
════════════════════════════════════════════════ */
function PlayerHeader({ player, isMe, verdict, progress }) {
  if (!player) return null
  const playerColor = isMe ? 'var(--c-red)' : 'var(--c-blue)'
  return (
    <div className="flex items-center justify-between px-4 py-2"
      style={{ background: 'var(--c-panel2)', borderBottom: '1px solid var(--c-border)' }}>
      <div className="flex items-center gap-2.5">
        <UserAvatar username={player?.username} seed={player?.avatar_seed} style={player?.avatar_style} size={22} isMe={isMe} />
        <span className="font-mono text-[11px] font-bold" style={{ color: playerColor }}>
          {player?.username ?? '—'}
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--c-text-mute)' }}>{player?.rating ?? 1200}</span>
        {isMe && (
          <span className="font-mono text-[9px] px-1.5 py-0.5"
            style={{ background: 'rgba(225,29,72,0.1)', color: 'var(--c-red)', border: '1px solid rgba(225,29,72,0.2)' }}>You</span>
        )}
      </div>
      <VerdictChip verdict={verdict} size="xs" label={verdict === 'PENDING' && progress ? `Judging ${progress.testIndex}/${progress.totalTests}` : undefined} />
    </div>
  )
}

/* ════════════════════════════════════════════════
   PROBLEM PANEL  — LeetCode-style
   Width and collapsed state controlled entirely by parent.
   Parent passes: topic, difficulty, forcedWidth (px), onProblemLoaded, onToggleCollapse
════════════════════════════════════════════════ */
function ProblemPanel({ problemId, topic, difficulty, forcedWidth, collapsed, onToggleCollapse, onProblemLoaded }) {
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
    api.get(url)
      .then(({ data }) => {
        let prob = Array.isArray(data) ? data[0] : data
        if (prob) {
          setProblem(prob)
          if (onProblemLoaded) onProblemLoaded(prob)
        } else {
          // Fallback if specific query returns empty
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
        // Safe network fallback
        api.get('/api/problems').then(({ data: allProbs }) => {
          const fallback = Array.isArray(allProbs) ? allProbs[0] : allProbs
          if (fallback) {
            setProblem(fallback)
            if (onProblemLoaded) onProblemLoaded(fallback)
          }
        }).catch(() => { })
      })
      .finally(() => setLoading(false))
  }, [problemId, topic, difficulty])

  const DIFF = {
    easy: { col: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Easy' },
    medium: { col: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Medium' },
    hard: { col: '#E11D48', bg: 'rgba(225,29,72,0.12)', border: 'rgba(225,29,72,0.25)', label: 'Hard' },
  }
  const diff = DIFF[difficulty] || DIFF.medium

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden h-full"
      style={{
        width: collapsed ? 40 : (forcedWidth || 340),
        minWidth: collapsed ? 40 : 260,
        height: '100%',
        borderRight: '1px solid var(--c-border)',
        background: 'var(--c-panel)',
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Collapse / expand toggle strip */}
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        style={{ height: 32, borderBottom: '1px solid var(--c-border)', gap: 6, background: 'var(--c-panel2)' }}
        onMouseOver={e => e.currentTarget.style.background = 'var(--c-border)'}
        onMouseOut={e => e.currentTarget.style.background = 'var(--c-panel2)'}
        title={collapsed ? 'Expand problem' : 'Collapse'}
      >
        {!collapsed && (
          <span className="section-label">Problem</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', color: 'var(--c-text-mute)' }}>
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
          {/* Tab bar — Description */}
          {problem && (
            <div className="flex shrink-0 px-2" style={{ borderBottom: '1px solid var(--c-border)' }}>
              {[['description', 'Description']].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="px-3 font-mono text-[11px] py-2.5 transition-colors font-semibold uppercase tracking-wider"
                  style={{
                    color: activeTab === id ? 'var(--c-red)' : 'var(--c-text-mute)',
                    borderBottom: `2px solid ${activeTab === id ? 'var(--c-red)' : 'transparent'}`,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--c-border) transparent' }}>
            {loading ? (
              <div className="space-y-4 pt-2">
                <div style={{ height: 22, width: '70%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                <div style={{ height: 16, width: '30%', background: 'var(--c-border)', borderRadius: 12 }} className="animate-pulse" />
                <div className="space-y-2 pt-2">
                  <div style={{ height: 12, width: '100%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                  <div style={{ height: 12, width: '90%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                  <div style={{ height: 12, width: '95%', background: 'var(--c-border)', borderRadius: 4 }} className="animate-pulse" />
                </div>
              </div>
            ) : problem && activeTab === 'description' ? (
              <LeetCodeProblemView problem={problem} difficulty={difficulty} topic={topic} />
            ) : !problem ? (
              <p className="font-mono text-[11px] text-[#6b7280] py-4">No problem found</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Collapsed: show vertical label */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: '#374151', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Problem
          </span>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   DRAG-TO-RESIZE HOOK
════════════════════════════════════════════════ */
function useDragResize(initial, min, max) {
  const [width, setWidth] = useState(initial)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = (e) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      setWidth(Math.min(max, Math.max(min, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { width, setWidth, onMouseDown }
}

/* ════════════════════════════════════════════════
   DIVIDER HANDLE
════════════════════════════════════════════════ */
function DragHandle({ onMouseDown, onDoubleClick }) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="shrink-0 flex items-center justify-center group"
      style={{
        width: 5,
        background: 'var(--c-panel2)',
        borderLeft: '1px solid var(--c-border)',
        borderRight: '1px solid var(--c-border)',
        cursor: 'col-resize',
        zIndex: 10,
      }}
      title="Drag to resize · double-click to reset"
    >
      <div className="w-px h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--c-red)' }} />
    </div>
  )
}

/* ════════════════════════════════════════════════
   MATCH PAGE
════════════════════════════════════════════════ */
export default function Match() {
  const { roomId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()
  const { emit, on, off } = useSocket()
  const navigate = useNavigate()

  // Panel widths — draggable
  const probPanel = useDragResize(320, 220, 560)
  const [probCollapsed, setProbCollapsed] = useState(false)
  const oppPanel = useDragResize(180, 120, 360)

  // Match state from navigation, sessionStorage or socket
  const [matchState, setMatchState] = useState(() => {
    if (state) return state
    if (!roomId) return null
    try {
      const saved = sessionStorage.getItem(`aa_match_${roomId}`)
      if (saved) return JSON.parse(saved)
    } catch { }
    return null
  })

  // Persist match state to sessionStorage whenever it changes
  useEffect(() => {
    if (matchState && roomId) {
      try {
        sessionStorage.setItem(`aa_match_${roomId}`, JSON.stringify(matchState))
      } catch { }
    }
  }, [matchState, roomId])

  // Persistent match start timestamp across browser refreshes
  const [startedAt, setStartedAt] = useState(() => {
    if (!roomId) return Date.now()
    const key = `aa_start_${roomId}`
    const stored = localStorage.getItem(key)
    if (stored) return Number(stored)
    const now = state?.startedAt ?? Date.now()
    localStorage.setItem(key, String(now))
    return now
  })

  const { display: timerDisplay, urgent, remaining } = useMatchTimer(startedAt)

  // Editor state
  const [activeProblem, setActiveProblem] = useState(null)
  const [userHasTyped, setUserHasTyped] = useState(false)
  const [lang, setLang] = useState('javascript')
  const [code, setCode] = useState(TEMPLATES.javascript)
  const [submitting, setSubmitting] = useState(false)
  const [running, setRunning] = useState(false)

  // Verdicts & Test details & Disconnect & Opponent Progress state
  const [myVerdict, setMyVerdict] = useState(null)
  const [oppVerdict, setOppVerdict] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [submitProgress, setSubmitProgress] = useState(null)
  const [oppDisconnectState, setOppDisconnectState] = useState(null)
  const [oppProgress, setOppProgress] = useState(null)
  const [showResignModal, setShowResignModal] = useState(false)
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState('editor')

  const editorRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Determine which player is me and who's the opponent
  const me = matchState?.players?.find(p => p.username === user?.username)
  const opp = matchState?.players?.find(p => p.username !== user?.username)

  // ── Socket event listeners ─────────────────────────────────
  useEffect(() => {
    function onMatchFound(payload) {
      setMatchState(prev => ({ ...(prev || {}), ...payload }))
    }
    function onMatchProblemSet({ problemId }) {
      setMatchState(prev => ({ ...(prev || {}), problemId }))
    }
    function onMatchStateRestored(restored) {
      setMatchState(prev => ({ ...(prev || {}), ...restored }))
    }
    function onSubmissionStarted({ userId }) {
      if (userId === user?.id) {
        setMyVerdict('PENDING')
        setSubmitting(true)
      } else {
        setOppVerdict('PENDING')
        setOppProgress(null)
      }
    }
    function onSubmissionResult({ userId, verdict, totalTests, passedTests, testResults, runtimeMs }) {
      if (userId === user?.id) {
        setMyVerdict(verdict)
        setSubmitting(false)
        setSubmitProgress(null)
        setSubmitResult({ verdict, totalTests, passedTests, testResults, runtimeMs })
      } else {
        setOppVerdict(verdict)
        setOppProgress(null)
      }
    }
    function onSubmissionProgress({ userId, testIndex, passed, totalTests }) {
      if (userId === user?.id) {
        setSubmitProgress({ testIndex, passed, totalTests })
      } else {
        setOppProgress(prev => ({ ...prev, testIndex, passed, totalTests }))
      }
    }
    function onMatchEnd(payload) {
      setSubmitting(false)
      setSubmitProgress(null)

      const isIWinner = payload?.winner
        ? (payload.winner.userId ? String(payload.winner.userId) === String(user?.id) : (payload.winner.username && user?.username && payload.winner.username.toLowerCase() === user.username.toLowerCase()))
        : false

      if (isIWinner) {
        setMyVerdict('ACCEPTED')
      } else if (payload?.winner) {
        setOppVerdict('ACCEPTED')
      }

      if (roomId) {
        localStorage.removeItem(`aa_start_${roomId}`)
        sessionStorage.removeItem(`aa_match_${roomId}`)
      }
      // Give 1.4s for user to see the green ACCEPTED indicator before going to results
      setTimeout(() => {
        navigate('/result', { state: { ...payload, roomId } })
      }, 1400)
    }
    function onPlayerDisconnected({ userId, username, gracePeriodSec }) {
      if (userId !== user?.id) {
        setOppDisconnectState({ username, countdown: gracePeriodSec || 30 })
      }
    }
    function onPlayerReconnected({ userId }) {
      if (userId !== user?.id) {
        setOppDisconnectState(null)
      }
    }
    function onOpponentCodeChange(data) {
      if (data.userId !== user?.id) {
        setOppProgress(data)
      }
    }
    function onSocketConnect() {
      emit('rejoin_match', { roomId })
    }

    on('connect', onSocketConnect)
    on('match_found', onMatchFound)
    on('match_problem_set', onMatchProblemSet)
    on('match_state_restored', onMatchStateRestored)
    on('submission_started', onSubmissionStarted)
    on('submission_result', onSubmissionResult)
    on('submission_progress', onSubmissionProgress)
    on('match_end', onMatchEnd)
    on('player_disconnected', onPlayerDisconnected)
    on('player_reconnected', onPlayerReconnected)
    on('opponent_code_change', onOpponentCodeChange)

    // Rejoin match on page mount to clear server disconnect timers & restore match state
    emit('rejoin_match', { roomId })

    return () => {
      off('connect', onSocketConnect)
      off('match_found', onMatchFound)
      off('match_problem_set', onMatchProblemSet)
      off('match_state_restored', onMatchStateRestored)
      off('submission_started', onSubmissionStarted)
      off('submission_result', onSubmissionResult)
      off('submission_progress', onSubmissionProgress)
      off('match_end', onMatchEnd)
      off('player_disconnected', onPlayerDisconnected)
      off('player_reconnected', onPlayerReconnected)
      off('opponent_code_change', onOpponentCodeChange)
    }
  }, [on, off, emit, navigate, user, roomId])

  // Re-initialize matchState if page was refreshed directly at /match/:roomId
  useEffect(() => {
    if (!matchState && roomId) {
      const isCustom = roomId.includes('custom')
      setMatchState({
        roomId,
        topic: 'arrays',
        difficulty: 'medium',
        isCustom,
        players: [{ username: user?.username, rating: user?.elo_rating }]
      })
    }
  }, [matchState, roomId, user])

  // Disconnect countdown interval
  useEffect(() => {
    if (!oppDisconnectState || oppDisconnectState.countdown <= 0) return
    const t = setInterval(() => {
      setOppDisconnectState(prev => prev ? { ...prev, countdown: Math.max(0, prev.countdown - 1) } : null)
    }, 1000)
    return () => clearInterval(t)
  }, [oppDisconnectState])

  // Time's up
  useEffect(() => {
    if (remaining === 0) {
      navigate('/result', { state: { result: 'DRAW', roomId, matchState } })
    }
  }, [remaining, navigate, roomId, matchState])

  function handleProblemLoaded(p) {
    setActiveProblem(p)
    if (!userHasTyped) {
      setCode(buildStarterTemplate(p, lang))
    }
  }

  function handleLangChange(newLang) {
    setLang(newLang)
    setCode(buildStarterTemplate(activeProblem, newLang))
  }

  async function handleRun() {
    if (running || !activeProblem?.id) return

    // Get the most up-to-date code directly from Monaco, fallback to React state if not mounted
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;

    setRunning(true)
    setRunResult(null)
    try {
      const { data } = await api.post(`/api/problems/${activeProblem.id}/run`, {
        code: currentCode,
        language: lang,
      })
      setRunResult(data)
    } catch (err) {
      setRunResult({
        verdict: 'RUNTIME_ERROR',
        passedTests: 0,
        totalTests: 0,
        runtimeMs: 0,
        testResults: [{
          testIndex: 1, passed: false, input: '—', expected: '—', actual: null,
          error: err?.response?.data?.message || err.message, isHidden: false, runtimeMs: 0
        }],
      })
    } finally {
      setRunning(false)
    }
  }

  async function handleSubmit() {
    if (submitting || myVerdict === 'ACCEPTED') return

    const currentCode = editorRef.current ? editorRef.current.getValue() : code;

    setSubmitting(true)
    setSubmitProgress(null)
    setMyVerdict('PENDING')
    emit('submit_code', {
      roomId,
      code: currentCode,
      language: lang,
      topic: matchState?.topic,
      difficulty: matchState?.difficulty,
    })
  }

  const problem = matchState
    ? { title: `${matchState.topic} · ${matchState.difficulty}`, topic: matchState.topic }
    : { title: 'Loading match…', topic: '—' }

  return (
    <div className="flex flex-col" style={{ height: '100vh', height: '100dvh', background: 'var(--c-void)' }}>

      {/* ── MATCH HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 md:px-5 py-2 shrink-0 overflow-x-auto no-scrollbar"
        style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-panel)' }}>

        {/* Problem info & Logo */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="flex items-center pr-2 md:pr-2.5" style={{ borderRight: '1px solid var(--c-border)' }}>
            <ArenaLogo size={20} />
          </div>
          <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--c-text-mute)', letterSpacing: '0.13em' }}>
            {problem.topic}
          </div>
          <span className="hidden md:inline" style={{ color: 'var(--c-border2)' }}>·</span>
          <div className="hidden md:block">
            <DiffChip difficulty={matchState?.difficulty} />
          </div>
          <span className="hidden md:inline" style={{ color: 'var(--c-border)' }}>·</span>
          <div className="font-mono text-[9px] md:text-[10px] hidden md:block" style={{ color: 'var(--c-text-mute)' }}>
            {roomId?.slice(0, 14)}
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-auto mr-3 md:mx-0">
          <Clock size={12} className="md:w-3.5 md:h-3.5" style={{ color: urgent ? 'var(--c-red)' : 'var(--c-text-mute)' }} />
          <span
            className={`font-mono text-sm md:text-lg font-bold tabular-nums${urgent ? ' animate-pulse' : ''}`}
            style={{ color: urgent ? 'var(--c-red)' : 'var(--c-text)', minWidth: 44 }}
          >
            {timerDisplay}
          </span>
          {urgent && (
            <span className="font-mono text-[10px] animate-pulse" style={{ color: 'var(--c-red)' }}>
              Low Time!
            </span>
          )}
        </div>

        {/* Players summary & Exit button */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--c-red)' }}>
              {me?.username ?? user?.username}
            </span>
            <span className="font-mono text-[9px] font-bold" style={{ color: 'var(--c-text-mute)' }}>vs</span>
            <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--c-blue)' }}>
              {opp?.username ?? '…'}
            </span>
          </div>

          <button
            onClick={() => setShowResignModal(true)}
            className="font-mono text-[9px] md:text-[10px] font-bold px-2 md:px-2.5 py-1 transition-all active:scale-[0.97] flex items-center gap-1"
            style={{ background: 'rgba(225,29,72,0.1)', color: 'var(--c-red)', border: '1px solid rgba(225,29,72,0.3)', cursor: 'pointer' }}
            title="Resign & Exit Match"
          >
            <Flag size={10} className="md:w-[11px] md:h-[11px]" /> Resign
          </button>
        </div>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,7,15,0.88)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm p-6 space-y-4"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
            <div className="flex items-center gap-2 font-display font-bold text-sm" style={{ color: 'var(--c-red)' }}>
              <AlertTriangle size={16} /> Confirm Resignation
            </div>
            <p className="font-mono text-xs leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
              Your rival wins and your Elo will be affected. Are you sure?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2 font-mono text-xs transition-all"
                style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)', color: 'var(--c-text-dim)', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => {
                  setShowResignModal(false)
                  if (roomId) localStorage.removeItem(`aa_start_${roomId}`)
                  emit('resign_match', { roomId })
                  setTimeout(() => {
                    navigate('/result', {
                      state: {
                        roomId,
                        isForfeit: true,
                        forfeitUser: user?.username,
                        isCustom: roomId?.includes('custom'),
                        topic: matchState?.topic || 'arrays',
                        difficulty: matchState?.difficulty || 'medium',
                        winner: { username: opp?.username || 'Opponent', delta: roomId?.includes('custom') ? 0 : 18 },
                        loser: { username: user?.username, delta: roomId?.includes('custom') ? 0 : -18 },
                      }
                    })
                  }, 200)
                }}
                className="flex-1 py-2 font-mono text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                style={{ background: 'var(--c-red)', color: '#fff', cursor: 'pointer' }}
              ><Flag size={11} /> Resign & Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE TABS ── */}
      <div className="flex md:hidden items-center px-2 py-1.5 shrink-0 overflow-x-auto no-scrollbar" style={{ background: 'var(--c-panel2)', borderBottom: '1px solid var(--c-border)', gap: 8 }}>
        {[
          { id: 'problem', label: 'Problem' },
          { id: 'editor', label: 'Code' },
          { id: 'opponent', label: 'Opponent' }
        ].map(t => (
          <button key={t.id} onClick={() => setMobileTab(t.id)}
            className="font-mono text-[10px] px-3 py-1 font-bold uppercase transition-colors rounded-sm whitespace-nowrap"
            style={{
              background: mobileTab === t.id ? 'rgba(225,29,72,0.15)' : 'transparent',
              color: mobileTab === t.id ? 'var(--c-red)' : 'var(--c-text-mute)',
              border: `1px solid ${mobileTab === t.id ? 'rgba(225,29,72,0.3)' : 'transparent'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RESIZABLE 3-PANEL: problem | editor | opponent ── */}
      <div className="flex flex-1 min-h-0 relative" style={{ overflow: 'hidden' }}>

        {/* PROBLEM PANEL — resizable */}
        <div className={`${mobileTab === 'problem' ? 'flex absolute inset-0 z-10 bg-[var(--c-panel)]' : 'hidden'} md:flex flex-col shrink-0 overflow-hidden md:relative md:z-auto max-md:!w-full max-md:!min-w-0`}
          style={{
          width: probCollapsed ? 40 : probPanel.width,
          minWidth: probCollapsed ? 40 : 220,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
        }}>
          <ProblemPanel
            problemId={matchState?.problemId}
            topic={matchState?.topic}
            difficulty={matchState?.difficulty}
            forcedWidth={probPanel.width}
            collapsed={probCollapsed}
            onToggleCollapse={() => setProbCollapsed(c => !c)}
            onProblemLoaded={handleProblemLoaded}
          />
        </div>

        {/* DRAG HANDLE — problem | editor */}
        <div className="hidden md:flex">
          <DragHandle
            onMouseDown={probPanel.onMouseDown}
            onDoubleClick={() => probPanel.setWidth(240)}
          />
        </div>

        {/* EDITOR PANEL — fills remaining space */}
        <div className={`${mobileTab === 'editor' ? 'flex absolute inset-0 z-10 bg-[var(--c-void)]' : 'hidden'} md:flex flex-col flex-1 min-w-0 md:relative md:z-auto max-md:!w-full`}>
          <PlayerHeader player={me ?? { username: user?.username, rating: user?.elo_rating }} isMe={true} verdict={myVerdict} progress={submitProgress} />

          {/* Lang selector + submit */}
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
            style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-panel2)' }}>
            <div className="flex gap-1">
              {LANGS.map(l => (
                <button key={l.id} onClick={() => handleLangChange(l.id)}
                  className="font-mono text-[10px] px-2 py-1 transition-all"
                  style={{
                    background: lang === l.id ? 'rgba(225,29,72,0.12)' : 'transparent',
                    color: lang === l.id ? 'var(--c-red)' : 'var(--c-text-mute)',
                    border: `1px solid ${lang === l.id ? 'rgba(225,29,72,0.3)' : 'transparent'}`,
                    cursor: 'pointer',
                  }}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {/* Run button */}
              <button
                id="run-btn"
                onClick={handleRun}
                disabled={running || submitting}
                className="font-mono text-[11px] px-3.5 py-1.5 transition-all active:scale-[0.97] flex items-center gap-1.5"
                style={{
                  background: running ? 'var(--c-panel)' : 'rgba(56,189,248,0.1)',
                  color: running ? 'var(--c-text-mute)' : 'var(--c-blue)',
                  border: `1px solid ${running ? 'var(--c-border)' : 'rgba(56,189,248,0.3)'}`,
                  cursor: running ? 'not-allowed' : 'pointer',
                }}>
                <Play size={10} />{running ? 'Running…' : 'Run'}
              </button>

              {/* Submit button */}
              <button
                id="submit-btn"
                onClick={handleSubmit}
                disabled={submitting || myVerdict === 'ACCEPTED'}
                className="font-mono text-[11px] font-bold px-4 py-1.5 transition-all active:scale-[0.97] flex items-center gap-1.5"
                style={{
                  background: myVerdict === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : submitting ? 'var(--c-panel)' : 'var(--c-red)',
                  color: myVerdict === 'ACCEPTED' ? 'var(--c-green)' : submitting ? 'var(--c-text-mute)' : '#fff',
                  border: `1px solid ${myVerdict === 'ACCEPTED' ? 'rgba(16,185,129,0.3)' : submitting ? 'var(--c-border)' : 'var(--c-red)'}`,
                  cursor: (submitting || myVerdict === 'ACCEPTED') ? 'not-allowed' : 'pointer',
                  clipPath: myVerdict !== 'ACCEPTED' && !submitting ? 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)' : 'none',
                }}>
                {myVerdict === 'ACCEPTED'
                  ? <><CheckCircle size={10} />Accepted</>
                  : submitting
                    ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />{submitProgress ? `${submitProgress.testIndex}/${submitProgress.totalTests}` : 'Judging…'}</>
                    : <>Submit</>
                }
              </button>
            </div>
          </div>

          {/* Monaco */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={lang}
              value={code}
              onChange={v => {
                const val = v ?? ''
                setUserHasTyped(true)
                setCode(val)
                const lineCount = val.split('\n').length
                const charCount = val.length
                emit('code_change', { roomId, lineCount, charCount, isTyping: true })
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = setTimeout(() => {
                  emit('code_change', { roomId, lineCount, charCount, isTyping: false })
                }, 1200)
              }}
              theme="algoarena"
              beforeMount={defineTheme}
              onMount={e => { editorRef.current = e }}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                padding: { top: 16 },
                tabSize: 2,
                wordWrap: 'on',
                smoothScrolling: true,
                cursorBlinking: 'phase',
                renderWhitespace: 'none',
              }}
            />
          </div>

          {/* Results Drawer — Run + Submit tabs */}
          <ResultsDrawer
            runResult={runResult}
            submitResult={submitResult}
            submitting={submitting}
            submitProgress={submitProgress}
            onClose={() => { setRunResult(null); setSubmitResult(null) }}
          />
        </div>

        {/* DRAG HANDLE — editor | opponent */}
        <div className="hidden md:flex">
          <DragHandle
            onMouseDown={(e) => {
              // Dragging opponent panel from the LEFT: delta is inverted
              const dragging = { active: true, startX: e.clientX, startW: oppPanel.width }
              document.body.style.cursor = 'col-resize'
              document.body.style.userSelect = 'none'
              const onMove = (ev) => {
                if (!dragging.active) return
                const delta = dragging.startX - ev.clientX   // inverted: drag left = wider
                oppPanel.setWidth(Math.min(360, Math.max(120, dragging.startW + delta)))
              }
              const onUp = () => {
                dragging.active = false
                document.body.style.cursor = ''
                document.body.style.userSelect = ''
                window.removeEventListener('mousemove', onMove)
                window.removeEventListener('mouseup', onUp)
              }
              window.addEventListener('mousemove', onMove)
              window.addEventListener('mouseup', onUp)
            }}
            onDoubleClick={() => oppPanel.setWidth(180)}
          />
        </div>

        {/* OPPONENT PANEL */}
        <div className={`${mobileTab === 'opponent' ? 'flex absolute inset-0 z-10 bg-[var(--c-panel)]' : 'hidden'} md:flex flex-col shrink-0 md:relative md:z-auto max-md:!w-full max-md:!min-w-0`}
          style={{ width: oppPanel.width, minWidth: oppPanel.width, background: 'var(--c-panel)', overflow: 'hidden', borderLeft: '1px solid var(--c-border)' }}>
          <PlayerHeader player={opp} isMe={false} verdict={oppVerdict} progress={oppProgress} />

          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3">
            {oppDisconnectState ? (
              <div className="p-3 text-center space-y-2 w-full" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)' }}>
                <AlertTriangle size={22} style={{ color: 'var(--c-red)', margin: '0 auto' }} className="animate-bounce" />
                <p className="font-mono text-xs font-bold" style={{ color: 'var(--c-red)' }}>{oppDisconnectState.username} Disconnected</p>
                <p className="font-mono text-[9px]" style={{ color: 'var(--c-text-dim)' }}>Grace period:</p>
                <p className="font-mono text-2xl font-black tabular-nums" style={{ color: 'var(--c-red)' }}>{oppDisconnectState.countdown}s</p>
                <p className="font-mono text-[9px]" style={{ color: 'var(--c-text-mute)' }}>Forfeit victory if timer hits 0</p>
              </div>
            ) : oppVerdict === 'ACCEPTED' ? (
              <div className="text-center space-y-2">
                <CheckCircle size={24} style={{ color: 'var(--c-blue)', margin: '0 auto' }} />
                <p className="font-mono font-bold text-[11px]" style={{ color: 'var(--c-blue)' }}>
                  {opp?.username} solved it!
                </p>
                <p className="font-mono text-[9px]" style={{ color: 'var(--c-text-mute)' }}>Redirecting…</p>
              </div>
            ) : oppVerdict === 'PENDING' ? (
              <div className="text-center space-y-2">
                <div className="flex gap-1.5 justify-center">
                  {[0, 1, 2].map(i => <div key={i} className="dot-pulse" style={{ animationDelay: `${i * 0.2}s`, background: 'var(--c-blue)', width: 5, height: 5 }} />)}
                </div>
                <p className="font-mono text-[10px]" style={{ color: 'var(--c-text-mute)' }}>Judging…</p>
              </div>
            ) : (
              <div className="text-center space-y-3 w-full">
                <p className="section-label">Rival Workspace</p>

                <div className="flex items-center gap-1.5 justify-center">
                  <span className={`w-2 h-2 rounded-full ${oppProgress?.isTyping ? 'animate-ping' : ''}`}
                    style={{ background: oppProgress?.isTyping ? 'var(--c-blue)' : 'var(--c-text-mute)', boxShadow: oppProgress?.isTyping ? '0 0 6px var(--c-blue)' : 'none' }} />
                  <span className="font-mono text-[11px] font-bold"
                    style={{ color: oppProgress?.isTyping ? 'var(--c-blue)' : 'var(--c-text-mute)' }}>
                    {oppProgress?.isTyping ? `${opp?.username ?? 'Rival'} typing…` : `${opp?.username ?? 'Rival'} coding`}
                  </span>
                </div>

                {oppProgress && (
                  <div className="p-3 space-y-2 font-mono text-[10px]" style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)' }}>
                    <div className="flex justify-between" style={{ color: 'var(--c-text-dim)' }}>
                      <span>Lines:</span>
                      <span className="font-bold" style={{ color: 'var(--c-blue)' }}>{oppProgress.lineCount || 1}</span>
                    </div>
                    <div className="flex justify-between" style={{ color: 'var(--c-text-dim)' }}>
                      <span>Chars:</span>
                      <span className="font-bold" style={{ color: 'var(--c-blue)' }}>{oppProgress.charCount || 0}</span>
                    </div>
                    <div className="w-full h-1.5 mt-1 overflow-hidden" style={{ background: 'var(--c-border)' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (oppProgress.lineCount || 1) * 3)}%`, background: 'var(--c-blue)', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )}

                {!oppProgress && (
                  <p className="font-mono text-[9px] text-center" style={{ color: 'var(--c-text-mute)' }}>
                    Rival's code hidden until submit
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TIMER PROGRESS BAR (bottom) ───────────────────── */}
      <div style={{ height: 2, background: 'var(--c-border)', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: urgent ? 'var(--c-red)' : 'var(--c-blue)',
          width: `${100 - (remaining / MATCH_DURATION) * 100}%`,
          transition: 'width 1s linear, background 0.5s ease',
          boxShadow: urgent ? '0 0 8px var(--c-red)' : '0 0 6px var(--c-blue)',
        }} />
      </div>
    </div>
  )
}
