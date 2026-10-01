'use strict'

const { runSandbox } = require('./sandbox')

const TEST_CASES = [
  { input: '"applepenapple", ["apple","pen"]',     output: 'true',  is_hidden: false },
  { input: '"leetcode", ["leet","code"]',           output: 'true',  is_hidden: false },
  { input: '"catsandog", ["cats","dog","sand","and","cat"]', output: 'false', is_hidden: false },
]

const CODE_WITH_IMPORT = `import java.util.*;

class Solution {
    public boolean solution(String s, List<String> wordDict) {
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++) {
            for (String word : wordDict) {
                int len = word.length();
                if (len <= i && dp[i - len] && s.substring(i - len, i).equals(word)) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.length()];
    }
}`

const CODE_WITHOUT_IMPORT = `class Solution {
    public boolean solution(String s, java.util.List<String> wordDict) {
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++) {
            for (String word : wordDict) {
                int len = word.length();
                if (len <= i && dp[i - len] && s.substring(i - len, i).equals(word)) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.length()];
    }
}`

const CODE_BROKEN = `class Solution {
    public boolean solution(String s, java.util.List<String> wordDict) {
        THIS IS NOT VALID JAVA;
    }
}`

async function run() {
  console.log('\n══════ Word Break Java Judge Regression Test ══════\n')

  console.log('Variant 1 — with "import java.util.*"')
  const r1 = await runSandbox({ code: CODE_WITH_IMPORT, language: 'java', testCases: TEST_CASES })
  console.log('  verdict:', r1.verdict, '| passed:', r1.passedTests + '/' + r1.totalTests)
  r1.testResults && r1.testResults.forEach(tr => console.log(`  [${tr.passed?'✓':'✗'}] TC${tr.testIndex}: actual=${tr.actual} expected=${tr.expected}${tr.error?' err:'+tr.error:''}`))
  const v1ok = r1.verdict === 'ACCEPTED' && r1.passedTests === 3
  console.log(v1ok ? '  → PASS ✓\n' : '  → FAIL ✗\n')

  console.log('Variant 2 — no import (qualified java.util.List)')
  const r2 = await runSandbox({ code: CODE_WITHOUT_IMPORT, language: 'java', testCases: TEST_CASES })
  console.log('  verdict:', r2.verdict, '| passed:', r2.passedTests + '/' + r2.totalTests)
  r2.testResults && r2.testResults.forEach(tr => console.log(`  [${tr.passed?'✓':'✗'}] TC${tr.testIndex}: actual=${tr.actual} expected=${tr.expected}${tr.error?' err:'+tr.error:''}`))
  const v2ok = r2.verdict === 'ACCEPTED' && r2.passedTests === 3
  console.log(v2ok ? '  → PASS ✓\n' : '  → FAIL ✗\n')

  console.log('Variant 3 — broken code (expect COMPILATION_ERROR)')
  const r3 = await runSandbox({ code: CODE_BROKEN, language: 'java', testCases: TEST_CASES })
  console.log('  verdict:', r3.verdict)
  const v3ok = r3.verdict === 'COMPILATION_ERROR'
  console.log(v3ok ? '  → PASS ✓\n' : '  → FAIL ✗\n')

  console.log('══════ Summary ══════')
  console.log('Variant 1 (with import)   :', v1ok ? 'PASS ✓' : 'FAIL ✗')
  console.log('Variant 2 (no import)     :', v2ok ? 'PASS ✓' : 'FAIL ✗')
  console.log('Variant 3 (compile error) :', v3ok ? 'PASS ✓' : 'FAIL ✗')
  const allPass = v1ok && v2ok && v3ok
  console.log('\nOverall:', allPass ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗')
  process.exit(allPass ? 0 : 1)
}

run().catch(e => { console.error('[Fatal]', e.message); process.exit(1) })
