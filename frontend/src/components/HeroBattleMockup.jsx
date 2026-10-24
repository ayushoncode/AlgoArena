import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Code2, Terminal } from 'lucide-react'

const typeCode = (code, progress) => {
  const length = Math.floor(code.length * progress)
  return code.substring(0, length)
}

const p1Code = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
}`

const p2Code = `class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            if target - num in seen:
                return [seen[target - num], i]
            seen[num] = i
        return []`

export default function HeroBattleMockup() {
  const [progress1, setProgress1] = useState(0)
  const [progress2, setProgress2] = useState(0)

  useEffect(() => {
    // Animate typing
    const interval = setInterval(() => {
      setProgress1(p => {
        if (p >= 1) return 1
        return p + Math.random() * 0.05
      })
      setProgress2(p => {
        if (p >= 1) return 1
        return p + Math.random() * 0.04
      })
    }, 150)

    // Reset loop
    const resetInterval = setInterval(() => {
      setProgress1(0)
      setProgress2(0)
    }, 8000)

    return () => {
      clearInterval(interval)
      clearInterval(resetInterval)
    }
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 mb-8 flex flex-col md:flex-row items-stretch justify-center gap-4 px-4 opacity-90">
      
      {/* P1: Red Hacker */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="flex-1 rounded-lg border border-red-900/50 bg-black/60 backdrop-blur-md overflow-hidden flex flex-col"
        style={{ boxShadow: '0 0 40px rgba(225,29,72,0.15)' }}
      >
        <div className="px-3 py-2 border-b border-red-900/50 bg-red-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-600/20 flex items-center justify-center">
            <User size={12} className="text-red-400" />
          </div>
          <span className="text-xs font-mono text-red-400 font-bold tracking-wider">HACKER_ONE</span>
          <span className="ml-auto text-[10px] text-red-500/50 font-mono">JS</span>
        </div>
        <div className="p-4 flex-1 text-left font-mono text-[10px] sm:text-xs text-gray-300 whitespace-pre overflow-hidden relative">
          <span className="text-blue-400">function</span> <span className="text-yellow-200">twoSum</span>(nums, target) {'{\n'}
          <span className="text-gray-400">{'  // Typing...'}</span>{'\n'}
          <span className="text-red-200">{typeCode(p1Code.split('{')[1], progress1)}</span>
          {progress1 < 1 && <span className="inline-block w-2 h-3 bg-red-500 animate-pulse ml-1" />}
        </div>
      </motion.div>

      {/* Middle: Problem Statement */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="w-full md:w-1/3 min-w-[280px] rounded-lg border border-gray-800 bg-gray-900/80 backdrop-blur-xl p-5 flex flex-col items-center justify-center text-center relative z-10 shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500" />
        <Code2 className="text-gray-400 mb-3" size={24} />
        <h3 className="text-sm font-bold text-white mb-2 font-display uppercase tracking-wider">Two Sum</h3>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed font-mono">
          Given an array of integers <span className="text-gray-200">nums</span> and an integer <span className="text-gray-200">target</span>, return indices of the two numbers such that they add up to <span className="text-gray-200">target</span>.
        </p>
        <div className="flex items-center gap-4 w-full">
          <div className="h-1 bg-red-500/20 rounded-full flex-1 overflow-hidden relative">
             <div className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-200" style={{ width: `${progress1 * 100}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-500 font-mono">VS</span>
          <div className="h-1 bg-blue-500/20 rounded-full flex-1 overflow-hidden relative">
             <div className="absolute top-0 right-0 h-full bg-blue-500 transition-all duration-200" style={{ width: `${progress2 * 100}%` }} />
          </div>
        </div>
      </motion.div>

      {/* P2: Blue Hacker */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="flex-1 rounded-lg border border-blue-900/50 bg-black/60 backdrop-blur-md overflow-hidden flex flex-col"
        style={{ boxShadow: '0 0 40px rgba(56,189,248,0.15)' }}
      >
        <div className="px-3 py-2 border-b border-blue-900/50 bg-blue-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
            <User size={12} className="text-blue-400" />
          </div>
          <span className="text-xs font-mono text-blue-400 font-bold tracking-wider">NEO_CODER</span>
          <span className="ml-auto text-[10px] text-blue-500/50 font-mono">PY</span>
        </div>
        <div className="p-4 flex-1 text-left font-mono text-[10px] sm:text-xs text-gray-300 whitespace-pre overflow-hidden relative">
          <span className="text-blue-400">class</span> <span className="text-yellow-200">Solution</span>:{'\n'}
          <span className="text-gray-400">{'    # Typing...'}</span>{'\n'}
          <span className="text-blue-200">{typeCode(p2Code.split(':')[1], progress2)}</span>
          {progress2 < 1 && <span className="inline-block w-2 h-3 bg-blue-500 animate-pulse ml-1" />}
        </div>
      </motion.div>

    </div>
  )
}
