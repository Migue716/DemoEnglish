/**
 * Web Speech API (recognition) availability. Safari on iOS does not expose in-page recognition;
 * plain HTTP on a LAN IP is not a secure context, so recognition is disabled there too.
 */

interface SpeechRecAlternative {
  transcript: string
}
interface SpeechRecResult {
  readonly isFinal: boolean
  readonly 0: SpeechRecAlternative
}
interface SpeechRecResultList {
  readonly length: number
  [index: number]: SpeechRecResult
}
export interface SpeechRecResultEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecResultList
}
export interface SpeechRecErrorEvent extends Event {
  readonly error: string
  readonly message: string
}
export interface WebSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((this: WebSpeechRecognition, ev: SpeechRecResultEvent) => void) | null
  onerror: ((this: WebSpeechRecognition, ev: SpeechRecErrorEvent) => void) | null
  onend: ((this: WebSpeechRecognition, ev: Event) => void) | null
}
export type WebSpeechRecognitionCtor = new () => WebSpeechRecognition

export function isIosLikeClient(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipod|ipad/i.test(navigator.userAgent)
}

/** Returns the SpeechRecognition constructor, or null if the environment cannot use it. */
export function getSpeechRecognitionCtor(): WebSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  if (!window.isSecureContext) return null
  const w = window as typeof window & {
    SpeechRecognition?: WebSpeechRecognitionCtor
    webkitSpeechRecognition?: WebSpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** User-facing explanation when in-page dictation is unavailable. */
export function dictationUnavailableExplanation(): string {
  if (typeof window === 'undefined') {
    return 'Speech-to-text is not available in this browser.'
  }
  if (isIosLikeClient()) {
    return 'Safari on iPhone and iPad does not support in-page dictation. Tap the microphone on the iOS keyboard (next to the space bar) to dictate into the text box below, or type. Word check still works.'
  }
  if (!window.isSecureContext) {
    return 'This page is not using a secure connection (HTTPS or localhost). Browser dictation is disabled here. Use the text box with the iOS keyboard dictation, type manually, or open the site over HTTPS from your computer.'
  }
  return 'Speech-to-text is not available in this browser. Try Chrome or Edge on HTTPS or localhost—or type in the box below.'
}
