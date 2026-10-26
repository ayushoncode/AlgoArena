import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import '@fontsource-variable/sora'
import '../styles/home-tokens.css'
import './WhoWeAre/WhoWeAre.css'

import SiteNav from '../components/home/SiteNav'
import AuthDialog from '../components/AuthDialog'
import { SkeletonBlock } from '../components/home/Skeleton'
import Emblem3DCanvas from '../components/home/Emblem3DCanvas'

// Fixed Sections (W1 to W6 + W7 Footer)
import W1Intro from './WhoWeAre/sections/W1Intro'
import W2Team from './WhoWeAre/sections/W2Team'
import { WHO_CONFIG } from '../content/who-we-are'

// Lazy loaded below-the-fold sections
const W3Story = lazy(() => import('./WhoWeAre/sections/W3Story'))
const W4Principles = lazy(() => import('./WhoWeAre/sections/W4Principles'))
const W5Stack = lazy(() => import('./WhoWeAre/sections/W5Stack'))
const W6Contact = lazy(() => import('./WhoWeAre/sections/W6Contact'))
const FooterSection = lazy(() => import('./Home/sections/FooterSection'))

export default function WhoWeAre() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('otp')
  const activeOpenerRef = useRef(null)

  // 3D Thread continuous transform state
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeTeamMember, setActiveTeamMember] = useState(0)
  const [activePrinciple, setActivePrinciple] = useState(0)
  const [scrubberProgress, setScrubberProgress] = useState(0)
  const [ctaHovered, setCtaHovered] = useState(false)

  // Track global scroll progress (0.0 to 1.0)
  useEffect(() => {
    let rafId = null

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll))
      setScrollProgress(progress)
    }

    const onScrollThrottled = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', onScrollThrottled, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScrollThrottled)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Document metadata, canonical, Open Graph, and class scoping
  useEffect(() => {
    const prevTitle = document.title
    document.title = WHO_CONFIG.meta.title
    document.documentElement.classList.add('is-who-page')
    window.scrollTo(0, 0)

    // Set canonical link
    let canonical = document.querySelector('link[rel="canonical"]')
    let createdCanonical = false
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
      createdCanonical = true
    }
    const prevCanonical = canonical.getAttribute('href')
    canonical.setAttribute('href', WHO_CONFIG.meta.canonical)

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    let createdDesc = false
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
      createdDesc = true
    }
    const prevDesc = metaDesc.getAttribute('content')
    metaDesc.setAttribute('content', WHO_CONFIG.meta.description)

    return () => {
      document.title = prevTitle
      document.documentElement.classList.remove('is-who-page')
      if (createdCanonical) {
        canonical.remove()
      } else if (prevCanonical) {
        canonical.setAttribute('href', prevCanonical)
      }
      if (createdDesc) {
        metaDesc.remove()
      } else if (prevDesc) {
        metaDesc.setAttribute('content', prevDesc)
      }
    }
  }, [])

  const handleOpenAuth = useCallback((mode = 'otp', opener = null) => {
    setAuthMode(mode)
    setAuthOpen(true)
    if (opener) activeOpenerRef.current = opener
  }, [])

  return (
    <div className="who-page">
      {/* 0. Accessible Skip Link */}
      <a href="#who-content" className="who-skip-link">
        Skip to main content
      </a>

      {/* 1. Shared Sticky Navigation Bar */}
      <SiteNav onOpenAuth={handleOpenAuth} sticky />

      {/* 2. The 3D Thread: Fixed Canvas behind page content */}
      <Emblem3DCanvas
        scrollProgress={scrollProgress}
        teamMemberIdx={activeTeamMember}
        principleIdx={activePrinciple}
        ctaHovered={ctaHovered}
        scrubberProgress={scrubberProgress}
      />

      {/* 3. Main Editorial Sections */}
      <div id="who-content" className="who-main-content">
        {/* W1: Origin Intro */}
        <W1Intro />

        {/* W2: The Team (Fixed Second Section) */}
        <W2Team onSelectMember={setActiveTeamMember} />

        {/* Below-the-fold sections wrapped in Suspense */}
        <Suspense
          fallback={
            <div className="who-container" style={{ padding: '64px 24px' }}>
              <SkeletonBlock height={320} />
            </div>
          }
        >
          {/* W3: Story as a Scrubbable Timeline */}
          <W3Story onScrubberChange={setScrubberProgress} />

          {/* W4: Principles as a Flip-Through */}
          <W4Principles onSelectPrinciple={setActivePrinciple} />

          {/* W5: Stack (Compact Single-Row Definition List) */}
          <W5Stack />

          {/* W6: Contact & Responsible Use (Glass CTA + Docked Emblem) */}
          <W6Contact onOpenAuth={handleOpenAuth} onCtaHoverChange={setCtaHovered} />

          {/* W7: Shared Editorial Footer */}
          <FooterSection />
        </Suspense>
      </div>

      {/* 4. Shared Auth Dialog Modal */}
      <AuthDialog
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        openerRef={activeOpenerRef}
      />
    </div>
  )
}
