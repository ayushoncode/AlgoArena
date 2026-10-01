/**
 * useStreak.js — daily activity streak tracker (user-scoped)
 *
 * Stored in localStorage as:
 *   aa_streak_u{userId}_count   — current streak length (days)
 *   aa_streak_u{userId}_last    — ISO date string of last activity (YYYY-MM-DD)
 *   aa_streak_u{userId}_history — JSON array of dates that were active
 */

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

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

export function useStreak(explicitUserId) {
  const { user } = useAuth()
  const userId = explicitUserId || user?.id

  const [streak, setStreak] = useState(0)
  const [playedToday, setPlayedToday] = useState(false)
  const [history, setHistory] = useState(new Set())

  useEffect(() => {
    // Clear old un-scoped legacy items from localStorage so they don't leak across users
    localStorage.removeItem('aa_streak_count')
    localStorage.removeItem('aa_streak_last')
    localStorage.removeItem('aa_streak_history')

    if (!userId) {
      setStreak(0)
      setPlayedToday(false)
      setHistory(new Set())
      return
    }

    const keyPrefix = `aa_streak_u${userId}_`
    const countKey = `${keyPrefix}count`
    const lastKey = `${keyPrefix}last`
    const histKey = `${keyPrefix}history`

    const td = today()
    const yd = yesterday()
    const lastVal = localStorage.getItem(lastKey) || ''
    const countVal = parseInt(localStorage.getItem(countKey) || '0', 10)
    const rawHist = localStorage.getItem(histKey)
    const histArr = rawHist ? JSON.parse(rawHist) : []

    let newCount = countVal
    let newHistory = [...new Set(histArr)]

    if (lastVal === td) {
      setPlayedToday(true)
      if (newCount === 0) newCount = 1
    } else if (lastVal === yd || lastVal === '') {
      newCount = lastVal === '' ? 1 : countVal + 1
      newHistory = [...newHistory, td]
      localStorage.setItem(countKey, String(newCount))
      localStorage.setItem(lastKey, td)
      localStorage.setItem(histKey, JSON.stringify(newHistory))
      setPlayedToday(true)
    } else {
      // gap > 1 day — streak resets to 1 day for today's active visit
      newCount = 1
      newHistory = [td]
      localStorage.setItem(countKey, '1')
      localStorage.setItem(lastKey, td)
      localStorage.setItem(histKey, JSON.stringify(newHistory))
      setPlayedToday(true)
    }

    setStreak(newCount)
    setHistory(new Set(newHistory))
  }, [userId])

  return { streak, playedToday, history, last14: last14Days() }
}
