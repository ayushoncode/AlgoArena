import React, { useState, useRef, useEffect, useCallback } from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const { w2Team } = WHO_CONFIG

function getSocialLinkClass(label) {
  const norm = (label || '').trim().toLowerCase()
  if (norm.includes('github')) return 'who-link-github'
  if (norm.includes('linkedin')) return 'who-link-linkedin'
  if (norm.includes('portfolio')) return 'who-link-portfolio'
  if (norm.includes('email')) return 'who-link-email'
  return ''
}

export default function W2Team({ onSelectMember }) {
  const members = w2Team?.members || []
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [expandedMobileIdx, setExpandedMobileIdx] = useState(0)
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0 })
  const buttonRefs = useRef([])
  const plateRef = useRef(null)

  // Guard: if empty, hide section completely
  if (!members || members.length === 0) {
    return null
  }

  const selectedMember = members[selectedIdx] || members[0]

  const handleSelect = useCallback((idx) => {
    setSelectedIdx(idx)
    setExpandedMobileIdx(idx)
    if (onSelectMember) onSelectMember(idx)
  }, [onSelectMember])

  // Keyboard navigation for roving tabindex
  const handleKeyDown = (e, idx) => {
    let nextIdx = idx
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      nextIdx = (idx + 1) % members.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nextIdx = (idx - 1 + members.length) % members.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIdx = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIdx = members.length - 1
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSelect(idx)
      return
    } else {
      return
    }

    handleSelect(nextIdx)
    if (buttonRefs.current[nextIdx]) {
      buttonRefs.current[nextIdx].focus()
    }
  }

  // Pointer hover on desktop with fine pointer
  const handleMouseEnter = (idx) => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      handleSelect(idx)
    }
  }

  // 3D Tilt on portrait plate (max 8deg on each axis, lerped, disabled on touch / reduced motion)
  const handleMouseMove = (e) => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!plateRef.current) return

    const rect = plateRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left // 0 to rect.width
    const y = e.clientY - rect.top  // 0 to rect.height

    const normX = (x / rect.width - 0.5) * 2  // -1 to 1
    const normY = (y / rect.height - 0.5) * 2 // -1 to 1

    const rotY = Number((normX * 8).toFixed(2))
    const rotX = Number((-normY * 8).toFixed(2))

    setTilt({ rotX, rotY })
  }

  const handleMouseLeave = () => {
    setTilt({ rotX: 0, rotY: 0 })
  }

  // If only one member, render directly without the list
  if (members.length === 1) {
    const single = members[0]
    return (
      <section className="who-section who-team-section surface-bg-1" aria-labelledby="team-heading">
        <div className="who-container">
          <span className="who-kicker">{w2Team.kicker}</span>
          <h2 id="team-heading" className="who-section-title">{w2Team.title}</h2>
          <div className="who-single-member-card">
            <h3 className="who-single-name">{single.name}</h3>
            <p className="who-member-role">{single.role}</p>
            <p className="who-member-statement">{single.statement}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="who-section who-team-section surface-bg-1" aria-labelledby="team-heading">
      <div className="who-container">
        
        {/* Section Header */}
        <div className="who-team-header">
          <span className="who-kicker">{w2Team.kicker}</span>
          <h2 id="team-heading" className="who-section-title">{w2Team.title}</h2>
          <p className="who-lead-paragraph">{w2Team.subtitle}</p>
        </div>

        {/* Desktop Interactive Selector (Two Columns) */}
        <div className="who-team-desktop-layout">
          
          {/* Left Column: Vertical List of Names in Sora Display */}
          <div
            className="who-team-names-col"
            role="tablist"
            aria-label="AlgoArena engineering team"
          >
            {members.map((member, idx) => {
              const isSelected = selectedIdx === idx
              return (
                <button
                  key={member.id}
                  ref={(el) => (buttonRefs.current[idx] = el)}
                  role="tab"
                  id={`tab-${member.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${member.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`who-team-name-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <span className="who-team-name-index" aria-hidden="true">
                    0{idx + 1}
                  </span>
                  <span className="who-team-name-text">
                    {member.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right Column: Portrait Plate + Details (200ms Cross-fade Swap) */}
          <div
            key={selectedMember.id}
            id={`panel-${selectedMember.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${selectedMember.id}`}
            aria-live="polite"
            className="who-team-detail-col who-team-crossfade"
          >
            {/* 3D Tilt Portrait Plate Stage */}
            <div className="who-portrait-stage-3d">
              {/* Offset Backplate for Depth (Hairline Edge, No Glow, No Shadow) */}
              <div className="who-portrait-backplate" aria-hidden="true" />

              {/* Foreground Tilt Card */}
              <div
                ref={plateRef}
                className="who-portrait-plate-card"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `perspective(800px) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`,
                }}
              >
                {selectedMember.photo ? (
                  <img
                    src={selectedMember.photo}
                    alt={selectedMember.name}
                    width="220"
                    height="280"
                    loading="lazy"
                    decoding="async"
                    className="who-portrait-photo"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}

                {/* Monogram Fallback Plate (Initials in Sora, Single Colour) */}
                <div
                  className="who-monogram-plate"
                  style={{ display: selectedMember.photo ? 'none' : 'flex' }}
                  aria-hidden="true"
                >
                  <span className="who-monogram-initials">{selectedMember.initials}</span>
                </div>
              </div>
            </div>

            {/* Member Details */}
            <div className="who-member-details-body">
              <div className="who-member-role-badge">
                {selectedMember.role}
              </div>

              {/* Bio: Exactly One Sentence (<= 15 words) */}
              <p className="who-member-sentence">
                {selectedMember.statement}
              </p>

              {/* Text Links (GitHub, LinkedIn, Email / Portfolio) with dedicated theme colors */}
              <div className="who-member-links-row">
                {selectedMember.links?.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`who-member-text-link ${getSocialLinkClass(link.label)}`}
                  >
                    {link.label}
                  </a>
                ))}
                {selectedMember.email && (
                  <a
                    href={`mailto:${selectedMember.email}`}
                    className="who-member-text-link who-link-email"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Accordion View (< 768px): Names stack and open inline with tap */}
        <div className="who-team-mobile-accordion" role="region" aria-label="Team members accordion">
          {members.map((member, idx) => {
            const isOpen = expandedMobileIdx === idx
            return (
              <div key={member.id} className={`who-accordion-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="who-accordion-header-btn"
                  onClick={() => setExpandedMobileIdx(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`mobile-panel-${member.id}`}
                >
                  <span className="who-accordion-name">{member.name}</span>
                  <span className="who-accordion-role">{member.role}</span>
                  <span className="who-accordion-toggle" aria-hidden="true">
                    {isOpen ? '-' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div id={`mobile-panel-${member.id}`} className="who-accordion-body">
                    {/* Inline Portrait */}
                    <div className="who-accordion-portrait">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          width="120"
                          height="150"
                          loading="lazy"
                          className="who-accordion-photo"
                        />
                      ) : (
                        <div className="who-monogram-plate small">
                          <span>{member.initials}</span>
                        </div>
                      )}
                    </div>

                    <p className="who-member-sentence">{member.statement}</p>

                    <div className="who-member-links-row">
                      {member.links?.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`who-member-text-link ${getSocialLinkClass(link.label)}`}
                        >
                          {link.label}
                        </a>
                      ))}
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="who-member-text-link who-link-email">
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
