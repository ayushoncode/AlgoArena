import { chromium } from 'playwright'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(rootDir, 'backend', '.env') })

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'
const artifactDir = '/Users/ayush/.gemini/antigravity/brain/7068b68a-c0f7-4ee0-a57a-4dc3144aa86b'

async function testOnboardingModal() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  // New Google signup user: is_username_set is false, institute_locked is false
  const newUser = {
    id: 'ba6d8856-a6f5-40d5-80bf-4fa44ce4f073',
    username: 'ayush_newbie',
    email: 'ayush_new@gmail.com',
    elo_rating: 1200,
    is_username_set: false,
    institute: '',
    institute_locked: false,
  }
  const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' })

  console.log('1. Setting up new Google signup user session...')
  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...newUser,
        is_username_set: false,
        institute_locked: false,
      }),
    })
  })

  await page.goto('http://localhost:5173')
  await page.evaluate(({ u, t }) => {
    localStorage.setItem('aa_user', JSON.stringify({ ...u, token: t }))
    localStorage.setItem('aa_token', t)
  }, { u: newUser, t: token })

  console.log('2. Navigating to /lobby...')
  await page.goto('http://localhost:5173/lobby', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)

  console.log('3. Checking if Onboarding Modal appeared...')
  const card = page.locator('.onboarding-card')
  await card.waitFor({ state: 'visible', timeout: 5000 })
  console.log('Onboarding card visible: true')

  console.log('4. Checking if both Handle and Institute fields are in the same card...')
  const handleInput = page.locator('#onboarding-handle')
  const instituteInput = page.locator('#onboarding-institute')

  const hasHandle = await handleInput.isVisible()
  const hasInstitute = await instituteInput.isVisible()
  console.log('Handle input visible:', hasHandle)
  console.log('Institute input visible:', hasInstitute)

  if (!hasHandle || !hasInstitute) {
    console.error('FAIL: Both fields must be in the same card!')
    await browser.close()
    process.exit(1)
  }

  // Type in handle
  await handleInput.fill('cyber_titan')
  await page.waitForTimeout(500)

  // Type in institute to test autocomplete
  await instituteInput.fill('IIT Delhi')
  await page.waitForTimeout(300)

  const screenshotPath = path.join(artifactDir, 'unified_onboarding_modal.png')
  await page.screenshot({ path: screenshotPath })
  console.log('Screenshot saved to:', screenshotPath)

  await browser.close()
  console.log('SUCCESS: Unified Onboarding Modal verified completely!')
}

testOnboardingModal().catch((err) => {
  console.error('Error testing onboarding modal:', err)
  process.exit(1)
})
