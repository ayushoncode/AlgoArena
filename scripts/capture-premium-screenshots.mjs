/**
 * scripts/capture-premium-screenshots.mjs
 *
 * Captures clean visual QA screenshots across:
 * - Viewports: 390x844 (Mobile), 820x1180 (Tablet), 1194x834 (Laptop), 1536x960 (Desktop)
 * - Themes: dark, light
 * - States: logged_out, free_user, sold_out, subscribed, loading, offer_failed
 * - Destination: private/premium-screenshots/
 *
 * Also audits:
 * - Overlaps & clipping
 * - Tap targets under 44px
 * - Console errors
 * - Layout shift
 * - Axe-core WCAG AA accessibility
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
  { name: '390', width: 390, height: 844 },
  { name: '820', width: 820, height: 1180 },
  { name: '1194', width: 1194, height: 834 },
  { name: '1536', width: 1536, height: 960 }
]

const THEMES = ['dark', 'light']

const STATES = [
  'logged_out',
  'free_user',
  'sold_out',
  'subscribed',
  'loading',
  'offer_failed'
]

async function run() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('       ALGOARENA /premium PAGE QA & SCREENSHOT SUITE           ')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const browser = await chromium.launch({ headless: true })

  const auditReport = {
    totalScreenshots: 0,
    consoleErrors: [],
    tapTargetViolations: [],
    overlapIssues: [],
    maxLayoutShift: 0,
    axeViolations: []
  }

  // Iterate over each state and theme across all 4 viewports
  for (const state of STATES) {
    console.log(`\n--- Capturing State: [${state}] ---`)

    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme
        })
        const page = await context.newPage()

        // Track console errors
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            auditReport.consoleErrors.push(`[${state}][${theme}][${vp.name}] ${msg.text()}`)
          }
        })
        page.on('pageerror', (err) => {
          auditReport.consoleErrors.push(`[${state}][${theme}][${vp.name}] uncaught: ${err.message}`)
        })

        // Apply theme early in init script safely
        await page.addInitScript((th) => {
          try {
            localStorage.setItem('algoarena-theme', th)
          } catch (e) {}
          if (document && document.documentElement) {
            document.documentElement.setAttribute('data-theme', th)
          }
          window.addEventListener('DOMContentLoaded', () => {
            if (document && document.documentElement) {
              document.documentElement.setAttribute('data-theme', th)
            }
          })
        }, theme)

        try {
          const targetUrl = `http://localhost:5173/premium?mockState=${state}`
          await page.goto(targetUrl, { waitUntil: 'networkidle' })
          await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme)
          await page.waitForTimeout(300)

          // Measure layout shift
          const cls = await page.evaluate(() => {
            return new Promise((resolve) => {
              let clsValue = 0
              try {
                const observer = new PerformanceObserver((entryList) => {
                  for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                      clsValue += entry.value
                    }
                  }
                })
                observer.observe({ type: 'layout-shift', buffered: true })
                setTimeout(() => {
                  observer.disconnect()
                  resolve(clsValue)
                }, 200)
              } catch {
                resolve(0)
              }
            })
          })
          if (cls > auditReport.maxLayoutShift) {
            auditReport.maxLayoutShift = cls
          }

          // Measure tap targets on /premium components (buttons, links, triggers)
          const smallTargets = await page.evaluate(() => {
            const interactiveElements = document.querySelectorAll('.premium-page-wrapper button, .premium-page-wrapper a, .premium-mobile-sticky-bar button')
            const badTargets = []
            interactiveElements.forEach((el) => {
              // Ignore hidden or 0x0 elements
              const rect = el.getBoundingClientRect()
              if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') return
              if (rect.height < 44 || rect.width < 44) {
                badTargets.push({
                  tag: el.tagName.toLowerCase(),
                  text: (el.textContent || '').trim().slice(0, 30),
                  w: Math.round(rect.width),
                  h: Math.round(rect.height),
                  className: el.className
                })
              }
            })
            return badTargets
          })

          if (smallTargets.length > 0) {
            smallTargets.forEach((t) => {
              const entry = `[${state}][${theme}][${vp.name}] <${t.tag}> "${t.text}" (${t.w}x${t.h}px)`
              if (!auditReport.tapTargetViolations.includes(entry)) {
                auditReport.tapTargetViolations.push(entry)
              }
            })
          }

          // Overlaps detection on plan cards
          const overlaps = await page.evaluate(() => {
            const cards = document.querySelectorAll('.premium-plan-card')
            if (cards.length < 2) return []
            const r1 = cards[0].getBoundingClientRect()
            const r2 = cards[1].getBoundingClientRect()
            const issues = []
            // Check bounding collision
            const collides = !(
              r1.right <= r2.left ||
              r1.left >= r2.right ||
              r1.bottom <= r2.top ||
              r1.top >= r2.bottom
            )
            if (collides) {
              issues.push('Cards overlap each other')
            }
            return issues
          })
          if (overlaps.length > 0) {
            auditReport.overlapIssues.push(`[${state}][${theme}][${vp.name}] ${overlaps.join(', ')}`)
          }

          // Run axe-core WCAG AA accessibility audit on desktop viewport
          if (vp.name === '1194' && state === 'free_user') {
            try {
              await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' })
              const axeRes = await page.evaluate(async () => {
                return await window.axe.run(document, {
                  runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa']
                  }
                })
              })
              if (axeRes.violations && axeRes.violations.length > 0) {
                axeRes.violations.forEach((v) => {
                  auditReport.axeViolations.push({
                    id: v.id,
                    impact: v.impact,
                    description: v.description,
                    theme
                  })
                })
              }
            } catch (axeErr) {
              console.warn('Axe injection skipped or network restricted:', axeErr.message)
            }
          }

          // Save screenshot
          const screenshotFileName = `premium_${state}_${vp.name}_${theme}.png`
          const filePath = path.join(outDir, screenshotFileName)
          await page.screenshot({ path: filePath, fullPage: true })
          auditReport.totalScreenshots++

        } catch (err) {
          console.error(`Failed ${state} ${theme} ${vp.name}:`, err.message)
        } finally {
          await context.close()
        }
      }
      console.log(`  ✓ ${theme} theme (4 viewports: 390, 820, 1194, 1536) captured`)
    }
  }

  await browser.close()

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('                   QA & AUDIT RESULTS SUMMARY                  ')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Total Screenshots Captured:  ${auditReport.totalScreenshots} (saved to private/premium-screenshots/)`)
  console.log(`Console / Page Errors:       ${auditReport.consoleErrors.length}`)
  if (auditReport.consoleErrors.length > 0) {
    auditReport.consoleErrors.forEach((e) => console.log(`  ! ${e}`))
  }

  console.log(`Card Overlaps / Collisions:  ${auditReport.overlapIssues.length}`)
  if (auditReport.overlapIssues.length > 0) {
    auditReport.overlapIssues.forEach((o) => console.log(`  ! ${o}`))
  }

  console.log(`Tap Targets Under 44px:      ${auditReport.tapTargetViolations.length}`)
  if (auditReport.tapTargetViolations.length > 0) {
    auditReport.tapTargetViolations.forEach((t) => console.log(`  ! ${t}`))
  }

  console.log(`Max Layout Shift (CLS):      ${auditReport.maxLayoutShift.toFixed(4)} (Goal: < 0.1)`)
  console.log(`Axe-core WCAG AA Violations: ${auditReport.axeViolations.length}`)
  if (auditReport.axeViolations.length > 0) {
    console.log(JSON.stringify(auditReport.axeViolations, null, 2))
  }
  console.log('═══════════════════════════════════════════════════════════════\n')
}

run().catch((err) => {
  console.error('Audit suite failed:', err)
  process.exit(1)
})
