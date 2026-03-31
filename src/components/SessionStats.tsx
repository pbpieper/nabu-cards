'use client'

interface SessionStatsData {
  cardsReviewed: number
  cardsCorrect: number
  newCardsSeen: number
  duration: number // ms
}

interface SessionStatsProps {
  stats: SessionStatsData
  onStudyMore: () => void
  onDone: () => void
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function SessionStats({
  stats,
  onStudyMore,
  onDone,
}: SessionStatsProps) {
  const accuracy =
    stats.cardsReviewed > 0
      ? Math.round((stats.cardsCorrect / stats.cardsReviewed) * 100)
      : 0

  const accuracyColor =
    accuracy >= 80
      ? 'var(--nabu-green, #00b894)'
      : accuracy >= 50
        ? 'var(--nabu-orange, #fdcb6e)'
        : 'var(--nabu-red, #e17055)'

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--nabu-text, #e8e8e8)',
          margin: 0,
        }}
      >
        Session Complete
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          width: '100%',
        }}
      >
        {/* Cards Reviewed */}
        <StatBox label="Cards Reviewed" value={String(stats.cardsReviewed)} />

        {/* Accuracy */}
        <StatBox
          label="Accuracy"
          value={`${accuracy}%`}
          valueColor={accuracyColor}
        />

        {/* New Cards */}
        <StatBox label="New Cards" value={String(stats.newCardsSeen)} />

        {/* Duration */}
        <StatBox label="Duration" value={formatDuration(stats.duration)} />
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
        <button onClick={onStudyMore} style={secondaryBtnStyle}>
          Study More
        </button>
        <button onClick={onDone} style={primaryBtnStyle}>
          Done
        </button>
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div
      style={{
        background: 'var(--nabu-surface-2, #1e1e2e)',
        border: '1px solid var(--nabu-border, rgba(255,255,255,0.08))',
        borderRadius: 14,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: valueColor || 'var(--nabu-text, #e8e8e8)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--nabu-dim, #888)',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  )
}

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  border: '1px solid var(--nabu-border, rgba(255,255,255,0.1))',
  background: 'var(--nabu-surface-2, #1e1e2e)',
  color: 'var(--nabu-text, #e8e8e8)',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
}

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  border: '1px solid var(--nabu-accent, #6c5ce7)',
  background: 'var(--nabu-accent, #6c5ce7)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
}
