import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const widths = [390, 820, 1194, 1536, 1920]
const outDir = path.resolve('private/leaderboard-screenshots')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const report = {
    horizontalScrolls: [],
    consoleErrors: [],
    smallTapTargets: [],
    viewportsTested: [],
  }

  // 1. Logged Out across all 5 widths
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 950 } })
    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(`[${width}px] ${msg.text()}`)
    })

    await page.goto('http://localhost:5173/leaderboard', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    // Check horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    if (scrollWidth > clientWidth) {
      report.horizontalScrolls.push({ width, scrollWidth, clientWidth })
    }

    // Check tap targets under 44px on mobile/tablet (<= 820px)
    if (width <= 820) {
      const smallTargets = await page.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll('button, a, input, [role="button"], [role="link"], [role="tab"]'))
        const small = []
        for (const el of interactive) {
          const rect = el.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            // Check if element or parent has min touch target or padding
            const tag = el.tagName.toLowerCase()
            const text = (el.innerText || el.getAttribute('aria-label') || '').slice(0, 20)
            small.push({ tag, text, w: Math.round(rect.width), h: Math.round(rect.height) })
          }
        }
        return small
      })
      if (smallTargets.length > 0) {
        report.smallTapTargets.push({ width, smallTargets: smallTargets.slice(0, 5) })
      }
    }

    const outPath = path.join(outDir, `leaderboard-${width}-loaded-logged-out.png`)
    await page.screenshot({ path: outPath, fullPage: true })
    report.viewportsTested.push(`${width}px loaded`)
    await page.close()
  }

  // 2. Logged In state (mock user in localStorage)
  {
    const page = await browser.newPage({ viewport: { width: 1240, height: 950 } })
    await page.addInitScript(() => {
      localStorage.setItem('aa_token', 'mock_token_123')
      localStorage.setItem('aa_user', JSON.stringify({
        id: 'user_ayush',
        username: 'ayushoncode',
        elo_rating: 1220,
        wins: 63,
        losses: 60,
      }))
    })

    await page.goto('http://localhost:5173/leaderboard', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    const isMeHighlighted = await page.locator('.lb-row.is-me').count()
    console.log('Current user row highlighted count:', isMeHighlighted)

    await page.screenshot({
      path: path.join(outDir, 'leaderboard-1240-logged-in-user-row.png'),
      fullPage: true,
    })
    await page.close()
  }

  // 3. Empty Search State
  {
    const page = await browser.newPage({ viewport: { width: 1240, height: 950 } })
    await page.goto('http://localhost:5173/leaderboard', { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    const searchInput = page.locator('#leaderboard-player-search')
    await searchInput.fill('nonexistent_coder_xyz')
    await page.waitForTimeout(400)

    await page.screenshot({
      path: path.join(outDir, 'leaderboard-1240-empty-search.png'),
    })
    await page.close()
  }

  console.log('Screenshot capture report:', JSON.stringify(report, null, 2))
  await browser.close()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
