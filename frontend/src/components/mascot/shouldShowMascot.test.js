/**
 * src/components/mascot/shouldShowMascot.test.js
 *
 * Unit tests for shouldShowMascot -- run with vitest or jest.
 * No DOM, no React, no async.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shouldShowMascot } from './shouldShowMascot.js'

const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
})

describe('shouldShowMascot', () => {
  // ── Blocked routes ────────────────────────────────────────────────────────
  it('hides on /match/:roomId', () => {
    expect(shouldShowMascot('/match/abc123', {})).toBe(false)
  })

  it('hides on /result', () => {
    expect(shouldShowMascot('/result', {})).toBe(false)
  })

  it('hides on /experiences/new (share wizard)', () => {
    expect(shouldShowMascot('/experiences/new', {})).toBe(false)
  })

  it('hides on /experiences/123/edit (share wizard edit)', () => {
    expect(shouldShowMascot('/experiences/123/edit', {})).toBe(false)
  })

  // ── Allowed route (Home only, logged out only) ───────────────────────────
  it('shows on / when logged out', () => {
    expect(shouldShowMascot('/', {})).toBe(true)
    expect(shouldShowMascot('/', { isAuthenticated: false })).toBe(true)
  })

  it('hides on / when authenticated (logged in)', () => {
    expect(shouldShowMascot('/', { isAuthenticated: true })).toBe(false)
  })

  // ── Inner pages default to hidden (mascot stays on home only) ─────────────
  it('hides on /lobby', () => {
    expect(shouldShowMascot('/lobby', {})).toBe(false)
  })

  it('hides on /leaderboard', () => {
    expect(shouldShowMascot('/leaderboard', {})).toBe(false)
  })

  it('hides on /profile', () => {
    expect(shouldShowMascot('/profile', {})).toBe(false)
  })

  it('hides on /profile/:username', () => {
    expect(shouldShowMascot('/profile/alice', {})).toBe(false)
  })

  it('hides on /experiences (list)', () => {
    expect(shouldShowMascot('/experiences', {})).toBe(false)
  })

  it('hides on /experiences/:id (detail)', () => {
    expect(shouldShowMascot('/experiences/123', {})).toBe(false)
  })

  it('hides on /who-we-are', () => {
    expect(shouldShowMascot('/who-we-are', {})).toBe(false)
  })

  // ── App state guards ──────────────────────────────────────────────────────
  it('hides when auth dialog is open', () => {
    expect(shouldShowMascot('/', { authDialogOpen: true })).toBe(false)
  })

  it('hides when mobile menu is open', () => {
    expect(shouldShowMascot('/', { mobileMenuOpen: true })).toBe(false)
  })

  it('hides when searching for match', () => {
    expect(shouldShowMascot('/lobby', { isSearchingMatch: true })).toBe(false)
  })

  it('hides when in a live match', () => {
    expect(shouldShowMascot('/lobby', { isInMatch: true })).toBe(false)
  })

  it('hides when mascotHidden is true', () => {
    expect(shouldShowMascot('/', { mascotHidden: true })).toBe(false)
  })

  it('hides when mascotDebugOff is true', () => {
    expect(shouldShowMascot('/', { mascotDebugOff: true })).toBe(false)
  })

  // ── Unknown route defaults to hidden ─────────────────────────────────────
  it('hides on /unknown-route', () => {
    expect(shouldShowMascot('/unknown-route', {})).toBe(false)
  })
})
