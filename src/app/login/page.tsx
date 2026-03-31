'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
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
      <div style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Sign In</h1>
        <p style={{ color: 'var(--nabu-dim)', fontSize: 14, marginBottom: 32 }}>
          We&apos;ll send you a magic link to sign in instantly.
        </p>

        {sent ? (
          <div
            style={{
              padding: '24px 20px',
              borderRadius: 14,
              background: 'var(--nabu-surface)',
              border: '1px solid var(--nabu-border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#9993;</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Check your email</h2>
            <p style={{ color: 'var(--nabu-dim)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
              We sent a login link to <strong style={{ color: 'var(--nabu-text)' }}>{email}</strong>.
              Click the link in the email to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--nabu-dim)',
                marginBottom: 6,
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                borderRadius: 12,
                border: '1px solid var(--nabu-border)',
                background: 'var(--nabu-surface)',
                color: 'var(--nabu-text)',
                fontSize: 15,
                marginBottom: 12,
              }}
            />

            {error && (
              <p style={{ color: 'var(--nabu-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: email.trim() ? 'var(--nabu-accent)' : 'var(--nabu-surface-2)',
                color: email.trim() ? '#fff' : 'var(--nabu-dim)',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'wait' : email.trim() ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginTop: 24,
            fontSize: 14,
            color: 'var(--nabu-accent-2)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  )
}
