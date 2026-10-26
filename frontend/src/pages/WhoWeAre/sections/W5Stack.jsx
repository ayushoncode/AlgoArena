import React from 'react'
import { WHO_CONFIG } from '../../../content/who-we-are'

const { w5Stack } = WHO_CONFIG

export default function W5Stack() {
  return (
    <section className="who-section who-stack-section" aria-labelledby="stack-heading">
      <div className="who-container">
        
        {/* Compact Header */}
        <div className="who-stack-header">
          <span className="who-kicker">{w5Stack.kicker}</span>
          <h2 id="stack-heading" className="who-section-title">{w5Stack.title}</h2>
        </div>

        {/* Single-Row Definition List */}
        <dl className="who-compact-stack-dl">
          {w5Stack.techSpecs.map((spec) => (
            <div key={spec.label} className="who-compact-stack-item">
              <dt className="who-compact-stack-term">{spec.label}</dt>
              <dd className="who-compact-stack-def">{spec.value}</dd>
            </div>
          ))}
        </dl>

        {/* Verified GitHub Repository Link */}
        {w5Stack.repoUrl && (
          <div className="who-stack-action-row">
            <a
              href={w5Stack.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="who-repo-link"
            >
              <span>View repository on GitHub</span>
              <svg className="who-repo-arrow" viewBox="0 0 10 9" aria-hidden="true">
                <path d="M0 4.5 H9.1 M5.4 0.9 L9.2 4.5 L5.4 8.1" />
              </svg>
            </a>
          </div>
        )}

      </div>
    </section>
  )
}
