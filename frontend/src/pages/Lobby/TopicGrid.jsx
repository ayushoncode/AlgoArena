import React, { useState, useEffect } from 'react'
import { IconCheck, IconClose, IconChevronDown } from '../../components/icons'
import api from '../../utils/api'

export default function TopicGrid({
  topics = [],
  selectedTopicId,
  onSelectTopic,
  onSurpriseMe,
}) {
  const [topicStats, setTopicStats] = useState(null)
  const [showAll, setShowAll] = useState(false)

  // Fetch real problem counts per topic from /api/problems/stats
  useEffect(() => {
    api.get('/api/problems/stats')
      .then(({ data }) => {
        if (data?.byTopic) setTopicStats(data.byTopic)
      })
      .catch(() => {})
  }, [])

  // 9 Primary cells: [Any topic] + [1..8 topics from TOPICS]
  const primaryTopics = topics.slice(0, 8)
  const extraTopics = topics.slice(8)

  const selectedTopic = topics.find(t => t.id === selectedTopicId)

  return (
    <section className="lobby-v2-section" aria-label="Topic Selection">
      <div className="lobby-v2-section-head">
        <h2 className="lobby-v2-section-title">
          <span>Topic</span>
        </h2>
        {selectedTopicId && (
          <button
            type="button"
            className="lobby-v2-clear-btn"
            onClick={() => onSelectTopic(null)}
          >
            <IconClose size={12} />
            <span>Clear Selection</span>
          </button>
        )}
      </div>

      <div
        className="lobby-v2-topic-grid"
        role="radiogroup"
        aria-label="Algorithm problem topics"
      >
        {/* Cell 1: Any Topic (Surprise Me) */}
        <button
          type="button"
          role="radio"
          aria-checked={!selectedTopicId}
          className={`lobby-v2-topic-cell ${!selectedTopicId ? 'is-selected' : ''}`}
          onClick={onSurpriseMe}
        >
          <div className="lobby-v2-topic-top">
            <span className="lobby-v2-topic-key">[9]</span>
            {!selectedTopicId && <IconCheck size={14} className="lobby-v2-topic-check" />}
          </div>
          <div>
            <div className="lobby-v2-topic-name">Any topic</div>
            <div className="lobby-v2-topic-count">
              {topicStats ? 'Random topic pick' : 'Surprise me'}
            </div>
          </div>
        </button>

        {/* Cells 2 to 9: Primary Keyed Topics 1 to 8 */}
        {primaryTopics.map((topic, idx) => {
          const isSelected = selectedTopicId === topic.id
          const count = topicStats ? topicStats[topic.id] : null

          return (
            <button
              key={topic.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`lobby-v2-topic-cell ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectTopic(topic.id)}
            >
              <div className="lobby-v2-topic-top">
                <span className="lobby-v2-topic-key">[{idx + 1}]</span>
                {isSelected && <IconCheck size={14} className="lobby-v2-topic-check" />}
              </div>
              <div>
                <div className="lobby-v2-topic-name">{topic.label}</div>
                <div className="lobby-v2-topic-count">
                  {count !== null && count !== undefined ? `${count} problems` : ''}
                </div>
              </div>
            </button>
          )
        })}

        {/* Extra topics expanded */}
        {showAll && extraTopics.map((topic) => {
          const isSelected = selectedTopicId === topic.id
          const count = topicStats ? topicStats[topic.id] : null

          return (
            <button
              key={topic.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`lobby-v2-topic-cell ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectTopic(topic.id)}
            >
              <div className="lobby-v2-topic-top">
                <span className="lobby-v2-topic-key">·</span>
                {isSelected && <IconCheck size={14} className="lobby-v2-topic-check" />}
              </div>
              <div>
                <div className="lobby-v2-topic-name">{topic.label}</div>
                <div className="lobby-v2-topic-count">
                  {count !== null && count !== undefined ? `${count} problems` : ''}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Info Line Under Grid */}
      {selectedTopic && (
        <div className="lobby-v2-topic-info-line" aria-live="polite">
          <span className="lobby-v2-topic-info-desc">{selectedTopic.desc}</span>
          {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && (
            <span className="lobby-v2-topic-subtopics">
              <span className="lobby-v2-subtopics-prefix">Subtopics:</span>{' '}
              <span className="lobby-v2-subtopics-list">{selectedTopic.subtopics.slice(0, 3).join(', ')}</span>
            </span>
          )}
        </div>
      )}

      {/* Expand/Collapse extra topics */}
      {extraTopics.length > 0 && (
        <button
          type="button"
          className="lobby-v2-expand-topics-btn"
          onClick={() => setShowAll(prev => !prev)}
        >
          <IconChevronDown
            size={12}
            style={{
              transform: showAll ? 'rotate(180deg)' : 'none',
              transition: 'transform 120ms ease'
            }}
          />
          <span>{showAll ? 'Show fewer topics' : `More topics (${extraTopics.length})`}</span>
        </button>
      )}
    </section>
  )
}
