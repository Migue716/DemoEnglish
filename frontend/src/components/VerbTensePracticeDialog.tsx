import { useEffect } from 'react'
import { BookOpen, X } from 'lucide-react'
import { VerbTensePractice } from './VerbTensePractice'

type VerbTensePracticeDialogProps = {
  open: boolean
  onClose: () => void
}

export function VerbTensePracticeDialog({ open, onClose }: VerbTensePracticeDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
        aria-label="Close verb practice"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verb-practice-dialog-title"
        className="relative z-[101] flex max-h-[min(90dvh,52rem)] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <BookOpen className="size-5" aria-hidden />
            </span>
            <h2
              id="verb-practice-dialog-title"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50"
            >
              Verb tense practice
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <VerbTensePractice embedded />
        </div>
      </div>
    </div>
  )
}

export function VerbTenseMenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <BookOpen className="size-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
      Verb tenses
    </button>
  )
}
