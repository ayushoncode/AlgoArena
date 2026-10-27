/**
 * src/components/mascot/shouldShowMascot.js
 *
 * Pure function -- no side effects, no DOM access.
 * Returns true only when the mascot is allowed to render.
 *
 * appState shape (all optional booleans):
 *   authDialogOpen    -- AuthDialog is mounted and visible
 *   mobileMenuOpen    -- the landing page nav panel is open
 *   isSearchingMatch  -- Lobby is showing the queue/searching overlay
 *   isInMatch         -- user is inside a live match room
 *   demoIsTyping      -- the demo duel auto-type animation is running
 *   inputFocused      -- any <input> or <textarea> has focus
 *   mascotHidden      -- user explicitly hid the mascot
 *   mascotDebugOff    -- ?mascot=off query param is active
 */

import { ALLOWED_ROUTES, BLOCKED_ROUTES } from '../../content/mascot.js'

/**
 * @param {string} route   - current pathname, e.g. '/' or '/match/abc'
 * @param {object} appState - see JSDoc above
 * @returns {boolean}
 */
export function shouldShowMascot(route, appState = {}) {
  // 1. Hard kill-switch from query param (?mascot=off)
  if (appState.mascotDebugOff) return false

  // 2. User explicitly hid the mascot
  if (appState.mascotHidden) return false

  // 3. Blocked route patterns (match room, result, wizard forms)
  for (const pattern of BLOCKED_ROUTES) {
    if (pattern.test(route)) return false
  }

  // 4. Only show on explicitly allowed routes
  // For profile/:username and /experiences/:id, normalise to prefix
  const normRoute = normaliseRoute(route)
  if (!ALLOWED_ROUTES.has(normRoute)) return false

  // 5. State guards
  if (appState.authDialogOpen) return false
  if (appState.mobileMenuOpen) return false
  if (appState.isSearchingMatch) return false
  if (appState.isInMatch) return false

  return true
}

/**
 * Map dynamic routes back to their canonical allow-list key.
 * e.g. '/profile/alice' -> '/profile'
 *      '/experiences/123' -> '/experiences'
 */
function normaliseRoute(route) {
  if (route.startsWith('/profile')) return '/profile'
  if (route.startsWith('/experiences')) return '/experiences'
  return route
}
