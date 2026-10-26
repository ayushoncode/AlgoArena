import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '@fontsource-variable/sora'
import { initClashArtwork } from './useClashArtwork'
import AuthDialog from '../components/AuthDialog'
import { ArenaEmblem } from '../components/ArenaLogo'
import './LandingPage.css'
import '../styles/home-tokens.css'
import '../styles/depth-system.css'
import { SkeletonBlock } from '../components/home/Skeleton'
import { useScrollDepth } from '../hooks/useScrollDepth'

// Below-the-fold sections (Phases B, C, D)
const DuelSection = lazy(() => import('./Home/sections/DuelSection'))
const HowItWorksSection = lazy(() => import('./Home/sections/HowItWorksSection'))
const RatingsSection = lazy(() => import('./Home/sections/RatingsSection'))
const SandboxSection = lazy(() => import('./Home/sections/SandboxSection'))
const LeaderboardSection = lazy(() => import('./Home/sections/LeaderboardSection'))
const FaqSection = lazy(() => import('./Home/sections/FaqSection'))
const FinalCtaSection = lazy(() => import('./Home/sections/FinalCtaSection'))
const FooterSection = lazy(() => import('./Home/sections/FooterSection'))

export default function LandingPage({ onOpenAuth }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('otp')
  const navToggleRef = useRef(null)
  const burgerRef = useRef(null)
  const canvasRef = useRef(null)
  const ctaRef = useRef(null)
  const loginRef = useRef(null)
  const joinRef = useRef(null)
  const activeOpenerRef = useRef(null)
  const heroSectionRef = useRef(null)
  const [isSticky, setIsSticky] = useState(false)
  useScrollDepth(location.search)

  // Track scroll position to engage sticky nav once hero is scrolled past
  useEffect(() => {
    const handleScroll = () => {
      const hero = heroSectionRef.current
      if (!hero) return
      const threshold = (hero.offsetHeight || window.innerHeight) - 72
      setIsSticky(window.scrollY > Math.max(80, threshold))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 1. Mount effect: Set document title and toggle is-landing on <html>
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'AlgoArena | Real-Time 1v1 Coding Duels'
    document.documentElement.classList.add('is-landing')

    return () => {
      document.title = prevTitle
      document.documentElement.classList.remove('is-landing')
      document.documentElement.classList.remove('is-entered')
    }
  }, [])

  // 2. Section 12b: Retire the entrance sequence
  useEffect(() => {
    const el = document.getElementById('foot2')
    let timer = null
    const done = () => {
      if (timer) clearTimeout(timer)
      if (el) el.removeEventListener('animationend', done)
      document.documentElement.classList.add('is-entered')
    }
    timer = setTimeout(done, 4000)
    if (el) el.addEventListener('animationend', done, { once: true })

    return () => {
      if (timer) clearTimeout(timer)
      if (el) el.removeEventListener('animationend', done)
      document.documentElement.classList.remove('is-entered')
    }
  }, [])

  // 3. Section 13: The Clash background canvas loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cleanup = initClashArtwork(canvas)
    return () => {
      cleanup?.()
    }
  }, [])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  const toggleMenu = () => {
    setMenuOpen(prev => !prev)
  }

  // 3. Close menu on route change
  useEffect(() => {
    closeMenu()
  }, [location.pathname, closeMenu])

  // 4. Close menu on Esc and restore focus to burger button
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false)
          burgerRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const handleLinkClick = () => {
    setMenuOpen(false)
    burgerRef.current?.focus()
  }

  const openAuth = useCallback((mode = 'otp', opener = null) => {
    setAuthMode(mode)
    setAuthOpen(true)
    if (opener) activeOpenerRef.current = opener
    if (onOpenAuth) onOpenAuth(mode)
  }, [onOpenAuth])

  // Section 14: Support ?auth=login and ?auth=register deep links on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const param = params.get('auth')
    if (param === 'login') {
      openAuth('otp', loginRef.current || ctaRef.current)
    } else if (param === 'register') {
      openAuth('register', joinRef.current || ctaRef.current)
    }
  }, [location.search, openAuth])

  const handleCtaClick = () => {
    closeMenu()
    if (isAuthenticated) {
      navigate('/lobby')
    } else {
      openAuth('register', ctaRef.current)
    }
  }

  const handleSignInClick = () => {
    closeMenu()
    if (isAuthenticated) {
      navigate('/lobby')
    } else {
      openAuth('otp', loginRef.current)
    }
  }

  const handleJoinClick = () => {
    closeMenu()
    if (isAuthenticated) {
      navigate('/lobby')
    } else {
      openAuth('register', joinRef.current)
    }
  }

  return (
    <div className="home-scroll-root">
      {/* ── First Screen: Pinned 100dvh Hero Section ── */}
      <section ref={heroSectionRef} className="nx-landing hero-screen">
        {/* 1) Canvas artwork layer */}
        <canvas ref={canvasRef} className="art" aria-hidden="true"></canvas>

        {/* 2) Ambient atmospheric veil */}
        <div className="veil"></div>

        {/* 3) Header bar (sticks after hero scrolls past) */}
        <header className={`bar ${isSticky ? 'is-sticky' : ''}`}>
        <a className="brand" href="/" onClick={closeMenu}>
          <ArenaEmblem className="brand-emblem-3d" glow animate />
          <span id="word">ALGOARENA</span>
        </a>

        <input
          ref={navToggleRef}
          className="navtoggle"
          type="checkbox"
          id="nav-open"
          checked={menuOpen}
          onChange={(e) => setMenuOpen(e.target.checked)}
          aria-hidden="true"
        />
        <div
          className="scrim"
          aria-hidden="true"
          onClick={closeMenu}
        />
        <button
          ref={burgerRef}
          type="button"
          className="burger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <svg viewBox="0 0 22 14" aria-hidden="true">
            <path className="b1" d="M1 1 H21" />
            <path className="b2" d="M1 7 H21" />
            <path className="b3" d="M1 13 H21" />
          </svg>
        </button>

        <div className="navpanel">
          <nav className="menu">
            <Link to="/lobby" onClick={handleLinkClick}><span id="about">Lobby</span></Link>
            <Link to="/leaderboard" onClick={handleLinkClick}><span id="product">Leaderboard</span></Link>
            <Link to="/who-we-are" onClick={handleLinkClick}><span id="solutions">Who We Are</span></Link>
          </nav>
          <button ref={loginRef} className="login" type="button" onClick={handleSignInClick}>
            <span id="login">Sign in</span>
            <svg className="navarrow" viewBox="0 0 10 9">
              <path d="M0 4.5 H9.1 M5.4 0.9 L9.2 4.5 L5.4 8.1" />
            </svg>
          </button>
          <button ref={joinRef} className="pill" type="button" onClick={handleJoinClick}>
            <span id="contact">Join The Roster</span>
          </button>
        </div>
      </header>

      {/* 4) Hero content inside 3D depth stage (only recedes on exit, zero transform at scrollY=0) */}
      <div className="hero-stage depth-stage" data-depth-id="hero">
        <div className="depth-exit-layer anim-exit">
          <main className="hero">
            <h1 className="title">
              <span id="h1a">Two coders. One problem.</span>
              <span id="h1b">First accepted wins.</span>
            </h1>
            <p className="sub">
              <span id="sub1">Real-time 1v1 coding duels</span>
              <span id="sub2">settled by Elo.</span>
            </p>
            <button ref={ctaRef} className="cta" type="button" onClick={handleCtaClick}>
              <span id="cta">Enter the arena</span>
              <svg className="arrow" viewBox="0 0 16 11">
                <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8" />
              </svg>
            </button>
            <ul className="feats">
              <li>
                <svg className="chev" viewBox="0 0 11 20">
                  <path d="M1.15 1.15 L9.6 10 L1.15 18.85" />
                </svg>
                <span id="f1">Live matchmaking</span>
              </li>
              <li>
                <svg className="chev" viewBox="0 0 11 20">
                  <path d="M1.15 1.15 L9.6 10 L1.15 18.85" />
                </svg>
                <span id="f2">Sandboxed judge</span>
              </li>
              <li>
                <svg className="chev" viewBox="0 0 11 20">
                  <path d="M1.15 1.15 L9.6 10 L1.15 18.85" />
                </svg>
                <span id="f3">Elo ratings</span>
              </li>
              <li>
                <svg className="chev" viewBox="0 0 11 20">
                  <path d="M1.15 1.15 L9.6 10 L1.15 18.85" />
                </svg>
                <span id="f4">Private duels</span>
              </li>
            </ul>
            <span className="rule" aria-hidden="true"></span>
          </main>

          {/* 5) Footer bar - Three clean lines (bottom of first screen) */}
          <footer className="foot">
            <span id="foot1a">Same problem. Same second.</span>
            <span id="foot1b">Built for competitive programmers.</span>
            <span id="foot2">Season 1</span>
          </footer>
        </div>
      </div>
    </section>

    {/* ── Below-the-fold scrolling sections (Phases B, C, D) ── */}
    <div className="home-sections" id="home-content">
      <Suspense fallback={<div className="section-container" style={{ padding: '80px 24px' }}><SkeletonBlock height={480} /></div>}>
        <DuelSection />
        <HowItWorksSection />
        <RatingsSection />
        <SandboxSection />
        <LeaderboardSection />
        <FaqSection />
        <FinalCtaSection onOpenAuth={openAuth} />
        <FooterSection />
      </Suspense>
    </div>

    {/* 6) Phase D: Auth Dialog Modal */}
    <AuthDialog
      isOpen={authOpen}
      onClose={() => setAuthOpen(false)}
      initialMode={authMode}
      openerRef={activeOpenerRef}
    />
  </div>
  )
}

