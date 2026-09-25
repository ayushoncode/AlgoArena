import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { UserAvatar } from '../utils/avatar'

/* ════════════════════════════════════════════════
   TYPEWRITER HOOK
   Recursive setTimeout → realistic typing cadence
════════════════════════════════════════════════ */
function useTypewriter(text, msPerChar = 28, startAfterMs = 0) {
  const [pos, setPos] = useState(0)
  const timerRef = useRef(null)

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
   BATTLE CODE SNIPPETS
════════════════════════════════════════════════ */
const YOU_CODE = `// Optimized Two-Pointer / Map — O(n)
function twoSum(nums, target) {
  const map = new Map()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (map.has(complement)) {
      return [map.get(complement), i]
    }
    map.set(nums[i], i)
  }
}`

const OPP_CODE = `// Brute force search — O(n²)
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
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
  if (isComment) {
    return (
      <div className="flex">
        <span className="select-none w-7 text-right pr-3 shrink-0 text-[#3b4261]">{lineNo}</span>
        <span className="text-[#4b5563] italic">{line}</span>
      </div>
    )
  }
  const parts = []
  let last = 0
  const allMatches = []
  for (const m of line.matchAll(KW_RE)) allMatches.push({ i: m.index, len: m[0].length, type: 'kw', val: m[0] })
  for (const m of line.matchAll(NUM_RE)) allMatches.push({ i: m.index, len: m[0].length, type: 'num', val: m[0] })
  allMatches.sort((a, b) => a.i - b.i)

  for (const { i, len, type, val } of allMatches) {
    if (i < last) continue
    if (i > last) parts.push(<span key={last} className="text-[#dde1ea]">{line.slice(last, i)}</span>)
    parts.push(<span key={i} className={type === 'kw' ? 'text-[#f97316] font-medium' : 'text-[#22d3ee]'}>{val}</span>)
    last = i + len
  }
  if (last < line.length) parts.push(<span key={last} className="text-[#dde1ea]">{line.slice(last)}</span>)

  return (
    <div className="flex">
      <span className="select-none w-7 text-right pr-3 shrink-0 text-[#3b4261]">{lineNo}</span>
      <span>{parts}</span>
    </div>
  )
}

function CodePanel({ typed, showCursor, verdict, label, rating, you }) {
  const lines = typed.split('\n')
  const borderColor = verdict === 'ACCEPTED' ? '#10b981'
    : verdict === 'WRONG ANSWER' ? '#f43f5e'
      : '#1e2130'

  return (
    <div className="flex flex-col border transition-all duration-300 rounded overflow-hidden"
      style={{ borderColor, background: '#090b13' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0b0d14] border-b border-[#1e2130]">
        <div className="flex items-center gap-2">
          {you ? <span className="dot-live" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#4b5563]" />}
          <span className="font-mono text-xs font-semibold" style={{ color: you ? '#dde1ea' : '#6b7280' }}>
            {label}
          </span>
          <span className="font-mono text-[11px] font-bold" style={{ color: you ? '#f97316' : '#6b7280' }}>
            [{rating}]
          </span>
        </div>

        {verdict && (
          <span className="verdict-in font-mono text-[10px] font-bold px-2 py-0.5 rounded"
            style={{
              background: verdict === 'ACCEPTED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              color: verdict === 'ACCEPTED' ? '#10b981' : '#f43f5e',
              border: `1px solid ${verdict === 'ACCEPTED' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            }}>
            {verdict}
          </span>
        )}
      </div>

      {/* Code */}
      <div className="p-3.5 font-mono text-[12px] leading-5.5 flex-1 overflow-hidden" style={{ minHeight: 190 }}>
        {lines.map((line, i) => (
          <CodeLine key={i} line={line} lineNo={i + 1} />
        ))}
        {showCursor && !verdict && (
          <div className="flex">
            <span className="select-none w-7 text-right pr-3 shrink-0 text-[#3b4261]">{lines.length + 1}</span>
            <span className="cursor-blink inline-block w-2 h-[1em] align-middle" style={{ background: you ? '#f97316' : '#6b7280' }} />
          </div>
        )}
      </div>
    </div>
  )
}

const PHASES = { CODING: 'coding', RUNNING: 'running', ACCEPTED: 'accepted', RESULT: 'result' }

function BattleCycle({ onComplete }) {
  const [phase, setPhase] = useState(PHASES.CODING)
  const [timerSec, setTimerSec] = useState(30 * 60)

  const you = useTypewriter(YOU_CODE, 22, 200)
  const opp = useTypewriter(OPP_CODE, 38, 500)

  useEffect(() => {
    if (phase === PHASES.RESULT) return
    const t = setInterval(() => setTimerSec(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (!you.done || phase !== PHASES.CODING) return
    setPhase(PHASES.RUNNING)
    const t1 = setTimeout(() => setPhase(PHASES.ACCEPTED), 1200)
    const t2 = setTimeout(() => setPhase(PHASES.RESULT), 2800)
    const t3 = setTimeout(() => onComplete(), 5800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [you.done]) // eslint-disable-line

  const mm = String(Math.floor(timerSec / 60)).padStart(2, '0')
  const ss = String(timerSec % 60).padStart(2, '0')

  return (
    <div className="glass-card rounded-lg overflow-hidden border border-[#1e2130] shadow-2xl">
      {/* Match Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#07090f] border-b border-[#1e2130]">
        <div className="flex items-center gap-2">
          <span className="dot-live" />
          <span className="font-mono text-xs font-semibold text-[#dde1ea]">you</span>
          <span className="font-mono text-[11px] font-bold text-[#f97316]">1347</span>
        </div>

        <div className="text-center">
          <div className="font-mono text-sm font-bold tabular-nums text-[#dde1ea]">
            {mm}:{ss}
          </div>
          <div className="font-mono text-[10px] text-[#6b7280]">
            Two Sum · arrays · medium
          </div>
        </div>

        <div className="flex items-center gap-2 flex-row-reverse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4b5563]" />
          <span className="font-mono text-xs text-[#6b7280]">opponent</span>
          <span className="font-mono text-[11px] font-bold text-[#6b7280]">1389</span>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-1.5 font-mono text-[11px] flex items-center gap-2 bg-[#05060a] border-b border-[#1e2130] text-[#4b5563]">
        {phase === PHASES.CODING && <><span className="dot-live" style={{ width: 5, height: 5 }} /> 1v1 match in progress · live typing</>}
        {phase === PHASES.RUNNING && <span className="text-[#f97316]">▶ executing in docker sandbox...</span>}
        {phase === PHASES.ACCEPTED && <span className="text-[#10b981] verdict-in">✓ 10/10 test cases passed — ACCEPTED</span>}
        {phase === PHASES.RESULT && (
          <span className="text-[#10b981] font-semibold verdict-in">
            🏆 Victory! +18 Elo → 1365 &nbsp;·&nbsp; Opponent loses −18 Elo
          </span>
        )}
      </div>

      {/* Split Code Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1e2130]">
        <CodePanel
          typed={you.typed}
          showCursor={!you.done}
          verdict={phase === PHASES.ACCEPTED || phase === PHASES.RESULT ? 'ACCEPTED' : null}
          label="you (faster O(n))"
          rating={1347}
          you={true}
        />
        <CodePanel
          typed={opp.typed}
          showCursor={!opp.done && phase === PHASES.CODING}
          verdict={phase === PHASES.RESULT ? 'WRONG ANSWER' : null}
          label="opponent (O(n²))"
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
   OTP DIGIT INPUT COMPONENT
════════════════════════════════════════════════ */
function OtpDigitsInput({ length = 6, value, onChange }) {
  const inputs = useRef([])

  function handleChange(e, index) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    const newArr = value.split('')
    newArr[index] = val || ''
    const nextVal = newArr.join('')
    onChange(nextVal)
    if (val && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    onChange(pasted)
    const nextFocus = Math.min(pasted.length, length - 1)
    inputs.current[nextFocus]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          className="otp-digit"
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   AUTH FORMS: OTP (Passwordless) + Email/PW + Register + Forgot Password
════════════════════════════════════════════════ */
function Field({ id, label, type = 'text', placeholder, value, onChange, autoComplete, rightElement }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="font-mono text-[10.5px] uppercase tracking-wider text-[#6b7280]">
          {label}
        </label>
        {rightElement}
      </div>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-field"
      />
    </div>
  )
}

function PasswordField({ id, label, placeholder, value, onChange, autoComplete, rightLabel, onRightClick }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="font-mono text-[10.5px] uppercase tracking-wider text-[#6b7280]">
          {label}
        </label>
        {rightLabel && (
          <button
            type="button"
            onClick={onRightClick}
            className="font-mono text-[10.5px] text-[#f97316] hover:underline"
          >
            {rightLabel}
          </button>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="input-field pr-8"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#dde1ea] text-xs font-mono select-none"
        >
          {show ? '👁️' : '👁️‍🗨️'}
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
    { label: 'Too short', color: '#f43f5e' },
    { label: 'Weak', color: '#f43f5e' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#22d3ee' },
    { label: 'Strong 💪', color: '#10b981' },
  ]
  const cur = levels[score] || levels[0]

  return (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? cur.color : '#1e2130' }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] text-right" style={{ color: cur.color }}>
        {cur.label}
      </p>
    </div>
  )
}

function Err({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up font-mono text-[11px] flex items-center gap-1.5 text-[#f43f5e] bg-[rgba(244,63,94,0.08)] p-2 rounded border border-[rgba(244,63,94,0.2)]">
      <span>✕</span>{msg}
    </p>
  )
}

function SuccessAlert({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up font-mono text-[11px] flex items-center gap-1.5 text-[#10b981] bg-[rgba(16,185,129,0.08)] p-2 rounded border border-[rgba(16,185,129,0.2)]">
      <span>✓</span>{msg}
    </p>
  )
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  )
}

/** 1-Click OTP Verification Form */
function OtpLoginForm({ onSwitchPassword }) {
  const { sendOtp, loginWithOtp, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: email, 2: 6-digit OTP
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
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErr('Please enter a valid email address')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const res = await sendOtp(email.trim().toLowerCase())
      if (res.devOtp) setDevOtp(res.devOtp)
      setStep(2)
      setCooldown(30)
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyOtp(e) {
    if (e) e.preventDefault()
    if (otp.length < 6) {
      setErr('Please enter the 6-digit OTP code')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const res = await loginWithOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      if (res?.isNewUser || !res?.user?.is_username_set) {
        setSuggestedHandle(res?.user?.username || email.split('@')[0])
        setShowUsernameModal(true)
      } else {
        navigate('/lobby')
      }
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 fade-in">
      <Err msg={err} />

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Field
            id="otp-email"
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            autoComplete="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr('') }}
          />

          <button
            id="send-otp-submit"
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 shadow-lg shadow-orange-500/20"
          >
            {busy ? <><Spinner /> Sending OTP...</> : <>Send 6-Digit Login Code →</>}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onSwitchPassword}
              className="font-mono text-[11px] text-[#6b7280] hover:text-[#f97316] transition-colors"
            >
              Sign in with password instead
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center space-y-1">
            <p className="font-mono text-xs text-[#9ca3af]">Code sent to</p>
            <p className="font-mono text-xs font-bold text-[#f97316]">{email}</p>
          </div>

          {devOtp && (
            <div className="p-2 bg-[#111422] border border-[#22d3ee]/30 rounded text-center">
              <span className="font-mono text-[10px] text-[#22d3ee]">Dev Code: </span>
              <span className="font-mono text-xs font-bold text-white tracking-widest">{devOtp}</span>
            </div>
          )}

          <div className="py-2">
            <OtpDigitsInput length={6} value={otp} onChange={setOtp} />
          </div>

          <button
            id="verify-otp-submit"
            type="submit"
            disabled={busy || otp.length < 6}
            className="btn-primary w-full py-3"
          >
            {busy ? <><Spinner /> Verifying...</> : <>Enter Arena →</>}
          </button>

          <div className="flex items-center justify-between font-mono text-[11px] text-[#6b7280]">
            <button type="button" onClick={() => setStep(1)} className="hover:text-white transition-colors">
              ← Change email
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={handleSendOtp}
              className="hover:text-[#f97316] transition-colors disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

/** Standard Password Login */
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
      const { data } = await api.post('/api/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setErr(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={go} className="space-y-4 fade-in" noValidate>
      <Err msg={err} />
      <Field id="l-email" label="Email" type="email" placeholder="you@domain.com" autoComplete="email" value={form.email} onChange={set('email')} />
      <PasswordField
        id="l-password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={form.password}
        onChange={set('password')}
        rightLabel="Forgot password?"
        onRightClick={onSwitchForgot}
      />

      <button id="login-submit" type="submit" disabled={busy} className="btn-primary w-full py-3">
        {busy ? <><Spinner /> Authenticating...</> : <>sign_in() →</>}
      </button>

      <div className="flex items-center justify-between font-mono text-[11px] pt-1">
        <button type="button" onClick={onSwitchOtp} className="text-[#f97316] hover:underline">
          ⚡ Sign in with OTP
        </button>
        <button type="button" onClick={onSwitchRegister} className="text-[#6b7280] hover:text-[#dde1ea]">
          Register account →
        </button>
      </div>
    </form>
  )
}

/** Complete Forgot & Reset Password Form */
function ForgotPasswordForm({ onBackToLogin }) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: enter email, 2: enter OTP & new password
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
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErr('Please enter a valid email address')
      return
    }
    setBusy(true)
    setErr('')
    setSuccess('')
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() })
      if (data.devOtp) setDevOtp(data.devOtp)
      setSuccess('Reset code sent to your email!')
      setStep(2)
      setCooldown(30)
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Failed to send reset code')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(e) {
    if (e) e.preventDefault()
    if (otp.length < 6) { setErr('Please enter the 6-digit reset code'); return }
    if (newPassword.length < 6) { setErr('New password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setErr("Passwords do not match"); return }

    setBusy(true)
    setErr('')
    try {
      const { data } = await api.post('/api/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      })
      login(data)
      navigate('/lobby')
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Failed to reset password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <Err msg={err} />
      <SuccessAlert msg={success} />

      {step === 1 && (
        <form onSubmit={handleSendResetCode} className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-xs text-[#dde1ea]">Reset Your Password</h3>
            <p className="text-[11px] text-[#6b7280]">
              Enter your registered email and we'll send you a 6-digit verification code to reset your password.
            </p>
          </div>

          <Field
            id="forgot-email"
            label="Account Email"
            type="email"
            placeholder="you@domain.com"
            autoComplete="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr('') }}
          />

          <button
            id="forgot-submit"
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-3 shadow-lg shadow-orange-500/20"
          >
            {busy ? <><Spinner /> Sending Code...</> : <>Send Password Reset Code →</>}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-mono text-[11px] text-[#6b7280] hover:text-[#dde1ea] transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div className="text-center space-y-0.5">
            <p className="font-mono text-xs text-[#9ca3af]">Enter 6-digit code sent to</p>
            <p className="font-mono text-xs font-bold text-[#f97316]">{email}</p>
          </div>

          {devOtp && (
            <div className="p-2 bg-[#111422] border border-[#22d3ee]/30 rounded text-center">
              <span className="font-mono text-[10px] text-[#22d3ee]">Dev Code: </span>
              <span className="font-mono text-xs font-bold text-white tracking-widest">{devOtp}</span>
            </div>
          )}

          <div className="py-1">
            <OtpDigitsInput length={6} value={otp} onChange={setOtp} />
          </div>

          <PasswordField
            id="new-pw"
            label="New Password"
            placeholder="min. 6 characters"
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <PasswordStrength password={newPassword} />

          <PasswordField
            id="conf-new-pw"
            label="Confirm New Password"
            placeholder="repeat new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          <button
            id="reset-pw-submit"
            type="submit"
            disabled={busy || otp.length < 6 || newPassword.length < 6}
            className="btn-primary w-full py-3 mt-2"
          >
            {busy ? <><Spinner /> Updating Password...</> : <>Update Password & Sign In →</>}
          </button>

          <div className="flex items-center justify-between font-mono text-[11px] text-[#6b7280] pt-1">
            <button type="button" onClick={() => setStep(1)} className="hover:text-white transition-colors">
              ← Change email
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={handleSendResetCode}
              className="hover:text-[#f97316] transition-colors disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

/** Standard Registration Form — 2-step with email verification */
function RegisterForm({ onSwitchLogin }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: fill form, 2: enter OTP
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

    setBusy(true)
    setErr('')
    try {
      const { data } = await api.post('/api/auth/send-registration-otp', {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      if (data.devOtp) setDevOtp(data.devOtp)
      setSuccess('Verification code sent! Check your inbox.')
      setStep(2)
      setCooldown(30)
    } catch (err) {
      setErr(err.response?.data?.message || err.message || 'Failed to send verification code')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (otp.length < 6) { setErr('Please enter the 6-digit code'); return }
    setBusy(true)
    setErr('')
    try {
      const { data } = await api.post('/api/auth/register', {
        email: form.email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setErr(err.response?.data?.message || err.message || 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <Err msg={err} />
      <SuccessAlert msg={success} />

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-3.5" noValidate>
          <Field id="r-user" label="Username" placeholder="ninja_coder" autoComplete="username" value={form.username} onChange={set('username')} />
          <Field id="r-email" label="Email" type="email" placeholder="you@domain.com" autoComplete="email" value={form.email} onChange={set('email')} />
          <PasswordField id="r-pw" label="Password" placeholder="min. 6 characters" autoComplete="new-password" value={form.password} onChange={set('password')} />
          <PasswordStrength password={form.password} />
          <PasswordField id="r-conf" label="Confirm Password" placeholder="repeat password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />

          <button id="register-submit" type="submit" disabled={busy} className="btn-primary w-full py-3 mt-2">
            {busy ? <><Spinner /> Sending Verification Code...</> : <>Verify Email & Create Account →</>}
          </button>

          <p className="font-mono text-[11px] text-center text-[#6b7280] pt-1">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchLogin} className="text-[#f97316] hover:underline">
              Sign in →
            </button>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-center space-y-1">
            <p className="font-mono text-xs text-[#9ca3af]">Enter the 6-digit code sent to</p>
            <p className="font-mono text-xs font-bold text-[#10b981]">{form.email}</p>
          </div>

          {devOtp && (
            <div className="p-2 bg-[#111422] border border-[#10b981]/30 rounded text-center">
              <span className="font-mono text-[10px] text-[#10b981]">Dev Code: </span>
              <span className="font-mono text-xs font-bold text-white tracking-widest">{devOtp}</span>
            </div>
          )}

          <div className="py-1">
            <OtpDigitsInput length={6} value={otp} onChange={setOtp} />
          </div>

          <button id="register-verify-submit" type="submit" disabled={busy || otp.length < 6} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Creating Account...</> : <>Confirm & Enter Arena →</>}
          </button>

          <div className="flex items-center justify-between font-mono text-[11px] text-[#6b7280]">
            <button type="button" onClick={() => { setStep(1); setSuccess(''); setOtp(''); setDevOtp(null) }} className="hover:text-white transition-colors">
              ← Back
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={handleSendOtp}
              className="hover:text-[#f97316] transition-colors disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

/** Choose Username Onboarding Modal */
function ChooseUsernameModal({ defaultUsername, onConfirm, busy, err }) {
  const [handle, setHandle] = useState(defaultUsername || '')

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(handle.trim().toLowerCase())
  }

  const isValid = /^[a-zA-Z0-9_]{3,30}$/.test(handle.trim())

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-6 rounded-xl border border-[#1e2130] shadow-2xl space-y-4 fade-in">
        <div className="text-center space-y-1">
          <div className="text-3xl mb-1">⚔️</div>
          <h3 className="font-display font-bold text-lg text-[#dde1ea]">Choose Your Arena Handle</h3>
          <p className="text-xs text-[#9ca3af]">
            Pick a custom username for leaderboards and live match battles.
          </p>
        </div>

        <Err msg={err} />

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="font-mono text-[10.5px] uppercase tracking-wider block mb-1.5 text-[#6b7280]">
              Arena Handle / Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-[#f97316]">@</span>
              <input
                type="text"
                autoFocus
                maxLength={30}
                placeholder="algo_ninja"
                value={handle}
                onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full bg-[#0d0f17] border border-[#1e2130] focus:border-[#f97316] rounded px-8 py-2.5 text-sm font-mono text-[#dde1ea] outline-none transition-colors"
              />
            </div>
            <p className="font-mono text-[10px] text-[#6b7280] mt-1.5">
              3–30 chars (letters, numbers, underscore)
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || busy}
            className="btn-primary w-full py-3 shadow-lg shadow-orange-500/20 disabled:opacity-40"
          >
            {busy ? <><Spinner /> Saving Handle...</> : <>Enter Arena Lobby →</>}
          </button>
        </form>
      </div>
    </div>
  )
}

/** Google One-Click Sign-In with Custom Handle Setup */
function GoogleAuthButton() {
  const { loginWithFirebase, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [suggestedHandle, setSuggestedHandle] = useState('')
  const [usernameErr, setUsernameErr] = useState('')

  async function handleGoogleSignIn() {
    setBusy(true)
    setErr('')
    try {
      const { auth, googleProvider, signInWithPopup } = await import('../utils/firebase')
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()

      const rawSuggest = (result.user.displayName || result.user.email?.split('@')[0] || 'coder')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase()
        .slice(0, 20)

      const authRes = await loginWithFirebase({
        idToken,
        username: rawSuggest,
      })

      // If user is brand-new, prompt them to pick a custom handle
      if (authRes?.isNewUser) {
        setSuggestedHandle(rawSuggest)
        setShowUsernameModal(true)
      } else {
        navigate('/lobby')
      }
    } catch (e) {
      console.error('[Google Sign-In Error]', e)
      if (e.code === 'auth/api-key-not-valid' || e.code === 'auth/invalid-api-key' || e.code === 'auth/configuration-not-found') {
        setErr('Firebase Google Auth: please configure VITE_FIREBASE_API_KEY in frontend/.env, or use Fast OTP below!')
      } else if (e.code === 'auth/popup-closed-by-user') {
        // user cancelled popup
      } else {
        setErr(e.message || 'Google sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmUsername(chosenHandle) {
    setBusy(true)
    setUsernameErr('')
    try {
      const { data } = await api.patch('/api/users/me/username', { username: chosenHandle })
      if (data.token) {
        localStorage.setItem('aa_token', data.token)
        localStorage.setItem('aa_user', JSON.stringify(data.user))
        await refreshUser(data.user)
      }
      setShowUsernameModal(false)
      navigate('/lobby')
    } catch (err) {
      setUsernameErr(err.response?.data?.message || err.message || 'Failed to update handle')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 mb-5">
      {showUsernameModal && (
        <ChooseUsernameModal
          defaultUsername={suggestedHandle}
          onConfirm={handleConfirmUsername}
          busy={busy}
          err={usernameErr}
        />
      )}

      <Err msg={err} />
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        className="w-full py-2.5 px-4 rounded border border-[#1e2130] bg-[#0d0f17] hover:bg-[#151928] hover:border-[#374151] text-[#dde1ea] font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98]"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
          <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
        </svg>
        <span>{busy ? 'Signing in with Google...' : 'Continue with Google'}</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1e2130]" />
        <span className="font-mono text-[10px] text-[#4b5563] uppercase tracking-wider">or sign in with</span>
        <div className="h-px flex-1 bg-[#1e2130]" />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MAIN LANDING PAGE
════════════════════════════════════════════════ */
/** Live Leaderboard Teaser */
function LiveLeaderboardTeaser() {
  const [players, setPlayers] = useState([])
  useEffect(() => {
    api.get('/api/users/leaderboard')
      .then(({ data }) => setPlayers(data.slice(0, 5)))
      .catch(() => { })
  }, [])

  if (!players.length) return null

  return (
    <div className="p-6 rounded-2xl border border-[#1a1a24] bg-[#0a0a0f] space-y-5 shadow-xl shadow-black/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#ff5a00] to-orange-900 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-sm">🏆</span>
          </div>
          <h3 className="font-display font-bold text-lg text-[#e6edf3]">Arena Masters</h3>
        </div>
        <Link to="/leaderboard" className="font-mono text-[11px] font-semibold text-[#ff5a00] hover:text-[#ff7a33] transition-colors border border-[#ff5a00]/30 px-2.5 py-1 rounded-full bg-[#ff5a00]/10 hover:bg-[#ff5a00]/20">
          Full Ranks →
        </Link>
      </div>
      <div className="space-y-2.5 relative z-10">
        {players.map((p, idx) => (
          <div key={p.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#ff5a00]/50 transition-colors group cursor-default">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black text-[#6e7681] w-5 text-center group-hover:text-[#ff5a00] transition-colors">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </span>
              <UserAvatar username={p.username} size={32} />
              <div>
                <p className="font-sans text-sm font-bold text-[#e6edf3] leading-tight">{p.username}</p>
                <p className="font-mono text-[9.5px] text-[#8b949e] mt-0.5">{p.wins || 0}W · {p.losses || 0}L</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff5a00] to-orange-400">{p.elo_rating}</span>
              <p className="font-mono text-[9px] text-[#6e7681] uppercase tracking-wider">elo</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 1v1 Duel Engine Showcase (Modern, High-Tech Architecture) */
function DuelEngineShowcase() {
  const [activeTab, setActiveTab] = useState(0)

  const steps = [
    {
      id: 'matchmaking',
      num: '01',
      title: 'Real-Time Matchmaking',
      badge: 'Latency < 25ms',
      badgeColor: '#10b981',
      tag: 'WebSocket Engine',
      desc: 'Smart rating-balanced matchmaking finds an opponent near your Elo bracket. Window dynamically expands every 10s for zero-wait duels.',
      highlight: 'Symmetric Problem Dispatch',
      codePreview: `// Matchmaking Socket Handshake
socket.emit('join_queue', { topic: 'trees', difficulty: 'medium' });
socket.on('match_found', ({ roomId, problem, opponent }) => {
  arena.initializeBattle({ roomId, symmetricClock: true });
});`
    },
    {
      id: 'sandbox',
      num: '02',
      title: 'Isolated Docker Sandbox',
      badge: 'Zero Cheats',
      badgeColor: '#22d3ee',
      tag: 'Security & Runtime',
      desc: 'Your code compiles and executes inside a locked, network-disabled Linux container with 512MB RAM cap and 0.5 CPU quota for pure fairness.',
      highlight: 'Polyglot BFS Deserialization',
      codePreview: `# Hardened Runner Benchmark
docker run --network none --memory 512m --cpus 0.5 \\
  --security-opt no-new-privileges:true \\
  algoarena-runner:latest --timeout 5000ms`
    },
    {
      id: 'radar',
      num: '03',
      title: 'Live Keystroke Radar',
      badge: 'Real-Time Spectating',
      badgeColor: '#f59e0b',
      tag: 'Live Duel HUD',
      desc: 'Watch real-time typing indicators, character count deltas, test run attempts, and compilation status for maximum esports adrenaline.',
      highlight: 'Instant Verdict Broadcast',
      codePreview: `// Real-Time Opponent Telemetry
socket.on('opponent_typing', ({ charCount, activeLine }) => {
  hud.updateRadar({ opponent: 'priya', speed: '84 WPM', progress: 0.72 });
});`
    },
    {
      id: 'elo',
      num: '04',
      title: 'True Elo Progression',
      badge: 'Chess-Grade Math',
      badgeColor: '#f97316',
      tag: 'Dynamic K=32 Factor',
      desc: 'Win duels to steal opponent Elo and climb through rank tiers from Novice to Grandmaster. Features full rating history charts.',
      highlight: 'Codeforces-Style Tiers',
      codePreview: `// Elo Settlement Matrix
const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
const deltaA = Math.round(K_FACTOR * (scoreA - expectedA));
database.atomicUpdateElo({ userId, delta: deltaA });`
    }
  ]

  const curr = steps[activeTab]

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 font-mono text-[11px] text-[#ff5a00] mb-4">
            <span className="dot-live" />
            <span>Architecture & Battle Engine</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-[#ffffff] tracking-tight">
            How 1v1 Arena Duels Work
          </h2>
        </div>
        <p className="font-sans text-sm text-[#8b949e] max-w-md">
          Built from the ground up for sub-millisecond responsiveness, anti-cheat isolation, and competitive adrenaline.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, idx) => {
          const sel = activeTab === idx
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(idx)}
              className={`p-5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${sel
                ? 'bg-[#0d1117] border-[#ff5a00] shadow-[0_0_20px_rgba(255,90,0,0.15)] scale-[1.02]'
                : 'bg-[#010409] border-[#30363d] hover:border-[#8b949e] opacity-80 hover:opacity-100 hover:scale-[1.01]'
                }`}
            >
              {sel && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff5a00] to-[#ff9a44]" />
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-black text-xl" style={{ color: sel ? '#ff5a00' : '#6e7681' }}>
                  {s.num}
                </span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold" style={{ background: `${s.badgeColor}15`, color: s.badgeColor, border: `1px solid ${s.badgeColor}35` }}>
                  {s.badge}
                </span>
              </div>
              <p className="font-display font-bold text-[15px] text-[#e6edf3] mb-1.5">{s.title}</p>
              <p className="font-mono text-[10px] text-[#8b949e] truncate">{s.tag}</p>
            </button>
          )
        })}
      </div>

      {/* Detail Showcase Card */}
      <div className="relative p-1 rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#010409]">
        <div className="p-8 sm:p-10 rounded-[15px] bg-[#0d1117] grid lg:grid-cols-[1fr_0.8fr] gap-12 items-center">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ff5a00] to-orange-400">{curr.num}</span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-[#ffffff]">{curr.title}</h3>
            </div>
            <p className="text-[15px] text-[#8b949e] leading-relaxed font-sans">
              {curr.desc}
            </p>
            <div className="flex items-center gap-4 pt-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 font-semibold">
                <span className="animate-pulse">⚡</span>
                <span>{curr.highlight}</span>
              </div>
              <Link to="/lobby" className="font-mono text-xs text-[#ff5a00] hover:text-[#ff7a33] hover:underline flex items-center gap-1 font-bold transition-colors">
                Try it live in Arena →
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#010409] p-5 shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#30363d] text-[10px] font-mono text-[#6e7681]">
              <span>// engine_preview.js</span>
              <span className="text-[#2ea043] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043]" /> verified
              </span>
            </div>
            <pre className="font-mono text-[13px] text-[#c9d1d9] leading-relaxed overflow-x-auto">
              <code>{curr.codePreview}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 4 Major Languages Matrix */
function LanguageMatrixShowcase() {
  const [activeLang, setActiveLang] = useState('javascript')
  const snippets = {
    javascript: `// JavaScript (Node.js 20 V8) - Sub-second Execution
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`,
    python: `# Python 3.11 - Clean, Expressive & Fast
class Solution:
    def solution(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, val in enumerate(nums):
            diff = target - val
            if diff in seen:
                return [seen[diff], i]
            seen[val] = i
        return []`,
    cpp: `// C++ 20 (GCC 13) - Peak Microsecond Performance
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (mp.count(complement)) return {mp[complement], i};
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
    java: `// Java 21 (OpenJDK) - Strict Reflection Runner
import java.util.HashMap;

class Solution {
    public int[] solution(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`
  }

  const langs = [
    { id: 'javascript', label: 'JavaScript', tag: 'Node 20' },
    { id: 'python', label: 'Python', tag: 'Python 3.11' },
    { id: 'cpp', label: 'C++', tag: 'GCC 20' },
    { id: 'java', label: 'Java', tag: 'OpenJDK 21' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 font-mono text-[11px] text-orange-400 mb-4">
          <span>// Polyglot Sandbox</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#ffffff] tracking-tight">Write in Your Favorite Language</h2>
      </div>

      <div className="p-1 rounded-2xl bg-gradient-to-br from-[#1a1a24] to-transparent shadow-2xl shadow-black/40">
        <div className="rounded-[15px] bg-[#0d1117] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363d] bg-[#010409] flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              {langs.map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLang(l.id)}
                  className={`px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${activeLang === l.id
                    ? 'bg-[#161b22] text-[#ff5a00] border border-[#30363d] shadow-sm'
                    : 'text-[#6e7681] hover:text-[#8b949e] border border-transparent hover:bg-[#161b22]/50'
                    }`}
                >
                  {l.label} <span className="text-[10px] font-normal opacity-70">({l.tag})</span>
                </button>
              ))}
            </div>
            <span className="font-mono text-[11px] text-[#2ea043] flex items-center gap-1.5 bg-[#2ea043]/10 px-2.5 py-1 rounded-full border border-[#2ea043]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] animate-pulse" /> Auto BFS Serialization
            </span>
          </div>

          <pre className="p-5 sm:p-6 font-mono text-[13px] leading-relaxed overflow-x-auto text-[#c9d1d9] bg-[#0d1117]">
            <code>{snippets[activeLang]}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

/** FAQ Accordion */
function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0)
  const faqs = [
    {
      q: 'How does the 1v1 live duel matchmaking work?',
      a: 'When you queue for a topic and difficulty, our matchmaking engine pairs you with an opponent near your Elo bracket (window expands ±100 Elo every 10s). Both players receive the exact same DSA problem at the exact same millisecond. The first developer whose code passes 100% of hidden test cases wins the duel and steals Elo rating.'
    },
    {
      q: 'How is code executed and judged securely?',
      a: 'Every submission runs inside an isolated, hardened Docker container with network access disabled, 512MB memory limit, 0.5 CPU cap, and a strict 5-second execution timeout. This guarantees zero cheats, sub-second judging, and fair benchmarks.'
    },
    {
      q: 'Can I challenge my friends or college peers in private matches?',
      a: 'Yes! From the Lobby, click "battle_friend() ⚔️ (private room)". You can choose the topic and difficulty, then generate a shareable 6-character room code or direct invite link. Once your friend enters the code, the private duel begins immediately.'
    },
    {
      q: 'Which programming languages are supported?',
      a: 'AlgoArena natively supports JavaScript (Node.js 20), Python 3.11, C++ 20 (GCC 13), and Java 21 (OpenJDK). All complex data structures including TreeNodes and ListNodes are automatically parsed and serialized with BFS format.'
    },
    {
      q: 'What happens if a player disconnects during a match?',
      a: 'AlgoArena has built-in disconnect grace period. If a player momentarily loses connection, they have 30 seconds to reconnect before the match is declared a forfeit, preventing unfair Elo losses.'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-[#f97316] mb-1">// FAQ</p>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#dde1ea]">Frequently Asked Questions</h2>
      </div>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="glass-card rounded-lg border border-[#1e2130] overflow-hidden"
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full p-4 text-left font-semibold text-sm text-[#dde1ea] flex items-center justify-between gap-4"
            >
              <span>{f.q}</span>
              <span className="font-mono text-sm text-[#f97316] shrink-0 w-6 text-center">
                {openIdx === i ? '−' : '+'}
              </span>
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-xs text-[#9ca3af] leading-relaxed border-t border-[#1e2130]/50 pt-3">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Modern Footer */
function FooterSection() {
  return (
    <footer className="border-t border-[#1e2130] bg-[#05060a] py-12 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-lg text-[#dde1ea] flex items-center gap-1">
            <span className="text-[#f97316]">⚡</span>
            <span>AlgoArena</span>
          </span>
          <span className="text-[#1e2130]">|</span>
          <span className="font-mono text-xs text-[#6b7280]">
            Where Rivalries Are Settled in Code.
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d0f17] border border-[#1e2130] text-xs font-mono text-[#9ca3af]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>All 4 Sandbox Runners Operational</span>
        </div>

        <p className="font-mono text-xs text-[#4b5563]">
          Built with ⚡ for competitive programmers
        </p>
      </div>
    </footer>
  )
}

/* ════════════════════════════════════════════════
   MAIN LANDING PAGE
════════════════════════════════════════════════ */
export default function Home() {
  const [authMode, setAuthMode] = useState('otp') // 'otp' | 'password' | 'register'
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[#030305] relative overflow-hidden font-sans">

      {/* Premium Cinematic Background Aura */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/15 via-cyan-900/5 to-transparent blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-orange-500/10 blur-[100px] pointer-events-none -z-10 animate-float-slow" style={{ animationDelay: '2s' }} />

      {/* ── LIVE STATS TICKER STRIP ─────────────────────────── */}
      <div className="border-b border-[#1a1a24] bg-[#050508]/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between text-[11px] font-mono text-[#8b949e] z-10 sticky top-0">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
              <span className="dot-live" />
              <span className="text-[#e6edf3] font-semibold tracking-wide">1v1 Real-Time</span>
            </div>
            <span className="text-[#30363d]">|</span>
            <span className="shrink-0"><span className="text-orange-400 font-bold">175+</span> Premium DSA Problems</span>
            <span className="text-[#30363d]">|</span>
            <span className="shrink-0"><span className="text-cyan-400 font-bold">4</span> Runtimes (JS, Py, C++, Java)</span>
            <span className="text-[#30363d]">|</span>
            <span className="shrink-0"><span className="text-emerald-400 font-bold">0.5s</span> Docker Sandboxing</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[#6e7681]">
            <span>FIDE-grade Elo System</span>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ────────────────────────────────────── */}
      <section className="px-5 sm:px-8 pt-20 pb-16 max-w-6xl mx-auto w-full text-center space-y-10 relative z-10 animate-slide-up-fade">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 font-mono text-xs shadow-[0_0_15px_rgba(249,115,22,0.1)] backdrop-blur-md hover:border-orange-500/40 transition-colors cursor-default">
          <span className="dot-live" />
          <span className="font-semibold tracking-wide uppercase">AlgoArena Season 1 Active</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="font-display font-black tracking-tight leading-[1.08] text-5xl sm:text-6xl lg:text-[5rem] text-[#ffffff] drop-shadow-sm">
            Where Rivalries Are<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5a00] to-[#ff9a44]">Settled in Code.</span>
          </h1>

          <p className="text-[#8b949e] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-sans font-medium">
            The premier 1v1 real-time competitive coding arena. Two developers enter. Exact same problem. First to achieve <span className="text-[#2ea043] font-mono font-bold bg-[#2ea043]/10 px-1.5 py-0.5 rounded border border-[#2ea043]/20">ACCEPTED</span> steals opponent Elo.
          </p>
        </div>

        {/* Hero Action CTAs */}
        <div className="flex items-center justify-center gap-5 pt-4 flex-wrap">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/lobby')}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-black bg-[#ff5a00] rounded hover:bg-[#ff7a33] transition-all duration-200 active:scale-95 shadow-[0_0_30px_-5px_rgba(255,90,0,0.4)]"
            >
              Enter Matchmaking Arena
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMode('register')
                document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-black bg-gradient-to-r from-[#ff5a00] to-[#ff9a44] rounded hover:from-[#ff7a33] hover:to-[#ffb377] transition-all duration-200 active:scale-95 shadow-[0_0_35px_-5px_rgba(255,90,0,0.5)]"
            >
              Create Account & Battle
              <span className="group-hover:translate-x-1 transition-transform">⚡</span>
            </button>
          )}
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-[#c9d1d9] bg-[#161b22] border border-[#30363d] rounded hover:border-[#8b949e] hover:bg-[#21262d] transition-all duration-200 active:scale-95 shadow-sm"
          >
            Explore Leaderboards 🏆
          </Link>
        </div>

        {/* Quick Highlights Row */}
        <div className="flex items-center justify-center gap-8 pt-6 text-sm font-mono text-[#6e7681] flex-wrap opacity-80">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Zero Cheats Sandbox
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Live Keystroke Radar
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            K=32 Elo Settlement
          </span>
        </div>

        {/* ── LIVE SIMULATED DUEL ARENA (Hero Centerpiece) ─── */}
        <div className="pt-12 max-w-4xl mx-auto text-left relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-cyan-500/20 blur-xl opacity-50 z-0 rounded-2xl" />
          <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-[#1a1a24] bg-[#0d1117]">
            {/* Fake macOS Traffic Lights */}
            <div className="bg-[#010409] border-b border-[#30363d] px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex-1 text-center font-mono text-[10px] text-[#6e7681]">algoarena-battle-engine.sh</div>
            </div>
            <BattlePreview />
          </div>
        </div>
      </section>


      {/* ── 1v1 DUEL ARCHITECTURE SHOWCASE ──────────────────── */}
      <section className="border-t border-[#1e2130] bg-[#07080d] py-20 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <DuelEngineShowcase />
        </div>
      </section>

      {/* ── FEATURES & AUTH SPLIT SECTION ───────────────────── */}
      <section className="bg-[#030305] py-28 px-5 sm:px-8 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1a1a24] to-transparent" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-16 items-start relative z-10">

          {/* Feature Highlights Left */}
          <div className="space-y-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-mono text-[11px] text-cyan-400 mb-4">
                <span>⚡ Competitive Infrastructure</span>
              </div>
              <h2 className="font-display font-black text-4xl sm:text-5xl text-[#ffffff] tracking-tight leading-[1.1]">
                Engineered for Peak <br className="hidden sm:block" />Performance & Fair Play
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: '⚡',
                  title: 'Instant Matchmaking',
                  badge: '< 3s queue',
                  desc: 'Smart rating algorithm finds an opponent in seconds, dynamically expanding Elo ranges for zero-wait battles.',
                },
                {
                  icon: '🛡️',
                  title: 'Docker Sandbox',
                  badge: '512MB RAM cap',
                  desc: 'Code executes inside a locked, network-disabled Linux container ensuring absolute security and fairness.',
                },
                {
                  icon: '🏆',
                  title: 'Elo Rating Engine',
                  badge: 'Chess-Grade Math',
                  desc: 'FIDE-standard rating math with dynamic K-factors, streak rewards, and robust anti-forfeit disconnect recovery.',
                },
                {
                  icon: '⚔️',
                  title: 'Private Friend Duels',
                  badge: 'Direct Room Codes',
                  desc: 'Create custom 1v1 battle rooms with invite codes to instantly challenge your peers or coworkers.',
                },
              ].map((feat, idx) => (
                <div key={idx} className="group p-6 rounded-2xl border border-[#1a1a24] bg-[#0a0a0f] hover:bg-[#0d1117] transition-colors hover:border-[#30363d] space-y-4 shadow-lg shadow-black/20">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{feat.icon}</span>
                    <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#e6edf3]">{feat.title}</h3>
                  <p className="text-sm text-[#8b949e] leading-relaxed font-sans">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* 3-Step Match Flow */}
            <div className="p-1 rounded-2xl bg-gradient-to-r from-[#1a1a24] via-[#30363d] to-[#1a1a24]">
              <div className="p-6 rounded-xl bg-[#030305] space-y-5">
                <p className="font-mono text-xs uppercase tracking-widest text-[#6e7681] font-bold">/ Workflow</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { n: '01', title: 'Queue & Match', desc: 'Symmetric problem assignment' },
                    { n: '02', title: 'Real-Time Duel', desc: 'Live keystroke radar HUD' },
                    { n: '03', title: 'Steal Rating', desc: 'Instant Elo settlement' },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <span className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-b from-[#ff5a00] to-orange-900">{s.n}</span>
                      <div className="pt-1">
                        <p className="font-bold text-sm text-[#e6edf3] leading-tight">{s.title}</p>
                        <p className="text-[11px] text-[#8b949e] mt-1">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Instant Authentication Panel Right */}
          <div id="auth-box" className="relative p-1 rounded-2xl bg-gradient-to-b from-[#1a1a24] to-transparent sticky top-24 shadow-2xl shadow-black/50">
            <div className="p-6 sm:p-8 rounded-[15px] bg-[#0d1117] space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-black text-2xl text-[#e6edf3]">Enter Arena</h3>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    Instant Access
                  </span>
                </div>
                <p className="text-[#8b949e] text-sm">Sign in to start battling instantly.</p>
              </div>

              {/* 1-Click Google Sign In */}
              <GoogleAuthButton />

              {/* Tabs */}
              {authMode !== 'forgot' && (
                <div className="flex items-center gap-1 p-1 bg-[#010409] rounded-lg border border-[#1a1a24] mb-5 font-mono text-[11px] font-bold">
                  <button
                    onClick={() => setAuthMode('otp')}
                    className={`flex-1 py-2 rounded-md transition-all ${authMode === 'otp'
                      ? 'bg-[#161b22] text-[#ff5a00] shadow-sm border border-[#30363d]'
                      : 'text-[#6e7681] hover:text-[#8b949e]'
                      }`}
                  >
                    ⚡ Fast OTP
                  </button>
                  <button
                    onClick={() => setAuthMode('password')}
                    className={`flex-1 py-2 rounded-md transition-all ${authMode === 'password'
                      ? 'bg-[#161b22] text-[#e6edf3] shadow-sm border border-[#30363d]'
                      : 'text-[#6e7681] hover:text-[#8b949e]'
                      }`}
                  >
                    Password
                  </button>
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 rounded-md transition-all ${authMode === 'register'
                      ? 'bg-[#161b22] text-cyan-400 shadow-sm border border-[#30363d]'
                      : 'text-[#6e7681] hover:text-[#8b949e]'
                      }`}
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Form Body */}
              <div className="min-h-[280px]">
                {authMode === 'otp' && <OtpLoginForm onSwitchPassword={() => setAuthMode('password')} />}
                {authMode === 'password' && (
                  <PasswordLoginForm
                    onSwitchOtp={() => setAuthMode('otp')}
                    onSwitchRegister={() => setAuthMode('register')}
                    onSwitchForgot={() => setAuthMode('forgot')}
                  />
                )}
                {authMode === 'register' && <RegisterForm onSwitchLogin={() => setAuthMode('password')} />}
                {authMode === 'forgot' && <ForgotPasswordForm onBackToLogin={() => setAuthMode('password')} />}
              </div>

              <div className="pt-5 mt-2 border-t border-[#1a1a24] text-center">
                <p className="font-mono text-[10px] text-[#4b5563]">
                  🔒 256-bit SSL • Docker Isolation • bcrypt
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── POLYGLOT MATRIX & LIVE MASTERS ──────────────────── */}
      <section className="bg-[#050508] py-28 px-5 sm:px-8 relative border-t border-[#1a1a24]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/10 to-transparent" />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-12 items-start relative z-10">
          <LanguageMatrixShowcase />
          <LiveLeaderboardTeaser />
        </div>
      </section>

      {/* ── FAQ SECTION ─────────────────────────────────────── */}
      <section className="border-t border-[#1e2130] bg-[#050609] py-20 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <FaqSection />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <FooterSection />

    </div>
  )
}
