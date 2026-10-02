const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function seed() {
  const isDryRun = process.argv.includes('--dry-run');
  const files = process.argv.filter(a => a.endsWith('.json'));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  const client = await pool.connect();
  
  const report = [];

  try {
    await client.query('BEGIN');
    
    for (const file of files) {
      const p = JSON.parse(fs.readFileSync(file, 'utf8'));
      const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const res = await client.query('SELECT id FROM problems WHERE slug = $1', [slug]);
      
      let problemId;
      let status = "";
      if (res.rows.length > 0) {
        problemId = res.rows[0].id;
        await client.query(
          `UPDATE problems SET title=$1, topic=$2, difficulty=$3, description=$4, hints=$5 WHERE id=$6`,
          [p.title, p.topic, p.difficulty, p.statement, JSON.stringify(p.hints || []), problemId]
        );
        status = "UPDATED";
      } else {
        const ires = await client.query(
          `INSERT INTO problems (title, slug, topic, difficulty, description, hints) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [p.title, slug, p.topic, p.difficulty, p.statement, JSON.stringify(p.hints || [])]
        );
        problemId = ires.rows[0].id;
        status = "INSERTED";
      }
      
      await client.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
      
      for (const tc of p.testSuite) {
        await client.query(
          `INSERT INTO test_cases (problem_id, input, output, is_hidden) VALUES ($1, $2, $3, $4)`,
          [problemId, tc.input, tc.output, tc.is_hidden]
        );
      }
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
    console.error('Error during seed:', err);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    pool.end();
  }
}

seed();
