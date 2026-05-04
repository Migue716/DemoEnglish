import { useEffect, useMemo, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import {
  parseStoredRate,
  resolveVoiceForPlayback,
  supportsSpeechSynthesis,
  TTS_SETTINGS_CHANGED_EVENT,
} from '../lib/ttsSettings'

type SpeakTextButtonProps = {
  text: string
  /** Changes when the source text/card changes so playback state resets. */
  resetSignal: number | string
  selectionScopeRef?: { current: HTMLElement | null }
}

export function SpeakTextButton({ text, resetSignal, selectionScopeRef }: SpeakTextButtonProps) {
  const supported = useMemo(() => supportsSpeechSynthesis(), [])
  const [speaking, setSpeaking] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setSelectedText('')
  }, [resetSignal, supported])

  useEffect(() => {
    if (!supported) return
    const onSettings = () => {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
    window.addEventListener(TTS_SETTINGS_CHANGED_EVENT, onSettings)
    return () => {
      window.removeEventListener(TTS_SETTINGS_CHANGED_EVENT, onSettings)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  useEffect(() => {
    if (!supported || !selectionScopeRef?.current) return
    const updateSelection = () => {
      const scope = selectionScopeRef.current
      if (!scope) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        setSelectedText('')
        return
      }
      const anchor = sel.anchorNode
      const focus = sel.focusNode
      const inScope = Boolean(
        anchor &&
          focus &&
          (scope.contains(anchor.nodeType === Node.TEXT_NODE ? anchor.parentNode : anchor) ||
            scope.contains(focus.nodeType === Node.TEXT_NODE ? focus.parentNode : focus)),
      )
      if (!inScope) {
        setSelectedText('')
        return
      }
      setSelectedText(sel.toString().trim())
    }
    document.addEventListener('selectionchange', updateSelection)
    return () => document.removeEventListener('selectionchange', updateSelection)
  }, [supported, selectionScopeRef])

  if (!supported || !text.trim()) return null

  const onToggleSpeak = () => {
    const content = selectedText || text
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const voice = resolveVoiceForPlayback()
    const speechRate = parseStoredRate()
    const utterance = new SpeechSynthesisUtterance(content)
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'en-US'
    utterance.rate = speechRate
    utterance.pitch = 1
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button
      type="button"
      onClick={onToggleSpeak}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
        speaking
          ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500'
          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
      }`}
      aria-pressed={speaking}
      aria-label={speaking ? 'Stop reading text' : 'Read text aloud'}
    >
      {speaking ? (
        <>
          <Square className="size-4 shrink-0 fill-current" aria-hidden />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="size-4 shrink-0" aria-hidden />
          {selectedText ? 'Read selection' : 'Read text'}
        </>
      )}
    </button>
  )
}
