/**
 * src/components/mascot/tourRules.test.js
 *
 * Unit tests verifying Phase C Tour stops and Event reaction templates.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  TOUR_STOPS,
  TOUR_INTRO_TEXT,
  TOUR_CLOSING_TEXT,
  EVENT_TIPS,
  MASCOT_NAME,
} from '../../content/mascot.js'

describe('Phase C Tour and Event Reactions', () => {
  it('has exactly 5 stops in the tour sequence', () => {
    assert.strictEqual(TOUR_STOPS.length, 5)
  })

  it('sequences through correct section IDs in order', () => {
    const expectedSections = [
      'section-duel',
      'section-how-it-works',
      'section-ratings',
      'section-sandbox',
      'section-leaderboard',
    ]

    TOUR_STOPS.forEach((stop, idx) => {
      assert.strictEqual(stop.stopIndex, idx + 1)
      assert.strictEqual(stop.total, 5)
      assert.strictEqual(stop.sectionId, expectedSections[idx])
      assert.ok(stop.text.length > 10, 'stop text must be descriptive')
      assert.ok(stop.text.length <= 110, 'stop text must fit in 2 lines')
    })
  })

  it('provides intro and closing lines that follow voice guidelines', () => {
    assert.ok(TOUR_INTRO_TEXT.includes(MASCOT_NAME))
    assert.ok(TOUR_INTRO_TEXT.includes('30 second'))
    assert.ok(TOUR_CLOSING_TEXT.includes('Good luck in the arena'))
  })

  it('provides event reaction templates for demo duel, calculator, and language tabs', () => {
    // Demo duel verdict
    const leftVerdict = EVENT_TIPS.demoDuelVerdict('left')
    assert.strictEqual(leftVerdict.text, 'The left side finished first.')
    const rightVerdict = EVENT_TIPS.demoDuelVerdict('right')
    assert.strictEqual(rightVerdict.text, 'The right side finished first.')

    // Calculator change
    assert.strictEqual(
      EVENT_TIPS.calculatorChanged.text,
      'A win against a higher rated rival earns more points.'
    )

    // Language tab click
    assert.strictEqual(
      EVENT_TIPS.languageTabClicked.text,
      'Same logic, different syntax.'
    )
  })
})

