import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { UserAvatar, getTier } from '../utils/avatar'
import { getEloTier } from '../utils/tierHelper'
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

  const userTier = user ? getEloTier(user.elo_rating ?? 1200) : null

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
          background: 'rgba(2, 6, 15, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))',
          height: '72px',
        }}
      >
        <div className="max-w-[1240px] mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo + wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            style={{ textDecoration: 'none' }}
          >
            <ArenaLogo size={24} />
          </Link>

          {/* Desktop center nav */}
          <div className="hidden sm:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  to={href}
                  className="relative flex items-center transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: active ? 'var(--feat, #e2ebf5)' : 'var(--sub, #a2a9b8)',
                    minHeight: '44px',
                  }}
                  onMouseOver={e => { if (!active) e.currentTarget.style.color = 'var(--ink, #ffffff)' }}
                  onMouseOut={e => { if (!active) e.currentTarget.style.color = 'var(--sub, #a2a9b8)' }}
                >
                  {label}
                  {active && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: 0,
                        right: 0,
                        height: '1.5px',
                        background: 'var(--hair, rgba(196, 214, 232, 0.72))',
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop right — auth */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 transition-colors flex items-center justify-center rounded"
              style={{ color: 'var(--sub, #a2a9b8)' }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--ink, #ffffff)' }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--sub, #a2a9b8)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {loading ? (
              <div className="w-24 h-7 rounded" style={{ background: 'var(--hair-muted, rgba(196, 214, 232, 0.16))' }} />
            ) : isAuthenticated ? (
              /* User dropdown */
              <div className="relative" ref={dropRef}>
                <button
                  id="nav-user-btn"
                  onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2.5 px-3 py-1.5 transition-all"
                  style={{
                    background: dropOpen ? 'var(--bg-2, #0a1428)' : 'var(--bg-1, #060d1c)',
                    border: `1px solid ${dropOpen ? 'var(--hair, rgba(196, 214, 232, 0.4))' : 'var(--hair-muted, rgba(196, 214, 232, 0.16))'}`,
                    borderRadius: '4px',
                    minHeight: '36px',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => { if (!dropOpen) e.currentTarget.style.borderColor = 'var(--hair, rgba(196, 214, 232, 0.3))' }}
                  onMouseOut={e => { if (!dropOpen) e.currentTarget.style.borderColor = 'var(--hair-muted, rgba(196, 214, 232, 0.16))' }}
                >
                  <UserAvatar username={user.username} seed={user.avatar_seed} style={user.avatar_style} elo={user.elo_rating} size={22} isMe={true} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 600, color: 'var(--ink, #ffffff)' }}>{user.username}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      background: userTier?.bg || 'rgba(148, 163, 184, 0.12)',
                      color: userTier?.color || '#94a3b8',
                      border: `1px solid ${userTier?.border || 'rgba(148, 163, 184, 0.3)'}`,
                      borderRadius: '3px',
                    }}
                    title={`Rating: ${user.elo_rating ?? 1200} · ${userTier?.name || 'Novice'}`}
                  >
                    {user.elo_rating ?? 1200}
                  </span>
                  <ChevronDown size={12} style={{ color: 'var(--sub, #a2a9b8)', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }} />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1.5 w-52"
                      style={{
                        background: 'var(--bg-1, #060d1c)',
                        border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.18))',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        zIndex: 100,
                      }}
                    >
                      {/* User header */}
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))' }}>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700, color: 'var(--ink, #ffffff)' }}>{user.username}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', marginTop: 2, color: 'var(--sub, #a2a9b8)' }}>
                          <span style={{ color: userTier?.color, fontWeight: 700 }}>{userTier?.name || 'Novice'}</span> · {user.elo_rating ?? 1200} elo · {user.wins ?? 0}W {user.losses ?? 0}L
                        </p>
                      </div>

                      {[
                        { id: 'dd-profile', label: 'Profile', path: '/profile' },
                        { id: 'dd-lobby', label: 'Lobby', path: '/lobby' },
                      ].map(item => (
                        <button
                          key={item.id}
                          id={item.id}
                          onClick={() => { navigate(item.path); setDropOpen(false) }}
                          className="w-full flex items-center px-4 py-2.5 text-left transition-colors"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '12px',
                            color: 'var(--sub, #a2a9b8)',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(196, 214, 232, 0.06)'; e.currentTarget.style.color = 'var(--ink, #ffffff)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sub, #a2a9b8)' }}
                        >
                          {item.label}
                        </button>
                      ))}

                      <div style={{ borderTop: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))' }}>
                        <button
                          id="nav-logout"
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2.5 text-left transition-colors"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#fb7185',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  id="nav-signin"
                  onClick={() => goAuth('login')}
                  style={{
                    fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                    padding: '8px 14px', color: 'var(--sub, #a2a9b8)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--ink, #ffffff)' }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--sub, #a2a9b8)' }}
                >
                  Sign in →
                </button>
                <button
                  id="nav-register"
                  onClick={() => goAuth('register')}
                  style={{
                    fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                    padding: '8px 18px', color: '#02060f', background: '#ffffff',
                    border: '1px solid #ffffff', borderRadius: '999px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#e2ebf5' }}
                  onMouseOut={e => { e.currentTarget.style.background = '#ffffff' }}
                >
                  Join The Roster
                </button>
              </div>
            )}
          </div>

          {/* Mobile controls (Theme + Hamburger) */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 transition-colors flex items-center justify-center rounded-md"
              style={{ color: 'var(--c-text-dim)', background: 'transparent', border: 'none' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="p-2 transition-colors"
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{ color: 'var(--c-text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
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
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center py-3 px-4 w-full transition-colors"
                  style={{
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: pathname === href ? 'var(--ink, #ffffff)' : 'var(--sub, #a2a9b8)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))',
                  }}
                >
                  {label}
                </Link>
              ))}

              {!loading && !isAuthenticated && (
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => { goAuth('login'); setMobileOpen(false) }}
                    style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px', padding: '12px',
                      color: 'var(--sub, #a2a9b8)', background: 'transparent',
                      border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.16))',
                      borderRadius: '4px', cursor: 'pointer', width: '100%',
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { goAuth('register'); setMobileOpen(false) }}
                    style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600,
                      padding: '12px', color: '#02060f', background: '#ffffff',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%',
                    }}
                  >
                    Join The Roster
                  </button>
                </div>
              )}

              {!loading && isAuthenticated && (
                <div className="space-y-1 pt-2">
                  <button
                    onClick={() => { navigate('/profile'); setMobileOpen(false) }}
                    style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px', padding: '12px 16px',
                      color: 'var(--sub, #a2a9b8)', background: 'transparent',
                      border: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))',
                      borderRadius: '4px', cursor: 'pointer', width: '100%', textAlign: 'left',
                    }}
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500,
                      padding: '12px 16px', color: '#fb7185', background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '4px',
                      cursor: 'pointer', width: '100%', textAlign: 'left',
                    }}
                  >
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
