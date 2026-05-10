import { useEffect } from 'react'
import { ExternalLink, Settings, X } from 'lucide-react'
import { getApiSwaggerUrl, shouldShowIosDevSwaggerLink } from '../api/apiOrigin'
import { TtsSettingsPanel } from './TtsSettingsPanel'

type SettingsDialogProps = {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
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
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-settings-title"
        className="relative z-[101] w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Settings className="size-5" aria-hidden />
            </span>
            <h2 id="app-settings-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Settings
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
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Audio and read-aloud options for study cards.</p>
        {shouldShowIosDevSwaggerLink() ? (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 dark:border-indigo-900/60 dark:bg-indigo-950/40">
            <p className="text-sm font-medium text-indigo-950 dark:text-indigo-100">API (dev, same Wi‑Fi)</p>
            <p className="mt-1 text-xs text-indigo-900/85 dark:text-indigo-200/90">
              Open Swagger on this device using the same address as this page (not localhost).
            </p>
            <a
              href={getApiSwaggerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
            >
              Open API Swagger
              <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
            </a>
          </div>
        ) : null}
        <div className="mt-4">
          <TtsSettingsPanel />
        </div>
      </div>
    </div>
  )
}

export function SettingsMenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      aria-haspopup="dialog"
      aria-expanded={open}
    >
      <Settings className="size-4 shrink-0" aria-hidden />
      Settings
    </button>
  )
}
