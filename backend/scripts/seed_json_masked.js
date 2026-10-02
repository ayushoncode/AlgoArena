const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing!");
    process.exit(1);
  }
  
  const url = new URL(connectionString);
  const maskedHost = url.hostname.length > 2 ? url.hostname.substring(0, 1) + "***" + url.hostname.substring(url.hostname.length - 1) : url.hostname;
  console.log(`[Target DB]: postgres://***:***@${maskedHost}:${url.port}/${url.pathname.substring(1)} (LOCAL DEV DB)`);

  const isDryRun = process.argv.includes('--dry-run');
  const files = process.argv.filter(a => a.endsWith('.json'));
  
  const pool = new Pool({ connectionString, ssl: false });
  const client = await pool.connect();
  const report = [];

  try {
    await client.query('BEGIN');
    for (const file of files) {
      const p = JSON.parse(fs.readFileSync(file, 'utf8'));
      const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await client.query('SELECT id FROM problems WHERE slug = $1', [slug]);
      let status = res.rows.length > 0 ? "UPDATED" : "INSERTED";
      report.push({ Title: p.title, Slug: slug, Topic: p.topic, Difficulty: p.difficulty, Status: status, Tests: p.testSuite.length });
    }
    
    if (isDryRun) {
      console.log(`\n[DRY RUN] Rolling back changes.`);
      await client.query('ROLLBACK');
    } else {
      console.log(`\n[COMMIT] Committing changes.`);
      await client.query('COMMIT');
    }
    console.table(report);
  } catch (err) {
    console.error(err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    pool.end();
  }
}
seed();
