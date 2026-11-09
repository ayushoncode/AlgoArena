import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { getUserAvatarUrl } from '../../utils/avatar'
import { getEloTier } from '../../utils/tierHelper'
import {
  IconUser,
  IconFileText,
  IconBookmark,
  IconLogOut,
  IconSun,
  IconMoon,
  IconClose,
  IconHexagonBadge,
  IconUsers,
  IconUserPlus
} from '../icons'
import { usePremium } from '../../hooks/usePremium'
import PremiumBadge from '../PremiumBadge'

/**
 * ProfileMenu — Redesigned AlgoArena account menu
 * Desktop popover (280px) and phone bottom sheet.
 * Follows strict design tokens: Sora font, navy surfaces, hairlines, gold mono rating.
 */
export default function ProfileMenu({ isOpen, onClose, user, triggerRef, logout }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isPremium, status: subStatus, isPremiumEnabled } = usePremium()
  const menuRef = useRef(null)
  const [imgErr, setImgErr] = useState(false)

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 639px)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const username = user?.username || 'coder'
  const rating = user?.elo_rating ?? 1200
  const tier = getEloTier(rating)
  const TierMark = tier?.Mark
  const avatarUrl = getUserAvatarUrl(username, user?.avatar_seed, user?.avatar_style)
  const fallbackInitial = (username[0] || 'U').toUpperCase()

  // Handle outside click on desktop
  useEffect(() => {
    if (!isOpen || isMobile) return

    function handleMouseDown(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('touchstart', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('touchstart', handleMouseDown)
    }
  }, [isOpen, isMobile, onClose, triggerRef])

  // Manage keyboard navigation and focus
  useEffect(() => {
    if (!isOpen) return

    const container = menuRef.current
    if (!container) return

    // Get all interactive elements in menu
    const getFocusable = () =>
      Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

    const focusables = getFocusable()
    if (focusables.length > 0) {
      // Small timeout to allow mount
      setTimeout(() => {
        focusables[0].focus()
      }, 30)
    }

    function handleKeyDown(e) {
      const items = getFocusable()
      const currentIndex = items.indexOf(document.activeElement)

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        triggerRef?.current?.focus()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        items[nextIndex]?.focus()
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        items[prevIndex]?.focus()
        return
      }

      if (e.key === 'Home') {
        e.preventDefault()
        items[0]?.focus()
        return
      }

      if (e.key === 'End') {
        e.preventDefault()
        items[items.length - 1]?.focus()
        return
      }

      // Tab trapping for mobile bottom sheet
      if (isMobile && e.key === 'Tab') {
        if (e.shiftKey && currentIndex <= 0) {
          e.preventDefault()
          items[items.length - 1]?.focus()
        } else if (!e.shiftKey && currentIndex >= items.length - 1) {
          e.preventDefault()
          items[0]?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isMobile, onClose, triggerRef])

  if (!isOpen) return null

  function handleNavigate(path) {
    onClose()
    navigate(path)
  }

  function handleLogout() {
    onClose()
    logout()
    navigate('/')
  }

  function handleSelectTheme(targetTheme) {
    if (theme !== targetTheme) {
      toggleTheme()
    }
  }

  const menuContent = (
    <div
      ref={menuRef}
      className={isMobile ? 'nav-v2-menu-sheet' : 'nav-v2-menu-popover'}
      role="menu"
      aria-label="Account options"
    >
      {isMobile && (
        <div className="nav-v2-sheet-header">
          <span className="nav-v2-sheet-title">Account</span>
          <button
            type="button"
            className="nav-v2-sheet-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <IconClose size={16} />
          </button>
        </div>
      )}

      {/* User Header */}
      <div className="nav-v2-menu-header">
        <div className="nav-v2-header-avatar">
          {!imgErr && avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              onError={() => setImgErr(true)}
            />
          ) : (
            <span className="nav-v2-avatar-fallback">{fallbackInitial}</span>
          )}
        </div>
        <div className="nav-v2-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="nav-v2-header-username">{username}</span>
            {isPremium && <PremiumBadge size="xs" showLabel={false} />}
          </div>
          <div className="nav-v2-header-stats">
            <span className="nav-v2-tier-name" style={{ color: tier.color }}>
              {tier.name}
            </span>
            <span style={{ color: 'var(--hair-muted, rgba(196, 214, 232, 0.4))' }}>·</span>
            <span className="nav-v2-rating-val" style={{ color: tier.color, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
              {rating}
            </span>
          </div>
          <Link
            to="/profile"
            className="nav-v2-view-profile-link"
            onClick={onClose}
          >
            View profile
          </Link>
        </div>
      </div>

      {/* Ruled list of items */}
      <div className="nav-v2-menu-list">
        {isPremium ? (
          <div
            className="nav-v2-premium-menu-box"
            style={{
              padding: '10px 14px',
              margin: '4px 10px 8px',
              background: 'rgba(255, 214, 150, 0.06)',
              border: '1px solid rgba(255, 214, 150, 0.24)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PremiumBadge size="xs" showLabel={true} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--sub, #a2a9b8)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
                {subStatus?.until ? (() => {
                  try {
                    const d = new Date(subStatus.until)
                    const f = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    return subStatus.cancelAtPeriodEnd ? `Cancels ${f}` : `Renews ${f}`
                  } catch {
                    return 'Active subscription'
                  }
                })() : 'Active subscription'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/account/billing')}
              className="px-2.5 py-1 text-xs font-medium rounded"
              style={{
                background: 'var(--bg-2, #0d1527)',
                border: '1px solid var(--hair, rgba(196, 214, 232, 0.2))',
                color: 'var(--ink, #ffffff)',
                cursor: 'pointer'
              }}
            >
              Manage
            </button>
          </div>
        ) : isPremiumEnabled && isMobile ? (
          <button
            type="button"
            id="dd-get-premium"
            className="nav-v2-menu-item"
            role="menuitem"
            onClick={() => handleNavigate('/premium')}
            style={{ color: 'var(--gold, #ffd696)' }}
          >
            <span className="nav-v2-menu-item-icon" style={{ color: 'var(--gold, #ffd696)' }}>
              <IconHexagonBadge size={18} />
            </span>
            <span className="nav-v2-menu-item-label font-medium" style={{ color: 'var(--gold, #ffd696)' }}>
              Get Premium
            </span>
          </button>
        ) : null}

        <button
          type="button"
          id="dd-profile"
          className="nav-v2-menu-item"
          role="menuitem"
          onClick={() => handleNavigate('/profile')}
        >
          <span className="nav-v2-menu-item-icon">
            <IconUser size={18} />
          </span>
          <span className="nav-v2-menu-item-label">Profile</span>
        </button>

        <button
          type="button"
          id="dd-friends"
          className="nav-v2-menu-item"
          role="menuitem"
          onClick={() => handleNavigate(`/profile/${encodeURIComponent(username)}/friends`)}
        >
          <span className="nav-v2-menu-item-icon">
            <IconUsers size={18} />
          </span>
          <span className="nav-v2-menu-item-label">Friends</span>
        </button>

        <button
          type="button"
          id="dd-friend-requests"
          className="nav-v2-menu-item"
          role="menuitem"
          onClick={() => handleNavigate('/profile/requests')}
        >
          <span className="nav-v2-menu-item-icon">
            <IconUserPlus size={18} />
          </span>
          <span className="nav-v2-menu-item-label">Friend requests</span>
        </button>

        <button
          type="button"
          id="dd-my-reports"
          className="nav-v2-menu-item"
          role="menuitem"
          onClick={() => handleNavigate('/experiences/mine')}
        >
          <span className="nav-v2-menu-item-icon">
            <IconFileText size={18} />
          </span>
          <span className="nav-v2-menu-item-label">My reports</span>
        </button>

        <button
          type="button"
          id="dd-saved-reports"
          className="nav-v2-menu-item"
          role="menuitem"
          onClick={() => handleNavigate('/experiences/saved')}
        >
          <span className="nav-v2-menu-item-icon">
            <IconBookmark size={18} />
          </span>
          <span className="nav-v2-menu-item-label">Saved reports</span>
        </button>

        {/* Appearance Row */}
        <div className="nav-v2-appearance-row" role="group" aria-label="Appearance">
          <div className="nav-v2-appearance-left">
            <span className="nav-v2-menu-item-icon">
              {theme === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />}
            </span>
            <span>Appearance</span>
          </div>
          <div className="nav-v2-appearance-segmented" role="radiogroup" aria-label="Theme selector">
            <button
              type="button"
              id="nav-theme-dark"
              role="menuitemradio"
              aria-checked={theme === 'dark'}
              className={`nav-v2-theme-option-btn ${theme === 'dark' ? 'is-active' : ''}`}
              onClick={() => handleSelectTheme('dark')}
            >
              <IconMoon size={12} />
              <span>Dark</span>
            </button>
            <button
              type="button"
              id="nav-theme-light"
              role="menuitemradio"
              aria-checked={theme === 'light'}
              className={`nav-v2-theme-option-btn ${theme === 'light' ? 'is-active' : ''}`}
              onClick={() => handleSelectTheme('light')}
            >
              <IconSun size={12} />
              <span>Light</span>
            </button>
          </div>
        </div>

        <hr className="nav-v2-menu-divider" />

        <button
          type="button"
          id="nav-logout"
          className="nav-v2-menu-item nav-v2-signout-item"
          role="menuitem"
          onClick={handleLogout}
        >
          <span className="nav-v2-menu-item-icon">
            <IconLogOut size={18} />
          </span>
          <span className="nav-v2-menu-item-label">Sign out</span>
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <div className="nav-v2-sheet-scrim" onClick={onClose} aria-hidden="true" />
        {menuContent}
      </>
    )
  }

  return menuContent
}

