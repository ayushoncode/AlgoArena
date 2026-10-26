import React, { useState, useEffect, useRef } from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const { w2WhyItExists } = WHO_CONFIG

export default function W2WhyItExists() {
  const [activeIndex, setActiveIndex] = useState(0)
  const plateRefs = useRef([])

  useEffect(() => {
    // Scroll-driven observer with rAF fallback to highlight current milestone plate
    const handleScroll = () => {
      if (typeof window === 'undefined') return
      const centerY = window.innerHeight * 0.55

      let closestIdx = 0
      let minDistance = Infinity

      plateRefs.current.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const plateCenter = rect.top + rect.height * 0.5
        const distance = Math.abs(plateCenter - centerY)
        if (distance < minDistance) {
          minDistance = distance
          closestIdx = idx
        }
      })

      setActiveIndex(closestIdx)
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

  return (
    <section className="who-section who-story-section surface-bg-1" aria-labelledby="story-heading">
      <div className="who-container">
        
        {/* Editorial Two-Column Story */}
        <div className="who-story-grid">
          <div className="who-story-left">
            <span className="who-kicker">{w2WhyItExists.kicker}</span>
            <h2 id="story-heading" className="who-section-title">
              {w2WhyItExists.title}
            </h2>
          </div>

          <div className="who-story-right">
            {w2WhyItExists.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="who-body-text">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* 3D Milestone Plate Stack */}
        <div className="who-plate-stack-wrapper">
          <div className="who-timeline-header">
            <span className="who-timeline-label">{w2WhyItExists.milestoneKicker}</span>
          </div>

          <div className="who-plate-stage-3d" role="list">
            {w2WhyItExists.milestones.map((milestone, idx) => {
              const isActive = idx === activeIndex
              const depthOffset = isActive ? 32 : -Math.min(32, Math.abs(idx - activeIndex) * 12)

              return (
                <div
                  key={milestone.date + milestone.title}
                  ref={(el) => (plateRefs.current[idx] = el)}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => setActiveIndex(idx)}
                  onFocus={() => setActiveIndex(idx)}
                  className={`who-milestone-plate ${isActive ? 'is-active' : ''}`}
                  style={{
                    transform: `translateZ(${depthOffset}px)`,
                  }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="who-milestone-date">{milestone.date}</span>
                  <div className="who-milestone-body">
                    <h3 className="who-milestone-title">{milestone.title}</h3>
                    <p className="who-milestone-summary">{milestone.summary}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
