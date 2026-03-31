'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@supabase/supabase-js'
import DeckHeader from '@/components/DeckHeader'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

// Dynamically import StudySession (built by another agent)
const StudySession = dynamic(
  () => import('@/components/StudySession'),
  {
    loading: () => (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--nabu-dim)' }}>
        Loading study session...
      </div>
    ),
    ssr: false,
  },
)

interface Deck {
  id: string
  owner_id: string
  title: string
  description: string | null
  source_language: string
  target_language: string
  share_code: string | null
  card_count: number
}

interface Card {
  id: string
  deck_id: string
  word: string
  translation: string
  image_url: string | null
  audio_url: string | null
  example_sentence: string | null
  example_translation: string | null
  explanation: string | null
  part_of_speech: string | null
  tags: string[]
  sort_order: number
}

interface CardProgress {
  card_id: string
  user_id: string
  interval_days: number
  next_review_at: string
  consecutive_correct: number
  total_reviews: number
  total_correct: number
  status: 'new' | 'learning' | 'review' | 'mastered'
  last_reviewed_at: string | null
}

interface ProgressStats {
  new: number
  learning: number
  review: number
  mastered: number
  total: number
}

export default function DeckStudyPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [progressMap, setProgressMap] = useState<Map<string, CardProgress>>(new Map())
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [studying, setStudying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  // Fetch deck + cards
  const fetchDeck = useCallback(async () => {
    if (!code) return

    setLoading(true)
    setError(null)

    const { data: deckData, error: deckErr } = await supabase
      .from('decks')
      .select('*')
      .eq('share_code', code)
      .single()

    if (deckErr || !deckData) {
      setError('Deck not found. Check the code and try again.')
      setLoading(false)
      return
    }

    setDeck(deckData as Deck)

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckData.id)
      .order('sort_order', { ascending: true })

    setCards((cardData as Card[]) || [])
    setLoading(false)
  }, [code])

  useEffect(() => {
    fetchDeck()
  }, [fetchDeck])

  // Fetch progress if authenticated
  useEffect(() => {
    if (!userId || !deck || cards.length === 0) return

    const fetchProgress = async () => {
      const cardIds = cards.map((c) => c.id)
      const { data } = await supabase
        .from('card_progress')
        .select('*')
        .eq('user_id', userId)
        .in('card_id', cardIds)

      if (data) {
        const map = new Map<string, CardProgress>()
        const counts: ProgressStats = { new: 0, learning: 0, review: 0, mastered: 0, total: cards.length }

        for (const row of data as CardProgress[]) {
          map.set(row.card_id, row)
          const s = row.status as keyof Omit<ProgressStats, 'total'>
          if (s in counts) counts[s]++
        }
        counts.new += cards.length - data.length

        setProgressMap(map)
        setStats(counts)
      }
    }

    fetchProgress()
  }, [userId, deck, cards])

  const handleReview = useCallback(
    async (cardId: string, correct: boolean, updatedProgress: CardProgress) => {
      setProgressMap((prev) => {
        const next = new Map(prev)
        next.set(cardId, updatedProgress)
        return next
      })

      if (userId) {
        // Upsert progress to Supabase
        await supabase.from('card_progress').upsert(
          {
            card_id: cardId,
            user_id: userId,
            interval_days: updatedProgress.interval_days,
            next_review_at: updatedProgress.next_review_at,
            consecutive_correct: updatedProgress.consecutive_correct,
            total_reviews: updatedProgress.total_reviews,
            total_correct: updatedProgress.total_correct,
            status: updatedProgress.status,
            last_reviewed_at: updatedProgress.last_reviewed_at,
          },
          { onConflict: 'card_id,user_id' },
        )
      }
    },
    [userId],
  )

  const handleSessionEnd = useCallback(
    async (sessionStats: { cardsReviewed: number; cardsCorrect: number; newCardsSeen: number; duration: number }) => {
      setStudying(false)

      if (userId && deck) {
        await supabase.from('review_sessions').insert({
          user_id: userId,
          deck_id: deck.id,
          cards_studied: sessionStats.cardsReviewed,
          cards_correct: sessionStats.cardsCorrect,
          duration_ms: sessionStats.duration,
        })
      }
    },
    [userId, deck],
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--nabu-dim)', fontSize: 15 }}>Loading deck...</div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>&#128533;</div>
        <p style={{ color: 'var(--nabu-dim)', fontSize: 16 }}>{error || 'Deck not found'}</p>
        <Link
          href="/"
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            background: 'var(--nabu-surface)',
            border: '1px solid var(--nabu-border)',
            color: 'var(--nabu-text)',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          &larr; Back to home
        </Link>
      </div>
    )
  }

  if (studying) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <div style={{ padding: '12px 20px' }}>
          <button
            onClick={() => setStudying(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--nabu-dim)',
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            &larr; Back to deck
          </button>
        </div>
        <StudySession
          cards={cards}
          deckLanguage={deck.target_language}
          initialProgress={progressMap}
          onReview={handleReview}
          onSessionEnd={handleSessionEnd}
        />
      </div>
    )
  }

  const isCreator = userId === deck.owner_id

  return (
    <div style={{ minHeight: '100dvh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
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

        <DeckHeader
          title={deck.title}
          description={deck.description}
          cardCount={deck.card_count}
          sourceLanguage={deck.source_language}
          targetLanguage={deck.target_language}
          shareCode={isCreator ? deck.share_code : null}
          isCreator={isCreator}
          deckId={deck.id}
        />

        {/* Stats */}
        {stats && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {([
              { label: 'New', count: stats.new, color: 'var(--nabu-blue)' },
              { label: 'Learning', count: stats.learning, color: 'var(--nabu-orange)' },
              { label: 'Review', count: stats.review, color: 'var(--nabu-accent-2)' },
              { label: 'Mastered', count: stats.mastered, color: 'var(--nabu-green)' },
            ] as const).map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'var(--nabu-surface)',
                  border: '1px solid var(--nabu-border)',
                  textAlign: 'center',
                  minWidth: 80,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>
                  {item.count}
                </div>
                <div style={{ fontSize: 11, color: 'var(--nabu-dim)', marginTop: 2 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {cards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => setStudying(true)}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: 'var(--nabu-accent)',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {userId ? 'Start Studying' : 'Study as Guest'}
            </button>

            {!userId && (
              <p style={{ textAlign: 'center', color: 'var(--nabu-dim)', fontSize: 13 }}>
                <Link href="/login" style={{ color: 'var(--nabu-accent-2)', textDecoration: 'none' }}>
                  Sign in
                </Link>{' '}
                to save your progress
              </p>
            )}

            {userId && (
              <Link
                href={`/deck/${code}/stats`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px 0',
                  fontSize: 14,
                  color: 'var(--nabu-accent-2)',
                  textDecoration: 'none',
                }}
              >
                View detailed stats &rarr;
              </Link>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              borderRadius: 14,
              background: 'var(--nabu-surface)',
              border: '1px solid var(--nabu-border)',
            }}
          >
            <p style={{ color: 'var(--nabu-dim)', fontSize: 15, margin: 0 }}>
              This deck has no cards yet.
            </p>
            {isCreator && (
              <Link
                href={`/create/${deck.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: 12,
                  color: 'var(--nabu-accent-2)',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Add cards &rarr;
              </Link>
            )}
          </div>
        )}

        {/* Card preview list */}
        {cards.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--nabu-dim)', marginBottom: 12 }}>
              Cards in this deck
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cards.slice(0, 20).map((card) => (
                <div
                  key={card.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--nabu-surface)',
                    border: '1px solid var(--nabu-border)',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{card.word}</span>
                  <span style={{ color: 'var(--nabu-dim)' }}>{card.translation}</span>
                </div>
              ))}
              {cards.length > 20 && (
                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--nabu-dim)', marginTop: 4 }}>
                  +{cards.length - 20} more cards
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
