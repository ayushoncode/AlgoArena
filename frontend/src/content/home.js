/**
 * Single source of truth for AlgoArena home page content.
 * Plain, specific, human. No marketing jargon.
 * Rules:
 * - No em dashes (U+2014 or U+2013). Use commas, colons or periods.
 * - No banned buzzwords.
 * - No emojis.
 * - All numbers reflect real code and config.
 */

export const HOME_CONFIG = {
  meta: {
    title: 'AlgoArena: 1v1 Real-Time Competitive Coding Duels',
    description: 'Two coders. One problem. First accepted solution wins. Real-time algorithmic duels settled by Elo ratings.',
    canonical: 'https://algoarena.dev/',
  },

  hero: {
    badge: 'Season 1',
    headlineA: 'Two coders. One problem.',
    headlineB: 'First accepted wins.',
    subA: 'Real-time 1v1 coding duels',
    subB: 'settled by Elo.',
    cta: 'Enter the arena',
    footerItems: [
      'Same problem. Same second.',
      'Built for competitive programmers.',
      'Season 1',
    ],
  },

  s1Duel: {
    kicker: '01 / Real-Time Battle',
    title: 'The Duel',
    body: 'Both players receive the exact same problem statement and test suite at the exact same millisecond. Keystrokes, test submissions and execution progress stream live over WebSockets. The first coder to pass every test case wins the duel and claims the Elo points.',
    demoLabel: 'Demo duel',
    problem: {
      title: 'Two Sum',
      difficulty: 'Easy',
      statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      testCount: 25,
      timeLimit: '2000ms',
    },
    playerA: {
      username: 'you',
      language: 'JavaScript',
      rating: 1420,
      gain: 24,
      code: `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    },
    playerB: {
      username: 'rival',
      language: 'Python',
      rating: 1445,
      gain: -22,
      code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []`,
    },
  },

  s2HowItWorks: {
    kicker: '02 / Architecture',
    title: 'How a Match Runs',
    stages: [
      {
        index: '01',
        name: 'Matchmaking',
        summary: 'Enter queue with your Elo rating. The engine searches for an opponent within 100 points, gradually widening the rating window every 5 seconds until a rival is found.',
        detailKey: 'Queue Strategy',
        detailValue: 'In-memory FIFO priority lock with adaptive delta expansion',
      },
      {
        index: '02',
        name: 'Execution',
        summary: 'Both players are synchronized to the same problem statement and private test suite. Your solution runs in an isolated runner with strict memory and CPU caps.',
        detailKey: 'Sandbox Isolation',
        detailValue: 'Docker read-only root, 512MB RAM cap, zero network access',
      },
      {
        index: '03',
        name: 'Live Telemetry',
        summary: 'Opponent test progress, run status and pass counts stream through WebSocket events in real time so you always know where you stand.',
        detailKey: 'Telemetry Delay',
        detailValue: 'Sub-30ms bidirectional WebSocket stream over TLS',
      },
      {
        index: '04',
        name: 'Rating Settlement',
        summary: 'Upon verification of the first accepted solution, the match locks immediately. Elo deltas calculate based on opponent gap, solve speed and problem weight.',
        detailKey: 'K-Factor Model',
        detailValue: 'Adaptive K-Factor (48 calibration, 32 established, 16 GM)',
      },
    ],
  },

  s3Ratings: {
    kicker: '03 / Rating Engine',
    title: 'Rank Tiers',
    description: 'Every duel outcome updates your rating through calibrated Elo brackets. Progress across six distinct skill divisions as you win head-to-head matches.',
    tiers: [
      {
        title: 'Grandmaster',
        badge: 'GM',
        tierNum: '06',
        min: 2000,
        max: null,
        color: '#f97316',
        kFactor: 'K=16',
        desc: 'Top division of arena coders. Governed by a conservative K-factor for maximum rating stability.',
      },
      {
        title: 'Candidate Master',
        badge: 'CM',
        tierNum: '05',
        min: 1800,
        max: 1999,
        color: '#a855f7',
        kFactor: 'K=24',
        desc: 'Elite competitors demonstrating rapid algorithmic derivation and complex edge-case management.',
      },
      {
        title: 'Expert',
        badge: 'EXP',
        tierNum: '04',
        min: 1600,
        max: 1799,
        color: '#3b82f6',
        kFactor: 'K=24',
        desc: 'High solve velocity across medium and hard challenges with minimal failed test submissions.',
      },
      {
        title: 'Specialist',
        badge: 'SPEC',
        tierNum: '03',
        min: 1400,
        max: 1599,
        color: '#06b6d4',
        kFactor: 'K=32',
        desc: 'Proficient across dynamic programming, trees, binary search, and graph traversal algorithms.',
      },
      {
        title: 'Apprentice',
        badge: 'APP',
        tierNum: '02',
        min: 1200,
        max: 1399,
        color: '#10b981',
        kFactor: 'K=32',
        desc: 'Established baseline competitor bracket following initial calibration matches.',
      },
      {
        title: 'Novice',
        badge: 'NOV',
        tierNum: '01',
        min: 100,
        max: 1199,
        color: '#9ca3af',
        kFactor: 'K=48',
        desc: 'Entry division for coders completing their first five placement matches.',
      },
    ],
  },

  s4Sandbox: {
    kicker: '04 / Security & Runtime',
    title: 'Isolated Execution',
    body: 'Every line of code submitted during a duel executes within locked environments. JavaScript evaluates in a segregated virtual machine context. Python, C++ and Java run in dedicated unprivileged Linux containers with complete network isolation.',
    limits: [
      { label: 'Memory Ceiling', value: '512 MB (OOM terminated)' },
      { label: 'CPU Allocation', value: '0.5 Core Quota' },
      { label: 'Process Limit', value: '50 PIDs maximum (fork-bomb guard)' },
      { label: 'Network Access', value: 'Disabled (none)' },
      { label: 'Filesystem', value: 'Read-only root, 64MB tmpfs scratch' },
      { label: 'Time Limit (JS)', value: '2000 ms per run' },
      { label: 'Time Limit (Docker)', value: '8000 ms per container' },
    ],
    languages: [
      {
        id: 'javascript',
        name: 'JavaScript',
        runtime: 'Node.js 20',
        filename: 'solution.js',
        code: `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      },
      {
        id: 'python',
        name: 'Python',
        runtime: 'Python 3.11',
        filename: 'solution.py',
        code: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
      },
      {
        id: 'cpp',
        name: 'C++',
        runtime: 'GCC 12 (C++17)',
        filename: 'solution.cpp',
        code: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            auto it = seen.find(complement);
            if (it != seen.end()) {
                return {it->second, i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      },
      {
        id: 'java',
        name: 'Java',
        runtime: 'OpenJDK 17',
        filename: 'Solution.java',
        code: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      },
    ],
  },

  s5Topics: {
    kicker: '05 / Curriculum',
    title: 'Problem Index',
    body: 'Curated problems spanning fundamental data structures and algorithmic paradigms, indexed with real test suites and hidden test vectors.',
    items: [
      { id: 'arrays', index: '01', title: 'Arrays', desc: 'Prefix sums, two-pointer scans, frequency maps, in-place rotations.', count: 45 },
      { id: 'trees', index: '02', title: 'Trees', desc: 'Depth first traversals, binary search validation, lowest ancestors.', count: 28 },
      { id: 'dp', index: '03', title: 'Dynamic Programming', desc: 'Subsequence memoization, knapsack variants, grid path finding.', count: 24 },
      { id: 'linked-lists', index: '04', title: 'Linked Lists', desc: 'Cycle detection, list reversals, pointer swaps, list intersections.', count: 21 },
      { id: 'binary-search', index: '05', title: 'Binary Search', desc: 'Rotated boundaries, search on monotonic answers, matrix lookups.', count: 14 },
      { id: 'strings', index: '06', title: 'Strings', desc: 'Sliding windows, palindromic checks, rolling hashes, anagram groups.', count: 12 },
      { id: 'two-pointers', index: '07', title: 'Two Pointers', desc: 'Opposite-end convergence, fast and slow runners, interval merging.', count: 11 },
      { id: 'graphs', index: '08', title: 'Graphs', desc: 'Breadth first search, shortest paths, topological ordering, bipartite checks.', count: 7 },
    ],
  },

  s6HallOfHeroes: {
    kicker: '05 / Leaderboard',
    title: 'Top Arena Coders',
    body: 'Rankings calculated from verified head-to-head match results. Updated after every settled duel.',
    emptyNotice: 'Rankings appear after the first matches.',
    fullLinkText: 'Full leaderboard',
  },

  s7Questions: {
    kicker: '06 / Clarifications',
    title: 'Frequently Asked Questions',
    items: [
      {
        q: 'How does matchmaking pair opponents?',
        a: 'The engine looks for active players within 100 Elo points of your rating. Every 5 seconds, the search window expands by 50 points until an opponent is found. You will always be paired with the closest available rival.',
      },
      {
        q: 'What determines the winner of a duel?',
        a: 'The first player whose code passes 100% of the visible and hidden test cases wins immediately. If neither player submits an accepted solution within the 30-minute duel limit, the player passing more test cases wins, or a draw is declared.',
      },
      {
        q: 'Can I choose my programming language?',
        a: 'Yes. JavaScript, Python, C++ and Java are fully supported. Both players may use different languages during the same duel; test cases are identical across all runtimes.',
      },
      {
        q: 'How are rating points calculated?',
        a: 'We use an adapted Elo rating formula. Winning against a higher-rated player yields more points than winning against a lower-rated player. A speed bonus is awarded for solutions submitted under 5, 10 or 20 minutes.',
      },
      {
        q: 'Is there a penalty for wrong submissions?',
        a: 'A minor rating penalty applies for repeated failed submissions during a match, discouraging brute force guessing.',
      },
      {
        q: 'Can I challenge a friend directly?',
        a: 'Yes. Use the Custom Room option in the Lobby to generate a 6-digit room code or share a direct invite link with your friend.',
      },
    ],
  },

  s8FinalCall: {
    kicker: '07 / Next Duel',
    title: 'Enter the arena.',
    body: 'Two coders. One problem. Settle your rating on the live leaderboard.',
    cta: 'Enter the arena',
  },

  footer: {
    brand: 'ALGOARENA',
    tagline: 'Real-time 1v1 algorithmic duels settled by Elo.',
    links: [
      { label: 'Lobby', href: '/lobby' },
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Who We Are', href: '/who-we-are' },
      { label: 'GitHub', href: 'https://github.com/ayushoncode/AlgoArena', external: true },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
    contactEmail: '[TODO: owner to fill contact email]',
    githubUrl: 'https://github.com/ayushoncode/AlgoArena',
    copyrightYear: new Date().getFullYear(),
  },
}
