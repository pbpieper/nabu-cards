export interface CardProgress {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

// ---------------------------------------------------------------------------
// Core SRS algorithm
// ---------------------------------------------------------------------------

const MAX_INTERVAL = 180
const MASTERED_THRESHOLD = 32

export function processReview(
  progress: CardProgress,
  correct: boolean,
): CardProgress {
  const now = new Date()
  const updated = { ...progress }

  updated.total_reviews += 1
  updated.last_reviewed_at = now.toISOString()

  if (!correct) {
    // INCORRECT at ANY stage: full reset to learning
    updated.status = 'learning'
    updated.interval_days = 0
    updated.consecutive_correct = 0
    updated.next_review_at = addMinutes(now, 5).toISOString()
    return updated
  }

  // Correct answer
  updated.total_correct += 1
  updated.consecutive_correct += 1

  if (updated.status === 'new' || updated.status === 'learning') {
    if (updated.consecutive_correct < 2) {
      // First correct in learning: show again in 10 minutes
      updated.status = 'learning'
      updated.interval_days = 0
      updated.next_review_at = addMinutes(now, 10).toISOString()
    } else {
      // Second consecutive correct in learning: graduate to review
      updated.status = 'review'
      updated.interval_days = 1
      updated.next_review_at = addDays(now, 1).toISOString()
    }
  } else {
    // review or mastered: double the interval
    const newInterval = Math.min(updated.interval_days * 2, MAX_INTERVAL)
    updated.interval_days = newInterval
    updated.next_review_at = addDays(now, newInterval).toISOString()

    if (newInterval >= MASTERED_THRESHOLD) {
      updated.status = 'mastered'
    }
  }

  return updated
}

// ---------------------------------------------------------------------------
// Study queue builder
// ---------------------------------------------------------------------------

export function buildStudyQueue(
  allProgress: CardProgress[],
  maxNewCards: number,
): {
  due: CardProgress[]
  learning: CardProgress[]
  new_: CardProgress[]
} {
  const now = new Date()

  const due: CardProgress[] = []
  const learning: CardProgress[] = []
  const newCards: CardProgress[] = []

  for (const p of allProgress) {
    if (p.status === 'new') {
      newCards.push(p)
    } else if (p.status === 'learning') {
      learning.push(p)
    } else {
      // review or mastered — check if due
      if (new Date(p.next_review_at) <= now) {
        due.push(p)
      }
    }
  }

  // Sort due cards: oldest next_review_at first
  due.sort(
    (a, b) =>
      new Date(a.next_review_at).getTime() -
      new Date(b.next_review_at).getTime(),
  )

  // Sort learning cards by next_review_at
  learning.sort(
    (a, b) =>
      new Date(a.next_review_at).getTime() -
      new Date(b.next_review_at).getTime(),
  )

  // New cards: take at most maxNewCards (they would be sorted by sort_order
  // on the card itself, but here we preserve insertion order)
  const new_ = newCards.slice(0, maxNewCards)

  return { due, learning, new_ }
}
