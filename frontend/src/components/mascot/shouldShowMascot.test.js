/**
 * src/components/mascot/shouldShowMascot.test.js
 *
 * Unit tests for shouldShowMascot -- run with vitest or jest.
 * No DOM, no React, no async.
 */

import { describe, it, expect } from 'vitest'
import { shouldShowMascot } from './shouldShowMascot.js'

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

  // ── Allowed routes ────────────────────────────────────────────────────────
  it('shows on /', () => {
    expect(shouldShowMascot('/', {})).toBe(true)
  })

  it('shows on /lobby', () => {
    expect(shouldShowMascot('/lobby', {})).toBe(true)
  })

  it('shows on /leaderboard', () => {
    expect(shouldShowMascot('/leaderboard', {})).toBe(true)
  })

  it('shows on /profile', () => {
    expect(shouldShowMascot('/profile', {})).toBe(true)
  })

  it('shows on /profile/:username', () => {
    expect(shouldShowMascot('/profile/alice', {})).toBe(true)
  })

  it('shows on /experiences (list)', () => {
    expect(shouldShowMascot('/experiences', {})).toBe(true)
  })

  it('shows on /experiences/:id (detail, not edit)', () => {
    expect(shouldShowMascot('/experiences/123', {})).toBe(true)
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

  it('hides on /who-we-are if not in allow-list', () => {
    // /who-we-are IS in the allow-list per spec
    expect(shouldShowMascot('/who-we-are', {})).toBe(true)
  })
})
