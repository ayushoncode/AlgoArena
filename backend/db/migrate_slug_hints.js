const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Add columns
    console.log('Adding slug and hints columns...');
    await client.query(`
      ALTER TABLE problems 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(200),
      ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Backfill slugs
    console.log('Backfilling slugs for existing problems...');
    const { rows } = await client.query('SELECT id, title FROM problems');
    
    const slugCounts = {};
    for (const row of rows) {
      let baseSlug = row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let finalSlug = baseSlug;
      
      if (slugCounts[baseSlug]) {
        slugCounts[baseSlug]++;
        finalSlug = `${baseSlug}-${slugCounts[baseSlug]}`;
      } else {
        slugCounts[baseSlug] = 1;
      }
      
      await client.query('UPDATE problems SET slug = $1 WHERE id = $2', [finalSlug, row.id]);
    }
    console.log(`Backfilled ${rows.length} slugs.`);

    // 3. Add UNIQUE constraint
    console.log('Adding UNIQUE constraint on slug...');
    await client.query(`
      ALTER TABLE problems 
      ADD CONSTRAINT problems_slug_key UNIQUE (slug);
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

run();
