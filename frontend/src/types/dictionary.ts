export type WordDefinitionDto = {
  word: string
  phoneticText: string | null
  audioUrl: string | null
  primaryDefinition: string
  partOfSpeech: string | null
}

export class DictionaryRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'DictionaryRequestError'
  }
}
