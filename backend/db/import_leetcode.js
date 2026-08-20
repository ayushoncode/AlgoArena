/**
 * backend/db/import_leetcode.js
 *
 * Safe bulk importer from neenza/leetcode-problems into Supabase.
 * - Strictly additive: Skips any problem that already exists in Supabase.
 * - Normalizes difficulty ('easy', 'medium', 'hard'), topic tags, and test cases.
 * - Converts LeetCode examples into executable comma-separated arguments for AlgoArena judge.
 *
 * Usage:
 *   node db/import_leetcode.js --dry-run --limit=20
 *   node db/import_leetcode.js --limit=50
 *   node db/import_leetcode.js
 */

'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { Pool } = require('pg')
const https = require('https')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// Topic mapping from LeetCode tags to AlgoArena supported topics
const TOPIC_MAP = {
  'array': 'arrays',
  'arrays': 'arrays',
  'string': 'strings',
  'strings': 'strings',
  'dynamic programming': 'dp',
  'dp': 'dp',
  'tree': 'trees',
  'trees': 'trees',
  'binary tree': 'trees',
  'binary search tree': 'trees',
  'graph': 'graphs',
  'graphs': 'graphs',
  'breadth-first search': 'graphs',
  'depth-first search': 'graphs',
  'linked list': 'linked-lists',
  'linked lists': 'linked-lists',
  'linked-list': 'linked-lists',
  'linked-lists': 'linked-lists',
  'binary search': 'binary-search',
  'binary-search': 'binary-search',
  'sorting': 'sorting',
  'sort': 'sorting',
  'two pointers': 'arrays',
  'hash table': 'arrays',
  'stack': 'strings',
  'queue': 'arrays',
  'heap (priority queue)': 'arrays',
  'sliding window': 'strings',
  'backtracking': 'dp',
  'matrix': 'arrays',
  'greedy': 'dp',
  'math': 'dp',
  'recursion': 'trees',
}

function normalizeTopic(topics = []) {
  if (!topics || !topics.length) return 'arrays'
  for (const t of topics) {
    const key = String(t).toLowerCase().trim()
    if (TOPIC_MAP[key]) return TOPIC_MAP[key]
  }
  return 'arrays'
}

function normalizeDifficulty(diff) {
  const d = String(diff || '').toLowerCase().trim()
  if (['easy', 'medium', 'hard'].includes(d)) return d
  return 'medium'
}

/**
 * Parses example text into { input, output }
 * e.g. "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]"
 * Returns clean input string: "[2,7,11,15], 9" and output string: "[0,1]"
 */
function parseExample(exampleText) {
  if (!exampleText || typeof exampleText !== 'string') return null

  // Extract Input and Output lines
  const inputMatch = exampleText.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i)
  const outputMatch = exampleText.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i)

  if (!inputMatch || !outputMatch) return null

  let rawInput = inputMatch[1].trim()
  let rawOutput = outputMatch[1].trim()

  // Clean rawInput: strip variable names "nums = [2,7], target = 9" -> "[2,7], 9"
  // Split on newlines if multiple arguments are on separate lines
  let inputCleaned = rawInput
    .replace(/\r?\n/g, ', ')
    .replace(/,\s*,/g, ',')
    // Remove "varName = " patterns
    .replace(/(?:^|,\s*)[a-zA-Z0-9_$]+\s*=\s*/g, (match) => {
      return match.startsWith(',') ? ', ' : ''
    })
    .trim()

  // Clean rawOutput: remove any extra text, take first line / expression
  let outputCleaned = rawOutput.split('\n')[0].trim()

  // Validate that input can be parsed as JSON arguments array: `[${inputCleaned}]`
  try {
    const parsedArgs = JSON.parse(`[${inputCleaned}]`)
    if (!Array.isArray(parsedArgs)) return null
  } catch (e) {
    // If not standard JSON (e.g. single quotes instead of double quotes), try standardizing
    try {
      const fixedQuotes = inputCleaned.replace(/'/g, '"')
      const parsedArgs = JSON.parse(`[${fixedQuotes}]`)
      if (Array.isArray(parsedArgs)) {
        inputCleaned = fixedQuotes
      } else {
        return null
      }
    } catch {
      return null
    }
  }

  // Validate output formatting
  try {
    const parsedOutput = JSON.parse(outputCleaned)
    outputCleaned = JSON.stringify(parsedOutput)
  } catch {
    // If output is string like "true", "false", or a plain number/string
    if (outputCleaned.toLowerCase() === 'true' || outputCleaned.toLowerCase() === 'false') {
      outputCleaned = outputCleaned.toLowerCase()
    } else if (/^-?\d+(\.\d+)?$/.test(outputCleaned)) {
      // number is fine
    } else if (outputCleaned.startsWith('"') && outputCleaned.endsWith('"')) {
      // quoted string is fine
    } else {
      // Try quoting string if it's alphanumeric
      outputCleaned = JSON.stringify(outputCleaned)
    }
  }

  return {
    input: inputCleaned,
    output: outputCleaned,
  }
}

// Fetch JSON over HTTPS with redirects
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AlgoArena-Importer' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchJson(res.headers.location))
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`))
      }
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

function buildMarkdownDescription(item) {
  let desc = (item.description || '').trim()

  // If description has HTML tags, do basic cleanup
  desc = desc
    .replace(/(?:^|\n)(?:Example\s*\d+:?\s*\n)+(?:Constraints:?\s*\n)?/gi, '\n')
    .replace(/<pre>/gi, '\n```\n')
    .replace(/<\/pre>/gi, '\n```\n')
    .replace(/<code>/gi, '`')
    .replace(/<\/code>/gi, '`')
    .replace(/<p>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')

  // Append formatted examples if not already present in description
  if (Array.isArray(item.examples) && item.examples.length && !desc.includes('**Example')) {
    item.examples.forEach((ex, idx) => {
      if (ex && ex.example_text) {
        desc += `\n\n**Example ${idx + 1}:**\n\`\`\`\n${ex.example_text.trim()}\n\`\`\``
      }
    })
  }

  // Append constraints if present
  if (Array.isArray(item.constraints) && item.constraints.length && !desc.includes('**Constraints:')) {
    desc += '\n\n**Constraints:**\n' + item.constraints.map(c => `- \`${c}\``).join('\n')
  }

  return desc.trim()
}

async function runImporter() {
  const isDryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const targetLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
  const topicFilterArg = process.argv.find(a => a.startsWith('--topic='))
  const targetTopic = topicFilterArg ? topicFilterArg.split('=')[1].toLowerCase() : null

  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║        AlgoArena LeetCode Bulk Importer (Safe Mode)          ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(` Mode:    ${isDryRun ? 'DRY RUN (No DB changes)' : 'LIVE IMPORT (Writing to Supabase)'}`)
  if (targetLimit) console.log(` Limit:   ${targetLimit} problems`)
  if (targetTopic) console.log(` Filter:  topic = ${targetTopic}`)
  console.log('──────────────────────────────────────────────────────────────\n')

  const client = await pool.connect()

  try {
    // 1. Fetch existing problems from Supabase
    const { rows: existingRows } = await client.query('SELECT id, title, topic, difficulty FROM problems')
    const existingTitles = new Set(existingRows.map(r => r.title.trim().toLowerCase()))
    console.log(`[Supabase] Found ${existingTitles.size} existing problems in database (Protected: Will NOT be overwritten).\n`)

    // 2. Fetch problems index from GitHub
    console.log('[GitHub] Downloading problem dataset from neenza/leetcode-problems...')
    const indexUrl = 'https://raw.githubusercontent.com/neenza/leetcode-problems/master/merged_problems.json'
    let rawProblems = []

    try {
      const parsedJson = await fetchJson(indexUrl)
      rawProblems = Array.isArray(parsedJson) ? parsedJson : (parsedJson.questions || [])
      console.log(`[GitHub] Successfully fetched ${rawProblems.length} total problems from repository.\n`)
    } catch (err) {
      console.error('[GitHub] Error fetching merged_problems.json:', err.message)
      return
    }

    let insertedCount = 0
    let skippedExistingCount = 0
    let skippedInvalidCount = 0

    for (const item of rawProblems) {
      if (targetLimit && insertedCount >= targetLimit) {
        console.log(`\nReached target limit of ${targetLimit} problems. Stopping.`)
        break
      }

      const title = (item.title || '').trim()
      if (!title) continue

      // Deduplication check
      if (existingTitles.has(title.toLowerCase())) {
        skippedExistingCount++
        continue
      }

      const topic = normalizeTopic(item.topics)
      if (targetTopic && topic !== targetTopic) {
        continue
      }

      const difficulty = normalizeDifficulty(item.difficulty)

      // Parse examples into valid test cases
      const parsedCases = []
      if (Array.isArray(item.examples)) {
        for (let i = 0; i < item.examples.length; i++) {
          const ex = parseExample(item.examples[i]?.example_text)
          if (ex && ex.input && ex.output) {
            parsedCases.push({
              input: ex.input,
              output: ex.output,
              is_hidden: i > 1, // First 2 visible for Run, rest hidden for Submit
            })
          }
        }
      }

      // We require at least 1 valid test case for a problem to be runnable
      if (parsedCases.length === 0) {
        skippedInvalidCount++
        continue
      }

      const description = buildMarkdownDescription(item)
      const sampleInput = parsedCases[0].input
      const sampleOutput = parsedCases[0].output

      if (isDryRun) {
        insertedCount++
        existingTitles.add(title.toLowerCase())
        console.log(`  [DRY-RUN] Would insert: "${title}" [${topic}/${difficulty}] (${parsedCases.length} tests)`)
        continue
      }

      // Safe atomic insert
      await client.query('BEGIN')
      try {
        const { rows } = await client.query(
          `INSERT INTO problems (title, description, topic, difficulty, sample_input, sample_output)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [title, description, topic, difficulty, sampleInput, sampleOutput]
        )
        const problemId = rows[0].id

        for (const tc of parsedCases) {
          await client.query(
            `INSERT INTO test_cases (problem_id, input, output, is_hidden)
             VALUES ($1, $2, $3, $4)`,
            [problemId, tc.input, tc.output, tc.is_hidden]
          )
        }

        await client.query('COMMIT')
        existingTitles.add(title.toLowerCase())
        insertedCount++
        console.log(`  ✓ [ADDED] ${title.padEnd(35)} [${topic.padEnd(13)} / ${difficulty.padEnd(6)}] (${parsedCases.length} tests)`)
      } catch (insertErr) {
        await client.query('ROLLBACK')
        console.error(`  ✕ [ERROR] Failed inserting "${title}":`, insertErr.message)
      }
    }

    console.log('\n══════════════════════════════════════════════════════════════')
    console.log(' Summary:')
    console.log(` • Mode:                     ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
    console.log(` • New Problems Added:       ${insertedCount}`)
    console.log(` • Existing Skipped:         ${skippedExistingCount}`)
    console.log(` • Skipped (invalid format): ${skippedInvalidCount}`)
    console.log(` • Total Unique in Database: ${existingTitles.size}`)
    console.log('══════════════════════════════════════════════════════════════\n')

  } finally {
    client.release()
    await pool.end()
  }
}

runImporter().catch(err => {
  console.error('[FATAL]', err)
  process.exit(1)
})
