import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ArenaLogo } from './ArenaLogo'
import LegacyNavbar from './navbar/LegacyNavbar'
import AvatarButton from './navbar/AvatarButton'
import ProfileMenu from './navbar/ProfileMenu'
import StreakButton from './navbar/StreakButton'
import MobileMenuSheet from './navbar/MobileMenuSheet'
import { getStreakData } from './navbar/navData'
import { usePremium } from '../hooks/usePremium'
import { useSocket } from '../hooks/useSocket'
import { getUnreadReplies } from '../services/discussionApi'
import { IconLock } from './icons'
import './navbar/navbar-v2.css'

/**
 * Navbar — Primary Top Navigation for AlgoArena
 * Features redesigned navigation:
 *   - Desktop (>= 900px): StreakButton, AvatarButton with ProfileMenu popover
 *   - Mobile (< 900px): Clean 56px bar with Emblem + Wordmark, StreakButton, Hamburger (Avatar moved into sheet)
 *   - MobileMenuSheet: Full-screen solid navigation & account sheet
 * Fallback to legacy via ?ui=legacy or VITE_NAV_UI=legacy.
 */
export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location

  // Suppress navbar on match pages
  if (pathname.startsWith('/match')) return null

  const searchParams = new URLSearchParams(location.search)
  const isLegacy = searchParams.get('ui') === 'legacy' || import.meta.env.VITE_NAV_UI === 'legacy'

  if (isLegacy) {
    return <LegacyNavbar />
  }

  return <NavbarV2 navigate={navigate} pathname={pathname} />
}

function NavbarV2({ navigate, pathname }) {
  const { user, logout, isAuthenticated, loading } = useAuth()
  const { isPremium, isPremiumEnabled, openLockedModal } = usePremium()
  const { on, off } = useSocket()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasUnreadDiscuss, setHasUnreadDiscuss] = useState(false)

  const avatarBtnRef = useRef(null)
  const streakBtnRef = useRef(null)
  const mobileStreakBtnRef = useRef(null)
  const hamburgerBtnRef = useRef(null)

  const [streakData, setStreakData] = useState({ current: 0, best: 0, isCompletedToday: false })
  const [streakLoading, setStreakLoading] = useState(false)
  const [streakError, setStreakError] = useState(false)

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 899px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Close panels and mobile sheet on route change
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  // Fetch streak when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    let isSubscribed = true
    setStreakLoading(true)

    getStreakData(user?.id)
      .then(data => {
        if (!isSubscribed) return
        if (data.isError) {
          setStreakError(true)
        } else {
          setStreakData(data)
          setStreakError(false)
        }
      })
      .catch(() => {
        if (!isSubscribed) return
        setStreakError(true)
      })
      .finally(() => {
        if (isSubscribed) setStreakLoading(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [isAuthenticated, user?.id, pathname])

  // Fetch discussion unread status & register live notification
  useEffect(() => {
    if (!isAuthenticated) {
      setHasUnreadDiscuss(false)
      return
    }

    let isSubscribed = true
    getUnreadReplies()
      .then(res => {
        if (isSubscribed && res?.hasUnread) {
          setHasUnreadDiscuss(true)
        }
      })
      .catch(() => {})

    function onReplyNotif() {
      if (isSubscribed) setHasUnreadDiscuss(true)
    }

    on('disc:reply_notification', onReplyNotif)
    return () => {
      isSubscribed = false
      off('disc:reply_notification', onReplyNotif)
    }
  }, [isAuthenticated, on, off])

  function handleFlameClick() {
    setMenuOpen(false)
    setMobileOpen(false)
    navigate('/daily')
  }

  function handleToggleMenu() {
    setMenuOpen(o => !o)
  }

  function goAuth(mode) {
    navigate(mode === 'register' ? '/signup' : '/login')
  }

  const isDiscussionFreeRead = import.meta.env.VITE_DISCUSSION_FREE_READ === 'true'
  const isDiscussionGated = isAuthenticated && isPremiumEnabled && !isPremium && !isDiscussionFreeRead

  const NAV_LINKS = [
    { label: 'Lobby', href: '/lobby' },
    { label: 'Leaderboard', href: '/leaderboard' },
    {
      label: 'Discuss',
      href: '/discuss',
      isDiscuss: true,
      hasDot: hasUnreadDiscuss,
      isGated: isDiscussionGated
    },
    ...(isPremiumEnabled && !isAuthenticated ? [{ label: 'Premium', href: '/premium' }] : []),
    ...(isAuthenticated ? [{ label: 'Intel Reports', href: '/experiences' }] : []),
    ...(!isAuthenticated ? [{ label: 'Who We Are', href: '/who-we-are' }] : []),
  ]

  return (
    <>
      <nav className="nav-v2-container fixed top-0 inset-x-0 z-50">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* ── Brand Logo (Shared, always visible, never hidden) ───── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            style={{ textDecoration: 'none' }}
          >
            <ArenaLogo size={24} />
          </Link>

          {/* ── DESKTOP CENTER NAV (>= 900px) ───────────────────────── */}
          <div className="nav-v2-desktop-nav flex items-center gap-7">
            {NAV_LINKS.map(({ label, href, isDiscuss, hasDot, isGated }) => {
              const active = pathname === href || (isDiscuss && pathname.startsWith('/discuss'))

              if (isGated) {
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => openLockedModal('discussion')}
                    className="nav-v2-desktop-link flex items-center gap-1.5 cursor-pointer"
                    style={{ background: 'transparent', border: 'none', padding: 0 }}
                  >
                    <span>{label}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 select-none">
                      <IconLock size={10} />
                      <span>Premium</span>
                    </span>
                  </button>
                )
              }

              return (
                <Link
                  key={href}
                  to={href}
                  className={`nav-v2-desktop-link relative ${active ? 'is-active' : ''}`}
                >
                  <span>{label}</span>
                  {hasDot && (
                    <span
                      aria-label="New replies"
                      className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-sky-400"
                    />
                  )}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="nav-v2-link-underline"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* ── DESKTOP RIGHT CONTROLS (>= 900px) ───────────────────── */}
          <div className="nav-v2-desktop-right items-center gap-3">
            {loading ? (
              <div
                className="w-8 h-8 rounded-full"
                style={{ background: 'var(--hair-muted, rgba(196, 214, 232, 0.16))' }}
              />
            ) : isAuthenticated ? (
              <div className="relative flex items-center gap-2">
                <StreakButton
                  id="nav-streak-btn"
                  streak={streakData.current}
                  bestStreak={streakData.best}
                  isCompletedToday={streakData.isCompletedToday}
                  isLoading={streakLoading}
                  isError={streakError}
                  onClick={handleFlameClick}
                  buttonRef={streakBtnRef}
                />

                <AvatarButton
                  id="nav-user-btn"
                  user={user}
                  isOpen={menuOpen}
                  onClick={handleToggleMenu}
                  buttonRef={avatarBtnRef}
                />

                {isPremiumEnabled && !isPremium && (
                  <Link
                    to="/premium"
                    id="nav-premium-btn"
                    className="nav-v2-premium-btn"
                    style={{
                      height: '32px',
                      padding: '0 13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      color: 'var(--gold, #ffd696)',
                      border: '1px solid rgba(255, 214, 150, 0.45)',
                      borderRadius: '16px',
                      background: 'rgba(255, 214, 150, 0.05)',
                      textDecoration: 'none',
                      transition: 'background 0.15s, border-color 0.15s',
                      flexShrink: 0,
                      boxSizing: 'border-box'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = 'rgba(255, 214, 150, 0.14)'
                      e.currentTarget.style.borderColor = 'var(--gold, #ffd696)'
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'rgba(255, 214, 150, 0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255, 214, 150, 0.45)'
                    }}
                  >
                    Premium
                  </Link>
                )}

                {!isMobile && (
                  <ProfileMenu
                    isOpen={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    user={user}
                    triggerRef={avatarBtnRef}
                    logout={logout}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="nav-signin"
                  onClick={() => goAuth('login')}
                  style={{
                    fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '8px 14px',
                    color: 'var(--sub, #a2a9b8)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = 'var(--ink, #ffffff)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'var(--sub, #a2a9b8)'
                  }}
                >
                  Sign in →
                </button>
                <button
                  type="button"
                  id="nav-register"
                  onClick={() => goAuth('register')}
                  style={{
                    fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    color: '#02060f',
                    background: '#ffffff',
                    border: '1px solid #ffffff',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#e2ebf5'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#ffffff'
                  }}
                >
                  Join The Roster
                </button>
              </div>
            )}
          </div>

          {/* ── MOBILE RIGHT CONTROLS (< 900px) ─────────────────────── */}
          <div className="nav-v2-mobile-right">
            {isAuthenticated ? (
              <>
                <StreakButton
                  id="nav-streak-btn-mobile"
                  streak={streakData.current}
                  bestStreak={streakData.best}
                  isCompletedToday={streakData.isCompletedToday}
                  isLoading={streakLoading}
                  isError={streakError}
                  onClick={handleFlameClick}
                  buttonRef={mobileStreakBtnRef}
                />

                <button
                  ref={hamburgerBtnRef}
                  type="button"
                  id="nav-hamburger-btn"
                  className="nav-v2-hamburger-btn"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-sheet"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                    <line x1="3" y1="5.5" x2="17" y2="5.5" />
                    <line x1="3" y1="10" x2="17" y2="10" />
                    <line x1="3" y1="14.5" x2="17" y2="14.5" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  id="nav-signin-compact"
                  className="nav-v2-signin-compact-btn"
                  onClick={() => goAuth('login')}
                >
                  Sign in
                </button>

                <button
                  ref={hamburgerBtnRef}
                  type="button"
                  id="nav-hamburger-btn"
                  className="nav-v2-hamburger-btn"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-sheet"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                    <line x1="3" y1="5.5" x2="17" y2="5.5" />
                    <line x1="3" y1="10" x2="17" y2="10" />
                    <line x1="3" y1="14.5" x2="17" y2="14.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE FULL-SCREEN MENU SHEET ─────────────────────────── */}
      <MobileMenuSheet
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        logout={logout}
        pathname={pathname}
        navigate={navigate}
        goAuth={goAuth}
        triggerRef={hamburgerBtnRef}
        hasUnreadDiscuss={hasUnreadDiscuss}
        isDiscussionGated={isDiscussionGated}
      />
    </>
  )
}
