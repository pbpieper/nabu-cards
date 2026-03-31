'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import CardEditor from '@/components/CardEditor'
import BulkImport from '@/components/BulkImport'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

interface Deck {
  id: string
  title: string
  share_code: string | null
  card_count: number
}

interface Card {
  id: string
  deck_id: string
  word: string
  translation: string
  romanization?: string | null
  image_url?: string | null
  audio_url?: string | null
  example_sentence?: string | null
  example_translation?: string | null
  explanation?: string | null
  part_of_speech?: string | null
  tags: string[]
  sort_order: number
}

export default function DeckEditorPage() {
  const params = useParams()
  const deckId = params.deckId as string

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingCard, setAddingCard] = useState(false)

  const fetchDeck = useCallback(async () => {
    setLoading(true)

    const { data: deckData, error: deckErr } = await supabase
      .from('decks')
      .select('id, title, share_code, card_count')
      .eq('id', deckId)
      .single()

    if (deckErr || !deckData) {
      setError('Deck not found')
      setLoading(false)
      return
    }

    setDeck(deckData as Deck)

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('sort_order', { ascending: true })

    const fetchedCards = (cardData as Card[]) || []
    setCards(fetchedCards)

    // Select first card if none selected
    if (fetchedCards.length > 0 && !selectedCardId) {
      setSelectedCardId(fetchedCards[0].id)
    }

    setLoading(false)
  }, [deckId, selectedCardId])

  useEffect(() => {
    fetchDeck()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  const addCard = async () => {
    if (!deck) return
    setAddingCard(true)

    const { data, error: err } = await supabase
      .from('cards')
      .insert({
        deck_id: deck.id,
        word: '',
        translation: '',
        sort_order: cards.length,
        tags: [],
      })
      .select()
      .single()

    setAddingCard(false)

    if (err) {
      setError(err.message)
    } else if (data) {
      const newCard = data as Card
      setCards((prev) => [...prev, newCard])
      setSelectedCardId(newCard.id)
    }
  }

  const handleCardSaved = (updatedCard: Card) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)))
  }

  const handleCardDeleted = (cardId: string) => {
    setCards((prev) => {
      const filtered = prev.filter((c) => c.id !== cardId)
      if (selectedCardId === cardId) {
        setSelectedCardId(filtered.length > 0 ? filtered[0].id : null)
      }
      return filtered
    })
  }

  const handleBulkImported = () => {
    // Refetch cards
    supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const fetched = (data as Card[]) || []
        setCards(fetched)
        if (fetched.length > 0 && !selectedCardId) {
          setSelectedCardId(fetched[0].id)
        }
      })
  }

  const selectedCard = cards.find((c) => c.id === selectedCardId)

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--nabu-dim)', fontSize: 15 }}>Loading editor...</div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--nabu-dim)', fontSize: 16 }}>{error || 'Deck not found'}</p>
        <Link href="/create" style={{ color: 'var(--nabu-accent-2)', textDecoration: 'none', fontSize: 14 }}>
          &larr; Back
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          borderBottom: '1px solid var(--nabu-border)',
          background: 'var(--nabu-surface)',
          flexShrink: 0,
        }}
      >
        <Link
          href="/create"
          style={{
            color: 'var(--nabu-dim)',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          &larr;
        </Link>
        <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}>{deck.title}</h1>
        {deck.share_code && (
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: 'var(--nabu-accent-2)',
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(108, 92, 231, 0.1)',
              letterSpacing: '0.1em',
            }}
          >
            {deck.share_code}
          </span>
        )}
        {deck.share_code && (
          <Link
            href={`/deck/${deck.share_code}`}
            style={{
              fontSize: 13,
              color: 'var(--nabu-accent-2)',
              textDecoration: 'none',
            }}
          >
            Preview
          </Link>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — card list */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid var(--nabu-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--nabu-bg)',
          }}
        >
          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 12px',
              borderBottom: '1px solid var(--nabu-border)',
            }}
          >
            <button
              onClick={() => setShowBulkImport(true)}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--nabu-border)',
                background: 'var(--nabu-surface)',
                color: 'var(--nabu-dim)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Bulk Import
            </button>
          </div>

          {/* Card list */}
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {cards.length === 0 ? (
              <div
                style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: 'var(--nabu-dim)',
                  fontSize: 13,
                }}
              >
                No cards yet. Add your first card or use bulk import.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background:
                        selectedCardId === card.id
                          ? 'rgba(108, 92, 231, 0.15)'
                          : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color:
                          selectedCardId === card.id
                            ? 'var(--nabu-accent-2)'
                            : 'var(--nabu-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {card.word || `Card ${index + 1}`}
                    </span>
                    {card.translation && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--nabu-dim)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                      >
                        {card.translation}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add card button */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--nabu-border)' }}>
            <button
              onClick={addCard}
              disabled={addingCard}
              style={{
                width: '100%',
                height: 36,
                borderRadius: 8,
                border: 'none',
                background: 'var(--nabu-accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: addingCard ? 'wait' : 'pointer',
                opacity: addingCard ? 0.7 : 1,
              }}
            >
              {addingCard ? 'Adding...' : '+ Add Card'}
            </button>
          </div>
        </div>

        {/* Right panel — card editor */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {selectedCard ? (
            <CardEditor
              key={selectedCard.id}
              card={selectedCard}
              onSaved={handleCardSaved}
              onDeleted={handleCardDeleted}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--nabu-dim)',
                fontSize: 15,
              }}
            >
              {cards.length === 0
                ? 'Add your first card to get started'
                : 'Select a card to edit'}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImport
          deckId={deck.id}
          currentCardCount={cards.length}
          onImported={handleBulkImported}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  )
}
