import { useEffect, useRef } from 'react'
import { Mic, X } from 'lucide-react'

const STORAGE_KEY = 'demoenglish.micPermissionPrimed'

export function readMicPrimedFromSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeMicPrimedToSession(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode / quota */
  }
}

type MicPermissionModalProps = {
  open: boolean
  onClose: () => void
  /** Request mic permission, then start dictation (caller closes modal on success). */
  onConfirm: () => void | Promise<void>
  loading: boolean
  error: string | null
  spacious?: boolean
}

/**
 * Step before Web Speech dictation: explains microphone use and runs getUserMedia so the
 * browser shows its native permission prompt after the user taps Continue.
 */
export function MicPermissionModal({
  open,
  onClose,
  onConfirm,
  loading,
  error,
  spacious = false,
}: MicPermissionModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => confirmRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const p = spacious ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'
  const title = spacious ? 'text-xl font-semibold' : 'text-lg font-semibold'

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/65 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mic-perm-title"
        aria-describedby="mic-perm-desc"
        className="relative z-[201] w-full max-w-md rounded-2xl border-2 border-slate-800 bg-white p-5 text-slate-900 shadow-2xl dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Mic className="size-6" aria-hidden />
            </span>
            <h2 id="mic-perm-title" className={title}>
              Permiso del micrófono
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Cerrar"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p id="mic-perm-desc" className={`mt-4 text-slate-700 dark:text-slate-300 ${p}`}>
          Para dictar en esta página, el navegador necesita acceso al micrófono. Al pulsar{' '}
          <strong>Continuar y permitir</strong>, aparecerá el cuadro del sistema para que aceptes o rechaces el permiso.
          Solo se usa el audio para convertir tu voz en texto; no lo guardamos en ningún servidor.
        </p>
        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => void onConfirm()}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? 'Solicitando permiso…' : 'Continuar y permitir'}
          </button>
        </div>
      </div>
    </div>
  )
}
