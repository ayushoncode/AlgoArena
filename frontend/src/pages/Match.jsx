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
   STARTER TEMPLATES & DYNAMIC GENERATOR
════════════════════════════════════════════════ */
function splitArgs(inputStr) {
  if (!inputStr) return []
  const str = inputStr.replace(/\\n/g, ', ').trim()
  const list = []
  let depth = 0
  let inQuote = false
  let cur = ''
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === '"' && (i === 0 || str[i-1] !== '\\')) inQuote = !inQuote
    if (!inQuote) {
      if (c === '[' || c === '{') depth++
      else if (c === ']' || c === '}') depth--
      else if (c === ',' && depth === 0) {
        if (cur.trim()) list.push(cur.trim())
        cur = ''
        continue
      }
    }
    cur += c
  }
  if (cur.trim()) list.push(cur.trim())
  return list
}

function getParamInfo(token, index, total, title = '', topic = '') {
  const t = token.trim()
  const lowerTitle = title.toLowerCase()
  const lowerTopic = topic.toLowerCase()

  if (t.startsWith('[') && t.endsWith(']')) {
    let name = 'nums'
    if (lowerTopic.includes('linked') || lowerTitle.includes('linked') || lowerTitle.includes('list')) name = 'head'
    else if (lowerTopic.includes('tree') || lowerTitle.includes('tree') || lowerTitle.includes('bst')) name = 'root'
    else if (lowerTitle.includes('stock') || lowerTitle.includes('price')) name = 'prices'
    else if (lowerTitle.includes('water') || lowerTitle.includes('height')) name = 'height'
    else if (lowerTitle.includes('interval')) name = 'intervals'
    else if (lowerTitle.includes('matrix') || lowerTitle.includes('island')) name = 'grid'
    else if (total > 1 && index === 0) name = 'nums'
    else if (total > 1 && index === 1) name = 'nums2'

    const isMatrix = t.startsWith('[[')
    return {
      name,
      jsType: isMatrix ? 'number[][]' : 'number[]',
      pyType: isMatrix ? 'list[list[int]]' : 'list[int]',
      javaType: isMatrix ? 'int[][]' : 'int[]',
      cppType: isMatrix ? 'vector<vector<int>>&' : 'vector<int>&',
      defaultVal: isMatrix ? 'new int[][]{}' : 'new int[]{}',
      cppDefault: '{}',
    }
  }

  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    let name = 's'
    if (total > 1 && index === 1) name = 't'
    if (lowerTitle.includes('word')) name = index === 0 ? 'word1' : 'word2'
    return {
      name,
      jsType: 'string',
      pyType: 'str',
      javaType: 'String',
      cppType: 'string',
      defaultVal: '""',
      cppDefault: '""',
    }
  }

  if (t === 'true' || t === 'false') {
    return {
      name: 'flag',
      jsType: 'boolean',
      pyType: 'bool',
      javaType: 'boolean',
      cppType: 'bool',
      defaultVal: 'false',
      cppDefault: 'false',
    }
  }

  // Number
  let name = 'target'
  if (lowerTitle.includes('stair') || lowerTitle.includes('fib') || total === 1) name = 'n'
  else if (lowerTitle.includes('kth') || lowerTitle.includes('rotate') || index === 1) name = 'k'
  else if (total === 3 && index === 1) name = 'p'
  else if (total === 3 && index === 2) name = 'q'
  else if (total === 2 && index === 0) name = 'n'
  else if (total === 2 && index === 1) name = 'target'

  return {
    name,
    jsType: 'number',
    pyType: 'int',
    javaType: 'int',
    cppType: 'int',
    defaultVal: '0',
    cppDefault: '0',
  }
}

function getReturnTypeInfo(outputStr) {
  if (!outputStr) return { jsType: 'any', pyType: 'any', javaType: 'int', cppType: 'int', retValJava: '0', retValCpp: '0' }
  const out = outputStr.trim()
  if (out.startsWith('[') && out.endsWith(']')) {
    const isMatrix = out.startsWith('[[')
    return {
      jsType: isMatrix ? 'number[][]' : 'number[]',
      pyType: isMatrix ? 'list[list[int]]' : 'list[int]',
      javaType: isMatrix ? 'int[][]' : 'int[]',
      cppType: isMatrix ? 'vector<vector<int>>' : 'vector<int>',
      retValJava: isMatrix ? 'new int[][]{}' : 'new int[]{}',
      retValCpp: '{}',
    }
  }
  if (out === 'true' || out === 'false') {
    return {
      jsType: 'boolean',
      pyType: 'bool',
      javaType: 'boolean',
      cppType: 'bool',
      retValJava: 'false',
      retValCpp: 'false',
    }
  }
  if (out.startsWith('"') && out.endsWith('"')) {
    return {
      jsType: 'string',
      pyType: 'str',
      javaType: 'String',
      cppType: 'string',
      retValJava: '""',
      retValCpp: '""',
    }
  }
  return {
    jsType: 'number',
    pyType: 'int',
    javaType: 'int',
    cppType: 'int',
    retValJava: '0',
    retValCpp: '0',
  }
}

function buildStarterTemplate(problem, lang) {
  if (!problem || !problem.sample_input) {
    return TEMPLATES[lang] || TEMPLATES.javascript
  }

  const rawTokens = splitArgs(problem.sample_input)
  const params = rawTokens.map((tok, i) => getParamInfo(tok, i, rawTokens.length, problem.title, problem.topic))
  const ret = getReturnTypeInfo(problem.sample_output)

  const jsParamNames = params.map(p => p.name).join(', ')
  const jsDocParams = params.map(p => ` * @param {${p.jsType}} ${p.name}`).join('\n')

  const pyParams = params.map(p => `${p.name}: ${p.pyType}`).join(', ')
  const javaParams = params.map(p => `${p.javaType} ${p.name}`).join(', ')
  const cppParams = params.map(p => `${p.cppType} ${p.name}`).join(', ')

  if (lang === 'python') {
    return `class Solution:
    def solution(self${pyParams ? ', ' + pyParams : ''}) -> ${ret.pyType}:
        # write your solution here
        pass`
  }

  if (lang === 'java') {
    return `class Solution {
    public ${ret.javaType} solution(${javaParams}) {
        // write your solution here
        return ${ret.retValJava};
    }
}`
  }

  if (lang === 'cpp') {
    return `#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    ${ret.cppType} solution(${cppParams}) {
        // write your solution here
        return ${ret.retValCpp};
    }
};`
  }

  // Default javascript
  return `/**
${jsDocParams}
 * @return {${ret.jsType}}
 */
function solution(${jsParamNames}) {
  // write your solution here
  
}`
}

const TEMPLATES = {
  javascript: `function solution(nums, target) {
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
function ProblemPanel({ topic, difficulty, onProblemLoaded }) {
  const [problem, setProblem]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!topic) return
    api.get(`/api/problems?topic=${topic}&difficulty=${difficulty}`)
      .then(({ data }) => {
        if (data?.length) {
          setProblem(data[0])
          if (onProblemLoaded) onProblemLoaded(data[0])
        }
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
  const [userHasTyped,  setUserHasTyped]  = useState(false)
  const [lang,          setLang]          = useState('javascript')
  const [code,          setCode]          = useState(TEMPLATES.javascript)
  const [submitting,    setSubmitting]    = useState(false)

  // Verdicts & Test details & Disconnect & Opponent Progress state
  const [myVerdict,          setMyVerdict]          = useState(null)
  const [oppVerdict,         setOppVerdict]         = useState(null)
  const [myTestDetails,      setMyTestDetails]      = useState(null)
  const [oppDisconnectState, setOppDisconnectState] = useState(null)
  const [oppProgress,        setOppProgress]        = useState(null)
  const [showResignModal,    setShowResignModal]    = useState(false)

  const editorRef        = useRef(null)
  const typingTimeoutRef = useRef(null)

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
      if (roomId) localStorage.removeItem(`aa_start_${roomId}`)
      navigate('/result', { state: { ...payload, roomId } })
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

    // Rejoin match on page mount to clear server disconnect timers
    emit('rejoin_match', { roomId })

    on('match_found',          onMatchFound)
    on('submission_result',    onSubmissionResult)
    on('match_end',            onMatchEnd)
    on('player_disconnected',  onPlayerDisconnected)
    on('player_reconnected',   onPlayerReconnected)
    on('opponent_code_change', onOpponentCodeChange)

    return () => {
      off('match_found',          onMatchFound)
      off('submission_result',    onSubmissionResult)
      off('match_end',            onMatchEnd)
      off('player_disconnected',  onPlayerDisconnected)
      off('player_reconnected',   onPlayerReconnected)
      off('opponent_code_change', onOpponentCodeChange)
    }
  }, [on, off, emit, navigate, user, roomId, matchState])

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

        {/* Players summary & Exit button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: '#f97316' }}>{me?.username ?? user?.username}</span>
            <span className="font-mono text-[10px] font-bold" style={{ color: '#4b5563' }}>vs</span>
            <span className="font-mono text-[11px]" style={{ color: '#22d3ee' }}>{opp?.username ?? '…'}</span>
          </div>

          <button
            onClick={() => setShowResignModal(true)}
            className="font-mono text-[10px] font-bold px-2.5 py-1 transition-all active:scale-[0.97] flex items-center gap-1"
            style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 3 }}
            title="Resign & Exit Match"
          >
            <span>🚩</span> exit_match()
          </button>
        </div>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,10,0.85)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm p-6 space-y-4 rounded" style={{ background: '#090b13', border: '1px solid #1e2130' }}>
            <div className="flex items-center gap-2 font-display font-bold text-sm" style={{ color: '#f43f5e' }}>
              <span className="text-xl">⚠️</span> Confirm Resignation
            </div>
            <p className="font-mono text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
              Are you sure you want to exit? Your opponent will win the match and your Elo rating will be affected.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2 font-mono text-xs rounded border transition-colors"
                style={{ background: '#0d0f17', borderColor: '#1e2130', color: '#9ca3af' }}
              >
                Cancel
              </button>
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
                className="flex-1 py-2 font-mono text-xs font-bold rounded transition-all active:scale-[0.98]"
                style={{ background: '#f43f5e', color: '#ffffff' }}
              >
                Resign & Exit 🚩
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESIZABLE 3-PANEL: problem | editor | opponent ── */}
      <div className="flex flex-1 min-h-0" style={{ overflow:'hidden' }}>

        {/* PROBLEM PANEL — resizable */}
        <div style={{ width: probPanel.width, minWidth: probPanel.width, flexShrink: 0, overflow:'hidden' }}>
          <ProblemPanel
            topic={matchState?.topic}
            difficulty={matchState?.difficulty}
            forcedWidth={probPanel.width}
            onProblemLoaded={handleProblemLoaded}
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
            {oppDisconnectState ? (
              <div className="p-3 text-center space-y-2 rounded w-full" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
                <div className="text-2xl animate-bounce">⚠️</div>
                <p className="font-mono text-xs font-bold" style={{ color: '#f43f5e' }}>{oppDisconnectState.username} Disconnected</p>
                <p className="font-mono text-[9px]" style={{ color: '#9ca3af' }}>Reconnection grace period:</p>
                <p className="font-mono text-2xl font-black tabular-nums" style={{ color: '#f43f5e' }}>{oppDisconnectState.countdown}s</p>
                <p className="font-mono text-[9px]" style={{ color: '#4b5563' }}>Forfeit victory awarded if timer reaches 0s</p>
              </div>
            ) : oppVerdict === 'ACCEPTED' ? (
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
              <div className="text-center space-y-3 w-full">
                <div className="font-mono text-[9px] uppercase tracking-widest"
                     style={{ color:'#1e2130', letterSpacing:'0.12em' }}>// opponent workspace</div>

                <div className="flex items-center gap-1.5 justify-center">
                  <span className={`w-2 h-2 rounded-full ${oppProgress?.isTyping ? 'animate-ping' : ''}`}
                        style={{ background: oppProgress?.isTyping ? '#22d3ee' : '#374151', boxShadow: oppProgress?.isTyping ? '0 0 6px #22d3ee' : 'none' }}/>
                  <span className="font-mono text-[11px] font-bold" style={{ color: oppProgress?.isTyping ? '#22d3ee' : '#4b5563' }}>
                    {oppProgress?.isTyping ? `${opp?.username ?? 'opponent'} is typing…` : `${opp?.username ?? 'opponent'} is coding`}
                  </span>
                </div>

                {oppProgress && (
                  <div className="p-3 rounded space-y-2 font-mono text-[10px]" style={{ background: '#0d0f17', border: '1px solid #1e2130' }}>
                    <div className="flex justify-between" style={{ color: '#9ca3af' }}>
                      <span>Lines written:</span>
                      <span className="font-bold" style={{ color: '#22d3ee' }}>{oppProgress.lineCount || 1} lines</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#9ca3af' }}>
                      <span>Character count:</span>
                      <span className="font-bold" style={{ color: '#22d3ee' }}>{oppProgress.charCount || 0} chars</span>
                    </div>
                    <div className="w-full h-1 mt-1 rounded overflow-hidden" style={{ background: '#1e2130' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (oppProgress.lineCount || 1) * 3)}%`, background: '#22d3ee', transition: 'width 0.3s ease' }}/>
                    </div>
                  </div>
                )}

                {!oppProgress && (
                  <p className="font-mono text-[9px] text-center" style={{ color:'#374151' }}>
                    opponent's code hidden until submit
                  </p>
                )}
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
