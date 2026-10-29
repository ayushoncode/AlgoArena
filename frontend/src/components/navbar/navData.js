import api from '../../utils/api'

/**
 * navData.js — Cached Data Fetchers & Clean Helpers for AlgoArena Navbar
 * 
 * Rules:
 * - Read-only GET requests only
 * - 60-second caching to prevent redundant queries
 * - No polling intervals
 */

let cachedDaily = null
let dailyTimestamp = 0

export async function getDailyChallenge() {
  const now = Date.now()
  if (cachedDaily && now - dailyTimestamp < 60_000) {
    return cachedDaily
  }
  try {
    const res = await api.get('/api/problems/daily')
    if (res?.data) {
      cachedDaily = res.data
      dailyTimestamp = Date.now()
      return cachedDaily
    }
  } catch (err) {
    console.error('[Navbar] Error fetching daily problem:', err)
  }
  return cachedDaily
}

let cachedStreakData = null
let streakTimestamp = 0

/**
 * Calculates current streak and best streak deterministically from match/elo history
 * Matches exact logic used on the AlgoArena Profile page.
 */
export async function getStreakData() {
  const now = Date.now()
  if (cachedStreakData && now - streakTimestamp < 60_000) {
    return cachedStreakData
  }

  try {
    const res = await api.get('/api/users/me/elo-history')
    const eloHistory = Array.isArray(res?.data) ? res.data : []

    const activeDates = new Set()
    eloHistory.forEach(e => {
      const dt = e.date || e.created_at
      if (dt) {
        try {
          activeDates.add(new Date(dt).toISOString().slice(0, 10))
        } catch { }
      }
    })

    // Check if today's daily question is completed
    let isCompletedToday = false
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    try {
      const daily = await getDailyChallenge()
      const todayLocal = new Date().toLocaleDateString('en-CA')

      if (localStorage.getItem(`aa_daily_done_${todayStr}`) === 'true') {
        isCompletedToday = true
      } else {
        const matchesRes = await api.get('/api/matches').catch(() => null)
        const matches = Array.isArray(matchesRes?.data) ? matchesRes.data : []
        const hasDailyMatch = matches.some(m => {
          const mDate = (m.ended_at || m.started_at || '').slice(0, 10)
          return (
            (mDate === todayStr || mDate === todayLocal) &&
            m.status === 'finished' &&
            m.problem_title === daily?.title
          )
        })
        if (hasDailyMatch) {
          isCompletedToday = true
          localStorage.setItem(`aa_daily_done_${todayStr}`, 'true')
        }
      }
    } catch { }

    if (isCompletedToday) {
      activeDates.add(todayStr)
    }

    if (activeDates.size === 0) {
      cachedStreakData = { current: 0, best: 0, isCompletedToday: false }
      streakTimestamp = Date.now()
      return cachedStreakData
    }

    // 1. Current streak calculation
    let checkDate = null
    if (activeDates.has(todayStr)) {
      checkDate = today
    } else if (activeDates.has(yesterdayStr)) {
      checkDate = yesterday
    }

    let currentStreak = 0
    if (checkDate) {
      let curr = new Date(checkDate)
      for (let i = 0; i < 365; i++) {
        const dStr = curr.toISOString().slice(0, 10)
        if (activeDates.has(dStr)) {
          currentStreak++
          curr.setDate(curr.getDate() - 1)
        } else {
          break
        }
      }
    }

    // 2. Best streak calculation
    const sorted = Array.from(activeDates).sort()
    let max = 1
    let currRun = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const next = new Date(sorted[i])
      const diffDays = Math.round((next - prev) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        currRun++
        if (currRun > max) max = currRun
      } else if (diffDays > 1) {
        currRun = 1
      }
    }
    const bestStreak = Math.max(max, currentStreak)

    cachedStreakData = { current: currentStreak, best: bestStreak, isCompletedToday }
    streakTimestamp = Date.now()
    return cachedStreakData
  } catch (err) {
    console.error('[Navbar] Error fetching streak data:', err)
    return cachedStreakData || { current: 0, best: 0, isCompletedToday: false, isError: true }
  }
}

/**
 * Display-only helper that strips markdown, code blocks, headings, bold,
 * and extracts the first sentence or two without raw markdown.
 */
export function cleanTaskPreview(raw) {
  if (!raw) return ''
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/^#+\s+.*$/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/Example \d+:[\s\S]*?(?=(Example \d+:|Constraints:|$))/gi, '')
    .replace(/Constraints:[\s\S]*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Match first 1-2 sentences
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s+[^.!?]+[.!?]+)?/)
  if (sentences && sentences[0]) {
    return sentences[0].trim()
  }
  return cleaned.slice(0, 140) + '...'
}

/**
 * Returns formatted HH:MM:SS countdown to midnight UTC (00:00 UTC)
 */
export function getUtcMidnightCountdown() {
  const now = new Date()
  const nextUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0
  ))
  const diffMs = Math.max(0, nextUtc.getTime() - now.getTime())
  const totalSecs = Math.floor(diffMs / 1000)
  const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0')
  const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0')
  const secs = String(totalSecs % 60).padStart(2, '0')
  return `${hours}:${mins}:${secs}`
}

