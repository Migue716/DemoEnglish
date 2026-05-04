import { memo, useMemo } from 'react'
import { findApkgMediaUrl } from '../lib/apkgMedia'

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'sound'; filename: string }
  | { kind: 'img'; filename: string }

function splitMediaTags(text: string): Segment[] {
  const re = /\[(sound|img):([^\]]+)\]/gi
  const out: Segment[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: 'text', value: text.slice(last, m.index) })
    const kind = m[1].toLowerCase() === 'img' ? 'img' : 'sound'
    out.push({ kind, filename: m[2].trim() })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ kind: 'text', value: text.slice(last) })
  return out
}

type CardBackContentProps = {
  text: string
  mediaUrls: ReadonlyMap<string, string>
  /** If true, only render [sound:] / [img:] embeds (no plain text). */
  mediaOnly?: boolean
}

export const CardBackContent = memo(function CardBackContent({ text, mediaUrls, mediaOnly }: CardBackContentProps) {
  const segments = useMemo(() => splitMediaTags(text), [text])

  if (segments.length === 0) {
    if (mediaOnly) return null
    return <span className="whitespace-pre-wrap break-words">{text}</span>
  }

  const mediaSegments = segments.filter((s) => s.kind !== 'text')
  if (mediaOnly && mediaSegments.length === 0) return null

  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          if (mediaOnly) return null
          return <span key={i}>{seg.value}</span>
        }
        const src = findApkgMediaUrl(seg.filename, mediaUrls)
        if (seg.kind === 'sound') {
          if (src) {
            return (
              <span key={i} className="my-1 block max-w-md">
                <audio controls className="h-9 w-full" src={src} preload="auto" playsInline />
              </span>
            )
          }
          const short = seg.filename.length > 48 ? `${seg.filename.slice(0, 48)}…` : seg.filename
          return (
            <span
              key={i}
              className="inline-block rounded border border-dashed border-slate-300 px-1.5 py-0.5 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400"
              title={seg.filename}
            >
              [sound: {short}]
            </span>
          )
        }
        /* img */
        if (src) {
          return (
            <span key={i} className="my-2 block max-w-full">
              <img
                src={src}
                alt=""
                className="max-h-52 max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-600"
                loading="lazy"
              />
            </span>
          )
        }
        const short = seg.filename.length > 48 ? `${seg.filename.slice(0, 48)}…` : seg.filename
        return (
          <span
            key={i}
            className="inline-block rounded border border-dashed border-slate-300 px-1.5 py-0.5 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400"
            title={seg.filename}
          >
            [img: {short}]
          </span>
        )
      })}
    </span>
  )
})
