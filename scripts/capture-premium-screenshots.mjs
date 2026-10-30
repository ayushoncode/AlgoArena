/**
 * scripts/capture-premium-screenshots.mjs
 *
 * Captures clean visual QA screenshots across:
 * - Viewports: 390x844 (Mobile), 820x1180 (Tablet), 1194x834 (Laptop), 1536x960 (Desktop)
 * - Themes: dark, light
 * - Pages: /premium, /account/billing, /refund-policy, /lobby (with locked dialog)
 * - Destination: private/premium-screenshots/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'private', 'premium-screenshots')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const VIEWPORTS = [
  { name: '390-phone', width: 390, height: 844 },
  { name: '820-tablet', width: 820, height: 1180 },
  { name: '1194-laptop', width: 1194, height: 834 },
  { name: '1536-desktop', width: 1536, height: 960 }
]

const THEMES = ['dark', 'light']

async function run() {
  console.log('Launching browser to capture visual QA screenshots...')
  const browser = await chromium.launch({ headless: true })

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme
      })
      const page = await context.newPage()

      // Set localStorage theme if light
      await page.addInitScript((th) => {
        document.documentElement.setAttribute('data-theme', th)
        localStorage.setItem('algoarena-theme', th)
      }, theme)

      // 1. /premium page
      try {
        await page.goto('http://localhost:5173/premium', { waitUntil: 'networkidle' })
        await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme)
        await page.waitForTimeout(400)
        const premiumFile = path.join(outDir, `premium_${vp.name}_${theme}.png`)
        await page.screenshot({ path: premiumFile, fullPage: true })
        console.log(`Saved: ${path.basename(premiumFile)}`)
      } catch (err) {
        console.warn(`Failed /premium ${vp.name} ${theme}:`, err.message)
      }

      // 2. /account/billing page
      try {
        await page.goto('http://localhost:5173/account/billing', { waitUntil: 'networkidle' })
        await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme)
        await page.waitForTimeout(400)
        const billingFile = path.join(outDir, `billing_${vp.name}_${theme}.png`)
        await page.screenshot({ path: billingFile, fullPage: true })
        console.log(`Saved: ${path.basename(billingFile)}`)
      } catch (err) {
        console.warn(`Failed /account/billing ${vp.name} ${theme}:`, err.message)
      }

      // 3. /refund-policy page
      try {
        await page.goto('http://localhost:5173/refund-policy', { waitUntil: 'networkidle' })
        await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme)
        await page.waitForTimeout(400)
        const refundFile = path.join(outDir, `refund_policy_${vp.name}_${theme}.png`)
        await page.screenshot({ path: refundFile, fullPage: true })
        console.log(`Saved: ${path.basename(refundFile)}`)
      } catch (err) {
        console.warn(`Failed /refund-policy ${vp.name} ${theme}:`, err.message)
      }

      // 4. /lobby locked modal state (desktop viewport)
      if (vp.width >= 1194 && theme === 'dark') {
        try {
          await page.goto('http://localhost:5173/lobby', { waitUntil: 'networkidle' })
          await page.waitForTimeout(500)
          // Click Striver tab to trigger quiet locked modal
          const striverTab = page.locator('.lobby-v2-striver-tab')
          if (await striverTab.isVisible()) {
            await striverTab.click()
            await page.waitForTimeout(300)
            const modalFile = path.join(outDir, `lobby_locked_modal_${vp.name}_${theme}.png`)
            await page.screenshot({ path: modalFile })
            console.log(`Saved: ${path.basename(modalFile)}`)
          }
        } catch (err) {
          console.warn(`Failed lobby locked modal capture:`, err.message)
        }
      }

      await context.close()
    }
  }

  await browser.close()
  console.log('\nAll visual QA screenshots captured successfully in private/premium-screenshots/')
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err)
  process.exit(1)
})

