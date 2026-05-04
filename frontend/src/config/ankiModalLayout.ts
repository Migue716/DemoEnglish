import type { CSSProperties } from 'react'

/**
 * Anki card detail modal size. Edit here or override with Vite env (see `vite-env.d.ts`).
 * Use any valid CSS length: rem, px, vw, min(), max(), clamp(), etc.
 */
const defaults = {
  /** Panel max width (e.g. cap with min(..., 96vw) for small screens). */
  maxWidth: 'min(66.15rem, 96vw)',
  /** Second value inside maxHeight = min(viewportCap, maxHeight). */
  maxHeight: '63rem',
  /** First value inside min(...) for max-height (viewport-relative). */
  maxHeightViewport: '92dvh',
} as const

function pick(envVal: string | undefined, fallback: string): string {
  const v = envVal?.trim()
  return v && v.length > 0 ? v : fallback
}

export const ankiModalLayout = {
  maxWidth: pick(import.meta.env.VITE_ANKI_MODAL_MAX_WIDTH, defaults.maxWidth),
  maxHeight: pick(import.meta.env.VITE_ANKI_MODAL_MAX_HEIGHT, defaults.maxHeight),
  maxHeightViewport: pick(import.meta.env.VITE_ANKI_MODAL_MAX_HEIGHT_VP, defaults.maxHeightViewport),
} as const

export function ankiModalPanelStyle(): CSSProperties {
  return {
    maxWidth: ankiModalLayout.maxWidth,
    maxHeight: `min(${ankiModalLayout.maxHeightViewport}, ${ankiModalLayout.maxHeight})`,
  }
}
