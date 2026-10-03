import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'
import { UserAvatar, getArenaTier } from '../utils/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Users, Zap, Target, Copy, Check, X, Hash,
  Radio, Shield, ChevronRight, Wifi, WifiOff, Clock,
  Brackets, Type, Link, GitBranch, Network, Layers,
  Search, ArrowUpDown, Shuffle, Sparkles, Play, CheckCircle2
} from 'lucide-react'
import {
  HudPanel, HudButton, GhostButton, DangerButton, RankBadge,
  StatBadge, SectionHeader, Modal, DiffChip, PageWrapper,
  Skeleton, EmptyState, VerdictChip, Tooltip,
} from '../components/ui'
import { ArenaLogo } from '../components/ArenaLogo'

/* ════════════════════════════════════════════════
   DATA — topics + difficulties
   (Display config ONLY - payload ids remain unchanged)
════════════════════════════════════════════════ */
const TOPICS = [
  {
    id: 'arrays',
    label: 'Arrays',
    icon: Brackets,
    subtopics: ['Two Pointers', 'Sliding Window', 'Prefix Sums'],
    desc: 'Sequence manipulation & contiguous window algorithms'
  },
  {
    id: 'strings',
    label: 'Strings',
    icon: Type,
    subtopics: ['Anagrams', 'Palindromes', 'Z-Algorithm'],
    desc: 'Pattern matching, text parsing & substring queries'
  },
  {
    id: 'linked-lists',
    label: 'Linked Lists',
    icon: Link,
    subtopics: ['Reversal', 'Cycle Detection', 'Merge K'],
    desc: 'Node pointers, fast-slow runners & memory links'
  },
  {
    id: 'trees',
    label: 'Trees',
    icon: GitBranch,
    subtopics: ['Traversal', 'LCA', 'Path Sums'],
    desc: 'Hierarchical node branching, BST & depth exploration'
  },
  {
    id: 'graphs',
    label: 'Graphs',
    icon: Network,
    subtopics: ['Shortest Path', 'Union-Find', 'Topo Sort'],
    desc: 'Vertices, edges, traversal & network connectivity'
  },
  {
    id: 'dp',
    label: 'Dynamic Prog.',
    icon: Layers,
    subtopics: ['Memoization', 'Knapsack', 'LCS'],
    desc: 'Subproblem optimal structure & state transitions'
  },
  {
    id: 'binary-search',
    label: 'Binary Search',
    icon: Search,
    subtopics: ['Rotated Arrays', 'Lower Bound', 'Search Space'],
    desc: 'Logarithmic search space reduction & threshold bounds'
  },
  {
    id: 'sorting',
    label: 'Sorting',
    icon: ArrowUpDown,
    subtopics: ['Merge Sort', 'Quick Sort', 'Bucket Sort'],
    desc: 'Ordering, comparator partitions & distribution sorts'
  },
]

const DIFFS = [
  {
    id: 'easy',
    label: 'Easy',
    descriptor: 'Warm-up',
    col: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    eloEst: '+12 / −12'
  },
  {
    id: 'medium',
    label: 'Medium',
    descriptor: 'Balanced',
    col: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    eloEst: '+18 / −18'
  },
  {
    id: 'hard',
    label: 'Hard',
    descriptor: 'Elite',
    col: '#E11D48',
    bg: 'rgba(225,29,72,0.12)',
    border: 'rgba(225,29,72,0.3)',
    eloEst: '+25 / −25'
  },
]

/* ════════════════════════════════════════════════
   LIVE COUNTER HOOK
════════════════════════════════════════════════ */
function useLiveCounter() {
  const [stats, setStats] = useState({ players: 0, matches: 0, totalProblems: 0, loading: true })
  useEffect(() => {
    async function loadStats() {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get('/api/users/stats').catch(() => ({ data: {} })),
          api.get('/api/problems/stats').catch(() => ({ data: {} })),
        ])
        setStats({
          players: Math.max(0, uRes.data?.onlineUsers || 0),
          matches: uRes.data?.totalMatches || 0,
          totalProblems: pRes.data?.totalProblems || 0,
          loading: false,
        })
      } catch (err) { console.error('[Lobby stats]', err) }
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
    const t = setInterval(() => setSec(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])
  return { sec, band: Math.floor(sec / 10) * 100 + 100 }
}

/* ════════════════════════════════════════════════
   HEADER SEARCH (ROSTER)
════════════════════════════════════════════════ */
function HeaderRosterSearch({ inputRef }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDrop, setShowDrop] = useState(false)
  const wrapRef = useRef(null)
  const dropRef = useRef(null)
  const debounce = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDrop(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Native wheel listener — passive:false so we can preventDefault and trap scroll inside dropdown
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const handler = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const atTop = scrollTop === 0 && e.deltaY < 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0
      if (!atTop && !atBottom) {
        e.preventDefault()
      }
      e.stopPropagation()
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [showDrop])

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

  function goToProfile(username) { setShowDrop(false); setSuggestions([]); setQuery(''); navigate(`/profile/${encodeURIComponent(username)}`) }
  function onSubmit(e) { e.preventDefault(); const q = query.trim(); if (!q) return; goToProfile(q) }

  return (
    <div ref={wrapRef} className="relative w-full max-w-xs sm:max-w-sm">
      <form onSubmit={onSubmit}>
        <div className="flex items-center gap-2 px-3 py-2 transition-all rounded"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--c-red)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
        >
          <Search size={13} style={{ color: 'var(--c-text-mute)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => { if (suggestions.length) setShowDrop(true) }}
            onKeyDown={e => { if (e.key === 'Escape') { setShowDrop(false); inputRef.current?.blur() } }}
            placeholder="Search roster (Press '/' to focus)"
            className="flex-1 bg-transparent outline-none font-mono text-xs"
            style={{ color: 'var(--c-text)', caretColor: 'var(--c-red)' }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Search roster by username"
          />
          {query ? (
            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus() }}
              style={{ color: 'var(--c-text-mute)' }}
              className="p-1 hover:text-rose-500"
            ><X size={12} /></button>
          ) : (
            <kbd className="hidden sm:inline-block font-mono text-[9px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)', color: 'var(--c-text-mute)' }}>/</kbd>
          )}
        </div>
      </form>

      {showDrop && (
        <div
          ref={dropRef}
          onWheel={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--c-panel)',
            border: '1px solid var(--c-border)',
            borderRadius: '8px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            maxHeight: '260px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}>
          {suggestions.map(s => {
            const st = getArenaTier(s.elo_rating)
            return (
              <button key={s.username} onClick={() => goToProfile(s.username)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid var(--c-border)', background: 'transparent' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--c-panel2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flexShrink: 0 }}>
                  <UserAvatar username={s.username} seed={s.avatar_seed} style={s.avatar_style} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold truncate" style={{ color: 'var(--c-text)' }}>{s.username}</span>
                    <RankBadge elo={s.elo_rating} size="xs" />
                  </div>
                  <p className="font-mono text-[10px]" style={{ color: 'var(--c-text-mute)' }}>
                    Rank #{s.rank || '—'} · {s.wins || 0}W {s.losses || 0}L
                  </p>
                </div>
                <span className="font-mono text-xs font-black" style={{ color: st.col }}>{s.elo_rating}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   MEMOIZED TOPIC CARD
════════════════════════════════════════════════ */
const TopicCard = memo(function TopicCard({ topic, selected, onClick, indexKey }) {
  const Icon = topic.icon
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative text-left p-4 transition-all duration-200 outline-none cursor-pointer flex flex-col justify-between"
      style={{
        background: selected ? 'rgba(225,29,72,0.08)' : 'var(--c-panel)',
        border: `1px solid ${selected ? 'var(--c-red)' : 'var(--c-border)'}`,
        boxShadow: selected ? '0 0 20px rgba(225,29,72,0.18)' : 'none',
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
      }}
      onMouseOver={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(225,29,72,0.4)' }}
      onMouseOut={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--c-border)' }}
    >
      {/* Corner HUD accent if selected */}
      {selected && (
        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r" style={{ borderColor: 'var(--c-red)' }} />
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded flex items-center justify-center"
              style={{
                background: selected ? 'rgba(225,29,72,0.18)' : 'var(--c-panel2)',
                color: selected ? 'var(--c-red)' : 'var(--c-blue)',
                border: `1px solid ${selected ? 'rgba(225,29,72,0.3)' : 'var(--c-border)'}`
              }}
            >
              <Icon size={16} />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-wide block"
                style={{ color: selected ? 'var(--c-red)' : 'var(--c-text)' }}>
                {topic.label}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--c-text-mute)' }}>
                Key [{indexKey}]
              </span>
            </div>
          </div>
          {selected && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--c-red)', color: '#fff' }}>
              <Check size={12} />
            </div>
          )}
        </div>

        <p className="font-sans text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--c-text-dim)' }}>
          {topic.desc}
        </p>
      </div>

      {/* Subtopic chips */}
      <div className="flex flex-wrap gap-1 mt-auto pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
        {topic.subtopics.map(st => (
          <span key={st} className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{
              background: selected ? 'rgba(225,29,72,0.12)' : 'var(--c-panel2)',
              color: selected ? 'var(--c-red)' : 'var(--c-text-mute)',
              border: `1px solid ${selected ? 'rgba(225,29,72,0.25)' : 'var(--c-border)'}`
            }}
          >
            {st}
          </span>
        ))}
      </div>
    </motion.button>
  )
})

/* ════════════════════════════════════════════════
   SEARCHING OVERLAY — Radar + Loadout
════════════════════════════════════════════════ */
function SearchingOverlay({ topic, difficulty, rating, onCancel }) {
  const { user } = useAuth()
  const { sec } = useQueueTimer(true)
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  const diff = DIFFS.find(d => d.id === difficulty) || DIFFS[1]
  const topicObj = TOPICS.find(t => t.id === topic) || { label: topic, icon: Target }
  const Icon = topicObj.icon || Target
  const username = user?.username || 'Player'
  const userTier = getArenaTier(rating)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="region"
      aria-live="polite"
      aria-label="Searching for rival matchmaking queue"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-4 radar-bg-grid"
      style={{ background: 'var(--c-void)', color: 'var(--c-text)' }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: `${userTier.col}18` }} />
      </div>

      {/* Top branding */}
      <div className="flex items-center gap-2 pt-2 relative z-10">
        <ArenaLogo size="md" />
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center max-w-2xl w-full text-center space-y-8 my-auto relative z-10">

        {/* Radar scanner */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border" style={{ borderColor: 'var(--c-border)' }} />
          <div className="absolute inset-6 rounded-full border" style={{ borderColor: 'var(--c-border)' }} />
          <div className="absolute inset-16 rounded-full border" style={{ borderColor: 'var(--c-border)' }} />
          <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'var(--c-border)' }} />
          <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: 'var(--c-border)' }} />
          <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none"
            style={{ background: `conic-gradient(from 0deg at 50% 50%, ${userTier.col}55 0deg, ${userTier.col}15 45deg, transparent 90deg)` }}
          />
          <div className="w-4 h-4 rounded-full relative z-10 animate-pulse"
            style={{ background: userTier.col, boxShadow: `0 0 15px ${userTier.col}` }}
          />
          <div className="absolute top-10 right-12 w-2.5 h-2.5 rounded-full animate-radar-blip-1" style={{ background: 'var(--c-green)' }} />
          <div className="absolute bottom-12 left-10 w-2.5 h-2.5 rounded-full animate-radar-blip-2" style={{ background: 'var(--c-green)' }} />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight uppercase" style={{ color: 'var(--c-text)' }}>
            Searching For A Rival
          </h2>
          <p className="font-sans text-sm" style={{ color: 'var(--c-text-dim)' }}>
            Scanning arena for opponents near your{' '}
            <span style={{ color: userTier.col, fontWeight: 700 }}>{userTier.name} ({rating})</span> Elo
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 font-mono text-xs">
            <span className="px-3 py-1 flex items-center gap-1.5 rounded" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
              <Icon size={13} style={{ color: 'var(--c-red)' }} />
              {topicObj.label}
            </span>
            <DiffChip difficulty={difficulty} />
          </div>
        </div>

        {/* VS grid */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8 w-full max-w-xl">
          {/* You */}
          <HudPanel accentTopLeft={userTier.col} accentBotRight={userTier.col} glow glowColor={`${userTier.col}30`}
            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}
          >
            <UserAvatar username={username} seed={user?.avatar_seed} style={user?.avatar_style} elo={rating} size={52} />
            <div>
              <p className="font-display font-bold text-base" style={{ color: 'var(--c-text)' }}>{username}</p>
              <p className="font-mono text-xs font-semibold mt-0.5" style={{ color: userTier.col }}>{rating} Elo</p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded"
              style={{ background: userTier.bg, color: userTier.col, border: `1px solid ${userTier.border}` }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: userTier.col }} />
              In Queue
            </div>
          </HudPanel>

          {/* VS + timer */}
          <div className="flex flex-col items-center space-y-1">
            <span className="font-display font-black text-2xl sm:text-3xl" style={{ color: 'var(--c-text-dim)', letterSpacing: '0.1em' }}>VS</span>
            <span className="font-mono text-xs tabular-nums font-bold" style={{ color: 'var(--c-text-mute)' }}>{mm}:{ss}</span>
          </div>

          {/* Opponent placeholder */}
          <HudPanel style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', border: '1px dashed var(--c-border)' }}>
            <div className="w-12 h-12 rounded flex items-center justify-center font-display font-black text-lg animate-pulse"
              style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)', color: 'var(--c-text-mute)' }}
            >?</div>
            <div>
              <p className="font-display font-bold text-base animate-pulse" style={{ color: 'var(--c-text-mute)' }}>Matching…</p>
              <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--c-text-mute)' }}>~{rating} Elo</p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded"
              style={{ background: 'var(--c-panel2)', color: 'var(--c-text-mute)', border: '1px solid var(--c-border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: 'var(--c-text-mute)' }} />
              Scanning
            </div>
          </HudPanel>
        </div>
      </div>

      {/* Cancel button */}
      <DangerButton onClick={onCancel} className="relative z-10 px-6 py-2.5 text-xs">
        <X size={14} /> Cancel Queue
      </DangerButton>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════
   MATCH FOUND OVERLAY — VS clash + countdown
════════════════════════════════════════════════ */
function MatchFoundOverlay({ matchData, onComplete }) {
  const { user } = useAuth()
  const [countdown, setCountdown] = useState(3)
  const [isZooming, setIsZooming] = useState(false)

  const players = matchData?.players || []
  const you = players.find(p => p.username === user?.username) || players[0] || { username: user?.username || 'You', rating: user?.elo_rating || 1200 }
  const opponent = players.find(p => p.username !== user?.username) || players[1] || { username: 'RivalCoder', rating: 1200 }

  const youTier = getArenaTier(you.rating || 1200)
  const oppTier = getArenaTier(opponent.rating || 1200)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          setIsZooming(true)
          setTimeout(() => onComplete(), 400)
          return 0
        }
        return c - 1
      })
    }, 900)
    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div
      role="region"
      aria-live="assertive"
      aria-label="Match found announcement"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between py-8 px-4 overflow-hidden select-none transition-all duration-500 ${isZooming ? 'scale-125 opacity-0 blur-md' : 'scale-100 opacity-100'}`}
      style={{ background: 'var(--c-void)' }}
    >
      <div className="absolute inset-0 radar-bg-grid opacity-30 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none" style={{ background: youTier.col, opacity: 0.18 }} aria-hidden="true" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none" style={{ background: oppTier.col, opacity: 0.18 }} aria-hidden="true" />

      {/* Top banner */}
      <div className="relative z-20 flex flex-col items-center pt-2 space-y-1 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 font-mono text-xs font-bold uppercase tracking-widest rounded"
          style={{ background: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.3)', color: 'var(--c-red)' }}
        >
          <span className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--c-red)' }} />
          Match Found · 1v1 Duel
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="font-mono text-xs uppercase font-semibold" style={{ color: 'var(--c-text-dim)' }}>{matchData?.topic || 'Battle'}</span>
          <span style={{ color: 'var(--c-border)' }}>|</span>
          <DiffChip difficulty={matchData?.difficulty || 'medium'} />
        </div>
      </div>

      {/* VS Face-off */}
      <div className="relative z-20 w-full max-w-5xl mx-auto my-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">

        {/* You */}
        <div className="w-full md:w-[380px] animate-clash-left">
          <div className="relative p-6 sm:p-8 flex flex-col items-center text-center space-y-4 shadow-2xl transition-transform"
            style={{ background: 'linear-gradient(145deg, rgba(14,16,23,0.95) 0%, rgba(9,11,17,0.9) 100%)', border: `2px solid ${youTier.col}`, boxShadow: `0 0 35px ${youTier.col}35`, clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}
          >
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: `linear-gradient(90deg, ${youTier.col}, transparent)` }} />
            <div className="absolute top-3 left-4 px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider rounded" style={{ background: youTier.bg, color: youTier.col, border: `1px solid ${youTier.border}` }}>YOU</div>
            <div className="relative mt-2">
              <UserAvatar username={you.username} seed={you.avatar_seed} style={you.avatar_style} elo={you.rating} size={84} />
            </div>
            <div className="space-y-1 w-full">
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white truncate px-2 tracking-tight">{you.username}</h3>
              <div className="flex items-center justify-center gap-2 pt-1">
                <RankBadge elo={you.rating || 1200} size="sm" />
                <span className="font-mono text-sm font-black" style={{ color: youTier.col }}>{you.rating} Elo</span>
              </div>
            </div>
          </div>
        </div>

        {/* VS + countdown */}
        <div className="flex flex-col items-center justify-center my-2 md:my-0 relative z-30 animate-vs-pop">
          <span className="font-display font-black text-5xl sm:text-7xl tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-rose-600">VS</span>
          <div className="mt-4 flex flex-col items-center space-y-1.5">
            <div className="w-12 h-12 flex items-center justify-center rounded" style={{ background: 'var(--c-panel)', border: '1px solid rgba(225,29,72,0.5)', boxShadow: '0 0 20px rgba(225,29,72,0.3)' }}>
              <span className="font-mono font-black text-2xl animate-bounce" style={{ color: 'var(--c-red)' }}>
                {countdown > 0 ? countdown : <Zap size={24} />}
              </span>
            </div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-text-mute)' }}>
              {countdown > 0 ? 'Entering Arena…' : 'Battle Starting!'}
            </p>
          </div>
        </div>

        {/* Opponent */}
        <div className="w-full md:w-[380px] animate-clash-right">
          <div className="relative p-6 sm:p-8 flex flex-col items-center text-center space-y-4 shadow-2xl transition-transform"
            style={{ background: 'linear-gradient(145deg, rgba(14,16,23,0.95) 0%, rgba(9,11,17,0.9) 100%)', border: `2px solid ${oppTier.col}`, boxShadow: `0 0 35px ${oppTier.col}35`, clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}
          >
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: `linear-gradient(90deg, transparent, ${oppTier.col})` }} />
            <div className="absolute top-3 right-4 px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider rounded" style={{ background: oppTier.bg, color: oppTier.col, border: `1px solid ${oppTier.border}` }}>RIVAL</div>
            <div className="relative mt-2">
              <UserAvatar username={opponent.username} seed={opponent.avatar_seed} style={opponent.avatar_style} elo={opponent.rating} size={84} />
            </div>
            <div className="space-y-1 w-full">
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white truncate px-2 tracking-tight">{opponent.username}</h3>
              <div className="flex items-center justify-center gap-2 pt-1">
                <RankBadge elo={opponent.rating || 1200} size="sm" />
                <span className="font-mono text-sm font-black" style={{ color: oppTier.col }}>{opponent.rating} Elo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 pb-2 font-mono text-xs text-center" style={{ color: 'var(--c-text-mute)' }}>
        Initializing battle workspace…
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   PRIVATE MATCH MODAL
════════════════════════════════════════════════ */
function PrivateMatchModal({ isOpen, onClose, topic, diff, emit, on, off, initialRoomCode }) {
  const [tab, setTab] = useState(initialRoomCode ? 'join' : 'create')
  const [roomCode, setRoomCode] = useState(initialRoomCode || '')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (initialRoomCode) { setTab('join'); setRoomCode(initialRoomCode) } }, [initialRoomCode])

  useEffect(() => {
    function onCreated(data) { setCreatedRoom(data); setErrorMsg(null) }
    function onError(err) { setErrorMsg(err.message) }
    function onCancelled() { setCreatedRoom(null); setErrorMsg(null) }
    on('custom_room_created', onCreated)
    on('custom_room_error', onError)
    on('custom_room_cancelled', onCancelled)
    return () => { off('custom_room_created', onCreated); off('custom_room_error', onError); off('custom_room_cancelled', onCancelled) }
  }, [on, off])

  function handleCreateRoom() {
    if (!topic) { setErrorMsg('Select a topic first'); return }
    emit('create_custom_room', { topic, difficulty: diff })
  }
  function handleCancelCreated() {
    if (createdRoom) { emit('cancel_custom_room', { code: createdRoom.code }); setCreatedRoom(null) }
  }
  function handleJoinRoom() {
    if (!roomCode.trim()) { setErrorMsg('Enter a room code'); return }
    setErrorMsg(null)
    emit('join_custom_room', { code: roomCode.trim() })
  }
  function handleCopyLink() {
    if (!createdRoom) return
    navigator.clipboard.writeText(`${window.location.origin}/lobby?room=${createdRoom.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const TABS = [{ id: 'create', label: 'Create Room' }, { id: 'join', label: 'Join Code' }]

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { handleCancelCreated(); onClose() }}
      title="Private Duel"
      subtitle="Casual match with custom code"
      maxWidth={440}
    >
      <div className="flex mb-4 rounded overflow-hidden" style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setErrorMsg(null) }}
            className="flex-1 py-2 font-mono text-xs font-bold transition-all uppercase"
            style={{ background: tab === t.id ? 'var(--c-border)' : 'transparent', color: tab === t.id ? 'var(--c-red)' : 'var(--c-text-mute)', cursor: 'pointer', border: 'none' }}
          >{t.label}</button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 font-mono text-xs rounded" style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)', color: 'var(--c-red)' }}>
          {errorMsg}
        </div>
      )}

      {tab === 'create' && (
        <div className="space-y-4">
          {!createdRoom ? (
            <>
              <div className="p-3 space-y-2 font-mono text-xs rounded" style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--c-text-mute)' }}>Selected Topic:</span> <span style={{ color: 'var(--c-red)', fontWeight: 700 }}>{topic || 'Select a topic first'}</span></div>
                <div className="flex justify-between items-center"><span style={{ color: 'var(--c-text-mute)' }}>Difficulty:</span> <DiffChip difficulty={diff} /></div>
                <div className="flex justify-between"><span style={{ color: 'var(--c-text-mute)' }}>Match Type:</span> <span style={{ color: 'var(--c-green)', fontWeight: 700 }}>Unranked Duel</span></div>
              </div>
              <HudButton onClick={handleCreateRoom} disabled={!topic} className="w-full py-3">
                <Hash size={14} /> Generate Room Code
              </HudButton>
            </>
          ) : (
            <div className="text-center space-y-4 py-2">
              <p className="font-sans text-xs" style={{ color: 'var(--c-text-dim)' }}>Share this code or link with your opponent:</p>
              <div className="flex items-center justify-between p-4 rounded" style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)' }}>
                <span className="font-mono text-2xl font-black tracking-widest" style={{ color: 'var(--c-gold)' }}>{createdRoom.code}</span>
                <button onClick={handleCopyLink}
                  className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded transition-all cursor-pointer"
                  style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(225,29,72,0.15)', color: copied ? 'var(--c-green)' : 'var(--c-red)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}` }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 rounded-full animate-ping" style={{ background: 'var(--c-red)' }} />
                <span className="font-mono text-xs" style={{ color: 'var(--c-text-mute)' }}>Waiting for opponent to join…</span>
              </div>
              <button onClick={handleCancelCreated} className="font-mono text-xs underline cursor-pointer" style={{ color: 'var(--c-red)', background: 'none', border: 'none' }}>
                Cancel Room
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'join' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--c-text-mute)' }}>Invite Code</label>
            <input
              type="text"
              placeholder="e.g. ARENA-8K2Y"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              className="w-full p-3 font-mono text-sm uppercase font-bold tracking-wider rounded transition-all"
              style={{ background: 'var(--c-panel2)', border: '1px solid var(--c-border)', color: 'var(--c-gold)', outline: 'none' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--c-gold)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
            />
          </div>
          <HudButton onClick={handleJoinRoom} className="w-full py-3">
            <Swords size={14} /> Enter Room
          </HudButton>
        </div>
      )}
    </Modal>
  )
}

/* ════════════════════════════════════════════════
   MAIN LOBBY PAGE — Command Center
════════════════════════════════════════════════ */
export default function Lobby() {
  const { user, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const live = useLiveCounter()

  const [topic, setTopic] = useState(null)
  const [diff, setDiff] = useState('medium')
  const [queuing, setQueuing] = useState(false)
  const [matchFoundData, setMatchFoundData] = useState(null)
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [dailyProblem, setDailyProblem] = useState(null)

  const desktopSearchRef = useRef(null)
  const mobileSearchRef = useRef(null)
  const initialRoomCode = searchParams.get('room')

  const { connected, emit, on, off, socket } = useSocket()

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedTopic = localStorage.getItem('algoarena_last_topic')
      const savedDiff = localStorage.getItem('algoarena_last_diff')
      if (savedTopic && TOPICS.some(t => t.id === savedTopic)) setTopic(savedTopic)
      if (savedDiff && DIFFS.some(d => d.id === savedDiff)) setDiff(savedDiff)
    } catch { }
  }, [])

  // Topic & Diff selection handlers with localStorage memory
  const handleSelectTopic = useCallback((tId) => {
    setTopic(tId)
    try {
      if (tId) localStorage.setItem('algoarena_last_topic', tId)
      else localStorage.removeItem('algoarena_last_topic')
    } catch { }
  }, [])

  const handleSelectDiff = useCallback((dId) => {
    setDiff(dId)
    try {
      localStorage.setItem('algoarena_last_diff', dId)
    } catch { }
  }, [])

  // Keyboard Shortcuts (1-8 topics, '/' search, 'Enter' deploy)
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
      if (customModalOpen || queuing || matchFoundData) return

      if (e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key, 10) - 1
        if (TOPICS[idx]) handleSelectTopic(TOPICS[idx].id)
      } else if (e.key === '9' || e.key === '0') {
        // Surprise Me shortcut
        const randTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)].id
        handleSelectTopic(randTopic)
      } else if (e.key === '/') {
        e.preventDefault()
        if (window.innerWidth < 640) {
          mobileSearchRef.current?.focus()
        } else {
          desktopSearchRef.current?.focus()
        }
      } else if (e.key === 'Enter') {
        if (topic) startQueue()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [topic, customModalOpen, queuing, matchFoundData, handleSelectTopic])

  useEffect(() => { if (!loading && !isAuthenticated) navigate('/?auth=login') }, [loading, isAuthenticated, navigate])
  useEffect(() => { if (initialRoomCode) setCustomModalOpen(true) }, [initialRoomCode])

  useEffect(() => {
    function onMatchFound(data) { console.log('[Lobby] match_found →', data?.roomId); setQueuing(false); setMatchFoundData(data) }
    on('match_found', onMatchFound)
    return () => off('match_found', onMatchFound)
  }, [on, off])

  useEffect(() => {
    api.get('/api/problems/daily').then(({ data }) => setDailyProblem(data)).catch(() => { })
  }, [])

  // Auto re-join on reconnect
  useEffect(() => {
    if (connected && queuing && topic && diff) emit('join_queue', { topic, difficulty: diff })
  }, [connected, queuing, topic, diff, emit])

  if (loading && !user) {
    return (
      <PageWrapper heroGlow>
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full animate-ping" style={{ background: 'var(--c-red)', opacity: 0.6 }} />
            <p className="font-mono text-sm tracking-wider uppercase" style={{ color: 'var(--c-text-mute)' }}>
              Initializing Command Center…
            </p>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!loading && !isAuthenticated) return null

  const elo = user?.elo_rating ?? 1200
  const userTier = getArenaTier(elo)
  const selectedTopicObj = TOPICS.find(t => t.id === topic)
  const diffObj = DIFFS.find(d => d.id === diff) || DIFFS[1]

  const dailyObj = dailyProblem ? {
    topic: dailyProblem.topic,
    title: dailyProblem.title,
    difficulty: dailyProblem.difficulty,
    desc: (dailyProblem.description || '').slice(0, 140) + '…'
  } : null


  function startQueue() {
    if (!topic) return
    setQueuing(true)
    if (connected) { emit('join_queue', { topic, difficulty: diff }) }
    else { socket.once('connect', () => emit('join_queue', { topic, difficulty: diff })) }
  }

  function cancelQueue() { emit('leave_queue'); setQueuing(false) }

  function handleSurpriseMe() {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)].id
    handleSelectTopic(randomTopic)
  }

  const isDailySelected = dailyObj ? (topic === dailyObj.topic && diff === dailyObj.difficulty) : false

  return (
    <>
      {/* Overlays */}
      <AnimatePresence>
        {matchFoundData ? (
          <MatchFoundOverlay matchData={matchFoundData} onComplete={() => {
            const data = matchFoundData
            setMatchFoundData(null)
            navigate(`/match/${data.roomId}`, { state: { topic: data.topic, difficulty: data.difficulty, players: data.players, problemId: data.problemId } })
          }} />
        ) : queuing ? (
          <SearchingOverlay topic={topic} difficulty={diff} rating={elo} onCancel={cancelQueue} />
        ) : null}
      </AnimatePresence>

      <PrivateMatchModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        topic={topic} diff={diff} emit={emit} on={on} off={off} initialRoomCode={initialRoomCode}
      />

      <PageWrapper heroGlow>

        <div style={{ borderBottom: '1px solid var(--c-border)', background: 'rgba(11,17,32,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">

            {/* Left — Title */}
            <div className="flex-shrink-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-red)' }}>
                Command Center
              </p>
              <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight uppercase" style={{ color: 'var(--c-text)' }}>
                Deploy Into Battle
              </h1>
            </div>

            {/* Center — Roster Search */}
            <div className="flex-1 max-w-xs sm:max-w-sm mx-4 hidden sm:block">
              <HeaderRosterSearch inputRef={desktopSearchRef} />
            </div>

            {/* Right — System Info */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Mobile search icon */}
              <div className="sm:hidden">
                <HeaderRosterSearch inputRef={mobileSearchRef} />
              </div>
              <div className="text-right font-mono text-[11px] px-3 py-2"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--c-green)' }} />
                  {live.loading ? (
                    <Skeleton className="w-8 h-4 rounded-sm" />
                  ) : (
                    <span className="font-bold" style={{ color: 'var(--c-text)' }}>{live.totalProblems}</span>
                  )}
                  <span style={{ color: 'var(--c-text-mute)' }}>Problems</span>
                </div>
                <div className="text-[10px] flex justify-end mt-0.5" style={{ color: 'var(--c-text-mute)' }}>
                  {live.loading ? (
                    <div className="flex items-center gap-1"><Skeleton className="w-4 h-3 rounded-sm" /> Coders Online</div>
                  ) : (
                    <>{live.players} Coders Online</>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6 space-y-6">

          {/* STEPPER STRIP */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 rounded" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-border)' }}>
            {/* Step 1: Select Topic */}
            <div className={`flex items-center gap-2 p-2 rounded transition-colors ${topic ? 'opacity-100' : 'opacity-70'}`}
              style={{ background: topic ? 'rgba(225,29,72,0.12)' : 'transparent', border: `1px solid ${topic ? 'rgba(225,29,72,0.35)' : 'var(--c-border)'}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                style={{ background: topic ? 'var(--c-red)' : 'var(--c-panel2)', color: topic ? '#fff' : 'var(--c-text-mute)' }}>
                1
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: topic ? 'var(--c-red)' : 'var(--c-text-mute)', background: 'transparent' }}>Step 1</p>
                <p className="font-display font-semibold text-xs truncate" style={{ color: 'var(--c-text)', background: 'transparent' }}>Select Topic</p>
              </div>
            </div>

            {/* Step 2: Choose Difficulty (Matches chosen difficulty color: Easy=Green, Medium=Amber/Yellow, Hard=Red) */}
            <div className="flex items-center gap-2 p-2 rounded transition-colors"
              style={{ background: diffObj.bg, border: `1px solid ${diffObj.border}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                style={{ background: diffObj.col, color: diffObj.id === 'easy' ? '#000' : '#fff' }}>
                2
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: diffObj.col, background: 'transparent' }}>Step 2</p>
                <p className="font-display font-semibold text-xs truncate" style={{ color: 'var(--c-text)', background: 'transparent' }}>Choose Difficulty</p>
              </div>
            </div>

            {/* Step 3: Deploy Match (Matches RED Deploy button) */}
            <div className={`flex items-center gap-2 p-2 rounded transition-colors ${topic ? 'opacity-100 animate-pulse' : 'opacity-50'}`}
              style={{ background: topic ? 'rgba(225,29,72,0.12)' : 'transparent', border: `1px solid ${topic ? 'rgba(225,29,72,0.35)' : 'var(--c-border)'}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                style={{ background: topic ? 'var(--c-red)' : 'var(--c-panel2)', color: topic ? '#fff' : 'var(--c-text-mute)' }}>
                3
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: topic ? 'var(--c-red)' : 'var(--c-text-mute)', background: 'transparent' }}>Step 3</p>
                <p className="font-display font-semibold text-xs truncate" style={{ color: 'var(--c-text)', background: 'transparent' }}>Deploy Match</p>
              </div>
            </div>
          </div>

          {/* FEATURED DAILY CHALLENGE BANNER */}
          {dailyObj ? (
            <HudPanel accentTopLeft="var(--c-gold)" accentBotRight="var(--c-gold)" glow glowColor="rgba(245,185,66,0.15)" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ background: 'rgba(245,185,66,0.15)', color: 'var(--c-gold)', border: '1px solid rgba(245,185,66,0.3)' }}>
                      Daily Challenge
                    </span>
                    <span className="font-mono text-xs uppercase" style={{ color: 'var(--c-text-mute)' }}>Topic: {dailyObj.topic}</span>
                    <DiffChip difficulty={dailyObj.difficulty} />
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl" style={{ color: 'var(--c-text)' }}>
                    {dailyObj.title}
                  </h3>
                  <p className="font-sans text-xs max-w-3xl leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
                    {dailyObj.desc}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDailySelected) {
                        handleSelectTopic(null)
                      } else {
                        handleSelectTopic(dailyObj.topic)
                        handleSelectDiff(dailyObj.difficulty)
                      }
                    }}
                    className="px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 cursor-pointer"
                    style={{
                      background: isDailySelected ? 'rgba(245,185,66,0.2)' : 'var(--c-gold)',
                      color: isDailySelected ? 'var(--c-gold)' : '#000',
                      border: `1px solid var(--c-gold)`,
                      boxShadow: '0 0 15px rgba(245,185,66,0.3)'
                    }}
                  >
                    {isDailySelected ? (
                      <>
                        <CheckCircle2 size={15} /> Daily Selected (Click to Deselect)
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Take Daily Challenge
                      </>
                    )}
                  </button>
                </div>
              </div>
            </HudPanel>
          ) : (
            <HudPanel accentTopLeft="var(--c-border)" accentBotRight="var(--c-border)" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1 w-full">
                  <Skeleton height={20} width={120} />
                  <Skeleton height={28} width="60%" />
                  <Skeleton height={14} width="90%" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton height={40} width={180} />
                </div>
              </div>
            </HudPanel>
          )}

          {/* TWO COLUMN CONTENT: TOPIC & DIFF GRID vs STICKY DEPLOY LOADOUT */}
          <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

            {/* LEFT COLUMN: TOPICS + DIFFICULTY */}
            <div className="space-y-8">

              {/* STEP 1: TOPICS GRID */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase tracking-wide" style={{ color: 'var(--c-text)' }}>
                      Step 1: Choose Battle Topic
                    </h2>
                    <p className="font-mono text-xs" style={{ color: 'var(--c-text-mute)' }}>
                      Press number keys 1–8 to select a topic quickly
                    </p>
                  </div>

                  {topic && (
                    <button onClick={() => handleSelectTopic(null)} className="font-mono text-xs flex items-center gap-1 hover:text-rose-500 transition-colors"
                      style={{ color: 'var(--c-text-mute)', background: 'none', border: 'none', cursor: 'pointer' }}
                    ><X size={12} /> Clear Selection</button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="Battle Topics">
                  {/* SURPRISE ME CARD */}
                  <motion.button
                    type="button"
                    role="radio"
                    aria-checked={false}
                    onClick={handleSurpriseMe}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative text-left p-4 transition-all duration-200 outline-none cursor-pointer flex flex-col justify-between"
                    style={{
                      background: 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(14,16,23,0.95) 100%)',
                      border: '1px dashed var(--c-blue)',
                      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.2)', color: 'var(--c-blue)' }}>
                            <Shuffle size={16} />
                          </div>
                          <div>
                            <span className="font-display font-bold text-sm tracking-wide block" style={{ color: 'var(--c-blue)' }}>
                              Surprise Me
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--c-text-mute)' }}>
                              Key [9]
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="font-sans text-xs leading-relaxed mb-3" style={{ color: 'var(--c-text-dim)' }}>
                        Random topic pick for unpredictable tactical duel.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between font-mono text-[9px]" style={{ borderTop: '1px solid var(--c-border)', color: 'var(--c-blue)' }}>
                      <span>Random Selection</span>
                      <ChevronRight size={12} />
                    </div>
                  </motion.button>

                  {/* 8 TOPIC CARDS */}
                  {TOPICS.map((t, idx) => (
                    <TopicCard
                      key={t.id}
                      topic={t}
                      selected={topic === t.id}
                      onClick={() => handleSelectTopic(t.id)}
                      indexKey={idx + 1}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 2: DIFFICULTY SELECTOR */}
              <div>
                <div className="mb-4">
                  <h2 className="font-display font-bold text-lg uppercase tracking-wide" style={{ color: 'var(--c-text)' }}>
                    Step 2: Choose Difficulty
                  </h2>
                  <p className="font-mono text-xs" style={{ color: 'var(--c-text-mute)' }}>
                    Difficulty affects estimated Elo swings and problem severity
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DIFFS.map(d => {
                    const active = diff === d.id
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDiff(d.id)}
                        className="p-4 text-left transition-all duration-200 outline-none cursor-pointer rounded"
                        style={{
                          background: active ? d.bg : 'var(--c-panel)',
                          border: `1.5px solid ${active ? d.col : 'var(--c-border)'}`,
                          boxShadow: active ? `0 0 20px ${d.col}25` : 'none'
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display font-bold text-base uppercase" style={{ color: active ? d.col : 'var(--c-text)' }}>
                            {d.label}
                          </span>
                          {active && (
                            <div className="w-2 h-2 rounded-full" style={{ background: d.col }} />
                          )}
                        </div>
                        <p className="font-mono text-xs font-semibold mb-2" style={{ color: d.col }}>
                          {d.descriptor}
                        </p>
                        <p className="font-mono text-[10px]" style={{ color: 'var(--c-text-mute)' }}>
                          Est Elo: {d.eloEst}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: STICKY DEPLOY LOADOUT + PRIVATE DUEL */}
            <div className="space-y-6 lg:sticky lg:top-20">

              {/* DEPLOY LOADOUT PANEL */}
              <HudPanel
                accentTopLeft={topic ? 'var(--c-red)' : undefined}
                accentBotRight={topic ? 'var(--c-red)' : undefined}
                glow={!!topic}
                glowColor="rgba(225,29,72,0.2)"
                style={{ padding: '1.25rem' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <h3 className="font-display font-bold text-base uppercase tracking-wider" style={{ color: 'var(--c-text)' }}>
                      Your Loadout
                    </h3>
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{
                        background: topic ? 'rgba(16,185,129,0.15)' : 'rgba(225,29,72,0.15)',
                        color: topic ? 'var(--c-green)' : 'var(--c-red)',
                        border: `1px solid ${topic ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`
                      }}>
                      {topic ? 'Ready' : 'Incomplete'}
                    </span>
                  </div>

                  {/* Summary Rows */}
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--c-text-mute)' }}>Topic:</span>
                      <span className="font-bold flex items-center gap-1.5" style={{ color: topic ? 'var(--c-red)' : 'var(--c-text-mute)' }}>
                        {selectedTopicObj ? (
                          <>
                            <selectedTopicObj.icon size={13} />
                            {selectedTopicObj.label}
                          </>
                        ) : 'Not Selected'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--c-text-mute)' }}>Difficulty:</span>
                      <DiffChip difficulty={diff} />
                    </div>



                    <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
                      <span style={{ color: 'var(--c-text-mute)' }}>Est Victory:</span>
                      <span className="font-bold" style={{ color: 'var(--c-green)' }}>+18 Elo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--c-text-mute)' }}>Est Defeat:</span>
                      <span className="font-bold" style={{ color: 'var(--c-red)' }}>−18 Elo</span>
                    </div>
                  </div>

                  {/* Deploy Button */}
                  <div className="pt-2">
                    <HudButton
                      id="find-match-btn"
                      onClick={startQueue}
                      disabled={!topic}
                      className="w-full py-3.5 text-base flex items-center justify-center gap-2"
                    >
                      <Swords size={18} />
                      {topic ? 'Deploy Into Battle' : 'Choose A Topic To Begin'}
                    </HudButton>

                    {!topic && (
                      <p className="font-mono text-[10px] text-center mt-2 animate-pulse" style={{ color: 'var(--c-red)' }}>
                        Please select a topic from Step 1 above
                      </p>
                    )}
                  </div>
                </div>
              </HudPanel>

              {/* PROMOTED PRIVATE DUEL CARD */}
              <HudPanel style={{ padding: '1.25rem' }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield size={16} style={{ color: 'var(--c-blue)' }} />
                    <h3 className="font-display font-bold text-sm uppercase" style={{ color: 'var(--c-text)' }}>
                      Private Duel
                    </h3>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto" style={{ background: 'var(--c-panel2)', color: 'var(--c-blue)', border: '1px solid var(--c-border)' }}>
                      Casual
                    </span>
                  </div>
                  <p className="font-sans text-xs" style={{ color: 'var(--c-text-dim)' }}>
                    Challenge a friend directly with a custom room code or join an existing session.
                  </p>
                  <GhostButton onClick={() => setCustomModalOpen(true)} className="w-full py-2.5 text-xs">
                    <Hash size={13} style={{ color: 'var(--c-blue)' }} />
                    Create Or Join Private Room
                  </GhostButton>
                </div>
              </HudPanel>

            </div>

          </div>

        </div>

        {/* MOBILE STICKY BOTTOM DEPLOY BAR */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 flex items-center gap-3 backdrop-blur-md"
          style={{ background: 'rgba(11,17,32,0.95)', borderTop: '1px solid var(--c-border)', boxShadow: '0 -8px 24px rgba(0,0,0,0.5)' }}>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase font-bold truncate" style={{ color: topic ? 'var(--c-red)' : 'var(--c-text-mute)' }}>
              {selectedTopicObj ? selectedTopicObj.label : 'Select Topic'} • {diffObj.label}
            </p>
            <p className="font-mono text-[10px]" style={{ color: 'var(--c-text-mute)' }}>
              Elo swing: +18 / −18
            </p>
          </div>
          <HudButton
            onClick={startQueue}
            disabled={!topic}
            className="px-5 py-3 text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
          >
            <Swords size={14} />
            {topic ? 'Deploy' : 'Pick Topic'}
          </HudButton>
        </div>

      </PageWrapper>
    </>
  )
}
