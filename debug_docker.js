const fs = require('fs');
const { spawn } = require('child_process');

async function test() {
    const tmpDir = '/tmp/debug_sandbox';
    fs.mkdirSync(tmpDir, { recursive: true });
    
    // Copy the java files
    fs.copyFileSync('/Users/ayush/algoarena/private/solutions/batch-4-scripts/Runner.java', tmpDir + '/Runner.java').catch(()=>{});
    
    // Wait, let's just generate the test_cases.json and Runner.java using sandbox.js
    const { runSandbox } = require('/Users/ayush/algoarena/workers/sandbox');
    const code = `
    class Solution {
        public int solution(int[] nums, int target) {
            return -1;
        }
    }
    `;
    const testCases = JSON.parse(fs.readFileSync('/Users/ayush/algoarena/private/solutions/batch-4-tests/binary-search.json', 'utf8'));
    
    console.log("Running sandbox...");
    const res = await runSandbox({
        code,
        language: 'java',
        testCases
    });
    console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);
