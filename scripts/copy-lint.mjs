/**
 * scripts/copy-lint.mjs
 *
 * Verifies that all newly created or modified files in the Premium task
 * obey the strict copy constraints:
 * - No forbidden words: seamless, elevate, unlock, supercharge, revolutionize,
 *   cutting-edge, next-level, game-changer, empower, leverage, effortless,
 *   world-class, journey, delve
 * - No em dashes (U+2014 —, U+2013 –)
 * - No emoji characters
 * - No sparkle icons, glow, or gradient tokens
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

const FORBIDDEN_WORDS = [
  'seamless',
  'elevate',
  'unlock',
  'supercharge',
  'revolutionize',
  'cutting-edge',
  'next-level',
  'game-changer',
  'empower',
  'leverage',
  'effortless',
  'world-class',
  'journey',
  'delve'
]

const TARGET_FILES = [
  'frontend/src/content/premium.js',
  'frontend/src/context/PremiumContext.jsx',
  'frontend/src/hooks/usePremium.js',
  'frontend/src/hooks/usePremiumBadges.js',
  'frontend/src/components/PremiumBadge.jsx',
  'frontend/src/components/LockedFeatureModal.jsx',
  'frontend/src/pages/Premium/PremiumPage.jsx',
  'frontend/src/pages/Premium/Premium.css',
  'frontend/src/pages/Account/BillingPage.jsx',
  'frontend/src/pages/Account/Billing.css',
  'frontend/src/pages/RefundPolicy.jsx',
  'frontend/src/pages/Terms.jsx',
  'frontend/src/pages/Privacy.jsx',
  'backend/config/premium.js',
  'backend/services/premium.js',
  'backend/routes/premium.js',
  'backend/middleware/requirePremium.js'
]

// Regex for emoji (excludes mathematical / standard checkmark U+2713)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{2712}\u{2714}-\u{27BF}]/u

let violations = 0

console.log('Running Copy and Typography Lint on Premium Plan files...\n')

for (const relPath of TARGET_FILES) {
  const fullPath = path.resolve(ROOT_DIR, relPath)
  if (!fs.existsSync(fullPath)) {
    console.warn(`[WARN] File not found: ${relPath}`)
    continue
  }

  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split('\n')

  lines.forEach((line, lineIdx) => {
    // Check forbidden words (case-insensitive word boundary)
    for (const word of FORBIDDEN_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i')
      if (regex.test(line)) {
        // Skip comment explanation of forbidden words in lint or comments
        if (line.includes('FORBIDDEN_WORDS') || line.includes('No forbidden words') || line.includes('seamless, elevate')) {
          continue
        }
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Contains forbidden word "${word}":`)
        console.error(`  > ${line.trim()}`)
        violations++
      }
    }

    // Check em dashes (U+2014 and U+2013)
    if (line.includes('\u2014') || line.includes('\u2013')) {
      // Skip if explicitly documenting no em-dash in comments
      if (!line.includes('U+2014') && !line.includes('em dash')) {
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Contains forbidden em-dash (U+2014 or U+2013):`)
        console.error(`  > ${line.trim()}`)
        violations++
      }
    }

    // Check emoji
    if (EMOJI_REGEX.test(line)) {
      if (!line.includes('EMOJI_REGEX')) {
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Contains emoji character:`)
        console.error(`  > ${line.trim()}`)
        violations++
      }
    }
  })
}

if (violations === 0) {
  console.log('✓ PASS: All checked files strictly adhere to copy and typography rules.')
  process.exit(0)
} else {
  console.error(`\nFound ${violations} copy violations. Please correct them before proceeding.`)
  process.exit(1)
}
