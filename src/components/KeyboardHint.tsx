'use client'

import { useState, useEffect } from 'react'

export default function KeyboardHint() {
  const [visible, setVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!isDesktop) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          background: 'var(--nabu-surface-2, #1e1e2e)',
          border: '1px solid var(--nabu-border, rgba(255,255,255,0.08))',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          padding: '2px 12px',
          fontSize: 14,
          cursor: 'pointer',
          color: 'var(--nabu-dim, #888)',
        }}
        aria-label="Toggle keyboard shortcuts"
      >
        {visible ? 'Hide shortcuts' : '\u2328\uFE0F'}
      </button>

      {visible && (
        <div
          style={{
            width: '100%',
            background: 'var(--nabu-surface-2, #1e1e2e)',
            borderTop: '1px solid var(--nabu-border, rgba(255,255,255,0.08))',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            flexWrap: 'wrap',
            fontSize: 13,
            color: 'var(--nabu-dim, #888)',
          }}
        >
          <span>
            <kbd style={kbdStyle}>Space</kbd> reveal / next
          </span>
          <span>
            <kbd style={kbdStyle}>1</kbd> again
          </span>
          <span>
            <kbd style={kbdStyle}>2</kbd> got it
          </span>
          <span>
            <kbd style={kbdStyle}>T</kbd> translation
          </span>
          <span>
            <kbd style={kbdStyle}>A</kbd> audio
          </span>
          <span>
            <kbd style={kbdStyle}>I</kbd> image
          </span>
          <span>
            <kbd style={kbdStyle}>S</kbd> sentence
          </span>
          <span>
            <kbd style={kbdStyle}>E</kbd> explanation
          </span>
        </div>
      )}
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  borderRadius: 4,
  border: '1px solid var(--nabu-border, rgba(255,255,255,0.15))',
  background: 'var(--nabu-surface, #16161e)',
  fontFamily: 'monospace',
  fontSize: 12,
  marginRight: 4,
}
