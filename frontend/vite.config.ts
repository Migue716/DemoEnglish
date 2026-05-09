import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import { INNERTUBE_ANDROID_UA } from './src/lib/youtubeInnertubeClient'
import { createPreloadApkgMiddleware } from './vite-preload-apkg-middleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** YouTube rejects InnerTube/timedtext if the outbound request looks like a bare browser fetch. */
function youtubeProxy(): ProxyOptions {
  return {
    target: 'https://www.youtube.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/__yt__/, ''),
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('User-Agent', INNERTUBE_ANDROID_UA)
        proxyReq.setHeader('Origin', 'https://www.youtube.com')
        proxyReq.setHeader('Referer', 'https://www.youtube.com/')
      })
    },
  }
}

/** Runs before Vite’s HTML middleware so `/__preload-demo-apkg` returns the binary .apkg, not `index.html`. */
function preloadApkgVitePlugin(diskPath: string | undefined): Plugin {
  const mw = createPreloadApkgMiddleware(diskPath)
  return {
    name: 'demoenglish-preload-apkg',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(mw)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mw)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const preloadDiskPath = env.DEMOENGLISH_PRELOAD_APKG_PATH

  return {
    plugins: [preloadApkgVitePlugin(preloadDiskPath), react(), tailwindcss()],
    /** Listen on all interfaces so phones on the same Wi‑Fi can open http://<PC-LAN-IP>:5173 */
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: { '/__yt__': youtubeProxy() },
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
      proxy: { '/__yt__': youtubeProxy() },
    },
  }
})
