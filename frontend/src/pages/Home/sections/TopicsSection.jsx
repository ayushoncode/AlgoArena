import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HOME_CONFIG } from '../../../content/home'
import { IconArrowRight } from '../../../components/icons'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s5Topics } = HOME_CONFIG

export default function TopicsSection() {
  const [countsByTopic, setCountsByTopic] = useState({})

  // Optionally fetch real-time problem stats from backend, falling back to cached config
  useEffect(() => {
    let isMounted = true
    async function fetchStats() {
      try {
        const res = await fetch('/api/problems/stats')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data?.byTopic) {
            setCountsByTopic(data.byTopic)
          }
        }
      } catch {
        // Retain fallback counts from config
      }
    }
    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="home-section surface-bg-1" id="curriculum">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s5-topics" enter={true} exit={true}>
        <div className="section-container">
          
          {/* Editorial Section Header */}
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s5Topics.kicker}</span>
            <h2 className="section-title">{s5Topics.title}</h2>
            <p className="section-body">{s5Topics.body}</p>
          </div>

          {/* Editorial Ruled Rows List */}
          <div className="topics-ruled-list" role="list">
            {s5Topics.items.map((topic) => {
              const liveCount = countsByTopic[topic.id] ?? topic.count ?? 0
              return (
                <Link
                  key={topic.id}
                  to={`/lobby?topic=${topic.id}`}
                  className="topic-ruled-row stagger-row"
                  role="listitem"
                  aria-label={`${topic.title}: ${liveCount} problems`}
                >
                  <div className="topic-row-left">
                    <span className="topic-index">{topic.index}</span>
                    <div className="topic-text-block">
                      <span className="topic-title">{topic.title}</span>
                      <span className="topic-desc">{topic.desc}</span>
                    </div>
                  </div>

                  <div className="topic-row-right">
                    <span className="topic-count-badge">
                      {liveCount} {liveCount === 1 ? 'problem' : 'problems'}
                    </span>
                    <div className="topic-arrow-wrap">
                      <IconArrowRight size={16} className="topic-arrow" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Catalog footer summary */}
          <div className="topics-catalog-footer">
            <span className="catalog-total-stat">
              209 problems cataloged across 4,454 verified test vectors
            </span>
            <Link to="/lobby" className="catalog-lobby-link">
              <span>Browse complete catalog</span>
              <IconArrowRight size={14} />
            </Link>
          </div>

        </div>
      </DepthSection>
    </section>
  )
}
