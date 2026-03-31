'use client'

import { useState, useRef, useCallback } from 'react'

interface AudioButtonProps {
  audioUrl?: string | null
  text: string
  lang: string
  active?: boolean
  onToggle?: () => void
}

export default function AudioButton({
  audioUrl,
  text,
  lang,
  active = false,
  onToggle,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(() => {
    if (playing) return

    if (onToggle) onToggle()

    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
      }
      audioRef.current.currentTime = 0
      setPlaying(true)
      audioRef.current.onended = () => setPlaying(false)
      audioRef.current.onerror = () => setPlaying(false)
      audioRef.current.play().catch(() => setPlaying(false))
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9
      utterance.onend = () => setPlaying(false)
      utterance.onerror = () => setPlaying(false)
      setPlaying(true)
      window.speechSynthesis.speak(utterance)
    }
  }, [audioUrl, text, lang, playing, onToggle])

  return (
    <button
      onClick={play}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 36,
        padding: '0 12px',
        borderRadius: 9999,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        border: active
          ? '1px solid var(--nabu-accent, #6c5ce7)'
          : '1px solid var(--nabu-border, rgba(255,255,255,0.1))',
        background: active
          ? 'rgba(108, 92, 231, 0.15)'
          : 'var(--nabu-surface-2, #1e1e2e)',
        color: active
          ? 'var(--nabu-accent-2, #a29bfe)'
          : 'var(--nabu-dim, #888)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          animation: playing ? 'nabu-pulse 0.6s ease-in-out infinite' : 'none',
        }}
      >
        {playing ? '\uD83D\uDD0A' : '\uD83D\uDD08'}
      </span>
      <span>Audio</span>
      <span
        style={{
          fontSize: 11,
          opacity: 0.5,
          marginLeft: 2,
          fontFamily: 'monospace',
        }}
      >
        A
      </span>
      <style>{`
        @keyframes nabu-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
      `}</style>
    </button>
  )
}
