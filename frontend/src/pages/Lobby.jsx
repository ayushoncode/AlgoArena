import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'
import { UserAvatar } from '../utils/avatar'

/* Tier helper — kept in sync with Profile.jsx RANK_TIERS */
const RANK_TIERS = [
  { name: 'Novice',      min: 0,    max: 1199, col: '#94a3b8', bg: 'rgba(100,116,139,0.07)', border: 'rgba(100,116,139,0.25)' },
  { name: 'Challenger',  min: 1200, max: 1399, col: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)'  },
  { name: 'Specialist',  min: 1400, max: 1599, col: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)'   },
  { name: 'Elite',       min: 1600, max: 1899, col: '#818cf8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.3)'  },
  { name: 'Master',      min: 1900, max: 2199, col: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)'  },
  { name: 'Grandmaster', min: 2200, max: 9999, col: '#f97316', bg: 'rgba(249,115,22,0.14)',  border: 'rgba(249,115,22,0.3)'  },
]
function getTier(elo) { return RANK_TIERS.find(t => elo >= t.min && elo <= t.max) || RANK_TIERS[0] }

/* ════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════ */
const TOPICS = [
  { id:'arrays',        label:'Arrays',         tag:'O(n)',    desc:'two pointers · sliding window · prefix sums' },
  { id:'strings',       label:'Strings',        tag:'KMP',    desc:'anagrams · palindromes · z-algorithm' },
  { id:'linked-lists',  label:'Linked Lists',   tag:'O(1)',   desc:'reversal · cycle detection · merge k' },
  { id:'trees',         label:'Trees',          tag:'O(h)',   desc:'traversal · LCA · diameter · path sums' },
  { id:'graphs',        label:'Graphs',         tag:'BFS',   desc:'shortest path · union-find · topological sort' },
  { id:'dp',            label:'Dynamic Prog.', tag:'DP',    desc:'memoization · knapsack · LCS · coin change' },
  { id:'binary-search', label:'Binary Search',  tag:'O(log)', desc:'rotated arrays · lower bound · search space' },
  { id:'sorting',       label:'Sorting',        tag:'O(nk)',  desc:'merge · quick · counting · bucket sort' },
]

const DIFFS = [
  { id:'easy',   label:'Easy',   col:'#10b981', bg:'rgba(16,185,129,0.1)'  },
  { id:'medium', label:'Medium', col:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  { id:'hard',   label:'Hard',   col:'#f43f5e', bg:'rgba(244,63,94,0.1)'   },
]

/* ════════════════════════════════════════════════
   FRIEND SEARCH + PROFILE POPUP
════════════════════════════════════════════════ */
function FriendSearch() {
  const navigate                  = useNavigate()
  const [query, setQuery]         = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDrop, setShowDrop]   = useState(false)
  const inputRef  = useRef(null)
  const wrapRef   = useRef(null)
  const debounce  = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced autocomplete fetch
  function handleInput(val) {
    setQuery(val)
    clearTimeout(debounce.current)
    if (val.trim().length < 1) { setSuggestions([]); setShowDrop(false); return }
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(val.trim())}`)
        setSuggestions(data)
        setShowDrop(data.length > 0)
      } catch { setSuggestions([]); setShowDrop(false) }
    }, 200)
  }

  function goToProfile(username) {
    setShowDrop(false)
    setSuggestions([])
    navigate(`/profile/${encodeURIComponent(username)}`)
  }

  function onSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    goToProfile(q)
  }

  return (
    <div style={{ borderTop: '1px solid #1e2130', paddingTop: '1rem' }}>
      <p className="font-mono text-[10px] uppercase tracking-widest mb-2.5"
         style={{ color:'#374151', letterSpacing:'0.12em' }}>// find a player</p>

      {/* Search Input */}
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <form onSubmit={onSubmit}>
          <div
            className="flex items-center gap-2 px-3 py-2.5"
            style={{
              background: '#090b13',
              border: '1px solid #1e2130',
              borderRadius: 4,
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'}
            onBlurCapture={e  => e.currentTarget.style.borderColor = '#1e2130'}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color:'#4b5563', flexShrink:0 }}>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowDrop(true) }}
              onKeyDown={e => { if (e.key === 'Escape') { setShowDrop(false); setQuery('') } }}
              placeholder="Search username to view profile..."
              className="flex-1 bg-transparent outline-none font-mono text-[12px]"
              style={{ color:'#dde1ea', caretColor:'#22d3ee' }}
              spellCheck={false}
              autoComplete="off"
            />
            {query && (
              <button type="button"
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
                style={{ color:'#4b5563', fontSize:11 }}
                onMouseOver={e => e.currentTarget.style.color='#f43f5e'}
                onMouseOut={e  => e.currentTarget.style.color='#4b5563'}
              >✕</button>
            )}
          </div>
        </form>

        {/* Autocomplete Dropdown */}
        {showDrop && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#090b13', border: '1px solid #1e2130', borderTop: 'none',
            borderRadius: '0 0 4px 4px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {suggestions.map(s => {
              const st = getTier(s.elo_rating)
              return (
                <button
                  key={s.username}
                  onClick={() => goToProfile(s.username)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid #0d0f17', background: 'transparent' }}
                  onMouseOver={e => e.currentTarget.style.background = '#0d0f17'}
                  onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
                >
                  <UserAvatar username={s.username} seed={s.avatar_seed} style={s.avatar_style} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-bold truncate" style={{ color:'#dde1ea' }}>{s.username}</span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5"
                            style={{ background: st.bg, color: st.col, border:`1px solid ${st.border}`, borderRadius:2 }}>
                        {st.name}
                      </span>
                    </div>
                    <p className="font-mono text-[9px]" style={{ color:'#4b5563' }}>rank #{s.rank} · {s.wins || 0}W {s.losses || 0}L</p>
                  </div>
                  <span className="font-mono text-[12px] font-black" style={{ color: st.col }}>{s.elo_rating}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   LIVE ARENA STATS HOOK
════════════════════════════════════════════════ */
function useLiveCounter() {
  const [stats, setStats] = useState({ players: 1, matches: 0, totalProblems: 175 })

  useEffect(() => {
    async function loadStats() {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get('/api/users/stats').catch(() => ({ data: {} })),
          api.get('/api/problems/stats').catch(() => ({ data: {} })),
        ])
        setStats({
          players: Math.max(1, uRes.data?.totalUsers || 1),
          matches: uRes.data?.totalMatches || 0,
          totalProblems: pRes.data?.totalProblems || 175,
        })
      } catch (err) {
        console.error('[Lobby stats]', err)
      }
    }
    loadStats()
    const t = setInterval(loadStats, 15_000)
    return () => clearInterval(t)
  }, [])

  return stats
}

/* ════════════════════════════════════════════════
   QUEUE TIMER
════════════════════════════════════════════════ */
function useQueueTimer(running) {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!running) { setSec(0); return }
    const t = setInterval(() => setSec(s => s+1), 1000)
    return () => clearInterval(t)
  }, [running])
  return { sec, band: Math.floor(sec/10)*100+100 }
}

/* ════════════════════════════════════════════════
   SEARCHING OVERLAY (NodeClash Radar Style)
════════════════════════════════════════════════ */
function SearchingOverlay({ topic, difficulty, rating, onCancel }) {
  const { user } = useAuth()
  const { sec } = useQueueTimer(true)
  const mm   = String(Math.floor(sec/60)).padStart(2,'0')
  const ss   = String(sec%60).padStart(2,'0')
  const diff = DIFFS.find(d => d.id === difficulty)

  const username = user?.username || 'Player'
  const userInitials = username.slice(0, 2).toUpperCase()
  const userTier = getTier(rating)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-4 radar-bg-grid"
         style={{ background:'#050608', color:'#dde1ea' }}>
      
      {/* Top Branding Header */}
      <div className="flex items-center gap-2 pt-2">
        <span className="font-display font-black text-xl tracking-tight text-white">AlgoArena</span>
      </div>

      {/* Center Radar & Matchmaking Area */}
      <div className="flex flex-col items-center max-w-2xl w-full text-center space-y-8 my-auto">
        
        {/* Radar Scanner Container */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Concentric Radar Rings */}
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-6 rounded-full border border-white/10" />
          <div className="absolute inset-16 rounded-full border border-white/10" />
          
          {/* Crosshair Lines */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10" />

          {/* Rotating Conical Sweep Beam */}
          <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none"
               style={{
                 background: `conic-gradient(from 0deg at 50% 50%, ${userTier.col}55 0deg, ${userTier.col}15 45deg, transparent 90deg)`,
               }} />

          {/* Center Radar Core Dot */}
          <div className="w-4 h-4 rounded-full relative z-10" style={{ background: userTier.col, boxShadow: `0 0 15px ${userTier.col}` }} />

          {/* Radar Blip 1 (Top-Right Green Ping) */}
          <div className="absolute top-10 right-12 w-2.5 h-2.5 rounded-full bg-[#10b981] animate-radar-blip-1" />

          {/* Radar Blip 2 (Left-Bottom Green Ping) */}
          <div className="absolute bottom-12 left-10 w-2.5 h-2.5 rounded-full bg-[#10b981] animate-radar-blip-2" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Finding Match
          </h2>
          <p className="font-sans text-sm text-[#8b949e]">
            Searching for real players near your <span style={{ color: userTier.col, fontWeight: 700 }}>{userTier.name} ({rating})</span> rating
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[11px]">
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-semibold">
              {topic}
            </span>
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-semibold" style={{ color: diff?.col }}>
              {difficulty}
            </span>
          </div>
        </div>

        {/* VS Player Cards Grid */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8 w-full max-w-xl">
          {/* User Player Card (Left) */}
          <div className="p-6 rounded-2xl bg-[#0e1017] shadow-xl flex flex-col items-center text-center space-y-3 relative overflow-hidden"
               style={{ border: `1px solid ${userTier.col}50` }}>
            <div className="absolute top-0 inset-x-0 h-1" style={{ background: userTier.col }} />
            <UserAvatar username={username} seed={user?.avatar_seed} style={user?.avatar_style} elo={rating} size={56} />
            <div>
              <p className="font-sans font-bold text-base text-white truncate max-w-[130px]">{username}</p>
              <p className="font-mono text-xs font-semibold mt-0.5" style={{ color: userTier.col }}>⭐ {rating} ELO ({userTier.name})</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                 style={{ background: userTier.bg, color: userTier.col, border: `1px solid ${userTier.col}50` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: userTier.col }} />
              <span>READY</span>
            </div>
          </div>

          {/* VS Divider & Timer */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="font-display font-black text-3xl text-[#8b949e] tracking-wider">VS</span>
            <span className="font-mono text-xs text-[#8b949e] tabular-nums font-bold">{mm}:{ss}</span>
          </div>

          {/* Opponent Placeholder Card (Right) */}
          <div className="p-6 rounded-2xl bg-[#090b11]/80 border border-dashed border-white/15 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-display font-black text-white/30 text-lg animate-pulse">
              ??
            </div>
            <div>
              <p className="font-sans font-bold text-base text-white/50 truncate max-w-[130px] animate-pulse">Searching...</p>
              <p className="font-mono text-xs text-white/40 font-semibold mt-0.5">⭐ ~{rating} ELO</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#8b949e] font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-ping" />
              <span>WAITING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cancel Button */}
      {/* Bottom Cancel Button */}
      <button
        onClick={onCancel}
        className="font-mono text-xs px-6 py-2.5 rounded-full border border-white/20 text-[#8b949e] hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
      >
        <span>✕</span>
        <span>Cancel</span>
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════
   3D MATCH FOUND FACE-OFF OVERLAY
════════════════════════════════════════════════ */
function MatchFoundOverlay({ matchData, onComplete }) {
  const { user } = useAuth()
  const [countdown, setCountdown] = useState(3)
  const [isZooming, setIsZooming] = useState(false)

  // Identify 'you' vs 'opponent'
  const players = matchData?.players || []
  const you = players.find(p => p.username === user?.username) || players[0] || { username: user?.username || 'You', rating: user?.elo_rating || 1200 }
  const opponent = players.find(p => p.username !== user?.username) || players[1] || { username: 'RivalCoder', rating: 1200 }

  const youTier = getTier(you.rating || 1200)
  const oppTier = getTier(opponent.rating || 1200)

  const diffObj = DIFFS.find(d => d.id === matchData?.difficulty) || DIFFS[1]

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          setIsZooming(true)
          setTimeout(() => {
            onComplete()
          }, 400)
          return 0
        }
        return c - 1
      })
    }, 900)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between py-8 px-4 overflow-hidden select-none transition-all duration-500 ${isZooming ? 'scale-125 opacity-0 blur-md' : 'scale-100 opacity-100'}`}
         style={{ background: '#040508', color: '#dde1ea' }}>
      
      {/* Background Energy Grid & Radial Glows */}
      <div className="absolute inset-0 radar-bg-grid opacity-30 pointer-events-none" />
      
      {/* Ambient background glow left & right */}
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none"
           style={{ background: youTier.col, opacity: 0.18 }} />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none"
           style={{ background: oppTier.col, opacity: 0.18 }} />

      {/* Screen Entry Slash Flash */}
      <div className="absolute inset-0 bg-white animate-match-flash pointer-events-none z-10" />

      {/* Diagonal 3D Lightning Slash Beam across screen center */}
      <div className="absolute top-1/2 left-1/2 w-[200vw] h-[3px] animate-slash-beam pointer-events-none z-0"
           style={{
             background: `linear-gradient(90deg, transparent, ${youTier.col}, #ffffff, ${oppTier.col}, transparent)`,
             boxShadow: `0 0 40px ${youTier.col}, 0 0 60px ${oppTier.col}`,
           }} />

      {/* ── TOP BANNER ──────────────────────────────────────── */}
      <div className="relative z-20 flex flex-col items-center pt-2 space-y-1 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-widest"
             style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
          <span className="w-2 h-2 rounded-full bg-[#f97316] animate-ping" />
          <span>MATCH FOUND • 1v1 DUEL</span>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="font-mono text-xs text-[#8b949e] font-semibold uppercase">{matchData?.topic || 'BATTLE'}</span>
          <span className="text-[#374151]">|</span>
          <span className="font-mono text-xs font-bold uppercase" style={{ color: diffObj.col }}>
            {matchData?.difficulty || 'MEDIUM'}
          </span>
        </div>
      </div>

      {/* ── CENTER 3D FACE-OFF STAGE ────────────────────────── */}
      <div className="relative z-20 w-full max-w-5xl mx-auto my-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        
        {/* LEFT PLAYER CARD (YOU) */}
        <div className="w-full md:w-[380px] animate-clash-left">
          <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col items-center text-center space-y-4 shadow-2xl transition-transform hover:scale-[1.02]"
               style={{
                 background: 'linear-gradient(145deg, rgba(14,16,23,0.95) 0%, rgba(9,11,17,0.9) 100%)',
                 border: `2px solid ${youTier.col}`,
                 boxShadow: `0 0 35px ${youTier.col}35, inset 0 0 20px ${youTier.col}10`,
               }}>
            
            {/* Top Rank Badge Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: `linear-gradient(90deg, ${youTier.col}, transparent)` }} />

            <div className="absolute top-3 left-4 px-2.5 py-0.5 rounded font-mono text-[9px] font-black uppercase tracking-wider"
                 style={{ background: youTier.bg, color: youTier.col, border: `1px solid ${youTier.border}` }}>
              YOU
            </div>

            {/* 3D Avatar Halo Ring */}
            <div className="relative mt-2">
              <div className="absolute -inset-3 rounded-full blur-md opacity-60 animate-pulse"
                   style={{ background: youTier.col }} />
              <div className="relative p-1 rounded-full" style={{ background: `linear-gradient(135deg, ${youTier.col}, #ffffff33)` }}>
                <UserAvatar username={you.username} seed={you.avatar_seed} style={you.avatar_style} elo={you.rating} size={90} />
              </div>
            </div>

            {/* Player Info */}
            <div className="space-y-1 w-full">
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white truncate px-2 tracking-tight">
                {you.username}
              </h3>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded"
                      style={{ background: youTier.bg, color: youTier.col, border: `1px solid ${youTier.border}` }}>
                  {youTier.name}
                </span>
                <span className="font-mono text-sm font-black" style={{ color: youTier.col }}>
                  {you.rating} ELO
                </span>
              </div>
            </div>

            {/* Battle Ready Status */}
            <div className="w-full pt-2 border-t border-white/10 flex items-center justify-center gap-2 font-mono text-xs font-bold"
                 style={{ color: youTier.col }}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ background: youTier.col }} />
              <span>READY TO CODE</span>
            </div>
          </div>
        </div>

        {/* CENTER 3D "VS" & COUNTDOWN CLASH */}
        <div className="flex flex-col items-center justify-center my-2 md:my-0 relative z-30 animate-vs-impact">
          
          {/* 3D VS Text with perspective transform & glow */}
          <div className="relative group">
            <span className="font-display font-black text-6xl sm:text-8xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-500 to-rose-600 drop-shadow-[0_10px_25px_rgba(249,115,22,0.6)]"
                  style={{
                    textShadow: `0 0 30px rgba(249,115,22,0.8), 3px 3px 0 #000, 6px 6px 0 rgba(0,0,0,0.5)`,
                    transform: 'rotateX(10deg)',
                  }}>
              VS
            </span>
          </div>

          {/* Countdown & Status */}
          <div className="mt-4 flex flex-col items-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#090b13] border border-[#f97316]/50 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <span className="font-mono font-black text-2xl text-[#f97316] animate-bounce">
                {countdown > 0 ? countdown : '⚡'}
              </span>
            </div>
            <p className="font-mono text-[11px] font-bold text-[#8b949e] uppercase tracking-widest">
              {countdown > 0 ? 'ENTERING ARENA...' : 'BATTLE STARTING!'}
            </p>
          </div>
        </div>

        {/* RIGHT PLAYER CARD (OPPONENT) */}
        <div className="w-full md:w-[380px] animate-clash-right">
          <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden backdrop-blur-xl flex flex-col items-center text-center space-y-4 shadow-2xl transition-transform hover:scale-[1.02]"
               style={{
                 background: 'linear-gradient(145deg, rgba(14,16,23,0.95) 0%, rgba(9,11,17,0.9) 100%)',
                 border: `2px solid ${oppTier.col}`,
                 boxShadow: `0 0 35px ${oppTier.col}35, inset 0 0 20px ${oppTier.col}10`,
               }}>
            
            {/* Top Rank Badge Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: `linear-gradient(90deg, transparent, ${oppTier.col})` }} />

            <div className="absolute top-3 right-4 px-2.5 py-0.5 rounded font-mono text-[9px] font-black uppercase tracking-wider"
                 style={{ background: oppTier.bg, color: oppTier.col, border: `1px solid ${oppTier.border}` }}>
              OPPONENT
            </div>

            {/* 3D Avatar Halo Ring */}
            <div className="relative mt-2">
              <div className="absolute -inset-3 rounded-full blur-md opacity-60 animate-pulse"
                   style={{ background: oppTier.col }} />
              <div className="relative p-1 rounded-full" style={{ background: `linear-gradient(135deg, ${oppTier.col}, #ffffff33)` }}>
                <UserAvatar username={opponent.username} seed={opponent.avatar_seed} style={opponent.avatar_style} elo={opponent.rating} size={90} />
              </div>
            </div>

            {/* Player Info */}
            <div className="space-y-1 w-full">
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white truncate px-2 tracking-tight">
                {opponent.username}
              </h3>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded"
                      style={{ background: oppTier.bg, color: oppTier.col, border: `1px solid ${oppTier.border}` }}>
                  {oppTier.name}
                </span>
                <span className="font-mono text-sm font-black" style={{ color: oppTier.col }}>
                  {opponent.rating} ELO
                </span>
              </div>
            </div>

            {/* Battle Ready Status */}
            <div className="w-full pt-2 border-t border-white/10 flex items-center justify-center gap-2 font-mono text-xs font-bold"
                 style={{ color: oppTier.col }}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ background: oppTier.col }} />
              <span>OPPONENT CONNECTED</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM FOOTER ───────────────────────────────────── */}
      <div className="relative z-20 pb-2 font-mono text-xs text-[#4b5563] text-center">
        <span>Initializing symmetrical code workspace & sandbox...</span>
      </div>

    </div>
  )
}

/* ════════════════════════════════════════════════
   PRIVATE CUSTOM MATCH MODAL
════════════════════════════════════════════════ */
function PrivateMatchModal({ isOpen, onClose, topic, diff, emit, on, off, initialRoomCode }) {
  const [tab, setTab]             = useState(initialRoomCode ? 'join' : 'create')
  const [roomCode, setRoomCode]   = useState(initialRoomCode || '')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [errorMsg, setErrorMsg]   = useState(null)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    if (initialRoomCode) {
      setTab('join')
      setRoomCode(initialRoomCode)
    }
  }, [initialRoomCode])

  useEffect(() => {
    function onCreated(data) {
      setCreatedRoom(data)
      setErrorMsg(null)
    }
    function onError(err) {
      setErrorMsg(err.message)
    }
    function onCancelled() {
      setCreatedRoom(null)
      setErrorMsg(null)
    }

    on('custom_room_created',   onCreated)
    on('custom_room_error',     onError)
    on('custom_room_cancelled', onCancelled)

    return () => {
      off('custom_room_created',   onCreated)
      off('custom_room_error',     onError)
      off('custom_room_cancelled', onCancelled)
    }
  }, [on, off])

  if (!isOpen) return null

  function handleCreateRoom() {
    if (!topic) {
      setErrorMsg('Please select a topic first')
      return
    }
    emit('create_custom_room', { topic, difficulty: diff })
  }

  function handleCancelCreated() {
    if (createdRoom) {
      emit('cancel_custom_room', { code: createdRoom.code })
      setCreatedRoom(null)
    }
  }

  function handleJoinRoom() {
    if (!roomCode.trim()) {
      setErrorMsg('Enter a room code')
      return
    }
    setErrorMsg(null)
    emit('join_custom_room', { code: roomCode.trim() })
  }

  function handleCopyLink() {
    if (!createdRoom) return
    const url = `${window.location.origin}/lobby?room=${createdRoom.code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(5,6,10,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md p-6 space-y-6"
           style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 6 }}>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: '#1e2130' }}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563' }}>// private match</p>
            <h3 className="font-display font-bold text-lg" style={{ color: '#dde1ea' }}>Battle Your Friend ⚔️</h3>
          </div>
          <button onClick={() => { handleCancelCreated(); onClose() }} className="font-mono text-sm hover:text-white" style={{ color: '#4b5563' }}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded" style={{ background: '#07080c', border: '1px solid #1e2130' }}>
          <button
            onClick={() => { setTab('create'); setErrorMsg(null) }}
            className="flex-1 py-1.5 font-mono text-xs font-bold rounded transition-colors"
            style={{ background: tab === 'create' ? 'rgba(249,115,22,0.12)' : 'transparent', color: tab === 'create' ? '#f97316' : '#4b5563' }}
          >
            Create Room
          </button>
          <button
            onClick={() => { setTab('join'); setErrorMsg(null) }}
            className="flex-1 py-1.5 font-mono text-xs font-bold rounded transition-colors"
            style={{ background: tab === 'join' ? 'rgba(249,115,22,0.12)' : 'transparent', color: tab === 'join' ? '#f97316' : '#4b5563' }}
          >
            Join Code
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded font-mono text-xs" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
            {errorMsg}
          </div>
        )}

        {/* TAB 1: CREATE ROOM */}
        {tab === 'create' && (
          <div className="space-y-4">
            {!createdRoom ? (
              <>
                <div className="p-3 rounded space-y-1 font-mono text-xs" style={{ background: '#0d0f17', border: '1px solid #1e2130' }}>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Topic:</span> <span style={{ color: '#f97316' }}>{topic || 'Select a topic in lobby'}</span></div>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Difficulty:</span> <span style={{ color: '#22d3ee' }}>{diff}</span></div>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Ranked:</span> <span style={{ color: '#10b981' }}>Unranked (Casual)</span></div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={!topic}
                  className="w-full py-3 font-mono font-bold text-xs transition-all active:scale-[0.98]"
                  style={{ background: topic ? '#f97316' : '#1e2130', color: topic ? '#07080c' : '#4b5563', borderRadius: 4, cursor: topic ? 'pointer' : 'not-allowed' }}
                >
                  {topic ? 'generate_invite_code() →' : 'Select a topic first'}
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <p className="font-mono text-xs" style={{ color: '#9ca3af' }}>Share this code or link with your friend:</p>

                <div className="p-4 rounded flex items-center justify-between" style={{ background: '#0d0f17', border: '1px stroke #f97316' }}>
                  <span className="font-mono text-2xl font-black tracking-wider" style={{ color: '#f97316' }}>{createdRoom.code}</span>
                  <button
                    onClick={handleCopyLink}
                    className="font-mono text-xs px-3 py-1.5 transition-all"
                    style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.15)', color: copied ? '#10b981' : '#f97316', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 4 }}
                  >
                    {copied ? '✓ Copied Link' : 'Copy Invite Link'}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <div className="w-2 h-2 rounded-full animate-ping" style={{ background: '#f97316' }}/>
                  <span className="font-mono text-xs" style={{ color: '#4b5563' }}>Waiting for friend to join room...</span>
                </div>

                <button onClick={handleCancelCreated} className="font-mono text-xs text-rose-500 underline pt-2">
                  Cancel Room
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: JOIN ROOM */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-xs" style={{ color: '#4b5563' }}>Enter 6-character Invite Code:</label>
              <input
                type="text"
                placeholder="e.g. ARENA-8K2Y"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                className="w-full p-3 font-mono text-sm uppercase font-bold tracking-wider rounded"
                style={{ background: '#0d0f17', border: '1px solid #1e2130', color: '#f97316', outline: 'none' }}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              className="w-full py-3 font-mono font-bold text-xs transition-all active:scale-[0.98]"
              style={{ background: '#f97316', color: '#07080c', borderRadius: 4 }}
            >
              join_battle() →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   LOBBY PAGE
════════════════════════════════════════════════ */
export default function Lobby() {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const live     = useLiveCounter()

  const [topic,   setTopic]   = useState(null)
  const [diff,    setDiff]    = useState('medium')
  const [queuing, setQueuing] = useState(false)
  const [matchFoundData, setMatchFoundData] = useState(null)

  // Private custom match modal state
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const initialRoomCode = searchParams.get('room')

  const { connected, emit, on, off, socket } = useSocket()

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/?auth=login')
  }, [loading, isAuthenticated, navigate])

  // Open custom modal automatically if URL has ?room=CODE
  useEffect(() => {
    if (initialRoomCode) {
      setCustomModalOpen(true)
    }
  }, [initialRoomCode])

  // Listen for match_found — show 3D faceoff clash overlay
  useEffect(() => {
    function onMatchFound(data) {
      console.log('[Lobby] match_found →', data?.roomId)
      setQueuing(false)
      setMatchFoundData(data)
    }
    on('match_found', onMatchFound)
    return () => off('match_found', onMatchFound)
  }, [on, off])

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <p className="font-mono text-sm" style={{ color:'#4b5563' }}>loading…</p>
    </div>
  )
  if (!isAuthenticated) return null

  const elo     = user?.elo_rating ?? 1200
  const diffObj = DIFFS.find(d => d.id === diff)
  const [dailyProblem, setDailyProblem] = useState(null)

  useEffect(() => {
    api.get('/api/problems/daily')
      .then(({ data }) => setDailyProblem(data))
      .catch(() => {})
  }, [])

  const ch = dailyProblem
    ? { topic: dailyProblem.topic, problem: dailyProblem.title, difficulty: dailyProblem.difficulty, desc: (dailyProblem.description || '').slice(0, 90) + '...' }
    : { topic: 'arrays', problem: 'Two Sum', difficulty: 'easy', desc: 'Find indices of two numbers that add to target.' }

  // Auto re-join queue on socket reconnect if user was searching
  useEffect(() => {
    if (connected && queuing && topic && diff) {
      emit('join_queue', { topic, difficulty: diff })
    }
  }, [connected, queuing, topic, diff, emit])

  function startQueue() {
    if (!topic) return
    setQueuing(true)
    if (connected) {
      emit('join_queue', { topic, difficulty: diff })
    } else {
      // Socket still connecting — emit once it's ready
      socket.once('connect', () => emit('join_queue', { topic, difficulty: diff }))
    }
  }

  function cancelQueue() {
    emit('leave_queue')
    setQueuing(false)
  }

  return (
    <>
      {matchFoundData ? (
        <MatchFoundOverlay
          matchData={matchFoundData}
          onComplete={() => {
            const data = matchFoundData
            setMatchFoundData(null)
            navigate(`/match/${data.roomId}`, { state: { topic: data.topic, difficulty: data.difficulty, players: data.players, problemId: data.problemId } })
          }}
        />
      ) : queuing ? (
        <SearchingOverlay topic={topic} difficulty={diff} rating={elo} onCancel={cancelQueue}/>
      ) : null}

      {/* Private Custom Friend Match Modal */}
      <PrivateMatchModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        topic={topic}
        diff={diff}
        emit={emit}
        on={on}
        off={off}
        initialRoomCode={initialRoomCode}
      />

      <div className="min-h-[calc(100vh-3.5rem)]">

        {/* ── TOP BAR ───────────────────────────────────── */}
        <div style={{ borderBottom:'1px solid #1e2130', background:'#07080c' }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                 style={{ color:'#4b5563', letterSpacing:'0.14em' }}>// find a match</p>
              <p className="font-display font-bold text-lg" style={{ color:'#dde1ea' }}>
                Pick a topic, find an opponent
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#10b981' : '#f59e0b', boxShadow: connected ? '0 0 5px #10b981' : 'none', flexShrink:0 }}/>
                <span className="font-mono text-[10px]" style={{ color:'#374151' }}>
                  {connected ? 'ws connected' : 'connecting…'}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>your rating ({getTier(elo).name})</p>
                <p className="font-display font-black text-xl" style={{ color: getTier(elo).col }}>{elo}</p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="dot-live"/>
                  <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color:'#dde1ea' }}>{live.players}</span>
                  <span className="font-mono text-[10px]" style={{ color:'#4b5563' }}>registered</span>
                </div>
                <p className="font-mono text-[10px]" style={{ color:'#374151' }}>{live.totalProblems} problems</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN ──────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid lg:grid-cols-[1fr_300px] gap-8">

          {/* LEFT — Daily challenge + Topic grid */}
          <div className="space-y-6">

            {/* Daily Challenge */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-3"
                 style={{ color:'#4b5563', letterSpacing:'0.13em' }}>// today's challenge</p>
              <button
                id="daily-challenge-btn"
                onClick={() => { setTopic(ch.topic); setDiff(ch.difficulty) }}
                className="w-full text-left transition-all active:scale-[0.99]"
                style={{ background:'rgba(249,115,22,0.05)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:4, overflow:'hidden' }}
                onMouseOver={e=>e.currentTarget.style.borderColor='rgba(249,115,22,0.6)'}
                onMouseOut={e=>e.currentTarget.style.borderColor='rgba(249,115,22,0.3)'}
              >
                <div className="flex items-center justify-between px-4 py-2.5"
                     style={{ borderBottom:'1px solid rgba(249,115,22,0.15)', background:'rgba(249,115,22,0.06)' }}>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color:'#f97316', letterSpacing:'0.13em' }}>
                    ★ daily challenge
                  </span>
                  <span className="font-mono text-[10px]" style={{ color:'rgba(249,115,22,0.6)' }}>
                    click to select →
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-sm mb-1" style={{ color:'#dde1ea' }}>{ch.problem}</p>
                    <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>{ch.desc}</p>
                    <p className="font-mono text-[10px] mt-1.5" style={{ color:'rgba(249,115,22,0.7)' }}>topic: {ch.topic}</p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-1 shrink-0"
                        style={{ background: DIFFS.find(d=>d.id===ch.difficulty)?.bg, color: DIFFS.find(d=>d.id===ch.difficulty)?.col,
                                 border:`1px solid ${DIFFS.find(d=>d.id===ch.difficulty)?.col}40`, borderRadius:3 }}>
                    {ch.difficulty}
                  </span>
                </div>
              </button>
            </div>

            {/* Topic grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] uppercase tracking-widest"
                   style={{ color:'#4b5563', letterSpacing:'0.13em' }}>// or pick a topic</p>
                {topic && (
                  <button onClick={()=>setTopic(null)} className="font-mono text-[10px] transition-colors"
                          style={{ color:'#374151' }}
                          onMouseOver={e=>e.target.style.color='#f43f5e'}
                          onMouseOut={e=>e.target.style.color='#374151'}>clear ✕</button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {TOPICS.map(t => {
                  const sel = topic === t.id
                  return (
                    <button key={t.id} id={`topic-${t.id}`} onClick={()=>setTopic(t.id)}
                            className="text-left p-4 transition-all duration-150 active:scale-[0.98]"
                            style={{ background:sel?'rgba(249,115,22,0.07)':'#0d0f17', border:`1px solid ${sel?'#f97316':'#1e2130'}`, borderRadius:4 }}
                            onMouseOver={e=>{ if(!sel) e.currentTarget.style.borderColor='rgba(249,115,22,0.35)' }}
                            onMouseOut={e =>{ if(!sel) e.currentTarget.style.borderColor='#1e2130' }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-display font-semibold text-sm" style={{ color:sel?'#f97316':'#dde1ea' }}>{t.label}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5"
                              style={{ background:sel?'rgba(249,115,22,0.12)':'#0b0d14', color:sel?'#f97316':'#374151',
                                       border:`1px solid ${sel?'rgba(249,115,22,0.25)':'#1e2130'}`, borderRadius:3 }}>
                          {t.tag}
                        </span>
                      </div>
                      <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>{t.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Config + CTA */}
          <div className="flex flex-col gap-5">

            {/* Live code preview */}
            <div style={{ background:'#090b13', border:'1px solid #1e2130', borderRadius:4, overflow:'hidden' }}>
              <div className="px-4 py-2.5 flex items-center justify-between"
                   style={{ borderBottom:'1px solid #1e2130', background:'#07080c' }}>
                <span className="font-mono text-[10px]" style={{ color:'#374151' }}>// config</span>
                {topic && <span className="dot-live" style={{ width:5,height:5 }}/>}
              </div>
              <div className="px-4 py-4 font-mono text-[12px] leading-[1.8]">
                <span style={{ color:'#4b5563' }}>arena</span><span style={{ color:'#dde1ea' }}>.</span><span style={{ color:'#f97316' }}>findMatch</span><span style={{ color:'#dde1ea' }}>({'{'}</span><br/>
                <span style={{ color:'#4b5563' }}>{'  '}topic: </span><span style={{ color:'#22d3ee' }}>"{topic ?? '???'}"</span><span style={{ color:'#dde1ea' }}>,</span><br/>
                <span style={{ color:'#4b5563' }}>{'  '}difficulty: </span><span style={{ color:diffObj.col }}>"{diff}"</span><span style={{ color:'#dde1ea' }}>,</span><br/>
                <span style={{ color:'#4b5563' }}>{'  '}rating: </span><span style={{ color:'#22d3ee' }}>{elo}</span><br/>
                <span style={{ color:'#dde1ea' }}>{'})'}</span>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2.5"
                 style={{ color:'#4b5563', letterSpacing:'0.13em' }}>// difficulty</p>
              <div className="flex gap-2">
                {DIFFS.map(d => (
                  <button key={d.id} id={`diff-${d.id}`} onClick={()=>setDiff(d.id)}
                          className="flex-1 py-2.5 font-mono text-[11px] font-bold transition-all"
                          style={{ background:diff===d.id?d.bg:'#0d0f17', border:`1px solid ${diff===d.id?d.col:'#1e2130'}`,
                                   color:diff===d.id?d.col:'#4b5563', borderRadius:4 }}
                          onMouseOver={e=>{ if(diff!==d.id) e.currentTarget.style.borderColor=`${d.col}50` }}
                          onMouseOut={e =>{ if(diff!==d.id) e.currentTarget.style.borderColor='#1e2130' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Ranked Match CTA */}
              <button id="find-match-btn" onClick={startQueue} disabled={!topic}
                      className="w-full py-4 font-mono font-bold text-sm transition-all duration-150 active:scale-[0.98]"
                      style={{ background:topic?'#f97316':'#0d0f17', color:topic?'#07080c':'#374151',
                               border:`1px solid ${topic?'#f97316':'#1e2130'}`, borderRadius:4, cursor:topic?'pointer':'not-allowed' }}>
                {topic ? `find_ranked_match() →` : 'select a topic first'}
              </button>

              {/* Private Friend Duel CTA */}
              <button
                onClick={() => setCustomModalOpen(true)}
                className="w-full py-3 font-mono font-bold text-xs transition-all active:scale-[0.98]"
                style={{ background: '#0d0f17', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 4 }}
              >
                battle_friend() ⚔️ (private room)
              </button>
            </div>

            {/* Elo estimate */}
            <div style={{ borderTop:'1px solid #1e2130', paddingTop:'1rem' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2.5"
                 style={{ color:'#374151', letterSpacing:'0.12em' }}>// estimated elo change</p>
              {[
                { lbl:'win',  val:'+18', col:'#10b981' },
                { lbl:'loss', val:'−18', col:'#f43f5e' },
              ].map(r => (
                <div key={r.lbl} className="flex justify-between mb-1.5">
                  <span className="font-mono text-[10px]" style={{ color:'#374151' }}>{r.lbl}</span>
                  <span className="font-mono text-[10px] font-bold" style={{ color:r.col }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Friend Search */}
            <FriendSearch />
          </div>
        </div>
      </div>
    </>
  )
}
