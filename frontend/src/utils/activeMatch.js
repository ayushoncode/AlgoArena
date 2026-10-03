/**
 * utils/activeMatch.js
 *
 * Persists the user's currently-running match in localStorage so that if the
 * tab is closed accidentally, reopening the site sends them straight back to
 * the match (before the 30s server-side forfeit timer expires).
 */
const KEY = 'aa_active_match'
const MAX_AGE_MS = 40 * 60 * 1000 // matches are 30 min; give some buffer

export function setActiveMatch(roomId, userId) {
  if (!roomId) return
  try {
    const prev = getActiveMatch()
    const ts = prev?.roomId === roomId ? prev.ts : Date.now()
    localStorage.setItem(KEY, JSON.stringify({ roomId, userId: userId ?? null, ts }))
  } catch { }
}

export function getActiveMatch() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.roomId || Date.now() - (data.ts || 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearActiveMatch(roomId) {
  try {
    const cur = getActiveMatch()
    if (!roomId || !cur || cur.roomId === roomId) localStorage.removeItem(KEY)
  } catch { }
}
