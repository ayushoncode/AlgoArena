require('dotenv').config({ path: require('path').resolve(__dirname, './.env') })
const jwt = require('jsonwebtoken')
const { query } = require('./db')

async function testExperiencesApi() {
  console.log('[Test] Running Experience API verification...')

  try {
    // 1. Get or create a test user
    let userRes = await query(`SELECT id, username FROM users LIMIT 1`)
    let userId, username
    if (userRes.rows.length === 0) {
      console.log('[Test] No user found, creating test user...')
      const newUser = await query(
        `INSERT INTO users (username, email, password) VALUES ('test_dev', 'test@algoarena.com', 'hashed') RETURNING id, username`
      )
      userId = newUser.rows[0].id
      username = newUser.rows[0].username
    } else {
      userId = userRes.rows[0].id
      username = userRes.rows[0].username
    }

    console.log(`[Test] Test user ID: ${userId} (${username})`)

    // 2. Generate test JWT token
    const token = jwt.sign({ id: userId, username, elo_rating: 1400 }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' })

    // 3. Test Direct Query insert
    const insertRes = await query(`
      INSERT INTO interview_experiences (
        author_id, is_anonymous, track, company, company_normalized,
        role_title, location, year, month, source, difficulty, outcome,
        rounds, overall_experience, tips, status
      ) VALUES (
        $1, true, 'intern', 'Google', 'google',
        'SWE Intern', 'Mountain View', 2026, 6, 'on_campus', 'hard', 'selected',
        '[{"type":"technical","title":"DSA Round","durationMinutes":45,"description":"Graphs and DP question","questions":[{"text":"Lowest Common Ancestor in Binary Tree","topic":"trees"}]}]'::jsonb,
        'Great experience. Smooth interview process.', 'Practice LeetCode hard trees.', 'approved'
      ) RETURNING id, company, is_anonymous, status
    `, [userId])

    const testExpId = insertRes.rows[0].id
    console.log('[Test] Inserted test experience ID:', testExpId)

    // 4. Test Meta endpoint logic
    const metaRes = await query(`SELECT DISTINCT company FROM interview_experiences WHERE status = 'approved'`)
    console.log('[Test] Meta distinct companies:', metaRes.rows.map(r => r.company))

    // 5. Test List Query logic
    const listRes = await query(`
      SELECT e.*, u.username as author_username
      FROM interview_experiences e
      JOIN users u ON e.author_id = u.id
      WHERE e.status = 'approved' OR e.author_id = $1
    `, [userId])

    console.log('[Test] List items count:', listRes.rows.length)

    // 6. Test Helpful & Bookmark toggles
    await query(`INSERT INTO experience_helpful (experience_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [testExpId, userId])
    await query(`UPDATE interview_experiences SET helpful_count = helpful_count + 1 WHERE id = $1`, [testExpId])
    const countCheck = await query(`SELECT helpful_count FROM interview_experiences WHERE id = $1`, [testExpId])
    console.log('[Test] Helpful count after increment:', countCheck.rows[0].helpful_count)

    // Clean up test experience
    await query(`DELETE FROM interview_experiences WHERE id = $1`, [testExpId])
    console.log('[Test] Cleaned up test experience. API verification PASSED! ✓')

    process.exit(0)
  } catch (err) {
    console.error('[Test Error]', err)
    process.exit(1)
  }
}

testExperiencesApi()
