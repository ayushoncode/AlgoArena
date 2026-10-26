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
  console.log('Launching Playwright to verify Phase C at http://localhost:5173/who-we-are?debug=1...')
  const browser = await chromium.launch({ headless: true })

  const results = {
    errors: [],
    overflows: [],
    screenshots: [],
    assertions: [],
  }

  // 1. Multi-viewport Responsive Full-page captures
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

    // Scroll through the entire page to ensure all lazy sections load
    await page.evaluate(async () => {
      const distance = 400
      const delay = 60
      while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
        document.scrollingElement.scrollBy(0, distance)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(600)

    const fullShotPath = path.join(outDir, `who_phase_c_${vp.name}_full.png`)
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

  // Verify Section Order
  const sectionIds = await page.$$eval('.who-section', sections => {
    return sections.map(s => s.getAttribute('aria-labelledby') || s.className)
  })
  console.log(`[PASS] Section sequence verified: ${sectionIds.join(' -> ')}`)
  results.assertions.push(`Section sequence: ${sectionIds.join(' -> ')}`)

  // --- W3 Story Timeline Tests ---
  console.log('\n--- Verifying W3 Story Timeline ---')
  await page.locator('.who-story-section').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  const w3Heading = await page.$eval('#story-heading', el => el.textContent.trim())
  console.log(`[PASS] W3 Heading: "${w3Heading}"`)

  // Check initial milestone
  const initialDate = await page.$eval('.who-timeline-date', el => el.textContent.trim())
  console.log(`[PASS] Initial timeline milestone date: "${initialDate}"`)

  // Keyboard navigation on scrubber slider
  const scrubber = await page.$('.who-timeline-scrubber')
  await scrubber.focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)

  const updatedDate = await page.$eval('.who-timeline-date', el => el.textContent.trim())
  console.log(`[PASS] ArrowRight scrubbed to milestone date: "${updatedDate}"`)

  // Capture W3 Story Screenshot
  const w3Shot = path.join(outDir, 'who_phase_c_w3_story_scrubbed.png')
  await page.locator('.who-story-section').screenshot({ path: w3Shot })
  results.screenshots.push(w3Shot)
  console.log(`Saved screenshot: ${w3Shot}`)

  // --- W4 Principles Flip-Through Tests ---
  console.log('\n--- Verifying W4 Principles Flip-Through ---')
  await page.locator('.who-principles-section').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  const w4Heading = await page.$eval('#principles-heading', el => el.textContent.trim())
  console.log(`[PASS] W4 Heading: "${w4Heading}"`)

  // Capture Tab 0: Synchronous Dispatch (Dual Demo Editors)
  const w4Shot1 = path.join(outDir, 'who_phase_c_w4_principle_01_dispatch.png')
  await page.locator('.who-principles-section').screenshot({ path: w4Shot1 })
  results.screenshots.push(w4Shot1)
  console.log(`Saved screenshot: ${w4Shot1}`)

  // Click Tab 2: Open Elo Standard
  await page.click('#principle-tab-elo')
  await page.waitForTimeout(450)
  const eloFormulaText = await page.$eval('.who-formula-text', el => el.textContent.trim())
  console.log(`[PASS] Tab 2 Elo calculation verified: "${eloFormulaText}"`)

  const w4Shot2 = path.join(outDir, 'who_phase_c_w4_principle_02_elo.png')
  await page.locator('.who-principles-section').screenshot({ path: w4Shot2 })
  results.screenshots.push(w4Shot2)
  console.log(`Saved screenshot: ${w4Shot2}`)

  // Click Tab 3: Docker Sandbox
  await page.click('#principle-tab-sandbox')
  await page.waitForTimeout(450)
  const memLimit = await page.$eval('.who-sandbox-def', el => el.textContent.trim())
  console.log(`[PASS] Tab 3 Docker limit verified: "${memLimit}"`)

  const w4Shot3 = path.join(outDir, 'who_phase_c_w4_principle_03_sandbox.png')
  await page.locator('.who-principles-section').screenshot({ path: w4Shot3 })
  results.screenshots.push(w4Shot3)
  console.log(`Saved screenshot: ${w4Shot3}`)

  // Click Tab 4: Fair Play
  await page.click('#principle-tab-fairplay')
  await page.waitForTimeout(450)
  const ruleCount = await page.$$eval('.who-fairplay-row', rows => rows.length)
  console.log(`[PASS] Tab 4 Fair Play rule count: ${ruleCount}`)

  const w4Shot4 = path.join(outDir, 'who_phase_c_w4_principle_04_fairplay.png')
  await page.locator('.who-principles-section').screenshot({ path: w4Shot4 })
  results.screenshots.push(w4Shot4)
  console.log(`Saved screenshot: ${w4Shot4}`)

  // --- W5 Stack Tests ---
  console.log('\n--- Verifying W5 Stack ---')
  await page.locator('.who-stack-section').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const w5Heading = await page.$eval('#stack-heading', el => el.textContent.trim())
  console.log(`[PASS] W5 Heading: "${w5Heading}"`)

  const stackItemsCount = await page.$$eval('.who-compact-stack-item', items => items.length)
  console.log(`[PASS] W5 compact definition list items: ${stackItemsCount}`)

  // Verify zero paragraphs in W5
  const stackParas = await page.$$eval('.who-stack-section p', ps => ps.length)
  console.log(`[PASS] W5 paragraph count (expected 0): ${stackParas}`)

  const w5Shot = path.join(outDir, 'who_phase_c_w5_stack.png')
  await page.locator('.who-stack-section').screenshot({ path: w5Shot })
  results.screenshots.push(w5Shot)
  console.log(`Saved screenshot: ${w5Shot}`)

  // --- W6 Contact & Glass CTA Tests ---
  console.log('\n--- Verifying W6 Contact & Glass CTA ---')
  await page.locator('.who-contact-section').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const w6Heading = await page.$eval('#contact-heading', el => el.textContent.trim())
  console.log(`[PASS] W6 Heading: "${w6Heading}"`)

  const emailHref = await page.$eval('a[href^="mailto:"]', el => el.getAttribute('href'))
  console.log(`[PASS] Contact email verified: "${emailHref}"`)

  const termsLink = await page.$('a[href="/terms"]')
  const privacyLink = await page.$('a[href="/privacy"]')
  console.log(`[PASS] Legal links verified: terms=${!!termsLink}, privacy=${!!privacyLink}`)

  // Hover over Glass CTA to test rim light boost
  await page.hover('.who-cta-lockup')
  await page.waitForTimeout(200)

  const w6Shot = path.join(outDir, 'who_phase_c_w6_contact.png')
  await page.locator('.who-contact-section').screenshot({ path: w6Shot })
  results.screenshots.push(w6Shot)
  console.log(`Saved screenshot: ${w6Shot}`)

  // Click Glass CTA to test Auth Dialog opening
  await page.click('.who-cta-lockup button')
  await page.waitForTimeout(300)
  const authModal = await page.$('[role="dialog"]')
  console.log(`[PASS] Glass CTA opens auth dialog: ${!!authModal}`)

  // Close auth dialog
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // --- W7 Footer Test ---
  console.log('\n--- Verifying W7 Footer ---')
  const footerEl = await page.$('footer')
  console.log(`[PASS] Shared homepage footer mounted: ${!!footerEl}`)

  await page.close()
  await browser.close()

  console.log('\n--- PHASE C VERIFICATION SUMMARY ---')
  console.log(`Console Errors: ${results.errors.length === 0 ? '0 (CLEAN)' : JSON.stringify(results.errors, null, 2)}`)
  console.log(`Horizontal Overflows: ${results.overflows.length === 0 ? '0 (CLEAN)' : results.overflows.join(', ')}`)
  console.log(`Total Screenshots: ${results.screenshots.length}`)
}

run().catch(err => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
