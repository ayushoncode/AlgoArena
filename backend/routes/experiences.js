/**
 * routes/experiences.js — REST endpoints for Interview Experiences (Intel Reports)
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes require authentication via `authMiddleware`.
 * Author identity is anonymized server-side if `is_anonymous` is true.
 */

'use strict'

const express = require('express')
const router = express.Router()
const { query } = require('../db')
const authMiddleware = require('../middleware/auth')

/** Helper: Strip dangerous HTML/Script tags */
function sanitizeText(str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/** Helper: Format author output safely (respecting anonymity) */
function formatAuthor(row, currentUserId) {
  const isOwner = row.author_id === currentUserId
  if (row.is_anonymous && !isOwner) {
    return {
      id: null,
      username: 'Anonymous Challenger',
      avatar_seed: null,
      avatar_style: null,
      elo_rating: null,
      institute: null,
      is_anonymous: true,
    }
  }
  return {
    id: row.author_id,
    username: row.author_username,
    avatar_seed: row.author_avatar_seed,
    avatar_style: row.author_avatar_style,
    elo_rating: row.author_elo,
    institute: row.author_institute,
    is_anonymous: !!row.is_anonymous,
  }
}

// All endpoints in this router require authentication
router.use(authMiddleware)

/* ═══════════════════════════════════════════════════════════════════════════
   1. GET /api/experiences/meta — Autocomplete company names & track counts
═══════════════════════════════════════════════════════════════════════════ */
router.get('/meta', async (req, res) => {
  try {
    const companiesResult = await query(
      `SELECT DISTINCT company FROM interview_experiences WHERE status = 'approved' ORDER BY company ASC LIMIT 100`
    )
    const countsResult = await query(
      `SELECT track, COUNT(*)::int as count FROM interview_experiences WHERE status = 'approved' GROUP BY track`
    )

    const companies = companiesResult.rows.map(r => r.company)
    const counts = { intern: 0, sde: 0 }
    countsResult.rows.forEach(r => {
      if (r.track in counts) counts[r.track] = r.count
    })

    res.json({ companies, counts })
  } catch (err) {
    console.error('[GET /api/experiences/meta error]', err)
    res.status(500).json({ message: 'Failed to fetch meta information' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   2. GET /api/experiences — List interview experiences (Paginated + Filtered)
═══════════════════════════════════════════════════════════ */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const {
      track,
      company,
      outcome,
      difficulty,
      year,
      round,
      topic,
      q,
      sort = 'latest',
      page = 1,
      limit = 10,
    } = req.query

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
    const offset = (pageNum - 1) * limitNum

    const conditions = [`(e.status = 'approved' OR e.author_id = $1)`]
    const params = [userId]
    let paramIdx = 2

    if (track && ['intern', 'sde'].includes(track)) {
      conditions.push(`e.track = $${paramIdx++}`)
      params.push(track)
    }

    if (company) {
      conditions.push(`e.company_normalized LIKE $${paramIdx++}`)
      params.push(`%${company.trim().toLowerCase()}%`)
    }

    if (outcome && ['selected', 'rejected', 'waiting', 'withdrew'].includes(outcome)) {
      conditions.push(`e.outcome = $${paramIdx++}`)
      params.push(outcome)
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      conditions.push(`e.difficulty = $${paramIdx++}`)
      params.push(difficulty)
    }

    if (year && !isNaN(parseInt(year, 10))) {
      conditions.push(`e.year = $${paramIdx++}`)
      params.push(parseInt(year, 10))
    }

    if (q) {
      const searchPattern = `%${q.trim().toLowerCase()}%`
      conditions.push(`(
        LOWER(e.company) LIKE $${paramIdx} OR
        LOWER(e.role_title) LIKE $${paramIdx} OR
        LOWER(e.overall_experience) LIKE $${paramIdx}
      )`)
      params.push(searchPattern)
      paramIdx++
    }

    // Round type filter inside JSONB array
    if (round) {
      conditions.push(`EXISTS (
        SELECT 1 FROM jsonb_array_elements(e.rounds) r
        WHERE r->>'type' = $${paramIdx++}
      )`)
      params.push(round)
    }

    // Question topic filter inside JSONB array
    if (topic) {
      conditions.push(`EXISTS (
        SELECT 1 FROM jsonb_array_elements(e.rounds) r,
        jsonb_array_elements(r->'questions') q
        WHERE q->>'topic' = $${paramIdx++}
      )`)
      params.push(topic)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderBy = sort === 'helpful' ? 'e.helpful_count DESC, e.created_at DESC' : 'e.created_at DESC'

    // Total count query
    const countSql = `SELECT COUNT(*)::int as total FROM interview_experiences e ${whereClause}`
    const countResult = await query(countSql, params)
    const total = countResult.rows[0]?.total || 0

    // Main records query
    const mainSql = `
      SELECT 
        e.*,
        u.username AS author_username,
        u.elo_rating AS author_elo,
        u.institute AS author_institute,
        (SELECT COUNT(*) > 0 FROM experience_helpful h WHERE h.experience_id = e.id AND h.user_id = $1) AS is_helpful,
        (SELECT COUNT(*) > 0 FROM experience_bookmarks b WHERE b.experience_id = e.id AND b.user_id = $1) AS is_bookmarked
      FROM interview_experiences e
      JOIN users u ON e.author_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `
    params.push(limitNum, offset)

    const result = await query(mainSql, params)

    const experiences = result.rows.map(row => ({
      ...row,
      author: formatAuthor(row, userId),
      author_username: undefined,
      author_elo: undefined,
      author_institute: undefined,
    }))

    res.json({
      experiences,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    })
  } catch (err) {
    console.error('[GET /api/experiences error]', err)
    res.status(500).json({ message: 'Failed to fetch interview experiences' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   3. GET /api/experiences/mine — Caller's submitted experiences
═══════════════════════════════════════════════════════════ */
router.get('/mine', async (req, res) => {
  try {
    const userId = req.user.id
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10))
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10))
    const sort  = req.query.sort === 'helpful' ? 'e.helpful_count DESC, e.created_at DESC' : 'e.created_at DESC'
    const offset = (page - 1) * limit

    const countSql = `SELECT COUNT(*) FROM interview_experiences e WHERE e.author_id = $1`
    const countRes = await query(countSql, [userId])
    const total = parseInt(countRes.rows[0].count, 10)

    const sql = `
      SELECT 
        e.*,
        u.username AS author_username,
        u.elo_rating AS author_elo,
        u.institute AS author_institute,
        (SELECT COUNT(*) > 0 FROM experience_helpful h WHERE h.experience_id = e.id AND h.user_id = $1) AS is_helpful,
        (SELECT COUNT(*) > 0 FROM experience_bookmarks b WHERE b.experience_id = e.id AND b.user_id = $1) AS is_bookmarked
      FROM interview_experiences e
      JOIN users u ON e.author_id = u.id
      WHERE e.author_id = $1
      ORDER BY ${sort}
      LIMIT $2 OFFSET $3
    `
    const result = await query(sql, [userId, limit, offset])
    const experiences = result.rows.map(row => ({
      ...row,
      author: formatAuthor(row, userId),
      author_username: undefined,
      author_elo: undefined,
      author_institute: undefined,
    }))

    res.json({
      experiences,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[GET /api/experiences/mine error]', err)
    res.status(500).json({ message: 'Failed to fetch your reports' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   4. GET /api/experiences/bookmarks — Caller's bookmarked experiences
═══════════════════════════════════════════════════════════ */
router.get('/bookmarks', async (req, res) => {
  try {
    const userId = req.user.id
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10))
    const limit = Math.min(50, parseInt(req.query.limit || '10', 10))
    const sort  = req.query.sort === 'helpful' ? 'e.helpful_count DESC, b.created_at DESC' : 'b.created_at DESC'
    const offset = (page - 1) * limit

    const countSql = `
      SELECT COUNT(*) FROM experience_bookmarks b
      JOIN interview_experiences e ON b.experience_id = e.id
      WHERE b.user_id = $1 AND (e.status = 'approved' OR e.author_id = $1)
    `
    const countRes = await query(countSql, [userId])
    const total = parseInt(countRes.rows[0].count, 10)

    const sql = `
      SELECT 
        e.*,
        u.username AS author_username,
        u.elo_rating AS author_elo,
        u.institute AS author_institute,
        (SELECT COUNT(*) > 0 FROM experience_helpful h WHERE h.experience_id = e.id AND h.user_id = $1) AS is_helpful,
        true AS is_bookmarked
      FROM experience_bookmarks b
      JOIN interview_experiences e ON b.experience_id = e.id
      JOIN users u ON e.author_id = u.id
      WHERE b.user_id = $1 AND (e.status = 'approved' OR e.author_id = $1)
      ORDER BY ${sort}
      LIMIT $2 OFFSET $3
    `
    const result = await query(sql, [userId, limit, offset])
    const experiences = result.rows.map(row => ({
      ...row,
      author: formatAuthor(row, userId),
      author_username: undefined,
      author_elo: undefined,
      author_institute: undefined,
    }))

    res.json({
      experiences,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[GET /api/experiences/bookmarks error]', err)
    res.status(500).json({ message: 'Failed to fetch bookmarked reports' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   5. GET /api/experiences/:id — Single experience detail
═══════════════════════════════════════════════════════════ */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const sql = `
      SELECT 
        e.*,
        u.username AS author_username,
        u.elo_rating AS author_elo,
        u.institute AS author_institute,
        u.avatar_seed AS author_avatar_seed,
        u.avatar_style AS author_avatar_style,
        (SELECT COUNT(*) > 0 FROM experience_helpful h WHERE h.experience_id = e.id AND h.user_id = $1) AS is_helpful,
        (SELECT COUNT(*) > 0 FROM experience_bookmarks b WHERE b.experience_id = e.id AND b.user_id = $1) AS is_bookmarked
      FROM interview_experiences e
      JOIN users u ON e.author_id = u.id
      WHERE e.id = $2 AND (e.status = 'approved' OR e.author_id = $1)
    `
    const result = await query(sql, [userId, id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Interview report not found or pending review' })
    }

    const row = result.rows[0]
    const experience = {
      ...row,
      author: formatAuthor(row, userId),
      author_username: undefined,
      author_elo: undefined,
      author_institute: undefined,
    }

    res.json(experience)
  } catch (err) {
    console.error('[GET /api/experiences/:id error]', err)
    res.status(500).json({ message: 'Failed to fetch experience details' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   6. POST /api/experiences — Create new experience report
═══════════════════════════════════════════════════════════ */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id

    // Rate Limit: max 3 posts per user per 24 hours
    const rateCheck = await query(
      `SELECT COUNT(*)::int as count FROM interview_experiences WHERE author_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    )
    if (rateCheck.rows[0].count >= 3) {
      return res.status(429).json({ message: 'Rate limit exceeded: Max 3 submissions per 24 hours.' })
    }

    let {
      isAnonymous = false,
      track,
      company,
      roleTitle,
      location,
      year,
      month,
      source,
      stipendRange,
      experienceYears,
      ctcRange,
      difficulty,
      outcome,
      rounds = [],
      overallExperience,
      tips,
      prepResources,
    } = req.body

    // Basic Validation
    if (!track || !['intern', 'sde'].includes(track)) {
      return res.status(400).json({ message: 'Track must be either "intern" or "sde"' })
    }

    company = sanitizeText(company)
    if (!company || company.length < 2 || company.length > 60) {
      return res.status(400).json({ message: 'Company name must be between 2 and 60 characters' })
    }

    roleTitle = sanitizeText(roleTitle)
    if (!roleTitle || roleTitle.length > 100) {
      return res.status(400).json({ message: 'Role title is required (max 100 chars)' })
    }

    const currentYear = new Date().getFullYear()
    year = parseInt(year, 10)
    if (isNaN(year) || year < 2000 || year > currentYear + 1) {
      return res.status(400).json({ message: `Year must be between 2000 and ${currentYear + 1}` })
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Difficulty must be "easy", "medium", or "hard"' })
    }

    if (!['selected', 'rejected', 'waiting', 'withdrew'].includes(outcome)) {
      return res.status(400).json({ message: 'Invalid outcome value' })
    }

    overallExperience = sanitizeText(overallExperience)
    if (!overallExperience || overallExperience.length > 3000) {
      return res.status(400).json({ message: 'Overall experience is required (max 3000 chars)' })
    }

    // Sanitize rounds
    const sanitizedRounds = Array.isArray(rounds)
      ? rounds.slice(0, 10).map((r, rIdx) => ({
          type: sanitizeText(r.type) || 'technical',
          title: sanitizeText(r.title) || `Round ${rIdx + 1}`,
          durationMinutes: parseInt(r.durationMinutes, 10) || null,
          description: sanitizeText(r.description)?.slice(0, 2000) || '',
          questions: Array.isArray(r.questions)
            ? r.questions.slice(0, 15).map(q => ({
                text: sanitizeText(q.text)?.slice(0, 500) || '',
                topic: sanitizeText(q.topic) || 'other',
                difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : null,
                link: sanitizeText(q.link)?.slice(0, 255) || null,
              }))
            : [],
        }))
      : []

    const companyNormalized = company.toLowerCase()
    const status = process.env.MODERATION_REQUIRED === 'true' ? 'pending' : 'approved'

    const insertSql = `
      INSERT INTO interview_experiences (
        author_id, is_anonymous, track, company, company_normalized,
        role_title, location, year, month, source,
        stipend_range, experience_years, ctc_range, difficulty, outcome,
        rounds, overall_experience, tips, prep_resources, status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20
      )
      RETURNING *
    `

    const result = await query(insertSql, [
      userId,
      Boolean(isAnonymous),
      track,
      company,
      companyNormalized,
      roleTitle,
      sanitizeText(location) || null,
      year,
      month ? parseInt(month, 10) : null,
      source && ['on_campus', 'off_campus', 'referral'].includes(source) ? source : null,
      sanitizeText(stipendRange) || null,
      experienceYears ? parseFloat(experienceYears) : null,
      sanitizeText(ctcRange) || null,
      difficulty,
      outcome,
      JSON.stringify(sanitizedRounds),
      overallExperience,
      sanitizeText(tips)?.slice(0, 1500) || null,
      sanitizeText(prepResources) || null,
      status,
    ])

    const created = result.rows[0]
    res.status(201).json({
      message: status === 'pending' ? 'Report submitted and pending moderation approval' : 'Report published successfully',
      experience: created,
    })
  } catch (err) {
    console.error('[POST /api/experiences error]', err)
    res.status(500).json({ message: 'Failed to create experience report' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   7. PUT /api/experiences/:id — Update existing experience (Author Only)
═══════════════════════════════════════════════════════════ */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const ownerCheck = await query(`SELECT author_id FROM interview_experiences WHERE id = $1`, [id])
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Experience report not found' })
    }
    if (ownerCheck.rows[0].author_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You can only edit your own reports' })
    }

    let {
      isAnonymous,
      company,
      roleTitle,
      location,
      year,
      month,
      source,
      stipendRange,
      experienceYears,
      ctcRange,
      difficulty,
      outcome,
      rounds = [],
      overallExperience,
      tips,
      prepResources,
    } = req.body

    company = sanitizeText(company)
    roleTitle = sanitizeText(roleTitle)
    overallExperience = sanitizeText(overallExperience)

    const sanitizedRounds = Array.isArray(rounds)
      ? rounds.slice(0, 10).map((r, rIdx) => ({
          type: sanitizeText(r.type) || 'technical',
          title: sanitizeText(r.title) || `Round ${rIdx + 1}`,
          durationMinutes: parseInt(r.durationMinutes, 10) || null,
          description: sanitizeText(r.description)?.slice(0, 2000) || '',
          questions: Array.isArray(r.questions)
            ? r.questions.slice(0, 15).map(q => ({
                text: sanitizeText(q.text)?.slice(0, 500) || '',
                topic: sanitizeText(q.topic) || 'other',
                difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : null,
                link: sanitizeText(q.link)?.slice(0, 255) || null,
              }))
            : [],
        }))
      : []

    const updateSql = `
      UPDATE interview_experiences SET
        is_anonymous = COALESCE($1, is_anonymous),
        company = COALESCE($2, company),
        company_normalized = COALESCE($3, company_normalized),
        role_title = COALESCE($4, role_title),
        location = $5,
        year = COALESCE($6, year),
        month = $7,
        source = $8,
        stipend_range = $9,
        experience_years = $10,
        ctc_range = $11,
        difficulty = COALESCE($12, difficulty),
        outcome = COALESCE($13, outcome),
        rounds = COALESCE($14, rounds),
        overall_experience = COALESCE($15, overall_experience),
        tips = $16,
        prep_resources = $17,
        updated_at = NOW()
      WHERE id = $18 AND author_id = $19
      RETURNING *
    `

    const result = await query(updateSql, [
      typeof isAnonymous === 'boolean' ? isAnonymous : null,
      company || null,
      company ? company.toLowerCase() : null,
      roleTitle || null,
      sanitizeText(location) || null,
      year ? parseInt(year, 10) : null,
      month ? parseInt(month, 10) : null,
      source || null,
      sanitizeText(stipendRange) || null,
      experienceYears ? parseFloat(experienceYears) : null,
      sanitizeText(ctcRange) || null,
      difficulty || null,
      outcome || null,
      JSON.stringify(sanitizedRounds),
      overallExperience || null,
      sanitizeText(tips)?.slice(0, 1500) || null,
      sanitizeText(prepResources) || null,
      id,
      userId,
    ])

    res.json({ message: 'Report updated successfully', experience: result.rows[0] })
  } catch (err) {
    console.error('[PUT /api/experiences/:id error]', err)
    res.status(500).json({ message: 'Failed to update report' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   8. DELETE /api/experiences/:id — Delete experience (Author Only)
═══════════════════════════════════════════════════════════ */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await query(
      `DELETE FROM interview_experiences WHERE id = $1 AND author_id = $2 RETURNING id`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found or unauthorized' })
    }

    res.json({ message: 'Report deleted successfully', id })
  } catch (err) {
    console.error('[DELETE /api/experiences/:id error]', err)
    res.status(500).json({ message: 'Failed to delete report' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   9. POST /api/experiences/:id/helpful — Toggle helpful mark
═══════════════════════════════════════════════════════════ */
router.post('/:id/helpful', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existCheck = await query(`SELECT id FROM interview_experiences WHERE id = $1`, [id])
    if (existCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Experience report not found' })
    }

    const check = await query(
      `SELECT 1 FROM experience_helpful WHERE experience_id = $1 AND user_id = $2`,
      [id, userId]
    )

    let isHelpful = false
    if (check.rows.length > 0) {
      // Remove helpful
      await query(`DELETE FROM experience_helpful WHERE experience_id = $1 AND user_id = $2`, [id, userId])
      await query(`UPDATE interview_experiences SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = $1`, [id])
    } else {
      // Add helpful
      await query(`INSERT INTO experience_helpful (experience_id, user_id) VALUES ($1, $2)`, [id, userId])
      await query(`UPDATE interview_experiences SET helpful_count = helpful_count + 1 WHERE id = $1`, [id])
      isHelpful = true
    }

    const countRes = await query(`SELECT helpful_count FROM interview_experiences WHERE id = $1`, [id])
    res.json({ isHelpful, helpfulCount: countRes.rows[0]?.helpful_count || 0 })
  } catch (err) {
    console.error('[POST /api/experiences/:id/helpful error]', err)
    res.status(500).json({ message: 'Failed to update helpful state' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   10. POST /api/experiences/:id/bookmark — Toggle bookmark
═══════════════════════════════════════════════════════════ */
router.post('/:id/bookmark', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existCheck = await query(`SELECT id FROM interview_experiences WHERE id = $1`, [id])
    if (existCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Experience report not found' })
    }

    const check = await query(
      `SELECT 1 FROM experience_bookmarks WHERE experience_id = $1 AND user_id = $2`,
      [id, userId]
    )

    let isBookmarked = false
    if (check.rows.length > 0) {
      await query(`DELETE FROM experience_bookmarks WHERE experience_id = $1 AND user_id = $2`, [id, userId])
      await query(`UPDATE interview_experiences SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = $1`, [id])
    } else {
      await query(`INSERT INTO experience_bookmarks (experience_id, user_id) VALUES ($1, $2)`, [id, userId])
      await query(`UPDATE interview_experiences SET bookmark_count = bookmark_count + 1 WHERE id = $1`, [id])
      isBookmarked = true
    }

    res.json({ isBookmarked })
  } catch (err) {
    console.error('[POST /api/experiences/:id/bookmark error]', err)
    res.status(500).json({ message: 'Failed to update bookmark state' })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   11. POST /api/experiences/:id/report — Report inappropriate post
═══════════════════════════════════════════════════════════ */
router.post('/:id/report', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { reason } = req.body

    const existCheck = await query(`SELECT id FROM interview_experiences WHERE id = $1`, [id])
    if (existCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Experience report not found' })
    }

    const check = await query(
      `SELECT 1 FROM experience_reports WHERE experience_id = $1 AND user_id = $2`,
      [id, userId]
    )
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reported this report' })
    }

    await query(
      `INSERT INTO experience_reports (experience_id, user_id, reason) VALUES ($1, $2, $3)`,
      [id, userId, sanitizeText(reason) || null]
    )

    const updateRes = await query(
      `UPDATE interview_experiences SET report_count = report_count + 1 WHERE id = $1 RETURNING report_count`,
      [id]
    )

    const reportCount = updateRes.rows[0]?.report_count || 0
    const reportThreshold = parseInt(process.env.REPORT_AUTO_HIDE_THRESHOLD, 10) || 5

    // Auto-hide / send for moderation if threshold exceeded
    if (reportCount >= reportThreshold) {
      await query(`UPDATE interview_experiences SET status = 'pending' WHERE id = $1`, [id])
    }

    res.json({ message: 'Report submitted. Thank you for keeping the arena safe.', reported: true })
  } catch (err) {
    console.error('[POST /api/experiences/:id/report error]', err)
    res.status(500).json({ message: 'Failed to submit report' })
  }
})

module.exports = router
