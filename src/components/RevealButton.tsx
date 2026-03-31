'use client'

interface RevealButtonProps {
  label: string
  icon: string
  active: boolean
  onClick: () => void
  keyboardHint?: string
}

export default function RevealButton({
  label,
  icon,
  active,
  onClick,
  keyboardHint,
}: RevealButtonProps) {
  return (
    <button
      onClick={onClick}
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
      <span>{icon}</span>
      <span>{label}</span>
      {keyboardHint && (
        <span
          style={{
            fontSize: 11,
            opacity: 0.5,
            marginLeft: 2,
            fontFamily: 'monospace',
          }}
        >
          {keyboardHint}
        </span>
      )}
    </button>
  )
}
