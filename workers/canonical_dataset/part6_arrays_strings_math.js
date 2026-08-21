'use strict';

/**
 * Canonical specifications for remaining Array, String, Math, Binary Search, and DP problems.
 */
module.exports = [
  {
    title: 'Best Time to Buy and Sell Stock',
    topic: 'arrays',
    difficulty: 'easy',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`iᵗʰ\` day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return \`0\`.

### **Example 1:**
**Input:** prices = [7,1,5,3,6,4]
**Output:** 5
**Explanation:** Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.

### **Example 2:**
**Input:** prices = [7,6,4,3,1]
**Output:** 0
**Explanation:** In this case, no transactions are done and the max profit = 0.

### **Constraints:**
- \`1 <= prices.length <= 10⁵\`
- \`0 <= prices[i] <= 10⁴\``,
    sample_input: '[7,1,5,3,6,4]',
    sample_output: '5',
    test_cases: [
      { input: '[7,1,5,3,6,4]', output: '5', is_hidden: false },
      { input: '[7,6,4,3,1]', output: '0', is_hidden: false },
      { input: '[1,2]', output: '1', is_hidden: false },
      { input: '[2,4,1]', output: '2', is_hidden: true }
    ],
    solutions: {
      js: `function solution(prices) {
        let minPrice = Infinity, maxProfit = 0;
        for (const p of prices) {
          if (p < minPrice) minPrice = p;
          else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
        }
        return maxProfit;
      }`,
      py: `class Solution:
    def solution(self, prices: List[int]) -> int:
        min_p, max_p = float('inf'), 0
        for p in prices:
            if p < min_p: min_p = p
            elif p - min_p > max_p: max_p = p - min_p
        return max_p`,
      java: `class Solution {
        public int solution(int[] prices) {
          int minPrice = Integer.MAX_VALUE, maxProfit = 0;
          for (int p : prices) {
            if (p < minPrice) minPrice = p;
            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
          }
          return maxProfit;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& prices) {
          int minPrice = INT_MAX, maxProfit = 0;
          for (int p : prices) {
            if (p < minPrice) minPrice = p;
            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
          }
          return maxProfit;
        }
      };`
    }
  },

  {
    title: 'Best Time to Buy and Sell Stock II',
    topic: 'arrays',
    difficulty: 'medium',
    description: `You are given an integer array \`prices\` where \`prices[i]\` is the price of a given stock on the \`iᵗʰ\` day.

On each day, you may decide to buy and/or sell the stock. You can only hold **at most one** share of the stock at any time. However, you can buy it then immediately sell it on the **same day**.

Find and return *the **maximum profit** you can achieve*.

### **Example 1:**
**Input:** prices = [7,1,5,3,6,4]
**Output:** 7
**Explanation:** Buy on day 2 (price = 1) and sell on day 3 (price = 5), profit = 5-1 = 4.
Then buy on day 4 (price = 3) and sell on day 5 (price = 6), profit = 6-3 = 3.
Total profit is 4 + 3 = 7.

### **Example 2:**
**Input:** prices = [1,2,3,4,5]
**Output:** 4
**Explanation:** Buy on day 1 (price = 1) and sell on day 5 (price = 5), profit = 5-1 = 4.

### **Example 3:**
**Input:** prices = [7,6,4,3,1]
**Output:** 0

### **Constraints:**
- \`1 <= prices.length <= 3 * 10⁴\`
- \`0 <= prices[i] <= 10⁴\``,
    sample_input: '[7,1,5,3,6,4]',
    sample_output: '7',
    test_cases: [
      { input: '[7,1,5,3,6,4]', output: '7', is_hidden: false },
      { input: '[1,2,3,4,5]', output: '4', is_hidden: false },
      { input: '[7,6,4,3,1]', output: '0', is_hidden: false },
      { input: '[2,1,2,0,1]', output: '2', is_hidden: true }
    ],
    solutions: {
      js: `function solution(prices) {
        let profit = 0;
        for (let i = 1; i < prices.length; i++) {
          if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
        }
        return profit;
      }`,
      py: `class Solution:
    def solution(self, prices: List[int]) -> int:
        return sum(max(0, prices[i] - prices[i-1]) for i in range(1, len(prices)))`,
      java: `class Solution {
        public int solution(int[] prices) {
          int profit = 0;
          for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
          }
          return profit;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& prices) {
          int profit = 0;
          for (size_t i = 1; i < prices.size(); i++) {
            if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
          }
          return profit;
        }
      };`
    }
  },

  {
    title: 'Maximum Subarray',
    topic: 'arrays',
    difficulty: 'medium',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.

### **Example 1:**
**Input:** nums = [-2,1,-3,4,-1,2,1,-5,4]
**Output:** 6
**Explanation:** The subarray [4,-1,2,1] has the largest sum 6.

### **Example 2:**
**Input:** nums = [1]
**Output:** 1

### **Example 3:**
**Input:** nums = [5,4,-1,7,8]
**Output:** 23

### **Constraints:**
- \`1 <= nums.length <= 10⁵\`
- \`-10⁴ <= nums[i] <= 10⁴\``,
    sample_input: '[-2,1,-3,4,-1,2,1,-5,4]',
    sample_output: '6',
    test_cases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6', is_hidden: false },
      { input: '[1]', output: '1', is_hidden: false },
      { input: '[5,4,-1,7,8]', output: '23', is_hidden: false },
      { input: '[-1]', output: '-1', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        let maxSoFar = nums[0], currMax = nums[0];
        for (let i = 1; i < nums.length; i++) {
          currMax = Math.max(nums[i], currMax + nums[i]);
          maxSoFar = Math.max(maxSoFar, currMax);
        }
        return maxSoFar;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        max_so_far = curr_max = nums[0]
        for x in nums[1:]:
            curr_max = max(x, curr_max + x)
            max_so_far = max(max_so_far, curr_max)
        return max_so_far`,
      java: `class Solution {
        public int solution(int[] nums) {
          int maxSoFar = nums[0], currMax = nums[0];
          for (int i = 1; i < nums.length; i++) {
            currMax = Math.max(nums[i], currMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
          }
          return maxSoFar;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          int maxSoFar = nums[0], currMax = nums[0];
          for (size_t i = 1; i < nums.size(); i++) {
            currMax = max(nums[i], currMax + nums[i]);
            maxSoFar = max(maxSoFar, currMax);
          }
          return maxSoFar;
        }
      };`
    }
  },

  {
    title: 'Jump Game',
    topic: 'arrays',
    difficulty: 'medium',
    description: `You are given an integer array \`nums\`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.

Return \`true\` *if you can reach the last index, or \`false\` otherwise*.

### **Example 1:**
**Input:** nums = [2,3,1,1,4]
**Output:** true
**Explanation:** Jump 1 step from index 0 to 1, then 3 steps to the last index.

### **Example 2:**
**Input:** nums = [3,2,1,0,4]
**Output:** false
**Explanation:** You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`0 <= nums[i] <= 10⁵\``,
    sample_input: '[2,3,1,1,4]',
    sample_output: 'true',
    test_cases: [
      { input: '[2,3,1,1,4]', output: 'true', is_hidden: false },
      { input: '[3,2,1,0,4]', output: 'false', is_hidden: false },
      { input: '[0]', output: 'true', is_hidden: false },
      { input: '[2,0,0]', output: 'true', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        let maxReach = 0;
        for (let i = 0; i < nums.length; i++) {
          if (i > maxReach) return false;
          maxReach = Math.max(maxReach, i + nums[i]);
        }
        return true;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> bool:
        max_reach = 0
        for i, x in enumerate(nums):
            if i > max_reach: return False
            max_reach = max(max_reach, i + x)
        return True`,
      java: `class Solution {
        public boolean solution(int[] nums) {
          int maxReach = 0;
          for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) return false;
            maxReach = Math.max(maxReach, i + nums[i]);
          }
          return true;
        }
      }`,
      cpp: `class Solution {
      public:
        bool solution(vector<int>& nums) {
          int maxReach = 0;
          for (int i = 0; i < nums.size(); i++) {
            if (i > maxReach) return false;
            maxReach = max(maxReach, i + nums[i]);
          }
          return true;
        }
      };`
    }
  },

  {
    title: 'Binary Search',
    topic: 'binary-search',
    difficulty: 'easy',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [-1,0,3,5,9,12], target = 9
**Output:** 4
**Explanation:** 9 exists in nums and its index is 4

### **Example 2:**
**Input:** nums = [-1,0,3,5,9,12], target = 2
**Output:** -1
**Explanation:** 2 does not exist in nums so return -1

### **Constraints:**
- \`1 <= nums.length <= 10⁴\`
- \`-10⁴ < nums[i], target < 10⁴\`
- All the integers in \`nums\` are **unique**.
- \`nums\` is sorted in ascending order.`,
    sample_input: '[-1,0,3,5,9,12], 9',
    sample_output: '4',
    test_cases: [
      { input: '[-1,0,3,5,9,12], 9', output: '4', is_hidden: false },
      { input: '[-1,0,3,5,9,12], 2', output: '-1', is_hidden: false },
      { input: '[5], 5', output: '0', is_hidden: false },
      { input: '[2,5], 0', output: '-1', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, target) {
        let l = 0, r = nums.length - 1;
        while (l <= r) {
          const mid = Math.floor((l + r) / 2);
          if (nums[mid] === target) return mid;
          if (nums[mid] < target) l = mid + 1;
          else r = mid - 1;
        }
        return -1;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target: return mid
            if nums[mid] < target: l = mid + 1
            else: r = mid - 1
        return -1`,
      java: `class Solution {
        public int solution(int[] nums, int target) {
          int l = 0, r = nums.length - 1;
          while (l <= r) {
            int mid = (l + r) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
          }
          return -1;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums, int target) {
          int l = 0, r = nums.size() - 1;
          while (l <= r) {
            int mid = (l + r) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
          }
          return -1;
        }
      };`
    }
  },

  {
    title: 'Search in Rotated Sorted Array',
    topic: 'binary-search',
    difficulty: 'medium',
    description: `There is an integer array \`nums\` sorted in ascending order (with **distinct** values).

Prior to being passed to your function, \`nums\` is **possibly rotated** at an unknown pivot index \`k\` (\`1 <= k < nums.length\`) such that the resulting array is \`[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]\` (**0-indexed**).

Given the array \`nums\` after the possible rotation and an integer \`target\`, return *the index of* \`target\` *if it is in* \`nums\`, *or* \`-1\` *if it is not in* \`nums\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

### **Example 1:**
**Input:** nums = [4,5,6,7,0,1,2], target = 0
**Output:** 4

### **Example 2:**
**Input:** nums = [4,5,6,7,0,1,2], target = 3
**Output:** -1

### **Example 3:**
**Input:** nums = [1], target = 0
**Output:** -1

### **Constraints:**
- \`1 <= nums.length <= 5000\`
- \`-10⁴ <= nums[i] <= 10⁴\`
- All values of \`nums\` are **unique**.
- \`nums\` is an ascending array that is possibly rotated.
- \`-10⁴ <= target <= 10⁴\``,
    sample_input: '[4,5,6,7,0,1,2], 0',
    sample_output: '4',
    test_cases: [
      { input: '[4,5,6,7,0,1,2], 0', output: '4', is_hidden: false },
      { input: '[4,5,6,7,0,1,2], 3', output: '-1', is_hidden: false },
      { input: '[1], 0', output: '-1', is_hidden: false },
      { input: '[5,1,3], 5', output: '0', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums, target) {
        let l = 0, r = nums.length - 1;
        while (l <= r) {
          const mid = Math.floor((l + r) / 2);
          if (nums[mid] === target) return mid;
          if (nums[l] <= nums[mid]) {
            if (nums[l] <= target && target < nums[mid]) r = mid - 1;
            else l = mid + 1;
          } else {
            if (nums[mid] < target && target <= nums[r]) l = mid + 1;
            else r = mid - 1;
          }
        }
        return -1;
      }`,
      py: `class Solution:
    def solution(self, nums: List[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target: return mid
            if nums[l] <= nums[mid]:
                if nums[l] <= target < nums[mid]: r = mid - 1
                else: l = mid + 1
            else:
                if nums[mid] < target <= nums[r]: l = mid + 1
                else: r = mid - 1
        return -1`,
      java: `class Solution {
        public int solution(int[] nums, int target) {
          int l = 0, r = nums.length - 1;
          while (l <= r) {
            int mid = (l + r) / 2;
            if (nums[mid] == target) return mid;
            if (nums[l] <= nums[mid]) {
              if (nums[l] <= target && target < nums[mid]) r = mid - 1;
              else l = mid + 1;
            } else {
              if (nums[mid] < target && target <= nums[r]) l = mid + 1;
              else r = mid - 1;
            }
          }
          return -1;
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums, int target) {
          int l = 0, r = nums.size() - 1;
          while (l <= r) {
            int mid = (l + r) / 2;
            if (nums[mid] == target) return mid;
            if (nums[l] <= nums[mid]) {
              if (nums[l] <= target && target < nums[mid]) r = mid - 1;
              else l = mid + 1;
            } else {
              if (nums[mid] < target && target <= nums[r]) l = mid + 1;
              else r = mid - 1;
            }
          }
          return -1;
        }
      };`
    }
  },

  {
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'binary-search',
    difficulty: 'medium',
    description: `Suppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times.

Given the sorted rotated array \`nums\` of **unique** elements, return *the minimum element of this array*.

You must write an algorithm that runs in \`O(log n)\` time.

### **Example 1:**
**Input:** nums = [3,4,5,1,2]
**Output:** 1
**Explanation:** The original array was [1,2,3,4,5] rotated 3 times.

### **Example 2:**
**Input:** nums = [4,5,6,7,0,1,2]
**Output:** 0
**Explanation:** The original array was [0,1,2,4,5,6,7] and it was rotated 4 times.

### **Example 3:**
**Input:** nums = [11,13,15,17]
**Output:** 11

### **Constraints:**
- \`n == nums.length\`
- \`1 <= n <= 5000\`
- \`-5000 <= nums[i] <= 5000\`
- All the integers of \`nums\` are **unique**.\``,
    sample_input: '[3,4,5,1,2]',
    sample_output: '1',
    test_cases: [
      { input: '[3,4,5,1,2]', output: '1', is_hidden: false },
      { input: '[4,5,6,7,0,1,2]', output: '0', is_hidden: false },
      { input: '[11,13,15,17]', output: '11', is_hidden: false },
      { input: '[2,1]', output: '1', is_hidden: true }
    ],
    solutions: {
      js: `function solution(nums) {
        let l = 0, r = nums.length - 1;
        while (l < r) {
          const mid = Math.floor((l + r) / 2);
          if (nums[mid] > nums[r]) l = mid + 1;
          else r = mid;
        }
        return nums[l];
      }`,
      py: `class Solution:
    def solution(self, nums: List[int]) -> int:
        l, r = 0, len(nums) - 1
        while l < r:
            mid = (l + r) // 2
            if nums[mid] > nums[r]: l = mid + 1
            else: r = mid
        return nums[l]`,
      java: `class Solution {
        public int solution(int[] nums) {
          int l = 0, r = nums.length - 1;
          while (l < r) {
            int mid = (l + r) / 2;
            if (nums[mid] > nums[r]) l = mid + 1;
            else r = mid;
          }
          return nums[l];
        }
      }`,
      cpp: `class Solution {
      public:
        int solution(vector<int>& nums) {
          int l = 0, r = nums.size() - 1;
          while (l < r) {
            int mid = (l + r) / 2;
            if (nums[mid] > nums[r]) l = mid + 1;
            else r = mid;
          }
          return nums[l];
        }
      };`
    }
  }
];
