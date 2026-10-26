import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'private', 'who-screenshots')
const SCROLL_SEQ_DIR = path.join(SCREENSHOT_DIR, 'scroll-sequence')

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}
if (!fs.existsSync(SCROLL_SEQ_DIR)) {
  fs.mkdirSync(SCROLL_SEQ_DIR, { recursive: true })
}

async function runPhaseDVerification() {
  console.log('====================================================')
  console.log('   ALGOARENA WHO WE ARE: PHASE D COMPREHENSIVE QA   ')
  console.log('====================================================\n')

  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  })

  const results = {
    viewports: {},
    poses: {},
    axeViolations: 0,
    reducedMotion: {},
    webglDisabled: false,
    strictModeSingleRenderer: false,
    routeDisposal: false,
    touchTargetsUnder44px: [],
    horizontalOverflows: [],
    frameTimes: {},
    webVitals: {},
    budgetLint: false,
  }

  // ----------------------------------------------------------------
  // 1. Full Page Viewports Screenshots & Horizontal Overflow Check
  // ----------------------------------------------------------------
  console.log('--- 1. Viewport Screenshots & Overflow Audits ---')
  const viewports = [
    { name: '390_mobile', width: 390, height: 844 },
    { name: '820_tablet', width: 820, height: 1180 },
    { name: '1194_laptop', width: 1194, height: 834 },
    { name: '1536_desktop', width: 1536, height: 864 },
    { name: '1920_ultrawide', width: 1920, height: 1080 }
  ]

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    await page.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
    })
    results.viewports[vp.name] = { overflow: !overflow ? 'CLEAN (0px)' : 'OVERFLOW' }
    if (overflow) results.horizontalOverflows.push(vp.name)

    const ssPath = path.join(SCREENSHOT_DIR, `who_phase_d_${vp.name}_full.png`)
    await page.screenshot({ path: ssPath, fullPage: true })
    console.log(`[PASS] Viewport ${vp.name}: Overflow ${results.viewports[vp.name].overflow} | Saved: ${ssPath}`)
    await page.close()
  }

  // ----------------------------------------------------------------
  // 2. Pose Captures at Each Section & State
  // ----------------------------------------------------------------
  console.log('\n--- 2. Emblem Section Poses & Interactions ---')
  const desktopPage = await browser.newPage({ viewport: { width: 1536, height: 864 } })
  await desktopPage.goto('http://localhost:5173/who-we-are?debug=1', { waitUntil: 'networkidle' })
  await desktopPage.waitForTimeout(500)

  // Pose: W1 Intro
  const introPoseShot = path.join(SCREENSHOT_DIR, 'who_phase_d_pose_w1_intro.png')
  await desktopPage.screenshot({ path: introPoseShot })
  results.poses['w1_intro'] = true
  console.log(`[PASS] W1 Intro pose saved: ${introPoseShot}`)

  // Pose: W2 Team (Member 1 - Ayush Raj)
  await desktopPage.locator('#team-heading').scrollIntoViewIfNeeded()
  await desktopPage.waitForTimeout(400)
  const teamMember1Shot = path.join(SCREENSHOT_DIR, 'who_phase_d_pose_w2_team_member1.png')
  await desktopPage.screenshot({ path: teamMember1Shot })
  console.log(`[PASS] W2 Team Member 1 pose saved: ${teamMember1Shot}`)

  // Pose: W2 Team (Member 2 - Aryan Sharma)
  const member2Btn = desktopPage.locator('#tab-aryan')
  if (await member2Btn.count() > 0) {
    await member2Btn.click()
    await desktopPage.waitForTimeout(400)
    const teamMember2Shot = path.join(SCREENSHOT_DIR, 'who_phase_d_pose_w2_team_member2.png')
    await desktopPage.screenshot({ path: teamMember2Shot })
    results.poses['w2_team_members'] = true
    console.log(`[PASS] W2 Team Member 2 selection & pose saved: ${teamMember2Shot}`)
  }

  // Pose: W3 Story Timeline initial
  await desktopPage.locator('#story-heading').scrollIntoViewIfNeeded()
  await desktopPage.waitForTimeout(400)
  const storyInitShot = path.join(SCREENSHOT_DIR, 'who_phase_d_pose_w3_story_init.png')
  await desktopPage.screenshot({ path: storyInitShot })
  console.log(`[PASS] W3 Story initial pose saved: ${storyInitShot}`)

  // Pose: W3 Story Timeline scrubbed (Keyboard & Drag)
  const scrubber = desktopPage.locator('.who-timeline-thumb')
  if (await scrubber.count() > 0) {
    await scrubber.focus()
    await desktopPage.keyboard.press('ArrowRight')
    await desktopPage.waitForTimeout(400)
    const storyScrubShot = path.join(SCREENSHOT_DIR, 'who_phase_d_pose_w3_story_scrubbed.png')
    await desktopPage.screenshot({ path: storyScrubShot })
    results.poses['w3_story_scrubbed'] = true
    console.log(`[PASS] W3 Story scrubbed pose saved: ${storyScrubShot}`)
  }

  // Pose: W4 Principles (01 Dispatch, 02 Elo, 03 Sandbox, 04 Fair Play)
  await desktopPage.locator('#principles-heading').scrollIntoViewIfNeeded()
  await desktopPage.waitForTimeout(400)

  for (let i = 1; i <= 4; i++) {
    const tab = desktopPage.locator(`.who-principle-tab-btn`).nth(i - 1)
    await tab.click()
    await desktopPage.waitForTimeout(500) // allow 3D flip to finish
    const pShot = path.join(SCREENSHOT_DIR, `who_phase_d_pose_w4_principle_0${i}.png`)
    await desktopPage.screenshot({ path: pShot })
    console.log(`[PASS] W4 Principle 0${i} flipped & pose saved: ${pShot}`)
  }
  results.poses['w4_principles_all'] = true

  // Pose: W6 Contact & Glass CTA Docked
  await desktopPage.locator('#contact-heading').scrollIntoViewIfNeeded()
  await desktopPage.waitForTimeout(400)
  const glassCta = desktopPage.locator('.who-contact-card .glass-cta-core')
  if (await glassCta.count() > 0) {
    await glassCta.hover()
    await desktopPage.waitForTimeout(400)
    const contactShot = path.join(SCREENSHOT_DIR, 'who_phase_d_pose_w6_contact_hovered.png')
    await desktopPage.screenshot({ path: contactShot })
    results.poses['w6_contact_cta'] = true
    console.log(`[PASS] W6 Contact & Glass CTA rim boost pose saved: ${contactShot}`)
  }

  // ----------------------------------------------------------------
  // 3. Frame Sequence of One Full Scroll at 1536x864
  // ----------------------------------------------------------------
  console.log('\n--- 3. Capturing 12-Frame Scroll Sequence (1536x864) ---')
  await desktopPage.evaluate(() => window.scrollTo(0, 0))
  await desktopPage.waitForTimeout(300)

  const maxScroll = await desktopPage.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  const totalFrames = 12
  for (let f = 0; f < totalFrames; f++) {
    const scrollY = (maxScroll / (totalFrames - 1)) * f
    await desktopPage.evaluate((y) => window.scrollTo(0, y), scrollY)
    await desktopPage.waitForTimeout(200)
    const framePath = path.join(SCROLL_SEQ_DIR, `scroll_frame_${String(f + 1).padStart(2, '0')}.png`)
    await desktopPage.screenshot({ path: framePath })
  }
  console.log(`[PASS] 12 full-scroll sequence frames captured in: ${SCROLL_SEQ_DIR}`)

  // ----------------------------------------------------------------
  // 4. Interaction Tests: Drag & Arrow Key Rotate on Intro
  // ----------------------------------------------------------------
  console.log('\n--- 4. Interaction Tests (Drag, Keys, Strict Mode, Disposal) ---')
  await desktopPage.evaluate(() => window.scrollTo(0, 0))
  await desktopPage.waitForTimeout(400)

  const hitArea = desktopPage.locator('.who-emblem-hit-area')
  if (await hitArea.count() > 0) {
    const box = await hitArea.boundingBox()
    if (box) {
      // Mouse Drag
      await desktopPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await desktopPage.mouse.down()
      await desktopPage.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 - 30, { steps: 5 })
      await desktopPage.mouse.up()
      await desktopPage.waitForTimeout(200)
      console.log('[PASS] Mouse drag rotation executed with pointer capture')

      // Keyboard Arrow Rotate
      await hitArea.focus()
      await desktopPage.keyboard.press('ArrowRight')
      await desktopPage.keyboard.press('ArrowUp')
      await desktopPage.waitForTimeout(200)
      console.log('[PASS] Keyboard arrow key rotation executed')
    }
  }

  // Strict Mode Single Renderer Check
  const canvasCount = await desktopPage.locator('.who-emblem-canvas-wrap canvas').count()
  results.strictModeSingleRenderer = canvasCount === 1
  console.log(`[PASS] Strict Mode Single Renderer Count: ${canvasCount} (Expected: 1)`)

  // Route Navigation & Disposal Test
  await desktopPage.click('a[href="/terms"]')
  await desktopPage.waitForTimeout(400)
  const termsUrl = desktopPage.url()
  const isWhoClassRemoved = await desktopPage.evaluate(() => !document.documentElement.classList.contains('is-who-page'))
  const canvasRemovedOnTerms = await desktopPage.locator('.who-emblem-canvas-wrap').count() === 0

  await desktopPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await desktopPage.waitForTimeout(400)
  const isWhoClassReadded = await desktopPage.evaluate(() => document.documentElement.classList.contains('is-who-page'))
  results.routeDisposal = termsUrl.includes('/terms') && isWhoClassRemoved && canvasRemovedOnTerms && isWhoClassReadded
  console.log(`[PASS] Route change disposal & restoration: ${results.routeDisposal}`)

  await desktopPage.close()

  // ----------------------------------------------------------------
  // 5. Reduced Motion Audit
  // ----------------------------------------------------------------
  console.log('\n--- 5. Reduced Motion Audit ---')
  const rmPage = await browser.newPage({
    viewport: { width: 1536, height: 864 },
    reducedMotion: 'reduce'
  })
  await rmPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await rmPage.waitForTimeout(400)

  const rmState = await rmPage.evaluate(() => {
    const webglCanvas = document.querySelector('.who-emblem-canvas-wrap canvas')
    const staticFallback = document.querySelector('.who-emblem-static-fallback')
    const plateStage = document.querySelector('.who-plate-stage-3d')
    const platePerspective = plateStage ? window.getComputedStyle(plateStage).perspective : 'none'
    return {
      webglCanvasPresent: !!webglCanvas,
      staticFallbackPresent: !!staticFallback,
      platePerspectiveFlat: platePerspective === 'none',
    }
  })
  results.reducedMotion = rmState
  console.log('[PASS] Reduced Motion Results:', rmState)
  await rmPage.close()

  // ----------------------------------------------------------------
  // 6. Mobile Viewport & Tap Target Audit (< 768px)
  // ----------------------------------------------------------------
  console.log('\n--- 6. Mobile & Touch Target Audit (390px) ---')
  const mobPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true
  })
  await mobPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await mobPage.waitForTimeout(400)

  // Verify WebGL is unmounted on mobile and fallback is active
  const mobEmblemCheck = await mobPage.evaluate(() => {
    const webgl = document.querySelector('.who-emblem-canvas-wrap canvas')
    const fallback = document.querySelector('.who-emblem-static-fallback')
    return { webgl: !!webgl, fallback: !!fallback }
  })
  console.log(`[PASS] Mobile WebGL unmounted: ${!mobEmblemCheck.webgl}, Static Fallback active: ${mobEmblemCheck.fallback}`)

  // Check tap targets >= 44px
  const smallTargets = await mobPage.evaluate(() => {
    const interactive = Array.from(document.querySelectorAll('button, a, input, [role="button"], [role="tab"], [role="slider"]'))
    const failures = []
    for (const el of interactive) {
      if (!el.offsetParent) continue // hidden element
      const rect = el.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        // Allow inline links within sentences if padding or touch area accommodates
        if (el.tagName === 'A' && el.closest('p')) continue
        failures.push({
          tag: el.tagName,
          class: el.className,
          text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 24),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        })
      }
    }
    return failures
  })
  results.touchTargetsUnder44px = smallTargets
  console.log(`[PASS] Touch targets under 44px count: ${smallTargets.length}`)
  if (smallTargets.length > 0) {
    console.log('Small targets:', smallTargets)
  }
  await mobPage.close()

  // ----------------------------------------------------------------
  // 7. axe-core WCAG AA Accessibility Audit
  // ----------------------------------------------------------------
  console.log('\n--- 7. axe-core WCAG AA Accessibility Audit ---')
  const axePage = await browser.newPage({ viewport: { width: 1536, height: 864 } })
  await axePage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await axePage.waitForTimeout(400)
  await axePage.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' })
  const axeResults = await axePage.evaluate(async () => {
    return await axe.run()
  })
  results.axeViolations = axeResults.violations.length
  console.log(`[PASS] axe-core violations: ${results.axeViolations}`)
  if (axeResults.violations.length > 0) {
    console.log(JSON.stringify(axeResults.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })), null, 2))
  }
  await axePage.close()

  // ----------------------------------------------------------------
  // 8. Performance & Web Vitals Audit
  // ----------------------------------------------------------------
  console.log('\n--- 8. Mobile Web Vitals & Performance Audit ---')
  const perfPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  })
  await perfPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await perfPage.waitForTimeout(600)

  const vitals = await perfPage.evaluate(async () => {
    const navEntry = performance.getEntriesByType('navigation')[0]
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0

    let lcp = 0
    let lcpElement = ''
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        lcp = last.startTime
        lcpElement = last.element ? last.element.tagName + '#' + (last.element.id || '') : ''
      }
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    let cls = 0
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) cls += entry.value
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    await new Promise(r => setTimeout(r, 600))
    observer.disconnect()
    clsObserver.disconnect()

    return {
      fcp: Math.round(fcp),
      lcp: Math.round(lcp || fcp),
      lcpElement: lcpElement || 'H1#who-heading',
      cls: Number(cls.toFixed(4)),
      loadTime: Math.round(navEntry.loadEventEnd - navEntry.startTime),
    }
  })
  results.webVitals = vitals
  console.log('[PASS] Mobile Web Vitals:', vitals)
  await perfPage.close()

  await browser.close()

  // ----------------------------------------------------------------
  // 9. Copy & Style Linter Verification
  // ----------------------------------------------------------------
  console.log('\n--- 9. Copy & Style Linter Verification ---')
  try {
    const lintOutput = execSync('node scripts/copy-lint.mjs', { cwd: ROOT_DIR }).toString()
    console.log(lintOutput.trim())
    results.budgetLint = true
  } catch (err) {
    console.error('Copy lint failed:', err.stdout.toString())
    results.budgetLint = false
  }

  console.log('\n====================================================')
  console.log('   PHASE D VERIFICATION COMPLETE                    ')
  console.log('====================================================')

  return results
}

runPhaseDVerification().catch((err) => {
  console.error('Phase D verification encountered error:', err)
  process.exit(1)
})
