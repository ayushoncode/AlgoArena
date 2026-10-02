import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, X, Trophy, Medal, Award,
  Shield, RefreshCw, Users, Globe, Calendar,
  ChevronRight, TrendingUp,
} from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import api from "../utils/api"
import { UserAvatar, getTier } from "../utils/avatar"
import {
  HudPanel, RankBadge, PageWrapper, Skeleton, EmptyState, AnimatedCounter,
} from "../components/ui/index.jsx"
import { institutes } from "../utils/institutes"

/* --- Podium medal config ------------------------------------------- */
const MEDAL = {
  1: { Icon: Trophy, col: "#F5B942", glow: "rgba(245,185,66,0.45)", label: "1ST" },
  2: { Icon: Medal, col: "#94a3b8", glow: "rgba(148,163,184,0.35)", label: "2ND" },
  3: { Icon: Award, col: "#cd7c4b", glow: "rgba(205,124,75,0.35)", label: "3RD" },
}

/* --- Podium Card ------------------------------------------------------ */
function PodiumCard({ player, rank, onSelect, delay = 0 }) {
  if (!player) return null
  const tier = getTier(player.elo_rating)
  const total = (player.wins ?? 0) + (player.losses ?? 0)
  const wr = total > 0 ? Math.round(((player.wins ?? 0) / total) * 100) : 0
  const m = MEDAL[rank]
  const MIcon = m.Icon
  const isFirst = rank === 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      style={{ cursor: "pointer" }}
    >
      <HudPanel
        className="p-5 sm:p-6 flex flex-col items-center text-center gap-3 transition-transform duration-200 hover:scale-[1.025]"
        style={{
          borderColor: m.col + "55",
          boxShadow: isFirst ? `0 0 40px ${m.glow}` : `0 0 18px ${m.glow}`,
          background: isFirst ? "rgba(15,20,36,0.95)" : "var(--c-panel)",
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest"
          style={{ background: m.col + "18", border: `1px solid ${m.col}50`, color: m.col }}
        >
          <MIcon size={11} strokeWidth={2.5} />
          {m.label}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ padding: 3, background: m.col + "15", border: `2px solid ${m.col}`, boxShadow: `0 0 20px ${m.col}50` }}
        >
          <UserAvatar username={player.username} seed={player.avatar_seed} style={player.avatar_style} elo={player.elo_rating} size={isFirst ? 72 : 58} />
        </div>

        <div className="space-y-1.5 w-full">
          <p className="font-display font-black text-lg sm:text-xl truncate max-w-[180px] mx-auto" style={{ color: "var(--c-text)", letterSpacing: "0.04em" }}>
            {player.username}
          </p>
          {player.institute && (
            <p className="font-mono text-[9px] text-slate-400 truncate max-w-[160px] mx-auto mt-0.5" title={player.institute}>
              {player.institute}
            </p>
          )}
          <RankBadge elo={player.elo_rating} size="xs" />
        </div>

        <div>
          <p className="font-display font-black text-3xl sm:text-4xl tabular-nums" style={{ color: tier.col }}>
            <AnimatedCounter value={player.elo_rating} duration={700} />
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest mt-0.5" style={{ color: "var(--c-text-mute)" }}>ELO RATING</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center font-mono text-[10px] font-bold w-full pt-1">
          <span style={{ padding: "3px 8px", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>{player.wins ?? 0}W</span>
          <span style={{ padding: "3px 8px", background: "rgba(225,29,72,0.12)", color: "#E11D48", border: "1px solid rgba(225,29,72,0.3)" }}>{player.losses ?? 0}L</span>
          <span style={{ padding: "3px 8px", background: "rgba(245,185,66,0.1)", color: "#F5B942", border: "1px solid rgba(245,185,66,0.3)" }}>{wr}% WR</span>
        </div>
      </HudPanel>
    </motion.div>
  )
}

/* --- Skeleton row --------------------------------------------------- */
function SkeletonRow() {
  return (
    <tr className="border-b animate-pulse" style={{ borderColor: "var(--c-border)" }}>
      <td className="py-4 px-4 sm:px-6"><Skeleton width={28} height={13} /></td>
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton width={34} height={34} style={{ borderRadius: 6 }} />
          <Skeleton width={90} height={13} />
        </div>
      </td>
      <td className="py-4 px-4 sm:px-6"><Skeleton width={52} height={13} /></td>
      <td className="py-4 px-4 sm:px-6 hidden sm:table-cell"><Skeleton width={38} height={13} /></td>
      <td className="py-4 px-4 sm:px-6 hidden md:table-cell"><Skeleton width={64} height={13} /></td>
      <td className="py-4 px-4 sm:px-6 text-right"><Skeleton width={72} height={20} style={{ marginLeft: "auto" }} /></td>
    </tr>
  )
}

/* --- Table row ----------------------------------------------------- */
function PlayerRow({ player, actualRank, isMe, onClick, delay = 0 }) {
  const tier = getTier(player.elo_rating)
  const total = (player.wins ?? 0) + (player.losses ?? 0)
  const wr = total > 0 ? Math.round(((player.wins ?? 0) / total) * 100) : 0

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(delay * 0.04, 0.5) }}
      onClick={onClick}
      className="transition-colors cursor-pointer group"
      style={{ borderBottom: "1px solid var(--c-border)", background: isMe ? tier.col + "08" : "transparent" }}
      onMouseEnter={e => e.currentTarget.style.background = isMe ? tier.col + "12" : "rgba(255,255,255,0.025)"}
      onMouseLeave={e => e.currentTarget.style.background = isMe ? tier.col + "08" : "transparent"}
    >
      <td className="py-4 px-4 sm:px-6 font-mono text-sm font-bold" style={{ color: "var(--c-text-mute)" }}>
        <span className="group-hover:hidden">#{actualRank}</span>
        <ChevronRight size={14} className="hidden group-hover:block" style={{ color: "var(--c-red)" }} />
      </td>
      <td className="py-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <UserAvatar username={player.username} seed={player.avatar_seed} style={player.avatar_style} elo={player.elo_rating} size={34} />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-sm" style={{ color: "var(--c-text)" }}>{player.username}</span>
              {isMe && (
                <span className="font-mono text-[8px] px-1.5 py-0.5 font-black uppercase tracking-widest" style={{ background: "var(--c-red)", color: "#fff" }}>YOU</span>
              )}
            </div>
            {player.institute && (
              <span className="font-mono text-[10px] text-slate-400 mt-0.5 max-w-[160px] sm:max-w-[200px] truncate" title={player.institute}>
                {player.institute}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-4 sm:px-6 font-display font-black text-base tabular-nums" style={{ color: tier.col }}>{player.elo_rating}</td>
      <td className="py-4 px-4 sm:px-6 font-mono text-xs font-bold hidden sm:table-cell" style={{ color: "#F5B942" }}>{wr}%</td>
      <td className="py-4 px-4 sm:px-6 font-mono text-xs hidden md:table-cell">
        <span style={{ color: "#10b981", fontWeight: 700 }}>{player.wins ?? 0}W</span>
        <span style={{ color: "var(--c-text-mute)" }}> · </span>
        <span style={{ color: "#E11D48", fontWeight: 700 }}>{player.losses ?? 0}L</span>
      </td>
      <td className="py-4 px-4 sm:px-6 text-right">
        <RankBadge elo={player.elo_rating} size="xs" />
      </td>
    </motion.tr>
  )
}

/* =================================================================
   LEADERBOARD PAGE
================================================================= */
export default function Leaderboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search, setSearch] = useState("")
  const [instituteSearch, setInstituteSearch] = useState("")
  const [instituteFilter, setInstituteFilter] = useState("")
  const [showInstituteSuggestions, setShowInstituteSuggestions] = useState(false)
  const searchRef = useRef(null)

  async function fetchLeaderboard(inst = instituteFilter) {
    try {
      setLoading(true)
      const query = inst ? `?institute=${encodeURIComponent(inst)}` : ""
      const { data } = await api.get(`/api/users/leaderboard${query}`)
      setPlayers(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError("Failed to load leaderboard. Is the backend running?")
      console.error("[Leaderboard]", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    const t = setInterval(() => fetchLeaderboard(instituteFilter), 30_000)
    return () => clearInterval(t)
  }, [instituteFilter])

  const instituteSuggestions = instituteSearch
    ? institutes.filter(inst => inst.toLowerCase().includes(instituteSearch.toLowerCase())).slice(0, 5)
    : []

  const q = search.trim().toLowerCase()
  const filtered = q ? players.filter(p => p.username?.toLowerCase().includes(q)) : players
  const top1 = players[0]
  const top2 = players[1]
  const top3 = players[2]
  const restPlayers = filtered.length > 0 ? (q ? filtered : players.slice(3)) : []
  const myRankIdx = players.findIndex(p => p.username === user?.username)

  return (
    <PageWrapper heroGlow style={{ paddingBottom: "5rem" }}>

      {/* HERO */}
      <div className="pt-14 pb-10 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, var(--c-red), var(--c-blue), transparent)" }} />

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-3 relative z-10">
          <p className="section-label">// Global Arena Ranks</p>
          <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "0.02em" }}>
            {instituteFilter ? (
              <span className="text-xl sm:text-3xl line-clamp-1 truncate max-w-full" style={{ color: "var(--c-red)" }}>{instituteFilter.toUpperCase()}</span>
            ) : (
              <>GLOBAL <span style={{ color: "var(--c-red)" }}>RANKINGS</span></>
            )}
          </h1>
          <p className="font-sans text-sm sm:text-base max-w-xl mx-auto" style={{ color: "var(--c-text-mute)" }}>
            Top coders ranked by ELO rating. Click on a player to view their full duel stats &amp; history.
          </p>
          {user && !loading && myRankIdx >= 0 && (
            <div className="flex justify-center pt-1">
              <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1.5"
                style={{ background: "rgba(225,29,72,0.1)", border: "1px solid rgba(225,29,72,0.35)", color: "var(--c-red)" }}>
                <Shield size={10} strokeWidth={2.5} />
                YOUR RANK · #{myRankIdx + 1}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* PODIUM */}
      {!loading && !error && players.length >= 1 && (
        <div className="max-w-5xl mx-auto px-5 sm:px-8 mb-14">
          <div className="flex items-center gap-3 mb-5">
            <Trophy size={14} style={{ color: "#F5B942" }} />
            <span className="section-label" style={{ color: "#F5B942", marginBottom: 0 }}>HALL OF FAME</span>
            <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            <div className="sm:mb-0 mt-4 sm:mt-6">
              <PodiumCard player={top2} rank={2} delay={0.1} onSelect={() => top2 && navigate(`/profile/${encodeURIComponent(top2.username)}`)} />
            </div>
            <div className="order-first sm:order-none">
              <PodiumCard player={top1} rank={1} delay={0} onSelect={() => top1 && navigate(`/profile/${encodeURIComponent(top1.username)}`)} />
            </div>
            <div className="mt-4 sm:mt-10">
              <PodiumCard player={top3} rank={3} delay={0.2} onSelect={() => top3 && navigate(`/profile/${encodeURIComponent(top3.username)}`)} />
            </div>
          </div>
        </div>
      )}

      {/* FILTER + SEARCH */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 mb-5">
        <HudPanel className="p-2 flex flex-col sm:flex-row items-center gap-3" style={{ clipPath: 'none', borderRadius: '4px' }}>
          <div className="flex items-center gap-2 p-1 w-full sm:w-auto overflow-visible shrink-0 relative"
            style={{ background: "var(--c-void)", border: "1px solid var(--c-border)" }}>
            <Search size={13} style={{ color: "var(--c-text-mute)", flexShrink: 0, marginLeft: 8 }} />
            <input
              type="text"
              value={instituteSearch}
              onChange={e => {
                setInstituteSearch(e.target.value)
                if (e.target.value === "") {
                  setInstituteFilter("")
                }
              }}
              onFocus={() => setShowInstituteSuggestions(true)}
              onBlur={() => setTimeout(() => setShowInstituteSuggestions(false), 200)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setInstituteFilter(instituteSearch)
                  setShowInstituteSuggestions(false)
                }
              }}
              placeholder="Search by institute..."
              className="w-full sm:w-64 bg-transparent outline-none font-mono text-xs py-1"
              style={{ color: "var(--c-text)" }}
            />
            {instituteSearch && (
              <button
                onClick={() => {
                  setInstituteSearch("")
                  setInstituteFilter("")
                }}
                className="pr-2"
                style={{ color: "var(--c-text-mute)" }}
              >
                <X size={12} />
              </button>
            )}

            <AnimatePresence>
              {showInstituteSuggestions && instituteSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 rounded shadow-xl"
                  style={{ background: "var(--c-void)", border: "1px solid var(--c-border)" }}
                >
                  {instituteSuggestions.map((inst, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 font-mono text-xs cursor-pointer hover:bg-white/10"
                      style={{ color: "var(--c-text)", borderBottom: i === instituteSuggestions.length - 1 ? "none" : "1px solid var(--c-border)" }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setInstituteSearch(inst)
                        setInstituteFilter(inst)
                        setShowInstituteSuggestions(false)
                      }}
                    >
                      {inst}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative flex-1 w-full" style={{ maxWidth: 320, marginLeft: 'auto' }}>
            <div className="flex items-center gap-2 px-3 py-2 transition-colors duration-150"
              style={{ background: "var(--c-void)", border: "1px solid var(--c-border)" }}>
              <Search size={13} style={{ color: "var(--c-text-mute)", flexShrink: 0 }} />
              <input
                ref={searchRef}
                id="leaderboard-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search player..."
                className="w-full bg-transparent outline-none font-mono text-xs"
                style={{ color: "var(--c-text)" }}
              />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearch("")}
                    style={{ color: "var(--c-text-mute)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--c-red)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-mute)"}>
                    <X size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button onClick={fetchLeaderboard} title="Refresh"
            className="shrink-0 p-2 transition-colors duration-150 cursor-pointer"
            style={{ background: "transparent", border: "1px solid var(--c-border)", color: "var(--c-text-mute)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--c-blue)"; e.currentTarget.style.borderColor = "var(--c-blue)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-mute)"; e.currentTarget.style.borderColor = "var(--c-border)" }}>
            <RefreshCw size={13} strokeWidth={2.5} />
          </button>
        </HudPanel>
      </div>

      {/* RANKINGS TABLE */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <HudPanel style={{ overflow: "hidden" }}>
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3"
            style={{ borderBottom: "1px solid var(--c-border)", background: "rgba(5,7,15,0.5)" }}>
            <Users size={12} style={{ color: "var(--c-text-mute)" }} />
            <span className="section-label" style={{ marginBottom: 0 }}>RANK TABLE</span>
            <div className="flex-1" />
            {!loading && (
              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--c-text-mute)" }}>
                {players.length} players
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="font-mono text-[9.5px] uppercase tracking-wider"
                  style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-mute)", background: "rgba(5,7,15,0.3)" }}>
                  <th className="py-3 px-4 sm:px-6 font-semibold">RANK</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">PLAYER</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold">ELO</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold hidden sm:table-cell">WIN RATE</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold hidden md:table-cell">RECORD</th>
                  <th className="py-3 px-4 sm:px-6 font-semibold text-right">TIER</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center font-mono text-sm" style={{ color: "var(--c-red)" }}>
                      {error}
                      <button onClick={fetchLeaderboard} className="block mx-auto mt-2 text-xs underline cursor-pointer"
                        style={{ color: "var(--c-text-mute)", background: "none", border: "none" }}>Retry</button>
                    </td>
                  </tr>
                ) : loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : restPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon={Users}
                        title={search ? `No player matching "${search}"` : "No additional players registered yet."}
                        subtitle={search ? "Try a different search term." : "Be the first to climb the ranks."} />
                    </td>
                  </tr>
                ) : (
                  restPlayers.map((p, idx) => {
                    const actualRank = q ? (players.findIndex(pl => pl.username === p.username) + 1) : idx + 4
                    const isMe = p.username === user?.username
                    return (
                      <PlayerRow
                        key={p.id || p.username}
                        player={p}
                        actualRank={actualRank}
                        isMe={isMe}
                        delay={idx}
                        onClick={() => navigate(`/profile/${encodeURIComponent(p.username)}`)}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </HudPanel>

        <div className="flex items-center justify-between mt-3 font-mono text-[10px]" style={{ color: "var(--c-text-mute)" }}>
          <span className="flex items-center gap-1.5">
            <RefreshCw size={9} />
            Top {players.length} players · Auto-refreshes every 30s
          </span>
          {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

    </PageWrapper>
  )
}
