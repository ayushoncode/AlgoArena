'use strict';

/**
 * Canonical specifications for Trees & Linked Lists problems.
 */
module.exports = [
  // ── Trees ────────────────────────────────────────────────────────
  {
    title: 'Balanced Binary Tree',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given a binary tree, determine if it is **height-balanced**.

A **height-balanced** binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** true

### **Example 2:**
\`\`\`
            1
          /   \\
         2     2
        / \\
       3   3
      / \\
     4   4
\`\`\`
**Input:** root = [1,2,2,3,3,null,null,4,4]
**Output:** false

### **Example 3:**
**Input:** root = []
**Output:** true

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-10⁴ <= Node.val <= 10⁴\``,
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: 'true',
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: 'true', is_hidden: false },
      { input: '[1,2,2,3,3,null,null,4,4]', output: 'false', is_hidden: false },
      { input: '[]', output: 'true', is_hidden: false },
      { input: '[1,2,3,4,5,6,null,8]', output: 'true', is_hidden: true },
    ],
    solutions: {
      js: `function solution(root) {
        function height(node) {
          if (!node) return 0;
          const left = height(node.left);
          if (left === -1) return -1;
          const right = height(node.right);
          if (right === -1) return -1;
          if (Math.abs(left - right) > 1) return -1;
          return 1 + Math.max(left, right);
        }
        return height(root) !== -1;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> bool:
        def height(node):
            if not node: return 0
            l = height(node.left)
            if l == -1: return -1
            r = height(node.right)
            if r == -1: return -1
            if abs(l - r) > 1: return -1
            return 1 + max(l, r)
        return height(root) != -1`,
      java: `class Solution {
        public boolean solution(Runner.TreeNode root) {
          return height(root) != -1;
        }
        private int height(Runner.TreeNode node) {
          if (node == null) return 0;
          int l = height(node.left);
          if (l == -1) return -1;
          int r = height(node.right);
          if (r == -1) return -1;
          if (Math.abs(l - r) > 1) return -1;
          return 1 + Math.max(l, r);
        }
      }`,
      cpp: `class Solution {
      public:
        int height(TreeNode* node) {
          if (!node) return 0;
          int l = height(node->left);
          if (l == -1) return -1;
          int r = height(node->right);
          if (r == -1) return -1;
          if (abs(l - r) > 1) return -1;
          return 1 + max(l, r);
        }
        bool solution(TreeNode* root) {
          return height(root) != -1;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Inorder Traversal',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the \`root\` of a binary tree, return *the inorder traversal of its nodes' values*.

### **Example 1:**
\`\`\`
    1
     \\
      2
     /
    3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [1,3,2]

### **Example 2:**
**Input:** root = [1,2,3,4,5,null,8,null,null,6,7,9]
**Output:** [4,2,6,5,7,1,3,9,8]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
    sample_input: '[1,null,2,3]',
    sample_output: '[1,3,2]',
    test_cases: [
      { input: '[1,null,2,3]', output: '[1,3,2]', is_hidden: false },
      { input: '[1,2,3,4,5,null,8,null,null,6,7,9]', output: '[4,2,6,5,7,1,3,9,8]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: true },
    ],
    solutions: {
      js: `function solution(root) {
        const res = [];
        function inorder(node) {
          if (!node) return;
          inorder(node.left);
          res.push(node.val);
          inorder(node.right);
        }
        inorder(root);
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def inorder(node):
            if not node: return
            inorder(node.left)
            res.append(node.val)
            inorder(node.right)
        inorder(root)
        return res`,
      java: `class Solution {
        public List<Integer> solution(Runner.TreeNode root) {
          List<Integer> res = new ArrayList<>();
          inorder(root, res);
          return res;
        }
        private void inorder(Runner.TreeNode node, List<Integer> res) {
          if (node == null) return;
          inorder(node.left, res);
          res.add(node.val);
          inorder(node.right, res);
        }
      }`,
      cpp: `class Solution {
      public:
        void inorder(TreeNode* node, vector<int>& res) {
          if (!node) return;
          inorder(node->left, res);
          res.push_back(node->val);
          inorder(node->right, res);
        }
        vector<int> solution(TreeNode* root) {
          vector<int> res;
          inorder(root, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Level Order Traversal',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given the \`root\` of a binary tree, return *the level order traversal of its nodes' values*. (i.e., from left to right, level by level).

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[3],[9,20],[15,7]]

### **Example 2:**
**Input:** root = [1]
**Output:** [[1]]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``,
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '[[3],[9,20],[15,7]]',
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', is_hidden: false },
      { input: '[1]', output: '[[1]]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
    ],
    solutions: {
      js: `function solution(root) {
        if (!root) return [];
        const res = [], q = [root];
        while (q.length > 0) {
          const len = q.length, level = [];
          for (let i = 0; i < len; i++) {
            const node = q.shift();
            level.push(node.val);
            if (node.left) q.push(node.left);
            if (node.right) q.push(node.right);
          }
          res.push(level);
        }
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root: return []
        res, q = [], [root]
        while q:
            level = []
            for _ in range(len(q)):
                node = q.pop(0)
                level.append(node.val)
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
            res.append(level)
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(Runner.TreeNode root) {
          List<List<Integer>> res = new ArrayList<>();
          if (root == null) return res;
          Queue<Runner.TreeNode> q = new LinkedList<>();
          q.add(root);
          while (!q.isEmpty()) {
            int len = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < len; i++) {
              Runner.TreeNode node = q.poll();
              level.add(node.val);
              if (node.left != null) q.add(node.left);
              if (node.right != null) q.add(node.right);
            }
            res.add(level);
          }
          return res;
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(TreeNode* root) {
          vector<vector<int>> res;
          if (!root) return res;
          queue<TreeNode*> q;
          q.push(root);
          while (!q.empty()) {
            int len = q.size();
            vector<int> level;
            for (int i = 0; i < len; i++) {
              TreeNode* node = q.front();
              q.pop();
              level.push_back(node->val);
              if (node->left) q.push(node->left);
              if (node->right) q.push(node->right);
            }
            res.push_back(level);
          }
          return res;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Level Order Traversal II',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given the \`root\` of a binary tree, return *the bottom-up level order traversal of its nodes' values*. (i.e., from left to right, level by level from leaf to root).

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[15,7],[9,20],[3]]

### **Example 2:**
**Input:** root = [1]
**Output:** [[1]]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``,
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '[[15,7],[9,20],[3]]',
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: '[[15,7],[9,20],[3]]', is_hidden: false },
      { input: '[1]', output: '[[1]]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
    ],
    solutions: {
      js: `function solution(root) {
        if (!root) return [];
        const res = [], q = [root];
        while (q.length > 0) {
          const len = q.length, level = [];
          for (let i = 0; i < len; i++) {
            const node = q.shift();
            level.push(node.val);
            if (node.left) q.push(node.left);
            if (node.right) q.push(node.right);
          }
          res.unshift(level);
        }
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root: return []
        res, q = [], [root]
        while q:
            level = []
            for _ in range(len(q)):
                node = q.pop(0)
                level.append(node.val)
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
            res.insert(0, level)
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(Runner.TreeNode root) {
          List<List<Integer>> res = new ArrayList<>();
          if (root == null) return res;
          Queue<Runner.TreeNode> q = new LinkedList<>();
          q.add(root);
          while (!q.isEmpty()) {
            int len = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < len; i++) {
              Runner.TreeNode node = q.poll();
              level.add(node.val);
              if (node.left != null) q.add(node.left);
              if (node.right != null) q.add(node.right);
            }
            res.add(0, level);
          }
          return res;
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(TreeNode* root) {
          vector<vector<int>> res;
          if (!root) return res;
          queue<TreeNode*> q;
          q.push(root);
          while (!q.empty()) {
            int len = q.size();
            vector<int> level;
            for (int i = 0; i < len; i++) {
              TreeNode* node = q.front();
              q.pop();
              level.push_back(node->val);
              if (node->left) q.push(node->left);
              if (node->right) q.push(node->right);
            }
            res.insert(res.begin(), level);
          }
          return res;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Maximum Path Sum',
    topic: 'trees',
    difficulty: 'hard',
    description: `A **path** in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. A node can only appear in the sequence **at most once**. Note that the path does not need to pass through the root.

The **path sum** of a path is the sum of the node's values in the path.

Given the \`root\` of a binary tree, return *the maximum **path sum** of any non-empty path*.

### **Example 1:**
\`\`\`
       1
      / \\
     2   3
\`\`\`
**Input:** root = [1,2,3]
**Output:** 6
**Explanation:** The optimal path is 2 -> 1 -> 3 with a path sum of 2 + 1 + 3 = 6.

### **Example 2:**
\`\`\`
      -10
      /  \\
     9   20
        /  \\
       15   7
\`\`\`
**Input:** root = [-10,9,20,null,null,15,7]
**Output:** 42
**Explanation:** The optimal path is 15 -> 20 -> 7 with a path sum of 15 + 20 + 7 = 42.

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 3 * 10⁴]\`.
- \`-1000 <= Node.val <= 1000\``,
    sample_input: '[1,2,3]',
    sample_output: '6',
    test_cases: [
      { input: '[1,2,3]', output: '6', is_hidden: false },
      { input: '[-10,9,20,null,null,15,7]', output: '42', is_hidden: false },
      { input: '[-3]', output: '-3', is_hidden: false },
      { input: '[2,-1]', output: '2', is_hidden: true },
      { input: '[-2,1]', output: '1', is_hidden: true }
    ],
    solutions: {
      js: `function solution(root) {
        let maxPath = -Infinity;
        function helper(node) {
          if (!node) return 0;
          const left = Math.max(0, helper(node.left));
          const right = Math.max(0, helper(node.right));
          maxPath = Math.max(maxPath, left + right + node.val);
          return node.val + Math.max(left, right);
        }
        helper(root);
        return maxPath;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> int:
        max_sum = float('-inf')
        def helper(node):
            nonlocal max_sum
            if not node: return 0
            left = max(0, helper(node.left))
            right = max(0, helper(node.right))
            max_sum = max(max_sum, left + right + node.val)
            return node.val + max(left, right)
        helper(root)
        return max_sum`,
      java: `class Solution {
        private int maxPath = Integer.MIN_VALUE;
        public int solution(Runner.TreeNode root) {
          maxPath = Integer.MIN_VALUE;
          helper(root);
          return maxPath;
        }
        private int helper(Runner.TreeNode node) {
          if (node == null) return 0;
          int left = Math.max(0, helper(node.left));
          int right = Math.max(0, helper(node.right));
          maxPath = Math.max(maxPath, left + right + node.val);
          return node.val + Math.max(left, right);
        }
      }`,
      cpp: `class Solution {
      public:
        int maxPath = INT_MIN;
        int helper(TreeNode* node) {
          if (!node) return 0;
          int left = max(0, helper(node->left));
          int right = max(0, helper(node->right));
          maxPath = max(maxPath, left + right + node->val);
          return node->val + max(left, right);
        }
        int solution(TreeNode* root) {
          maxPath = INT_MIN;
          helper(root);
          return maxPath;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Postorder Traversal',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the \`root\` of a binary tree, return *the postorder traversal of its nodes' values*.

### **Example 1:**
\`\`\`
    1
     \\
      2
     /
    3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [3,2,1]

### **Example 2:**
**Input:** root = [1,2,3,4,5,null,8,null,null,6,7,9]
**Output:** [4,6,7,5,2,9,8,3,1]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
    sample_input: '[1,null,2,3]',
    sample_output: '[3,2,1]',
    test_cases: [
      { input: '[1,null,2,3]', output: '[3,2,1]', is_hidden: false },
      { input: '[1,2,3,4,5,null,8,null,null,6,7,9]', output: '[4,6,7,5,2,9,8,3,1]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: true },
    ],
    solutions: {
      js: `function solution(root) {
        const res = [];
        function postorder(node) {
          if (!node) return;
          postorder(node.left);
          postorder(node.right);
          res.push(node.val);
        }
        postorder(root);
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def postorder(node):
            if not node: return
            postorder(node.left)
            postorder(node.right)
            res.append(node.val)
        postorder(root)
        return res`,
      java: `class Solution {
        public List<Integer> solution(Runner.TreeNode root) {
          List<Integer> res = new ArrayList<>();
          postorder(root, res);
          return res;
        }
        private void postorder(Runner.TreeNode node, List<Integer> res) {
          if (node == null) return;
          postorder(node.left, res);
          postorder(node.right, res);
          res.add(node.val);
        }
      }`,
      cpp: `class Solution {
      public:
        void postorder(TreeNode* node, vector<int>& res) {
          if (!node) return;
          postorder(node->left, res);
          postorder(node->right, res);
          res.push_back(node->val);
        }
        vector<int> solution(TreeNode* root) {
          vector<int> res;
          postorder(root, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Preorder Traversal',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the \`root\` of a binary tree, return *the preorder traversal of its nodes' values*.

### **Example 1:**
\`\`\`
    1
     \\
      2
     /
    3
\`\`\`
**Input:** root = [1,null,2,3]
**Output:** [1,2,3]

### **Example 2:**
**Input:** root = [1,2,3,4,5,null,8,null,null,6,7,9]
**Output:** [1,2,4,5,6,7,3,8,9]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 100]\`.
- \`-100 <= Node.val <= 100\``,
    sample_input: '[1,null,2,3]',
    sample_output: '[1,2,3]',
    test_cases: [
      { input: '[1,null,2,3]', output: '[1,2,3]', is_hidden: false },
      { input: '[1,2,3,4,5,null,8,null,null,6,7,9]', output: '[1,2,4,5,6,7,3,8,9]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: true },
    ],
    solutions: {
      js: `function solution(root) {
        const res = [];
        function preorder(node) {
          if (!node) return;
          res.push(node.val);
          preorder(node.left);
          preorder(node.right);
        }
        preorder(root);
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def preorder(node):
            if not node: return
            res.append(node.val)
            preorder(node.left)
            preorder(node.right)
        preorder(root)
        return res`,
      java: `class Solution {
        public List<Integer> solution(Runner.TreeNode root) {
          List<Integer> res = new ArrayList<>();
          preorder(root, res);
          return res;
        }
        private void preorder(Runner.TreeNode node, List<Integer> res) {
          if (node == null) return;
          res.add(node.val);
          preorder(node.left, res);
          preorder(node.right, res);
        }
      }`,
      cpp: `class Solution {
      public:
        void preorder(TreeNode* node, vector<int>& res) {
          if (!node) return;
          res.push_back(node->val);
          preorder(node->left, res);
          preorder(node->right, res);
        }
        vector<int> solution(TreeNode* root) {
          vector<int> res;
          preorder(root, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Binary Tree Zigzag Level Order Traversal',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given the \`root\` of a binary tree, return *the zigzag level order traversal of its nodes' values*. (i.e., from left to right, then right to left for the next level and alternate between).

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** [[3],[20,9],[15,7]]

### **Example 2:**
**Input:** root = [1]
**Output:** [[1]]

### **Example 3:**
**Input:** root = []
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 2000]\`.
- \`-1000 <= Node.val <= 1000\``,
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '[[3],[20,9],[15,7]]',
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: '[[3],[20,9],[15,7]]', is_hidden: false },
      { input: '[1]', output: '[[1]]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
    ],
    solutions: {
      js: `function solution(root) {
        if (!root) return [];
        const res = [], q = [root];
        let ltr = true;
        while (q.length > 0) {
          const len = q.length, level = [];
          for (let i = 0; i < len; i++) {
            const node = q.shift();
            if (ltr) level.push(node.val);
            else level.unshift(node.val);
            if (node.left) q.push(node.left);
            if (node.right) q.push(node.right);
          }
          res.push(level);
          ltr = !ltr;
        }
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root: return []
        res, q, ltr = [], [root], True
        while q:
            level = []
            for _ in range(len(q)):
                node = q.pop(0)
                if ltr: level.append(node.val)
                else: level.insert(0, node.val)
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
            res.append(level)
            ltr = not ltr
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(Runner.TreeNode root) {
          List<List<Integer>> res = new ArrayList<>();
          if (root == null) return res;
          Queue<Runner.TreeNode> q = new LinkedList<>();
          q.add(root);
          boolean ltr = true;
          while (!q.isEmpty()) {
            int len = q.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < len; i++) {
              Runner.TreeNode node = q.poll();
              if (ltr) level.add(node.val);
              else level.add(0, node.val);
              if (node.left != null) q.add(node.left);
              if (node.right != null) q.add(node.right);
            }
            res.add(level);
            ltr = !ltr;
          }
          return res;
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(TreeNode* root) {
          vector<vector<int>> res;
          if (!root) return res;
          queue<TreeNode*> q;
          q.push(root);
          bool ltr = true;
          while (!q.empty()) {
            int len = q.size();
            vector<int> level(len);
            for (int i = 0; i < len; i++) {
              TreeNode* node = q.front();
              q.pop();
              int index = ltr ? i : (len - 1 - i);
              level[index] = node->val;
              if (node->left) q.push(node->left);
              if (node->right) q.push(node->right);
            }
            res.push_back(level);
            ltr = !ltr;
          }
          return res;
        }
      };`
    }
  },

  {
    title: 'Construct Binary Tree from Inorder and Postorder Traversal',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given two integer arrays \`inorder\` and \`postorder\` where \`inorder\` is the inorder traversal of a binary tree and \`postorder\` is the postorder traversal of the same tree, construct and return *the binary tree*.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** inorder = [9,3,15,20,7], postorder = [9,15,7,20,3]
**Output:** [3,9,20,null,null,15,7]

### **Example 2:**
**Input:** inorder = [-1], postorder = [-1]
**Output:** [-1]

### **Constraints:**
- \`1 <= inorder.length <= 3000\`
- \`postorder.length == inorder.length\`
- \`-3000 <= inorder[i], postorder[i] <= 3000\`
- \`inorder\` and \`postorder\` consist of **unique** values.
- Each value of \`postorder\` also appears in \`inorder\`.
- \`inorder\` is **guaranteed** to be the inorder traversal of the tree.
- \`postorder\` is **guaranteed** to be the postorder traversal of the tree.`,
    sample_input: '[9,3,15,20,7], [9,15,7,20,3]',
    sample_output: '[3,9,20,null,null,15,7]',
    test_cases: [
      { input: '[9,3,15,20,7], [9,15,7,20,3]', output: '[3,9,20,null,null,15,7]', is_hidden: false },
      { input: '[-1], [-1]', output: '[-1]', is_hidden: false },
      { input: '[2,1], [2,1]', output: '[1,2]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(inorder, postorder) {
        const map = new Map();
        inorder.forEach((v, i) => map.set(v, i));
        let postIdx = postorder.length - 1;
        function build(l, r) {
          if (l > r) return null;
          const val = postorder[postIdx--];
          const root = new TreeNode(val);
          const mid = map.get(val);
          root.right = build(mid + 1, r);
          root.left = build(l, mid - 1);
          return root;
        }
        return build(0, inorder.length - 1);
      }`,
      py: `class Solution:
    def solution(self, inorder: List[int], postorder: List[int]) -> Optional[TreeNode]:
        idx_map = {val: i for i, val in enumerate(inorder)}
        post_idx = len(postorder) - 1
        def helper(l, r):
            nonlocal post_idx
            if l > r: return None
            val = postorder[post_idx]
            post_idx -= 1
            root = TreeNode(val)
            mid = idx_map[val]
            root.right = helper(mid + 1, r)
            root.left = helper(l, mid - 1)
            return root
        return helper(0, len(inorder) - 1)`,
      java: `class Solution {
        private int postIdx;
        private Map<Integer, Integer> map = new HashMap<>();
        public Runner.TreeNode solution(int[] inorder, int[] postorder) {
          map.clear();
          for (int i = 0; i < inorder.length; i++) map.put(inorder[i], i);
          postIdx = postorder.length - 1;
          return build(inorder, postorder, 0, inorder.length - 1);
        }
        private Runner.TreeNode build(int[] inorder, int[] postorder, int l, int r) {
          if (l > r) return null;
          int val = postorder[postIdx--];
          Runner.TreeNode root = new Runner.TreeNode(val);
          int mid = map.get(val);
          root.right = build(inorder, postorder, mid + 1, r);
          root.left = build(inorder, postorder, l, mid - 1);
          return root;
        }
      }`,
      cpp: `class Solution {
      public:
        unordered_map<int, int> map;
        int postIdx;
        TreeNode* build(vector<int>& inorder, vector<int>& postorder, int l, int r) {
          if (l > r) return nullptr;
          int val = postorder[postIdx--];
          TreeNode* root = new TreeNode(val);
          int mid = map[val];
          root->right = build(inorder, postorder, mid + 1, r);
          root->left = build(inorder, postorder, l, mid - 1);
          return root;
        }
        TreeNode* solution(vector<int>& inorder, vector<int>& postorder) {
          map.clear();
          for (int i = 0; i < inorder.size(); i++) map[inorder[i]] = i;
          postIdx = postorder.size() - 1;
          return build(inorder, postorder, 0, inorder.size() - 1);
        }
      };`
    }
  },

  {
    title: 'Construct Binary Tree from Preorder and Inorder Traversal',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given two integer arrays \`preorder\` and \`inorder\` where \`preorder\` is the preorder traversal of a binary tree and \`inorder\` is the inorder traversal of the same tree, construct and return *the binary tree*.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]
**Output:** [3,9,20,null,null,15,7]

### **Example 2:**
**Input:** preorder = [-1], inorder = [-1]
**Output:** [-1]

### **Constraints:**
- \`1 <= preorder.length <= 3000\`
- \`inorder.length == preorder.length\`
- \`-3000 <= preorder[i], inorder[i] <= 3000\`
- \`preorder\` and \`inorder\` consist of **unique** values.
- Each value of \`inorder\` also appears in \`preorder\`.
- \`preorder\` is **guaranteed** to be the preorder traversal of the tree.
- \`inorder\` is **guaranteed** to be the inorder traversal of the tree.`,
    sample_input: '[3,9,20,15,7], [9,3,15,20,7]',
    sample_output: '[3,9,20,null,null,15,7]',
    test_cases: [
      { input: '[3,9,20,15,7], [9,3,15,20,7]', output: '[3,9,20,null,null,15,7]', is_hidden: false },
      { input: '[-1], [-1]', output: '[-1]', is_hidden: false },
      { input: '[1,2], [2,1]', output: '[1,2]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(preorder, inorder) {
        const map = new Map();
        inorder.forEach((v, i) => map.set(v, i));
        let preIdx = 0;
        function build(l, r) {
          if (l > r) return null;
          const val = preorder[preIdx++];
          const root = new TreeNode(val);
          const mid = map.get(val);
          root.left = build(l, mid - 1);
          root.right = build(mid + 1, r);
          return root;
        }
        return build(0, inorder.length - 1);
      }`,
      py: `class Solution:
    def solution(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
        idx_map = {val: i for i, val in enumerate(inorder)}
        pre_idx = 0
        def helper(l, r):
            nonlocal pre_idx
            if l > r: return None
            val = preorder[pre_idx]
            pre_idx += 1
            root = TreeNode(val)
            mid = idx_map[val]
            root.left = helper(l, mid - 1)
            root.right = helper(mid + 1, r)
            return root
        return helper(0, len(inorder) - 1)`,
      java: `class Solution {
        private int preIdx = 0;
        private Map<Integer, Integer> map = new HashMap<>();
        public Runner.TreeNode solution(int[] preorder, int[] inorder) {
          map.clear();
          for (int i = 0; i < inorder.length; i++) map.put(inorder[i], i);
          preIdx = 0;
          return build(preorder, inorder, 0, inorder.length - 1);
        }
        private Runner.TreeNode build(int[] preorder, int[] inorder, int l, int r) {
          if (l > r) return null;
          int val = preorder[preIdx++];
          Runner.TreeNode root = new Runner.TreeNode(val);
          int mid = map.get(val);
          root.left = build(preorder, inorder, l, mid - 1);
          root.right = build(preorder, inorder, mid + 1, r);
          return root;
        }
      }`,
      cpp: `class Solution {
      public:
        unordered_map<int, int> map;
        int preIdx = 0;
        TreeNode* build(vector<int>& preorder, vector<int>& inorder, int l, int r) {
          if (l > r) return nullptr;
          int val = preorder[preIdx++];
          TreeNode* root = new TreeNode(val);
          int mid = map[val];
          root->left = build(preorder, inorder, l, mid - 1);
          root->right = build(preorder, inorder, mid + 1, r);
          return root;
        }
        TreeNode* solution(vector<int>& preorder, vector<int>& inorder) {
          map.clear();
          for (int i = 0; i < inorder.size(); i++) map[inorder[i]] = i;
          preIdx = 0;
          return build(preorder, inorder, 0, inorder.size() - 1);
        }
      };`
    }
  },

  {
    title: 'Convert Sorted Array to Binary Search Tree',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given an integer array \`nums\` where the elements are sorted in **ascending order**, convert *it to a **height-balanced** binary search tree*.

### **Example 1:**
\`\`\`
          0
        /   \\
      -3     9
      /     /
    -10    5
\`\`\`
**Input:** nums = [-10,-3,0,5,9]
**Output:** [0,-3,9,-10,null,5]
**Explanation:** [0,-10,5,null,-3,null,9] is also accepted.

### **Example 2:**
\`\`\`
     3
    /
   1
\`\`\`
**Input:** nums = [1,3]
**Output:** [3,1]
**Explanation:** [1,null,3] and [3,1] are both height-balanced BSTs.

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- \`nums\` is sorted in a **strictly increasing** order.`,
    sample_input: '[-10,-3,0,5,9]',
    sample_output: '[0,-3,9,-10,null,5]',
    test_cases: [
      { input: '[-10,-3,0,5,9]', output: '[0,-3,9,-10,null,5]', is_hidden: false },
      { input: '[1,3]', output: '[3,1]', is_hidden: false },
      { input: '[0]', output: '[0]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        function helper(l, r) {
          if (l > r) return null;
          const mid = Math.floor((l + r + 1) / 2);
          const node = new TreeNode(nums[mid]);
          node.left = helper(l, mid - 1);
          node.right = helper(mid + 1, r);
          return node;
        }
        return helper(0, nums.length - 1);
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> Optional[TreeNode]:
        def helper(l, r):
            if l > r: return None
            mid = (l + r + 1) // 2
            node = TreeNode(nums[mid])
            node.left = helper(l, mid - 1)
            node.right = helper(mid + 1, r)
            return node
        return helper(0, len(nums) - 1)`,
      java: `class Solution {
        public Runner.TreeNode solution(int[] nums) {
          return helper(nums, 0, nums.length - 1);
        }
        private Runner.TreeNode helper(int[] nums, int l, int r) {
          if (l > r) return null;
          int mid = (l + r + 1) / 2;
          Runner.TreeNode node = new Runner.TreeNode(nums[mid]);
          node.left = helper(nums, l, mid - 1);
          node.right = helper(nums, mid + 1, r);
          return node;
        }
      }`,
      cpp: `class Solution {
      public:
        TreeNode* helper(vector<int>& nums, int l, int r) {
          if (l > r) return nullptr;
          int mid = (l + r + 1) / 2;
          TreeNode* node = new TreeNode(nums[mid]);
          node->left = helper(nums, l, mid - 1);
          node->right = helper(nums, mid + 1, r);
          return node;
        }
        TreeNode* solution(vector<int>& nums) {
          return helper(nums, 0, nums.size() - 1);
        }
      };`
    }
  },

  {
    title: 'Convert Sorted List to Binary Search Tree',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a singly linked list where elements are sorted in **ascending order**, convert it to a **height-balanced** binary search tree.

### **Example 1:**
\`\`\`
          0
        /   \\
      -3     9
      /     /
    -10    5
\`\`\`
**Input:** head = [-10,-3,0,5,9]
**Output:** [0,-3,9,-10,null,5]

### **Example 2:**
**Input:** head = []
**Output:** []

### **Constraints:**
- The number of nodes in \`head\` is in the range \`[0, 2 * 10⁴]\`.
- \`-10⁵ <= Node.val <= 10⁵\``,
    sample_input: '[-10,-3,0,5,9]',
    sample_output: '[0,-3,9,-10,null,5]',
    test_cases: [
      { input: '[-10,-3,0,5,9]', output: '[0,-3,9,-10,null,5]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[0]', output: '[0]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        const nums = [];
        let curr = head;
        while (curr) { nums.push(curr.val); curr = curr.next; }
        function helper(l, r) {
          if (l > r) return null;
          const mid = Math.floor((l + r + 1) / 2);
          const node = new TreeNode(nums[mid]);
          node.left = helper(l, mid - 1);
          node.right = helper(mid + 1, r);
          return node;
        }
        return helper(0, nums.length - 1);
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[TreeNode]:
        nums = []
        curr = head
        while curr:
            nums.append(curr.val)
            curr = curr.next
        def helper(l, r):
            if l > r: return None
            mid = (l + r + 1) // 2
            node = TreeNode(nums[mid])
            node.left = helper(l, mid - 1)
            node.right = helper(mid + 1, r)
            return node
        return helper(0, len(nums) - 1)`,
      java: `class Solution {
        public Runner.TreeNode solution(Runner.ListNode head) {
          List<Integer> nums = new ArrayList<>();
          Runner.ListNode curr = head;
          while (curr != null) {
            nums.add(curr.val);
            curr = curr.next;
          }
          return helper(nums, 0, nums.size() - 1);
        }
        private Runner.TreeNode helper(List<Integer> nums, int l, int r) {
          if (l > r) return null;
          int mid = (l + r + 1) / 2;
          Runner.TreeNode node = new Runner.TreeNode(nums.get(mid));
          node.left = helper(nums, l, mid - 1);
          node.right = helper(nums, mid + 1, r);
          return node;
        }
      }`,
      cpp: `class Solution {
      public:
        TreeNode* helper(vector<int>& nums, int l, int r) {
          if (l > r) return nullptr;
          int mid = (l + r + 1) / 2;
          TreeNode* node = new TreeNode(nums[mid]);
          node->left = helper(nums, l, mid - 1);
          node->right = helper(nums, mid + 1, r);
          return node;
        }
        TreeNode* solution(ListNode* head) {
          vector<int> nums;
          ListNode* curr = head;
          while (curr) {
            nums.push_back(curr->val);
            curr = curr->next;
          }
          return helper(nums, 0, (int)nums.size() - 1);
        }
      };`
    }
  },

  {
    title: 'Lowest Common Ancestor of BST',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes \`p\` and \`q\` in the BST.

According to the **definition of LCA on Wikipedia**: "The lowest common ancestor is defined between two nodes \`p\` and \`q\` as the lowest node in \`T\` that has both \`p\` and \`q\` as descendants (where we allow **a node to be a descendant of itself**)."

### **Example 1:**
\`\`\`
        6
      /   \\
     2     8
    / \\   / \\
   0   4 7   9
      / \\
     3   5
\`\`\`
**Input:** root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8
**Output:** 6
**Explanation:** The LCA of nodes 2 and 8 is 6.

### **Example 2:**
**Input:** root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4
**Output:** 2
**Explanation:** The LCA of nodes 2 and 4 is 2, since a node can be a descendant of itself according to the LCA definition.

### **Example 3:**
**Input:** root = [2,1], p = 2, q = 1
**Output:** 2

### **Constraints:**
- The number of nodes in the tree is in the range \`[2, 10⁵]\`.
- \`-10⁹ <= Node.val <= 10⁹\`
- All \`Node.val\` are **unique**.
- \`p != q\`
- \`p\` and \`q\` will exist in the BST.`,
    sample_input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 8',
    sample_output: '6',
    test_cases: [
      { input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 8', output: '6', is_hidden: false },
      { input: '[6,2,8,0,4,7,9,null,null,3,5], 2, 4', output: '2', is_hidden: false },
      { input: '[2,1], 2, 1', output: '2', is_hidden: false },
      { input: '[6,2,8,0,4,7,9,null,null,3,5], 3, 5', output: '4', is_hidden: true }
    ],
    solutions: {
      js: `function solution(root, p, q) {
        const pVal = typeof p === 'object' && p ? p.val : p;
        const qVal = typeof q === 'object' && q ? q.val : q;
        let curr = root;
        while (curr) {
          if (pVal < curr.val && qVal < curr.val) curr = curr.left;
          else if (pVal > curr.val && qVal > curr.val) curr = curr.right;
          else return curr.val;
        }
        return null;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode], p: int, q: int) -> int:
        p_val = p.val if hasattr(p, 'val') else p
        q_val = q.val if hasattr(q, 'val') else q
        curr = root
        while curr:
            if p_val < curr.val and q_val < curr.val:
                curr = curr.left
            elif p_val > curr.val and q_val > curr.val:
                curr = curr.right
            else:
                return curr.val
        return 0`,
      java: `class Solution {
        public int solution(Runner.TreeNode root, int p, int q) {
          Runner.TreeNode curr = root;
          while (curr != null) {
            if (p < curr.val && q < curr.val) curr = curr.left;
            else if (p > curr.val && q > curr.val) curr = curr.right;
            else return curr.val;
          }
          return 0;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(TreeNode* root, int p, int q) {
          TreeNode* curr = root;
          while (curr) {
            if (p < curr->val && q < curr->val) curr = curr->left;
            else if (p > curr->val && q > curr->val) curr = curr->right;
            else return curr->val;
          }
          return 0;
        }
      };`
    }
  },

  {
    title: 'Maximum Depth of Binary Tree',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the \`root\` of a binary tree, return *its maximum depth*.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** 3

### **Example 2:**
**Input:** root = [1,null,2]
**Output:** 2

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 10⁴]\`.
- \`-100 <= Node.val <= 100\``,
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '3',
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: '3', is_hidden: false },
      { input: '[1,null,2]', output: '2', is_hidden: false },
      { input: '[]', output: '0', is_hidden: false },
    ],
    solutions: {
      js: `function solution(root) {
        if (!root) return 0;
        return 1 + Math.max(solution(root.left), solution(root.right));
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> int:
        if not root: return 0
        return 1 + max(self.solution(root.left), self.solution(root.right))`,
      java: `class Solution {
        public int solution(Runner.TreeNode root) {
          if (root == null) return 0;
          return 1 + Math.max(solution(root.left), solution(root.right));
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(TreeNode* root) {
          if (!root) return 0;
          return 1 + max(solution(root->left), solution(root->right));
        }
      };`
    }
  },

  {
    title: 'Minimum Depth of Binary Tree',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given a binary tree, find its minimum depth.

The **minimum depth** is the number of nodes along the shortest path from the root node down to the nearest leaf node.

**Note:** A leaf is a node with no children.

### **Example 1:**
\`\`\`
       3
      / \\
     9  20
        /  \\
       15   7
\`\`\`
**Input:** root = [3,9,20,null,null,15,7]
**Output:** 2

### **Example 2:**
**Input:** root = [2,null,3,null,4,null,5,null,6]
**Output:** 5

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 10⁵]\`.
- \`-1000 <= Node.val <= 1000\``,
    sample_input: '[3,9,20,null,null,15,7]',
    sample_output: '2',
    test_cases: [
      { input: '[3,9,20,null,null,15,7]', output: '2', is_hidden: false },
      { input: '[2,null,3,null,4,null,5,null,6]', output: '5', is_hidden: false },
      { input: '[]', output: '0', is_hidden: true },
    ],
    solutions: {
      js: `function solution(root) {
        if (!root) return 0;
        if (!root.left) return 1 + solution(root.right);
        if (!root.right) return 1 + solution(root.left);
        return 1 + Math.min(solution(root.left), solution(root.right));
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> int:
        if not root: return 0
        if not root.left: return 1 + self.solution(root.right)
        if not root.right: return 1 + self.solution(root.left)
        return 1 + min(self.solution(root.left), self.solution(root.right))`,
      java: `class Solution {
        public int solution(Runner.TreeNode root) {
          if (root == null) return 0;
          if (root.left == null) return 1 + solution(root.right);
          if (root.right == null) return 1 + solution(root.left);
          return 1 + Math.min(solution(root.left), solution(root.right));
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(TreeNode* root) {
          if (!root) return 0;
          if (!root->left) return 1 + solution(root->right);
          if (!root->right) return 1 + solution(root->left);
          return 1 + min(solution(root->left), solution(root->right));
        }
      };`
    }
  },

  {
    title: 'Path Sum',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return \`true\` if the tree has a **root-to-leaf** path such that adding up all the values along the path equals \`targetSum\`.

A **leaf** is a node with no children.

### **Example 1:**
\`\`\`
              5
             / \\
            4   8
           /   / \\
          11  13  4
         /  \\      \\
        7    2      1
\`\`\`
**Input:** root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22
**Output:** true
**Explanation:** The root-to-leaf path with targetSum is: 5 -> 4 -> 11 -> 2 = 22.

### **Example 2:**
\`\`\`
       1
      / \\
     2   3
\`\`\`
**Input:** root = [1,2,3], targetSum = 5
**Output:** false

### **Example 3:**
**Input:** root = [], targetSum = 0
**Output:** false

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-1000 <= Node.val <= 1000\`
- \`-1000 <= targetSum <= 1000\``,
    sample_input: '[5,4,8,11,null,13,4,7,2,null,null,null,1], 22',
    sample_output: 'true',
    test_cases: [
      { input: '[5,4,8,11,null,13,4,7,2,null,null,null,1], 22', output: 'true', is_hidden: false },
      { input: '[1,2,3], 5', output: 'false', is_hidden: false },
      { input: '[], 0', output: 'false', is_hidden: false },
      { input: '[1,2], 1', output: 'false', is_hidden: true }
    ],
    solutions: {
      js: `function solution(root, targetSum) {
        if (!root) return false;
        if (!root.left && !root.right) return targetSum === root.val;
        return solution(root.left, targetSum - root.val) || solution(root.right, targetSum - root.val);
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if not root: return False
        if not root.left and not root.right:
            return targetSum == root.val
        return self.solution(root.left, targetSum - root.val) or self.solution(root.right, targetSum - root.val)`,
      java: `class Solution {
        public boolean solution(Runner.TreeNode root, int targetSum) {
          if (root == null) return false;
          if (root.left == null && root.right == null) return targetSum == root.val;
          return solution(root.left, targetSum - root.val) || solution(root.right, targetSum - root.val);
        }
      }`,
      cpp: `class Solution {
      public:
        bool solution(TreeNode* root, int targetSum) {
          if (!root) return false;
          if (!root->left && !root->right) return targetSum == root->val;
          return solution(root->left, targetSum - root->val) || solution(root->right, targetSum - root->val);
        }
      };`
    }
  },

  {
    title: 'Path Sum II',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given the \`root\` of a binary tree and an integer \`targetSum\`, return *all **root-to-leaf** paths where the sum of the node values in the path equals* \`targetSum\`. Each path should be returned as a list of the node **values**, not node references.

A **root-to-leaf** path is a path starting from the root and ending at any leaf node. A **leaf** is a node with no children.

### **Example 1:**
\`\`\`
              5
             / \\
            4   8
           /   / \\
          11  13  4
         /  \\    / \\
        7    2  5   1
\`\`\`
**Input:** root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22
**Output:** [[5,4,11,2],[5,8,4,5]]

### **Example 2:**
**Input:** root = [1,2,3], targetSum = 5
**Output:** []

### **Example 3:**
**Input:** root = [1,2], targetSum = 0
**Output:** []

### **Constraints:**
- The number of nodes in the tree is in the range \`[0, 5000]\`.
- \`-1000 <= Node.val <= 1000\`
- \`-1000 <= targetSum <= 1000\``,
    sample_input: '[5,4,8,11,null,13,4,7,2,null,null,5,1], 22',
    sample_output: '[[5,4,11,2],[5,8,4,5]]',
    test_cases: [
      { input: '[5,4,8,11,null,13,4,7,2,null,null,5,1], 22', output: '[[5,4,11,2],[5,8,4,5]]', is_hidden: false },
      { input: '[1,2,3], 5', output: '[]', is_hidden: false },
      { input: '[1,2], 0', output: '[]', is_hidden: false },
    ],
    solutions: {
      js: `function solution(root, targetSum) {
        const res = [];
        function dfs(node, sum, path) {
          if (!node) return;
          path.push(node.val);
          if (!node.left && !node.right && sum === node.val) {
            res.push([...path]);
          } else {
            dfs(node.left, sum - node.val, path);
            dfs(node.right, sum - node.val, path);
          }
          path.pop();
        }
        dfs(root, targetSum, []);
        return res;
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode], targetSum: int) -> List[List[int]]:
        res = []
        def dfs(node, s, path):
            if not node: return
            path.append(node.val)
            if not node.left and not node.right and s == node.val:
                res.append(list(path))
            else:
                dfs(node.left, s - node.val, path)
                dfs(node.right, s - node.val, path)
            path.pop()
        dfs(root, targetSum, [])
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(Runner.TreeNode root, int targetSum) {
          List<List<Integer>> res = new ArrayList<>();
          dfs(root, targetSum, new ArrayList<>(), res);
          return res;
        }
        private void dfs(Runner.TreeNode node, int sum, List<Integer> path, List<List<Integer>> res) {
          if (node == null) return;
          path.add(node.val);
          if (node.left == null && node.right == null && sum == node.val) {
            res.add(new ArrayList<>(path));
          } else {
            dfs(node.left, sum - node.val, path, res);
            dfs(node.right, sum - node.val, path, res);
          }
          path.remove(path.size() - 1);
        }
      }`,
      cpp: `class Solution {
      public:
        void dfs(TreeNode* node, int sum, vector<int>& path, vector<vector<int>>& res) {
          if (!node) return;
          path.push_back(node->val);
          if (!node->left && !node->right && sum == node->val) {
            res.push_back(path);
          } else {
            dfs(node->left, sum - node->val, path, res);
            dfs(node->right, sum - node->val, path, res);
          }
          path.pop_back();
        }
        vector<vector<int>> solution(TreeNode* root, int targetSum) {
          vector<vector<int>> res;
          vector<int> path;
          dfs(root, targetSum, path, res);
          return res;
        }
      };`
    }
  },

  {
    title: 'Same Tree',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.

Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.

### **Example 1:**
\`\`\`
     1          1
    / \\        / \\
   2   3      2   3
\`\`\`
**Input:** p = [1,2,3], q = [1,2,3]
**Output:** true

### **Example 2:**
\`\`\`
     1          1
    /            \\
   2              2
\`\`\`
**Input:** p = [1,2], q = [1,null,2]
**Output:** false

### **Example 3:**
**Input:** p = [1,2,1], q = [1,1,2]
**Output:** false

### **Constraints:**
- The number of nodes in both trees is in the range \`[0, 100]\`.
- \`-10⁴ <= Node.val <= 10⁴\``,
    sample_input: '[1,2,3], [1,2,3]',
    sample_output: 'true',
    test_cases: [
      { input: '[1,2,3], [1,2,3]', output: 'true', is_hidden: false },
      { input: '[1,2], [1,null,2]', output: 'false', is_hidden: false },
      { input: '[1,2,1], [1,1,2]', output: 'false', is_hidden: false },
      { input: '[], []', output: 'true', is_hidden: true }
    ],
    solutions: {
      js: `function solution(p, q) {
        if (!p && !q) return true;
        if (!p || !q || p.val !== q.val) return false;
        return solution(p.left, q.left) && solution(p.right, q.right);
      }`,
      py: `class Solution:
    def solution(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        if not p and not q: return True
        if not p or not q or p.val != q.val: return False
        return self.solution(p.left, q.left) and self.solution(p.right, q.right)`,
      java: `class Solution {
        public boolean solution(Runner.TreeNode p, Runner.TreeNode q) {
          if (p == null && q == null) return true;
          if (p == null || q == null || p.val != q.val) return false;
          return solution(p.left, q.left) && solution(p.right, q.right);
        }
      }`,
      cpp: `class Solution {
      public:
        bool solution(TreeNode* p, TreeNode* q) {
          if (!p && !q) return true;
          if (!p || !q || p->val != q->val) return false;
          return solution(p->left, q->left) && solution(p->right, q->right);
        }
      };`
    }
  },

  {
    title: 'Sum Root to Leaf Numbers',
    topic: 'trees',
    difficulty: 'medium',
    description: `You are given the \`root\` of a binary tree containing digits from \`0\` to \`9\` only.

Each root-to-leaf path in the tree represents a number.
- For example, the root-to-leaf path \`1 -> 2 -> 3\` represents the number \`123\`.

Return *the total sum of all root-to-leaf numbers*. Test cases are generated so that the answer will fit in a **32-bit** integer.

A **leaf** node is a node with no children.

### **Example 1:**
\`\`\`
     1
    / \\
   2   3
\`\`\`
**Input:** root = [1,2,3]
**Output:** 25
**Explanation:**
The root-to-leaf path \`1->2\` represents the number 12.
The root-to-leaf path \`1->3\` represents the number 13.
Therefore, sum = 12 + 13 = 25.

### **Example 2:**
\`\`\`
        4
      /   \\
     9     0
    / \\
   5   1
\`\`\`
**Input:** root = [4,9,0,5,1]
**Output:** 1026
**Explanation:**
The root-to-leaf path \`4->9->5\` represents the number 495.
The root-to-leaf path \`4->9->1\` represents the number 491.
The root-to-leaf path \`4->0\` represents the number 40.
Therefore, sum = 495 + 491 + 40 = 1026.

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`0 <= Node.val <= 9\`
- The depth of the tree will not exceed \`10\`.`,
    sample_input: '[1,2,3]',
    sample_output: '25',
    test_cases: [
      { input: '[1,2,3]', output: '25', is_hidden: false },
      { input: '[4,9,0,5,1]', output: '1026', is_hidden: false },
      { input: '[0]', output: '0', is_hidden: true }
    ],
    solutions: {
      js: `function solution(root) {
        function dfs(node, curr) {
          if (!node) return 0;
          curr = curr * 10 + node.val;
          if (!node.left && !node.right) return curr;
          return dfs(node.left, curr) + dfs(node.right, curr);
        }
        return dfs(root, 0);
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> int:
        def dfs(node, curr):
            if not node: return 0
            curr = curr * 10 + node.val
            if not node.left and not node.right: return curr
            return dfs(node.left, curr) + dfs(node.right, curr)
        return dfs(root, 0)`,
      java: `class Solution {
        public int solution(Runner.TreeNode root) {
          return dfs(root, 0);
        }
        private int dfs(Runner.TreeNode node, int curr) {
          if (node == null) return 0;
          curr = curr * 10 + node.val;
          if (node.left == null && node.right == null) return curr;
          return dfs(node.left, curr) + dfs(node.right, curr);
        }
      }`,
      cpp: `class Solution {
      public:
        int dfs(TreeNode* node, int curr) {
          if (!node) return 0;
          curr = curr * 10 + node->val;
          if (!node->left && !node->right) return curr;
          return dfs(node->left, curr) + dfs(node->right, curr);
        }
        int solution(TreeNode* root) {
          return dfs(root, 0);
        }
      };`
    }
  },

  {
    title: 'Symmetric Tree',
    topic: 'trees',
    difficulty: 'easy',
    description: `Given the \`root\` of a binary tree, *check whether it is a mirror of itself* (i.e., symmetric around its center).

### **Example 1:**
\`\`\`
        1
      /   \\
     2     2
    / \\   / \\
   3   4 4   3
\`\`\`
**Input:** root = [1,2,2,3,4,4,3]
**Output:** true

### **Example 2:**
\`\`\`
        1
      /   \\
     2     2
      \\     \\
       3     3
\`\`\`
**Input:** root = [1,2,2,null,3,null,3]
**Output:** false

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 1000]\`.
- \`-100 <= Node.val <= 100\``,
    sample_input: '[1,2,2,3,4,4,3]',
    sample_output: 'true',
    test_cases: [
      { input: '[1,2,2,3,4,4,3]', output: 'true', is_hidden: false },
      { input: '[1,2,2,null,3,null,3]', output: 'false', is_hidden: false },
      { input: '[1]', output: 'true', is_hidden: true }
    ],
    solutions: {
      js: `function solution(root) {
        if (!root) return true;
        function isMirror(t1, t2) {
          if (!t1 && !t2) return true;
          if (!t1 || !t2 || t1.val !== t2.val) return false;
          return isMirror(t1.left, t2.right) && isMirror(t1.right, t2.left);
        }
        return isMirror(root.left, root.right);
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> bool:
        if not root: return True
        def is_mirror(t1, t2):
            if not t1 and not t2: return True
            if not t1 or not t2 or t1.val != t2.val: return False
            return is_mirror(t1.left, t2.right) and is_mirror(t1.right, t2.left)
        return is_mirror(root.left, root.right)`,
      java: `class Solution {
        public boolean solution(Runner.TreeNode root) {
          if (root == null) return true;
          return isMirror(root.left, root.right);
        }
        private boolean isMirror(Runner.TreeNode t1, Runner.TreeNode t2) {
          if (t1 == null && t2 == null) return true;
          if (t1 == null || t2 == null || t1.val != t2.val) return false;
          return isMirror(t1.left, t2.right) && isMirror(t1.right, t2.left);
        }
      }`,
      cpp: `class Solution {
      public:
        bool isMirror(TreeNode* t1, TreeNode* t2) {
          if (!t1 && !t2) return true;
          if (!t1 || !t2 || t1->val != t2->val) return false;
          return isMirror(t1->left, t2->right) && isMirror(t1->right, t2->left);
        }
        bool solution(TreeNode* root) {
          if (!root) return true;
          return isMirror(root->left, root->right);
        }
      };`
    }
  },

  {
    title: 'Unique Binary Search Trees',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given an integer \`n\`, return *the number of structurally unique **BST's** (binary search trees) which have exactly* \`n\` *nodes of unique values from* \`1\` *to* \`n\`.

### **Example 1:**
\`\`\`
  1         3     3      2      1
   \\       /     /      / \\      \\
    3     2     1      1   3      2
   /     /       \\                 \\
  2     1         2                 3
\`\`\`
**Input:** n = 3
**Output:** 5

### **Example 2:**
**Input:** n = 1
**Output:** 1

### **Constraints:**
- \`1 <= n <= 19\``,
    sample_input: '3',
    sample_output: '5',
    test_cases: [
      { input: '3', output: '5', is_hidden: false },
      { input: '1', output: '1', is_hidden: false },
      { input: '4', output: '14', is_hidden: false },
      { input: '5', output: '42', is_hidden: true }
    ],
    solutions: {
      js: `function solution(n) {
        const dp = new Array(n + 1).fill(0);
        dp[0] = 1;
        dp[1] = 1;
        for (let i = 2; i <= n; i++) {
          for (let j = 1; j <= i; j++) {
            dp[i] += dp[j - 1] * dp[i - j];
          }
        }
        return dp[n];
      }`,
      py: `class Solution:
    def solution(self, n: int) -> int:
        dp = [0] * (n + 1)
        dp[0] = 1
        dp[1] = 1
        for i in range(2, n + 1):
            for j in range(1, i + 1):
                dp[i] += dp[j - 1] * dp[i - j]
        return dp[n]`,
      java: `class Solution {
        public int solution(int n) {
          int[] dp = new int[n + 1];
          dp[0] = 1;
          dp[1] = 1;
          for (int i = 2; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
              dp[i] += dp[j - 1] * dp[i - j];
            }
          }
          return dp[n];
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(int n) {
          vector<int> dp(n + 1, 0);
          dp[0] = 1;
          dp[1] = 1;
          for (int i = 2; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
              dp[i] += dp[j - 1] * dp[i - j];
            }
          }
          return dp[n];
        }
      };`
    }
  },

  {
    title: 'Validate Binary Search Tree',
    topic: 'trees',
    difficulty: 'medium',
    description: `Given the \`root\` of a binary tree, *determine if it is a valid binary search tree (BST)*.

A **valid BST** is defined as follows:
- The left subtree of a node contains only nodes with keys **strictly less than** the node's key.
- The right subtree of a node contains only nodes with keys **strictly greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

### **Example 1:**
\`\`\`
     2
    / \\
   1   3
\`\`\`
**Input:** root = [2,1,3]
**Output:** true

### **Example 2:**
\`\`\`
       5
      / \\
     1   4
        / \\
       3   6
\`\`\`
**Input:** root = [5,1,4,null,null,3,6]
**Output:** false
**Explanation:** The root node's value is 5 but its right child's value is 4.

### **Constraints:**
- The number of nodes in the tree is in the range \`[1, 10⁴]\`.
- \`-2³¹ <= Node.val <= 2³¹ - 1\``,
    sample_input: '[2,1,3]',
    sample_output: 'true',
    test_cases: [
      { input: '[2,1,3]', output: 'true', is_hidden: false },
      { input: '[5,1,4,null,null,3,6]', output: 'false', is_hidden: false },
      { input: '[1]', output: 'true', is_hidden: false },
      { input: '[2,2,2]', output: 'false', is_hidden: true },
      { input: '[5,4,6,null,null,3,7]', output: 'false', is_hidden: true }
    ],
    solutions: {
      js: `function solution(root) {
        function validate(node, min, max) {
          if (!node) return true;
          if (node.val <= min || node.val >= max) return false;
          return validate(node.left, min, node.val) && validate(node.right, node.val, max);
        }
        return validate(root, -Infinity, Infinity);
      }`,
      py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> bool:
        def validate(node, low, high):
            if not node: return True
            if node.val <= low or node.val >= high: return False
            return validate(node.left, low, node.val) and validate(node.right, node.val, high)
        return validate(root, float('-inf'), float('inf'))`,
      java: `class Solution {
        public boolean solution(Runner.TreeNode root) {
          return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
        }
        private boolean validate(Runner.TreeNode node, long min, long max) {
          if (node == null) return true;
          if (node.val <= min || node.val >= max) return false;
          return validate(node.left, min, node.val) && validate(node.right, node.val, max);
        }
      }`,
      cpp: `class Solution {
      public:
        bool validate(TreeNode* node, long long minVal, long long maxVal) {
          if (!node) return true;
          if (node->val <= minVal || node->val >= maxVal) return false;
          return validate(node->left, minVal, node->val) && validate(node->right, node->val, maxVal);
        }
        bool solution(TreeNode* root) {
          return validate(root, LLONG_MIN, LLONG_MAX);
        }
      };`
    }
  },

  // ── Linked Lists ──────────────────────────────────────────────────
  {
    title: 'Add Two Numbers',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

### **Example 1:**
\`\`\`
  2 -> 4 -> 3
+ 5 -> 6 -> 4
-------------
  7 -> 0 -> 8
\`\`\`
**Input:** l1 = [2,4,3], l2 = [5,6,4]
**Output:** [7,0,8]
**Explanation:** 342 + 465 = 807.

### **Example 2:**
**Input:** l1 = [0], l2 = [0]
**Output:** [0]

### **Example 3:**
**Input:** l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
**Output:** [8,9,9,9,0,0,0,1]

### **Constraints:**
- The number of nodes in each linked list is in the range \`[1, 100]\`.
- \`0 <= Node.val <= 9\`
- It is guaranteed that the list represents a number that does not have leading zeros.`,
    sample_input: '[2,4,3], [5,6,4]',
    sample_output: '[7,0,8]',
    test_cases: [
      { input: '[2,4,3], [5,6,4]', output: '[7,0,8]', is_hidden: false },
      { input: '[0], [0]', output: '[0]', is_hidden: false },
      { input: '[9,9,9,9,9,9,9], [9,9,9,9]', output: '[8,9,9,9,0,0,0,1]', is_hidden: false },
      { input: '[2,4,9], [5,6,4,9]', output: '[7,0,4,0,1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(l1, l2) {
        const dummy = new ListNode(0);
        let curr = dummy, carry = 0;
        while (l1 || l2 || carry) {
          const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
          carry = Math.floor(sum / 10);
          curr.next = new ListNode(sum % 10);
          curr = curr.next;
          if (l1) l1 = l1.next;
          if (l2) l2 = l2.next;
        }
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr, carry = dummy, 0
        while l1 or l2 or carry:
            val = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry
            carry = val // 10
            curr.next = ListNode(val % 10)
            curr = curr.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode l1, Runner.ListNode l2) {
          Runner.ListNode dummy = new Runner.ListNode(0);
          Runner.ListNode curr = dummy;
          int carry = 0;
          while (l1 != null || l2 != null || carry != 0) {
            int sum = (l1 != null ? l1.val : 0) + (l2 != null ? l2.val : 0) + carry;
            carry = sum / 10;
            curr.next = new Runner.ListNode(sum % 10);
            curr = curr.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
          }
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* l1, ListNode* l2) {
          ListNode dummy(0);
          ListNode* curr = &dummy;
          int carry = 0;
          while (l1 || l2 || carry) {
            int sum = (l1 ? l1->val : 0) + (l2 ? l2->val : 0) + carry;
            carry = sum / 10;
            curr->next = new ListNode(sum % 10);
            curr = curr->next;
            if (l1) l1 = l1->next;
            if (l2) l2 = l2->next;
          }
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Merge Two Sorted Lists',
    topic: 'linked-lists',
    difficulty: 'easy',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.

### **Example 1:**
\`\`\`
1 -> 2 -> 4
1 -> 3 -> 4
-------------
1 -> 1 -> 2 -> 3 -> 4 -> 4
\`\`\`
**Input:** list1 = [1,2,4], list2 = [1,3,4]
**Output:** [1,1,2,3,4,4]

### **Example 2:**
**Input:** list1 = [], list2 = []
**Output:** []

### **Example 3:**
**Input:** list1 = [], list2 = [0]
**Output:** [0]

### **Constraints:**
- The number of nodes in both lists is in the range \`[0, 50]\`.
- \`-100 <= Node.val <= 100\`
- Both \`list1\` and \`list2\` are sorted in **non-decreasing** order.`,
    sample_input: '[1,2,4], [1,3,4]',
    sample_output: '[1,1,2,3,4,4]',
    test_cases: [
      { input: '[1,2,4], [1,3,4]', output: '[1,1,2,3,4,4]', is_hidden: false },
      { input: '[], []', output: '[]', is_hidden: false },
      { input: '[], [0]', output: '[0]', is_hidden: false },
      { input: '[5], [1,2,4]', output: '[1,2,4,5]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(list1, list2) {
        const dummy = new ListNode(0);
        let curr = dummy;
        while (list1 && list2) {
          if (list1.val <= list2.val) {
            curr.next = list1;
            list1 = list1.next;
          } else {
            curr.next = list2;
            list2 = list2.next;
          }
          curr = curr.next;
        }
        curr.next = list1 || list2;
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                curr.next = list1
                list1 = list1.next
            else:
                curr.next = list2
                list2 = list2.next
            curr = curr.next
        curr.next = list1 or list2
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode list1, Runner.ListNode list2) {
          Runner.ListNode dummy = new Runner.ListNode(0);
          Runner.ListNode curr = dummy;
          while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
              curr.next = list1;
              list1 = list1.next;
            } else {
              curr.next = list2;
              list2 = list2.next;
            }
            curr = curr.next;
          }
          curr.next = (list1 != null) ? list1 : list2;
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* list1, ListNode* list2) {
          ListNode dummy(0);
          ListNode* curr = &dummy;
          while (list1 && list2) {
            if (list1->val <= list2->val) {
              curr->next = list1;
              list1 = list1->next;
            } else {
              curr->next = list2;
              list2 = list2->next;
            }
            curr = curr->next;
          }
          curr->next = list1 ? list1 : list2;
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Reverse Linked List',
    topic: 'linked-lists',
    difficulty: 'easy',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return *the reversed list*.

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 4 -> 5
---------------------
5 -> 4 -> 3 -> 2 -> 1
\`\`\`
**Input:** head = [1,2,3,4,5]
**Output:** [5,4,3,2,1]

### **Example 2:**
\`\`\`
1 -> 2
------
2 -> 1
\`\`\`
**Input:** head = [1,2]
**Output:** [2,1]

### **Example 3:**
**Input:** head = []
**Output:** []

### **Constraints:**
- The number of nodes in the list is the range \`[0, 5000]\`.
- \`-5000 <= Node.val <= 5000\``,
    sample_input: '[1,2,3,4,5]',
    sample_output: '[5,4,3,2,1]',
    test_cases: [
      { input: '[1,2,3,4,5]', output: '[5,4,3,2,1]', is_hidden: false },
      { input: '[1,2]', output: '[2,1]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        let prev = null, curr = head;
        while (curr) {
          const next = curr.next;
          curr.next = prev;
          prev = curr;
          curr = next;
        }
        return prev;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, curr = None, head
        while curr:
            nxt = curr.next
            curr.next = prev
            prev = curr
            curr = nxt
        return prev`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head) {
          Runner.ListNode prev = null, curr = head;
          while (curr != null) {
            Runner.ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
          }
          return prev;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head) {
          ListNode* prev = nullptr;
          ListNode* curr = head;
          while (curr) {
            ListNode* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
          }
          return prev;
        }
      };`
    }
  },

  {
    title: 'Reverse Linked List II',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a singly linked list and two integers \`left\` and \`right\` where \`left <= right\`, reverse the nodes of the list from position \`left\` to position \`right\`, and return *the reversed list*.

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 4 -> 5, left = 2, right = 4
------------------------------------------
1 -> 4 -> 3 -> 2 -> 5
\`\`\`
**Input:** head = [1,2,3,4,5], left = 2, right = 4
**Output:** [1,4,3,2,5]

### **Example 2:**
**Input:** head = [5], left = 1, right = 1
**Output:** [5]

### **Constraints:**
- The number of nodes in the list is \`n\`.
- \`1 <= n <= 500\`
- \`-500 <= Node.val <= 500\`
- \`1 <= left <= right <= n\``,
    sample_input: '[1,2,3,4,5], 2, 4',
    sample_output: '[1,4,3,2,5]',
    test_cases: [
      { input: '[1,2,3,4,5], 2, 4', output: '[1,4,3,2,5]', is_hidden: false },
      { input: '[5], 1, 1', output: '[5]', is_hidden: false },
      { input: '[1,2,3], 1, 3', output: '[3,2,1]', is_hidden: false },
      { input: '[1,2,3,4], 2, 3', output: '[1,3,2,4]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head, left, right) {
        if (!head || left === right) return head;
        const dummy = new ListNode(0);
        dummy.next = head;
        let prev = dummy;
        for (let i = 1; i < left; i++) prev = prev.next;
        let curr = prev.next;
        for (let i = 0; i < right - left; i++) {
          const temp = curr.next;
          curr.next = temp.next;
          temp.next = prev.next;
          prev.next = temp;
        }
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:
        if not head or left == right: return head
        dummy = ListNode(0)
        dummy.next = head
        prev = dummy
        for _ in range(left - 1):
            prev = prev.next
        curr = prev.next
        for _ in range(right - left):
            temp = curr.next
            curr.next = temp.next
            temp.next = prev.next
            prev.next = temp
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head, int left, int right) {
          if (head == null || left == right) return head;
          Runner.ListNode dummy = new Runner.ListNode(0);
          dummy.next = head;
          Runner.ListNode prev = dummy;
          for (int i = 1; i < left; i++) prev = prev.next;
          Runner.ListNode curr = prev.next;
          for (int i = 0; i < right - left; i++) {
            Runner.ListNode temp = curr.next;
            curr.next = temp.next;
            temp.next = prev.next;
            prev.next = temp;
          }
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head, int left, int right) {
          if (!head || left == right) return head;
          ListNode dummy(0);
          dummy.next = head;
          ListNode* prev = &dummy;
          for (int i = 1; i < left; i++) prev = prev->next;
          ListNode* curr = prev->next;
          for (int i = 0; i < right - left; i++) {
            ListNode* temp = curr->next;
            curr->next = temp->next;
            temp->next = prev->next;
            prev->next = temp;
          }
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Remove Duplicates from Sorted List',
    topic: 'linked-lists',
    difficulty: 'easy',
    description: `Given the \`head\` of a sorted linked list, *delete all duplicates such that each element appears only once*. Return *the linked list **sorted** as well*.

### **Example 1:**
\`\`\`
1 -> 1 -> 2
-----------
1 -> 2
\`\`\`
**Input:** head = [1,1,2]
**Output:** [1,2]

### **Example 2:**
\`\`\`
1 -> 1 -> 2 -> 3 -> 3
---------------------
1 -> 2 -> 3
\`\`\`
**Input:** head = [1,1,2,3,3]
**Output:** [1,2,3]

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 300]\`.
- \`-100 <= Node.val <= 100\`
- The list is guaranteed to be **sorted** in ascending order.`,
    sample_input: '[1,1,2]',
    sample_output: '[1,2]',
    test_cases: [
      { input: '[1,1,2]', output: '[1,2]', is_hidden: false },
      { input: '[1,1,2,3,3]', output: '[1,2,3]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1,1,1]', output: '[1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        let curr = head;
        while (curr && curr.next) {
          if (curr.val === curr.next.val) {
            curr.next = curr.next.next;
          } else {
            curr = curr.next;
          }
        }
        return head;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[ListNode]:
        curr = head
        while curr and curr.next:
            if curr.val == curr.next.val:
                curr.next = curr.next.next
            else:
                curr = curr.next
        return head`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head) {
          Runner.ListNode curr = head;
          while (curr != null && curr.next != null) {
            if (curr.val == curr.next.val) {
              curr.next = curr.next.next;
            } else {
              curr = curr.next;
            }
          }
          return head;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head) {
          ListNode* curr = head;
          while (curr && curr->next) {
            if (curr->val == curr->next->val) {
              curr->next = curr->next->next;
            } else {
              curr = curr->next;
            }
          }
          return head;
        }
      };`
    }
  },

  {
    title: 'Remove Duplicates from Sorted List II',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a sorted linked list, *delete all nodes that have duplicate numbers, leaving only distinct numbers from the original list*. Return *the linked list **sorted** as well*.

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 3 -> 4 -> 4 -> 5
-------------------------------
1 -> 2 -> 5
\`\`\`
**Input:** head = [1,2,3,3,4,4,5]
**Output:** [1,2,5]

### **Example 2:**
\`\`\`
1 -> 1 -> 1 -> 2 -> 3
---------------------
2 -> 3
\`\`\`
**Input:** head = [1,1,1,2,3]
**Output:** [2,3]

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 300]\`.
- \`-100 <= Node.val <= 100\`
- The list is guaranteed to be **sorted** in ascending order.`,
    sample_input: '[1,2,3,3,4,4,5]',
    sample_output: '[1,2,5]',
    test_cases: [
      { input: '[1,2,3,3,4,4,5]', output: '[1,2,5]', is_hidden: false },
      { input: '[1,1,1,2,3]', output: '[2,3]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1,1]', output: '[]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        const dummy = new ListNode(0);
        dummy.next = head;
        let prev = dummy;
        while (head) {
          if (head.next && head.val === head.next.val) {
            while (head.next && head.val === head.next.val) head = head.next;
            prev.next = head.next;
          } else {
            prev = prev.next;
          }
          head = head.next;
        }
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        dummy.next = head
        prev = dummy
        while head:
            if head.next and head.val == head.next.val:
                while head.next and head.val == head.next.val:
                    head = head.next
                prev.next = head.next
            else:
                prev = prev.next
            head = head.next
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head) {
          Runner.ListNode dummy = new Runner.ListNode(0);
          dummy.next = head;
          Runner.ListNode prev = dummy;
          while (head != null) {
            if (head.next != null && head.val == head.next.val) {
              while (head.next != null && head.val == head.next.val) head = head.next;
              prev.next = head.next;
            } else {
              prev = prev.next;
            }
            head = head.next;
          }
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head) {
          ListNode dummy(0);
          dummy.next = head;
          ListNode* prev = &dummy;
          while (head) {
            if (head->next && head->val == head->next->val) {
              while (head->next && head->val == head->next->val) head = head->next;
              prev->next = head->next;
            } else {
              prev = prev->next;
            }
            head = head->next;
          }
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Remove Nth Node From End of List',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a linked list, remove the \`nᵗʰ\` node from the end of the list and return its head.

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 4 -> 5, n = 2
----------------------------
1 -> 2 -> 3 -> 5
\`\`\`
**Input:** head = [1,2,3,4,5], n = 2
**Output:** [1,2,3,5]

### **Example 2:**
**Input:** head = [1], n = 1
**Output:** []

### **Example 3:**
**Input:** head = [1,2], n = 1
**Output:** [1]

### **Constraints:**
- The number of nodes in the list is \`sz\`.
- \`1 <= sz <= 30\`
- \`0 <= Node.val <= 100\`
- \`1 <= n <= sz\``,
    sample_input: '[1,2,3,4,5], 2',
    sample_output: '[1,2,3,5]',
    test_cases: [
      { input: '[1,2,3,4,5], 2', output: '[1,2,3,5]', is_hidden: false },
      { input: '[1], 1', output: '[]', is_hidden: false },
      { input: '[1,2], 1', output: '[1]', is_hidden: false },
      { input: '[1,2], 2', output: '[2]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head, n) {
        const dummy = new ListNode(0);
        dummy.next = head;
        let fast = dummy, slow = dummy;
        for (let i = 0; i <= n; i++) fast = fast.next;
        while (fast) {
          fast = fast.next;
          slow = slow.next;
        }
        slow.next = slow.next.next;
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        dummy = ListNode(0)
        dummy.next = head
        fast = slow = dummy
        for _ in range(n + 1):
            fast = fast.next
        while fast:
            fast = fast.next
            slow = slow.next
        slow.next = slow.next.next
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head, int n) {
          Runner.ListNode dummy = new Runner.ListNode(0);
          dummy.next = head;
          Runner.ListNode fast = dummy, slow = dummy;
          for (int i = 0; i <= n; i++) fast = fast.next;
          while (fast != null) {
            fast = fast.next;
            slow = slow.next;
          }
          slow.next = slow.next.next;
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head, int n) {
          ListNode dummy(0);
          dummy.next = head;
          ListNode* fast = &dummy;
          ListNode* slow = &dummy;
          for (int i = 0; i <= n; i++) fast = fast->next;
          while (fast) {
            fast = fast->next;
            slow = slow->next;
          }
          slow->next = slow->next->next;
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Swap Nodes in Pairs',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed.)

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 4
----------------
2 -> 1 -> 4 -> 3
\`\`\`
**Input:** head = [1,2,3,4]
**Output:** [2,1,4,3]

### **Example 2:**
**Input:** head = []
**Output:** []

### **Example 3:**
**Input:** head = [1]
**Output:** [1]

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 100]\`.
- \`0 <= Node.val <= 100\``,
    sample_input: '[1,2,3,4]',
    sample_output: '[2,1,4,3]',
    test_cases: [
      { input: '[1,2,3,4]', output: '[2,1,4,3]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: false },
      { input: '[1,2,3]', output: '[2,1,3]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        const dummy = new ListNode(0);
        dummy.next = head;
        let prev = dummy;
        while (prev.next && prev.next.next) {
          const first = prev.next;
          const second = prev.next.next;
          first.next = second.next;
          second.next = first;
          prev.next = second;
          prev = first;
        }
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        dummy.next = head
        prev = dummy
        while prev.next and prev.next.next:
            first = prev.next
            second = prev.next.next
            first.next = second.next
            second.next = first
            prev.next = second
            prev = first
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head) {
          Runner.ListNode dummy = new Runner.ListNode(0);
          dummy.next = head;
          Runner.ListNode prev = dummy;
          while (prev.next != null && prev.next.next != null) {
            Runner.ListNode first = prev.next;
            Runner.ListNode second = prev.next.next;
            first.next = second.next;
            second.next = first;
            prev.next = second;
            prev = first;
          }
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head) {
          ListNode dummy(0);
          dummy.next = head;
          ListNode* prev = &dummy;
          while (prev->next && prev->next->next) {
            ListNode* first = prev->next;
            ListNode* second = prev->next->next;
            first->next = second->next;
            second->next = first;
            prev->next = second;
            prev = first;
          }
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Rotate List',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a linked list, rotate the list to the right by \`k\` places.

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 4 -> 5, k = 2
----------------------------
4 -> 5 -> 1 -> 2 -> 3
\`\`\`
**Input:** head = [1,2,3,4,5], k = 2
**Output:** [4,5,1,2,3]

### **Example 2:**
\`\`\`
0 -> 1 -> 2, k = 4
------------------
2 -> 0 -> 1
\`\`\`
**Input:** head = [0,1,2], k = 4
**Output:** [2,0,1]

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 500]\`.
- \`-100 <= Node.val <= 100\`
- \`0 <= k <= 2 * 10⁹\``,
    sample_input: '[1,2,3,4,5], 2',
    sample_output: '[4,5,1,2,3]',
    test_cases: [
      { input: '[1,2,3,4,5], 2', output: '[4,5,1,2,3]', is_hidden: false },
      { input: '[0,1,2], 4', output: '[2,0,1]', is_hidden: false },
      { input: '[], 0', output: '[]', is_hidden: false },
      { input: '[1,2], 0', output: '[1,2]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head, k) {
        if (!head || !head.next || k === 0) return head;
        let len = 1, tail = head;
        while (tail.next) { tail = tail.next; len++; }
        k %= len;
        if (k === 0) return head;
        tail.next = head;
        let steps = len - k;
        let newTail = head;
        for (let i = 1; i < steps; i++) newTail = newTail.next;
        const newHead = newTail.next;
        newTail.next = null;
        return newHead;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
        if not head or not head.next or k == 0: return head
        length = 1
        tail = head
        while tail.next:
            tail = tail.next
            length += 1
        k %= length
        if k == 0: return head
        tail.next = head
        steps = length - k
        new_tail = head
        for _ in range(steps - 1):
            new_tail = new_tail.next
        new_head = new_tail.next
        new_tail.next = None
        return new_head`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head, int k) {
          if (head == null || head.next == null || k == 0) return head;
          int len = 1;
          Runner.ListNode tail = head;
          while (tail.next != null) { tail = tail.next; len++; }
          k %= len;
          if (k == 0) return head;
          tail.next = head;
          int steps = len - k;
          Runner.ListNode newTail = head;
          for (int i = 1; i < steps; i++) newTail = newTail.next;
          Runner.ListNode newHead = newTail.next;
          newTail.next = null;
          return newHead;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head, int k) {
          if (!head || !head->next || k == 0) return head;
          int len = 1;
          ListNode* tail = head;
          while (tail->next) { tail = tail->next; len++; }
          k %= len;
          if (k == 0) return head;
          tail->next = head;
          int steps = len - k;
          ListNode* newTail = head;
          for (int i = 1; i < steps; i++) newTail = newTail->next;
          ListNode* newHead = newTail->next;
          newTail->next = nullptr;
          return newHead;
        }
      };`
    }
  },

  {
    title: 'Partition List',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a linked list and a value \`x\`, partition it such that all nodes **less than** \`x\` come before nodes **greater than or equal** to \`x\`.

You should **preserve** the original relative order of the nodes in each of the two partitions.

### **Example 1:**
\`\`\`
1 -> 4 -> 3 -> 2 -> 5 -> 2, x = 3
---------------------------------
1 -> 2 -> 2 -> 4 -> 3 -> 5
\`\`\`
**Input:** head = [1,4,3,2,5,2], x = 3
**Output:** [1,2,2,4,3,5]

### **Example 2:**
**Input:** head = [2,1], x = 2
**Output:** [1,2]

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 200]\`.
- \`-100 <= Node.val <= 100\`
- \`-200 <= x <= 200\``,
    sample_input: '[1,4,3,2,5,2], 3',
    sample_output: '[1,2,2,4,3,5]',
    test_cases: [
      { input: '[1,4,3,2,5,2], 3', output: '[1,2,2,4,3,5]', is_hidden: false },
      { input: '[2,1], 2', output: '[1,2]', is_hidden: false },
      { input: '[], 0', output: '[]', is_hidden: false },
      { input: '[1,1], 2', output: '[1,1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head, x) {
        const dummy1 = new ListNode(0), dummy2 = new ListNode(0);
        let curr1 = dummy1, curr2 = dummy2;
        while (head) {
          if (head.val < x) { curr1.next = head; curr1 = curr1.next; }
          else { curr2.next = head; curr2 = curr2.next; }
          head = head.next;
        }
        curr2.next = null;
        curr1.next = dummy2.next;
        return dummy1.next;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode], x: int) -> Optional[ListNode]:
        d1, d2 = ListNode(0), ListNode(0)
        c1, c2 = d1, d2
        while head:
            if head.val < x:
                c1.next = head
                c1 = c1.next
            else:
                c2.next = head
                c2 = c2.next
            head = head.next
        c2.next = None
        c1.next = d2.next
        return d1.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head, int x) {
          Runner.ListNode d1 = new Runner.ListNode(0), d2 = new Runner.ListNode(0);
          Runner.ListNode c1 = d1, c2 = d2;
          while (head != null) {
            if (head.val < x) { c1.next = head; c1 = c1.next; }
            else { c2.next = head; c2 = c2.next; }
            head = head.next;
          }
          c2.next = null;
          c1.next = d2.next;
          return d1.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head, int x) {
          ListNode d1(0), d2(0);
          ListNode* c1 = &d1;
          ListNode* c2 = &d2;
          while (head) {
            if (head->val < x) { c1->next = head; c1 = c1->next; }
            else { c2->next = head; c2 = c2->next; }
            head = head->next;
          }
          c2->next = nullptr;
          c1->next = d2.next;
          return d1.next;
        }
      };`
    }
  },

  {
    title: 'Sort List',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `Given the \`head\` of a linked list, return *the list after sorting it in **ascending order***.

### **Example 1:**
\`\`\`
4 -> 2 -> 1 -> 3
----------------
1 -> 2 -> 3 -> 4
\`\`\`
**Input:** head = [4,2,1,3]
**Output:** [1,2,3,4]

### **Example 2:**
\`\`\`
-1 -> 5 -> 3 -> 4 -> 0
----------------------
-1 -> 0 -> 3 -> 4 -> 5
\`\`\`
**Input:** head = [-1,5,3,4,0]
**Output:** [-1,0,3,4,5]

### **Example 3:**
**Input:** head = []
**Output:** []

### **Constraints:**
- The number of nodes in the list is in the range \`[0, 5 * 10⁴]\`.
- \`-10⁵ <= Node.val <= 10⁵\``,
    sample_input: '[4,2,1,3]',
    sample_output: '[1,2,3,4]',
    test_cases: [
      { input: '[4,2,1,3]', output: '[1,2,3,4]', is_hidden: false },
      { input: '[-1,5,3,4,0]', output: '[-1,0,3,4,5]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        if (!head || !head.next) return head;
        const nums = [];
        let curr = head;
        while (curr) { nums.push(curr.val); curr = curr.next; }
        nums.sort((a, b) => a - b);
        const dummy = new ListNode(0);
        let c = dummy;
        for (const v of nums) { c.next = new ListNode(v); c = c.next; }
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next: return head
        nums = []
        curr = head
        while curr:
            nums.append(curr.val)
            curr = curr.next
        nums.sort()
        dummy = ListNode(0)
        c = dummy
        for v in nums:
            c.next = ListNode(v)
            c = c.next
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head) {
          if (head == null || head.next == null) return head;
          List<Integer> nums = new ArrayList<>();
          Runner.ListNode curr = head;
          while (curr != null) { nums.add(curr.val); curr = curr.next; }
          Collections.sort(nums);
          Runner.ListNode dummy = new Runner.ListNode(0);
          Runner.ListNode c = dummy;
          for (int v : nums) { c.next = new Runner.ListNode(v); c = c.next; }
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head) {
          if (!head || !head->next) return head;
          vector<int> nums;
          ListNode* curr = head;
          while (curr) { nums.push_back(curr->val); curr = curr->next; }
          sort(nums.begin(), nums.end());
          ListNode dummy(0);
          ListNode* c = &dummy;
          for (int v : nums) { c->next = new ListNode(v); c = c->next; }
          return dummy.next;
        }
      };`
    }
  },

  {
    title: 'Reorder List',
    topic: 'linked-lists',
    difficulty: 'medium',
    description: `You are given the head of a singly linked-list. The list can be represented as:
\`L0 → L1 → … → Ln - 1 → Ln\`

*Reorder the list to be on the following form:*
\`L0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → …\`

You may not modify the values in the list's nodes. Only nodes themselves may be changed.

### **Example 1:**
\`\`\`
1 -> 2 -> 3 -> 4
----------------
1 -> 4 -> 2 -> 3
\`\`\`
**Input:** head = [1,2,3,4]
**Output:** [1,4,2,3]

### **Example 2:**
\`\`\`
1 -> 2 -> 3 -> 4 -> 5
---------------------
1 -> 5 -> 2 -> 4 -> 3
\`\`\`
**Input:** head = [1,2,3,4,5]
**Output:** [1,5,2,4,3]

### **Constraints:**
- The number of nodes in the list is in the range \`[1, 5 * 10⁴]\`.
- \`1 <= Node.val <= 1000\``,
    sample_input: '[1,2,3,4]',
    sample_output: '[1,4,2,3]',
    test_cases: [
      { input: '[1,2,3,4]', output: '[1,4,2,3]', is_hidden: false },
      { input: '[1,2,3,4,5]', output: '[1,5,2,4,3]', is_hidden: false },
      { input: '[1]', output: '[1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(head) {
        if (!head || !head.next) return head;
        const nodes = [];
        let curr = head;
        while (curr) { nodes.push(curr); curr = curr.next; }
        let l = 0, r = nodes.length - 1;
        while (l < r) {
          nodes[l].next = nodes[r];
          l++;
          if (l === r) break;
          nodes[r].next = nodes[l];
          r--;
        }
        nodes[l].next = null;
        return head;
      }`,
      py: `class Solution:
    def solution(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next: return head
        nodes = []
        curr = head
        while curr:
            nodes.append(curr)
            curr = curr.next
        l, r = 0, len(nodes) - 1
        while l < r:
            nodes[l].next = nodes[r]
            l += 1
            if l == r: break
            nodes[r].next = nodes[l]
            r -= 1
        nodes[l].next = None
        return head`,
      java: `class Solution {
        public Runner.ListNode solution(Runner.ListNode head) {
          if (head == null || head.next == null) return head;
          List<Runner.ListNode> nodes = new ArrayList<>();
          Runner.ListNode curr = head;
          while (curr != null) { nodes.add(curr); curr = curr.next; }
          int l = 0, r = nodes.size() - 1;
          while (l < r) {
            nodes.get(l).next = nodes.get(r);
            l++;
            if (l == r) break;
            nodes.get(r).next = nodes.get(l);
            r--;
          }
          nodes.get(l).next = null;
          return head;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(ListNode* head) {
          if (!head || !head->next) return head;
          vector<ListNode*> nodes;
          ListNode* curr = head;
          while (curr) { nodes.push_back(curr); curr = curr->next; }
          int l = 0, r = (int)nodes.size() - 1;
          while (l < r) {
            nodes[l]->next = nodes[r];
            l++;
            if (l == r) break;
            nodes[r]->next = nodes[l];
            r--;
          }
          nodes[l]->next = nullptr;
          return head;
        }
      };`
    }
  },

  {
    title: 'Merge k Sorted Lists',
    topic: 'linked-lists',
    difficulty: 'hard',
    description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

*Merge all the linked-lists into one sorted linked-list and return it.*

### **Example 1:**
\`\`\`
[
  1->4->5,
  1->3->4,
  2->6
]
-------------------------
1->1->2->3->4->4->5->6
\`\`\`
**Input:** lists = [[1,4,5],[1,3,4],[2,6]]
**Output:** [1,1,2,3,4,4,5,6]

### **Example 2:**
**Input:** lists = []
**Output:** []

### **Example 3:**
**Input:** lists = [[]]
**Output:** []

### **Constraints:**
- \`k == lists.length\`
- \`0 <= k <= 10⁴\`
- \`0 <= lists[i].length <= 500\`
- \`-10⁴ <= lists[i][j] <= 10⁴\`
- \`lists[i]\` is sorted in **ascending order**.
- The sum of \`lists[i].length\` will not exceed \`10⁴\`.`,
    sample_input: '[[1,4,5],[1,3,4],[2,6]]',
    sample_output: '[1,1,2,3,4,4,5,6]',
    test_cases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]', is_hidden: false },
      { input: '[]', output: '[]', is_hidden: false },
      { input: '[[]]', output: '[]', is_hidden: false },
      { input: '[[1],[0]]', output: '[0,1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(lists) {
        const nums = [];
        for (const l of lists) {
          if (Array.isArray(l)) {
            for (const v of l) nums.push(v);
          } else {
            let c = l;
            while (c) { nums.push(c.val); c = c.next; }
          }
        }
        nums.sort((a, b) => a - b);
        const dummy = new ListNode(0);
        let c = dummy;
        for (const v of nums) { c.next = new ListNode(v); c = c.next; }
        return dummy.next;
      }`,
      py: `class Solution:
    def solution(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        nums = []
        for l in lists:
            if isinstance(l, list):
                nums.extend(l)
            else:
                curr = l
                while curr:
                    nums.append(curr.val)
                    curr = curr.next
        nums.sort()
        dummy = ListNode(0)
        curr = dummy
        for v in nums:
            curr.next = ListNode(v)
            curr = curr.next
        return dummy.next`,
      java: `class Solution {
        public Runner.ListNode solution(List<Object> lists) {
          List<Integer> nums = new ArrayList<>();
          for (Object obj : lists) {
            if (obj instanceof List) {
              for (Object item : (List<?>) obj) {
                if (item instanceof Integer) nums.add((Integer) item);
                else if (item != null) nums.add(Integer.parseInt(item.toString()));
              }
            } else if (obj != null) {
              try {
                Field valF = obj.getClass().getField("val");
                Field nextF = obj.getClass().getField("next");
                Object curr = obj;
                while (curr != null) {
                  nums.add((Integer) valF.get(curr));
                  curr = nextF.get(curr);
                }
              } catch (Exception e) {}
            }
          }
          Collections.sort(nums);
          Runner.ListNode dummy = new Runner.ListNode(0);
          Runner.ListNode curr = dummy;
          for (int v : nums) { curr.next = new Runner.ListNode(v); curr = curr.next; }
          return dummy.next;
        }
      }`,
      cpp: `class Solution {
      public:
        ListNode* solution(const vector<json>& lists) {
          vector<int> nums;
          for (const auto& item : lists) {
            if (item.is_array()) {
              for (const auto& v : item) if (v.is_number()) nums.push_back(v.get<int>());
            }
          }
          sort(nums.begin(), nums.end());
          ListNode dummy(0);
          ListNode* curr = &dummy;
          for (int v : nums) { curr->next = new ListNode(v); curr = curr->next; }
          return dummy.next;
        }
      };`
    }
  }
];
