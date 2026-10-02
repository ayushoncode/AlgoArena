const { Pool } = require('pg');

const PROD_URL = "postgresql://postgres.ikkskqozehxcuaseieqm:Z-Bg%26%24Sa-%2Abi9Y%2A@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
const isDown = process.argv.includes('--down');

function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function migrate() {
  const pool = new Pool({ connectionString: PROD_URL });
  try {
    if (isDown) {
      console.log('Rolling back slug and hints migration...');
      await pool.query('ALTER TABLE public.problems DROP COLUMN IF EXISTS slug;');
      await pool.query('ALTER TABLE public.problems DROP COLUMN IF EXISTS hints;');
      console.log('Rollback complete.');
      return;
    }

    console.log('Starting migration...');
    // Add columns
    await pool.query('ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS slug VARCHAR(255);');
    await pool.query('ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT \'[]\'::jsonb;');

    // Backfill slugs
    const res = await pool.query('SELECT id, title FROM public.problems WHERE slug IS NULL');
    const usedSlugs = new Set();
    
    for (const row of res.rows) {
      let baseSlug = toSlug(row.title);
      let slug = baseSlug;
      let counter = 1;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(slug);
      await pool.query('UPDATE public.problems SET slug = $1 WHERE id = $2', [slug, row.id]);
    }
    
    // Add UNIQUE index
    await pool.query('ALTER TABLE public.problems ADD CONSTRAINT problems_slug_key UNIQUE (slug);');
    
    console.log('Migration complete.');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    pool.end();
  }
}

migrate();
