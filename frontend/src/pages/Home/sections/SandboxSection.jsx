import React, { useState, useCallback } from 'react'
import { HOME_CONFIG } from '../../../content/home'
import { IconCopy, IconCheck, IconShield } from '../../../components/icons'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { s4Sandbox } = HOME_CONFIG

export default function SandboxSection() {
  const [activeLangId, setActiveLangId] = useState('javascript')
  const [copied, setCopied] = useState(false)

  const activeLang = s4Sandbox.languages.find((l) => l.id === activeLangId) || s4Sandbox.languages[0]

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeLang.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea')
      textarea.value = activeLang.code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [activeLang])

  // Simple token parser for syntax highlight tinting
  const renderHighlightedLines = (codeStr, langId) => {
    const lines = codeStr.split('\n')
    return lines.map((line, idx) => {
      // Basic keyword tinting without heavy external runtime
      let content = line
      return (
        <div key={idx} className="code-line">
          <span className="code-lineno">{idx + 1}</span>
          <span className="code-text">{content}</span>
        </div>
      )
    })
  }

  return (
    <section className="home-section" id="sandbox" data-mascot-section="sandbox">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s4-sandbox" enter={true} exit={true}>
        <div className="section-container">
          
          {/* Editorial Section Header */}
          <div className="section-header depth-heading-layer">
            <span className="section-kicker">{s4Sandbox.kicker}</span>
            <h2 className="section-title">{s4Sandbox.title}</h2>
            <p className="section-body">{s4Sandbox.body}</p>
          </div>

          {/* 2-Column Layout: Definition List on Left, Plain Code Editor on Right */}
          <div className="sandbox-grid-layout">
            
            {/* Left: Limits Definition List */}
            <div className="sandbox-limits-rail">
              <div className="limits-card-header">
                <div className="limits-header-left">
                  <IconShield size={16} />
                  <span>SANDBOX ISOLATION ENVELOPE</span>
                </div>
                <span className="limits-badge-live">LOCKED ROOT</span>
              </div>

              <dl className="sandbox-limits-dl">
                {s4Sandbox.limits.map((item) => (
                  <div key={item.label} className="sandbox-limit-row stagger-row">
                    <dt className="sandbox-limit-term">{item.label}</dt>
                    <dd className="sandbox-limit-def">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="sandbox-notes-footer">
                <span className="notes-pill">SECCOMP STRICT</span>
                <span className="notes-desc">Zero socket access, PID namespace isolation, read-only root mounting.</span>
              </div>
            </div>

            {/* Right: Plain 4-Language Code Editor */}
            <div className="sandbox-editor-panel depth-visual-panel anim-enter">
              
              {/* Editor Tab Bar */}
              <div className="sandbox-tab-bar">
                <div className="sandbox-tabs-list" role="tablist" aria-label="Select Programming Language">
                  {s4Sandbox.languages.map((lang) => {
                    const isSelected = lang.id === activeLangId
                    return (
                      <button
                        key={lang.id}
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveLangId(lang.id)}
                        className={`sandbox-tab-btn ${isSelected ? 'is-active-tab' : ''}`}
                      >
                        <span>{lang.name}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="sandbox-tab-meta">
                  <span className="tab-runtime-pill">{activeLang.runtime}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="tab-copy-btn"
                    aria-label="Copy solution code"
                  >
                    {copied ? (
                      <>
                        <IconCheck size={14} className="copy-icon-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <IconCopy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editor Code Header */}
              <div className="editor-file-info">
                <span className="file-name">{activeLang.filename}</span>
                <span className="file-env">Linux container runner / Strict memory capped</span>
              </div>

              {/* Code Body */}
              <div className="sandbox-code-body">
                <pre className="sandbox-pre">
                  <code>
                    {renderHighlightedLines(activeLang.code, activeLang.id)}
                  </code>
                </pre>
              </div>

            </div>

          </div>

        </div>
      </DepthSection>
    </section>
  )
}
