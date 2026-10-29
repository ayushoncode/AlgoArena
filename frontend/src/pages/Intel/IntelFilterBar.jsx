import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  IconSearch,
  IconClose,
  IconFilter,
  IconChevronDown,
} from '../../components/icons/index.jsx'

/**
 * IntelFilterBar: High-density compact filter bar with "More filters" drawer
 * ──────────────────────────────────────────────────────────────────────────
 * Main row:
 * - Single keyword search input
 * - Outcome, Difficulty, Topic compact controls
 * - "More filters (n)" toggle button
 * - Sort order text toggle (Latest / Most helpful)
 * - Result count in mono
 *
 * "More filters" panel:
 * - Company autocomplete input
 * - Year, Round type, Source selects
 *
 * Active removable tokens:
 * - Displayed whenever any filter is applied with "Clear all"
 *
 * Mobile sheet:
 * - Opens on mobile devices with all filter options in a bottom sheet
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
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const sheetRef = useRef(null)

  // Company suggestions matching search query
  const companySuggestions = useMemo(() => {
    if (!companySearch.trim() || !meta?.companies) return []
    const q = companySearch.toLowerCase().trim()
    return meta.companies.filter((c) => c.toLowerCase().includes(q)).slice(0, 8)
  }, [companySearch, meta])

  // Count of active filters inside the "More filters" panel
  const moreFiltersCount = useMemo(() => {
    let count = 0
    if (companySearch) count++
    if (yearFilter) count++
    if (roundFilter) count++
    if (sourceFilter) count++
    return count
  }, [companySearch, yearFilter, roundFilter, sourceFilter])

  // All active filter tokens for main row display
  const activeTokens = useMemo(() => {
    const list = []
    if (outcomeFilter) {
      let outcomeLabel = outcomeFilter
      if (outcomeFilter === 'selected') outcomeLabel = 'Got the offer'
      else if (outcomeFilter === 'rejected') outcomeLabel = 'Rejected'
      else if (outcomeFilter === 'waiting') outcomeLabel = 'Waiting'
      else if (outcomeFilter === 'withdrew') outcomeLabel = 'Withdrew'
      list.push({
        id: 'outcome',
        label: 'Outcome',
        value: outcomeLabel,
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
    if (topicFilter) {
      list.push({
        id: 'topic',
        label: 'Topic',
        value: topicFilter,
        onClear: () => { setTopicFilter(''); setPage(1); },
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
    return list
  }, [
    outcomeFilter, difficultyFilter, topicFilter, companySearch,
    yearFilter, roundFilter, sourceFilter, searchQuery,
    setOutcomeFilter, setDifficultyFilter, setTopicFilter, setCompanySearch,
    setYearFilter, setRoundFilter, setSourceFilter, setSearchQuery, setPage,
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

        {/* ── Desktop & Tablet Main Filter Row ── */}
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
          </div>

          {/* Mobile Filter Trigger Button (hidden on desktop) */}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="intel-mobile-filter-trigger"
            aria-label={`Open filters sheet. ${activeTokens.length} active`}
          >
            <IconFilter size={14} />
            <span>Filters {activeTokens.length > 0 ? `(${activeTokens.length})` : ''}</span>
          </button>

          {/* Compact Primary Selects (Outcome, Difficulty, Topic) */}
          <div className="intel-select-group intel-desktop-filters">
            {/* Outcome */}
            <select
              value={outcomeFilter}
              onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
              className="intel-select intel-select-compact"
              aria-label="Filter outcome"
            >
              <option value="">All Outcomes</option>
              <option value="selected">Got the offer</option>
              <option value="rejected">Rejected</option>
              <option value="waiting">Waiting</option>
              <option value="withdrew">Withdrew</option>
            </select>

            {/* Difficulty */}
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              className="intel-select intel-select-compact"
              aria-label="Filter difficulty"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Topic */}
            <select
              value={topicFilter}
              onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
              className="intel-select intel-select-compact"
              aria-label="Filter topic"
            >
              <option value="">All Topics</option>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="trees">Trees</option>
              <option value="graphs">Graphs</option>
              <option value="dp">Dynamic Programming</option>
              <option value="binary-search">Binary Search</option>
              {meta?.topics && meta.topics.filter(t => !['arrays', 'strings', 'trees', 'graphs', 'dp', 'binary-search'].includes(t.toLowerCase())).map((t) => (
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>

            {/* "More filters" Toggle Button */}
            <button
              type="button"
              data-testid="more-filters"
              onClick={() => setMoreFiltersOpen(prev => !prev)}
              className={`intel-more-filters-btn ${moreFiltersOpen ? 'is-active' : ''}`}
              aria-expanded={moreFiltersOpen}
              aria-controls="intel-more-filters-panel"
            >
              <IconFilter size={13} />
              <span>More filters</span>
              {moreFiltersCount > 0 && (
                <span className="intel-more-filters-badge">({moreFiltersCount})</span>
              )}
              <IconChevronDown size={13} className={`intel-more-chevron ${moreFiltersOpen ? 'is-rotated' : ''}`} />
            </button>
          </div>

          {/* Sort order text toggle */}
          <div className="intel-sort-group intel-desktop-filters" role="group" aria-label="Sort order">
            <span className="intel-sort-label">Sort:</span>
            <button
              type="button"
              data-sort="latest"
              onClick={() => { setSortOrder('latest'); setPage(1); }}
              className={`intel-sort-btn ${sortOrder === 'latest' ? 'is-active' : ''}`}
              aria-pressed={sortOrder === 'latest'}
            >
              Latest
            </button>
            <span className="intel-sort-sep" aria-hidden="true">•</span>
            <button
              type="button"
              data-sort="helpful"
              onClick={() => { setSortOrder('helpful'); setPage(1); }}
              className={`intel-sort-btn ${sortOrder === 'helpful' ? 'is-active' : ''}`}
              aria-pressed={sortOrder === 'helpful'}
            >
              Most helpful
            </button>
          </div>

          {/* Mono Result Count */}
          <span className="intel-result-count font-mono intel-desktop-filters">
            {totalCount} {totalCount === 1 ? 'report' : 'reports'}
          </span>
        </div>

        {/* ── "More Filters" Hairline Expandable Panel ── */}
        {moreFiltersOpen && (
          <div
            id="intel-more-filters-panel"
            className="intel-more-filters-panel"
            role="region"
            aria-label="Additional filters"
          >
            <div className="intel-more-filters-grid">
              {/* Company Search with Autocomplete */}
              <div className="intel-more-filter-col">
                <label className="intel-overline" htmlFor="intel-company-search-input">
                  Company
                </label>
                <div className="intel-input-wrap" style={{ position: 'relative' }}>
                  <input
                    id="intel-company-search-input"
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

              {/* Year Select */}
              <div className="intel-more-filter-col">
                <label className="intel-overline" htmlFor="intel-year-select">
                  Year
                </label>
                <select
                  id="intel-year-select"
                  value={yearFilter}
                  onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                  className="intel-select"
                  aria-label="Filter year"
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>
              </div>

              {/* Round Type Select */}
              <div className="intel-more-filter-col">
                <label className="intel-overline" htmlFor="intel-round-select">
                  Round Type
                </label>
                <select
                  id="intel-round-select"
                  value={roundFilter}
                  onChange={(e) => { setRoundFilter(e.target.value); setPage(1); }}
                  className="intel-select"
                  aria-label="Filter round type"
                >
                  <option value="">All Rounds</option>
                  <option value="oa">Online Assessment</option>
                  <option value="technical">Technical</option>
                  <option value="system_design">System Design</option>
                  <option value="managerial">Managerial</option>
                  <option value="hr">HR</option>
                </select>
              </div>

              {/* Source Select (Intern track only) */}
              {track === 'intern' && (
                <div className="intel-more-filter-col">
                  <label className="intel-overline" htmlFor="intel-source-select">
                    Source
                  </label>
                  <select
                    id="intel-source-select"
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Active Filter Removable Tokens ── */}
        {activeTokens.length > 0 && (
          <div className="intel-active-tokens-bar">
            <div className="intel-tokens-list">
              {activeTokens.map((token) => (
                <span key={token.id} className="intel-token">
                  <span className="intel-token-label">{token.label}:</span>
                  <span className="intel-token-val">{token.value}</span>
                  <button
                    type="button"
                    onClick={token.onClear}
                    className="intel-token-remove"
                    aria-label={`Remove ${token.label} filter`}
                  >
                    <IconClose size={11} />
                  </button>
                </span>
              ))}

              <button
                type="button"
                data-testid="clear-filters"
                onClick={handleClearFilters}
                className="intel-clear-all-btn"
                aria-label="Clear all filters"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Mobile Filter Bottom Sheet ── */}
      {mobileSheetOpen && (
        <div
          className="intel-mobile-sheet-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Filter interview experiences"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileSheetOpen(false)
          }}
        >
          <div className="intel-mobile-sheet-panel" ref={sheetRef}>
            <div className="intel-sheet-header">
              <h3 className="intel-sheet-title">Filters</h3>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="intel-clear-input-btn"
                aria-label="Close filters sheet"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="intel-sheet-body">
              {/* Outcome */}
              <div className="intel-sheet-field">
                <label className="intel-overline" htmlFor="sheet-outcome-select">Outcome</label>
                <select
                  id="sheet-outcome-select"
                  value={outcomeFilter}
                  onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full"
                  aria-label="Filter outcome"
                >
                  <option value="">All Outcomes</option>
                  <option value="selected">Got the offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="waiting">Waiting</option>
                  <option value="withdrew">Withdrew</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="intel-sheet-field">
                <label className="intel-overline" htmlFor="sheet-difficulty-select">Difficulty</label>
                <select
                  id="sheet-difficulty-select"
                  value={difficultyFilter}
                  onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full"
                  aria-label="Filter difficulty"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Topic */}
              <div className="intel-sheet-field">
                <label className="intel-overline" htmlFor="sheet-topic-select">Topic</label>
                <select
                  id="sheet-topic-select"
                  value={topicFilter}
                  onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full"
                  aria-label="Filter topic"
                >
                  <option value="">All Topics</option>
                  <option value="arrays">Arrays</option>
                  <option value="strings">Strings</option>
                  <option value="trees">Trees</option>
                  <option value="graphs">Graphs</option>
                  <option value="dp">Dynamic Programming</option>
                  <option value="binary-search">Binary Search</option>
                  {meta?.topics && meta.topics.filter(t => !['arrays', 'strings', 'trees', 'graphs', 'dp', 'binary-search'].includes(t.toLowerCase())).map((t) => (
                    <option key={t} value={t.toLowerCase()}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Company */}
              <div className="intel-sheet-field">
                <label className="intel-overline" htmlFor="sheet-company-input">Company</label>
                <input
                  id="sheet-company-input"
                  type="text"
                  value={companySearch}
                  onChange={(e) => { setCompanySearch(e.target.value); setPage(1); }}
                  className="intel-select w-full"
                  placeholder="Filter company..."
                  aria-label="Filter company"
                />
              </div>

              {/* Year */}
              <div className="intel-sheet-field">
                <label className="intel-overline" htmlFor="sheet-year-select">Year</label>
                <select
                  id="sheet-year-select"
                  value={yearFilter}
                  onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full"
                  aria-label="Filter year"
                >
                  <option value="">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              {/* Round type */}
              <div className="intel-sheet-field">
                <label className="intel-overline" htmlFor="sheet-round-select">Round type</label>
                <select
                  id="sheet-round-select"
                  value={roundFilter}
                  onChange={(e) => { setRoundFilter(e.target.value); setPage(1); }}
                  className="intel-select w-full"
                  aria-label="Filter round type"
                >
                  <option value="">All Rounds</option>
                  <option value="oa">Online Assessment</option>
                  <option value="technical">Technical</option>
                  <option value="system_design">System Design</option>
                  <option value="managerial">Managerial</option>
                  <option value="hr">HR</option>
                </select>
              </div>

              {/* Source (Intern Track) */}
              {track === 'intern' && (
                <div className="intel-sheet-field">
                  <label className="intel-overline" htmlFor="sheet-source-select">Source</label>
                  <select
                    id="sheet-source-select"
                    value={sourceFilter}
                    onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                    className="intel-select w-full"
                    aria-label="Filter source"
                  >
                    <option value="">All Sources</option>
                    <option value="on_campus">On Campus</option>
                    <option value="off_campus">Off Campus</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              )}

              {/* Sort Order */}
              <div className="intel-sheet-field">
                <label className="intel-overline">Sort By</label>
                <div className="intel-sort-group" role="group" aria-label="Sort order">
                  <button
                    type="button"
                    onClick={() => { setSortOrder('latest'); setPage(1); }}
                    className={`intel-sort-btn ${sortOrder === 'latest' ? 'is-active' : ''}`}
                    aria-pressed={sortOrder === 'latest'}
                  >
                    Latest
                  </button>
                  <span className="intel-sort-sep" aria-hidden="true">•</span>
                  <button
                    type="button"
                    onClick={() => { setSortOrder('helpful'); setPage(1); }}
                    className={`intel-sort-btn ${sortOrder === 'helpful' ? 'is-active' : ''}`}
                    aria-pressed={sortOrder === 'helpful'}
                  >
                    Most helpful
                  </button>
                </div>
              </div>
            </div>

            <div className="intel-sheet-footer">
              <button
                type="button"
                onClick={() => { handleClearFilters(); setMobileSheetOpen(false); }}
                className="intel-clear-all-btn"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="intel-btn-primary"
              >
                Done ({totalCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
