'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LandingPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length > 0) {
      router.push(`/deck/${trimmed}`)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        {/* Title */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(135deg, var(--nabu-accent), var(--nabu-accent-2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
          }}
        >
          Nabu
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: 'var(--nabu-dim)',
            fontSize: 16,
            marginTop: 8,
            marginBottom: 40,
          }}
        >
          Master any language, one card at a time
        </p>

        {/* Deck Code Input */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            type="text"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 6),
              )
            }
            placeholder="Enter deck code"
            maxLength={6}
            style={{
              width: '100%',
              height: 56,
              padding: '0 20px',
              borderRadius: 14,
              border: '1px solid var(--nabu-border)',
              background: 'var(--nabu-surface)',
              color: 'var(--nabu-text)',
              fontSize: 24,
              fontFamily: 'monospace',
              textAlign: 'center',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          />

          <button
            type="submit"
            disabled={code.trim().length === 0}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              border: 'none',
              background:
                code.trim().length > 0
                  ? 'var(--nabu-accent)'
                  : 'var(--nabu-surface-2)',
              color: code.trim().length > 0 ? '#fff' : 'var(--nabu-dim)',
              fontSize: 16,
              fontWeight: 600,
              cursor: code.trim().length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Start Studying
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '32px 0',
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: 'var(--nabu-border)' }}
          />
          <span style={{ color: 'var(--nabu-dim)', fontSize: 13 }}>or</span>
          <div
            style={{ flex: 1, height: 1, background: 'var(--nabu-border)' }}
          />
        </div>

        {/* Create Link */}
        <Link
          href="/create"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--nabu-accent-2)',
            fontSize: 15,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Create a Deck &rarr;
        </Link>
      </div>
    </div>
  )
}
