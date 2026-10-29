import React, { useEffect } from 'react'
import {
  IconChevronLeft,
  IconBookmark,
  IconThumbsUp,
  IconCalendar,
  IconMapPin,
  IconCopy,
  IconFlag,
  IconEdit,
  IconTrash,
  IconClose,
} from '../../components/icons/index.jsx'
import { UserAvatar } from '../../utils/avatar'
import { RankBadge, ToastContainer } from '../../components/ui/index.jsx'
import IntelMonogram from './IntelMonogram.jsx'
import IntelOutcomeMark from './IntelOutcomeMark.jsx'
import IntelDifficultyText from './IntelDifficultyText.jsx'
import { IntelTimelineNode } from './IntelTimelineNode.jsx'

export function IntelReportDetailV2({
  id,
  report,
  loading,
  error,
  toasts,
  dismissToast,
  showReportModal,
  setShowReportModal,
  reportReason,
  setReportReason,
  submittingReport,
  handleToggleHelpful,
  handleToggleBookmark,
  handleShare,
  handleSendReport,
  handleDeleteReport,
  navigate,
  user,
}) {
  // Document title and noindex for authenticated detail
  useEffect(() => {
    if (report?.company) {
      document.title = `${report.company} interview report | AlgoArena`
    }
    let metaRobots = document.querySelector('meta[name="robots"]')
    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.name = 'robots'
      metaRobots.content = 'noindex'
      document.head.appendChild(metaRobots)
    }
  }, [report?.company])

  // Esc key listener for report modal
  useEffect(() => {
    if (!showReportModal) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowReportModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showReportModal, setShowReportModal])

  // Loading Skeleton State
  if (loading) {
    return (
      <main className="intel-v2" role="main" aria-label="Interview report loading">
        <div className="intel-v2-container">
          <div className="intel-detail-layout">
            <div className="intel-skeleton-block" style={{ width: 140, height: 24, borderRadius: 4 }} />
            <div className="intel-detail-header-card">
              <div className="flex items-start gap-4">
                <div className="intel-skeleton-block" style={{ width: 56, height: 56, borderRadius: 4 }} />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="intel-skeleton-block" style={{ width: '40%', height: 28, borderRadius: 4 }} />
                  <div className="intel-skeleton-block" style={{ width: '25%', height: 16, borderRadius: 4 }} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="intel-skeleton-block" style={{ height: 48, borderRadius: 3 }} />
                ))}
              </div>
            </div>
            <div className="intel-skeleton-block" style={{ height: 180, borderRadius: 4 }} />
          </div>
        </div>
      </main>
    )
  }

  // Error State
  if (error || !report) {
    return (
      <main className="intel-v2" role="main" aria-label="Interview report error">
        <div className="intel-v2-container">
          <div className="intel-detail-layout text-center py-16">
            <div className="intel-auth-gate-box">
              <h1 className="intel-auth-gate-h1">{error || 'Report not found'}</h1>
              <p className="intel-auth-gate-copy">
                The interview report you requested could not be loaded or may be pending moderation review.
              </p>
              <button
                type="button"
                onClick={() => navigate('/experiences')}
                className="intel-btn-primary"
              >
                <IconChevronLeft size={16} />
                <span>BACK TO INTEL REPORTS</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const isOwner = Boolean(user && report.author?.id === user.id)
  const isAnonymous = Boolean(
    report.is_anonymous ||
    !report.author ||
    !report.author.username ||
    report.author.username === 'Anonymous'
  )

  const handlePracticeTopic = (topic) => {
    navigate(`/lobby?topic=${encodeURIComponent(topic)}`)
  }

  return (
    <main className="intel-v2" role="main" aria-label={`${report.company} interview report`}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="intel-v2-container">
        <div className="intel-detail-layout">

          {/* Back Navigation Link */}
          <button
            type="button"
            onClick={() => navigate('/experiences')}
            className="intel-back-btn"
            aria-label="Back to interview reports list"
          >
            <IconChevronLeft size={16} />
            <span>All reports</span>
          </button>

          {/* Pending Review Notice for Author */}
          {report.status === 'pending' && (
            <div className="intel-pending-notice" role="alert">
              <strong>Pending review:</strong> This report is currently visible only to you while our moderators verify its content.
            </div>
          )}

          {/* Header Dossier Box */}
          <section className="intel-detail-header-card" aria-label="Report overview">
            <div className="intel-detail-header-top">
              <div className="intel-detail-title-group">
                <IntelMonogram name={report.company} />
                <div className="intel-detail-title-info">
                  <div className="intel-detail-h1-row">
                    <h1 className="intel-detail-h1">
                      {report.company}
                    </h1>
                    <span className="intel-pill">
                      {report.track?.toUpperCase()} TRACK
                    </span>
                  </div>
                  <p className="intel-detail-role">
                    {report.role_title}
                  </p>
                </div>
              </div>

              {/* Status & Outcome */}
              <div className="intel-detail-chips">
                <IntelOutcomeMark outcome={report.outcome} />
                {report.difficulty && (
                  <IntelDifficultyText difficulty={report.difficulty} />
                )}
              </div>
            </div>

            {/* Key Facts Definition Grid */}
            <div className="intel-detail-facts-grid">
              <div className="intel-detail-fact">
                <span className="intel-detail-fact-label">
                  <IconCalendar size={12} /> Year / Month
                </span>
                <span className="intel-detail-fact-value">
                  {report.year} {report.month ? `/ Month ${report.month}` : ''}
                </span>
              </div>

              {report.location && (
                <div className="intel-detail-fact">
                  <span className="intel-detail-fact-label">
                    <IconMapPin size={12} /> Location
                  </span>
                  <span className="intel-detail-fact-value">
                    {report.location}
                  </span>
                </div>
              )}

              {report.source && (
                <div className="intel-detail-fact">
                  <span className="intel-detail-fact-label">
                    Source
                  </span>
                  <span className="intel-detail-fact-value uppercase">
                    {report.source.replace('_', ' ')}
                  </span>
                </div>
              )}

              {(report.stipend_range || report.ctc_range) && (
                <div className="intel-detail-fact">
                  <span className="intel-detail-fact-label">
                    Compensation
                  </span>
                  <span className="intel-detail-fact-value">
                    {report.stipend_range || report.ctc_range}
                  </span>
                </div>
              )}
            </div>

            {/* Author and Action Bar */}
            <div className="intel-detail-footer-bar">
              {/* Author Info */}
              {isAnonymous ? (
                <span className="intel-detail-author-static">
                  Written by Anonymous
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/profile/${report.author.username}`)}
                  className="intel-detail-author-btn"
                  title={`View ${report.author.username}'s profile`}
                >
                  <UserAvatar
                    username={report.author.username}
                    seed={report.author.avatar_seed}
                    style={report.author.avatar_style}
                    elo={report.author.elo_rating}
                    size={32}
                  />
                  <div className="flex flex-col text-left">
                    <span className="intel-detail-author-name">
                      {report.author.username}
                    </span>
                    {report.author.elo_rating && (
                      <RankBadge elo={report.author.elo_rating} size="xs" />
                    )}
                  </div>
                </button>
              )}

              {/* Action Buttons */}
              <div className="intel-detail-actions">
                <button
                  type="button"
                  onClick={handleToggleHelpful}
                  className={`intel-action-btn ${report.is_helpful ? 'is-active' : ''}`}
                  title="Mark as helpful"
                  aria-pressed={Boolean(report.is_helpful)}
                >
                  <IconThumbsUp size={13} filled={Boolean(report.is_helpful)} />
                  <span>Helpful ({report.helpful_count || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  className={`intel-action-btn ${report.is_bookmarked ? 'is-active' : ''}`}
                  title="Bookmark report"
                  aria-pressed={Boolean(report.is_bookmarked)}
                >
                  <IconBookmark size={13} filled={Boolean(report.is_bookmarked)} />
                  <span>{report.is_bookmarked ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="intel-action-icon-btn"
                  title="Share link"
                  aria-label="Share report link"
                >
                  <IconCopy size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="intel-action-icon-btn intel-action-destructive"
                  title="Report inappropriate content"
                  aria-label="Report inappropriate content"
                >
                  <IconFlag size={15} />
                </button>

                {/* Owner Actions */}
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/experiences/${id}/edit`)}
                      className="intel-action-icon-btn"
                      title="Edit report"
                      aria-label="Edit report"
                    >
                      <IconEdit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteReport}
                      className="intel-action-icon-btn intel-action-destructive"
                      title="Delete report"
                      aria-label="Delete report"
                    >
                      <IconTrash size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Overall Experience */}
          {report.overall_experience && (
            <section className="intel-detail-section" aria-label="Overall experience">
              <h2 className="intel-detail-section-title">
                Overall experience
              </h2>
              <div className="intel-detail-prose-card">
                {report.overall_experience}
              </div>
            </section>
          )}

          {/* Rounds Breakdown Timeline */}
          {Array.isArray(report.rounds) && report.rounds.length > 0 && (
            <section className="intel-timeline-wrapper" aria-label="Interview rounds">
              <h2 className="intel-detail-section-title">
                Rounds ({report.rounds.length})
              </h2>

              <div className="intel-timeline-spine">
                {report.rounds.map((round, rIdx) => (
                  <IntelTimelineNode
                    key={rIdx}
                    round={round}
                    index={rIdx}
                    onPracticeTopic={handlePracticeTopic}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Tips and Prep Resources */}
          {(report.tips || report.prep_resources) && (
            <div className="intel-detail-grid-two">
              {report.tips && (
                <section className="intel-detail-section" aria-label="Tips">
                  <h2 className="intel-detail-section-title">
                    Tips
                  </h2>
                  <div className="intel-detail-prose-card">
                    {report.tips}
                  </div>
                </section>
              )}

              {report.prep_resources && (
                <section className="intel-detail-section" aria-label="Prep resources">
                  <h2 className="intel-detail-section-title">
                    Prep resources
                  </h2>
                  <div className="intel-detail-prose-card">
                    {report.prep_resources}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Quiet Footer Note */}
          <footer className="intel-detail-footer">
            <p className="intel-detail-footer-note">
              Written by a player. Not verified by AlgoArena.
            </p>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="intel-report-link"
            >
              Report this post
            </button>
          </footer>

        </div>
      </div>

      {/* Report Modal Dialog */}
      {showReportModal && (
        <div
          className="intel-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intel-report-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReportModal(false)
            }
          }}
        >
          <div className="intel-dialog-panel">
            <div className="intel-dialog-header">
              <h3 id="intel-report-title" className="intel-dialog-title">
                Report interview report
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="intel-action-icon-btn"
                style={{ width: 36, height: 36, minHeight: 36, minWidth: 36 }}
                aria-label="Close dialog"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="intel-dialog-body">
              <p className="intel-dialog-desc">
                Please specify why you are reporting this experience report. Flagged posts exceeding threshold will be sent for moderation.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for report (e.g. NDA violation, inappropriate content, fake report)..."
                rows={4}
                className="intel-dialog-textarea"
                autoFocus
              />
            </div>

            <div className="intel-dialog-footer">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="intel-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReport || !reportReason.trim()}
                onClick={handleSendReport}
                className="intel-btn-primary intel-btn-destructive-confirm"
              >
                {submittingReport ? 'SUBMITTING...' : 'SUBMIT REPORT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
