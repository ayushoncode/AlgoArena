import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { useAuth } from '../hooks/useAuth'
import { useSocket } from '../hooks/useSocket'
import api from '../utils/api'
import { UserAvatar, getUserEmoji } from '../utils/avatar'
import LeetCodeProblemView from '../components/LeetCodeProblemView'

/* ════════════════════════════════════════════════
   MATCH TIMER
════════════════════════════════════════════════ */
const MATCH_DURATION = 30 * 60 // 30 minutes in seconds

function useMatchTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  const remaining = Math.max(0, MATCH_DURATION - elapsed)
  const pct = ((MATCH_DURATION - remaining) / MATCH_DURATION) * 100
  const mm  = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss  = String(remaining % 60).padStart(2, '0')
  const urgent = remaining < 300 // last 5 minutes
  return { display: `${mm}:${ss}`, pct, urgent, remaining }
}

/* ════════════════════════════════════════════════
   MONACO EDITOR THEME
════════════════════════════════════════════════ */
function defineTheme(monaco) {
  monaco.editor.defineTheme('algoarena', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',   foreground: '4b5563', fontStyle: 'italic' },
      { token: 'keyword',   foreground: '22d3ee' },
      { token: 'string',    foreground: 'a3e635' },
      { token: 'number',    foreground: 'f97316' },
      { token: 'function',  foreground: 'f97316' },
      { token: 'type',      foreground: 'c084fc' },
      { token: 'variable',  foreground: 'dde1ea' },
      { token: 'delimiter', foreground: '6b7280' },
    ],
    colors: {
      'editor.background':           '#090b13',
      'editor.foreground':           '#dde1ea',
      'editorLineNumber.foreground': '#374151',
      'editorLineNumber.activeForeground': '#f97316',
      'editor.selectionBackground':  '#f9731630',
      'editor.lineHighlightBackground': '#0d0f17',
      'editorCursor.foreground':     '#f97316',
      'editorGutter.background':     '#090b13',
      'scrollbarSlider.background':  '#1e213080',
    },
  })
}

/* ════════════════════════════════════════════════
   STARTER TEMPLATES & DYNAMIC GENERATOR
════════════════════════════════════════════════ */
function splitArgs(inputStr) {
  if (!inputStr) return []
  const str = inputStr.replace(/\\n/g, ', ').trim()
  const list = []
  let depth = 0
  let inQuote = false
  let cur = ''
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (c === '"' && (i === 0 || str[i-1] !== '\\')) inQuote = !inQuote
    if (!inQuote) {
      if (c === '[' || c === '{') depth++
      else if (c === ']' || c === '}') depth--
      else if (c === ',' && depth === 0) {
        if (cur.trim()) list.push(cur.trim())
        cur = ''
        continue
      }
    }
    cur += c
  }
  if (cur.trim()) list.push(cur.trim())
  return list
}

function getParamInfo(token, index, total, title = '', topic = '') {
  const t = token.trim()
  const lowerTitle = (title || '').toLowerCase()
  const lowerTopic = (topic || '').toLowerCase()

  // Specific Problem Overrides
  if (lowerTitle.includes('merge') && lowerTitle.includes('sorted array') && total === 4) {
    if (index === 0) return { name: 'nums1', jsType: 'number[]', pyType: 'List[int]', javaType: 'int[]', cppType: 'vector<int>&', defaultVal: 'new int[]{}', cppDefault: '{}' }
    if (index === 1) return { name: 'm', jsType: 'number', pyType: 'int', javaType: 'int', cppType: 'int', defaultVal: '0', cppDefault: '0' }
    if (index === 2) return { name: 'nums2', jsType: 'number[]', pyType: 'List[int]', javaType: 'int[]', cppType: 'vector<int>&', defaultVal: 'new int[]{}', cppDefault: '{}' }
    if (index === 3) return { name: 'n', jsType: 'number', pyType: 'int', javaType: 'int', cppType: 'int', defaultVal: '0', cppDefault: '0' }
  }

  if (lowerTitle.includes('word break') && total === 2) {
    if (index === 0) return { name: 's', jsType: 'string', pyType: 'str', javaType: 'String', cppType: 'string', defaultVal: '""', cppDefault: '""' }
    if (index === 1) return { name: 'wordDict', jsType: 'string[]', pyType: 'List[str]', javaType: 'List<String>', cppType: 'vector<string>&', defaultVal: 'new ArrayList<>()', cppDefault: '{}' }
  }

  if (lowerTitle.includes('excel') && total === 1) {
    return { name: 'columnTitle', jsType: 'string', pyType: 'str', javaType: 'String', cppType: 'string', defaultVal: '""', cppDefault: '""' }
  }

  if (t.startsWith('[') && t.endsWith(']')) {
    let name = 'nums'
    const isTree = lowerTopic.includes('tree') || lowerTitle.includes('tree') || lowerTitle.includes('bst')
    const isList = lowerTopic.includes('linked') || lowerTitle.includes('linked') || (lowerTitle.includes('list') && !lowerTitle.includes('list of'))

    if (isList) name = 'head'
    else if (isTree) name = 'root'
    else if (lowerTitle.includes('stock') || lowerTitle.includes('price')) name = 'prices'
    else if (lowerTitle.includes('water') || lowerTitle.includes('height')) name = 'height'
    else if (lowerTitle.includes('interval')) name = 'intervals'
    else if (lowerTitle.includes('matrix') || lowerTitle.includes('island') || lowerTitle.includes('board') || lowerTitle.includes('sudoku')) name = 'board'
    else if (total > 1 && index === 0) name = (lowerTitle.includes('4sum') || lowerTitle.includes('3sum') || lowerTitle.includes('two sum')) ? 'nums' : 'nums1'
    else if (total > 1 && index === 1) name = 'nums2'

    const isMatrix = t.startsWith('[[')
    if (isMatrix) {
      return {
        name,
        jsType: 'number[][]',
        pyType: 'List[List[int]]',
        javaType: 'int[][]',
        cppType: 'vector<vector<int>>&',
        defaultVal: 'new int[][]{}',
        cppDefault: '{}',
      }
    }

    if (isTree) {
      return {
        name,
        jsType: 'TreeNode',
        pyType: 'Optional[TreeNode]',
        javaType: 'TreeNode',
        cppType: 'TreeNode*',
        defaultVal: 'null',
        cppDefault: 'nullptr',
      }
    }

    if (isList) {
      return {
        name,
        jsType: 'ListNode',
        pyType: 'Optional[ListNode]',
        javaType: 'ListNode',
        cppType: 'ListNode*',
        defaultVal: 'null',
        cppDefault: 'nullptr',
      }
    }

    // Check if array contains strings e.g. ["cat", "dog"]
    if (t.startsWith('["') || t.startsWith("['")) {
      return {
        name: (lowerTitle.includes('word') || lowerTitle.includes('dict')) ? 'wordDict' : 'strs',
        jsType: 'string[]',
        pyType: 'List[str]',
        javaType: 'List<String>',
        cppType: 'vector<string>&',
        defaultVal: 'new ArrayList<>()',
        cppDefault: '{}',
      }
    }

    return {
      name,
      jsType: 'number[]',
      pyType: 'List[int]',
      javaType: 'int[]',
      cppType: 'vector<int>&',
      defaultVal: 'new int[]{}',
      cppDefault: '{}',
    }
  }

  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    let name = 's'
    if (total > 1 && index === 1) name = 't'
    if (lowerTitle.includes('word')) name = index === 0 ? 'word1' : 'word2'
    return {
      name,
      jsType: 'string',
      pyType: 'str',
      javaType: 'String',
      cppType: 'string',
      defaultVal: '""',
      cppDefault: '""',
    }
  }

  if (t === 'true' || t === 'false') {
    return {
      name: 'flag',
      jsType: 'boolean',
      pyType: 'bool',
      javaType: 'boolean',
      cppType: 'bool',
      defaultVal: 'false',
      cppDefault: 'false',
    }
  }

  // Number
  let name = 'target'
  if (lowerTitle.includes('stair') || lowerTitle.includes('fib') || lowerTitle.includes('spiral') || lowerTitle.includes('binary search tree') || total === 1) name = 'n'
  else if (lowerTitle.includes('kth') || lowerTitle.includes('rotate') || index === 1) name = 'k'
  else if (total === 3 && index === 1) name = 'p'
  else if (total === 3 && index === 2) name = 'q'
  else if (total === 2 && index === 0) name = 'n'
  else if (total === 2 && index === 1) name = 'target'

  return {
    name,
    jsType: 'number',
    pyType: 'int',
    javaType: 'int',
    cppType: 'int',
    defaultVal: '0',
    cppDefault: '0',
  }
}

function getReturnTypeInfo(outputStr, title = '', topic = '') {
  if (!outputStr) return { jsType: 'any', pyType: 'any', javaType: 'int', cppType: 'int', retValJava: '0', retValCpp: '0' }
  const out = outputStr.trim()
  const lowerTitle = (title || '').toLowerCase()
  const lowerTopic = (topic || '').toLowerCase()
  const isTree = lowerTopic.includes('tree') || lowerTitle.includes('tree') || lowerTitle.includes('bst')
  const isList = lowerTopic.includes('linked') || lowerTitle.includes('linked')

  if (out.startsWith('[[')) {
    return {
      jsType: 'number[][]',
      pyType: 'List[List[int]]',
      javaType: 'List<List<Integer>>',
      cppType: 'vector<vector<int>>',
      retValJava: 'new ArrayList<>()',
      retValCpp: '{}',
    }
  }

  if (out.startsWith('[')) {
    if (isTree && (lowerTitle.includes('traversal') || lowerTitle.includes('inorder') || lowerTitle.includes('preorder') || lowerTitle.includes('postorder'))) {
      return {
        jsType: 'number[]',
        pyType: 'List[int]',
        javaType: 'List<Integer>',
        cppType: 'vector<int>',
        retValJava: 'new ArrayList<>()',
        retValCpp: '{}',
      }
    }
    if (isTree && (lowerTitle.includes('invert') || lowerTitle.includes('flatten') || lowerTitle.includes('construct') || lowerTitle.includes('convert'))) {
      return {
        jsType: 'TreeNode',
        pyType: 'Optional[TreeNode]',
        javaType: 'TreeNode',
        cppType: 'TreeNode*',
        retValJava: 'null',
        retValCpp: 'nullptr',
      }
    }
    if (isList && (lowerTitle.includes('reverse') || lowerTitle.includes('merge') || lowerTitle.includes('sort') || lowerTitle.includes('remove') || lowerTitle.includes('rotate'))) {
      return {
        jsType: 'ListNode',
        pyType: 'Optional[ListNode]',
        javaType: 'ListNode',
        cppType: 'ListNode*',
        retValJava: 'null',
        retValCpp: 'nullptr',
      }
    }
    return {
      jsType: 'number[]',
      pyType: 'List[int]',
      javaType: 'int[]',
      cppType: 'vector<int>',
      retValJava: 'new int[]{}',
      retValCpp: '{}',
    }
  }

  if (out === 'true' || out === 'false') {
    return {
      jsType: 'boolean',
      pyType: 'bool',
      javaType: 'boolean',
      cppType: 'bool',
      retValJava: 'false',
      retValCpp: 'false',
    }
  }
  if (out.startsWith('"') && out.endsWith('"')) {
    return {
      jsType: 'string',
      pyType: 'str',
      javaType: 'String',
      cppType: 'string',
      retValJava: '""',
      retValCpp: '""',
    }
  }
  return {
    jsType: 'number',
    pyType: 'int',
    javaType: 'int',
    cppType: 'int',
    retValJava: '0',
    retValCpp: '0',
  }
}

function buildStarterTemplate(problem, lang) {
  if (!problem || !problem.sample_input) {
    return TEMPLATES[lang] || TEMPLATES.javascript
  }

  const rawTokens = splitArgs(problem.sample_input)
  const params = rawTokens.map((tok, i) => getParamInfo(tok, i, rawTokens.length, problem.title, problem.topic))
  const ret = getReturnTypeInfo(problem.sample_output, problem.title, problem.topic)

  const isTree = params.some(p => p.jsType === 'TreeNode') || ret.jsType === 'TreeNode'
  const isList = params.some(p => p.jsType === 'ListNode') || ret.jsType === 'ListNode'

  const jsParamNames = params.map(p => p.name).join(', ')
  const jsDocParams = params.map(p => ` * @param {${p.jsType}} ${p.name}`).join('\n')

  const pyParams = params.map(p => `${p.name}: ${p.pyType}`).join(', ')
  const javaParams = params.map(p => `${p.javaType} ${p.name}`).join(', ')
  const cppParams = params.map(p => `${p.cppType} ${p.name}`).join(', ')

  if (lang === 'python') {
    let prefix = ''
    if (isTree) {
      prefix += `# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n\n`
    } else if (isList) {
      prefix += `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\n`
    }
    return `${prefix}class Solution:
    def solution(self${pyParams ? ', ' + pyParams : ''}) -> ${ret.pyType}:
        # write your solution here
        pass`
  }

  if (lang === 'java') {
    let prefix = 'import java.util.*;\n\n'
    if (isTree) {
      prefix += `/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode() {}\n *     TreeNode(int val) { this.val = val; }\n *     TreeNode(int val, TreeNode left, TreeNode right) {\n *         this.val = val;\n *         this.left = left;\n *         this.right = right;\n *     }\n * }\n */\n`
    } else if (isList) {
      prefix += `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\n`
    }
    return `${prefix}class Solution {
    public ${ret.javaType} solution(${javaParams}) {
        // write your solution here
        return ${ret.retValJava};
    }
}`
  }

  if (lang === 'cpp') {
    let prefix = `#include <vector>\n#include <string>\n#include <queue>\n#include <algorithm>\nusing namespace std;\n\n`
    if (isTree) {
      prefix += `/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\n`
    } else if (isList) {
      prefix += `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\n`
    }
    return `${prefix}class Solution {
public:
    ${ret.cppType} solution(${cppParams}) {
        // write your solution here
        return ${ret.retValCpp};
    }
};`
  }

  // Default javascript
  let prefix = ''
  if (isTree) {
    prefix = `/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n`
  } else if (isList) {
    prefix = `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n`
  }
  return `${prefix}/**
${jsDocParams}
 * @return {${ret.jsType}}
 */
function solution(${jsParamNames}) {
  // write your solution here
  
}`
}

const TEMPLATES = {
  javascript: `function solution(nums, target) {
  // write your solution here
}`,
  python: `class Solution:
    def solution(self, nums: list[int], target: int) -> list[int]:
        # write your solution here
        pass`,
  java: `class Solution {
    public int[] solution(int[] nums, int target) {
        // write your solution here
        return new int[]{};
    }
}`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // write your solution here
        return {};
    }
};`,
}

const LANGS = [
  { id: 'javascript', label: 'JS'  },
  { id: 'python',     label: 'PY'  },
  { id: 'java',       label: 'JV'  },
  { id: 'cpp',        label: 'C++' },
]

/* ════════════════════════════════════════════════
   VERDICT BADGE
════════════════════════════════════════════════ */
function VerdictBadge({ verdict }) {
  if (!verdict) return null
  const cfg = {
    ACCEPTED:             { col: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: 'ACCEPTED ✓' },
    WRONG_ANSWER:         { col: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   label: 'WRONG ANSWER ✗' },
    TIME_LIMIT_EXCEEDED:  { col: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'TIME LIMIT' },
    RUNTIME_ERROR:        { col: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   label: 'RUNTIME ERROR' },
    PENDING:              { col: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'JUDGING...' },
  }
  const v = cfg[verdict] ?? cfg.PENDING
  return (
    <span className="font-mono text-[11px] font-bold px-3 py-1.5 verdict-in"
          style={{ background: v.bg, color: v.col, border: `1px solid ${v.border}`, borderRadius: 3 }}>
      {v.label}
    </span>
  )
}
/* ════════════════════════════════════════════════
   RESULTS DRAWER — LeetCode style (Run + Submit)
════════════════════════════════════════════════ */
function ResultsDrawer({ runResult, submitResult, onClose }) {
  const [tab, setTab] = useState('run')
  const details = tab === 'run' ? runResult : submitResult
  if (!runResult && !submitResult) return null

  const verdictCfg = {
    ACCEPTED:            { col: '#10b981', label: 'Accepted ✓' },
    WRONG_ANSWER:        { col: '#f43f5e', label: 'Wrong Answer ✗' },
    TIME_LIMIT_EXCEEDED: { col: '#f59e0b', label: 'Time Limit Exceeded' },
    RUNTIME_ERROR:       { col: '#f43f5e', label: 'Runtime Error' },
    PENDING:             { col: '#6b7280', label: 'Judging…' },
  }

  const vc = verdictCfg[details?.verdict] ?? verdictCfg.PENDING
  const passed = details?.passedTests ?? 0
  const total  = details?.totalTests ?? 0

  return (
    <div className="shrink-0 border-t" style={{ background: '#0a0c14', borderColor: '#1e2130', maxHeight: 240, display:'flex', flexDirection:'column' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ background: '#07080c', borderBottom: '1px solid #1e2130' }}>
        <div className="flex items-center gap-1">
          {runResult && (
            <button onClick={() => setTab('run')}
              className="font-mono text-[10px] px-2.5 py-1 transition-all"
              style={{ borderRadius:3, background: tab==='run' ? '#1e2130' : 'transparent',
                       color: tab==='run' ? '#dde1ea' : '#4b5563', border:`1px solid ${tab==='run'?'#374151':'transparent'}` }}>
              ▶ Run
            </button>
          )}
          {submitResult && (
            <button onClick={() => setTab('submit')}
              className="font-mono text-[10px] px-2.5 py-1 transition-all"
              style={{ borderRadius:3, background: tab==='submit' ? '#1e2130' : 'transparent',
                       color: tab==='submit' ? '#dde1ea' : '#4b5563', border:`1px solid ${tab==='submit'?'#374151':'transparent'}` }}>
              ⬆ Submit
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {details && (
            <span className="font-mono text-[10px] font-bold" style={{ color: vc.col }}>{vc.label}</span>
          )}
          {details && total > 0 && (
            <span className="font-mono text-[9px]" style={{ color: '#9ca3af' }}>
              {passed}/{total} cases · {details.runtimeMs || 0}ms
            </span>
          )}
          <button onClick={onClose} className="font-mono text-[11px] hover:text-white transition-colors" style={{ color: '#4b5563' }}>✕</button>
        </div>
      </div>

      {/* Test case list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2" style={{ scrollbarWidth:'thin' }}>
        {details?.testResults?.map((tc, idx) => {
          const isHiddenFailed = tc.isHidden && !tc.passed
          const borderCol = tc.passed ? 'rgba(16,185,129,0.25)' : tc.error ? 'rgba(244,63,94,0.35)' : 'rgba(245,158,11,0.3)'
          return (
            <div key={idx} className="rounded overflow-hidden" style={{ border:`1px solid ${borderCol}`, background:'#0d0f17' }}>
              {/* Row header */}
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: tc.passed ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)' }}>
                <span className="font-mono text-[10px] font-bold" style={{ color: tc.passed ? '#10b981' : '#f43f5e' }}>
                  {tc.passed ? '✓' : '✗'} Test {tc.testIndex}{tc.isHidden ? ' (Hidden)' : ''}
                </span>
                {tc.runtimeMs > 0 && <span className="font-mono text-[9px]" style={{ color:'#4b5563' }}>{tc.runtimeMs}ms</span>}
              </div>

              {/* Test content */}
              {!isHiddenFailed && !tc.isHidden && (
                <div className="px-3 py-2 space-y-1.5">
                  <div className="font-mono text-[10px]">
                    <span style={{ color:'#4b5563' }}>Input  </span>
                    <code style={{ color:'#22d3ee' }}>{tc.input}</code>
                  </div>
                  <div className="font-mono text-[10px]">
                    <span style={{ color:'#4b5563' }}>Expected </span>
                    <code style={{ color:'#10b981' }}>{tc.expected}</code>
                  </div>
                  {!tc.passed && (
                    <div className="font-mono text-[10px]">
                      <span style={{ color:'#4b5563' }}>Got  </span>
                      <code style={{ color: tc.error ? '#f43f5e' : '#f59e0b' }}>
                        {tc.error ? tc.error.slice(0, 120) : (tc.actual ?? 'null')}
                      </code>
                    </div>
                  )}
                </div>
              )}
              {isHiddenFailed && (
                <div className="px-3 py-2 font-mono text-[10px]" style={{ color:'#6b7280' }}>
                  {tc.error ? `Error: ${tc.error.slice(0, 100)}` : 'Output does not match expected'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
/* ════════════════════════════════════════════════
   PLAYER PANEL HEADER
════════════════════════════════════════════════ */
function PlayerHeader({ player, isMe, verdict }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5"
         style={{ background: '#07080c', borderBottom: '1px solid #1e2130' }}>
      <div className="flex items-center gap-2.5">
        {/* Emoji Avatar */}
        <UserAvatar username={player?.username} seed={player?.avatar_seed} style={player?.avatar_style} size={24} isMe={isMe} />
        <span className="font-mono text-[12px] font-bold" style={{ color: isMe ? '#f97316' : '#22d3ee' }}>
          {player?.username ?? '—'}
        </span>
        <span className="font-mono text-[10px]" style={{ color: '#4b5563' }}>{player?.rating ?? 1200}</span>
        {isMe && <span className="font-mono text-[9px] px-1.5 py-0.5" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 2 }}>you</span>}
      </div>
      <VerdictBadge verdict={verdict} />
    </div>
  )
}

/* ════════════════════════════════════════════════
   PROBLEM PANEL  — LeetCode-style
   Width and collapsed state controlled entirely by parent.
   Parent passes: topic, difficulty, forcedWidth (px), onProblemLoaded, onToggleCollapse
════════════════════════════════════════════════ */
function ProblemPanel({ problemId, topic, difficulty, forcedWidth, collapsed, onToggleCollapse, onProblemLoaded }) {
  const [problem,   setProblem] = useState(null)
  const [loading,   setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    let url = ''
    if (problemId) {
      url = `/api/problems/${problemId}`
    } else if (topic) {
      url = `/api/problems?topic=${topic}&difficulty=${difficulty || 'medium'}`
    } else {
      return
    }

    setLoading(true)
    api.get(url)
      .then(({ data }) => {
        const prob = Array.isArray(data) ? data[0] : data
        if (prob) {
          setProblem(prob)
          if (onProblemLoaded) onProblemLoaded(prob)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [problemId, topic, difficulty])

  const DIFF = {
    easy:   { col:'#00b8a3', bg:'rgba(0,184,163,0.12)',  border:'rgba(0,184,163,0.25)',  label:'Easy'   },
    medium: { col:'#ffc01e', bg:'rgba(255,192,30,0.12)', border:'rgba(255,192,30,0.25)',  label:'Medium' },
    hard:   { col:'#ff375f', bg:'rgba(255,55,95,0.12)',   border:'rgba(255,55,95,0.25)',   label:'Hard'   },
  }
  const diff = DIFF[difficulty] || DIFF.medium

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden h-full"
      style={{
        width: collapsed ? 40 : (forcedWidth || 340),
        minWidth: collapsed ? 40 : 260,
        height: '100%',
        borderRight: '1px solid #151929',
        background: '#0b0d14',
        transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Collapse / expand toggle strip */}
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#111827] transition-colors"
        style={{ height: 32, borderBottom:'1px solid #151929', gap:6 }}
        title={collapsed ? 'Expand problem' : 'Collapse'}
      >
        {!collapsed && (
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#4b5563]">Problem Details</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition:'transform 0.2s', color:'#4b5563' }}>
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
          {/* Tab bar — Description */}
          {problem && (
            <div className="flex shrink-0 px-2" style={{ borderBottom:'1px solid #151929' }}>
              {[['description','Description']].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="px-3 font-sans text-[11.5px] py-2.5 transition-colors font-semibold"
                  style={{
                    color: activeTab===id ? '#f97316' : '#64748b',
                    borderBottom: activeTab===id ? '2px solid #f97316' : '2px solid transparent',
                    background: 'transparent',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5" style={{ scrollbarWidth:'thin', scrollbarColor:'#1e2130 transparent' }}>
            {loading ? (
              <div className="space-y-4 pt-2">
                <div style={{ height: 22, width: '70%', background: '#151929', borderRadius: 4 }}/>
                <div style={{ height: 16, width: '30%', background: '#151929', borderRadius: 12 }}/>
                <div className="space-y-2 pt-2">
                  <div style={{ height: 12, width: '100%', background: '#151929', borderRadius: 4 }}/>
                  <div style={{ height: 12, width: '90%', background: '#151929', borderRadius: 4 }}/>
                  <div style={{ height: 12, width: '95%', background: '#151929', borderRadius: 4 }}/>
                </div>
              </div>
            ) : problem && activeTab === 'description' ? (
              <LeetCodeProblemView problem={problem} difficulty={difficulty} topic={topic} />
            ) : !problem ? (
              <p className="font-mono text-[11px] text-[#6b7280] py-4">No problem found</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Collapsed: show vertical label */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
          <span style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', color:'#374151', fontSize:9, fontFamily:'monospace', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Problem
          </span>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════
   DRAG-TO-RESIZE HOOK
════════════════════════════════════════════════ */
function useDragResize(initial, min, max) {
  const [width, setWidth] = useState(initial)
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = (e) => {
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = width
    document.body.style.cursor    = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      setWidth(Math.min(max, Math.max(min, startW.current + delta)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor    = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  return { width, setWidth, onMouseDown }
}

/* ════════════════════════════════════════════════
   DIVIDER HANDLE
════════════════════════════════════════════════ */
function DragHandle({ onMouseDown, onDoubleClick }) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className="shrink-0 flex items-center justify-center group"
      style={{
        width: 5,
        background: '#0d0f17',
        borderLeft:  '1px solid #1e2130',
        borderRight: '1px solid #1e2130',
        cursor: 'col-resize',
        zIndex: 10,
      }}
      title="drag to resize · double-click to reset"
    >
      <div className="w-px h-8 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ background:'#f97316' }}/>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MATCH PAGE
════════════════════════════════════════════════ */
export default function Match() {
  const { roomId }  = useParams()
  const { state }   = useLocation()
  const { user }    = useAuth()
  const { emit, on, off } = useSocket()
  const navigate    = useNavigate()

  // Panel widths — draggable
  const probPanel = useDragResize(320, 220, 560)
  const [probCollapsed, setProbCollapsed] = useState(false)
  const oppPanel  = useDragResize(180, 120, 360)

  // Match state from navigation, sessionStorage or socket
  const [matchState, setMatchState] = useState(() => {
    if (state) return state
    if (!roomId) return null
    try {
      const saved = sessionStorage.getItem(`aa_match_${roomId}`)
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })

  // Persist match state to sessionStorage whenever it changes
  useEffect(() => {
    if (matchState && roomId) {
      try {
        sessionStorage.setItem(`aa_match_${roomId}`, JSON.stringify(matchState))
      } catch {}
    }
  }, [matchState, roomId])

  // Persistent match start timestamp across browser refreshes
  const [startedAt, setStartedAt] = useState(() => {
    if (!roomId) return Date.now()
    const key = `aa_start_${roomId}`
    const stored = localStorage.getItem(key)
    if (stored) return Number(stored)
    const now = state?.startedAt ?? Date.now()
    localStorage.setItem(key, String(now))
    return now
  })

  const { display: timerDisplay, urgent, remaining } = useMatchTimer(startedAt)

  // Editor state
  const [activeProblem, setActiveProblem] = useState(null)
  const [userHasTyped,  setUserHasTyped]  = useState(false)
  const [lang,          setLang]          = useState('javascript')
  const [code,          setCode]          = useState(TEMPLATES.javascript)
  const [submitting,    setSubmitting]    = useState(false)
  const [running,       setRunning]       = useState(false)

  // Verdicts & Test details & Disconnect & Opponent Progress state
  const [myVerdict,          setMyVerdict]          = useState(null)
  const [oppVerdict,         setOppVerdict]         = useState(null)
  const [runResult,          setRunResult]          = useState(null)
  const [submitResult,       setSubmitResult]       = useState(null)
  const [oppDisconnectState, setOppDisconnectState] = useState(null)
  const [oppProgress,        setOppProgress]        = useState(null)
  const [showResignModal,    setShowResignModal]    = useState(false)

  const editorRef        = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Determine which player is me and who's the opponent
  const me  = matchState?.players?.find(p => p.username === user?.username)
  const opp = matchState?.players?.find(p => p.username !== user?.username)

  // ── Socket event listeners ─────────────────────────────────
  useEffect(() => {
    function onMatchFound(payload) {
      setMatchState(prev => ({ ...(prev || {}), ...payload }))
    }
    function onMatchProblemSet({ problemId }) {
      setMatchState(prev => ({ ...(prev || {}), problemId }))
    }
    function onMatchStateRestored(restored) {
      setMatchState(prev => ({ ...(prev || {}), ...restored }))
    }
    function onSubmissionResult({ userId, verdict, totalTests, passedTests, testResults, runtimeMs }) {
      if (userId === user?.id) {
        setMyVerdict(verdict)
        setSubmitting(false)
        setSubmitResult({ verdict, totalTests, passedTests, testResults, runtimeMs })
      } else {
        setOppVerdict(verdict)
      }
    }
    function onMatchEnd(payload) {
      if (roomId) {
        localStorage.removeItem(`aa_start_${roomId}`)
        sessionStorage.removeItem(`aa_match_${roomId}`)
      }
      // Give 1.4s for user to see the green ACCEPTED indicator before going to results
      setTimeout(() => {
        navigate('/result', { state: { ...payload, roomId } })
      }, 1400)
    }
    function onPlayerDisconnected({ userId, username, gracePeriodSec }) {
      if (userId !== user?.id) {
        setOppDisconnectState({ username, countdown: gracePeriodSec || 30 })
      }
    }
    function onPlayerReconnected({ userId }) {
      if (userId !== user?.id) {
        setOppDisconnectState(null)
      }
    }
    function onOpponentCodeChange(data) {
      if (data.userId !== user?.id) {
        setOppProgress(data)
      }
    }

    // Rejoin match on page mount to clear server disconnect timers & restore match state
    emit('rejoin_match', { roomId })

    on('match_found',           onMatchFound)
    on('match_problem_set',     onMatchProblemSet)
    on('match_state_restored',  onMatchStateRestored)
    on('submission_result',     onSubmissionResult)
    on('match_end',             onMatchEnd)
    on('player_disconnected',   onPlayerDisconnected)
    on('player_reconnected',    onPlayerReconnected)
    on('opponent_code_change',  onOpponentCodeChange)

    return () => {
      off('match_found',          onMatchFound)
      off('match_problem_set',    onMatchProblemSet)
      off('match_state_restored', onMatchStateRestored)
      off('submission_result',    onSubmissionResult)
      off('match_end',            onMatchEnd)
      off('player_disconnected',  onPlayerDisconnected)
      off('player_reconnected',   onPlayerReconnected)
      off('opponent_code_change', onOpponentCodeChange)
    }
  }, [on, off, emit, navigate, user, roomId])

  // Re-initialize matchState if page was refreshed directly at /match/:roomId
  useEffect(() => {
    if (!matchState && roomId) {
      const isCustom = roomId.includes('custom')
      setMatchState({
        roomId,
        topic: 'arrays',
        difficulty: 'medium',
        isCustom,
        players: [{ username: user?.username, rating: user?.elo_rating }]
      })
    }
  }, [matchState, roomId, user])

  // Disconnect countdown interval
  useEffect(() => {
    if (!oppDisconnectState || oppDisconnectState.countdown <= 0) return
    const t = setInterval(() => {
      setOppDisconnectState(prev => prev ? { ...prev, countdown: Math.max(0, prev.countdown - 1) } : null)
    }, 1000)
    return () => clearInterval(t)
  }, [oppDisconnectState])

  // Time's up
  useEffect(() => {
    if (remaining === 0) {
      navigate('/result', { state: { result: 'DRAW', roomId, matchState } })
    }
  }, [remaining, navigate, roomId, matchState])

  function handleProblemLoaded(p) {
    setActiveProblem(p)
    if (!userHasTyped) {
      setCode(buildStarterTemplate(p, lang))
    }
  }

  function handleLangChange(newLang) {
    setLang(newLang)
    setCode(buildStarterTemplate(activeProblem, newLang))
  }

  async function handleRun() {
    if (running || !activeProblem?.id) return
    setRunning(true)
    setRunResult(null)
    try {
      const { data } = await api.post(`/api/problems/${activeProblem.id}/run`, {
        code,
        language: lang,
      })
      setRunResult(data)
    } catch (err) {
      setRunResult({
        verdict: 'RUNTIME_ERROR',
        passedTests: 0,
        totalTests: 0,
        runtimeMs: 0,
        testResults: [{ testIndex:1, passed:false, input:'—', expected:'—', actual:null,
          error: err?.response?.data?.message || err.message, isHidden:false, runtimeMs:0 }],
      })
    } finally {
      setRunning(false)
    }
  }

  function handleSubmit() {
    if (submitting || myVerdict === 'ACCEPTED') return
    setSubmitting(true)
    setMyVerdict('PENDING')
    emit('submit_code', {
      roomId,
      code,
      language: lang,
      topic: matchState?.topic,
      difficulty: matchState?.difficulty,
    })
  }

  const problem = matchState
    ? { title: `${matchState.topic} · ${matchState.difficulty}`, topic: matchState.topic }
    : { title: 'Loading match…', topic: '—' }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)', background: '#07080c' }}>

      {/* ── MATCH HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
           style={{ borderBottom: '1px solid #1e2130', background: '#07080c' }}>

        {/* Problem info */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#4b5563', letterSpacing: '0.13em' }}>
            {problem.topic}
          </div>
          <span style={{ color: '#1e2130' }}>·</span>
          <div className="font-mono text-[11px] font-bold" style={{ color: '#dde1ea' }}>
            {matchState?.difficulty ?? '—'}
          </div>
          <span style={{ color: '#1e2130' }}>·</span>
          <div className="font-mono text-[10px]" style={{ color: '#374151' }}>
            {roomId}
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
               strokeWidth={2} style={{ color: urgent ? '#f43f5e' : '#4b5563' }}>
            <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
          </svg>
          <span className="font-mono text-lg font-bold tabular-nums"
                style={{ color: urgent ? '#f43f5e' : '#dde1ea', minWidth: 56 }}>
            {timerDisplay}
          </span>
          {urgent && (
            <span className="font-mono text-[10px] animate-pulse" style={{ color: '#f43f5e' }}>
              ← time running out
            </span>
          )}
        </div>

        {/* Players summary & Exit button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] flex items-center gap-1" style={{ color: '#f97316' }}>
              <span>{getUserEmoji(me?.username ?? user?.username)}</span>
              {me?.username ?? user?.username}
            </span>
            <span className="font-mono text-[10px] font-bold" style={{ color: '#4b5563' }}>vs</span>
            <span className="font-mono text-[11px] flex items-center gap-1" style={{ color: '#22d3ee' }}>
              <span>{getUserEmoji(opp?.username)}</span>
              {opp?.username ?? '…'}
            </span>
          </div>

          <button
            onClick={() => setShowResignModal(true)}
            className="font-mono text-[10px] font-bold px-2.5 py-1 transition-all active:scale-[0.97] flex items-center gap-1"
            style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 3 }}
            title="Resign & Exit Match"
          >
            <span>🚩</span> exit_match()
          </button>
        </div>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,10,0.85)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm p-6 space-y-4 rounded" style={{ background: '#090b13', border: '1px solid #1e2130' }}>
            <div className="flex items-center gap-2 font-display font-bold text-sm" style={{ color: '#f43f5e' }}>
              <span className="text-xl">⚠️</span> Confirm Resignation
            </div>
            <p className="font-mono text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
              Are you sure you want to exit? Your opponent will win the match and your Elo rating will be affected.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2 font-mono text-xs rounded border transition-colors"
                style={{ background: '#0d0f17', borderColor: '#1e2130', color: '#9ca3af' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResignModal(false)
                  if (roomId) localStorage.removeItem(`aa_start_${roomId}`)
                  emit('resign_match', { roomId })
                  setTimeout(() => {
                    navigate('/result', {
                      state: {
                        roomId,
                        isForfeit: true,
                        forfeitUser: user?.username,
                        isCustom: roomId?.includes('custom'),
                        topic: matchState?.topic || 'arrays',
                        difficulty: matchState?.difficulty || 'medium',
                        winner: { username: opp?.username || 'Opponent', delta: roomId?.includes('custom') ? 0 : 18 },
                        loser: { username: user?.username, delta: roomId?.includes('custom') ? 0 : -18 },
                      }
                    })
                  }, 200)
                }}
                className="flex-1 py-2 font-mono text-xs font-bold rounded transition-all active:scale-[0.98]"
                style={{ background: '#f43f5e', color: '#ffffff' }}
              >
                Resign & Exit 🚩
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESIZABLE 3-PANEL: problem | editor | opponent ── */}
      <div className="flex flex-1 min-h-0" style={{ overflow:'hidden' }}>

        {/* PROBLEM PANEL — resizable */}
        <div style={{
          width: probCollapsed ? 40 : probPanel.width,
          minWidth: probCollapsed ? 40 : 220,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.2s cubic-bezier(.4,0,.2,1)',
        }}>
          <ProblemPanel
            problemId={matchState?.problemId}
            topic={matchState?.topic}
            difficulty={matchState?.difficulty}
            forcedWidth={probPanel.width}
            collapsed={probCollapsed}
            onToggleCollapse={() => setProbCollapsed(c => !c)}
            onProblemLoaded={handleProblemLoaded}
          />
        </div>

        {/* DRAG HANDLE — problem | editor */}
        <DragHandle
          onMouseDown={probPanel.onMouseDown}
          onDoubleClick={() => probPanel.setWidth(240)}
        />

        {/* EDITOR PANEL — fills remaining space */}
        <div className="flex flex-col flex-1 min-w-0">
          <PlayerHeader player={me ?? { username: user?.username, rating: user?.elo_rating }} isMe={true} verdict={myVerdict} />

          {/* Lang selector + submit */}
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0"
               style={{ borderBottom: '1px solid #1e2130', background: '#0a0c15' }}>
            <div className="flex gap-1">
              {LANGS.map(l => (
                <button key={l.id} onClick={() => handleLangChange(l.id)}
                        className="font-mono text-[10px] px-2 py-1 transition-all"
                        style={{ background: lang===l.id?'rgba(249,115,22,0.12)':'transparent',
                                 color: lang===l.id?'#f97316':'#4b5563',
                                 border: `1px solid ${lang===l.id?'rgba(249,115,22,0.3)':'transparent'}`,
                                 borderRadius: 3 }}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {/* Run button — sample test cases only */}
              <button
                id="run-btn"
                onClick={handleRun}
                disabled={running || submitting}
                className="font-mono text-[11px] px-3.5 py-1.5 transition-all active:scale-[0.97]"
                style={{
                  background: running ? '#1e2130' : 'rgba(34,211,238,0.1)',
                  color:      running ? '#4b5563' : '#22d3ee',
                  border:     `1px solid ${running ? '#1e2130' : 'rgba(34,211,238,0.3)'}`,
                  borderRadius: 3, cursor: running ? 'not-allowed' : 'pointer',
                }}>
                {running ? 'running…' : '▶ run'}
              </button>

              {/* Submit button — all test cases */}
              <button
                id="submit-btn"
                onClick={handleSubmit}
                disabled={submitting || myVerdict === 'ACCEPTED'}
                className="font-mono text-[11px] font-bold px-4 py-1.5 transition-all active:scale-[0.97]"
                style={{
                  background: myVerdict==='ACCEPTED' ? 'rgba(16,185,129,0.15)' : submitting ? '#1e2130' : '#f97316',
                  color:      myVerdict==='ACCEPTED' ? '#10b981'               : submitting ? '#4b5563' : '#07080c',
                  border:     `1px solid ${myVerdict==='ACCEPTED'?'rgba(16,185,129,0.3)':submitting?'#1e2130':'#f97316'}`,
                  borderRadius: 3, cursor: (submitting||myVerdict==='ACCEPTED') ? 'not-allowed' : 'pointer',
                }}>
                {myVerdict==='ACCEPTED' ? '✓ accepted' : submitting ? 'judging…' : 'submit →'}
              </button>
            </div>
          </div>

          {/* Monaco */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={lang}
              value={code}
              onChange={v => {
                const val = v ?? ''
                setUserHasTyped(true)
                setCode(val)
                const lineCount = val.split('\n').length
                const charCount = val.length
                emit('code_change', { roomId, lineCount, charCount, isTyping: true })
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = setTimeout(() => {
                  emit('code_change', { roomId, lineCount, charCount, isTyping: false })
                }, 1200)
              }}
              theme="algoarena"
              beforeMount={defineTheme}
              onMount={e => { editorRef.current = e }}
              options={{
                fontSize:             13,
                fontFamily:           "'JetBrains Mono', monospace",
                fontLigatures:        true,
                lineNumbers:          'on',
                minimap:              { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight:  'line',
                padding:              { top: 16 },
                tabSize:              2,
                wordWrap:             'on',
                smoothScrolling:      true,
                cursorBlinking:       'phase',
                renderWhitespace:     'none',
              }}
            />
          </div>

          {/* Results Drawer — Run + Submit tabs */}
          <ResultsDrawer
            runResult={runResult}
            submitResult={submitResult}
            onClose={() => { setRunResult(null); setSubmitResult(null) }}
          />
        </div>

        {/* DRAG HANDLE — editor | opponent */}
        <DragHandle
          onMouseDown={(e) => {
            // Dragging opponent panel from the LEFT: delta is inverted
            const dragging = { active: true, startX: e.clientX, startW: oppPanel.width }
            document.body.style.cursor     = 'col-resize'
            document.body.style.userSelect = 'none'
            const onMove = (ev) => {
              if (!dragging.active) return
              const delta = dragging.startX - ev.clientX   // inverted: drag left = wider
              oppPanel.setWidth(Math.min(360, Math.max(120, dragging.startW + delta)))
            }
            const onUp = () => {
              dragging.active = false
              document.body.style.cursor     = ''
              document.body.style.userSelect = ''
              window.removeEventListener('mousemove', onMove)
              window.removeEventListener('mouseup',   onUp)
            }
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup',   onUp)
          }}
          onDoubleClick={() => oppPanel.setWidth(180)}
        />

        {/* OPPONENT PANEL — small by default, resizable */}
        <div className="flex flex-col shrink-0"
             style={{ width: oppPanel.width, minWidth: oppPanel.width, background:'#090b13', overflow:'hidden' }}>
          <PlayerHeader player={opp} isMe={false} verdict={oppVerdict} />

          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3">
            {oppDisconnectState ? (
              <div className="p-3 text-center space-y-2 rounded w-full" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
                <div className="text-2xl animate-bounce">⚠️</div>
                <p className="font-mono text-xs font-bold" style={{ color: '#f43f5e' }}>{oppDisconnectState.username} Disconnected</p>
                <p className="font-mono text-[9px]" style={{ color: '#9ca3af' }}>Reconnection grace period:</p>
                <p className="font-mono text-2xl font-black tabular-nums" style={{ color: '#f43f5e' }}>{oppDisconnectState.countdown}s</p>
                <p className="font-mono text-[9px]" style={{ color: '#4b5563' }}>Forfeit victory awarded if timer reaches 0s</p>
              </div>
            ) : oppVerdict === 'ACCEPTED' ? (
              <div className="text-center space-y-2">
                <div className="text-2xl">⚡</div>
                <p className="font-mono font-bold text-[11px]" style={{ color:'#22d3ee' }}>
                  {opp?.username} solved it!
                </p>
                <p className="font-mono text-[9px]" style={{ color:'#4b5563' }}>redirecting…</p>
              </div>
            ) : oppVerdict === 'PENDING' ? (
              <div className="text-center space-y-2">
                <div className="flex gap-1.5 justify-center">
                  {[0,1,2].map(i => <div key={i} className="dot-pulse" style={{ animationDelay:`${i*0.2}s`, background:'#22d3ee', width:5, height:5 }}/>)}
                </div>
                <p className="font-mono text-[10px]" style={{ color:'#4b5563' }}>judging…</p>
              </div>
            ) : (
              <div className="text-center space-y-3 w-full">
                <div className="font-mono text-[9px] uppercase tracking-widest"
                     style={{ color:'#1e2130', letterSpacing:'0.12em' }}>// opponent workspace</div>

                <div className="flex items-center gap-1.5 justify-center">
                  <span className={`w-2 h-2 rounded-full ${oppProgress?.isTyping ? 'animate-ping' : ''}`}
                        style={{ background: oppProgress?.isTyping ? '#22d3ee' : '#374151', boxShadow: oppProgress?.isTyping ? '0 0 6px #22d3ee' : 'none' }}/>
                  <span className="font-mono text-[11px] font-bold" style={{ color: oppProgress?.isTyping ? '#22d3ee' : '#4b5563' }}>
                    {oppProgress?.isTyping ? `${opp?.username ?? 'opponent'} is typing…` : `${opp?.username ?? 'opponent'} is coding`}
                  </span>
                </div>

                {oppProgress && (
                  <div className="p-3 rounded space-y-2 font-mono text-[10px]" style={{ background: '#0d0f17', border: '1px solid #1e2130' }}>
                    <div className="flex justify-between" style={{ color: '#9ca3af' }}>
                      <span>Lines written:</span>
                      <span className="font-bold" style={{ color: '#22d3ee' }}>{oppProgress.lineCount || 1} lines</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#9ca3af' }}>
                      <span>Character count:</span>
                      <span className="font-bold" style={{ color: '#22d3ee' }}>{oppProgress.charCount || 0} chars</span>
                    </div>
                    <div className="w-full h-1 mt-1 rounded overflow-hidden" style={{ background: '#1e2130' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (oppProgress.lineCount || 1) * 3)}%`, background: '#22d3ee', transition: 'width 0.3s ease' }}/>
                    </div>
                  </div>
                )}

                {!oppProgress && (
                  <p className="font-mono text-[9px] text-center" style={{ color:'#374151' }}>
                    opponent's code hidden until submit
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TIMER PROGRESS BAR (bottom) ───────────────────── */}
      <div style={{ height: 2, background: '#1e2130', flexShrink: 0 }}>
        <div style={{
          height: '100%',
          background: urgent ? '#f43f5e' : '#f97316',
          width: `${100 - (remaining / MATCH_DURATION) * 100}%`,
          transition: 'width 1s linear, background 0.5s ease',
        }}/>
      </div>
    </div>
  )
}
