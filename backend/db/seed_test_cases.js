/**
 * backend/db/seed_test_cases.js
 * Programmatically seeds test cases into PostgreSQL for all problems.
 */

'use strict'

require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false })

const TEST_CASES_DATA = [
  {
    title: 'Two Sum',
    cases: [
      { input: '[2,7,11,15], 9', output: '[0,1]', is_hidden: false },
      { input: '[3,2,4], 6', output: '[1,2]', is_hidden: false },
      { input: '[3,3], 6', output: '[0,1]', is_hidden: true }
    ]
  },
  {
    title: 'Valid Anagram',
    cases: [
      { input: '"anagram", "nagaram"', output: 'true', is_hidden: false },
      { input: '"rat", "car"', output: 'false', is_hidden: false },
      { input: '"a", "a"', output: 'true', is_hidden: true }
    ]
  },
  {
    title: 'Container With Most Water',
    cases: [
      { input: '[1,8,6,2,5,4,8,3,7]', output: '49', is_hidden: false },
      { input: '[1,1]', output: '1', is_hidden: false },
      { input: '[4,3,2,1,4]', output: '16', is_hidden: true }
    ]
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    cases: [
      { input: '[7,1,5,3,6,4]', output: '5', is_hidden: false },
      { input: '[7,6,4,3,1]', output: '0', is_hidden: false },
      { input: '[1,2]', output: '1', is_hidden: true }
    ]
  },
  {
    title: 'Binary Search',
    cases: [
      { input: '[-1,0,3,5,9,12], 9', output: '4', is_hidden: false },
      { input: '[-1,0,3,5,9,12], 2', output: '-1', is_hidden: false },
      { input: '[5], 5', output: '0', is_hidden: true }
    ]
  },
  {
    title: 'Search in Rotated Sorted Array',
    cases: [
      { input: '[4,5,6,7,0,1,2], 0', output: '4', is_hidden: false },
      { input: '[4,5,6,7,0,1,2], 3', output: '-1', is_hidden: false },
      { input: '[1], 0', output: '-1', is_hidden: true }
    ]
  },
  {
    title: 'Find Minimum in Rotated Sorted Array',
    cases: [
      { input: '[3,4,5,1,2]', output: '1', is_hidden: false },
      { input: '[4,5,6,7,0,1,2]', output: '0', is_hidden: false },
      { input: '[11,13,15,17]', output: '11', is_hidden: true }
    ]
  },
  {
    title: 'Coin Change',
    cases: [
      { input: '[1,5,11], 15', output: '3', is_hidden: false },
      { input: '[2], 3', output: '-1', is_hidden: false },
      { input: '[1], 0', output: '0', is_hidden: true }
    ]
  },
  {
    title: 'Merge Intervals',
    cases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', is_hidden: false },
      { input: '[[1,4],[4,5]]', output: '[[1,5]]', is_hidden: false }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    cases: [
      { input: '"abcabcbb"', output: '3', is_hidden: false },
      { input: '"bbbbb"', output: '1', is_hidden: false },
      { input: '"pwwkew"', output: '3', is_hidden: true }
    ]
  }
]

async function seedTestCases() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let totalInserted = 0
    for (const item of TEST_CASES_DATA) {
      // Find problem by title
      const { rows: probs } = await client.query('SELECT id FROM problems WHERE title = $1', [item.title])
      if (!probs.length) {
        console.log(`Skipping "${item.title}" — not found in problems table`)
        continue
      }
      const problemId = probs[0].id

      // Delete existing test cases for this problem
      await client.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId])

      // Insert new test cases
      for (const tc of item.cases) {
        await client.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden)
           VALUES ($1, $2, $3, $4)`,
          [problemId, tc.input, tc.output, tc.is_hidden]
        )
        totalInserted++
      }
      console.log(`✓ Seeded ${item.cases.length} test cases for "${item.title}"`)
    }

    await client.query('COMMIT')
    console.log(`\n Successfully seeded ${totalInserted} test cases into database!`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error seeding test cases:', err)
  } finally {
    client.release()
    process.exit(0)
  }
}

seedTestCases()
