'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface DeckCodeInputProps {
  /** If true, renders full-width with a large input */
  large?: boolean
}

export default function DeckCodeInput({ large = false }: DeckCodeInputProps) {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = code.trim().toUpperCase()
      if (trimmed.length > 0) {
        router.push(`/deck/${trimmed}`)
      }
    },
    [code, router],
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, width: '100%' }}>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
        placeholder="Enter deck code"
        maxLength={6}
        style={{
          flex: 1,
          height: large ? 56 : 44,
          padding: '0 16px',
          borderRadius: 12,
          border: '1px solid var(--nabu-border)',
          background: 'var(--nabu-surface)',
          color: 'var(--nabu-text)',
          fontSize: large ? 24 : 16,
          fontFamily: 'monospace',
          textAlign: 'center',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      />
      <button
        type="submit"
        disabled={code.trim().length === 0}
        style={{
          height: large ? 56 : 44,
          padding: '0 20px',
          borderRadius: 12,
          border: 'none',
          background: code.trim().length > 0 ? 'var(--nabu-accent)' : 'var(--nabu-surface-2)',
          color: code.trim().length > 0 ? '#fff' : 'var(--nabu-dim)',
          fontSize: large ? 16 : 14,
          fontWeight: 600,
          cursor: code.trim().length > 0 ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
        }}
      >
        Go
      </button>
    </form>
  )
}
