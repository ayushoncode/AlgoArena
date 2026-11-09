import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconSearch,
  IconClose,
  IconSwords,
  IconCheck,
  IconChevronDown,
  IconCode,
  IconShuffle,
  IconBook,
  IconLock,
  IconLeetCode,
  IconMessageSquare,
} from './icons'
import { DEFAULT_STRIVER_CURRICULUM } from '../content/striverCurriculum'
import '../pages/Lobby/Lobby.css'

// ── Difficulty Config ──────────────────────────────────────────────
const DIFF_CONFIG = {
  easy: { label: 'Easy', dot: '#22c55e' },
  medium: { label: 'Medium', dot: '#f59e0b' },
  hard: { label: 'Hard', dot: '#f43f5e' },
}

// ── Single Problem Row ─────────────────────────────────────────────
function ProblemRow({ problem, globalIdx, onBattleProblem, queuingProblemId, isQueuing, isGated = false }) {
  const isThis = isQueuing && queuingProblemId === problem.id

  const leetCodeUrl = useMemo(() => {
    if (problem.leetcode_url) return problem.leetcode_url
    if (problem.slug) return `https://leetcode.com/problems/${problem.slug}/`
    return `https://leetcode.com/problemset/?search=${encodeURIComponent(problem.title || '')}`
  }, [problem.leetcode_url, problem.slug, problem.title])

  return (
    <div className={`striver-v2-problem-row ${isThis ? 'is-queuing' : ''}`}>
      {/* Left: Index + Title */}
      <div className="striver-v2-problem-left">
        <span className="striver-v2-problem-idx">
          #{String(globalIdx + 1).padStart(2, '0')}
        </span>
        <span className="striver-v2-problem-title" title={problem.title}>
          {problem.title}
        </span>
      </div>

      {/* Right: Verified Badge + LeetCode Link + 1v1 Battle Action */}
      <div className="striver-v2-problem-right">
        <span className="striver-v2-verified-badge hidden sm:inline-flex">
          <IconCheck size={11} />
          <span>Verified</span>
        </span>

        {/* LeetCode practice link */}
        <a
          href={leetCodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="striver-v2-lc-link"
          title={`Practice "${problem.title}" on LeetCode`}
          onClick={(e) => e.stopPropagation()}
        >
          <IconLeetCode size={13} />
          <span className="hidden sm:inline">LeetCode</span>
        </a>

        {/* Discuss Room link */}
        {problem.slug && (
          <Link
            to={`/discuss/${problem.slug}`}
            className="striver-v2-lc-link"
            title={`Discuss "${problem.title}"`}
            onClick={(e) => e.stopPropagation()}
          >
            <IconMessageSquare size={13} />
            <span className="hidden sm:inline">Discuss</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => onBattleProblem(problem)}
          disabled={isQueuing}
          className={`striver-v2-battle-btn ${isThis ? 'is-queuing' : ''}`}
          style={isGated ? {
            borderColor: 'rgba(255, 214, 150, 0.45)',
            color: 'var(--gold, #ffd696)',
            background: 'rgba(255, 214, 150, 0.06)'
          } : undefined}
          title={isGated ? 'AlgoArena Premium required to battle on this problem' : '1v1 Battle'}
        >
          {isGated ? <IconLock size={11} /> : <IconSwords size={11} />}
          <span>{isThis ? 'Queuing…' : '1v1 Battle'}</span>
        </button>
      </div>
    </div>
  )
}

// ── Difficulty Subsection (Easy / Medium / Hard) ───────────────────
function DiffSection({ subsection, startIdx, onBattleProblem, queuingProblemId, isQueuing, searchQuery, isGated = false, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0)
  const isOpen = isSearchActive ? true : open

  const problems = useMemo(() => {
    const probs = subsection.problems || []
    if (!searchQuery) return probs
    const q = searchQuery.toLowerCase().trim()
    return probs.filter(p => p.title.toLowerCase().includes(q))
  }, [subsection.problems, searchQuery])

  if (problems.length === 0) return null

  const diffKey = subsection.title.toLowerCase().includes('easy')
    ? 'easy'
    : subsection.title.toLowerCase().includes('medium')
      ? 'medium'
      : 'hard'
  const cfg = DIFF_CONFIG[diffKey] || DIFF_CONFIG.easy

  return (
    <div className="striver-v2-diff-section">
      <button
        type="button"
        onClick={() => setOpen(o => isSearchActive ? !isOpen : !o)}
        className="striver-v2-diff-header"
      >
        <div className="striver-v2-diff-left">
          <span className="striver-v2-diff-dot" style={{ background: cfg.dot }} />
          <span className="striver-v2-diff-title">{subsection.title}</span>
          <span className="striver-v2-diff-count">{problems.length}</span>
        </div>
        <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}>
          <IconChevronDown size={13} className="text-muted" />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="diff-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="striver-v2-diff-body">
              {problems.map((problem, i) => (
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  globalIdx={startIdx + i}
                  onBattleProblem={onBattleProblem}
                  queuingProblemId={queuingProblemId}
                  isQueuing={isQueuing}
                  isGated={isGated}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Topic Step Card (e.g. Arrays, Binary Search) ───────────────────
function TopicStepCard({
  step,
  onBattleProblem,
  onBattleRandom,
  queuingProblemId,
  isQueuing,
  searchQuery,
  defaultOpen = false,
  isGated = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [showDiffMenu, setShowDiffMenu] = useState(false)
  const dropdownRef = useRef(null)
  const lastOpenedAt = useRef(0)

  useEffect(() => {
    if (!showDiffMenu) return
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDiffMenu(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [showDiffMenu])

  const handleMouseEnter = () => {
    lastOpenedAt.current = Date.now()
    setShowDiffMenu(true)
  }

  const handleMouseLeave = () => {
    setShowDiffMenu(false)
  }

  const handleButtonClick = (e) => {
    e.stopPropagation()
    const timeSinceHover = Date.now() - lastOpenedAt.current
    if (showDiffMenu && timeSinceHover > 400) {
      setShowDiffMenu(false)
    } else {
      setShowDiffMenu(true)
    }
  }

  const hasMatchingProblems = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return false
    const q = searchQuery.toLowerCase().trim()
    return (step.subsections || []).some(sub =>
      (sub.problems || []).some(p => p.title.toLowerCase().includes(q))
    )
  }, [step.subsections, searchQuery])

  const isOpen = (searchQuery && searchQuery.trim().length > 0) ? hasMatchingProblems : open

  const allProblems = useMemo(() => {
    return (step.subsections || []).flatMap(sub => sub.problems || [])
  }, [step.subsections])

  const totalProblems = allProblems.length

  const easyCount = useMemo(() => {
    return allProblems.filter(p => p.difficulty === 'easy').length
  }, [allProblems])

  const mediumCount = useMemo(() => {
    return allProblems.filter(p => p.difficulty === 'medium').length
  }, [allProblems])

  const hardCount = useMemo(() => {
    return allProblems.filter(p => p.difficulty === 'hard').length
  }, [allProblems])

  const availableDiffs = useMemo(() => {
    const list = []
    if (easyCount > 0) list.push({ id: 'easy', label: 'Easy', count: easyCount, dot: '#22c55e' })
    if (mediumCount > 0) list.push({ id: 'medium', label: 'Medium', count: mediumCount, dot: '#f59e0b' })
    if (hardCount > 0) list.push({ id: 'hard', label: 'Hard', count: hardCount, dot: '#f43f5e' })
    return list
  }, [easyCount, mediumCount, hardCount])

  const topicLabel = useMemo(() => {
    const raw = (step.topic || step.title || '').toLowerCase()
    if (raw.includes('binary search') || raw.includes('binary-search')) return 'Binary Search'
    if (raw.includes('array')) return 'Arrays'
    return (step.title || step.topic || '').replace(/^Step\s*\d+\s*:\s*(Solve\s+Problems\s+on\s+)?/i, '').trim()
  }, [step.topic, step.title])

  let runningIdx = 0

  return (
    <div className={`striver-v2-topic-card ${showDiffMenu ? 'has-dropdown-open' : ''}`}>
      {/* Topic Card Header (Clickable across entire bar to expand/collapse) */}
      <div
        className="striver-v2-topic-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
        aria-expanded={isOpen}
      >
        <div className="striver-v2-topic-left">
          <div className="striver-v2-topic-icon-box">
            <IconCode size={16} />
          </div>

          <div className="min-w-0">
            <h3 className="striver-v2-topic-title">{topicLabel}</h3>
            <div className="striver-v2-topic-meta">
              {easyCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                  <span>{easyCount} Easy</span>
                </span>
              )}
              {mediumCount > 0 && (
                <>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span>{mediumCount} Medium</span>
                  </span>
                </>
              )}
              {hardCount > 0 && (
                <>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }} />
                    <span>{hardCount} Hard</span>
                  </span>
                </>
              )}
              <span>·</span>
              <span>{totalProblems} total</span>
            </div>
          </div>
        </div>

        {/* Right Actions: Random Duel & Toggle */}
        <div className="striver-v2-topic-actions" onClick={e => e.stopPropagation()}>
          {/* Random Battle Dropdown */}
          <div
            ref={dropdownRef}
            className="striver-v2-random-wrap"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={handleButtonClick}
              className="striver-v2-random-btn"
              aria-haspopup="true"
              aria-expanded={showDiffMenu}
              style={isGated ? {
                borderColor: 'rgba(255, 214, 150, 0.45)',
                color: 'var(--gold, #ffd696)',
                background: 'rgba(255, 214, 150, 0.06)'
              } : undefined}
            >
              {isGated ? <IconLock size={12} /> : <IconShuffle size={12} />}
              <span>Random Duel</span>
              <div style={{ transform: showDiffMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 120ms ease' }}>
                <IconChevronDown size={11} />
              </div>
            </button>

            <AnimatePresence>
              {showDiffMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="striver-v2-random-dropdown"
                >
                  <div style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--sub, #a2a9b8)', borderBottom: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))', marginBottom: '4px' }}>
                    Select Difficulty
                  </div>
                  {availableDiffs.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setShowDiffMenu(false)
                        onBattleRandom(step.topic || 'arrays', d.id)
                      }}
                      className="striver-v2-random-item"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.dot }} />
                        <span>{d.label}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--sub, #a2a9b8)' }}>
                        {d.count}
                      </span>
                    </button>
                  ))}

                  <div style={{ borderTop: '1px solid var(--hair-subtle, rgba(196, 214, 232, 0.08))', paddingTop: '4px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDiffMenu(false)
                        const randomDiff = availableDiffs[Math.floor(Math.random() * availableDiffs.length)]?.id || 'easy'
                        onBattleRandom(step.topic || 'arrays', randomDiff)
                      }}
                      className="striver-v2-random-item"
                    >
                      <span>Any Difficulty</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--sub, #a2a9b8)' }}>
                        Auto Pick
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Accordion Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(o => !o)
            }}
            className="striver-v2-toggle-btn"
            aria-label={isOpen ? 'Collapse topic' : 'Expand topic'}
          >
            <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}>
              <IconChevronDown size={14} />
            </div>
          </button>
        </div>
      </div>

      {/* Topic Subsections */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="step-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="striver-v2-topic-body">
              {(step.subsections || []).map((sub, si) => {
                const startIdx = runningIdx
                runningIdx += (sub.problems || []).length
                // Only Easy (first) subsection is open by default; Medium & Hard remain collapsed
                const isEasyDefaultOpen = (si === 0)
                return (
                  <DiffSection
                    key={si}
                    subsection={sub}
                    startIdx={startIdx}
                    defaultOpen={isEasyDefaultOpen}
                    onBattleProblem={onBattleProblem}
                    queuingProblemId={queuingProblemId}
                    isQueuing={isQueuing}
                    searchQuery={searchQuery}
                    isGated={isGated}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main StriverSheetView Component ────────────────────────────────
export default function StriverSheetView({
  striverData = [],
  loading = false,
  onBattleProblem,
  onBattleRandom,
  queuingProblemId,
  isQueuing = false,
  isGated = false,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const dataToUse = (striverData && striverData.length > 0 && striverData[0]?.subsections?.length > 0)
    ? striverData
    : DEFAULT_STRIVER_CURRICULUM

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="lobby-v2-status-dot is-connected is-pulsing" style={{ width: '10px', height: '10px' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sub, #a2a9b8)' }}>
            Loading Curriculum…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="striver-v2-wrap">
      {/* Global Search Bar */}
      <div className="striver-v2-search-wrap">
        <IconSearch size={13} className="striver-v2-search-icon" />
        <input
          type="text"
          placeholder="Search problems by name…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="striver-v2-search-input"
          aria-label="Search problems by name"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="striver-v2-search-clear"
            aria-label="Clear problem search"
          >
            <IconClose size={12} />
          </button>
        )}
      </div>

      {/* Curriculum Topic Steps */}
      {dataToUse.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--hair-muted, rgba(255, 255, 255, 0.08))', borderRadius: '4px', background: 'var(--bg-1, #262626)' }}>
          <IconBook size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5, color: 'var(--sub, #a2a9b8)' }} />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #ffffff)', margin: '0 0 4px 0' }}>
            No curriculum loaded
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--sub, #a2a9b8)', margin: 0 }}>
            Check back soon.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {dataToUse.map((step, idx) => {
            const isArrays = (step.topic === 'arrays') || (step.id && step.id.includes('array')) || idx === 0
            return (
              <TopicStepCard
                key={step.id}
                step={step}
                defaultOpen={isArrays}
                onBattleProblem={onBattleProblem}
                onBattleRandom={onBattleRandom}
                queuingProblemId={queuingProblemId}
                isQueuing={isQueuing}
                searchQuery={searchQuery}
                isGated={isGated}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
