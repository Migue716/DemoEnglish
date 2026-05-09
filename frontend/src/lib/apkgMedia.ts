import JSZip from 'jszip'

function mimeForFilename(filename: string): string {
  const ext = filename.split(/[#?]/)[0]?.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'mp3') return 'audio/mpeg'
  if (ext === 'ogg' || ext === 'oga') return 'audio/ogg'
  if (ext === 'wav') return 'audio/wav'
  if (ext === 'm4a' || ext === 'aac') return 'audio/mp4'
  if (ext === 'opus') return 'audio/opus'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'svg') return 'image/svg+xml'
  if (ext === 'bmp') return 'image/bmp'
  if (ext === 'avif') return 'image/avif'
  return 'application/octet-stream'
}

async function fileStartsWithZipMagic(file: File): Promise<boolean> {
  if (file.size < 4) return false
  const b = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  return b[0] === 0x50 && b[1] === 0x4b // "PK" — ZIP / .apkg
}

/** Maps logical media filenames (as in `[sound:…]`) to object URLs for blobs from the .apkg zip. */
export async function extractApkgMediaUrls(apkgFile: File): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (!apkgFile.name.toLowerCase().endsWith('.apkg')) return urls

  if (!(await fileStartsWithZipMagic(apkgFile))) {
    throw new Error(
      'This file is not a valid .apkg ZIP (missing PK header). The download may be an HTML/text error instead of the package — check Vite preload (DEMOENGLISH_PRELOAD_APKG_PATH) or your network.',
    )
  }

  let zip: Awaited<ReturnType<typeof JSZip.loadAsync>>
  try {
    zip = await JSZip.loadAsync(apkgFile)
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new Error(
      `Could not open as ZIP (.apkg): ${detail}. If you use dev preload, ensure DEMOENGLISH_PRELOAD_APKG_PATH points to a real file and run Vite from the frontend folder (or keep .env next to vite.config.ts).`,
    )
  }

  let mediaEntry = zip.file('media')
  if (!mediaEntry) {
    const path = Object.keys(zip.files).find(
      (p) => !zip.files[p].dir && p.replace(/\\/g, '/').split('/').pop()?.toLowerCase() === 'media',
    )
    if (path) mediaEntry = zip.file(path)
  }
  if (!mediaEntry) return urls

  let mapping: Record<string, string>
  try {
    mapping = JSON.parse(await mediaEntry.async('string')) as Record<string, string>
  } catch {
    return urls
  }

  for (const [id, filename] of Object.entries(mapping)) {
    if (typeof filename !== 'string' || !filename) continue

    let fileEntry = zip.file(id)
    if (!fileEntry) {
      const matchPath = Object.keys(zip.files).find(
        (p) => !zip.files[p].dir && (p === id || p.replace(/\\/g, '/').endsWith(`/${id}`)),
      )
      if (matchPath) fileEntry = zip.file(matchPath)
    }
    if (!fileEntry) continue

    const blob = await fileEntry.async('blob')
    const mime = mimeForFilename(filename)
    const typed = blob.type && blob.type !== 'application/octet-stream' ? blob : new Blob([blob], { type: mime })
    const url = URL.createObjectURL(typed)
    const prev = urls.get(filename)
    if (prev) URL.revokeObjectURL(prev)
    urls.set(filename, url)
  }

  return urls
}

/** Resolves a logical media filename (from <c>[sound:…]</c> / <c>[img:…]</c> or Anki <c>src</c>) to a blob URL from the package. */
export function findApkgMediaUrl(logicalName: string, map: ReadonlyMap<string, string>): string | undefined {
  const t = logicalName.trim()
  if (map.has(t)) return map.get(t)
  const tl = t.toLowerCase()
  for (const [k, v] of map) {
    if (k.toLowerCase() === tl) return v
  }
  const seg = t.split(/[/\\]/).pop()
  if (!seg) return undefined
  if (map.has(seg)) return map.get(seg)
  const sl = seg.toLowerCase()
  for (const [k, v] of map) {
    const kb = k.split(/[/\\]/).pop()
    if (kb?.toLowerCase() === sl) return v
  }
  return undefined
}

export function revokeMediaUrls(map: ReadonlyMap<string, string>): void {
  for (const u of map.values()) URL.revokeObjectURL(u)
}
