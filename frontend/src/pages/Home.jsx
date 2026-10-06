/**
 * AlgoArena — "Assemble the Arena" Landing Page
 * ─────────────────────────────────────────────
 * Theme: Cinematic · HUD-style · Deep Space Navy
 * 
 * CONFIG OBJECT — edit numbers here only
 */

/* ════════ SITE CONFIG (edit these numbers) ════════ */
const SITE_CONFIG = {
  problemCount: 175,
  languages: 4,
  sandboxTimeout: '5s',
  sandboxRAM: '512MB',
  matchmakingLatency: '<25ms',
  eloKFactor: 32,
  dockerVersion: 'Runner v2',
}

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { UserAvatar } from '../utils/avatar'
import { ArenaEmblem, ArenaLogo } from '../components/ArenaLogo'

const HeroScene3D = lazy(() => import('../components/HeroScene3D'))
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion'
import {
  Zap, Shield, Trophy, Swords, Users, ChevronDown,
  ChevronRight, Menu, X, Check, AlertTriangle, Clock,
  Star, ArrowRight, Code2, Eye, Activity, Lock,
  Target, Cpu
} from 'lucide-react'

/* ═══════════════════════════════════════════════════
   MOTION VARIANTS
═══════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

function SectionReveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}



/* ═══════════════════════════════════════════════════
   STARFIELD CANVAS — clean deep-space drifting stars
═══════════════════════════════════════════════════ */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const hidden = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.offsetWidth
    let H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    // Static deep-space stars (white, very small, barely moving)
    const STAR_COUNT = 120
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.15,
      alpha: Math.random() * 0.5 + 0.1,
      twinkleSpeed: Math.random() * 0.008 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
    }))

    // A handful of colored accent orbs (red / cyan glow)
    const ORB_COUNT = 6
    const orbs = Array.from({ length: ORB_COUNT }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.35 + 0.1,
      color: i % 2 === 0 ? '#E11D48' : '#00C2FF',
      twinkleSpeed: Math.random() * 0.006 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
    }))

    let t = 0

    function draw() {
      if (hidden.current) { frameRef.current = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, W, H)
      t += 1

      // Draw stars
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy
        if (s.x < 0) s.x = W
        if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H
        if (s.y > H) s.y = 0
        const flicker = s.alpha * (0.75 + 0.25 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset))
        ctx.globalAlpha = flicker
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw accent orbs
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy
        if (o.x < 0) o.x = W
        if (o.x > W) o.x = 0
        if (o.y < 0) o.y = H
        if (o.y > H) o.y = 0
        const flicker = o.alpha * (0.7 + 0.3 * Math.sin(t * o.twinkleSpeed + o.twinkleOffset))
        ctx.globalAlpha = flicker
        ctx.fillStyle = o.color
        ctx.beginPath()
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      frameRef.current = requestAnimationFrame(draw)
    }

    const onResize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    const onVis = () => { hidden.current = document.hidden }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)
    draw()
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

/* ═══════════════════════════════════════════════════
   TYPEWRITER HOOK
═══════════════════════════════════════════════════ */
function useTypewriter(text, msPerChar = 28, startAfterMs = 0) {
  const [pos, setPos] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    setPos(0)
    const go = (i) => {
      timerRef.current = setTimeout(() => {
        if (i < text.length) { setPos(i + 1); go(i + 1) }
      }, msPerChar + Math.random() * 18 - 9)
    }
    const starter = setTimeout(() => go(0), startAfterMs)
    return () => { clearTimeout(starter); clearTimeout(timerRef.current) }
  }, [text]) // eslint-disable-line

  return { typed: text.slice(0, pos), done: pos >= text.length }
}

/* ═══════════════════════════════════════════════════
   CODE SNIPPETS — Duel Preview
═══════════════════════════════════════════════════ */
const YOU_CODE = `// O(n) — Hash Map approach
function twoSum(nums, target) {
  const map = new Map()
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i]
    if (map.has(comp)) {
      return [map.get(comp), i]
    }
    map.set(nums[i], i)
  }
}`

const OPP_CODE = `// O(n²) — Brute force
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i+1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j]
      }
    }
  }
}`

const KW = new Set(['function', 'const', 'let', 'var', 'return', 'if', 'for', 'new', 'of', 'has', 'get', 'set'])
const COMMENT_RE = /^(\/\/.*)$/
const NUM_RE = /\b(\d+)\b/g
const KW_RE = new RegExp(`\\b(${[...KW].join('|')})\\b`, 'g')

function CodeLine({ line, lineNo }) {
  const isComment = COMMENT_RE.test(line.trim())
  if (isComment) return (
    <div className="flex">
      <span className="select-none w-7 text-right pr-3 shrink-0" style={{ color: 'var(--c-border2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{lineNo}</span>
      <span style={{ color: 'var(--c-text-mute)', fontFamily: 'var(--font-mono)', fontSize: 11, fontStyle: 'italic' }}>{line}</span>
    </div>
  )
  const parts = []; let last = 0; const allM = []
  for (const m of line.matchAll(KW_RE)) allM.push({ i: m.index, len: m[0].length, type: 'kw', val: m[0] })
  for (const m of line.matchAll(NUM_RE)) allM.push({ i: m.index, len: m[0].length, type: 'num', val: m[0] })
  allM.sort((a, b) => a.i - b.i)
  for (const { i, len, type, val } of allM) {
    if (i < last) continue
    if (i > last) parts.push(<span key={last} style={{ color: 'var(--c-text)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{line.slice(last, i)}</span>)
    parts.push(<span key={i} style={{ color: type === 'kw' ? 'var(--c-red)' : 'var(--c-blue)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{val}</span>)
    last = i + len
  }
  if (last < line.length) parts.push(<span key={last} style={{ color: 'var(--c-text)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{line.slice(last)}</span>)
  return (
    <div className="flex">
      <span className="select-none w-7 text-right pr-3 shrink-0" style={{ color: 'var(--c-border2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{lineNo}</span>
      <span>{parts}</span>
    </div>
  )
}

function DuelCodePanel({ typed, showCursor, verdict, label, rating, isYou }) {
  const lines = typed.split('\n')
  const verdictColor = verdict === 'ACCEPTED' ? '#10b981' : verdict === 'TIME LIMIT EXCEEDED' ? '#F5B942' : '#E11D48'
  return (
    <div
      className="flex flex-col overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--c-panel)',
        border: `1px solid ${verdict ? verdictColor + '50' : 'var(--c-border)'}`,
      }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: 'var(--c-panel)', borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-2">
          {isYou
            ? <span className="dot-live" />
            : <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-text-mute)' }} />
          }
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: isYou ? 'var(--c-text)' : 'var(--c-text-mute)' }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: isYou ? 'var(--c-blue)' : 'var(--c-text-mute)' }}>[{rating}]</span>
        </div>
        {verdict && (
          <span
            className="verdict-in"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              padding: '2px 8px', borderRadius: 2,
              background: `${verdictColor}20`, color: verdictColor,
              border: `1px solid ${verdictColor}40`,
            }}
          >
            {verdict}
          </span>
        )}
      </div>
      {/* Code body */}
      <div className="p-3 flex-1 overflow-hidden" style={{ minHeight: 160 }}>
        {lines.map((line, i) => <CodeLine key={i} line={line} lineNo={i + 1} />)}
        {showCursor && !verdict && (
          <div className="flex">
            <span className="select-none w-7 text-right pr-3 shrink-0" style={{ color: 'var(--c-border2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{lines.length + 1}</span>
            <span className="cursor-blink inline-block w-2 h-[0.9em] align-middle" style={{ background: isYou ? '#E11D48' : 'var(--c-text-mute)' }} />
          </div>
        )}
      </div>
    </div>
  )
}

const DP = { CODING: 'coding', RUNNING: 'running', ACCEPTED: 'accepted', RESULT: 'result' }

function BattleCycle({ onComplete }) {
  const [phase, setPhase] = useState(DP.CODING)
  const [timerSec, setTimerSec] = useState(30 * 60)
  const you = useTypewriter(YOU_CODE, 22, 200)
  const opp = useTypewriter(OPP_CODE, 38, 500)

  useEffect(() => {
    if (phase === DP.RESULT) return
    const t = setInterval(() => setTimerSec(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (!you.done || phase !== DP.CODING) return
    setPhase(DP.RUNNING)
    const t1 = setTimeout(() => setPhase(DP.ACCEPTED), 1200)
    const t2 = setTimeout(() => setPhase(DP.RESULT), 2800)
    const t3 = setTimeout(() => onComplete(), 5800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [you.done]) // eslint-disable-line

  const mm = String(Math.floor(timerSec / 60)).padStart(2, '0')
  const ss = String(timerSec % 60).padStart(2, '0')

  // Progress bars
  const youProgress = you.done ? 100 : Math.round((you.typed.length / YOU_CODE.length) * 100)
  const oppProgress = opp.done ? 100 : Math.round((opp.typed.length / OPP_CODE.length) * 100)

  return (
    <div style={{ background: 'var(--c-panel)', border: '1px solid #1C2842' }}>
      {/* Match bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: 'var(--c-panel)', borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-2">
          <span className="dot-live" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>you</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#38BDF8' }}>1347</span>
        </div>
        <div className="text-center">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--c-text)', fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>Two Sum · arrays · medium</div>
        </div>
        <div className="flex items-center gap-2 flex-row-reverse">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-text-mute)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>opponent</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--c-text-mute)' }}>1389</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="px-4 py-2 grid grid-cols-2 gap-3 border-b" style={{ borderColor: 'var(--c-border)', background: 'var(--c-panel)' }}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#38BDF8' }}>YOU</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#38BDF8' }}>{youProgress}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: 'var(--c-border)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${youProgress}%`, background: 'linear-gradient(90deg, #E11D48, #38BDF8)' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>OPP</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>{oppProgress}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: 'var(--c-border)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${oppProgress}%`, background: 'var(--c-border2)' }} />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-1.5 text-[11px] flex items-center gap-2 border-b" style={{ fontFamily: 'var(--font-mono)', borderColor: 'var(--c-border)', background: 'var(--c-void)', color: 'var(--c-text-mute)' }}>
        {phase === DP.CODING && <><span className="dot-live" style={{ width: 5, height: 5 }} /> 1v1 match in progress · live typing</>}
        {phase === DP.RUNNING && <span style={{ color: '#F5B942' }}>▶ executing in docker sandbox…</span>}
        {phase === DP.ACCEPTED && <span className="verdict-in" style={{ color: '#10b981' }}>✓ 10/10 test cases passed — ACCEPTED</span>}
        {phase === DP.RESULT && (
          <span className="verdict-in" style={{ color: '#F5B942', fontWeight: 700 }}>
            VICTORY +18 Elo → 1365  ·  Opponent loses −18 Elo
          </span>
        )}
      </div>

      {/* Split panes */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 1, background: 'var(--c-border)' }}>
        <DuelCodePanel
          typed={you.typed}
          showCursor={!you.done}
          verdict={phase === DP.ACCEPTED || phase === DP.RESULT ? 'ACCEPTED' : null}
          label="you (O(n) optimal)"
          rating={1347}
          isYou={true}
        />
        <DuelCodePanel
          typed={opp.typed}
          showCursor={!opp.done && phase === DP.CODING}
          verdict={phase === DP.RESULT ? 'TIME LIMIT EXCEEDED' : null}
          label="opponent (O(n²) brute)"
          rating={1389}
          isYou={false}
        />
      </div>

      {phase === DP.RESULT && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-3 text-center"
          style={{ background: 'rgba(245,185,66,0.05)', borderTop: '1px solid rgba(245,185,66,0.2)' }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#F5B942', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            VICTORY — +18 ELO
          </span>
        </motion.div>
      )}
    </div>
  )
}

function BattlePreview() {
  const [key, setKey] = useState(0)
  return <BattleCycle key={key} onComplete={() => setKey(k => k + 1)} />
}

/* ═══════════════════════════════════════════════════
   AUTH COMPONENTS (logic preserved exactly)
═══════════════════════════════════════════════════ */
function OtpDigitsInput({ length = 6, value, onChange }) {
  const inputs = useRef([])
  function handleChange(e, index) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    const arr = value.split(''); arr[index] = val || ''
    onChange(arr.join(''))
    if (val && index < length - 1) inputs.current[index + 1]?.focus()
  }
  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !value[index] && index > 0) inputs.current[index - 1]?.focus()
  }
  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, length - 1)]?.focus()
  }
  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={el => (inputs.current[i] = el)}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
          value={value[i] || ''} onChange={e => handleChange(e, i)} onKeyDown={e => handleKeyDown(e, i)}
          className="otp-digit"
        />
      ))}
    </div>
  )
}

function Field({ id, label, type = 'text', placeholder, value, onChange, autoComplete, rightElement }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-mute)' }}>{label}</label>
        {rightElement}
      </div>
      <input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={onChange} className="input-field" />
    </div>
  )
}

function PasswordField({ id, label, placeholder, value, onChange, autoComplete, rightLabel, onRightClick }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-mute)' }}>{label}</label>
        {rightLabel && <button type="button" onClick={onRightClick} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-red)' }} className="hover:underline">{rightLabel}</button>}
      </div>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={onChange} className="input-field pr-8" />
        <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-xs select-none"
          style={{ color: 'var(--c-text-mute)', fontFamily: 'var(--font-mono)' }}>
          {show ? 'HIDE' : 'SHOW'}
        </button>
      </div>
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score++
  const levels = [
    { label: 'Too short', color: '#E11D48' },
    { label: 'Weak', color: '#E11D48' },
    { label: 'Fair', color: '#F5B942' },
    { label: 'Good', color: '#38BDF8' },
    { label: 'Strong', color: '#10b981' },
  ]
  const cur = levels[score] || levels[0]
  return (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 rounded-full transition-all duration-300" style={{ background: i <= score ? cur.color : 'var(--c-border)' }} />
        ))}
      </div>
      <p className="text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: cur.color }}>{cur.label}</p>
    </div>
  )
}

function AuthErr({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up flex items-center gap-1.5 p-2 rounded" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E11D48', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)' }}>
      <X size={12} />  {msg}
    </p>
  )
}
function AuthOk({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up flex items-center gap-1.5 p-2 rounded" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
      <Check size={12} /> {msg}
    </p>
  )
}

function Spinner() {
  return <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" /></svg>
}

function OtpLoginForm({ onSwitchPassword }) {
  const { sendOtp, loginWithOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [suggestedHandle, setSuggestedHandle] = useState('')
  const [usernameErr, setUsernameErr] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function handleSendOtp(e) {
    if (e) e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('Please enter a valid email address'); return }
    setBusy(true); setErr('')
    try {
      const res = await sendOtp(email.trim().toLowerCase())
      if (res.devOtp) setDevOtp(res.devOtp)
      setStep(2); setCooldown(30)
    } catch (e) { setErr(e.response?.data?.message || e.message || 'Failed to send OTP') }
    finally { setBusy(false) }
  }

  async function handleVerifyOtp(e) {
    if (e) e.preventDefault()
    if (otp.length < 6) { setErr('Please enter the 6-digit OTP code'); return }
    setBusy(true); setErr('')
    try {
      await loginWithOtp({ email: email.trim().toLowerCase(), otp: otp.trim() })
      navigate('/lobby')
    } catch (e) { setErr(e.response?.data?.message || e.message || 'Verification failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-5 fade-in">
      <AuthErr msg={err} />
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Field id="otp-email" label="Email Address" type="email" placeholder="you@domain.com" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} />
          <button id="send-otp-submit" type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Sending OTP…</> : 'Send 6-Digit Login Code'}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center space-y-1">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>Code sent to</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--c-blue)' }}>{email}</p>
          </div>
          {devOtp && (
            <div className="p-2 rounded text-center" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-blue)' }}>Dev Code: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.2em' }}>{devOtp}</span>
            </div>
          )}
          <div className="py-2"><OtpDigitsInput length={6} value={otp} onChange={setOtp} /></div>
          <button id="verify-otp-submit" type="submit" disabled={busy || otp.length < 6} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Verifying…</> : 'Enter the Arena'}
          </button>
          <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>
            <button type="button" onClick={() => setStep(1)} className="hover:text-[color:var(--c-text)] transition-colors">← Change email</button>
            <button type="button" disabled={cooldown > 0 || busy} onClick={handleSendOtp} className="hover:text-[color:var(--c-text)] transition-colors disabled:opacity-50">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function PasswordLoginForm({ onSwitchOtp, onSwitchRegister, onSwitchForgot }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErr('') }

  async function go(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setErr('All fields required'); return }
    setBusy(true)
    try {
      const { data } = await api.post('/api/auth/login', { email: form.email.trim().toLowerCase(), password: form.password })
      login(data); navigate('/lobby')
    } catch (err) { setErr(err.response?.data?.message || err.message || 'Login failed') }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={go} className="space-y-4 fade-in" noValidate>
      <AuthErr msg={err} />
      <Field id="l-email" label="Email" type="email" placeholder="you@domain.com" autoComplete="email" value={form.email} onChange={set('email')} />
      <PasswordField id="l-password" label="Password" placeholder="••••••••" autoComplete="current-password" value={form.password} onChange={set('password')} rightLabel="Forgot?" onRightClick={onSwitchForgot} />
      <button id="login-submit" type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? <><Spinner /> Authenticating…</> : 'Sign In'}
      </button>
    </form>
  )
}

function ForgotPasswordForm({ onBackToLogin }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function handleSendResetCode(e) {
    if (e) e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErr('Please enter a valid email address'); return }
    setBusy(true); setErr(''); setSuccess('')
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() })
      if (data.devOtp) setDevOtp(data.devOtp)
      setSuccess('Reset code sent to your email!'); setStep(2); setCooldown(30)
    } catch (e) { setErr(e.response?.data?.message || e.message || 'Failed to send reset code') }
    finally { setBusy(false) }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (otp.length < 6) { setErr('Please enter the 6-digit reset code'); return }
    if (newPassword.length < 6) { setErr('New password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setErr('Passwords do not match'); return }
    setBusy(true); setErr('')
    try {
      const { data } = await api.post('/api/auth/reset-password', { email: email.trim().toLowerCase(), otp: otp.trim(), newPassword })
      login(data); navigate('/lobby')
    } catch (e) { setErr(e.response?.data?.message || e.message || 'Failed to reset password') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4 fade-in">
      <AuthErr msg={err} />
      <AuthOk msg={success} />
      {step === 1 && (
        <form onSubmit={handleSendResetCode} className="space-y-4">
          <div className="space-y-1">
            <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>Reset Your Password</h3>
            <p style={{ fontSize: 11, color: 'var(--c-text-mute)' }}>Enter your registered email and we'll send a 6-digit reset code.</p>
          </div>
          <Field id="forgot-email" label="Account Email" type="email" placeholder="you@domain.com" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} />
          <button id="forgot-submit" type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Sending Code…</> : 'Send Password Reset Code'}
          </button>
          <div className="text-center pt-1">
            <button type="button" onClick={onBackToLogin} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }} className="hover:text-[color:var(--c-text)] transition-colors">← Back to Sign In</button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div className="text-center space-y-0.5">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>Enter code sent to</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--c-blue)' }}>{email}</p>
          </div>
          {devOtp && (
            <div className="p-2 rounded text-center" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-blue)' }}>Dev Code: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.2em' }}>{devOtp}</span>
            </div>
          )}
          <div className="py-1"><OtpDigitsInput length={6} value={otp} onChange={setOtp} /></div>
          <PasswordField id="new-pw" label="New Password" placeholder="min. 6 characters" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <PasswordStrength password={newPassword} />
          <PasswordField id="conf-new-pw" label="Confirm New Password" placeholder="repeat new password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <button id="reset-pw-submit" type="submit" disabled={busy || otp.length < 6 || newPassword.length < 6} className="btn-primary w-full py-3 mt-2">
            {busy ? <><Spinner /> Updating Password…</> : 'Update Password & Sign In'}
          </button>
          <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>
            <button type="button" onClick={() => setStep(1)} className="hover:text-[color:var(--c-text)] transition-colors">← Change email</button>
            <button type="button" disabled={cooldown > 0 || busy} onClick={handleSendResetCode} className="hover:text-[color:var(--c-text)] transition-colors disabled:opacity-50">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function RegisterForm({ onSwitchLogin }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErr('') }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function handleSendOtp(e) {
    if (e) e.preventDefault()
    if (Object.values(form).some(v => !v)) { setErr('All fields required'); return }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) { setErr('Username: 3–30 chars (letters/numbers/_)'); return }
    if (form.password.length < 6) { setErr('Password: min 6 chars'); return }
    if (form.password !== form.confirm) { setErr("Passwords don't match"); return }
    setBusy(true); setErr('')
    try {
      const { data } = await api.post('/api/auth/send-registration-otp', { username: form.username.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      if (data.devOtp) setDevOtp(data.devOtp)
      setSuccess('Verification code sent! Check your inbox.')
      setStep(2); setCooldown(30)
    } catch (err) { setErr(err.response?.data?.message || err.message || 'Failed to send verification code') }
    finally { setBusy(false) }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (otp.length < 6) { setErr('Please enter the 6-digit code'); return }
    setBusy(true); setErr('')
    try {
      const { data } = await api.post('/api/auth/register', { email: form.email.trim().toLowerCase(), otp: otp.trim() })
      login(data); navigate('/lobby')
    } catch (err) { setErr(err.response?.data?.message || err.message || 'Verification failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4 fade-in">
      <AuthErr msg={err} />
      <AuthOk msg={success} />
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-3.5" noValidate>
          <Field id="r-user" label="Username" placeholder="ninja_coder" autoComplete="username" value={form.username} onChange={set('username')} />
          <Field id="r-email" label="Email" type="email" placeholder="you@domain.com" autoComplete="email" value={form.email} onChange={set('email')} />
          <PasswordField id="r-pw" label="Password" placeholder="min. 6 characters" autoComplete="new-password" value={form.password} onChange={set('password')} />
          <PasswordStrength password={form.password} />
          <PasswordField id="r-conf" label="Confirm Password" placeholder="repeat password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          <button id="register-submit" type="submit" disabled={busy} className="btn-primary w-full py-3 mt-2">
            {busy ? <><Spinner /> Sending Verification Code…</> : 'Verify Email & Create Account'}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-center space-y-1">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>Enter the 6-digit code sent to</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#10b981' }}>{form.email}</p>
          </div>
          {devOtp && (
            <div className="p-2 rounded text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#10b981' }}>Dev Code: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.2em' }}>{devOtp}</span>
            </div>
          )}
          <div className="py-1"><OtpDigitsInput length={6} value={otp} onChange={setOtp} /></div>
          <button id="register-verify-submit" type="submit" disabled={busy || otp.length < 6} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Creating Account…</> : 'Confirm & Enter Arena'}
          </button>
          <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-mute)' }}>
            <button type="button" onClick={() => { setStep(1); setSuccess(''); setOtp(''); setDevOtp(null) }} className="hover:text-[color:var(--c-text)] transition-colors">← Back</button>
            <button type="button" disabled={cooldown > 0 || busy} onClick={handleSendOtp} className="hover:text-[color:var(--c-text)] transition-colors disabled:opacity-50">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function ChooseUsernameModal({ defaultUsername, onConfirm, busy, err }) {
  const [handle, setHandle] = useState(defaultUsername || '')
  function handleSubmit(e) { e.preventDefault(); onConfirm(handle.trim().toLowerCase()) }
  const isValid = /^[a-zA-Z0-9_]{3,30}$/.test(handle.trim())
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 rounded-xl space-y-4 fade-in" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border2)' }}>
        <div className="text-center space-y-2">
          <ArenaEmblem size={40} glow />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--c-text)', letterSpacing: '0.05em' }}>CHOOSE YOUR ARENA HANDLE</h3>
          <p style={{ fontSize: 12, color: 'var(--c-text-mute)' }}>Pick a username for leaderboards and live battles.</p>
        </div>
        <AuthErr msg={err} />
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-mute)', display: 'block', marginBottom: 6 }}>Arena Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--c-blue)' }}>@</span>
              <input type="text" autoFocus maxLength={30} placeholder="algo_ninja" value={handle}
                onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                style={{ width: '100%', background: 'var(--c-void)', border: '1px solid var(--c-border)', borderRadius: 3, padding: '10px 12px 10px 28px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--c-red)'}
                onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-text-mute)', marginTop: 4 }}>3–30 chars (letters, numbers, underscore)</p>
          </div>
          <button type="submit" disabled={!isValid || busy} className="btn-primary w-full py-3 disabled:opacity-40">
            {busy ? <><Spinner /> Saving Handle…</> : 'Enter Arena Lobby'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GoogleAuthButton() {
  const { loginWithFirebase, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [suggestedHandle, setSuggestedHandle] = useState('')
  const [usernameErr, setUsernameErr] = useState('')

  async function handleGoogleSignIn() {
    setBusy(true); setErr('')
    try {
      const { auth, googleProvider, signInWithPopup } = await import('../utils/firebase')
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const rawSuggest = (result.user.displayName || result.user.email?.split('@')[0] || 'coder')
        .replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 20)
      await loginWithFirebase({ idToken, username: rawSuggest })
      navigate('/lobby')
    } catch (e) {
      if (e.code === 'auth/api-key-not-valid' || e.code === 'auth/invalid-api-key' || e.code === 'auth/configuration-not-found') {
        setErr('Firebase Google Auth: configure VITE_FIREBASE_API_KEY, or use Fast OTP below!')
      } else if (e.code !== 'auth/popup-closed-by-user') { setErr(e.message || 'Google sign-in failed') }
    }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-3 mb-5">
      <AuthErr msg={err} />
      <button type="button" onClick={handleGoogleSignIn} disabled={busy}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 transition-all"
        style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: 2, color: 'var(--c-text)', fontSize: 13, fontWeight: 500 }}
        onMouseOver={e => { e.currentTarget.style.background = 'var(--c-panel2)'; e.currentTarget.style.borderColor = 'var(--c-border2)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'var(--c-panel)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" /><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" /><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" /><path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" /></svg>
        <span>{busy ? 'Signing in with Google…' : 'Continue with Google'}</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--c-border)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>or sign in with</span>
        <div className="h-px flex-1" style={{ background: 'var(--c-border)' }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 1: LANDING NAVBAR (replaced by App Navbar)
   The App already mounts Navbar globally — so the landing
   page doesn't re-render a second navbar.
═══════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════
   SECTION 2: HERO
═══════════════════════════════════════════════════ */
function HeroSection({ onJoinClick }) {
  const [isBtnHovered, setIsBtnHovered] = useState(false)

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 sm:px-8 overflow-hidden hex-grid-bg scanlines vignette"
      aria-label="Hero"
    >
      {/* Clean 3D scene — floating rings + particle field */}
      <Suspense fallback={null}>
        <HeroScene3D isHovered={isBtnHovered} />
      </Suspense>

      {/* Starfield canvas (fallback layer beneath 3D) */}
      <ParticleCanvas />

      {/* Left red atmospheric glow */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          left: '-10%', top: '20%',
          width: '55vw', height: '70vh',
          background: 'radial-gradient(ellipse at center, var(--c-red-glow) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Right cyan atmospheric glow */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          right: '-10%', top: '20%',
          width: '55vw', height: '70vh',
          background: 'radial-gradient(ellipse at center, var(--c-blue-glow) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Center bottom subtle bloom */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          bottom: '-5%', left: '50%', transform: 'translateX(-50%)',
          width: '60vw', height: '40vh',
          background: 'radial-gradient(ellipse at center top, rgba(56,189,248,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Season badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2"
          style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', borderRadius: 2 }}
        >
          <span className="dot-live" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-blue)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
            AlgoArena · Season 1 Active
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em', textTransform: 'uppercase' }}
          className="text-4xl sm:text-6xl lg:text-7xl"
        >
          <span style={{ color: 'var(--c-text)' }}>ASSEMBLE.</span>
          <br />
          <span style={{ color: 'var(--c-red)', textShadow: '0 0 40px rgba(225,29,72,0.5)' }}>CODE.</span>{' '}
          <span style={{ color: 'var(--c-blue)', textShadow: '0 0 40px rgba(56,189,248,0.4)' }}>CONQUER.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ color: 'var(--c-text-dim)' }}
        >
          1v1 real-time coding duels. Same problem. Same second.{' '}
          <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 2, border: '1px solid rgba(16,185,129,0.25)' }}>
            ACCEPTED
          </span>{' '}
          first takes the Elo.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <motion.button
            onClick={onJoinClick}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            className="btn-primary px-8 py-4 text-base animate-glow-pulse"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Enter the Arena
            <ArrowRight size={16} className="ml-1" />
          </motion.button>
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold transition-all duration-200"
            style={{ color: 'var(--c-text-dim)', background: 'var(--c-panel2)', border: '1px solid var(--c-border)', borderRadius: 2 }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-border2)'; e.currentTarget.style.color = 'var(--c-text)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-dim)' }}
          >
            <Trophy size={15} />
            View Hall of Heroes
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-8 flex-wrap pt-4"
          style={{ borderTop: '1px solid var(--c-border)', paddingTop: 20 }}
        >
          {[
            { val: `${SITE_CONFIG.problemCount}+`, label: 'DSA Problems', col: 'var(--c-gold)' },
            { val: `${SITE_CONFIG.languages}`, label: 'Languages', col: 'var(--c-blue)' },
            { val: SITE_CONFIG.matchmakingLatency, label: 'Matchmaking', col: '#10b981' },
            { val: `K=${SITE_CONFIG.eloKFactor}`, label: 'Elo Factor', col: 'var(--c-red)' },
          ].map(({ val, label, col }) => (
            <div key={label} className="text-center">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: col, letterSpacing: '0.05em' }}>{val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        aria-hidden="true"
      >
        <ChevronDown size={20} style={{ color: 'var(--c-text-mute)' }} />
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 3: LIVE DUEL PREVIEW
═══════════════════════════════════════════════════ */
function DuelPreviewSection() {
  return (
    <section className="py-20 px-5 sm:px-8" style={{ background: 'var(--c-void)', borderTop: '1px solid var(--c-border)' }} aria-label="Live Duel Preview">
      <div className="max-w-6xl mx-auto">
        <SectionReveal className="text-center mb-12 space-y-3">
          <p className="section-label">// Live Battle Engine</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', color: 'var(--c-text)', letterSpacing: '0.03em' }}>
            WATCH THE BATTLE UNFOLD
          </h2>
          <p style={{ color: 'var(--c-text-dim)', maxWidth: 480, margin: '0 auto' }}>
            Two coders, one problem, zero mercy. The O(n) solver wins — the brute-force pays in Elo.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div className="relative">
            {/* HUD chrome */}
            <div style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', borderRadius: 0 }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: 'var(--c-void)', borderColor: 'var(--c-border)' }}>
                <div className="flex gap-1.5">
                  {['#E11D48', '#F5B942', '#10b981'].map(c => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-text-mute)' }}>
                  algoarena-battle-engine.sh — Two Sum · Arrays · Medium
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981' }}>● LIVE</div>
              </div>
              <BattlePreview />
            </div>
            {/* Glow */}
            <div className="absolute -inset-4 pointer-events-none" aria-hidden="true"
              style={{ background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.06) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: -1 }} />
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 4: MISSION BRIEFING — How Duels Work
═══════════════════════════════════════════════════ */
const DUEL_PHASES = [
  {
    num: '01', id: 'matchmaking', title: 'Matchmaking',
    icon: <Target size={18} />,
    desc: 'Smart rating-balanced matchmaking finds an opponent near your Elo bracket. The window dynamically expands every 10s for zero-wait duels.',
    highlight: 'Symmetric problem dispatch · WebSocket handshake',
    code: `socket.emit('join_queue', { topic: 'trees', difficulty: 'medium' })
socket.on('match_found', ({ roomId, problem, opponent }) => {
  arena.initializeBattle({ roomId, symmetricClock: true })
})`,
  },
  {
    num: '02', id: 'sandbox', title: 'Sandboxed Execution',
    icon: <Shield size={18} />,
    desc: 'Your code compiles and executes inside a locked, network-disabled Linux container with 512MB RAM cap and 0.5 CPU quota for pure fairness.',
    highlight: 'Zero network access · BFS auto-serialization',
    code: `docker run --network none --memory 512m --cpus 0.5 \\
  --security-opt no-new-privileges:true \\
  algoarena-runner:latest --timeout 5000ms`,
  },
  {
    num: '03', id: 'spectating', title: 'Live Spectating',
    icon: <Eye size={18} />,
    desc: 'Watch real-time typing indicators, character count deltas, test run attempts, and compilation status for maximum esports adrenaline.',
    highlight: 'Keystroke radar · Instant verdict broadcast',
    code: `socket.on('opponent_typing', ({ charCount, activeLine }) => {
  hud.updateRadar({ opponent: 'rival', speed: '84 WPM', progress: 0.72 })
})`,
  },
  {
    num: '04', id: 'elo', title: 'Elo Settlement',
    icon: <Activity size={18} />,
    desc: `Win duels to steal opponent Elo and climb rank tiers from Recruit to Bihari. K-factor K=${SITE_CONFIG.eloKFactor} with streak rewards.`,
    highlight: `K-Factor ${SITE_CONFIG.eloKFactor} · Streak bonuses · Tier progression`,
    code: `const expected = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
const delta = Math.round(${SITE_CONFIG.eloKFactor} * (scoreA - expected))
db.atomicUpdateElo({ userId, delta })`,
  },
]

function MissionBriefingSection() {
  const [active, setActive] = useState(0)
  const curr = DUEL_PHASES[active]

  return (
    <section className="py-24 px-5 sm:px-8 relative" style={{ background: 'var(--c-panel)', borderTop: '1px solid var(--c-border)' }} aria-label="How Duels Work">
      {/* Accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(56,189,248,0.07) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <SectionReveal className="mb-14 space-y-3">
          <p className="section-label">// Mission Briefing</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', color: 'var(--c-text)', letterSpacing: '0.03em' }}>
            HOW DUELS WORK
          </h2>
        </SectionReveal>

        {/* Stepper */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {DUEL_PHASES.map((p, i) => {
            const sel = active === i
            return (
              <motion.button
                key={p.id}
                onClick={() => setActive(i)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 text-left relative overflow-hidden cursor-pointer transition-all"
                style={{
                  background: sel ? 'rgba(225,29,72,0.06)' : 'var(--c-void)',
                  border: `1px solid ${sel ? 'var(--c-red)' : 'var(--c-border)'}`,
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                  boxShadow: sel ? '0 0 20px rgba(225,29,72,0.15)' : 'none',
                }}
              >
                {/* Progress bar top */}
                {sel && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, var(--c-red), var(--c-blue))' }} />}
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: sel ? 'var(--c-red)' : 'var(--c-text-mute)', letterSpacing: '0.02em' }}>{p.num}</span>
                  <span style={{ color: sel ? 'var(--c-blue)' : 'var(--c-text-mute)' }}>{p.icon}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: sel ? 'var(--c-text)' : 'var(--c-text-dim)', letterSpacing: '0.04em' }}>{p.title.toUpperCase()}</p>
              </motion.button>
            )
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid lg:grid-cols-[1fr_0.85fr] gap-8 p-8"
            style={{ background: 'var(--c-void)', border: '1px solid var(--c-border)', clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'rgba(225,29,72,0.3)', letterSpacing: '0.02em', lineHeight: 1 }}>{curr.num}</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--c-text)', letterSpacing: '0.04em' }}>{curr.title.toUpperCase()}</h3>
              </div>
              <p style={{ color: 'var(--c-text-dim)', lineHeight: 1.6 }}>{curr.desc}</p>
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm" style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <Zap size={12} style={{ color: 'var(--c-blue)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-blue)', fontWeight: 600 }}>{curr.highlight}</span>
                </div>
              </div>
              <Link to="/lobby" className="inline-flex items-center gap-1.5 pt-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-red)', fontWeight: 600 }}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Try it live in the Arena <ChevronRight size={14} />
              </Link>
            </div>

            {/* Code preview */}
            <div style={{ background: 'var(--c-void)', border: '1px solid var(--c-border)', borderRadius: 0 }}>
              <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>// engine_{curr.id}.js</span>
                <span className="flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />verified
                </span>
              </div>
              <pre className="p-5 overflow-x-auto" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-text)', lineHeight: 1.7 }}>
                <code>{curr.code}</code>
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 5: RANK LADDER
═══════════════════════════════════════════════════ */
const TIERS = [
  { name: 'Recruit', range: '0–1199', color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', desc: 'Starting rank. Learn the arena.' },
  { name: 'Operative', range: '1200–1399', color: '#10b981', glow: 'rgba(16,185,129,0.25)', desc: 'Consistent performer. Know your patterns.' },
  { name: 'Vanguard', range: '1400–1599', color: '#38BDF8', glow: 'rgba(56,189,248,0.25)', desc: 'Front-line fighter. Efficient coder.' },
  { name: 'Champion', range: '1600–1899', color: '#818cf8', glow: 'rgba(129,140,248,0.25)', desc: 'Elite combatant. Precision under pressure.' },
  { name: 'Legend', range: '1900–2199', color: '#c084fc', glow: 'rgba(192,132,252,0.25)', desc: 'Arena legend. Few reach this summit.' },
  { name: 'Bihari', range: '2200+', color: '#F5B942', glow: 'rgba(245,185,66,0.35)', desc: 'Bihari status. The top 0.1%.', gold: true },
]

function RankLadderSection() {
  return (
    <section className="py-24 px-5 sm:px-8 relative overflow-hidden" style={{ background: 'var(--c-void)', borderTop: '1px solid var(--c-border)' }} aria-label="Rank Ladder">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(225,29,72,0.06) 0%, transparent 60%)' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <SectionReveal className="mb-14 space-y-3">
          <p className="section-label">// Rank Ladder</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', color: 'var(--c-text)', letterSpacing: '0.03em' }}>
            CLIMB THE RANKS
          </h2>
          <p style={{ color: 'var(--c-text-dim)', maxWidth: 520 }}>
            Every win steals Elo. Consecutive wins trigger streak bonuses with enhanced K-factor. Climb from Recruit to Bihari.
          </p>
        </SectionReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIERS.map((tier, i) => (
            <SectionReveal key={tier.name} delay={i * 0.07}>
              <motion.div
                whileHover={{ y: -4, boxShadow: `0 12px 40px ${tier.glow}` }}
                className="p-5 relative overflow-hidden transition-all duration-300"
                style={{
                  background: `var(--c-panel)`,
                  border: `1px solid ${tier.color}30`,
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" aria-hidden="true"
                  style={{ background: `radial-gradient(ellipse at top right, ${tier.glow} 0%, transparent 70%)` }} />

                <div className="flex items-start justify-between mb-3">
                  {/* Hex emblem */}
                  <div className="w-10 h-10 flex items-center justify-center relative" style={{ border: `1.5px solid ${tier.color}`, clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: tier.color }}>#{i + 1}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: tier.color, background: `${tier.glow}`, padding: '2px 8px', border: `1px solid ${tier.color}40` }}>
                    {tier.range}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: tier.color, letterSpacing: '0.06em', textShadow: tier.gold ? `0 0 20px ${tier.glow}` : 'none' }}>
                  {tier.name.toUpperCase()}
                </h3>
                <p style={{ color: 'var(--c-text-mute)', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>{tier.desc}</p>
              </motion.div>
            </SectionReveal>
          ))}
        </div>

        {/* K-factor note */}
        <SectionReveal delay={0.4}>
          <div className="mt-8 p-4 flex items-start gap-3" style={{ background: 'rgba(245,185,66,0.04)', border: '1px solid rgba(245,185,66,0.2)', borderRadius: 0 }}>
            <Star size={16} style={{ color: 'var(--c-gold)', marginTop: 2, shrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text-dim)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--c-gold)', fontWeight: 700 }}>Streak Bonus:</span> Win 3+ consecutive duels to activate streak K-factor multiplier.
              Elo math uses standard FIDE-grade formula: Δ = K × (score − expected). K={SITE_CONFIG.eloKFactor}.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 6: CHOOSE YOUR LOADOUT (Languages)
═══════════════════════════════════════════════════ */
const LANG_SNIPPETS = {
  javascript: {
    label: 'JavaScript', runtime: 'Node.js 20', ext: '.js',
    code: `// Node.js 20 · V8 Engine · O(n) Hash Map
function twoSum(nums, target) {
  const map = new Map()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (map.has(complement)) return [map.get(complement), i]
    map.set(nums[i], i)
  }
  return []
}`,
  },
  python: {
    label: 'Python', runtime: 'Python 3.11', ext: '.py',
    code: `# Python 3.11 · Clean & Expressive · O(n)
class Solution:
    def solution(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, val in enumerate(nums):
            diff = target - val
            if diff in seen:
                return [seen[diff], i]
            seen[val] = i
        return []`,
  },
  cpp: {
    label: 'C++', runtime: 'GCC 13 · C++20', ext: '.cpp',
    code: `// C++20 · GCC 13 · Microsecond Performance
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int comp = target - nums[i];
            if (mp.count(comp)) return {mp[comp], i};
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
  },
  java: {
    label: 'Java', runtime: 'OpenJDK 21', ext: '.java',
    code: `// Java 21 · OpenJDK · Reflection Runner
import java.util.HashMap;

class Solution {
    public int[] solution(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                return new int[]{map.get(comp), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
  },
}

function LoadoutSection() {
  const [lang, setLang] = useState('javascript')
  const curr = LANG_SNIPPETS[lang]

  return (
    <section className="py-24 px-5 sm:px-8" style={{ background: 'var(--c-panel)', borderTop: '1px solid var(--c-border)' }} aria-label="Choose Your Loadout">
      <div className="max-w-5xl mx-auto">
        <SectionReveal className="mb-10 space-y-3">
          <p className="section-label">// Choose Your Loadout</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', color: 'var(--c-text)', letterSpacing: '0.03em' }}>
            WRITE IN YOUR LANGUAGE
          </h2>
          <p style={{ color: 'var(--c-text-dim)' }}>
            Four battle-ready runtimes. Auto BFS serialization for trees and linked lists.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div style={{ background: 'var(--c-void)', border: '1px solid var(--c-border)' }}>
            {/* Tab bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-panel)' }}>
              <div className="flex items-center gap-1">
                {Object.entries(LANG_SNIPPETS).map(([id, l]) => (
                  <button
                    key={id}
                    onClick={() => setLang(id)}
                    className="transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                      padding: '6px 14px',
                      color: lang === id ? 'var(--c-blue)' : 'var(--c-text-mute)',
                      background: lang === id ? 'rgba(56,189,248,0.08)' : 'transparent',
                      border: `1px solid ${lang === id ? 'rgba(56,189,248,0.3)' : 'transparent'}`,
                      borderRadius: 0,
                    }}
                  >
                    {l.label}
                    <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 4 }}>({l.runtime})</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981', letterSpacing: '0.1em' }}>Auto BFS Serialization</span>
              </div>
            </div>

            {/* Runtime badge */}
            <div className="px-4 pt-3 flex items-center gap-2">
              <Cpu size={12} style={{ color: 'var(--c-blue)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-blue)', letterSpacing: '0.1em' }}>{curr.runtime} · {SITE_CONFIG.sandboxTimeout} timeout · {SITE_CONFIG.sandboxRAM} RAM</span>
            </div>

            {/* Code */}
            <AnimatePresence mode="wait">
              <motion.pre
                key={lang}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="p-5 sm:p-6 overflow-x-auto"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--c-text)', lineHeight: 1.7 }}
              >
                <code>{curr.code}</code>
              </motion.pre>
            </AnimatePresence>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 7: HALL OF HEROES (Leaderboard)
═══════════════════════════════════════════════════ */
const PODIUM_CONFIG = [
  { rank: 2, scale: 0.92, yOffset: 20 },
  { rank: 1, scale: 1, yOffset: 0 },
  { rank: 3, scale: 0.88, yOffset: 32 },
]
const MEDAL = ['', '#F5B942', '#C0C0C0', '#CD7F32']
const MEDAL_GLOW = ['', 'rgba(245,185,66,0.4)', 'rgba(192,192,192,0.3)', 'rgba(205,127,50,0.3)']

function HallOfHeroesSection() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/users/leaderboard')
      .then(({ data }) => {
        // Filter out users with 0 games
        const active = data.filter(p => (p.wins || 0) + (p.losses || 0) > 0).slice(0, 5)
        setPlayers(active)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  // Reorder for podium: 2nd, 1st, 3rd
  const podium = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3

  return (
    <section className="py-24 px-5 sm:px-8 relative" style={{ background: 'var(--c-void)', borderTop: '1px solid var(--c-border)' }} aria-label="Hall of Heroes">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(245,185,66,0.05) 0%, transparent 60%)' }} />

      <div className="max-w-4xl mx-auto relative z-10">
        <SectionReveal className="text-center mb-14 space-y-3">
          <p className="section-label">// Hall of Heroes</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', color: 'var(--c-text)', letterSpacing: '0.03em' }}>
            TOP ARENA COMBATANTS
          </h2>
        </SectionReveal>

        {loading ? (
          <div className="text-center py-12" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-text-mute)' }}>
            <span className="dot-live" style={{ marginRight: 8 }} /> Loading leaderboard…
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Swords size={36} style={{ color: 'var(--c-text-mute)', margin: '0 auto' }} />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--c-text-mute)', letterSpacing: '0.06em' }}>NO BATTLES YET</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-text-mute)' }}>Be the first to compete and claim the top spot!</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-10">
                {PODIUM_CONFIG.slice(0, podium.length).map((cfg, i) => {
                  const p = podium[i]
                  if (!p) return null
                  const rankIdx = cfg.rank
                  const medColor = MEDAL[rankIdx]
                  const medGlow = MEDAL_GLOW[rankIdx]
                  return (
                    <SectionReveal key={p.id || i} delay={i * 0.1}>
                      <motion.div
                        whileHover={{ y: -6 }}
                        className="flex flex-col items-center gap-2 p-4 text-center"
                        style={{
                          transform: `scale(${cfg.scale}) translateY(${cfg.yOffset}px)`,
                          background: `var(--c-panel)`,
                          border: `1px solid ${medColor}40`,
                          minWidth: 120,
                          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                          boxShadow: rankIdx === 1 ? `0 0 30px ${medGlow}` : `0 0 15px ${medGlow}`,
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: medColor }}>{rankIdx}</div>
                        <UserAvatar username={p.username} elo={p.elo_rating} size={48} />
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--c-text)', letterSpacing: '0.04em' }}>{p.username}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>{p.wins || 0}W · {p.losses || 0}L</p>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: medColor, textShadow: `0 0 12px ${medGlow}` }}>{p.elo_rating}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--c-text-mute)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>ELO</div>
                      </motion.div>
                    </SectionReveal>
                  )
                })}
              </div>
            )}

            {/* Rows 4-5 */}
            {rest.length > 0 && (
              <div className="space-y-2 mb-8">
                {rest.map((p, i) => (
                  <SectionReveal key={p.id || i} delay={0.3 + i * 0.05}>
                    <div className="flex items-center justify-between p-3 transition-all" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-border2)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--c-text-mute)', width: 20, textAlign: 'center' }}>#{i + 4}</span>
                        <UserAvatar username={p.username} elo={p.elo_rating} size={32} />
                        <div>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--c-text)', letterSpacing: '0.03em' }}>{p.username}</p>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>{p.wins || 0}W · {p.losses || 0}L</p>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--c-text-dim)', letterSpacing: '0.04em' }}>{p.elo_rating} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>ELO</span></span>
                    </div>
                  </SectionReveal>
                ))}
              </div>
            )}
          </>
        )}

        <div className="text-center mt-6">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 transition-all"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-gold)', border: '1px solid rgba(245,185,66,0.3)', background: 'rgba(245,185,66,0.04)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(245,185,66,0.08)'; e.currentTarget.style.borderColor = 'rgba(245,185,66,0.5)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(245,185,66,0.04)'; e.currentTarget.style.borderColor = 'rgba(245,185,66,0.3)' }}
          >
            <Trophy size={13} /> Full Rankings <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 8: AUTH PANEL (Recruitment)
═══════════════════════════════════════════════════ */
function AuthPanelSection({ authMode, setAuthMode }) {
  const FEATURES = [
    { icon: <Zap size={15} />, title: 'Instant Matchmaking', desc: 'Smart Elo-balanced queue. Under 3 seconds to a duel.', col: 'var(--c-blue)' },
    { icon: <Shield size={15} />, title: 'Sandboxed Execution', desc: 'Isolated Docker container. 512MB RAM, 0.5 CPU, 5s timeout.', col: '#10b981' },
    { icon: <Activity size={15} />, title: 'Elo Rating Engine', desc: `FIDE-grade math. K=${SITE_CONFIG.eloKFactor} factor, streak rewards.`, col: 'var(--c-gold)' },
    { icon: <Swords size={15} />, title: 'Private Friend Duels', desc: 'Create a room code. Challenge anyone instantly.', col: 'var(--c-red)' },
  ]

  return (
    <section id="auth-box" className="py-24 px-5 sm:px-8 relative" style={{ background: 'var(--c-panel)', borderTop: '1px solid var(--c-border)' }} aria-label="Join the Arena">
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--c-red), transparent)' }} />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-12 items-start">
        {/* Feature list */}
        <div className="space-y-10">
          <SectionReveal className="space-y-3">
            <p className="section-label">// Recruitment Hub</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', color: 'var(--c-text)', letterSpacing: '0.03em', lineHeight: 1.1 }}>
              JOIN THE<br />ROSTER
            </h2>
            <p style={{ color: 'var(--c-text-dim)', maxWidth: 420 }}>
              Every great arena needs great combatants. Register in 30 seconds — no credit card, no setup.
            </p>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <SectionReveal key={f.title} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="p-5 space-y-3"
                  style={{ background: 'var(--c-void)', border: `1px solid ${f.col}25`, clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
                >
                  <div className="flex items-center gap-2" style={{ color: f.col }}>{f.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--c-text)', letterSpacing: '0.04em' }}>{f.title.toUpperCase()}</h3>
                  <p style={{ fontSize: 12, color: 'var(--c-text-dim)', lineHeight: 1.55 }}>{f.desc}</p>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </div>

        {/* Auth panel — sticky */}
        <div className="sticky top-24">
          <SectionReveal>
            <div style={{ background: 'var(--c-void)', border: '1px solid var(--c-border)', clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}>
              {/* Corner accents */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--c-text)', letterSpacing: '0.05em' }}>ENTER ARENA</h3>
                  <span className="flex items-center gap-1.5 px-2 py-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="dot-live" style={{ width: 5, height: 5 }} />Instant Access
                  </span>
                </div>

                {/* Google */}
                <GoogleAuthButton />

                {/* Mode tabs */}
                {authMode !== 'forgot' && (
                  <div className="flex items-center gap-1 p-1" style={{ background: 'var(--c-void)', border: '1px solid var(--c-border)' }}>
                    {[
                      { id: 'otp', label: 'Fast OTP' },
                      { id: 'password', label: 'Password' },
                      { id: 'register', label: 'Register' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setAuthMode(tab.id)}
                        className="flex-1 py-2 transition-all"
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                          color: authMode === tab.id ? 'var(--c-blue)' : 'var(--c-text-mute)',
                          background: authMode === tab.id ? 'rgba(56,189,248,0.08)' : 'transparent',
                          border: `1px solid ${authMode === tab.id ? 'rgba(56,189,248,0.25)' : 'transparent'}`,
                          borderRadius: 0,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Forms */}
                <div style={{ minHeight: 280 }}>
                  {authMode === 'otp' && <OtpLoginForm onSwitchPassword={() => setAuthMode('password')} />}
                  {authMode === 'password' && <PasswordLoginForm onSwitchOtp={() => setAuthMode('otp')} onSwitchRegister={() => setAuthMode('register')} onSwitchForgot={() => setAuthMode('forgot')} />}
                  {authMode === 'register' && <RegisterForm onSwitchLogin={() => setAuthMode('password')} />}
                  {authMode === 'forgot' && <ForgotPasswordForm onBackToLogin={() => setAuthMode('password')} />}
                </div>

                <div className="pt-4 border-t text-center" style={{ borderColor: 'var(--c-border)' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--c-text-mute)' }}>
                    <Lock size={10} className="inline mr-1" />256-bit SSL · Docker isolation · bcrypt
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 9: FAQ — INTEL BRIEFING
═══════════════════════════════════════════════════ */
const FAQS = [
  {
    q: 'How does the 1v1 live duel matchmaking work?',
    a: 'When you queue for a topic and difficulty, our matchmaking engine pairs you with an opponent near your Elo bracket (window expands ±100 Elo every 10s). Both players receive the exact same DSA problem at the exact same millisecond. The first developer whose code passes 100% of hidden test cases wins and steals Elo rating.',
  },
  {
    q: 'How is code executed and judged securely?',
    a: `Every submission runs inside an isolated, hardened Docker container with network access disabled, 512MB memory limit, 0.5 CPU cap, and a strict 5-second execution timeout. This ensures sandboxed execution, sub-second judging, and fair benchmarks for all participants.`,
  },
  {
    q: 'Can I challenge my friends or college peers in private matches?',
    a: 'Yes! From the Lobby, click "battle_friend() (private room)". You can choose topic and difficulty, then generate a shareable 6-character room code or direct invite link. Once your friend enters the code, the private duel begins immediately.',
  },
  {
    q: 'Which programming languages are supported?',
    a: 'AlgoArena supports JavaScript (Node.js 20), Python 3.11, C++20 (GCC 13), and Java 21 (OpenJDK). All complex data structures including TreeNodes and ListNodes are automatically parsed and serialized with BFS format.',
  },
  {
    q: 'What happens if a player disconnects during a match?',
    a: 'AlgoArena has a built-in disconnect grace period. If a player momentarily loses connection, they have 30 seconds to reconnect before the match is declared a forfeit, preventing unfair Elo losses.',
  },
]

function FaqSection() {
  const [open, setOpen] = useState(null)
  const contentRefs = useRef([])

  return (
    <section className="py-24 px-5 sm:px-8" style={{ background: 'var(--c-panel)', borderTop: '1px solid var(--c-border)' }} aria-label="FAQ">
      <div className="max-w-3xl mx-auto">
        <SectionReveal className="mb-12 space-y-3">
          <p className="section-label">// Intel Briefing</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,48px)', color: 'var(--c-text)', letterSpacing: '0.03em' }}>
            FREQUENTLY ASKED
          </h2>
        </SectionReveal>

        <div className="space-y-2" role="list">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <SectionReveal key={i} delay={i * 0.05}>
                <div role="listitem" style={{ background: 'var(--c-void)', border: `1px solid ${isOpen ? 'var(--c-border2)' : 'var(--c-border)'}`, transition: 'border-color 0.2s' }}>
                  <button
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <span style={{ fontWeight: 600, color: isOpen ? 'var(--c-text)' : 'var(--c-text-dim)', fontSize: 14, lineHeight: 1.4 }}>{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: isOpen ? 'var(--c-red)' : 'var(--c-text-mute)', flexShrink: 0 }}
                    >
                      <ChevronDown size={18} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p className="px-5 pb-5" style={{ fontSize: 13, color: 'var(--c-text-mute)', lineHeight: 1.7, borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SectionReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 10: FINAL CTA BANNER
═══════════════════════════════════════════════════ */
function CtaBannerSection({ onJoinClick }) {
  return (
    <section className="py-24 px-5 sm:px-8 relative overflow-hidden" style={{ background: 'var(--c-void)', borderTop: '1px solid var(--c-border)' }} aria-label="Join CTA">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none hex-grid-bg" aria-hidden="true" style={{ opacity: 0.3 }} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at center, rgba(225,29,72,0.12) 0%, transparent 65%)' }} />

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        <SectionReveal>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,64px)', color: 'var(--c-text)', letterSpacing: '0.03em', lineHeight: 1.05 }}>
            YOUR RIVALS ARE<br />
            <span style={{ color: 'var(--c-red)', textShadow: '0 0 30px rgba(225,29,72,0.4)' }}>ALREADY IN QUEUE.</span>
          </h2>
        </SectionReveal>
        <SectionReveal delay={0.15}>
          <p style={{ color: 'var(--c-text-dim)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Join thousands of developers competing for leaderboard supremacy. Every second you wait, someone else is climbing.
          </p>
        </SectionReveal>
        <SectionReveal delay={0.25}>
          <motion.button
            onClick={onJoinClick}
            className="btn-primary px-12 py-5 text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            Assemble &amp; Compete
            <Zap size={18} className="ml-2" />
          </motion.button>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════
   SECTION 11: FOOTER
═══════════════════════════════════════════════════ */
function FooterSection() {
  const { isAuthenticated } = useAuth()
  return (
    <footer
      style={{
        background: 'linear-gradient(to bottom, var(--c-panel), var(--c-void))',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top gradient line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: 1,
          background: 'linear-gradient(to right, transparent, #E11D48 40%, #00C2FF 60%, transparent)',
          opacity: 0.5,
        }}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        {/* Main row */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10">

          {/* Brand block */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <ArenaLogo size="md" showTagline />
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#475569',
              letterSpacing: '0.04em',
              lineHeight: 1.7,
              maxWidth: 260,
              textAlign: 'left',
            }}>
              Real-time 1v1 coding duels.<br />
              Same problem. Same second.<br />
              First <span style={{ color: '#22c55e', fontWeight: 700 }}>ACCEPTED</span> takes the Elo.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#334155', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
              Navigate
            </span>
            {[
              { label: 'Home', to: '/' },
              { label: 'Lobby', to: '/lobby' },
              { label: 'Leaderboard', to: '/leaderboard' },
              ...(!isAuthenticated ? [{ label: 'Who We Are', to: '/who-we-are' }] : []),
            ].map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748B', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = '#E2E8F0'}
                onMouseOut={e => e.currentTarget.style.color = '#64748B'}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Status block */}
          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e', letterSpacing: '0.15em' }}>SYSTEM ONLINE</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#334155' }}>Season 1 · Active</span>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#1E293B', letterSpacing: '0.1em' }}>
            © 2026 AlgoArena · Built for competitive programmers
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN HOME PAGE
═══════════════════════════════════════════════════ */
export default function Home() {
  const [authMode, setAuthMode] = useState('otp')
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const param = searchParams.get('auth')
    if (param === 'login') setAuthMode('otp')
    if (param === 'register') setAuthMode('register')
    if (param) {
      setTimeout(() => {
        document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [searchParams])

  const scrollToAuth = useCallback(() => {
    if (isAuthenticated) {
      navigate('/lobby')
    } else {
      setAuthMode('register')
      setTimeout(() => {
        document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-void)', color: 'var(--c-text)' }}>
      <HeroSection onJoinClick={scrollToAuth} />
      <DuelPreviewSection />
      <MissionBriefingSection />
      <RankLadderSection />
      <LoadoutSection />
      <HallOfHeroesSection />
      <AuthPanelSection authMode={authMode} setAuthMode={setAuthMode} />
      <FaqSection />
      <CtaBannerSection onJoinClick={scrollToAuth} />
      <FooterSection />
    </div>
  )
}
