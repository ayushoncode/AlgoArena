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

async function testSignOut() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
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

  console.log('Step 1: Navigating to landing page and setting authenticated session...')
  await page.goto('http://localhost:5173')
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('aa_user', JSON.stringify({ ...u, token: t }))
    localStorage.setItem('aa_token', t)
  }, { u: user1, t: token1 })

  console.log('Step 2: Navigating to /lobby...')
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  console.log('Current URL on lobby:', page.url())

  console.log('Step 3: Clicking user avatar menu...')
  const avatarBtn = page.locator('#nav-user-btn')
  await avatarBtn.waitFor({ state: 'visible', timeout: 5000 })
  await avatarBtn.click()

  console.log('Step 4: Clicking Sign out button (#nav-logout)...')
  const logoutBtn = page.locator('#nav-logout')
  await logoutBtn.waitFor({ state: 'visible', timeout: 5000 })
  await logoutBtn.click()

  console.log('Step 5: Waiting after sign out...')
  await page.waitForTimeout(1000)

  const finalUrl = page.url()
  console.log('Final URL after sign out:', finalUrl)

  const heroHeading = await page.locator('.hero .title, #section-hero').first().isVisible()
  console.log('Landing page hero visible:', heroHeading)

  if (finalUrl.includes('/login')) {
    console.error('FAIL: User was redirected to /login instead of landing page!')
    await browser.close()
    process.exit(1)
  }

  if (finalUrl === 'http://localhost:5173/' || finalUrl === 'http://localhost:5173') {
    console.log('SUCCESS: Sign out redirected cleanly to AlgoArena landing page!')
  } else {
    console.warn('URL was:', finalUrl)
  }

  await browser.close()
}

testSignOut().catch((err) => {
  console.error('Error during sign out test:', err)
  process.exit(1)
})
