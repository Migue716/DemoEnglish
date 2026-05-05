import { useEffect } from 'react'
import { GraduationCap, X } from 'lucide-react'
import { MarkdownFormula, MarkdownLite } from './MarkdownLite'
import { verbTenseTheoryBlocks, verbTenseTheoryExtra } from '../data/verbTenseTheory'

type VerbTenseTheoryDialogProps = {
  open: boolean
  onClose: () => void
}

export function VerbTenseTheoryDialog({ open, onClose }: VerbTenseTheoryDialogProps) {
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
        aria-label="Close tense theory"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verb-theory-dialog-title"
        className="relative z-[101] flex max-h-[min(90dvh,52rem)] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div>
              <h2
                id="verb-theory-dialog-title"
                className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50"
              >
                Tense formulas
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Quick reference — not exhaustive.</p>
            </div>
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
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <ul className="space-y-5">
            {verbTenseTheoryBlocks.map((b) => (
              <li key={b.id} className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                  <MarkdownLite text={b.title} />
                </h3>
                <div className="mt-2">
                  <MarkdownFormula text={b.formula} />
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Use:</span>{' '}
                  <MarkdownLite text={b.usage} />
                </p>
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">e.g.</span> <MarkdownLite text={b.example} />
                </p>
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              More patterns
            </h3>
            {verbTenseTheoryExtra.map((x) => (
              <div key={x.title} className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                <h4 className="font-semibold text-amber-950 dark:text-amber-100">{x.title}</h4>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/95">
                  {x.body
                    .trim()
                    .split('\n')
                    .filter((line) => line.trim().length > 0)
                    .map((line, li) => (
                      <p key={li}>
                        <MarkdownLite text={line} />
                      </p>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TenseTheoryMenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <GraduationCap className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      Tense theory
    </button>
  )
}
