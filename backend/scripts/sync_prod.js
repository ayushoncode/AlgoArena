const { Pool } = require('pg');

const PROD_URL = "postgresql://postgres.ikkskqozehxcuaseieqm:Z-Bg%26%24Sa-%2Abi9Y%2A@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
const DEV_URL = "postgresql://postgres.cuhxquuarnmmfbvsjuoj:8wZeLxqpsqT%2A4C%25@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function sync() {
  const prodPool = new Pool({ connectionString: PROD_URL });
  const devPool = new Pool({ connectionString: DEV_URL });

  const client = await prodPool.connect();

  try {
    console.log('Fetching DEV data...');
    const devProblems = (await devPool.query('SELECT * FROM public.problems')).rows;
    const devTestCases = (await devPool.query('SELECT * FROM public.test_cases')).rows;

    console.log('Fetching PROD data...');
    const prodProblems = (await client.query('SELECT * FROM public.problems')).rows;
    const prodMap = new Map();
    for (const p of prodProblems) {
      prodMap.set(p.slug || normalize(p.title), p);
    }

    console.log('Starting PROD transaction...');
    await client.query('BEGIN');

    let inserted = 0;
    let updated = 0;

    for (const devP of devProblems) {
      const slug = devP.slug || normalize(devP.title);
      let targetProblemId;

      if (prodMap.has(slug)) {
        const prodP = prodMap.get(slug);
        targetProblemId = prodP.id;
        
        await client.query(`
          UPDATE public.problems 
          SET title=$1, topic=$2, difficulty=$3, description=$4, hints=$5, 
              min_rating=$6, max_rating=$7, sample_input=$8, sample_output=$9
          WHERE id=$10
        `, [
          devP.title, devP.topic, devP.difficulty, devP.description, 
          JSON.stringify(devP.hints || []), devP.min_rating, devP.max_rating, 
          devP.sample_input, devP.sample_output, targetProblemId
        ]);
        updated++;
      } else {
        targetProblemId = devP.id; // preserve ID for new ones
        await client.query(`
          INSERT INTO public.problems 
          (id, title, slug, topic, difficulty, description, hints, min_rating, max_rating, sample_input, sample_output) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          targetProblemId, devP.title, slug, devP.topic, devP.difficulty, devP.description, 
          JSON.stringify(devP.hints || []), devP.min_rating, devP.max_rating, 
          devP.sample_input, devP.sample_output
        ]);
        inserted++;
      }

      // Sync test cases
      await client.query('DELETE FROM public.test_cases WHERE problem_id = $1', [targetProblemId]);
      
      const tests = devTestCases.filter(t => t.problem_id === devP.id);
      for (const t of tests) {
        await client.query(`
          INSERT INTO public.test_cases (problem_id, input, output, is_hidden)
          VALUES ($1, $2, $3, $4)
        `, [targetProblemId, t.input, t.output, t.is_hidden]);
      }
    }

    console.log(`Updated ${updated} problems. Inserted ${inserted} new problems.`);
    
    // verify counts
    const countRes = await client.query('SELECT count(*) FROM public.problems');
    console.log(`New PROD count: ${countRes.rows[0].count}`);

    console.log('Committing transaction...');
    await client.query('COMMIT');
    console.log('Sync complete!');

  } catch (e) {
    console.error('Error during sync:', e);
    await client.query('ROLLBACK');
    console.log('Rolled back.');
  } finally {
    client.release();
    prodPool.end();
    devPool.end();
  }
}

sync();
