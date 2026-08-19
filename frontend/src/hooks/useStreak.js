/**
 * useStreak.js — daily activity streak tracker
 *
 * Stored in localStorage as:
 *   aa_streak_count  — current streak length (days)
 *   aa_streak_last   — ISO date string of last activity (YYYY-MM-DD)
 *   aa_streak_history — JSON array of last 14 dates that were active
 *
 * "Active" for now = visited the Lobby that day.
 * Day 43: replace with real match completion events from the backend.
 */

import { useState, useEffect } from 'react'

function today() {
  return new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
}
function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function useStreak() {
  const [streak,  setStreak]  = useState(0)
  const [playedToday, setPlayedToday] = useState(false)
  const [history, setHistory] = useState(new Set())   // set of active date strings

  useEffect(() => {
    const td     = today()
    const yd     = yesterday()
    const stored = {
      count:   parseInt(localStorage.getItem('aa_streak_count') || '0', 10),
      last:    localStorage.getItem('aa_streak_last') || '',
      history: JSON.parse(localStorage.getItem('aa_streak_history') || '[]'),
    }

    let newCount = stored.count
    let newHistory = [...new Set(stored.history)]

    if (stored.last === td) {
      // already counted today — just restore
      setPlayedToday(true)
    } else if (stored.last === yd || stored.last === '') {
      // first visit today — auto-mark as active (lobby visit counts)
      newCount = stored.last === '' ? 1 : stored.count + 1
      newHistory = [...newHistory, td]
      localStorage.setItem('aa_streak_count',   String(newCount))
      localStorage.setItem('aa_streak_last',    td)
      localStorage.setItem('aa_streak_history', JSON.stringify(newHistory))
      setPlayedToday(true)
    } else {
      // gap > 1 day — streak broken
      newCount = 1
      newHistory = [...newHistory, td]
      localStorage.setItem('aa_streak_count',   '1')
      localStorage.setItem('aa_streak_last',    td)
      localStorage.setItem('aa_streak_history', JSON.stringify(newHistory))
      setPlayedToday(true)
    }

    setStreak(newCount)
    setHistory(new Set(newHistory))
  }, [])

  return { streak, playedToday, history, last14: last14Days() }
}
