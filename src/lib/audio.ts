/**
 * Language code → BCP-47 voice tag mapping for Web Speech API.
 * Multiple tags per language to increase the chance of finding a matching voice.
 */
const LANG_MAP: Record<string, string[]> = {
  ar: ['ar-SA', 'ar-EG', 'ar'],
  de: ['de-DE', 'de-AT', 'de'],
  en: ['en-US', 'en-GB', 'en'],
  es: ['es-ES', 'es-MX', 'es'],
  fr: ['fr-FR', 'fr-CA', 'fr'],
  he: ['he-IL', 'he'],
  hi: ['hi-IN', 'hi'],
  it: ['it-IT', 'it'],
  ja: ['ja-JP', 'ja'],
  ko: ['ko-KR', 'ko'],
  nl: ['nl-NL', 'nl-BE', 'nl'],
  pl: ['pl-PL', 'pl'],
  pt: ['pt-BR', 'pt-PT', 'pt'],
  ru: ['ru-RU', 'ru'],
  sv: ['sv-SE', 'sv'],
  tr: ['tr-TR', 'tr'],
  zh: ['zh-CN', 'zh-TW', 'zh'],
}

/**
 * Find the best matching voice for a language code.
 */
function findVoice(langCode: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  const candidates = LANG_MAP[langCode] ?? [langCode]

  for (const tag of candidates) {
    // Exact match first
    const exact = voices.find((v) => v.lang === tag)
    if (exact) return exact

    // Prefix match
    const prefix = voices.find((v) => v.lang.startsWith(tag.split('-')[0]))
    if (prefix) return prefix
  }

  return null
}

/**
 * Speak text using Web Speech API.
 * Returns a promise that resolves when the utterance finishes.
 */
export function speak(text: string, langCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech synthesis not available'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = findVoice(langCode)

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      // Fallback: set the lang tag directly
      const tags = LANG_MAP[langCode]
      utterance.lang = tags?.[0] ?? langCode
    }

    utterance.rate = 0.9
    utterance.pitch = 1.0

    utterance.onend = () => resolve()
    utterance.onerror = (event) => {
      if (event.error === 'canceled') {
        resolve()
      } else {
        reject(new Error(`Speech error: ${event.error}`))
      }
    }

    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Play an audio file from a URL. Returns a promise that resolves when playback ends.
 */
export function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)

    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error(`Failed to play audio: ${url}`))

    audio.play().catch(reject)
  })
}

/**
 * Play audio for a card: use audio_url if present, otherwise fall back to TTS.
 */
export async function playCardAudio(
  card: { word: string; audio_url?: string | null },
  langCode: string,
): Promise<void> {
  if (card.audio_url) {
    return playAudioFile(card.audio_url)
  }
  return speak(card.word, langCode)
}
