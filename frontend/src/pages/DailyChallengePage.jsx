import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import SearchingOverlayV2 from './Lobby/SearchingOverlayV2'
import MatchFoundOverlayV2 from './Lobby/MatchFoundOverlayV2'
import { parseLeetCodeDescription, renderInline } from '../components/LeetCodeProblemView'
import {
  IconFlame,
  IconCheck,
  IconClock,
  IconSwords,
  IconTrophy,
  IconCode
} from '../components/icons'
import { getDailyChallenge, getStreakData, getUtcMidnightCountdown } from '../components/navbar/navData'

/**
 * DailyChallengePage — Dedicated Full Page for Today's Algorithmic Challenge
 * Route: /daily
 * Features:
 * - Shows only today's daily question with clean markdown-parsed description, examples, and constraints
 * - Direct matchmaking queue on the page (no redirecting to Lobby) with SearchingOverlay and MatchFoundOverlay
 * - Live countdown to 00:00 UTC
 * - Interactive streak status with glowing flame when completed today
 */
export default function DailyChallengePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { emit, on, off } = useSocket()

  const [dailyProblem, setDailyProblem] = useState(null)
  const [streakData, setStreakData] = useState({ current: 0, best: 0, isCompletedToday: false })
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(getUtcMidnightCountdown)
  const [showHints, setShowHints] = useState(false)
  const [queuing, setQueuing] = useState(false)
  const [matchFoundData, setMatchFoundData] = useState(null)

  // Live UTC midnight countdown
  useEffect(() => {
    setCountdown(getUtcMidnightCountdown())
    const interval = setInterval(() => {
      setCountdown(getUtcMidnightCountdown())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Load daily problem and user streak
  useEffect(() => {
    let unmounted = false
    setLoading(true)

    Promise.all([
      getDailyChallenge(),
      isAuthenticated ? getStreakData() : Promise.resolve({ current: 0, best: 0, isCompletedToday: false })
    ])
      .then(([problem, streak]) => {
        if (unmounted) return
        setDailyProblem(problem)
        if (streak) setStreakData(streak)
      })
      .catch(err => {
        console.error('[DailyPage] Error loading data:', err)
      })
      .finally(() => {
        if (!unmounted) setLoading(false)
      })

    return () => {
      unmounted = true
    }
  }, [isAuthenticated])

  // Socket listener for matchmaking
  useEffect(() => {
    function onMatchFound(data) {
      console.log('[DailyPage] match_found →', data?.roomId)
      setQueuing(false)
      setMatchFoundData(data)
    }

    on('match_found', onMatchFound)
    return () => off('match_found', onMatchFound)
  }, [on, off])

  // Leave queue on component unmount if currently searching
  useEffect(() => {
    return () => {
      try {
        emit('leave_queue')
      } catch { }
    }
  }, [emit])

  const title = dailyProblem?.title || "Today's Algorithmic Problem"
  const topic = dailyProblem?.topic || 'general'
  const difficulty = (dailyProblem?.difficulty || 'medium').toLowerCase()
  const description = dailyProblem?.description || ''

  const isCompletedToday = streakData?.isCompletedToday || false
  const currentStreak = streakData?.current || 0
  const bestStreak = streakData?.best || 0
  const isGlowing = isCompletedToday && currentStreak > 0

  // Parse markdown description into paragraphs, examples, constraints, hints
  const { paragraphs, examples, constraints, hints: parsedHints } = useMemo(() => {
    if (!description) {
      return { paragraphs: [], examples: [], constraints: [], hints: [] }
    }
    return parseLeetCodeDescription(
      description,
      dailyProblem?.sample_input,
      dailyProblem?.sample_output
    )
  }, [description, dailyProblem?.sample_input, dailyProblem?.sample_output])

  const allHints = useMemo(() => {
    const fromProblem = Array.isArray(dailyProblem?.hints)
      ? dailyProblem.hints
      : typeof dailyProblem?.hints === 'string' && dailyProblem.hints.trim()
        ? [dailyProblem.hints]
        : []
    const fromDesc = parsedHints || []
    return Array.from(new Set([...fromProblem, ...fromDesc].map(h => (typeof h === 'string' ? h.trim() : h)))).filter(Boolean)
  }, [dailyProblem?.hints, parsedHints])

  const diffColor =
    difficulty === 'easy'
      ? 'var(--ok, #10b981)'
      : difficulty === 'hard'
        ? 'var(--bad, #f43f5e)'
        : 'var(--warn, #f59e0b)'

  const diffBg =
    difficulty === 'easy'
      ? 'rgba(16, 185, 129, 0.12)'
      : difficulty === 'hard'
        ? 'rgba(244, 63, 94, 0.12)'
        : 'rgba(245, 158, 11, 0.12)'

  function handleStartDuel() {
    if (!isAuthenticated) {
      navigate('/?auth=login')
      return
    }
    if (!dailyProblem) return
    setQueuing(true)
    emit('join_queue', {
      topic: dailyProblem.topic,
      difficulty: dailyProblem.difficulty,
      problemId: dailyProblem.id,
    })
  }

  function handleCancelQueue() {
    try {
      emit('leave_queue')
    } catch { }
    setQueuing(false)
  }

  return (
    <div
      className="min-h-screen text-[var(--ink,#ffffff)]"
      style={{
        background: 'var(--bg-0, #02060f)',
        fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)',
        paddingTop: '24px',
        paddingBottom: '80px',
      }}
    >
      {/* Full-screen Matchmaking & Match-Found Overlays right on the /daily page */}
      {matchFoundData ? (
        <MatchFoundOverlayV2
          matchData={matchFoundData}
          onComplete={() => {
            const data = matchFoundData
            setMatchFoundData(null)
            navigate(`/match/${data.roomId}`, {
              state: {
                topic: data.topic,
                difficulty: data.difficulty,
                players: data.players,
                problemId: data.problemId,
              },
            })
          }}
        />
      ) : queuing ? (
        <SearchingOverlayV2
          topic={topic}
          difficulty={difficulty}
          rating={user?.elo_rating || 1200}
          problem={dailyProblem}
          onCancel={handleCancelQueue}
        />
      ) : null}

      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs text-[var(--sub,#a2a9b8)] font-mono">
          <Link
            to="/lobby"
            className="hover:text-[var(--ink,#ffffff)] transition-colors flex items-center gap-1"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Lobby
          </Link>
          <span>/</span>
          <span className="text-[var(--feat,#e2ebf5)]">Daily Challenge</span>
        </div>

        {/* Header Row: Title & Countdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--hair-subtle,rgba(196,214,232,0.08))]">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Daily Quest
              </span>
              <span className="text-xs font-mono text-[var(--sub,#a2a9b8)]">
                Synchronous 1v1 Battle
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded flex items-center gap-2.5"
              style={{
                background: 'var(--bg-1, #060d1c)',
                border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.14))',
              }}
            >
              <IconClock size={16} className="text-[var(--sub,#a2a9b8)]" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-mono text-[var(--sub,#a2a9b8)] font-semibold tracking-wider">
                  Resets in
                </span>
                <span className="text-xs font-mono font-bold text-[var(--ink,#ffffff)]">
                  {countdown}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-start">
          {/* Left Column: Problem Details & Samples */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="px-2.5 py-1 rounded text-xs font-mono font-bold capitalize"
                style={{
                  color: diffColor,
                  background: diffBg,
                  border: `1px solid ${diffColor}40`,
                }}
              >
                {difficulty}
              </span>
              <span
                className="px-2.5 py-1 rounded text-xs font-mono text-[var(--sub,#a2a9b8)]"
                style={{
                  background: 'var(--bg-1, #060d1c)',
                  border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.14))',
                }}
              >
                Topic: {topic}
              </span>

              {/* Completion status pill */}
              {isCompletedToday ? (
                <span
                  className="px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5"
                  style={{
                    color: 'var(--ok, #10b981)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <IconCheck size={14} /> Completed for Today
                </span>
              ) : (
                <span
                  className="px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5"
                  style={{
                    color: 'var(--warn, #f59e0b)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <IconClock size={14} /> Pending Today
                </span>
              )}
            </div>

            {/* Problem Description Card (Clean Markdown Rendered) */}
            <div
              className="p-6 rounded-lg"
              style={{
                background: 'var(--bg-1, #060d1c)',
                border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.14))',
              }}
            >
              <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--sub,#a2a9b8)] font-bold mb-4">
                Problem Description
              </h2>

              {/* Statement Paragraphs */}
              <div
                className="text-sm leading-relaxed text-[var(--feat,#e2ebf5)] space-y-3.5"
                style={{ fontFamily: 'var(--font-sans, "Sora Variable", sans-serif)' }}
              >
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => {
                    if (p.type === 'code') {
                      return (
                        <div
                          key={idx}
                          className="rounded-lg p-3 my-2 font-mono text-xs overflow-x-auto"
                          style={{
                            background: 'var(--bg-2, #0a1428)',
                            border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.12))',
                            color: 'var(--ink, #ffffff)',
                          }}
                        >
                          <pre className="whitespace-pre">{p.content}</pre>
                        </div>
                      )
                    }
                    if (p.type === 'image') {
                      return (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-lg my-3 border inline-block"
                          style={{ borderColor: 'var(--hair-muted, rgba(196, 214, 232, 0.14))' }}
                        >
                          <img
                            src={p.url}
                            alt={p.alt || 'Problem illustration'}
                            className="max-w-full h-auto max-h-64 object-contain rounded"
                          />
                        </div>
                      )
                    }
                    if (p.type === 'list_item') {
                      return (
                        <li key={idx} className="ml-5 list-disc pl-1 leading-relaxed text-sm">
                          {renderInline(p.content)}
                        </li>
                      )
                    }
                    return (
                      <p key={idx} className="leading-relaxed">
                        {renderInline(p.content)}
                      </p>
                    )
                  })
                ) : (
                  <p className="leading-relaxed">
                    {renderInline(description || 'Loading challenge description...')}
                  </p>
                )}
              </div>

              {/* Formatted Examples */}
              {examples.length > 0 && (
                <div className="mt-8 space-y-5">
                  {examples.map((ex, idx) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--sub,#a2a9b8)]">
                        Example {ex.num || idx + 1}:
                      </h3>

                      <div
                        className="rounded-lg p-4 font-mono text-xs space-y-2"
                        style={{
                          background: 'var(--bg-2, #0a1428)',
                          border: '1px solid var(--hair-muted, rgba(196, 214, 232, 0.12))',
                        }}
                      >
                        {ex.diagram && (
                          <div
                            className="pb-3 mb-2 font-mono text-xs leading-tight overflow-x-auto border-b"
                            style={{ borderColor: 'var(--hair-muted, rgba(196, 214, 232, 0.1))' }}
                          >
                            <pre className="whitespace-pre text-[var(--ink,#ffffff)]">{ex.diagram}</pre>
                          </div>
                        )}

                        {ex.input && (
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-[var(--sub,#a2a9b8)] font-sans text-xs">
                              Input:
                            </span>
                            <code className="text-[var(--ink,#ffffff)] font-mono break-all">
                              {ex.input}
                            </code>
                          </div>
                        )}

                        {ex.output && (
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-[var(--sub,#a2a9b8)] font-sans text-xs">
                              Output:
                            </span>
                            <code className="text-[var(--ok,#10b981)] font-mono font-bold break-all">
                              {ex.output}
                            </code>
                          </div>
                        )}

                        {ex.explanation && (
                          <div className="pt-1.5 space-y-1">
                            <span className="font-bold text-[var(--sub,#a2a9b8)] font-sans text-xs block">
                              Explanation:
                            </span>
                            <div className="text-[var(--sub,#a2a9b8)] font-sans text-xs leading-relaxed whitespace-pre-line">
                              {renderInline(ex.explanation)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints Section */}
              {constraints.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[var(--hair-subtle,rgba(196,214,232,0.08))] space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--sub,#a2a9b8)]">
                    Constraints:
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[var(--sub,#a2a9b8)] pl-1">
                    {constraints.map((c, idx) => {
                      let content = (c || '').trim()
                      // Fix odd stray trailing backtick if present
                      const backtickCount = (content.match(/`/g) || []).length
                      if (backtickCount % 2 !== 0 && content.endsWith('`')) {
                        content = content.slice(0, -1).trim()
                      }
                      if (!content.includes('`')) {
                        if (
                          /^[0-9\s\-+*^≤≥<>=a-zA-Z_\[\].]+$/.test(content) &&
                          (/[<>=≤≥]/.test(content) || content.includes('length'))
                        ) {
                          content = `\`${content}\``
                        }
                      }
                      return (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="text-[var(--sub,#a2a9b8)] text-[10px] mt-0.5 shrink-0">•</span>
                          <div className="flex-1 text-[var(--sub,#a2a9b8)] font-mono text-xs">
                            {renderInline(content)}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Hints Section */}
              {allHints.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[var(--hair-subtle,rgba(196,214,232,0.08))] space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowHints((s) => !s)}
                    className="text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <IconCode size={14} />
                    <span>
                      {showHints
                        ? 'Hide Problem Hints'
                        : `Show Problem Hints (${allHints.length})`}
                    </span>
                  </button>

                  {showHints && (
                    <div className="space-y-2 mt-3">
                      {allHints.map((hint, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded text-xs font-sans text-[var(--sub,#a2a9b8)] leading-relaxed"
                          style={{
                            background: 'rgba(245, 158, 11, 0.06)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                          }}
                        >
                          <span className="font-mono font-bold text-amber-400 mr-2">
                            Hint {idx + 1}:
                          </span>
                          {renderInline(hint)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Streak Card & Battle Action Rail */}
          <div className="space-y-6">
            {/* Streak & Status Card */}
            <div
              className="p-6 rounded-lg flex flex-col gap-4"
              style={{
                background: 'var(--bg-1, #060d1c)',
                border: `1px solid ${isGlowing ? 'rgba(245, 158, 11, 0.35)' : 'var(--hair-muted, rgba(196, 214, 232, 0.14))'}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: isGlowing ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-2, #0a1428)',
                    color: isGlowing ? 'var(--warn, #f59e0b)' : (currentStreak > 0 ? 'var(--warn, #f59e0b)' : 'var(--sub, #a2a9b8)'),
                    filter: isGlowing ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.75))' : 'none',
                    border: `1px solid ${isGlowing ? 'rgba(245, 158, 11, 0.4)' : 'var(--hair-muted, rgba(196, 214, 232, 0.15))'}`,
                  }}
                >
                  <IconFlame size={24} filled={isGlowing} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--ink,#ffffff)]">
                    {currentStreak} Day Streak
                  </h3>
                  <p className="text-xs font-mono text-[var(--sub,#a2a9b8)]">
                    Best: {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              <div
                className="p-3 rounded text-xs leading-relaxed"
                style={{
                  background: isGlowing ? 'rgba(16, 185, 129, 0.08)' : 'rgba(196, 214, 232, 0.04)',
                  color: isGlowing ? 'var(--ok, #10b981)' : 'var(--sub, #a2a9b8)',
                  border: `1px solid ${isGlowing ? 'rgba(16, 185, 129, 0.25)' : 'var(--hair-subtle, rgba(196, 214, 232, 0.08))'}`,
                }}
              >
                {isGlowing
                  ? 'Flame is glowing for today! Challenge completed and streak extended.'
                  : currentStreak > 0
                    ? 'Complete today\'s challenge to light up the flame and extend your streak.'
                    : 'Streak is at 0. Win today\'s daily duel to ignite the flame.'}
              </div>

              {/* Mode rules disclaimer */}
              <div className="pt-2 text-xs text-[var(--sub,#a2a9b8)] space-y-1.5 border-t border-[var(--hair-subtle,rgba(196,214,232,0.08))]">
                <div className="flex items-center gap-2">
                  <IconSwords size={13} className="text-sky-400" />
                  <span>Ranked 1v1 duel against live rival</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconTrophy size={13} className="text-amber-400" />
                  <span>Rating stakes: +18 / -18 Elo</span>
                </div>
              </div>

              {/* Primary Duel Launch Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="daily-page-start-btn"
                  onClick={handleStartDuel}
                  disabled={queuing}
                  className="w-full py-3 px-4 rounded font-sans font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{
                    background: '#ffffff',
                    color: '#02060f',
                    border: '1px solid #ffffff',
                  }}
                  onMouseOver={e => { if (!queuing) e.currentTarget.style.background = '#e2ebf5' }}
                  onMouseOut={e => { if (!queuing) e.currentTarget.style.background = '#ffffff' }}
                >
                  <IconSwords size={16} />
                  <span>
                    {queuing
                      ? 'Searching for Rival...'
                      : isCompletedToday
                        ? 'Play Daily Duel Again'
                        : 'Start Daily Duel'}
                  </span>
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/lobby"
                  className="text-xs font-mono text-[var(--sub,#a2a9b8)] hover:text-[var(--ink,#ffffff)] transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  Or choose other topics in Lobby →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
