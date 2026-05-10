import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Eraser, Mic, Square } from 'lucide-react'
import { alignUserWordsToReference, tokenizeInputWithSpans } from '../lib/dictationWordAlign'
import {
  dictationUnavailableExplanation,
  getSpeechRecognitionCtor,
  type SpeechRecErrorEvent,
  type SpeechRecResultEvent,
  type WebSpeechRecognition,
} from '../lib/speechRecognitionEnv'
import { MicPermissionModal, readMicPrimedFromSession, writeMicPrimedToSession } from './MicPermissionModal'

export type DictationReferenceParagraph = { id: string; label: string; text: string }

/** Browser speech-to-text (Chrome/Edge; limited elsewhere). Requires HTTPS or localhost. */
export function Part2DictationPanel({
  resetSignal,
  referenceParagraphs,
  rootClassName = 'mt-10',
  spacious = false,
}: {
  resetSignal: number
  referenceParagraphs: DictationReferenceParagraph[]
  rootClassName?: string
  spacious?: boolean
}) {
  const supported = useMemo(() => getSpeechRecognitionCtor() !== null, [])
  const unsupportedHint = useMemo(() => dictationUnavailableExplanation(), [])
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRefId, setSelectedRefId] = useState(() => referenceParagraphs[0]?.id ?? '')
  const accumulatedRef = useRef('')
  const recRef = useRef<WebSpeechRecognition | null>(null)
  const userWantsListenRef = useRef(false)

  const [micPrimed, setMicPrimed] = useState(readMicPrimedFromSession)
  const [micGateOpen, setMicGateOpen] = useState(false)
  const [micGateLoading, setMicGateLoading] = useState(false)
  const [micGateError, setMicGateError] = useState<string | null>(null)

  const t = spacious ? 'text-sm' : 'text-xs'
  const btn = spacious ? 'px-5 py-3 text-base' : 'px-4 py-2.5 text-sm'
  const taRows = spacious ? 5 : 4

  useEffect(() => {
    setSelectedRefId(referenceParagraphs[0]?.id ?? '')
  }, [resetSignal, referenceParagraphs])

  const selectedRefText = useMemo(() => {
    const p = referenceParagraphs.find((x) => x.id === selectedRefId)
    return p?.text ?? referenceParagraphs[0]?.text ?? ''
  }, [referenceParagraphs, selectedRefId])

  const coloredWordPreview = useMemo((): ReactNode => {
    const refTrim = selectedRefText.trim()
    if (!refTrim) return null
    const tokens = tokenizeInputWithSpans(text)
    if (tokens.length === 0) {
      return (
        <span className={spacious ? 'text-base text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}>
          Type or dictate to compare word by word.
        </span>
      )
    }
    const statuses = alignUserWordsToReference(selectedRefText, text)
    if (statuses.length !== tokens.length) {
      return <span className="text-slate-500">{text}</span>
    }
    const parts: ReactNode[] = []
    let pos = 0
    tokens.forEach((tok, k) => {
      if (tok.start > pos) {
        parts.push(
          <span key={`gap-${pos}`} className="text-slate-700 dark:text-slate-200">
            {text.slice(pos, tok.start)}
          </span>,
        )
      }
      const ok = statuses[k] === 'ok'
      parts.push(
        <span
          key={`tok-${tok.start}-${k}`}
          className={
            ok
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 underline decoration-rose-400/80 dark:text-rose-400 dark:decoration-rose-500/80'
          }
        >
          {tok.text}
        </span>,
      )
      pos = tok.end
    })
    if (pos < text.length) {
      parts.push(
        <span key={`tail-${pos}`} className="text-slate-700 dark:text-slate-200">
          {text.slice(pos)}
        </span>,
      )
    }
    return parts
  }, [text, selectedRefText, spacious])

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
    accumulatedRef.current = ''
    setText('')
    setError(null)
    userWantsListenRef.current = false
    try {
      recRef.current?.abort()
    } catch {
      /* noop */
    }
    recRef.current = null
    setListening(false)
    setMicGateOpen(false)
    setMicGateLoading(false)
    setMicGateError(null)
  }, [resetSignal])

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
      setText(accumulatedRef.current + interim)
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

  const toggleListen = () => {
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
  }

  const clearText = () => {
    accumulatedRef.current = ''
    setText('')
    setError(null)
  }

  return (
    <div className={rootClassName}>
      {!supported ? (
        <div
          role="note"
          className={`mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100 ${spacious ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'}`}
        >
          {unsupportedHint}
        </div>
      ) : null}
      <p
        className={`mb-2 text-center font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 ${spacious ? 'text-sm' : 'text-xs'}`}
      >
        {supported ? 'Dictate (English)' : 'Compare your English'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        {supported ? (
          <button
            type="button"
            onClick={toggleListen}
            className={`inline-flex items-center gap-2 rounded-xl font-medium transition ${btn} ${
              listening
                ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500'
                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
            }`}
            aria-pressed={listening}
            aria-label={listening ? 'Stop dictation' : 'Start dictation'}
          >
            {listening ? (
              <>
                <Square className="size-4 shrink-0 fill-current" aria-hidden />
                Stop
              </>
            ) : (
              <>
                <Mic className="size-4 shrink-0" aria-hidden />
                Dictate
              </>
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={clearText}
          disabled={!text}
          className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 ${btn}`}
          aria-label="Clear text"
        >
          <Eraser className="size-4 shrink-0" aria-hidden />
          Clear
        </button>
      </div>
      {referenceParagraphs.length > 0 ? (
        <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <label className={`flex flex-wrap items-center gap-2 font-medium text-slate-600 dark:text-slate-300 ${t}`}>
            <span>Compare to</span>
            <select
              value={selectedRefId}
              onChange={(e) => setSelectedRefId(e.target.value)}
              className={`max-w-full rounded-lg border border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 ${spacious ? 'px-3 py-2 text-base' : 'px-2 py-1.5 text-xs'}`}
            >
              {referenceParagraphs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <span className={`text-slate-500 dark:text-slate-400 ${spacious ? 'text-sm' : 'text-xs'}`}>
            Green = same word (after normalizing); red = mismatch or extra.
          </span>
        </div>
      ) : null}
      {error ? (
        <p
          className={`mt-2 text-center text-rose-600 dark:text-rose-400 sm:text-left ${spacious ? 'text-base' : 'text-sm'}`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <label className="mt-3 block">
        <span className="sr-only">Transcript</span>
        <textarea
          value={text}
          onChange={(e) => {
            accumulatedRef.current = e.target.value
            setText(e.target.value)
          }}
          rows={taRows}
          placeholder={
            supported
              ? 'Tap Dictate and speak; your words appear here. You can edit the text.'
              : 'Type here, or tap the microphone on the iPhone keyboard (next to the space bar) to dictate into this box.'
          }
          className={`w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${spacious ? 'text-lg' : 'text-sm'}`}
          spellCheck
        />
      </label>
      {referenceParagraphs.length > 0 && selectedRefText.trim() ? (
        <div className="mt-3">
          <p className={`mb-1 font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 ${spacious ? 'text-sm' : 'text-xs'}`}>
            Word check
          </p>
          <div
            className={`min-h-[3.25rem] whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${spacious ? 'text-lg' : 'text-sm'}`}
            aria-live="polite"
          >
            {coloredWordPreview}
          </div>
        </div>
      ) : null}
      {supported ? (
        <MicPermissionModal
          open={micGateOpen}
          onClose={() => {
            setMicGateOpen(false)
            setMicGateLoading(false)
            setMicGateError(null)
          }}
          onConfirm={handleMicGateConfirm}
          loading={micGateLoading}
          error={micGateError}
          spacious={spacious}
        />
      ) : null}
    </div>
  )
}
