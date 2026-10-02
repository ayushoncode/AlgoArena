const { Pool } = require('pg');

const PROD_URL = "postgresql://postgres.ikkskqozehxcuaseieqm:Z-Bg%26%24Sa-%2Abi9Y%2A@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
const DEV_URL = "postgresql://postgres.cuhxquuarnmmfbvsjuoj:8wZeLxqpsqT%2A4C%25@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function inspect() {
  const prodPool = new Pool({ connectionString: PROD_URL });
  const devPool = new Pool({ connectionString: DEV_URL });

  try {
    // Prod count
    const prodCountRes = await prodPool.query('SELECT count(*) FROM public.problems');
    console.log(`[PROD] Problems Count: ${prodCountRes.rows[0].count}`);
    
    // Dev count
    const devCountRes = await devPool.query('SELECT count(*) FROM public.problems');
    console.log(`[DEV] Problems Count: ${devCountRes.rows[0].count}`);

    // Prod schema
    const prodSchemaRes = await prodPool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'problems'
      ORDER BY ordinal_position;
    `);
    console.log('\n[PROD] Schema for "problems":');
    console.table(prodSchemaRes.rows);

    // Dev schema
    const devSchemaRes = await devPool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'problems'
      ORDER BY ordinal_position;
    `);
    console.log('\n[DEV] Schema for "problems":');
    console.table(devSchemaRes.rows);

    // Schema Diff
    const prodCols = prodSchemaRes.rows.map(r => r.column_name);
    const devCols = devSchemaRes.rows.map(r => r.column_name);
    
    const missingInProd = devCols.filter(c => !prodCols.includes(c));
    const missingInDev = prodCols.filter(c => !devCols.includes(c));
    console.log(`\n[DIFF] Columns in DEV but missing in PROD: ${missingInProd.join(', ')}`);
    console.log(`[DIFF] Columns in PROD but missing in DEV: ${missingInDev.join(', ')}`);

    // Sample rows
    const sampleRes = await prodPool.query('SELECT id, title, slug, topic, difficulty FROM public.problems LIMIT 3');
    console.log('\n[PROD] Sample of 3 rows:');
    console.log(JSON.stringify(sampleRes.rows, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    prodPool.end();
    devPool.end();
  }
}

inspect();
