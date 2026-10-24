import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Search, Sparkles, Filter, ChevronRight, CheckCircle2,
  Shuffle, ArrowRight, Zap, Target, Flame, Layers, Brackets,
  BookOpen, Award, Check, Hash
} from 'lucide-react'
import { HudPanel, DiffChip } from './ui'

export default function StriverSheetView({
  striverData = [],
  loading = false,
  onBattleProblem,
  onBattleRandom,
  queuingProblemId,
  isQueuing = false
}) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all') // 'all' | 'easy' | 'medium' | 'hard'
  const [searchQuery, setSearchQuery] = useState('')

  // Flatten all problems from the curriculum
  const currentStep = striverData[0] || null

  const allProblems = useMemo(() => {
    if (!currentStep?.subsections) return []
    const list = []
    currentStep.subsections.forEach(sub => {
      (sub.problems || []).forEach(p => {
        list.push({
          ...p,
          subtopicTitle: sub.title
        })
      })
    })
    return list
  }, [currentStep])

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return allProblems.filter(p => {
      const matchesDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty
      const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesDiff && matchesSearch
    })
  }, [allProblems, selectedDifficulty, searchQuery])

  // Counts by difficulty
  const counts = useMemo(() => {
    const res = { all: allProblems.length, easy: 0, medium: 0, hard: 0 }
    allProblems.forEach(p => {
      if (res[p.difficulty] !== undefined) res[p.difficulty]++
    })
    return res
  }, [allProblems])

  return (
    <div className="space-y-6">
      {/* ── TOP HERO BANNER ─────────────────────────────────────────── */}
      <HudPanel
        glow
        glowColor="rgba(245, 158, 11, 0.12)"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(225, 29, 72, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles size={11} className="animate-spin" />
                Striver A2Z DSA Sheet
              </span>
              <span className="text-xs font-mono text-[var(--c-text-mute)]">
                // Step 3: Arrays
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-[var(--c-text)]">
              Topic & Question-Wise 1v1 Arena
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[var(--c-text-dim)] max-w-2xl leading-relaxed">
              Target any exact Striver Sheet problem to queue against competitors on the same question, or battle randomly across the curriculum.
            </p>
          </div>

          {/* Quick Action: Battle Random from Arrays */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onBattleRandom('arrays', 'easy')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.35)',
                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)'
              }}
            >
              <Shuffle size={14} />
              <span>Random Array Battle</span>
            </button>
          </div>
        </div>
      </HudPanel>

      {/* ── FILTER & SEARCH TOOLBAR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-[var(--c-panel)] border border-[var(--c-border)]">
        {/* Difficulty Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Questions', count: counts.all, col: 'var(--c-text)' },
            { id: 'easy', label: 'Easy', count: counts.easy, col: '#10b981' },
            { id: 'medium', label: 'Medium', count: counts.medium, col: '#f59e0b' },
            { id: 'hard', label: 'Hard', count: counts.hard, col: '#E11D48' }
          ].map(tab => {
            const active = selectedDifficulty === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDifficulty(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[var(--c-panel2)] text-white border shadow-sm'
                    : 'text-[var(--c-text-mute)] hover:text-[var(--c-text)] hover:bg-[var(--c-panel2)] border-transparent'
                }`}
                style={{
                  borderColor: active ? tab.col : 'transparent',
                  color: active ? tab.col : undefined
                }}
              >
                <span>{tab.label}</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono"
                  style={{
                    background: active ? `${tab.col}25` : 'rgba(255,255,255,0.06)',
                    color: active ? tab.col : 'var(--c-text-mute)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-mute)]" />
          <input
            type="text"
            placeholder="Search Striver problem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded font-mono text-xs bg-[var(--c-bg)] border border-[var(--c-border)] text-[var(--c-text)] placeholder:text-[var(--c-text-mute)] focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* ── PROBLEM GRID ────────────────────────────────────────────── */}
      {filteredProblems.length === 0 ? (
        <div className="p-12 text-center rounded border border-dashed border-[var(--c-border)] bg-[var(--c-panel)]">
          <BookOpen size={28} className="mx-auto text-[var(--c-text-mute)] mb-2 opacity-50" />
          <p className="font-display font-bold text-sm text-[var(--c-text)] uppercase">No problems match your filter</p>
          <p className="font-mono text-xs text-[var(--c-text-mute)] mt-1">Try resetting the difficulty or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProblems.map((problem, idx) => {
            const isCurrentlyQueuingThis = isQueuing && queuingProblemId === problem.id
            const diffColor =
              problem.difficulty === 'easy'
                ? '#10b981'
                : problem.difficulty === 'medium'
                ? '#f59e0b'
                : '#E11D48'

            return (
              <motion.div
                key={problem.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.02 }}
                className={`relative flex flex-col justify-between p-4 rounded-lg border transition-all duration-200 group ${
                  isCurrentlyQueuingThis
                    ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-900/30 ring-1 ring-rose-500/50'
                    : 'border-[var(--c-border)] bg-[var(--c-panel)] hover:border-amber-500/40 hover:bg-[var(--c-panel2)]/60'
                }`}
              >
                <div>
                  {/* Card Header: Number & Difficulty */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-[var(--c-text-mute)]">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold text-[var(--c-text-mute)] bg-[var(--c-bg)] border border-[var(--c-border)]">
                        {problem.subtopicTitle}
                      </span>
                      <DiffChip difficulty={problem.difficulty} />
                    </div>
                  </div>

                  {/* Problem Title */}
                  <h3 className="font-display font-bold text-sm sm:text-base text-[var(--c-text)] leading-snug group-hover:text-amber-400 transition-colors">
                    {problem.title}
                  </h3>

                  {/* Sample I/O Preview */}
                  {problem.sample_input && (
                    <div className="mt-3 p-2 rounded bg-[var(--c-bg)] border border-[var(--c-border)] font-mono text-[11px] space-y-0.5">
                      <div className="text-[var(--c-text-mute)] truncate">
                        <span className="text-[var(--c-text-dim)] font-semibold">In:</span> {problem.sample_input}
                      </div>
                      <div className="text-[var(--c-text-mute)] truncate">
                        <span className="text-[var(--c-text-dim)] font-semibold">Out:</span> {problem.sample_output}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
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
                      isCurrentlyQueuingThis
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-600/90 hover:bg-rose-500 text-white hover:shadow-md hover:shadow-rose-900/40'
                    }`}
                    style={{ clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)' }}
                  >
                    <Swords size={12} />
                    <span>{isCurrentlyQueuingThis ? 'Queuing…' : '1v1 Battle'}</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
