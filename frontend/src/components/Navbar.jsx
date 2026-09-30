import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { UserAvatar, getTier } from '../utils/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, LogOut, User, Home, Trophy } from 'lucide-react'

/* Original Arena Emblem — same as in Home.jsx */
function ArenaEmblem({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AlgoArena logo">
      <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" stroke="#E11D48" strokeWidth="1.5" fill="none" />
      <path d="M20 8L30 14V26L20 32L10 26V14L20 8Z" stroke="#38BDF8" strokeWidth="0.8" fill="rgba(56,189,248,0.06)" />
      <path d="M15 17L12 20L15 23" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 17L28 20L25 23" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18" y1="25" x2="22" y2="15" stroke="#F5B942" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (pathname.startsWith("/match")) return null
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [dropOpen, setDropOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropRef = useRef(null)

  const userTier = user ? getTier(user.elo_rating ?? 1200) : null

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Close mobile menu on nav change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function goAuth(mode) {
    if (pathname !== '/') {
      navigate(`/?auth=${mode}`)
    } else {
      const el = document.getElementById('auth-box') || document.getElementById('auth')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
    setDropOpen(false)
    setMobileOpen(false)
  }

  const NAV_LINKS = [
    { label: 'Lobby', href: '/lobby', icon: <Home size={13} /> },
    { label: 'Leaderboard', href: '/leaderboard', icon: <Trophy size={13} /> },
  ]

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: 'rgba(5, 7, 15, 0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid #1C2842',
          height: '3.5rem',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">

          {/* Logo + wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            style={{ textDecoration: 'none' }}
          >
            <ArenaEmblem size={26} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 700,
                color: '#E2E8F4',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              AlgoArena
            </span>
          </Link>

          {/* Desktop center nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href, icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-1.5 px-4 py-2 transition-all duration-150"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: active ? '#E11D48' : '#8B9ABB',
                    borderBottom: `2px solid ${active ? '#E11D48' : 'transparent'}`,
                  }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.color = '#E2E8F4' }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.color = '#8B9ABB' }}
                >
                  {icon}
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Desktop right — auth */}
          <div className="hidden sm:flex items-center gap-2.5">
            {loading ? (
              <div className="w-24 h-7 rounded" style={{ background: '#1C2842' }} />
            ) : isAuthenticated ? (
              /* User dropdown */
              <div className="relative" ref={dropRef}>
                <button
                  id="nav-user-btn"
                  onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2.5 px-3 py-1.5 transition-all"
                  style={{
                    background: dropOpen ? 'rgba(225,29,72,0.08)' : 'transparent',
                    border: `1px solid ${dropOpen ? '#E11D48' : '#1C2842'}`,
                    borderRadius: 0,
                  }}
                  onMouseOver={e => { if (!dropOpen) e.currentTarget.style.borderColor = '#243356' }}
                  onMouseOut={e => { if (!dropOpen) e.currentTarget.style.borderColor = '#1C2842' }}
                >
                  <UserAvatar username={user.username} seed={user.avatar_seed} style={user.avatar_style} elo={user.elo_rating} size={22} isMe={true} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#E2E8F4' }}>{user.username}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, padding: '1px 6px', background: userTier?.bg, color: userTier?.col, border: `1px solid ${userTier?.col}40`, borderRadius: 0 }}>
                    {user.elo_rating ?? 1200}
                  </span>
                  <ChevronDown size={12} style={{ color: '#4A5878', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1.5 w-52"
                      style={{ background: '#0B1120', border: '1px solid #1C2842', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 100 }}
                    >
                      {/* User header */}
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1C2842' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#E2E8F4' }}>{user.username}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 2, color: '#4A5878' }}>
                          {user.elo_rating ?? 1200} elo · {user.wins ?? 0}W {user.losses ?? 0}L
                        </p>
                      </div>

                      {[
                        { id: 'dd-profile', label: 'Profile', icon: <User size={11} />, path: '/profile' },
                        { id: 'dd-lobby', label: 'Lobby', icon: <Home size={11} />, path: '/lobby' },
                      ].map(item => (
                        <button
                          key={item.id}
                          id={item.id}
                          onClick={() => { navigate(item.path); setDropOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#1C2842'; e.currentTarget.style.color = '#E2E8F4' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B9ABB' }}
                        >
                          <span style={{ color: '#4A5878' }}>{item.icon}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'inherit' }}>{item.label}</span>
                        </button>
                      ))}

                      <div style={{ borderTop: '1px solid #1C2842' }}>
                        <button
                          id="nav-logout"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B9ABB' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.08)'; e.currentTarget.style.color = '#E11D48' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B9ABB' }}
                        >
                          <LogOut size={11} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-signin"
                  onClick={() => goAuth('login')}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    padding: '6px 16px', color: '#8B9ABB',
                    background: 'transparent', border: '1px solid #1C2842', borderRadius: 0, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#E11D48'; e.currentTarget.style.color = '#E11D48' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#1C2842'; e.currentTarget.style.color = '#8B9ABB' }}
                >
                  Sign In
                </button>
                <button
                  id="nav-register"
                  onClick={() => goAuth('register')}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                    padding: '6px 18px', letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: '#fff', background: '#E11D48', border: 'none',
                    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#F43F5E' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#E11D48' }}
                >
                  Join the Roster
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{ color: '#8B9ABB', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 inset-x-0 z-40 sm:hidden"
            style={{ background: 'rgba(5,7,15,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1C2842' }}
          >
            <div className="px-5 py-5 space-y-1">
              {NAV_LINKS.map(({ label, href, icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2 py-3 px-4 w-full transition-colors"
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: pathname === href ? '#E11D48' : '#8B9ABB', textDecoration: 'none',
                    borderBottom: '1px solid #1C2842',
                  }}
                >
                  {icon} {label}
                </Link>
              ))}

              {!loading && !isAuthenticated && (
                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={() => { goAuth('login'); setMobileOpen(false) }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, padding: '12px', color: '#8B9ABB', background: 'transparent', border: '1px solid #1C2842', cursor: 'pointer', width: '100%' }}>
                    Sign In
                  </button>
                  <button onClick={() => { goAuth('register'); setMobileOpen(false) }}
                    style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px', color: '#fff', background: '#E11D48', border: 'none', cursor: 'pointer', width: '100%' }}>
                    Join the Roster
                  </button>
                </div>
              )}

              {!loading && isAuthenticated && (
                <div className="space-y-1 pt-2">
                  <button onClick={() => { navigate('/profile'); setMobileOpen(false) }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '12px 16px', color: '#8B9ABB', background: 'transparent', border: '1px solid #1C2842', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    Profile
                  </button>
                  <button onClick={handleLogout}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '12px 16px', color: '#E11D48', background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.2)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
