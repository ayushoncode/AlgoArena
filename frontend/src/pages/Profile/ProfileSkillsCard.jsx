import React, { useState, useMemo } from 'react'

const TOPIC_CANONICAL = {
  // Advanced
  'dp': { title: 'Dynamic Programming', tier: 'advanced' },
  'dynamic programming': { title: 'Dynamic Programming', tier: 'advanced' },
  'backtracking': { title: 'Backtracking', tier: 'advanced' },
  'monotonic stack': { title: 'Monotonic Stack', tier: 'advanced' },
  'segment tree': { title: 'Segment Tree', tier: 'advanced' },
  'trie': { title: 'Trie', tier: 'advanced' },
  'graph': { title: 'Graph', tier: 'advanced' },
  'graphs': { title: 'Graph', tier: 'advanced' },
  'topological sort': { title: 'Topological Sort', tier: 'advanced' },
  'union find': { title: 'Union Find', tier: 'advanced' },
  'game theory': { title: 'Game Theory', tier: 'advanced' },
  'divide and conquer': { title: 'Divide and Conquer', tier: 'advanced' },
  'shortest path': { title: 'Shortest Path', tier: 'advanced' },

  // Intermediate
  'hash table': { title: 'Hash Table', tier: 'intermediate' },
  'hashmap': { title: 'Hash Table', tier: 'intermediate' },
  'math': { title: 'Math', tier: 'intermediate' },
  'tree': { title: 'Tree', tier: 'intermediate' },
  'trees': { title: 'Tree', tier: 'intermediate' },
  'binary tree': { title: 'Binary Tree', tier: 'intermediate' },
  'bst': { title: 'Binary Search Tree', tier: 'intermediate' },
  'binary search tree': { title: 'Binary Search Tree', tier: 'intermediate' },
  'bfs': { title: 'Breadth-First Search', tier: 'intermediate' },
  'breadth first search': { title: 'Breadth-First Search', tier: 'intermediate' },
  'dfs': { title: 'Depth-First Search', tier: 'intermediate' },
  'depth first search': { title: 'Depth-First Search', tier: 'intermediate' },
  'heap': { title: 'Heap', tier: 'intermediate' },
  'priority queue': { title: 'Heap', tier: 'intermediate' },
  'greedy': { title: 'Greedy', tier: 'intermediate' },
  'sliding window': { title: 'Sliding Window', tier: 'intermediate' },
  'bit manipulation': { title: 'Bit Manipulation', tier: 'intermediate' },
  'matrix': { title: 'Matrix', tier: 'intermediate' },
  'prefix sum': { title: 'Prefix Sum', tier: 'intermediate' },
  'recursion': { title: 'Recursion', tier: 'intermediate' },

  // Fundamental
  'array': { title: 'Array', tier: 'fundamental' },
  'arrays': { title: 'Array', tier: 'fundamental' },
  'string': { title: 'String', tier: 'fundamental' },
  'strings': { title: 'String', tier: 'fundamental' },
  'two pointer': { title: 'Two Pointers', tier: 'fundamental' },
  'two pointers': { title: 'Two Pointers', tier: 'fundamental' },
  'linked list': { title: 'Linked List', tier: 'fundamental' },
  'linked lists': { title: 'Linked List', tier: 'fundamental' },
  'stack': { title: 'Stack', tier: 'fundamental' },
  'stacks': { title: 'Stack', tier: 'fundamental' },
  'queue': { title: 'Queue', tier: 'fundamental' },
  'queues': { title: 'Queue', tier: 'fundamental' },
  'binary search': { title: 'Binary Search', tier: 'fundamental' },
  'sorting': { title: 'Sorting', tier: 'fundamental' },
  'simulation': { title: 'Simulation', tier: 'fundamental' },
  'counting': { title: 'Counting', tier: 'fundamental' },
}

const TIERS = [
  { key: 'advanced', label: 'Advanced', dotColor: '#ef4444' },
  { key: 'intermediate', label: 'Intermediate', dotColor: '#f59e0b' },
  { key: 'fundamental', label: 'Fundamental', dotColor: '#22c55e' },
]

export default function ProfileSkillsCard({ topicFreq = {}, matches = [], eloHistory = [] }) {
  const [expanded, setExpanded] = useState({
    advanced: false,
    intermediate: false,
    fundamental: false,
  })

  // Compute skill counts and classify into tiers
  const classifiedSkills = useMemo(() => {
    const countsMap = {}

    // 1. Gather counts from eloHistory (contains all completed matches with topic)
    if (Array.isArray(eloHistory) && eloHistory.length > 0) {
      eloHistory.forEach((e) => {
        if (!e.topic) return
        const norm = e.topic.toLowerCase().replace(/[-_]/g, ' ').trim()
        countsMap[norm] = (countsMap[norm] || 0) + 1
      })
    } else if (Array.isArray(matches)) {
      // Fallback to matches list
      matches.forEach((m) => {
        if (!m.topic) return
        const norm = m.topic.toLowerCase().replace(/[-_]/g, ' ').trim()
        countsMap[norm] = (countsMap[norm] || 0) + 1
      })
    }

    // 2. Merge topicFreq if counts higher
    Object.entries(topicFreq || {}).forEach(([k, c]) => {
      const norm = k.toLowerCase().replace(/[-_]/g, ' ').trim()
      countsMap[norm] = Math.max(countsMap[norm] || 0, Number(c) || 0)
    })

    const groups = {
      advanced: [],
      intermediate: [],
      fundamental: [],
    }

    // 3. Classify each topic
    Object.entries(countsMap).forEach(([normKey, count]) => {
      if (count <= 0) return
      const canonical = TOPIC_CANONICAL[normKey]
      let tier = canonical ? canonical.tier : 'fundamental'
      let title = canonical
        ? canonical.title
        : normKey.replace(/\b\w/g, (l) => l.toUpperCase())

      if (!canonical) {
        if (normKey.includes('dp') || normKey.includes('graph')) {
          tier = 'advanced'
        } else if (normKey.includes('tree') || normKey.includes('math')) {
          tier = 'intermediate'
        }
      }

      groups[tier].push({
        key: normKey,
        title,
        count,
      })
    })

    // Sort descending by count in each tier
    TIERS.forEach((t) => {
      groups[t.key].sort((a, b) => b.count - a.count)
    })

    return groups
  }, [topicFreq, matches, eloHistory])

  const totalSkillsCount =
    classifiedSkills.advanced.length +
    classifiedSkills.intermediate.length +
    classifiedSkills.fundamental.length

  const toggleTier = (tierKey) => {
    setExpanded((prev) => ({ ...prev, [tierKey]: !prev[tierKey] }))
  }

  return (
    <div className="sidebar-skills-section">
      <div className="sidebar-divider" />
      <div className="skills-card-header">
        <h3 className="skills-card-title">Skills</h3>
      </div>

      {totalSkillsCount === 0 ? (
        <p className="skills-empty-text">
          No skills recorded yet. Complete matches to see your skills.
        </p>
      ) : (
        <div className="skills-tier-list">
          {TIERS.map((tier) => {
            const items = classifiedSkills[tier.key]
            if (items.length === 0) return null

            const isExpanded = expanded[tier.key]
            const visibleItems = isExpanded ? items : items.slice(0, 3)
            const hasMore = items.length > 3

            return (
              <div key={tier.key} className="skills-tier-section">
                {/* Tier Title with Dot */}
                <div className="skills-tier-header">
                  <span
                    className="skills-tier-dot"
                    style={{ backgroundColor: tier.dotColor }}
                    aria-hidden="true"
                  />
                  <span className="skills-tier-label">{tier.label}</span>
                </div>

                {/* Pill Tags */}
                <div className="skills-pill-group">
                  {visibleItems.map((item) => (
                    <div key={item.key} className="skill-pill">
                      <span className="skill-pill-name">{item.title}</span>
                      <span className="skill-pill-count">x{item.count}</span>
                    </div>
                  ))}
                </div>

                {/* Show more / Show less Toggle */}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => toggleTier(tier.key)}
                    className="skill-expand-btn"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
