import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'

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
  const mm  = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss  = String(remaining % 60).padStart(2, '0')
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
      { token: 'comment',   foreground: '4b5563', fontStyle: 'italic' },
      { token: 'keyword',   foreground: '22d3ee' },
      { token: 'string',    foreground: 'a3e635' },
      { token: 'number',    foreground: 'f97316' },
      { token: 'function',  foreground: 'f97316' },
      { token: 'type',      foreground: 'c084fc' },
      { token: 'variable',  foreground: 'dde1ea' },
      { token: 'delimiter', foreground: '6b7280' },
    ],
    colors: {
      'editor.background':           '#090b13',
      'editor.foreground':           '#dde1ea',
      'editorLineNumber.foreground': '#374151',
      'editorLineNumber.activeForeground': '#f97316',
      'editor.selectionBackground':  '#f9731630',
      'editor.lineHighlightBackground': '#0d0f17',
      'editorCursor.foreground':     '#f97316',
      'editorGutter.background':     '#090b13',
      'scrollbarSlider.background':  '#1e213080',
    },
  })
}

/* ════════════════════════════════════════════════
   STARTER TEMPLATES
════════════════════════════════════════════════ */
const TEMPLATES = {
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // write your solution here
  
}`,
  python: `class Solution:
    def solution(self, nums: list[int], target: int) -> list[int]:
        # write your solution here
        pass`,
  java: `class Solution {
    public int[] solution(int[] nums, int target) {
        // write your solution here
        return new int[]{};
    }
}`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // write your solution here
        return {};
    }
};`,
}

const LANGS = [
  { id: 'javascript', label: 'JS'  },
  { id: 'python',     label: 'PY'  },
  { id: 'java',       label: 'JV'  },
  { id: 'cpp',        label: 'C++' },
]

/* ════════════════════════════════════════════════
   VERDICT BADGE
════════════════════════════════════════════════ */
function VerdictBadge({ verdict }) {
  if (!verdict) return null
  const cfg = {
    ACCEPTED:             { col: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: 'ACCEPTED ✓' },
    WRONG_ANSWER:         { col: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   label: 'WRONG ANSWER ✗' },
    TIME_LIMIT_EXCEEDED:  { col: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'TIME LIMIT' },
    RUNTIME_ERROR:        { col: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   label: 'RUNTIME ERROR' },
    PENDING:              { col: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'JUDGING...' },
  }
  const v = cfg[verdict] ?? cfg.PENDING
  return (
    <span className="font-mono text-[11px] font-bold px-3 py-1.5 verdict-in"
          style={{ background: v.bg, color: v.col, border: `1px solid ${v.border}`, borderRadius: 3 }}>
      {v.label}
    </span>
  )
}
/* ════════════════════════════════════════════════
   TEST CASE RESULTS DRAWER
════════════════════════════════════════════════ */
function TestCaseDrawer({ testDetails, onClose }) {
  if (!testDetails) return null
  const { verdict, passedTests, totalTests, runtimeMs, testResults } = testDetails
  const isAccepted = verdict === 'ACCEPTED'

  return (
    <div className="shrink-0 border-t animate-fade-in" style={{ background: '#0a0c14', borderColor: '#1e2130', maxHeight: 200, overflowY: 'auto' }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#07080c', borderBottom: '1px solid #1e2130' }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase font-bold" style={{ color: isAccepted ? '#10b981' : '#f43f5e' }}>
            {verdict}
          </span>
          <span className="font-mono text-[10px]" style={{ color: '#9ca3af' }}>
            ({passedTests ?? 0}/{totalTests ?? 0} test cases passed · {runtimeMs || 0}ms)
          </span>
        </div>
        <button onClick={onClose} className="font-mono text-[10px] hover:text-white transition-colors" style={{ color: '#4b5563' }}>✕</button>
      </div>

      <div className="p-3 space-y-2 font-mono text-[10px]">
        {testResults?.map((tc, idx) => (
          <div key={idx} className="p-2 rounded" style={{ background: '#0d0f17', border: `1px solid ${tc.passed ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: tc.passed ? '#10b981' : '#f43f5e', fontWeight: 'bold' }}>
                Test Case {tc.testIndex} {tc.passed ? '✓ Passed' : '✗ Failed'}
              </span>
              {tc.isHidden && <span className="text-[9px]" style={{ color: '#6b7280' }}>[Hidden]</span>}
            </div>
            {!tc.isHidden && (
              <div className="grid grid-cols-3 gap-2" style={{ color: '#dde1ea' }}>
                <div className="truncate"><span style={{ color: '#4b5563' }}>Input:</span> {tc.input}</div>
                <div className="truncate"><span style={{ color: '#4b5563' }}>Expected:</span> {tc.expected}</div>
                <div className="truncate"><span style={{ color: '#4b5563' }}>Actual:</span> <span style={{ color: tc.passed ? '#10b981' : '#f43f5e' }}>{tc.actual}</span></div>
              </div>
            )}
            {tc.error && <div className="mt-1" style={{ color: '#f43f5e' }}>Error: {tc.error}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
/* ════════════════════════════════════════════════
   PLAYER PANEL HEADER
════════════════════════════════════════════════ */
function PlayerHeader({ player, isMe, verdict }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5"
         style={{ background: '#07080c', borderBottom: '1px solid #1e2130' }}>
      <div className="flex items-center gap-2.5">
        {/* Avatar */}
        <span className="flex items-center justify-center font-mono font-bold text-[11px] shrink-0"
              style={{ width: 24, height: 24, background: isMe ? 'rgba(249,115,22,0.15)' : 'rgba(34,211,238,0.12)',
                       border: `1px solid ${isMe ? 'rgba(249,115,22,0.35)' : 'rgba(34,211,238,0.25)'}`,
                       borderRadius: 3, color: isMe ? '#f97316' : '#22d3ee' }}>
          {(player?.username?.[0] ?? '?').toUpperCase()}
        </span>
        <span className="font-mono text-[12px] font-bold" style={{ color: isMe ? '#f97316' : '#22d3ee' }}>
          {player?.username ?? '—'}
        </span>
        <span className="font-mono text-[10px]" style={{ color: '#4b5563' }}>{player?.rating ?? 1200}</span>
        {isMe && <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 2 }}>you</span>}
      </div>
      <VerdictBadge verdict={verdict} />
    </div>
  )
}

/* ════════════════════════════════════════════════
   PROBLEM PANEL
════════════════════════════════════════════════ */
function ProblemPanel({ topic, difficulty }) {
  const [problem, setProblem]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!topic) return
    api.get(`/api/problems?topic=${topic}&difficulty=${difficulty}`)
      .then(({ data }) => {
        if (data?.length) setProblem(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [topic, difficulty])

  const diffCols = { easy:'#10b981', medium:'#f59e0b', hard:'#f43f5e' }

  return (
    <div
      className="flex flex-col shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? 36 : 300,
        borderRight: '1px solid #1e2130',
        background: '#07080c',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute top-2 right-2 z-10 font-mono text-[10px] px-1.5 py-0.5 transition-colors"
        style={{ color:'#374151', background:'#0d0f17', border:'1px solid #1e2130', borderRadius:3 }}
        title={collapsed ? 'expand problem' : 'collapse'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {!collapsed && (
        <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth:'thin' }}>
          {/* Header */}
          <div className="px-4 py-2.5 shrink-0" style={{ borderBottom:'1px solid #1e2130' }}>
            <p className="font-mono text-[9px] uppercase tracking-widest mb-1"
               style={{ color:'#374151', letterSpacing:'0.12em' }}>// problem</p>
            {loading ? (
              <div style={{ width:120, height:12, background:'#1e2130', borderRadius:3 }}/>
            ) : problem ? (
              <>
                <p className="font-display font-bold text-[13px] leading-tight" style={{ color:'#dde1ea' }}>
                  {problem.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[9px] px-1.5 py-0.5"
                        style={{ background:`${diffCols[difficulty]}15`, color: diffCols[difficulty],
                                 border:`1px solid ${diffCols[difficulty]}40`, borderRadius:2 }}>
                    {difficulty}
                  </span>
                  <span className="font-mono text-[9px]" style={{ color:'#374151' }}>{topic}</span>
                </div>
              </>
            ) : (
              <p className="font-mono text-[11px]" style={{ color:'#4b5563' }}>no problem found</p>
            )}
          </div>

          {/* Description */}
          {problem && (
            <div className="px-4 py-3 space-y-4 flex-1">
              {/* Main description — split on code blocks */}
              <div className="font-mono text-[11px] leading-relaxed" style={{ color:'#9ca3af' }}>
                {problem.description.split('```').map((part, i) =>
                  i % 2 === 0 ? (
                    <p key={i} style={{ whiteSpace:'pre-wrap', marginBottom: 8 }}>{part.trim()}</p>
                  ) : (
                    <pre key={i} className="px-3 py-2 my-2"
                         style={{ background:'#0d0f17', border:'1px solid #1e2130', borderRadius:3,
                                  fontSize:10, color:'#dde1ea', overflowX:'auto', whiteSpace:'pre' }}>
                      {part.trim()}
                    </pre>
                  )
                )}
              </div>

              {/* Sample I/O */}
              {problem.sample_input && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5"
                     style={{ color:'#374151', letterSpacing:'0.12em' }}>// sample input</p>
                  <pre className="px-3 py-2"
                       style={{ background:'#0d0f17', border:'1px solid #1e2130', borderRadius:3,
                                fontSize:10, color:'#22d3ee', whiteSpace:'pre-wrap' }}>
                    {problem.sample_input}
                  </pre>
                </div>
              )}
              {problem.sample_output && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5"
                     style={{ color:'#374151', letterSpacing:'0.12em' }}>// expected output</p>
                  <pre className="px-3 py-2"
                       style={{ background:'#0d0f17', border:'1px solid #1e2130', borderRadius:3,
                                fontSize:10, color:'#10b981', whiteSpace:'pre-wrap' }}>
                    {problem.sample_output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed label */}
      {collapsed && (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-[9px]" style={{ color:'#374151', writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
            problem
          </p>
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
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = (e) => {
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = width
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      setWidth(Math.min(max, Math.max(min, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
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
        background: '#0d0f17',
        borderLeft:  '1px solid #1e2130',
        borderRight: '1px solid #1e2130',
        cursor: 'col-resize',
        zIndex: 10,
      }}
      title="drag to resize · double-click to reset"
    >
      <div className="w-px h-8 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ background:'#f97316' }}/>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MATCH PAGE
════════════════════════════════════════════════ */
export default function Match() {
  const { roomId }  = useParams()
  const { state }   = useLocation()
  const { user }    = useAuth()
  const { emit, on, off } = useSocket()
  const navigate    = useNavigate()

  // Panel widths — draggable
  const probPanel = useDragResize(240, 36, 480)
  const oppPanel  = useDragResize(180, 120, 360)

  // Match state from navigation or socket
  const [matchState, setMatchState] = useState(state ?? null)
  const [startedAt]  = useState(Date.now())
  const { display: timerDisplay, urgent, remaining } = useMatchTimer(startedAt)

  // Editor state
  const [lang,    setLang]    = useState('javascript')
  const [code,    setCode]    = useState(TEMPLATES.javascript)
  const [submitting, setSubmitting] = useState(false)

  // Verdicts & Test details
  const [myVerdict,      setMyVerdict]      = useState(null)
  const [oppVerdict,     setOppVerdict]     = useState(null)
  const [myTestDetails,  setMyTestDetails]  = useState(null)

  const editorRef = useRef(null)

  // Determine which player is me and who's the opponent
  const me  = matchState?.players?.find(p => p.username === user?.username)
  const opp = matchState?.players?.find(p => p.username !== user?.username)

  // ── Socket event listeners ─────────────────────────────────
  useEffect(() => {
    function onMatchFound(payload) {
      setMatchState(payload)
    }
    function onSubmissionResult({ userId, verdict, totalTests, passedTests, testResults, runtimeMs }) {
      if (userId === user?.id) {
        setMyVerdict(verdict)
        setSubmitting(false)
        setMyTestDetails({ verdict, totalTests, passedTests, testResults, runtimeMs })
        if (verdict === 'ACCEPTED') {
          // Winner — navigate to result after brief delay
          setTimeout(() => navigate('/result', { state: { result: 'WIN', roomId, verdict, matchState } }), 1800)
        }
      } else {
        setOppVerdict(verdict)
        if (verdict === 'ACCEPTED') {
          setTimeout(() => navigate('/result', { state: { result: 'LOSS', roomId, verdict: 'ACCEPTED', matchState } }), 1800)
        }
      }
    }
    function onMatchEnd(payload) {
      navigate('/result', { state: { ...payload, roomId } })
    }

    on('match_found',        onMatchFound)
    on('submission_result',  onSubmissionResult)
    on('match_end',          onMatchEnd)

    return () => {
      off('match_found',       onMatchFound)
      off('submission_result', onSubmissionResult)
      off('match_end',         onMatchEnd)
    }
  }, [on, off, navigate, user, roomId, matchState])

  // Time's up
  useEffect(() => {
    if (remaining === 0) {
      navigate('/result', { state: { result: 'DRAW', roomId, matchState } })
    }
  }, [remaining, navigate, roomId, matchState])

  function handleLangChange(newLang) {
    setLang(newLang)
    setCode(TEMPLATES[newLang])
  }

  function handleSubmit() {
    if (submitting || myVerdict === 'ACCEPTED') return
    setSubmitting(true)
    setMyVerdict('PENDING')
    emit('submit_code', {
      roomId,
      code,
      language: lang,
      topic: matchState?.topic,
      difficulty: matchState?.difficulty,
    })
  }

  const problem = matchState
    ? { title: `${matchState.topic} · ${matchState.difficulty}`, topic: matchState.topic }
    : { title: 'Loading match…', topic: '—' }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)', background: '#07080c' }}>

      {/* ── MATCH HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
           style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>

        {/* Problem info */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.13em' }}>
            {problem.topic}
          </div>
          <span style={{ color: '#1e2130' }}>·</span>
          <div className="font-mono text-[11px] font-bold" style={{ color: '#dde1ea' }}>
            {matchState?.difficulty ?? '—'}
          </div>
          <span style={{ color: '#1e2130' }}>·</span>
          <div className="font-mono text-[10px]" style={{ color: '#374151' }}>
            {roomId}
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
               strokeWidth={2} style={{ color: urgent ? '#f43f5e' : '#4b5563' }}>
            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
          </svg>
          <span className="font-mono text-lg font-bold tabular-nums"
                style={{ color: urgent ? '#f43f5e' : '#dde1ea', minWidth: 56 }}>
            {timerDisplay}
          </span>
          {urgent && (
            <span className="font-mono text-[10px] animate-pulse" style={{ color: '#f43f5e' }}>
              ← time running out
            </span>
          )}
        </div>

        {/* Players summary */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]" style={{ color: '#f97316' }}>{me?.username ?? user?.username}</span>
          <span className="font-mono text-[10px] font-bold" style={{ color: '#4b5563' }}>vs</span>
          <span className="font-mono text-[11px]" style={{ color: '#22d3ee' }}>{opp?.username ?? '…'}</span>
        </div>
      </div>

      {/* ── RESIZABLE 3-PANEL: problem | editor | opponent ── */}
      <div className="flex flex-1 min-h-0" style={{ overflow:'hidden' }}>

        {/* PROBLEM PANEL — resizable */}
        <div style={{ width: probPanel.width, minWidth: probPanel.width, flexShrink: 0, overflow:'hidden' }}>
          <ProblemPanel
            topic={matchState?.topic}
            difficulty={matchState?.difficulty}
            forcedWidth={probPanel.width}
          />
        </div>

        {/* DRAG HANDLE — problem | editor */}
        <DragHandle
          onMouseDown={probPanel.onMouseDown}
          onDoubleClick={() => probPanel.setWidth(240)}
        />

        {/* EDITOR PANEL — fills remaining space */}
        <div className="flex flex-col flex-1 min-w-0">
          <PlayerHeader player={me ?? { username: user?.username, rating: user?.elo_rating }} isMe={true} verdict={myVerdict} />

          {/* Lang selector + submit */}
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
               style={{ borderBottom: '1px solid #1e2130', background: '#0a0c15' }}>
            <div className="flex gap-1">
              {LANGS.map(l => (
                <button key={l.id} onClick={() => handleLangChange(l.id)}
                        className="font-mono text-[10px] px-2 py-1 transition-all"
                        style={{ background: lang===l.id?'rgba(249,115,22,0.12)':'transparent',
                                 color: lang===l.id?'#f97316':'#4b5563',
                                 border: `1px solid ${lang===l.id?'rgba(249,115,22,0.3)':'transparent'}`,
                                 borderRadius: 3 }}>
                  {l.label}
                </button>
              ))}
            </div>
            <button
              id="submit-btn"
              onClick={handleSubmit}
              disabled={submitting || myVerdict === 'ACCEPTED'}
              className="font-mono text-[11px] font-bold px-4 py-1.5 transition-all active:scale-[0.97]"
              style={{
                background: myVerdict==='ACCEPTED' ? 'rgba(16,185,129,0.15)' : submitting ? '#1e2130' : '#f97316',
                color:      myVerdict==='ACCEPTED' ? '#10b981'               : submitting ? '#4b5563' : '#07080c',
                border:     `1px solid ${myVerdict==='ACCEPTED'?'rgba(16,185,129,0.3)':submitting?'#1e2130':'#f97316'}`,
                borderRadius: 3, cursor: (submitting||myVerdict==='ACCEPTED') ? 'not-allowed' : 'pointer',
              }}>
              {myVerdict==='ACCEPTED' ? '✓ accepted' : submitting ? 'judging…' : 'submit →'}
            </button>
          </div>

          {/* Monaco */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={lang}
              value={code}
              onChange={v => setCode(v ?? '')}
              theme="algoarena"
              beforeMount={defineTheme}
              onMount={e => { editorRef.current = e }}
              options={{
                fontSize:             13,
                fontFamily:           "'JetBrains Mono', monospace",
                fontLigatures:        true,
                lineNumbers:          'on',
                minimap:              { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight:  'line',
                padding:              { top: 16 },
                tabSize:              2,
                wordWrap:             'on',
                smoothScrolling:      true,
                cursorBlinking:       'phase',
                renderWhitespace:     'none',
              }}
            />
          </div>

          {/* Test Case Results Drawer */}
          <TestCaseDrawer
            testDetails={myTestDetails}
            onClose={() => setMyTestDetails(null)}
          />
        </div>

        {/* DRAG HANDLE — editor | opponent */}
        <DragHandle
          onMouseDown={(e) => {
            // Dragging opponent panel from the LEFT: delta is inverted
            const dragging = { active: true, startX: e.clientX, startW: oppPanel.width }
            document.body.style.cursor     = 'col-resize'
            document.body.style.userSelect = 'none'
            const onMove = (ev) => {
              if (!dragging.active) return
              const delta = dragging.startX - ev.clientX   // inverted: drag left = wider
              oppPanel.setWidth(Math.min(360, Math.max(120, dragging.startW + delta)))
            }
            const onUp = () => {
              dragging.active = false
              document.body.style.cursor     = ''
              document.body.style.userSelect = ''
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup',   onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup',   onUp)
          }}
          onDoubleClick={() => oppPanel.setWidth(180)}
        />

        {/* OPPONENT PANEL — small by default, resizable */}
        <div className="flex flex-col shrink-0"
             style={{ width: oppPanel.width, minWidth: oppPanel.width, background:'#090b13', overflow:'hidden' }}>
          <PlayerHeader player={opp} isMe={false} verdict={oppVerdict} />

          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3">
            {oppVerdict === 'ACCEPTED' ? (
              <div className="text-center space-y-2">
                <div className="text-2xl">⚡</div>
                <p className="font-mono font-bold text-[11px]" style={{ color:'#22d3ee' }}>
                  {opp?.username} solved it!
                </p>
                <p className="font-mono text-[9px]" style={{ color:'#4b5563' }}>redirecting…</p>
              </div>
            ) : oppVerdict === 'PENDING' ? (
              <div className="text-center space-y-2">
                <div className="flex gap-1.5 justify-center">
                  {[0,1,2].map(i => <div key={i} className="dot-pulse" style={{ animationDelay:`${i*0.2}s`, background:'#22d3ee', width:5, height:5 }}/>)}
                </div>
                <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>judging…</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="font-mono text-[9px] uppercase tracking-widest"
                     style={{ color:'#1e2130', letterSpacing:'0.12em' }}>// opp</div>
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background:'#22d3ee', boxShadow:'0 0 4px #22d3ee' }}/>
                  <span className="font-mono text-[10px]" style={{ color:'#4b5563' }}>
                    {opp?.username ?? '…'}
                  </span>
                </div>
                <p className="font-mono text-[9px] text-center" style={{ color:'#1e2130' }}>
                  coding
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TIMER PROGRESS BAR (bottom) ───────────────────── */}
      <div style={{ height: 2, background: '#1e2130', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: urgent ? '#f43f5e' : '#f97316',
          width: `${100 - (remaining / MATCH_DURATION) * 100}%`,
          transition: 'width 1s linear, background 0.5s ease',
        }}/>
      </div>
    </div>
  )
}
