import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import { UserAvatar } from '../utils/avatar'

/* ════════════════════════════════════════════════
   RANK BADGE
════════════════════════════════════════════════ */
function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>
  return (
    <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color:'#374151', minWidth:20, textAlign:'right' }}>
      {rank}
    </span>
  )
}

/* ════════════════════════════════════════════════
   TIER LABEL
════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════
   TIER SYSTEM — matches Profile.jsx RANK_TIERS exactly
════════════════════════════════════════════════ */
const RANK_TIERS = [
  { name: 'Novice',      min: 0,    max: 1199, col: '#94a3b8', bg: 'rgba(100,116,139,0.07)', border: 'rgba(100,116,139,0.25)' },
  { name: 'Challenger',  min: 1200, max: 1399, col: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)'  },
  { name: 'Specialist',  min: 1400, max: 1599, col: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)'   },
  { name: 'Elite',       min: 1600, max: 1899, col: '#818cf8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.3)'  },
  { name: 'Master',      min: 1900, max: 2199, col: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)'  },
  { name: 'Grandmaster', min: 2200, max: 9999, col: '#f97316', bg: 'rgba(249,115,22,0.14)',  border: 'rgba(249,115,22,0.3)'  },
]

function tierOf(elo) {
  for (const t of RANK_TIERS) {
    if (elo >= t.min && elo <= t.max) return t
  }
  return RANK_TIERS[0]
}

/* ════════════════════════════════════════════════
   SKELETON ROW
════════════════════════════════════════════════ */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom:'1px solid #0d0f17' }}>
      <div style={{ width:24, height:16, background:'#1e2130', borderRadius:3 }}/>
      <div style={{ width:28, height:28, background:'#1e2130', borderRadius:3 }}/>
      <div className="flex-1">
        <div style={{ width:100, height:12, background:'#1e2130', borderRadius:3, marginBottom:6 }}/>
        <div style={{ width:60, height:10, background:'#0d0f17', borderRadius:3 }}/>
      </div>
      <div style={{ width:40, height:20, background:'#1e2130', borderRadius:3 }}/>
      <div style={{ width:36, height:12, background:'#1e2130', borderRadius:3 }}/>
    </div>
  )
}

/* ════════════════════════════════════════════════
   LEADERBOARD ROW
════════════════════════════════════════════════ */
function LeaderRow({ player, isMe, highlight, onSelect }) {
  const tier    = tierOf(player.elo_rating)
  const total   = (player.wins ?? 0) + (player.losses ?? 0)
  const wr      = total > 0 ? Math.round(((player.wins ?? 0) / total) * 100) : 0

  // When search is active, glow the row with tier color
  const highlightBg = highlight
    ? `rgba(${tier.col === '#10b981' ? '16,185,129' : tier.col === '#06b6d4' ? '6,182,212' : tier.col === '#818cf8' ? '129,140,248' : tier.col === '#c084fc' ? '192,132,252' : tier.col === '#f97316' ? '249,115,22' : '100,116,139'}, 0.06)`
    : 'transparent'

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors cursor-pointer"
      style={{
        borderBottom: '1px solid #0d0f17',
        background: isMe ? 'rgba(249,115,22,0.04)' : highlightBg,
        borderLeft: isMe ? '2px solid #f97316' : highlight ? `2px solid ${tier.col}` : '2px solid transparent',
      }}
      onMouseOver={e => { if (!isMe) e.currentTarget.style.background = '#0d0f17' }}
      onMouseOut={e  => { if (!isMe) e.currentTarget.style.background = isMe ? 'rgba(249,115,22,0.04)' : highlightBg }}
    >
      {/* Rank */}
      <div className="shrink-0 w-6 flex justify-center">
        <RankBadge rank={Number(player.rank)} />
      </div>

      {/* Avatar */}
      <UserAvatar username={player.username} seed={player.avatar_seed} style={player.avatar_style} size={30} isMe={isMe} />

      {/* Name + tier */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold truncate"
                style={{ color: isMe ? '#f97316' : '#dde1ea' }}>
            {player.username}
          </span>
          {isMe && <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background:'rgba(249,115,22,0.1)', color:'#f97316', border:'1px solid rgba(249,115,22,0.2)', borderRadius:2 }}>you</span>}
          <span className="font-mono text-[9px] px-1.5 py-0.5 shrink-0 hidden sm:inline"
                style={{ background: tier.bg, color: tier.col, border:`1px solid ${tier.border}`, borderRadius:2 }}>
            {tier.name}
          </span>
        </div>
        <span className="font-mono text-[10px]" style={{ color:'#374151' }}>
          {player.wins ?? 0}W · {player.losses ?? 0}L · {wr}% WR
        </span>
      </div>

      {/* Elo — colored by tier */}
      <div className="text-right shrink-0">
        <p className="font-display font-black text-base tabular-nums"
           style={{ color: isMe ? '#f97316' : tier.col }}>
          {player.elo_rating}
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   LEADERBOARD PAGE
════════════════════════════════════════════════ */
export default function Leaderboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [search, setSearch]     = useState('')
  const searchRef               = React.useRef(null)

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
    const t = setInterval(fetchLeaderboard, 30_000)  // auto-refresh every 30s
    return () => clearInterval(t)
  }, [])

  const myRank = players.find(p => p.username === user?.username)

  // Live client-side filter
  const q = search.trim().toLowerCase()
  const filtered = q
    ? players.filter(p => p.username?.toLowerCase().includes(q))
    : players

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ borderBottom:'1px solid #1e2130', background:'#07080c' }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1"
               style={{ color:'#4b5563', letterSpacing:'0.14em' }}>// global rankings</p>
            <h1 className="font-display font-black text-2xl" style={{ color:'#dde1ea' }}>Leaderboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* My rank pill */}
            {isAuthenticated && myRank && (
              <div className="flex items-center gap-2 px-3 py-1.5"
                   style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:4 }}>
                <span className="font-mono text-[10px]" style={{ color:'#4b5563' }}>your rank</span>
                <span className="font-mono text-[13px] font-bold" style={{ color:'#f97316' }}>#{myRank.rank}</span>
              </div>
            )}

            {/* Refresh */}
            <button onClick={fetchLeaderboard}
                    className="font-mono text-[10px] px-3 py-1.5 transition-all"
                    style={{ color:'#4b5563', border:'1px solid #1e2130', borderRadius:4 }}
                    onMouseOver={e=>e.currentTarget.style.borderColor='rgba(249,115,22,0.3)'}
                    onMouseOut={e=>e.currentTarget.style.borderColor='#1e2130'}>
              ↺ refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-5 pb-1">
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{
            background: '#090b13',
            border: '1px solid #1e2130',
            borderRadius: 4,
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = '#1e2130'}
        >
          {/* Search icon */}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#4b5563', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setSearch('') }}
            placeholder="Search player by username..."
            className="flex-1 bg-transparent outline-none font-mono text-[12px]"
            style={{ color: '#dde1ea', caretColor: '#f97316' }}
            spellCheck={false}
            autoComplete="off"
          />

          {/* Clear button */}
          {search && (
            <button
              onClick={() => { setSearch(''); searchRef.current?.focus() }}
              className="font-mono text-[11px] leading-none px-1.5 py-0.5 transition-colors"
              style={{ color: '#4b5563', borderRadius: 2 }}
              onMouseOver={e => e.currentTarget.style.color = '#f43f5e'}
              onMouseOut={e  => e.currentTarget.style.color = '#4b5563'}
              title="Clear search (Esc)"
            >✕</button>
          )}

          {/* Match count badge */}
          {search && (
            <span className="font-mono text-[10px] px-2 py-0.5 shrink-0"
                  style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 3 }}>
              {filtered.length} found
            </span>
          )}
        </div>
      </div>

      {/* ── TABLE ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">

        <div style={{ background:'#090b13', border:'1px solid #1e2130', borderRadius:4, overflow:'hidden' }}>
          {/* Table header */}
          <div className="flex items-center gap-4 px-5 py-2.5"
               style={{ borderBottom:'1px solid #1e2130', background:'#07080c' }}>
            <span className="font-mono text-[9px] uppercase w-6 text-center" style={{ color:'#374151' }}>#</span>
            <span style={{ width:30 }}/>
            <span className="font-mono text-[9px] uppercase flex-1" style={{ color:'#374151' }}>player</span>
            <span className="font-mono text-[9px] uppercase" style={{ color:'#374151' }}>rating</span>
          </div>

          {/* Rows */}
          {error ? (
            <div className="px-5 py-8 text-center">
              <p className="font-mono text-sm" style={{ color:'#f43f5e' }}>{error}</p>
              <button onClick={fetchLeaderboard} className="font-mono text-[11px] mt-3" style={{ color:'#f97316' }}>retry →</button>
            </div>
          ) : loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i}/>)
          ) : filtered.length === 0 && search ? (
            <div className="px-5 py-10 text-center">
              <p className="font-mono text-2xl mb-2">🔍</p>
              <p className="font-mono text-sm" style={{ color:'#4b5563' }}>
                No player found matching <span style={{ color:'#f97316' }}>"{ search }"</span>
              </p>
              <button
                onClick={() => setSearch('')}
                className="font-mono text-[11px] mt-3 transition-colors"
                style={{ color:'#374151' }}
                onMouseOver={e => e.currentTarget.style.color = '#f97316'}
                onMouseOut={e  => e.currentTarget.style.color = '#374151'}
              >clear search →</button>
            </div>
          ) : players.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-mono text-sm" style={{ color:'#4b5563' }}>no players yet — be the first to register!</p>
            </div>
          ) : (
            filtered.map(p => (
              <LeaderRow
                key={p.id}
                player={p}
                isMe={p.username === user?.username}
                highlight={!!search}
                onSelect={() => navigate(`/profile/${encodeURIComponent(p.username)}`)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <p className="font-mono text-[10px]" style={{ color:'#374151' }}>
            top {players.length} players · refreshes every 30s
          </p>
          {lastUpdated && (
            <p className="font-mono text-[10px]" style={{ color:'#374151' }}>
              updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* CTA if not ranked */}
        {isAuthenticated && !myRank && !loading && players.length > 0 && (
          <div className="mt-4 px-5 py-4 text-center"
               style={{ background:'rgba(249,115,22,0.04)', border:'1px solid rgba(249,115,22,0.15)', borderRadius:4 }}>
            <p className="font-mono text-[11px]" style={{ color:'#4b5563' }}>
              you're not on the board yet —{' '}
              <button onClick={()=>navigate('/lobby')} className="font-mono text-[11px]" style={{ color:'#f97316' }}>
                play a match to earn your rank →
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
