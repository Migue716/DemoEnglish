/** Strips trailing slashes and any `/swagger` path so a pasted Swagger UI URL still resolves to the API origin. */
export function normalizeApiOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  const idx = trimmed.toLowerCase().indexOf('/swagger')
  return idx === -1 ? trimmed : trimmed.slice(0, idx).replace(/\/+$/, '')
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ? normalizeApiOrigin(import.meta.env.VITE_API_BASE_URL) : ''

export function getApiBase(): string {
  if (!baseUrl) {
    console.warn('VITE_API_BASE_URL is not set; defaulting to https://localhost:7282')
    return 'https://localhost:7282'
  }
  return baseUrl
}
