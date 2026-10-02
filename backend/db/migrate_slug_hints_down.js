const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Removing slug and hints columns...');
    await client.query(`
      ALTER TABLE problems 
      DROP COLUMN IF EXISTS slug,
      DROP COLUMN IF EXISTS hints;
    `);
    await client.query('COMMIT');
    console.log('Down migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Down migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}
run();
