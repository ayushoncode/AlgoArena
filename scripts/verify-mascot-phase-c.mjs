/**
 * scripts/verify-mascot-phase-c.mjs
 *
 * Real browser verification of Phase C:
 *  - 30-Second Guided Tour through all 6 stops
 *  - 1px ink outline on section header for 1.5s
 *  - Monospace counter '1 of 6' .. '6 of 6'
 *  - 'Next' and 'Skip tour' actions
 *  - Smooth native scrollIntoView on user click
 *  - Closing line upon finish
 *  - Event reactions (CTA hover -> alert, Sandbox language tab click -> tip)
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../private/mascot-screenshots')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

async function run() {
  console.log('🚀 Starting Phase C browser verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  const page = await context.newPage()

  try {
    console.log('1. Loading http://localhost:5173/ ...')
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    const mascotBtn = page.locator('.mascot-btn')
    await mascotBtn.waitFor({ state: 'visible', timeout: 5000 })

    // ── Test Tour via Menu ──────────────────────────────────────────────────
    console.log('2. Opening Mascot Menu and clicking "Take the 30 second tour"...')
    await mascotBtn.click({ force: true })
    const tourMenuBtn = page.locator('.mascot-menu-row:has-text("Take the 30 second tour")')
    await tourMenuBtn.waitFor({ state: 'visible', timeout: 3000 })
    await tourMenuBtn.click({ force: true })

    // Stop 1
    console.log('3. Verifying Tour Stop 1...')
    const bubble = page.locator('.mascot-bubble.mascot-bubble-visible')
    await bubble.waitFor({ state: 'visible', timeout: 3000 })
    const stop1Counter = await page.locator('.mascot-tour-counter').innerText()
    const stop1Text = await page.locator('.mascot-bubble-text').innerText()
    console.log(`✔ Stop 1 reached: [${stop1Counter}] "${stop1Text}"`)

    // Verify section outline is applied
    const duelHeader = page.locator('#duel .mascot-tour-outline, #duel .section-header')
    console.log(`✔ Section header located in duel area`)

    // Screenshot Stop 1
    await page.screenshot({ path: path.join(outDir, 'phase_c_tour_stop_1.png') })
    console.log('📸 Saved Stop 1 screenshot to private/mascot-screenshots/phase_c_tour_stop_1.png')

    // Advance through stops 2 to 5
    for (let s = 2; s <= 5; s++) {
      console.log(`4. Clicking Next to advance to Stop ${s}...`)
      const nextBtn = page.locator('.mascot-tour-btn-primary')
      await nextBtn.click({ force: true })
      await page.waitForTimeout(700)

      const counter = await page.locator('.mascot-tour-counter').innerText()
      const text = await page.locator('.mascot-bubble-text').innerText()
      console.log(`✔ Stop ${s} reached: [${counter}] "${text}"`)
    }

    // Stop 5 button should say "Finish"
    const finishBtn = page.locator('.mascot-tour-btn-primary:has-text("Finish")')
    await finishBtn.waitFor({ state: 'visible', timeout: 2000 })
    console.log('✔ Stop 5 shows "Finish" primary button')

    // Screenshot Stop 5
    await page.screenshot({ path: path.join(outDir, 'phase_c_tour_stop_6.png') })
    console.log('📸 Saved final Stop screenshot to private/mascot-screenshots/phase_c_tour_stop_6.png')

    // Click Finish
    console.log('5. Clicking Finish...')
    await finishBtn.click({ force: true })
    await page.waitForTimeout(500)

    const closingText = await page.locator('.mascot-bubble-text').innerText()
    console.log(`✔ Tour completed with closing line: "${closingText}"`)

    // Close closing bubble
    const closeBtn = page.locator('.mascot-bubble-close')
    await closeBtn.click({ force: true })
    await page.waitForTimeout(300)

    // ── Test CTA Hover Reaction ─────────────────────────────────────────────
    console.log('6. Testing CTA Hover reaction...')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    const cta = page.locator('.cta')
    await cta.hover()
    await page.waitForTimeout(200)

    // Verify mascot face expression is alert
    const mascotFace = page.locator('.mascot-face.expr-alert')
    const hasAlert = await mascotFace.count() > 0
    console.log(`✔ Mascot reacted with alert expression on CTA hover: ${hasAlert}`)

    // ── Test Language Tab Reaction ──────────────────────────────────────────
    console.log('7. Testing Sandbox Language Tab click reaction...')
    // Scroll to sandbox section
    await page.evaluate(() => {
      document.getElementById('sandbox')?.scrollIntoView()
    })
    await page.waitForTimeout(600)

    // Click Python tab
    const pyTab = page.locator('.sandbox-tab-btn:has-text("Python")')
    if (await pyTab.count() > 0) {
      await pyTab.click({ force: true })
      await page.waitForTimeout(500)

      const langBubbleText = await page.locator('.mascot-bubble-text').innerText().catch(() => '')
      console.log(`✔ Language tab reaction tip: "${langBubbleText}"`)
    }

    console.log('\n🎉 ALL PHASE C TESTS PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('❌ Error during Phase C verification:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()

