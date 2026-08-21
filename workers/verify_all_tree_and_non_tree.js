'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');
const { runSandbox } = require('./sandbox');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Canonical Solutions for all 17 Tree Problems across JS, Python, Java, C++
const TREE_PROBLEMS_SOLUTIONS = {
  // 1. Balanced Binary Tree
  'Balanced Binary Tree': {
    js: `function solution(root) {
      function check(node) {
        if (!node) return 0;
        const l = check(node.left);
        if (l === -1) return -1;
        const r = check(node.right);
        if (r === -1) return -1;
        if (Math.abs(l - r) > 1) return -1;
        return Math.max(l, r) + 1;
      }
      return check(root) !== -1;
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> bool:
        def check(node):
            if not node: return 0
            l, r = check(node.left), check(node.right)
            if l == -1 or r == -1 or abs(l - r) > 1: return -1
            return max(l, r) + 1
        return check(root) != -1`,
    java: `class Solution {
      public boolean solution(Runner.TreeNode root) {
        return check(root) != -1;
      }
      private int check(Runner.TreeNode node) {
        if (node == null) return 0;
        int l = check(node.left), r = check(node.right);
        if (l == -1 || r == -1 || Math.abs(l - r) > 1) return -1;
        return Math.max(l, r) + 1;
      }
    }`,
    cpp: `class Solution {
    public:
      int check(TreeNode* node) {
        if (!node) return 0;
        int l = check(node->left), r = check(node->right);
        if (l == -1 || r == -1 || abs(l - r) > 1) return -1;
        return max(l, r) + 1;
      }
      bool solution(TreeNode* root) {
        return check(root) != -1;
      }
    };`
  },

  // 2. Binary Tree Level Order Traversal
  'Binary Tree Level Order Traversal': {
    js: `function solution(root) {
      if (!root) return [];
      const res = [];
      const q = [root];
      while (q.length) {
        const sz = q.length;
        const level = [];
        for (let i = 0; i < sz; i++) {
          const curr = q.shift();
          level.push(curr.val);
          if (curr.left) q.push(curr.left);
          if (curr.right) q.push(curr.right);
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
            sz = len(q)
            level = []
            for _ in range(sz):
                curr = q.pop(0)
                level.append(curr.val)
                if curr.left: q.append(curr.left)
                if curr.right: q.append(curr.right)
            res.append(level)
        return res`,
    java: `class Solution {
      public List<List<Integer>> solution(Runner.TreeNode root) {
        List<List<Integer>> res = new ArrayList<>();
        if (root == null) return res;
        Queue<Runner.TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
          int sz = q.size();
          List<Integer> level = new ArrayList<>();
          for (int i = 0; i < sz; i++) {
            Runner.TreeNode curr = q.poll();
            level.add(curr.val);
            if (curr.left != null) q.add(curr.left);
            if (curr.right != null) q.add(curr.right);
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
          int sz = q.size();
          vector<int> level;
          for (int i = 0; i < sz; i++) {
            TreeNode* curr = q.front();
            q.pop();
            level.push_back(curr->val);
            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
          }
          res.push_back(level);
        }
        return res;
      }
    };`
  },

  // 3. Path Sum
  'Path Sum': {
    js: `function solution(root, targetSum) {
      if (!root) return false;
      if (!root.left && !root.right) return root.val === targetSum;
      return solution(root.left, targetSum - root.val) || solution(root.right, targetSum - root.val);
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if not root: return False
        if not root.left and not root.right: return root.val == targetSum
        return self.solution(root.left, targetSum - root.val) or self.solution(root.right, targetSum - root.val)`,
    java: `class Solution {
      public boolean solution(Runner.TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return root.val == targetSum;
        return solution(root.left, targetSum - root.val) || solution(root.right, targetSum - root.val);
      }
    }`,
    cpp: `class Solution {
    public:
      bool solution(TreeNode* root, int targetSum) {
        if (!root) return false;
        if (!root->left && !root->right) return root->val == targetSum;
        return solution(root->left, targetSum - root->val) || solution(root->right, targetSum - root->val);
      }
    };`
  },

  // 4. Same Tree
  'Same Tree': {
    js: `function solution(p, q) {
      if (!p && !q) return true;
      if (!p || !q) return false;
      if (p.val !== q.val) return false;
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
  },

  // 5. Maximum Depth of Binary Tree
  'Maximum Depth of Binary Tree': {
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
  },

  // 6. Convert Sorted Array to Binary Search Tree
  'Convert Sorted Array to Binary Search Tree': {
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
  },

  // 7. Binary Tree Zigzag Level Order Traversal
  'Binary Tree Zigzag Level Order Traversal': {
    js: `function solution(root) {
      if (!root) return [];
      const res = [];
      const q = [root];
      let leftToRight = true;
      while (q.length) {
        const sz = q.length;
        const level = [];
        for (let i = 0; i < sz; i++) {
          const curr = q.shift();
          if (leftToRight) level.push(curr.val);
          else level.unshift(curr.val);
          if (curr.left) q.push(curr.left);
          if (curr.right) q.push(curr.right);
        }
        res.push(level);
        leftToRight = !leftToRight;
      }
      return res;
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[List[int]]:
        if not root: return []
        res, q, l2r = [], [root], True
        while q:
            sz = len(q)
            level = []
            for _ in range(sz):
                curr = q.pop(0)
                if l2r: level.append(curr.val)
                else: level.insert(0, curr.val)
                if curr.left: q.append(curr.left)
                if curr.right: q.append(curr.right)
            res.append(level)
            l2r = not l2r
        return res`,
    java: `class Solution {
      public List<List<Integer>> solution(Runner.TreeNode root) {
        List<List<Integer>> res = new ArrayList<>();
        if (root == null) return res;
        Queue<Runner.TreeNode> q = new LinkedList<>();
        q.add(root);
        boolean l2r = true;
        while (!q.isEmpty()) {
          int sz = q.size();
          List<Integer> level = new LinkedList<>();
          for (int i = 0; i < sz; i++) {
            Runner.TreeNode curr = q.poll();
            if (l2r) level.add(curr.val);
            else level.add(0, curr.val);
            if (curr.left != null) q.add(curr.left);
            if (curr.right != null) q.add(curr.right);
          }
          res.add(level);
          l2r = !l2r;
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
        bool l2r = true;
        while (!q.empty()) {
          int sz = q.size();
          vector<int> level(sz);
          for (int i = 0; i < sz; i++) {
            TreeNode* curr = q.front();
            q.pop();
            int idx = l2r ? i : (sz - 1 - i);
            level[idx] = curr->val;
            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
          }
          res.push_back(level);
          l2r = !l2r;
        }
        return res;
      }
    };`
  },

  // 8. Binary Tree Postorder Traversal
  'Binary Tree Postorder Traversal': {
    js: `function solution(root) {
      const res = [];
      function dfs(node) {
        if (!node) return;
        dfs(node.left);
        dfs(node.right);
        res.push(node.val);
      }
      dfs(root);
      return res;
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def dfs(node):
            if not node: return
            dfs(node.left)
            dfs(node.right)
            res.append(node.val)
        dfs(root)
        return res`,
    java: `class Solution {
      public List<Integer> solution(Runner.TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, res);
        return res;
      }
      private void dfs(Runner.TreeNode node, List<Integer> res) {
        if (node == null) return;
        dfs(node.left, res);
        dfs(node.right, res);
        res.add(node.val);
      }
    }`,
    cpp: `class Solution {
    public:
      void dfs(TreeNode* node, vector<int>& res) {
        if (!node) return;
        dfs(node->left, res);
        dfs(node->right, res);
        res.push_back(node->val);
      }
      vector<int> solution(TreeNode* root) {
        vector<int> res;
        dfs(root, res);
        return res;
      }
    };`
  },

  // 9. Validate Binary Search Tree
  'Validate Binary Search Tree': {
    js: `function solution(root) {
      function validate(node, min, max) {
        if (!node) return true;
        if (min !== null && node.val <= min) return false;
        if (max !== null && node.val >= max) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
      }
      return validate(root, null, null);
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> bool:
        def validate(node, min_val, max_val):
            if not node: return True
            if min_val is not None and node.val <= min_val: return False
            if max_val is not None and node.val >= max_val: return False
            return validate(node.left, min_val, node.val) and validate(node.right, node.val, max_val)
        return validate(root, None, None)`,
    java: `class Solution {
      public boolean solution(Runner.TreeNode root) {
        return validate(root, null, null);
      }
      private boolean validate(Runner.TreeNode node, Long min, Long max) {
        if (node == null) return true;
        if (min != null && node.val <= min) return false;
        if (max != null && node.val >= max) return false;
        return validate(node.left, min, (long)node.val) && validate(node.right, (long)node.val, max);
      }
    }`,
    cpp: `class Solution {
    public:
      bool validate(TreeNode* node, long long min_val, long long max_val) {
        if (!node) return true;
        if (node->val <= min_val || node->val >= max_val) return false;
        return validate(node->left, min_val, node->val) && validate(node->right, node->val, max_val);
      }
      bool solution(TreeNode* root) {
        return validate(root, -1e18, 1e18);
      }
    };`
  },

  // 10. Sum Root to Leaf Numbers
  'Sum Root to Leaf Numbers': {
    js: `function solution(root) {
      function dfs(node, cur) {
        if (!node) return 0;
        cur = cur * 10 + node.val;
        if (!node.left && !node.right) return cur;
        return dfs(node.left, cur) + dfs(node.right, cur);
      }
      return dfs(root, 0);
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> int:
        def dfs(node, cur):
            if not node: return 0
            cur = cur * 10 + node.val
            if not node.left and not node.right: return cur
            return dfs(node.left, cur) + dfs(node.right, cur)
        return dfs(root, 0)`,
    java: `class Solution {
      public int solution(Runner.TreeNode root) {
        return dfs(root, 0);
      }
      private int dfs(Runner.TreeNode node, int cur) {
        if (node == null) return 0;
        cur = cur * 10 + node.val;
        if (node.left == null && node.right == null) return cur;
        return dfs(node.left, cur) + dfs(node.right, cur);
      }
    }`,
    cpp: `class Solution {
    public:
      int dfs(TreeNode* node, int cur) {
        if (!node) return 0;
        cur = cur * 10 + node->val;
        if (!node->left && !node->right) return cur;
        return dfs(node->left, cur) + dfs(node->right, cur);
      }
      int solution(TreeNode* root) {
        return dfs(root, 0);
      }
    };`
  },

  // 11. Symmetric Tree
  'Symmetric Tree': {
    js: `function solution(root) {
      if (!root) return true;
      function isMirror(t1, t2) {
        if (!t1 && !t2) return true;
        if (!t1 || !t2) return false;
        return t1.val === t2.val && isMirror(t1.left, t2.right) && isMirror(t1.right, t2.left);
      }
      return isMirror(root.left, root.right);
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> bool:
        if not root: return True
        def isMirror(t1, t2):
            if not t1 and not t2: return True
            if not t1 or not t2: return False
            return t1.val == t2.val and isMirror(t1.left, t2.right) and isMirror(t1.right, t2.left)
        return isMirror(root.left, root.right)`,
    java: `class Solution {
      public boolean solution(Runner.TreeNode root) {
        if (root == null) return true;
        return isMirror(root.left, root.right);
      }
      private boolean isMirror(Runner.TreeNode t1, Runner.TreeNode t2) {
        if (t1 == null && t2 == null) return true;
        if (t1 == null || t2 == null) return false;
        return t1.val == t2.val && isMirror(t1.left, t2.right) && isMirror(t1.right, t2.left);
      }
    }`,
    cpp: `class Solution {
    public:
      bool isMirror(TreeNode* t1, TreeNode* t2) {
        if (!t1 && !t2) return true;
        if (!t1 || !t2) return false;
        return t1->val == t2->val && isMirror(t1->left, t2->right) && isMirror(t1->right, t2->left);
      }
      bool solution(TreeNode* root) {
        if (!root) return true;
        return isMirror(root->left, root->right);
      }
    };`
  },

  // 12. Binary Tree Inorder Traversal
  'Binary Tree Inorder Traversal': {
    js: `function solution(root) {
      const res = [];
      function dfs(node) {
        if (!node) return;
        dfs(node.left);
        res.push(node.val);
        dfs(node.right);
      }
      dfs(root);
      return res;
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def dfs(node):
            if not node: return
            dfs(node.left)
            res.append(node.val)
            dfs(node.right)
        dfs(root)
        return res`,
    java: `class Solution {
      public List<Integer> solution(Runner.TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, res);
        return res;
      }
      private void dfs(Runner.TreeNode node, List<Integer> res) {
        if (node == null) return;
        dfs(node.left, res);
        res.add(node.val);
        dfs(node.right, res);
      }
    }`,
    cpp: `class Solution {
    public:
      void dfs(TreeNode* node, vector<int>& res) {
        if (!node) return;
        dfs(node->left, res);
        res.push_back(node->val);
        dfs(node->right, res);
      }
      vector<int> solution(TreeNode* root) {
        vector<int> res;
        dfs(root, res);
        return res;
      }
    };`
  },

  // 13. Binary Tree Preorder Traversal
  'Binary Tree Preorder Traversal': {
    js: `function solution(root) {
      const res = [];
      function dfs(node) {
        if (!node) return;
        res.push(node.val);
        dfs(node.left);
        dfs(node.right);
      }
      dfs(root);
      return res;
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> List[int]:
        res = []
        def dfs(node):
            if not node: return
            res.append(node.val)
            dfs(node.left)
            dfs(node.right)
        dfs(root)
        return res`,
    java: `class Solution {
      public List<Integer> solution(Runner.TreeNode root) {
        List<Integer> res = new ArrayList<>();
        dfs(root, res);
        return res;
      }
      private void dfs(Runner.TreeNode node, List<Integer> res) {
        if (node == null) return;
        res.add(node.val);
        dfs(node.left, res);
        dfs(node.right, res);
      }
    }`,
    cpp: `class Solution {
    public:
      void dfs(TreeNode* node, vector<int>& res) {
        if (!node) return;
        res.push_back(node->val);
        dfs(node->left, res);
        dfs(node->right, res);
      }
      vector<int> solution(TreeNode* root) {
        vector<int> res;
        dfs(root, res);
        return res;
      }
    };`
  },

  // 14. Minimum Depth of Binary Tree
  'Minimum Depth of Binary Tree': {
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
  },

  // 15. Binary Tree Level Order Traversal II
  'Binary Tree Level Order Traversal II': {
    js: `function solution(root) {
      if (!root) return [];
      const res = [];
      const q = [root];
      while (q.length) {
        const sz = q.length;
        const level = [];
        for (let i = 0; i < sz; i++) {
          const curr = q.shift();
          level.push(curr.val);
          if (curr.left) q.push(curr.left);
          if (curr.right) q.push(curr.right);
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
            sz = len(q)
            level = []
            for _ in range(sz):
                curr = q.pop(0)
                level.append(curr.val)
                if curr.left: q.append(curr.left)
                if curr.right: q.append(curr.right)
            res.insert(0, level)
        return res`,
    java: `class Solution {
      public List<List<Integer>> solution(Runner.TreeNode root) {
        List<List<Integer>> res = new LinkedList<>();
        if (root == null) return res;
        Queue<Runner.TreeNode> q = new LinkedList<>();
        q.add(root);
        while (!q.isEmpty()) {
          int sz = q.size();
          List<Integer> level = new ArrayList<>();
          for (int i = 0; i < sz; i++) {
            Runner.TreeNode curr = q.poll();
            level.add(curr.val);
            if (curr.left != null) q.add(curr.left);
            if (curr.right != null) q.add(curr.right);
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
          int sz = q.size();
          vector<int> level;
          for (int i = 0; i < sz; i++) {
            TreeNode* curr = q.front();
            q.pop();
            level.push_back(curr->val);
            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
          }
          res.insert(res.begin(), level);
        }
        return res;
      }
    };`
  },

  // 16. Binary Tree Maximum Path Sum
  'Binary Tree Maximum Path Sum': {
    js: `function solution(root) {
      let maxPath = -Infinity;
      function maxGain(node) {
        if (!node) return 0;
        const leftGain = Math.max(maxGain(node.left), 0);
        const rightGain = Math.max(maxGain(node.right), 0);
        const priceNewPath = node.val + leftGain + rightGain;
        maxPath = Math.max(maxPath, priceNewPath);
        return node.val + Math.max(leftGain, rightGain);
      }
      maxGain(root);
      return maxPath;
    }`,
    py: `class Solution:
    def solution(self, root: Optional[TreeNode]) -> int:
        max_path = float('-inf')
        def max_gain(node):
            nonlocal max_path
            if not node: return 0
            left_gain = max(max_gain(node.left), 0)
            right_gain = max(max_gain(node.right), 0)
            price_new_path = node.val + left_gain + right_gain
            max_path = max(max_path, price_new_path)
            return node.val + max(left_gain, right_gain)
        max_gain(root)
        return int(max_path)`,
    java: `class Solution {
      private int maxPath = Integer.MIN_VALUE;
      public int solution(Runner.TreeNode root) {
        maxGain(root);
        return maxPath;
      }
      private int maxGain(Runner.TreeNode node) {
        if (node == null) return 0;
        int leftGain = Math.max(maxGain(node.left), 0);
        int rightGain = Math.max(maxGain(node.right), 0);
        maxPath = Math.max(maxPath, node.val + leftGain + rightGain);
        return node.val + Math.max(leftGain, rightGain);
      }
    }`,
    cpp: `class Solution {
    public:
      int maxPath = INT_MIN;
      int maxGain(TreeNode* node) {
        if (!node) return 0;
        int leftGain = max(maxGain(node->left), 0);
        int rightGain = max(maxGain(node->right), 0);
        maxPath = max(maxPath, node->val + leftGain + rightGain);
        return node->val + max(leftGain, rightGain);
      }
      int solution(TreeNode* root) {
        maxGain(root);
        return maxPath;
      }
    };`
  },

  // 17. Construct Binary Tree from Preorder and Inorder Traversal
  'Construct Binary Tree from Preorder and Inorder Traversal': {
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
        pre_iter = iter(preorder)
        def build(l, r):
            if l > r: return None
            val = next(pre_iter)
            root = TreeNode(val)
            mid = idx_map[val]
            root.left = build(l, mid - 1)
            root.right = build(mid + 1, r)
            return root
        return build(0, len(inorder) - 1)`,
    java: `class Solution {
      private int preIdx = 0;
      private Map<Integer, Integer> map = new HashMap<>();
      public Runner.TreeNode solution(int[] preorder, int[] inorder) {
        for (int i = 0; i < inorder.length; i++) map.put(inorder[i], i);
        return build(preorder, 0, inorder.length - 1);
      }
      private Runner.TreeNode build(int[] preorder, int l, int r) {
        if (l > r) return null;
        int val = preorder[preIdx++];
        Runner.TreeNode root = new Runner.TreeNode(val);
        int mid = map.get(val);
        root.left = build(preorder, l, mid - 1);
        root.right = build(preorder, mid + 1, r);
        return root;
      }
    }`,
    cpp: `class Solution {
    public:
      int preIdx = 0;
      unordered_map<int, int> mp;
      TreeNode* build(vector<int>& preorder, int l, int r) {
        if (l > r) return nullptr;
        int val = preorder[preIdx++];
        TreeNode* root = new TreeNode(val);
        int mid = mp[val];
        root->left = build(preorder, l, mid - 1);
        root->right = build(preorder, mid + 1, r);
        return root;
      }
      TreeNode* solution(vector<int>& preorder, vector<int>& inorder) {
        for (int i = 0; i < inorder.size(); i++) mp[inorder[i]] = i;
        return build(preorder, 0, inorder.size() - 1);
      }
    };`
  }
};

// Non-Tree Problem Verification (Array, Linked List, String, Matrix)
const NON_TREE_PROBLEMS_SOLUTIONS = {
  'Two Sum': {
    js: `function solution(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
      }
      return [];
    }`,
    py: `class Solution:
    def solution(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, v in enumerate(nums):
            diff = target - v
            if diff in seen: return [seen[diff], i]
            seen[v] = i
        return []`,
    java: `class Solution {
      public int[] solution(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
          int comp = target - nums[i];
          if (map.containsKey(comp)) return new int[]{map.get(comp), i};
          map.put(nums[i], i);
        }
        return new int[]{};
      }
    }`,
    cpp: `class Solution {
    public:
      vector<int> solution(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
          int comp = target - nums[i];
          if (mp.count(comp)) return {mp[comp], i};
          mp[nums[i]] = i;
        }
        return {};
      }
    };`
  }
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RUNNING ALL TREE PROBLEMS THROUGH REAL SANDBOX JUDGE');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passedTreeCount = 0;
  let totalTreeCount = 0;

  for (const [title, sols] of Object.entries(TREE_PROBLEMS_SOLUTIONS)) {
    const { rows: probRows } = await pool.query(
      `SELECT id, title, topic FROM problems WHERE title = $1`,
      [title]
    );
    if (!probRows.length) {
      console.warn(`[WARN] Problem "${title}" not found in DB! Skipping.`);
      continue;
    }
    const problem = probRows[0];
    const { rows: testCases } = await pool.query(
      `SELECT input, output, is_hidden FROM test_cases WHERE problem_id = $1 ORDER BY id ASC`,
      [problem.id]
    );

    console.log(`\n── [Tree Problem] "${title}" (${testCases.length} test cases) ──`);

    for (const lang of ['javascript', 'python', 'java', 'cpp']) {
      totalTreeCount++;
      const code = sols[lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang];
      const res = await runSandbox({ code, language: lang, testCases });
      const ok = res.verdict === 'ACCEPTED';
      if (ok) passedTreeCount++;

      const mark = ok ? '✓' : '✗';
      console.log(`  [${lang.toUpperCase().padEnd(10)}] ${mark} verdict=${res.verdict} passed=${res.passedTests}/${res.totalTests} (${res.runtimeMs}ms)`);
      if (!ok) {
        console.error(`    Error details:`, JSON.stringify(res.testResults.filter(t => !t.passed)));
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  VERIFYING NON-TREE PROBLEMS ARE UNAFFECTED');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passedNonTreeCount = 0;
  let totalNonTreeCount = 0;

  for (const [title, sols] of Object.entries(NON_TREE_PROBLEMS_SOLUTIONS)) {
    const { rows: probRows } = await pool.query(
      `SELECT id, title, topic FROM problems WHERE title = $1`,
      [title]
    );
    if (!probRows.length) continue;
    const problem = probRows[0];
    const { rows: testCases } = await pool.query(
      `SELECT input, output, is_hidden FROM test_cases WHERE problem_id = $1 ORDER BY id ASC`,
      [problem.id]
    );

    console.log(`── [Non-Tree Problem] "${title}" (${testCases.length} test cases) ──`);

    for (const lang of ['javascript', 'python', 'java', 'cpp']) {
      totalNonTreeCount++;
      const code = sols[lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang];
      const res = await runSandbox({ code, language: lang, testCases });
      const ok = res.verdict === 'ACCEPTED';
      if (ok) passedNonTreeCount++;

      const mark = ok ? '✓' : '✗';
      console.log(`  [${lang.toUpperCase().padEnd(10)}] ${mark} verdict=${res.verdict} passed=${res.passedTests}/${res.totalTests} (${res.runtimeMs}ms)`);
      if (!ok) {
        console.error(`    Error details:`, JSON.stringify(res.testResults.filter(t => !t.passed)));
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  FINAL VERIFICATION SUMMARY:`);
  console.log(`  Tree problems tested:     ${passedTreeCount} / ${totalTreeCount} passed (${Math.round(passedTreeCount/totalTreeCount*100)}%)`);
  console.log(`  Non-Tree problems tested: ${passedNonTreeCount} / ${totalNonTreeCount} passed (${Math.round(passedNonTreeCount/totalNonTreeCount*100)}%)`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await pool.end();
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
