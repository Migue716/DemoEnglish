/**
 * Fetches and parses YouTube timedtext (same flow as common transcript libraries,
 * but with a more tolerant parser so captions still work when attribute order
 * or whitespace differs from strict regex-only parsers).
 */

import {
  INNERTUBE_ANDROID_CONTEXT,
  INNERTUBE_ANDROID_UA,
} from './youtubeInnertubeClient'

const YT_PLAYER = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false'

export type YoutubeCaptionLine = {
  text: string
  duration: number
  offset: number
  lang?: string
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

/** srv3 / format="3": <p t="ms" d="ms">… */
function parseSrv3WithRegex(xml: string, lang: string): YoutubeCaptionLine[] {
  const out: YoutubeCaptionLine[] = []
  const re = /<p\b([^>]*?)>([\s\S]*?)<\/p>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const attr = m[1]
    const inner = m[2]
    const tM = /\bt="(\d+)"/.exec(attr)
    const dM = /\bd="(\d+)"/.exec(attr)
    if (!tM || !dM) continue
    const startMs = parseInt(tM[1], 10)
    const durMs = parseInt(dM[1], 10)
    if (Number.isNaN(startMs) || Number.isNaN(durMs)) continue

    let text = ''
    const sRe = /<s\b[^>]*>([^<]*)<\/s>/gi
    let sm: RegExpExecArray | null
    while ((sm = sRe.exec(inner)) !== null) {
      text += sm[1]
    }
    if (!text) {
      text = inner.replace(/<[^>]+>/g, '')
    }
    text = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim()
    if (!text) continue
    out.push({ text, offset: startMs, duration: durMs, lang })
  }
  return out
}

/** Classic: <text start="s" dur="s">… */
function parseClassicWithRegex(xml: string, lang: string): YoutubeCaptionLine[] {
  const re = /<text\b[^>]*\bstart="([^"]*)"[^>]*\bdur="([^"]*)"[^>]*>([^<]*)<\/text>/gi
  const out: YoutubeCaptionLine[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const start = parseFloat(m[1])
    const dur = parseFloat(m[2])
    const text = decodeHtmlEntities(m[3]).replace(/\s+/g, ' ').trim()
    if (!text || Number.isNaN(start) || Number.isNaN(dur)) continue
    out.push({
      text,
      offset: start,
      duration: dur,
      lang,
    })
  }
  return out
}

function parseWithDomParser(xml: string, lang: string): YoutubeCaptionLine[] {
  if (typeof DOMParser === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) return []

  const out: YoutubeCaptionLine[] = []
  const paragraphs = doc.getElementsByTagName('p')
  for (let i = 0; i < paragraphs.length; i++) {
    const el = paragraphs[i]
    const t = el.getAttribute('t')
    const d = el.getAttribute('d')
    if (t === null || d === null) continue
    const startMs = parseInt(t, 10)
    const durMs = parseInt(d, 10)
    if (Number.isNaN(startMs) || Number.isNaN(durMs)) continue

    const bits: string[] = []
    for (const s of el.getElementsByTagName('s')) {
      bits.push(s.textContent ?? '')
    }
    let text = bits.join('').replace(/\s+/g, ' ').trim()
    if (!text) {
      text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    }
    text = decodeHtmlEntities(text)
    if (!text) continue
    out.push({ text, offset: startMs, duration: durMs, lang })
  }
  return out
}

export function parseTimedTextXml(xml: string, lang: string): YoutubeCaptionLine[] {
  const trimmed = xml.replace(/^\uFEFF/, '').trim()
  if (!trimmed) return []

  const fromDom = parseWithDomParser(trimmed, lang)
  if (fromDom.length > 0) return fromDom

  const srv3 = parseSrv3WithRegex(trimmed, lang)
  if (srv3.length > 0) return srv3

  return parseClassicWithRegex(trimmed, lang)
}

function pickTrack(tracks: readonly { languageCode?: string; kind?: string; baseUrl?: string }[], lang: string) {
  const match = tracks.filter((t) => t.languageCode === lang)
  if (match.length === 0) {
    const avail = [...new Set(tracks.map((t) => t.languageCode).filter(Boolean))].join(', ')
    throw new Error(
      avail
        ? `No captions in “${lang}”. Available languages: ${avail}.`
        : 'No captions match the requested language.',
    )
  }
  const human = match.find((t) => t.kind !== 'asr')
  const track = human ?? match[0]
  if (!track.baseUrl) throw new Error('Caption track has no URL.')
  return track
}

export async function fetchYoutubeCaptionLines(
  videoId: string,
  options: { lang?: string; fetch?: typeof fetch } = {},
): Promise<YoutubeCaptionLine[]> {
  const fetchFn = options.fetch ?? globalThis.fetch
  const lang = options.lang ?? 'en'
  const id = videoId.length === 11 ? videoId : videoId.match(/(?:v=|\/)([\w-]{11})/)?.[1]
  if (!id) throw new Error('Invalid YouTube video id.')

  const innerRes = await fetchFn(YT_PLAYER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': INNERTUBE_ANDROID_UA,
    },
    body: JSON.stringify({
      context: INNERTUBE_ANDROID_CONTEXT,
      videoId: id,
    }),
  })

  if (!innerRes.ok) {
    throw new Error(`YouTube player request failed (${innerRes.status}).`)
  }

  const data: unknown = await innerRes.json()
  const root = data as {
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown[] } }
    playabilityStatus?: { status?: string; reason?: string }
  }
  const tracks = root.captions?.playerCaptionsTracklistRenderer?.captionTracks as
    | { languageCode?: string; kind?: string; baseUrl?: string }[]
    | undefined

  if (!Array.isArray(tracks) || tracks.length === 0) {
    const reason = root.playabilityStatus?.reason
    throw new Error(
      reason ? `No captions: ${reason}` : 'No transcripts are available for this video.',
    )
  }

  const track = pickTrack(tracks, lang)
  let captionUrl: URL
  try {
    captionUrl = new URL(track.baseUrl!)
  } catch {
    throw new Error('Invalid caption URL.')
  }
  if (!captionUrl.hostname.endsWith('.youtube.com')) {
    throw new Error('Unexpected caption host.')
  }

  const trRes = await fetchFn(track.baseUrl!, {
    headers: {
      'Accept-Language': lang,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  if (!trRes.ok) {
    throw new Error(`Caption download failed (${trRes.status}).`)
  }

  const body = await trRes.text()
  if (!body.includes('<') || body.trim().startsWith('<!DOCTYPE') || body.includes('<html')) {
    throw new Error('Caption response was not valid timedtext XML.')
  }

  const lines = parseTimedTextXml(body, lang)
  if (lines.length === 0) {
    throw new Error(
      'Could not parse any caption lines from the timedtext response. Try opening the video on YouTube.',
    )
  }
  return lines
}
