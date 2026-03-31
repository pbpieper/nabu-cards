'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
] as const

// Generate 6-char alphanumeric code without ambiguous chars (O, 0, I, l, 1)
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function CreateDeckPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setAuthChecked(true)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!userId) {
      setError('You must be signed in to create a deck')
      return
    }

    setCreating(true)
    setError(null)

    const shareCode = generateShareCode()

    const { data, error: err } = await supabase
      .from('decks')
      .insert({
        owner_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        target_language: targetLanguage,
        source_language: sourceLanguage,
        share_code: shareCode,
        is_public: false,
      })
      .select()
      .single()

    setCreating(false)

    if (err) {
      // If share code collision, retry once
      if (err.message.includes('unique') || err.message.includes('duplicate')) {
        const retryCode = generateShareCode()
        const { data: retryData, error: retryErr } = await supabase
          .from('decks')
          .insert({
            owner_id: userId,
            title: title.trim(),
            description: description.trim() || null,
            target_language: targetLanguage,
            source_language: sourceLanguage,
            share_code: retryCode,
            is_public: false,
          })
          .select()
          .single()

        if (retryErr) {
          setError(retryErr.message)
          return
        }
        if (retryData) {
          router.push(`/create/${retryData.id}`)
          return
        }
      }
      setError(err.message)
    } else if (data) {
      router.push(`/create/${data.id}`)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid var(--nabu-border)',
    background: 'var(--nabu-surface)',
    color: 'var(--nabu-text)',
    fontSize: 15,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--nabu-dim)',
    marginBottom: 6,
  }

  if (authChecked && !userId) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          gap: 16,
        }}
      >
        <p style={{ color: 'var(--nabu-dim)', fontSize: 16 }}>
          Sign in to create decks
        </p>
        <Link
          href="/login"
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: 'var(--nabu-accent)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Sign In
        </Link>
        <Link
          href="/"
          style={{ fontSize: 14, color: 'var(--nabu-accent-2)', textDecoration: 'none', marginTop: 8 }}
        >
          &larr; Back to home
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: 20,
            fontSize: 14,
            color: 'var(--nabu-accent-2)',
            textDecoration: 'none',
          }}
        >
          &larr; Home
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Create a New Deck</h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spanish Basics"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, height: 'auto', minHeight: 80, padding: '12px 16px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will learners master with this deck?"
            />
          </div>

          {/* Target Language */}
          <div>
            <label style={labelStyle}>Target Language (what you&apos;re learning)</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source Language */}
          <div>
            <label style={labelStyle}>Source Language (your native language)</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && <p style={{ color: 'var(--nabu-red)', fontSize: 13, margin: 0 }}>{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={creating || !title.trim()}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: title.trim() ? 'var(--nabu-accent)' : 'var(--nabu-surface-2)',
              color: title.trim() ? '#fff' : 'var(--nabu-dim)',
              fontSize: 16,
              fontWeight: 600,
              cursor: creating ? 'wait' : title.trim() ? 'pointer' : 'not-allowed',
              opacity: creating ? 0.7 : 1,
              marginTop: 8,
            }}
          >
            {creating ? 'Creating...' : 'Create Deck'}
          </button>
        </form>
      </div>
    </div>
  )
}
