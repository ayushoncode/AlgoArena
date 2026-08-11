import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/* ════════════════════════════════════════════════
   TYPEWRITER HOOK
   Recursive setTimeout → realistic random cadence
════════════════════════════════════════════════ */
function useTypewriter(text, msPerChar = 28, startAfterMs = 0) {
  const [pos, setPos]     = useState(0)
  const timerRef          = useRef(null)

  useEffect(() => {
    setPos(0)
    const go = (i) => {
      timerRef.current = setTimeout(() => {
        if (i < text.length) {
          setPos(i + 1)
          go(i + 1)
        }
      }, msPerChar + Math.random() * 18 - 9)
    }
    const starter = setTimeout(() => go(0), startAfterMs)
    return () => { clearTimeout(starter); clearTimeout(timerRef.current) }
  }, [text]) // eslint-disable-line

  return { typed: text.slice(0, pos), done: pos >= text.length }
}

/* ════════════════════════════════════════════════
   BATTLE CODE CONTENT
════════════════════════════════════════════════ */
const YOU_CODE = `// HashMap — O(n)
function twoSum(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) {
      return [seen.get(need), i]
    }
    seen.set(nums[i], i)
  }
}`

const OPP_CODE = `// Brute force — O(n²)
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j]
      }
    }
  }
}`

/* ════════════════════════════════════════════════
   CODE PANEL  (one side of the battle)
════════════════════════════════════════════════ */
const KW  = new Set(['function','const','let','var','return','if','for','new','of','has','get','set'])
const COMMENT_RE = /^(\/\/.*)$/
const NUM_RE = /\b(\d+)\b/g
const KW_RE  = new RegExp(`\\b(${[...KW].join('|')})\\b`, 'g')

function CodeLine({ line, lineNo }) {
  const isComment = COMMENT_RE.test(line.trim())
  if (isComment) {
    return (
      <div className="flex">
        <span className="select-none w-8 text-right pr-4 shrink-0" style={{ color:'#3b4261' }}>{lineNo}</span>
        <span style={{ color:'#4b5563' }}>{line}</span>
      </div>
    )
  }
  // tokenize keywords + numbers
  const parts = []
  let last = 0
  const allMatches = []
  for (const m of line.matchAll(KW_RE))  allMatches.push({ i: m.index, len: m[0].length, type:'kw',  val: m[0] })
  for (const m of line.matchAll(NUM_RE)) allMatches.push({ i: m.index, len: m[0].length, type:'num', val: m[0] })
  allMatches.sort((a,b) => a.i - b.i)

  for (const { i, len, type, val } of allMatches) {
    if (i < last) continue
    if (i > last) parts.push(<span key={last} style={{ color:'#dde1ea' }}>{line.slice(last, i)}</span>)
    parts.push(<span key={i} style={{ color: type === 'kw' ? '#f97316' : '#22d3ee' }}>{val}</span>)
    last = i + len
  }
  if (last < line.length) parts.push(<span key={last} style={{ color:'#dde1ea' }}>{line.slice(last)}</span>)

  return (
    <div className="flex">
      <span className="select-none w-8 text-right pr-4 shrink-0" style={{ color:'#3b4261' }}>{lineNo}</span>
      <span>{parts}</span>
    </div>
  )
}

function CodePanel({ typed, showCursor, verdict, label, rating, you }) {
  const lines = typed.split('\n')
  const borderColor = verdict === 'ACCEPTED' ? '#10b981'
                    : verdict === 'WRONG'    ? '#f43f5e'
                    : '#1e2130'
  const transition = 'border-color 0.4s ease'

  return (
    <div className="flex flex-col" style={{ border: `1px solid ${borderColor}`, transition, borderRadius: 4, overflow:'hidden' }}>

      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2"
           style={{ background:'#0b0d14', borderBottom:'1px solid #1e2130' }}>
        <div className="flex items-center gap-2">
          {you
            ? <span className="dot-live" />
            : <span style={{ width:7, height:7, borderRadius:'50%', background:'#374151', display:'inline-block' }} />
          }
          <span className="font-mono text-xs" style={{ color: you ? '#dde1ea' : '#6b7280' }}>
            {label}
          </span>
          <span className="font-mono text-xs font-bold" style={{ color: you ? '#f97316' : '#6b7280' }}>
            [{rating}]
          </span>
        </div>

        {/* Verdict chip */}
        {verdict && (
          <span
            className="verdict-in font-mono text-[10px] font-bold px-2 py-0.5"
            style={{
              borderRadius: 3,
              background: verdict === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              color:       verdict === 'ACCEPTED' ? '#10b981'               : '#f43f5e',
              border:      `1px solid ${verdict === 'ACCEPTED' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            }}
          >
            {verdict}
          </span>
        )}
      </div>

      {/* Code area */}
      <div className="p-4 font-mono text-[12.5px] leading-6 flex-1"
           style={{ background:'#090b13', minHeight: 220, overflowY:'auto' }}>
        {lines.map((line, i) => (
          <CodeLine key={i} line={line} lineNo={i + 1} />
        ))}
        {showCursor && !verdict && (
          <div className="flex">
            <span className="select-none w-8 text-right pr-4 shrink-0" style={{ color:'#3b4261' }}>
              {lines.length + 1}
            </span>
            <span className="cursor-blink inline-block w-2 h-[1em] align-middle"
                  style={{ background: you ? '#f97316' : '#6b7280' }} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   BATTLE CYCLE  (remounts on each loop iteration)
════════════════════════════════════════════════ */
const PHASES = { CODING: 'coding', RUNNING: 'running', ACCEPTED: 'accepted', RESULT: 'result' }

function BattleCycle({ onComplete }) {
  const [phase,    setPhase]    = useState(PHASES.CODING)
  const [timerSec, setTimerSec] = useState(30 * 60)

  // Typing — you are FASTER
  const you = useTypewriter(YOU_CODE, 24, 300)
  const opp = useTypewriter(OPP_CODE, 40, 600)

  // Countdown timer
  useEffect(() => {
    if (phase === PHASES.RESULT) return
    const t = setInterval(() => setTimerSec(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [phase])

  // Phase transitions when YOU finish typing
  useEffect(() => {
    if (!you.done || phase !== PHASES.CODING) return
    setPhase(PHASES.RUNNING)
    const t1 = setTimeout(() => setPhase(PHASES.ACCEPTED), 1400)
    const t2 = setTimeout(() => setPhase(PHASES.RESULT),   3200)
    const t3 = setTimeout(() => onComplete(),               6000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [you.done]) // eslint-disable-line

  const mm   = String(Math.floor(timerSec / 60)).padStart(2, '0')
  const ss   = String(timerSec % 60).padStart(2, '0')
  const low  = timerSec < 300

  return (
    <div style={{ background:'#0b0d14', border:'1px solid #1e2130', borderRadius: 6, overflow:'hidden' }}>

      {/* Match bar */}
      <div className="flex items-center justify-between px-4 py-2.5"
           style={{ borderBottom:'1px solid #1e2130', background:'#09090f' }}>

        {/* You */}
        <div className="flex items-center gap-2">
          <span className="dot-live" />
          <span className="font-mono text-xs text-[#dde1ea]">ayush_dev</span>
          <span className="font-mono text-[11px] font-bold" style={{ color:'#f97316' }}>1347</span>
        </div>

        {/* Center: timer + topic */}
        <div className="text-center">
          <div className="font-mono text-sm font-bold tabular-nums"
               style={{ color: low ? '#f43f5e' : '#dde1ea', fontVariantNumeric:'tabular-nums' }}>
            {mm}:{ss}
          </div>
          <div className="font-mono text-[10px]" style={{ color:'#4b5563', marginTop: 1 }}>
            Two Sum · arrays · medium
          </div>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#374151', display:'inline-block' }} />
          <span className="font-mono text-xs text-[#6b7280]">cipher99</span>
          <span className="font-mono text-[11px] font-bold text-[#6b7280]">1389</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 font-mono text-[11px] flex items-center gap-2"
           style={{ background:'#07080c', borderBottom:'1px solid #1e2130', color:'#4b5563' }}>
        {phase === PHASES.CODING  && <><span className="dot-live" style={{ width:5,height:5 }}/> live match in progress</>}
        {phase === PHASES.RUNNING && <span style={{ color:'#f97316' }}>▶ running 247 test cases...</span>}
        {phase === PHASES.ACCEPTED && <span style={{ color:'#10b981' }} className="verdict-in">✓ all tests passed — ACCEPTED</span>}
        {phase === PHASES.RESULT  && (
          <span style={{ color:'#10b981' }} className="verdict-in">
            🏆 you win! +18 elo → 1365 &nbsp;·&nbsp; cipher99 loses −18 elo
          </span>
        )}
      </div>

      {/* Two code panels */}
      <div className="grid grid-cols-2 gap-px" style={{ background:'#1e2130' }}>
        <CodePanel
          typed={you.typed}
          showCursor={!you.done}
          verdict={phase === PHASES.ACCEPTED || phase === PHASES.RESULT ? 'ACCEPTED' : null}
          label="ayush_dev"
          rating={1347}
          you={true}
        />
        <CodePanel
          typed={opp.typed}
          showCursor={!opp.done && phase === PHASES.CODING}
          verdict={phase === PHASES.RESULT ? 'WRONG ANSWER' : null}
          label="cipher99"
          rating={1389}
          you={false}
        />
      </div>
    </div>
  )
}

function BattlePreview() {
  const [cycleKey, setCycleKey] = useState(0)
  return <BattleCycle key={cycleKey} onComplete={() => setCycleKey(k => k + 1)} />
}

/* ════════════════════════════════════════════════
   AUTH FORMS
════════════════════════════════════════════════ */
function Field({ id, label, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-widest block mb-1.5"
             style={{ color:'#4b5563', letterSpacing:'0.12em' }}>
        {label}
      </label>
      <input
        id={id} type={type} autoComplete={autoComplete}
        placeholder={placeholder} value={value} onChange={onChange}
        className="input-field"
      />
    </div>
  )
}

function Err({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up font-mono text-[11px] flex items-center gap-1.5"
       style={{ color:'#f43f5e' }}>
      <span>✕</span>{msg}
    </p>
  )
}

function StrBar({ pw }) {
  if (!pw) return null
  const score = [pw.length>=8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length
  const col   = ['#f43f5e','#f43f5e','#f59e0b','#f59e0b','#10b981'][score]
  const lbl   = ['','weak','fair','fair','strong'][score]
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i=>(
          <div key={i} className="h-px flex-1 transition-all duration-300"
               style={{ background: i<=score ? col : '#1e2130' }} />
        ))}
      </div>
      <span className="font-mono text-[10px] w-8 text-right" style={{ color:'#4b5563' }}>{lbl}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
    </svg>
  )
}

function LoginForm({ onSwitch }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email:'', password:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const set = f => e => { setForm(p=>({...p,[f]:e.target.value})); setErr('') }

  async function go(e) {
    e.preventDefault()
    if (!form.email||!form.password) { setErr('all fields required'); return }
    setBusy(true)
    await new Promise(r=>setTimeout(r,700))
    setErr('backend offline — wired in day 6')
    setBusy(false)
  }

  return (
    <form onSubmit={go} className="space-y-6 fade-in" noValidate>
      <Err msg={err} />
      <Field id="l-email"    label="Email"    type="email"    placeholder="you@example.com" autoComplete="email"            value={form.email}    onChange={set('email')} />
      <Field id="l-password" label="Password" type="password" placeholder="••••••••"       autoComplete="current-password" value={form.password} onChange={set('password')} />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input id="remember" type="checkbox" className="w-3.5 h-3.5 accent-orange-500" />
          <span className="font-mono text-[11px]" style={{ color:'#4b5563' }}>remember me</span>
        </label>
        <button type="button" className="font-mono text-[11px] transition-colors"
                style={{ color:'#f97316' }}
                onMouseOver={e=>e.target.style.color='#22d3ee'}
                onMouseOut={e=>e.target.style.color='#f97316'}>
          forgot password?
        </button>
      </div>

      <button id="login-submit" type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? <><Spinner/> authenticating...</> : <>sign_in() →</>}
      </button>

      <p className="font-mono text-[11px] text-center" style={{ color:'#4b5563' }}>
        no account?{' '}
        <button type="button" id="switch-to-register" onClick={onSwitch}
                className="transition-colors" style={{ color:'#f97316' }}
                onMouseOver={e=>e.target.style.color='#22d3ee'}
                onMouseOut={e=>e.target.style.color='#f97316'}>
          register →
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({ username:'', email:'', password:'', confirm:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const set = f => e => { setForm(p=>({...p,[f]:e.target.value})); setErr('') }

  function validate() {
    if (Object.values(form).some(v=>!v))               return 'all fields required'
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username))  return 'username: 3–30 chars, letters/numbers/_'
    if (!/\S+@\S+\.\S+/.test(form.email))              return 'invalid email'
    if (form.password.length < 6)                       return 'password: min 6 chars'
    if (form.password !== form.confirm)                 return "passwords don't match"
    return null
  }

  async function go(e) {
    e.preventDefault()
    const err = validate(); if(err){ setErr(err); return }
    setBusy(true)
    await new Promise(r=>setTimeout(r,700))
    setErr('backend offline — wired in day 6')
    setBusy(false)
  }

  return (
    <form onSubmit={go} className="space-y-5 fade-in" noValidate>
      <Err msg={err}/>
      <Field id="r-user"   label="Username" placeholder="coolcoder42"      autoComplete="username"     value={form.username} onChange={set('username')}/>
      <Field id="r-email"  label="Email"    type="email" placeholder="you@example.com" autoComplete="email"    value={form.email}    onChange={set('email')}/>
      <div>
        <Field id="r-pw"   label="Password" type="password" placeholder="min. 6 characters" autoComplete="new-password" value={form.password} onChange={set('password')}/>
        <StrBar pw={form.password}/>
      </div>
      <Field id="r-conf"   label="Confirm"  type="password" placeholder="repeat password"   autoComplete="new-password" value={form.confirm}  onChange={set('confirm')}/>

      <button id="register-submit" type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? <><Spinner/> creating account...</> : <>create_account() →</>}
      </button>

      <p className="font-mono text-[11px] text-center" style={{ color:'#4b5563' }}>
        have an account?{' '}
        <button type="button" id="switch-to-login" onClick={onSwitch}
                className="transition-colors" style={{ color:'#f97316' }}
                onMouseOver={e=>e.target.style.color='#22d3ee'}
                onMouseOut={e=>e.target.style.color='#f97316'}>
          sign in →
        </button>
      </p>
    </form>
  )
}

/* ════════════════════════════════════════════════
   HOME  —  final layout
════════════════════════════════════════════════ */
export default function Home() {
  const [mode, setMode] = useState('login')
  const [searchParams] = useSearchParams()

  // Sync tab from ?auth=login|register (set by Navbar buttons)
  useEffect(() => {
    const param = searchParams.get('auth')
    if (param === 'login' || param === 'register') {
      setMode(param)
      // Scroll to auth panel
      setTimeout(() => {
        document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [searchParams])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">

      {/* ── HERO STRIP: label + battle sim ──────────────────── */}
      <section style={{ borderBottom:'1px solid #1e2130' }} className="px-5 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* label row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="dot-live" />
              <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color:'#4b5563', letterSpacing:'0.14em' }}>
                simulated live match
              </span>
            </div>
            <span className="font-mono text-[11px]" style={{ color:'#4b5563' }}>
              Two Sum · arrays · medium
            </span>
          </div>

          {/* The battle */}
          <BattlePreview />

          {/* Headline — underneath the battle, not above it */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10">
            <h1 className="font-display font-extrabold leading-none tracking-tighter text-[#dde1ea]"
                style={{ fontSize:'clamp(2.2rem,5vw,3.5rem)' }}>
              1v1 competitive<br/>
              coding battles.<br/>
              <span style={{ color:'#f97316' }}>Elo-ranked.</span>
            </h1>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color:'#6b7280', paddingBottom:'0.2em' }}>
              Two players. Same problem. First{' '}
              <span className="font-mono text-[#10b981]">ACCEPTED</span>{' '}
              verdict wins — and steals Elo. Matchmaking expands ±100 every 10 s.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM: features left, auth right ───────────────── */}
      <div className="flex-1 grid lg:grid-cols-[1fr_380px]" style={{ '--col-divide':'1px solid #1e2130' }}>

        {/* Features column */}
        <section className="px-5 sm:px-8 py-10" style={{ borderRight:'1px solid #1e2130' }}>
          <div className="max-w-lg space-y-8">

            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color:'#4b5563', letterSpacing:'0.14em' }}>
              // how it works
            </p>

            <ol className="space-y-6">
              {[
                {
                  n: '01',
                  title: 'Pick a topic + find a match',
                  desc:  'Arrays, graphs, DP, strings. Elo band starts at ±100 and widens every 10 s so nobody waits forever.',
                  code:  'arena.findMatch({ topic: "arrays" })',
                },
                {
                  n: '02',
                  title: 'Race to solve — live',
                  desc:  'Both players get the same problem. You can see when your opponent is typing. No sandbagging.',
                  code:  'socket.on("opponent_typing", ...)',
                },
                {
                  n: '03',
                  title: 'Verdict streams from the sandbox',
                  desc:  'Code runs in Docker — network off, 256 MB RAM, 0.5 CPU, 5 s timeout. First ACCEPTED wins.',
                  code:  'docker run --network none --memory 256m',
                },
              ].map(({ n, title, desc, code }) => (
                <li key={n} className="flex gap-5 group">
                  <span className="font-mono text-sm font-bold mt-0.5 w-5 shrink-0"
                        style={{ color:'#f97316' }}>{n}</span>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-sm" style={{ color:'#dde1ea' }}>{title}</p>
                    <p className="text-sm leading-relaxed" style={{ color:'#6b7280' }}>{desc}</p>
                    <p className="font-mono text-[11px]" style={{ color:'#374151' }}>{code}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Security footnote */}
            <div className="pt-2" style={{ borderTop:'1px solid #1e2130' }}>
              <p className="font-mono text-[11px] leading-relaxed" style={{ color:'#374151' }}>
                <span style={{ color:'#4b5563' }}>sandbox flags →</span>{' '}
                --network none --memory 256m --cpus 0.5 --pids-limit 50 --read-only --rm
              </p>
            </div>
          </div>
        </section>

        {/* Auth column — id="auth" is the scroll target for Navbar buttons */}
        <section id="auth" className="px-8 py-10 flex flex-col">

          {/* Tab row */}
          <div className="flex items-center gap-6 mb-10" style={{ borderBottom:'1px solid #1e2130', paddingBottom: '0.75rem' }}>
            {['login','register'].map(m => (
              <button
                key={m}
                id={`tab-${m}`}
                onClick={() => setMode(m)}
                className="font-mono text-[12px] pb-0.5 transition-colors"
                style={{
                  color:       mode === m ? '#dde1ea' : '#4b5563',
                  borderBottom: mode === m ? '2px solid #f97316' : '2px solid transparent',
                  paddingBottom: '0.6rem',
                  marginBottom: '-0.75rem',
                }}
              >
                {m === 'login' ? 'sign_in' : 'register'}
              </button>
            ))}
            <span className="ml-auto font-mono text-[10px]" style={{ color:'#374151' }}>
              {mode === 'login' ? '// returning player' : '// new account'}
            </span>
          </div>

          {/* Form */}
          <div className="flex-1">
            {mode === 'login'
              ? <LoginForm    key="login"    onSwitch={() => setMode('register')} />
              : <RegisterForm key="register" onSwitch={() => setMode('login')} />
            }
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8" style={{ borderTop:'1px solid #1e2130' }}>
            <p className="font-mono text-[10px] leading-5" style={{ color:'#374151' }}>
              rating system → Elo K=32 (K=40 under 10 matches, K=16 above 2000)
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
