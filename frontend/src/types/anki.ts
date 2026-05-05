export type AnkiCard = {
  front: string
  back: string
  /** `interview` = Q&A prep (CSV); default vocabulary/dictionary cards omit or use `vocabulary`. */
  kind?: 'vocabulary' | 'interview'
  sourceLine?: number
}

export type AnkiImportResult = {
  cards: AnkiCard[]
  warnings: string[]
}
