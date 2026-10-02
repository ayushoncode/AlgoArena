const { Pool } = require('pg');

const PROD_URL = "postgresql://postgres.ikkskqozehxcuaseieqm:Z-Bg%26%24Sa-%2Abi9Y%2A@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
const DEV_URL = "postgresql://postgres.cuhxquuarnmmfbvsjuoj:8wZeLxqpsqT%2A4C%25@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function prepareDiff() {
  const prodPool = new Pool({ connectionString: PROD_URL });
  const devPool = new Pool({ connectionString: DEV_URL });

  try {
    const prodProblems = (await prodPool.query('SELECT * FROM public.problems')).rows;
    const prodTestCases = (await prodPool.query('SELECT * FROM public.test_cases')).rows;
    
    const devProblems = (await devPool.query('SELECT * FROM public.problems')).rows;
    const devTestCases = (await devPool.query('SELECT * FROM public.test_cases')).rows;

    const prodMap = new Map();
    for (const p of prodProblems) {
      prodMap.set(p.slug || normalize(p.title), p);
    }
    
    const report = { matched: [], new: [], prodOnly: [], conflicts: [] };

    const devUsedSlugs = new Set();

    for (const devP of devProblems) {
      const slug = devP.slug || normalize(devP.title);
      devUsedSlugs.add(slug);

      if (prodMap.has(slug)) {
        const prodP = prodMap.get(slug);
        
        // Find changed fields
        const changedFields = [];
        if (prodP.title !== devP.title) changedFields.push('title');
        if (prodP.description !== devP.description) changedFields.push('description (statement/constraints/examples)');
        if (prodP.topic !== devP.topic) changedFields.push('topic');
        if (prodP.difficulty !== devP.difficulty) changedFields.push('difficulty');
        if (JSON.stringify(prodP.hints) !== JSON.stringify(devP.hints)) changedFields.push('hints');
        
        // Check test cases replaced
        const pTc = prodTestCases.filter(t => t.problem_id === prodP.id);
        const dTc = devTestCases.filter(t => t.problem_id === devP.id);
        if (pTc.length !== dTc.length) {
          changedFields.push(`tests (${pTc.length} -> ${dTc.length})`);
        } else {
          // just check if they are identical roughly
          const pTcStr = JSON.stringify(pTc.map(t => ({i: t.input, o: t.output, h: t.is_hidden})));
          const dTcStr = JSON.stringify(dTc.map(t => ({i: t.input, o: t.output, h: t.is_hidden})));
          if (pTcStr !== dTcStr) changedFields.push(`tests (REPLACED)`);
        }

        report.matched.push({
          slug,
          title: devP.title,
          changedFields: changedFields.length > 0 ? changedFields.join(', ') : 'None'
        });
      } else {
        report.new.push({
          slug,
          title: devP.title
        });
      }
    }

    for (const [slug, prodP] of prodMap.entries()) {
      if (!devUsedSlugs.has(slug)) {
        report.prodOnly.push({ slug, title: prodP.title });
      }
    }

    console.log("=== MATCHED (To be UPDATED) ===");
    console.table(report.matched);
    console.log(`Matched Count: ${report.matched.length}`);

    console.log("\n=== NEW (To be INSERTED) ===");
    console.table(report.new.slice(0, 5)); // show first 5
    console.log(`New Count: ${report.new.length} (showing first 5)`);

    console.log("\n=== PROD ONLY (Untouched) ===");
    console.table(report.prodOnly);
    console.log(`Prod Only Count: ${report.prodOnly.length}`);

    console.log("\n=== CONFLICTS ===");
    console.table(report.conflicts);
    console.log(`Conflicts Count: ${report.conflicts.length}`);

  } catch (e) {
    console.error(e);
  } finally {
    prodPool.end();
    devPool.end();
  }
}

prepareDiff();
