import type { AnkiCard, AnkiImportResult } from '../types/anki'
import { getApiBase } from './apiOrigin'

export async function importAnkiPlainText(file: File): Promise<AnkiImportResult> {
  const form = new FormData()
  form.append('file', file)

  const url = `${getApiBase()}/api/anki/import`
  const response = await fetch(url, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: string; title?: string }
      detail = body.detail ?? body.title ?? detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  return (await response.json()) as AnkiImportResult
}

export async function exportAnkiPlainText(cards: Pick<AnkiCard, 'front' | 'back'>[]): Promise<Blob> {
  const url = `${getApiBase()}/api/anki/export`
  const payload = cards.map(({ front, back }) => ({ front, back }))
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cards: payload }),
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: string }
      detail = body.detail ?? detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  return response.blob()
}

export function sampleAnkiDownloadUrl(): string {
  return `${getApiBase()}/api/anki/sample`
}
