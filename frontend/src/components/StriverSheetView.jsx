import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Search, Sparkles, ChevronDown, ChevronRight,
  Shuffle, CheckCircle2, BookOpen, Zap, Flame, Target, Brackets
} from 'lucide-react'
import { HudPanel, DiffChip } from './ui'
import { DEFAULT_STRIVER_CURRICULUM } from '../content/striverCurriculum'

// ── Difficulty config ──────────────────────────────────────────────
const DIFF_CONFIG = {
  easy:   { label: 'Easy',   color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)',  icon: <Zap size={12} />   },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)',  icon: <Target size={12} /> },
  hard:   { label: 'Hard',   color: '#E11D48', bg: 'rgba(225,29,72,0.12)',  border: 'rgba(225,29,72,0.35)',   icon: <Flame size={12} />  },
}

// ── Single Problem Card ────────────────────────────────────────────
function ProblemCard({ problem, globalIdx, onBattleProblem, queuingProblemId, isQueuing }) {
  const isThis = isQueuing && queuingProblemId === problem.id
  const diff   = DIFF_CONFIG[problem.difficulty] || DIFF_CONFIG.easy

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={`relative flex flex-col justify-between p-4 rounded-lg border transition-all duration-200 group ${
        isThis
          ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-900/30 ring-1 ring-rose-500/50'
          : 'bg-[var(--c-panel)] hover:bg-[var(--c-panel2)]/70'
      }`}
      style={{ borderColor: isThis ? undefined : diff.border }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="font-mono text-[10px] font-bold text-[var(--c-text-mute)]">
            #{globalIdx + 1}
          </span>
          <DiffChip difficulty={problem.difficulty} />
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-sm sm:text-[15px] text-[var(--c-text)] leading-snug group-hover:text-amber-400 transition-colors mb-3">
          {problem.title}
        </h3>

        {/* Sample I/O */}
        {problem.sample_input && (
          <div className="p-2 rounded bg-[var(--c-bg)] border border-[var(--c-border)] font-mono text-[11px] space-y-0.5">
            <div className="text-[var(--c-text-mute)] truncate">
              <span className="text-[var(--c-text-dim)] font-semibold">In:</span> {problem.sample_input}
            </div>
            <div className="text-[var(--c-text-mute)] truncate">
              <span className="text-[var(--c-text-dim)] font-semibold">Out:</span> {problem.sample_output}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--c-border)] flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] text-[var(--c-text-mute)] flex items-center gap-1">
          <CheckCircle2 size={11} className="text-emerald-400" />
          25 Tests Verified
        </div>
        <button
          type="button"
          onClick={() => onBattleProblem(problem)}
          disabled={isQueuing}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-display font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
            isThis
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white hover:shadow-md hover:shadow-rose-900/40 disabled:opacity-50'
          }`}
          style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
        >
          <Swords size={12} />
          <span>{isThis ? 'Queuing…' : '1v1 Battle'}</span>
        </button>
      </div>
    </motion.div>
  )
}

// ── Difficulty Section (Easy / Medium / Hard) ──────────────────────
function DiffSection({ subsection, startIdx, onBattleProblem, queuingProblemId, isQueuing, searchQuery }) {
  const [open, setOpen] = useState(true)

  const problems = useMemo(() => {
    const probs = subsection.problems || []
    if (!searchQuery) return probs
    return probs.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [subsection.problems, searchQuery])

  // Figure out difficulty from subsection title
  const diff = subsection.title.toLowerCase().includes('easy')
    ? 'easy'
    : subsection.title.toLowerCase().includes('medium')
    ? 'medium'
    : 'hard'
  const cfg = DIFF_CONFIG[diff]

  if (problems.length === 0 && searchQuery) return null

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: cfg.border }}>
      {/* Difficulty Header — clickable */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors"
        style={{ background: cfg.bg }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <span className="font-display font-black text-sm uppercase tracking-wider" style={{ color: cfg.color }}>
            {subsection.title}
          </span>
          <span
            className="px-2 py-0.5 rounded font-mono text-[10px] font-bold"
            style={{ background: `${cfg.color}20`, color: cfg.color }}
          >
            {problems.length}
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{ color: cfg.color }}
          className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Problem Cards */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="diff-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-[var(--c-bg)]/40">
              {problems.length === 0 ? (
                <p className="text-center py-4 font-mono text-xs text-[var(--c-text-mute)]">No problems here</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {problems.map((problem, i) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      globalIdx={startIdx + i}
                      onBattleProblem={onBattleProblem}
                      queuingProblemId={queuingProblemId}
                      isQueuing={isQueuing}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Topic Step Card (e.g., "Step 3: Solve Problems on Arrays") ──────
function TopicStepCard({ step, onBattleProblem, onBattleRandom, queuingProblemId, isQueuing, searchQuery }) {
  const [open, setOpen] = useState(true)

  const totalProblems = useMemo(() => {
    return (step.subsections || []).reduce((acc, sub) => acc + (sub.problems || []).length, 0)
  }, [step.subsections])

  const easyCount   = useMemo(() => (step.subsections?.find(s => s.title.toLowerCase().includes('easy'))?.problems || []).length, [step.subsections])
  const mediumCount = useMemo(() => (step.subsections?.find(s => s.title.toLowerCase().includes('medium'))?.problems || []).length, [step.subsections])
  const hardCount   = useMemo(() => (step.subsections?.find(s => s.title.toLowerCase().includes('hard'))?.problems || []).length, [step.subsections])

  // Running index counter for problem numbering across subsections
  let runningIdx = 0

  return (
    <HudPanel
      glow
      glowColor="rgba(245, 158, 11, 0.10)"
      style={{
        padding: 0,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(225,29,72,0.06) 100%)',
        border: '1px solid rgba(245,158,11,0.22)',
        overflow: 'hidden'
      }}
    >
      {/* ── Step Header ── */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <Brackets size={18} className="text-amber-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <Sparkles size={9} className="animate-spin" />
                Striver A2Z DSA Sheet
              </span>
            </div>
            <h2 className="font-display font-black text-base sm:text-lg uppercase tracking-tight text-[var(--c-text)] mt-0.5 truncate">
              {(step.topic ? step.topic.charAt(0).toUpperCase() + step.topic.slice(1) : (step.title || 'Arrays')).replace(/^Step\s*\d+\s*:\s*(Solve\s+Problems\s+on\s+)?/i, '').trim()}
            </h2>

            {/* Pills: Easy / Medium / Hard counts */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {easyCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold" style={{ background: DIFF_CONFIG.easy.bg, color: DIFF_CONFIG.easy.color, border: `1px solid ${DIFF_CONFIG.easy.border}` }}>
                  <Zap size={9} /> Easy {easyCount}
                </span>
              )}
              {mediumCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold" style={{ background: DIFF_CONFIG.medium.bg, color: DIFF_CONFIG.medium.color, border: `1px solid ${DIFF_CONFIG.medium.border}` }}>
                  <Target size={9} /> Medium {mediumCount}
                </span>
              )}
              {hardCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold" style={{ background: DIFF_CONFIG.hard.bg, color: DIFF_CONFIG.hard.color, border: `1px solid ${DIFF_CONFIG.hard.border}` }}>
                  <Flame size={9} /> Hard {hardCount}
                </span>
              )}
              <span className="font-mono text-[10px] text-[var(--c-text-mute)]">· {totalProblems} total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Random battle button */}
          <button
            type="button"
            onClick={() => onBattleRandom(step.topic || 'arrays', 'easy')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded font-display font-bold text-xs uppercase tracking-wider text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)',
              boxShadow: '0 0 12px rgba(245,158,11,0.3)',
              clipPath: 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)'
            }}
          >
            <Shuffle size={13} />
            <span>Random Battle</span>
          </button>

          {/* Expand/collapse */}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-amber-500/10"
            style={{ border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <ChevronDown
              size={16}
              className={`text-amber-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
            />
          </button>
        </div>
      </div>

      {/* ── Subsections (Easy / Medium / Hard) ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="step-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[rgba(245,158,11,0.15)] pt-4">
              {(step.subsections || []).map((sub, si) => {
                const startIdx = runningIdx
                runningIdx += (sub.problems || []).length
                return (
                  <DiffSection
                    key={si}
                    subsection={sub}
                    startIdx={startIdx}
                    onBattleProblem={onBattleProblem}
                    queuingProblemId={queuingProblemId}
                    isQueuing={isQueuing}
                    searchQuery={searchQuery}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </HudPanel>
  )
}

// ── Main Export ────────────────────────────────────────────────────
export default function StriverSheetView({
  striverData = [],
  loading = false,
  onBattleProblem,
  onBattleRandom,
  queuingProblemId,
  isQueuing = false
}) {
  const [searchQuery, setSearchQuery] = useState('')

  // Use backend data if valid, else fallback to local curriculum
  const dataToUse = (striverData && striverData.length > 0 && striverData[0]?.subsections?.length > 0)
    ? striverData
    : DEFAULT_STRIVER_CURRICULUM

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full animate-ping" style={{ background: '#f59e0b', opacity: 0.6 }} />
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--c-text-mute)]">Loading Curriculum…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Global Search Bar ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-mute)]" />
        <input
          type="text"
          placeholder="Search problems across all topics…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded font-mono text-xs bg-[var(--c-panel)] border border-[var(--c-border)] text-[var(--c-text)] placeholder:text-[var(--c-text-mute)] focus:outline-none focus:border-amber-500/60 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text-mute)] hover:text-[var(--c-text)] transition-colors font-mono text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Topic Step Cards ── */}
      {dataToUse.length === 0 ? (
        <div className="p-12 text-center rounded border border-dashed border-[var(--c-border)] bg-[var(--c-panel)]">
          <BookOpen size={28} className="mx-auto text-[var(--c-text-mute)] mb-2 opacity-50" />
          <p className="font-display font-bold text-sm text-[var(--c-text)] uppercase">No curriculum loaded</p>
          <p className="font-mono text-xs text-[var(--c-text-mute)] mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dataToUse.map(step => (
            <TopicStepCard
              key={step.id}
              step={step}
              onBattleProblem={onBattleProblem}
              onBattleRandom={onBattleRandom}
              queuingProblemId={queuingProblemId}
              isQueuing={isQueuing}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}
