import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const ARTIFACT_DIR = '/Users/ayush/.gemini/antigravity-ide/brain/83692b29-6bf3-4459-9bff-cce862f1c663'

async function runTest() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 }
  })
  const page = await context.newPage()

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#ratings', { timeout: 10000 })
  await page.waitForTimeout(600)

  // 1. Check if #curriculum exists
  const hasCurriculum = await page.evaluate(() => !!document.querySelector('#curriculum'))
  console.log('Has #curriculum (Problem Index):', hasCurriculum)

  // 2. Scroll to Ratings section
  const ratingsPos = await page.evaluate(() => {
    const el = document.querySelector('#ratings')
    return el.getBoundingClientRect().top + window.scrollY
  })

  await page.evaluate((y) => window.scrollTo(0, y - 72 + 60), ratingsPos)
  await page.waitForTimeout(500)

  // Check resting transforms
  const restingTransforms = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#ratings .tier-showcase-card'))
    return cards.map((c, i) => ({
      index: i,
      transform: window.getComputedStyle(c).transform
    }))
  })
  console.log('Resting transforms:', restingTransforms)

  // Take screenshot of tilted resting state
  const restingPath = path.join(ARTIFACT_DIR, 'rank_tier_tilted_resting.png')
  await page.screenshot({ path: restingPath, clip: { x: 0, y: 72, width: 1536, height: 792 } })
  console.log('Saved resting screenshot:', restingPath)

  // 3. Hover over the first card (Grandmaster)
  const card1 = page.locator('#ratings .tier-showcase-card').first()
  await card1.hover()
  await page.waitForTimeout(400)

  const hoverTransform = await page.evaluate(() => {
    const card = document.querySelector('#ratings .tier-showcase-card')
    return window.getComputedStyle(card).transform
  })
  console.log('Hovered card transform:', hoverTransform)

  // Take screenshot with hover active
  const hoverPath = path.join(ARTIFACT_DIR, 'rank_tier_hover_straight.png')
  await page.screenshot({ path: hoverPath, clip: { x: 0, y: 72, width: 1536, height: 792 } })
  console.log('Saved hovered screenshot:', hoverPath)

  await browser.close()
}

runTest().catch(console.error)
