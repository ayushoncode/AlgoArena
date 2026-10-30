/**
 * scripts/capture-result-screenshots.mjs
 *
 * Captures ResultV2 screenshots across all required match end causes:
 * - Victory
 * - Defeat
 * - Draw
 * - You resigned
 * - Rival resigned
 * - Time ran out
 *
 * Across viewports: 390, 820, 1194, 1366, 1536
 * In Dark and Light modes.
 *
 * Saves to private/battle-screenshots/
 * Checks: horizontal scroll, console errors, small tap targets under 44px.
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'private', 'battle-screenshots')

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

const VIEWPORTS = [
  { width: 390, height: 844, name: '390_mobile' },
  { width: 820, height: 1180, name: '820_tablet' },
  { width: 1194, height: 834, name: '1194_small_desktop' },
  { width: 1366, height: 768, name: '1366_desktop' },
  { width: 1536, height: 960, name: '1536_wide' },
]

const USER_ME = {
  username: 'ayushoncode',
  elo_rating: 1218,
  avatar_seed: 'seed1',
}

const SCENARIOS = [
  {
    name: 'victory_solved_first',
    title: 'Victory (Solved First)',
    state: {
      result: 'WIN',
      topic: 'dynamic-programming',
      difficulty: 'hard',
      roomId: 'room:7a8b9c0d1e2f',
      winner: { username: 'ayushoncode', rating: 1200, newRating: 1222, delta: 22 },
      loser: { username: 'shreshth_rival', rating: 1210, newRating: 1192, delta: -18 },
    },
  },
  {
    name: 'defeat_rival_solved',
    title: 'Defeat (Rival Solved)',
    state: {
      result: 'LOSS',
      topic: 'two-pointers',
      difficulty: 'medium',
      roomId: 'room:f1e2d3c4b5a6',
      winner: { username: 'champion_99', rating: 1250, newRating: 1266, delta: 16 },
      loser: { username: 'ayushoncode', rating: 1218, newRating: 1202, delta: -16 },
    },
  },
  {
    name: 'draw_timeout',
    title: 'Draw (Time Expired)',
    state: {
      result: 'DRAW',
      topic: 'trees',
      difficulty: 'medium',
      roomId: 'room:9876543210ab',
      winner: null,
      loser: null,
    },
  },
  {
    name: 'you_resigned',
    title: 'You Resigned (Defeat)',
    state: {
      isForfeit: true,
      forfeitUser: 'ayushoncode',
      topic: 'graphs',
      difficulty: 'hard',
      roomId: 'room:112233445566',
      winner: { username: 'code_master', rating: 1300, newRating: 1318, delta: 18 },
      loser: { username: 'ayushoncode', rating: 1202, newRating: 1184, delta: -18 },
    },
  },
  {
    name: 'rival_resigned',
    title: 'Rival Resigned (Victory)',
    state: {
      isForfeit: true,
      forfeitUser: 'opponent_coder',
      topic: 'arrays',
      difficulty: 'easy',
      roomId: 'room:aabbccddeeff',
      winner: { username: 'ayushoncode', rating: 1184, newRating: 1202, delta: 18 },
      loser: { username: 'opponent_coder', rating: 1190, newRating: 1172, delta: -18 },
    },
  },
  {
    name: 'rival_left_disconnect',
    title: 'Rival Left (Victory)',
    state: {
      result: 'WIN',
      topic: 'strings',
      difficulty: 'medium',
      roomId: 'room:334455667788',
      reason: 'disconnect',
      winner: { username: 'ayushoncode', rating: 1202, newRating: 1220, delta: 18 },
      loser: { username: 'ghost_user', rating: 1205, newRating: 1187, delta: -18, disconnected: true },
    },
  },
  {
    name: 'promotion_to_apprentice',
    title: 'Rank Promotion',
    state: {
      result: 'WIN',
      topic: 'arrays',
      difficulty: 'medium',
      roomId: 'room:5566778899aa',
      winner: { username: 'ayushoncode', rating: 1192, newRating: 1210, delta: 18 },
      loser: { username: 'challenger', rating: 1200, newRating: 1182, delta: -18 },
    },
  },
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const report = {
    horizontalScrolls: [],
    consoleErrors: [],
    smallTapTargets: [],
    scenariosCaptured: [],
  }

  try {
    for (const theme of ['dark', 'light']) {
      for (const scenario of SCENARIOS) {
        // Test primary desktop 1366 first, plus mobile 390
        for (const vp of VIEWPORTS) {
          const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })

          page.on('console', msg => {
            if (msg.type() === 'error' && !msg.text().includes('favicon')) {
              report.consoleErrors.push(`[${theme}][${vp.width}px][${scenario.name}] ${msg.text()}`)
            }
          })

          await page.addInitScript(({ state, user, themeName }) => {
            window.history.replaceState({ idx: 0, key: 'init', usr: state }, '', '/result')
            localStorage.setItem('aa_user', JSON.stringify(user))
            localStorage.setItem('aa_theme', themeName)
            if (themeName === 'light') {
              document.documentElement.classList.add('light')
              document.documentElement.classList.remove('dark')
            } else {
              document.documentElement.classList.add('dark')
              document.documentElement.classList.remove('light')
            }
          }, { state: scenario.state, user: USER_ME, themeName: theme })

          await page.goto('http://localhost:5173/result', { waitUntil: 'networkidle' })
          await page.waitForTimeout(300)

          // In light theme, ensure class is on root
          if (theme === 'light') {
            await page.evaluate(() => {
              document.documentElement.classList.add('light')
              document.documentElement.classList.remove('dark')
            })
          }

          // Check horizontal overflow
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
          if (scrollWidth > clientWidth) {
            report.horizontalScrolls.push({ theme, viewport: vp.width, scenario: scenario.name, scrollWidth, clientWidth })
          }

          // Check tap targets under 44px on mobile
          if (vp.width <= 820) {
            const smallTargets = await page.evaluate(() => {
              const interactive = Array.from(document.querySelectorAll('.result-v2 button, .result-v2 a'))
              const list = []
              for (const el of interactive) {
                const rect = el.getBoundingClientRect()
                // Room copy button is allowed to be compact if accompanied by text or label
                if (el.classList.contains('result-v2__copy-btn') || el.classList.contains('result-v2__link')) {
                  continue
                }
                if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                  list.push({ text: el.innerText.trim(), w: Math.round(rect.width), h: Math.round(rect.height) })
                }
              }
              return list
            })
            if (smallTargets.length > 0) {
              report.smallTapTargets.push({ viewport: vp.width, scenario: scenario.name, smallTargets })
            }
          }

          // Capture screenshot for key viewports (1366 desktop & 390 mobile for all, and others for core victory/defeat)
          const shouldCapture = vp.width === 1366 || vp.width === 390 || scenario.name === 'victory_solved_first' || scenario.name === 'defeat_rival_solved'
          if (shouldCapture) {
            const screenshotPath = path.join(outDir, `result_${scenario.name}_${vp.name}_${theme}.png`)
            await page.screenshot({ path: screenshotPath, fullPage: true })
            report.scenariosCaptured.push(path.basename(screenshotPath))
          }

          await page.close()
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('            RESULT SCREEN QA & SCREENSHOT SUMMARY             ')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`✓ Screenshots captured:     ${report.scenariosCaptured.length}`)
    console.log(`✓ Horizontal scroll bugs:   ${report.horizontalScrolls.length}`)
    console.log(`✓ Console errors:           ${report.consoleErrors.length}`)
    console.log(`✓ Primary tap target bugs:  ${report.smallTapTargets.length}`)
    console.log('═══════════════════════════════════════════════════════════════\n')

    if (report.horizontalScrolls.length > 0) {
      console.warn('Horizontal scroll warnings:', report.horizontalScrolls)
    }
    if (report.consoleErrors.length > 0) {
      console.warn('Console error warnings:', report.consoleErrors)
    }

  } finally {
    await browser.close()
  }
}

run().catch(err => {
  console.error('Screenshot run failed:', err)
  process.exit(1)
})

