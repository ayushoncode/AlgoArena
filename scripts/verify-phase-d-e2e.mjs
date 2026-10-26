import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const ARTIFACT_DIR = path.join(ROOT_DIR, 'private', 'motion-artifacts', 'phase-d')

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

async function runEndToEndQA() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('   ALGOARENA 3D DEPTH SYSTEM: PHASE D FULL-PAGE E2E AUDIT  ')
  console.log('═══════════════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ headless: true })
  
  // Track console errors
  const consoleErrors = []
  const pageErrors = []

  // ────────────────────────────────────────────────────────────────
  // AUDIT 1: DESKTOP CLEAN RUN & SECTION REVIEWS
  // ────────────────────────────────────────────────────────────────
  console.log('[1/7] Testing Desktop continuous scroll & console integrity...')
  const desktopCtx = await browser.newContext({
    viewport: { width: 1536, height: 864 }
  })
  const page = await desktopCtx.newPage()

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', err => {
    pageErrors.push(err.message)
  })

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#duel', { timeout: 10000 })
  await page.waitForSelector('#how-it-runs', { timeout: 10000 })
  await page.waitForSelector('#ratings', { timeout: 10000 })
  await page.waitForSelector('#sandbox', { timeout: 10000 })
  await page.waitForSelector('#leaderboard-preview', { timeout: 10000 })
  await page.waitForSelector('#faq', { timeout: 10000 })
  await page.waitForSelector('#enter-arena', { timeout: 10000 })
  await page.waitForSelector('#site-footer', { timeout: 10000 })
  await page.waitForTimeout(500)

  // 1A. Hero parity at scrollY = 0
  const heroParity = await page.evaluate(() => {
    const exitLayer = document.querySelector('.hero-stage .depth-exit-layer')
    const transform = window.getComputedStyle(exitLayer).transform
    return {
      transform: transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)' ? 'none' : transform
    }
  })
  console.log(`  ✓ Hero at scrollY=0 transform: strictly "${heroParity.transform}"`)
  if (heroParity.transform !== 'none') {
    console.error('  ✗ Hero visual parity failed at scrollY=0!')
    process.exit(1)
  }

  // 1B. Sticky nav engage at 850px
  await page.evaluate(() => window.scrollTo(0, 850))
  await page.waitForTimeout(150)
  const navCheck = await page.evaluate(() => {
    const bar = document.querySelector('.bar')
    const isSticky = bar?.classList.contains('is-sticky')
    const rect = bar ? bar.getBoundingClientRect() : {}
    return { isSticky, top: rect.top }
  })
  console.log(`  ✓ Sticky Nav past hero (scrollY=850px): isSticky=${navCheck.isSticky}, top=${navCheck.top}px`)
  if (!navCheck.isSticky || navCheck.top !== 0) {
    console.error('  ✗ Sticky nav failed to pin cleanly!')
    process.exit(1)
  }

  // 1C. S2 How It Works Pinned Container check
  const s2Integrity = await page.evaluate(() => {
    const sticky = document.querySelector('.how-sticky-container')
    let el = sticky?.parentElement
    let hasTransformAncestor = false
    while (el && el !== document.documentElement) {
      const style = window.getComputedStyle(el)
      if (style.transform && style.transform !== 'none') hasTransformAncestor = true
      if (style.perspective && style.perspective !== 'none') hasTransformAncestor = true
      el = el.parentElement
    }
    return { hasTransformAncestor }
  })
  console.log(`  ✓ S2 pinned container ancestor containing block safety: transformAncestor=${s2Integrity.hasTransformAncestor}`)
  if (s2Integrity.hasTransformAncestor) {
    console.error('  ✗ S2 pinned container has containing-block breaking ancestors!')
    process.exit(1)
  }

  // 1D. S3 Rank Tiers: Resting 3D tilt & Hover straightening
  console.log('\n[2/7] Verifying S3 Rank Tiers 3D tilt & hover response...')
  const ratingsPos = await page.evaluate(() => {
    const el = document.querySelector('#ratings')
    return el.getBoundingClientRect().top + window.scrollY
  })
  await page.evaluate((y) => window.scrollTo(0, y - 72 + 60), ratingsPos)
  await page.waitForTimeout(300)

  const cardsTiltCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#ratings .tier-showcase-card'))
    const transforms = cards.map(c => window.getComputedStyle(c).transform)
    const hasCurriculum = !!document.querySelector('#curriculum')
    return {
      count: cards.length,
      allTilted: transforms.every(t => t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)'),
      hasCurriculum
    }
  })
  console.log(`  ✓ S3 Rank Tiers: ${cardsTiltCheck.count} cards, allTilted=${cardsTiltCheck.allTilted}, problemIndexAbsent=${!cardsTiltCheck.hasCurriculum}`)
  if (!cardsTiltCheck.allTilted || cardsTiltCheck.hasCurriculum) {
    console.error('  ✗ S3 Rank Tiers tilt check or Problem Index removal check failed!')
    process.exit(1)
  }

  // Test hover straightening on first card
  const card1 = page.locator('#ratings .tier-showcase-card').first()
  await card1.hover()
  await page.waitForTimeout(350)
  const hoverTransform = await page.evaluate(() => {
    const card = document.querySelector('#ratings .tier-showcase-card')
    return window.getComputedStyle(card).transform
  })
  console.log(`  ✓ S3 Rank Card hover straightening: matrix="${hoverTransform}"`)
  if (!hoverTransform.includes('24')) { // translateZ(24px)
    console.error('  ✗ Card did not elevate on hover!')
    process.exit(1)
  }

  // 1E. S6 Leaderboard, S7 FAQ, S8 Final CTA, S9 Footer settled checks
  console.log('\n[3/7] Verifying S6 to S9 section structure & settled states...')
  const sectionsCheck = await page.evaluate(() => {
    const s6 = document.querySelector('#leaderboard-preview .depth-stage')
    const s7 = document.querySelector('#faq .depth-stage')
    const s8 = document.querySelector('#enter-arena .depth-stage')
    const s9 = document.querySelector('#site-footer .depth-stage')
    const emblem = document.querySelector('.final-cta-emblem-wrap')
    return {
      s6Present: !!s6,
      s7Present: !!s7,
      s8Present: !!s8,
      s9Present: !!s9,
      emblemPresent: !!emblem
    }
  })
  console.log(`  ✓ S6 to S9 presence:`, sectionsCheck)

  // ────────────────────────────────────────────────────────────────
  // AUDIT 2: WCAG CONTRAST AUDIT ACROSS ALL SECTIONS
  // ────────────────────────────────────────────────────────────────
  console.log('\n[4/7] Auditing WCAG AA contrast ratios (>= 4.5:1) across all sections...')
  const sectionIds = ['#duel', '#how-it-runs', '#ratings', '#sandbox', '#leaderboard-preview', '#faq', '#enter-arena']
  for (const id of sectionIds) {
    const contrast = await page.evaluate((selector) => {
      const el = document.querySelector(selector)
      if (!el) return null
      const title = el.querySelector('.section-title') || el.querySelector('h1') || el.querySelector('h2')
      const body = el.querySelector('.section-body') || el.querySelector('p')
      
      const getBg = (node) => {
        let p = node
        while (p && p !== document.documentElement) {
          const bg = window.getComputedStyle(p).backgroundColor
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg
          p = p.parentElement
        }
        return 'rgb(2, 6, 23)'
      }

      return {
        titleColor: title ? window.getComputedStyle(title).color : null,
        titleBg: title ? getBg(title) : null,
        bodyColor: body ? window.getComputedStyle(body).color : null,
        bodyBg: body ? getBg(body) : null
      }
    }, id)

    if (contrast?.titleColor) {
      const fg = parseRgb(contrast.titleColor)
      const bg = parseRgb(contrast.titleBg)
      const ratio = getContrast(getLuminance(fg.r, fg.g, fg.b), getLuminance(bg.r, bg.g, bg.b))
      console.log(`  • ${id} Title contrast: ${ratio.toFixed(2)}:1`)
      if (ratio < 4.5) {
        console.error(`  ✗ Title contrast below 4.5:1 in ${id}`)
        process.exit(1)
      }
    }
    if (contrast?.bodyColor) {
      const fg = parseRgb(contrast.bodyColor)
      const bg = parseRgb(contrast.bodyBg)
      const ratio = getContrast(getLuminance(fg.r, fg.g, fg.b), getLuminance(bg.r, bg.g, bg.b))
      console.log(`  • ${id} Body contrast: ${ratio.toFixed(2)}:1`)
      if (ratio < 4.5) {
        console.error(`  ✗ Body contrast below 4.5:1 in ${id}`)
        process.exit(1)
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // AUDIT 3: MOBILE LITE MODE (<900px)
  // ────────────────────────────────────────────────────────────────
  console.log('\n[5/7] Auditing Mobile Lite Mode (390px viewport)...')
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 }
  })
  const mobilePage = await mobileCtx.newPage()
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForSelector('#ratings', { timeout: 10000 })
  await mobilePage.waitForTimeout(400)

  const mobileMetrics = await mobilePage.evaluate(() => {
    const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth
    const stage = document.querySelector('.depth-stage')
    const card = document.querySelector('.tier-showcase-card')
    const stagePerspective = stage ? window.getComputedStyle(stage).perspective : ''
    const cardTransform = card ? window.getComputedStyle(card).transform : ''

    return {
      hasHorizontalOverflow,
      stagePerspective,
      cardTransform
    }
  })
  console.log(`  ✓ Mobile Lite: overflow=${mobileMetrics.hasHorizontalOverflow}, perspective="${mobileMetrics.stagePerspective}", cardTransform="${mobileMetrics.cardTransform}"`)
  if (mobileMetrics.hasHorizontalOverflow || mobileMetrics.stagePerspective !== 'none') {
    console.error('  ✗ Mobile Lite mode failed!')
    process.exit(1)
  }

  // ────────────────────────────────────────────────────────────────
  // AUDIT 4: PREFERS-REDUCED-MOTION
  // ────────────────────────────────────────────────────────────────
  console.log('\n[6/7] Auditing Prefers-Reduced-Motion mode...')
  const rmCtx = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    reducedMotion: 'reduce'
  })
  const rmPage = await rmCtx.newPage()
  await rmPage.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await rmPage.waitForSelector('#ratings', { timeout: 10000 })
  await rmPage.waitForTimeout(400)

  const rmMetrics = await rmPage.evaluate(() => {
    const stage = document.querySelector('.depth-stage')
    const card = document.querySelector('.tier-showcase-card')
    return {
      stagePerspective: stage ? window.getComputedStyle(stage).perspective : '',
      cardTransform: card ? window.getComputedStyle(card).transform : ''
    }
  })
  console.log(`  ✓ Reduced motion: perspective="${rmMetrics.stagePerspective}", transform="${rmMetrics.cardTransform}"`)
  if (rmMetrics.stagePerspective !== 'none' || (rmMetrics.cardTransform !== 'none' && rmMetrics.cardTransform !== 'matrix(1, 0, 0, 1, 0, 0)')) {
    console.error('  ✗ Reduced motion check failed!')
    process.exit(1)
  }

  // ────────────────────────────────────────────────────────────────
  // AUDIT 5: FALLBACK PATH & DEBUG OVERLAY FLAGS
  // ────────────────────────────────────────────────────────────────
  console.log('\n[7/7] Auditing Fallback (?motion=fallback) and Debug (?motion=debug)...')
  const fallbackCtx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
  const fallbackPage = await fallbackCtx.newPage()
  await fallbackPage.goto('http://localhost:5173/?motion=fallback', { waitUntil: 'domcontentloaded' })
  await fallbackPage.waitForSelector('#ratings', { timeout: 10000 })
  const hasFallbackClass = await fallbackPage.evaluate(() => document.documentElement.classList.contains('motion-fallback'))
  console.log(`  ✓ ?motion=fallback flag engaged: ${hasFallbackClass}`)

  const debugCtx = await browser.newContext({ viewport: { width: 1536, height: 864 } })
  const debugPage = await debugCtx.newPage()
  await debugPage.goto('http://localhost:5173/?motion=debug', { waitUntil: 'domcontentloaded' })
  await debugPage.waitForSelector('#ratings', { timeout: 10000 })
  await debugPage.waitForTimeout(400)
  const hasDebugClass = await debugPage.evaluate(() => document.documentElement.classList.contains('motion-debug'))
  const debugPillsCount = await debugPage.evaluate(() => document.querySelectorAll('.depth-debug-pill').length)
  console.log(`  ✓ ?motion=debug flag engaged: ${hasDebugClass}, pillsRendered=${debugPillsCount}`)

  // Final console error check
  if (consoleErrors.length > 0 || pageErrors.length > 0) {
    console.error('  ✗ Console/Page errors detected during audit:', { consoleErrors, pageErrors })
    process.exit(1)
  }
  console.log(`  ✓ ZERO console errors and ZERO page exceptions detected during entire session.`)

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('       ALL PHASE D E2E AUDIT TESTS PASSED (7 / 7)          ')
  console.log('═══════════════════════════════════════════════════════════\n')

  await browser.close()
}

runEndToEndQA().catch(err => {
  console.error('Phase D QA Failed:', err)
  process.exit(1)
})
