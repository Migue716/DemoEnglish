import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronRight, RotateCcw } from 'lucide-react'
import {
  verbTenseDrills,
  verbTenseTopicLabels,
  type VerbTenseDrill,
  type VerbTenseTopic,
} from '../data/verbTenseDrills'

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const TOPIC_OPTIONS: (VerbTenseTopic | 'all')[] = [
  'all',
  'present',
  'past',
  'perfect',
  'future',
  'modals',
  'conditionals',
  'passive',
  'gerund',
]

type VerbTensePracticeProps = {
  /** Inside modal: no outer card frame (dialog provides chrome). */
  embedded?: boolean
}

export function VerbTensePractice({ embedded = false }: VerbTensePracticeProps = {}) {
  const [topic, setTopic] = useState<VerbTenseTopic | 'all'>('all')
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)

  const pool = useMemo(() => {
    if (topic === 'all') return verbTenseDrills
    return verbTenseDrills.filter((d) => d.topic === topic)
  }, [topic])

  const drill: VerbTenseDrill | undefined = pool.length ? pool[index % pool.length] : undefined

  const choices = useMemo(() => {
    if (!drill) return []
    return shuffle([drill.correct, ...drill.distractors])
  }, [drill?.id])

  useEffect(() => {
    setIndex(0)
    setPicked(null)
  }, [topic])

  useEffect(() => {
    setPicked(null)
  }, [drill?.id])

  const goNext = () => {
    if (pool.length === 0) return
    setIndex((i) => (i + 1) % pool.length)
  }

  const correct = picked !== null && drill && picked === drill.correct

  return (
    <section
      className={
        embedded
          ? 'w-full'
          : 'w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900'
      }
      aria-labelledby="verb-tense-heading"
    >
      <div
        className={`flex flex-col gap-2 sm:flex-row ${embedded ? 'sm:items-center sm:justify-end' : 'sm:items-start sm:justify-between'}`}
      >
        {embedded ? (
          <span id="verb-tense-heading" className="sr-only">
            Verb tense exercises
          </span>
        ) : (
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <BookOpen className="size-5 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
            <h2 id="verb-tense-heading" className="text-lg font-semibold tracking-tight">
              Verb tense practice
            </h2>
          </div>
        )}
        <label className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400 sm:items-end">
          <span className="sr-only">Topic filter</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value as VerbTenseTopic | 'all')}
            className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          >
            {TOPIC_OPTIONS.map((id) => (
              <option key={id} value={id}>
                {verbTenseTopicLabels[id]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Choose the word or phrase that fits the gap. Great for interviews and daily stand-ups.
      </p>

      {!drill ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">No exercises for this filter.</p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-medium text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
              {drill.tenseLabel}
            </span>
            <span>
              {index + 1} / {pool.length}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 dark:bg-slate-950/80">
            <PromptWithGap prompt={drill.prompt} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Answer choices">
            {choices.map((choice) => {
              const showResult = picked !== null
              const isSel = picked === choice
              const isCorrectChoice = choice === drill.correct
              let cls =
                'rounded-xl border px-4 py-3 text-left text-sm font-medium transition dark:border-slate-600'
              if (!showResult) {
                cls +=
                  ' border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:bg-teal-50/80 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-teal-700 dark:hover:bg-teal-950/40'
              } else if (isCorrectChoice) {
                cls += ' border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100'
              } else if (isSel && !isCorrectChoice) {
                cls += ' border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
              } else {
                cls += ' border-slate-200 bg-slate-50 text-slate-500 opacity-80 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={showResult}
                  onClick={() => !showResult && setPicked(choice)}
                  className={cls}
                >
                  {choice}
                </button>
              )
            })}
          </div>

          {picked !== null ? (
            <div className="mt-4 space-y-3">
              <p
                role="status"
                className={`text-sm font-medium ${correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
              >
                {correct ? 'Correct.' : `Not quite — the answer is "${drill.correct}".`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

function PromptWithGap({ prompt }: { prompt: string }) {
  const parts = prompt.split('___')
  if (parts.length === 1) {
    return <p className="text-base leading-relaxed text-slate-800 dark:text-slate-100">{prompt}</p>
  }
  return (
    <p className="text-base leading-relaxed text-slate-800 dark:text-slate-100">
      {parts.map((segment, i) => (
        <span key={`slot-${i}-${segment.length}`}>
          {segment}
          {i < parts.length - 1 ? (
            <span className="mx-1 inline-block min-w-[5rem] border-b-2 border-dashed border-teal-500/80 pb-0.5 text-center font-medium text-teal-700 dark:border-teal-400 dark:text-teal-300">
              …
            </span>
          ) : null}
        </span>
      ))}
    </p>
  )
}
