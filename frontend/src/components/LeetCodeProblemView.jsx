import React, { useState } from 'react'

/**
 * Renders inline markdown text:
 * Supports `inline code`, **bold**, *italics*, and regular text.
 */
function renderInline(text) {
  if (!text) return null

  // Split by markdown formatting tokens
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g)

  return tokens.map((chunk, i) => {
    if (!chunk) return null

    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded mx-0.5"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            color: '#93c5fd',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
          }}
        >
          {chunk.slice(1, -1)}
        </code>
      )
    }

    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[color:var(--c-text)]">
          {renderInline(chunk.slice(2, -2))}
        </strong>
      )
    }

    if ((chunk.startsWith('*') && chunk.endsWith('*')) || (chunk.startsWith('_') && chunk.endsWith('_'))) {
      return (
        <em key={i} className="italic text-[color:var(--c-text)]">
          {renderInline(chunk.slice(1, -1))}
        </em>
      )
    }

    return chunk
  })
}

/**
 * Universal LeetCode Markdown Parser
 * Parses problem descriptions into Statement Paragraphs, ASCII Diagrams, Example Cards, and Constraints.
 */
function parseLeetCodeDescription(rawDesc, sampleInput, sampleOutput) {
  if (!rawDesc) {
    return {
      paragraphs: [],
      examples: sampleInput ? [{ num: 1, diagram: null, input: sampleInput, output: sampleOutput || '', explanation: '' }] : [],
      constraints: []
    }
  }

  // Normalize newlines and strip excessive trailing/leading spacing
  const desc = rawDesc.replace(/\r\n/g, '\n').trim()

  // Extract sections by splitting on Example headers and Constraints
  const paragraphs = []
  const examples = []
  const constraints = []

  // Split the markdown content into lines
  const lines = desc.split('\n')
  let currentSection = 'body' // 'body' | 'example' | 'constraints'
  let curExample = null
  let inCodeFence = false
  let codeFenceBuffer = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Code fence toggle
    if (trimmed.startsWith('```')) {
      if (inCodeFence) {
        // Closing fence
        inCodeFence = false
        const blockContent = codeFenceBuffer.join('\n').trimEnd()
        codeFenceBuffer = []

        if (currentSection === 'example' && curExample) {
          // Check if this code fence contains an ASCII diagram or input/output
          if (/Input:|Output:/i.test(blockContent)) {
            // It contains input/output text
            parseBlockIntoExample(blockContent, curExample)
          } else {
            // It is an ASCII tree or diagram
            curExample.diagram = blockContent
          }
        } else if (currentSection === 'body') {
          paragraphs.push({ type: 'code', content: blockContent })
        }
      } else {
        // Opening fence
        inCodeFence = true
        codeFenceBuffer = []
      }
      continue
    }

    if (inCodeFence) {
      codeFenceBuffer.push(line)
      continue
    }

    // Detect Example Header (e.g. ### **Example 1:** or **Example 1:** or Example 1:)
    const exampleMatch = trimmed.match(/^(?:###\s*)?(?:\*\*)?Example\s*(\d+)?:?(?:\*\*)?:?/i)
    if (exampleMatch) {
      if (curExample) examples.push(curExample)
      const num = exampleMatch[1] ? parseInt(exampleMatch[1], 10) : examples.length + 1
      curExample = { num, diagram: null, input: '', output: '', explanation: '' }
      currentSection = 'example'
      continue
    }

    // Detect Constraints Header (e.g. ### **Constraints:** or Constraints:)
    const constraintsMatch = trimmed.match(/^(?:###\s*)?(?:\*\*)?Constraints:?(?:\*\*)?:?/i)
    if (constraintsMatch) {
      if (curExample) {
        examples.push(curExample)
        curExample = null
      }
      currentSection = 'constraints'
      continue
    }

    if (!trimmed) continue

    // Handle Example section lines
    if (currentSection === 'example' && curExample) {
      if (/^\*?\*?Input\*?\*?:?/i.test(trimmed)) {
        curExample.input = trimmed.replace(/^\*?\*?Input\*?\*?:?\s*/i, '').trim()
        continue
      }
      if (/^\*?\*?Output\*?\*?:?/i.test(trimmed)) {
        curExample.output = trimmed.replace(/^\*?\*?Output\*?\*?:?\s*/i, '').trim()
        continue
      }
      if (/^\*?\*?Explanation\*?\*?:?/i.test(trimmed)) {
        curExample.explanation = trimmed.replace(/^\*?\*?Explanation\*?\*?:?\s*/i, '').trim()
        continue
      }

      // If line is `root = [1,2,3]`, etc.
      if (!curExample.input && /^([a-zA-Z0-9_,\s]+=\s*.*)/.test(trimmed) && !trimmed.toLowerCase().startsWith('output')) {
        curExample.input = trimmed
        continue
      }

      // Continuation lines
      if (curExample.explanation) {
        curExample.explanation += ' ' + trimmed
      } else if (curExample.output) {
        curExample.output += ' ' + trimmed
      } else if (curExample.input) {
        curExample.input += ' ' + trimmed
      } else {
        // If it's an ASCII diagram line not wrapped in code fences
        if (!curExample.diagram) curExample.diagram = trimmed
        else curExample.diagram += '\n' + line
      }
      continue
    }

    // Handle Constraints section lines
    if (currentSection === 'constraints') {
      let cleanConstraint = trimmed.replace(/^[-*•]\s*/, '').trim()
      if (cleanConstraint) {
        constraints.push(cleanConstraint)
      }
      continue
    }

    // Body section paragraphs
    if (currentSection === 'body') {
      if (trimmed !== '---') {
        paragraphs.push({ type: 'text', content: trimmed })
      }
    }
  }

  if (curExample) {
    examples.push(curExample)
  }

  // Fallback if no structured examples found
  if (examples.length === 0 && (sampleInput || sampleOutput)) {
    examples.push({
      num: 1,
      diagram: null,
      input: sampleInput || '',
      output: sampleOutput || '',
      explanation: ''
    })
  }

  return { paragraphs, examples, constraints }
}

function parseBlockIntoExample(block, ex) {
  const lines = block.split('\n')
  for (const l of lines) {
    const trimmed = l.trim()
    if (/^Input:/i.test(trimmed)) {
      ex.input = trimmed.replace(/^Input:\s*/i, '').trim()
    } else if (/^Output:/i.test(trimmed)) {
      ex.output = trimmed.replace(/^Output:\s*/i, '').trim()
    } else if (/^Explanation:/i.test(trimmed)) {
      ex.explanation = trimmed.replace(/^Explanation:\s*/i, '').trim()
    } else if (ex.explanation) {
      ex.explanation += ' ' + trimmed
    } else if (ex.output && !ex.explanation) {
      ex.output += ' ' + trimmed
    } else if (ex.input && !ex.output) {
      ex.input += ' ' + trimmed
    } else if (!ex.input) {
      if (trimmed.startsWith('root =') || trimmed.startsWith('nums =') || trimmed.startsWith('s =') || trimmed.startsWith('p =') || trimmed.startsWith('grid =')) {
        ex.input = trimmed
      } else {
        if (!ex.diagram) ex.diagram = trimmed
        else ex.diagram += '\n' + l
      }
    }
  }
}

/**
 * Authentic LeetCode-grade Problem Description View
 */
export default function LeetCodeProblemView({ problem, difficulty, topic }) {
  const [showTopics, setShowTopics] = useState(false)

  if (!problem) {
    return (
      <div className="p-4 text-center text-[color:var(--c-text-mute)] font-mono text-[11px]">
        Loading problem details...
      </div>
    )
  }

  const { paragraphs, examples, constraints } = parseLeetCodeDescription(
    problem.description,
    problem.sample_input,
    problem.sample_output
  )

  const diffLower = (problem.difficulty || difficulty || 'medium').toLowerCase()

  const DIFF_THEMES = {
    easy: {
      label: 'Easy',
      text: '#00b8a3',
      bg: 'rgba(0, 184, 163, 0.12)',
      border: 'rgba(0, 184, 163, 0.25)'
    },
    medium: {
      label: 'Medium',
      text: '#ffc01e',
      bg: 'rgba(255, 192, 30, 0.12)',
      border: 'rgba(255, 192, 30, 0.25)'
    },
    hard: {
      label: 'Hard',
      text: '#ff375f',
      bg: 'rgba(255, 55, 95, 0.12)',
      border: 'rgba(255, 55, 95, 0.25)'
    }
  }

  const currentDiff = DIFF_THEMES[diffLower] || DIFF_THEMES.medium

  // Topic tags
  const topicTags = (problem.topic || topic || 'Algorithms')
    .split(/[:,]/)
    .map(t => t.trim())
    .filter(Boolean)

  return (
    <div className="flex flex-col space-y-6 pb-6 text-[color:var(--c-text)]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* ── Problem Title & LC Header ──────────────────────── */}
      <div className="space-y-3 pt-1">
        <h1 className="text-[17px] font-bold tracking-tight text-[color:var(--c-text)] leading-snug">
          {problem.title}
        </h1>

        {/* LeetCode Badges Row */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {/* Difficulty Badge */}
          <span
            className="px-2.5 py-0.5 rounded-full font-semibold"
            style={{
              color: currentDiff.text,
              backgroundColor: currentDiff.bg,
              border: `1px solid ${currentDiff.border}`
            }}
          >
            {currentDiff.label}
          </span>

          {/* Topics Tag Button */}
          <button
            onClick={() => setShowTopics(!showTopics)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium transition-colors hover:bg-[color:var(--c-panel2)]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--c-text-dim)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span>Topics</span>
          </button>

          {/* Companies Tag Button */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium cursor-default"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--c-text-mute)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Companies</span>
          </div>
        </div>

        {/* Expanded Topics Pills */}
        {showTopics && (
          <div className="flex flex-wrap gap-1.5 pt-1 animate-fadeIn">
            {topicTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md font-mono text-[10.5px] font-medium"
                style={{
                  backgroundColor: 'rgba(34, 211, 238, 0.1)',
                  color: '#38bdf8',
                  border: '1px solid rgba(34, 211, 238, 0.2)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Problem Statement Paragraphs ───────────────────── */}
      <div className="space-y-3.5 text-[13px] leading-[1.65] text-[color:var(--c-text)]">
        {paragraphs.length > 0 ? (
          paragraphs.map((item, idx) => {
            if (item.type === 'code') {
              return (
                <div
                  key={idx}
                  className="rounded-lg p-3 my-2 font-mono text-[12px] overflow-x-auto"
                  style={{
                    background: 'var(--c-panel2)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#38bdf8'
                  }}
                >
                  <pre className="whitespace-pre">{item.content}</pre>
                </div>
              )
            }
            return (
              <p key={idx} className="leading-relaxed">
                {renderInline(item.content)}
              </p>
            )
          })
        ) : (
          <p className="leading-relaxed">{renderInline(problem.description)}</p>
        )}
      </div>

      {/* ── Example Cards ──────────────────────────────────── */}
      {examples.length > 0 && (
        <div className="space-y-5">
          {examples.map((ex, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-[13px] font-bold text-[color:var(--c-text)] tracking-wide">
                Example {ex.num || idx + 1}:
              </h3>

              <div
                className="rounded-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--c-panel2)',
                  border: '1px solid rgba(255, 255, 255, 0.09)'
                }}
              >
                {/* Visual Tree / ASCII Diagram Preview if present */}
                {ex.diagram && (
                  <div
                    className="px-4 py-3 font-mono text-[12px] leading-tight overflow-x-auto border-b"
                    style={{
                      backgroundColor: 'var(--c-panel)',
                      borderColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#38bdf8'
                    }}
                  >
                    <pre className="whitespace-pre font-mono font-medium">{ex.diagram}</pre>
                  </div>
                )}

                {/* Input / Output / Explanation Block */}
                <div className="px-4 py-3 space-y-2 font-mono text-[12px]">
                  {ex.input && (
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-[color:var(--c-text-mute)] shrink-0 font-sans text-[12px]">Input:</span>
                      <code className="text-[color:var(--c-text)] break-all">{ex.input}</code>
                    </div>
                  )}

                  {ex.output && (
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-[color:var(--c-text-mute)] shrink-0 font-sans text-[12px]">Output:</span>
                      <code className="text-[#34d399] font-bold break-all">{ex.output}</code>
                    </div>
                  )}

                  {ex.explanation && (
                    <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
                      <span className="font-bold text-[color:var(--c-text-mute)] shrink-0 font-sans text-[12px]">Explanation:</span>
                      <span className="text-[color:var(--c-text)] font-sans text-[12px] leading-relaxed">
                        {renderInline(ex.explanation)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Constraints Section ────────────────────────────── */}
      {constraints.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <h3 className="text-[13px] font-bold text-[color:var(--c-text)] tracking-wide">
            Constraints:
          </h3>
          <ul className="space-y-1.5 text-[12.5px] text-[color:var(--c-text)] pl-1">
            {constraints.map((c, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-[color:var(--c-text-mute)] text-[10px] mt-1 shrink-0">•</span>
                <div className="flex-1">
                  {renderInline(c.startsWith('`') ? c : `\`${c}\``)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
