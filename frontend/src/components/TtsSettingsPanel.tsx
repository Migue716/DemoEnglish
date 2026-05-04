import { useEffect, useMemo, useState } from 'react'
import { Volume2 } from 'lucide-react'
import {
  notifyTtsSettingsChanged,
  parseStoredRate,
  pickPreferredEnglishVoice,
  supportsSpeechSynthesis,
  TTS_RATE_STORAGE_KEY,
  TTS_VOICE_STORAGE_KEY,
} from '../lib/ttsSettings'

export function TtsSettingsPanel() {
  const available = useMemo(() => supportsSpeechSynthesis(), [])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceUri, setVoiceUri] = useState('')
  const [rate, setRate] = useState(1)

  useEffect(() => {
    const parsed = parseStoredRate()
    setRate(parsed)
  }, [])

  useEffect(() => {
    if (!available) return
    const synth = window.speechSynthesis
    const syncVoices = () => {
      const allVoices = synth.getVoices()
      const englishVoices = allVoices.filter((v) => /^en-/i.test(v.lang))
      const options = englishVoices.length > 0 ? englishVoices : allVoices
      setVoices(options)
      const savedUri = window.localStorage.getItem(TTS_VOICE_STORAGE_KEY) ?? ''
      const saved = savedUri ? options.find((v) => v.voiceURI === savedUri) : null
      const picked = saved ?? pickPreferredEnglishVoice(options)
      const uri = picked?.voiceURI ?? ''
      setVoiceUri(uri)
      if (uri) window.localStorage.setItem(TTS_VOICE_STORAGE_KEY, uri)
    }
    syncVoices()
    synth.addEventListener('voiceschanged', syncVoices)
    return () => synth.removeEventListener('voiceschanged', syncVoices)
  }, [available])

  if (!available) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
        Read-aloud (browser voice) is not available in this browser.
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
        <Volume2 className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
        <span>Read aloud</span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Applies to read-aloud on dictionary results and study cards (Parts 1 and 2). Uses your browser or system voices.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="shrink-0">Voice</span>
          <select
            value={voiceUri}
            onChange={(e) => {
              const next = e.target.value
              setVoiceUri(next)
              window.localStorage.setItem(TTS_VOICE_STORAGE_KEY, next)
              notifyTtsSettingsChanged()
            }}
            className="max-w-[min(100%,18rem)] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          >
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="shrink-0">Speed</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={rate}
            onChange={(e) => {
              const next = Number(e.target.value)
              setRate(next)
              window.localStorage.setItem(TTS_RATE_STORAGE_KEY, String(next))
              notifyTtsSettingsChanged()
            }}
            className="h-2 w-28"
          />
          <span className="w-10 text-right tabular-nums text-slate-700 dark:text-slate-200">{Math.round(rate * 100)}%</span>
        </label>
      </div>
    </div>
  )
}
