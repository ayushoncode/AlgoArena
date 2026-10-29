import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const artifactDir = '/Users/ayush/.gemini/antigravity/brain/7068b68a-c0f7-4ee0-a57a-4dc3144aa86b'
const screenshotsDir = '/Users/ayush/algoarena/private/auth-screenshots'

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

async function capture() {
  const browser = await chromium.launch({ headless: true })
  
  // 1. Desktop: 1440x900
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await contextDesktop.newPage()

  // Clear any existing auth tokens from localStorage so we see guest auth state
  await page.goto('http://localhost:5173')
  await page.evaluate(() => localStorage.clear())

  console.log('1. Capturing Desktop Login...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const loginDesktop = path.join(screenshotsDir, 'auth_login_desktop.png')
  await page.screenshot({ path: loginDesktop, fullPage: false })
  fs.copyFileSync(loginDesktop, path.join(artifactDir, 'auth_login_desktop.png'))

  console.log('2. Capturing Desktop Register / Signup...')
  await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  
  // Fill in some sample data to show strength meter and selection
  await page.fill('#reg-handle', 'algo_titan')
  await page.fill('#reg-email', 'coder@algoarena.io')
  await page.fill('#reg-password', 'Pass1234!')
  
  const signupDesktop = path.join(screenshotsDir, 'auth_signup_desktop.png')
  await page.screenshot({ path: signupDesktop, fullPage: false })
  fs.copyFileSync(signupDesktop, path.join(artifactDir, 'auth_signup_desktop.png'))

  console.log('3. Capturing Desktop Forgot Password...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.click('button:has-text("Forgot password?")')
  await page.waitForTimeout(300)
  await page.fill('#reset-email', 'coder@algoarena.io')
  const forgotDesktop = path.join(screenshotsDir, 'auth_forgot_desktop.png')
  await page.screenshot({ path: forgotDesktop, fullPage: false })
  fs.copyFileSync(forgotDesktop, path.join(artifactDir, 'auth_forgot_desktop.png'))

  // 4. Mobile: 390x844 (iPhone 14)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
  })
  const mobilePage = await contextMobile.newPage()

  console.log('4. Capturing Mobile Login...')
  await mobilePage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(500)
  const loginMobile = path.join(screenshotsDir, 'auth_login_mobile.png')
  await mobilePage.screenshot({ path: loginMobile, fullPage: false })
  fs.copyFileSync(loginMobile, path.join(artifactDir, 'auth_login_mobile.png'))

  console.log('5. Capturing Mobile Signup...')
  await mobilePage.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(500)
  const signupMobile = path.join(screenshotsDir, 'auth_signup_mobile.png')
  await mobilePage.screenshot({ path: signupMobile, fullPage: false })
  fs.copyFileSync(signupMobile, path.join(artifactDir, 'auth_signup_mobile.png'))

  await browser.close()
  console.log('All screenshots captured and copied to artifact directory!')
}

capture().catch((err) => {
  console.error('Error capturing auth screenshots:', err)
  process.exit(1)
})

