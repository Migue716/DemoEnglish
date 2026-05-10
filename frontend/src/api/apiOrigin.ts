/** Strips trailing slashes and any `/swagger` path so a pasted Swagger UI URL still resolves to the API origin. */
export function normalizeApiOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  const idx = trimmed.toLowerCase().indexOf('/swagger')
  return idx === -1 ? trimmed : trimmed.slice(0, idx).replace(/\/+$/, '')
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ? normalizeApiOrigin(import.meta.env.VITE_API_BASE_URL) : ''

const LAN_API_HTTP_PORT = Number(import.meta.env.VITE_LAN_API_HTTP_PORT) || 5183

function isIosLikeUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipod|ipad/i.test(navigator.userAgent)
}

/** RFC1918-style IPv4 host (rough) — SPA opened as http://192.168.x.x:5173 from any device on LAN. */
function isPrivateLanIpv4Hostname(hostname: string): boolean {
  return /^(192\.168\.(\d{1,3})\.(\d{1,3})|10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})|172\.(1[6-9]|2\d|3[01])\.(\d{1,3})\.(\d{1,3}))$/i.test(
    hostname,
  )
}

function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'
}

let loggedLanApiBase: string | null = null

/**
 * API origin for fetches. In dev, if the SPA is opened as `http://<LAN-IP>:5173` (not localhost),
 * uses `http://<same-host>:5183` so phones reach Kestrel. Triggers on iOS UA **or** private IPv4
 * host (covers “Request Desktop Website” where “iPhone” disappears from the UA).
 */
/** Full Swagger UI URL on the same origin as `getApiBase()` (dev: `http://<host>:5183/swagger`). */
export function getApiSwaggerUrl(): string {
  return `${getApiBase().replace(/\/+$/, '')}/swagger`
}

/** Dev + iPhone/iPad/iPod + SPA not on localhost → show link to LAN Swagger (same host as the page, port 5183). */
export function shouldShowIosDevSwaggerLink(): boolean {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return false
  if (!isIosLikeUserAgent()) return false
  return !isLocalHostname(window.location.hostname)
}

export function getApiBase(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const useLanHttpApi =
    typeof window !== 'undefined' &&
    import.meta.env.DEV &&
    !isLocalHostname(hostname) &&
    (isIosLikeUserAgent() || isPrivateLanIpv4Hostname(hostname))

  if (useLanHttpApi) {
    const origin = `http://${hostname}:${LAN_API_HTTP_PORT}`
    if (import.meta.env.DEV && loggedLanApiBase !== origin) {
      loggedLanApiBase = origin
      console.info(`[DemoEnglish] API base (LAN dev): ${origin}`)
    }
    return origin
  }

  if (!baseUrl) {
    console.warn('VITE_API_BASE_URL is not set; defaulting to https://localhost:7282')
    return 'https://localhost:7282'
  }
  return baseUrl
}
