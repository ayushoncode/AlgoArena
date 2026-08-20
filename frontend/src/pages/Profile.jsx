import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStreak } from '../hooks/useStreak'
import api from '../utils/api'
import { UserAvatar } from '../utils/avatar'

/* ════════════════════════════════════════════════
   SVG ELO CHART
════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════
   ALGOARENA ELO PROGRESSION CHART
   Features:
   - Harmonious AlgoArena Tier Bands (Novice, Challenger, Specialist, Elite, Master, Grandmaster)
   - Flame Orange Rating Curve with Gradient Area & Glow
   - Peak Rating Indicator
   - Real-Time Crosshair & Match Detail Tooltip
════════════════════════════════════════════════ */
const RANK_TIERS = [
  { name: 'Novice',      min: 0,    max: 1199, bg: 'rgba(100,116,139,0.07)', border: '#334155', text: '#94a3b8' },
  { name: 'Challenger',  min: 1200, max: 1399, bg: 'rgba(16,185,129,0.08)',  border: '#065f46', text: '#10b981' },
  { name: 'Specialist',  min: 1400, max: 1599, bg: 'rgba(6,182,212,0.08)',   border: '#155e75', text: '#06b6d4' },
  { name: 'Elite',       min: 1600, max: 1899, bg: 'rgba(129,140,248,0.10)', border: '#3730a3', text: '#818cf8' },
  { name: 'Master',      min: 1900, max: 2199, bg: 'rgba(192,132,252,0.12)', border: '#6b21a8', text: '#c084fc' },
  { name: 'Grandmaster', min: 2200, max: 3500, bg: 'rgba(249,115,22,0.14)',  border: '#9a3412', text: '#f97316' },
]

export function getRankTier(rating = 1200) {
  for (const tier of RANK_TIERS) {
    if (rating >= tier.min && rating <= tier.max) return tier
  }
  return RANK_TIERS[0]
}

const W = 760, H = 250, PAD = { top: 25, right: 35, bottom: 35, left: 48 }

function EloChart({ data = [], username = 'Coder' }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) return null

  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom }
  const ratings = data.map(d => Number(d.rating) || 1200)

  const minRaw = Math.min(...ratings)
  const maxRaw = Math.max(...ratings)
  const spread = maxRaw - minRaw
  const pad = Math.max(30, Math.round(spread * 0.35))
  const minR = Math.max(0, Math.floor((minRaw - pad) / 20) * 20)
  const maxR = Math.ceil((maxRaw + pad) / 20) * 20
  const rangeR = maxR - minR || 1

  const xScale = i => data.length === 1 ? inner.w / 2 : (i / (data.length - 1)) * inner.w
  const yScale = r => inner.h - ((r - minR) / rangeR) * inner.h

  const pts = data.map((d, i) => [xScale(i), yScale(Number(d.rating) || 1200)])

  // Peak rating calculation
  let peakIdx = 0
  let maxVal = -1
  data.forEach((d, i) => {
    if (Number(d.rating) > maxVal) {
      maxVal = Number(d.rating)
      peakIdx = i
    }
  })

  function buildPath(points) {
    if (points.length === 1) return `M 0 ${points[0][1]} L ${inner.w} ${points[0][1]}`
    let d = `M ${points[0][0]} ${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1]
      const [x1, y1] = points[i]
      const cx = (x0 + x1) / 2
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
    }
    return d
  }

  const linePath = buildPath(pts)
  const areaPath = linePath + ` L ${pts[pts.length - 1][0]} ${inner.h} L ${pts[0][0]} ${inner.h} Z`

  // Dynamic Y-axis gridlines
  const yStep = Math.max(20, Math.round(rangeR / 4 / 10) * 10)
  const boundaryRatings = []
  for (let r = Math.ceil((minR + 5) / yStep) * yStep; r < maxR; r += yStep) {
    boundaryRatings.push(r)
  }

  // X-axis labels: use "Match N" when all dates are same day, else use "Aug 26"-style
  const step = Math.max(1, Math.floor(data.length / 5))
  const allDatesStr = data.map(d => d.date ? new Date(d.date).toDateString() : '')
  const uniqueDates = new Set(allDatesStr)
  const useDateLabels = uniqueDates.size > 1
  const xLabels = data
    .map((d, i) => {
      let label
      if (useDateLabels) {
        const dt = d.date ? new Date(d.date) : new Date()
        label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        label = `#${i + 1}`
      }
      return { i, label, x: xScale(i) }
    })
    .filter((_, i) => i % step === 0 || i === data.length - 1)

  const activePoint = hovered || data[data.length - 1]
  const activeTier = getRankTier(activePoint?.rating || 1200)

  return (
    <div className="space-y-3">
      {/* Top Header Information */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: activeTier.text }} />
          <span className="font-bold text-[#dde1ea]">{username}</span>
          <span className="text-[#4b5563]">·</span>
          <span style={{ color: activeTier.text }} className="font-bold">
            {activeTier.name} ({activePoint?.rating ?? 1200} Elo)
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
          <span>{data.length} matches recorded</span>
        </div>
      </div>

      {/* SVG Chart Frame */}
      <div className="relative rounded-lg border border-[#1e2130] bg-[#07090e] overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <clipPath id="algoClip">
              <rect x="0" y="0" width={inner.w} height={inner.h} />
            </clipPath>
            <linearGradient id="algoAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeTier.text} stopOpacity="0.25" />
              <stop offset="100%" stopColor={activeTier.text} stopOpacity="0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* 1. Horizontal Tier Colored Bands */}
            {RANK_TIERS.map((tier) => {
              const yTop = Math.max(0, Math.min(inner.h, yScale(Math.min(maxR, tier.max + 1))))
              const yBottom = Math.max(0, Math.min(inner.h, yScale(Math.max(minR, tier.min))))
              const height = yBottom - yTop
              if (height <= 0) return null

              return (
                <rect
                  key={tier.name}
                  x={0}
                  y={yTop}
                  width={inner.w}
                  height={height}
                  fill={tier.bg}
                  style={{ transition: 'all 0.3s ease' }}
                />
              )
            })}

            {/* 2. Grid lines & Y-axis labels */}
            {boundaryRatings.map((r) => {
              const y = yScale(r)
              const t = getRankTier(r)
              return (
                <g key={r}>
                  <line
                    x1={0}
                    y1={y}
                    x2={inner.w}
                    y2={y}
                    stroke={t.border}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.4}
                  />
                  <text
                    x={-8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize={10}
                    fill={t.text}
                    fontFamily="JetBrains Mono, monospace"
                    opacity={0.85}
                  >
                    {r}
                  </text>
                </g>
              )
            })}

            {/* 3. X-axis date / match markers */}
            {xLabels.map((lbl) => (
              <g key={lbl.i}>
                <line
                  x1={lbl.x}
                  y1={0}
                  x2={lbl.x}
                  y2={inner.h}
                  stroke="#1e293b"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  strokeOpacity={0.3}
                />
                <text
                  x={lbl.x}
                  y={inner.h + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#475569"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {lbl.label}
                </text>
              </g>
            ))}

            {/* 4. Smooth Area Glow & Rating Curve */}
            <path d={areaPath} fill="url(#algoAreaGrad)" clipPath="url(#algoClip)" />
            <path
              d={linePath}
              fill="none"
              stroke={activeTier.text}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#algoClip)"
            />

            {/* 5. Match Nodes — colored by each node's rank tier */}
            {pts.map(([x, y], i) => {
              const isPeak = i === peakIdx && ratings.length > 1
              const pointTier = getRankTier(data[i]?.rating || 1200)
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isPeak ? 5 : 3.5}
                    fill={isPeak ? '#22d3ee' : pointTier.text}
                    stroke="#07090e"
                    strokeWidth={1.5}
                  />
                  <rect
                    x={x - 12}
                    y={0}
                    width={24}
                    height={inner.h}
                    fill="transparent"
                    onMouseEnter={() => setHovered({ x, y, index: i, ...data[i] })}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              )
            })}

            {/* 6. Interactive Floating Tooltip */}
            {hovered && (
              <>
                <line
                  x1={hovered.x}
                  y1={0}
                  x2={hovered.x}
                  y2={inner.h}
                  stroke={getRankTier(hovered.rating).border}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={hovered.x}
                  cy={hovered.y}
                  r={5.5}
                  fill={getRankTier(hovered.rating).text}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <g
                  transform={`translate(${
                    hovered.x > inner.w - 170 ? hovered.x - 175 : hovered.x + 12
                  }, ${Math.max(10, Math.min(inner.h - 90, hovered.y - 45))})`}
                >
                  <rect
                    x={0}
                    y={0}
                    width={165}
                    height={72}
                    rx={6}
                    fill="#0d111c"
                    stroke="#1e293b"
                    strokeWidth={1}
                    filter="drop-shadow(0 6px 16px rgba(0,0,0,0.6))"
                  />
                  <text x={10} y={18} fontSize={11} fill={getRankTier(hovered.rating).text} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                    = {hovered.rating} ({getRankTier(hovered.rating).name})
                  </text>
                  <text x={10} y={34} fontSize={9} fill="#dde1ea" fontFamily="JetBrains Mono, monospace">
                    {hovered.delta ? `Delta: ${hovered.delta > 0 ? `+${hovered.delta}` : hovered.delta}` : `Match #${hovered.index + 1}`}
                  </text>
                  <text x={10} y={48} fontSize={9} fill="#9ca3af" fontFamily="JetBrains Mono, monospace">
                    {hovered.opponent ? `vs @${hovered.opponent}` : `${hovered.topic || '1v1 Duel'}`}
                  </text>
                  <text x={10} y={62} fontSize={8.5} fill="#64748b" fontFamily="JetBrains Mono, monospace">
                    {hovered.date ? new Date(hovered.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                  </text>
                </g>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Tier Legend Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#1e2130]/60 text-[10px] font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          {RANK_TIERS.map(t => (
            <div key={t.name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: t.text }} />
              <span style={{ color: t.text }}>{t.name}</span>
              <span className="text-[#4b5563]">({t.min}+)</span>
            </div>
          ))}
        </div>
        <div className="text-[#64748b] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22d3ee]" />
          <span>Peak Rating</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STREAK MINI-CALENDAR (30 days)
════════════════════════════════════════════════ */
function StreakCalendar({ history, matches = [] }) {
  const today = new Date().toISOString().slice(0, 10)

  // Build a set of active dates from history Set, history Array, or match timestamps
  const activeDates = new Set()
  if (history instanceof Set) {
    history.forEach(d => activeDates.add(d))
  } else if (Array.isArray(history)) {
    history.forEach(d => activeDates.add(typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)))
  }
  if (Array.isArray(matches)) {
    matches.forEach(m => {
      const dt = m.ended_at || m.started_at || m.date
      if (dt) {
        try {
          activeDates.add(new Date(dt).toISOString().slice(0, 10))
        } catch {}
      }
    })
  }

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const date = d.toISOString().slice(0, 10)
    return { date, active: activeDates.has(date), isToday: date === today }
  })

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
      {days.map(({ date, active, isToday }) => (
        <div
          key={date}
          title={date}
          className="aspect-square"
          style={{
            borderRadius: 3,
            background: active ? (isToday ? '#f97316' : 'rgba(249,115,22,0.5)') : '#0d0f17',
            border: `1px solid ${isToday ? '#f97316' : active ? 'rgba(249,115,22,0.3)' : '#1e2130'}`,
            boxShadow: isToday ? '0 0 6px rgba(249,115,22,0.35)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════
   MATCH HISTORY ROW
════════════════════════════════════════════════ */
function MatchRow({ m }) {
  const win = m.result === 'WIN'
  const deltaStr = m.elo_delta ? (m.elo_delta > 0 ? `+${m.elo_delta}` : `${m.elo_delta}`) : '0'
  const dateStr = m.ended_at ? new Date(m.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors"
         style={{ borderBottom: '1px solid #0d0f17' }}
         onMouseOver={e => e.currentTarget.style.background = '#0d0f17'}
         onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>

      <span className="font-mono text-[10px] font-bold px-2 py-0.5 shrink-0"
            style={{ borderRadius: 3, background: win ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                     color: win ? '#10b981' : '#f43f5e', border: `1px solid ${win ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`, width: 40, textAlign: 'center' }}>
        {m.result}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-[12px]" style={{ color: '#dde1ea' }}>vs {m.opponent || 'Opponent'}</p>
        <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>{m.topic} · {m.difficulty}</p>
      </div>

      <span className="font-mono text-[12px] font-bold shrink-0 w-12 text-right"
            style={{ color: win ? '#10b981' : '#f43f5e' }}>
        {deltaStr}
      </span>

      <span className="font-mono text-[10px] shrink-0 hidden sm:block" style={{ color: '#374151', width: 70, textAlign: 'right' }}>
        {dateStr}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════
   STAT CARD
════════════════════════════════════════════════ */
function StatCard({ label, value, sub, color = '#dde1ea' }) {
  return (
    <div className="px-4 py-4" style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4 }}>
      <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
        {label}
      </p>
      <p className="font-display font-black text-3xl leading-none" style={{ color }}>
        {value}
      </p>
      {sub && <p className="font-mono text-[10px] mt-1" style={{ color: '#374151' }}>{sub}</p>}
    </div>
  )
}

/* ════════════════════════════════════════════════
   AVATAR SELECTOR MODAL
════════════════════════════════════════════════ */
function AvatarSelectorModal({ isOpen, onClose, currentSeed, currentStyle, username, onSave }) {
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || 'adventurer')
  const [selectedSeed, setSelectedSeed]   = useState(currentSeed || username || 'coder')
  const [customInput, setCustomInput]     = useState('')
  const [saving, setSaving]               = useState(false)

  const styles = [
    { id: 'adventurer', label: 'Adventurer (Male)', icon: '👦' },
    { id: 'lorelei', label: 'Lorelei (Female)', icon: '👧' },
    { id: 'bottts', label: 'Cyber Bot', icon: '🤖' },
    { id: 'pixel-art', label: 'Pixel Gamer', icon: '👾' },
    { id: 'notionists', label: 'Tech Sketch', icon: '🎨' },
  ]

  const PRESETS = {
    adventurer: ['Felix', 'Leo', 'Max', 'Alex', 'Oliver', 'Liam', 'Ethan', 'Aiden'],
    lorelei: ['Sara', 'Maya', 'Luna', 'Chloe', 'Zoe', 'Lily', 'Emma', 'Aria'],
    bottts: ['Glitch', 'Cyber', 'Neon', 'Pixel', 'Matrix', 'Vortex', 'Spark', 'Nova'],
    'pixel-art': ['Shadow', 'Blaze', 'Cipher', 'Titan', 'Ghost', 'Phantom', 'Knight', 'Rogue'],
    notionists: ['Code', 'Zen', 'Echo', 'Orbit', 'Pulse', 'Byte', 'Apex', 'Prism'],
  }

  const handleRandom = () => {
    const pool = PRESETS[selectedStyle] || PRESETS.adventurer
    const rand = pool[Math.floor(Math.random() * pool.length)] + Math.floor(Math.random() * 1000)
    setSelectedSeed(rand)
  }

  const handleApplyCustom = (e) => {
    e?.preventDefault()
    if (customInput.trim()) {
      setSelectedSeed(customInput.trim())
      setCustomInput('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ avatar_seed: selectedSeed, avatar_style: selectedStyle })
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-[#1e2130] bg-[#090b13] p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e2130] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h2 className="font-display font-bold text-lg text-[#dde1ea]">Choose Your Arena Avatar</h2>
          </div>
          <button onClick={onClose} className="font-mono text-xs text-[#6b7280] hover:text-[#f97316] p-1">
            ✕
          </button>
        </div>

        {/* Live Preview */}
        <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-[#07080c] border border-[#1e2130]">
          <UserAvatar username={username} seed={selectedSeed} style={selectedStyle} size={76} isMe={true} />
          <div className="space-y-1">
            <p className="font-mono text-sm font-bold text-[#dde1ea]">@{username}</p>
            <p className="font-mono text-xs text-[#f97316]">Style: {selectedStyle}</p>
            <p className="font-mono text-[10px] text-[#6b7280] truncate max-w-[200px]">Seed: {selectedSeed}</p>
          </div>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {styles.map(st => (
            <button
              key={st.id}
              onClick={() => { setSelectedStyle(st.id); setSelectedSeed(PRESETS[st.id]?.[0] || 'seed1') }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStyle === st.id
                  ? 'bg-orange-500/20 text-[#f97316] border border-orange-500/50 shadow-sm'
                  : 'bg-[#0d0f17] text-[#9ca3af] border border-[#1e2130] hover:border-[#374151]'
              }`}
            >
              {st.icon} {st.label}
            </button>
          ))}
        </div>

        {/* Preset Avatars Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] text-[#6b7280] uppercase tracking-wider">// Curated Presets</p>
            <button
              onClick={handleRandom}
              className="font-mono text-[11px] text-[#22d3ee] hover:underline flex items-center gap-1 cursor-pointer"
            >
              🎲 Randomize
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {(PRESETS[selectedStyle] || []).map((preset) => {
              const active = selectedSeed === preset
              return (
                <button
                  key={preset}
                  onClick={() => setSelectedSeed(preset)}
                  className={`p-1.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    active
                      ? 'bg-orange-500/20 border-orange-500 scale-105 shadow-lg shadow-orange-500/20'
                      : 'bg-[#0d0f17] border-[#1e2130] hover:border-[#374151]'
                  }`}
                >
                  <UserAvatar username={username} seed={preset} style={selectedStyle} size={36} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Seed Input */}
        <form onSubmit={handleApplyCustom} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type custom name / seed..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className="flex-1 bg-[#07080c] border border-[#1e2130] rounded-lg px-3 py-2 text-xs font-mono text-[#dde1ea] focus:border-[#f97316] outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-lg bg-[#1e2130] text-xs font-mono font-bold text-[#dde1ea] hover:bg-[#2d3748] cursor-pointer"
          >
            Apply
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2130]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-mono text-xs text-[#9ca3af] hover:text-white bg-[#0d0f17] border border-[#1e2130] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="btn-primary py-2 px-5 text-xs glow-orange"
          >
            {saving ? 'Saving...' : 'Save Avatar ⚡'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   PROFILE PAGE
════════════════════════════════════════════════ */
export default function Profile() {
  const { username: routeUsername } = useParams()
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth()
  const { streak: myStreak, history: myHistory } = useStreak()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState(null)
  const [matches, setMatches]         = useState([])
  const [eloHistory, setEloHistory]   = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newHandle, setNewHandle]             = useState('')
  const [handleErr, setHandleErr]             = useState('')
  const [savingHandle, setSavingHandle]       = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const isOwnProfileRoute = !routeUsername
  const isMe = isOwnProfileRoute || (user?.username && routeUsername?.toLowerCase() === user.username.toLowerCase())

  // Redirect only if visiting the private '/profile' route without being logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated && isOwnProfileRoute) {
      navigate('/?auth=login')
    }
  }, [authLoading, isAuthenticated, isOwnProfileRoute, navigate])

  // Fetch all profile data whenever route or auth changes
  useEffect(() => {
    let unmounted = false

    async function loadData() {
      // If visiting /profile, wait for auth to finish loading
      if (isOwnProfileRoute) {
        if (authLoading) return
        if (!isAuthenticated) {
          setDataLoading(false)
          return
        }
      }

      setDataLoading(true)
      setNotFound(false)

      try {
        const [uRes, histRes, eloRes] = await Promise.all([
          routeUsername
            ? api.get(`/api/users/${encodeURIComponent(routeUsername)}/profile`)
            : api.get('/api/users/me'),
          routeUsername
            ? api.get(`/api/users/${encodeURIComponent(routeUsername)}/history`).catch(() => ({ data: [] }))
            : api.get('/api/users/me/history').catch(() => ({ data: [] })),
          routeUsername
            ? api.get(`/api/users/${encodeURIComponent(routeUsername)}/elo-history`).catch(() => ({ data: [] }))
            : api.get('/api/users/me/elo-history').catch(() => ({ data: [] })),
        ])

        if (unmounted) return

        if (!uRes?.data) {
          setNotFound(true)
          return
        }

        setProfileUser(uRes.data)
        if (isMe && uRes.data) refreshUser(uRes.data)
        setMatches(histRes?.data || [])
        setEloHistory(eloRes?.data || [])
      } catch (err) {
        if (unmounted) return
        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          console.error('[Profile API Error]', err)
        }
      } finally {
        if (!unmounted) setDataLoading(false)
      }
    }

    loadData()
    return () => { unmounted = true }
  }, [routeUsername, isOwnProfileRoute, isAuthenticated, authLoading])

  if ((authLoading && isOwnProfileRoute) || dataLoading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <p className="font-mono text-sm animate-pulse" style={{ color: '#4b5563' }}>loading profile...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-8 text-center">
      <p className="font-mono text-4xl mb-3">🔍</p>
      <h2 className="font-display font-black text-2xl mb-2 text-[#dde1ea]">Player Not Found</h2>
      <p className="font-mono text-sm text-[#4b5563] mb-6">No warrior exists with handle "@{routeUsername}"</p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/lobby')} className="btn-primary py-2 px-5 text-xs">
          ← Back to Lobby
        </button>
        <button onClick={() => navigate('/leaderboard')} className="btn-secondary py-2 px-5 text-xs">
          View Leaderboard
        </button>
      </div>
    </div>
  )

  const activeUser = profileUser || (isMe ? user : null)
  if (!activeUser) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <p className="font-mono text-sm animate-pulse" style={{ color: '#4b5563' }}>loading profile...</p>
    </div>
  )
  const elo    = activeUser?.elo_rating ?? 1200
  const wins   = activeUser?.wins   ?? 0
  const losses = activeUser?.losses ?? 0
  const total  = wins + losses
  const wr     = total > 0 ? Math.round((wins / total) * 100) : 0

  // Dynamic Streak Calculation from real match & Elo activity history
  const activeDates = new Set()
  if (isMe && myHistory instanceof Set) {
    myHistory.forEach(d => activeDates.add(d))
  }
  matches.forEach(m => {
    const dt = m.ended_at || m.started_at || m.date
    if (dt) {
      try { activeDates.add(new Date(dt).toISOString().slice(0, 10)) } catch {}
    }
  })
  eloHistory.forEach(e => {
    if (e.date) {
      try { activeDates.add(new Date(e.date).toISOString().slice(0, 10)) } catch {}
    }
  })

  function getCalculatedStreak() {
    if (activeDates.size === 0) return (wins + losses > 0 ? 1 : 0)
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    let checkDate = today
    if (!activeDates.has(todayStr)) {
      if (activeDates.has(yesterdayStr)) {
        checkDate = yesterday
      } else {
        const sorted = Array.from(activeDates).sort().reverse()
        if (sorted.length > 0) {
          checkDate = new Date(sorted[0])
        } else {
          return 1
        }
      }
    }

    let count = 0
    let curr = new Date(checkDate)
    for (let i = 0; i < 30; i++) {
      const dStr = curr.toISOString().slice(0, 10)
      if (activeDates.has(dStr)) {
        count++
        curr.setDate(curr.getDate() - 1)
      } else {
        break
      }
    }
    return Math.max(1, count)
  }

  const computedStreak = getCalculatedStreak()
  const streak = isMe ? Math.max(myStreak || 0, computedStreak) : computedStreak

  // Topic distribution from actual match history
  const topicFreq = matches.reduce((acc, m) => {
    if (m.topic) acc[m.topic] = (acc[m.topic] || 0) + 1
    return acc
  }, {})
  const favTopic = Object.entries(topicFreq).sort((a,b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Construct chart points from real Elo history or single baseline.
  // Always force the last point to be the ACTUAL current elo so chart & hero match.
  const rawChartData = eloHistory.length > 0
    ? eloHistory.map(e => ({
        date: e.date,
        rating: e.rating,
        delta: e.delta,
        topic: e.topic,
        difficulty: e.difficulty,
        opponent: e.opponent,
      }))
    : [
        { date: activeUser?.created_at ? new Date(activeUser.created_at).toISOString().slice(0,10) : 'Start', rating: 1200, delta: 0, topic: 'Initial' },
      ]

  // Patch last point to match actual current elo (fixes drift from fallback computation)
  const chartData = rawChartData.length > 0
    ? [
        ...rawChartData.slice(0, -1),
        { ...rawChartData[rawChartData.length - 1], rating: elo },
      ]
    : [{ date: new Date().toISOString().slice(0,10), rating: elo, delta: 0, topic: 'Current' }]

  const peakElo   = eloHistory.length > 0 ? Math.max(...eloHistory.map(e => e.rating), elo) : elo
  const startElo  = eloHistory[0]?.rating ?? 1200
  const netChange = elo - startElo

  async function handleSaveUsername(e) {
    e.preventDefault()
    if (!newHandle || !/^[a-zA-Z0-9_]{3,30}$/.test(newHandle.trim())) {
      setHandleErr('Username must be 3–30 characters (letters, numbers, underscore)')
      return
    }
    setSavingHandle(true)
    setHandleErr('')
    try {
      const { data } = await api.patch('/api/users/me/username', { username: newHandle.trim().toLowerCase() })
      if (data.token) {
        localStorage.setItem('aa_token', data.token)
        localStorage.setItem('aa_user', JSON.stringify(data.user))
        refreshUser(data.user)
        setProfileUser(data.user)
      }
      setEditingUsername(false)
    } catch (err) {
      setHandleErr(err.response?.data?.message || err.message || 'Failed to update username')
    } finally {
      setSavingHandle(false)
    }
  }

  async function handleSaveAvatar({ avatar_seed, avatar_style }) {
    const { data } = await api.patch('/api/users/me/avatar', { avatar_seed, avatar_style })
    if (data?.user) {
      localStorage.setItem('aa_user', JSON.stringify(data.user))
      refreshUser(data.user)
      setProfileUser(data.user)
    }
    return data
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">

      {/* ── PROFILE HERO ──────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">

          {/* Navigation backlink if viewing friend */}
          {!isMe && (
            <div className="mb-4">
              <button
                onClick={() => navigate(-1)}
                className="font-mono text-xs text-[#6b7280] hover:text-[#f97316] transition-colors flex items-center gap-1.5"
              >
                ← Back
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">

            {/* Avatar with Customizer Button */}
            <div className="relative group shrink-0">
              <UserAvatar
                username={activeUser?.username}
                seed={activeUser?.avatar_seed}
                style={activeUser?.avatar_style}
                size={88}
                isMe={isMe}
              />
              {isMe && (
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-[#0d0f17] border border-[#f97316] text-[10px] font-mono font-bold text-[#f97316] hover:bg-[#f97316] hover:text-[#07080c] transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  title="Customize your avatar"
                >
                  <span>🎨</span> Change
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                {/* Show inline edit form only when own username not yet permanently set */}
                {isMe && !activeUser?.is_username_set && editingUsername ? (
                  <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-[#f97316]">@</span>
                      <input
                        type="text"
                        autoFocus
                        maxLength={30}
                        value={newHandle}
                        onChange={e => setNewHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className="bg-[#0d0f17] border border-[#f97316] rounded px-6 py-1 font-mono text-sm text-[#dde1ea] outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingHandle}
                      className="px-3 py-1 bg-[#f97316] text-[#07080c] text-xs font-mono font-bold rounded hover:bg-[#ea6c0a]"
                    >
                      {savingHandle ? '...' : 'Lock Handle'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingUsername(false); setHandleErr('') }}
                      className="px-3 py-1 bg-[#1e2130] text-[#9ca3af] text-xs font-mono rounded hover:text-white"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-black text-2xl" style={{ color: '#dde1ea' }}>
                      {activeUser?.username}
                    </h1>
                    {isMe ? (
                      !activeUser?.is_username_set ? (
                        <button
                          onClick={() => { setNewHandle(activeUser?.username || ''); setEditingUsername(true); setHandleErr('') }}
                          className="text-xs font-mono text-[#f97316] border border-[#f97316]/40 px-2 py-0.5 rounded hover:bg-[#f97316]/10 transition-colors"
                          title="Set your permanent handle"
                        >
                          ✏️ Set Handle
                        </button>
                      ) : (
                        <span
                          className="text-[10px] font-mono text-[#4b5563] flex items-center gap-1"
                          title="Username is permanently locked"
                        >
                          🔒 locked
                        </span>
                      )
                    ) : (
                      <span className="font-mono text-[10px] px-2 py-0.5" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 3 }}>
                        rank #{activeUser?.rank ?? '—'}
                      </span>
                    )}
                  </div>
                )}

                {/* Rank badge — uses the same getRankTier as the chart */}
                {(() => {
                  const t = getRankTier(elo)
                  return (
                    <span
                      className="font-mono text-[11px] px-2 py-0.5 font-bold uppercase"
                      style={{
                        background: `${t.bg}`,
                        color: t.text,
                        border: `1px solid ${t.border}`,
                        borderRadius: 3,
                      }}
                    >
                      {t.name}
                    </span>
                  )
                })()}
                <span className="font-mono text-[11px]" style={{ color: '#374151' }}>
                  joined {new Date(activeUser?.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              {handleErr && <p className="font-mono text-xs text-[#f43f5e] mb-1">{handleErr}</p>}
              {/* Big Elo number — colored with rank tier */}
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-5xl" style={{ color: getRankTier(elo).text }}>{elo}</span>
                <span className="font-mono text-sm" style={{ color: '#4b5563' }}>elo</span>
                <span className="font-mono text-sm font-bold" style={{ color: netChange >= 0 ? '#10b981' : '#f43f5e' }}>
                  {netChange >= 0 ? `+${netChange}` : netChange} total
                </span>
              </div>
            </div>

            {/* Streak pill */}
            <div className="flex items-center gap-3 px-5 py-3"
                 style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4 }}>
              <span className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✦'}</span>
              <div>
                <p className="font-display font-black text-2xl leading-none" style={{ color: '#f97316' }}>{streak}</p>
                <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>day streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* Stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="rating"    value={elo}                    sub={`peak ${peakElo}`}   color={getRankTier(elo).text} subColor="#64748b" />
          <StatCard label="wins"      value={wins}                   sub={`${wr}% win rate`}    color="#22d3ee" subColor="rgba(34,211,238,0.7)" />
          <StatCard label="losses"    value={losses}                 sub={`${total} total`}     color="#f43f5e" subColor="rgba(244,63,94,0.7)" />
          <StatCard label="streak"    value={`${streak}d`}           sub="active days"          color="#f97316" subColor="rgba(249,115,22,0.7)" />
          <StatCard label="matches"   value={total}                  sub="battles"              color="#a78bfa" subColor="rgba(167,139,250,0.7)" />
          <StatCard label="fav topic" value={favTopic.split('-')[0]} sub={favTopic}             color="#fbbf24" subColor="rgba(251,191,36,0.7)" />
        </div>

        {/* Elo chart */}
        <div style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4, overflow: 'hidden' }}>
          <div className="flex items-center justify-between px-5 py-3"
               style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                // rating history
              </p>
              <p className="font-mono text-[11px] mt-0.5" style={{ color: '#374151' }}>real elo progression</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>peak</p>
                <p className="font-mono text-sm font-bold" style={{ color: getRankTier(peakElo).text }}>{peakElo}</p>
              </div>
              <div>
                <p className="font-mono text-[10px]" style={{ color: '#4b5563' }}>current</p>
                <p className="font-mono text-sm font-bold" style={{ color: getRankTier(elo).text }}>{elo}</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-5">
            <EloChart data={chartData} username={activeUser?.username} />
          </div>
        </div>

        {/* Bottom grid — streak calendar + match history */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">

          {/* Match history */}
          <div style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4, overflow: 'hidden' }}>
            <div className="px-4 py-3 flex items-center justify-between"
                 style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                // match history
              </p>
              <span className="font-mono text-[10px]" style={{ color: '#374151' }}>{matches.length} matches</span>
            </div>

            {dataLoading ? (
              <div className="p-8 text-center">
                <p className="font-mono text-xs" style={{ color: '#4b5563' }}>loading match history...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="font-mono text-sm" style={{ color: '#6b7280' }}>No match history yet.</p>
                <button
                  onClick={() => navigate('/lobby')}
                  className="font-mono text-xs px-4 py-2 font-bold transition-all"
                  style={{ background: '#f97316', color: '#07080c', borderRadius: 4 }}
                >
                  find_match() →
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid #1e2130' }}>
                  {['result','opponent / topic','Δelo','date'].map(h => (
                    <span key={h} className="font-mono text-[9px] uppercase" style={{ color: '#374151',
                      flex: h==='opponent / topic' ? 1 : 0, width: h==='result' ? 40 : h==='Δelo' ? 48 : 70,
                      textAlign: h==='date' || h==='Δelo' ? 'right' : undefined }}>
                      {h}
                    </span>
                  ))}
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {matches.map(m => <MatchRow key={m.id} m={m} />)}
                </div>
              </>
            )}
          </div>

          {/* Activity / Streak calendar */}
          <div style={{ background: '#090b13', border: '1px solid #1e2130', borderRadius: 4, overflow: 'hidden' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>
              <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                // activity — last 30 days
              </p>
            </div>
            <div className="px-4 py-5 space-y-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✦'}</span>
                <span className="font-display font-black text-5xl" style={{ color: '#f97316' }}>{streak}</span>
                <span className="font-mono text-sm" style={{ color: '#4b5563' }}>day streak</span>
              </div>

              <StreakCalendar history={activeDates} matches={matches} />

              <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid #1e2130' }}>
                {[
                  { col: '#f97316', lbl: 'today' },
                  { col: 'rgba(249,115,22,0.5)', lbl: 'active' },
                  { col: '#0d0f17', lbl: 'missed' },
                ].map(l => (
                  <div key={l.lbl} className="flex items-center gap-1.5">
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.col, border: '1px solid rgba(249,115,22,0.2)', flexShrink: 0 }}/>
                    <span className="font-mono text-[9px]" style={{ color: '#374151' }}>{l.lbl}</span>
                  </div>
                ))}
              </div>

              {/* Topic breakdown from real matches */}
              <div style={{ borderTop: '1px solid #1e2130', paddingTop: '1rem' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: '#4b5563', letterSpacing: '0.12em' }}>
                  // topic breakdown
                </p>
                {Object.keys(topicFreq).length === 0 ? (
                  <p className="font-mono text-[10px]" style={{ color: '#374151' }}>no matches played yet</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(topicFreq)
                      .sort((a,b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([topic, count]) => (
                        <div key={topic}>
                          <div className="flex justify-between mb-1">
                            <span className="font-mono text-[10px]" style={{ color: '#9ca3af' }}>{topic}</span>
                            <span className="font-mono text-[10px]" style={{ color: '#4b5563' }}>{count}</span>
                          </div>
                          <div style={{ height: 3, background: '#0d0f17', borderRadius: 2 }}>
                            <div style={{ height: 3, width: `${(count / matches.length) * 100}%`, background: '#f97316', borderRadius: 2, transition: 'width 0.5s ease' }}/>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {isMe && (
        <AvatarSelectorModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentSeed={activeUser?.avatar_seed}
          currentStyle={activeUser?.avatar_style}
          username={activeUser?.username}
          onSave={handleSaveAvatar}
        />
      )}
    </div>
  )
}
