import React from 'react';

/**
 * frontend/src/utils/markdown.jsx
 *
 * Safe client-side markdown parser for AlgoArena Discussion Rooms:
 * - Pure React elements AST (zero dangerouslySetInnerHTML)
 * - Raw HTML is strictly escaped
 * - Supported syntax:
 *     - Fenced code blocks (```lang ... ```) with language tag
 *     - Inline code (`code`)
 *     - Bold (**text**)
 *     - Bullet lists (* or -)
 *     - Paragraphs (blank line separation)
 *     - Safe URLs ([label](http...) or auto-detected URLs)
 *       Target: _blank, rel="noopener noreferrer nofollow ugc"
 *       Rendered as plain text if linksAllowed is false.
 */

/**
 * Parse inline elements: bold, inline code, and safe links
 */
function parseInline(text, { linksAllowed = true } = {}) {
  if (!text) return [];

  const elements = [];
  let remaining = text;
  let keyIndex = 0;

  // Regex for inline code: `code`, bold: **bold**, and markdown links: [text](url)
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<]+)/g;

  let match;
  let lastIndex = 0;

  while ((match = inlineRegex.exec(remaining)) !== null) {
    // Plain text before the match
    if (match.index > lastIndex) {
      elements.push(remaining.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      // Inline code
      const codeContent = matchedStr.slice(1, -1);
      elements.push(
        <code
          key={`code-${keyIndex++}`}
          className="px-1.5 py-0.5 rounded text-[13px] font-mono border"
          style={{
            background: 'var(--c-panel2, #2f2f2f)',
            borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))',
            color: 'var(--c-blue, #38bdf8)'
          }}
        >
          {codeContent}
        </code>
      );
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      // Bold
      const boldContent = matchedStr.slice(2, -2);
      elements.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-white">
          {parseInline(boldContent, { linksAllowed })}
        </strong>
      );
    } else if (matchedStr.startsWith('[') && match[2] && match[3]) {
      // Markdown link [text](url)
      const linkText = match[2];
      const linkUrl = match[3];

      if (linksAllowed && /^https?:\/\//i.test(linkUrl)) {
        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-sky-400 hover:text-sky-300 underline underline-offset-2 break-all"
          >
            {linkText}
          </a>
        );
      } else {
        elements.push(`${linkText} (${linkUrl})`);
      }
    } else if (/^https?:\/\//i.test(matchedStr)) {
      // Raw URL auto-linking
      if (linksAllowed) {
        elements.push(
          <a
            key={`url-${keyIndex++}`}
            href={matchedStr}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="text-sky-400 hover:text-sky-300 underline underline-offset-2 break-all"
          >
            {matchedStr}
          </a>
        );
      } else {
        elements.push(matchedStr);
      }
    }

    lastIndex = match.index + matchedStr.length;
  }

  if (lastIndex < remaining.length) {
    elements.push(remaining.substring(lastIndex));
  }

  return elements;
}

/**
 * Main safe markdown renderer component
 */
export function SafeMarkdown({ content = '', linksAllowed = true, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  // Split content into blocks by fenced code blocks first
  const blocks = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];
  let textLines = [];

  function flushTextLines() {
    if (textLines.length === 0) return;
    const textBlock = textLines.join('\n').trim();
    textLines = [];
    if (!textBlock) return;

    // Split text block by double newlines into paragraphs and lists
    const paragraphs = textBlock.split(/\n{2,}/);
    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      const paraLines = trimmedPara.split('\n');
      const isList = paraLines.every(l => /^\s*[-*]\s+/.test(l));

      if (isList) {
        blocks.push({
          type: 'list',
          items: paraLines.map(l => l.replace(/^\s*[-*]\s+/, ''))
        });
      } else {
        blocks.push({
          type: 'paragraph',
          content: trimmedPara
        });
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```/.test(line.trim())) {
      if (!inCodeBlock) {
        // Start of code block
        flushTextLines();
        inCodeBlock = true;
        codeLang = line.trim().replace(/^```/, '').trim() || 'code';
        codeLines = [];
      } else {
        // End of code block
        inCodeBlock = false;
        blocks.push({
          type: 'code',
          lang: codeLang,
          code: codeLines.join('\n')
        });
        codeLines = [];
        codeLang = '';
      }
    } else if (inCodeBlock) {
      codeLines.push(line);
    } else {
      textLines.push(line);
    }
  }

  // Handle unterminated code block or trailing text
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({
      type: 'code',
      lang: codeLang || 'code',
      code: codeLines.join('\n')
    });
  } else {
    flushTextLines();
  }

  return (
    <div className={`space-y-3 leading-relaxed text-[14px] text-zinc-300 font-sans ${className}`}>
      {blocks.map((b, idx) => {
        if (b.type === 'code') {
          return (
            <div
              key={`block-${idx}`}
              className="my-3 rounded-lg border overflow-hidden"
              style={{
                background: 'var(--c-void, #141824)',
                borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))'
              }}
            >
              <div
                className="px-3 py-1.5 border-b flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-zinc-400 select-none"
                style={{
                  background: 'var(--c-panel, #1e2433)',
                  borderColor: 'var(--c-border, rgba(255, 255, 255, 0.08))'
                }}
              >
                <span>{b.lang}</span>
                <span>{b.code.split('\n').length} lines</span>
              </div>
              <pre className="p-3.5 overflow-x-auto text-[13px] font-mono text-zinc-200 leading-normal select-text">
                <code>{b.code}</code>
              </pre>
            </div>
          );
        }

        if (b.type === 'list') {
          return (
            <ul key={`block-${idx}`} className="list-disc list-outside pl-5 space-y-1.5 my-2 text-zinc-300">
              {b.items.map((item, itemIdx) => (
                <li key={`item-${itemIdx}`} className="leading-snug">
                  {parseInline(item, { linksAllowed })}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`block-${idx}`} className="my-1.5 whitespace-pre-wrap leading-relaxed text-zinc-300">
            {parseInline(b.content, { linksAllowed })}
          </p>
        );
      })}
    </div>
  );
}
