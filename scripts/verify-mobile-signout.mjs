import { chromium } from 'playwright'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(rootDir, 'backend', '.env') })

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'

async function testMobileSignOut() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  const user1 = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayushoncode',
    elo_rating: 1220,
    email: 'ayush916282580@gmail.com',
  }
  const token1 = jwt.sign(user1, JWT_SECRET, { expiresIn: '7d' })

  console.log('Mobile Step 1: Navigating to landing page and setting session...')
  await page.goto('http://localhost:5173')
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('aa_user', JSON.stringify({ ...u, token: t }))
    localStorage.setItem('aa_token', t)
  }, { u: user1, t: token1 })

  console.log('Mobile Step 2: Navigating to /lobby...')
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  console.log('Mobile Step 3: Opening mobile menu drawer...')
  const burgerBtn = page.locator('#nav-hamburger-btn')
  await burgerBtn.waitFor({ state: 'visible', timeout: 5000 })
  await burgerBtn.click()

  console.log('Mobile Step 4: Clicking Sign out button (#nav-logout-mobile)...')
  const logoutBtn = page.locator('#nav-logout-mobile')
  await logoutBtn.waitFor({ state: 'visible', timeout: 5000 })
  await logoutBtn.click()

  console.log('Mobile Step 5: Waiting after mobile sign out...')
  await page.waitForTimeout(1000)

  const finalUrl = page.url()
  console.log('Final URL after mobile sign out:', finalUrl)

  const heroHeading = await page.locator('.hero .title, #section-hero').first().isVisible()
  console.log('Landing page hero visible on mobile:', heroHeading)

  if (finalUrl.includes('/login')) {
    console.error('FAIL: User was redirected to /login on mobile!')
    await browser.close()
    process.exit(1)
  }

  if (finalUrl === 'http://localhost:5173/' || finalUrl === 'http://localhost:5173') {
    console.log('SUCCESS: Mobile sign out redirected cleanly to AlgoArena landing page!')
  }

  await browser.close()
}

testMobileSignOut().catch((err) => {
  console.error('Error during mobile sign out test:', err)
  process.exit(1)
})
