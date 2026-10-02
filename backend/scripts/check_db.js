const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkDB() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing!");
    process.exit(1);
  }
  const url = new URL(connectionString);
  console.log(`[Target DB]: postgres://${url.hostname}:${url.port}/${url.pathname.substring(1)}`);
  
  const pool = new Pool({ connectionString, ssl: false });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT count(*) FROM problems');
    console.log(`[Problems Count]: ${res.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}
checkDB();
