import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Eraser, Mic, Square, Trash2, X } from 'lucide-react'
import { ankiModalPanelStyle } from '../config/ankiModalLayout'
import {
  extractMediaEmbedsInOrder,
  hasMediaEmbeds,
  looksLikePhoneticLine,
  parseBackDisplay,
  stripMediaPlaceholders,
  stripMediaTagsKeepNewlines,
} from '../lib/ankiCardLayout'
import { findApkgMediaUrl } from '../lib/apkgMedia'
import type { AnkiCard } from '../types/anki'
import { SpeakTextButton } from './SpeakTextButton'

/** Subset of the Web Speech API (omitted from this project's DOM typings). */
interface SpeechRecAlternative {
  transcript: string
}
interface SpeechRecResult {
  readonly isFinal: boolean
  readonly 0: SpeechRecAlternative
}
interface SpeechRecResultList {
  readonly length: number
  [index: number]: SpeechRecResult
}
interface SpeechRecResultEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecResultList
}
interface SpeechRecErrorEvent extends Event {
  readonly error: string
  readonly message: string
}
interface WebSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((this: WebSpeechRecognition, ev: SpeechRecResultEvent) => void) | null
  onerror: ((this: WebSpeechRecognition, ev: SpeechRecErrorEvent) => void) | null
  onend: ((this: WebSpeechRecognition, ev: Event) => void) | null
}
type WebSpeechRecognitionCtor = new () => WebSpeechRecognition

function listTitle(front: string): string {
  const line = front.split(/\r?\n/)[0]?.trim() ?? front
  if (line.length > 80) return `${line.slice(0, 77)}…`
  return line || '(empty)'
}

/** First line of the card front for lists and A–Z sort; strips media tags. Full line is shown (CSS truncates in narrow rows). */
export function baseWordLabel(front: string): string {
  const raw = front.split(/\r?\n/)[0] ?? ''
  const cleaned = raw
    .replace(/\[(?:sound|img):[^\]]+\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return '(empty)'
  return cleaned
}

function DeckAudio({
  filename,
  mediaUrls,
}: {
  filename: string
  mediaUrls: ReadonlyMap<string, string>
}) {
  const src = findApkgMediaUrl(filename, mediaUrls)
  const audioRef = useRef<HTMLAudioElement>(null)

  /** `preload="metadata"` often leaves almost no decoded audio buffered; play() then starts late and clips feel like they skip the first ~0.3–1s. */
  useEffect(() => {
    if (!src) return
    const el = audioRef.current
    if (!el) return
    el.load()
  }, [src])

  if (!src) {
    return (
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        {filename.length > 48 ? `${filename.slice(0, 45)}…` : filename} (missing)
      </p>
    )
  }
  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <audio
        ref={audioRef}
        controls
        playsInline
        className="h-10 w-full rounded-xl bg-slate-200/80 dark:bg-slate-800/80"
        src={src}
        preload="auto"
      />
    </div>
  )
}

function DeckImage({ filename, mediaUrls }: { filename: string; mediaUrls: ReadonlyMap<string, string> }) {
  const src = findApkgMediaUrl(filename, mediaUrls)
  if (!src) {
    return <p className="text-center text-xs text-slate-500 dark:text-slate-400">Image not in package</p>
  }
  return (
    <img
      src={src}
      alt=""
      className="mx-auto max-h-[min(50vh,29rem)] max-w-full rounded-xl object-contain"
      loading="lazy"
    />
  )
}

type AnkiCardDetailModalProps = {
  card: AnkiCard
  cardIndex: number
  /** 1-based position in A–Z deck order; falls back to cardIndex + 1 when omitted. */
  deckOrdinal?: number
  totalCards: number
  mediaUrls: ReadonlyMap<string, string>
  onClose: () => void
  onRemove: () => void
}

function PreviewDivider({ show }: { show: boolean }) {
  if (!show) return null
  return <hr className="mx-auto my-7 w-14 border-t border-slate-300 dark:border-slate-600 sm:my-8" />
}

function getSpeechRecognitionCtor(): WebSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as typeof window & {
    SpeechRecognition?: WebSpeechRecognitionCtor
    webkitSpeechRecognition?: WebSpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Browser speech-to-text (Chrome/Edge; limited elsewhere). Requires HTTPS or localhost. */
function Part2Dictation({ resetSignal }: { resetSignal: number }) {
  const supported = useMemo(() => getSpeechRecognitionCtor() !== null, [])
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accumulatedRef = useRef('')
  const recRef = useRef<WebSpeechRecognition | null>(null)
  const userWantsListenRef = useRef(false)

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

  const toggleListen = () => {
    if (listening) stopListening()
    else void startListening()
  }

  const clearText = () => {
    accumulatedRef.current = ''
    setText('')
    setError(null)
  }

  if (!supported) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
        Speech-to-text is not available in this browser. Try Chrome or Edge on HTTPS or localhost.
      </div>
    )
  }

  return (
    <div className="mt-10">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Dictate (English)
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <button
          type="button"
          onClick={toggleListen}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            listening
              ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500'
              : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-pressed={listening}
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
        <button
          type="button"
          onClick={clearText}
          disabled={!text}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Eraser className="size-4 shrink-0" aria-hidden />
          Clear
        </button>
      </div>
      {error ? <p className="mt-2 text-center text-sm text-rose-600 dark:text-rose-400 sm:text-left">{error}</p> : null}
      <label className="mt-3 block">
        <span className="sr-only">Transcript</span>
        <textarea
          value={text}
          onChange={(e) => {
            accumulatedRef.current = e.target.value
            setText(e.target.value)
          }}
          rows={4}
          placeholder="Tap Dictate and speak; your words appear here. You can edit the text."
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          spellCheck
        />
      </label>
    </div>
  )
}

export function AnkiCardDetailModal({
  card,
  cardIndex,
  deckOrdinal,
  totalCards,
  mediaUrls,
  onClose,
  onRemove,
}: AnkiCardDetailModalProps) {
  const cardLabelPosition = deckOrdinal ?? cardIndex + 1
  const [part, setPart] = useState<1 | 2>(1)
  const openPart2Ref = useRef<HTMLButtonElement>(null)
  const backToPart1Ref = useRef<HTMLButtonElement>(null)
  const part1WordTextRef = useRef<HTMLParagraphElement>(null)
  const definitionTextRef = useRef<HTMLParagraphElement>(null)
  const translationTextRef = useRef<HTMLParagraphElement>(null)
  const examplesTextRef = useRef<HTMLParagraphElement>(null)

  /** Part 1: first field line = word (media tags stripped for display). */
  const wordLine = useMemo(() => {
    const lines = card.front.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    return lines[0] ? stripMediaPlaceholders(lines[0]) : ''
  }, [card.front])

  /** Part 2: all other front lines + full back, without media embeds in text blocks. */
  const part2TextSource = useMemo(() => {
    const lines = card.front.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const tail = lines.slice(1).join('\n')
    return [tail, card.back].filter(Boolean).join('\n')
  }, [card.front, card.back])

  const part2Stripped = useMemo(() => stripMediaTagsKeepNewlines(part2TextSource), [part2TextSource])

  const { part2Ipa, part2BackParsed } = useMemo(() => {
    const lines = part2Stripped.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) {
      return { part2Ipa: '', part2BackParsed: parseBackDisplay('') }
    }
    const ipaIdx = lines.findIndex((l) => looksLikePhoneticLine(l))
    if (ipaIdx < 0) {
      return { part2Ipa: '', part2BackParsed: parseBackDisplay(part2Stripped) }
    }
    const ipa = lines[ipaIdx]
    const rest = lines.filter((_, i) => i !== ipaIdx)
    return { part2Ipa: ipa, part2BackParsed: parseBackDisplay(rest.join('\n')) }
  }, [part2Stripped])

  const combinedNote = useMemo(() => `${card.front}\n${card.back}`, [card.front, card.back])
  const embedsOrdered = useMemo(() => extractMediaEmbedsInOrder(combinedNote), [combinedNote])
  const soundFiles = useMemo(
    () => embedsOrdered.filter((e) => e.kind === 'sound').map((e) => e.filename),
    [embedsOrdered],
  )
  const imageFiles = useMemo(
    () => embedsOrdered.filter((e) => e.kind === 'img').map((e) => e.filename),
    [embedsOrdered],
  )

  const wordAudio = soundFiles[0]
  const definitionAudio = soundFiles[1]
  const exampleAudios = soundFiles.slice(2)
  const wordPicture = imageFiles[0]
  const extraPictures = imageFiles.slice(1)

  const hasAnyMedia = hasMediaEmbeds(card.front) || hasMediaEmbeds(card.back)
  const part1HasContent = Boolean(wordLine || wordAudio || wordPicture)
  const part2HasContent = Boolean(
    part2Ipa ||
      part2BackParsed.definition ||
      part2BackParsed.translation ||
      part2BackParsed.examples ||
      definitionAudio ||
      exampleAudios.length > 0 ||
      extraPictures.length > 0,
  )
  useEffect(() => {
    setPart(1)
  }, [cardIndex, card.front, card.back])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (part === 1) openPart2Ref.current?.focus()
    else backToPart1Ref.current?.focus()
  }, [part])

  const titleId = part === 1 ? 'anki-modal-1-title' : 'anki-modal-2-title'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={ankiModalPanelStyle()}
        className="relative flex w-full flex-col rounded-t-2xl border border-slate-200 bg-white text-base shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Card {cardLabelPosition} of {totalCards} · Part {part} of 2
            </p>
            <h3 id={titleId} className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {listTitle(card.front)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="size-6" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {part === 1 ? (
            <section aria-label="Word and media">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-9 sm:py-10">
                {wordLine ? (
                  <>
                    <p
                      ref={part1WordTextRef}
                      className="select-text text-center text-[1.65rem] font-semibold leading-tight tracking-tight text-indigo-600 dark:text-indigo-400 sm:text-[2.05rem]"
                    >
                      {wordLine}
                    </p>
                    <div className="mt-4 flex justify-center">
                      <SpeakTextButton
                        text={wordLine}
                        resetSignal={cardIndex}
                        selectionScopeRef={part1WordTextRef}
                      />
                    </div>
                  </>
                ) : null}
                {wordLine && (wordAudio || wordPicture) ? <PreviewDivider show /> : null}
                {wordAudio || wordPicture ? (
                  <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
                    {wordAudio ? <DeckAudio filename={wordAudio} mediaUrls={mediaUrls} /> : null}
                    {wordPicture ? <DeckImage filename={wordPicture} mediaUrls={mediaUrls} /> : null}
                  </div>
                ) : null}
                {!part1HasContent && !hasAnyMedia ? (
                  <p className="mt-4 text-center text-slate-500 dark:text-slate-400">(Nothing to show)</p>
                ) : null}
              </div>
            </section>
          ) : (
            <section aria-label="Definition and example">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-9 sm:py-10">
                {part2Ipa ? (
                  <p className="text-center font-mono text-[1.1rem] font-medium leading-snug text-sky-600 dark:text-sky-400 sm:text-[1.25rem]">
                    {part2Ipa}
                  </p>
                ) : null}

                <PreviewDivider
                  show={Boolean(
                    part2Ipa &&
                      (part2BackParsed.definition ||
                        part2BackParsed.translation ||
                        part2BackParsed.examples ||
                        definitionAudio ||
                        exampleAudios.length > 0),
                  )}
                />

                {part2BackParsed.definition || definitionAudio ? (
                  <div className="mt-4 text-left">
                    {part2BackParsed.definition ? (
                      <>
                        <p
                          ref={definitionTextRef}
                          className="select-text text-[1.2rem] font-medium leading-snug text-emerald-700 dark:text-emerald-400 sm:text-[1.4rem]"
                        >
                          {part2BackParsed.definition}
                        </p>
                        <div className="mt-3 flex justify-center sm:justify-start">
                          <SpeakTextButton
                            text={part2BackParsed.definition}
                            resetSignal={cardIndex}
                            selectionScopeRef={definitionTextRef}
                          />
                        </div>
                      </>
                    ) : null}
                    {definitionAudio ? (
                      <div className="mt-5 flex justify-center sm:justify-start">
                        <DeckAudio filename={definitionAudio} mediaUrls={mediaUrls} />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {part2BackParsed.translation ? (
                  <div className="mt-8 text-left">
                    <p
                      ref={translationTextRef}
                      className="select-text text-[1.05rem] italic leading-relaxed text-sky-700 dark:text-sky-300 sm:text-[1.15rem]"
                    >
                      {part2BackParsed.translation}
                    </p>
                    <div className="mt-3 flex justify-center sm:justify-start">
                      <SpeakTextButton
                        text={part2BackParsed.translation}
                        resetSignal={cardIndex}
                        selectionScopeRef={translationTextRef}
                      />
                    </div>
                  </div>
                ) : null}

                {part2BackParsed.examples || exampleAudios.length > 0 || extraPictures.length > 0 ? (
                  <div className="mt-8 text-left">
                    {part2BackParsed.examples ? (
                      <>
                        <p
                          ref={examplesTextRef}
                          className="select-text whitespace-pre-wrap text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[1.05rem]"
                        >
                          {part2BackParsed.examples}
                        </p>
                        <div className="mt-3 flex justify-center sm:justify-start">
                          <SpeakTextButton
                            text={part2BackParsed.examples}
                            resetSignal={cardIndex}
                            selectionScopeRef={examplesTextRef}
                          />
                        </div>
                      </>
                    ) : null}
                    {exampleAudios.length > 0 ? (
                      <div className="mt-5 flex flex-col items-center gap-5 sm:items-start">
                        {exampleAudios.map((fn, i) => (
                          <DeckAudio key={`ex-audio-${i}-${fn}`} filename={fn} mediaUrls={mediaUrls} />
                        ))}
                      </div>
                    ) : null}
                    {extraPictures.length > 0 ? (
                      <div className="mt-6 flex flex-col gap-6">
                        {extraPictures.map((fn, i) => (
                          <DeckImage key={`ex-img-${i}-${fn}`} filename={fn} mediaUrls={mediaUrls} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {!part2HasContent ? (
                  <p className="text-center text-slate-500 dark:text-slate-400">(No extra fields)</p>
                ) : null}
                <Part2Dictation resetSignal={cardIndex} />
              </div>
            </section>
          )}
        </div>

        <footer
          className={`flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-7 ${part === 1 ? 'justify-end' : 'justify-between'}`}
        >
          {part === 2 ? (
            <button
              ref={backToPart1Ref}
              type="button"
              onClick={() => setPart(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="size-5" aria-hidden />
              Part 1
            </button>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {part === 1 ? (
              <button
                ref={openPart2Ref}
                type="button"
                onClick={() => setPart(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-indigo-500"
              >
                Part 2 — Details
                <ArrowRight className="size-5" aria-hidden />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onRemove()}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-base font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
                >
                  <Trash2 className="size-5" aria-hidden />
                  Remove
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Close
                </button>
              </>
            )}
            {part === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}

export { listTitle }
