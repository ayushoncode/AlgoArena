import React, { useState, useEffect, useMemo, useRef } from 'react'
import { IconSearch, IconClose, IconFilter } from '../../components/icons/index.jsx'

/**
 * IntelFilterBar: Sticky hairline filter bar with ruled selects and mobile sheet
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides keyword and company autocomplete search, outcome, difficulty, year,
 * round type, topic, source (intern track), and sort controls.
 */
export default function IntelFilterBar({
  track,
  searchQuery,
  setSearchQuery,
  companySearch,
  setCompanySearch,
  showCompanySuggestions,
  setShowCompanySuggestions,
  meta,
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
  setPage,
  totalCount = 0,
  handleClearFilters,
}) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const sheetRef = useRef(null)

  // Company suggestions matching search query
  const companySuggestions = useMemo(() => {
    if (!companySearch.trim() || !meta?.companies) return []
    const q = companySearch.toLowerCase().trim()
    return meta.companies.filter((c) => c.toLowerCase().includes(q)).slice(0, 8)
  }, [companySearch, meta])

  // Active filter tokens
  const activeTokens = useMemo(() => {
    const list = []
    if (outcomeFilter) {
      list.push({
        id: 'outcome',
        label: 'Outcome',
        value: outcomeFilter,
        onClear: () => { setOutcomeFilter(''); setPage(1); },
      })
    }
    if (difficultyFilter) {
      list.push({
        id: 'difficulty',
        label: 'Difficulty',
        value: difficultyFilter,
        onClear: () => { setDifficultyFilter(''); setPage(1); },
      })
    }
    if (yearFilter) {
      list.push({
        id: 'year',
        label: 'Year',
        value: yearFilter,
        onClear: () => { setYearFilter(''); setPage(1); },
      })
    }
    if (roundFilter) {
      list.push({
        id: 'round',
        label: 'Round',
        value: roundFilter.replace(/_/g, ' '),
        onClear: () => { setRoundFilter(''); setPage(1); },
      })
    }
    if (topicFilter) {
      list.push({
        id: 'topic',
        label: 'Topic',
        value: topicFilter,
        onClear: () => { setTopicFilter(''); setPage(1); },
      })
    }
    if (sourceFilter) {
      list.push({
        id: 'source',
        label: 'Source',
        value: sourceFilter.replace(/_/g, ' '),
        onClear: () => { setSourceFilter(''); setPage(1); },
      })
    }
    if (searchQuery) {
      list.push({
        id: 'query',
        label: 'Keyword',
        value: searchQuery,
        onClear: () => { setSearchQuery(''); setPage(1); },
      })
    }
    if (companySearch) {
      list.push({
        id: 'company',
        label: 'Company',
        value: companySearch,
        onClear: () => { setCompanySearch(''); setPage(1); },
      })
    }
    return list
  }, [
    outcomeFilter, difficultyFilter, yearFilter, roundFilter,
    topicFilter, sourceFilter, searchQuery, companySearch,
    setOutcomeFilter, setDifficultyFilter, setYearFilter, setRoundFilter,
    setTopicFilter, setSourceFilter, setSearchQuery, setCompanySearch, setPage,
  ])

  // Trap focus and handle Escape for mobile sheet
  useEffect(() => {
    if (!mobileSheetOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileSheetOpen])

  return (
    <div className="intel-filter-sticky" role="region" aria-label="Filters">
      <div className="intel-v2-container" style={{ padding: '0 24px' }}>

        {/* Desktop Filter Row */}
        <div className="intel-filter-row">

          {/* Keyword Search */}
          <div className="intel-search-group">
            <div className="intel-input-wrap">
              <IconSearch size={15} className="intel-sub" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search keywords, roles, questions..."
                aria-label="Search keywords"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setPage(1); }}
                  className="intel-clear-input-btn"
                  aria-label="Clear keyword search"
                >
                  <IconClose size={12} />
                </button>
              )}
            </div>

            {/* Company Search with Autocomplete */}
            <div className="intel-input-wrap" style={{ position: 'relative' }}>
              <input
                type="text"
                value={companySearch}
                onChange={(e) => { setCompanySearch(e.target.value); setPage(1); }}
                onFocus={() => setShowCompanySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                placeholder="Filter company..."
                aria-label="Filter company"
              />
              {companySearch && (
                <button
                  type="button"
                  onClick={() => { setCompanySearch(''); setPage(1); }}
                  className="intel-clear-input-btn"
                  aria-label="Clear company search"
                >
                  <IconClose size={12} />
                </button>
              )}

              {/* Ruled autocomplete dropdown */}
              {showCompanySuggestions && companySuggestions.length > 0 && (
                <div className="intel-autocomplete-dropdown" role="listbox">
                  {companySuggestions.map((comp) => (
                    <div
                      key={comp}
                      role="option"
                      aria-selected={comp === companySearch}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setCompanySearch(comp)
                        setShowCompanySuggestions(false)
                        setPage(1)
                      }}
                      className="intel-autocomplete-item"
                    >
                      <span>{comp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Sheet Trigger (Visible on small screens) */}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="intel-btn-primary md:hidden"
            aria-label={`Open filter sheet. ${activeTokens.length} active`}
            style={{ display: 'none' }} /* controlled via responsive media query or class */
          >
            <IconFilter size={14} />
            <span>Filters {activeTokens.length > 0 ? `(${activeTokens.length})` : ''}</span>
          </button>

          {/* Desktop Select Dropdowns */}
          <div className="intel-select-group">
            {/* Outcome */}
            <select
              value={outcomeFilter}
              onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
              className="intel-select"
              aria-label="Filter outcome"
            >
              <option value="">All Outcomes</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="waiting">Waiting</option>
              <option value="withdrew">Withdrew</option>
            </select>

            {/* Difficulty */}
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              className="intel-select"
              aria-label="Filter difficulty"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Year */}
            <select
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
              className="intel-select"
              aria-label="Filter year"
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            {/* Round Type */}
            <select
              value={roundFilter}
              onChange={(e) => { setRoundFilter(e.target.value); setPage(1); }}
              className="intel-select"
              aria-label="Filter round type"
            >
              <option value="">All Round Types</option>
              <option value="online_assessment">Online Assessment</option>
              <option value="technical">Technical Round</option>
              <option value="dsa">DSA Round</option>
              <option value="system_design">System Design</option>
              <option value="hr">HR Round</option>
              <option value="managerial">Managerial Round</option>
            </select>

            {/* Topic */}
            <select
              value={topicFilter}
              onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
              className="intel-select"
              aria-label="Filter topic"
            >
              <option value="">All Topics</option>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="trees">Trees</option>
              <option value="graphs">Graphs</option>
              <option value="dp">Dynamic Programming</option>
              <option value="binary-search">Binary Search</option>
            </select>

            {/* Source (Intern Track Only) */}
            {track === 'intern' && (
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="intel-select"
                aria-label="Filter source"
              >
                <option value="">All Sources</option>
                <option value="on_campus">On Campus</option>
                <option value="off_campus">Off Campus</option>
                <option value="referral">Referral</option>
              </select>
            )}

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="intel-select"
              aria-label="Sort order"
            >
              <option value="latest">Sort: Latest</option>
              <option value="helpful">Sort: Most Helpful</option>
            </select>
          </div>

        </div>

        {/* Active Filter Tokens & Result Count */}
        <div className="intel-active-tokens-bar">
          <div className="intel-tokens-list">
            {activeTokens.map((tok) => (
              <span key={tok.id} className="intel-token">
                <span>{tok.label}:</span>
                <span className="intel-token-val">{tok.value}</span>
                <button
                  type="button"
                  onClick={tok.onClear}
                  className="intel-token-remove"
                  aria-label={`Remove filter ${tok.label} ${tok.value}`}
                >
                  <IconClose size={10} />
                </button>
              </span>
            ))}

            {activeTokens.length > 0 && (
              <button
                type="button"
                data-testid="clear-filters"
                onClick={handleClearFilters}
                className="intel-clear-all-btn"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Result Count in Mono */}
          <div className="intel-result-count" aria-live="polite">
            {totalCount} {totalCount === 1 ? 'report' : 'reports'}
          </div>
        </div>

      </div>

      {/* Mobile Filter Sheet */}
      {mobileSheetOpen && (
        <div
          className="intel-mobile-sheet-overlay"
          onClick={() => setMobileSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
        >
          <div
            className="intel-mobile-sheet-panel"
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="intel-sheet-header">
              <h2 id="mobile-filter-title" className="intel-sheet-title">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="intel-clear-input-btn"
                aria-label="Close filters"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="intel-sheet-body">
              <div>
                <label className="intel-overline">Outcome</label>
                <select
                  value={outcomeFilter}
                  onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full mt-1.5"
                >
                  <option value="">All Outcomes</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="waiting">Waiting</option>
                  <option value="withdrew">Withdrew</option>
                </select>
              </div>

              <div>
                <label className="intel-overline">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full mt-1.5"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="intel-overline">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full mt-1.5"
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div>
                <label className="intel-overline">Round Type</label>
                <select
                  value={roundFilter}
                  onChange={(e) => { setRoundFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full mt-1.5"
                >
                  <option value="">All Round Types</option>
                  <option value="online_assessment">Online Assessment</option>
                  <option value="technical">Technical Round</option>
                  <option value="dsa">DSA Round</option>
                  <option value="system_design">System Design</option>
                  <option value="hr">HR Round</option>
                  <option value="managerial">Managerial Round</option>
                </select>
              </div>

              <div>
                <label className="intel-overline">Topic</label>
                <select
                  value={topicFilter}
                  onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full mt-1.5"
                >
                  <option value="">All Topics</option>
                  <option value="arrays">Arrays</option>
                  <option value="strings">Strings</option>
                  <option value="trees">Trees</option>
                  <option value="graphs">Graphs</option>
                  <option value="dp">Dynamic Programming</option>
                  <option value="binary-search">Binary Search</option>
                </select>
              </div>

              {track === 'intern' && (
                <div>
                  <label className="intel-overline">Source</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                    className="intel-select w-full mt-1.5"
                  >
                    <option value="">All Sources</option>
                    <option value="on_campus">On Campus</option>
                    <option value="off_campus">Off Campus</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              )}

              <div>
                <label className="intel-overline">Sort By</label>
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                  className="intel-select w-full mt-1.5"
                >
                  <option value="latest">Latest</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
            </div>

            <div className="intel-sheet-footer">
              <button
                type="button"
                onClick={() => { handleClearFilters(); setMobileSheetOpen(false); }}
                className="intel-clear-all-btn"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="intel-btn-primary"
                style={{ marginLeft: 'auto' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
