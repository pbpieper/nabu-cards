'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
)

interface ParsedCard {
  word: string
  translation: string
  image_url?: string
  example_sentence?: string
  explanation?: string
  valid: boolean
  error?: string
}

interface BulkImportProps {
  deckId: string
  currentCardCount: number
  onImported: () => void
  onClose: () => void
}

export default function BulkImport({
  deckId,
  currentCardCount,
  onImported,
  onClose,
}: BulkImportProps) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedCard[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)

  const parseInput = () => {
    setError(null)
    setSuccessCount(null)

    // Strip BOM
    let cleaned = text.replace(/^\uFEFF/, '')

    const lines = cleaned.split('\n').filter((line) => {
      const trimmed = line.trim()
      return trimmed.length > 0 && !trimmed.startsWith('#')
    })

    if (lines.length === 0) {
      setError('No valid lines found')
      return
    }

    const cards: ParsedCard[] = lines.map((line) => {
      const parts = line.split('\t').map((s) => s.trim())
      const word = parts[0] || ''
      const translation = parts[1] || ''

      if (!word || !translation) {
        return {
          word: word || '(empty)',
          translation: translation || '(empty)',
          valid: false,
          error: 'Missing word or translation',
        }
      }

      return {
        word,
        translation,
        image_url: parts[2] || undefined,
        example_sentence: parts[3] || undefined,
        explanation: parts[4] || undefined,
        valid: true,
      }
    })

    setParsed(cards)
  }

  const doImport = async () => {
    if (!parsed) return
    const valid = parsed.filter((c) => c.valid)
    if (valid.length === 0) {
      setError('No valid cards to import')
      return
    }

    setImporting(true)
    setError(null)

    const rows = valid.map((c, i) => ({
      deck_id: deckId,
      word: c.word,
      translation: c.translation,
      image_url: c.image_url || null,
      example_sentence: c.example_sentence || null,
      explanation: c.explanation || null,
      sort_order: currentCardCount + i,
      tags: [],
    }))

    const { error: err, data } = await supabase.from('cards').insert(rows).select()

    setImporting(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccessCount(data?.length ?? valid.length)
      onImported()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          overflow: 'auto',
          borderRadius: 16,
          background: 'var(--nabu-surface)',
          border: '1px solid var(--nabu-border)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Bulk Import Cards</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--nabu-dim)',
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {successCount !== null ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 18, color: 'var(--nabu-green)', fontWeight: 600, marginBottom: 8 }}>
              Imported {successCount} card{successCount !== 1 ? 's' : ''}!
            </p>
            <button
              onClick={onClose}
              style={{
                height: 40,
                padding: '0 24px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--nabu-accent)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--nabu-surface-2)',
                marginBottom: 12,
                fontSize: 13,
                color: 'var(--nabu-dim)',
                lineHeight: 1.6,
              }}
            >
              <strong>Format:</strong> Tab-separated, one card per line<br />
              <code style={{ fontSize: 12, color: 'var(--nabu-accent-2)' }}>
                word&#9;translation&#9;image_url&#9;example_sentence&#9;explanation
              </code>
              <br />
              Only word and translation are required. Lines starting with # are ignored.
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setParsed(null)
              }}
              placeholder={`hola\thello\ngracias\tthank you\nadiós\tgoodbye`}
              style={{
                width: '100%',
                minHeight: 160,
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid var(--nabu-border)',
                background: 'var(--nabu-bg)',
                color: 'var(--nabu-text)',
                fontSize: 14,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />

            {/* Preview Table */}
            {parsed && (
              <div style={{ marginTop: 16, maxHeight: 240, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--nabu-border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--nabu-dim)', fontWeight: 500 }}></th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--nabu-dim)', fontWeight: 500 }}>Word</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--nabu-dim)', fontWeight: 500 }}>Translation</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--nabu-dim)', fontWeight: 500 }}>Extra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--nabu-border)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          {c.valid ? (
                            <span style={{ color: 'var(--nabu-green)' }}>&#10003;</span>
                          ) : (
                            <span style={{ color: 'var(--nabu-red)' }}>&#10007;</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 8px' }}>{c.word}</td>
                        <td style={{ padding: '6px 8px' }}>{c.translation}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--nabu-dim)' }}>
                          {c.error || [c.image_url && 'img', c.example_sentence && 'ex', c.explanation && 'exp'].filter(Boolean).join(', ') || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 12, color: 'var(--nabu-dim)', marginTop: 8 }}>
                  {parsed.filter((c) => c.valid).length} valid, {parsed.filter((c) => !c.valid).length} invalid
                </p>
              </div>
            )}

            {error && (
              <p style={{ color: 'var(--nabu-red)', fontSize: 13, marginTop: 8 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {!parsed ? (
                <button
                  onClick={parseInput}
                  disabled={text.trim().length === 0}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    border: 'none',
                    background: text.trim().length > 0 ? 'var(--nabu-accent)' : 'var(--nabu-surface-2)',
                    color: text.trim().length > 0 ? '#fff' : 'var(--nabu-dim)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: text.trim().length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Preview
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setParsed(null)}
                    style={{
                      height: 42,
                      padding: '0 18px',
                      borderRadius: 10,
                      border: '1px solid var(--nabu-border)',
                      background: 'transparent',
                      color: 'var(--nabu-text)',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={doImport}
                    disabled={importing || parsed.filter((c) => c.valid).length === 0}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      border: 'none',
                      background: 'var(--nabu-green)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: importing ? 'wait' : 'pointer',
                      opacity: importing ? 0.7 : 1,
                    }}
                  >
                    {importing
                      ? 'Importing...'
                      : `Import ${parsed.filter((c) => c.valid).length} Card${parsed.filter((c) => c.valid).length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
