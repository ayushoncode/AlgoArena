import React, { useMemo } from 'react'
import IntelOutcomeMark from './IntelOutcomeMark'
import IntelMonogram from './IntelMonogram'
import { UserAvatar } from '../../utils/avatar'
import { IconThumbsUp, IconBookmark } from '../../components/icons/index.jsx'

/**
 * IntelReportRow — Ruled list row for interview reports
 * ───────────────────────────────────────────────────────
 * Renders an experience item as an architectural, calm ruled row.
 * Adheres strictly to privacy, safe linking, and plain text rendering.
 */
export default function IntelReportRow({
  report,
  onClick,
  onToggleHelpful,
  onToggleBookmark,
}) {
  const {
    id,
    company,
    role_title,
    track,
    outcome,
    difficulty,
    location,
    year,
    month,
    created_at,
    rounds,
    overall_experience,
    helpful_count = 0,
    is_helpful = false,
    is_bookmarked = false,
    is_anonymous = false,
    status,
    author,
  } = report

  // Date in mono
  const formattedDate = useMemo(() => {
    if (year) {
      if (month) {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ]
        const mStr = monthNames[month - 1] || ''
        return `${mStr} ${year}`.trim()
      }
      return String(year)
    }
    if (created_at) {
      return created_at.slice(0, 10)
    }
    return ''
  }, [year, month, created_at])

  // Extract unique topic names from all rounds
  const topicsList = useMemo(() => {
    if (!Array.isArray(rounds)) return ''
    const set = new Set()
    rounds.forEach((rnd) => {
      if (Array.isArray(rnd.questions)) {
        rnd.questions.forEach((q) => {
          if (q.topic) set.add(q.topic.trim())
        })
      }
    })
    return Array.from(set).join(', ')
  }, [rounds])

  const roundsCount = Array.isArray(rounds) ? rounds.length : 0

  // Author identity (Privacy strict: Never render institute, no avatar for anonymous)
  const isAnon = Boolean(is_anonymous || author?.is_anonymous || !author?.username)
  const authorName = isAnon ? 'Anonymous' : author.username

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="intel-row"
      aria-label={`${company || 'Company'} interview report, ${role_title || 'Role'}`}
    >
      {/* Line 1: Monogram, Company name, role title, right-aligned date */}
      <div className="intel-row-line-1">
        <div className="intel-row-title-group">
          <IntelMonogram name={company} />
          <span className="intel-company-name">{company || 'Company'}</span>
          {role_title && <span className="intel-role-title">{role_title}</span>}
          {status === 'pending' && (
            <span className="intel-pending-badge">Pending review</span>
          )}
        </div>

        {formattedDate && <span className="intel-date">{formattedDate}</span>}
      </div>

      {/* Line 2: Mono labels (track, outcome with mark, difficulty, rounds, location) */}
      <div className="intel-row-line-2">
        <span className="intel-meta-item">
          {track === 'sde' ? 'SDE' : 'INTERN'}
        </span>

        <span className="intel-meta-sep" aria-hidden="true">•</span>

        <IntelOutcomeMark outcome={outcome} />

        {difficulty && (
          <>
            <span className="intel-meta-sep" aria-hidden="true">•</span>
            <span className="intel-meta-item" style={{ textTransform: 'uppercase' }}>
              {difficulty}
            </span>
          </>
        )}

        <span className="intel-meta-sep" aria-hidden="true">•</span>
        <span className="intel-meta-item">
          {roundsCount} {roundsCount === 1 ? 'round' : 'rounds'}
        </span>

        {location && (
          <>
            <span className="intel-meta-sep" aria-hidden="true">•</span>
            <span className="intel-meta-item">{location}</span>
          </>
        )}
      </div>

      {/* Summary Snippet: Clipped 2 lines, plain text */}
      {overall_experience && (
        <p className="intel-row-summary">{overall_experience}</p>
      )}

      {/* Row Footer: Topics, Author, and Actions (Helpful, Bookmark) */}
      <div className="intel-row-footer">
        <div className="intel-author-group">
          {!isAnon && author && (
            <div className="intel-author-avatar" aria-hidden="true">
              <UserAvatar user={author} size={18} />
            </div>
          )}
          <span>{authorName}</span>

          {topicsList && (
            <>
              <span className="intel-meta-sep" aria-hidden="true">•</span>
              <span className="intel-topic-tags">{topicsList}</span>
            </>
          )}
        </div>

        <div className="intel-actions-group">
          <button
            type="button"
            title="Mark as helpful"
            aria-pressed={is_helpful}
            onClick={(e) => onToggleHelpful(e, id)}
            className={`intel-action-btn ${is_helpful ? 'is-active' : ''}`}
          >
            <IconThumbsUp size={14} filled={is_helpful} />
            <span>{helpful_count}</span>
          </button>

          <button
            type="button"
            title="Bookmark report"
            aria-pressed={is_bookmarked}
            onClick={(e) => onToggleBookmark(e, id)}
            className={`intel-action-btn ${is_bookmarked ? 'is-active' : ''}`}
          >
            <IconBookmark size={14} filled={is_bookmarked} />
          </button>
        </div>
      </div>
    </div>
  )
}
