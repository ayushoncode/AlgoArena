import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { WHO_CONFIG } from '../../../content/who-we-are'
import { useAuth } from '../../../hooks/useAuth'
import GlassCta from '../../../components/home/GlassCta'

const { w6Contact } = WHO_CONFIG

export default function W6Contact({ onOpenAuth, onCtaHoverChange }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/lobby')
    } else if (onOpenAuth) {
      onOpenAuth('register')
    }
  }

  const handleMouseEnter = () => {
    if (onCtaHoverChange) onCtaHoverChange(true)
  }

  const handleMouseLeave = () => {
    if (onCtaHoverChange) onCtaHoverChange(false)
  }

  return (
    <section className="who-section who-contact-section surface-bg-1" aria-labelledby="contact-heading">
      <div className="who-container">
        
        {/* Contact Layout */}
        <div className="who-contact-grid">
          
          {/* Left Column: Direct Inquiries & Legal Links */}
          <div className="who-contact-info-col">
            <span className="who-kicker">{w6Contact.kicker}</span>
            <h2 id="contact-heading" className="who-section-title">{w6Contact.title}</h2>
            <p className="who-lead-paragraph">{w6Contact.body}</p>

            <div className="who-contact-meta-list">
              <div className="who-contact-row">
                <span className="who-contact-label">Direct email:</span>
                <a href={`mailto:${w6Contact.email}`} className="who-text-link">
                  {w6Contact.email}
                </a>
              </div>

              <div className="who-contact-row">
                <span className="who-contact-label">Platform rules:</span>
                <span className="who-contact-legal-text">
                  Review our{' '}
                  <Link to="/terms" className="who-text-link">Terms</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="who-text-link">Privacy Policy</Link>
                  {' '}for competition guidelines.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Single Glass CTA with Docked Emblem Lighting */}
          <div className="who-contact-cta-col">
            <div
              className="who-cta-lockup"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onFocus={handleMouseEnter}
              onBlur={handleMouseLeave}
            >
              <p className="who-cta-sentence">{w6Contact.ctaNote}</p>
              <GlassCta onClick={handleCtaClick}>
                {w6Contact.ctaText}
              </GlassCta>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
