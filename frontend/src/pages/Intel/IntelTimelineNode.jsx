import React from 'react'
import { IconClock, IconExternalLink, IconSwords } from '../../components/icons/index.jsx'

function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function IntelTimelineNode({ round, index, onPracticeTopic }) {
  const roundNumber = String(index + 1).padStart(2, '0')
  const roundType = round.type ? round.type.replace(/_/g, ' ') : `Round ${index + 1}`
  const roundTitle = round.title || roundType.replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="intel-timeline-item">
      {/* Numbered node */}
      <div className="intel-timeline-node" aria-hidden="true">
        {roundNumber}
      </div>

      <div className="intel-timeline-card">
        {/* Round header */}
        <div className="intel-timeline-card-header">
          <div>
            <div className="intel-round-type-tag">
              ROUND // {roundType}
            </div>
            <h3 className="intel-round-title">
              {roundTitle}
            </h3>
          </div>

          {round.durationMinutes && (
            <div className="intel-round-duration">
              <IconClock size={12} />
              <span>{round.durationMinutes} min</span>
            </div>
          )}
        </div>

        {/* Round description */}
        {round.description && (
          <p className="intel-round-desc">
            {round.description}
          </p>
        )}

        {/* Questions list */}
        {Array.isArray(round.questions) && round.questions.length > 0 && (
          <div className="intel-round-questions">
            <p className="intel-round-questions-label">
              Questions asked ({round.questions.length})
            </p>

            <div className="flex flex-col gap-2">
              {round.questions.map((q, qIdx) => (
                <div key={qIdx} className="intel-question-row">
                  <div className="intel-question-content">
                    <p className="intel-question-text">
                      {q.text}
                    </p>

                    <div className="intel-question-meta">
                      {q.topic && (
                        <span className="text-[var(--sub)] font-mono">
                          Topic: <span className="text-[var(--ink)]">{q.topic}</span>
                        </span>
                      )}
                      {q.difficulty && (
                        <span className="text-[var(--sub)] font-mono">
                          Difficulty: <span className="text-[var(--ink)] capitalize">{q.difficulty}</span>
                        </span>
                      )}
                      {isSafeUrl(q.link) ? (
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow ugc"
                          className="inline-flex items-center gap-1 text-[var(--sub)] hover:text-[var(--ink)] transition-colors"
                        >
                          <IconExternalLink size={12} />
                          <span>Link</span>
                        </a>
                      ) : q.link ? (
                        <span className="text-[var(--sub)]">{q.link}</span>
                      ) : null}
                    </div>
                  </div>

                  {q.topic && onPracticeTopic && (
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(q.topic)}
                      className="intel-practice-btn"
                    >
                      <IconSwords size={13} />
                      <span>Practice topic</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
