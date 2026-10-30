import React, { useState } from 'react'
import { HOME_CONFIG } from '../../../content/home'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s7Questions } = HOME_CONFIG

function IconPlus({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M8 2.5V13.5M2.5 8H13.5" />
    </svg>
  )
}

export default function FaqSection() {
  const [openIndices, setOpenIndices] = useState([0]) // First question open by default

  const toggleIndex = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  return (
    <section className="home-section" id="faq" data-mascot-section="questions">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s7-faq" enter={true} exit={true}>
        <div className="section-container">
          
          {/* Editorial Section Header */}
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s7Questions.kicker}</span>
            <h2 className="section-title">{s7Questions.title}</h2>
          </div>

          {/* FAQ Accordion List */}
          <div className="faq-accordion-list">
            {s7Questions.items.map((item, idx) => {
              const isOpen = openIndices.includes(idx)
              const questionId = `faq-q-${idx}`
              const answerId = `faq-a-${idx}`
              const indexStr = idx < 9 ? `0${idx + 1}` : `${idx + 1}`

              return (
                <div key={idx} className={`faq-accordion-item stagger-row ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    id={questionId}
                    className="faq-question-trigger"
                    onClick={() => toggleIndex(idx)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                  >
                    <span className="faq-item-index">{indexStr}</span>
                    <span className="faq-question-text">{item.q}</span>
                    <span className={`faq-toggle-icon ${isOpen ? 'icon-rotated' : ''}`} aria-hidden="true">
                      <IconPlus size={16} />
                    </span>
                  </button>

                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    className={`faq-answer-collapse ${isOpen ? 'is-expanded' : ''}`}
                  >
                    <div className="faq-answer-inner">
                      <p className="faq-answer-text">{item.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </DepthSection>
    </section>
  )
}
