export type AnkiCard = {
  front: string
  back: string
  sourceLine?: number
}

export type AnkiImportResult = {
  cards: AnkiCard[]
  warnings: string[]
}
