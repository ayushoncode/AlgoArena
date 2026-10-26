import React, { useState, useEffect, useRef } from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const { w4Team } = WHO_CONFIG

export default function W4Team() {
  const [tiltAngles, setTiltAngles] = useState({})
  const rowRefs = useRef([])

  // Scroll scrubbing for 3D portrait plates (rotateY -10deg, rotateX 4deg leveling to 0)
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return
      const vh = window.innerHeight
      const nextAngles = {}

      rowRefs.current.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        // Compute progress as plate travels from lower viewport into focus
        const enterPoint = vh * 0.95
        const levelPoint = vh * 0.55
        const progress = Math.max(0, Math.min(1, (enterPoint - rect.top) / (enterPoint - levelPoint)))

        // Tilt levels from (-10deg, 4deg) to (0deg, 0deg)
        const rotY = (1 - progress) * -10
        const rotX = (1 - progress) * 4
        nextAngles[idx] = { rotY: Number(rotY.toFixed(2)), rotX: Number(rotX.toFixed(2)), isLevel: progress >= 0.95 }
      })

      setTiltAngles(nextAngles)
    }

    let rafId = null
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

  if (!w4Team || !w4Team.members || w4Team.members.length === 0) {
    return null
  }

  return (
    <section className="who-section who-team-section surface-bg-1" aria-labelledby="team-heading">
      <div className="who-container">
        
        {/* Section Header */}
        <div className="who-intro-content" style={{ marginBottom: '48px' }}>
          <span className="who-kicker">{w4Team.kicker}</span>
          <h2 id="team-heading" className="who-section-title">
            {w4Team.title}
          </h2>
          <p className="who-lead-paragraph">
            {w4Team.subtitle}
          </p>
        </div>

        {/* Ruled Editorial Rows */}
        <div className="who-team-list" role="list">
          {w4Team.members.map((member, idx) => {
            const tilt = tiltAngles[idx] || { rotY: -10, rotX: 4, isLevel: false }

            return (
              <div
                key={member.id}
                ref={(el) => (rowRefs.current[idx] = el)}
                className="who-team-row"
                role="listitem"
              >
                {/* 3D Portrait Plate */}
                <div className="who-portrait-stage">
                  <div
                    className={`who-portrait-plate ${tilt.isLevel ? 'is-level' : ''}`}
                    style={{
                      transform: `perspective(1000px) rotateY(${tilt.rotY}deg) rotateX(${tilt.rotX}deg)`,
                    }}
                  >
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        width="112"
                        height="144"
                        loading="lazy"
                        decoding="async"
                        className="who-portrait-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className="who-portrait-monogram"
                      style={{ display: member.photo ? 'none' : 'flex' }}
                      aria-label={member.name}
                    >
                      {member.initials}
                    </div>
                  </div>
                </div>

                {/* Member Details */}
                <div className="who-member-details">
                  <div className="who-member-header">
                    <h3 className="who-member-name">{member.name}</h3>
                    <span className="who-member-role">{member.role}</span>
                  </div>

                  <p className="who-member-statement">{member.statement}</p>

                  {member.links && member.links.length > 0 && (
                    <div className="who-member-links">
                      {member.links.map((link, linkIdx) => (
                        <React.Fragment key={link.label}>
                          {linkIdx > 0 && <span className="who-link-separator" aria-hidden="true">/</span>}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="who-text-link"
                          >
                            {link.label}
                          </a>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
