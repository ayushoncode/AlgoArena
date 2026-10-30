/**
 * src/pages/AuthPage.jsx
 *
 * Dedicated minimal dark Auth page for AlgoArena:
 *  - Sign in ("Welcome back.") & Sign up ("Join the arena.")
 *  - High-contrast white CTA button ("Authenticate" / "Create Account")
 *  - Segmented option cards for Preferred Language (C++, Python, Java, JavaScript)
 *  - Masked password with eye show/hide toggle
 *  - 6-digit OTP verification with auto-advance and paste
 *  - Google Authentication support
 *  - Sora Variable typography, navy tonal surfaces, precise hairlines
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { ArenaLogo } from '../components/ArenaLogo'
import './AuthPage.css'

const LANGUAGES = [
  { id: 'cpp', label: 'C++', sub: 'STL' },
  { id: 'python', label: 'Python', sub: 'PY3' },
  { id: 'java', label: 'Java', sub: 'JDK' },
  { id: 'javascript', label: 'JavaScript', sub: 'NODE' },
]

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function GoogleGIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
      <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z" />
    </svg>
  )
}

function PasswordStrengthMeter({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score++

  const levels = [
    { label: 'Too short', color: '#ef4444' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#38bdf8' },
    { label: 'Strong', color: '#10b981' },
  ]
  const current = levels[score] || levels[0]

  return (
    <div className="auth-strength-wrap" aria-live="polite">
      <div className="auth-strength-bars">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="auth-strength-bar"
            style={{
              backgroundColor: step <= score ? current.color : 'rgba(255, 255, 255, 0.1)',
            }}
          />
        ))}
      </div>
      <span className="auth-strength-label" style={{ color: current.color }}>
        {current.label}
      </span>
    </div>
  )
}

export default function AuthPage({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, loginWithFirebase } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/lobby', { replace: true })
    }
  }, [user, navigate])

  // Primary mode: 'login' | 'register' | 'verify_reg_otp' | 'otp_login' | 'verify_login_otp' | 'forgot' | 'reset'
  const [mode, setMode] = useState(initialMode)

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [regHandle, setRegHandle] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regLang, setRegLang] = useState('cpp')

  const [otpEmail, setOtpEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [devOtp, setDevOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const digitRefs = useRef([])

  // Synchronize route/prop changes
  useEffect(() => {
    if (location.pathname === '/signup' || location.pathname === '/register') {
      setMode('register')
    } else if (location.pathname === '/login') {
      setMode('login')
    } else {
      setMode(initialMode || 'login')
    }
    setError('')
    setSuccessMsg('')
  }, [location.pathname, initialMode])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleReturn = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }, [navigate])

  // ── 1. Password Login ─────────────────────────────────────────────────────
  async function handlePasswordLogin(e) {
    e.preventDefault()
    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Please provide your email/username and password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/login', {
        email: loginIdentifier.trim(),
        password: loginPassword,
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── 2. Send Registration OTP ──────────────────────────────────────────────
  async function handleSendRegistrationOtp(e) {
    e.preventDefault()
    if (!regHandle.trim()) {
      setError('Please choose a coder handle (username).')
      return
    }
    if (!regEmail.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/send-registration-otp', {
        username: regHandle.trim(),
        email: regEmail.trim(),
        password: regPassword,
      })
      if (data.devOtp) setDevOtp(data.devOtp)
      setOtpEmail(regEmail.trim())
      setOtpDigits(['', '', '', '', '', ''])
      setResendCooldown(45)
      setMode('verify_reg_otp')
      setTimeout(() => digitRefs.current[0]?.focus(), 80)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. That username or email may already be taken.')
    } finally {
      setLoading(false)
    }
  }

  // ── 3. Verify Registration OTP ────────────────────────────────────────────
  async function handleVerifyRegistrationOtp(e) {
    e.preventDefault()
    const code = otpDigits.join('').trim()
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/register', {
        email: otpEmail,
        otp: code,
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // ── 4. Resend Registration OTP ────────────────────────────────────────────
  async function handleResendRegistrationOtp() {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/send-registration-otp', {
        username: regHandle.trim(),
        email: otpEmail,
        password: regPassword,
      })
      if (data.devOtp) setDevOtp(data.devOtp)
      setResendCooldown(45)
      setSuccessMsg('A new verification code has been dispatched.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.')
    } finally {
      setLoading(false)
    }
  }

  // ── 5. Passwordless OTP Login (Send Code) ─────────────────────────────────
  async function handleSendLoginOtp(e) {
    e.preventDefault()
    if (!otpEmail.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/send-otp', { email: otpEmail.trim() })
      if (data.devOtp) setDevOtp(data.devOtp)
      setOtpDigits(['', '', '', '', '', ''])
      setResendCooldown(45)
      setMode('verify_login_otp')
      setTimeout(() => digitRefs.current[0]?.focus(), 80)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send one-time code.')
    } finally {
      setLoading(false)
    }
  }

  // ── 6. Verify Passwordless OTP Login ──────────────────────────────────────
  async function handleVerifyLoginOtp(e) {
    e.preventDefault()
    const code = otpDigits.join('').trim()
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/verify-otp', {
        email: otpEmail.trim(),
        otp: code,
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  // ── 7. Forgot Password (Send Reset Code) ──────────────────────────────────
  async function handleSendForgotOtp(e) {
    e.preventDefault()
    if (!resetEmail.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: resetEmail.trim() })
      if (data.devOtp) setDevOtp(data.devOtp)
      setOtpDigits(['', '', '', '', '', ''])
      setMode('reset')
      setSuccessMsg('Reset code sent. Please check your inbox.')
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with that email address.')
    } finally {
      setLoading(false)
    }
  }

  // ── 8. Reset Password (Save New Password) ─────────────────────────────────
  async function handleResetPassword(e) {
    e.preventDefault()
    const code = otpDigits.join('').trim()
    if (code.length < 6) {
      setError('Please enter the 6-digit reset code.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/reset-password', {
        email: resetEmail.trim(),
        otp: code,
        newPassword,
      })
      // Automatically log in with new password
      const { data } = await api.post('/api/auth/login', {
        email: resetEmail.trim(),
        password: newPassword,
      })
      login(data)
      navigate('/lobby')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The code may be invalid.')
    } finally {
      setLoading(false)
    }
  }

  // ── 9. Google Sign-In ─────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      const { auth, googleProvider, signInWithPopup } = await import('../utils/firebase')
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const rawSuggest = (result.user.displayName || result.user.email?.split('@')[0] || 'coder')
        .replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 20)
      const data = await loginWithFirebase({ idToken, username: rawSuggest })
      login(data)
      navigate('/lobby')
    } catch (e) {
      if (
        e.code === 'auth/api-key-not-valid' ||
        e.code === 'auth/invalid-api-key' ||
        e.code === 'auth/configuration-not-found'
      ) {
        setError('Google sign-in is not configured on this dev environment. Please authenticate with email.')
      } else if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message || 'Google sign-in could not be completed.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── OTP Digit Input Handlers ──────────────────────────────────────────────
  function handleDigitChange(e, index) {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1)
    const next = [...otpDigits]
    next[index] = char
    setOtpDigits(next)
    if (char && index < 5) {
      digitRefs.current[index + 1]?.focus()
    }
  }

  function handleDigitKeyDown(e, index) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!text) return
    const next = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      next[i] = text[i] || ''
    }
    setOtpDigits(next)
    digitRefs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <div className="auth-page-root">
      {/* ── TOP HEADER BAR ───────────────────────────────────────── */}
      <header className="auth-page-header">
        <button
          type="button"
          onClick={handleReturn}
          className="auth-return-btn"
          aria-label="Return to previous page"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="13" y1="8" x2="3" y2="8" />
            <polyline points="7 4 3 8 7 12" />
          </svg>
          <span>Return</span>
        </button>

        <Link to="/" className="auth-logo-link" aria-label="AlgoArena Home">
          <ArenaLogo size="sm" animate={false} />
        </Link>
      </header>

      {/* ── CENTER AUTH MAIN ─────────────────────────────────────── */}
      <main className="auth-page-main">
        {/* ── VIEW 1: SIGN IN (PASSWORD) ─────────────────────────── */}
        {mode === 'login' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Welcome back.</h1>
              <p className="auth-subtitle">Sign in to access the arena.</p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}
            {successMsg && <div role="status" className="auth-alert-success">{successMsg}</div>}

            <form onSubmit={handlePasswordLogin} noValidate>
              <div className="auth-field">
                <label htmlFor="login-identity" className="auth-label">
                  Email or Username
                </label>
                <input
                  id="login-identity"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="you@example.com or handle"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="auth-input"
                  spellCheck={false}
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password" className="auth-label">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError('') }}
                    className="auth-link-subtle"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-wrap">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="auth-input auth-input-pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((s) => !s)}
                    className="auth-eye-btn"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Authenticating...' : 'Authenticate'}</span>
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">Or continue with</span>
              <span className="auth-divider-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="auth-btn-social"
            >
              <GoogleGIcon />
              <span>Continue with Google</span>
            </button>

            <div className="auth-alt-row">
              <button
                type="button"
                onClick={() => { setMode('otp_login'); setError('') }}
                className="auth-link-alt"
              >
                Prefer one-time code? Sign in with email OTP
              </button>
            </div>

            <div className="auth-switch-footer">
              <span>Don't have an account? </span>
              <button
                type="button"
                onClick={() => { setMode('register'); setError('') }}
                className="auth-switch-link"
              >
                Join the arena.
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 2: SIGN UP / REGISTER ─────────────────────────── */}
        {mode === 'register' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Join the arena.</h1>
              <p className="auth-subtitle">Clash head-to-head in real-time algorithm duels.</p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}

            <form onSubmit={handleSendRegistrationOtp} noValidate>
              <div className="auth-field">
                <label htmlFor="reg-handle" className="auth-label">
                  Coder Handle
                </label>
                <input
                  id="reg-handle"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="e.g. byte_master"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  className="auth-input"
                  spellCheck={false}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email" className="auth-label">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="auth-input"
                  spellCheck={false}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-password" className="auth-label">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="auth-input auth-input-pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((s) => !s)}
                    className="auth-eye-btn"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <PasswordStrengthMeter password={regPassword} />
              </div>

              {/* Segmented Choice: Preferred Language (Matches YEAR OF STUDY in reference) */}
              <div className="auth-field">
                <label className="auth-label">
                  Preferred Language
                </label>
                <div className="auth-segmented-grid" role="radiogroup" aria-label="Preferred Language">
                  {LANGUAGES.map((lang) => {
                    const isSelected = regLang === lang.id
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setRegLang(lang.id)}
                        className={`auth-segmented-card ${isSelected ? 'is-selected' : ''}`}
                      >
                        <span className="auth-segmented-title">{lang.label}</span>
                        <span className="auth-segmented-chip">{lang.sub}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Sending verification code...' : 'Create Account'}</span>
              </button>
            </form>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">Or continue with</span>
              <span className="auth-divider-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="auth-btn-social"
            >
              <GoogleGIcon />
              <span>Continue with Google</span>
            </button>

            <div className="auth-switch-footer">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="auth-switch-link"
              >
                Sign in.
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 3: VERIFY REGISTRATION OTP ────────────────────── */}
        {mode === 'verify_reg_otp' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Verify your email.</h1>
              <p className="auth-subtitle">
                Enter the 6-digit verification code sent to <strong style={{ color: '#ffffff' }}>{otpEmail}</strong>
              </p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}
            {successMsg && <div role="status" className="auth-alert-success">{successMsg}</div>}

            {devOtp && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOtpDigits(devOtp.split(''))}
                onKeyDown={(e) => { if (e.key === 'Enter') setOtpDigits(devOtp.split('')) }}
                className="auth-dev-otp-pill"
                title="Click to auto-fill dev code"
              >
                <span>Dev mode code: <strong>{devOtp}</strong> (Click to auto-fill)</span>
              </div>
            )}

            <form onSubmit={handleVerifyRegistrationOtp} noValidate>
              <div className="auth-otp-row">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { digitRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(e, idx)}
                    onKeyDown={(e) => handleDigitKeyDown(e, idx)}
                    onPaste={handleDigitPaste}
                    className="auth-otp-digit"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Verifying...' : 'Confirm & Enter Arena'}</span>
              </button>

              <div className="auth-resend-row">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResendRegistrationOtp}
                  className="auth-link-alt"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                </button>
              </div>

              <div className="auth-switch-footer">
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError('') }}
                  className="auth-link-subtle"
                >
                  ← Edit registration details
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── VIEW 4: PASSWORDLESS OTP SIGN IN (EMAIL) ─────────────── */}
        {mode === 'otp_login' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Passwordless sign in.</h1>
              <p className="auth-subtitle">We will send a 6-digit access code to your email.</p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}

            <form onSubmit={handleSendLoginOtp} noValidate>
              <div className="auth-field">
                <label htmlFor="otp-login-email" className="auth-label">
                  Email Address
                </label>
                <input
                  id="otp-login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="auth-input"
                  spellCheck={false}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Sending code...' : 'Send Access Code'}</span>
              </button>
            </form>

            <div className="auth-alt-row">
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="auth-link-alt"
              >
                ← Back to password sign in
              </button>
            </div>

            <div className="auth-switch-footer">
              <span>Don't have an account? </span>
              <button
                type="button"
                onClick={() => { setMode('register'); setError('') }}
                className="auth-switch-link"
              >
                Join the arena.
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 5: VERIFY LOGIN OTP ───────────────────────────── */}
        {mode === 'verify_login_otp' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Check your inbox.</h1>
              <p className="auth-subtitle">
                Enter the 6-digit access code sent to <strong style={{ color: '#ffffff' }}>{otpEmail}</strong>
              </p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}

            {devOtp && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOtpDigits(devOtp.split(''))}
                onKeyDown={(e) => { if (e.key === 'Enter') setOtpDigits(devOtp.split('')) }}
                className="auth-dev-otp-pill"
                title="Click to auto-fill dev code"
              >
                <span>Dev mode code: <strong>{devOtp}</strong> (Click to auto-fill)</span>
              </div>
            )}

            <form onSubmit={handleVerifyLoginOtp} noValidate>
              <div className="auth-otp-row">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { digitRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(e, idx)}
                    onKeyDown={(e) => handleDigitKeyDown(e, idx)}
                    onPaste={handleDigitPaste}
                    className="auth-otp-digit"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Authenticating...' : 'Authenticate'}</span>
              </button>

              <div className="auth-resend-row">
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleSendLoginOtp}
                  className="auth-link-alt"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend access code'}
                </button>
              </div>

              <div className="auth-switch-footer">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError('') }}
                  className="auth-link-subtle"
                >
                  ← Back to password sign in
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── VIEW 6: FORGOT PASSWORD ─────────────────────────────── */}
        {mode === 'forgot' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Reset password.</h1>
              <p className="auth-subtitle">Enter your account email to receive a password reset code.</p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}

            <form onSubmit={handleSendForgotOtp} noValidate>
              <div className="auth-field">
                <label htmlFor="reset-email" className="auth-label">
                  Account Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="auth-input"
                  spellCheck={false}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Sending code...' : 'Send Reset Code'}</span>
              </button>
            </form>

            <div className="auth-switch-footer">
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="auth-link-subtle"
              >
                ← Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ── VIEW 7: ENTER RESET CODE & NEW PASSWORD ────────────── */}
        {mode === 'reset' && (
          <div className="auth-card">
            <div className="auth-card-hero">
              <h1 className="auth-title">Set new password.</h1>
              <p className="auth-subtitle">
                Enter the code sent to <strong style={{ color: '#ffffff' }}>{resetEmail}</strong> and choose a new password.
              </p>
            </div>

            {error && <div role="alert" className="auth-alert-error">{error}</div>}
            {successMsg && <div role="status" className="auth-alert-success">{successMsg}</div>}

            {devOtp && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOtpDigits(devOtp.split(''))}
                onKeyDown={(e) => { if (e.key === 'Enter') setOtpDigits(devOtp.split('')) }}
                className="auth-dev-otp-pill"
                title="Click to auto-fill dev code"
              >
                <span>Dev mode code: <strong>{devOtp}</strong> (Click to auto-fill)</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} noValidate>
              <div className="auth-field">
                <label className="auth-label">
                  Verification Code
                </label>
                <div className="auth-otp-row">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { digitRefs.current[idx] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e, idx)}
                      onKeyDown={(e) => handleDigitKeyDown(e, idx)}
                      onPaste={handleDigitPaste}
                      className="auth-otp-digit"
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reset-new-password" className="auth-label">
                  New Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="reset-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="auth-input auth-input-pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    className="auth-eye-btn"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length < 6}
                className="auth-btn-primary"
              >
                <span>{loading ? 'Saving...' : 'Save New Password & Sign In'}</span>
              </button>
            </form>

            <div className="auth-switch-footer">
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="auth-link-subtle"
              >
                ← Back to sign in
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
