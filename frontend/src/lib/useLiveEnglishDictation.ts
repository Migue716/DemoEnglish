import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  dictationUnavailableExplanation,
  getSpeechRecognitionCtor,
  type SpeechRecErrorEvent,
  type SpeechRecResultEvent,
  type WebSpeechRecognition,
} from './speechRecognitionEnv'
import { readMicPrimedFromSession, writeMicPrimedToSession } from '../components/MicPermissionModal'

/**
 * Continuous English Web Speech dictation (Chrome/Edge). Same behavior core as {@link Part2DictationPanel}
 * without reference alignment.
 */
export function useLiveEnglishDictation() {
  const supported = useMemo(() => getSpeechRecognitionCtor() !== null, [])
  const unsupportedHint = useMemo(() => dictationUnavailableExplanation(), [])
  const [text, setTextState] = useState('')
  const setText = useCallback((value: string) => {
    accumulatedRef.current = value
    setTextState(value)
  }, [])
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accumulatedRef = useRef('')
  const recRef = useRef<WebSpeechRecognition | null>(null)
  const userWantsListenRef = useRef(false)

  const [micPrimed, setMicPrimed] = useState(readMicPrimedFromSession)
  const [micGateOpen, setMicGateOpen] = useState(false)
  const [micGateLoading, setMicGateLoading] = useState(false)
  const [micGateError, setMicGateError] = useState<string | null>(null)

  const stopListening = useCallback(() => {
    userWantsListenRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* already stopped */
    }
    recRef.current = null
    setListening(false)
  }, [])

  useEffect(() => {
    return () => {
      userWantsListenRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* noop */
      }
      recRef.current = null
    }
  }, [])

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return
    setError(null)
    accumulatedRef.current = text.trimEnd() ? `${text.trimEnd()} ` : ''
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: SpeechRecResultEvent) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const piece = r[0]?.transcript ?? ''
        if (r.isFinal) accumulatedRef.current += piece
        else interim += piece
      }
      setTextState(accumulatedRef.current + interim)
    }
    rec.onerror = (ev: SpeechRecErrorEvent) => {
      if (ev.error === 'aborted') return
      if (ev.error === 'no-speech') return
      userWantsListenRef.current = false
      if (ev.error === 'not-allowed') setError('Microphone access denied. Allow the site to use the mic.')
      else setError(ev.message || ev.error)
      recRef.current = null
      setListening(false)
    }
    rec.onend = () => {
      if (!userWantsListenRef.current) {
        recRef.current = null
        setListening(false)
        return
      }
      try {
        rec.start()
      } catch {
        recRef.current = null
        setListening(false)
      }
    }
    userWantsListenRef.current = true
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch (err) {
      userWantsListenRef.current = false
      recRef.current = null
      setError(err instanceof Error ? err.message : 'Could not start microphone.')
    }
  }, [text])

  const handleMicGateConfirm = useCallback(async () => {
    setMicGateError(null)
    setMicGateLoading(true)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      }
      writeMicPrimedToSession()
      setMicPrimed(true)
      setMicGateOpen(false)
      setMicGateLoading(false)
      startListening()
    } catch (e) {
      setMicGateLoading(false)
      const msg =
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Permiso denegado o bloqueado. Revisa los permisos del sitio o del navegador para el micrófono.'
          : e instanceof Error
            ? e.message
            : 'No se pudo obtener acceso al micrófono.'
      setMicGateError(msg)
    }
  }, [startListening])

  const toggleListen = useCallback(() => {
    if (listening) {
      stopListening()
      return
    }
    if (supported && !micPrimed) {
      setMicGateError(null)
      setMicGateOpen(true)
      return
    }
    void startListening()
  }, [listening, micPrimed, startListening, stopListening, supported])

  const clearText = useCallback(() => {
    accumulatedRef.current = ''
    setTextState('')
    setError(null)
  }, [])

  const closeMicGate = useCallback(() => {
    setMicGateOpen(false)
    setMicGateLoading(false)
    setMicGateError(null)
  }, [])

  return {
    supported,
    unsupportedHint,
    text,
    setText,
    listening,
    error,
    toggleListen,
    stopListening,
    clearText,
    micGateOpen,
    micGateLoading,
    micGateError,
    handleMicGateConfirm,
    closeMicGate,
  }
}
