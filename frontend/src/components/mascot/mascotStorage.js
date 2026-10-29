/**
 * src/components/mascot/mascotStorage.js
 *
 * Thin wrappers around localStorage / sessionStorage.
 * All calls wrapped in try/catch; falls back to an in-memory store
 * when storage is blocked (private browsing, SSR, Node test environment).
 */

// ── In-memory fallback ────────────────────────────────────────────────────────
const mem = {}

function getStorage(type) {
  try {
    if (typeof window !== 'undefined' && window[type]) {
      return window[type]
    }
    if (typeof globalThis !== 'undefined' && globalThis[type]) {
      return globalThis[type]
    }
  } catch {}
  return null
}

function safeGet(type, key) {
  try {
    const s = getStorage(type)
    if (s) return s.getItem(key)
  } catch {}
  return mem[key] ?? null
}

function safeSet(type, key, value) {
  try {
    const s = getStorage(type)
    if (s) {
      s.setItem(key, value)
      return
    }
  } catch {}
  mem[key] = value
}

function safeRemove(type, key) {
  try {
    const s = getStorage(type)
    if (s) {
      s.removeItem(key)
    }
  } catch {}
  delete mem[key]
}

// ── sessionStorage helpers (tips shown this session) ─────────────────────────
const SESSION_TIPS_KEY  = 'mascot.tipsShown'
const SESSION_COUNT_KEY = 'mascot.tipCount'
const SESSION_LAST_TIME = 'mascot.lastTipTime'
const SESSION_LAST_TIP  = 'mascot.lastTip'

export function getSessionTipsShown() {
  try {
    return JSON.parse(safeGet('sessionStorage', SESSION_TIPS_KEY) || '[]')
  } catch {
    return []
  }
}

export function markTipShown(tipId) {
  const shown = getSessionTipsShown()
  if (!shown.includes(tipId)) {
    shown.push(tipId)
    safeSet('sessionStorage', SESSION_TIPS_KEY, JSON.stringify(shown))
  }
  const count = getTipCount()
  safeSet('sessionStorage', SESSION_COUNT_KEY, String(count + 1))
}

export function getTipCount() {
  return parseInt(safeGet('sessionStorage', SESSION_COUNT_KEY) || '0', 10)
}

export function getLastTipTime() {
  return parseInt(safeGet('sessionStorage', SESSION_LAST_TIME) || '0', 10)
}

export function setLastTipTime(ts = Date.now()) {
  safeSet('sessionStorage', SESSION_LAST_TIME, String(ts))
}

export function getLastTip() {
  try {
    const raw = safeGet('sessionStorage', SESSION_LAST_TIP)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setLastTip(tip) {
  if (!tip) safeRemove('sessionStorage', SESSION_LAST_TIP)
  else safeSet('sessionStorage', SESSION_LAST_TIP, JSON.stringify(tip))
}

// ── localStorage helpers (persistent preferences) ────────────────────────────
const LS_HIDDEN_KEY     = 'mascot.hidden'
const LS_NO_TIPS_KEY    = 'mascot.noTips'
const LS_TOUR_DONE_KEY  = 'mascot.tourDone'
const LS_FIRST_VISIT    = 'mascot.firstVisitDone'

export function getMascotHidden() {
  return safeGet('localStorage', LS_HIDDEN_KEY) === 'true'
}

export function setMascotHidden(val) {
  safeSet('localStorage', LS_HIDDEN_KEY, val ? 'true' : 'false')
}

export function getNoTips() {
  return safeGet('localStorage', LS_NO_TIPS_KEY) === 'true'
}

export function setNoTips(val) {
  safeSet('localStorage', LS_NO_TIPS_KEY, val ? 'true' : 'false')
}

export function getTourDone() {
  return safeGet('localStorage', LS_TOUR_DONE_KEY) === 'true'
}

export function setTourDone() {
  safeSet('localStorage', LS_TOUR_DONE_KEY, 'true')
}

export function getFirstVisitDone() {
  return safeGet('localStorage', LS_FIRST_VISIT) === 'true'
}

export function setFirstVisitDone() {
  safeSet('localStorage', LS_FIRST_VISIT, 'true')
}

export function resetSession() {
  safeRemove('sessionStorage', SESSION_TIPS_KEY)
  safeRemove('sessionStorage', SESSION_COUNT_KEY)
  safeRemove('sessionStorage', SESSION_LAST_TIME)
  safeRemove('sessionStorage', SESSION_LAST_TIP)
}
