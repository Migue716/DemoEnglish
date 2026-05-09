import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import { defineConfig } from 'vite'
import { INNERTUBE_ANDROID_UA } from './src/lib/youtubeInnertubeClient'

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/__yt__': youtubeProxy() } },
  preview: { proxy: { '/__yt__': youtubeProxy() } },
})
