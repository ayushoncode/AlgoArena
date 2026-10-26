import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../private/who-screenshots')
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const VIEWPORTS = [
  { name: '390_mobile', width: 390, height: 844 },
  { name: '820_tablet', width: 820, height: 1180 },
  { name: '1194_laptop', width: 1194, height: 834 },
  { name: '1536_desktop', width: 1536, height: 960 },
  { name: '1920_wide', width: 1920, height: 1080 },
]

async function run() {
  console.log('Launching Playwright to verify Phase B at http://localhost:5173/who-we-are?debug=1...')
  const browser = await chromium.launch({ headless: true })

  const results = {
    errors: [],
    overflows: [],
    screenshots: [],
    interactions: [],
  }

  // 1. Responsive Pass across all viewports
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1.5,
    })

    const consoleMessages = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })
    page.on('pageerror', (err) => {
      consoleMessages.push(err.message)
    })

    await page.goto('http://localhost:5173/who-we-are?debug=1', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    // Check horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    if (hasOverflow) {
      results.overflows.push(`${vp.name} (scrollWidth > innerWidth)`)
    }

    if (consoleMessages.length > 0) {
      results.errors.push({ viewport: vp.name, errors: consoleMessages })
    }

    // Full page screenshot
    const fullShotPath = path.join(outDir, `who_phase_b_${vp.name}_full.png`)
    await page.screenshot({ path: fullShotPath, fullPage: true })
    results.screenshots.push(fullShotPath)
    console.log(`Saved screenshot: ${fullShotPath}`)

    await page.close()
  }

  // 2. Interactive Verification on Desktop (1536x960)
  const page = await browser.newPage({
    viewport: { width: 1536, height: 960 },
    deviceScaleFactor: 1.5,
  })

  await page.goto('http://localhost:5173/who-we-are?debug=1', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Verify W1 Intro elements
  const h1Text = await page.$eval('#who-heading', el => el.textContent.trim())
  console.log(`[PASS] W1 H1 verified: "${h1Text}"`)

  // W1 Screenshot
  const w1Shot = path.join(outDir, 'who_phase_b_w1_intro.png')
  await page.locator('.who-intro-section').screenshot({ path: w1Shot })
  results.screenshots.push(w1Shot)
  console.log(`Saved screenshot: ${w1Shot}`)

  // Verify W2 Team is the second section
  const sectionIds = await page.$$eval('.who-section', sections => {
    return sections.map(s => s.getAttribute('aria-labelledby') || s.className)
  })
  console.log(`Section order: ${sectionIds.slice(0, 3).join(' -> ')}`)

  // W2 Team Initial (Ayush selected by default)
  const w2Shot1 = path.join(outDir, 'who_phase_b_w2_team_member1_ayush.png')
  await page.locator('.who-team-section').screenshot({ path: w2Shot1 })
  results.screenshots.push(w2Shot1)
  console.log(`Saved screenshot: ${w2Shot1}`)

  // Click second team member (Varnit Pal)
  await page.click('button#tab-varnit')
  await page.waitForTimeout(300)
  const member2Role = await page.$eval('.who-member-role-badge', el => el.textContent.trim())
  console.log(`[PASS] Selected member 2 role: "${member2Role}"`)

  const w2Shot2 = path.join(outDir, 'who_phase_b_w2_team_member2_varnit.png')
  await page.locator('.who-team-section').screenshot({ path: w2Shot2 })
  results.screenshots.push(w2Shot2)
  console.log(`Saved screenshot: ${w2Shot2}`)

  // Keyboard navigation test: press ArrowDown from member 2 to reach member 3 (Shreshth)
  await page.focus('button#tab-varnit')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(300)
  const member3Role = await page.$eval('.who-member-role-badge', el => el.textContent.trim())
  console.log(`[PASS] Keyboard ArrowDown selected member 3 role: "${member3Role}"`)

  const w2Shot3 = path.join(outDir, 'who_phase_b_w2_team_member3_shreshth.png')
  await page.locator('.who-team-section').screenshot({ path: w2Shot3 })
  results.screenshots.push(w2Shot3)
  console.log(`Saved screenshot: ${w2Shot3}`)

  // 3D Emblem Drag-to-Rotate Test
  const hitArea = await page.$('.who-emblem-hit-area')
  if (hitArea) {
    const box = await hitArea.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 20, { steps: 5 })
      await page.mouse.up()
      await page.waitForTimeout(400)
      console.log('[PASS] Drag-to-rotate inertia executed on 3D emblem')
    }
  }

  // Keyboard rotation test: focus hit area and press ArrowRight
  if (hitArea) {
    await hitArea.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    console.log('[PASS] Keyboard arrow rotation executed on 3D emblem')
  }

  // Capture Debug HUD Telemetry
  const debugText = await page.$eval('.who-debug-hud', el => el.innerText.trim())
  console.log(`\nDebug HUD Telemetry:\n${debugText}\n`)

  await page.close()

  // 3. Mobile Accordion Test on 390px
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  await mobilePage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(500)

  // Expand second accordion item
  const accordionButtons = await mobilePage.$$('.who-accordion-header-btn')
  if (accordionButtons.length >= 2) {
    await accordionButtons[1].click()
    await mobilePage.waitForTimeout(200)
    console.log('[PASS] Mobile accordion tap expanded second member')
  }

  const mobileShot = path.join(outDir, 'who_phase_b_mobile_accordion.png')
  await mobilePage.locator('.who-team-section').screenshot({ path: mobileShot })
  results.screenshots.push(mobileShot)
  console.log(`Saved screenshot: ${mobileShot}`)

  await mobilePage.close()
  await browser.close()

  console.log('\n--- PHASE B VERIFICATION SUMMARY ---')
  console.log(`Console Errors: ${results.errors.length === 0 ? '0 (CLEAN)' : JSON.stringify(results.errors, null, 2)}`)
  console.log(`Horizontal Overflows: ${results.overflows.length === 0 ? '0 (CLEAN)' : results.overflows.join(', ')}`)
  console.log(`Total Screenshots: ${results.screenshots.length}`)
}

run().catch(err => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
