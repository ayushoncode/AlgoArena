/**
 * AlgoArena — Shared HUD Component Library
 * "Assemble the Arena" design system — purely presentational
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Zap, Star, Crown, Sword, Trophy,
  ChevronRight, X, Check, AlertTriangle, Info,
  CheckCircle, XCircle, Clock, Loader2,
} from 'lucide-react'

/* ══════════════════════════════════════════════════════════
   RANK TIER CONFIG — canonical, import from here everywhere
══════════════════════════════════════════════════════════ */
export const ARENA_TIERS = [
  { name: 'Recruit', min: 0, max: 1199, col: '#94a3b8', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', glow: 'rgba(100,116,139,0.2)', icon: Shield },
  { name: 'Operative', min: 1200, max: 1399, col: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.25)', icon: Zap },
  { name: 'Vanguard', min: 1400, max: 1599, col: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)', glow: 'rgba(56,189,248,0.25)', icon: Star },
  { name: 'Champion', min: 1600, max: 1799, col: '#818cf8', bg: 'rgba(129,140,248,0.14)', border: 'rgba(129,140,248,0.35)', glow: 'rgba(129,140,248,0.3)', icon: Crown },
  { name: 'Legend', min: 1800, max: 2199, col: '#c084fc', bg: 'rgba(192,132,252,0.14)', border: 'rgba(192,132,252,0.35)', glow: 'rgba(192,132,252,0.3)', icon: Trophy },
  { name: 'Bihari', min: 2200, max: 9999, col: '#F5B942', bg: 'rgba(245,185,66,0.14)', border: 'rgba(245,185,66,0.35)', glow: 'rgba(245,185,66,0.35)', icon: Crown },
]

export function getArenaTier(elo) {
  const rating = Number(elo) || 1200
  return ARENA_TIERS.find(t => rating >= t.min && rating <= t.max) || ARENA_TIERS[0]
}

/* ══════════════════════════════════════════════════════════
   HUD PANEL
══════════════════════════════════════════════════════════ */
export function HudPanel({ children, className = '', style = {}, glow = false, glowColor = 'var(--c-red-glow)', accentTopLeft = 'var(--c-blue)', accentBotRight = 'var(--c-red)', as: Tag = 'div' }) {
  return (
    <Tag
      className={`${className}`}
      style={{
        background: 'var(--c-panel)',
        border: '1px solid var(--c-border)',
        position: 'relative',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        boxShadow: glow ? `0 0 32px ${glowColor}` : 'none',
        transition: 'box-shadow 0.25s ease',
        ...style,
      }}
    >
      <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTop: `1.5px solid ${accentTopLeft}`, borderLeft: `1.5px solid ${accentTopLeft}`, pointerEvents: 'none' }} />
      <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottom: `1.5px solid ${accentBotRight}`, borderRight: `1.5px solid ${accentBotRight}`, pointerEvents: 'none' }} />
      {children}
    </Tag>
  )
}

/* ══════════════════════════════════════════════════════════
   BUTTONS
══════════════════════════════════════════════════════════ */
export function HudButton({ children, className = '', style = {}, disabled = false, ...rest }) {
  return (
    <button className={`btn-primary ${className}`} disabled={disabled} style={style} {...rest}>
      {children}
    </button>
  )
}

export function GhostButton({ children, className = '', style = {}, disabled = false, ...rest }) {
  return (
    <button className={`btn-ghost ${className}`} disabled={disabled} style={style} {...rest}>
      {children}
    </button>
  )
}

export function DangerButton({ children, className = '', style = {}, ...rest }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-all duration-150 active:scale-[0.97] ${className}`}
      style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(225,29,72,0.1)', color: 'var(--c-red)', border: '1px solid rgba(225,29,72,0.4)', clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)', ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   RANK BADGE
══════════════════════════════════════════════════════════ */
export function RankBadge({ elo, size = 'sm', showName = true, showElo = false, className = '' }) {
  const tier = getArenaTier(elo)
  const TierIcon = tier.icon
  const s = { xs: { px: 4, py: 1, font: 8, icon: 10 }, sm: { px: 6, py: 2, font: 9, icon: 11 }, md: { px: 8, py: 3, font: 11, icon: 13 }, lg: { px: 10, py: 4, font: 13, icon: 16 } }[size] ?? { px: 6, py: 2, font: 9, icon: 11 }
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider ${className}`} style={{ padding: `${s.py}px ${s.px}px`, fontSize: s.font, background: tier.bg, color: tier.col, border: `1px solid ${tier.border}`, letterSpacing: '0.1em' }}>
      <TierIcon size={s.icon} strokeWidth={2.5} />
      {showName && tier.name}
      {showElo && <span style={{ color: 'var(--c-gold)', marginLeft: 2 }}>{elo}</span>}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   STAT BADGE
══════════════════════════════════════════════════════════ */
export function StatBadge({ label, value, color = 'var(--c-blue)', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${className}`} style={{ padding: '2px 8px', background: `${color}15`, color, border: `1px solid ${color}40` }}>
      <span style={{ color: 'var(--c-text-mute)' }}>{label}</span>
      <span className="font-bold">{value}</span>
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════ */
export function SectionHeader({ label, title, action, className = '' }) {
  return (
    <div className={`flex items-end justify-between mb-4 ${className}`}>
      <div>
        {label && <p className="section-label mb-1">{label}</p>}
        {title && <h2 className="font-display font-bold text-xl" style={{ color: 'var(--c-text)', letterSpacing: '0.04em' }}>{title}</h2>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TAB BAR
══════════════════════════════════════════════════════════ */
export function TabBar({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex items-center shrink-0 ${className}`} style={{ borderBottom: '1px solid var(--c-border)' }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="px-4 py-2.5 font-mono text-xs font-semibold transition-all"
          style={{ color: active === tab.id ? 'var(--c-red)' : 'var(--c-text-dim)', borderBottom: `2px solid ${active === tab.id ? 'var(--c-red)' : 'transparent'}`, background: 'transparent', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' }}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════ */
export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 480 }) {
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,7,15,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
        >
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }} style={{ width: '100%', maxWidth }}>
            <HudPanel style={{ overflow: 'hidden' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <div>
                  {subtitle && <p className="section-label mb-0.5">{subtitle}</p>}
                  {title && <h3 className="font-display font-bold text-base" style={{ color: 'var(--c-text)' }}>{title}</h3>}
                </div>
                {onClose && (
                  <button onClick={onClose} aria-label="Close modal" className="transition-colors p-1"
                    style={{ color: 'var(--c-text-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--c-red)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-mute)'}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="p-5">{children}</div>
            </HudPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
const TOAST_CFG = {
  success: { col: 'var(--c-green)', icon: CheckCircle },
  error: { col: 'var(--c-red)', icon: XCircle },
  info: { col: 'var(--c-blue)', icon: Info },
  warning: { col: '#f59e0b', icon: AlertTriangle },
}

export function Toast({ message, type = 'info', onDismiss }) {
  const cfg = TOAST_CFG[type] ?? TOAST_CFG.info
  const Icon = cfg.icon
  useEffect(() => { const t = setTimeout(() => onDismiss?.(), 3500); return () => clearTimeout(t) }, [onDismiss])
  return (
    <motion.div initial={{ opacity: 0, x: 40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40, scale: 0.95 }} transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold"
      style={{ background: 'var(--c-panel)', border: `1px solid ${cfg.col}40`, borderLeft: `3px solid ${cfg.col}`, boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, minWidth: 280, maxWidth: 380 }}
    >
      <Icon size={14} style={{ color: cfg.col, flexShrink: 0 }} />
      <span style={{ color: 'var(--c-text)', flex: 1 }}>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss" style={{ color: 'var(--c-text-mute)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        onMouseOver={e => e.currentTarget.style.color = cfg.col} onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-mute)'}
      ><X size={12} /></button>
    </motion.div>
  )
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div aria-live="polite" className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end">
      <AnimatePresence>{toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => onDismiss(t.id)} />)}</AnimatePresence>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
export function Skeleton({ width = '100%', height = 14, className = '', style = {} }) {
  return <div className={`animate-pulse ${className}`} style={{ width, height, background: 'var(--c-border)', borderRadius: 3, ...style }} />
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <HudPanel style={{ padding: '1rem 1.25rem' }}>
      <div className="space-y-2.5">
        <Skeleton width="60%" height={16} />
        {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={11} style={{ width: `${75 + (i * 7)}%`, animationDelay: `${i * 0.1}s` }} />)}
      </div>
    </HudPanel>
  )
}

/* ══════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════ */
export function EmptyState({ icon: Icon = Sword, title = 'Nothing here', subtitle = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-4">
      <div className="w-16 h-16 flex items-center justify-center" style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)', clipPath: 'polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)' }}>
        <Icon size={28} style={{ color: 'var(--c-text-mute)' }} />
      </div>
      <div className="space-y-1">
        <p className="font-display font-bold text-base" style={{ color: 'var(--c-text-dim)' }}>{title}</p>
        {subtitle && <p className="font-mono text-xs" style={{ color: 'var(--c-text-mute)' }}>{subtitle}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════ */
export function ProgressBar({ value = 0, max = 100, color = 'var(--c-red)', className = '', label = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between font-mono text-[10px]">
          <span style={{ color: 'var(--c-text-mute)' }}>{label}</span>
          <span style={{ color }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}CC, ${color})`, boxShadow: `0 0 8px ${color}60`, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)', borderRadius: 2 }} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HUD INPUT
══════════════════════════════════════════════════════════ */
export function HudInput({ label, error, className = '', style = {}, ...rest }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="section-label">{label}</label>}
      <input className="input-field" style={style} {...rest} />
      {error && <p className="font-mono text-[10px]" style={{ color: 'var(--c-red)' }}>{error}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HUD SELECT
══════════════════════════════════════════════════════════ */
export function HudSelect({ label, options = [], className = '', style = {}, ...rest }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="section-label">{label}</label>}
      <select className="w-full bg-transparent text-sm transition-colors duration-200 cursor-pointer"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-text)', border: '1px solid var(--c-border)', padding: '8px 10px', background: 'var(--c-panel)', outline: 'none', ...style }}
        {...rest}
      >
        {options.map(opt => <option key={opt.value} value={opt.value} style={{ background: 'var(--c-panel)' }}>{opt.label}</option>)}
      </select>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TOOLTIP
══════════════════════════════════════════════════════════ */
export function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = useState(false)
  const posStyles = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  }
  return (
    <div className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && text && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.1 }}
            className="absolute z-50 whitespace-nowrap pointer-events-none"
            style={{ ...posStyles[position], fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 8px', background: 'var(--c-panel2)', color: 'var(--c-text)', border: '1px solid var(--c-border2)', letterSpacing: '0.04em' }}
          >{text}</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   VERDICT CHIP
══════════════════════════════════════════════════════════ */
const VERDICT_CFG = {
  ACCEPTED: { col: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', label: 'Accepted', icon: CheckCircle },
  WRONG_ANSWER: { col: '#E11D48', bg: 'rgba(225,29,72,0.15)', border: 'rgba(225,29,72,0.3)', label: 'Wrong Answer', icon: XCircle },
  RUNTIME_ERROR: { col: '#E11D48', bg: 'rgba(225,29,72,0.15)', border: 'rgba(225,29,72,0.3)', label: 'Runtime Error', icon: XCircle },
  COMPILATION_ERROR: { col: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: 'Compile Error', icon: AlertTriangle },
  TIME_LIMIT_EXCEEDED: { col: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', label: 'Time Limit', icon: Clock },
  PENDING: { col: '#38BDF8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.25)', label: 'Judging', icon: Loader2 },
}

export function VerdictChip({ verdict, label, size = 'sm', className = '' }) {
  if (!verdict) return null
  const cfg = VERDICT_CFG[verdict] ?? VERDICT_CFG.PENDING
  const Icon = cfg.icon
  const fs = size === 'xs' ? 9 : size === 'sm' ? 10 : 12
  const px = size === 'xs' ? 6 : size === 'sm' ? 10 : 14
  const py = size === 'xs' ? 2 : size === 'sm' ? 4 : 6
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider verdict-in ${className}`}
      style={{ fontSize: fs, padding: `${py}px ${px}px`, background: cfg.bg, color: cfg.col, border: `1px solid ${cfg.border}`, letterSpacing: '0.08em' }}
    >
      <Icon size={fs + 2} strokeWidth={2.5} style={verdict === 'PENDING' ? { animation: 'spin 1s linear infinite' } : {}} />
      {label ?? cfg.label}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   DIFF CHIP
══════════════════════════════════════════════════════════ */
const DIFF_CFG = {
  easy: { col: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Easy' },
  medium: { col: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Medium' },
  hard: { col: '#E11D48', bg: 'rgba(225,29,72,0.12)', label: 'Hard' },
}

export function DiffChip({ difficulty, className = '' }) {
  const cfg = DIFF_CFG[String(difficulty ?? '').toLowerCase()] ?? DIFF_CFG.medium
  return (
    <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${className}`}
      style={{ background: cfg.bg, color: cfg.col, border: `1px solid ${cfg.col}40`, letterSpacing: '0.1em' }}
    >{cfg.label}</span>
  )
}

/* ══════════════════════════════════════════════════════════
   PAGE WRAPPER
══════════════════════════════════════════════════════════ */
export function PageWrapper({ children, className = '', heroGlow = false, style = {} }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className={`min-h-[calc(100vh-3.5rem)] relative overflow-x-hidden w-full ${className}`}
      style={{ background: 'var(--c-void)', ...style }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-hex-pattern" />
      {heroGlow && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(225,29,72,0.08)' }} />
          <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(56,189,248,0.07)' }} />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════════════ */
export function AnimatedCounter({ value, duration = 800, className = '', style = {} }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    if (from === to) return
    const diff = to - from
    const steps = Math.min(Math.abs(diff), 40)
    const stepSize = diff / steps
    let count = 0
    let cur = from
    const t = setInterval(() => {
      count++
      cur += stepSize
      setDisplay(Math.round(cur))
      if (count >= steps) { clearInterval(t); setDisplay(to) }
    }, duration / steps)
    return () => clearInterval(t)
  }, [value, duration])

  return <span className={className} style={style}>{display}</span>
}

/* ══════════════════════════════════════════════════════════
   SCANLINES
══════════════════════════════════════════════════════════ */
export function Scanlines() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 scanline-overlay"
      style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)', zIndex: 1 }}
    />
  )
}

/* re-exports */
export { X, Check, ChevronRight, AlertTriangle, Info, CheckCircle, XCircle, Loader2, Clock }
