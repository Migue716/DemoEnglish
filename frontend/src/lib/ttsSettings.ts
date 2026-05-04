/** Keys shared by main-screen TTS settings and card modal playback. */
export const TTS_VOICE_STORAGE_KEY = 'demoenglish.tts.voiceUri'
export const TTS_RATE_STORAGE_KEY = 'demoenglish.tts.rate'

export const TTS_SETTINGS_CHANGED_EVENT = 'demoenglish:tts-settings'

export function supportsSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
}

export function pickPreferredEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  const byNameAndLang = (namePattern: RegExp, langPattern = /en-US/i) =>
    voices.find((v) => namePattern.test(v.name) && langPattern.test(v.lang))

  return (
    byNameAndLang(/Aria|Jenny|Guy|Sonia/i) ??
    byNameAndLang(/Natural|Neural|Online/i) ??
    voices.find((v) => /en-US/i.test(v.lang)) ??
    voices.find((v) => /^en-/i.test(v.lang)) ??
    voices[0] ??
    null
  )
}

export function parseStoredRate(): number {
  const raw = window.localStorage.getItem(TTS_RATE_STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  if (Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 1.5) return parsed
  return 1
}

/** Resolves the voice to use for playback from current `getVoices()` and saved URI. */
export function resolveVoiceForPlayback(): SpeechSynthesisVoice | null {
  if (!supportsSpeechSynthesis()) return null
  const synth = window.speechSynthesis
  const allVoices = synth.getVoices()
  const englishVoices = allVoices.filter((v) => /^en-/i.test(v.lang))
  const options = englishVoices.length > 0 ? englishVoices : allVoices
  const savedUri = window.localStorage.getItem(TTS_VOICE_STORAGE_KEY) ?? ''
  const saved = savedUri ? options.find((v) => v.voiceURI === savedUri) : null
  return saved ?? pickPreferredEnglishVoice(options)
}

export function notifyTtsSettingsChanged(): void {
  window.dispatchEvent(new CustomEvent(TTS_SETTINGS_CHANGED_EVENT))
}
