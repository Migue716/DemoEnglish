/**
 * InnerTube ANDROID client identity. YouTube expects a matching User-Agent on
 * `/youtubei/v1/player` — browsers cannot set that header on fetch(), so the
 * Vite dev/preview proxy injects it (see vite.config.ts).
 */
export const INNERTUBE_ANDROID_VERSION = '20.10.38'

export const INNERTUBE_ANDROID_UA = `com.google.android.youtube/${INNERTUBE_ANDROID_VERSION} (Linux; U; Android 14)`

export const INNERTUBE_ANDROID_CONTEXT = {
  client: {
    clientName: 'ANDROID',
    clientVersion: INNERTUBE_ANDROID_VERSION,
  },
} as const
