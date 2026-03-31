/**
 * Generate a 6-character alphanumeric share code.
 * Excludes ambiguous characters: 0, O, 1, I, l
 */
export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Standard Levenshtein distance between two strings.
 * Useful for fuzzy matching user input against card answers.
 */
export function levenshtein(a: string, b: string): number {
  const la = a.length
  const lb = b.length

  if (la === 0) return lb
  if (lb === 0) return la

  // Use two rows instead of full matrix for memory efficiency
  let prev = new Array<number>(lb + 1)
  let curr = new Array<number>(lb + 1)

  for (let j = 0; j <= lb; j++) {
    prev[j] = j
  }

  for (let i = 1; i <= la; i++) {
    curr[0] = i
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      )
    }
    // Swap rows
    ;[prev, curr] = [curr, prev]
  }

  return prev[lb]
}

/**
 * Format a duration in milliseconds to "M:SS" or "H:MM:SS" format.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const paddedSeconds = seconds.toString().padStart(2, '0')

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, '0')
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

/**
 * Conditional className joiner. Filters out falsy values and joins with space.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
