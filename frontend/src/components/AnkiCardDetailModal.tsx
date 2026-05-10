import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, Trash2, X } from 'lucide-react'
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
import { Part2DictationPanel, type DictationReferenceParagraph } from './Part2DictationPanel'
import { SongLinksFromSelection } from './SongLinksFromSelection'
import { SpeakTextButton } from './SpeakTextButton'

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
  /** When set and `hasNextCard` is true, Part 2 footer shows a control to open the following card. */
  onNextCard?: () => void
  hasNextCard?: boolean
  /** When set and `hasPrevCard` is true, Part 2 footer shows a control to open the previous card (same deck order as the list). */
  onPrevCard?: () => void
  hasPrevCard?: boolean
}

function PreviewDivider({ show }: { show: boolean }) {
  if (!show) return null
  return <hr className="mx-auto my-7 w-14 border-t border-slate-300 dark:border-slate-600 sm:my-8" />
}

export function AnkiCardDetailModal({
  card,
  cardIndex,
  deckOrdinal,
  totalCards,
  mediaUrls,
  onClose,
  onRemove,
  onNextCard,
  hasNextCard = false,
  onPrevCard,
  hasPrevCard = false,
}: AnkiCardDetailModalProps) {
  const cardLabelPosition = deckOrdinal ?? cardIndex + 1
  const isInterview = card.kind === 'interview'
  const [part, setPart] = useState<1 | 2>(1)
  const openPart2Ref = useRef<HTMLButtonElement>(null)
  const backToPart1Ref = useRef<HTMLButtonElement>(null)
  const part1WordTextRef = useRef<HTMLParagraphElement>(null)
  const interviewAnswerTextRef = useRef<HTMLParagraphElement>(null)
  const definitionTextRef = useRef<HTMLParagraphElement>(null)
  const translationTextRef = useRef<HTMLParagraphElement>(null)
  const examplesTextRef = useRef<HTMLParagraphElement>(null)

  const interviewQuestionDisplay = useMemo(() => stripMediaTagsKeepNewlines(card.front), [card.front])
  const interviewAnswerDisplay = useMemo(() => stripMediaTagsKeepNewlines(card.back), [card.back])

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

  const dictationReferenceParagraphs = useMemo((): DictationReferenceParagraph[] => {
    if (isInterview) {
      const t = interviewAnswerDisplay.trim()
      return t ? [{ id: 'answer', label: 'Answer', text: interviewAnswerDisplay }] : []
    }
    const opts: DictationReferenceParagraph[] = []
    if (part2BackParsed.definition.trim()) {
      opts.push({ id: 'definition', label: 'Definition', text: part2BackParsed.definition })
    }
    if (part2BackParsed.translation.trim()) {
      opts.push({ id: 'translation', label: 'Translation', text: part2BackParsed.translation })
    }
    if (part2BackParsed.examples.trim()) {
      opts.push({ id: 'examples', label: 'Examples', text: part2BackParsed.examples })
    }
    return opts
  }, [
    isInterview,
    interviewAnswerDisplay,
    part2BackParsed.definition,
    part2BackParsed.translation,
    part2BackParsed.examples,
  ])

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
              {isInterview ? 'Interview prep · ' : ''}
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
            isInterview ? (
              <section aria-label="Interview question">
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-9 sm:py-10">
                  <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Question
                  </p>
                  {interviewQuestionDisplay.trim() ? (
                    <>
                      <p
                        ref={part1WordTextRef}
                        className="select-text whitespace-pre-wrap text-center text-[1.15rem] font-semibold leading-snug text-indigo-700 dark:text-indigo-300 sm:text-[1.35rem]"
                      >
                        {interviewQuestionDisplay}
                      </p>
                      <div className="mt-4 flex flex-col items-center gap-2 sm:items-start">
                        <SpeakTextButton
                          text={interviewQuestionDisplay}
                          resetSignal={cardIndex}
                          selectionScopeRef={part1WordTextRef}
                        />
                        <SongLinksFromSelection selectionScopeRef={part1WordTextRef} resetSignal={cardIndex} align="start" />
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400">(No question text)</p>
                  )}
                </div>
              </section>
            ) : (
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
                      <div className="mt-4 flex flex-col items-center gap-2 sm:items-start">
                        <SpeakTextButton
                          text={wordLine}
                          resetSignal={cardIndex}
                          selectionScopeRef={part1WordTextRef}
                        />
                        <SongLinksFromSelection selectionScopeRef={part1WordTextRef} resetSignal={cardIndex} align="start" />
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
            )
          ) : isInterview ? (
            <section aria-label="Interview answer">
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-8 dark:border-slate-800 dark:bg-slate-950 sm:px-9 sm:py-10">
                <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Answer / guide
                </p>
                {interviewAnswerDisplay.trim() ? (
                  <>
                    <p
                      ref={interviewAnswerTextRef}
                      className="select-text whitespace-pre-wrap text-[1.05rem] leading-relaxed text-emerald-800 dark:text-emerald-300 sm:text-[1.15rem]"
                    >
                      {interviewAnswerDisplay}
                    </p>
                    <div className="mt-4 flex flex-col items-center gap-2 sm:items-start">
                      <SpeakTextButton
                        text={interviewAnswerDisplay}
                        resetSignal={cardIndex}
                        selectionScopeRef={interviewAnswerTextRef}
                      />
                      <SongLinksFromSelection selectionScopeRef={interviewAnswerTextRef} resetSignal={cardIndex} align="start" />
                    </div>
                  </>
                ) : (
                  <p className="text-center text-slate-500 dark:text-slate-400">(No answer text)</p>
                )}
                <Part2DictationPanel resetSignal={cardIndex} referenceParagraphs={dictationReferenceParagraphs} />
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
                        <div className="mt-3 flex flex-col items-center gap-2 sm:items-start">
                          <SpeakTextButton
                            text={part2BackParsed.definition}
                            resetSignal={cardIndex}
                            selectionScopeRef={definitionTextRef}
                          />
                          <SongLinksFromSelection selectionScopeRef={definitionTextRef} resetSignal={cardIndex} align="start" />
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
                    <div className="mt-3 flex flex-col items-center gap-2 sm:items-start">
                      <SpeakTextButton
                        text={part2BackParsed.translation}
                        resetSignal={cardIndex}
                        selectionScopeRef={translationTextRef}
                      />
                      <SongLinksFromSelection selectionScopeRef={translationTextRef} resetSignal={cardIndex} align="start" />
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
                        <div className="mt-3 flex flex-col items-center gap-2 sm:items-start">
                          <SpeakTextButton
                            text={part2BackParsed.examples}
                            resetSignal={cardIndex}
                            selectionScopeRef={examplesTextRef}
                          />
                          <SongLinksFromSelection selectionScopeRef={examplesTextRef} resetSignal={cardIndex} align="start" />
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
                <Part2DictationPanel resetSignal={cardIndex} referenceParagraphs={dictationReferenceParagraphs} />
              </div>
            </section>
          )}
        </div>

        <footer
          className={`flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-7 ${part === 1 ? 'justify-end' : 'justify-between'}`}
        >
          {part === 2 ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                ref={backToPart1Ref}
                type="button"
                onClick={() => setPart(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="size-5" aria-hidden />
                Part 1
              </button>
              {hasPrevCard && onPrevCard ? (
                <button
                  type="button"
                  onClick={() => onPrevCard()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="size-5" aria-hidden />
                  Previous card
                </button>
              ) : null}
              {hasNextCard && onNextCard ? (
                <button
                  type="button"
                  onClick={() => onNextCard()}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-base font-medium text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-100 dark:hover:bg-indigo-900/60"
                >
                  Next card
                  <ArrowRight className="size-5" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {part === 1 ? (
              <button
                ref={openPart2Ref}
                type="button"
                onClick={() => setPart(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-indigo-500"
              >
                Part 2 — {isInterview ? 'Answer' : 'Details'}
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
