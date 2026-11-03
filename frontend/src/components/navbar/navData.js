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

const userStreakCache = new Map()

export function clearStreakCache() {
  userStreakCache.clear()
}

/**
 * Remove legacy unscoped aa_daily_done_YYYY-MM-DD keys that were erroneously shared across accounts
 */
function purgeLegacyUnscopedDailyKeys() {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && /^aa_daily_done_\d{4}-\d{2}-\d{2}$/.test(k)) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch { }
}

export function getCurrentUserId(explicitUserId) {
  if (explicitUserId) return String(explicitUserId)
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = localStorage.getItem('aa_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed?.id || parsed?.user_id || parsed?.username || null
    }
  } catch { }
  return null
}

/**
 * Calculates current streak and best streak strictly from Daily Problem completions.
 * Guaranteed isolated per logged-in user account.
 */
export async function getStreakData(explicitUserId) {
  const userId = getCurrentUserId(explicitUserId)
  if (!userId) {
    return { current: 0, best: 0, isCompletedToday: false }
  }

  // Purge any legacy shared keys once
  purgeLegacyUnscopedDailyKeys()

  const now = Date.now()
  const cached = userStreakCache.get(userId)
  if (cached && now - cached.timestamp < 30_000) {
    return cached.data
  }

  try {
    const dailyCompletedDates = new Set()

    // 1. Gather recorded daily challenge completion dates from localStorage for THIS user only
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const prefix = `aa_daily_done_${userId}_`
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith(prefix) && localStorage.getItem(k) === 'true') {
            const dStr = k.slice(prefix.length)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
              dailyCompletedDates.add(dStr)
            }
          }
        }
      } catch { }
    }

    // 2. Fetch today's daily problem and user's match history
    const daily = await getDailyChallenge()
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const todayLocal = today.toLocaleDateString('en-CA')

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    const yesterdayLocal = yesterday.toLocaleDateString('en-CA')

    const matchesRes = await api.get('/api/matches').catch(() => null)
    const matches = Array.isArray(matchesRes?.data) ? matchesRes.data : []

    // 3. Check today's finished matches against today's daily challenge problem
    matches.forEach(m => {
      if (m.status !== 'finished') return
      const rawDate = m.ended_at || m.started_at
      if (!rawDate) return
      const dt = new Date(rawDate)
      if (isNaN(dt.getTime())) return

      const mDateStr = dt.toISOString().slice(0, 10)
      const mDateLocal = dt.toLocaleDateString('en-CA')

      if (
        daily?.title &&
        (mDateStr === todayStr || mDateLocal === todayLocal) &&
        m.problem_title &&
        m.problem_title.toLowerCase() === daily.title.toLowerCase()
      ) {
        dailyCompletedDates.add(todayStr)
        try {
          localStorage.setItem(`aa_daily_done_${userId}_${todayStr}`, 'true')
        } catch { }
      }
    })

    const isCompletedToday = dailyCompletedDates.has(todayStr) || dailyCompletedDates.has(todayLocal)

    if (dailyCompletedDates.size === 0) {
      const result = { current: 0, best: 0, isCompletedToday: false }
      userStreakCache.set(userId, { data: result, timestamp: Date.now() })
      return result
    }

    // 4. Current Daily Streak calculation
    let currentStreak = 0
    let checkDate = null

    if (isCompletedToday) {
      checkDate = today
    } else if (dailyCompletedDates.has(yesterdayStr) || dailyCompletedDates.has(yesterdayLocal)) {
      checkDate = yesterday
    }

    if (checkDate) {
      const curr = new Date(checkDate)
      for (let i = 0; i < 365; i++) {
        const dIso = curr.toISOString().slice(0, 10)
        const dLoc = curr.toLocaleDateString('en-CA')
        if (dailyCompletedDates.has(dIso) || dailyCompletedDates.has(dLoc)) {
          currentStreak++
          curr.setDate(curr.getDate() - 1)
        } else {
          break
        }
      }
    }

    // 5. Best Daily Streak calculation
    const sorted = Array.from(dailyCompletedDates).sort()
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

    const result = { current: currentStreak, best: bestStreak, isCompletedToday }
    userStreakCache.set(userId, { data: result, timestamp: Date.now() })
    return result
  } catch (err) {
    console.error('[Navbar] Error fetching daily streak data:', err)
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

