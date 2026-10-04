import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { UserAvatar, getTier } from '../utils/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, LogOut, User, Home, Trophy, Users, FileText, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

import { ArenaLogo } from './ArenaLogo'

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  if (pathname.startsWith("/match")) return null
  const { user, logout, isAuthenticated, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
    ...(isAuthenticated ? [{ label: 'Intel Reports', href: '/experiences', icon: <FileText size={13} /> }] : []),
    ...(!isAuthenticated ? [{ label: 'Who We Are', href: '/who-we-are', icon: <Users size={13} /> }] : []),
  ]

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: 'var(--c-nav-bg)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--c-border)',
          height: '3.5rem',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">

          {/* Logo + wordmark */}
          <Link
            to="/"
            className="flex items-center transition-opacity hover:opacity-90"
            style={{ textDecoration: 'none' }}
          >
            <ArenaLogo size={26} />
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
                    color: active ? 'var(--c-red)' : 'var(--c-text-dim)',
                    borderBottom: `2px solid ${active ? 'var(--c-red)' : 'transparent'}`,
                  }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.color = 'var(--c-text)' }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.color = 'var(--c-text-dim)' }}
                >
                  {icon}
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Desktop right — auth */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 transition-colors flex items-center justify-center rounded-md"
              style={{ color: 'var(--c-text-dim)' }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--c-text)' }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--c-text-dim)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {loading ? (
              <div className="w-24 h-7 rounded" style={{ background: 'var(--c-border)' }} />
            ) : isAuthenticated ? (
              /* User dropdown */
              <div className="relative" ref={dropRef}>
                <button
                  id="nav-user-btn"
                  onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2.5 px-3 py-1.5 transition-all"
                  style={{
                    background: dropOpen ? 'var(--c-red-glow)' : 'transparent',
                    border: `1px solid ${dropOpen ? 'var(--c-red)' : 'var(--c-border)'}`,
                    borderRadius: 0,
                  }}
                  onMouseOver={e => { if (!dropOpen) e.currentTarget.style.borderColor = 'var(--c-border2)' }}
                  onMouseOut={e => { if (!dropOpen) e.currentTarget.style.borderColor = 'var(--c-border)' }}
                >
                  <UserAvatar username={user.username} seed={user.avatar_seed} style={user.avatar_style} elo={user.elo_rating} size={22} isMe={true} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-text)' }}>{user.username}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, padding: '1px 6px', background: userTier?.bg, color: userTier?.col, border: `1px solid ${userTier?.col}40`, borderRadius: 0 }}>
                    {user.elo_rating ?? 1200}
                  </span>
                  <ChevronDown size={12} style={{ color: 'var(--c-text-mute)', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1.5 w-52"
                      style={{ background: 'var(--c-panel)', border: '1px solid #1C2842', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 100 }}
                    >
                      {/* User header */}
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1C2842' }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>{user.username}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 2, color: 'var(--c-text-mute)' }}>
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
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-dim)' }}
                        >
                          <span style={{ color: 'var(--c-text-mute)' }}>{item.icon}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'inherit' }}>{item.label}</span>
                        </button>
                      ))}

                      <div style={{ borderTop: '1px solid #1C2842' }}>
                        <button
                          id="nav-logout"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-text-dim)' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--c-red-glow)'; e.currentTarget.style.color = 'var(--c-red)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-dim)' }}
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
                    padding: '6px 16px', color: 'var(--c-text-dim)',
                    background: 'transparent', border: '1px solid #1C2842', borderRadius: 0, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-red)'; e.currentTarget.style.color = 'var(--c-red)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-dim)' }}
                >
                  Sign In
                </button>
                <button
                  id="nav-register"
                  onClick={() => goAuth('register')}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                    padding: '6px 18px', letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: '#fff', background: 'var(--c-red)', border: 'none',
                    clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#F43F5E' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--c-red)' }}
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
            style={{ color: 'var(--c-text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}
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
            style={{ background: 'var(--c-nav-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--c-border)' }}
          >
            <div className="px-5 py-5 space-y-1">
              {NAV_LINKS.map(({ label, href, icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2 py-3 px-4 w-full transition-colors"
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: pathname === href ? 'var(--c-red)' : 'var(--c-text-dim)', textDecoration: 'none',
                    borderBottom: '1px solid #1C2842',
                  }}
                >
                  {icon} {label}
                </Link>
              ))}

              {!loading && !isAuthenticated && (
                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={() => { goAuth('login'); setMobileOpen(false) }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13, padding: '12px', color: 'var(--c-text-dim)', background: 'transparent', border: '1px solid #1C2842', cursor: 'pointer', width: '100%' }}>
                    Sign In
                  </button>
                  <button onClick={() => { goAuth('register'); setMobileOpen(false) }}
                    style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '12px', color: '#fff', background: 'var(--c-red)', border: 'none', cursor: 'pointer', width: '100%' }}>
                    Join the Roster
                  </button>
                </div>
              )}

              {!loading && isAuthenticated && (
                <div className="space-y-1 pt-2">
                  <button onClick={() => { navigate('/profile'); setMobileOpen(false) }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '12px 16px', color: 'var(--c-text-dim)', background: 'transparent', border: '1px solid #1C2842', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    Profile
                  </button>
                  <button onClick={handleLogout}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '12px 16px', color: 'var(--c-red)', background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.2)', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
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
