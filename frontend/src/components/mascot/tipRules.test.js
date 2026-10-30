/**
 * src/components/mascot/tipRules.test.js
 *
 * Unit tests verifying all Phase B tip system rules and limits.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SECTION_TIPS,
  MAX_TIPS_PER_SESSION,
  MIN_SECONDS_BETWEEN_TIPS,
  SECTION_VISIBILITY_THRESHOLD,
  SCROLL_SETTLE_MS,
  BUBBLE_AUTO_DISMISS_DESKTOP_MS,
  BUBBLE_AUTO_DISMISS_MOBILE_MS,
} from '../../content/mascot.js'

describe('Phase B Tip System Rules & Limits', () => {
  it('enforces maximum 6 tips per session', () => {
    assert.strictEqual(MAX_TIPS_PER_SESSION, 6)
  })

  it('enforces at least 12 seconds cooldown between tips', () => {
    assert.strictEqual(MIN_SECONDS_BETWEEN_TIPS, 12)
  })

  it('enforces section visibility threshold of 55%', () => {
    assert.strictEqual(SECTION_VISIBILITY_THRESHOLD, 0.55)
  })

  it('enforces scroll settle delay of 600ms', () => {
    assert.strictEqual(SCROLL_SETTLE_MS, 600)
  })

  it('enforces auto-dismiss: 7s desktop and 5s mobile', () => {
    assert.strictEqual(BUBBLE_AUTO_DISMISS_DESKTOP_MS, 7000)
    assert.strictEqual(BUBBLE_AUTO_DISMISS_MOBILE_MS, 5000)
  })

  it('has valid copy and structure for all section tips', () => {
    assert.ok(SECTION_TIPS.length >= 8)
    for (const tip of SECTION_TIPS) {
      assert.ok(tip.id, 'tip must have id')
      assert.ok(tip.text, 'tip must have text')
      assert.ok(tip.text.length <= 110, `tip text too long: ${tip.text}`)
      assert.ok(tip.selector, 'tip must have DOM selector')
    }
  })

  it('checks finalCall tip has loggedOut condition', () => {
    const finalTip = SECTION_TIPS.find(t => t.id === 'finalCall')
    assert.ok(finalTip)
    assert.strictEqual(finalTip.condition, 'loggedOut')
  })
})

