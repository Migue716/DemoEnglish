/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Dev/preview: fetch this URL on load to import an .apkg (served by Vite from `DEMOENGLISH_PRELOAD_APKG_PATH`). */
  readonly VITE_PRELOAD_APKG_URL?: string
  /** Max width of Anki card modal (CSS), e.g. `min(80rem, 96vw)` */
  readonly VITE_ANKI_MODAL_MAX_WIDTH?: string
  /** Max height cap (CSS), second arg to `min(92dvh, …)` */
  readonly VITE_ANKI_MODAL_MAX_HEIGHT?: string
  /** Viewport cap for modal max-height, e.g. `92dvh` */
  readonly VITE_ANKI_MODAL_MAX_HEIGHT_VP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
