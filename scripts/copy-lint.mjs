import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../frontend/src')

const BANNED_WORDS = [
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
  'delve',
  "in today's",
  "whether you're",
]

// Emoji detection regex (covers primary emoji ranges)
const EMOJI_REGEX = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u

// Em dash U+2014 and en dash U+2013
const DASH_REGEX = /[\u2013\u2014]/

// Files allowed to declare background gradients (canvas artwork, hero veil, emblem)
const ALLOWED_GRADIENT_FILES = new Set([
  'LandingPage.css',
  'useClashArtwork.js',
  'ArenaLogo.jsx',
  'Home.css',
  'home-tokens.css',
  'sections.css',
  'GlassCta.css',
  'profile-v2.css',
])

// Selectors allowed to use blur / backdrop-filter
const ALLOWED_BLUR_SELECTORS = [
  '.cta',
  '.glass',
  '.navpanel',
  '.bar.is-sticky',
  '.bar.is-scrolled',
  '.veil',
  '#cta',
  '.site-nav',
]

const violations = []

function scanFile(filePath) {
  const relPath = path.relative(srcDir, filePath)
  const baseName = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()

  // Only scan code / style / content assets
  if (!['.js', '.jsx', '.ts', '.tsx', '.css', '.html'].includes(ext)) return

  // Scope: landing & home related files and components
  const isHomeScope = (
    relPath.startsWith('pages/LandingPage') ||
    relPath.startsWith('pages/Home') ||
    relPath.startsWith('pages/useClashArtwork') ||
    relPath.startsWith('content/home') ||
    relPath.startsWith('components/home') ||
    relPath.startsWith('components/icons') ||
    relPath.startsWith('styles/home') ||
    relPath.startsWith('pages/Terms') ||
    relPath.startsWith('pages/Privacy') ||
    relPath.startsWith('pages/WhoWeAre') ||
    relPath.startsWith('content/who-we-are') ||
    relPath.startsWith('pages/Leaderboard') ||
    relPath.startsWith('utils/tierHelper') ||
    relPath.startsWith('pages/Profile/') ||
    relPath.startsWith('styles/profile-v2') ||
    relPath.startsWith('lib/tiers')
  )

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1

    // 1. Em dash / En dash (enforced on home scope)
    if (isHomeScope && DASH_REGEX.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'No em dashes or en dashes (U+2014, U+2013)',
        snippet: line.trim(),
      })
    }

    // 2. Emoji (enforced on home scope)
    if (isHomeScope && EMOJI_REGEX.test(line)) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'No emojis in code or copy',
        snippet: line.trim(),
      })
    }

    // 3. Banned words (case-insensitive, on home scope)
    if (isHomeScope) {
      const lower = line.toLowerCase()
      for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
          violations.push({
            file: relPath,
            line: lineNum,
            rule: `Banned buzzword detected: "${word}"`,
            snippet: line.trim(),
          })
        }
      }
    }

    // 4. Lucide imports (strictly forbidden in home scope)
    if (isHomeScope && line.includes('lucide-react')) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'No lucide-react imports allowed (use custom SVG icon set)',
        snippet: line.trim(),
      })
    }

    // 5. Text gradients
    if (isHomeScope && (line.includes('background-clip: text') || line.includes('-webkit-background-clip: text'))) {
      violations.push({
        file: relPath,
        line: lineNum,
        rule: 'No text gradients (single color per text element rule)',
        snippet: line.trim(),
      })
    }

    // 6. Gradients outside allowed files
    if (isHomeScope && !ALLOWED_GRADIENT_FILES.has(baseName)) {
      if (/linear-gradient|radial-gradient/i.test(line)) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: `Gradient used outside allowed files (${Array.from(ALLOWED_GRADIENT_FILES).join(', ')})`,
          snippet: line.trim(),
        })
      }
    }

    // 7. Blur / backdrop-filter outside allowed selectors
    if (isHomeScope && /backdrop-filter|blur\(/i.test(line)) {
      // Verify line belongs to allowed selectors
      const isAllowed = ALLOWED_BLUR_SELECTORS.some(sel => {
        // Look back a few lines in CSS to find selector if in a CSS file
        return content.includes(sel)
      })
      if (!ALLOWED_GRADIENT_FILES.has(baseName) && !isAllowed) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: `Blur/backdrop-filter used outside allowed selectors (${ALLOWED_BLUR_SELECTORS.join(', ')})`,
          snippet: line.trim(),
        })
      }
    }
  })
}
function walkDir(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        walkDir(fullPath)
      }
    } else {
      scanFile(fullPath)
    }
  }
}

import { pathToFileURL } from 'node:url'

async function checkWordBudget() {
  const whoConfigPath = path.resolve(srcDir, 'content/who-we-are.js')
  if (!fs.existsSync(whoConfigPath)) return

  try {
    const mod = await import(pathToFileURL(whoConfigPath).href)
    const config = mod.WHO_CONFIG
    if (!config) return

    const countWords = (text) => (typeof text === 'string' ? text.trim().split(/\s+/).filter(Boolean).length : 0)
    const countSentences = (text) => {
      if (typeof text !== 'string' || !text.trim()) return 0
      const matches = text.trim().split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0)
      return matches.length
    }

    const checkPara = (text, location) => {
      if (!text || typeof text !== 'string') return
      const wCount = countWords(text)
      const sCount = countSentences(text)
      if (sCount > 2) {
        violations.push({
          file: 'content/who-we-are.js',
          line: 1,
          rule: `Paragraph exceeds 2 sentences limit (${sCount} sentences) in ${location}`,
          snippet: text,
        })
      }
      if (wCount > 40) {
        violations.push({
          file: 'content/who-we-are.js',
          line: 1,
          rule: `Paragraph exceeds 40 words limit (${wCount} words) in ${location}`,
          snippet: text,
        })
      }
    }

    const sectionKeys = ['w1Intro', 'w2Team', 'w3Story', 'w4Principles', 'w5Stack', 'w6Contact']
    
    for (const key of sectionKeys) {
      const sec = config[key]
      if (!sec) continue

      // 1. Heading check: <= 8 words
      if (sec.title) {
        const wCount = countWords(sec.title)
        if (wCount > 8) {
          violations.push({
            file: 'content/who-we-are.js',
            line: 1,
            rule: `Heading over 8 words limit (${wCount} words) in ${key}.title`,
            snippet: sec.title,
          })
        }
      }

      // 2. Paragraph check: <= 2 sentences and <= 40 words
      checkPara(sec.lead, `${key}.lead`)
      checkPara(sec.subtitle, `${key}.subtitle`)
      checkPara(sec.storySentence, `${key}.storySentence`)
      checkPara(sec.body, `${key}.body`)
      checkPara(sec.ctaNote, `${key}.ctaNote`)

      if (Array.isArray(sec.paragraphs)) {
        sec.paragraphs.forEach((p, idx) => checkPara(p, `${key}.paragraphs[${idx}]`))
      }

      // 3. Section body total copy <= 60 words (team bios & legal links excluded)
      let bodyWordSum = 0
      if (sec.lead) bodyWordSum += countWords(sec.lead)
      if (sec.subtitle) bodyWordSum += countWords(sec.subtitle)
      if (sec.storySentence) bodyWordSum += countWords(sec.storySentence)
      if (sec.body) bodyWordSum += countWords(sec.body)
      if (sec.ctaNote) bodyWordSum += countWords(sec.ctaNote)

      if (Array.isArray(sec.paragraphs)) {
        sec.paragraphs.forEach(p => { bodyWordSum += countWords(p) })
      }

      if (key === 'w3Story' && Array.isArray(sec.milestones)) {
        sec.milestones.forEach(m => {
          if (m.sentence) bodyWordSum += countWords(m.sentence)
          checkPara(m.sentence, 'w3Story.milestones.sentence')
        })
      }

      if (key === 'w4Principles' && Array.isArray(sec.items)) {
        sec.items.forEach(item => {
          if (item.sentence) bodyWordSum += countWords(item.sentence)
          checkPara(item.sentence, 'w4Principles.items.sentence')
        })
      }

      if (bodyWordSum > 60) {
        violations.push({
          file: 'content/who-we-are.js',
          line: 1,
          rule: `Section ${key} exceeds 60 words body budget (${bodyWordSum} words)`,
          snippet: `Section ${key} total body copy is ${bodyWordSum} words`,
        })
      }
    }
  } catch (err) {
    violations.push({
      file: 'content/who-we-are.js',
      line: 1,
      rule: `Failed to evaluate who-we-are.js: ${err.message}`,
      snippet: err.message,
    })
  }
}

async function run() {
  console.log('Running AlgoArena Copy & Style Linter...')
  walkDir(srcDir)
  await checkWordBudget()

  if (violations.length === 0) {
    console.log('✓ Copy & style lint passed: 0 violations detected across home scope.\n')
    process.exit(0)
  } else {
    console.error(`\n❌ Found ${violations.length} copy/style violation(s):\n`)
    violations.forEach(v => {
      console.error(`  [${v.file}:${v.line}] ${v.rule}`)
      console.error(`    > ${v.snippet}\n`)
    })
    process.exit(1)
  }
}

run()
