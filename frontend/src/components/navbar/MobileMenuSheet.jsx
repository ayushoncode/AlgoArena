import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { getUserAvatarUrl } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'
import { ArenaLogo } from '../ArenaLogo'
import {
  IconClose,
  IconSwords,
  IconTrophy,
  IconFileText,
  IconShield,
  IconUser,
  IconBookmark,
  IconSun,
  IconMoon,
  IconLogOut,
  IconHexagonBadge,
  IconMessageSquare,
  IconLock
} from '../icons'
import { usePremium } from '../../hooks/usePremium'
import PremiumBadge from '../PremiumBadge'
import './navbar-v2.css'

/**
 * MobileMenuSheet — Full-screen solid navigation & account sheet for phones and small tablets (< 900px)
 * Replaces both the fragmented hamburger drawer and mobile account bottom sheet.
 * Features:
 * - 100dvh solid --bg-1 surface (zero transparency, zero see-through)
 * - Rock-solid document scroll locking with scroll position restoration
 * - Accessible focus trap, Esc key listener, focus return to hamburger
 * - Rows at least 52px tall, 17px text, custom inline SVGs
 * - Inline Dark / Light Appearance segmented control
 * - Sign out pinned above safe-area inset at bottom
 */
export default function MobileMenuSheet({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  logout,
  pathname,
  navigate,
  goAuth,
  triggerRef,
  hasUnreadDiscuss = false,
  isDiscussionGated = false
}) {
  const { theme, toggleTheme } = useTheme()
  const { isPremium, isPremiumEnabled, openLockedModal } = usePremium()
  const sheetRef = useRef(null)
  const closeBtnRef = useRef(null)
  const [imgErr, setImgErr] = useState(false)

  const username = user?.username || 'Warrior'
  const rating = user?.elo_rating ?? 1200
  const tier = getEloTier(rating)
  const TierMark = tier?.Mark
  const avatarUrl = getUserAvatarUrl(username, user?.avatar_seed, user?.avatar_style)
  const fallbackInitial = (username[0] || 'W').toUpperCase()

  // 1. Scroll lock: Lock body & html scroll while preserving exact window.scrollY
  useEffect(() => {
    if (!isOpen) return

    const scrollY = window.scrollY
    const html = document.documentElement
    const body = document.body

    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyPosition = body.style.position
    const prevBodyTop = body.style.top
    const prevBodyWidth = body.style.width

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.position = prevBodyPosition
      body.style.top = prevBodyTop
      body.style.width = prevBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  // 2. Focus handling & Focus Trap
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus()
    }, 40)

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef?.current?.focus()
        return
      }

      if (e.key === 'Tab') {
        if (!sheetRef.current) return
        const focusable = sheetRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

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

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      triggerRef?.current?.focus()
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  function handleNav(href) {
    onClose()
    navigate(href)
  }

  function handleThemeChange(targetTheme) {
    if (theme !== targetTheme) {
      toggleTheme()
    }
  }

  function handleLogout() {
    onClose()
    if (logout) logout()
    navigate('/')
  }

  return (
    <div
      ref={sheetRef}
      id="mobile-nav-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      className="nav-v2-mobile-fullsheet"
    >
      {/* ── SHEET TOP HEADER ─────────────────────────────────────── */}
      <div className="nav-v2-m-sheet-header">
        {isAuthenticated ? (
          <div className="nav-v2-m-user-summary">
            <div className="nav-v2-m-avatar-wrap">
              {!imgErr && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="nav-v2-m-avatar-img"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <span className="nav-v2-m-avatar-fallback">{fallbackInitial}</span>
              )}
            </div>
            <div className="nav-v2-m-user-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="nav-v2-m-username" title={username}>
                  {username}
                </span>
                {isPremium && <PremiumBadge size="xs" showLabel={false} />}
              </div>
              <div className="nav-v2-m-stats-line">
                <span className="nav-v2-tier-name" style={{ color: tier.color }}>
                  {tier.name}
                </span>
                <span className="nav-v2-m-dot">·</span>
                <span className="nav-v2-rating-val" style={{ color: tier.color, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                  {rating}
                </span>
              </div>
              {isPremiumEnabled && !isPremium ? (
                <div
                  onClick={() => handleNav('/premium')}
                  style={{
                    color: 'var(--gold, #ffd696)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: '3px',
                    lineHeight: '1.3'
                  }}
                >
                  Access all features with our Premium subscription!
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="nav-v2-m-profile-link"
                  onClick={onClose}
                >
                  View profile
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="nav-v2-m-logo-summary">
            <ArenaLogo size={24} />
          </div>
        )}

        <button
          ref={closeBtnRef}
          type="button"
          className="nav-v2-m-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          <IconClose size={20} />
        </button>
      </div>

      {/* ── SHEET SCROLLABLE BODY ───────────────────────────────── */}
      <div className="nav-v2-m-sheet-body">
        {/* Main Nav Section */}
        <div className="nav-v2-m-nav-group" role="navigation" aria-label="Main navigation">
          {isPremiumEnabled && isAuthenticated && (
            <button
              type="button"
              className={`nav-v2-m-row ${pathname === '/premium' ? 'is-active' : ''}`}
              onClick={() => handleNav('/premium')}
              aria-current={pathname === '/premium' ? 'page' : undefined}
              style={{
                color: 'var(--gold, #ffd696)',
                background: 'rgba(255, 214, 150, 0.05)',
                border: '1px solid rgba(255, 214, 150, 0.25)',
                borderRadius: '8px',
                margin: '4px 0 8px 0',
                padding: '10px 12px'
              }}
            >
              <span className="nav-v2-m-row-icon" style={{ color: 'var(--gold, #ffd696)' }}>
                <IconHexagonBadge size={18} />
              </span>
              <span className="nav-v2-m-row-label" style={{ color: 'var(--gold, #ffd696)', fontWeight: 600 }}>
                {isPremium ? 'Premium Membership' : 'AlgoArena Premium'}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: isPremium ? 'var(--gold, #ffd696)' : '#080d1a',
                  background: isPremium ? 'transparent' : 'var(--gold, #ffd696)',
                  padding: isPremium ? '0' : '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              >
                {isPremium ? 'Active' : 'Upgrade'}
              </span>
            </button>
          )}

          <button
            type="button"
            className={`nav-v2-m-row ${pathname === '/lobby' ? 'is-active' : ''}`}
            onClick={() => handleNav('/lobby')}
            aria-current={pathname === '/lobby' ? 'page' : undefined}
          >
            <span className="nav-v2-m-row-icon">
              <IconSwords size={20} />
            </span>
            <span className="nav-v2-m-row-label">Lobby</span>
          </button>

          <button
            type="button"
            className={`nav-v2-m-row ${pathname === '/leaderboard' ? 'is-active' : ''}`}
            onClick={() => handleNav('/leaderboard')}
            aria-current={pathname === '/leaderboard' ? 'page' : undefined}
          >
            <span className="nav-v2-m-row-icon">
              <IconTrophy size={20} />
            </span>
            <span className="nav-v2-m-row-label">Leaderboard</span>
          </button>

          {isAuthenticated && (
            <button
              type="button"
              className={`nav-v2-m-row ${pathname.startsWith('/discuss') ? 'is-active' : ''}`}
              onClick={() => {
                if (isDiscussionGated) {
                  onClose()
                  openLockedModal('discussion')
                } else {
                  handleNav('/discuss')
                }
              }}
              aria-current={pathname.startsWith('/discuss') ? 'page' : undefined}
            >
              <span className="nav-v2-m-row-icon">
                <IconMessageSquare size={20} />
              </span>
              <span className="nav-v2-m-row-label">Discussions</span>
              {hasUnreadDiscuss && (
                <span className="w-2 h-2 rounded-full bg-sky-400 ml-2" />
              )}
              {isDiscussionGated && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--c-text-mute)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <IconLock size={12} />
                  <span>Premium</span>
                </span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <button
              type="button"
              className={`nav-v2-m-row ${pathname.startsWith('/experiences') && !pathname.includes('/mine') && !pathname.includes('/saved') ? 'is-active' : ''}`}
              onClick={() => handleNav('/experiences')}
              aria-current={pathname.startsWith('/experiences') && !pathname.includes('/mine') && !pathname.includes('/saved') ? 'page' : undefined}
            >
              <span className="nav-v2-m-row-icon">
                <IconFileText size={20} />
              </span>
              <span className="nav-v2-m-row-label">Intel Reports</span>
            </button>
          ) : (
            <button
              type="button"
              className={`nav-v2-m-row ${pathname === '/who-we-are' ? 'is-active' : ''}`}
              onClick={() => handleNav('/who-we-are')}
              aria-current={pathname === '/who-we-are' ? 'page' : undefined}
            >
              <span className="nav-v2-m-row-icon">
                <IconShield size={20} />
              </span>
              <span className="nav-v2-m-row-label">Who We Are</span>
            </button>
          )}
        </div>

        {/* Hairline Divider */}
        <hr className="nav-v2-m-divider" />

        {/* Account / User Section (Logged In) */}
        {isAuthenticated ? (
          <div className="nav-v2-m-account-group" role="group" aria-label="Account">
            <button
              type="button"
              className={`nav-v2-m-row ${pathname === '/profile' ? 'is-active' : ''}`}
              onClick={() => handleNav('/profile')}
              aria-current={pathname === '/profile' ? 'page' : undefined}
            >
              <span className="nav-v2-m-row-icon">
                <IconUser size={20} />
              </span>
              <span className="nav-v2-m-row-label">Profile</span>
            </button>

            <button
              type="button"
              className={`nav-v2-m-row ${pathname === '/experiences/mine' ? 'is-active' : ''}`}
              onClick={() => handleNav('/experiences/mine')}
              aria-current={pathname === '/experiences/mine' ? 'page' : undefined}
            >
              <span className="nav-v2-m-row-icon">
                <IconFileText size={20} />
              </span>
              <span className="nav-v2-m-row-label">My reports</span>
            </button>

            <button
              type="button"
              className={`nav-v2-m-row ${pathname === '/experiences/saved' ? 'is-active' : ''}`}
              onClick={() => handleNav('/experiences/saved')}
              aria-current={pathname === '/experiences/saved' ? 'page' : undefined}
            >
              <span className="nav-v2-m-row-icon">
                <IconBookmark size={20} />
              </span>
              <span className="nav-v2-m-row-label">Saved reports</span>
            </button>

            {/* Appearance Row */}
            <div className="nav-v2-m-row nav-v2-m-appearance-row">
              <span className="nav-v2-m-row-icon">
                {theme === 'dark' ? <IconMoon size={20} /> : <IconSun size={20} />}
              </span>
              <span className="nav-v2-m-row-label">Appearance</span>
              <div
                className="nav-v2-m-segmented"
                role="radiogroup"
                aria-label="Theme selector"
              >
                <button
                  type="button"
                  id="nav-theme-dark-mobile"
                  role="radio"
                  aria-checked={theme === 'dark'}
                  className={`nav-v2-m-segmented-btn ${theme === 'dark' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <IconMoon size={13} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  id="nav-theme-light-mobile"
                  role="radio"
                  aria-checked={theme === 'light'}
                  className={`nav-v2-m-segmented-btn ${theme === 'light' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <IconSun size={13} />
                  <span>Light</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Unauthenticated Section */
          <div className="nav-v2-m-unauth-group">
            <div className="nav-v2-m-row nav-v2-m-appearance-row">
              <span className="nav-v2-m-row-icon">
                {theme === 'dark' ? <IconMoon size={20} /> : <IconSun size={20} />}
              </span>
              <span className="nav-v2-m-row-label">Appearance</span>
              <div
                className="nav-v2-m-segmented"
                role="radiogroup"
                aria-label="Theme selector"
              >
                <button
                  type="button"
                  id="nav-theme-dark-mobile"
                  role="radio"
                  aria-checked={theme === 'dark'}
                  className={`nav-v2-m-segmented-btn ${theme === 'dark' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <IconMoon size={13} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  id="nav-theme-light-mobile"
                  role="radio"
                  aria-checked={theme === 'light'}
                  className={`nav-v2-m-segmented-btn ${theme === 'light' ? 'is-active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <IconSun size={13} />
                  <span>Light</span>
                </button>
              </div>
            </div>

            <div className="nav-v2-m-auth-actions">
              <button
                type="button"
                id="nav-signin-mobile"
                className="nav-v2-m-signin-btn"
                onClick={() => {
                  onClose()
                  goAuth('login')
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                id="nav-register-mobile"
                className="nav-v2-m-register-btn"
                onClick={() => {
                  onClose()
                  goAuth('register')
                }}
              >
                Join the roster
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SHEET PINNED FOOTER (Sign out) ───────────────────────── */}
      {isAuthenticated && (
        <div className="nav-v2-m-sheet-footer">
          <button
            type="button"
            id="nav-logout-mobile"
            className="nav-v2-m-signout-btn"
            onClick={handleLogout}
          >
            <span className="nav-v2-m-row-icon text-[var(--bad,#f43f5e)]">
              <IconLogOut size={20} />
            </span>
            <span className="nav-v2-m-signout-label">Sign out</span>
          </button>
        </div>
      )}
    </div>
  )
}

