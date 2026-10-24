import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Search, Sparkles, ChevronDown,
  Shuffle, CheckCircle2, BookOpen, Zap, Flame, Target, Brackets,
  LayoutList, LayoutGrid
} from 'lucide-react'
import { HudPanel } from './ui'
import { DEFAULT_STRIVER_CURRICULUM } from '../content/striverCurriculum'

// ── Difficulty config ──────────────────────────────────────────────
const DIFF_CONFIG = {
  easy:   { label: 'Easy',   color: 'var(--c-green, #10b981)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  icon: <Zap size={11} />   },
  medium: { label: 'Medium', color: 'var(--c-gold, #d97706)',  bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',  icon: <Target size={11} /> },
  hard:   { label: 'Hard',   color: 'var(--c-red, #E11D48)',   bg: 'rgba(225,29,72,0.12)',  border: 'rgba(225,29,72,0.3)',   icon: <Flame size={11} />  },
}

// ── Single Problem Row (Compact 1-Line Card) ───────────────────────
function ProblemRow({ problem, globalIdx, onBattleProblem, queuingProblemId, isQueuing }) {
  const isThis = isQueuing && queuingProblemId === problem.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.12 }}
      className={`group relative flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border transition-all duration-200 ${
        isThis
          ? 'border-rose-500 bg-rose-500/15 shadow-lg shadow-rose-900/30 ring-1 ring-rose-500/50'
          : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:bg-[var(--c-panel2)] hover:border-amber-500/40 hover:shadow-sm'
      }`}
    >
      {/* Left: #Idx + Title + Optional Sample In */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="font-mono text-[11px] sm:text-xs font-bold text-[var(--c-text-mute)] w-6 shrink-0 text-center">
          #{String(globalIdx + 1).padStart(2, '0')}
        </span>

        <h4 className="font-display font-semibold text-xs sm:text-[13.5px] text-[var(--c-text)] truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
          {problem.title}
        </h4>

        {problem.sample_input && (
          <span className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] text-[var(--c-text-mute)] bg-[var(--c-bg)]/80 px-2 py-0.5 rounded border border-[var(--c-border)] truncate max-w-[220px]">
            <span className="text-[var(--c-text-dim)] font-semibold">In:</span> {problem.sample_input}
          </span>
        )}
      </div>

      {/* Right: Tests count + 1v1 Battle Action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="hidden md:inline-flex items-center gap-1 font-mono text-[10.5px] text-emerald-400/90 shrink-0">
          <CheckCircle2 size={11} className="text-emerald-400" />
          Verified
        </span>

        <button
          type="button"
          onClick={() => onBattleProblem(problem)}
          disabled={isQueuing}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded font-display font-bold text-[11px] uppercase tracking-wider transition-all duration-200 shrink-0 ${
            isThis
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white hover:shadow-md hover:shadow-rose-900/40 disabled:opacity-50'
          }`}
          style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
        >
          <Swords size={11} />
          <span>{isThis ? 'Queuing…' : '1v1 Battle'}</span>
        </button>
      </div>
    </motion.div>
  )
}

// ── Compact Grid Card (if user switches to grid) ───────────────────
function ProblemGridCard({ problem, globalIdx, onBattleProblem, queuingProblemId, isQueuing }) {
  const isThis = isQueuing && queuingProblemId === problem.id
  const diff   = DIFF_CONFIG[problem.difficulty] || DIFF_CONFIG.easy

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      className={`relative flex flex-col justify-between p-3 rounded-lg border transition-all duration-200 group ${
        isThis
          ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-900/30 ring-1 ring-rose-500/50'
          : 'bg-[var(--c-panel)] hover:bg-[var(--c-panel2)]/80 hover:border-amber-500/40'
      }`}
      style={{ borderColor: isThis ? undefined : diff.border }}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] font-bold text-[var(--c-text-mute)]">
            #{globalIdx + 1}
          </span>
        </div>

        <h4 className="font-display font-bold text-xs sm:text-[13px] text-[var(--c-text)] leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors mb-2 truncate">
          {problem.title}
        </h4>

        {problem.sample_input && (
          <div className="p-1.5 rounded bg-[var(--c-bg)] border border-[var(--c-border)] font-mono text-[10px] space-y-0.5 mb-2 truncate">
            <span className="text-[var(--c-text-dim)] font-semibold">In:</span> {problem.sample_input}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--c-border)] flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1">
          <CheckCircle2 size={10} /> Verified
        </span>
        <button
          type="button"
          onClick={() => onBattleProblem(problem)}
          disabled={isQueuing}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-display font-bold text-[10.5px] uppercase tracking-wider transition-all duration-200 ${
            isThis
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white disabled:opacity-50'
          }`}
          style={{ clipPath: 'polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%)' }}
        >
          <Swords size={10} />
          <span>{isThis ? 'Queuing…' : '1v1'}</span>
        </button>
      </div>
    </motion.div>
  )
}

// ── Difficulty Section (Easy / Medium / Hard) ──────────────────────
function DiffSection({ subsection, startIdx, onBattleProblem, queuingProblemId, isQueuing, searchQuery, viewMode }) {
  const [open, setOpen] = useState(false)
  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0)
  const isOpen = isSearchActive ? true : open

  const problems = useMemo(() => {
    const probs = subsection.problems || []
    if (!searchQuery) return probs
    return probs.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [subsection.problems, searchQuery])

  // Hide empty subsections
  if (problems.length === 0) return null

  // Figure out difficulty from subsection title
  const diff = subsection.title.toLowerCase().includes('easy')
    ? 'easy'
    : subsection.title.toLowerCase().includes('medium')
    ? 'medium'
    : 'hard'
  const cfg = DIFF_CONFIG[diff]

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: cfg.border }}>
      {/* Difficulty Header — clickable accordion toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => isSearchActive ? !isOpen : !o)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:brightness-110"
        style={{ background: cfg.bg }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <span className="font-display font-black text-xs sm:text-sm uppercase tracking-wider" style={{ color: cfg.color }}>
            {subsection.title}
          </span>
          <span
            className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold"
            style={{ background: `${cfg.color}25`, color: cfg.color }}
          >
            {problems.length}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{ color: cfg.color }}
          className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Problem Items */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="diff-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-2 sm:p-2.5 bg-[var(--c-bg)]/40">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {problems.map((problem, i) => (
                    <ProblemGridCard
                      key={problem.id}
                      problem={problem}
                      globalIdx={startIdx + i}
                      onBattleProblem={onBattleProblem}
                      queuingProblemId={queuingProblemId}
                      isQueuing={isQueuing}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {problems.map((problem, i) => (
                    <ProblemRow
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
  const [viewMode, setViewMode] = useState('list') // 'list' (1 line per question) | 'grid'

  const totalProblems = useMemo(() => {
    return (step.subsections || []).reduce((acc, sub) => acc + (sub.problems || []).length, 0)
  }, [step.subsections])

  const easyCount   = useMemo(() => (step.subsections?.find(s => s.title.toLowerCase().includes('easy'))?.problems || []).length, [step.subsections])
  const mediumCount = useMemo(() => (step.subsections?.find(s => s.title.toLowerCase().includes('medium'))?.problems || []).length, [step.subsections])
  const hardCount   = useMemo(() => (step.subsections?.find(s => s.title.toLowerCase().includes('hard'))?.problems || []).length, [step.subsections])

  let runningIdx = 0

  return (
    <HudPanel
      glow
      glowColor="rgba(245, 158, 11, 0.08)"
      accentTopLeft="var(--c-gold)"
      accentBotRight="var(--c-gold)"
      style={{
        padding: 0,
        background: 'var(--c-panel)',
        border: '1px solid rgba(245,158,11,0.25)',
        overflow: 'hidden'
      }}
    >
      {/* ── Step Header (Compact) ── */}
      <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <Brackets size={16} className="text-amber-600 dark:text-amber-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                <Sparkles size={8} className="animate-spin" />
                Striver A2Z DSA Sheet
              </span>
            </div>
            <h2 className="font-display font-black text-sm sm:text-[15px] uppercase tracking-tight text-[var(--c-text)] mt-0.5 truncate">
              {(step.topic ? step.topic.charAt(0).toUpperCase() + step.topic.slice(1) : (step.title || 'Arrays')).replace(/^Step\s*\d+\s*:\s*(Solve\s+Problems\s+on\s+)?/i, '').trim()}
            </h2>

            {/* Pills: Easy / Medium / Hard counts */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {easyCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold" style={{ background: DIFF_CONFIG.easy.bg, color: DIFF_CONFIG.easy.color, border: `1px solid ${DIFF_CONFIG.easy.border}` }}>
                  <Zap size={8} /> Easy {easyCount}
                </span>
              )}
              {mediumCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold" style={{ background: DIFF_CONFIG.medium.bg, color: DIFF_CONFIG.medium.color, border: `1px solid ${DIFF_CONFIG.medium.border}` }}>
                  <Target size={8} /> Medium {mediumCount}
                </span>
              )}
              {hardCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold" style={{ background: DIFF_CONFIG.hard.bg, color: DIFF_CONFIG.hard.color, border: `1px solid ${DIFF_CONFIG.hard.border}` }}>
                  <Flame size={8} /> Hard {hardCount}
                </span>
              )}
              <span className="font-mono text-[9.5px] text-[var(--c-text-mute)]">· {totalProblems} total</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions: View Toggle + Random Battle + Collapse */}
        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle: Row View (1-line) vs Grid View */}
          <div className="flex items-center rounded border border-[var(--c-border)] p-0.5 bg-[var(--c-panel)]">
            <button
              type="button"
              title="Single-line list view"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-[var(--c-text-mute)] hover:text-[var(--c-text)]'}`}
            >
              <LayoutList size={13} />
            </button>
            <button
              type="button"
              title="Grid card view"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-[var(--c-text-mute)] hover:text-[var(--c-text)]'}`}
            >
              <LayoutGrid size={13} />
            </button>
          </div>

          {/* Random battle button */}
          <button
            type="button"
            onClick={() => onBattleRandom(step.topic || 'arrays', 'easy')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-display font-bold text-[11px] uppercase tracking-wider text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)',
              boxShadow: '0 0 10px rgba(245,158,11,0.25)',
              clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)'
            }}
          >
            <Shuffle size={11} />
            <span>Random</span>
          </button>

          {/* Expand/collapse entire topic */}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            style={{ border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5 border-t border-[rgba(245,158,11,0.15)] pt-2.5">
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
                    viewMode={viewMode}
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
    <div className="space-y-3">
      {/* ── Global Search Bar ── */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-mute)]" />
        <input
          type="text"
          placeholder="Search problems by name…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-4 py-2 rounded font-mono text-xs bg-[var(--c-panel)] border border-[var(--c-border)] text-[var(--c-text)] placeholder:text-[var(--c-text-mute)] focus:outline-none focus:border-amber-500/60 transition-colors"
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
        <div className="p-10 text-center rounded border border-dashed border-[var(--c-border)] bg-[var(--c-panel)]">
          <BookOpen size={24} className="mx-auto text-[var(--c-text-mute)] mb-2 opacity-50" />
          <p className="font-display font-bold text-xs text-[var(--c-text)] uppercase">No curriculum loaded</p>
          <p className="font-mono text-[11px] text-[var(--c-text-mute)] mt-1">Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
