'use client'

interface ProgressBarProps {
  progress: number // 0–1
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const pct = Math.min(1, Math.max(0, progress)) * 100

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        backgroundColor: 'var(--nabu-border, rgba(255,255,255,0.08))',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: 'var(--nabu-accent, #6c5ce7)',
          transition: 'width 400ms ease-out',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  )
}
