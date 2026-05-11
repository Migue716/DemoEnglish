import { useCallback, useEffect, useRef, useState } from 'react'

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c
  }
  return undefined
}

export function browserAudioRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

/**
 * Records microphone audio in the browser (MediaRecorder) and exposes a blob URL for HTML audio playback.
 * Stays on the client; nothing is uploaded unless you add an endpoint later.
 */
export function useBrowserAudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)

  const urlRef = useRef<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const tickRef = useRef<number | null>(null)

  const assignUrl = useCallback((next: string | null) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    urlRef.current = next
    setAudioUrl(next)
  }, [])

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const stopTick = useCallback(() => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      try {
        mr.stop()
      } catch {
        /* noop */
      }
    } else {
      stopTick()
      stopTracks()
      mediaRecorderRef.current = null
      setRecording(false)
    }
  }, [stopTick, stopTracks])

  const clearRecording = useCallback(() => {
    assignUrl(null)
    setRecordError(null)
    setElapsedSec(0)
  }, [assignUrl])

  const startRecording = useCallback(async () => {
    setRecordError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordError('Recording is not supported in this environment.')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      setRecordError('MediaRecorder is not available in this browser.')
      return
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return
    }

    assignUrl(null)
    setElapsedSec(0)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Microphone access denied.'
          : e instanceof Error
            ? e.message
            : 'Could not access microphone.'
      setRecordError(msg)
      return
    }

    streamRef.current = stream
    chunksRef.current = []

    const mimeType = pickRecorderMimeType()
    const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data)
    }
    mr.onerror = () => {
      setRecordError('Recording was interrupted.')
    }
    mr.onstop = () => {
      stopTracks()
      mediaRecorderRef.current = null
      stopTick()
      setRecording(false)

      const parts = chunksRef.current
      chunksRef.current = []
      setElapsedSec(0)

      if (parts.length === 0) return

      const blobType = mr.mimeType && mr.mimeType.length > 0 ? mr.mimeType : 'audio/webm'
      const blob = new Blob(parts, { type: blobType })
      assignUrl(URL.createObjectURL(blob))
    }

    mediaRecorderRef.current = mr
    setRecording(true)
    tickRef.current = window.setInterval(() => {
      setElapsedSec((s) => s + 1)
    }, 1000)

    try {
      mr.start(250)
    } catch (e) {
      stopTick()
      stopTracks()
      mediaRecorderRef.current = null
      setRecording(false)
      setRecordError(e instanceof Error ? e.message : 'Could not start recording.')
    }
  }, [assignUrl, stopTick, stopTracks])

  useEffect(() => {
    return () => {
      stopTick()
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        try {
          mr.stop()
        } catch {
          /* noop */
        }
      }
      stopTracks()
      mediaRecorderRef.current = null
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [stopTick, stopTracks])

  return {
    recording,
    audioUrl,
    recordError,
    elapsedSec,
    startRecording,
    stopRecording,
    clearRecording,
  }
}
