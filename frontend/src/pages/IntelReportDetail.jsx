import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  FileText, ArrowLeft, Building, Calendar, MapPin, DollarSign,
  Briefcase, Clock, ThumbsUp, Bookmark, Share2, Flag, Edit,
  Trash2, ExternalLink, Swords, Zap, CheckCircle2, AlertTriangle,
  Shield, Sparkles, BookMarked
} from "lucide-react"

import api from "../utils/api"
import { useAuth } from "../hooks/useAuth"
import { UserAvatar, getTier } from "../utils/avatar"
import {
  PageWrapper, HudPanel, HudButton, GhostButton, RankBadge,
  Skeleton, Modal, ToastContainer
} from "../components/ui/index.jsx"

/* Company Monogram Avatar */
function CompanyMonogram({ name }) {
  const cleanName = (name || "C").trim()
  const initials = cleanName.length >= 2
    ? cleanName.slice(0, 2).toUpperCase()
    : cleanName.slice(0, 1).toUpperCase()

  let hash = 0
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorHue = Math.abs(hash % 360)

  return (
    <div
      className="w-16 h-16 shrink-0 flex items-center justify-center font-display font-black text-xl tracking-wider text-[color:var(--c-text)] rounded-xl shadow-xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${colorHue}, 60%, 25%), hsl(${colorHue}, 70%, 12%))`,
        border: `1.5px solid hsl(${colorHue}, 70%, 45%)`,
        clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
      }}
    >
      <span>{initials}</span>
    </div>
  )
}

const OUTCOME_CFG = {
  selected: { label: "SELECTED", col: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)" },
  rejected: { label: "REJECTED", col: "#E11D48", bg: "rgba(225,29,72,0.15)", border: "rgba(225,29,72,0.4)" },
  waiting:  { label: "WAITING",  col: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)" },
  withdrew: { label: "WITHDREW", col: "#94a3b8", bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.4)" },
}

const DIFF_CFG = {
  easy:   { label: "EASY",   col: "#10b981" },
  medium: { label: "MEDIUM", col: "#f59e0b" },
  hard:   { label: "HARD",   col: "#E11D48" },
}

export default function IntelReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Toast notifications
  const [toasts, setToasts] = useState([])
  const addToast = (message, type = "info") => {
    const toastId = Date.now()
    setToasts((prev) => [...prev, { id: toastId, message, type }])
  }
  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId))
  }

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)

  // Fetch single report
  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true)
        const { data } = await api.get(`/api/experiences/${id}`)
        setReport(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load report detail", err)
        setError(err.message || "Failed to load report")
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  // Toggle helpful
  const handleToggleHelpful = async () => {
    if (!report) return
    try {
      const { data } = await api.post(`/api/experiences/${id}/helpful`)
      setReport((prev) => ({
        ...prev,
        is_helpful: data.isHelpful,
        helpful_count: data.helpfulCount,
      }))
      addToast(data.isHelpful ? "Marked as helpful!" : "Helpful mark removed", "success")
    } catch (err) {
      addToast("Failed to update helpful state", "error")
    }
  }

  // Toggle bookmark
  const handleToggleBookmark = async () => {
    if (!report) return
    try {
      const { data } = await api.post(`/api/experiences/${id}/bookmark`)
      setReport((prev) => ({
        ...prev,
        is_bookmarked: data.isBookmarked,
      }))
      addToast(data.isBookmarked ? "Saved to your bookmarks!" : "Removed from bookmarks", "info")
    } catch (err) {
      addToast("Failed to update bookmark", "error")
    }
  }

  // Share link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    addToast("Intel Report link copied to clipboard!", "success")
  }

  // Submit report
  const handleSendReport = async () => {
    try {
      setSubmittingReport(true)
      await api.post(`/api/experiences/${id}/report`, { reason: reportReason })
      setShowReportModal(false)
      addToast("Report submitted. Thank you for keeping the arena safe.", "warning")
    } catch (err) {
      addToast(err.message || "Failed to submit report", "error")
    } finally {
      setSubmittingReport(false)
    }
  }

  // Delete report (Author only)
  const handleDeleteReport = async () => {
    if (!window.confirm("Are you sure you want to delete this intel report?")) return
    try {
      await api.delete(`/api/experiences/${id}`)
      addToast("Intel report deleted", "info")
      navigate("/experiences")
    } catch (err) {
      addToast(err.message || "Failed to delete report", "error")
    }
  }

  if (loading) {
    return (
      <PageWrapper heroGlow className="pt-20 sm:pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-6">
          <Skeleton height={30} width={200} />
          <HudPanel className="p-8 space-y-4">
            <Skeleton height={40} width="60%" />
            <Skeleton height={20} width="40%" />
            <Skeleton height={150} width="100%" />
          </HudPanel>
        </div>
      </PageWrapper>
    )
  }

  if (error || !report) {
    return (
      <PageWrapper heroGlow className="pt-20 sm:pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-4">
          <HudPanel className="p-8 border-rose-500/40">
            <p className="font-mono text-sm text-rose-400 mb-4">{error || "Report not found"}</p>
            <GhostButton onClick={() => navigate("/experiences")}>
              <ArrowLeft size={14} className="mr-1.5" /> BACK TO INTEL REPORTS
            </GhostButton>
          </HudPanel>
        </div>
      </PageWrapper>
    )
  }

  const outcomeObj = OUTCOME_CFG[report.outcome] || OUTCOME_CFG.selected
  const diffObj = DIFF_CFG[report.difficulty] || DIFF_CFG.medium
  const isOwner = user && report.author?.id === user.id

  return (
    <PageWrapper heroGlow className="pt-20 sm:pt-24 pb-20">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-8">
        
        {/* Top Back Link */}
        <button
          onClick={() => navigate("/experiences")}
          className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] transition-colors"
        >
          <ArrowLeft size={14} className="text-rose-500" /> BACK TO INTEL REPORTS
        </button>

        {/* Pending Review Warning for Author */}
        {report.status === "pending" && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-lg flex items-center gap-3 text-amber-300 font-mono text-xs">
            <AlertTriangle size={18} className="shrink-0 text-amber-400" />
            <span>
              <strong>PENDING MODERATION REVIEW:</strong> This report is currently visible only to you while our moderators verify its content.
            </span>
          </div>
        )}

        {/* HEADER DOSSIER CARD */}
        <HudPanel className="p-6 sm:p-8 space-y-6 relative overflow-hidden bg-slate-950/90" glow glowColor="rgba(225,29,72,0.12)">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-start gap-4">
              <CompanyMonogram name={report.company} />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display font-black text-2xl sm:text-4xl text-[color:var(--c-text)] tracking-wide">
                    {report.company}
                  </h1>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                    {report.track} TRACK
                  </span>
                </div>
                <p className="font-sans text-base text-[color:var(--c-text-dim)] font-medium">
                  {report.role_title}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span
                className="font-bold px-3 py-1 rounded"
                style={{ background: outcomeObj.bg, color: outcomeObj.col, border: `1px solid ${outcomeObj.border}` }}
              >
                {outcomeObj.label}
              </span>
              <span
                className="font-bold px-3 py-1 bg-[color:var(--c-panel)] border border-slate-800"
                style={{ color: diffObj.col }}
              >
                {diffObj.label}
              </span>
            </div>
          </div>

          {/* Key Facts Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 bg-[color:var(--c-panel)]/80 border border-slate-800 space-y-1">
              <p className="text-[10px] text-[color:var(--c-text-mute)] uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> YEAR / MONTH
              </p>
              <p className="font-bold text-[color:var(--c-text)]">
                {report.year} {report.month ? `/ Month ${report.month}` : ""}
              </p>
            </div>

            {report.location && (
              <div className="p-3 bg-[color:var(--c-panel)]/80 border border-slate-800 space-y-1">
                <p className="text-[10px] text-[color:var(--c-text-mute)] uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={12} /> LOCATION
                </p>
                <p className="font-bold text-[color:var(--c-text)] truncate">{report.location}</p>
              </div>
            )}

            {report.source && (
              <div className="p-3 bg-[color:var(--c-panel)]/80 border border-slate-800 space-y-1">
                <p className="text-[10px] text-[color:var(--c-text-mute)] uppercase tracking-wider flex items-center gap-1">
                  <Briefcase size={12} /> SOURCE
                </p>
                <p className="font-bold text-[color:var(--c-text)] uppercase">{report.source.replace("_", " ")}</p>
              </div>
            )}

            {(report.stipend_range || report.ctc_range) && (
              <div className="p-3 bg-[color:var(--c-panel)]/80 border border-slate-800 space-y-1">
                <p className="text-[10px] text-[color:var(--c-text-mute)] uppercase tracking-wider flex items-center gap-1">
                  <DollarSign size={12} /> COMPENSATION
                </p>
                <p className="font-bold text-amber-400 truncate">
                  {report.stipend_range || report.ctc_range}
                </p>
              </div>
            )}
          </div>

          {/* Author Block & Interaction Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
            {/* Author */}
            <div className="flex items-center gap-3">
              <UserAvatar
                username={report.author.username}
                seed={report.author.avatar_seed}
                style={report.author.avatar_style}
                elo={report.author.elo_rating}
                size={34}
              />
              <div>
                <p className="font-mono text-xs font-bold text-[color:var(--c-text)]">
                  {report.author.username}
                </p>
                {report.author.elo_rating && (
                  <RankBadge elo={report.author.elo_rating} size="xs" />
                )}
              </div>
            </div>

            {/* Interaction Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleToggleHelpful}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold rounded border transition-colors ${
                  report.is_helpful
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                    : "bg-[color:var(--c-panel)] border-slate-800 text-[color:var(--c-text-dim)] hover:text-[color:var(--c-text)]"
                }`}
              >
                <ThumbsUp size={13} />
                <span>HELPFUL ({report.helpful_count || 0})</span>
              </button>

              <button
                onClick={handleToggleBookmark}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold rounded border transition-colors ${
                  report.is_bookmarked
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-[color:var(--c-panel)] border-slate-800 text-[color:var(--c-text-dim)] hover:text-[color:var(--c-text)]"
                }`}
              >
                <Bookmark size={13} />
                <span>{report.is_bookmarked ? "SAVED" : "SAVE"}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2 bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text-dim)] hover:text-[color:var(--c-text)] rounded"
                title="Share link"
              >
                <Share2 size={14} />
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text-mute)] hover:text-rose-400 rounded"
                title="Report inappropriate content"
              >
                <Flag size={14} />
              </button>

              {/* Owner actions */}
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate(`/experiences/${id}/edit`)}
                    className="p-2 bg-[color:var(--c-panel)] border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded"
                    title="Edit report"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={handleDeleteReport}
                    className="p-2 bg-[color:var(--c-panel)] border border-slate-800 text-rose-500 hover:text-rose-400 rounded"
                    title="Delete report"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>

          </div>
        </HudPanel>

        {/* OVERALL EXPERIENCE */}
        <section className="space-y-3">
          <h2 className="font-display font-black text-xl text-[color:var(--c-text)] uppercase tracking-wide flex items-center gap-2">
            <FileText size={18} className="text-rose-500" /> OVERALL EXPERIENCE
          </h2>
          <HudPanel className="p-6 bg-slate-950/90 font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-line border-slate-800">
            {report.overall_experience}
          </HudPanel>
        </section>

        {/* INTERVIEW ROUNDS STEPPER TIMELINE */}
        {Array.isArray(report.rounds) && report.rounds.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-display font-black text-xl text-[color:var(--c-text)] uppercase tracking-wide flex items-center gap-2">
              <Zap size={18} className="text-cyan-400" /> ROUND BREAKDOWN ({report.rounds.length})
            </h2>

            <div className="space-y-6 relative border-l-2 border-slate-800 ml-4 pl-6">
              {report.rounds.map((round, rIdx) => (
                <div key={rIdx} className="relative space-y-3">
                  
                  {/* Stepper Node */}
                  <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-500 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    {rIdx + 1}
                  </div>

                  <HudPanel className="p-5 space-y-4 bg-slate-950/90 border-slate-800">
                    {/* Round Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                          ROUND // {round.type?.replace("_", " ")}
                        </span>
                        <h3 className="font-display font-bold text-lg text-[color:var(--c-text)]">
                          {round.title || round.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || `Round ${rIdx + 1}`}
                        </h3>
                      </div>
                      {round.durationMinutes && (
                        <span className="font-mono text-xs text-[color:var(--c-text-mute)] flex items-center gap-1 bg-[color:var(--c-panel)] px-2.5 py-1 rounded border border-slate-800">
                          <Clock size={12} /> {round.durationMinutes} MIN
                        </span>
                      )}
                    </div>

                    {/* Round Description */}
                    {round.description && (
                      <p className="font-sans text-xs text-[color:var(--c-text-dim)] leading-relaxed whitespace-pre-line">
                        {round.description}
                      </p>
                    )}

                    {/* Questions List */}
                    {Array.isArray(round.questions) && round.questions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--c-text-mute)]">
                          QUESTIONS ASKED ({round.questions.length})
                        </p>
                        <div className="space-y-2">
                          {round.questions.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="p-3 bg-[color:var(--c-panel)]/90 border border-slate-800 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <p className="font-sans text-xs text-slate-200 font-medium">
                                  {q.text}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-cyan-400 font-bold uppercase">
                                    TOPIC // {q.topic}
                                  </span>
                                  {q.difficulty && (
                                    <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-amber-400 font-bold uppercase">
                                      {q.difficulty}
                                    </span>
                                  )}
                                  {q.link && (
                                    <a
                                      href={q.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[color:var(--c-text-mute)] hover:text-[color:var(--c-text)] inline-flex items-center gap-1"
                                    >
                                      <ExternalLink size={10} /> Link
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Practice This Topic Button -> Navigates to Lobby with Topic preselected */}
                              <button
                                onClick={() => navigate(`/lobby?topic=${encodeURIComponent(q.topic)}`)}
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[color:var(--c-text)] bg-rose-600 hover:bg-rose-500 rounded transition-colors"
                              >
                                <Swords size={12} /> PRACTICE TOPIC
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </HudPanel>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* TIPS & PREP RESOURCES */}
        {(report.tips || report.prep_resources) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.tips && (
              <section className="space-y-3">
                <h2 className="font-display font-black text-lg text-[color:var(--c-text)] uppercase tracking-wide flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" /> TIPS & ADVICE
                </h2>
                <HudPanel className="p-5 bg-slate-950/90 font-sans text-xs text-[color:var(--c-text-dim)] leading-relaxed whitespace-pre-line border-slate-800">
                  {report.tips}
                </HudPanel>
              </section>
            )}

            {report.prep_resources && (
              <section className="space-y-3">
                <h2 className="font-display font-black text-lg text-[color:var(--c-text)] uppercase tracking-wide flex items-center gap-2">
                  <BookMarked size={16} className="text-cyan-400" /> PREPARATION RESOURCES
                </h2>
                <HudPanel className="p-5 bg-slate-950/90 font-sans text-xs text-[color:var(--c-text-dim)] leading-relaxed whitespace-pre-line border-slate-800">
                  {report.prep_resources}
                </HudPanel>
              </section>
            )}
          </div>
        )}

      </div>

      {/* REPORT MODAL */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="REPORT INTEL REPORT"
        subtitle="// COMMUNITY SAFETY"
      >
        <div className="space-y-4">
          <p className="font-sans text-xs text-[color:var(--c-text-dim)]">
            Please specify why you are reporting this experience report. Flagged posts exceeding threshold will be sent for moderation.
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason for report (e.g. NDA violation, inappropriate content, fake report)..."
            rows={4}
            className="w-full bg-[color:var(--c-panel)] border border-slate-800 text-[color:var(--c-text)] font-mono text-xs p-3 outline-none focus:border-rose-500 rounded"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <GhostButton onClick={() => setShowReportModal(false)}>CANCEL</GhostButton>
            <HudButton disabled={submittingReport || !reportReason.trim()} onClick={handleSendReport}>
              {submittingReport ? "SUBMITTING..." : "SUBMIT REPORT"}
            </HudButton>
          </div>
        </div>
      </Modal>

    </PageWrapper>
  )
}
