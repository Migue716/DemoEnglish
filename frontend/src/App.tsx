import { useCallback, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { fetchWordDefinition } from './api/dictionaryClient'
import { AnkiDeckPanel } from './components/AnkiDeckPanel'
import { VerbTensePracticeDialog, VerbTenseMenuButton } from './components/VerbTensePracticeDialog'
import { VerbTenseTheoryDialog, TenseTheoryMenuButton } from './components/VerbTenseTheoryDialog'
import { VerbListsDialog, VerbListsMenuButton } from './components/VerbListsDialog'
import { DefinitionCard } from './components/DefinitionCard'
import { SearchBar } from './components/SearchBar'
import { SettingsDialog, SettingsMenuButton } from './components/SettingsDialog'
import { DictionaryRequestError, type WordDefinitionDto } from './types/dictionary'
import type { AnkiCard } from './types/anki'

function buildAnkiBackFromDefinition(d: WordDefinitionDto): string {
  const lines = [
    d.partOfSpeech ? `(${d.partOfSpeech})` : null,
    d.phoneticText ? `IPA: ${d.phoneticText}` : null,
    '',
    d.primaryDefinition,
  ].filter((line) => line != null && line.length > 0) as string[]
  return lines.join('\n')
}

function App() {
  const [query, setQuery] = useState('')
  const [definition, setDefinition] = useState<WordDefinitionDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ankiCards, setAnkiCards] = useState<AnkiCard[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [verbPracticeOpen, setVerbPracticeOpen] = useState(false)
  const [tenseTheoryOpen, setTenseTheoryOpen] = useState(false)
  const [verbListsOpen, setVerbListsOpen] = useState(false)

  const runSearch = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await fetchWordDefinition(query)
      setDefinition(result)
    } catch (e) {
      setDefinition(null)
      if (e instanceof DictionaryRequestError) {
        setError(e.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [query])

  const addDefinitionToAnki = useCallback((d: WordDefinitionDto) => {
    setAnkiCards((prev) => [
      ...prev,
      { front: d.word, back: buildAnkiBackFromDefinition(d), kind: 'vocabulary' },
    ])
  }, [])

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:py-16">
        <header className="flex flex-col gap-4 text-center sm:text-left">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md sm:mx-0">
                <GraduationCap className="size-7" aria-hidden />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tech English vocabulary</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  Look up words with the Free Dictionary API, build a deck, and export plain text for{' '}
                  <a
                    href="https://docs.ankiweb.net/importing/text-files.html"
                    className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Anki import
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:shrink-0 sm:justify-end sm:pt-1">
              <VerbTenseMenuButton open={verbPracticeOpen} onClick={() => setVerbPracticeOpen(true)} />
              <TenseTheoryMenuButton open={tenseTheoryOpen} onClick={() => setTenseTheoryOpen(true)} />
              <VerbListsMenuButton open={verbListsOpen} onClick={() => setVerbListsOpen(true)} />
              <SettingsMenuButton open={settingsOpen} onClick={() => setSettingsOpen(true)} />
            </div>
          </div>
        </header>

        <main className="flex flex-col items-center gap-6 sm:items-stretch">
          <SearchBar value={query} onChange={setQuery} onSubmit={() => void runSearch()} disabled={loading} />

          {error ? (
            <div
              role="alert"
              className="w-full max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
            >
              {error}
            </div>
          ) : null}

          {definition && !loading ? (
            <DefinitionCard definition={definition} onAddToAnki={addDefinitionToAnki} />
          ) : null}

          <div className="w-full border-t border-slate-200 pt-8 dark:border-slate-800">
            <AnkiDeckPanel cards={ankiCards} onCardsChange={setAnkiCards} />
          </div>
        </main>

        <footer className="text-center text-xs text-slate-400 dark:text-slate-500 sm:text-left">
          Dictionary data from{' '}
          <a
            href="https://dictionaryapi.dev/"
            className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
            target="_blank"
            rel="noreferrer"
          >
            Free Dictionary API
          </a>
          . Deck tools support plain text and .apkg import (see README for limits).
        </footer>
      </div>
      <VerbTensePracticeDialog open={verbPracticeOpen} onClose={() => setVerbPracticeOpen(false)} />
      <VerbTenseTheoryDialog open={tenseTheoryOpen} onClose={() => setTenseTheoryOpen(false)} />
      <VerbListsDialog open={verbListsOpen} onClose={() => setVerbListsOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
