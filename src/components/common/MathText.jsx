import React from 'react';
import katex from 'katex';

/**
 * Component render nội dung kết hợp giữa Text và biểu thức LaTeX / Math.
 * Hỗ trợ các cú pháp:
 *  - Inline math: $ ... $ hoặc \( ... \)
 *  - Block math:  $$ ... $$ hoặc \[ ... \]
 *  - Tự động nhận diện chuỗi thuần LaTeX (chứa \frac, \int, \sqrt, \begin{...})
 */
export default function MathText({ content, className = '', style = {}, inline = false }) {
  if (content === null || content === undefined || content === '') {
    return null;
  }

  const str = String(content);

  // Regex phát hiện các khối math có delimiter:
  // $$ ... $$, \[ ... \], $ ... $, \( ... \)
  const MATH_REGEX = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;

  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(MATH_REGEX);

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: str.substring(lastIndex, match.index) });
    }

    const raw = match[0];
    let isBlock = false;
    let mathStr = raw;

    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      isBlock = !inline;
      mathStr = raw.slice(2, -2);
    } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
      isBlock = !inline;
      mathStr = raw.slice(2, -2);
    } else if (raw.startsWith('$') && raw.endsWith('$')) {
      isBlock = false;
      mathStr = raw.slice(1, -1);
    } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
      isBlock = false;
      mathStr = raw.slice(2, -2);
    }

    parts.push({ type: 'math', content: mathStr.trim(), isBlock });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push({ type: 'text', content: str.substring(lastIndex) });
  }

  // Trường hợp không có delimiter $ hay \[, nhưng chuỗi chứa lệnh LaTeX điển hình:
  if (parts.length === 1 && parts[0].type === 'text') {
    const isPureLatex = /\\(frac|sqrt|int|sum|lim|prod|partial|alpha|beta|gamma|delta|theta|lambda|pi|sigma|infty|begin|pmatrix|bmatrix|matrix|times|div|pm|neq|le|ge|approx|forall|exists|in|subset|cap|cup|vec|text|mathbf|mathit|mathrm)\b/.test(str);
    if (isPureLatex) {
      const isBlock = !inline && (str.includes('\n') || str.includes('\\begin'));
      parts[0] = { type: 'math', content: str.trim(), isBlock };
    }
  }

  return (
    <span className={`math-text-container ${className}`} style={{ ...style }}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.content}</span>;
        }

        try {
          const html = katex.renderToString(part.content, {
            displayMode: part.isBlock,
            throwOnError: false,
          });

          return (
            <span
              key={idx}
              className={`katex-render ${part.isBlock ? 'katex-block' : 'katex-inline'}`}
              style={
                part.isBlock
                  ? {
                      display: 'block',
                      margin: '10px 0',
                      textAlign: 'center',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      padding: '4px 0',
                    }
                  : {
                      display: 'inline',
                      margin: '0 2px',
                    }
              }
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          return (
            <span key={idx} style={{ color: '#dc2626', fontFamily: 'monospace' }}>
              {part.content}
            </span>
          );
        }
      })}
    </span>
  );
}

