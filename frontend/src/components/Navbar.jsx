import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useRef, useEffect } from 'react'

export default function Navbar() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function goAuth(mode) {
    navigate(`/?auth=${mode}`)
    setTimeout(() => {
      document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  function handleLogout() {
    logout()
    navigate('/')
    setOpen(false)
  }

  const NAV_LINKS = [
    ['lobby',       '/lobby'],
    ['leaderboard', '/leaderboard'],
  ]

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50"
      style={{ background:'rgba(7,8,12,0.92)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1e2130', height:'3.5rem' }}
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
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[11px] uppercase tracking-widest transition-colors"
              style={{ color: pathname === href ? '#f97316' : '#4b5563', letterSpacing:'0.13em' }}
              onMouseOver={e => e.target.style.color = '#dde1ea'}
              onMouseOut={e  => e.target.style.color = pathname === href ? '#f97316' : '#4b5563'}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right — auth */}
        {loading ? (
          <div className="w-24 h-7 rounded" style={{ background:'#1e2130' }} />
        ) : isAuthenticated ? (

          /* ── User dropdown ─────────────────────────────── */
          <div className="relative" ref={dropRef}>
            <button
              id="nav-user-btn"
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2.5 px-3 py-1.5 transition-all"
              style={{
                background: open ? 'rgba(249,115,22,0.08)' : 'transparent',
                border: `1px solid ${open ? 'rgba(249,115,22,0.3)' : '#1e2130'}`,
                borderRadius: 4,
              }}
              onMouseOver={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)' }}
              onMouseOut={e  => { if (!open) e.currentTarget.style.borderColor = '#1e2130' }}
            >
              {/* Avatar initial */}
              <span
                className="font-mono font-bold text-[11px] flex items-center justify-center shrink-0"
                style={{ width:22, height:22, background:'rgba(249,115,22,0.15)', border:'1px solid rgba(249,115,22,0.35)', borderRadius:3, color:'#f97316' }}
              >
                {(user.username?.[0] ?? 'A').toUpperCase()}
              </span>

              <span className="font-mono text-[11px]" style={{ color:'#dde1ea' }}>
                {user.username}
              </span>

              <span
                className="font-mono text-[10px] font-bold px-1.5 py-0.5"
                style={{ background:'rgba(249,115,22,0.1)', color:'#f97316', border:'1px solid rgba(249,115,22,0.2)', borderRadius:3 }}
              >
                {user.elo_rating ?? 1200}
              </span>

              {/* Chevron */}
              <svg
                className="w-3 h-3 transition-transform duration-150"
                style={{ color:'#4b5563', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
              <div
                className="absolute right-0 mt-2 w-48"
                style={{ background:'#0b0d14', border:'1px solid #1e2130', borderRadius:4, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:100 }}
              >
                {/* User info header */}
                <div className="px-4 py-3" style={{ borderBottom:'1px solid #1e2130' }}>
                  <p className="font-mono text-[11px] font-bold" style={{ color:'#dde1ea' }}>{user.username}</p>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color:'#4b5563' }}>
                    {user.elo_rating ?? 1200} elo · {user.wins ?? 0}W {user.losses ?? 0}L
                  </p>
                </div>

                {/* Menu items */}
                {[
                  { id:'dd-profile', label:'profile', icon:'◈', path:'/profile' },
                  { id:'dd-lobby',   label:'lobby',   icon:'◉', path:'/lobby'   },
                ].map(item => (
                  <button
                    key={item.id}
                    id={item.id}
                    onClick={() => { navigate(item.path); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color:'#6b7280' }}
                    onMouseOver={e => e.currentTarget.style.background = '#1e2130'}
                    onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="font-mono text-[11px]" style={{ color:'#374151' }}>{item.icon}</span>
                    <span className="font-mono text-[11px]">{item.label}</span>
                  </button>
                ))}

                <div style={{ borderTop:'1px solid #1e2130' }}>
                  <button
                    id="nav-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ color:'#6b7280' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#f43f5e' }}
                    onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
                  >
                    <span className="font-mono text-[11px]" style={{ color:'#374151' }}>→</span>
                    <span className="font-mono text-[11px]">logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        ) : (
          <div className="flex items-center gap-2.5">
            <button id="nav-signin"   onClick={() => goAuth('login')}    className="btn-ghost"   style={{ padding:'0.35rem 1rem', fontSize:11 }}>sign in</button>
            <button id="nav-register" onClick={() => goAuth('register')} className="btn-primary" style={{ padding:'0.35rem 1rem', fontSize:11 }}>register</button>
          </div>
        )}
      </div>
    </nav>
  )
}
