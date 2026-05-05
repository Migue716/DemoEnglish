/** Opens external sites in a new tab — no playback/embed inside the app (ToS / licensing). */

export type ExternalSongLink = { label: string; href: string }

/** Trim / collapse spaces; cap length for URLs (phrases from text selection). */
export function normalizeQueryForSongSearch(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ')
  if (t.length <= 120) return t
  return t.slice(0, 120).trim()
}

export function buildSongSearchLinks(word: string): ExternalSongLink[] {
  const w = normalizeQueryForSongSearch(word)
  if (!w) return []

  const lyricsQuery = encodeURIComponent(`${w} song lyrics english`)
  const wordEnc = encodeURIComponent(w)

  return [
    {
      label: 'YouTube',
      href: `https://www.youtube.com/results?search_query=${lyricsQuery}`,
    },
    {
      label: 'Spotify',
      href: `https://open.spotify.com/search/${wordEnc}`,
    },
    {
      label: 'Genius',
      href: `https://genius.com/search?q=${wordEnc}`,
    },
  ]
}
