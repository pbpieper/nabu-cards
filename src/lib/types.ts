export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  native_language: string
  daily_goal: number
  created_at: string
  updated_at: string
}

export interface Deck {
  id: string
  owner_id: string
  title: string
  description: string | null
  source_language: string
  target_language: string
  share_code: string | null
  is_public: boolean
  card_count: number
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  deck_id: string
  word: string
  translation: string
  romanization: string | null
  image_url: string | null
  audio_url: string | null
  example_sentence: string | null
  example_translation: string | null
  explanation: string | null
  part_of_speech: string | null
  tags: string[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CardProgress {
  id: string
  card_id: string
  user_id: string
  interval_days: number
  next_review_at: string
  consecutive_correct: number
  total_reviews: number
  total_correct: number
  status: 'new' | 'learning' | 'review' | 'mastered'
  last_reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ReviewSession {
  id: string
  user_id: string
  deck_id: string
  started_at: string
  ended_at: string | null
  cards_studied: number
  cards_correct: number
  duration_ms: number
}

export interface ParsedCard {
  word: string
  translation: string
  image_url?: string
  example_sentence?: string
  explanation?: string
}
