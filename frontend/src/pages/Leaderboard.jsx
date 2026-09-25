import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { UserAvatar, getTier, RANK_TIERS } from '../utils/avatar'

/* ════════════════════════════════════════════════
   PODIUM CARD (TOP 3 PLAYERS)
════════════════════════════════════════════════ */
function PodiumCard({ player, rank, onSelect }) {
  if (!player) return null
  const isFirst = rank === 1
  const tier = getTier(player.elo_rating)
  const total = (player.wins ?? 0) + (player.losses ?? 0)
  const wr = total > 0 ? Math.round(((player.wins ?? 0) / total) * 100) : 0

  return (
    <div
      onClick={onSelect}
      className={`relative p-6 sm:p-7 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-4 hover:scale-[1.02] ${
        isFirst
          ? 'bg-[#0e111a] border-2 z-10 shadow-2xl scale-[1.04] sm:scale-[1.06]'
          : 'bg-[#090b12] border shadow-xl'
      }`}
      style={{
        borderColor: isFirst ? '#f59e0b' : `${tier.col}40`,
        boxShadow: isFirst ? `0 0 30px ${tier.col}25` : `0 0 15px ${tier.col}10`,
      }}
    >
      {/* Top Rank Badge */}
      {isFirst ? (
        <div
          className="absolute -top-3.5 inset-x-0 mx-auto w-max px-3.5 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
          style={{ background: '#f59e0b', color: '#07080c' }}
        >
          <span>👑</span>
          <span>{tier.name}</span>
        </div>
      ) : (
        <div className="absolute top-4 left-4 font-mono text-2xl">
          {rank === 2 ? '🥈' : '🥉'}
        </div>
      )}

      {/* Avatar */}
      <div className="pt-2">
        <UserAvatar
          username={player.username}
          seed={player.avatar_seed}
          style={player.avatar_style}
          elo={player.elo_rating}
          size={isFirst ? 68 : 54}
        />
      </div>

      {/* Username */}
      <div className="space-y-1">
        <p className="font-display font-black text-lg sm:text-xl text-white truncate max-w-[170px]">
          {player.username}
        </p>
        <span
          className="font-mono text-[9.5px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold inline-block"
          style={{ background: tier.bg, color: tier.col, border: `1px solid ${tier.col}40` }}
        >
          {tier.name}
        </span>
      </div>

      {/* Elo Rating */}
      <div>
        <p className="font-display font-black text-3xl sm:text-4xl tabular-nums" style={{ color: tier.col }}>
          {player.elo_rating}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#6e7681] mt-0.5">
          ELO RATING
        </p>
      </div>

      {/* Stat Pills */}
      <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[11px] font-bold flex-wrap">
        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          W: {player.wins ?? 0}
        </span>
        <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
          L: {player.losses ?? 0}
        </span>
        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {wr}% WR
        </span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   SKELETON ROW
════════════════════════════════════════════════ */
function SkeletonRow() {
  return (
    <tr className="border-b border-[#1e2130]/50 animate-pulse">
      <td className="py-4 px-6"><div className="w-6 h-4 bg-[#1e2130] rounded" /></td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1e2130] rounded-md" />
          <div className="w-24 h-4 bg-[#1e2130] rounded" />
        </div>
      </td>
      <td className="py-4 px-6"><div className="w-12 h-4 bg-[#1e2130] rounded" /></td>
      <td className="py-4 px-6"><div className="w-16 h-4 bg-[#1e2130] rounded" /></td>
      <td className="py-4 px-6"><div className="w-20 h-4 bg-[#1e2130] rounded" /></td>
      <td className="py-4 px-6 text-right"><div className="w-16 h-4 bg-[#1e2130] rounded ml-auto" /></td>
    </tr>
  )
}

/* ════════════════════════════════════════════════
   LEADERBOARD PAGE
════════════════════════════════════════════════ */
export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search, setSearch] = useState('')
  const [timeframe, setTimeframe] = useState('global') // 'global' | 'weekly' | 'monthly' | 'friends'
  const searchRef = useRef(null)

  async function fetchLeaderboard() {
    try {
      setLoading(true)
      const { data } = await api.get('/api/users/leaderboard')
      setPlayers(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError('Failed to load leaderboard. Is the backend running?')
      console.error('[Leaderboard]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    const t = setInterval(fetchLeaderboard, 30_000)
    return () => clearInterval(t)
  }, [])

  const myRank = players.find(p => p.username === user?.username)

  // Filter logic
  const q = search.trim().toLowerCase()
  const filtered = q
    ? players.filter(p => p.username?.toLowerCase().includes(q))
    : players

  // Top 3 Podium
  const top1 = players[0]
  const top2 = players[1]
  const top3 = players[2]
  const restPlayers = filtered.length > 0 ? (q ? filtered : players.slice(3)) : []

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#050608] text-[#dde1ea] pb-20">

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="pt-12 pb-10 px-5 sm:px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <p className="font-mono text-xs uppercase tracking-widest text-[#f97316] font-bold">
            // Global Arena Ranks
          </p>
          <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
            Global Rankings
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#8b949e] max-w-xl mx-auto">
            Top coders ranked by ELO rating. Click on a player to view their full duel stats & history.
          </p>
        </div>
      </div>

      {/* ── TOP 3 PODIUM SHOWCASE ────────────────────────────── */}
      {!loading && !error && players.length >= 1 && (
        <div className="max-w-5xl mx-auto px-5 sm:px-8 mb-14">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {/* Rank 2 (Left) */}
            <div className="order-2 md:order-1">
              <PodiumCard
                player={top2}
                rank={2}
                onSelect={() => top2 && navigate(`/profile/${encodeURIComponent(top2.username)}`)}
              />
            </div>

            {/* Rank 1 (Center - Main Spotlight) */}
            <div className="order-1 md:order-2">
              <PodiumCard
                player={top1}
                rank={1}
                onSelect={() => top1 && navigate(`/profile/${encodeURIComponent(top1.username)}`)}
              />
            </div>

            {/* Rank 3 (Right) */}
            <div className="order-3 md:order-3">
              <PodiumCard
                player={top3}
                rank={3}
                onSelect={() => top3 && navigate(`/profile/${encodeURIComponent(top3.username)}`)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER & SEARCH BAR ROW ─────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#090b13] border border-[#1e2130] p-2 rounded-2xl shadow-lg">

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#050608] p-1 rounded-xl border border-[#1e2130] w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'global', label: 'Global' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'friends', label: 'Friends' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  timeframe === tab.id
                    ? 'bg-[#1e2130] text-white shadow-sm border border-white/10'
                    : 'text-[#6e7681] hover:text-[#8b949e]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#050608] border border-[#1e2130] rounded-xl focus-within:border-white/40 transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#6e7681]">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search player..."
                className="w-full bg-transparent outline-none font-mono text-xs text-white placeholder:text-[#6e7681]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-xs text-[#6e7681] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RANKINGS TABLE ──────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="bg-[#090b13] border border-[#1e2130] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2130] text-[10px] font-mono uppercase tracking-wider text-[#6e7681] bg-[#07080c]">
                  <th className="py-3.5 px-6">RANK</th>
                  <th className="py-3.5 px-6">PLAYER</th>
                  <th className="py-3.5 px-6">ELO RATING</th>
                  <th className="py-3.5 px-6">WIN RATE</th>
                  <th className="py-3.5 px-6">WINS / LOSSES</th>
                  <th className="py-3.5 px-6 text-right">RANK TIER</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1e2130]/60">
                {error ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center font-mono text-sm text-rose-400">
                      {error}
                      <button onClick={fetchLeaderboard} className="block mx-auto mt-2 text-xs text-white underline">
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                ) : restPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-mono text-sm text-[#6e7681]">
                      {search ? `No player found matching "${search}"` : 'No additional players registered yet.'}
                    </td>
                  </tr>
                ) : (
                  restPlayers.map((p, idx) => {
                    const actualRank = q ? p.rank : idx + 4
                    const tier = getTier(p.elo_rating)
                    const total = (p.wins ?? 0) + (p.losses ?? 0)
                    const wr = total > 0 ? Math.round(((p.wins ?? 0) / total) * 100) : 0
                    const isMe = p.username === user?.username

                    return (
                      <tr
                        key={p.id || p.username}
                        onClick={() => navigate(`/profile/${encodeURIComponent(p.username)}`)}
                        className={`transition-colors cursor-pointer hover:bg-white/[0.03] ${
                          isMe ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-6 font-mono text-sm font-bold text-[#6e7681]">
                          #{actualRank}
                        </td>

                        {/* Player */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              username={p.username}
                              seed={p.avatar_seed}
                              style={p.avatar_style}
                              elo={p.elo_rating}
                              size={34}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-sans font-bold text-sm text-white">
                                  {p.username}
                                </span>
                                {isMe && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Elo */}
                        <td className="py-4 px-6 font-display font-black text-base tabular-nums" style={{ color: tier.col }}>
                          {p.elo_rating}
                        </td>

                        {/* Win Rate */}
                        <td className="py-4 px-6 font-mono text-xs font-bold text-amber-400">
                          {wr}%
                        </td>

                        {/* Wins / Losses */}
                        <td className="py-4 px-6 font-mono text-xs text-[#8b949e]">
                          <span className="text-emerald-400 font-bold">{p.wins ?? 0}W</span> · <span className="text-rose-400 font-bold">{p.losses ?? 0}L</span>
                        </td>

                        {/* Rank Tier */}
                        <td className="py-4 px-6 text-right">
                          <span
                            className="font-mono text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold inline-block"
                            style={{ background: tier.bg, color: tier.col, border: `1px solid ${tier.col}40` }}
                          >
                            {tier.name}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between mt-4 font-mono text-xs text-[#6e7681]">
          <span>Top {players.length} players ranked · Refreshes every 30s</span>
          {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  )
}
