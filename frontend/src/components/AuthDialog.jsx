import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { ArenaEmblem } from './ArenaLogo'
import { X, Check } from 'lucide-react'

export function OtpDigitsInput({ length = 6, value, onChange }) {
  const inputs = useRef([])
  function handleChange(e, index) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    const arr = value.split('')
    arr[index] = val || ''
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
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
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

export function Field({ id, label, type = 'text', placeholder, value, onChange, autoComplete, rightElement }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sub, #a2a9b8)' }}>{label}</label>
        {rightElement}
      </div>
      <input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={onChange} className="input-field" />
    </div>
  )
}

export function PasswordField({ id, label, placeholder, value, onChange, autoComplete, rightLabel, onRightClick }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sub, #a2a9b8)' }}>{label}</label>
        {rightLabel && <button type="button" onClick={onRightClick} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'var(--feat, #e2ebf5)' }} className="hover:underline">{rightLabel}</button>}
      </div>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={onChange} className="input-field pr-8" />
        <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-xs select-none pr-2"
          style={{ color: 'var(--sub, #a2a9b8)', fontFamily: 'var(--font-mono, monospace)' }}>
          {show ? 'HIDE' : 'SHOW'}
        </button>
      </div>
    </div>
  )
}

export function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score++
  const levels = [
    { label: 'Too short', color: '#ff8a8a' },
    { label: 'Weak', color: '#ff8a8a' },
    { label: 'Fair', color: '#f5b942' },
    { label: 'Good', color: '#38bdf8' },
    { label: 'Strong', color: '#10b981' },
  ]
  const cur = levels[score] || levels[0]
  return (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 rounded-full transition-all duration-300" style={{ background: i <= score ? cur.color : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      <p className="text-right" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: cur.color }}>{cur.label}</p>
    </div>
  )
}

export function AuthErr({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up flex items-center gap-1.5 p-2 rounded" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#ff8a8a', background: 'rgba(255,138,138,0.1)', border: '1px solid rgba(255,138,138,0.25)' }}>
      <X size={12} /> {msg}
    </p>
  )
}

export function AuthOk({ msg }) {
  if (!msg) return null
  return (
    <p className="slide-up flex items-center gap-1.5 p-2 rounded" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
      <Check size={12} /> {msg}
    </p>
  )
}

export function Spinner() {
  return <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" /></svg>
}

export function OtpLoginForm({ onSwitchPassword }) {
  const { sendOtp, loginWithOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [cooldown, setCooldown] = useState(0)

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
          <div className="text-center pt-1">
            <button type="button" onClick={onSwitchPassword} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }} className="hover:text-white transition-colors">
              Sign in with password instead
            </button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center space-y-1">
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>Code sent to</p>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: 'var(--feat, #e2ebf5)' }}>{email}</p>
          </div>
          {devOtp && (
            <div className="p-2 rounded text-center" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: '#38BDF8' }}>Dev Code: </span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.2em' }}>{devOtp}</span>
            </div>
          )}
          <div className="py-2"><OtpDigitsInput length={6} value={otp} onChange={setOtp} /></div>
          <button id="verify-otp-submit" type="submit" disabled={busy || otp.length < 6} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Verifying…</> : 'Enter the Arena'}
          </button>
          <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>
            <button type="button" onClick={() => setStep(1)} className="hover:text-white transition-colors">← Change email</button>
            <button type="button" disabled={cooldown > 0 || busy} onClick={handleSendOtp} className="hover:text-white transition-colors disabled:opacity-50">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export function PasswordLoginForm({ onSwitchOtp, onSwitchRegister, onSwitchForgot }) {
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
      <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>
        <button type="button" onClick={onSwitchOtp} style={{ color: 'var(--feat, #e2ebf5)' }} className="hover:underline">Fast OTP Sign In</button>
        <button type="button" onClick={onSwitchRegister} style={{ color: 'var(--sub, #a2a9b8)' }} className="hover:text-white">Register →</button>
      </div>
    </form>
  )
}

export function ForgotPasswordForm({ onBackToLogin }) {
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
            <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink, #fff)' }}>Reset Your Password</h3>
            <p style={{ fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>Enter your registered email and we'll send a 6-digit reset code.</p>
          </div>
          <Field id="forgot-email" label="Account Email" type="email" placeholder="you@domain.com" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} />
          <button id="forgot-submit" type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Sending Code…</> : 'Send Password Reset Code'}
          </button>
          <div className="text-center pt-1">
            <button type="button" onClick={onBackToLogin} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }} className="hover:text-white transition-colors">← Back to Sign In</button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div className="text-center space-y-0.5">
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>Enter code sent to</p>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: 'var(--feat, #e2ebf5)' }}>{email}</p>
          </div>
          {devOtp && (
            <div className="p-2 rounded text-center" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: '#38BDF8' }}>Dev Code: </span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.2em' }}>{devOtp}</span>
            </div>
          )}
          <div className="py-1"><OtpDigitsInput length={6} value={otp} onChange={setOtp} /></div>
          <PasswordField id="new-pw" label="New Password" placeholder="min. 6 characters" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <PasswordStrength password={newPassword} />
          <PasswordField id="conf-new-pw" label="Confirm New Password" placeholder="repeat new password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <button id="reset-pw-submit" type="submit" disabled={busy || otp.length < 6 || newPassword.length < 6} className="btn-primary w-full py-3 mt-2">
            {busy ? <><Spinner /> Updating Password…</> : 'Update Password & Sign In'}
          </button>
          <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>
            <button type="button" onClick={() => setStep(1)} className="hover:text-white transition-colors">← Change email</button>
            <button type="button" disabled={cooldown > 0 || busy} onClick={handleSendResetCode} className="hover:text-white transition-colors disabled:opacity-50">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export function RegisterForm({ onSwitchLogin }) {
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
          <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, textAlign: 'center', color: 'var(--sub, #a2a9b8)' }}>
            Already have an account?{' '}
            <button type="button" onClick={onSwitchLogin} style={{ color: 'var(--feat, #e2ebf5)' }} className="hover:underline">Sign In →</button>
          </p>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-center space-y-1">
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>Enter the 6-digit code sent to</p>
            <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: '#10b981' }}>{form.email}</p>
          </div>
          {devOtp && (
            <div className="p-2 rounded text-center" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: '#10b981' }}>Dev Code: </span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.2em' }}>{devOtp}</span>
            </div>
          )}
          <div className="py-1"><OtpDigitsInput length={6} value={otp} onChange={setOtp} /></div>
          <button id="register-verify-submit" type="submit" disabled={busy || otp.length < 6} className="btn-primary w-full py-3">
            {busy ? <><Spinner /> Creating Account…</> : 'Confirm & Enter Arena'}
          </button>
          <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--sub, #a2a9b8)' }}>
            <button type="button" onClick={() => { setStep(1); setSuccess(''); setOtp(''); setDevOtp(null) }} className="hover:text-white transition-colors">← Back</button>
            <button type="button" disabled={cooldown > 0 || busy} onClick={handleSendOtp} className="hover:text-white transition-colors disabled:opacity-50">
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export function GoogleAuthButton() {
  const { loginWithFirebase } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

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
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(196, 214, 232, 0.25)',
          borderRadius: 8,
          color: 'var(--ink, #fff)',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
          <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
        </svg>
        <span>{busy ? 'Signing in with Google…' : 'Continue with Google'}</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'rgba(196, 214, 232, 0.15)' }} />
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, color: 'var(--sub, #a2a9b8)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>or sign in with</span>
        <div className="h-px flex-1" style={{ background: 'rgba(196, 214, 232, 0.15)' }} />
      </div>
    </div>
  )
}

export default function AuthDialog({ isOpen, onClose, initialMode = 'otp', openerRef }) {
  const [mode, setMode] = useState(initialMode)
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)
  const openerElementRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'otp')
      openerElementRef.current = openerRef?.current || document.activeElement
    }
  }, [isOpen, initialMode, openerRef])

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Set initial focus into dialog
    const timer = setTimeout(() => {
      if (!dialogRef.current) return
      const firstInput = dialogRef.current.querySelector('input:not([disabled])')
      if (firstInput) {
        firstInput.focus()
      } else {
        closeBtnRef.current?.focus()
      }
    }, 40)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
      if (openerElementRef.current && typeof openerElementRef.current.focus === 'function') {
        openerElementRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="nx-auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="nx-auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nx-auth-header">
          <div>
            <h2 id="auth-dialog-title" className="nx-auth-title">Enter The Arena</h2>
            <p className="nx-auth-subtitle">Season 1 · Live 1v1 Duels</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="nx-auth-close"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <GoogleAuthButton />

        {mode !== 'forgot' && (
          <div className="nx-auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'otp'}
              onClick={() => setMode('otp')}
              className={`nx-auth-tab ${mode === 'otp' ? 'is-active' : ''}`}
            >
              Fast OTP
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'password'}
              onClick={() => setMode('password')}
              className={`nx-auth-tab ${mode === 'password' ? 'is-active' : ''}`}
            >
              Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => setMode('register')}
              className={`nx-auth-tab ${mode === 'register' ? 'is-active' : ''}`}
            >
              Register
            </button>
          </div>
        )}

        <div className="nx-auth-body">
          {mode === 'otp' && <OtpLoginForm onSwitchPassword={() => setMode('password')} />}
          {mode === 'password' && (
            <PasswordLoginForm
              onSwitchOtp={() => setMode('otp')}
              onSwitchRegister={() => setMode('register')}
              onSwitchForgot={() => setMode('forgot')}
            />
          )}
          {mode === 'register' && <RegisterForm onSwitchLogin={() => setMode('password')} />}
          {mode === 'forgot' && <ForgotPasswordForm onBackToLogin={() => setMode('password')} />}
        </div>

        <div className="nx-auth-footer">
          <span>256-bit SSL · Sandboxed Docker · FIDE-grade Elo</span>
        </div>
      </div>
    </div>
  )
}

