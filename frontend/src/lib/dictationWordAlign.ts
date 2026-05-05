/** Core for equality: lowercase, keep only a-z0-9 (handles "don't" vs speech "dont"). */
export function normalizeDictationToken(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function splitReferenceWords(text: string): string[] {
  return text.match(/\S+/g) ?? []
}

export type TokenSpan = { text: string; start: number; end: number }

/** Whitespace-separated tokens with positions in the original string. */
export function tokenizeInputWithSpans(input: string): TokenSpan[] {
  const tokens: TokenSpan[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length })
  }
  return tokens
}

export type UserWordAlignStatus = 'ok' | 'wrong'

type Op = 'M' | 'D' | 'I'

function tokensMatch(a: string, b: string): boolean {
  const na = normalizeDictationToken(a)
  const nb = normalizeDictationToken(b)
  if (na.length === 0 && nb.length === 0) return true
  return na === nb && na.length > 0
}

function matchCost(a: string, b: string): number {
  return tokensMatch(a, b) ? 0 : 1
}

/**
 * Aligns user transcript tokens to a reference paragraph (word-level edit distance).
 * Each user token gets ok vs wrong (missing ref words are not shown; extra user words are wrong).
 */
export function alignUserWordsToReference(referenceText: string, userText: string): UserWordAlignStatus[] {
  const refWords = splitReferenceWords(referenceText)
  const userWords = splitReferenceWords(userText)
  const n = userWords.length
  const m = refWords.length
  if (n === 0) return []

  const INF = m + n + 10
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(INF))
  const op: Op[][] = Array.from({ length: m + 1 }, () => new Array<Op>(n + 1).fill('M'))

  const opRank: Record<Op, number> = { M: 0, D: 1, I: 2 }

  dp[0][0] = 0
  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0 && j === 0) continue
      let best = INF
      let bestOp: Op = 'M'

      const consider = (cost: number, o: Op) => {
        if (cost < best || (cost === best && opRank[o] < opRank[bestOp])) {
          best = cost
          bestOp = o
        }
      }

      if (i > 0 && j > 0) consider(dp[i - 1]![j - 1]! + matchCost(refWords[i - 1]!, userWords[j - 1]!), 'M')
      if (i > 0) consider(dp[i - 1]![j]! + 1, 'D')
      if (j > 0) consider(dp[i]![j - 1]! + 1, 'I')

      dp[i]![j] = best
      op[i]![j] = bestOp
    }
  }

  const out: UserWordAlignStatus[] = new Array(n).fill('wrong')
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i === 0 && j === 0) break
    const p = op[i]![j]!
    if (p === 'M' && i > 0 && j > 0) {
      out[j - 1] = tokensMatch(refWords[i - 1]!, userWords[j - 1]!) ? 'ok' : 'wrong'
      i--
      j--
    } else if (p === 'I' && j > 0) {
      out[j - 1] = 'wrong'
      j--
    } else if (p === 'D' && i > 0) {
      i--
    } else {
      if (j > 0) {
        out[j - 1] = 'wrong'
        j--
      } else if (i > 0) i--
      else break
    }
  }
  return out
}
