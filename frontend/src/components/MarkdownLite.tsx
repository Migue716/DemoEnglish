import type { ReactNode } from 'react'

/** Split on **bold** first, then *italic* in each plain segment (no nested italic inside bold). */
function parseRichLine(text: string, keyPrefix: string): ReactNode[] {
  const boldChunks = text.split(/(\*\*[^*]+\*\*)/g)
  const out: ReactNode[] = []
  let k = 0
  for (const chunk of boldChunks) {
    if (/^\*\*[^*]+\*\*$/.test(chunk)) {
      out.push(
        <strong key={`${keyPrefix}-${k++}`} className="font-semibold text-slate-900 dark:text-slate-50">
          {chunk.slice(2, -2)}
        </strong>,
      )
      continue
    }
    const italicChunks = chunk.split(/(\*[^*]+\*)/g)
    for (const ic of italicChunks) {
      if (/^\*[^*]+\*$/.test(ic)) {
        out.push(
          <em key={`${keyPrefix}-${k++}`} className="italic text-slate-800 dark:text-slate-200">
            {ic.slice(1, -1)}
          </em>,
        )
      } else if (ic) {
        out.push(<span key={`${keyPrefix}-${k++}`}>{ic}</span>)
      }
    }
  }
  return out
}

type MarkdownLiteProps = {
  text: string
  className?: string
}

/** Inline *italic* and **bold** only. */
export function MarkdownLite({ text, className }: MarkdownLiteProps) {
  return <span className={className}>{parseRichLine(text, 'md')}</span>
}

type MarkdownFormulaProps = {
  text: string
}

/** Monospace block: one formula line per row, markdown applied per line. */
export function MarkdownFormula({ text }: MarkdownFormulaProps) {
  const lines = text.split('\n')
  return (
    <div className="font-mono text-[0.8rem] leading-relaxed text-slate-700 dark:text-slate-300">
      {lines.map((line, li) => (
        <div key={`ln-${li}`}>
          {parseRichLine(line, `f-${li}`)}
        </div>
      ))}
    </div>
  )
}
