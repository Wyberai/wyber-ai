// Spoken-language choices for voice input and how we pick the default.
// Codes are BCP-47 tags understood by the Web Speech API (Chrome/Edge/Safari).

export interface VoiceLanguage {
  /** BCP-47 tag handed to speech recognition. */
  code: string
  /** Short code the server speech-to-text provider expects (ISO 639-1). */
  short: string
  /** Name in its own script, shown in the picker. */
  label: string
}

export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: 'en-IN', short: 'en', label: 'English' },
  { code: 'hi-IN', short: 'hi', label: 'हिंदी' },
  { code: 'mr-IN', short: 'mr', label: 'मराठी' },
  { code: 'gu-IN', short: 'gu', label: 'ગુજરાતી' },
  { code: 'ta-IN', short: 'ta', label: 'தமிழ்' },
  { code: 'te-IN', short: 'te', label: 'తెలుగు' },
  { code: 'kn-IN', short: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn-IN', short: 'bn', label: 'বাংলা' },
]

export const VOICE_LANG_STORAGE_KEY = 'wyber-voice-lang'

/** English variants get the closest English accent model; everything else maps by language prefix. */
export function mapLocaleToVoiceLanguage(tag: string | null | undefined): VoiceLanguage | null {
  if (!tag) return null
  const prefix = tag.toLowerCase().split(/[-_]/)[0]
  if (!prefix) return null
  return VOICE_LANGUAGES.find(l => l.short === prefix) ?? null
}

export function findVoiceLanguage(code: string | null | undefined): VoiceLanguage | null {
  if (!code) return null
  return VOICE_LANGUAGES.find(l => l.code === code) ?? null
}

/**
 * Default language: the user's saved choice, else the first browser language we
 * support, else English (India). A site-locale hint (hi/kn/te/ta) beats the
 * browser list because the visitor already chose it on the page.
 */
export function pickDefaultVoiceLanguage(opts: {
  saved?: string | null
  siteLocale?: string | null
  browserLanguages?: readonly string[] | null
}): VoiceLanguage {
  const saved = findVoiceLanguage(opts.saved)
  if (saved) return saved
  const site = opts.siteLocale && opts.siteLocale !== 'en' ? mapLocaleToVoiceLanguage(opts.siteLocale) : null
  if (site) return site
  for (const tag of opts.browserLanguages ?? []) {
    const m = mapLocaleToVoiceLanguage(tag)
    if (m) return m
  }
  return VOICE_LANGUAGES[0]
}
