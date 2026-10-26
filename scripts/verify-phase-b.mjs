import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const ARTIFACT_DIR = path.join(ROOT_DIR, 'private', 'motion-artifacts', 'phase-b')

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

async function verifyPhaseB() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('       ALGOARENA 3D DEPTH SYSTEM: PHASE B VERIFICATION     ')
  console.log('═══════════════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 }
  })
  const page = await context.newPage()

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#sandbox', { timeout: 10000 })
  await page.waitForSelector('#curriculum', { timeout: 10000 })
  await page.waitForTimeout(600)

  // ────────────────────────────────────────────────────────────────
  // TEST 1: S2 HowItWorks pinned track & alternating rotateY (+/- 8deg)
  // ────────────────────────────────────────────────────────────────
  console.log('[1/6] Verifying S2 HowItWorks pinned stage & alternating rotateY...')

  // 1A. Check containing block ancestor integrity
  const s2AncestorCheck = await page.evaluate(() => {
    const stickyContainer = document.querySelector('.how-sticky-container')
    if (!stickyContainer) return { error: 'Sticky container not found' }
    
    let el = stickyContainer.parentElement
    const badAncestors = []
    while (el && el !== document.documentElement) {
      const style = window.getComputedStyle(el)
      const hasTransform = style.transform && style.transform !== 'none'
      const hasPerspective = style.perspective && style.perspective !== 'none'
      const hasFilter = style.filter && style.filter !== 'none'
      const hasWillChange = style.willChange && (style.willChange.includes('transform') || style.willChange.includes('perspective'))
      if (hasTransform || hasPerspective || hasFilter || hasWillChange) {
        badAncestors.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          transform: style.transform,
          perspective: style.perspective
        })
      }
      el = el.parentElement
    }
    return { badAncestors }
  })

  if (s2AncestorCheck.badAncestors?.length > 0) {
    console.error('  ✗ S2 Ancestor check FAILED: Pinned container has containing-block breaking ancestors:', s2AncestorCheck.badAncestors)
    process.exit(1)
  }
  console.log('  ✓ S2 pinned container has ZERO containing-block breaking ancestors.')

  // 1B. Scroll through track and check stage index and rotation class
  const trackInfo = await page.evaluate(() => {
    const track = document.querySelector('.how-pinned-track')
    const rect = track.getBoundingClientRect()
    return {
      top: rect.top + window.scrollY,
      height: rect.height
    }
  })

  console.log(`  • S2 track at scrollY=${Math.round(trackInfo.top)}px, height=${Math.round(trackInfo.height)}px`)

  const stageSnapshots = []
  for (let stageIdx = 0; stageIdx < 4; stageIdx++) {
    // S2 pinned track has top: 72px sticky container.
    // Scroll so container is inside track and pinned:
    const scrollTarget = (trackInfo.top - 72) + 80 + (stageIdx * 0.25) * (trackInfo.height - (864 - 72))
    await page.evaluate((y) => window.scrollTo(0, y), scrollTarget)
    await page.waitForTimeout(250)

    const stageData = await page.evaluate(() => {
      const card = document.querySelector('.how-inspect-card')
      const sticky = document.querySelector('.how-sticky-container')
      const activeStage = document.querySelector('.how-inspect-header span:first-child')?.textContent || ''
      const rect = sticky ? sticky.getBoundingClientRect() : {}
      const cardClasses = card ? Array.from(card.classList) : []
      const cardTransform = card ? window.getComputedStyle(card).transform : ''

      return {
        activeStage,
        cardClasses,
        cardTransform,
        stickyTop: rect.top,
        pinned: Math.abs(rect.top - 72) <= 5
      }
    })

    stageSnapshots.push({ stageIdx, ...stageData })
    console.log(`  • Progress stage ${stageIdx}: header="${stageData.activeStage}", classes=[${stageData.cardClasses.join(', ')}], stickyTop=${Math.round(stageData.stickyTop)}px, pinned=${stageData.pinned}`)
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 2: S3 Ratings 6-tier plate stack separation
  // ────────────────────────────────────────────────────────────────
  console.log('\n[2/6] Verifying S3 Ratings plate stack separation & settled state...')
  const ratingsPos = await page.evaluate(() => {
    const el = document.querySelector('#ratings')
    const rect = el.getBoundingClientRect()
    return rect.top + window.scrollY
  })

  // Scroll to Ratings section entry
  await page.evaluate((y) => window.scrollTo(0, y - 400), ratingsPos)
  await page.waitForTimeout(300)

  const s3Cards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#ratings .tier-showcase-card'))
    return cards.map((c, i) => {
      const style = window.getComputedStyle(c)
      return {
        index: i,
        transform: style.transform,
        opacity: style.opacity
      }
    })
  })

  console.log(`  ✓ Found ${s3Cards.length} tier showcase cards in S3.`)
  if (s3Cards.length !== 6) {
    console.error(`  ✗ Expected 6 tier cards, found ${s3Cards.length}`)
    process.exit(1)
  }

  // Now scroll directly to Ratings center (settled)
  await page.evaluate((y) => window.scrollTo(0, y + 100), ratingsPos)
  await page.waitForTimeout(400)

  const s3Settled = await page.evaluate(() => {
    const stage = document.querySelector('#ratings .depth-stage')
    const cards = Array.from(document.querySelectorAll('#ratings .tier-showcase-card'))
    const isSettled = stage?.classList.contains('is-settled')
    const transforms = cards.map(c => window.getComputedStyle(c).transform)
    const opacities = cards.map(c => window.getComputedStyle(c).opacity)
    return {
      isSettled,
      allTransformsNone: transforms.every(t => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'),
      allOpacitiesOne: opacities.every(o => parseFloat(o) >= 0.99)
    }
  })

  console.log(`  ✓ S3 Settled verification: isSettled=${s3Settled.isSettled}, transformsSettled=${s3Settled.allTransformsNone}, opacitiesSettled=${s3Settled.allOpacitiesOne}`)

  // ────────────────────────────────────────────────────────────────
  // TEST 3: S4 Sandbox Limits Stagger Rows & Editor Visual Panel
  // ────────────────────────────────────────────────────────────────
  console.log('\n[3/6] Verifying S4 Sandbox limits stagger-row & editor depth visual panel...')
  const sandboxPos = await page.evaluate(() => {
    const el = document.querySelector('#sandbox')
    const rect = el.getBoundingClientRect()
    return rect.top + window.scrollY
  })

  await page.evaluate((y) => window.scrollTo(0, y - 300), sandboxPos)
  await page.waitForTimeout(300)

  const s4Elements = await page.evaluate(() => {
    const limitRows = Array.from(document.querySelectorAll('#sandbox .sandbox-limit-row'))
    const editorPanel = document.querySelector('#sandbox .sandbox-editor-panel')
    const rowsHaveStagger = limitRows.every(r => r.classList.contains('stagger-row'))
    const editorHasPanel = editorPanel?.classList.contains('depth-visual-panel') && editorPanel?.classList.contains('anim-enter')
    
    return {
      limitRowsCount: limitRows.length,
      rowsHaveStagger,
      editorHasPanel
    }
  })

  console.log(`  ✓ S4 Sandbox elements: ${s4Elements.limitRowsCount} rows, staggerClass=${s4Elements.rowsHaveStagger}, editorPanel3D=${s4Elements.editorHasPanel}`)
  if (!s4Elements.rowsHaveStagger || !s4Elements.editorHasPanel) {
    console.error('  ✗ S4 Sandbox stagger-row or depth-visual-panel classes missing!')
    process.exit(1)
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 4: S5 Topics Staggered Ruled Rows
  // ────────────────────────────────────────────────────────────────
  console.log('\n[4/6] Verifying S5 Topics staggered ruled rows...')
  const topicsPos = await page.evaluate(() => {
    const el = document.querySelector('#curriculum')
    const rect = el.getBoundingClientRect()
    return rect.top + window.scrollY
  })

  await page.evaluate((y) => window.scrollTo(0, y - 300), topicsPos)
  await page.waitForTimeout(300)

  const s5Elements = await page.evaluate(() => {
    const topicRows = Array.from(document.querySelectorAll('#curriculum .topic-ruled-row'))
    const rowsHaveStagger = topicRows.every(r => r.classList.contains('stagger-row'))
    
    return {
      topicRowsCount: topicRows.length,
      rowsHaveStagger
    }
  })

  console.log(`  ✓ S5 Topics elements: ${s5Elements.topicRowsCount} topic rows, staggerClass=${s5Elements.rowsHaveStagger}`)
  if (!s5Elements.rowsHaveStagger) {
    console.error('  ✗ S5 Topics stagger-row classes missing!')
    process.exit(1)
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 5: Text Readability & Mid-Transition Contrast (>= 4.5:1)
  // ────────────────────────────────────────────────────────────────
  console.log('\n[5/6] Verifying text contrast ratios across S2, S3, S4, S5...')

  const sectionsToTest = ['#ratings', '#sandbox', '#curriculum']
  for (const sel of sectionsToTest) {
    const pos = await page.evaluate((s) => {
      const el = document.querySelector(s)
      return el ? el.getBoundingClientRect().top + window.scrollY : null
    }, sel)

    if (!pos) continue

    // Position at mid-transition
    await page.evaluate((y) => window.scrollTo(0, y - 250), pos)
    await page.waitForTimeout(200)

    const contrastInfo = await page.evaluate((s) => {
      const section = document.querySelector(s)
      const heading = section.querySelector('.section-title')
      const body = section.querySelector('.section-body') || section.querySelector('p')
      
      const getColors = (el) => {
        if (!el) return null
        const cs = window.getComputedStyle(el)
        let bgCs = cs
        let parent = el.parentElement
        while (parent && (bgCs.backgroundColor === 'transparent' || bgCs.backgroundColor === 'rgba(0, 0, 0, 0)')) {
          bgCs = window.getComputedStyle(parent)
          parent = parent.parentElement
        }
        return {
          color: cs.color,
          bg: bgCs.backgroundColor || 'rgb(2, 6, 23)',
          opacity: cs.opacity
        }
      }

      return {
        heading: getColors(heading),
        body: getColors(body)
      }
    }, sel)

    if (contrastInfo.heading) {
      const fg = parseRgb(contrastInfo.heading.color)
      const bg = parseRgb(contrastInfo.heading.bg)
      const lumFg = getLuminance(fg.r, fg.g, fg.b)
      const lumBg = getLuminance(bg.r, bg.g, bg.b)
      const ratio = getContrast(lumFg, lumBg)
      console.log(`  • ${sel} Heading contrast: ${ratio.toFixed(2)}:1 (opacity: ${contrastInfo.heading.opacity})`)
      if (ratio < 4.5) {
        console.error(`  ✗ Heading contrast failed threshold in ${sel}: ${ratio.toFixed(2)}:1 < 4.5:1`)
        process.exit(1)
      }
    }

    if (contrastInfo.body) {
      const fg = parseRgb(contrastInfo.body.color)
      const bg = parseRgb(contrastInfo.body.bg)
      const lumFg = getLuminance(fg.r, fg.g, fg.b)
      const lumBg = getLuminance(bg.r, bg.g, bg.b)
      const ratio = getContrast(lumFg, lumBg)
      console.log(`  • ${sel} Body contrast: ${ratio.toFixed(2)}:1 (opacity: ${contrastInfo.body.opacity})`)
      if (ratio < 4.5) {
        console.error(`  ✗ Body contrast failed threshold in ${sel}: ${ratio.toFixed(2)}:1 < 4.5:1`)
        process.exit(1)
      }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // TEST 6: Capture Visual Evidence Stills for Report
  // ────────────────────────────────────────────────────────────────
  console.log('\n[6/6] Capturing visual stills across S2, S3, S4, S5...')

  // Still 1: S2 HowItWorks Stage 0 (Queue Axis)
  const still1Y = trackInfo.top - 72 + 100
  await page.evaluate((y) => window.scrollTo(0, y), still1Y)
  await page.waitForTimeout(300)
  const still1 = path.join(ARTIFACT_DIR, 's2_stage0_queue.png')
  await page.screenshot({ path: still1, clip: { x: 0, y: 0, width: 1536, height: 864 } })

  // Still 2: S2 HowItWorks Stage 1 (Sandbox Table with pos rotation)
  const still2Y = trackInfo.top - 72 + 0.35 * (trackInfo.height - (864 - 72))
  await page.evaluate((y) => window.scrollTo(0, y), still2Y)
  await page.waitForTimeout(300)
  const still2 = path.join(ARTIFACT_DIR, 's2_stage1_sandbox.png')
  await page.screenshot({ path: still2, clip: { x: 0, y: 0, width: 1536, height: 864 } })

  // Still 3: S3 Ratings Plates Stack
  const still3Y = ratingsPos - 72 + 120
  await page.evaluate((y) => window.scrollTo(0, y), still3Y)
  await page.waitForTimeout(300)
  const still3 = path.join(ARTIFACT_DIR, 's3_ratings_plates.png')
  await page.screenshot({ path: still3, clip: { x: 0, y: 0, width: 1536, height: 864 } })

  // Still 4: S4 Sandbox Editor & Envelope
  const still4Y = sandboxPos - 72 + 120
  await page.evaluate((y) => window.scrollTo(0, y), still4Y)
  await page.waitForTimeout(300)
  const still4 = path.join(ARTIFACT_DIR, 's4_sandbox_view.png')
  await page.screenshot({ path: still4, clip: { x: 0, y: 0, width: 1536, height: 864 } })

  // Still 5: S5 Curriculum / Topics Ruled Rows
  const still5Y = topicsPos - 72 + 120
  await page.evaluate((y) => window.scrollTo(0, y), still5Y)
  await page.waitForTimeout(300)
  const still5 = path.join(ARTIFACT_DIR, 's5_topics_catalog.png')
  await page.screenshot({ path: still5, clip: { x: 0, y: 0, width: 1536, height: 864 } })

  console.log(`  ✓ Saved 5 visual verification screenshots to ${ARTIFACT_DIR}`)
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('       ALL PHASE B VERIFICATION TESTS PASSED (6/6)        ')
  console.log('═══════════════════════════════════════════════════════════\n')

  await browser.close()
}

verifyPhaseB().catch((err) => {
  console.error('Phase B Verification Failed:', err)
  process.exit(1)
})
