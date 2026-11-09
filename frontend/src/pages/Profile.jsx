import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStreak } from '../hooks/useStreak'
import api from '../utils/api'
import { UserAvatar } from '../utils/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Swords, Shield, Target, Flame, Zap, Camera, Pencil,
  Lock, TrendingUp, TrendingDown, Calendar, Clock, CheckCircle,
  XCircle, Minus, ChevronRight, User, UserCheck, Bot, Gamepad2,
  Palette, Dices, Sparkles, Check, X, Award, AlertCircle
} from 'lucide-react'
import {
  HudPanel, HudButton, GhostButton, RankBadge, StatBadge, SectionHeader,
  PageWrapper, Skeleton, EmptyState, Tooltip, getArenaTier, ARENA_TIERS,
  AnimatedCounter, DiffChip, VerdictChip
} from '../components/ui'
import ProfileV2View from './Profile/ProfileV2View'
import { usePremium } from '../hooks/usePremium'
import { usePremiumBadges } from '../hooks/usePremiumBadges'
import PremiumBadge from '../components/PremiumBadge'
import '../styles/profile-v2.css'

/* ════════════════════════════════════════════════
   TIER PROGRESS COMPUTATION
   Computes progress towards the next rank tier
════════════════════════════════════════════════ */
function getTierProgress(rating = 1200) {
  const r = Number(rating) || 1200
  const tiers = [
    { name: 'Novice', min: 0, max: 1199, nextMin: 1200, nextName: 'Apprentice' },
    { name: 'Apprentice', min: 1200, max: 1399, nextMin: 1400, nextName: 'Specialist' },
    { name: 'Specialist', min: 1400, max: 1599, nextMin: 1600, nextName: 'Expert' },
    { name: 'Expert', min: 1600, max: 1799, nextMin: 1800, nextName: 'Candidate Master' },
    { name: 'Candidate Master', min: 1800, max: 1999, nextMin: 2000, nextName: 'Grandmaster' },
    { name: 'Grandmaster', min: 2000, max: 9999, nextMin: null, nextName: null },
  ]
  const current = tiers.find(t => r >= t.min && r <= t.max) || tiers[0]
  if (!current.nextMin) {
    return { pct: 100, needed: 0, nextName: 'MAX TIER', currentName: current.name }
  }
  const range = current.nextMin - current.min
  const elapsed = r - current.min
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / range) * 100)))
  const needed = current.nextMin - r
  return { pct, needed, nextName: current.nextName, currentName: current.name }
}

/* ════════════════════════════════════════════════
   SVG ELO CHART WITH TIER ZONES & HUD TOOLTIP
════════════════════════════════════════════════ */
const CHART_W = 760, CHART_H = 260
const CHART_PAD = { top: 30, right: 90, bottom: 35, left: 45 }

function EloChart({ data = [], username = 'Coder' }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) return null

  const innerW = CHART_W - CHART_PAD.left - CHART_PAD.right
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom

  const ratings = data.map(d => Number(d.rating) || 1200)
  const minRaw = Math.min(...ratings)
  const maxRaw = Math.max(...ratings)

  // Step size: 50 or 100 for clean round numbers with uniform gaps
  const rawSpread = maxRaw - minRaw
  const stepR = rawSpread > 350 ? 100 : 50
  const minR = Math.max(0, Math.floor((minRaw - 25) / stepR) * stepR)
  const maxR = Math.max(minR + stepR * 3, Math.ceil((maxRaw + 25) / stepR) * stepR)
  const rangeR = maxR - minR || 1

  // Generate clean Y-axis ticks at uniform stepR intervals
  const yTicks = []
  for (let r = minR; r <= maxR; r += stepR) {
    yTicks.push(r)
  }

  const xScale = i => data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW
  const yScale = r => innerH - ((r - minR) / rangeR) * innerH

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
    if (points.length === 1) return `M 0 ${points[0][1]} L ${innerW} ${points[0][1]}`
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
  const areaPath = linePath + ` L ${pts[pts.length - 1][0]} ${innerH} L ${pts[0][0]} ${innerH} Z`

  // Limit X-axis label ticks (max 5 desktop)
  const maxTicks = 5
  const step = Math.max(1, Math.floor(data.length / maxTicks))
  const xLabels = data
    .map((d, i) => {
      let label
      if (d.date && d.date !== 'Start') {
        const dt = new Date(d.date)
        label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        label = `#${i + 1}`
      }
      return { i, label, x: xScale(i) }
    })
    .filter((_, i) => i % step === 0 || i === data.length - 1)

  return (
    <div className="relative w-full overflow-x-auto scrollbar-none">
      <div className="min-w-[640px]">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <clipPath id="arenaClip">
              <rect x="0" y="0" width={innerW} height={innerH} />
            </clipPath>
            <linearGradient id="arenaAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-blue)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--c-blue)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="arenaLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--c-blue)" />
              <stop offset="100%" stopColor="var(--c-gold)" />
            </linearGradient>
          </defs>

          <g transform={`translate(${CHART_PAD.left},${CHART_PAD.top})`}>

            {/* 1. Horizontal Tier Zones */}
            {ARENA_TIERS.map((tier) => {
              const yTop = Math.max(0, Math.min(innerH, yScale(Math.min(maxR, tier.max + 1))))
              const yBottom = Math.max(0, Math.min(innerH, yScale(Math.max(minR, tier.min))))
              const height = yBottom - yTop
              if (height <= 0) return null

              return (
                <g key={tier.name}>
                  <rect
                    x={0}
                    y={yTop}
                    width={innerW}
                    height={height}
                    fill={tier.bg}
                    opacity={0.6}
                  />
                  {/* Right Edge Tier Label */}
                  <text
                    x={innerW + 8}
                    y={yTop + height / 2 + 3.5}
                    fontSize={9}
                    fill={tier.col}
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                    className="uppercase tracking-wider"
                  >
                    {tier.name}
                  </text>
                </g>
              )
            })}

            {/* 2. Horizontal Grid Reference Lines at uniform round intervals */}
            {yTicks.map((r) => {
              const y = yScale(r)
              const isThreshold = [1200, 1400, 1600, 1800].includes(r)
              const tier = getArenaTier(r)
              return (
                <g key={r}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerW}
                    y2={y}
                    stroke={isThreshold ? tier.col : 'var(--c-border)'}
                    strokeWidth={isThreshold ? 1.5 : 1}
                    strokeDasharray={isThreshold ? '3 3' : '4 4'}
                    strokeOpacity={isThreshold ? 0.75 : 0.35}
                  />
                  <text
                    x={-8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize={isThreshold ? 10 : 9}
                    fill={isThreshold ? tier.col : 'var(--c-text-mute)'}
                    fontWeight={isThreshold ? 'bold' : 'normal'}
                    fontFamily="var(--font-mono)"
                  >
                    {r}
                  </text>
                </g>
              )
            })}

            {/* 3. X-Axis Ticks & Labels */}
            {xLabels.map((lbl) => (
              <g key={lbl.i}>
                <line
                  x1={lbl.x}
                  y1={0}
                  x2={lbl.x}
                  y2={innerH}
                  stroke="var(--c-border)"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  strokeOpacity={0.3}
                />
                <text
                  x={lbl.x}
                  y={innerH + 18}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--c-text-mute)"
                  fontFamily="var(--font-mono)"
                >
                  {lbl.label}
                </text>
              </g>
            ))}

            {/* 4. Area Gradient & Tier-Colored Curve Segments */}
            <path d={areaPath} fill="url(#arenaAreaGrad)" clipPath="url(#arenaClip)" />

            {/* Draw individual curve segments dynamically colored by point rank tier */}
            {pts.length === 1 ? (
              <line x1={0} y1={pts[0][1]} x2={innerW} y2={pts[0][1]} stroke={getArenaTier(data[0]?.rating || 1200).col} strokeWidth={2.5} clipPath="url(#arenaClip)" />
            ) : (
              pts.slice(1).map(([x, y], idx) => {
                const i = idx + 1
                const [prevX, prevY] = pts[i - 1]
                const pointRating = Number(data[i]?.rating) || 1200
                const tier = getArenaTier(pointRating)
                const cx = (prevX + x) / 2
                const d = `M ${prevX} ${prevY} C ${cx} ${prevY}, ${cx} ${y}, ${x} ${y}`
                return (
                  <path
                    key={`seg-${i}`}
                    d={d}
                    fill="none"
                    stroke={tier.col}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    clipPath="url(#arenaClip)"
                  />
                )
              })
            )}

            {/* 5. Data Points & Peak Marker */}
            {pts.map(([x, y], i) => {
              const isPeak = i === peakIdx && ratings.length > 1
              const isLast = i === pts.length - 1
              const pointRating = Number(data[i]?.rating) || 1200
              const tier = getArenaTier(pointRating)

              return (
                <g key={i}>
                  {/* Circle Marker — colored strictly by rank tier */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isPeak ? 5.5 : isLast ? 4.5 : 3.5}
                    fill={isPeak ? 'var(--c-gold)' : tier.col}
                    stroke="var(--c-panel)"
                    strokeWidth={1.5}
                  />

                  {/* Peak Marker Badge */}
                  {isPeak && (
                    <g transform={`translate(${x},${y - 14})`}>
                      <circle cx={0} cy={0} r={7} fill="var(--c-gold)" />
                      <path d="M-3 2 L0 -3 L3 2 L2 0 L0 1 L-2 0 Z" fill="var(--c-void)" />
                    </g>
                  )}

                  {/* Interactive Target Area */}
                  <rect
                    x={x - 14}
                    y={0}
                    width={28}
                    height={innerH}
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
                  y2={innerH}
                  stroke="var(--c-gold)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={hovered.x}
                  cy={hovered.y}
                  r={6}
                  fill="var(--c-gold)"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <foreignObject
                  x={hovered.x > innerW - 180 ? hovered.x - 185 : hovered.x + 12}
                  y={Math.max(0, Math.min(innerH - 85, hovered.y - 40))}
                  width={175}
                  height={85}
                  className="pointer-events-none"
                >
                  <div
                    className="p-2.5 rounded border shadow-xl backdrop-blur-md font-mono text-xs space-y-1"
                    style={{ background: 'var(--c-panel)', borderColor: 'var(--c-border2)' }}
                  >
                    <div className="flex items-center justify-between font-bold" style={{ color: 'var(--c-gold)' }}>
                      <span>{hovered.rating} ELO</span>
                      {hovered.delta != null && (
                        <span style={{ color: hovered.delta >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>
                          {hovered.delta >= 0 ? `+${hovered.delta}` : hovered.delta}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] truncate" style={{ color: 'var(--c-text)' }}>
                      {hovered.opponent ? `vs @${hovered.opponent}` : `Match #${hovered.index + 1}`}
                    </p>
                    <div className="flex items-center justify-between text-[9px]" style={{ color: 'var(--c-text-mute)' }}>
                      <span>{hovered.topic || '1v1 Duel'}</span>
                      <span>
                        {hovered.date && hovered.date !== 'Start'
                          ? new Date(hovered.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                </foreignObject>
              </>
            )}

          </g>
        </svg>
      </div>

      {/* Explicit Rank Tier Ranges Legend Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 mt-3 border-t border-[color:var(--c-border)] font-mono text-[10px]">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {ARENA_TIERS.map((tier) => (
            <div key={tier.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: tier.col }} />
              <span className="font-bold text-[color:var(--c-text)] uppercase">{tier.name}:</span>
              <span className="text-[color:var(--c-text-dim)] font-semibold">
                {tier.min}–{tier.max >= 9999 ? '1800+' : tier.max} ELO
              </span>
            </div>
          ))}
        </div>
        <div className="text-[color:var(--c-text-mute)] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F5B942]" />
          <span>Peak & Current Nodes</span>
        </div>
      </div>
    </div>
  )
}

function toLocalDateKey(dt) {
  if (!dt) return null
  const d = new Date(dt)
  if (isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ════════════════════════════════════════════════
   HEATMAP CALENDAR (30 DAYS)
════════════════════════════════════════════════ */
function StreakCalendar({ history, matches = [] }) {
  const today = toLocalDateKey(new Date())
  const [hoveredCell, setHoveredCell] = useState(null)

  // Map of date -> match count
  const dateCounts = useMemo(() => {
    const map = new Map()
    if (history instanceof Set) {
      history.forEach(d => {
        const k = typeof d === 'string' && d.length === 10 ? d : toLocalDateKey(d)
        if (k) map.set(k, 1)
      })
    } else if (Array.isArray(history)) {
      history.forEach(d => {
        const k = typeof d === 'string' && d.length === 10 ? d : toLocalDateKey(d)
        if (k) map.set(k, (map.get(k) || 0) + 1)
      })
    }
    if (Array.isArray(matches)) {
      matches.forEach(m => {
        const dt = m.ended_at || m.started_at || m.date
        const k = toLocalDateKey(dt)
        if (k) {
          map.set(k, (map.get(k) || 0) + 1)
        }
      })
    }
    return map
  }, [history, matches])

  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = toLocalDateKey(d)
      const count = dateCounts.get(dateStr) || 0
      return {
        date: dateStr,
        count,
        isToday: dateStr === today,
        formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })
  }, [dateCounts, today])

  return (
    <div className="relative">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map(({ date, count, isToday, formatted }) => {
          let bg = 'var(--c-panel)'
          let border = 'var(--c-border)'
          if (count === 1) {
            bg = 'rgba(56, 189, 248, 0.25)'
            border = 'rgba(56, 189, 248, 0.5)'
          } else if (count >= 2) {
            bg = 'rgba(245, 185, 66, 0.35)'
            border = 'rgba(245, 185, 66, 0.6)'
          }

          return (
            <div
              key={date}
              className="aspect-square relative cursor-pointer transition-all duration-150 hover:scale-110"
              style={{
                borderRadius: 4,
                background: bg,
                border: `1px solid ${isToday ? 'var(--c-red)' : border}`,
                boxShadow: isToday ? '0 0 10px var(--c-red-glow)' : 'none',
              }}
              onMouseEnter={() => setHoveredCell({ date: formatted, count })}
              onMouseLeave={() => setHoveredCell(null)}
            />
          )
        })}
      </div>

      {/* Heatmap Tooltip */}
      {hoveredCell && (
        <div
          className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[10px] font-mono whitespace-nowrap shadow-lg pointer-events-none z-20 flex items-center gap-1.5"
          style={{ color: 'var(--c-text)' }}
        >
          <Calendar size={11} className="text-[#38BDF8]" />
          <span>{hoveredCell.date}:</span>
          <span className="font-bold text-[color:var(--c-gold)]">
            {hoveredCell.count === 0 ? 'No battles' : `${hoveredCell.count} duel${hoveredCell.count > 1 ? 's' : ''}`}
          </span>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   MATCH HISTORY ROW
════════════════════════════════════════════════ */
function MatchRow({ m }) {
  const result = (m.result || '').toUpperCase()
  const isWin = result === 'WIN' || result === 'VICTORY'
  const isLoss = result === 'LOSS' || result === 'DEFEAT'
  const isDraw = !isWin && !isLoss

  const deltaStr = m.elo_delta ? (m.elo_delta > 0 ? `+${m.elo_delta}` : `${m.elo_delta}`) : '0'
  const dateStr = m.ended_at ? new Date(m.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  const topicDisplay = m.topic
    ? m.topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Custom Duel'

  const diffLower = (m.difficulty || 'medium').toLowerCase()

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-[color:var(--c-border)]/60 transition-colors hover:bg-[color:var(--c-panel2)]/50 relative"
      style={{
        borderLeft: `3px solid ${isWin ? 'var(--c-green)' : isLoss ? 'var(--c-red)' : 'var(--c-gold)'}`,
      }}
    >
      <div className="flex items-center justify-between sm:w-auto">
        {/* Result Chip */}
        <div className="w-20 sm:w-24 shrink-0">
          <span
            className="inline-flex items-center gap-1 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded"
            style={{
              background: isWin ? 'rgba(16,185,129,0.12)' : isLoss ? 'rgba(225,29,72,0.12)' : 'rgba(245,185,66,0.12)',
              color: isWin ? 'var(--c-green)' : isLoss ? 'var(--c-red)' : 'var(--c-gold)',
              border: `1px solid ${isWin ? 'rgba(16,185,129,0.3)' : isLoss ? 'rgba(225,29,72,0.3)' : 'rgba(245,185,66,0.3)'}`,
            }}
          >
            {isWin ? <CheckCircle size={10} /> : isLoss ? <XCircle size={10} /> : <Minus size={10} />}
            <span>{isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'}</span>
          </span>
        </div>

        {/* Date (Mobile Only) */}
        <div className="sm:hidden text-right font-mono text-[9px] text-[color:var(--c-text-mute)]">
          {dateStr}
        </div>
      </div>

      <div className="flex items-center justify-between sm:flex-1 sm:min-w-0">
        {/* Opponent Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <UserAvatar username={m.opponent || 'Opponent'} size={20} className="sm:w-6 sm:h-6" />
          <span className="font-mono text-xs font-bold text-[color:var(--c-text)] truncate max-w-[100px] sm:max-w-[120px]">
            @{m.opponent || 'Warrior'}
          </span>
        </div>

        {/* Topic & Difficulty Chips (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0">
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[color:var(--c-panel)] border border-[color:var(--c-border)] text-[color:var(--c-text-dim)] truncate">
            {topicDisplay}
          </span>
          <DiffChip diff={diffLower} />
        </div>

        {/* Elo Change */}
        <div className="w-14 sm:w-16 shrink-0 text-right font-mono text-xs font-bold">
          <span style={{ color: m.elo_delta > 0 ? 'var(--c-green)' : m.elo_delta < 0 ? 'var(--c-red)' : 'var(--c-text-mute)' }}>
            {deltaStr}
          </span>
        </div>

        {/* Date (Desktop) */}
        <div className="hidden sm:block w-16 shrink-0 text-right font-mono text-[10px] text-[color:var(--c-text-mute)]">
          {dateStr}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   AVATAR SELECTOR MODAL
════════════════════════════════════════════════ */
function AvatarSelectorModal({ isOpen, onClose, currentSeed, currentStyle, username, onSave }) {
  const [selectedStyle, setSelectedStyle] = useState(currentStyle || 'adventurer')
  const [selectedSeed, setSelectedSeed] = useState(currentSeed || username || 'coder')
  const [customInput, setCustomInput] = useState('')
  const [saving, setSaving] = useState(false)

  const styles = [
    { id: 'adventurer', label: 'Adventurer', icon: User },
    { id: 'lorelei', label: 'Lorelei', icon: UserCheck },
    { id: 'bottts', label: 'Cyber Bot', icon: Bot },
    { id: 'pixel-art', label: 'Pixel Gamer', icon: Gamepad2 },
    { id: 'notionists', label: 'Tech Sketch', icon: Palette },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5, 7, 15, 0.88)', backdropFilter: 'blur(8px)' }}>
      <HudPanel className="w-full max-w-lg p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--c-border)] pb-3">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#38BDF8]" />
            <h3 className="font-display font-bold text-lg text-[color:var(--c-text)] uppercase tracking-wide">
              Customize Avatar
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[color:var(--c-text-mute)] hover:text-red-400 p-1">
            <X size={16} />
          </button>
        </div>

        {/* Preview Frame */}
        <div className="flex items-center justify-center gap-6 p-4 rounded bg-[color:var(--c-void)] border border-[color:var(--c-border)]">
          <div className="p-1 rounded-xl border-2 border-[#38BDF8] shadow-lg shadow-[#38BDF8]/20">
            <UserAvatar username={username} seed={selectedSeed} style={selectedStyle} size={72} isMe={true} />
          </div>
          <div className="space-y-1 font-mono text-xs">
            <p className="font-bold text-[color:var(--c-text)]">@{username}</p>
            <p className="text-[#38BDF8]">Style: {selectedStyle}</p>
            <p className="text-[10px] text-[color:var(--c-text-mute)] truncate max-w-[180px]">Seed: {selectedSeed}</p>
          </div>
        </div>

        {/* Style Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {styles.map(st => {
            const Icon = st.icon
            const active = selectedStyle === st.id
            return (
              <button
                key={st.id}
                onClick={() => { setSelectedStyle(st.id); setSelectedSeed(PRESETS[st.id]?.[0] || 'seed1') }}
                className={`px-3 py-1.5 rounded font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${active
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/50'
                    : 'bg-[color:var(--c-panel)] text-[color:var(--c-text-mute)] border border-[color:var(--c-border)] hover:border-slate-600'
                  }`}
              >
                <Icon size={12} />
                <span>{st.label}</span>
              </button>
            )
          })}
        </div>

        {/* Presets Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-[color:var(--c-text-mute)] uppercase tracking-wider">Curated Presets</span>
            <button
              onClick={handleRandom}
              className="text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <Dices size={12} />
              <span>Randomize</span>
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {(PRESETS[selectedStyle] || []).map((preset) => {
              const active = selectedSeed === preset
              return (
                <button
                  key={preset}
                  onClick={() => setSelectedSeed(preset)}
                  className={`p-1 rounded border transition-all flex items-center justify-center cursor-pointer ${active
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] scale-105 shadow-md shadow-[#38BDF8]/20'
                      : 'bg-[color:var(--c-panel)] border-[color:var(--c-border)] hover:border-slate-500'
                    }`}
                >
                  <UserAvatar username={username} seed={preset} style={selectedStyle} size={34} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleApplyCustom} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type custom seed name..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className="flex-1 bg-[color:var(--c-void)] border border-[color:var(--c-border)] rounded px-3 py-2 text-xs font-mono text-[color:var(--c-text)] outline-none focus:border-[#38BDF8]"
          />
          <GhostButton type="submit" style={{ padding: '6px 12px', fontSize: 11 }}>
            Apply
          </GhostButton>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[color:var(--c-border)]">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <HudButton type="button" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save Avatar'}
          </HudButton>
        </div>
      </HudPanel>
    </div>
  )
}

/* ════════════════════════════════════════════════
   PROFILE PAGE COMPONENT
════════════════════════════════════════════════ */
export default function Profile() {
  const { username: routeUsername } = useParams()
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth()
  const { streak: myStreak, history: myHistory } = useStreak(user?.id)
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const isLegacy = searchParams.get('ui') === 'legacy' || import.meta.env.VITE_PROFILE_UI === 'legacy'

  const [profileUser, setProfileUser] = useState(null)
  const [matches, setMatches] = useState([])
  const [eloHistory, setEloHistory] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newHandle, setNewHandle] = useState('')
  const [handleErr, setHandleErr] = useState('')
  const [savingHandle, setSavingHandle] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const isOwnProfileRoute = !routeUsername
  const isMe = isOwnProfileRoute || (user?.username && routeUsername?.toLowerCase() === user.username.toLowerCase())
  const { isPremium } = usePremium()
  const badges = usePremiumBadges(isMe ? [] : [routeUsername], isMe ? [] : [profileUser?.id])
  const hasBadge = isMe ? isPremium : Boolean(badges[routeUsername?.toLowerCase()] || badges[profileUser?.id])

  // Redirect if visiting private /profile when unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && isOwnProfileRoute) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isAuthenticated, isOwnProfileRoute, navigate])

  // Load profile data
  useEffect(() => {
    let unmounted = false

    async function loadData() {
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
          setNotFound(true)
        }
      } finally {
        if (!unmounted) setDataLoading(false)
      }
    }

    loadData()
    return () => { unmounted = true }
  }, [routeUsername, isOwnProfileRoute, isAuthenticated, authLoading])

  const activeUser = profileUser || (isMe ? user : null)

  const elo = activeUser?.elo_rating ?? 1200
  const wins = activeUser?.wins ?? 0
  const losses = activeUser?.losses ?? 0
  const total = wins + losses
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0

  // Tier progress calculation
  const tierProgress = getTierProgress(elo)
  const currentTier = getArenaTier(elo)

  // Dynamic Streak Calculation (based ONLY on actual played matches, NOT on login visits)
  const activeDates = new Set()
  matches.forEach(m => {
    const dt = m.ended_at || m.started_at || m.date
    if (dt) {
      const k = toLocalDateKey(dt)
      if (k) activeDates.add(k)
    }
  })
  eloHistory.forEach(e => {
    const dt = e.date || e.created_at
    if (dt) {
      const k = toLocalDateKey(dt)
      if (k) activeDates.add(k)
    }
  })

  function getCalculatedStreak() {
    if (activeDates.size === 0) return 0
    const today = new Date()
    const todayStr = toLocalDateKey(today)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = toLocalDateKey(yesterday)

    let checkDate = today
    if (!activeDates.has(todayStr)) {
      if (activeDates.has(yesterdayStr)) {
        checkDate = yesterday
      } else {
        return 0
      }
    }

    let count = 0
    let curr = new Date(checkDate)
    for (let i = 0; i < 365; i++) {
      const dStr = toLocalDateKey(curr)
      if (activeDates.has(dStr)) {
        count++
        curr.setDate(curr.getDate() - 1)
      } else {
        break
      }
    }
    return count
  }

  const computedStreak = getCalculatedStreak()
  const streak = computedStreak

  // Topic distribution across all played matches (using eloHistory which contains all matches)
  const topicFreq = useMemo(() => {
    const acc = {}
    const list = (eloHistory && eloHistory.length > 0) ? eloHistory : matches
    list.forEach(m => {
      if (m.topic) acc[m.topic] = (acc[m.topic] || 0) + 1
    })
    return acc
  }, [eloHistory, matches])

  const favTopicRaw = Object.entries(topicFreq).sort((a, b) => b[1] - a[1])[0]?.[0]
  const favTopicTitle = favTopicRaw
    ? favTopicRaw.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'None'
  const favTopicCount = favTopicRaw ? topicFreq[favTopicRaw] : 0

  // Chart Data preparation
  const rawChartData = eloHistory.length > 0
    ? eloHistory.map(e => ({
      date: e.date,
      rating: e.rating,
      delta: e.delta,
      topic: e.topic,
      difficulty: e.difficulty,
      opponent: e.opponent,
    }))
    : [{ date: activeUser?.created_at ? new Date(activeUser.created_at).toISOString().slice(0, 10) : 'Start', rating: 1200, delta: 0, topic: 'Initial' }]

  const chartData = rawChartData.length > 0
    ? [
      ...rawChartData.slice(0, -1),
      { ...rawChartData[rawChartData.length - 1], rating: elo },
    ]
    : [{ date: new Date().toISOString().slice(0, 10), rating: elo, delta: 0, topic: 'Current' }]

  const peakElo = eloHistory.length > 0 ? Math.max(...eloHistory.map(e => e.rating), elo) : elo
  const startElo = eloHistory[0]?.rating ?? 1200
  const netChange = elo - startElo

  async function handleSaveUsername(e) {
    e.preventDefault()
    if (!newHandle || !/^[a-zA-Z0-9_]{3,30}$/.test(newHandle.trim())) {
      setHandleErr('Handle must be 3–30 characters (letters, numbers, underscore)')
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
      setHandleErr(err.response?.data?.message || err.message || 'Failed to update handle')
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

  async function handleSaveProfile(profileData) {
    const { data } = await api.patch('/api/users/me/profile', profileData)
    if (data?.user) {
      localStorage.setItem('aa_user', JSON.stringify(data.user))
      refreshUser(data.user)
      setProfileUser(data.user)
    }
    return data
  }

  const joinDateStr = new Date(activeUser?.created_at ?? Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  const viewProps = {
    authLoading,
    dataLoading,
    isOwnProfileRoute,
    notFound,
    routeUsername,
    navigate,
    activeUser,
    isMe,
    elo,
    wins,
    losses,
    wr,
    total,
    streak,
    currentTier,
    tierProgress,
    joinDateStr,
    editingUsername,
    setEditingUsername,
    newHandle,
    setNewHandle,
    handleErr,
    setHandleErr,
    savingHandle,
    handleSaveUsername,
    showAvatarModal,
    setShowAvatarModal,
    handleSaveAvatar,
    handleSaveProfile,
    peakElo,
    startElo,
    netChange,
    favTopicTitle,
    favTopicCount,
    chartData,
    matches,
    activeDates,
    topicFreq,
    eloHistory,
  }

  if (isLegacy) {
    return <LegacyProfileView {...viewProps} />
  }

  return <ProfileV2View {...viewProps} />
}

/* ════════════════════════════════════════════════
   LEGACY PROFILE VIEW (RENDERED WHEN ?ui=legacy)
   Keeps old JSX completely intact and untouched.
════════════════════════════════════════════════ */
function LegacyProfileView({
  authLoading,
  dataLoading,
  isOwnProfileRoute,
  notFound,
  routeUsername,
  navigate,
  activeUser,
  isMe,
  elo,
  wins,
  losses,
  wr,
  total,
  streak,
  currentTier,
  tierProgress,
  joinDateStr,
  editingUsername,
  setEditingUsername,
  newHandle,
  setNewHandle,
  handleErr,
  setHandleErr,
  savingHandle,
  handleSaveUsername,
  showAvatarModal,
  setShowAvatarModal,
  handleSaveAvatar,
  peakElo,
  startElo,
  netChange,
  favTopicTitle,
  favTopicCount,
  chartData,
  matches,
  activeDates,
  topicFreq,
}) {
  if ((authLoading && isOwnProfileRoute) || dataLoading) {
    return (
      <PageWrapper heroGlow>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <Skeleton height={180} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={80} />)}
          </div>
          <Skeleton height={280} />
        </div>
      </PageWrapper>
    )
  }

  if (notFound) {
    return (
      <PageWrapper heroGlow>
        <div className="max-w-md mx-auto py-20 px-4 text-center">
          <EmptyState
            icon={Shield}
            title="Warrior Not Found"
            subtitle={`No arena competitor exists with handle "@${routeUsername}".`}
            action={
              <div className="flex gap-3 justify-center mt-4">
                <HudButton onClick={() => navigate('/lobby')}>
                  Go To Lobby
                </HudButton>
                <GhostButton onClick={() => navigate('/leaderboard')}>
                  View Leaderboard
                </GhostButton>
              </div>
            }
          />
        </div>
      </PageWrapper>
    )
  }

  if (!activeUser) return null

  return (
    <PageWrapper heroGlow>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── 1. DOSSIER BANNER ──────────────────────────────── */}
        <HudPanel glow glowColor={currentTier.glow} className="p-4 sm:p-7">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

            {/* Left: Avatar + User details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0">

              {/* Rank Avatar frame */}
              <div className="relative group shrink-0">
                <div
                  className="p-1 rounded-xl transition-all duration-300"
                  style={{ border: `2px solid ${currentTier.col}`, boxShadow: `0 0 20px ${currentTier.glow}`, background: 'var(--c-panel)' }}
                >
                  <UserAvatar
                    username={activeUser?.username}
                    seed={activeUser?.avatar_seed}
                    style={activeUser?.avatar_style}
                    elo={elo}
                    size={84}
                    isMe={isMe}
                  />
                </div>

                {isMe && (
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[color:var(--c-panel)] border border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#05070F] transition-all shadow-lg cursor-pointer"
                    title="Change Avatar"
                    aria-label="Change Avatar"
                  >
                    <Camera size={13} />
                  </button>
                )}
              </div>

              {/* Core Info */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {isMe && !activeUser?.is_username_set && editingUsername ? (
                    <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        maxLength={30}
                        value={newHandle}
                        onChange={e => setNewHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className="bg-[color:var(--c-void)] border border-[#38BDF8] rounded px-3 py-1 font-mono text-sm text-[color:var(--c-text)] outline-none"
                      />
                      <HudButton type="submit" disabled={savingHandle} style={{ padding: '4px 10px', fontSize: 11 }}>
                        {savingHandle ? '...' : 'Lock'}
                      </HudButton>
                      <GhostButton type="button" onClick={() => setEditingUsername(false)} style={{ padding: '4px 10px', fontSize: 11 }}>
                        Cancel
                      </GhostButton>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-wide text-[color:var(--c-text)]">
                        {activeUser?.username}
                      </h1>
                      {hasBadge && <PremiumBadge size="sm" showLabel className="ml-1" />}
                      {isMe && (
                        !activeUser?.is_username_set ? (
                          <button
                            onClick={() => { setNewHandle(activeUser?.username || ''); setEditingUsername(true); setHandleErr('') }}
                            className="p-1 rounded text-[color:var(--c-text-mute)] hover:text-[#38BDF8] transition-colors"
                            title="Set permanent handle"
                          >
                            <Pencil size={14} />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-[color:var(--c-panel2)] border border-[color:var(--c-border)] text-[color:var(--c-text-mute)]">
                            <Lock size={10} /> Locked
                          </span>
                        )
                      )}
                    </div>
                  )}

                  <RankBadge elo={elo} size="md" />
                </div>
                {activeUser?.institute && (
                  <p className="font-mono text-xs text-[color:var(--c-text-mute)] mt-1 flex items-center gap-1.5">
                    <Shield size={12} className="text-[#38BDF8]" />
                    {activeUser.institute}
                  </p>
                )}
                {handleErr && <p className="font-mono text-xs text-red-400">{handleErr}</p>}

                {/* Sub-meta tags */}
                <div className="flex items-center gap-3 font-mono text-xs text-[color:var(--c-text-mute)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-[#38BDF8]" />
                    Joined {joinDateStr}
                  </span>
                  {activeUser?.rank && (Number(activeUser?.wins || 0) + Number(activeUser?.losses || 0)) > 0 && (
                    <span className="flex items-center gap-1 text-[#38BDF8]">
                      Rank #{activeUser.rank}
                    </span>
                  )}
                </div>

                {/* Rank Progress Bar */}
                <div className="space-y-1 pt-1 max-w-md">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[color:var(--c-text-mute)] uppercase tracking-wider">{currentTier.name}</span>
                    <span className="font-bold text-[color:var(--c-gold)]">
                      {tierProgress.nextName === 'MAX TIER' ? 'MAX TIER REACHED' : `${tierProgress.needed} ELO TO ${tierProgress.nextName}`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[color:var(--c-panel2)] rounded-full overflow-hidden border border-[color:var(--c-border)]">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${tierProgress.pct}%`,
                        background: 'linear-gradient(90deg, var(--c-blue), var(--c-gold))',
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Big Elo Display & Single Streak Card */}
            <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-[color:var(--c-border)] pt-4 lg:pt-0">

              {/* Big ELO Box */}
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--c-text-mute)]">Rating Dossier</p>
                <div className="flex items-baseline gap-2">
                  <AnimatedCounter
                    value={elo}
                    className="font-display font-black text-4xl sm:text-5xl tracking-tight"
                    style={{ color: currentTier.col }}
                  />
                  <span className="font-mono text-xs text-[color:var(--c-text-mute)]">ELO</span>
                </div>
                {netChange !== 0 && (
                  <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{
                      background: netChange > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(225,29,72,0.12)',
                      color: netChange > 0 ? 'var(--c-green)' : 'var(--c-red)',
                      border: `1px solid ${netChange > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(225,29,72,0.3)'}`
                    }}>
                    {netChange > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    <span>{netChange > 0 ? `+${netChange}` : netChange} TOTAL</span>
                  </div>
                )}
              </div>

              {/* Single Streak Card */}
              <div
                className="p-3.5 rounded flex items-center gap-3 shrink-0 border"
                style={{
                  background: 'rgba(245, 185, 66, 0.06)',
                  borderColor: 'rgba(245, 185, 66, 0.25)',
                  boxShadow: '0 0 16px rgba(245, 185, 66, 0.1)'
                }}
              >
                <Flame size={28} className="text-[color:var(--c-gold)]" />
                <div>
                  <p className="font-display font-black text-2xl leading-none text-[color:var(--c-gold)]">{streak}</p>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--c-text-mute)] mt-0.5">Day Streak</p>
                </div>
              </div>

            </div>

          </div>
        </HudPanel>

        {/* ── 2. STAT STRIP (6 Stats) ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">

          {/* 1. Rating */}
          <HudPanel className="p-3 sm:p-4 space-y-1 sm:space-y-1.5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[color:var(--c-text-mute)]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Rating</span>
              <Trophy size={14} style={{ color: currentTier.col }} />
            </div>
            <p className="font-display font-black text-xl sm:text-3xl" style={{ color: currentTier.col }}>{elo}</p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[color:var(--c-text-mute)]">Peak {peakElo}</p>
          </HudPanel>

          {/* 2. Wins */}
          <HudPanel className="p-3 sm:p-4 space-y-1 sm:space-y-1.5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[color:var(--c-text-mute)]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Wins</span>
              <Swords size={14} className="text-[#10b981]" />
            </div>
            <p className="font-display font-black text-xl sm:text-3xl text-[#10b981]">{wins}</p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[color:var(--c-text-mute)]">{wr}% Win Rate</p>
          </HudPanel>

          {/* 3. Losses */}
          <HudPanel className="p-3 sm:p-4 space-y-1 sm:space-y-1.5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[color:var(--c-text-mute)]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Losses</span>
              <Shield size={14} className="text-[#E11D48]" />
            </div>
            <p className="font-display font-black text-xl sm:text-3xl text-[#E11D48]">{losses}</p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[color:var(--c-text-mute)]">{total} Battles</p>
          </HudPanel>

          {/* 4. Win Rate */}
          <HudPanel className="p-3 sm:p-4 space-y-1 sm:space-y-1.5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[color:var(--c-text-mute)]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Win Rate</span>
              <Target size={14} className="text-[#38BDF8]" />
            </div>
            <p className="font-display font-black text-xl sm:text-3xl text-[#38BDF8]">{wr}%</p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[color:var(--c-text-mute)]">{wins}W - {losses}L</p>
          </HudPanel>

          {/* 5. Streak */}
          <HudPanel className="p-3 sm:p-4 space-y-1 sm:space-y-1.5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-[color:var(--c-text-mute)]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider">Streak</span>
              <Flame size={14} className="text-[color:var(--c-gold)]" />
            </div>
            <p className="font-display font-black text-xl sm:text-3xl text-[color:var(--c-gold)]">{streak}d</p>
            <p className="font-mono text-[9px] sm:text-[10px] text-[color:var(--c-text-mute)]">Active Streak</p>
          </HudPanel>

          {/* 6. Favorite Topic */}
          <HudPanel className="p-3 sm:p-4 space-y-1 sm:space-y-1.5 transition-transform hover:-translate-y-0.5 min-w-0">
            <div className="flex items-center justify-between text-[color:var(--c-text-mute)]">
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider truncate">Fav Topic</span>
              <Zap size={14} className="text-[#38BDF8] shrink-0" />
            </div>
            <Tooltip content={favTopicTitle}>
              <p className="font-display font-black text-base sm:text-xl text-[#38BDF8] truncate uppercase">
                {favTopicTitle}
              </p>
            </Tooltip>
            <p className="font-mono text-[9px] sm:text-[10px] text-[color:var(--c-text-mute)]">{favTopicCount} Battles</p>
          </HudPanel>

        </div>

        {/* ── 3. RATING HISTORY (CHART) ──────────────────────── */}
        <HudPanel className="overflow-hidden">
          <div className="px-5 py-3 border-b border-[color:var(--c-border)] bg-[color:var(--c-panel)] flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#38BDF8]">
                // RATING HISTORY
              </p>
              <h2 className="font-display font-bold text-lg text-[color:var(--c-text)] uppercase tracking-wide">
                ELOWAVE PROGRESSION
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <StatBadge label="PEAK" value={peakElo} color="var(--c-gold)" />
              <StatBadge label="CURRENT" value={elo} color="var(--c-blue)" />
            </div>
          </div>
          <div className="p-5">
            <EloChart data={chartData} username={activeUser?.username} />
          </div>
        </HudPanel>

        {/* ── 4 & 5. BOTTOM GRID: MATCH HISTORY + ACTIVITY & TOPICS ── */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* Left Column: Match History */}
          <HudPanel className="overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-[color:var(--c-border)] bg-[color:var(--c-panel)] flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#38BDF8]">
                  // MATCH HISTORY
                </p>
                <h3 className="font-display font-bold text-base text-[color:var(--c-text)] uppercase tracking-wide">
                  RECENT DUELS
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[color:var(--c-text-mute)]">
                {matches.length} Battles
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="p-10 text-center">
                <EmptyState
                  icon={Swords}
                  title="No battles yet"
                  subtitle="Enter the arena to earn your first Elo rating."
                  action={
                    <HudButton onClick={() => navigate('/lobby')} className="mt-3">
                      Enter Arena
                    </HudButton>
                  }
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header Row */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-b border-[color:var(--c-border)] bg-[color:var(--c-void)] font-mono text-[9px] uppercase tracking-wider text-[color:var(--c-text-mute)]">
                  <span className="w-24 shrink-0">Result</span>
                  <span className="flex-1 min-w-0">Opponent</span>
                  <span className="hidden md:block flex-1 min-w-0">Topic & Diff</span>
                  <span className="w-16 text-right shrink-0">Elo Change</span>
                  <span className="w-16 text-right shrink-0">Date</span>
                </div>
                {/* List Container */}
                <div className="max-h-[420px] overflow-y-auto">
                  {matches.map((m) => (
                    <MatchRow key={m.id || m._id || Math.random()} m={m} />
                  ))}
                </div>
              </div>
            )}
          </HudPanel>

          {/* Right Column: Activity Heatmap + Topic Breakdown */}
          <div className="space-y-6">

            {/* Activity Heatmap */}
            <HudPanel className="p-5 space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#38BDF8]">
                  // COMBAT ACTIVITY
                </p>
                <h3 className="font-display font-bold text-base text-[color:var(--c-text)] uppercase tracking-wide">
                  30-DAY COMBAT HEATMAP
                </h3>
              </div>

              <StreakCalendar history={activeDates} matches={matches} />

              <div className="flex items-center justify-between pt-2 border-t border-[color:var(--c-border)] font-mono text-[10px] text-[color:var(--c-text-mute)]">
                <span>Active Days: <strong className="text-[color:var(--c-text)]">{activeDates.size}</strong></span>
                <span>Streak: <strong className="text-[color:var(--c-gold)]">{streak}d</strong></span>
              </div>
            </HudPanel>

            {/* Topic Breakdown */}
            <HudPanel className="p-5 space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#38BDF8]">
                  // TOPIC BREAKDOWN
                </p>
                <h3 className="font-display font-bold text-base text-[color:var(--c-text)] uppercase tracking-wide">
                  MASTERY BY CATEGORY
                </h3>
              </div>

              {Object.keys(topicFreq).length === 0 ? (
                <p className="font-mono text-xs text-[color:var(--c-text-mute)] py-4 text-center">
                  No match data recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(topicFreq)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([topKey, count], idx) => {
                      const title = topKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      const isTop = idx === 0
                      const pct = Math.round((count / matches.length) * 100)

                      return (
                        <div key={topKey} className="space-y-1">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${isTop ? 'text-[color:var(--c-gold)]' : 'text-[color:var(--c-text)]'}`}>
                                {title}
                              </span>
                              {isTop && (
                                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[color:var(--c-gold)]/10 border border-[color:var(--c-gold)]/30 text-[color:var(--c-gold)]">
                                  MOST PLAYED
                                </span>
                              )}
                            </div>
                            <span className="text-[color:var(--c-text-mute)] text-[10px]">{count} battles</span>
                          </div>
                          <div className="h-1.5 w-full bg-[color:var(--c-void)] rounded overflow-hidden border border-[color:var(--c-border)]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.1 }}
                              className="h-full rounded"
                              style={{
                                background: isTop
                                  ? 'linear-gradient(90deg, #F5B942, #f97316)'
                                  : 'linear-gradient(90deg, var(--c-red), var(--c-blue))',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </HudPanel>

          </div>

        </div>

      </div>

      {/* Avatar Modal */}
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
    </PageWrapper>
  )
}


