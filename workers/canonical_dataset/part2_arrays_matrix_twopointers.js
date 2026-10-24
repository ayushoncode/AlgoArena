'use strict';

/**
 * Canonical specifications for Arrays, Matrices, Two Pointers, and In-Place Mutations.
 */
module.exports = [
  {
    title: 'Two Sum',
    topic: 'arrays',
    difficulty: 'easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.

### **Example 1:**
**Input:** nums = [2,7,11,15], target = 9
**Output:** [0,1]
**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

### **Example 2:**
**Input:** nums = [3,2,4], target = 6
**Output:** [1,2]

### **Example 3:**
**Input:** nums = [3,3], target = 6
**Output:** [0,1]

### **Constraints:**
- \`2 <= nums.length <= 10⁴\`
- \`-10⁹ <= nums[i] <= 10⁹\`
- \`-10⁹ <= target <= 10⁹\`
- **Only one valid answer exists.**`,
    sample_input: '[2,7,11,15], 9',
    sample_output: '[0,1]',
    test_cases: [
      { input: '[2,7,11,15], 9', output: '[0,1]', is_hidden: false },
      { input: '[3,2,4], 6', output: '[1,2]', is_hidden: false },
      { input: '[3,3], 6', output: '[0,1]', is_hidden: false },
      { input: '[1,5,3,7,9], 12', output: '[1,3]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const diff = target - nums[i];
          if (map.has(diff)) return [map.get(diff), i];
          map.set(nums[i], i);
        }
        return [];
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []`,
      java: `class Solution {
        public int[] solution(int[] nums, int target) {
          Map<Integer, Integer> map = new HashMap<>();
          for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) return new int[]{map.get(diff), i};
            map.put(nums[i], i);
          }
          return new int[]{};
        }
      }`,
      cpp: `class Solution {
      public:
        vector<int> solution(vector<int>& nums, int target) {
          unordered_map<int, int> map;
          for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (map.count(diff)) return {map[diff], i};
            map[nums[i]] = i;
          }
          return {};
        }
      };`
    }
  },

  {
    title: '3Sum',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.

### **Example 1:**
**Input:** nums = [-1,0,1,2,-1,-4]
**Output:** [[-1,-1,2],[-1,0,1]]
**Explanation:**
nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0.
nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0.
nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0.
The distinct triplets are [-1,0,1] and [-1,-1,2].

### **Example 2:**
**Input:** nums = [0,1,1]
**Output:** []

### **Example 3:**
**Input:** nums = [0,0,0]
**Output:** [[0,0,0]]

### **Constraints:**
- \`3 <= nums.length <= 3000\`
- \`-10⁵ <= nums[i] <= 10⁵\``,
    sample_input: '[-1,0,1,2,-1,-4]',
    sample_output: '[[-1,-1,2],[-1,0,1]]',
    test_cases: [
      { input: '[-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', is_hidden: false },
      { input: '[0,1,1]', output: '[]', is_hidden: false },
      { input: '[0,0,0]', output: '[[0,0,0]]', is_hidden: false },
      { input: '[-2,0,1,1,2]', output: '[[-2,0,2],[-2,1,1]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        nums.sort((a, b) => a - b);
        const res = [];
        for (let i = 0; i < nums.length - 2; i++) {
          if (i > 0 && nums[i] === nums[i - 1]) continue;
          let l = i + 1, r = nums.length - 1;
          while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
              res.push([nums[i], nums[l], nums[r]]);
              while (l < r && nums[l] === nums[l + 1]) l++;
              while (l < r && nums[r] === nums[r - 1]) r--;
              l++; r--;
            } else if (sum < 0) l++;
            else r--;
          }
        }
        return res;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> List[List[int]]:
        nums.sort()
        res = []
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i - 1]: continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s == 0:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l + 1]: l += 1
                    while l < r and nums[r] == nums[r - 1]: r -= 1
                    l += 1; r -= 1
                elif s < 0: l += 1
                else: r -= 1
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(int[] nums) {
          Arrays.sort(nums);
          List<List<Integer>> res = new ArrayList<>();
          for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
              int sum = nums[i] + nums[l] + nums[r];
              if (sum == 0) {
                res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                while (l < r && nums[l] == nums[l + 1]) l++;
                while (l < r && nums[r] == nums[r - 1]) r--;
                l++; r--;
              } else if (sum < 0) l++;
              else r--;
            }
          }
          return res;
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(vector<int>& nums) {
          sort(nums.begin(), nums.end());
          vector<vector<int>> res;
          int n = nums.size();
          for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
              int sum = nums[i] + nums[l] + nums[r];
              if (sum == 0) {
                res.push_back({nums[i], nums[l], nums[r]});
                while (l < r && nums[l] == nums[l + 1]) l++;
                while (l < r && nums[r] == nums[r - 1]) r--;
                l++; r--;
              } else if (sum < 0) l++;
              else r--;
            }
          }
          return res;
        }
      };`
    }
  },

  {
    title: '3Sum Closest',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an integer array \`nums\` of length \`n\` and an integer \`target\`, find three integers in \`nums\` such that the sum is closest to \`target\`.

Return *the sum of the three integers*.

You may assume that each input would have exactly one solution.

### **Example 1:**
**Input:** nums = [-1,2,1,-4], target = 1
**Output:** 2
**Explanation:** The sum that is closest to the target is 2. (-1 + 2 + 1 = 2).

### **Example 2:**
**Input:** nums = [0,0,0], target = 1
**Output:** 0

### **Constraints:**
- \`3 <= nums.length <= 500\`
- \`-1000 <= nums[i] <= 1000\`
- \`-10⁴ <= target <= 10⁴\``,
    sample_input: '[-1,2,1,-4], 1',
    sample_output: '2',
    test_cases: [
      { input: '[-1,2,1,-4], 1', output: '2', is_hidden: false },
      { input: '[0,0,0], 1', output: '0', is_hidden: false },
      { input: '[1,1,1,1], 0', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, target) {
        nums.sort((a, b) => a - b);
        let closest = nums[0] + nums[1] + nums[2];
        for (let i = 0; i < nums.length - 2; i++) {
          let l = i + 1, r = nums.length - 1;
          while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (Math.abs(sum - target) < Math.abs(closest - target)) closest = sum;
            if (sum < target) l++;
            else if (sum > target) r--;
            else return target;
          }
        }
        return closest;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], target: int) -> int:
        nums.sort()
        closest = nums[0] + nums[1] + nums[2]
        for i in range(len(nums) - 2):
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if abs(s - target) < abs(closest - target):
                    closest = s
                if s < target: l += 1
                elif s > target: r -= 1
                else: return target
        return closest`,
      java: `class Solution {
        public int solution(int[] nums, int target) {
          Arrays.sort(nums);
          int closest = nums[0] + nums[1] + nums[2];
          for (int i = 0; i < nums.length - 2; i++) {
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
              int sum = nums[i] + nums[l] + nums[r];
              if (Math.abs(sum - target) < Math.abs(closest - target)) closest = sum;
              if (sum < target) l++;
              else if (sum > target) r--;
              else return target;
            }
          }
          return closest;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums, int target) {
          sort(nums.begin(), nums.end());
          int closest = nums[0] + nums[1] + nums[2];
          for (int i = 0; i < nums.size() - 2; i++) {
            int l = i + 1, r = nums.size() - 1;
            while (l < r) {
              int sum = nums[i] + nums[l] + nums[r];
              if (abs(sum - target) < abs(closest - target)) closest = sum;
              if (sum < target) l++;
              else if (sum > target) r--;
              else return target;
            }
          }
          return closest;
        }
      };`
    }
  },

  {
    title: '4Sum',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an array \`nums\` of \`n\` integers, return *an array of all the **unique** quadruplets* \`[nums[a], nums[b], nums[c], nums[d]]\` such that:
- \`0 <= a, b, c, d < n\`
- \`a\`, \`b\`, \`c\`, and \`d\` are **distinct**.
- \`nums[a] + nums[b] + nums[c] + nums[d] == target\`

You may return the answer in **any order**.

### **Example 1:**
**Input:** nums = [1,0,-1,0,-2,2], target = 0
**Output:** [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]

### **Example 2:**
**Input:** nums = [2,2,2,2,2], target = 8
**Output:** [[2,2,2,2]]

### **Constraints:**
- \`1 <= nums.length <= 200\`
- \`-10⁹ <= nums[i] <= 10⁹\`
- \`-10⁹ <= target <= 10⁹\``,
    sample_input: '[1,0,-1,0,-2,2], 0',
    sample_output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]',
    test_cases: [
      { input: '[1,0,-1,0,-2,2], 0', output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]', is_hidden: false },
      { input: '[2,2,2,2,2], 8', output: '[[2,2,2,2]]', is_hidden: false },
      { input: '[0,0,0,0], 0', output: '[[0,0,0,0]]', is_hidden: false },
      { input: '[1,-2,-5,-4,-3,3,3,5], -11', output: '[[-5,-4,-3,1]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, target) {
        nums.sort((a, b) => a - b);
        const res = [], n = nums.length;
        for (let i = 0; i < n - 3; i++) {
          if (i > 0 && nums[i] === nums[i - 1]) continue;
          for (let j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] === nums[j - 1]) continue;
            let l = j + 1, r = n - 1;
            while (l < r) {
              const sum = nums[i] + nums[j] + nums[l] + nums[r];
              if (sum === target) {
                res.push([nums[i], nums[j], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
              } else if (sum < target) l++;
              else r--;
            }
          }
        }
        return res;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], target: int) -> List[List[int]]:
        nums.sort()
        res, n = [], len(nums)
        for i in range(n - 3):
            if i > 0 and nums[i] == nums[i - 1]: continue
            for j in range(i + 1, n - 2):
                if j > i + 1 and nums[j] == nums[j - 1]: continue
                l, r = j + 1, n - 1
                while l < r:
                    s = nums[i] + nums[j] + nums[l] + nums[r]
                    if s == target:
                        res.append([nums[i], nums[j], nums[l], nums[r]])
                        while l < r and nums[l] == nums[l + 1]: l += 1
                        while l < r and nums[r] == nums[r - 1]: r -= 1
                        l += 1; r -= 1
                    elif s < target: l += 1
                    else: r -= 1
        return res`,
      java: `class Solution {
        public List<List<Integer>> solution(int[] nums, int target) {
          Arrays.sort(nums);
          List<List<Integer>> res = new ArrayList<>();
          int n = nums.length;
          for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
              if (j > i + 1 && nums[j] == nums[j - 1]) continue;
              int l = j + 1, r = n - 1;
              while (l < r) {
                long sum = (long)nums[i] + nums[j] + nums[l] + nums[r];
                if (sum == target) {
                  res.add(Arrays.asList(nums[i], nums[j], nums[l], nums[r]));
                  while (l < r && nums[l] == nums[l + 1]) l++;
                  while (l < r && nums[r] == nums[r - 1]) r--;
                  l++; r--;
                } else if (sum < target) l++;
                else r--;
              }
            }
          }
          return res;
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(vector<int>& nums, int target) {
          sort(nums.begin(), nums.end());
          vector<vector<int>> res;
          int n = nums.size();
          for (int i = 0; i < n - 3; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
              if (j > i + 1 && nums[j] == nums[j - 1]) continue;
              int l = j + 1, r = n - 1;
              while (l < r) {
                long long sum = (long long)nums[i] + nums[j] + nums[l] + nums[r];
                if (sum == target) {
                  res.push_back({nums[i], nums[j], nums[l], nums[r]});
                  while (l < r && nums[l] == nums[l + 1]) l++;
                  while (l < r && nums[r] == nums[r - 1]) r--;
                  l++; r--;
                } else if (sum < target) l++;
                else r--;
              }
            }
          }
          return res;
        }
      };`
    }
  },

  {
    title: 'Container With Most Water',
    topic: 'arrays',
    difficulty: 'medium',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`iᵗʰ\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.

**Notice** that you may not slant the container.

### **Example 1:**
\`\`\`
8 |   |       |
7 |   |       |   |
6 |   | |     |   |
5 |   | |   | |   |
4 |   | |   | | | |
3 |   | |   | | | | |
2 |   | | | | | | | |
1 |_|_|_|_|_|_|_|_|_|
   1 8 6 2 5 4 8 3 7
\`\`\`
**Input:** height = [1,8,6,2,5,4,8,3,7]
**Output:** 49
**Explanation:** The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.

### **Example 2:**
**Input:** height = [1,1]
**Output:** 1

### **Constraints:**
- \`n == height.length\`
- \`2 <= n <= 10⁵\`
- \`0 <= height[i] <= 10⁴\``,
    sample_input: '[1,8,6,2,5,4,8,3,7]',
    sample_output: '49',
    test_cases: [
      { input: '[1,8,6,2,5,4,8,3,7]', output: '49', is_hidden: false },
      { input: '[1,1]', output: '1', is_hidden: false },
      { input: '[4,3,2,1,4]', output: '16', is_hidden: false },
      { input: '[1,2,1]', output: '2', is_hidden: true }
    ],
    solutions: {
      js: `function solution(height) {
        let maxWater = 0, l = 0, r = height.length - 1;
        while (l < r) {
          const area = Math.min(height[l], height[r]) * (r - l);
          maxWater = Math.max(maxWater, area);
          if (height[l] < height[r]) l++;
          else r--;
        }
        return maxWater;
      }`,
      py: `class Solution:
    def solution(self, height: List[int]) -> int:
        max_water, l, r = 0, 0, len(height) - 1
        while l < r:
            area = min(height[l], height[r]) * (r - l)
            max_water = max(max_water, area)
            if height[l] < height[r]: l += 1
            else: r -= 1
        return max_water`,
      java: `class Solution {
        public int solution(int[] height) {
          int maxWater = 0, l = 0, r = height.length - 1;
          while (l < r) {
            int area = Math.min(height[l], height[r]) * (r - l);
            maxWater = Math.max(maxWater, area);
            if (height[l] < height[r]) l++;
            else r--;
          }
          return maxWater;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& height) {
          int maxWater = 0, l = 0, r = height.size() - 1;
          while (l < r) {
            int area = min(height[l], height[r]) * (r - l);
            maxWater = max(maxWater, area);
            if (height[l] < height[r]) l++;
            else r--;
          }
          return maxWater;
        }
      };`
    }
  },

  {
    title: 'Merge Sorted Array',
    topic: 'arrays',
    difficulty: 'easy',
    description: `You are given two integer arrays \`nums1\` and \`nums2\`, sorted in **non-decreasing order**, and two integers \`m\` and \`n\`, representing the number of elements in \`nums1\` and \`nums2\` respectively.

**Merge** \`nums1\` and \`nums2\` into a single array sorted in **non-decreasing order**.

The final sorted array should not be returned by the function, but instead be *stored inside the array* \`nums1\`. To accommodate this, \`nums1\` has a length of \`m + n\`, where the first \`m\` elements denote the elements that should be merged, and the last \`n\` elements are set to \`0\` and should be ignored. \`nums2\` has a length of \`n\`.

### **Example 1:**
**Input:** nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
**Output:** [1,2,2,3,5,6]
**Explanation:** The arrays we are merging are [1,2,3] and [2,5,6].
The result of the merge is [1,2,2,3,5,6] with the underlined elements coming from nums1.

### **Example 2:**
**Input:** nums1 = [1], m = 1, nums2 = [], n = 0
**Output:** [1]

### **Example 3:**
**Input:** nums1 = [0], m = 0, nums2 = [1], n = 1
**Output:** [1]

### **Constraints:**
- \`nums1.length == m + n\`
- \`nums2.length == n\`
- \`0 <= m, n <= 200\`
- \`1 <= m + n <= 200\`
- \`-10⁹ <= nums1[i], nums2[j] <= 10⁹\``,
    sample_input: '[1,2,3,0,0,0], 3, [2,5,6], 3',
    sample_output: '[1,2,2,3,5,6]',
    test_cases: [
      { input: '[1,2,3,0,0,0], 3, [2,5,6], 3', output: '[1,2,2,3,5,6]', is_hidden: false },
      { input: '[1], 1, [], 0', output: '[1]', is_hidden: false },
      { input: '[0], 0, [1], 1', output: '[1]', is_hidden: false },
      { input: '[2,0], 1, [1], 1', output: '[1,2]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums1, m, nums2, n) {
        let i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
          if (i >= 0 && nums1[i] > nums2[j]) {
            nums1[k--] = nums1[i--];
          } else {
            nums1[k--] = nums2[j--];
          }
        }
        return nums1;
      }`,
      py: `class Solution:
    def solution(self, nums1: List[int], m: int, nums2: List[int], n: int) -> None:
        i, j, k = m - 1, n - 1, m + n - 1
        while j >= 0:
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[k] = nums1[i]
                i -= 1
            else:
                nums1[k] = nums2[j]
                j -= 1
            k -= 1`,
      java: `class Solution {
        public void solution(int[] nums1, int m, int[] nums2, int n) {
          int i = m - 1, j = n - 1, k = m + n - 1;
          while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) {
              nums1[k--] = nums1[i--];
            } else {
              nums1[k--] = nums2[j--];
            }
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void solution(vector<int>& nums1, int m, vector<int>& nums2, int n) {
          int i = m - 1, j = n - 1, k = m + n - 1;
          while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) {
              nums1[k--] = nums1[i--];
            } else {
              nums1[k--] = nums2[j--];
            }
          }
        }
      };`
    }
  },

  {
    title: 'Move Zeroes',
    topic: 'arrays',
    difficulty: 'easy',
    description: `Given an integer array \`nums\`, move all \`0\`'s to the end of it while maintaining the relative order of the non-zero elements.

**Note** that you must do this in-place without making a copy of the array.

### **Example 1:**
**Input:** nums = [0,1,0,3,12]
**Output:** [1,3,12,0,0]

### **Example 2:**
**Input:** nums = [0]
**Output:** [0]

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\``,
    sample_input: '[0,1,0,3,12]',
    sample_output: '[1,3,12,0,0]',
    test_cases: [
      { input: '[0,1,0,3,12]', output: '[1,3,12,0,0]', is_hidden: false },
      { input: '[0]', output: '[0]', is_hidden: false },
      { input: '[1,0,1]', output: '[1,1,0]', is_hidden: false },
      { input: '[2,1]', output: '[2,1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        let insertPos = 0;
        for (let i = 0; i < nums.length; i++) {
          if (nums[i] !== 0) nums[insertPos++] = nums[i];
        }
        while (insertPos < nums.length) nums[insertPos++] = 0;
        return nums;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> None:
        insert_pos = 0
        for x in nums:
            if x != 0:
                nums[insert_pos] = x
                insert_pos += 1
        while insert_pos < len(nums):
            nums[insert_pos] = 0
            insert_pos += 1`,
      java: `class Solution {
        public void solution(int[] nums) {
          int insertPos = 0;
          for (int x : nums) {
            if (x != 0) nums[insertPos++] = x;
          }
          while (insertPos < nums.length) nums[insertPos++] = 0;
        }
      }`,
      cpp: `class Solution {
      public:
        void solution(vector<int>& nums) {
          int insertPos = 0;
          for (int x : nums) {
            if (x != 0) nums[insertPos++] = x;
          }
          while (insertPos < nums.size()) nums[insertPos++] = 0;
        }
      };`
    }
  },

  {
    title: 'Remove Duplicates from Sorted Array',
    topic: 'arrays',
    difficulty: 'easy',
    description: `Given an integer array \`nums\` sorted in **non-decreasing order**, remove the duplicates **in-place** such that each unique element appears only **once**. The **relative order** of the elements should be kept the **same**. Then return *the number of unique elements in* \`nums\`.

Consider the number of unique elements of \`nums\` to be \`k\`, to get accepted, you need to do the following things:
- Change the array \`nums\` such that the first \`k\` elements of \`nums\` contain the unique elements in the order they were present in \`nums\` initially. The remaining elements of \`nums\` are not important as well as the size of \`nums\`.
- Return \`k\`.

### **Example 1:**
**Input:** nums = [1,1,2]
**Output:** 2, nums = [1,2,_]
**Explanation:** Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.

### **Example 2:**
**Input:** nums = [0,0,1,1,1,2,2,3,3,4]
**Output:** 5, nums = [0,1,2,3,4,_,_,_,_,_]

### **Constraints:**
- \`1 <= nums.length <= 3 * 10⁴\`
- \`-100 <= nums[i] <= 100\`
- \`nums\` is sorted in **non-decreasing** order.`,
    sample_input: '[1,1,2]',
    sample_output: '2',
    test_cases: [
      { input: '[1,1,2]', output: '2', is_hidden: false },
      { input: '[0,0,1,1,1,2,2,3,3,4]', output: '5', is_hidden: false },
      { input: '[1]', output: '1', is_hidden: false },
      { input: '[1,2,3]', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        if (nums.length === 0) return 0;
        let k = 1;
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] !== nums[i - 1]) nums[k++] = nums[i];
        }
        return k;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        if not nums: return 0
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[i - 1]:
                nums[k] = nums[i]
                k += 1
        return k`,
      java: `class Solution {
        public int solution(int[] nums) {
          if (nums.length == 0) return 0;
          int k = 1;
          for (int i = 1; i < nums.length; i++) {
            if (nums[i] != nums[i - 1]) nums[k++] = nums[i];
          }
          return k;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          if (nums.empty()) return 0;
          int k = 1;
          for (int i = 1; i < nums.size(); i++) {
            if (nums[i] != nums[i - 1]) nums[k++] = nums[i];
          }
          return k;
        }
      };`
    }
  },

  {
    title: 'Remove Duplicates from Sorted Array II',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an integer array \`nums\` sorted in **non-decreasing order**, remove some duplicates **in-place** such that each unique element appears **at most twice**. The **relative order** of the elements should be kept the **same**.

Since it is impossible to change the length of the array in some languages, you must instead have the result be placed in the **first part** of the array \`nums\`. More formally, if there are \`k\` elements after removing the duplicates, then the first \`k\` elements of \`nums\` should hold the final result. It does not matter what you leave beyond the first \`k\` elements.

Return \`k\` *after placing the final result in the first* \`k\` *slots of* \`nums\`.

### **Example 1:**
**Input:** nums = [1,1,1,2,2,3]
**Output:** 5, nums = [1,1,2,2,3,_]
**Explanation:** Your function should return k = 5, with the first five elements of nums being 1, 1, 2, 2 and 3 respectively.

### **Example 2:**
**Input:** nums = [0,0,1,1,1,1,2,3,3]
**Output:** 7, nums = [0,0,1,1,2,3,3,_,_]

### **Constraints:**
- \`1 <= nums.length <= 3 * 10⁴\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- \`nums\` is sorted in **non-decreasing** order.`,
    sample_input: '[1,1,1,2,2,3]',
    sample_output: '5',
    test_cases: [
      { input: '[1,1,1,2,2,3]', output: '5', is_hidden: false },
      { input: '[0,0,1,1,1,1,2,3,3]', output: '7', is_hidden: false },
      { input: '[1,1,1]', output: '2', is_hidden: false },
      { input: '[1,2,3]', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        if (nums.length <= 2) return nums.length;
        let k = 2;
        for (let i = 2; i < nums.length; i++) {
          if (nums[i] !== nums[k - 2]) nums[k++] = nums[i];
        }
        return k;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        if len(nums) <= 2: return len(nums)
        k = 2
        for i in range(2, len(nums)):
            if nums[i] != nums[k - 2]:
                nums[k] = nums[i]
                k += 1
        return k`,
      java: `class Solution {
        public int solution(int[] nums) {
          if (nums.length <= 2) return nums.length;
          int k = 2;
          for (int i = 2; i < nums.length; i++) {
            if (nums[i] != nums[k - 2]) nums[k++] = nums[i];
          }
          return k;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          if (nums.size() <= 2) return nums.size();
          int k = 2;
          for (int i = 2; i < nums.size(); i++) {
            if (nums[i] != nums[k - 2]) nums[k++] = nums[i];
          }
          return k;
        }
      };`
    }
  },

  {
    title: 'Remove Element',
    topic: 'arrays',
    difficulty: 'easy',
    description: `Given an integer array \`nums\` and an integer \`val\`, remove all occurrences of \`val\` in \`nums\` **in-place**. The order of the elements may be changed. Then return *the number of elements in* \`nums\` *which are not equal to* \`val\`.

Consider the number of elements in \`nums\` which are not equal to \`val\` be \`k\`, to get accepted, you need to do the following things:
- Change the array \`nums\` such that the first \`k\` elements of \`nums\` contain the elements which are not equal to \`val\`. The remaining elements of \`nums\` are not important as well as the size of \`nums\`.
- Return \`k\`.

### **Example 1:**
**Input:** nums = [3,2,2,3], val = 3
**Output:** 2, nums = [2,2,_,_]

### **Example 2:**
**Input:** nums = [0,1,2,2,3,0,4,2], val = 2
**Output:** 5, nums = [0,1,4,0,3,_,_,_]

### **Constraints:**
- \`0 <= nums.length <= 100\`
- \`0 <= nums[i] <= 50\`
- \`0 <= val <= 100\``,
    sample_input: '[3,2,2,3], 3',
    sample_output: '2',
    test_cases: [
      { input: '[3,2,2,3], 3', output: '2', is_hidden: false },
      { input: '[0,1,2,2,3,0,4,2], 2', output: '5', is_hidden: false },
      { input: '[], 0', output: '0', is_hidden: false },
      { input: '[1], 1', output: '0', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, val) {
        let k = 0;
        for (let i = 0; i < nums.length; i++) {
          if (nums[i] !== val) nums[k++] = nums[i];
        }
        return k;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], val: int) -> int:
        k = 0
        for x in nums:
            if x != val:
                nums[k] = x
                k += 1
        return k`,
      java: `class Solution {
        public int solution(int[] nums, int val) {
          int k = 0;
          for (int x : nums) {
            if (x != val) nums[k++] = x;
          }
          return k;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums, int val) {
          int k = 0;
          for (int x : nums) {
            if (x != val) nums[k++] = x;
          }
          return k;
        }
      };`
    }
  },

  {
    title: 'Rotate Array',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an integer array \`nums\`, rotate the array to the right by \`k\` steps, where \`k\` is non-negative.

### **Example 1:**
**Input:** nums = [1,2,3,4,5,6,7], k = 3
**Output:** [5,6,7,1,2,3,4]
**Explanation:**
rotate 1 steps to the right: [7,1,2,3,4,5,6]
rotate 2 steps to the right: [6,7,1,2,3,4,5]
rotate 3 steps to the right: [5,6,7,1,2,3,4]

### **Example 2:**
**Input:** nums = [-1,-100,3,99], k = 2
**Output:** [3,99,-1,-100]
**Explanation:**
rotate 1 steps to the right: [99,-1,-100,3]
rotate 2 steps to the right: [3,99,-1,-100]

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\`
- \`0 <= k <= 10⁵\``,
    sample_input: '[1,2,3,4,5,6,7], 3',
    sample_output: '[5,6,7,1,2,3,4]',
    test_cases: [
      { input: '[1,2,3,4,5,6,7], 3', output: '[5,6,7,1,2,3,4]', is_hidden: false },
      { input: '[-1,-100,3,99], 2', output: '[3,99,-1,-100]', is_hidden: false },
      { input: '[1,2], 3', output: '[2,1]', is_hidden: false },
      { input: '[1], 0', output: '[1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, k) {
        k %= nums.length;
        function reverse(l, r) {
          while (l < r) {
            const temp = nums[l];
            nums[l] = nums[r];
            nums[r] = temp;
            l++; r--;
          }
        }
        reverse(0, nums.length - 1);
        reverse(0, k - 1);
        reverse(k, nums.length - 1);
        return nums;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], k: int) -> None:
        k %= len(nums)
        def rev(l, r):
            while l < r:
                nums[l], nums[r] = nums[r], nums[l]
                l += 1; r -= 1
        rev(0, len(nums) - 1)
        rev(0, k - 1)
        rev(k, len(nums) - 1)`,
      java: `class Solution {
        public void solution(int[] nums, int k) {
          k %= nums.length;
          reverse(nums, 0, nums.length - 1);
          reverse(nums, 0, k - 1);
          reverse(nums, k, nums.length - 1);
        }
        private void reverse(int[] nums, int l, int r) {
          while (l < r) {
            int t = nums[l]; nums[l] = nums[r]; nums[r] = t;
            l++; r--;
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void solution(vector<int>& nums, int k) {
          k %= nums.size();
          reverse(nums.begin(), nums.end());
          reverse(nums.begin(), nums.begin() + k);
          reverse(nums.begin() + k, nums.end());
        }
      };`
    }
  },

  {
    title: 'Sort Colors',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an array \`nums\` with \`n\` objects colored red, white, or blue, sort them **in-place** so that objects of the same color are adjacent, with the colors in the order red, white, and blue.

We will use the integers \`0\`, \`1\`, and \`2\` to represent the color red, white, and blue, respectively.

You must solve this problem without using the library's sort function.

### **Example 1:**
**Input:** nums = [2,0,2,1,1,0]
**Output:** [0,0,1,1,2,2]

### **Example 2:**
**Input:** nums = [2,0,1]
**Output:** [0,1,2]

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 300\`
- \`nums[i]\` is either \`0\`, \`1\`, or \`2\`.`,
    sample_input: '[2,0,2,1,1,0]',
    sample_output: '[0,0,1,1,2,2]',
    test_cases: [
      { input: '[2,0,2,1,1,0]', output: '[0,0,1,1,2,2]', is_hidden: false },
      { input: '[2,0,1]', output: '[0,1,2]', is_hidden: false },
      { input: '[0]', output: '[0]', is_hidden: false },
      { input: '[1,0]', output: '[0,1]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        let low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
          if (nums[mid] === 0) {
            [nums[low], nums[mid]] = [nums[mid], nums[low]];
            low++; mid++;
          } else if (nums[mid] === 1) {
            mid++;
          } else {
            [nums[mid], nums[high]] = [nums[high], nums[mid]];
            high--;
          }
        }
        return nums;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> None:
        low, mid, high = 0, 0, len(nums) - 1
        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1; mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1`,
      java: `class Solution {
        public void solution(int[] nums) {
          int low = 0, mid = 0, high = nums.length - 1;
          while (mid <= high) {
            if (nums[mid] == 0) {
              int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;
              low++; mid++;
            } else if (nums[mid] == 1) {
              mid++;
            } else {
              int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;
              high--;
            }
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void solution(vector<int>& nums) {
          int low = 0, mid = 0, high = nums.size() - 1;
          while (mid <= high) {
            if (nums[mid] == 0) {
              swap(nums[low++], nums[mid++]);
            } else if (nums[mid] == 1) {
              mid++;
            } else {
              swap(nums[mid], nums[high--]);
            }
          }
        }
      };`
    }
  },

  {
    title: 'Rotate Image',
    topic: 'arrays',
    difficulty: 'medium',
    description: `You are given an \`n x n\` 2D \`matrix\` representing an image, rotate the image by **90** degrees (clockwise).

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.

### **Example 1:**
\`\`\`
1 2 3      7 4 1
4 5 6  ->  8 5 2
7 8 9      9 6 3
\`\`\`
**Input:** matrix = [[1,2,3],[4,5,6],[7,8,9]]
**Output:** [[7,4,1],[8,5,2],[9,6,3]]

### **Example 2:**
**Input:** matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
**Output:** [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]

### **Constraints:**
- \`n == matrix.length == matrix[i].length\`
- \`1 <= n <= 20\`
- \`-1000 <= matrix[i][j] <= 1000\``,
    sample_input: '[[1,2,3],[4,5,6],[7,8,9]]',
    sample_output: '[[7,4,1],[8,5,2],[9,6,3]]',
    test_cases: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]', is_hidden: false },
      { input: '[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', output: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]', is_hidden: false },
      { input: '[[1]]', output: '[[1]]', is_hidden: false },
      { input: '[[1,2],[3,4]]', output: '[[3,1],[4,2]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(matrix) {
        const n = matrix.length;
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
          }
        }
        for (let i = 0; i < n; i++) matrix[i].reverse();
        return matrix;
      }`,
      py: `class Solution:
    def solution(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for row in matrix:
            row.reverse()`,
      java: `class Solution {
        public void solution(int[][] matrix) {
          int n = matrix.length;
          for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
              int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
            }
          }
          for (int i = 0; i < n; i++) {
            int l = 0, r = n - 1;
            while (l < r) {
              int t = matrix[i][l]; matrix[i][l] = matrix[i][r]; matrix[i][r] = t;
              l++; r--;
            }
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void solution(vector<vector<int>>& matrix) {
          int n = matrix.size();
          for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
              swap(matrix[i][j], matrix[j][i]);
            }
          }
          for (int i = 0; i < n; i++) {
            reverse(matrix[i].begin(), matrix[i].end());
          }
        }
      };`
    }
  },

  {
    title: 'Set Matrix Zeroes',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an \`m x n\` integer matrix \`matrix\`, if an element is \`0\`, set its entire row and column to \`0\`'s.

You must do it **in place**.

### **Example 1:**
\`\`\`
1 1 1      1 0 1
1 0 1  ->  0 0 0
1 1 1      1 0 1
\`\`\`
**Input:** matrix = [[1,1,1],[1,0,1],[1,1,1]]
**Output:** [[1,0,1],[0,0,0],[1,0,1]]

### **Example 2:**
**Input:** matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
**Output:** [[0,0,0,0],[0,4,5,0],[0,3,1,0]]

### **Constraints:**
- \`m == matrix.length\`
- \`n == matrix[0].length\`
- \`1 <= m, n <= 200\`
- \`-2³¹ <= matrix[i][j] <= 2³¹ - 1\``,
    sample_input: '[[1,1,1],[1,0,1],[1,1,1]]',
    sample_output: '[[1,0,1],[0,0,0],[1,0,1]]',
    test_cases: [
      { input: '[[1,1,1],[1,0,1],[1,1,1]]', output: '[[1,0,1],[0,0,0],[1,0,1]]', is_hidden: false },
      { input: '[[0,1,2,0],[3,4,5,2],[1,3,1,5]]', output: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]', is_hidden: false },
      { input: '[[1,0]]', output: '[[0,0]]', is_hidden: false },
      { input: '[[1]]', output: '[[1]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(matrix) {
        const m = matrix.length, n = matrix[0].length;
        const rows = new Set(), cols = new Set();
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (matrix[i][j] === 0) { rows.add(i); cols.add(j); }
          }
        }
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            if (rows.has(i) || cols.has(j)) matrix[i][j] = 0;
          }
        }
        return matrix;
      }`,
      py: `class Solution:
    def solution(self, matrix: List[List[int]]) -> None:
        m, n = len(matrix), len(matrix[0])
        rows, cols = set(), set()
        for i in range(m):
            for j in range(n):
                if matrix[i][j] == 0:
                    rows.add(i); cols.add(j)
        for i in range(m):
            for j in range(n):
                if i in rows or j in cols:
                    matrix[i][j] = 0`,
      java: `class Solution {
        public void solution(int[][] matrix) {
          int m = matrix.length, n = matrix[0].length;
          Set<Integer> rows = new HashSet<>(), cols = new HashSet<>();
          for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
              if (matrix[i][j] == 0) { rows.add(i); cols.add(j); }
            }
          }
          for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
              if (rows.contains(i) || cols.contains(j)) matrix[i][j] = 0;
            }
          }
        }
      }`,
      cpp: `class Solution {
      public:
        void solution(vector<vector<int>>& matrix) {
          int m = matrix.size(), n = matrix[0].size();
          unordered_set<int> rows, cols;
          for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
              if (matrix[i][j] == 0) { rows.insert(i); cols.insert(j); }
            }
          }
          for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
              if (rows.count(i) || cols.count(j)) matrix[i][j] = 0;
            }
          }
        }
      };`
    }
  },

  {
    title: 'Merge Intervals',
    topic: 'intervals',
    difficulty: 'medium',
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.

### **Example 1:**
**Input:** intervals = [[1,3],[2,6],[8,10],[15,18]]
**Output:** [[1,6],[8,10],[15,18]]
**Explanation:** Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

### **Example 2:**
**Input:** intervals = [[1,4],[4,5]]
**Output:** [[1,5]]

### **Constraints:**
- \`1 <= intervals.length <= 10⁴\`
- \`intervals[i].length == 2\`
- \`0 <= starti <= endi <= 10⁴\``,
    sample_input: '[[1,3],[2,6],[8,10],[15,18]]',
    sample_output: '[[1,6],[8,10],[15,18]]',
    test_cases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', is_hidden: false },
      { input: '[[1,4],[4,5]]', output: '[[1,5]]', is_hidden: false },
      { input: '[[1,4],[0,4]]', output: '[[0,4]]', is_hidden: false },
      { input: '[[1,4],[2,3]]', output: '[[1,4]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(intervals) {
        if (!intervals.length) return [];
        intervals.sort((a, b) => a[0] - b[0]);
        const res = [intervals[0]];
        for (let i = 1; i < intervals.length; i++) {
          const prev = res[res.length - 1];
          const curr = intervals[i];
          if (curr[0] <= prev[1]) {
            prev[1] = Math.max(prev[1], curr[1]);
          } else {
            res.push(curr);
          }
        }
        return res;
      }`,
      py: `class Solution:
    def solution(self, intervals: List[List[int]]) -> List[List[int]]:
        if not intervals: return []
        intervals.sort(key=lambda x: x[0])
        res = [intervals[0]]
        for curr in intervals[1:]:
            if curr[0] <= res[-1][1]:
                res[-1][1] = max(res[-1][1], curr[1])
            else:
                res.append(curr)
        return res`,
      java: `class Solution {
        public int[][] solution(int[][] intervals) {
          if (intervals.length == 0) return new int[0][0];
          Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
          List<int[]> res = new ArrayList<>();
          res.add(intervals[0]);
          for (int i = 1; i < intervals.length; i++) {
            int[] prev = res.get(res.size() - 1);
            int[] curr = intervals[i];
            if (curr[0] <= prev[1]) {
              prev[1] = Math.max(prev[1], curr[1]);
            } else {
              res.add(curr);
            }
          }
          return res.toArray(new int[res.size()][]);
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(vector<vector<int>>& intervals) {
          if (intervals.empty()) return {};
          sort(intervals.begin(), intervals.end());
          vector<vector<int>> res;
          res.push_back(intervals[0]);
          for (size_t i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= res.back()[1]) {
              res.back()[1] = max(res.back()[1], intervals[i][1]);
            } else {
              res.push_back(intervals[i]);
            }
          }
          return res;
        }
      };`
    }
  },

  {
    title: 'Insert Interval',
    topic: 'intervals',
    difficulty: 'medium',
    description: `You are given an array of non-overlapping intervals \`intervals\` where \`intervals[i] = [starti, endi]\` represent the start and the end of the \`iᵗʰ\` interval and \`intervals\` is sorted in ascending order by \`starti\`. You are also given an interval \`newInterval = [start, end]\` that represents the start and end of another interval.

Insert \`newInterval\` into \`intervals\` such that \`intervals\` is still sorted in ascending order by \`starti\` and \`intervals\` still does not have any overlapping intervals (merge overlapping intervals if necessary).

Return \`intervals\` *after the insertion*.

### **Example 1:**
**Input:** intervals = [[1,3],[6,9]], newInterval = [2,5]
**Output:** [[1,5],[6,9]]

### **Example 2:**
**Input:** intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
**Output:** [[1,2],[3,10],[12,16]]
**Explanation:** Because the new interval [4,8] overlaps with [3,5],[6,7],[8,10].

### **Constraints:**
- \`0 <= intervals.length <= 10⁴\`
- \`intervals[i].length == 2\`
- \`0 <= starti <= endi <= 10⁵\`
- \`intervals\` is sorted by \`starti\` in **ascending** order.
- \`newInterval.length == 2\`
- \`0 <= start <= end <= 10⁵\``,
    sample_input: '[[1,3],[6,9]], [2,5]',
    sample_output: '[[1,5],[6,9]]',
    test_cases: [
      { input: '[[1,3],[6,9]], [2,5]', output: '[[1,5],[6,9]]', is_hidden: false },
      { input: '[[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]', output: '[[1,2],[3,10],[12,16]]', is_hidden: false },
      { input: '[], [5,7]', output: '[[5,7]]', is_hidden: false },
      { input: '[[1,5]], [2,3]', output: '[[1,5]]', is_hidden: true }
    ],
    solutions: {
      js: `function solution(intervals, newInterval) {
        const res = [];
        let i = 0, n = intervals.length;
        while (i < n && intervals[i][1] < newInterval[0]) {
          res.push(intervals[i++]);
        }
        while (i < n && intervals[i][0] <= newInterval[1]) {
          newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
          newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
          i++;
        }
        res.push(newInterval);
        while (i < n) res.push(intervals[i++]);
        return res;
      }`,
      py: `class Solution:
    def solution(self, intervals: List[List[int]], newInterval: List[int]) -> List[List[int]]:
        res, i, n = [], 0, len(intervals)
        while i < n and intervals[i][1] < newInterval[0]:
            res.append(intervals[i]); i += 1
        while i < n and intervals[i][0] <= newInterval[1]:
            newInterval[0] = min(newInterval[0], intervals[i][0])
            newInterval[1] = max(newInterval[1], intervals[i][1])
            i += 1
        res.append(newInterval)
        while i < n:
            res.append(intervals[i]); i += 1
        return res`,
      java: `class Solution {
        public int[][] solution(int[][] intervals, int[] newInterval) {
          List<int[]> res = new ArrayList<>();
          int i = 0, n = intervals.length;
          while (i < n && intervals[i][1] < newInterval[0]) {
            res.add(intervals[i++]);
          }
          while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
          }
          res.add(newInterval);
          while (i < n) res.add(intervals[i++]);
          return res.toArray(new int[res.size()][]);
        }
      }`,
      cpp: `class Solution {
      public:
        vector<vector<int>> solution(vector<vector<int>>& intervals, vector<int>& newInterval) {
          vector<vector<int>> res;
          int i = 0, n = intervals.size();
          while (i < n && intervals[i][1] < newInterval[0]) {
            res.push_back(intervals[i++]);
          }
          while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = min(newInterval[0], intervals[i][0]);
            newInterval[1] = max(newInterval[1], intervals[i][1]);
            i++;
          }
          res.push_back(newInterval);
          while (i < n) res.push_back(intervals[i++]);
          return res;
        }
      };`
    }
  },

  {
    title: 'Trapping Rain Water',
    topic: 'arrays',
    difficulty: 'hard',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.

### **Example 1:**
\`\`\`
       |
   |   || |
_|_||_||||||_
 0 1 0 2 1 0 1 3 2 1 2 1
\`\`\`
**Input:** height = [0,1,0,2,1,0,1,3,2,1,2,1]
**Output:** 6
**Explanation:** The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.

### **Example 2:**
**Input:** height = [4,2,0,3,2,5]
**Output:** 9

### **Constraints:**
- \`n == height.length\`
- \`1 <= n <= 2 * 10⁴\`
- \`0 <= height[i] <= 10⁵\``,
    sample_input: '[0,1,0,2,1,0,1,3,2,1,2,1]',
    sample_output: '6',
    test_cases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', is_hidden: false },
      { input: '[4,2,0,3,2,5]', output: '9', is_hidden: false },
      { input: '[1,1,1]', output: '0', is_hidden: false },
      { input: '[3,0,2,0,4]', output: '7', is_hidden: true }
    ],
    solutions: {
      js: `function solution(height) {
        let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
          if (height[l] < height[r]) {
            if (height[l] >= leftMax) leftMax = height[l];
            else water += leftMax - height[l];
            l++;
          } else {
            if (height[r] >= rightMax) rightMax = height[r];
            else water += rightMax - height[r];
            r--;
          }
        }
        return water;
      }`,
      py: `class Solution:
    def solution(self, height: List[int]) -> int:
        l, r = 0, len(height) - 1
        l_max, r_max, water = 0, 0, 0
        while l < r:
            if height[l] < height[r]:
                if height[l] >= l_max: l_max = height[l]
                else: water += l_max - height[l]
                l += 1
            else:
                if height[r] >= r_max: r_max = height[r]
                else: water += r_max - height[r]
                r -= 1
        return water`,
      java: `class Solution {
        public int solution(int[] height) {
          int l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
          while (l < r) {
            if (height[l] < height[r]) {
              if (height[l] >= leftMax) leftMax = height[l];
              else water += leftMax - height[l];
              l++;
            } else {
              if (height[r] >= rightMax) rightMax = height[r];
              else water += rightMax - height[r];
              r--;
            }
          }
          return water;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& height) {
          int l = 0, r = height.size() - 1, leftMax = 0, rightMax = 0, water = 0;
          while (l < r) {
            if (height[l] < height[r]) {
              if (height[l] >= leftMax) leftMax = height[l];
              else water += leftMax - height[l];
              l++;
            } else {
              if (height[r] >= rightMax) rightMax = height[r];
              else water += rightMax - height[r];
              r--;
            }
          }
          return water;
        }
      };`
    }
  },

  {
    title: 'Largest Rectangle in Histogram',
    topic: 'arrays',
    difficulty: 'hard',
    description: `Given an array of integers \`heights\` representing the histogram's bar height where the width of each bar is \`1\`, return *the area of the largest rectangle in the histogram*.

### **Example 1:**
\`\`\`
       |
     | |
     | |
     | |   |
 |   | | | |
_|_|_|_|_|_|_
 2 1 5 6 2 3
\`\`\`
**Input:** heights = [2,1,5,6,2,3]
**Output:** 10
**Explanation:** The largest rectangle is shown with area = 10 units (height 5 * width 2).

### **Example 2:**
**Input:** heights = [2,4]
**Output:** 4

### **Constraints:**
- \`1 <= heights.length <= 10⁵\`
- \`0 <= heights[i] <= 10⁴\``,
    sample_input: '[2,1,5,6,2,3]',
    sample_output: '10',
    test_cases: [
      { input: '[2,1,5,6,2,3]', output: '10', is_hidden: false },
      { input: '[2,4]', output: '4', is_hidden: false },
      { input: '[1]', output: '1', is_hidden: false },
      { input: '[2,1,2]', output: '3', is_hidden: true }
    ],
    solutions: {
      js: `function solution(heights) {
        const stack = [];
        let maxArea = 0;
        const h = [...heights, 0];
        for (let i = 0; i < h.length; i++) {
          while (stack.length > 0 && h[stack[stack.length - 1]] > h[i]) {
            const height = h[stack.pop()];
            const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
            maxArea = Math.max(maxArea, height * width);
          }
          stack.push(i);
        }
        return maxArea;
      }`,
      py: `class Solution:
    def solution(self, heights: List[int]) -> int:
        stack, max_area = [], 0
        h = heights + [0]
        for i, val in enumerate(h):
            while stack and h[stack[-1]] > val:
                height = h[stack.pop()]
                width = i if not stack else i - stack[-1] - 1
                max_area = max(max_area, height * width)
            stack.append(i)
        return max_area`,
      java: `class Solution {
        public int solution(int[] heights) {
          Stack<Integer> stack = new Stack<>();
          int maxArea = 0, n = heights.length;
          for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] > h) {
              int height = heights[stack.pop()];
              int width = stack.isEmpty() ? i : i - stack.peek() - 1;
              maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
          }
          return maxArea;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& heights) {
          stack<int> st;
          int maxArea = 0, n = heights.size();
          for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!st.empty() && heights[st.top()] > h) {
              int height = heights[st.top()];
              st.pop();
              int width = st.empty() ? i : i - st.top() - 1;
              maxArea = max(maxArea, height * width);
            }
            st.push(i);
          }
          return maxArea;
        }
      };`
    }
  },

  {
    title: 'Median of Two Sorted Arrays',
    topic: 'binary-search',
    difficulty: 'hard',
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return **the median** of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.

### **Example 1:**
**Input:** nums1 = [1,3], nums2 = [2]
**Output:** 2.00000
**Explanation:** merged array = [1,2,3] and median is 2.

### **Example 2:**
**Input:** nums1 = [1,2], nums2 = [3,4]
**Output:** 2.50000
**Explanation:** merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.

### **Constraints:**
- \`nums1.length == m\`
- \`nums2.length == n\`
- \`0 <= m <= 1000\`
- \`0 <= n <= 1000\`
- \`1 <= m + n <= 2000\`
- \`-10⁶ <= nums1[i], nums2[i] <= 10⁶\``,
    sample_input: '[1,3], [2]',
    sample_output: '2.0',
    test_cases: [
      { input: '[1,3], [2]', output: '2.0', is_hidden: false },
      { input: '[1,2], [3,4]', output: '2.5', is_hidden: false },
      { input: '[0,0], [0,0]', output: '0.0', is_hidden: false },
      { input: '[], [1]', output: '1.0', is_hidden: true },
      { input: '[2], []', output: '2.0', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums1, nums2) {
        if (nums1.length > nums2.length) return solution(nums2, nums1);
        const m = nums1.length, n = nums2.length;
        let low = 0, high = m;
        while (low <= high) {
          const p1 = Math.floor((low + high) / 2);
          const p2 = Math.floor((m + n + 1) / 2) - p1;
          const maxLeft1 = (p1 === 0) ? -Infinity : nums1[p1 - 1];
          const minRight1 = (p1 === m) ? Infinity : nums1[p1];
          const maxLeft2 = (p2 === 0) ? -Infinity : nums2[p2 - 1];
          const minRight2 = (p2 === n) ? Infinity : nums2[p2];

          if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            if ((m + n) % 2 === 0) {
              return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2;
            } else {
              return Math.max(maxLeft1, maxLeft2);
            }
          } else if (maxLeft1 > minRight2) {
            high = p1 - 1;
          } else {
            low = p1 + 1;
          }
        }
        return 0.0;
      }`,
      py: `class Solution:
    def solution(self, nums1: List[int], nums2: List[int]) -> float:
        if len(nums1) > len(nums2):
            return self.solution(nums2, nums1)
        m, n = len(nums1), len(nums2)
        low, high = 0, m
        while low <= high:
            p1 = (low + high) // 2
            p2 = (m + n + 1) // 2 - p1
            max_left1 = float('-inf') if p1 == 0 else nums1[p1 - 1]
            min_right1 = float('inf') if p1 == m else nums1[p1]
            max_left2 = float('-inf') if p2 == 0 else nums2[p2 - 1]
            min_right2 = float('inf') if p2 == n else nums2[p2]

            if max_left1 <= min_right2 and max_left2 <= min_right1:
                if (m + n) % 2 == 0:
                    return (max(max_left1, max_left2) + min(min_right1, min_right2)) / 2.0
                else:
                    return float(max(max_left1, max_left2))
            elif max_left1 > min_right2:
                high = p1 - 1
            else:
                low = p1 + 1
        return 0.0`,
      java: `class Solution {
        public double solution(int[] nums1, int[] nums2) {
          if (nums1.length > nums2.length) return solution(nums2, nums1);
          int m = nums1.length, n = nums2.length;
          int low = 0, high = m;
          while (low <= high) {
            int p1 = (low + high) / 2;
            int p2 = (m + n + 1) / 2 - p1;
            int maxLeft1 = (p1 == 0) ? Integer.MIN_VALUE : nums1[p1 - 1];
            int minRight1 = (p1 == m) ? Integer.MAX_VALUE : nums1[p1];
            int maxLeft2 = (p2 == 0) ? Integer.MIN_VALUE : nums2[p2 - 1];
            int minRight2 = (p2 == n) ? Integer.MAX_VALUE : nums2[p2];

            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
              if ((m + n) % 2 == 0) {
                return ((double)Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2.0;
              } else {
                return (double)Math.max(maxLeft1, maxLeft2);
              }
            } else if (maxLeft1 > minRight2) {
              high = p1 - 1;
            } else {
              low = p1 + 1;
            }
          }
          return 0.0;
        }
      }`,
      cpp: `class Solution {
      public:
        double solution(vector<int>& nums1, vector<int>& nums2) {
          if (nums1.size() > nums2.size()) return solution(nums2, nums1);
          int m = nums1.size(), n = nums2.size();
          int low = 0, high = m;
          while (low <= high) {
            int p1 = (low + high) / 2;
            int p2 = (m + n + 1) / 2 - p1;
            int maxLeft1 = (p1 == 0) ? INT_MIN : nums1[p1 - 1];
            int minRight1 = (p1 == m) ? INT_MAX : nums1[p1];
            int maxLeft2 = (p2 == 0) ? INT_MIN : nums2[p2 - 1];
            int minRight2 = (p2 == n) ? INT_MAX : nums2[p2];

            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
              if ((m + n) % 2 == 0) {
                return (max(maxLeft1, maxLeft2) + min(minRight1, minRight2)) / 2.0;
              } else {
                return max(maxLeft1, maxLeft2);
              }
            } else if (maxLeft1 > minRight2) {
              high = p1 - 1;
            } else {
              low = p1 + 1;
            }
          }
          return 0.0;
        }
      };`
    }
  },

  {
    title: 'First Missing Positive',
    topic: 'arrays',
    difficulty: 'hard',
    description: `Given an unsorted integer array \`nums\`, return the smallest positive integer that is not present in \`nums\`.

You must implement an algorithm that runs in \`O(n)\` time and uses \`O(1)\` auxiliary space.

### **Example 1:**
**Input:** nums = [1,2,0]
**Output:** 3
**Explanation:** The numbers in the range [1,2] are all in the array.

### **Example 2:**
**Input:** nums = [3,4,-1,1]
**Output:** 2
**Explanation:** 1 is in the array but 2 is missing.

### **Example 3:**
**Input:** nums = [7,8,9,11,12]
**Output:** 1
**Explanation:** The smallest positive integer 1 is missing.

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-2³¹ <= nums[i] <= 2³¹ - 1\``,
    sample_input: '[1,2,0]',
    sample_output: '3',
    test_cases: [
      { input: '[1,2,0]', output: '3', is_hidden: false },
      { input: '[3,4,-1,1]', output: '2', is_hidden: false },
      { input: '[7,8,9,11,12]', output: '1', is_hidden: false },
      { input: '[2]', output: '1', is_hidden: true },
      { input: '[1]', output: '2', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        const n = nums.length;
        for (let i = 0; i < n; i++) {
          while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
            const targetIdx = nums[i] - 1;
            [nums[i], nums[targetIdx]] = [nums[targetIdx], nums[i]];
          }
        }
        for (let i = 0; i < n; i++) {
          if (nums[i] !== i + 1) return i + 1;
        }
        return n + 1;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        n = len(nums)
        for i in range(n):
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                target = nums[i] - 1
                nums[i], nums[target] = nums[target], nums[i]
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1`,
      java: `class Solution {
        public int solution(int[] nums) {
          int n = nums.length;
          for (int i = 0; i < n; i++) {
            while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
              int target = nums[i] - 1;
              int temp = nums[i]; nums[i] = nums[target]; nums[target] = temp;
            }
          }
          for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
          }
          return n + 1;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          int n = nums.size();
          for (int i = 0; i < n; i++) {
            while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
              swap(nums[i], nums[nums[i] - 1]);
            }
          }
          for (int i = 0; i < n; i++) {
            if (nums[i] != i + 1) return i + 1;
          }
          return n + 1;
        }
      };`
    }
  }
];
