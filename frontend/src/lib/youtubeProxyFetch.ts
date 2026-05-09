/**
 * Routes youtube.com requests through the dev/preview Vite proxy (`/__yt__`) so
 * YouTube timedtext / InnerTube calls work in the browser (direct cross-origin calls often fail with "Failed to fetch").
 */
const YT_ORIGIN = 'https://www.youtube.com'

function proxyPrefix(): string {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  return `${base}/__yt__`
}

function toProxiedUrl(href: string): string | null {
  if (!href.startsWith(YT_ORIGIN)) return null
  return `${proxyPrefix()}${href.slice(YT_ORIGIN.length)}`
}

export function youtubeProxyFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (typeof input === 'string') {
    const proxied = toProxiedUrl(input)
    return proxied ? fetch(proxied, init) : fetch(input, init)
  }
  if (input instanceof URL) {
    const proxied = toProxiedUrl(input.href)
    return proxied ? fetch(proxied, init) : fetch(input, init)
  }
  const proxied = toProxiedUrl(input.url)
  if (proxied) {
    return fetch(new Request(proxied, input), init)
  }
  return fetch(input, init)
}
