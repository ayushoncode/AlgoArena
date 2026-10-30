/**
 * src/components/mascot/mascotStorage.test.js
 *
 * Unit tests for mascotStorage functions.
 * Tests persistence and memory fallback.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  getSessionTipsShown,
  markTipShown,
  getTipCount,
  getLastTipTime,
  setLastTipTime,
  getLastTip,
  setLastTip,
  getMascotHidden,
  setMascotHidden,
  getNoTips,
  setNoTips,
  getTourDone,
  setTourDone,
  getFirstVisitDone,
  setFirstVisitDone,
  resetSession,
} from './mascotStorage.js'

describe('mascotStorage', () => {
  beforeEach(() => {
    resetSession()
    setMascotHidden(false)
    setNoTips(false)
  })

  it('tracks session tips shown without duplicates', () => {
    assert.deepStrictEqual(getSessionTipsShown(), [])
    markTipShown('hero')
    assert.deepStrictEqual(getSessionTipsShown(), ['hero'])
    assert.strictEqual(getTipCount(), 1)

    // Repeat same tip doesn't duplicate in shown array
    markTipShown('hero')
    assert.deepStrictEqual(getSessionTipsShown(), ['hero'])
    assert.strictEqual(getTipCount(), 2)

    markTipShown('duel')
    assert.deepStrictEqual(getSessionTipsShown(), ['hero', 'duel'])
    assert.strictEqual(getTipCount(), 3)
  })

  it('records and retrieves last tip time', () => {
    const now = 1700000000000
    setLastTipTime(now)
    assert.strictEqual(getLastTipTime(), now)
  })

  it('stores and retrieves last tip object', () => {
    const tip = { id: 'ratings', text: 'Try the calculator.' }
    setLastTip(tip)
    assert.deepStrictEqual(getLastTip(), tip)
    setLastTip(null)
    assert.strictEqual(getLastTip(), null)
  })

  it('toggles mascot hidden preference', () => {
    assert.strictEqual(getMascotHidden(), false)
    setMascotHidden(true)
    assert.strictEqual(getMascotHidden(), true)
    setMascotHidden(false)
    assert.strictEqual(getMascotHidden(), false)
  })

  it('toggles no tips preference', () => {
    assert.strictEqual(getNoTips(), false)
    setNoTips(true)
    assert.strictEqual(getNoTips(), true)
    setNoTips(false)
    assert.strictEqual(getNoTips(), false)
  })

  it('persists tourDone and firstVisitDone', () => {
    setTourDone()
    assert.strictEqual(getTourDone(), true)

    setFirstVisitDone()
    assert.strictEqual(getFirstVisitDone(), true)
  })

  it('resets session data cleanly', () => {
    markTipShown('hero')
    setLastTipTime(Date.now())
    setLastTip({ id: 'hero', text: 'Hi' })
    resetSession()
    assert.deepStrictEqual(getSessionTipsShown(), [])
    assert.strictEqual(getTipCount(), 0)
    assert.strictEqual(getLastTipTime(), 0)
    assert.strictEqual(getLastTip(), null)
  })
})

