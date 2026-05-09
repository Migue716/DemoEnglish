import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'

/** Same path the app fetches in dev/preview when `VITE_PRELOAD_APKG_URL` is set. */
export const PRELOAD_APKG_ROUTE = '/__preload-demo-apkg'

/**
 * Serves a local .apkg from disk (browser cannot read `C:\...` directly).
 * Set `DEMOENGLISH_PRELOAD_APKG_PATH` in `.env.development`.
 */
export function createPreloadApkgMiddleware(diskPath: string | undefined) {
  return function preloadApkgMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) {
    const url = req.url?.split('?')[0] ?? ''
    if (req.method !== 'GET' || url !== PRELOAD_APKG_ROUTE) {
      next()
      return
    }

    if (!diskPath?.trim()) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Set DEMOENGLISH_PRELOAD_APKG_PATH in .env to an existing .apkg file.')
      return
    }

    const resolved = path.resolve(diskPath.trim())
    if (!fs.existsSync(resolved)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(`File not found: ${resolved}`)
      return
    }

    const name = path.basename(resolved)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`)

    const stream = fs.createReadStream(resolved)
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500)
      res.end()
    })
    stream.pipe(res)
  }
}
