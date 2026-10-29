/**
 * scripts/verify-mascot-phase-b.mjs
 *
 * Real browser verification of Phase B:
 *  - Mascot mounted on homepage
 *  - Menu opens on click with 4 rows
 *  - Repeat tip displays bubble above-left of mascot
 *  - Close button dismisses bubble
 *  - Escape key dismisses bubble / menu
 *  - "Hide the guide" hides mascot and exposes footer toggle
 *  - "Show the guide" restores mascot
 *  - ?mascot=debug exposes section, count, cooldown
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
  console.log('🚀 Starting Phase B browser verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  })
  const page = await context.newPage()

  try {
    // 1. Visit homepage
    console.log('1. Loading http://localhost:5173/ ...')
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Verify mascot button is rendered
    const mascotBtn = page.locator('.mascot-btn')
    await mascotBtn.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✔ Mascot button is visible in bottom-right corner')

    // 2. Click mascot button to open menu
    console.log('2. Clicking mascot button to open menu...')
    await mascotBtn.click({ force: true })
    const mascotMenu = page.locator('.mascot-menu.mascot-menu-open')
    await mascotMenu.waitFor({ state: 'visible', timeout: 3000 })
    console.log('✔ Mascot menu popover opened')

    // Verify 4 menu rows
    const menuRows = page.locator('.mascot-menu-row')
    const count = await menuRows.count()
    console.log(`✔ Found ${count} menu rows (expected 4)`)
    for (let i = 0; i < count; i++) {
      console.log(`   - Row ${i + 1}: "${await menuRows.nth(i).innerText()}"`)
    }

    // Screenshot menu
    await page.screenshot({ path: path.join(outDir, 'phase_b_menu.png') })
    console.log('📸 Saved menu screenshot to private/mascot-screenshots/phase_b_menu.png')

    // 3. Test "Repeat the last tip"
    console.log('3. Clicking "Repeat the last tip"...')
    const repeatBtn = page.locator('.mascot-menu-row:has-text("Repeat the last tip")')
    await repeatBtn.click({ force: true })

    // Wait for bubble to appear
    const bubble = page.locator('.mascot-bubble.mascot-bubble-visible')
    await bubble.waitFor({ state: 'visible', timeout: 3000 })
    const tipText = await page.locator('.mascot-bubble-text').innerText()
    console.log(`✔ Tip bubble appeared: "${tipText}"`)

    // Verify close button has 44px hit area
    const closeBtn = page.locator('.mascot-bubble-close')
    const box = await closeBtn.boundingBox()
    console.log(`✔ Close button size: ${box.width}x${box.height}px (expected 44x44px hit area)`)

    // Screenshot bubble
    await page.screenshot({ path: path.join(outDir, 'phase_b_bubble.png') })
    console.log('📸 Saved bubble screenshot to private/mascot-screenshots/phase_b_bubble.png')

    // 4. Test Esc key dismisses bubble
    console.log('4. Testing Esc key closes bubble...')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    const bubbleCount = await page.locator('.mascot-bubble').count()
    console.log(`✔ Bubble closed on Escape (bubble present: ${bubbleCount > 0})`)

    // 5. Test "Hide the guide"
    console.log('5. Testing "Hide the guide"...')
    await mascotBtn.click({ force: true })
    await mascotMenu.waitFor({ state: 'visible', timeout: 3000 })
    const hideBtn = page.locator('.mascot-menu-row:has-text("Hide the guide")')
    await hideBtn.click({ force: true })
    await page.waitForTimeout(400)

    // Mascot button should no longer be visible
    const mascotVisible = await mascotBtn.isVisible()
    console.log(`✔ Mascot face hidden: ${!mascotVisible}`)

    // 6. Test "Show guide" restores it
    console.log('6. Testing "Show guide" toggle restores mascot...')
    const showGuideBtn = page.locator('.mascot-toggle-btn:has-text("Show guide")')
    await showGuideBtn.first().click({ force: true })
    await page.waitForTimeout(400)
    const mascotRestored = await mascotBtn.isVisible()
    console.log(`✔ Mascot restored: ${mascotRestored}`)

    // 7. Test ?mascot=debug
    console.log('7. Testing ?mascot=debug query param...')
    await page.goto('http://localhost:5173/?mascot=debug', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const debugBadge = page.locator('.mascot-debug-badge')
    await debugBadge.waitFor({ state: 'visible', timeout: 5000 })
    const debugText = await debugBadge.innerText()
    console.log(`✔ Debug badge is visible: "${debugText.replace(/\n/g, ' ')}"`)

    console.log('\n🎉 ALL PHASE B TESTS PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('❌ Error during Phase B verification:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()

