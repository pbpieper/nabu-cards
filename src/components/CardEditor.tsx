'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

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

interface CardEditorProps {
  card: Card
  onSaved: (card: Card) => void
  onDeleted: (cardId: string) => void
}

const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'] as const

export default function CardEditor({ card, onSaved, onDeleted }: CardEditorProps) {
  const [form, setForm] = useState({
    word: card.word,
    translation: card.translation,
    part_of_speech: card.part_of_speech || '',
    image_url: card.image_url || '',
    audio_url: card.audio_url || '',
    example_sentence: card.example_sentence || '',
    example_translation: card.example_translation || '',
    explanation: card.explanation || '',
    tags: card.tags,
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset form when card changes
  useEffect(() => {
    setForm({
      word: card.word,
      translation: card.translation,
      part_of_speech: card.part_of_speech || '',
      image_url: card.image_url || '',
      audio_url: card.audio_url || '',
      example_sentence: card.example_sentence || '',
      example_translation: card.example_translation || '',
      explanation: card.explanation || '',
      tags: card.tags,
    })
    setConfirmDelete(false)
    setError(null)
  }, [card.id, card.word, card.translation, card.part_of_speech, card.image_url, card.audio_url, card.example_sentence, card.example_translation, card.explanation, card.tags])

  const save = useCallback(async () => {
    if (!form.word.trim() || !form.translation.trim()) {
      setError('Word and translation are required')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      word: form.word.trim(),
      translation: form.translation.trim(),
      part_of_speech: form.part_of_speech || null,
      image_url: form.image_url || null,
      audio_url: form.audio_url || null,
      example_sentence: form.example_sentence || null,
      example_translation: form.example_translation || null,
      explanation: form.explanation || null,
      tags: form.tags,
    }

    const { data, error: err } = await supabase
      .from('cards')
      .update(payload)
      .eq('id', card.id)
      .select()
      .single()

    setSaving(false)
    if (err) {
      setError(err.message)
    } else if (data) {
      onSaved(data as Card)
    }
  }, [form, card.id, onSaved])

  const handleBlurSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      save()
    }, 800)
  }, [save])

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    const { error: err } = await supabase.from('cards').delete().eq('id', card.id)
    if (err) {
      setError(err.message)
    } else {
      onDeleted(card.id)
    }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!form.tags.includes(tag)) {
        setForm((f) => ({ ...f, tags: [...f.tags, tag] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--nabu-border)',
    background: 'var(--nabu-surface)',
    color: 'var(--nabu-text)',
    fontSize: 14,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--nabu-dim)',
    marginBottom: 6,
  }

  const helpStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--nabu-dim)',
    marginTop: 4,
    opacity: 0.7,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 4 }}>
      {/* Word */}
      <div>
        <label style={labelStyle}>Word *</label>
        <input
          style={inputStyle}
          value={form.word}
          onChange={(e) => updateField('word', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="e.g. Hola"
        />
      </div>

      {/* Translation */}
      <div>
        <label style={labelStyle}>Translation *</label>
        <input
          style={inputStyle}
          value={form.translation}
          onChange={(e) => updateField('translation', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="e.g. Hello"
        />
      </div>

      {/* Part of Speech */}
      <div>
        <label style={labelStyle}>Part of Speech</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.part_of_speech}
          onChange={(e) => {
            updateField('part_of_speech', e.target.value)
            handleBlurSave()
          }}
        >
          <option value="">-- Select --</option>
          {PARTS_OF_SPEECH.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Image URL */}
      <div>
        <label style={labelStyle}>Image URL</label>
        <input
          style={inputStyle}
          value={form.image_url}
          onChange={(e) => updateField('image_url', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="https://..."
        />
        {form.image_url && (
          <div style={{ marginTop: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.image_url}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: 120,
                borderRadius: 8,
                border: '1px solid var(--nabu-border)',
              }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Audio URL */}
      <div>
        <label style={labelStyle}>Audio URL</label>
        <input
          style={inputStyle}
          value={form.audio_url}
          onChange={(e) => updateField('audio_url', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="https://..."
        />
        <p style={helpStyle}>Leave empty for auto-pronunciation via browser TTS</p>
      </div>

      {/* Example Sentence */}
      <div>
        <label style={labelStyle}>Example Sentence</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={form.example_sentence}
          onChange={(e) => updateField('example_sentence', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="Use the word in context"
        />
        <p style={helpStyle}>
          Wrap the target word in **double asterisks** to highlight it
        </p>
      </div>

      {/* Example Translation */}
      <div>
        <label style={labelStyle}>Example Translation</label>
        <input
          style={inputStyle}
          value={form.example_translation}
          onChange={(e) => updateField('example_translation', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="Translation of the example sentence"
        />
      </div>

      {/* Explanation */}
      <div>
        <label style={labelStyle}>Explanation</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={form.explanation}
          onChange={(e) => updateField('explanation', e.target.value)}
          onBlur={handleBlurSave}
          placeholder="Grammar notes, usage tips..."
        />
        <p style={helpStyle}>Supports basic markdown formatting</p>
      </div>

      {/* Tags */}
      <div>
        <label style={labelStyle}>Tags</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {form.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 9999,
                fontSize: 12,
                background: 'rgba(108, 92, 231, 0.15)',
                color: 'var(--nabu-accent-2)',
                border: '1px solid rgba(108, 92, 231, 0.3)',
              }}
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--nabu-accent-2)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <input
          style={inputStyle}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag and press Enter"
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--nabu-red)', fontSize: 13, margin: 0 }}>{error}</p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 10,
            border: 'none',
            background: 'var(--nabu-accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Card'}
        </button>
        <button
          onClick={handleDelete}
          style={{
            height: 42,
            padding: '0 18px',
            borderRadius: 10,
            border: '1px solid var(--nabu-red)',
            background: confirmDelete ? 'var(--nabu-red)' : 'transparent',
            color: confirmDelete ? '#fff' : 'var(--nabu-red)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {confirmDelete ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
