import type { AnkiCard } from '../types/anki'

/** Matches `tools/AnkiInterviewExporter` CSV rules (UTF-8, header row, comma or semicolon). */
export type InterviewCsvImportResult = {
  cards: AnkiCard[]
  warnings: string[]
}

function detectDelimiter(firstLine: string): ',' | ';' {
  let commas = 0
  let semis = 0
  for (const ch of firstLine) {
    if (ch === ',') commas++
    if (ch === ';') semis++
  }
  return semis > commas ? ';' : ','
}

/** Single CSV record line; supports `"quoted,fields"` and `""` escapes. */
export function parseCsvLine(line: string, delim: ',' | ';'): string[] {
  const sep = delim
  const out: string[] = []
  let i = 0
  let field = ''
  let inQuotes = false
  while (i < line.length) {
    const c = line[i]!
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === sep) {
      out.push(field.trim())
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  out.push(field.trim())
  return out
}

function equalsHeader(h: string, name: string): boolean {
  return h.trim().toLowerCase() === name.toLowerCase()
}

function includesInsensitive(h: string, sub: string): boolean {
  return h.toLowerCase().includes(sub.toLowerCase())
}

function resolveFrontColumnIndex(headers: string[]): number {
  const names = ['Front', 'Pregunta', 'Question']
  for (let col = 0; col < headers.length; col++) {
    const h = headers[col]?.trim() ?? ''
    for (const n of names) {
      if (equalsHeader(h, n)) return col
    }
  }
  const subs = ['pregunta', 'question']
  for (let col = 0; col < headers.length; col++) {
    const h = headers[col]?.trim() ?? ''
    for (const s of subs) {
      if (includesInsensitive(h, s)) return col
    }
  }
  return 0
}

function resolveBackColumnIndex(headers: string[]): number {
  const names = ['Back', 'Guía', 'Guia', 'Guide', 'Answer', 'Respuesta']
  for (let col = 0; col < headers.length; col++) {
    const h = headers[col]?.trim() ?? ''
    for (const n of names) {
      if (equalsHeader(h, n)) return col
    }
  }
  const subs = ['guía', 'guia', 'guide', 'answer', 'respuesta']
  for (let col = 0; col < headers.length; col++) {
    const h = headers[col]?.trim() ?? ''
    for (const s of subs) {
      if (includesInsensitive(h, s)) return col
    }
  }
  return 1
}

export function parseInterviewCsv(content: string): InterviewCsvImportResult {
  const warnings: string[] = []
  const trimmed = content.replace(/^\uFEFF/, '')
  const rawLines = trimmed.split(/\r?\n/)
  const lines = rawLines.map((l) => l.trimEnd()).filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    return { cards: [], warnings: ['CSV needs a header row and at least one data row.'] }
  }

  const delim = detectDelimiter(lines[0]!)
  const headers = parseCsvLine(lines[0]!, delim)
  if (headers.length < 2) {
    return { cards: [], warnings: ['The CSV header must have at least two columns.'] }
  }

  let frontIdx = resolveFrontColumnIndex(headers)
  let backIdx = resolveBackColumnIndex(headers)
  if (frontIdx === backIdx) {
    backIdx = frontIdx === 0 ? 1 : 0
    if (frontIdx === backIdx) {
      return { cards: [], warnings: ['Could not distinguish question and answer columns from headers.'] }
    }
    warnings.push(`Using columns ${frontIdx + 1} and ${backIdx + 1} as question and answer.`)
  }

  const cards: AnkiCard[] = []
  for (let row = 1; row < lines.length; row++) {
    const lineNum = row + 1
    const cells = parseCsvLine(lines[row]!, delim)
    const front = (cells[frontIdx] ?? '').trim()
    const back = (cells[backIdx] ?? '').trim()
    if (!front && !back) continue
    if (!front || !back) {
      warnings.push(`Row ${lineNum}: skipped (need both question and answer).`)
      continue
    }
    cards.push({
      front,
      back,
      kind: 'interview',
      sourceLine: lineNum,
    })
  }

  if (cards.length === 0) {
    warnings.push('No rows with both columns filled.')
  }

  return { cards, warnings }
}

export async function importInterviewCsvFromFile(file: File): Promise<InterviewCsvImportResult> {
  const text = await file.text()
  return parseInterviewCsv(text)
}
