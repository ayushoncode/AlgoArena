import json

with open('../private/solutions/custom-frequency-sort.json', 'r') as f:
    data = json.load(f)

# The user wants reference solutions in all 4 languages to be tested.
# Since my JSON schema so far just had `referenceSolution: { language, code }`,
# I will change it to `referenceSolutions: { python: "...", javascript: "...", java: "...", cpp: "..." }`.

data['referenceSolutions'] = {
    'python': data['referenceSolution']['code'],
    'javascript': """
function solution(nums) {
    const freq = new Map();
    for (const num of nums) freq.set(num, (freq.get(num) || 0) + 1);
    nums.sort((a, b) => {
        const fa = freq.get(a), fb = freq.get(b);
        if (fa !== fb) return fa - fb;
        return b - a;
    });
    return nums;
}
""",
    'java': """
class Solution {
    public int[] solution(int[] nums) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.put(n, freq.getOrDefault(n, 0) + 1);
        Integer[] objNums = new Integer[nums.length];
        for (int i = 0; i < nums.length; i++) objNums[i] = nums[i];
        Arrays.sort(objNums, (a, b) -> {
            int fa = freq.get(a);
            int fb = freq.get(b);
            if (fa != fb) return Integer.compare(fa, fb);
            return Integer.compare(b, a);
        });
        for (int i = 0; i < nums.length; i++) nums[i] = objNums[i];
        return nums;
    }
}
""",
    'cpp': """
#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums) {
        unordered_map<int, int> freq;
        for (int n : nums) freq[n]++;
        sort(nums.begin(), nums.end(), [&](int a, int b) {
            if (freq[a] != freq[b]) return freq[a] < freq[b];
            return a > b;
        });
        return nums;
    }
};
"""
}

with open('../private/solutions/custom-frequency-sort.json', 'w') as f:
    json.dump(data, f, indent=2)
