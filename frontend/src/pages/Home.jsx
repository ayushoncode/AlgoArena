import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/* ─── tiny reusable pieces ──────────────────────────────────────────────── */

function InputField({ id, label, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-arena-text/80">
        {label}
      </label>
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

function Alert({ message, type = 'error' }) {
  if (!message) return null
  const colors =
    type === 'error'
      ? 'bg-arena-red/10 border-arena-red/30 text-arena-red'
      : 'bg-arena-green/10 border-arena-green/30 text-arena-green'
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${colors} animate-slide-up`}>
      {message}
    </div>
  )
}

/* ─── Login form ────────────────────────────────────────────────────────── */

function LoginForm({ onSwitch }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setError('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    // Day 6: replace with real API call → api.post('/auth/login', form)
    setTimeout(() => {
      setError('Backend not connected yet — wired in Day 6.')
      setLoading(false)
    }, 600)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" noValidate>
      <Alert message={error} />

      <InputField
        id="login-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={set('email')}
      />
      <InputField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={form.password}
        onChange={set('password')}
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none text-arena-muted">
          <input
            id="remember-me"
            type="checkbox"
            className="w-4 h-4 accent-arena-accent rounded"
          />
          Remember me
        </label>
        <button
          type="button"
          className="text-arena-accent hover:text-arena-accent2 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center"
      >
        {loading ? (
          <>
            <Spinner />
            Signing in…
          </>
        ) : (
          'Sign In'
        )}
      </button>

      <p className="text-center text-sm text-arena-muted">
        No account?{' '}
        <button
          type="button"
          id="switch-to-register"
          onClick={onSwitch}
          className="text-arena-accent hover:text-arena-accent2 font-semibold transition-colors"
        >
          Create one free
        </button>
      </p>
    </form>
  )
}

/* ─── Register form ─────────────────────────────────────────────────────── */

function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setError('')
      setSuccess('')
    }
  }

  function validate() {
    if (!form.username || !form.email || !form.password || !form.confirm)
      return 'Please fill in all fields.'
    if (form.username.length < 3 || form.username.length > 30)
      return 'Username must be 3–30 characters.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      return 'Username can only contain letters, numbers, and underscores.'
    if (!/\S+@\S+\.\S+/.test(form.email))
      return 'Please enter a valid email.'
    if (form.password.length < 6)
      return 'Password must be at least 6 characters.'
    if (form.password !== form.confirm)
      return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    // Day 6: replace with real API call → api.post('/auth/register', form)
    setTimeout(() => {
      setError('Backend not connected yet — wired in Day 6.')
      setLoading(false)
    }, 600)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" noValidate>
      <Alert message={error} />
      <Alert message={success} type="success" />

      <InputField
        id="reg-username"
        label="Username"
        placeholder="coolcoder42"
        autoComplete="username"
        value={form.username}
        onChange={set('username')}
      />
      <InputField
        id="reg-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={set('email')}
      />
      <InputField
        id="reg-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="Min. 6 characters"
        value={form.password}
        onChange={set('password')}
      />
      <InputField
        id="reg-confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat password"
        value={form.confirm}
        onChange={set('confirm')}
      />

      <PasswordStrength password={form.password} />

      <button
        id="register-submit"
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center"
      >
        {loading ? (
          <>
            <Spinner />
            Creating account…
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-sm text-arena-muted">
        Already have an account?{' '}
        <button
          type="button"
          id="switch-to-login"
          onClick={onSwitch}
          className="text-arena-accent hover:text-arena-accent2 font-semibold transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}

/* ─── Password strength indicator ───────────────────────────────────────── */

function PasswordStrength({ password }) {
  if (!password) return null

  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length

  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score]
  const colors = [
    'bg-arena-red',
    'bg-arena-red',
    'bg-arena-yellow',
    'bg-arena-yellow',
    'bg-arena-green',
  ]

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score] : 'bg-arena-border'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-arena-muted">
        Strength: <span className="font-medium text-arena-text">{label}</span>
      </p>
    </div>
  )
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

/* ─── Floating stat badge ────────────────────────────────────────────────── */

function StatBadge({ value, label, delay = '0s' }) {
  return (
    <div
      className="bg-arena-card/80 backdrop-blur border border-arena-border rounded-xl px-4 py-3 text-center"
      style={{ animationDelay: delay }}
    >
      <p className="text-xl font-bold text-arena-accent">{value}</p>
      <p className="text-xs text-arena-muted mt-0.5">{label}</p>
    </div>
  )
}

/* ─── Feature pill ───────────────────────────────────────────────────────── */

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-arena-muted">
      <span className="text-arena-accent">{icon}</span>
      {text}
    </div>
  )
}

/* ─── Home page ──────────────────────────────────────────────────────────── */

export default function Home() {
  const [mode, setMode] = useState('login') // 'login' | 'register'

  return (
    <div className="min-h-[calc(100vh-3.5rem)] grid lg:grid-cols-2 items-center gap-8 max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-fade-in">

      {/* ── Left: Hero copy ──────────────────────────────────────────────── */}
      <div className="space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-arena-accent/10 border border-arena-accent/20 rounded-full px-4 py-1.5 text-sm font-medium text-arena-accent">
          <span className="w-2 h-2 rounded-full bg-arena-green animate-pulse" />
          Live 1v1 Competitive Coding
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-arena-text">
            Code.<br />
            Compete.<br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
              }}
            >
              Climb.
            </span>
          </h1>
          <p className="text-lg text-arena-muted max-w-md leading-relaxed">
            Get matched by Elo rating, race against a real opponent on the same DSA problem,
            and watch verdicts stream in live — all in your browser.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-2">
          <Feature icon="⚡" text="Real-time 1v1 battles with live opponent status" />
          <Feature icon="🧠" text="Elo matchmaking — fair opponents every game" />
          <Feature icon="🔒" text="Sandboxed code execution — no escape possible" />
          <Feature icon="🏆" text="Leaderboard, match history, Elo chart" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          <StatBadge value="1v1"    label="Live battles"      delay="0.1s" />
          <StatBadge value="Elo"    label="Fair matchmaking"  delay="0.2s" />
          <StatBadge value="K=32"   label="Rating system"     delay="0.3s" />
        </div>

        {/* Decorative code snippet */}
        <div className="hidden sm:block bg-arena-surface border border-arena-border rounded-xl p-4 font-mono text-xs text-arena-muted max-w-sm">
          <p><span className="text-arena-accent">const</span> arena <span className="text-arena-text">=</span> <span className="text-arena-green">new</span> AlgoArena()</p>
          <p className="mt-1"><span className="text-arena-accent">await</span> arena.<span className="text-arena-yellow">findMatch</span>(<span className="text-arena-text">'arrays'</span>)</p>
          <p className="mt-1 text-arena-green">// ✓ Opponent found — Rating: 1247</p>
          <p className="mt-1 text-arena-green">// ✓ Match started — good luck! 🚀</p>
        </div>
      </div>

      {/* ── Right: Auth card ─────────────────────────────────────────────── */}
      <div className="w-full max-w-md mx-auto">
        {/* Glow ring behind card */}
        <div
          className="absolute -z-10 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #6366f1, transparent)',
            transform: 'translate(-10%, -10%)',
          }}
        />

        <div className="card relative overflow-hidden">
          {/* Gradient top stripe */}
          <div
            className="absolute top-0 inset-x-0 h-1 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)' }}
          />

          {/* Tab switcher */}
          <div className="flex bg-arena-surface rounded-xl p-1 mb-7 mt-2">
            <button
              id="tab-login"
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-arena-accent text-white shadow-lg shadow-indigo-500/25'
                  : 'text-arena-muted hover:text-arena-text'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-arena-accent text-white shadow-lg shadow-indigo-500/25'
                  : 'text-arena-muted hover:text-arena-text'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-arena-text">
              {mode === 'login' ? 'Welcome back' : 'Join AlgoArena'}
            </h2>
            <p className="text-sm text-arena-muted mt-1">
              {mode === 'login'
                ? 'Sign in to resume your ranked battles.'
                : 'Create a free account and start competing.'}
            </p>
          </div>

          {/* Form */}
          {mode === 'login'
            ? <LoginForm    onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')} />
          }

          {/* OAuth divider (placeholder for future) */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-arena-border" />
            <span className="text-xs text-arena-muted">or continue with</span>
            <div className="flex-1 h-px bg-arena-border" />
          </div>

          <button
            type="button"
            id="github-oauth"
            disabled
            className="mt-4 btn-ghost w-full justify-center opacity-50 cursor-not-allowed text-sm"
            title="GitHub OAuth — coming soon"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.021C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub (coming soon)
          </button>
        </div>

        {/* Fine print */}
        <p className="text-center text-xs text-arena-muted mt-4">
          By creating an account you agree to our{' '}
          <span className="text-arena-accent cursor-pointer hover:underline">Terms</span>
          {' '}and{' '}
          <span className="text-arena-accent cursor-pointer hover:underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
