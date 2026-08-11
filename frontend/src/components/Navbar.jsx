import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const { user, logout, isAuthenticated, loading } = useAuth()

  function goAuth(mode) {
    navigate(`/?auth=${mode}`)
    setTimeout(() => {
      document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{
        background: 'rgba(7,8,12,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #1e2130',
        height: '3.5rem',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">

        {/* Wordmark */}
        <a
          href="/"
          className="font-mono font-bold text-base tracking-tight transition-colors"
          style={{ color:'#dde1ea', letterSpacing:'-0.02em' }}
          onMouseOver={e => e.currentTarget.style.color = '#f97316'}
          onMouseOut={e  => e.currentTarget.style.color = '#dde1ea'}
        >
          algo<span style={{ color:'#f97316' }}>_</span>arena
        </a>

        {/* Center nav */}
        <div className="hidden sm:flex items-center gap-7">
          {[['lobby','/lobby'],['leaderboard','/leaderboard']].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[11px] uppercase tracking-widest transition-colors"
              style={{ color: pathname === href ? '#dde1ea' : '#4b5563', letterSpacing:'0.13em' }}
              onMouseOver={e => e.target.style.color = '#dde1ea'}
              onMouseOut={e  => e.target.style.color = pathname === href ? '#dde1ea' : '#4b5563'}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Auth area — show user info when logged in */}
        {loading ? (
          /* Skeleton while restoring session */
          <div className="w-24 h-7 rounded" style={{ background:'#1e2130' }} />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-4">
            {/* Elo badge */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-mono text-[11px]" style={{ color:'#4b5563' }}>
                {user.username}
              </span>
              <span
                className="font-mono text-[11px] font-bold px-2 py-0.5"
                style={{ background:'rgba(249,115,22,0.1)', color:'#f97316', border:'1px solid rgba(249,115,22,0.25)', borderRadius: 3 }}
              >
                {user.elo_rating ?? 1200}
              </span>
            </div>
            <button
              id="nav-logout"
              onClick={handleLogout}
              className="btn-ghost"
              style={{ padding:'0.35rem 1rem', fontSize: 11 }}
            >
              logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              id="nav-signin"
              onClick={() => goAuth('login')}
              className="btn-ghost"
              style={{ padding:'0.35rem 1rem', fontSize: 11 }}
            >
              sign in
            </button>
            <button
              id="nav-register"
              onClick={() => goAuth('register')}
              className="btn-primary"
              style={{ padding:'0.35rem 1rem', fontSize: 11 }}
            >
              register
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
