import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ArenaEmblem } from '../ArenaLogo'
import './SiteNav.css'

export default function SiteNav({ onOpenAuth, sticky = true }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const burgerRef = useRef(null)

  // Track scroll for subtle border intensification
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        burgerRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const handleSignIn = () => {
    closeMenu()
    if (isAuthenticated) {
      navigate('/lobby')
    } else if (onOpenAuth) {
      onOpenAuth('otp')
    }
  }

  const handleJoin = () => {
    closeMenu()
    if (isAuthenticated) {
      navigate('/lobby')
    } else if (onOpenAuth) {
      onOpenAuth('register')
    }
  }

  return (
    <header className={`site-nav ${sticky ? 'is-sticky' : ''} ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="site-nav-container">
        
        {/* Brand Lockup */}
        <Link to="/" className="site-nav-brand" onClick={closeMenu} aria-label="AlgoArena Home">
          <ArenaEmblem className="site-nav-emblem" glow animate />
          <span className="site-nav-wordmark">ALGOARENA</span>
        </Link>

        {/* Mobile Scrim */}
        <div
          className={`site-nav-scrim ${menuOpen ? 'is-open' : ''}`}
          aria-hidden="true"
          onClick={closeMenu}
        />

        {/* Mobile Burger Toggle */}
        <button
          ref={burgerRef}
          type="button"
          className="site-nav-burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <svg viewBox="0 0 22 14" aria-hidden="true">
            <path className={`b-line ${menuOpen ? 'b-top' : ''}`} d="M1 1 H21" />
            <path className={`b-line ${menuOpen ? 'b-mid' : ''}`} d="M1 7 H21" />
            <path className={`b-line ${menuOpen ? 'b-bot' : ''}`} d="M1 13 H21" />
          </svg>
        </button>

        {/* Navigation Panel */}
        <div className={`site-nav-panel ${menuOpen ? 'is-open' : ''}`}>
          <nav className="site-nav-links" aria-label="Main Navigation">
            <Link
              to="/lobby"
              className={`site-nav-link ${location.pathname === '/lobby' ? 'is-active' : ''}`}
              onClick={closeMenu}
            >
              Lobby
            </Link>
            <Link
              to="/leaderboard"
              className={`site-nav-link ${location.pathname === '/leaderboard' ? 'is-active' : ''}`}
              onClick={closeMenu}
            >
              Leaderboard
            </Link>
            <Link
              to="/who-we-are"
              className={`site-nav-link ${location.pathname === '/who-we-are' ? 'is-active' : ''}`}
              onClick={closeMenu}
            >
              Who We Are
            </Link>
          </nav>

          <div className="site-nav-actions">
            <button
              type="button"
              className="site-nav-login"
              onClick={handleSignIn}
            >
              <span>{isAuthenticated ? 'Enter Lobby' : 'Sign in'}</span>
              <svg className="site-nav-arrow" viewBox="0 0 10 9" aria-hidden="true">
                <path d="M0 4.5 H9.1 M5.4 0.9 L9.2 4.5 L5.4 8.1" />
              </svg>
            </button>

            <button
              type="button"
              className="site-nav-pill"
              onClick={handleJoin}
            >
              <span>{isAuthenticated ? 'Active Duel' : 'Join The Roster'}</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
