import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'
import { UserAvatar, getUserEmoji } from '../utils/avatar'
import LeetCodeProblemView from '../components/LeetCodeProblemView'
import { buildStarterTemplate, TEMPLATES } from '../utils/problemSignatures'
import { Flag, Play, ChevronUp, Clock, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { RankBadge, DiffChip, VerdictChip, getArenaTier } from '../components/ui'
import BattleRoomV2 from './Match/BattleRoomV2'
import EditorToolbarV2 from './Match/EditorToolbarV2'
import RunConsoleV2 from './Match/RunConsoleV2'
import { usePremium } from '../hooks/usePremium'
import { usePremiumBadges } from '../hooks/usePremiumBadges'
import { useLiveVoice } from '../voice/useLiveVoice'
import VoiceControl from '../components/voice/VoiceControl'
import VoiceDock from '../components/voice/VoiceDock'
import VoiceRow from '../components/voice/VoiceRow'
import VoiceBottomSheet from '../components/voice/VoiceBottomSheet'
import VoiceMobileStrip from '../components/voice/VoiceMobileStrip'
import IncomingVoicePrompt from '../components/voice/IncomingVoicePrompt'
import VoiceFirstUseModal from '../components/voice/VoiceFirstUseModal'
import VoiceSettingsModal from '../components/voice/VoiceSettingsModal'
import VoiceReportModal from '../components/voice/VoiceReportModal'
import VoiceBlockModal from '../components/voice/VoiceBlockModal'
import { IconAlert, IconClose } from '../components/voice/VoiceIcons'

import { ArenaLogo } from '../components/ArenaLogo'
import { setActiveMatch, clearActiveMatch } from '../utils/activeMatch'

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
  // Legacy theme definition kept for ?ui=legacy
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

  // AlgoArena V2 Dark Theme (Clean Neutral Developer Dark Mode)
  monaco.editor.defineTheme('algoarena-v2-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: '38bdf8' },
      { token: 'string', foreground: '86efac' },
      { token: 'number', foreground: 'fcd34d' },
      { token: 'function', foreground: 'f3f4f6' },
      { token: 'type', foreground: 'a1a1aa' },
      { token: 'variable', foreground: 'f3f4f6' },
      { token: 'delimiter', foreground: '71717a' },
      { token: 'operator', foreground: '38bdf8' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#f3f4f6',
      'editorLineNumber.foreground': '#52525b',
      'editorLineNumber.activeForeground': '#38bdf8',
      'editor.selectionBackground': '#38bdf81f',
      'editor.lineHighlightBackground': '#27272a',
      'editorCursor.foreground': '#f3f4f6',
      'editorGutter.background': '#1e1e1e',
      'scrollbarSlider.background': '#3f3f4666',
      'scrollbarSlider.hoverBackground': '#52525b99',
    },
  })

  // AlgoArena V2 Light Theme
  monaco.editor.defineTheme('algoarena-v2-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0284c7' },
      { token: 'string', foreground: '15803d' },
      { token: 'number', foreground: 'b45309' },
      { token: 'function', foreground: '0a1428' },
      { token: 'type', foreground: '475569' },
      { token: 'variable', foreground: '0a1428' },
      { token: 'delimiter', foreground: '94a3b8' },
      { token: 'operator', foreground: '0284c7' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#0a1428',
      'editorLineNumber.foreground': '#94a3b8',
      'editorLineNumber.activeForeground': '#0284c7',
      'editor.selectionBackground': '#0284c725',
      'editor.lineHighlightBackground': '#0284c70a',
      'editorCursor.foreground': '#0a1428',
      'editorGutter.background': '#ffffff',
      'scrollbarSlider.background': '#e2e8f0aa',
      'scrollbarSlider.hoverBackground': '#cbd5e1cc',
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
    PENDING: { col: 'var(--c-text-dim)', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'JUDGING...' },
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
    PENDING: { col: 'var(--c-text-dim)', label: 'Judging…' },
  }

  const details = tab === 'run' ? runResult : submitResult
  const vc = verdictCfg[details?.verdict] ?? verdictCfg.PENDING
  const passed = details?.passedTests ?? 0
  const total = details?.totalTests ?? 0

  const currentTest = submitProgress?.testIndex || 1
  const totalTestsCount = submitProgress?.totalTests || total || 0
  const progressPercent = totalTestsCount > 0 ? Math.min(100, Math.round((currentTest / totalTestsCount) * 100)) : 15

  return (
    <div className="shrink-0 border-t" style={{ background: 'var(--c-void)', borderColor: 'var(--c-border)', maxHeight: 250, display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-1">
          {runResult && (
            <button onClick={() => setTab('run')}
              className="font-mono text-[10px] px-2.5 py-1 transition-all"
              style={{
                borderRadius: 3, background: tab === 'run' ? 'var(--c-border)' : 'transparent',
                color: tab === 'run' ? 'var(--c-text)' : 'var(--c-text-mute)', border: `1px solid ${tab === 'run' ? 'var(--c-border2)' : 'transparent'}`
              }}>
              ▶ Run
            </button>
          )}
          {(submitResult || submitting) && (
            <button onClick={() => setTab('submit')}
              className="font-mono text-[10px] px-2.5 py-1 transition-all flex items-center gap-1.5"
              style={{
                borderRadius: 3, background: tab === 'submit' ? 'var(--c-border)' : 'transparent',
                color: tab === 'submit' ? 'var(--c-text)' : 'var(--c-text-mute)', border: `1px solid ${tab === 'submit' ? 'var(--c-border2)' : 'transparent'}`
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
            <span className="font-mono text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
              {passed}/{total} cases · {details.runtimeMs || 0}ms
            </span>
          )}
          <button onClick={onClose} className="font-mono text-[11px] hover:text-white transition-colors" style={{ color: 'var(--c-text-mute)' }}>✕</button>
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

          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)', border: '1px solid var(--c-border2)' }}>
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
              <div key={idx} className="rounded overflow-hidden" style={{ border: `1px solid ${borderCol}`, background: 'var(--c-panel2)' }}>
                {/* Row header */}
                <div className="flex items-center justify-between px-3 py-1.5" style={{ background: tc.passed ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)' }}>
                  <span className="font-mono text-[10px] font-bold" style={{ color: tc.passed ? '#10b981' : '#f43f5e' }}>
                    {tc.passed ? '✓' : '✗'} Test {tc.testIndex}{tc.isHidden ? ' (Hidden)' : ''}
                  </span>
                  {tc.runtimeMs > 0 && <span className="font-mono text-[9px]" style={{ color: 'var(--c-text-mute)' }}>{tc.runtimeMs}ms</span>}
                </div>

                {/* Test content */}
                {!isHiddenFailed && !tc.isHidden && (
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="font-mono text-[10px]">
                      <span style={{ color: 'var(--c-text-mute)' }}>Input  </span>
                      <code style={{ color: '#22d3ee' }}>{typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input ?? '')}</code>
                    </div>
                    <div className="font-mono text-[10px]">
                      <span style={{ color: 'var(--c-text-mute)' }}>Expected </span>
                      <code style={{ color: '#10b981' }}>{typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : String(tc.expected ?? '')}</code>
                    </div>
                    {!tc.passed && (
                      <div className="font-mono text-[10px]">
                        <span style={{ color: 'var(--c-text-mute)' }}>Got  </span>
                        <code style={{ color: tc.error ? '#f43f5e' : '#f59e0b' }}>
                          {tc.error ? tc.error.slice(0, 120) : (typeof tc.actual === 'object' ? JSON.stringify(tc.actual) : String(tc.actual ?? 'null'))}
                        </code>
                      </div>
                    )}
                  </div>
                )}
                {isHiddenFailed && (
                  <div className="px-3 py-2 font-mono text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
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
  const playerColor = isMe ? '#e2e8f4' : 'var(--info, #38bdf8)'
  return (
    <div className="flex items-center justify-between px-4 py-2"
      style={{ background: 'var(--c-panel2)', borderBottom: '1px solid var(--c-border)' }}>
      <div className="flex items-center gap-2.5">
        <UserAvatar username={player?.username} seed={player?.avatar_seed} style={player?.avatar_style} size={22} isMe={isMe} />
        <span className="font-mono text-[11px] font-bold" style={{ color: playerColor }}>
          {player?.username ?? '—'}
        </span>
        <span className="font-mono text-[10px]" style={{ color: 'var(--c-gold, #ffd696)' }}>{player?.rating ?? 1200}</span>
        {isMe && (
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm"
            style={{ background: 'transparent', color: '#e2e8f4', border: '1px solid var(--c-border, rgba(255,255,255,0.16))' }}>You</span>
        )}
      </div>
      {verdict && <VerdictChip verdict={verdict} size="xs" label={verdict === 'PENDING' && progress ? `Judging ${progress.testIndex}/${progress.totalTests}` : undefined} />}
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
              <p className="font-mono text-[11px] text-[var(--c-text-dim)] py-4">No problem found</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Collapsed: show vertical label */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--c-border2)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
  const { theme } = useTheme()
  const { roomId } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()
  const { connected, emit, on, off, socket } = useSocket()
  const navigate = useNavigate()

  // Panel widths — draggable
  const probPanel = useDragResize(320, 220, 560)
  const [probCollapsed, setProbCollapsed] = useState(false)
  const oppPanel = useDragResize(280, 260, 360)

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

  // Remember this match across tabs so an accidentally closed tab can rejoin
  useEffect(() => {
    if (roomId) setActiveMatch(roomId, user?.id)
  }, [roomId, user?.id])

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
  const [codeMap, setCodeMap] = useState({ javascript: TEMPLATES.javascript })
  const code = codeMap[lang] ?? TEMPLATES.javascript
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
      if (restored?.startedAt && roomId) {
        setStartedAt(restored.startedAt)
        try { localStorage.setItem(`aa_start_${roomId}`, String(restored.startedAt)) } catch { }
      }
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
        clearActiveMatch(roomId)
      }
      try { emit('leave_queue') } catch { }
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
    function onMatchNotFound({ roomId: rid }) {
      if (rid && rid !== roomId) return
      clearActiveMatch(roomId)
      localStorage.removeItem(`aa_start_${roomId}`)
      sessionStorage.removeItem(`aa_match_${roomId}`)
      navigate('/lobby', { replace: true })
    }

    on('match_not_found', onMatchNotFound)
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
      off('match_not_found', onMatchNotFound)
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

  // Prevent browser back button during an active match
  useEffect(() => {
    if (myVerdict === 'ACCEPTED' || remaining === 0) return

    window.history.pushState(null, '', window.location.href)

    function handlePopState(e) {
      window.history.pushState(null, '', window.location.href)
      setShowResignModal(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [myVerdict, remaining])

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
      clearActiveMatch(roomId)
      navigate('/result', { state: { result: 'DRAW', roomId, matchState } })
    }
  }, [remaining, navigate, roomId, matchState])

  function handleProblemLoaded(p) {
    setActiveProblem(p)
    if (!userHasTyped) {
      setCodeMap(prev => ({ ...prev, [lang]: buildStarterTemplate(p, lang) }))
    }
  }

  function handleLangChange(newLang) {
    setLang(newLang)
    if (!codeMap[newLang]) {
      setCodeMap(prev => ({ ...prev, [newLang]: buildStarterTemplate(activeProblem, newLang) }))
    }
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

  function handleConfirmResign() {
    setShowResignModal(false)
    if (roomId) localStorage.removeItem(`aa_start_${roomId}`)
    clearActiveMatch(roomId)
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
  }

  function handleOpponentDrag(e) {
    const dragging = { active: true, startX: e.clientX, startW: oppPanel.width }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev) => {
      if (!dragging.active) return
      const delta = dragging.startX - ev.clientX
      oppPanel.setWidth(Math.min(360, Math.max(260, dragging.startW + delta)))
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
  }

  const [searchParams] = useSearchParams()
  const isLegacy = searchParams.get('ui') === 'legacy' || import.meta.env.VITE_BATTLE_UI === 'legacy'

  const { isPremium: isMePremium, openLockedModal } = usePremium()
  const oppId = opp?.userId || opp?.id
  const oppBadges = usePremiumBadges(opp?.username ? [opp.username] : [], oppId ? [oppId] : [])
  const oppBadgeResolved = Boolean(
    opp?.username && (
      oppBadges[opp.username.toLowerCase()] !== undefined ||
      (oppId && oppBadges[oppId] !== undefined)
    )
  )
  const isOppPremium = Boolean(
    opp?.username && (
      oppBadges[opp.username.toLowerCase()] ||
      (oppId && oppBadges[oppId])
    )
  )

  const [showVoiceBottomSheet, setShowVoiceBottomSheet] = useState(false)

  const voice = useLiveVoice({
    roomId,
    me: me || (user ? { id: user.id, username: user.username } : null),
    opp,
    socket,
    isConnected: connected,
    isMePremium,
    isOppPremium,
    oppBadgeResolved,
  })

  const voiceControlElement = (
    <VoiceControl
      voiceState={voice.voiceState}
      isMicMuted={voice.isMicMuted}
      mutedByOpponent={voice.mutedByOpponent}
      speakingLevel={voice.speakingLevel}
      outputVolume={voice.outputVolume}
      isOpponentMutedLocally={voice.isOpponentMutedLocally}
      isMePremium={isMePremium}
      isOppPremium={isOppPremium}
      requestExpiresAt={voice.requestExpiresAt}
      onOpenPremium={() => openLockedModal('voice_chat')}
      onRequestVoice={voice.requestVoice}
      onAcceptVoice={voice.acceptVoice}
      onDeclineVoice={voice.declineVoice}
      onEndVoice={voice.endVoice}
      onToggleMute={voice.toggleMute}
      onToggleOpponentMute={voice.toggleOpponentMuteLocally}
      onChangeVolume={voice.changeOutputVolume}
      onOpenSettings={() => voice.setShowSettingsModal(true)}
      onOpenReport={() => voice.setShowReportModal(true)}
      onOpenBlock={() => voice.setShowBlockModal(true)}
      onOpenBottomSheet={() => setShowVoiceBottomSheet(true)}
    />
  )

  const voiceRowElement = (
    <VoiceRow
      voiceState={voice.voiceState}
      isMicMuted={voice.isMicMuted}
      mutedByOpponent={voice.mutedByOpponent}
      isOpponentSpeaking={voice.isOpponentSpeaking}
      speakingLevel={voice.speakingLevel}
      opponentSpeakingLevel={voice.opponentSpeakingLevel}
      quality={voice.quality}
      outputVolume={voice.outputVolume}
      isOpponentMutedLocally={voice.isOpponentMutedLocally}
      isMePremium={isMePremium}
      isOppPremium={isOppPremium}
      requestExpiresAt={voice.requestExpiresAt}
      errorMessage={voice.errorMessage}
      onOpenPremium={() => openLockedModal('voice_chat')}
      onRequestVoice={voice.requestVoice}
      onAcceptVoice={voice.acceptVoice}
      onDeclineVoice={voice.declineVoice}
      onEndVoice={voice.endVoice}
      onToggleMute={voice.toggleMute}
      onToggleOpponentMute={voice.toggleOpponentMuteLocally}
      onChangeVolume={voice.changeOutputVolume}
      onOpenSettings={() => voice.setShowSettingsModal(true)}
      onOpenReport={() => voice.setShowReportModal(true)}
      onOpenBlock={() => voice.setShowBlockModal(true)}
      onClearError={voice.clearError}
    />
  )

  const voiceMobileStripElement = (voice.voiceState === 'connected' || voice.voiceState === 'live') ? (
    <VoiceMobileStrip
      isMicMuted={voice.isMicMuted}
      isOpponentMutedLocally={voice.isOpponentMutedLocally}
      onToggleMute={voice.toggleMute}
      onToggleOpponentMute={voice.toggleOpponentMuteLocally}
      onEndVoice={voice.endVoice}
    />
  ) : null

  const voiceDockElement = (voice.voiceState === 'connected' || voice.voiceState === 'live' || voice.voiceState === 'reconnecting') ? (
    <VoiceDock
      opp={opp}
      isMicMuted={voice.isMicMuted}
      mutedByOpponent={voice.mutedByOpponent}
      isOpponentSpeaking={voice.isOpponentSpeaking}
      speakingLevel={voice.speakingLevel}
      opponentSpeakingLevel={voice.opponentSpeakingLevel}
      quality={voice.quality}
      outputVolume={voice.outputVolume}
      isOpponentMutedLocally={voice.isOpponentMutedLocally}
      onToggleMute={voice.toggleMute}
      onToggleOpponentMute={voice.toggleOpponentMuteLocally}
      onChangeVolume={voice.changeOutputVolume}
      onOpenSettings={() => voice.setShowSettingsModal(true)}
      onOpenReport={() => voice.setShowReportModal(true)}
      onOpenBlock={() => voice.setShowBlockModal(true)}
      onEndVoice={voice.endVoice}
    />
  ) : null

  const voiceIncomingPromptElement = voice.voiceState === 'incoming' ? (
    <IncomingVoicePrompt
      opponentName={opp?.username || 'Opponent'}
      requestExpiresAt={voice.requestExpiresAt}
      onAccept={voice.acceptVoice}
      onDecline={voice.declineVoice}
    />
  ) : null

  const voiceErrorBannerElement = voice.errorMessage ? (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <IconAlert size={14} />
        <span>{voice.errorMessage}</span>
      </div>
      <button
        type="button"
        onClick={voice.clearError}
        className="p-1 hover:opacity-80"
        aria-label="Dismiss error"
      >
        <IconClose size={12} />
      </button>
    </div>
  ) : null

  if (!isLegacy) {
    return (
      <>
        <BattleRoomV2
          topic={matchState?.topic}
          difficulty={matchState?.difficulty}
          roomId={roomId}
          timerDisplay={timerDisplay}
          remaining={remaining}
          me={me}
          opp={opp}
          user={user}
          connected={connected}
          showResignModal={showResignModal}
          onCloseResign={() => setShowResignModal(false)}
          onConfirmResign={handleConfirmResign}
          onOpenResign={() => setShowResignModal(true)}
          problemId={matchState?.problemId}
          probPanelWidth={probPanel.width}
          probCollapsed={probCollapsed}
          onToggleCollapse={() => setProbCollapsed(c => !c)}
          onProblemLoaded={handleProblemLoaded}
          onMouseDownProb={probPanel.onMouseDown}
          onResetProbWidth={() => probPanel.setWidth(320)}
          oppVerdict={oppVerdict}
          oppProgress={oppProgress}
          oppDisconnectState={oppDisconnectState}
          oppPanelWidth={oppPanel.width}
          onMouseDownOpp={handleOpponentDrag}
          onResetOppWidth={() => oppPanel.setWidth(280)}
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          voiceControl={voiceControlElement}
          voiceDock={voiceDockElement}
          voiceIncomingPrompt={voiceIncomingPromptElement}
          voiceErrorBanner={voiceErrorBannerElement}
          voiceSlotForRival={voiceRowElement}
          voiceMobileStrip={voiceMobileStripElement}
          isOpponentSpeaking={voice.isOpponentSpeaking}
        >
          <div className="flex flex-col flex-1 h-full min-w-0">
            <EditorToolbarV2
              player={me ?? { username: user?.username, rating: user?.elo_rating }}
              user={user}
              verdict={myVerdict}
              progress={submitProgress}
              langs={LANGS}
              lang={lang}
              onLangChange={handleLangChange}
              running={running}
              submitting={submitting}
              onRun={handleRun}
              onSubmit={handleSubmit}
            />

            {/* Monaco */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={lang}
                value={code}
                onChange={v => {
                  const val = v ?? ''
                  setUserHasTyped(true)
                  setCodeMap(prev => ({ ...prev, [lang]: val }))
                  const lineCount = val.split('\n').length
                  const charCount = val.length
                  emit('code_change', { roomId, lineCount, charCount, isTyping: true })
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                  typingTimeoutRef.current = setTimeout(() => {
                    emit('code_change', { roomId, lineCount, charCount, isTyping: false })
                  }, 1200)
                }}
                theme={theme === 'dark' ? 'algoarena-v2-dark' : 'algoarena-v2-light'}
                beforeMount={defineTheme}
                onMount={e => {
                  editorRef.current = e
                  window.__monacoMountCount = (window.__monacoMountCount || 0) + 1
                }}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontLigatures: false,
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

            {/* Results Console V2 */}
            <RunConsoleV2
              runResult={runResult}
              submitResult={submitResult}
              submitting={submitting}
              submitProgress={submitProgress}
              onClose={() => { setRunResult(null); setSubmitResult(null) }}
            />
          </div>
        </BattleRoomV2>

        {/* Voice Modals */}
        <VoiceFirstUseModal
          isOpen={voice.showFirstUseModal}
          onClose={() => voice.setShowFirstUseModal(false)}
          onContinue={voice.markFirstUseAcked}
          onConfirm={voice.markFirstUseAcked}
        />
        <VoiceSettingsModal
          isOpen={voice.showSettingsModal}
          onClose={() => voice.setShowSettingsModal(false)}
          pushToTalk={voice.pushToTalkEnabled}
          onTogglePushToTalk={() => voice.setPushToTalkEnabled(s => !s)}
        />
        <VoiceReportModal
          isOpen={voice.showReportModal}
          onClose={() => voice.setShowReportModal(false)}
          reportedUser={opp}
          matchId={matchState?.dbMatchId || null}
        />
        <VoiceBlockModal
          isOpen={voice.showBlockModal}
          onClose={() => voice.setShowBlockModal(false)}
          blockedUser={opp}
          onBlocked={() => {
            voice.endVoice()
          }}
        />
        <VoiceBottomSheet
          isOpen={showVoiceBottomSheet}
          onClose={() => setShowVoiceBottomSheet(false)}
          opp={opp}
          voiceState={voice.voiceState}
          isMicMuted={voice.isMicMuted}
          quality={voice.quality}
          outputVolume={voice.outputVolume}
          isOpponentMutedLocally={voice.isOpponentMutedLocally}
          isMePremium={isMePremium}
          isOppPremium={isOppPremium}
          onOpenPremium={() => openLockedModal('voice_chat')}
          onRequestVoice={voice.requestVoice}
          onAcceptVoice={voice.acceptVoice}
          onDeclineVoice={voice.declineVoice}
          onEndVoice={voice.endVoice}
          onToggleMute={voice.toggleMute}
          onToggleOpponentMute={voice.toggleOpponentMuteLocally}
          onChangeVolume={voice.changeOutputVolume}
          onOpenReport={() => voice.setShowReportModal(true)}
          onOpenBlock={() => voice.setShowBlockModal(true)}
        />
      </>
    )
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

          {voiceDockElement || voiceControlElement}

          <button
            onClick={() => setShowResignModal(true)}
            className="font-mono text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 transition-all active:scale-[0.97] flex items-center gap-2 rounded hover:brightness-110"
            style={{ background: 'rgba(225,29,72,0.15)', color: 'var(--c-red)', border: '1px solid rgba(225,29,72,0.5)', cursor: 'pointer', boxShadow: '0 0 10px rgba(225,29,72,0.1)' }}
            title="Resign & Exit Match"
          >
            <Flag size={14} className="md:w-4 md:h-4" /> Resign
          </button>
        </div>
      </div>

      {/* Voice Banners */}
      {voiceErrorBannerElement && (
        <div className="shrink-0 px-3 py-1.5 bg-rose-500/10 border-b border-rose-500/30 text-[var(--bad)] text-xs font-mono flex items-center justify-between">
          {voiceErrorBannerElement}
        </div>
      )}
      {voiceIncomingPromptElement && (
        <div className="shrink-0 px-3 py-1.5 border-b border-[var(--c-border)] bg-[var(--c-panel2)]">
          {voiceIncomingPromptElement}
        </div>
      )}

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
                  clearActiveMatch(roomId)
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
                setCodeMap(prev => ({ ...prev, [lang]: val }))
                const lineCount = val.split('\n').length
                const charCount = val.length
                emit('code_change', { roomId, lineCount, charCount, isTyping: true })
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = setTimeout(() => {
                  emit('code_change', { roomId, lineCount, charCount, isTyping: false })
                }, 1200)
              }}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
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
                oppPanel.setWidth(Math.min(360, Math.max(260, dragging.startW + delta)))
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
            onDoubleClick={() => oppPanel.setWidth(280)}
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

      {/* Voice Modals */}
      <VoiceFirstUseModal
        isOpen={voice.showFirstUseModal}
        onClose={() => voice.setShowFirstUseModal(false)}
        onContinue={voice.markFirstUseAcked}
        onConfirm={voice.markFirstUseAcked}
      />
      <VoiceSettingsModal
        isOpen={voice.showSettingsModal}
        onClose={() => voice.setShowSettingsModal(false)}
        pushToTalk={voice.pushToTalkEnabled}
        onTogglePushToTalk={() => voice.setPushToTalkEnabled(s => !s)}
      />
      <VoiceReportModal
        isOpen={voice.showReportModal}
        onClose={() => voice.setShowReportModal(false)}
        reportedUser={opp}
        matchId={roomId}
      />
      <VoiceBlockModal
        isOpen={voice.showBlockModal}
        onClose={() => voice.setShowBlockModal(false)}
        blockedUser={opp}
        onBlocked={() => {
          voice.endVoice()
        }}
      />
    </div>
  )
}
