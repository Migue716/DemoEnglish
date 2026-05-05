import { useEffect, useState } from 'react'
import { ListTree, X } from 'lucide-react'
import { commonVerbsPrincipalParts } from '../data/commonVerbsEnglish'
import { irregularVerbsEnglish } from '../data/irregularVerbsEnglish'

type VerbListsDialogProps = {
  open: boolean
  onClose: () => void
}

type TabId = 'common' | 'irregular'

export function VerbListsDialog({ open, onClose }: VerbListsDialogProps) {
  const [tab, setTab] = useState<TabId>('common')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) setTab('common')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
        aria-label="Close verb lists"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verb-lists-dialog-title"
        className="relative z-[101] flex max-h-[min(92dvh,56rem)] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              <ListTree className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="verb-lists-dialog-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Verb lists
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                High-frequency forms · irregular principal parts (reference only).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 self-end rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 sm:self-start dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-4 dark:border-slate-800 sm:px-6">
          <div className="flex gap-1" role="tablist" aria-label="List type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'common'}
              onClick={() => setTab('common')}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                tab === 'common'
                  ? 'border-b-2 border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Common verbs
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'irregular'}
              onClick={() => setTab('irregular')}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                tab === 'irregular'
                  ? 'border-b-2 border-violet-600 text-violet-700 dark:border-violet-400 dark:text-violet-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Irregular verbs
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {tab === 'common' ? (
            <section aria-labelledby="common-verbs-heading">
              <h3 id="common-verbs-heading" className="sr-only">
                Common verbs and principal parts
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Forms used for present simple, past simple, perfect tenses, passives, etc. For{' '}
                <strong className="font-medium text-slate-800 dark:text-slate-200">continuous</strong> tenses, combine{' '}
                <em className="not-italic font-mono text-[0.85em]">be</em> +{' '}
                <strong>-ing</strong> (e.g. <span className="font-mono text-[0.85em]">is going</span>,{' '}
                <span className="font-mono text-[0.85em]">was fixing</span>).
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/80">
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        Base
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        3rd person
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        Past
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        Past participle
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        -ing
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {commonVerbsPrincipalParts.map((row) => (
                      <tr key={row.base} className="text-slate-700 dark:text-slate-300">
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-violet-800 dark:text-violet-300">{row.base}</td>
                        <td className="px-3 py-2 font-mono text-[0.8rem]">{row.sg3}</td>
                        <td className="px-3 py-2 font-mono text-[0.8rem]">{row.past}</td>
                        <td className="px-3 py-2 font-mono text-[0.8rem]">{row.participle}</td>
                        <td className="px-3 py-2 font-mono text-[0.8rem]">{row.ing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section aria-labelledby="irregular-verbs-heading">
              <h3 id="irregular-verbs-heading" className="sr-only">
                Irregular verbs
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Verbs where past / participle are not regular <span className="font-mono text-[0.85em]">-ed</span>. Variants
                (e.g. US/UK) shown when common.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/80">
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        Infinitive
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        Simple past
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                        Past participle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {irregularVerbsEnglish.map((row) => (
                      <tr key={row.base} className="text-slate-700 dark:text-slate-300">
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-violet-800 dark:text-violet-300">{row.base}</td>
                        <td className="px-3 py-2 font-mono text-[0.8rem]">{row.past}</td>
                        <td className="px-3 py-2 font-mono text-[0.8rem]">{row.participle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export function VerbListsMenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <ListTree className="size-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      Verb lists
    </button>
  )
}
