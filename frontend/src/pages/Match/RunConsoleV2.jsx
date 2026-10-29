import React, { useState, useEffect } from 'react'

function CheckIcon({ size = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  )
}

function CrossIcon({ size = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function ClockIcon({ size = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2 1.5" />
    </svg>
  )
}

function AlertIcon({ size = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 2l6.5 12H1.5L8 2z" />
      <path d="M8 6.5v3" />
      <circle cx="8" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CopyIcon({ size = 11 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" />
    </svg>
  )
}

function ChevronUpIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10l4-4 4 4" />
    </svg>
  )
}

function ChevronDownIcon({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export default function RunConsoleV2({
  runResult,
  submitResult,
  submitting,
  submitProgress,
  onClose,
}) {
  const [tab, setTab] = useState(submitting || submitResult ? 'submit' : 'run')
  const [expanded, setExpanded] = useState(true)
  const [selectedTestIndex, setSelectedTestIndex] = useState(0)
  const [copiedKey, setCopiedKey] = useState(null)

  useEffect(() => {
    if (submitting) setTab('submit')
  }, [submitting])

  useEffect(() => {
    if (submitResult) {
      setTab('submit')
      setSelectedTestIndex(0)
    }
  }, [submitResult])

  useEffect(() => {
    if (runResult && !submitting && !submitResult) {
      setTab('run')
      setSelectedTestIndex(0)
    }
  }, [runResult, submitting, submitResult])

  if (!runResult && !submitResult && !submitting) return null

  const isLiveJudging = submitting && tab === 'submit'
  const details = tab === 'run' ? runResult : submitResult

  const currentTest = submitProgress?.testIndex || 1
  const totalTestsCount = submitProgress?.totalTests || details?.totalTests || 0
  const progressPercent =
    totalTestsCount > 0 ? Math.min(100, Math.round((currentTest / totalTestsCount) * 100)) : 15

  const testResults = details?.testResults || []
  const activeTest = testResults[selectedTestIndex] || testResults[0] || null

  const handleCopy = (text, key) => {
    const val = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text ?? '')
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val).then(() => {
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 1800)
      }).catch(() => {})
    }
  }

  // Verdict definitions (status word + mark + token)
  const getVerdictPresentation = (v) => {
    switch (v) {
      case 'ACCEPTED':
        return {
          label: 'Accepted',
          token: 'ok',
          color: 'var(--ok, #10b981)',
          border: 'rgba(16, 185, 129, 0.35)',
          Icon: CheckIcon,
        }
      case 'WRONG_ANSWER':
        return {
          label: 'Wrong Answer',
          token: 'bad',
          color: 'var(--bad, #f43f5e)',
          border: 'rgba(244, 63, 94, 0.35)',
          Icon: CrossIcon,
        }
      case 'TIME_LIMIT_EXCEEDED':
        return {
          label: 'Time Limit',
          token: 'warn',
          color: 'var(--warn, #f59e0b)',
          border: 'rgba(245, 158, 11, 0.35)',
          Icon: ClockIcon,
        }
      case 'RUNTIME_ERROR':
        return {
          label: 'Runtime Error',
          token: 'bad',
          color: 'var(--bad, #f43f5e)',
          border: 'rgba(244, 63, 94, 0.35)',
          Icon: AlertIcon,
        }
      case 'COMPILATION_ERROR':
        return {
          label: 'Compilation Error',
          token: 'bad',
          color: 'var(--bad, #f43f5e)',
          border: 'rgba(244, 63, 94, 0.35)',
          Icon: AlertIcon,
        }
      default:
        return {
          label: 'Judging',
          token: 'info',
          color: 'var(--info, #38bdf8)',
          border: 'rgba(56, 189, 248, 0.35)',
          Icon: ClockIcon,
        }
    }
  }

  const vp = getVerdictPresentation(details?.verdict)

  return (
    <div
      className={`battle-v2__console ${expanded ? 'battle-v2__console--expanded' : 'battle-v2__console--collapsed'}`}
      style={{ borderColor: details?.verdict ? vp.border : 'var(--c-border, rgba(255,255,255,0.08))' }}
      role="region"
      aria-label="Run and Submit Console"
    >
      {/* Header bar */}
      <div className="battle-v2__console-header">
        {/* Left: Run / Submit tabs */}
        <div className="battle-v2__console-tabs" role="tablist">
          {runResult && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'run'}
              onClick={() => setTab('run')}
              className={`battle-v2__console-tab ${tab === 'run' ? 'battle-v2__console-tab--active' : ''}`}
            >
              <span>Run</span>
            </button>
          )}

          {(submitResult || submitting) && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'submit'}
              onClick={() => setTab('submit')}
              className={`battle-v2__console-tab ${tab === 'submit' ? 'battle-v2__console-tab--active' : ''}`}
            >
              <span>Submit</span>
              {isLiveJudging && (
                <span className="battle-v2__console-pulse" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Center/Right: Verdict + Summary + Drawer controls */}
        <div className="battle-v2__console-status-group">
          {isLiveJudging ? (
            <div className="battle-v2__console-verdict-tag font-mono text-[11px] font-bold text-[var(--info,#38bdf8)]">
              <span>Evaluating ({currentTest}/{totalTestsCount || '...'})</span>
            </div>
          ) : details?.verdict ? (
            <div
              className="battle-v2__console-verdict-tag font-mono text-[11px] font-bold"
              style={{ color: vp.color }}
            >
              <vp.Icon size={12} />
              <span>{vp.label}</span>
            </div>
          ) : null}

          {!isLiveJudging && details && (
            <span className="battle-v2__console-meta font-mono text-[10px]">
              {details.passedTests ?? 0}/{details.totalTests ?? 0} cases · {details.runtimeMs || 0}ms
            </span>
          )}

          {/* Toggle Expand / Collapse */}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="battle-v2__console-ctrl-btn"
            title={expanded ? 'Collapse console' : 'Expand console'}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDownIcon size={13} /> : <ChevronUpIcon size={13} />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="battle-v2__console-ctrl-btn"
            title="Close console"
            aria-label="Close console"
          >
            <CrossIcon size={11} />
          </button>
        </div>
      </div>

      {/* Console Body (collapsible) */}
      {expanded && (
        <div className="battle-v2__console-body">
          {/* Live Judging Progress Bar */}
          {isLiveJudging ? (
            <div className="battle-v2__console-progress-wrap">
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--info,#38bdf8)]">
                    Evaluating Test Cases
                  </span>
                  <span className="text-[var(--c-text-dim,#94a3b8)] text-[11px]">
                    Passing {currentTest} of {totalTestsCount || '...'}
                  </span>
                </div>
                <span className="font-mono text-[var(--info,#38bdf8)] font-bold tabular-nums">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress bar line */}
              <div className="battle-v2__console-progress-track">
                <div
                  className="battle-v2__console-progress-bar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--c-text-mute,#64748b)]">
                <span>Running isolated test container</span>
                <span className="text-[var(--info,#38bdf8)]">Test #{currentTest} active</span>
              </div>
            </div>
          ) : (
            <div className="battle-v2__console-results-layout">
              {/* Ruled test rows column */}
              <div className="battle-v2__test-rows-rail" role="tablist" aria-label="Test Cases">
                {testResults.map((tc, idx) => {
                  const active = selectedTestIndex === idx
                  const passed = tc.passed
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedTestIndex(idx)}
                      className={`battle-v2__test-row-btn ${
                        active ? 'battle-v2__test-row-btn--active' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {passed ? (
                          <span className="text-[var(--ok,#10b981)]">
                            <CheckIcon size={11} />
                          </span>
                        ) : (
                          <span className="text-[var(--bad,#f43f5e)]">
                            <CrossIcon size={11} />
                          </span>
                        )}
                        <span>Test {tc.testIndex || idx + 1}</span>
                        {tc.isHidden && <span className="battle-v2__hidden-tag">Hidden</span>}
                      </span>
                      {tc.runtimeMs > 0 && (
                        <span className="battle-v2__test-ms">{tc.runtimeMs}ms</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Selected Test Case Details */}
              <div className="battle-v2__test-details-pane">
                {activeTest ? (
                  activeTest.isHidden && !activeTest.passed ? (
                    <div className="battle-v2__test-hidden-notice">
                      <p className="font-mono text-xs text-[var(--bad,#f43f5e)] font-bold mb-1">
                        Failed on hidden test case
                      </p>
                      <p className="font-mono text-[11px] text-[var(--c-text-dim,#94a3b8)]">
                        {activeTest.error
                          ? `Error: ${activeTest.error}`
                          : 'Output does not match expected result on hidden evaluation data.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Input Block */}
                      <div className="battle-v2__code-block-wrap">
                        <div className="battle-v2__code-block-header">
                          <span className="battle-v2__code-block-label">Input</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeTest.input, `input-${selectedTestIndex}`)}
                            className="battle-v2__code-copy-btn"
                          >
                            <CopyIcon size={10} />
                            <span>{copiedKey === `input-${selectedTestIndex}` ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="battle-v2__code-pre">
                          <code>
                            {typeof activeTest.input === 'object'
                              ? JSON.stringify(activeTest.input, null, 2)
                              : String(activeTest.input ?? '')}
                          </code>
                        </pre>
                      </div>

                      {/* Expected Block */}
                      <div className="battle-v2__code-block-wrap">
                        <div className="battle-v2__code-block-header">
                          <span className="battle-v2__code-block-label">Expected</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(activeTest.expected, `expected-${selectedTestIndex}`)
                            }
                            className="battle-v2__code-copy-btn"
                          >
                            <CopyIcon size={10} />
                            <span>
                              {copiedKey === `expected-${selectedTestIndex}` ? 'Copied' : 'Copy'}
                            </span>
                          </button>
                        </div>
                        <pre className="battle-v2__code-pre battle-v2__code-pre--expected">
                          <code>
                            {typeof activeTest.expected === 'object'
                              ? JSON.stringify(activeTest.expected, null, 2)
                              : String(activeTest.expected ?? '')}
                          </code>
                        </pre>
                      </div>

                      {/* Actual / Error Block */}
                      {!activeTest.passed && (
                        <div className="battle-v2__code-block-wrap">
                          <div className="battle-v2__code-block-header">
                            <span className="battle-v2__code-block-label text-[var(--bad,#f43f5e)]">
                              {activeTest.error ? 'Runtime Error' : 'Actual'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  activeTest.error || activeTest.actual,
                                  `actual-${selectedTestIndex}`
                                )
                              }
                              className="battle-v2__code-copy-btn"
                            >
                              <CopyIcon size={10} />
                              <span>
                                {copiedKey === `actual-${selectedTestIndex}` ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                          </div>
                          <pre className="battle-v2__code-pre battle-v2__code-pre--actual">
                            <code>
                              {activeTest.error
                                ? String(activeTest.error)
                                : typeof activeTest.actual === 'object'
                                ? JSON.stringify(activeTest.actual, null, 2)
                                : String(activeTest.actual ?? 'null')}
                            </code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <p className="font-mono text-xs text-[var(--c-text-mute,#64748b)]">
                    No test case details available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

