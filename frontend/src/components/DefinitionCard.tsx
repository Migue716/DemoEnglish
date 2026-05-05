import { BookText, Layers, Music, Volume2 } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { buildSongSearchLinks } from '../lib/externalSongLinks'
import { SpeakTextButton } from './SpeakTextButton'
import type { WordDefinitionDto } from '../types/dictionary'

type DefinitionCardProps = {
  definition: WordDefinitionDto
  onAddToAnki?: (definition: WordDefinitionDto) => void
}

export function DefinitionCard({ definition, onAddToAnki }: DefinitionCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const definitionTextRef = useRef<HTMLParagraphElement>(null)
  const readAloudKey = useMemo(
    () => `${definition.word}\n${definition.primaryDefinition}`,
    [definition.word, definition.primaryDefinition],
  )

  const songLinks = useMemo(() => buildSongSearchLinks(definition.word), [definition.word])

  const playAudio = () => {
    const el = audioRef.current
    if (!el || !definition.audioUrl) return
    void el.play().catch(() => {
      /* autoplay policies — user already clicked */
    })
  }

  return (
    <article className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <BookText className="size-5 shrink-0" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">Result</span>
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {definition.word}
          </h2>
          {definition.phoneticText ? (
            <p className="mt-2 font-mono text-[1.75rem] leading-snug tracking-wide text-slate-600 dark:text-slate-300">
              {definition.phoneticText}
            </p>
          ) : (
            <p className="mt-2 text-[1.75rem] leading-snug text-slate-400">
              No phonetic transcription available.
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {definition.audioUrl ? (
            <>
              <audio ref={audioRef} src={definition.audioUrl} preload="none" className="hidden" />
              <button
                type="button"
                onClick={playAudio}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-label="Play pronunciation"
              >
                <Volume2 className="size-4" aria-hidden />
                Play
              </button>
            </>
          ) : (
            <span className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-600">
              No audio
            </span>
          )}
        </div>
      </header>
      <div className="pt-4">
        {definition.partOfSpeech ? (
          <p className="mb-2 inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
            {definition.partOfSpeech}
          </p>
        ) : null}
        <div className="rounded-xl bg-sky-500/[0.12] px-3 py-3 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:ring-sky-400/25">
          <p
            ref={definitionTextRef}
            className="select-text text-base leading-relaxed text-slate-700 dark:text-slate-200"
          >
            {definition.primaryDefinition}
          </p>
          <div className="mt-3 flex justify-start">
            <SpeakTextButton
              text={definition.primaryDefinition}
              resetSignal={readAloudKey}
              selectionScopeRef={definitionTextRef}
            />
          </div>
        </div>
        {songLinks.length > 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <Music className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span className="font-medium text-slate-700 dark:text-slate-300">Songs (external)</span>
              <span className="text-slate-400 dark:text-slate-500">—</span>
              <span className="sr-only">Opens YouTube, Spotify, or Genius in a new tab.</span>
              {songLinks.map((link, i) => (
                <span key={link.label} className="inline-flex items-center gap-1">
                  {i > 0 ? <span className="text-slate-300 dark:text-slate-600">·</span> : null}
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-700 underline decoration-violet-400/70 underline-offset-2 transition hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
                  >
                    {link.label}
                  </a>
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[0.7rem] leading-snug text-slate-500 dark:text-slate-500">
              Search-only links; playback stays on those sites. Results are not filtered by lyrics.
            </p>
          </div>
        ) : null}
        {onAddToAnki ? (
          <button
            type="button"
            onClick={() => onAddToAnki(definition)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-100 dark:hover:bg-indigo-900/60"
          >
            <Layers className="size-4" aria-hidden />
            Add to Anki list
          </button>
        ) : null}
      </div>
    </article>
  )
}
