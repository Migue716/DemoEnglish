import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Download, FileUp, Layers, MessageSquare, Search, Trash2 } from 'lucide-react'
import { exportAnkiPlainText, importAnkiPlainText, sampleAnkiDownloadUrl } from '../api/ankiClient'
import { importInterviewCsvFromFile } from '../lib/interviewCsvImport'
import { extractApkgMediaUrls, revokeMediaUrls } from '../lib/apkgMedia'
import type { AnkiCard } from '../types/anki'
import { AnkiCardDetailModal, baseWordLabel } from './AnkiCardDetailModal'

type AnkiDeckPanelProps = {
  cards: AnkiCard[]
  onCardsChange: (cards: AnkiCard[]) => void
}

export function AnkiDeckPanel({ cards, onCardsChange }: AnkiDeckPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const interviewCsvInputRef = useRef<HTMLInputElement | null>(null)
  const mediaUrlsRef = useRef<Map<string, string>>(new Map())
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(() => new Map())
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [listSearch, setListSearch] = useState('')

  mediaUrlsRef.current = mediaUrls

  const { deckOrdinalByIndex, sortedDeckIndices } = useMemo(() => {
    const order = cards
      .map((c, i) => ({ i, label: baseWordLabel(c.front).toLowerCase() }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    const map = new Map<number, number>()
    order.forEach((x, pos) => map.set(x.i, pos + 1))
    return {
      deckOrdinalByIndex: map,
      sortedDeckIndices: order.map((x) => x.i),
    }
  }, [cards])

  const nextCardIndexInAzOrder = useMemo(() => {
    if (selectedIndex === null) return null
    const pos = sortedDeckIndices.indexOf(selectedIndex)
    if (pos < 0 || pos >= sortedDeckIndices.length - 1) return null
    return sortedDeckIndices[pos + 1]
  }, [selectedIndex, sortedDeckIndices])

  const prevCardIndexInAzOrder = useMemo(() => {
    if (selectedIndex === null) return null
    const pos = sortedDeckIndices.indexOf(selectedIndex)
    if (pos <= 0) return null
    return sortedDeckIndices[pos - 1]
  }, [selectedIndex, sortedDeckIndices])

  const goToNextCardInAzOrder = useCallback(() => {
    if (nextCardIndexInAzOrder === null) return
    setSelectedIndex(nextCardIndexInAzOrder)
  }, [nextCardIndexInAzOrder])

  const goToPrevCardInAzOrder = useCallback(() => {
    if (prevCardIndexInAzOrder === null) return
    setSelectedIndex(prevCardIndexInAzOrder)
  }, [prevCardIndexInAzOrder])

  const listRows = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    const indexed = cards.map((c, originalIndex) => ({ card: c, originalIndex }))
    const filtered = q
      ? indexed.filter(({ card }) => {
          const label = baseWordLabel(card.front).toLowerCase()
          return (
            label.includes(q) ||
            card.front.toLowerCase().includes(q) ||
            card.back.toLowerCase().includes(q)
          )
        })
      : indexed
    return [...filtered].sort((a, b) =>
      baseWordLabel(a.card.front).localeCompare(baseWordLabel(b.card.front), undefined, {
        sensitivity: 'base',
      }),
    )
  }, [cards, listSearch])

  useEffect(
    () => () => {
      revokeMediaUrls(mediaUrlsRef.current)
      mediaUrlsRef.current = new Map()
    },
    [],
  )

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= cards.length) setSelectedIndex(null)
  }, [cards.length, selectedIndex])

  useEffect(() => {
    if (selectedIndex === null) return
    const c = cards[selectedIndex]
    if (!c) {
      setSelectedIndex(null)
      return
    }
    const q = listSearch.trim().toLowerCase()
    if (!q) return
    const label = baseWordLabel(c.front).toLowerCase()
    const match =
      label.includes(q) || c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    if (!match) setSelectedIndex(null)
  }, [listSearch, selectedIndex, cards])

  const applyImportFromFile = useCallback(
    async (file: File, mode: 'append' | 'replace'): Promise<string> => {
      const result = await importAnkiPlainText(file)
      const mapped: AnkiCard[] = result.cards.map((c) => ({
        front: c.front,
        back: c.back,
        sourceLine: c.sourceLine,
      }))
      onCardsChange(mode === 'replace' ? mapped : [...cards, ...mapped])

      const isApkg = file.name.toLowerCase().endsWith('.apkg')
      if (mode === 'replace') {
        setMediaUrls((prev) => {
          revokeMediaUrls(prev)
          return new Map()
        })
      }
      if (isApkg) {
        const extracted = await extractApkgMediaUrls(file)
        setMediaUrls((prev) => {
          const next = mode === 'replace' ? new Map<string, string>() : new Map(prev)
          for (const [name, url] of extracted) {
            const old = next.get(name)
            if (old) URL.revokeObjectURL(old)
            next.set(name, url)
          }
          return next
        })
      }

      return result.warnings.length
        ? `Imported ${mapped.length} card(s). ${result.warnings.join(' ')}`
        : `Imported ${mapped.length} card(s).`
    },
    [cards, onCardsChange],
  )

  const preloadApkgUrl = import.meta.env.VITE_PRELOAD_APKG_URL?.trim()
  const preloadRan = useRef(false)

  useEffect(() => {
    if (!preloadApkgUrl || preloadRan.current) return
    preloadRan.current = true
    void (async () => {
      // Do not toggle `busy` here — preload can take a long time on Wi‑Fi/phone and would
      // block manual Anki import/export until it finishes or fails.
      setMessage(null)
      try {
        const res = await fetch(preloadApkgUrl)
        if (!res.ok) {
          throw new Error(
            `Preload failed (${res.status}). Check DEMOENGLISH_PRELOAD_APKG_PATH and that you use vite dev/preview.`,
          )
        }
        const blob = await res.blob()
        const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
        const looksZip = blob.size >= 22 && head[0] === 0x50 && head[1] === 0x4b
        if (!looksZip) {
          const preview =
            blob.size > 0 && blob.size < 4000 ? (await blob.text()).replace(/\s+/g, ' ').slice(0, 200) : ''
          throw new Error(
            `Preload response is not a valid .apkg (expected ZIP “PK…” header). ${preview ? `Body starts with: ${preview}` : ''} Set DEMOENGLISH_PRELOAD_APKG_PATH in frontend/.env.development and restart \`npm run dev\`.`,
          )
        }
        const dispo = res.headers.get('Content-Disposition')
        const fromHeader = dispo?.match(/filename="([^"]+)"/)?.[1]
        const fileName = fromHeader?.trim() || 'preloaded.apkg'
        const file = new File(
          [blob],
          fileName.toLowerCase().endsWith('.apkg') ? fileName : `${fileName}.apkg`,
          { type: 'application/octet-stream' },
        )
        const msg = await applyImportFromFile(file, 'replace')
        setMessage(`${msg} Preloaded from local disk (dev).`)
      } catch (err) {
        preloadRan.current = false
        setMessage(err instanceof Error ? err.message : 'Preload failed.')
      }
    })()
  }, [preloadApkgUrl, applyImportFromFile])

  const onInterviewCsvSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setMessage(null)
      setBusy(true)
      try {
        const result = await importInterviewCsvFromFile(file)
        const mapped = result.cards
        if (mapped.length === 0) {
          setMessage(result.warnings.join(' ') || 'No cards imported.')
          return
        }
        onCardsChange(importMode === 'replace' ? mapped : [...cards, ...mapped])
        setMessage(
          result.warnings.length
            ? `Interview prep: imported ${mapped.length} Q&A card(s). ${result.warnings.join(' ')}`
            : `Interview prep: imported ${mapped.length} Q&A card(s). Open a card — Part 1 = question, Part 2 = answer.`,
        )
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Interview CSV import failed.')
      } finally {
        setBusy(false)
      }
    },
    [cards, importMode, onCardsChange],
  )

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setMessage(null)
      setBusy(true)
      try {
        const msg = await applyImportFromFile(file, importMode)
        setMessage(msg)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Import failed.')
      } finally {
        setBusy(false)
      }
    },
    [applyImportFromFile, importMode],
  )

  const onExport = useCallback(async () => {
    if (cards.length === 0) return
    setMessage(null)
    setBusy(true)
    try {
      const blob = await exportAnkiPlainText(cards)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'anki-export.txt'
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Download started (UTF-8 tab-separated, ready for Anki → Import).')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }, [cards])

  const removeAt = (index: number) => {
    onCardsChange(cards.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    onCardsChange([])
    setSelectedIndex(null)
    setListSearch('')
    setMessage(null)
    setMediaUrls((prev) => {
      revokeMediaUrls(prev)
      return new Map()
    })
  }

  return (
    <section className="w-full max-w-6xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
        <Layers className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight">Anki deck (plain text)</h2>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Import <strong>.apkg</strong> (reads <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">collection.anki2</code> /{' '}
        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">collection.anki21</code> inside the ZIP) or plain{' '}
        <strong>.txt</strong> / <strong>.tsv</strong> / two-column <strong>.csv</strong> (server). For <strong>interview Q&amp;A</strong> CSV with
        headers (Pregunta/Guía, Question/Answer, etc. — same rules as <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">tools/AnkiInterviewExporter</code>
        ), use <strong>Import interview CSV</strong> so Part 1/2 follow question → answer. HTML in fields is stripped to text. Add dictionary cards with
        the button on the result card.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {/*
          iOS Safari: avoid `display:none` + programmatic input.click() — the picker may not open
          or files look unselectable. Use a native <label> + visually hidden input (sr-only), and
          avoid a tight `accept` filter so .apkg shows normally in Files.
        */}
        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${
            busy ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onFileSelected(e)}
          />
          <FileUp className="size-4 shrink-0" aria-hidden />
          Import file
        </label>
        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-900 shadow-sm transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/50 ${
            busy ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <input
            ref={interviewCsvInputRef}
            type="file"
            accept=".csv"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onInterviewCsvSelected(e)}
          />
          <MessageSquare className="size-4 shrink-0" aria-hidden />
          Import interview CSV
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>On import:</span>
          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as 'append' | 'replace')}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="append">Append</option>
            <option value="replace">Replace list</option>
          </select>
        </label>
        <a
          href={sampleAnkiDownloadUrl()}
          download
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
        >
          <Download className="size-4" aria-hidden />
          Sample .txt
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={busy || cards.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-600"
        >
          <Download className="size-4" aria-hidden />
          Export for Anki
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={busy || cards.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Trash2 className="size-4" aria-hidden />
          Clear all
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {message}
        </p>
      ) : null}

      {cards.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span>
                Words ({listRows.length}
                {listSearch.trim() ? ` of ${cards.length}` : ''}) — A–Z
              </span>
              <span className="hidden normal-case text-slate-400 dark:text-slate-500 sm:inline">
                Click a row for full card
              </span>
            </div>
            <label className="relative block shrink-0 sm:max-w-xs sm:flex-1">
              <span className="sr-only">Search deck</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search…"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/30 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
              />
            </label>
          </div>
          {listRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No cards match your search.
            </p>
          ) : (
            <ul className="max-h-[min(70vh,36rem)] divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              {listRows.map(({ card: c, originalIndex: i }) => (
                <li key={`anki-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    aria-label={`Open card: ${baseWordLabel(c.front)}`}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <span className="min-w-0 flex-1 truncate text-base font-medium text-slate-900 dark:text-slate-50">
                      {baseWordLabel(c.front)}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No cards in the list yet.</p>
      )}

      {selectedIndex !== null && cards[selectedIndex] ? (
        <AnkiCardDetailModal
          card={cards[selectedIndex]}
          cardIndex={selectedIndex}
          deckOrdinal={deckOrdinalByIndex.get(selectedIndex)}
          totalCards={cards.length}
          mediaUrls={mediaUrls}
          onClose={() => setSelectedIndex(null)}
          onRemove={() => {
            const i = selectedIndex
            removeAt(i)
            setSelectedIndex(null)
          }}
          hasNextCard={nextCardIndexInAzOrder !== null}
          onNextCard={goToNextCardInAzOrder}
          hasPrevCard={prevCardIndexInAzOrder !== null}
          onPrevCard={goToPrevCardInAzOrder}
        />
      ) : null}
    </section>
  )
}
