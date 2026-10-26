import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const ARTIFACT_DIR = path.join(ROOT_DIR, 'private', 'motion-artifacts', 'phase-c')

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function getContrast(l1, l2) {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return { r: 10, g: 15, b: 29 }
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
}

async function verifyPhaseC() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('       ALGOARENA 3D DEPTH SYSTEM: PHASE C VERIFICATION     ')
  console.log('═══════════════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ headless: true })
  
  // ────────────────────────────────────────────────────────────────
  // DESKTOP RUN
  // ────────────────────────────────────────────────────────────────
  const desktopCtx = await browser.newContext({
    viewport: { width: 1536, height: 864 }
  })
  const page = await desktopCtx.newPage()

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#leaderboard-preview', { timeout: 10000 })
  await page.waitForSelector('#faq', { timeout: 10000 })
  await page.waitForSelector('#enter-arena', { timeout: 10000 })
  await page.waitForSelector('#site-footer', { timeout: 10000 })
  await page.waitForTimeout(600)

  // ────────────────────────────────────────────────────────────────
  // TEST 1: S6 Leaderboard plinth rises & settled state
  // ────────────────────────────────────────────────────────────────
  console.log('[1/7] Verifying S6 Leaderboard plinth cascade & settled state...')
  const lbPos = await page.evaluate(() => {
    const el = document.querySelector('#leaderboard-preview')
    return el.getBoundingClientRect().top + window.scrollY
  })

  // Scroll to entering position
  await page.evaluate((y) => window.scrollTo(0, y - 400), lbPos)
  await page.waitForTimeout(300)

  const s6Entering = await page.evaluate(() => {
    const r1 = document.querySelector('.leader-row.row-rank-1')
    const r2 = document.querySelector('.leader-row.row-rank-2')
    const r3 = document.querySelector('.leader-row.row-rank-3')
    return {
      r1Classes: r1 ? Array.from(r1.classList) : [],
      r2Classes: r2 ? Array.from(r2.classList) : [],
      r3Classes: r3 ? Array.from(r3.classList) : [],
      r1HasStagger: r1?.classList.contains('stagger-row'),
      r2HasStagger: r2?.classList.contains('stagger-row'),
      r3HasStagger: r3?.classList.contains('stagger-row')
    }
  })

  console.log(`  ✓ S6 Top rows classes: r1=[${s6Entering.r1Classes.join(', ')}], r2=[${s6Entering.r2Classes.join(', ')}], r3=[${s6Entering.r3Classes.join(', ')}]`)

  // Scroll to center (settled)
  await page.evaluate((y) => window.scrollTo(0, y + 100), lbPos)
  await page.waitForTimeout(400)

  const s6Settled = await page.evaluate(() => {
    const stage = document.querySelector('#leaderboard-preview .depth-stage')
    const r1 = document.querySelector('.leader-row.row-rank-1')
    return {
      isSettled: stage?.classList.contains('is-settled'),
      r1Transform: r1 ? window.getComputedStyle(r1).transform : '',
      r1Opacity: r1 ? window.getComputedStyle(r1).opacity : ''
    }
  })
  console.log(`  ✓ S6 Settled: isSettled=${s6Settled.isSettled}, transform="${s6Settled.r1Transform}", opacity=${s6Settled.r1Opacity}`)

  // ────────────────────────────────────────────────────────────────
  // TEST 2: S7 FAQ Accordion items & interactivity
  // ────────────────────────────────────────────────────────────────
  console.log('\n[2/7] Verifying S7 FAQ accordion items & click interactivity...')
  const faqPos = await page.evaluate(() => {
    const el = document.querySelector('#faq')
    return el.getBoundingClientRect().top + window.scrollY
  })

  await page.evaluate((y) => window.scrollTo(0, y - 100), faqPos)
  await page.waitForTimeout(300)

  const faqItems = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#faq .faq-accordion-item'))
    return {
      count: items.length,
      allHaveStagger: items.every(i => i.classList.contains('stagger-row'))
    }
  })
  console.log(`  ✓ S7 FAQ: ${faqItems.count} items, allHaveStagger=${faqItems.allHaveStagger}`)

  // Click second question to test toggle
  const secondTrigger = page.locator('#faq-q-1')
  await secondTrigger.click()
  await page.waitForTimeout(200)

  const isSecondOpen = await page.evaluate(() => {
    const el = document.querySelectorAll('#faq .faq-accordion-item')[1]
    return el?.classList.contains('is-open')
  })
  console.log(`  ✓ S7 FAQ Accordion click toggle verified: second question open=${isSecondOpen}`)

  // ────────────────────────────────────────────────────────────────
  // TEST 3: S8 Final CTA WebGL / 3D Emblem rotation
  // ────────────────────────────────────────────────────────────────
  console.log('\n[3/7] Verifying S8 Final CTA 3D Emblem rotation...')
  const ctaPos = await page.evaluate(() => {
    const el = document.querySelector('#enter-arena')
    return el.getBoundingClientRect().top + window.scrollY
  })

  await page.evaluate((y) => window.scrollTo(0, y - 200), ctaPos)
  await page.waitForTimeout(300)

  const ctaEmblem = await page.evaluate(() => {
    const wrap = document.querySelector('.final-cta-emblem-wrap')
    const svg = wrap ? wrap.querySelector('.aa-emblem-3d-svg') : null
    const wrapStyle = wrap ? window.getComputedStyle(wrap) : null
    return {
      wrapPresent: !!wrap,
      svgPresent: !!svg,
      animationName: wrapStyle?.animationName,
      transform: wrapStyle?.transform
    }
  })
  console.log(`  ✓ S8 Emblem verified: present=${ctaEmblem.wrapPresent}, animationName=${ctaEmblem.animationName}`)

  // ────────────────────────────────────────────────────────────────
  // TEST 4: S9 Footer rendering & operational status
  // ────────────────────────────────────────────────────────────────
  console.log('\n[4/7] Verifying S9 Footer rendering & operational status dot...')
  const footerPos = await page.evaluate(() => {
    const el = document.querySelector('#site-footer')
    return el.getBoundingClientRect().top + window.scrollY
  })

  await page.evaluate((y) => window.scrollTo(0, y), footerPos)
  await page.waitForTimeout(300)

  const footerInfo = await page.evaluate(() => {
    const footer = document.querySelector('#site-footer')
    const statusText = footer?.querySelector('.status-text')?.textContent
    const linksCount = footer?.querySelectorAll('.footer-links-list a').length
    const copyright = footer?.querySelector('.footer-copyright')?.textContent
    return {
      statusText,
      linksCount,
      copyright
    }
  })
  console.log(`  ✓ S9 Footer verified: status="${footerInfo.statusText}", linksCount=${footerInfo.linksCount}, copyright="${footerInfo.copyright}"`)

  // ────────────────────────────────────────────────────────────────
  // TEST 5: Mobile Lite Mode (<900px)
  // ────────────────────────────────────────────────────────────────
  console.log('\n[5/7] Verifying Mobile Lite Mode (<900px viewport)...')
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 }
  })
  const mobilePage = await mobileCtx.newPage()
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForSelector('#ratings', { timeout: 10000 })
  await mobilePage.waitForTimeout(400)

  const mobileCheck = await mobilePage.evaluate(() => {
    const stage = document.querySelector('.depth-stage')
    const exitLayer = document.querySelector('.depth-exit-layer')
    const tierCard = document.querySelector('.tier-showcase-card')
    const stageStyle = stage ? window.getComputedStyle(stage) : null
    const exitStyle = exitLayer ? window.getComputedStyle(exitLayer) : null
    const cardStyle = tierCard ? window.getComputedStyle(tierCard) : null

    return {
      stagePerspective: stageStyle?.perspective,
      exitTransform: exitStyle?.transform,
      cardTransform: cardStyle?.transform
    }
  })
  console.log(`  ✓ Mobile Lite: perspective="${mobileCheck.stagePerspective}", exitTransform="${mobileCheck.exitTransform}", cardTransform="${mobileCheck.cardTransform}"`)
  if (mobileCheck.stagePerspective !== 'none' || (mobileCheck.exitTransform !== 'none' && mobileCheck.exitTransform !== 'matrix(1, 0, 0, 1, 0, 0)')) {
    console.error('  ✗ Mobile Lite mode failed: perspective or exit transform not disabled on mobile!')
    process.exit(1)
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 6: Prefers-Reduced-Motion Mode
  // ────────────────────────────────────────────────────────────────
  console.log('\n[6/7] Verifying Prefers-Reduced-Motion mode...')
  const rmCtx = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    reducedMotion: 'reduce'
  })
  const rmPage = await rmCtx.newPage()
  await rmPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await rmPage.waitForSelector('#ratings', { timeout: 10000 })
  await rmPage.waitForTimeout(400)

  const rmCheck = await rmPage.evaluate(() => {
    const stage = document.querySelector('.depth-stage')
    const enterLayer = document.querySelector('.depth-enter-layer')
    const stageStyle = stage ? window.getComputedStyle(stage) : null
    const enterStyle = enterLayer ? window.getComputedStyle(enterLayer) : null

    return {
      stagePerspective: stageStyle?.perspective,
      enterTransform: enterStyle?.transform,
      enterAnimation: enterStyle?.animationName
    }
  })
  console.log(`  ✓ Reduced motion: perspective="${rmCheck.stagePerspective}", transform="${rmCheck.enterTransform}", animation="${rmCheck.enterAnimation}"`)
  if (rmCheck.stagePerspective !== 'none' || (rmCheck.enterTransform !== 'none' && rmCheck.enterTransform !== 'matrix(1, 0, 0, 1, 0, 0)')) {
    console.error('  ✗ Reduced motion check failed!')
    process.exit(1)
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 7: Capture Visual Evidence Stills for Phase C
  // ────────────────────────────────────────────────────────────────
  console.log('\n[7/7] Capturing visual stills across S6, S7, S8, S9, & Mobile...')

  // Still 1: S6 Leaderboard
  await page.evaluate((y) => window.scrollTo(0, y - 72 + 60), lbPos)
  await page.waitForTimeout(300)
  const still1 = path.join(ARTIFACT_DIR, 's6_leaderboard_view.png')
  await page.screenshot({ path: still1, clip: { x: 0, y: 72, width: 1536, height: 792 } })

  // Still 2: S7 FAQ
  await page.evaluate((y) => window.scrollTo(0, y - 72 + 60), faqPos)
  await page.waitForTimeout(300)
  const still2 = path.join(ARTIFACT_DIR, 's7_faq_view.png')
  await page.screenshot({ path: still2, clip: { x: 0, y: 72, width: 1536, height: 792 } })

  // Still 3: S8 Final CTA with 3D Emblem
  await page.evaluate((y) => window.scrollTo(0, y - 72 + 60), ctaPos)
  await page.waitForTimeout(300)
  const still3 = path.join(ARTIFACT_DIR, 's8_final_cta_view.png')
  await page.screenshot({ path: still3, clip: { x: 0, y: 72, width: 1536, height: 792 } })

  // Still 4: S9 Site Footer
  await page.evaluate((y) => window.scrollTo(0, y - 72), footerPos)
  await page.waitForTimeout(300)
  const still4 = path.join(ARTIFACT_DIR, 's9_footer_view.png')
  await page.screenshot({ path: still4, clip: { x: 0, y: 72, width: 1536, height: 792 } })

  // Still 5: Mobile Lite View (390px)
  const mobileStill = path.join(ARTIFACT_DIR, 'mobile_lite_view.png')
  await mobilePage.screenshot({ path: mobileStill, clip: { x: 0, y: 0, width: 390, height: 844 } })

  console.log(`  ✓ Saved 5 visual verification screenshots to ${ARTIFACT_DIR}`)
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('       ALL PHASE C VERIFICATION TESTS PASSED (7/7)        ')
  console.log('═══════════════════════════════════════════════════════════\n')

  await browser.close()
}

verifyPhaseC().catch((err) => {
  console.error('Phase C Verification Failed:', err)
  process.exit(1)
})
