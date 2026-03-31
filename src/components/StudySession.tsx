'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FlashCard from './FlashCard'
import SessionStats from './SessionStats'
import ProgressBar from './ProgressBar'
import KeyboardHint from './KeyboardHint'

// ---------------------------------------------------------------------------
// Inline types (lib/types.ts may not be ready yet)
// ---------------------------------------------------------------------------
interface Card {
  id: string
  deck_id: string
  sort_order: number
  word: string
  translation: string
  image_url?: string | null
  audio_url?: string | null
  example_sentence?: string | null
  explanation?: string | null
  part_of_speech?: string | null
  tags?: string[] | null
  notes?: string | null
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

interface SessionStatsData {
  cardsReviewed: number
  cardsCorrect: number
  newCardsSeen: number
  duration: number // ms
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface StudySessionProps {
  cards: Card[]
  deckLanguage: string
  initialProgress: Map<string, CardProgress>
  onReview: (
    cardId: string,
    correct: boolean,
    updatedProgress: CardProgress,
  ) => void
  onSessionEnd: (stats: SessionStatsData) => void
}

// ---------------------------------------------------------------------------
// Inline SRS logic (self-contained, no lib dependency)
// ---------------------------------------------------------------------------
const LEARNING_STEPS_MINUTES = [1, 10] // learning steps in minutes

function processReview(
  progress: CardProgress,
  correct: boolean,
): CardProgress {
  const now = new Date().toISOString()
  const updated = { ...progress }

  updated.total_reviews += 1
  updated.last_reviewed_at = now

  if (correct) {
    updated.total_correct += 1
    updated.consecutive_correct += 1

    if (updated.status === 'new' || updated.status === 'learning') {
      // Graduated from learning -> review
      if (updated.consecutive_correct >= LEARNING_STEPS_MINUTES.length) {
        updated.status = 'review'
        updated.interval_days = 1
        updated.next_review_at = addDays(now, 1)
      } else {
        // Stay in learning, next step
        updated.status = 'learning'
        const stepMin =
          LEARNING_STEPS_MINUTES[updated.consecutive_correct - 1] || 10
        updated.next_review_at = addMinutes(now, stepMin)
        updated.interval_days = 0
      }
    } else if (updated.status === 'review') {
      // Increase interval (simplified SM-2 style)
      const newInterval = Math.round(updated.interval_days * 2.5)
      updated.interval_days = Math.min(newInterval, 365)
      updated.next_review_at = addDays(now, updated.interval_days)

      if (updated.consecutive_correct >= 5 && updated.interval_days >= 21) {
        updated.status = 'mastered'
      }
    } else {
      // mastered -- keep going
      const newInterval = Math.round(updated.interval_days * 2.5)
      updated.interval_days = Math.min(newInterval, 365)
      updated.next_review_at = addDays(now, updated.interval_days)
    }
  } else {
    // Incorrect
    updated.consecutive_correct = 0

    if (
      updated.status === 'review' ||
      updated.status === 'mastered'
    ) {
      // Lapse -> back to learning
      updated.status = 'learning'
      updated.interval_days = 0
      updated.next_review_at = addMinutes(now, LEARNING_STEPS_MINUTES[0])
    } else {
      // Already in new/learning, reset step
      updated.status = 'learning'
      updated.interval_days = 0
      updated.next_review_at = addMinutes(now, LEARNING_STEPS_MINUTES[0])
    }
  }

  return updated
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function addMinutes(iso: string, min: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + min)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Queue builder
// ---------------------------------------------------------------------------
const MAX_NEW_PER_SESSION = 20

function buildQueue(
  cards: Card[],
  progressMap: Map<string, CardProgress>,
): Card[] {
  const now = new Date()

  const due: Card[] = []
  const learning: Card[] = []
  const newCards: Card[] = []

  for (const card of cards) {
    const prog = progressMap.get(card.id)
    if (!prog || prog.status === 'new') {
      newCards.push(card)
    } else if (prog.status === 'learning') {
      learning.push(card)
    } else {
      // review or mastered
      const nextReview = new Date(prog.next_review_at)
      if (nextReview <= now) {
        due.push(card)
      }
    }
  }

  // Sort due by next_review_at ascending (most overdue first)
  due.sort((a, b) => {
    const pa = progressMap.get(a.id)
    const pb = progressMap.get(b.id)
    return (
      new Date(pa?.next_review_at || 0).getTime() -
      new Date(pb?.next_review_at || 0).getTime()
    )
  })

  const cappedNew = newCards.slice(0, MAX_NEW_PER_SESSION)

  return [...due, ...learning, ...cappedNew]
}

// ---------------------------------------------------------------------------
// StudySession Component
// ---------------------------------------------------------------------------
type Phase = 'preview' | 'studying' | 'complete'

export default function StudySession({
  cards,
  deckLanguage,
  initialProgress,
  onReview,
  onSessionEnd,
}: StudySessionProps) {
  const [phase, setPhase] = useState<Phase>('preview')
  const [progressMap, setProgressMap] = useState(
    () => new Map(initialProgress),
  )
  const [queue, setQueue] = useState<Card[]>(() =>
    buildQueue(cards, initialProgress),
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [stats, setStats] = useState<SessionStatsData>({
    cardsReviewed: 0,
    cardsCorrect: 0,
    newCardsSeen: 0,
    duration: 0,
  })
  const startTimeRef = useRef<number>(0)

  // Preview info
  const previewInfo = useMemo(() => {
    const q = buildQueue(cards, initialProgress)
    const now = new Date()
    let dueCount = 0
    let newCount = 0
    for (const c of q) {
      const prog = initialProgress.get(c.id)
      if (!prog || prog.status === 'new') newCount++
      else {
        const next = new Date(prog.next_review_at)
        if (next <= now) dueCount++
      }
    }
    const learningCount = q.length - dueCount - newCount
    const estMinutes = Math.max(1, Math.ceil(q.length * 0.5))
    return { total: q.length, dueCount, newCount, learningCount, estMinutes }
  }, [cards, initialProgress])

  const startSession = useCallback(() => {
    const q = buildQueue(cards, progressMap)
    setQueue(q)
    setCurrentIdx(0)
    setStats({ cardsReviewed: 0, cardsCorrect: 0, newCardsSeen: 0, duration: 0 })
    startTimeRef.current = Date.now()
    setPhase('studying')
  }, [cards, progressMap])

  const handleGrade = useCallback(
    (correct: boolean) => {
      const currentCard = queue[currentIdx]
      if (!currentCard) return

      const oldProg = progressMap.get(currentCard.id)
      const wasNew = !oldProg || oldProg.status === 'new'

      const existing: CardProgress = oldProg || {
        card_id: currentCard.id,
        user_id: '',
        interval_days: 0,
        next_review_at: new Date().toISOString(),
        consecutive_correct: 0,
        total_reviews: 0,
        total_correct: 0,
        status: 'new',
        last_reviewed_at: null,
      }

      const updated = processReview(existing, correct)

      // Update local progress map
      setProgressMap((prev) => {
        const next = new Map(prev)
        next.set(currentCard.id, updated)
        return next
      })

      // Notify parent
      onReview(currentCard.id, correct, updated)

      // Update stats
      setStats((prev) => ({
        ...prev,
        cardsReviewed: prev.cardsReviewed + 1,
        cardsCorrect: prev.cardsCorrect + (correct ? 1 : 0),
        newCardsSeen: prev.newCardsSeen + (wasNew ? 1 : 0),
      }))

      // If incorrect and in learning, re-add to end of queue
      if (!correct && updated.status === 'learning') {
        setQueue((prev) => [...prev, currentCard])
      }

      // Check if learning cards became due mid-session (re-enter queue)
      if (updated.status === 'learning') {
        const nextReviewTime = new Date(updated.next_review_at).getTime()
        const now = Date.now()
        const delayMs = Math.max(0, nextReviewTime - now)

        if (delayMs > 0 && delayMs <= 15 * 60 * 1000) {
          // Re-enter queue after delay (up to 15 min)
          setTimeout(() => {
            setQueue((prev) => {
              // Only add if not already in remaining queue
              const remaining = prev.slice(currentIdx + 1)
              if (!remaining.find((c) => c.id === currentCard.id)) {
                return [...prev, currentCard]
              }
              return prev
            })
          }, delayMs)
        }
      }

      // Advance
      const nextIdx = currentIdx + 1
      if (nextIdx >= queue.length) {
        // Check if more cards were added (learning re-entries)
        // Use a small timeout to let state settle
        setTimeout(() => {
          setQueue((latestQueue) => {
            if (nextIdx < latestQueue.length) {
              setCurrentIdx(nextIdx)
            } else {
              // Session complete
              const duration = Date.now() - startTimeRef.current
              setStats((prev) => {
                const final = { ...prev, duration }
                onSessionEnd(final)
                return final
              })
              setPhase('complete')
            }
            return latestQueue
          })
        }, 50)
      } else {
        setCurrentIdx(nextIdx)
      }
    },
    [queue, currentIdx, progressMap, onReview, onSessionEnd],
  )

  // ---------- PREVIEW ----------
  if (phase === 'preview') {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '60px auto 0',
          padding: 32,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--nabu-text, #e8e8e8)',
            margin: 0,
          }}
        >
          {"Today's Study"}
        </h2>

        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <PreviewPill
            label="Due"
            value={previewInfo.dueCount}
            color="var(--nabu-accent, #6c5ce7)"
          />
          <PreviewPill
            label="Learning"
            value={previewInfo.learningCount}
            color="var(--nabu-orange, #fdcb6e)"
          />
          <PreviewPill
            label="New"
            value={previewInfo.newCount}
            color="var(--nabu-green, #00b894)"
          />
        </div>

        <div
          style={{
            fontSize: 14,
            color: 'var(--nabu-dim, #888)',
          }}
        >
          ~{previewInfo.estMinutes} minutes
        </div>

        {previewInfo.total === 0 ? (
          <div
            style={{
              fontSize: 16,
              color: 'var(--nabu-dim, #888)',
              padding: '20px 0',
            }}
          >
            No cards to review right now. Come back later!
          </div>
        ) : (
          <button
            onClick={startSession}
            style={{
              height: 52,
              padding: '0 40px',
              borderRadius: 14,
              border: '1px solid var(--nabu-accent, #6c5ce7)',
              background: 'var(--nabu-accent, #6c5ce7)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            Start ({previewInfo.total} cards)
          </button>
        )}
      </div>
    )
  }

  // ---------- COMPLETE ----------
  if (phase === 'complete') {
    return (
      <SessionStats
        stats={stats}
        onStudyMore={() => {
          setPhase('preview')
        }}
        onDone={() => {
          onSessionEnd(stats)
        }}
      />
    )
  }

  // ---------- STUDYING ----------
  const currentCard = queue[currentIdx]
  if (!currentCard) return null

  const progress = queue.length > 0 ? currentIdx / queue.length : 0

  return (
    <>
      <ProgressBar progress={progress} />

      {/* Card counter */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--nabu-dim, #888)',
          zIndex: 100,
        }}
      >
        {currentIdx + 1} / {queue.length}
      </div>

      <div style={{ paddingTop: 24, paddingBottom: 80 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id + '-' + currentIdx}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <FlashCard
              card={currentCard}
              deckLanguage={deckLanguage}
              onGrade={handleGrade}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <KeyboardHint />
    </>
  )
}

// ---------------------------------------------------------------------------
// Preview pill sub-component
// ---------------------------------------------------------------------------
function PreviewPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '12px 20px',
        borderRadius: 14,
        background: 'var(--nabu-surface-2, #1e1e2e)',
        border: '1px solid var(--nabu-border, rgba(255,255,255,0.08))',
        minWidth: 80,
      }}
    >
      <span style={{ fontSize: 24, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 12, color: 'var(--nabu-dim, #888)' }}>
        {label}
      </span>
    </div>
  )
}
