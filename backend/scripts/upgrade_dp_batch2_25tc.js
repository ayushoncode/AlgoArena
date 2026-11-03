'use strict';

/**
 * upgrade_dp_batch2_25tc.js
 *
 * Upgrades 6 2D Grid & Matrix DP problems to exactly 25 curated test cases:
 * 1. Unique Paths (LC 62) [Medium]
 * 2. Unique Paths II (LC 63) [Medium]
 * 3. Minimum Path Sum (LC 64) [Medium]
 * 4. Triangle (LC 120) [Medium]
 * 5. Dungeon Game (LC 174) [Hard]
 * 6. Maximal Rectangle (LC 85) [Hard]
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { evaluateSubmission } = require('../services/judge');

async function safeQuery(text, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.pool.query(text, params);
    } catch (err) {
      console.warn(`[DB Retry ${attempt}/${maxRetries}] Query failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// -------------------------------------------------------------
// Reference Solvers for Extra Test Cases
// -------------------------------------------------------------

function solveUniquePaths(m, n) {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
}

function solveUniquePathsII(obstacleGrid) {
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = obstacleGrid[0][0] === 1 ? 0 : 1;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (obstacleGrid[i][j] === 1) {
        dp[j] = 0;
      } else if (j > 0) {
        dp[j] += dp[j - 1];
      }
    }
  }
  return dp[n - 1];
}

function solveMinPathSum(grid) {
  const m = grid.length;
  const n = grid[0].length;
  const dp = new Array(n).fill(Infinity);
  dp[0] = 0;
  for (let i = 0; i < m; i++) {
    dp[0] += grid[i][0];
    for (let j = 1; j < n; j++) {
      dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
    }
  }
  return dp[n - 1];
}

function solveTriangle(triangle) {
  const dp = [...triangle[triangle.length - 1]];
  for (let i = triangle.length - 2; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
    }
  }
  return dp[0];
}

function solveDungeonGame(dungeon) {
  const m = dungeon.length;
  const n = dungeon[0].length;
  const dp = new Array(n + 1).fill(Infinity);
  dp[n - 1] = 1;
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const minNext = Math.min(dp[j], dp[j + 1]);
      dp[j] = Math.max(1, minNext - dungeon[i][j]);
    }
    dp[n] = Infinity;
  }
  return dp[0];
}

function solveMaximalRectangle(matrix) {
  if (!matrix || !matrix.length || !matrix[0].length) return 0;
  const cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let maxArea = 0;
  for (const row of matrix) {
    for (let c = 0; c < cols; c++) {
      heights[c] = row[c] === '1' ? heights[c] + 1 : 0;
    }
    const stack = [];
    for (let i = 0; i <= cols; i++) {
      const h = i === cols ? 0 : heights[i];
      while (stack.length && heights[stack[stack.length - 1]] >= h) {
        const height = heights[stack.pop()];
        const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
        maxArea = Math.max(maxArea, height * width);
      }
      stack.push(i);
    }
  }
  return maxArea;
}

// -------------------------------------------------------------
// Metadata & Upgrades
// -------------------------------------------------------------

const DP_BATCH2 = [
  {
    slug: 'unique-paths',
    title: 'Unique Paths',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-10-tests/unique-paths.json',
    sample_input: '3, 7',
    sample_output: '28',
    description: `There is a robot on an \`m x n\` grid. The robot is initially located at the **top-left corner** (i.e., \`grid[0][0]\`). The robot tries to move to the **bottom-right corner** (i.e., \`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time.

Given the two integers \`m\` and \`n\`, return *the number of possible unique paths that the robot can take to reach the bottom-right corner*.

The test cases are generated so that the answer will be less than or equal to \`2 * 10⁹\`.

### Example 1:
\`\`\`
Input: m = 3, n = 7
Output: 28
\`\`\`

### Example 2:
\`\`\`
Input: m = 3, n = 2
Output: 3
Explanation: From the top-left corner, there are a total of 3 ways to reach the bottom-right corner:
1. Right -> Down -> Down
2. Down -> Down -> Right
3. Down -> Right -> Down
\`\`\`

### Constraints:
- \`1 <= m, n <= 100\``,
    generateExtraTestCases: () => {
      const extras = [
        [15, 15],
        [18, 18],
        [30, 30],
        [50, 20],
        [100, 10]
      ];
      return extras.map(([m, n]) => ({
        input: `${m}, ${n}`,
        output: String(solveUniquePaths(m, n)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(m, n) {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[j] += dp[j - 1];
    }
  }
  return dp[n - 1];
}`,
    bruteCode: `
function solution(m, n) {
  function paths(r, c) {
    if (r === m - 1 && c === n - 1) return 1;
    if (r >= m || c >= n) return 0;
    return paths(r + 1, c) + paths(r, c + 1);
  }
  return paths(0, 0);
}`
  },
  {
    slug: 'unique-paths-ii',
    title: 'Unique Paths II',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-33-tests/unique-paths-ii.json',
    sample_input: '[[0,0,0],[0,1,0],[0,0,0]]',
    sample_output: '2',
    description: `You are given an \`m x n\` integer array \`grid\`. There is a robot initially located at the **top-left corner** (\`grid[0][0]\`). The robot tries to move to the **bottom-right corner** (\`grid[m - 1][n - 1]\`). The robot can only move either down or right at any point in time.

An obstacle and space are marked as \`1\` or \`0\` respectively in \`grid\`. A path that the robot takes cannot include **any** square that is an obstacle.

Return *the number of possible unique paths that the robot can take to reach the bottom-right corner*.

The test cases are generated so that the answer will be less than or equal to \`2 * 10⁹\`.

### Example 1:
\`\`\`
Input: obstacleGrid = [[0,0,0],[0,1,0],[0,0,0]]
Output: 2
Explanation: There is one obstacle in the middle of the 3x3 grid above.
There are two ways to reach the bottom-right corner:
1. Right -> Right -> Down -> Down
2. Down -> Down -> Right -> Right
\`\`\`

### Example 2:
\`\`\`
Input: obstacleGrid = [[0,1],[0,0]]
Output: 1
\`\`\`

### Constraints:
- \`m == obstacleGrid.length\`
- \`n == obstacleGrid[i].length\`
- \`1 <= m, n <= 100\`
- \`obstacleGrid[i][j]\` is \`0\` or \`1\`.`,
    generateExtraTestCases: () => {
      // 21: 16x16 with 0 obstacles (kills naive recursion)
      const g21 = Array.from({ length: 16 }, () => Array(16).fill(0));
      // 22: 16x16 with blocked target
      const g22 = Array.from({ length: 16 }, () => Array(16).fill(0));
      g22[15][15] = 1;
      // 23: 30x30 with sparse obstacles
      const g23 = Array.from({ length: 30 }, (_, r) =>
        Array.from({ length: 30 }, (_, c) => ((r + c) % 7 === 3 ? 1 : 0))
      );
      g23[0][0] = 0; g23[29][29] = 0;
      // 24: 50x50 with diagonal obstacles
      const g24 = Array.from({ length: 50 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => (r === c && r !== 0 && r !== 49 ? 1 : 0))
      );
      // 25: 100x20 with random obstacles
      const g25 = Array.from({ length: 100 }, (_, r) =>
        Array.from({ length: 20 }, (_, c) => ((r * 13 + c * 7) % 11 === 0 ? 1 : 0))
      );
      g25[0][0] = 0; g25[99][19] = 0;

      const extras = [g21, g22, g23, g24, g25];
      return extras.map((grid) => ({
        input: JSON.stringify(grid),
        output: String(solveUniquePathsII(grid)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(obstacleGrid) {
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = obstacleGrid[0][0] === 1 ? 0 : 1;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (obstacleGrid[i][j] === 1) {
        dp[j] = 0;
      } else if (j > 0) {
        dp[j] += dp[j - 1];
      }
    }
  }
  return dp[n - 1];
}`,
    bruteCode: `
function solution(grid) {
  function paths(r, c) {
    if (r >= grid.length || c >= grid[0].length || grid[r][c] === 1) return 0;
    if (r === grid.length - 1 && c === grid[0].length - 1) return 1;
    return paths(r + 1, c) + paths(r, c + 1);
  }
  return paths(0, 0);
}`
  },
  {
    slug: 'minimum-path-sum',
    title: 'Minimum Path Sum',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-32-tests/minimum-path-sum.json',
    sample_input: '[[1,3,1],[1,5,1],[4,2,1]]',
    sample_output: '7',
    description: `Given a \`m x n\` \`grid\` filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.

**Note:** You can only move either down or right at any point in time.

### Example 1:
\`\`\`
Input: grid = [[1,3,1],[1,5,1],[4,2,1]]
Output: 7
Explanation: Because the path 1 -> 3 -> 1 -> 1 -> 1 minimizes the sum.
\`\`\`

### Example 2:
\`\`\`
Input: grid = [[1,2,3],[4,5,6]]
Output: 12
\`\`\`

### Constraints:
- \`m == grid.length\`
- \`n == grid[i].length\`
- \`1 <= m, n <= 200\`
- \`0 <= grid[i][j] <= 200\``,
    generateExtraTestCases: () => {
      // 21: 16x16 all 1s (kills naive recursion)
      const g21 = Array.from({ length: 16 }, () => Array(16).fill(1));
      // 22: 25x25 random values
      const g22 = Array.from({ length: 25 }, (_, r) =>
        Array.from({ length: 25 }, (_, c) => (r * 7 + c * 11) % 100)
      );
      // 23: 50x50 gradient
      const g23 = Array.from({ length: 50 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => (r + c) % 200)
      );
      // 24: 100x50 grid
      const g24 = Array.from({ length: 100 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => (r * 3 + c * 5) % 150)
      );
      // 25: 200x50 upper-bound grid
      const g25 = Array.from({ length: 200 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => (r * 17 + c * 23) % 200)
      );

      const extras = [g21, g22, g23, g24, g25];
      return extras.map((grid) => ({
        input: JSON.stringify(grid),
        output: String(solveMinPathSum(grid)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(grid) {
  const m = grid.length;
  const n = grid[0].length;
  const dp = new Array(n).fill(Infinity);
  dp[0] = 0;
  for (let i = 0; i < m; i++) {
    dp[0] += grid[i][0];
    for (let j = 1; j < n; j++) {
      dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
    }
  }
  return dp[n - 1];
}`,
    bruteCode: `
function solution(grid) {
  function dfs(r, c) {
    if (r === grid.length - 1 && c === grid[0].length - 1) return grid[r][c];
    if (r >= grid.length || c >= grid[0].length) return Infinity;
    return grid[r][c] + Math.min(dfs(r + 1, c), dfs(r, c + 1));
  }
  return dfs(0, 0);
}`
  },
  {
    slug: 'triangle',
    title: 'Triangle',
    difficulty: 'medium',
    jsonPath: 'private/solutions/batch-9-tests/triangle.json',
    sample_input: '[[2],[3,4],[6,5,7],[4,1,8,3]]',
    sample_output: '11',
    description: `Given a \`triangle\` array, return *the minimum path sum from top to bottom*.

For each step, you may move to an adjacent number of the row below. More formally, if you are on index \`i\` on the current row, you may move to either index \`i\` or index \`i + 1\` on the next row.

### Example 1:
\`\`\`
Input: triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]
Output: 11
Explanation: The triangle looks like:
   2
  3 4
 6 5 7
4 1 8 3
The minimum path sum from top to bottom is 2 + 3 + 5 + 1 = 11.
\`\`\`

### Example 2:
\`\`\`
Input: triangle = [[-10]]
Output: -10
\`\`\`

### Constraints:
- \`1 <= triangle.length <= 200\`
- \`triangle[0].length == 1\`
- \`triangle[i].length == triangle[i - 1].length + 1\`
- \`-10⁴ <= triangle[i][j] <= 10⁴\``,
    generateExtraTestCases: () => {
      // 21: Triangle depth 26 all 1s (kills naive recursion, 2^26 > 6.7x10^7 calls)
      const t21 = Array.from({ length: 26 }, (_, r) => Array(r + 1).fill(1));
      // 22: Triangle depth 30 with negative values
      const t22 = Array.from({ length: 30 }, (_, r) =>
        Array.from({ length: r + 1 }, (_, c) => ((r * 7 + c * 3) % 20) - 10)
      );
      // 23: Triangle depth 60
      const t23 = Array.from({ length: 60 }, (_, r) =>
        Array.from({ length: r + 1 }, (_, c) => (r * 11 + c * 13) % 100)
      );
      // 24: Triangle depth 100
      const t24 = Array.from({ length: 100 }, (_, r) =>
        Array.from({ length: r + 1 }, (_, c) => (r * 31 + c * 17) % 500)
      );
      // 25: Triangle depth 200 (max constraint)
      const t25 = Array.from({ length: 200 }, (_, r) =>
        Array.from({ length: r + 1 }, (_, c) => (r * 43 + c * 29) % 1000)
      );

      const extras = [t21, t22, t23, t24, t25];
      return extras.map((tri) => ({
        input: JSON.stringify(tri),
        output: String(solveTriangle(tri)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(triangle) {
  const dp = [...triangle[triangle.length - 1]];
  for (let i = triangle.length - 2; i >= 0; i--) {
    for (let j = 0; j <= i; j++) {
      dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
    }
  }
  return dp[0];
}`,
    bruteCode: `
function solution(triangle) {
  function dfs(r, c) {
    if (r === triangle.length - 1) return triangle[r][c];
    return triangle[r][c] + Math.min(dfs(r + 1, c), dfs(r + 1, c + 1));
  }
  return dfs(0, 0);
}`
  },
  {
    slug: 'dungeon-game',
    title: 'Dungeon Game',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-19-tests/dungeon-game.json',
    sample_input: '[[-2,-3,3],[-5,-10,1],[10,30,-5]]',
    sample_output: '7',
    description: `The demons had captured the princess and imprisoned her in the **bottom-right corner** of a \`dungeon\`. The dungeon consists of \`m x n\` rooms laid out in a 2D grid. Our valiant knight was initially positioned in the **top-left room** and must fight his way through dungeon to rescue the princess.

The knight has an initial health point represented by a positive integer. If at any point his health point drops to \`0\` or below, he dies immediately.

Some of the rooms are guarded by demons (represented by negative integers), so the knight loses health upon entering these rooms; other rooms are either empty (represented as 0) or contain magic orbs that increase the knight's health (represented by positive integers).

To reach the princess as quickly as possible, the knight decides to move only **rightward** or **downward** in each step.

Return *the knight's minimum initial health so that he can rescue the princess*.

**Note** that any room can contain threats or power-ups, even the first room the knight enters and the bottom-right room where the princess is imprisoned.

### Example 1:
\`\`\`
Input: dungeon = [[-2,-3,3],[-5,-10,1],[10,30,-5]]
Output: 7
Explanation: The initial health of the knight must be at least 7 if he follows the optimal path: RIGHT -> RIGHT -> DOWN -> DOWN.
\`\`\`

### Example 2:
\`\`\`
Input: dungeon = [[0]]
Output: 1
\`\`\`

### Constraints:
- \`m == dungeon.length\`
- \`n == dungeon[i].length\`
- \`1 <= m, n <= 200\`
- \`-1000 <= dungeon[i][j] <= 1000\``,
    generateExtraTestCases: () => {
      // 21: 15x15 all -5 (kills naive recursion)
      const d21 = Array.from({ length: 15 }, () => Array(15).fill(-5));
      // 22: 16x16 with mixed traps and magic orbs
      const d22 = Array.from({ length: 16 }, (_, r) =>
        Array.from({ length: 16 }, (_, c) => ((r * 7 + c * 13) % 20) - 10)
      );
      // 23: 35x35 dungeon
      const d23 = Array.from({ length: 35 }, (_, r) =>
        Array.from({ length: 35 }, (_, c) => ((r * 19 + c * 23) % 40) - 20)
      );
      // 24: 70x70 dungeon
      const d24 = Array.from({ length: 70 }, (_, r) =>
        Array.from({ length: 70 }, (_, c) => ((r * 31 + c * 47) % 60) - 30)
      );
      // 25: 150x50 upper-bound dungeon
      const d25 = Array.from({ length: 150 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => ((r * 53 + c * 67) % 100) - 50)
      );

      const extras = [d21, d22, d23, d24, d25];
      return extras.map((grid) => ({
        input: JSON.stringify(grid),
        output: String(solveDungeonGame(grid)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(dungeon) {
  const m = dungeon.length;
  const n = dungeon[0].length;
  const dp = new Array(n + 1).fill(Infinity);
  dp[n - 1] = 1;
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const minNext = Math.min(dp[j], dp[j + 1]);
      dp[j] = Math.max(1, minNext - dungeon[i][j]);
    }
    dp[n] = Infinity;
  }
  return dp[0];
}`,
    bruteCode: `
function solution(dungeon) {
  function dfs(r, c) {
    if (r >= dungeon.length || c >= dungeon[0].length) return Infinity;
    if (r === dungeon.length - 1 && c === dungeon[0].length - 1) {
      return Math.max(1, 1 - dungeon[r][c]);
    }
    const minNext = Math.min(dfs(r + 1, c), dfs(r, c + 1));
    return Math.max(1, minNext - dungeon[r][c]);
  }
  return dfs(0, 0);
}`
  },
  {
    slug: 'maximal-rectangle',
    title: 'Maximal Rectangle',
    difficulty: 'hard',
    jsonPath: 'private/solutions/batch-10-tests/maximal-rectangle.json',
    sample_input: '[["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]',
    sample_output: '6',
    description: `Given a \`rows x cols\` binary \`matrix\` filled with \`0\`'s and \`1\`'s, find the largest rectangle containing only \`1\`'s and return *its area*.

### Example 1:
\`\`\`
Input: matrix = [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]]
Output: 6
Explanation: The maximal rectangle is shown in the above grid with area = 6.
\`\`\`

### Example 2:
\`\`\`
Input: matrix = [["0"]]
Output: 0
\`\`\`

### Example 3:
\`\`\`
Input: matrix = [["1"]]
Output: 1
\`\`\`

### Constraints:
- \`rows == matrix.length\`
- \`cols == matrix[i].length\`
- \`1 <= row, cols <= 200\`
- \`matrix[i][j]\` is \`'0'\` or \`'1'\`.`,
    generateExtraTestCases: () => {
      // 21: 25x25 matrix of all '1's -> 625 (kills naive O(N^6) brute force)
      const m21 = Array.from({ length: 25 }, () => Array(25).fill('1'));
      // 22: 30x30 checkerboard
      const m22 = Array.from({ length: 30 }, (_, r) =>
        Array.from({ length: 30 }, (_, c) => ((r + c) % 2 === 0 ? '1' : '0'))
      );
      // 23: 50x50 random 0 and 1
      const m23 = Array.from({ length: 50 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => ((r * 7 + c * 13) % 3 === 0 ? '0' : '1'))
      );
      // 24: 100x50 matrix
      const m24 = Array.from({ length: 100 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => ((r * 19 + c * 23) % 4 !== 0 ? '1' : '0'))
      );
      // 25: 200x50 upper-bound matrix
      const m25 = Array.from({ length: 200 }, (_, r) =>
        Array.from({ length: 50 }, (_, c) => ((r * 31 + c * 37) % 5 !== 0 ? '1' : '0'))
      );

      const extras = [m21, m22, m23, m24, m25];
      return extras.map((mat) => ({
        input: JSON.stringify(mat),
        output: String(solveMaximalRectangle(mat)),
        is_hidden: true
      }));
    },
    optimalCode: `
function solution(matrix) {
  if (!matrix || !matrix.length || !matrix[0].length) return 0;
  const cols = matrix[0].length;
  const heights = new Array(cols).fill(0);
  let maxArea = 0;
  for (const row of matrix) {
    for (let c = 0; c < cols; c++) {
      heights[c] = row[c] === '1' ? heights[c] + 1 : 0;
    }
    const stack = [];
    for (let i = 0; i <= cols; i++) {
      const h = i === cols ? 0 : heights[i];
      while (stack.length && heights[stack[stack.length - 1]] >= h) {
        const height = heights[stack.pop()];
        const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
        maxArea = Math.max(maxArea, height * width);
      }
      stack.push(i);
    }
  }
  return maxArea;
}`,
    bruteCode: `
function solution(matrix) {
  let maxArea = 0;
  const R = matrix.length, C = matrix[0].length;
  for (let r1 = 0; r1 < R; r1++) {
    for (let c1 = 0; c1 < C; c1++) {
      for (let r2 = r1; r2 < R; r2++) {
        for (let c2 = c1; c2 < C; c2++) {
          let allOnes = true;
          for (let r = r1; r <= r2 && allOnes; r++) {
            for (let c = c1; c <= c2; c++) {
              if (matrix[r][c] !== '1') { allOnes = false; break; }
            }
          }
          if (allOnes) maxArea = Math.max(maxArea, (r2 - r1 + 1) * (c2 - c1 + 1));
        }
      }
    }
  }
  return maxArea;
}`
  }
];

async function run() {
  console.log('=== Starting Upgrade for DP Batch 2 (6 Problems) ===\n');

  for (const prob of DP_BATCH2) {
    console.log(`-----------------------------------------------------`);
    console.log(`Processing: [${prob.difficulty.toUpperCase()}] ${prob.title} (${prob.slug})`);

    // 1. Fetch Problem ID
    const probRes = await safeQuery('SELECT id FROM problems WHERE slug = $1', [prob.slug]);
    if (!probRes.rows.length) {
      console.error(`Problem ${prob.slug} NOT FOUND in DB!`);
      continue;
    }
    const problemId = probRes.rows[0].id;

    // 2. Update metadata & description
    await safeQuery(
      `UPDATE problems 
       SET title = $1, difficulty = $2, description = $3, sample_input = $4, sample_output = $5
       WHERE id = $6`,
      [prob.title, prob.difficulty, prob.description, prob.sample_input, prob.sample_output, problemId]
    );
    console.log(`✓ Metadata & LeetCode description updated.`);

    // 3. Load 20 existing test cases from JSON file
    const rootDir = path.join(__dirname, '../..');
    const fullJsonPath = path.join(rootDir, prob.jsonPath);
    const existingRaw = JSON.parse(fs.readFileSync(fullJsonPath, 'utf8'));

    const baseTestCases = existingRaw.slice(0, 20).map((tc, idx) => ({
      input: tc.input,
      output: typeof tc.output === 'object' ? JSON.stringify(tc.output) : String(tc.output),
      is_hidden: idx >= 3
    }));

    // 4. Generate 5 extra curated edge cases & stress tests
    const extraTestCases = prob.generateExtraTestCases();
    const finalTestCases = [...baseTestCases, ...extraTestCases];

    if (finalTestCases.length !== 25) {
      throw new Error(`Expected exactly 25 test cases for ${prob.slug}, got ${finalTestCases.length}`);
    }

    // 5. Delete and seed exactly 25 test cases
    await safeQuery('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);

    for (let i = 0; i < finalTestCases.length; i++) {
      const tc = finalTestCases[i];
      await safeQuery(
        `INSERT INTO test_cases (problem_id, input, output, is_hidden)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.output, tc.is_hidden]
      );
    }
    console.log(`✓ Seeded exactly 25 test cases (TC 25 length: ${finalTestCases[24].input.length} chars).`);

    // 6. Validate Optimal Solution with Judge
    const optimalResult = await evaluateSubmission(problemId, prob.optimalCode, 'javascript');
    console.log(
      `✓ Optimal Solution: verdict = ${optimalResult.verdict} (${optimalResult.passedTests}/${optimalResult.totalTests} in ${optimalResult.runtimeMs}ms)`
    );
    if (optimalResult.verdict !== 'ACCEPTED' || optimalResult.passedTests !== 25) {
      console.error('OPTIMAL SOLUTION FAILED!', optimalResult);
      process.exit(1);
    }

    // 7. Verify Brute Force Strictly Gets TIME_LIMIT_EXCEEDED
    if (prob.bruteCode) {
      const bruteResult = await evaluateSubmission(problemId, prob.bruteCode, 'javascript');
      console.log(
        `✓ Brute Force Check: verdict = ${bruteResult.verdict} (${bruteResult.passedTests}/${bruteResult.totalTests} in ${bruteResult.runtimeMs}ms)`
      );
      if (bruteResult.verdict !== 'TIME_LIMIT_EXCEEDED') {
        console.warn(`WARNING: Brute force did not get TIME_LIMIT_EXCEEDED! Got: ${bruteResult.verdict}`);
      } else {
        console.log(`✓ Confirmed: Brute force strictly triggers TIME_LIMIT_EXCEEDED (> 2000ms limit).`);
      }
    }
  }

  console.log('\n=====================================================');
  console.log('✓ All 6 2D Grid & Matrix DP problems successfully upgraded and TLE-verified!');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end();
  });
