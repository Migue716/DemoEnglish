import { useCallback, useEffect, useRef, useState } from 'react'
import { Captions, ChevronDown, Loader2 } from 'lucide-react'
import {
  fetchYoutubeCaptionLines,
  type YoutubeCaptionLine,
} from '../lib/fetchYoutubeTranscript'
import { youtubeProxyFetch } from '../lib/youtubeProxyFetch'

/** srv3 uses ms; classic timedtext uses seconds — infer from duration scale. */
function offsetDisplayMs(line: YoutubeCaptionLine): number {
  return line.duration > 150 ? line.offset : line.offset * 1000
}

function formatTimestampMs(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; lines: YoutubeCaptionLine[] }
  | { status: 'error'; message: string }

type YoutubeTranscriptDisclosureProps = {
  videoId: string
  /** ISO language code for caption track (default English). */
  lang?: string
  className?: string
  /** Label on the toggle control. */
  summaryLabel?: string
}

export function YoutubeTranscriptDisclosure({
  videoId,
  lang = 'en',
  className = '',
  summaryLabel = 'Read captions',
}: YoutubeTranscriptDisclosureProps) {
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState<LoadState>({ status: 'idle' })
  const cacheRef = useRef<{ videoId: string; lines: YoutubeCaptionLine[] } | null>(null)

  useEffect(() => {
    cacheRef.current = null
    setState({ status: 'idle' })
    setExpanded(false)
  }, [videoId])

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const lines = await fetchYoutubeCaptionLines(videoId, {
        lang,
        fetch: youtubeProxyFetch,
      })
      cacheRef.current = { videoId, lines }
      setState({ status: 'ok', lines })
    } catch (e) {
      const msg =
        e instanceof Error && e.message ? e.message : 'Could not load captions.'
      setState({ status: 'error', message: msg })
    }
  }, [videoId, lang])

  const retry = () => {
    cacheRef.current = null
    void load()
  }

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    const hit = cacheRef.current
    if (hit?.videoId === videoId) {
      setState({ status: 'ok', lines: hit.lines })
      return
    }
    void load()
  }

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900/50 ${className}`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={toggle}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-300"
      >
        <Captions className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
        <span className="min-w-0 flex-1">{summaryLabel}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition dark:text-slate-500 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="border-t border-slate-200 px-3 pb-3 pt-2 dark:border-slate-700">
          {state.status === 'loading' ? (
            <p className="flex min-h-[4.5rem] items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              Loading captions…
            </p>
          ) : null}
          {state.status === 'error' ? (
            <div className="min-h-[4.5rem] space-y-2">
              <p className="text-sm text-red-700 dark:text-red-400">{state.message}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  retry()
                }}
                className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                Retry
              </button>
            </div>
          ) : null}
          {state.status === 'ok' ? (
            <ol className="max-h-72 list-none space-y-2 overflow-y-auto overflow-x-hidden py-1 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
              {state.lines.map((line, i) => (
                <li key={`${line.offset}-${i}`} className="flex gap-2">
                  <span className="w-11 shrink-0 font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
                    {formatTimestampMs(offsetDisplayMs(line))}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{line.text}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
