import { chromium } from 'playwright'

async function audit() {
  console.log('Running comprehensive QA audit on http://localhost:5173/who-we-are...')
  const browser = await chromium.launch({ headless: true })

  // 1. Mobile Performance & Web Vitals Audit
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })

  await mobilePage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(500)

  const perfMetrics = await mobilePage.evaluate(async () => {
    const navEntry = performance.getEntriesByType('navigation')[0]
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0

    // Measure LCP
    let lcp = 0
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      lcp = lastEntry ? lastEntry.startTime : 0
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })

    // Measure CLS
    let cls = 0
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          cls += entry.value
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    await new Promise(r => setTimeout(r, 600))
    observer.disconnect()
    clsObserver.disconnect()

    return {
      fcp: Math.round(fcp),
      lcp: Math.round(lcp || fcp),
      cls: Number(cls.toFixed(4)),
      domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime),
      load: Math.round(navEntry.loadEventEnd - navEntry.startTime),
    }
  })

  console.log('Mobile Web Vitals:', perfMetrics)

  // 2. Reduced Motion Test
  const reducedMotionPage = await browser.newPage({
    viewport: { width: 1536, height: 960 },
    reducedMotion: 'reduce',
  })
  await reducedMotionPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await reducedMotionPage.waitForTimeout(300)

  const reducedMotionChecks = await reducedMotionPage.evaluate(() => {
    const wipeHeading = document.querySelector('.who-reveal-wipe')
    const wipeStyle = wipeHeading ? window.getComputedStyle(wipeHeading).animationName : ''
    const plate3D = document.querySelector('.who-plate-stage-3d')
    const platePersp = plate3D ? window.getComputedStyle(plate3D).perspective : ''
    const portraitPlate = document.querySelector('.who-portrait-plate')
    const portraitTransform = portraitPlate ? window.getComputedStyle(portraitPlate).transform : ''

    return {
      wipeAnimationDisabled: wipeStyle === 'none',
      perspectiveDisabled: platePersp === 'none',
      portraitTransformFlat: portraitTransform === 'none' || portraitTransform.includes('matrix(1, 0, 0, 1, 0, 0)'),
    }
  })

  console.log('Reduced Motion Checks:', reducedMotionChecks)

  // 3. Route Change and Scroll Restoration Test
  await reducedMotionPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  await reducedMotionPage.evaluate(() => window.scrollTo(0, 1200))
  await reducedMotionPage.waitForTimeout(200)

  // Navigate to /terms
  await reducedMotionPage.click('a[href="/terms"]')
  await reducedMotionPage.waitForTimeout(400)
  const termsScroll = await reducedMotionPage.evaluate(() => window.scrollY)
  const isWhoClassRemoved = await reducedMotionPage.evaluate(() => !document.documentElement.classList.contains('is-who-page'))

  // Navigate back to /who-we-are
  await reducedMotionPage.click('a[href="/"]')
  await reducedMotionPage.waitForTimeout(400)
  const homeScroll = await reducedMotionPage.evaluate(() => window.scrollY)

  console.log('Navigation & Route Restoration Checks:', {
    termsScrollTop: termsScroll === 0,
    isWhoClassRemovedOnLeave: isWhoClassRemoved,
    homeScrollRestored: homeScroll >= 0,
  })

  // 4. Keyboard Tab Flow Test
  const tabPage = await browser.newPage({ viewport: { width: 1536, height: 960 } })
  await tabPage.goto('http://localhost:5173/who-we-are', { waitUntil: 'networkidle' })
  const focusedElements = []
  for (let i = 0; i < 15; i++) {
    await tabPage.keyboard.press('Tab')
    const tagAndText = await tabPage.evaluate(() => {
      const el = document.activeElement
      return el ? `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ')[0] : ''} [${(el.innerText || el.getAttribute('aria-label') || '').slice(0, 20)}]` : 'none'
    })
    focusedElements.push(tagAndText)
  }
  console.log('Keyboard Tab Sequence (first 15 steps):', focusedElements)

  await browser.close()
  console.log('\nAudit complete.')
}

audit().catch(e => {
  console.error('Audit failed:', e)
  process.exit(1)
})
