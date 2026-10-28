import React from 'react'
import IntelFilterBar from './IntelFilterBar'
import IntelReportRow from './IntelReportRow'
import IntelInsightsStrip from './IntelInsightsStrip'
import { IconPlus, IconChevronLeft, IconChevronRight } from '../../components/icons/index.jsx'

/**
 * IntelReportsListV2: Presentational List View for Intel Reports
 * ─────────────────────────────────────────────────────────────
 * Renders the calm, trustworthy reference library layout:
 * - Clean editorial header with actions
 * - Segmented track switch (Intern / SDE) with transform indicator
 * - Sticky hairline filter bar with ruled selects and active tokens
 * - Client-derived insights strip (top companies & topics)
 * - Ruled list of reports (no cards, no color stripes)
 * - True-to-layout skeleton rows, polite error state with Retry, and calm empty state
 */
export default function IntelReportsListV2({
  viewMode = 'all',
  track = 'intern',
  handleTrackChange,
  meta = { companies: [], counts: { intern: 0, sde: 0 } },
  searchQuery,
  setSearchQuery,
  companySearch,
  setCompanySearch,
  showCompanySuggestions,
  setShowCompanySuggestions,
  outcomeFilter,
  setOutcomeFilter,
  difficultyFilter,
  setDifficultyFilter,
  yearFilter,
  setYearFilter,
  roundFilter,
  setRoundFilter,
  topicFilter,
  setTopicFilter,
  sourceFilter,
  setSourceFilter,
  sortOrder,
  setSortOrder,
  page,
  setPage,
  reports = [],
  pagination = { page: 1, totalPages: 1, total: 0 },
  loading = false,
  error = null,
  handleClearFilters,
  handleToggleHelpful,
  handleToggleBookmark,
  navigate,
  fetchReports,
}) {
  const isMine = viewMode === 'mine'
  const isSaved = viewMode === 'saved'

  // Header Title & Description based on viewMode
  const headerOverline = isMine ? 'Your submissions' : isSaved ? 'Saved bookmarks' : 'Intel reports'
  const headerTitle = isMine ? 'My reports' : isSaved ? 'Saved reports' : 'Interview reports'
  const headerLead = isMine
    ? 'All interview reports you have submitted to the arena. Edit or review their moderation status.'
    : isSaved
    ? 'Reference interview reports you have bookmarked for your upcoming rounds.'
    : 'Real interview experiences from other players. Read before your next interview, write one after.'

  return (
    <div className="intel-v2">
      <div className="intel-v2-container">

        {/* 1. Header Section */}
        <header className="intel-header">
          <div className="intel-header-meta">
            <span className="intel-overline">{headerOverline}</span>
            <h1 className="intel-h1">{headerTitle}</h1>
            <p className="intel-lead">{headerLead}</p>
          </div>

          <div className="intel-header-actions">
            <div className="intel-sub-links" role="navigation" aria-label="Intel report views">
              <button
                type="button"
                onClick={() => navigate('/experiences')}
                className={`intel-sub-link ${viewMode === 'all' ? 'is-active' : ''}`}
              >
                All reports
              </button>
              <span className="intel-sub-divider" aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => navigate('/experiences/mine')}
                className={`intel-sub-link ${isMine ? 'is-active' : ''}`}
              >
                My reports
              </button>
              <span className="intel-sub-divider" aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => navigate('/experiences/saved')}
                className={`intel-sub-link ${isSaved ? 'is-active' : ''}`}
              >
                Saved
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/experiences/new')}
              className="intel-btn-primary"
            >
              <IconPlus size={14} />
              <span>Share your experience</span>
            </button>
          </div>
        </header>

        {/* 2. Track Switcher (Only on main catalog view) */}
        {viewMode === 'all' && (
          <div className="intel-track-rail" role="tablist" aria-label="Interview Track">
            <button
              type="button"
              role="tab"
              aria-selected={track === 'intern'}
              onClick={() => handleTrackChange('intern')}
              className={`intel-track-btn ${track === 'intern' ? 'is-active' : ''}`}
            >
              <span>Intern</span>
              {typeof meta?.counts?.intern === 'number' && (
                <span className="intel-track-count">{meta.counts.intern}</span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={track === 'sde'}
              onClick={() => handleTrackChange('sde')}
              className={`intel-track-btn ${track === 'sde' ? 'is-active' : ''}`}
            >
              <span>SDE</span>
              {typeof meta?.counts?.sde === 'number' && (
                <span className="intel-track-count">{meta.counts.sde}</span>
              )}
            </button>

            {/* Transform underline indicator */}
            <div
              className="intel-track-indicator"
              style={{
                width: track === 'intern' ? '88px' : '76px',
                transform: track === 'intern' ? 'translateX(0px)' : 'translateX(88px)',
              }}
              aria-hidden="true"
            />
          </div>
        )}

      </div>

      {/* 3. Sticky Filter Bar (Main catalog view) */}
      {viewMode === 'all' && (
        <IntelFilterBar
          track={track}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          showCompanySuggestions={showCompanySuggestions}
          setShowCompanySuggestions={setShowCompanySuggestions}
          meta={meta}
          outcomeFilter={outcomeFilter}
          setOutcomeFilter={setOutcomeFilter}
          difficultyFilter={difficultyFilter}
          setDifficultyFilter={setDifficultyFilter}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          roundFilter={roundFilter}
          setRoundFilter={setRoundFilter}
          topicFilter={topicFilter}
          setTopicFilter={setTopicFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          setPage={setPage}
          totalCount={pagination.total || reports.length}
          handleClearFilters={handleClearFilters}
        />
      )}

      {/* 4. Results Container */}
      <div className="intel-v2-container">

        {/* Optional Insights Strip (only if reports >= 4) */}
        {!loading && !error && viewMode === 'all' && (
          <IntelInsightsStrip reports={reports} />
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="intel-ruled-list" aria-busy="true" aria-label="Loading reports">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="intel-skeleton-row">
                <div className="intel-skeleton-line" style={{ width: '42%' }} />
                <div className="intel-skeleton-line" style={{ width: '68%', height: '11px' }} />
                <div className="intel-skeleton-line" style={{ width: '92%', height: '12px' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Polite Error State */
          <div className="intel-error-box" role="alert">
            <p className="intel-error-text">{error}</p>
            {fetchReports && (
              <button
                type="button"
                onClick={fetchReports}
                className="intel-btn-primary"
              >
                Retry
              </button>
            )}
          </div>
        ) : reports.length === 0 ? (
          /* Empty State */
          <div className="intel-empty-box">
            <h2 className="intel-empty-title">
              {viewMode === 'mine'
                ? 'You have not shared any interview reports yet.'
                : viewMode === 'saved'
                ? 'No saved interview reports.'
                : 'No reports match these filters.'}
            </h2>
            <p className="intel-empty-copy">
              {viewMode === 'mine'
                ? 'Share your interview experience with other players to help them prepare.'
                : viewMode === 'saved'
                ? 'Bookmark reports from the list to reference them during your interview preparation.'
                : 'Clear filters or share the first one to start the reference archive.'}
            </p>
            <div className="intel-empty-actions">
              {viewMode === 'all' && (
                <button
                  type="button"
                  data-testid="clear-filters"
                  onClick={handleClearFilters}
                  className="intel-btn-primary"
                >
                  Clear filters
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/experiences/new')}
                className="intel-btn-primary"
              >
                Share your experience
              </button>
            </div>
          </div>
        ) : (
          /* Ruled List of Reports */
          <div className="intel-ruled-list" role="feed" aria-label="Interview reports">
            {reports.map((exp) => (
              <IntelReportRow
                key={exp.id}
                report={exp}
                viewMode={viewMode}
                onClick={() => navigate(`/experiences/${exp.id}`)}
                onEdit={(e) => {
                  e.stopPropagation()
                  navigate(`/experiences/${exp.id}/edit`)
                }}
                onToggleHelpful={handleToggleHelpful}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        )}

        {/* 5. Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <nav className="intel-pagination" aria-label="Pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="intel-page-btn"
              aria-label="Previous page"
            >
              <IconChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span className="intel-page-info">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="intel-page-btn"
              aria-label="Next page"
            >
              <span>Next</span>
              <IconChevronRight size={14} />
            </button>
          </nav>
        )}

      </div>
    </div>
  )
}
