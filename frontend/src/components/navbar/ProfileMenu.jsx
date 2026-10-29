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
  IconClose
} from '../icons'

/**
 * ProfileMenu — Redesigned AlgoArena account menu
 * Desktop popover (280px) and phone bottom sheet.
 * Follows strict design tokens: Sora font, navy surfaces, hairlines, gold mono rating.
 */
export default function ProfileMenu({ isOpen, onClose, user, triggerRef, logout }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
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
          <span className="nav-v2-header-username">{username}</span>
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

