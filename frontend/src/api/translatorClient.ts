const MY_MEMORY_TRANSLATE_URL = 'https://api.mymemory.translated.net/get'

type MyMemoryTranslateResponse = {
  responseData?: {
    translatedText?: string
  }
  responseStatus?: number
  responseDetails?: string
}

async function translateText(text: string, langpair: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('No text provided to translate.')
  }

  const params = new URLSearchParams({
    q: trimmed,
    langpair,
  })

  const response = await fetch(`${MY_MEMORY_TRANSLATE_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Translation service is temporarily unavailable.')
  }

  const body = (await response.json()) as MyMemoryTranslateResponse
  const translated = body.responseData?.translatedText?.trim()

  if (!translated) {
    const detail = body.responseDetails?.trim()
    throw new Error(detail || 'Could not translate this text right now.')
  }

  return translated
}

export async function translateToSpanish(text: string): Promise<string> {
  return translateText(text, 'en|es')
}

export async function translateToEnglish(text: string): Promise<string> {
  return translateText(text, 'es|en')
}
