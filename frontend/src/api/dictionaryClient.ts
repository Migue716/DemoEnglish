import { DictionaryRequestError, type WordDefinitionDto } from '../types/dictionary'
import { getApiBase } from './apiOrigin'

export async function fetchWordDefinition(word: string): Promise<WordDefinitionDto> {
  const trimmed = word.trim()
  if (!trimmed) {
    throw new DictionaryRequestError(400, 'Please enter a word to look up.')
  }

  const url = `${getApiBase()}/api/dictionary/entries/${encodeURIComponent(trimmed)}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (response.ok) {
    return (await response.json()) as WordDefinitionDto
  }

  let detail = response.statusText || 'Request failed'
  try {
    const body = (await response.json()) as { detail?: string; title?: string }
    if (typeof body.detail === 'string' && body.detail.length > 0) {
      detail = body.detail
    } else if (typeof body.title === 'string' && body.title.length > 0) {
      detail = body.title
    }
  } catch {
    /* ignore non-JSON error bodies */
  }

  throw new DictionaryRequestError(response.status, detail)
}
