import { useEffect, useMemo, useState, type RefObject } from 'react'
import { Music } from 'lucide-react'
import { buildSongSearchLinks } from '../lib/externalSongLinks'

type SongLinksFromSelectionProps = {
  selectionScopeRef: RefObject<HTMLElement | null>
  /** Same as SpeakTextButton — clears highlight when the card changes. */
  resetSignal: number | string
  /** Layout alignment for the link row */
  align?: 'center' | 'start'
}

/** Shows YouTube / Spotify / Genius links for the current text selection inside `selectionScopeRef` (same behavior as “Read selection”). */
export function SongLinksFromSelection({
  selectionScopeRef,
  resetSignal,
  align = 'center',
}: SongLinksFromSelectionProps) {
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    setSelectedText('')
  }, [resetSignal])

  useEffect(() => {
    const updateSelection = () => {
      const scope = selectionScopeRef.current
      if (!scope) return
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        setSelectedText('')
        return
      }
      const anchor = sel.anchorNode
      const focus = sel.focusNode
      const inScope = Boolean(
        anchor &&
          focus &&
          (scope.contains(anchor.nodeType === Node.TEXT_NODE ? anchor.parentNode : anchor) ||
            scope.contains(focus.nodeType === Node.TEXT_NODE ? focus.parentNode : focus)),
      )
      if (!inScope) {
        setSelectedText('')
        return
      }
      setSelectedText(sel.toString().trim())
    }
    document.addEventListener('selectionchange', updateSelection)
    return () => document.removeEventListener('selectionchange', updateSelection)
  }, [selectionScopeRef])

  const links = useMemo(() => {
    if (!selectedText || !/[a-zA-Z]/.test(selectedText)) return []
    return buildSongSearchLinks(selectedText)
  }, [selectedText])

  if (links.length === 0) return null

  const wrapCls =
    align === 'center'
      ? 'flex flex-wrap items-center justify-center gap-x-2 gap-y-1'
      : 'flex flex-wrap items-center justify-start gap-x-2 gap-y-1'

  return (
    <div className={`${wrapCls} text-[0.7rem] text-slate-600 dark:text-slate-400`} role="region" aria-label="Song search for selected text">
      <Music className="size-3 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      <span className="font-medium text-slate-700 dark:text-slate-300">Songs</span>
      {links.map((link, i) => (
        <span key={link.label} className="inline-flex items-center gap-1">
          {i > 0 ? <span className="text-slate-300 dark:text-slate-600">·</span> : null}
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-700 underline decoration-violet-400/70 underline-offset-2 hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
          >
            {link.label}
          </a>
        </span>
      ))}
    </div>
  )
}
