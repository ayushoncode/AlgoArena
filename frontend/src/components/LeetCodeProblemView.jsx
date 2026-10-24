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
          className="font-mono text-[11.5px] px-1.5 py-0.5 rounded font-medium inline-block my-0.5"
          style={{
            backgroundColor: 'var(--c-panel2)',
            color: 'var(--c-text)',
            border: '1px solid var(--c-border)',
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
      constraints: [],
      hints: []
    }
  }

  // Normalize newlines and strip excessive trailing/leading spacing
  const desc = rawDesc.replace(/\r\n/g, '\n').trim()

  const paragraphs = []
  const examples = []
  const constraints = []
  const hints = []

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

    // Defensive check: if inside code fence and encounter a major section header, force close fence
    if (inCodeFence && /^###\s+/i.test(trimmed)) {
      inCodeFence = false
      const blockContent = codeFenceBuffer.join('\n').trimEnd()
      codeFenceBuffer = []
      if (currentSection === 'example' && curExample) {
        if (/Input:|Output:/i.test(blockContent)) {
          parseBlockIntoExample(blockContent, curExample)
        } else {
          curExample.diagram = blockContent
        }
      } else if (currentSection === 'body') {
        paragraphs.push({ type: 'code', content: blockContent })
      }
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
      curExample = { num, diagram: null, input: '', output: '', explanation: '', inExplanation: false }
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

    // Detect Hints Header
    const hintsMatch = trimmed.match(/^(?:###\s*)?(?:\*\*)?Hints:?(?:\*\*)?:?/i)
    if (hintsMatch) {
      if (curExample) {
        examples.push(curExample)
        curExample = null
      }
      currentSection = 'hints'
      continue
    }

    if (!trimmed) continue

    // Handle Example section lines
    // Handle Example section lines
    if (currentSection === 'example' && curExample) {
      const mdImgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/)
      const htmlImgMatch = trimmed.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
      const imgUrl = mdImgMatch ? mdImgMatch[2] : (htmlImgMatch ? htmlImgMatch[1] : null)
      if (imgUrl) {
        curExample.image = imgUrl
        continue
      }

      if (/^\*?\*?Input\*?\*?:?/i.test(trimmed)) {
        curExample.input = trimmed.replace(/^\*?\*?Input\*?\*?:?\s*/i, '').trim()
        curExample.inExplanation = false
        continue
      }
      if (/^\*?\*?Output\*?\*?:?/i.test(trimmed)) {
        curExample.output = trimmed.replace(/^\*?\*?Output\*?\*?:?\s*/i, '').trim()
        curExample.inExplanation = false
        continue
      }
      if (/^\*?\*?Explanation\*?\*?:?/i.test(trimmed)) {
        curExample.explanation = trimmed.replace(/^\*?\*?Explanation\*?\*?:?\s*/i, '').trim()
        curExample.inExplanation = true
        continue
      }

      // If line is `root = [1,2,3]`, etc.
      if (!curExample.input && /^([a-zA-Z0-9_,\s]+=\s*.*)/.test(trimmed) && !trimmed.toLowerCase().startsWith('output')) {
        curExample.input = trimmed
        continue
      }

      // Continuation lines
      if (curExample.inExplanation) {
        curExample.explanation = curExample.explanation ? curExample.explanation + '\n' + trimmed : trimmed
        continue
      } else if (curExample.output) {
        curExample.output += ' ' + trimmed
        continue
      } else if (curExample.input) {
        curExample.input += ' ' + trimmed
        continue
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

    // Handle Hints section lines
    if (currentSection === 'hints') {
      let cleanHint = trimmed.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '').trim()
      if (cleanHint) {
        hints.push(cleanHint)
      }
      continue
    }

    // Body section paragraphs
    if (currentSection === 'body') {
      if (trimmed !== '---') {
        const mdImgMatch = trimmed.match(/!\[(.*?)\]\((.*?)\)/)
        const htmlImgMatch = trimmed.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
        const imgUrl = mdImgMatch ? mdImgMatch[2] : (htmlImgMatch ? htmlImgMatch[1] : null)
        if (imgUrl) {
          paragraphs.push({ type: 'image', url: imgUrl, alt: mdImgMatch ? mdImgMatch[1] : 'Diagram' })
        } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // Check if previous paragraph was a table
          const prev = paragraphs[paragraphs.length - 1]
          const cells = trimmed.slice(1, -1).split('|').map(c => c.trim())
          const isSeparator = cells.every(c => /^:?-+:?$/.test(c))
          
          if (prev && prev.type === 'table') {
            if (!isSeparator) {
              prev.rows.push(cells)
            }
          } else {
            paragraphs.push({ type: 'table', headers: cells, rows: [] })
          }
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          paragraphs.push({ type: 'list_item', content: trimmed.slice(2).trim() })
        } else {
          paragraphs.push({ type: 'text', content: trimmed })
        }
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

  return { paragraphs, examples, constraints, hints }
}

function parseBlockIntoExample(block, ex) {
  const lines = block.split('\n')
  for (const l of lines) {
    const trimmed = l.trim()
    if (!trimmed) continue
    if (/^Input:/i.test(trimmed)) {
      ex.input = trimmed.replace(/^Input:\s*/i, '').trim()
      ex.inExplanation = false
    } else if (/^Output:/i.test(trimmed)) {
      ex.output = trimmed.replace(/^Output:\s*/i, '').trim()
      ex.inExplanation = false
    } else if (/^Explanation:/i.test(trimmed)) {
      ex.explanation = trimmed.replace(/^Explanation:\s*/i, '').trim()
      ex.inExplanation = true
    } else if (ex.inExplanation) {
      ex.explanation = ex.explanation ? ex.explanation + '\n' + trimmed : trimmed
    } else if (ex.output && !ex.inExplanation) {
      ex.output += ' ' + trimmed
    } else if (ex.input && !ex.output) {
      ex.input += ' ' + trimmed
    } else if (!ex.input) {
      if ((trimmed.includes('=') || /^([a-zA-Z0-9_,\s]+=\s*.*)/.test(trimmed)) && !trimmed.toLowerCase().startsWith('output') && !trimmed.toLowerCase().startsWith('explanation')) {
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

  const { paragraphs, examples, constraints, hints: parsedHints } = parseLeetCodeDescription(
    problem.description,
    problem.sample_input,
    problem.sample_output
  )

  const hints = React.useMemo(() => {
    const fromProp = Array.isArray(problem?.hints) ? problem.hints : []
    const fromDesc = parsedHints || []
    const combined = [...fromProp, ...fromDesc]
    return Array.from(new Set(combined.map(h => typeof h === 'string' ? h.trim() : h))).filter(Boolean)
  }, [parsedHints, problem?.hints])

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
              backgroundColor: 'var(--c-panel2)',
              color: 'var(--c-text-dim)',
              border: '1px solid var(--c-border)'
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
              backgroundColor: 'var(--c-panel2)',
              color: 'var(--c-text-mute)',
              border: '1px solid var(--c-border)'
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
                  backgroundColor: 'var(--c-panel2)',
                  color: 'var(--c-text)',
                  border: '1px solid var(--c-border)'
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
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text)'
                  }}
                >
                  <pre className="whitespace-pre">{item.content}</pre>
                </div>
              )
            }
            if (item.type === 'image') {
              return (
                <div key={idx} className="bg-white p-2.5 rounded-lg my-3 border inline-block" style={{ borderColor: 'var(--c-border)' }}>
                  <img
                    src={item.url}
                    alt={item.alt || "Problem illustration"}
                    className="max-w-full h-auto max-h-64 object-contain rounded"
                    onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                  />
                </div>
              )
            }
            if (item.type === 'table') {
              return (
                <div key={idx} className="my-3 overflow-x-auto">
                  <table className="border-collapse text-[12px] border" style={{ borderColor: 'var(--c-border)' }}>
                    {item.headers && item.headers.length > 0 && (
                      <thead>
                        <tr style={{ background: 'var(--c-panel2)' }}>
                          {item.headers.map((h, hi) => (
                            <th key={hi} className="px-4 py-1.5 border font-semibold text-center" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}>
                              {renderInline(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {item.rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-[color:var(--c-panel2)]/50">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-1.5 border text-center font-mono text-[12px]" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text)' }}>
                              {renderInline(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            if (item.type === 'list_item') {
              return (
                <li key={idx} className="ml-5 list-disc pl-1 leading-relaxed text-[13px]">
                  {renderInline(item.content)}
                </li>
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
                  border: '1px solid var(--c-border)'
                }}
              >
                {ex.image && (
                  <div className="bg-white p-2.5 border-b flex items-center justify-center" style={{ borderColor: 'var(--c-border)' }}>
                    <img
                      src={ex.image}
                      alt={`Example ${ex.num || idx + 1}`}
                      className="max-w-full h-auto max-h-64 object-contain rounded"
                      onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                    />
                  </div>
                )}
                {/* Visual Tree / ASCII Diagram Preview if present */}
                {ex.diagram && (
                  <div
                    className="px-4 py-3 font-mono text-[12px] leading-tight overflow-x-auto border-b"
                    style={{
                      backgroundColor: 'var(--c-panel)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text)'
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
                      <code className="text-[color:var(--c-text)] break-all max-h-36 overflow-y-auto block pr-1">
                        {ex.input.length > 500 ? ex.input.slice(0, 300) + ` ... [truncated ${ex.input.length - 300} chars]` : ex.input}
                      </code>
                    </div>
                  )}

                  {ex.output && (
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-bold text-[color:var(--c-text-mute)] shrink-0 font-sans text-[12px]">Output:</span>
                      <code className="text-[#34d399] font-bold break-all max-h-36 overflow-y-auto block pr-1">
                        {ex.output.length > 500 ? ex.output.slice(0, 300) + ` ... [truncated ${ex.output.length - 300} chars]` : ex.output}
                      </code>
                    </div>
                  )}

                  {ex.explanation && (
                    <div className="pt-1 space-y-1">
                      <span className="font-bold text-[color:var(--c-text-mute)] shrink-0 font-sans text-[12px] block">Explanation:</span>
                      <div className="text-[color:var(--c-text)] font-sans text-[12px] leading-relaxed whitespace-pre-line pl-0.5">
                        {renderInline(ex.explanation)}
                      </div>
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
            {constraints.map((c, idx) => {
              let content = c
              if (!c.includes('`')) {
                if (/^[0-9\s\-+*^≤≥<>=a-zA-Z_\[\].]+$/.test(c) && (/[<>=≤≥]/.test(c) || c.includes('length'))) {
                  content = `\`${c}\``
                }
              }
              return (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-[color:var(--c-text-mute)] text-[10px] mt-1 shrink-0">•</span>
                  <div className="flex-1 text-[color:var(--c-text)]">
                    {renderInline(content)}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {/* ── Hints Section ──────────────────────────────────── */}
      {hints && hints.length > 0 && (
        <div className="space-y-2 pt-5 border-t mt-4" style={{ borderColor: 'var(--c-border)' }}>
          {hints.map((hint, idx) => (
            <details key={idx} className="group overflow-hidden rounded-md" style={{ backgroundColor: 'var(--c-panel2)', border: '1px solid var(--c-border)' }}>
              <summary className="cursor-pointer select-none px-4 py-2.5 text-[13px] font-medium text-[color:var(--c-text)] flex items-center justify-between hover:bg-[color:var(--c-panel)] transition-colors">
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-text-mute)' }}>
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2v1" />
                    <path d="M12 7a5 5 0 0 0-5 5c0 2 1.5 3.5 1.5 5h7c0-1.5 1.5-3 1.5-5a5 5 0 0 0-5-5z" />
                  </svg>
                  Hint {idx + 1}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-open:rotate-180" style={{ color: 'var(--c-text-mute)' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </summary>
              <div className="px-4 py-3 text-[13px] leading-relaxed border-t" style={{ borderColor: 'var(--c-border)', backgroundColor: 'var(--c-panel)', color: 'var(--c-text)' }}>
                {renderInline(hint)}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
