require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')
const { pool } = require('./index')

async function applySchema() {
  if (!pool) {
    console.error('Database connection pool not configured. Check DATABASE_URL in .env')
    process.exit(1)
  }

  try {
    const sqlPath = path.join(__dirname, 'schema_experiences.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('[DB] Applying interview experiences schema...')
    await pool.query(sql)
    console.log('[DB] Interview experiences schema applied successfully! ✓')
    process.exit(0)
  } catch (err) {
    console.error('[DB Error] Failed to apply schema:', err.message)
    process.exit(1)
  }
}

applySchema()
