require('dotenv').config({ path: './backend/.env' });
const pool = require('../db');

async function main() {
  // 1. Rotate Image
  const rotateDesc = `You are given an \`n x n\` 2D matrix representing an image, rotate the image by **90 degrees (clockwise)**.

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.

### **Example 1:**
![Rotate Image Example 1](https://assets.leetcode.com/uploads/2020/08/28/mat1.jpg)
**Input:** matrix = [[1,2,3],[4,5,6],[7,8,9]]
**Output:** [[7,4,1],[8,5,2],[9,6,3]]

### **Example 2:**
![Rotate Image Example 2](https://assets.leetcode.com/uploads/2020/08/28/mat2.jpg)
**Input:** matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
**Output:** [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]

### **Constraints:**
- \`n == matrix.length == matrix[i].length\`
- \`1 <= n <= 20\`
- \`-1000 <= matrix[i][j] <= 1000\``;
  await pool.query("UPDATE problems SET description = $1 WHERE slug = 'rotate-image'", [rotateDesc]);
  console.log('Updated rotate-image');

  // 2. Set Matrix Zeroes
  const setMatrixDesc = `Given an \`m x n\` integer matrix \`matrix\`, if an element is \`0\`, set its entire row and column to \`0\`'s.

You must do it in place.

### **Example 1:**
![Set Matrix Zeroes Example 1](https://assets.leetcode.com/uploads/2020/08/17/mat1.jpg)
**Input:** matrix = [[1,1,1],[1,0,1],[1,1,1]]
**Output:** [[1,0,1],[0,0,0],[1,0,1]]

### **Example 2:**
![Set Matrix Zeroes Example 2](https://assets.leetcode.com/uploads/2020/08/17/mat2.jpg)
**Input:** matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
**Output:** [[0,0,0,0],[0,4,5,0],[0,3,1,0]]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[0].length\`
- \`1 <= m, n <= 200\`
- \`-2³¹ <= matrix[i][j] <= 2³¹ - 1\``;
  await pool.query("UPDATE problems SET description = $1 WHERE slug = 'set-matrix-zeroes'", [setMatrixDesc]);
  console.log('Updated set-matrix-zeroes');

  // 3. Spiral Matrix
  const spiralDesc = `Given an \`m x n\` \`matrix\`, return all elements of the \`matrix\` in **spiral order**.

### **Example 1:**
![Spiral Matrix Example 1](https://assets.leetcode.com/uploads/2020/11/13/spiral1.jpg)
**Input:** matrix = [[1,2,3],[4,5,6],[7,8,9]]
**Output:** [1,2,3,6,9,8,7,4,5]

### **Example 2:**
![Spiral Matrix Example 2](https://assets.leetcode.com/uploads/2020/11/13/spiral.jpg)
**Input:** matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
**Output:** [1,2,3,4,8,12,11,10,9,5,6,7]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[i].length\`
- \`1 <= m, n <= 10\`
- \`-100 <= matrix[i][j] <= 100\``;
  await pool.query("UPDATE problems SET description = $1 WHERE slug = 'spiral-matrix'", [spiralDesc]);
  console.log('Updated spiral-matrix');

  // 4. Spiral Matrix II
  const spiralIIDesc = `Given a positive integer \`n\`, generate an \`n x n\` \`matrix\` filled with elements from \`1\` to \`n^2\` in spiral order.

### Example 1
![Spiral Matrix II Example 1](https://assets.leetcode.com/uploads/2020/11/13/spiraln.jpg)
\`\`\`
Input: n = 4
Output: [[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]]
\`\`\`

### Example 2
\`\`\`
Input: n = 2
Output: [[1,2],[4,3]]
\`\`\`

### Constraints
- \`1 <= n <= 20\``;
  await pool.query("UPDATE problems SET description = $1 WHERE slug = 'spiral-matrix-ii'", [spiralIIDesc]);
  console.log('Updated spiral-matrix-ii');

  // 5. Pascal's Triangle
  const pascalDesc = `Given an integer \`numRows\`, return the first \`numRows\` of **Pascal's triangle**.

In Pascal's triangle, each number is the sum of the two numbers directly above it.

![Pascal's Triangle](https://upload.wikimedia.org/wikipedia/commons/0/0d/PascalTriangleAnimated2.gif)

### Example 1
\`\`\`
Input: numRows = 5
Output: [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]
\`\`\`

### Example 2
\`\`\`
Input: numRows = 1
Output: [[1]]
\`\`\`

### Constraints
- \`1 <= numRows <= 30\``;
  await pool.query("UPDATE problems SET description = $1 WHERE slug = 'pascal-s-triangle'", [pascalDesc]);
  console.log('Updated pascal-s-triangle');

  // 6. Trapping Rain Water
  const trapDesc = `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### Example 1
![Elevation Map](https://assets.leetcode.com/uploads/2018/10/22/rainwatertrap.png)
\`\`\`
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.
\`\`\`

### Example 2
\`\`\`
Input: height = [4,2,0,3,2,5]
Output: 9
\`\`\`

### Constraints
- \`n == height.length\`
- \`1 <= n <= 2 * 10⁴\`
- \`0 <= height[i] <= 10⁵\``;
  await pool.query("UPDATE problems SET description = $1 WHERE slug = 'trapping-rain-water'", [trapDesc]);
  console.log('Updated trapping-rain-water');

  console.log('SUCCESS: All 6 problems updated with official LeetCode images!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
