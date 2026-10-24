import React, { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, Search, X, Filter, Plus, BookMarked, UserCheck,
  ThumbsUp, Bookmark, ChevronRight, Building, Calendar, MapPin,
  TrendingUp, ArrowUpDown, ChevronLeft, Award, Sparkles, Check, AlertTriangle
} from "lucide-react"

import api from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { UserAvatar, getTier } from "../utils/avatar"
import {
  PageWrapper, HudPanel, HudButton, GhostButton, StatBadge,
  RankBadge, SkeletonCard, EmptyState, Tooltip
} from "../components/ui/index.jsx"

/* Helper for Monogram Company Avatar */
function CompanyMonogram({ name }) {
  const cleanName = (name || "C").trim()
  const initials = cleanName.length >= 2
    ? cleanName.slice(0, 2).toUpperCase()
    : cleanName.slice(0, 1).toUpperCase()

  // Generate background tint from name
  let hash = 0
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorHue = Math.abs(hash % 360)

  return (
    <div
      className="w-12 h-12 shrink-0 flex items-center justify-center font-display font-black text-sm tracking-wider text-white rounded-lg shadow-lg relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${colorHue}, 60%, 20%), hsl(${colorHue}, 70%, 10%))`,
        border: `1px solid hsl(${colorHue}, 70%, 40%)`,
        clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
      }}
    >
      <div aria-hidden="true" className="absolute top-0 right-0 w-4 h-4 bg-white/10 blur-xs" />
      <span>{initials}</span>
    </div>
  )
}

/* Outcome Chip Config */
const OUTCOME_CFG = {
  selected: { label: "SELECTED", col: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  rejected: { label: "REJECTED", col: "#E11D48", bg: "rgba(225,29,72,0.12)", border: "rgba(225,29,72,0.3)" },
  waiting:  { label: "WAITING",  col: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  withdrew: { label: "WITHDREW", col: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
}

/* Difficulty Chip Config */
const DIFF_CFG = {
  easy:   { label: "EASY",   col: "#10b981" },
  medium: { label: "MEDIUM", col: "#f59e0b" },
  hard:   { label: "HARD",   col: "#E11D48" },
}

export default function IntelReports() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Detect sub-view from route
  const viewMode = location.pathname === "/experiences/mine"
    ? "mine"
    : location.pathname === "/experiences/saved"
    ? "saved"
    : "all"

  // Track State (INTERN | SDE) with localStorage memory
  const [track, setTrack] = useState(() => {
    try {
      return localStorage.getItem("aa_intel_track") || "intern"
    } catch {
      return "intern"
    }
  })

  // Meta stats & company autocomplete
  const [meta, setMeta] = useState({ companies: [], counts: { intern: 0, sde: 0 } })

  // Filters State
  const [searchQuery, setSearchQuery] = useState("")
  const [companySearch, setCompanySearch] = useState("")
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)
  const [outcomeFilter, setOutcomeFilter] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [roundFilter, setRoundFilter] = useState("")
  const [topicFilter, setTopicFilter] = useState("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [sortOrder, setSortOrder] = useState("latest")
  const [page, setPage] = useState(1)

  // Data List State
  const [reports, setReports] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Save Track in localStorage
  const handleTrackChange = (newTrack) => {
    setTrack(newTrack)
    setPage(1)
    try {
      localStorage.setItem("aa_intel_track", newTrack)
    } catch (e) {
      console.warn("localStorage write failed", e)
    }
  }

  // Fetch Meta (Companies & Counts)
  useEffect(() => {
    async function fetchMeta() {
      try {
        const { data } = await api.get("/api/experiences/meta")
        setMeta(data)
      } catch (err) {
        console.error("Failed to load meta", err)
      }
    }
    fetchMeta()
  }, [])

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append("page", page)
      params.append("limit", 10)

      let endpoint
      if (viewMode === "mine") {
        endpoint = "/api/experiences/mine"
        params.append("sort", sortOrder)
      } else if (viewMode === "saved") {
        endpoint = "/api/experiences/bookmarks"
        params.append("sort", sortOrder)
      } else {
        endpoint = "/api/experiences"
        params.append("track", track)
        params.append("sort", sortOrder)
        if (searchQuery) params.append("q", searchQuery)
        if (companySearch) params.append("company", companySearch)
        if (outcomeFilter) params.append("outcome", outcomeFilter)
        if (difficultyFilter) params.append("difficulty", difficultyFilter)
        if (yearFilter) params.append("year", yearFilter)
        if (roundFilter) params.append("round", roundFilter)
        if (topicFilter) params.append("topic", topicFilter)
        if (sourceFilter) params.append("source", sourceFilter)
      }

      const { data } = await api.get(`${endpoint}?${params.toString()}`)
      setReports(data.experiences)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch reports", err)
      setError(err.message || "Failed to load intel reports")
    } finally {
      setLoading(false)
    }
  }, [viewMode, track, page, sortOrder, searchQuery, companySearch, outcomeFilter, difficultyFilter, yearFilter, roundFilter, topicFilter, sourceFilter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Helpful toggle
  const handleToggleHelpful = async (e, reportId) => {
    e.stopPropagation()
    try {
      const { data } = await api.post(`/api/experiences/${reportId}/helpful`)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, is_helpful: data.isHelpful, helpful_count: data.helpfulCount }
            : r
        )
      )
    } catch (err) {
      console.error("Toggle helpful failed", err)
    }
  }

  // Bookmark toggle
  const handleToggleBookmark = async (e, reportId) => {
    e.stopPropagation()
    try {
      const { data } = await api.post(`/api/experiences/${reportId}/bookmark`)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, is_bookmarked: data.isBookmarked } : r
        )
      )
    } catch (err) {
      console.error("Toggle bookmark failed", err)
    }
  }

  // Clear all active filters
  const handleClearFilters = () => {
    setSearchQuery("")
    setCompanySearch("")
    setOutcomeFilter("")
    setDifficultyFilter("")
    setYearFilter("")
    setRoundFilter("")
    setTopicFilter("")
    setSourceFilter("")
    setPage(1)
  }

  const hasActiveFilters = searchQuery || companySearch || outcomeFilter || difficultyFilter || yearFilter || roundFilter || topicFilter || sourceFilter

  const companySuggestions = companySearch
    ? meta.companies.filter((c) => c.toLowerCase().includes(companySearch.toLowerCase())).slice(0, 5)
    : []

  // Sub-view config
  const VIEW_CFG = {
    all:   { label: "// INTEL REPORTS", title: "INTERVIEW", titleAccent: "EXPERIENCES", sub: "Learn from people who already sat in the chair. Real round breakdowns, questions, and interview tips." },
    mine:  { label: "// MY REPORTS",   title: "MY INTEL",  titleAccent: "REPORTS",     sub: "All your submitted interview experiences, including pending ones." },
    saved: { label: "// SAVED",         title: "SAVED",     titleAccent: "INTEL",        sub: "Reports you bookmarked for later reference." },
  }
  const cfg = VIEW_CFG[viewMode]

  return (
    <PageWrapper heroGlow className="pt-20 sm:pt-24 pb-20">
      
      {/* HERO HEADER */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-6 border-b border-[var(--c-border)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <FileText size={13} /> {cfg.label}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight">
              <span style={{ color: "var(--c-red)" }}>{cfg.title} </span><span style={{ color: "var(--c-blue)" }}>{cfg.titleAccent}</span>
            </h1>
            <p className="font-sans text-sm sm:text-base text-[color:var(--c-text-dim)] max-w-xl">{cfg.sub}</p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {viewMode !== "all" && (
              <GhostButton onClick={() => navigate("/experiences")} className="font-mono text-xs font-bold">
                <FileText size={14} className="mr-1.5 text-[color:var(--c-text-mute)]" /> ALL REPORTS
              </GhostButton>
            )}
            {viewMode !== "mine" && (
              <GhostButton onClick={() => navigate("/experiences/mine")} className="font-mono text-xs font-bold">
                <UserCheck size={14} className="mr-1.5 text-cyan-400" /> MY REPORTS
              </GhostButton>
            )}
            {viewMode !== "saved" && (
              <GhostButton onClick={() => navigate("/experiences/saved")} className="font-mono text-xs font-bold">
                <BookMarked size={14} className="mr-1.5 text-[color:var(--c-gold)]" /> SAVED
              </GhostButton>
            )}
            <HudButton onClick={() => navigate("/experiences/new")} className="font-display font-bold text-xs uppercase px-5 py-2.5">
              <Plus size={15} className="mr-1" /> SHARE EXPERIENCE
            </HudButton>
          </div>
        </div>
      </div>

      {/* TRACK SWITCHER — only on the main list */}
      {viewMode === "all" && <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-8">
        <div className="bg-[color:var(--c-panel2)] p-1.5 rounded-xl border border-[color:var(--c-border)] flex items-center max-w-md mx-auto relative">
          <button
            onClick={() => handleTrackChange("intern")}
            className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 ${
              track === "intern"
                ? "text-white shadow-lg bg-rose-600"
                : "text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]"
            }`}
          >
            <span>INTERN TRACK</span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${track === "intern" ? "bg-black/30 text-white" : "bg-[color:var(--c-panel)] text-[color:var(--c-text-mute)]"}`}>
              {meta.counts.intern || 0}
            </span>
          </button>

          <button
            onClick={() => handleTrackChange("sde")}
            className={`flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 ${
              track === "sde"
                ? "text-white shadow-lg bg-cyan-600"
                : "text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]"
            }`}
          >
            <span>SDE TRACK</span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${track === "sde" ? "bg-black/30 text-white" : "bg-[color:var(--c-panel)] text-[color:var(--c-text-mute)]"}`}>
              {meta.counts.sde || 0}
            </span>
          </button>
        </div>
      </div>}

      {/* STICKY FILTER BAR — only on main list */}
      {viewMode !== "all" && <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-6" />}
      {viewMode === "all" ? (
      <div className="sticky top-14 z-30 max-w-6xl mx-auto px-5 sm:px-8 mb-8">
        <HudPanel className="p-3 space-y-3 bg-[color:var(--c-panel2)] backdrop-blur-md border-[color:var(--c-border)]">
          
          {/* Main Search Row */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            
            {/* Keyword Search */}
            <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] rounded font-mono text-xs text-[color:var(--c-text)]">
              <Search size={14} className="text-[color:var(--c-text-mute)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search keywords, roles, questions..."
                className="w-full bg-transparent outline-none text-[color:var(--c-text)] placeholder-slate-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Company Autocomplete */}
            <div className="relative w-full md:w-56 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] rounded font-mono text-xs text-[color:var(--c-text)]">
                <Building size={14} className="text-[color:var(--c-text-mute)] shrink-0" />
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => { setCompanySearch(e.target.value); setPage(1); }}
                  onFocus={() => setShowCompanySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                  placeholder="Filter company..."
                  className="w-full bg-transparent outline-none text-[color:var(--c-text)] placeholder-slate-500"
                />
                {companySearch && (
                  <button onClick={() => setCompanySearch("")} className="text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showCompanySuggestions && companySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] rounded shadow-2xl py-1 font-mono text-xs">
                  {companySuggestions.map((comp, idx) => (
                    <div
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setCompanySearch(comp)
                        setShowCompanySuggestions(false)
                        setPage(1)
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-[color:var(--c-panel2)] text-[color:var(--c-text)] flex items-center justify-between"
                    >
                      <span>{comp}</span>
                      <ChevronRight size={12} className="text-[color:var(--c-text-mute)]" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Order */}
            <div className="w-full md:w-44 shrink-0">
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                className="w-full bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text)] font-mono text-xs px-3 py-2 outline-none cursor-pointer"
              >
                <option value="latest">Sort: Latest</option>
                <option value="helpful">Sort: Most Helpful</option>
              </select>
            </div>
          </div>

          {/* Secondary Dropdown Selects */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[color:var(--c-border)] font-mono text-xs">
            {/* Outcome */}
            <select
              value={outcomeFilter}
              onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
              className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] px-2.5 py-1.5 rounded outline-none"
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
              className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] px-2.5 py-1.5 rounded outline-none"
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
              className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] px-2.5 py-1.5 rounded outline-none"
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
              className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] px-2.5 py-1.5 rounded outline-none"
            >
              <option value="">All Round Types</option>
              <option value="online_assessment">Online Assessment</option>
              <option value="technical">Technical</option>
              <option value="dsa">DSA</option>
              <option value="system_design">System Design</option>
              <option value="hr">HR</option>
              <option value="managerial">Managerial</option>
            </select>

            {/* Topic */}
            <select
              value={topicFilter}
              onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
              className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] px-2.5 py-1.5 rounded outline-none"
            >
              <option value="">All Topics</option>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="trees">Trees</option>
              <option value="graphs">Graphs</option>
              <option value="dp">Dynamic Programming</option>
              <option value="binary-search">Binary Search</option>
            </select>

            {/* Track Source */}
            {track === "intern" && (
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] px-2.5 py-1.5 rounded outline-none"
              >
                <option value="">All Sources</option>
                <option value="on_campus">On Campus</option>
                <option value="off_campus">Off Campus</option>
                <option value="referral">Referral</option>
              </select>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 uppercase tracking-wider"
              >
                <X size={12} /> CLEAR ALL
              </button>
            )}
          </div>
        </HudPanel>
      </div>
      ) : (
        /* Compact sort bar for mine / saved */
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-8">
          <div className="flex items-center justify-end gap-3">
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text)] font-mono text-xs px-3 py-2 outline-none cursor-pointer rounded"
            >
              <option value="latest">Sort: Latest</option>
              <option value="helpful">Sort: Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* REPORTS LIST CONTENT */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard rows={4} />
            <SkeletonCard rows={4} />
            <SkeletonCard rows={4} />
          </div>
        ) : error ? (
          <HudPanel className="p-8 text-center text-rose-400 font-mono text-sm border-rose-500/30">
            {error}
          </HudPanel>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="NO INTEL REPORTS FOUND"
            subtitle={hasActiveFilters ? "Try broadening your search filters" : "Be the first challenger to share an experience!"}
            action={
              <HudButton onClick={() => navigate("/experiences/new")} className="font-display font-bold text-xs uppercase px-5 py-2.5">
                <Plus size={14} className="mr-1" /> SHARE FIRST EXPERIENCE
              </HudButton>
            }
          />
        ) : (
          reports.map((exp) => {
            const outcomeObj = OUTCOME_CFG[exp.outcome] || OUTCOME_CFG.selected
            const diffObj = DIFF_CFG[exp.difficulty] || DIFF_CFG.medium
            const roundsCount = Array.isArray(exp.rounds) ? exp.rounds.length : 0

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => navigate(`/experiences/${exp.id}`)}
                className="cursor-pointer group"
              >
                <HudPanel
                  className="p-5 relative transition-all duration-200 hover:border-slate-700 hover:scale-[1.005]"
                  style={{
                    background: "var(--c-panel)",
                    borderLeft: exp.outcome === "selected" ? "4px solid #10b981" : "1px solid var(--c-border)",
                  }}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    {/* Company Monogram & Header Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <CompanyMonogram name={exp.company} />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-black text-xl text-[color:var(--c-text)] tracking-wide group-hover:text-rose-400 transition-colors">
                            {exp.company}
                          </h3>
                          <span className="font-mono text-[10px] text-[color:var(--c-text-mute)]">
                            • {exp.role_title}
                          </span>
                          {exp.status === "pending" && (
                            <span className="font-mono text-[9px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-[color:var(--c-gold)] uppercase font-bold">
                              PENDING REVIEW
                            </span>
                          )}
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                          <span
                            className="font-bold px-2 py-0.5 rounded"
                            style={{ background: outcomeObj.bg, color: outcomeObj.col, border: `1px solid ${outcomeObj.border}` }}
                          >
                            {outcomeObj.label}
                          </span>
                          <span
                            className="font-bold px-2 py-0.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)]"
                            style={{ color: diffObj.col }}
                          >
                            {diffObj.label}
                          </span>
                          <span className="text-[color:var(--c-text-mute)] px-2 py-0.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)]">
                            {roundsCount} ROUND{roundsCount === 1 ? "" : "S"}
                          </span>
                          <span className="text-[color:var(--c-text-mute)]">
                            {exp.year} {exp.location ? `• ${exp.location}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Author & Interactions */}
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[color:var(--c-border)]">
                      {/* Author */}
                      <div className="flex items-center gap-2 text-right">
                        <div className="text-left">
                          <p className="font-mono text-xs font-bold text-[color:var(--c-text)]">
                            {exp.author.username}
                          </p>
                          {exp.author.elo_rating && (
                            <RankBadge elo={exp.author.elo_rating} size="xs" />
                          )}
                        </div>
                      </div>

                      {/* Action Icon Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleHelpful(e, exp.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-xs rounded border transition-colors ${
                            exp.is_helpful
                              ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                              : "bg-[color:var(--c-panel)] border-[color:var(--c-border)] text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]"
                          }`}
                          title="Mark as helpful"
                        >
                          <ThumbsUp size={13} />
                          <span>{exp.helpful_count || 0}</span>
                        </button>

                        <button
                          onClick={(e) => handleToggleBookmark(e, exp.id)}
                          className={`p-1.5 rounded border transition-colors ${
                            exp.is_bookmarked
                              ? "bg-amber-500/20 border-amber-500/50 text-[color:var(--c-gold)]"
                              : "bg-[color:var(--c-panel)] border-[color:var(--c-border)] text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)]"
                          }`}
                          title="Bookmark report"
                        >
                          <Bookmark size={13} />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Summary Snippet */}
                  <p className="font-sans text-xs text-[color:var(--c-text-dim)] mt-3 line-clamp-2 leading-relaxed">
                    {exp.overall_experience}
                  </p>
                </HudPanel>
              </motion.div>
            )
          })
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-[color:var(--c-border)] font-mono text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] disabled:opacity-40"
            >
              <ChevronLeft size={14} /> PREVIOUS
            </button>

            <span className="text-[color:var(--c-text-mute)]">
              PAGE {pagination.page} OF {pagination.totalPages}
            </span>

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] disabled:opacity-40"
            >
              NEXT <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

    </PageWrapper>
  )
}
