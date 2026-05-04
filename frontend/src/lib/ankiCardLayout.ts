/** Plain text without Anki-style media placeholders. */
export function stripMediaPlaceholders(s: string): string {
  return s.replace(/\[(?:sound|img):[^\]]+\]/gi, ' ').replace(/\s+/g, ' ').trim()
}

/** Removes [sound:] / [img:] tags but keeps line breaks (for part 2 text after media moved to part 1). */
export function stripMediaTagsKeepNewlines(s: string): string {
  return s
    .replace(/\[(?:sound|img):[^\]]+\]/gi, '')
    .replace(/[ \t]+\r?\n/g, '\n')
    .replace(/\r?\n{3,}/g, '\n\n')
    .trim()
}

export function hasMediaEmbeds(s: string): boolean {
  return /\[(?:sound|img):[^\]]+\]/i.test(s)
}

export type MediaEmbed = { kind: 'sound' | 'img'; filename: string }

/** All [sound:] / [img:] tags in document order (front + back concatenated). */
export function extractMediaEmbedsInOrder(text: string): MediaEmbed[] {
  const re = /\[(sound|img):([^\]]+)\]/gi
  const out: MediaEmbed[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const kind = m[1].toLowerCase() === 'img' ? 'img' : 'sound'
    out.push({ kind, filename: m[2].trim() })
  }
  return out
}

export function looksLikePhoneticLine(line: string): boolean {
  const t = line.trim()
  if (t.length < 2 || t.length > 120) return false
  if (/^\/[^/\n]+\/$/.test(t)) return true
  if (/^[\[(]?\/[^/\n]+\/[\])]?$/.test(t)) return true
  return /[ˈːˌɪʃðθæʌəɑɔʊŋ]/.test(t) && !/\s{3,}/.test(t)
}

export type FrontParts = {
  headline: string
  phonetic: string
  /** Remaining front lines (hints, cloze, etc.), plain display */
  body: string
}

export function parseFrontDisplay(front: string): FrontParts {
  const lines = front.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { headline: '', phonetic: '', body: '' }
  const h0 = stripMediaPlaceholders(lines[0])
  const headline = h0
  let rest = lines.slice(1)
  let phonetic = ''
  if (rest.length > 0 && looksLikePhoneticLine(rest[0])) {
    phonetic = rest[0]
    rest = rest.slice(1)
  }
  const body = rest.map((l) => stripMediaPlaceholders(l)).join('\n').trim()
  return { headline, phonetic, body }
}

export type BackParts = {
  definition: string
  translation: string
  examples: string
}

export function parseBackDisplay(back: string): BackParts {
  const lines = back.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { definition: '', translation: '', examples: '' }
  if (lines.length === 1) {
    return { definition: stripMediaPlaceholders(lines[0]), translation: '', examples: '' }
  }
  return {
    definition: stripMediaPlaceholders(lines[0]),
    translation: stripMediaPlaceholders(lines[1]),
    examples: lines
      .slice(2)
      .map((l) => stripMediaPlaceholders(l))
      .join('\n')
      .trim(),
  }
}
