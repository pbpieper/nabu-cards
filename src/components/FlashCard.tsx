'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import RevealButton from './RevealButton'
import AudioButton from './AudioButton'

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FlashCardProps {
  card: Card
  deckLanguage: string // ISO code for target language
  onGrade: (correct: boolean) => void
  showKeyboardHints?: boolean
}

// ---------------------------------------------------------------------------
// RTL helper
// ---------------------------------------------------------------------------
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur'])
function isRtl(lang: string) {
  return RTL_LANGS.has(lang.split('-')[0])
}

// ---------------------------------------------------------------------------
// Layer types & config
// ---------------------------------------------------------------------------
type Layer = 'audio' | 'image' | 'translation' | 'sentence' | 'explanation'

const LAYER_ORDER: Layer[] = ['image', 'translation', 'sentence', 'explanation']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FlashCard({
  card,
  deckLanguage,
  onGrade,
  showKeyboardHints = true,
}: FlashCardProps) {
  const [revealed, setRevealed] = useState<Set<Layer>>(new Set())
  const cardRef = useRef<HTMLDivElement>(null)

  // Which layers actually have content?
  const available = useCallback((): Set<Layer> => {
    const s = new Set<Layer>()
    // Audio is always available (TTS fallback)
    s.add('audio')
    if (card.image_url) s.add('image')
    s.add('translation') // always have translation
    if (card.example_sentence) s.add('sentence')
    if (card.explanation) s.add('explanation')
    return s
  }, [card])

  const allRevealed =
    LAYER_ORDER.filter((l) => available().has(l)).every((l) =>
      revealed.has(l),
    )

  const toggle = useCallback(
    (layer: Layer) => {
      setRevealed((prev) => {
        const next = new Set(prev)
        if (next.has(layer)) next.delete(layer)
        else next.add(layer)
        return next
      })
    },
    [],
  )

  const revealAll = useCallback(() => {
    setRevealed(new Set(LAYER_ORDER.filter((l) => available().has(l))))
  }, [available])

  // Play audio helper
  const playAudio = useCallback(() => {
    if (card.audio_url) {
      const a = new Audio(card.audio_url)
      a.play().catch(() => {})
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(card.word)
      u.lang = deckLanguage
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }, [card.audio_url, card.word, deckLanguage])

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key.toLowerCase()) {
        case 't':
          e.preventDefault()
          toggle('translation')
          break
        case 'a':
          e.preventDefault()
          toggle('audio')
          playAudio()
          break
        case 'i':
          e.preventDefault()
          if (available().has('image')) toggle('image')
          break
        case 's':
          e.preventDefault()
          if (available().has('sentence')) toggle('sentence')
          break
        case 'e':
          e.preventDefault()
          if (available().has('explanation')) toggle('explanation')
          break
        case 'r':
          e.preventDefault()
          revealAll()
          break
        case ' ':
          e.preventDefault()
          if (allRevealed) {
            onGrade(true)
          } else {
            revealAll()
          }
          break
        case '1':
        case 'arrowleft':
          e.preventDefault()
          onGrade(false)
          break
        case '2':
        case 'arrowright':
          e.preventDefault()
          onGrade(true)
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle, revealAll, playAudio, allRevealed, onGrade, available])

  // Reset revealed state when card changes
  useEffect(() => {
    setRevealed(new Set())
  }, [card.id])

  const rtl = isRtl(deckLanguage)

  return (
    <div
      ref={cardRef}
      style={{
        maxWidth: 480,
        minHeight: 400,
        margin: '0 auto',
        background: 'var(--nabu-surface, #16161e)',
        border: '1px solid var(--nabu-border, rgba(255,255,255,0.08))',
        borderRadius: 20,
        padding: 32,
        boxShadow:
          '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ---- Prompt area ---- */}
      <div style={{ textAlign: 'center' }}>
        <div
          dir={rtl ? 'rtl' : 'ltr'}
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--nabu-text, #e8e8e8)',
            lineHeight: 1.3,
          }}
        >
          {card.word}
        </div>
        {card.part_of_speech && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--nabu-dim, #888)',
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            {card.part_of_speech}
          </div>
        )}
      </div>

      {/* ---- Reveal buttons ---- */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {/* Audio button (special) */}
        <AudioButton
          audioUrl={card.audio_url}
          text={card.word}
          lang={deckLanguage}
          active={revealed.has('audio')}
          onToggle={() => toggle('audio')}
        />

        {available().has('image') && (
          <RevealButton
            label="Image"
            icon={'\uD83D\uDDBC\uFE0F'}
            active={revealed.has('image')}
            onClick={() => toggle('image')}
            keyboardHint={showKeyboardHints ? 'I' : undefined}
          />
        )}

        {available().has('sentence') && (
          <RevealButton
            label="Sentence"
            icon={'\uD83D\uDCAC'}
            active={revealed.has('sentence')}
            onClick={() => toggle('sentence')}
            keyboardHint={showKeyboardHints ? 'S' : undefined}
          />
        )}

        {available().has('explanation') && (
          <RevealButton
            label="Explanation"
            icon={'\uD83D\uDCA1'}
            active={revealed.has('explanation')}
            onClick={() => toggle('explanation')}
            keyboardHint={showKeyboardHints ? 'E' : undefined}
          />
        )}

        <RevealButton
          label="Translation"
          icon={'\uD83D\uDD24'}
          active={revealed.has('translation')}
          onClick={() => toggle('translation')}
          keyboardHint={showKeyboardHints ? 'T' : undefined}
        />

        {/* Reveal All */}
        {!allRevealed && (
          <button
            onClick={revealAll}
            style={{
              height: 36,
              padding: '0 20px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--nabu-accent, #6c5ce7)',
              background: 'rgba(108, 92, 231, 0.12)',
              color: 'var(--nabu-accent-2, #a29bfe)',
              transition: 'all 150ms ease',
            }}
          >
            Reveal All
            {showKeyboardHints && (
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.5,
                  marginLeft: 6,
                  fontFamily: 'monospace',
                }}
              >
                R
              </span>
            )}
          </button>
        )}
      </div>

      {/* ---- Revealed content area ---- */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 80,
          flex: 1,
        }}
      >
        <AnimatePresence mode="sync">
          {/* Image */}
          {revealed.has('image') && card.image_url && (
            <motion.div
              key="layer-image"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ textAlign: 'center' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image_url}
                alt={card.word}
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 12,
                  objectFit: 'cover',
                }}
              />
            </motion.div>
          )}

          {/* Translation */}
          {revealed.has('translation') && (
            <motion.div
              key="layer-translation"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--nabu-text, #e8e8e8)',
                textAlign: 'center',
                padding: '8px 0',
              }}
            >
              {card.translation}
            </motion.div>
          )}

          {/* Sentence */}
          {revealed.has('sentence') && card.example_sentence && (
            <motion.div
              key="layer-sentence"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                fontSize: 15,
                color: 'var(--nabu-dim, #aaa)',
                textAlign: 'center',
                fontStyle: 'italic',
                padding: '4px 0',
                lineHeight: 1.5,
              }}
              dir={rtl ? 'rtl' : 'ltr'}
            >
              {card.example_sentence}
            </motion.div>
          )}

          {/* Explanation */}
          {revealed.has('explanation') && card.explanation && (
            <motion.div
              key="layer-explanation"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                fontSize: 14,
                color: 'var(--nabu-dim, #888)',
                textAlign: 'center',
                padding: '4px 12px',
                background: 'var(--nabu-surface-2, #1e1e2e)',
                borderRadius: 10,
                lineHeight: 1.5,
              }}
            >
              {card.explanation}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Grade buttons ---- */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => onGrade(false)}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            border: '1px solid rgba(225, 112, 85, 0.3)',
            background: 'rgba(225, 112, 85, 0.12)',
            color: 'var(--nabu-red, #e17055)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          Again
          {showKeyboardHints && (
            <span
              style={{
                fontSize: 11,
                opacity: 0.5,
                marginLeft: 8,
                fontFamily: 'monospace',
              }}
            >
              1
            </span>
          )}
        </button>
        <button
          onClick={() => onGrade(true)}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            border: '1px solid rgba(0, 184, 148, 0.3)',
            background: 'rgba(0, 184, 148, 0.12)',
            color: 'var(--nabu-green, #00b894)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
        >
          Got it
          {showKeyboardHints && (
            <span
              style={{
                fontSize: 11,
                opacity: 0.5,
                marginLeft: 8,
                fontFamily: 'monospace',
              }}
            >
              2
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
