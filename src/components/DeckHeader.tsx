'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DeckHeaderProps {
  title: string
  description?: string | null
  cardCount: number
  sourceLanguage: string
  targetLanguage: string
  shareCode?: string | null
  isCreator?: boolean
  deckId?: string
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', ru: 'Russian', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish', sv: 'Swedish',
}

export default function DeckHeader({
  title,
  description,
  cardCount,
  sourceLanguage,
  targetLanguage,
  shareCode,
  isCreator,
  deckId,
}: DeckHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    if (!shareCode) return
    const url = `${window.location.origin}/deck/${shareCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>
      {description && (
        <p style={{ color: 'var(--nabu-dim)', marginTop: 6, fontSize: 15, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 13,
            background: 'var(--nabu-surface-2)',
            color: 'var(--nabu-dim)',
          }}
        >
          {cardCount} card{cardCount !== 1 ? 's' : ''}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 13,
            background: 'var(--nabu-surface-2)',
            color: 'var(--nabu-dim)',
          }}
        >
          {LANG_NAMES[sourceLanguage] || sourceLanguage} &rarr; {LANG_NAMES[targetLanguage] || targetLanguage}
        </span>
      </div>

      {shareCode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--nabu-surface)',
            border: '1px solid var(--nabu-border)',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--nabu-dim)' }}>Share code:</span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--nabu-accent-2)',
            }}
          >
            {shareCode}
          </span>
          <button
            onClick={copyLink}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--nabu-border)',
              background: 'var(--nabu-surface-2)',
              color: 'var(--nabu-text)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      {isCreator && deckId && (
        <Link
          href={`/create/${deckId}`}
          style={{
            display: 'inline-block',
            marginTop: 12,
            fontSize: 13,
            color: 'var(--nabu-accent-2)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to editing
        </Link>
      )}
    </div>
  )
}
