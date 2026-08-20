import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

/* ════════════════════════════════════════════════
   TYPEWRITER HOOK
   Recursive setTimeout → realistic typing cadence
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

const KW = new Set(['function','const','let','var','return','if','for','new','of','has','get','set'])
const COMMENT_RE = /^(\/\/.*)$/
const NUM_RE = /\b(\d+)\b/g
const KW_RE  = new RegExp(`\\b(${[...KW].join('|')})\\b`, 'g')

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
  for (const m of line.matchAll(KW_RE))  allMatches.push({ i: m.index, len: m[0].length, type:'kw',  val: m[0] })
  for (const m of line.matchAll(NUM_RE)) allMatches.push({ i: m.index, len: m[0].length, type:'num', val: m[0] })
  allMatches.sort((a,b) => a.i - b.i)

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
    const t2 = setTimeout(() => setPhase(PHASES.RESULT),   2800)
    const t3 = setTimeout(() => onComplete(),               5800)
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
        {phase === PHASES.CODING   && <><span className="dot-live" style={{ width:5, height:5 }}/> 1v1 match in progress · live typing</>}
        {phase === PHASES.RUNNING  && <span className="text-[#f97316]">▶ executing in docker sandbox...</span>}
        {phase === PHASES.ACCEPTED && <span className="text-[#10b981] verdict-in">✓ 10/10 test cases passed — ACCEPTED</span>}
        {phase === PHASES.RESULT   && (
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
    { label: 'Weak',      color: '#f43f5e' },
    { label: 'Fair',      color: '#f59e0b' },
    { label: 'Good',      color: '#22d3ee' },
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
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"/>
    </svg>
  )
}

/** 1-Click OTP Verification Form */
function OtpLoginForm({ onSwitchPassword }) {
  const { sendOtp, loginWithOtp } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]         = useState(1) // 1: email, 2: 6-digit OTP
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [err, setErr]           = useState('')
  const [busy, setBusy]         = useState(false)
  const [devOtp, setDevOtp]     = useState(null)
  const [cooldown, setCooldown] = useState(0)

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
      await loginWithOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })
      navigate('/lobby')
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
            {busy ? <><Spinner/> Sending OTP...</> : <>Send 6-Digit Login Code →</>}
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
            {busy ? <><Spinner/> Verifying...</> : <>Enter Arena →</>}
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
  const navigate  = useNavigate()
  const [form, setForm] = useState({ email:'', password:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const set = f => e => { setForm(p=>({...p,[f]:e.target.value})); setErr('') }

  async function go(e) {
    e.preventDefault()
    if (!form.email||!form.password) { setErr('All fields required'); return }
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
        {busy ? <><Spinner/> Authenticating...</> : <>sign_in() →</>}
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
  const navigate  = useNavigate()

  const [step, setStep]         = useState(1) // 1: enter email, 2: enter OTP & new password
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr]           = useState('')
  const [success, setSuccess]   = useState('')
  const [busy, setBusy]         = useState(false)
  const [devOtp, setDevOtp]     = useState(null)
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
            {busy ? <><Spinner/> Sending Code...</> : <>Send Password Reset Code →</>}
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
            {busy ? <><Spinner/> Updating Password...</> : <>Update Password & Sign In →</>}
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

/** Standard Registration Form */
function RegisterForm({ onSwitchLogin }) {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({ username:'', email:'', password:'', confirm:'' })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const set = f => e => { setForm(p=>({...p,[f]:e.target.value})); setErr('') }

  async function go(e) {
    e.preventDefault()
    if (Object.values(form).some(v=>!v)) { setErr('All fields required'); return }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) { setErr('Username: 3–30 chars (letters/numbers/_)'); return }
    if (form.password.length < 6) { setErr('Password: min 6 chars'); return }
    if (form.password !== form.confirm) { setErr("Passwords don't match"); return }

    setBusy(true)
    try {
      const { data } = await api.post('/api/auth/register', {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setErr(err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={go} className="space-y-3.5 fade-in" noValidate>
      <Err msg={err}/>
      <Field id="r-user" label="Username" placeholder="ninja_coder" autoComplete="username" value={form.username} onChange={set('username')}/>
      <Field id="r-email" label="Email" type="email" placeholder="you@domain.com" autoComplete="email" value={form.email} onChange={set('email')}/>
      <PasswordField id="r-pw" label="Password" placeholder="min. 6 characters" autoComplete="new-password" value={form.password} onChange={set('password')}/>
      <PasswordStrength password={form.password} />
      <PasswordField id="r-conf" label="Confirm Password" placeholder="repeat password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')}/>

      <button id="register-submit" type="submit" disabled={busy} className="btn-primary w-full py-3 mt-2">
        {busy ? <><Spinner/> Creating Account...</> : <>create_account() →</>}
      </button>

      <p className="font-mono text-[11px] text-center text-[#6b7280] pt-1">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchLogin} className="text-[#f97316] hover:underline">
          Sign in →
        </button>
      </p>
    </form>
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
            {busy ? <><Spinner/> Saving Handle...</> : <>Enter Arena Lobby →</>}
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
  const [err, setErr]   = useState('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [suggestedHandle, setSuggestedHandle]     = useState('')
  const [usernameErr, setUsernameErr]             = useState('')

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
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
          <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
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
export default function Home() {
  const [authMode, setAuthMode] = useState('otp') // 'otp' | 'password' | 'register'
  const [searchParams]          = useSearchParams()
  const { isAuthenticated }     = useAuth()
  const navigate                = useNavigate()

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
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[#07080c] relative hero-grid-bg">

      {/* ── LIVE STATS TICKER STRIP ─────────────────────────── */}
      <div className="border-b border-[#1e2130] bg-[#090b13]/80 backdrop-blur-md px-4 py-2 flex items-center justify-between text-[11px] font-mono text-[#6b7280]">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <span className="dot-live" />
            <span className="text-[#dde1ea] font-semibold">1v1 Real-Time</span>
          </div>
          <span className="text-[#1e2130]">|</span>
          <span className="shrink-0"><span className="text-[#f97316] font-bold">30+</span> Curated LeetCode DSA Problems</span>
          <span className="text-[#1e2130]">|</span>
          <span className="shrink-0"><span className="text-[#22d3ee] font-bold">4</span> Languages: JS · Py · C++ · Java</span>
          <span className="text-[#1e2130]">|</span>
          <span className="shrink-0"><span className="text-[#10b981] font-bold">0.5s</span> Docker Sandboxed Execution</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[#4b5563]">
          <span>K=32 Elo Engine</span>
        </div>
      </div>

      {/* ── HERO & BATTLE SIMULATION ────────────────────────── */}
      <section className="px-5 sm:px-8 py-10 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 font-mono text-[11px]">
              <span className="dot-live" /> Live 1v1 Competitive Arena
            </div>
            <h1 className="font-display font-extrabold tracking-tight leading-[1.08] text-4xl sm:text-5xl lg:text-6xl text-[#dde1ea]">
              Code fast.<br/>
              Steal Elo.<br/>
              <span className="text-gradient-orange">Dominate the Arena.</span>
            </h1>
            <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
              Two developers enter with the exact same DSA problem. First to achieve a verified <span className="text-[#10b981] font-mono font-semibold">ACCEPTED</span> verdict in the isolated sandbox takes the match.
            </p>

            <div className="flex items-center gap-4 pt-2">
              {isAuthenticated ? (
                <button onClick={() => navigate('/lobby')} className="btn-primary py-3 px-6 text-sm glow-orange">
                  Enter Matchmaking Lobby →
                </button>
              ) : (
                <a href="#auth-box" className="btn-primary py-3 px-6 text-sm glow-orange">
                  Quick Join Arena ⚡
                </a>
              )}
              <Link to="/leaderboard" className="btn-ghost py-3 px-5 text-sm">
                View Global Ranks 🏆
              </Link>
            </div>
          </div>

          {/* Right side: Live Simulated Battle */}
          <div className="w-full lg:max-w-xl">
            <BattlePreview />
          </div>
        </div>
      </section>

      {/* ── FEATURES & AUTH GRID ────────────────────────────── */}
      <section className="border-t border-[#1e2130] bg-[#090b13]/50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid lg:grid-cols-[1fr_380px] gap-10">

          {/* Feature Highlights Left */}
          <div className="space-y-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#f97316] mb-2">// Built for Competitive DSA</p>
              <h2 className="font-display font-bold text-2xl text-[#dde1ea]">Engineered for pure speed & security</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: '⚡',
                  title: 'Instant Matchmaking',
                  desc: 'Queue by topic and difficulty. Search window widens ±100 Elo every 10s so matches start fast.',
                },
                {
                  icon: '🛡️',
                  title: 'Locked Docker Sandbox',
                  desc: 'Network disabled, 512MB RAM cap, 0.5 CPU, 5s timeout. Zero exploits, sub-second execution.',
                },
                {
                  icon: '🏆',
                  title: 'Live Elo Rating Engine',
                  desc: 'Chess-grade Elo rating with dynamic K-factors and anti-forfeit disconnect recovery.',
                },
                {
                  icon: '🌐',
                  title: '4 Major Languages',
                  desc: 'Write in JavaScript, Python, C++, or Java with full reflection and automatic type coercion.',
                },
              ].map((feat, idx) => (
                <div key={idx} className="glass-card p-4 rounded-lg space-y-2">
                  <div className="text-2xl">{feat.icon}</div>
                  <h3 className="font-semibold text-sm text-[#dde1ea]">{feat.title}</h3>
                  <p className="text-xs text-[#9ca3af] leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Step-by-Step Flow */}
            <div className="space-y-4 pt-4 border-t border-[#1e2130]">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#6b7280]">// How a match works</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { n: '01', title: 'Queue & Match', desc: 'Pick topic & rank bracket' },
                  { n: '02', title: 'Live Battle', desc: 'Real-time typing radar' },
                  { n: '03', title: 'Steal Rating', desc: 'Instant Elo settlement' },
                ].map((s) => (
                  <div key={s.n} className="p-3 bg-[#0d0f17] border border-[#1e2130] rounded flex items-start gap-3">
                    <span className="font-mono text-sm font-bold text-[#f97316]">{s.n}</span>
                    <div>
                      <p className="font-semibold text-xs text-[#dde1ea]">{s.title}</p>
                      <p className="text-[11px] text-[#6b7280]">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Authentication Panel Right */}
          <div id="auth-box" className="glass-card p-6 rounded-xl border border-[#1e2130] flex flex-col justify-between">
            <div>
              {/* Google Sign In Option */}
              <GoogleAuthButton />

              {/* Header Tabs */}
              {authMode !== 'forgot' && (
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2130] mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAuthMode('otp')}
                      className="font-mono text-xs font-bold transition-colors pb-1"
                      style={{
                        color: authMode === 'otp' ? '#f97316' : '#6b7280',
                        borderBottom: authMode === 'otp' ? '2px solid #f97316' : '2px solid transparent',
                      }}
                    >
                      ⚡ Fast OTP
                    </button>
                    <button
                      onClick={() => setAuthMode('password')}
                      className="font-mono text-xs font-bold transition-colors pb-1"
                      style={{
                        color: authMode === 'password' ? '#dde1ea' : '#6b7280',
                        borderBottom: authMode === 'password' ? '2px solid #dde1ea' : '2px solid transparent',
                      }}
                    >
                      Password
                    </button>
                    <button
                      onClick={() => setAuthMode('register')}
                      className="font-mono text-xs font-bold transition-colors pb-1"
                      style={{
                        color: authMode === 'register' ? '#22d3ee' : '#6b7280',
                        borderBottom: authMode === 'register' ? '2px solid #22d3ee' : '2px solid transparent',
                      }}
                    >
                      Register
                    </button>
                  </div>
                </div>
              )}

              {/* Form Body */}
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

            <div className="mt-8 pt-4 border-t border-[#1e2130] text-center">
              <p className="font-mono text-[10px] text-[#4b5563]">
                Protected by Docker Sandboxing & bcrypt hashing
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
