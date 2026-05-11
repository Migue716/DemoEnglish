import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Disc3, Eraser, Loader2, MessageSquare, Mic, Sparkles, Square, Trash2 } from 'lucide-react'
import { fetchInterviewSummary, InterviewSummaryError } from '../api/interviewCoachClient'
import { browserAudioRecordingSupported, useBrowserAudioRecorder } from '../lib/useBrowserAudioRecorder'
import { useLiveEnglishDictation } from '../lib/useLiveEnglishDictation'
import { MicPermissionModal } from './MicPermissionModal'

type InterviewPracticeScreenProps = {
  onClose: () => void
}

type TabId = 'transcript' | 'summary'

export function InterviewPracticeMenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <MessageSquare className="size-4 shrink-0" aria-hidden />
      Interview
    </button>
  )
}

const MIN_SUMMARY_CHARS = 25

function formatElapsed(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Internal interview practice: live English dictation (Web Speech), optional browser audio clip, and AI summary via API + OpenAI.
 */
export function InterviewPracticeScreen({ onClose }: InterviewPracticeScreenProps) {
  const [tab, setTab] = useState<TabId>('transcript')
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const {
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
  } = useLiveEnglishDictation()

  const canRecordAudio = browserAudioRecordingSupported()
  const {
    recording,
    audioUrl,
    recordError,
    elapsedSec,
    startRecording,
    stopRecording,
    clearRecording,
  } = useBrowserAudioRecorder()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (micGateOpen) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, micGateOpen])

  const runSummary = useCallback(async () => {
    const trimmed = text.trim()
    if (trimmed.length < MIN_SUMMARY_CHARS) {
      setSummaryError(`Add at least ${MIN_SUMMARY_CHARS} characters in the transcript (dictate or type).`)
      setTab('transcript')
      return
    }
    setSummaryError(null)
    setSummaryLoading(true)
    try {
      const next = await fetchInterviewSummary(trimmed)
      setSummary(next)
      setTab('summary')
    } catch (e) {
      const message =
        e instanceof InterviewSummaryError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Could not generate summary.'
      setSummaryError(message)
    } finally {
      setSummaryLoading(false)
    }
  }, [text])

  const tabBtn =
    'rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40'

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-practice-title"
    >
      <header className="shrink-0 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <MessageSquare className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 id="interview-practice-title" className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                Interview practice
              </h1>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Dictation, optional audio clip, AI summary (OpenAI key on API)
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <button
            type="button"
            className={`${tabBtn} ${tab === 'transcript' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            onClick={() => setTab('transcript')}
          >
            Transcript
          </button>
          <button
            type="button"
            className={`${tabBtn} ${tab === 'summary' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            onClick={() => setTab('summary')}
          >
            AI summary
          </button>
        </div>

        {tab === 'transcript' ? (
          <section className="flex flex-col gap-4">
            {!supported ? (
              <div
                role="note"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
              >
                {unsupportedHint}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {supported ? (
                <button
                  type="button"
                  onClick={toggleListen}
                  disabled={recording}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-45 ${
                    listening
                      ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500'
                      : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                  }`}
                  aria-pressed={listening}
                  title={recording ? 'Stop the audio recording before dictating.' : undefined}
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
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Eraser className="size-4 shrink-0" aria-hidden />
                Clear
              </button>
              <button
                type="button"
                onClick={() => void runSummary()}
                disabled={summaryLoading || text.trim().length < MIN_SUMMARY_CHARS}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-50"
              >
                {summaryLoading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4 shrink-0" aria-hidden />
                )}
                {summaryLoading ? 'Generating…' : 'AI summary'}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Practice audio
                </span>
                {recording ? (
                  <span className="font-mono text-sm tabular-nums text-rose-600 dark:text-rose-400" aria-live="polite">
                    {formatElapsed(elapsedSec)}
                  </span>
                ) : null}
              </div>
              {!canRecordAudio ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Audio recording is not available in this browser (needs MediaRecorder and microphone access).
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {recording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-500"
                      >
                        <Square className="size-4 shrink-0 fill-current" aria-hidden />
                        Stop recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          stopListening()
                          void startRecording()
                        }}
                        disabled={listening}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-45 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        title={listening ? 'Stop dictation before recording audio.' : undefined}
                      >
                        <Disc3 className="size-4 shrink-0" aria-hidden />
                        Record audio
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearRecording}
                      disabled={!audioUrl || recording}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="size-4 shrink-0" aria-hidden />
                      Discard clip
                    </button>
                  </div>
                  {recordError ? (
                    <p className="mt-2 text-sm text-rose-600 dark:text-rose-400" role="alert">
                      {recordError}
                    </p>
                  ) : null}
                  {audioUrl ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-950">
                      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Playback</p>
                      <audio className="w-full" controls src={audioUrl} preload="metadata" />
                    </div>
                  ) : !recording ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Record your answer, then play it back. The file stays in this tab only until you discard it or close
                      the page.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Speak your answer. Tap Stop when you are done.
                    </p>
                  )}
                </>
              )}
            </div>

            {error ? (
              <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
                {error}
              </p>
            ) : null}
            {summaryError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100" role="alert">
                {summaryError}
              </p>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Transcript
              </span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder={
                  supported
                    ? 'Tap Dictate and answer as if you were in an interview, or type here. Then use AI summary for feedback.'
                    : 'Type your practice answer here. On mobile you can use the keyboard microphone if available.'
                }
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                spellCheck
              />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dictation and the audio clip stay in your browser. Only transcript text is sent to your API when you request
              an AI summary.
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void runSummary()}
                disabled={summaryLoading || text.trim().length < MIN_SUMMARY_CHARS}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-50"
              >
                {summaryLoading ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4 shrink-0" aria-hidden />
                )}
                {summaryLoading ? 'Regenerating…' : summary ? 'Regenerate' : 'Generate from transcript'}
              </button>
              <button
                type="button"
                onClick={() => setTab('transcript')}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Edit transcript
              </button>
            </div>
            {text.trim().length < MIN_SUMMARY_CHARS ? (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Transcript needs at least {MIN_SUMMARY_CHARS} characters. Switch to Transcript and dictate or type more.
              </p>
            ) : null}
            {summaryError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100" role="alert">
                {summaryError}
              </p>
            ) : null}
            <div className="min-h-[12rem] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
              {summary ? (
                <p className="whitespace-pre-wrap">{summary}</p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  No summary yet. Use &quot;Generate from transcript&quot; (requires <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">OpenAI:ApiKey</code> on the
                  API).
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {supported ? (
        <MicPermissionModal
          open={micGateOpen}
          onClose={closeMicGate}
          onConfirm={handleMicGateConfirm}
          loading={micGateLoading}
          error={micGateError}
          spacious
        />
      ) : null}
    </div>
  )
}
