/**
 * src/components/mascot/mascotStorage.js
 *
 * Thin wrappers around localStorage / sessionStorage.
 * All calls wrapped in try/catch; falls back to an in-memory store
 * when storage is blocked (private browsing, etc.).
 */

// ── In-memory fallback ────────────────────────────────────────────────────────
const mem = {}

function safeGet(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return mem[key] ?? null
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    mem[key] = value
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    delete mem[key]
  }
}

// ── sessionStorage helpers (tips shown this session) ─────────────────────────
const SESSION_TIPS_KEY  = 'mascot.tipsShown'
const SESSION_COUNT_KEY = 'mascot.tipCount'

export function getSessionTipsShown() {
  try {
    return JSON.parse(safeGet(sessionStorage, SESSION_TIPS_KEY) || '[]')
  } catch {
    return []
  }
}

export function markTipShown(tipId) {
  const shown = getSessionTipsShown()
  if (!shown.includes(tipId)) {
    shown.push(tipId)
    safeSet(sessionStorage, SESSION_TIPS_KEY, JSON.stringify(shown))
  }
  const count = getTipCount()
  safeSet(sessionStorage, SESSION_COUNT_KEY, String(count + 1))
}

export function getTipCount() {
  return parseInt(safeGet(sessionStorage, SESSION_COUNT_KEY) || '0', 10)
}

// ── localStorage helpers (persistent preferences) ────────────────────────────
const LS_HIDDEN_KEY     = 'mascot.hidden'
const LS_NO_TIPS_KEY    = 'mascot.noTips'
const LS_TOUR_DONE_KEY  = 'mascot.tourDone'
const LS_FIRST_VISIT    = 'mascot.firstVisitDone'

export function getMascotHidden() {
  return safeGet(localStorage, LS_HIDDEN_KEY) === 'true'
}

export function setMascotHidden(val) {
  safeSet(localStorage, LS_HIDDEN_KEY, val ? 'true' : 'false')
}

export function getNoTips() {
  return safeGet(localStorage, LS_NO_TIPS_KEY) === 'true'
}

export function setNoTips(val) {
  safeSet(localStorage, LS_NO_TIPS_KEY, val ? 'true' : 'false')
}

export function getTourDone() {
  return safeGet(localStorage, LS_TOUR_DONE_KEY) === 'true'
}

export function setTourDone() {
  safeSet(localStorage, LS_TOUR_DONE_KEY, 'true')
}

export function getFirstVisitDone() {
  return safeGet(localStorage, LS_FIRST_VISIT) === 'true'
}

export function setFirstVisitDone() {
  safeSet(localStorage, LS_FIRST_VISIT, 'true')
}

export function resetSession() {
  safeRemove(sessionStorage, SESSION_TIPS_KEY)
  safeRemove(sessionStorage, SESSION_COUNT_KEY)
}
