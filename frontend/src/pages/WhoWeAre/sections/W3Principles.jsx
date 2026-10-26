import React from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const principles = WHO_CONFIG.w4Principles || WHO_CONFIG.w3Principles || {}
const items = principles.items || []

export default function W3Principles() {
  return (
    <section className="who-section who-principles-section" aria-labelledby="principles-heading">
      <div className="who-container">
        
        {/* Section Header */}
        <div className="who-intro-content" style={{ marginBottom: '48px' }}>
          <span className="who-kicker">{principles.kicker}</span>
          <h2 id="principles-heading" className="who-section-title">
            {principles.title}
          </h2>
          <p className="who-lead-paragraph">
            {principles.subtitle}
          </p>
        </div>

        {/* Numbered Ruled Rows */}
        <div className="who-principles-list" role="list">
          {items.map((principle) => (
            <div key={principle.number} className="who-principle-row" role="listitem">
              <span className="who-principle-num">{principle.number}</span>
              <div className="who-principle-main">
                <h3 className="who-principle-title">{principle.title}</h3>
                <div className="who-principle-content">
                  <p className="who-principle-detail">{principle.sentence || principle.detail}</p>
                  <span className="who-principle-citation">{principle.proof || principle.citation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
