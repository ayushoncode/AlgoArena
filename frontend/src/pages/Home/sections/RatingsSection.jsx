import React from 'react'
import { Link } from 'react-router-dom'
import { HOME_CONFIG } from '../../../content/home'
import { IconTrophy, IconArrowRight } from '../../../components/icons'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s3Ratings } = HOME_CONFIG

export default function RatingsSection() {
  return (
    <section className="home-section surface-bg-1" id="ratings" data-mascot-section="ratings">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s3-ratings" enter={true} exit={true}>
        <div className="section-container">
          
          {/* Editorial Section Header */}
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s3Ratings.kicker}</span>
            <h2 className="section-title">{s3Ratings.title}</h2>
            <p className="section-body">{s3Ratings.description}</p>
          </div>

          {/* 6-Tier 3D Rank Plates Showcase Grid (3x2 on desktop) */}
          <div className="tier-plates-grid" role="list" aria-label="Competitive Rank Tiers">
          {s3Ratings.tiers.map((tier, index) => (
            <div
              key={tier.title}
              className="tier-showcase-card"
              style={{
                '--tier-color': tier.color,
                '--tier-glow': `${tier.color}26`,
              }}
              role="listitem"
            >
              {/* Colored Top Accent Rail */}
              <div className="tier-card-accent" />

              <div className="tier-card-content">
                {/* Meta Header: Tier number & Badge */}
                <div className="tier-card-header">
                  <span className="tier-card-num">DIVISION {tier.tierNum}</span>
                  <span className="tier-card-badge" style={{ color: tier.color, borderColor: `${tier.color}55`, background: `${tier.color}15` }}>
                    {tier.badge}
                  </span>
                </div>

                {/* Tier Title & Rating Bounds */}
                <div className="tier-title-group">
                  <h3 className="tier-card-title">{tier.title}</h3>
                  <div className="tier-range-pill">
                    <span className="tier-range-val">
                      {tier.max ? `${tier.min} - ${tier.max} Elo` : `${tier.min}+ Elo`}
                    </span>
                  </div>
                </div>

                {/* Editorial Description */}
                <p className="tier-card-desc">{tier.desc}</p>

                {/* Footer specs */}
                <div className="tier-card-footer">
                  <div className="tier-kfactor-tag">
                    <span className="kfactor-label">CALIBRATION</span>
                    <span className="kfactor-val">{tier.kFactor}</span>
                  </div>

                  {/* 6-Step Visual Progression Meter */}
                  <div className="tier-ladder-dots" aria-label={`Rank step ${6 - index} of 6`}>
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <span
                        key={step}
                        className={`ladder-dot ${step <= (6 - index) ? 'dot-filled' : ''}`}
                        style={step <= (6 - index) ? { backgroundColor: tier.color } : {}}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Footer Callout */}
        <div className="ratings-footer-note">
          <div className="footer-note-left">
            <IconTrophy size={16} className="note-trophy-icon" />
            <span>Ratings update immediately upon match settlement. Placement matches utilize K=48 calibration.</span>
          </div>
          <Link to="/leaderboard" className="catalog-lobby-link">
            <span>View live leaderboard</span>
            <IconArrowRight size={14} />
          </Link>
        </div>

        </div>
      </DepthSection>
    </section>
  )
}
