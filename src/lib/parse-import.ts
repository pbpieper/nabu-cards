export interface ParsedCard {
  word: string
  translation: string
  image_url?: string
  example_sentence?: string
  explanation?: string
}

export interface ParseError {
  line: number
  message: string
}

export interface ParseResult {
  valid: ParsedCard[]
  errors: ParseError[]
}

/**
 * Auto-detect delimiter: tab wins if any line contains a tab, else comma.
 */
function detectDelimiter(text: string): string {
  const firstLines = text.split('\n').slice(0, 5)
  const hasTab = firstLines.some((line) => line.includes('\t'))
  return hasTab ? '\t' : ','
}

/**
 * Strip BOM from the start of text.
 */
function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1)
  }
  return text
}

/**
 * Split a CSV line respecting quoted fields.
 * Handles: "field with, comma", "field with ""escaped"" quotes"
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // End of quoted field
          inQuotes = false
          i++
        }
      } else {
        current += char
        i++
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
      } else if (char === delimiter) {
        fields.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
  }

  fields.push(current.trim())
  return fields
}

/**
 * Parse TSV/CSV text into cards.
 *
 * Expected columns (in order):
 *   word, translation, image_url?, example_sentence?, explanation?
 *
 * Only word and translation are required.
 */
export function parseImport(raw: string): ParseResult {
  const text = stripBom(raw)
  const delimiter = detectDelimiter(text)
  const lines = text.split(/\r?\n/)

  const valid: ParsedCard[] = []
  const errors: ParseError[] = []

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const line = lines[i].trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue
    }

    // Skip header row if it looks like one
    if (
      i === 0 &&
      line.toLowerCase().includes('word') &&
      line.toLowerCase().includes('translation')
    ) {
      continue
    }

    const fields = splitCsvLine(line, delimiter)

    if (fields.length < 2) {
      errors.push({
        line: lineNum,
        message: 'At least word and translation are required',
      })
      continue
    }

    const word = fields[0].trim()
    const translation = fields[1].trim()

    if (!word) {
      errors.push({ line: lineNum, message: 'Word is empty' })
      continue
    }

    if (!translation) {
      errors.push({ line: lineNum, message: 'Translation is empty' })
      continue
    }

    const card: ParsedCard = { word, translation }

    if (fields[2]?.trim()) card.image_url = fields[2].trim()
    if (fields[3]?.trim()) card.example_sentence = fields[3].trim()
    if (fields[4]?.trim()) card.explanation = fields[4].trim()

    valid.push(card)
  }

  return { valid, errors }
}
