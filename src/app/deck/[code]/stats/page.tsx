'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

interface Stats {
  totalCards: number
  new: number
  learning: number
  review: number
  mastered: number
  totalReviews: number
  totalCorrect: number
  dueNow: number
}

export default function DeckStatsPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()

  const [deckTitle, setDeckTitle] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!code) return

    setLoading(true)

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sign in to view your stats')
      setLoading(false)
      return
    }

    // Fetch deck
    const { data: deck, error: deckErr } = await supabase
      .from('decks')
      .select('id, title, card_count')
      .eq('share_code', code)
      .single()

    if (deckErr || !deck) {
      setError('Deck not found')
      setLoading(false)
      return
    }

    setDeckTitle(deck.title)

    // Fetch cards for this deck
    const { data: deckCards } = await supabase
      .from('cards')
      .select('id')
      .eq('deck_id', deck.id)

    const cardIds = (deckCards || []).map((c: { id: string }) => c.id)

    if (cardIds.length === 0) {
      setStats({
        totalCards: 0,
        new: 0,
        learning: 0,
        review: 0,
        mastered: 0,
        totalReviews: 0,
        totalCorrect: 0,
        dueNow: 0,
      })
      setLoading(false)
      return
    }

    // Fetch progress
    const { data: progress } = await supabase
      .from('card_progress')
      .select('status, total_reviews, total_correct, next_review_at')
      .eq('user_id', user.id)
      .in('card_id', cardIds)

    const now = new Date()
    const s: Stats = {
      totalCards: cardIds.length,
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
      totalReviews: 0,
      totalCorrect: 0,
      dueNow: 0,
    }

    if (progress) {
      for (const p of progress) {
        const status = p.status as 'new' | 'learning' | 'review' | 'mastered'
        s[status]++
        s.totalReviews += p.total_reviews
        s.totalCorrect += p.total_correct
        if (new Date(p.next_review_at) <= now && status !== 'new') {
          s.dueNow++
        }
      }
      // Cards without progress entry are new
      s.new += cardIds.length - progress.length
    } else {
      s.new = cardIds.length
    }

    setStats(s)
    setLoading(false)
  }, [code])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const accuracy = stats && stats.totalReviews > 0
    ? Math.round((stats.totalCorrect / stats.totalReviews) * 100)
    : null

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--nabu-dim)', fontSize: 15 }}>Loading stats...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--nabu-dim)', fontSize: 16 }}>{error}</p>
        <Link
          href={`/deck/${code}`}
          style={{ color: 'var(--nabu-accent-2)', textDecoration: 'none', fontSize: 14 }}
        >
          &larr; Back to deck
        </Link>
      </div>
    )
  }

  const statusItems = [
    { label: 'New', count: stats?.new ?? 0, color: 'var(--nabu-blue)' },
    { label: 'Learning', count: stats?.learning ?? 0, color: 'var(--nabu-orange)' },
    { label: 'Review', count: stats?.review ?? 0, color: 'var(--nabu-accent-2)' },
    { label: 'Mastered', count: stats?.mastered ?? 0, color: 'var(--nabu-green)' },
  ]

  return (
    <div style={{ minHeight: '100dvh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Link
          href={`/deck/${code}`}
          style={{
            display: 'inline-block',
            marginBottom: 20,
            fontSize: 14,
            color: 'var(--nabu-accent-2)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to deck
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Stats</h1>
        <p style={{ color: 'var(--nabu-dim)', fontSize: 14, marginBottom: 28 }}>{deckTitle}</p>

        {/* Total Cards */}
        <div
          style={{
            padding: '20px',
            borderRadius: 14,
            background: 'var(--nabu-surface)',
            border: '1px solid var(--nabu-border)',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 800 }}>{stats?.totalCards ?? 0}</div>
          <div style={{ fontSize: 13, color: 'var(--nabu-dim)', marginTop: 4 }}>Total Cards</div>
        </div>

        {/* Status pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {statusItems.map((item) => (
            <div
              key={item.label}
              style={{
                padding: '14px 8px',
                borderRadius: 12,
                background: 'var(--nabu-surface)',
                border: '1px solid var(--nabu-border)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.count}</div>
              <div style={{ fontSize: 11, color: 'var(--nabu-dim)', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Accuracy + Due */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div
            style={{
              padding: '20px',
              borderRadius: 14,
              background: 'var(--nabu-surface)',
              border: '1px solid var(--nabu-border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: accuracy !== null && accuracy >= 70 ? 'var(--nabu-green)' : 'var(--nabu-text)' }}>
              {accuracy !== null ? `${accuracy}%` : '--'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--nabu-dim)', marginTop: 4 }}>Accuracy</div>
            {stats && stats.totalReviews > 0 && (
              <div style={{ fontSize: 11, color: 'var(--nabu-dim)', marginTop: 2 }}>
                {stats.totalCorrect}/{stats.totalReviews} correct
              </div>
            )}
          </div>

          <div
            style={{
              padding: '20px',
              borderRadius: 14,
              background: 'var(--nabu-surface)',
              border: '1px solid var(--nabu-border)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: stats && stats.dueNow > 0 ? 'var(--nabu-orange)' : 'var(--nabu-text)' }}>
              {stats?.dueNow ?? 0}
            </div>
            <div style={{ fontSize: 12, color: 'var(--nabu-dim)', marginTop: 4 }}>Due Now</div>
          </div>
        </div>
      </div>
    </div>
  )
}
