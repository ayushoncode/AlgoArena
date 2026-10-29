import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HOME_CONFIG } from '../../../content/home'
import { useAuth } from '../../../hooks/useAuth'
import DepthSection from '../../../components/home/DepthSection'
import { ArenaEmblem } from '../../../components/ArenaLogo'
import './sections.css'

const { s8FinalCall } = HOME_CONFIG

function IconArrowRight({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M0 5.5H14.6M10.3 1.2L14.9 5.5L10.3 9.8" />
    </svg>
  )
}

export default function FinalCtaSection({ onOpenAuth }) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/lobby')
    } else {
      navigate('/signup')
    }
  }

  return (
    <section className="home-section final-cta-section" id="enter-arena" data-mascot-section="finalCall">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s8-final-cta" enter={true} exit={false}>
        <div className="section-container">
          
          <div className="final-cta-card">
            {/* Subtle background ambient flare */}
            <div className="final-cta-flare" aria-hidden="true" />

            <div className="final-cta-content depth-heading-layer">
              <div className="final-cta-emblem-wrap depth-visual-panel anim-enter">
                <ArenaEmblem size={64} glow={true} animate={true} />
              </div>
              <span className="section-kicker">{s8FinalCall.kicker}</span>
              <h2 className="final-cta-title">{s8FinalCall.title}</h2>
              <p className="final-cta-body">{s8FinalCall.body}</p>

              <div className="final-cta-actions">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="final-cta-btn"
                  aria-label={s8FinalCall.cta}
                >
                  <span>{s8FinalCall.cta}</span>
                  <IconArrowRight size={15} className="final-cta-arrow" />
                </button>

                <Link to="/leaderboard" className="final-secondary-link">
                  <span>View leaderboard</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </DepthSection>
    </section>
  )
}
