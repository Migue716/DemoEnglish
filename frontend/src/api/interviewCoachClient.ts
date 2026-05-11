import { getApiBase } from './apiOrigin'

export class InterviewSummaryError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'InterviewSummaryError'
    this.status = status
  }
}

export async function fetchInterviewSummary(transcript: string): Promise<string> {
  const trimmed = transcript.trim()
  const response = await fetch(`${getApiBase().replace(/\/+$/, '')}/api/interview/summary`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript: trimmed }),
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: string; title?: string }
      detail = body.detail ?? body.title ?? detail
    } catch {
      /* ignore */
    }
    throw new InterviewSummaryError(detail, response.status)
  }

  const body = (await response.json()) as { summary?: string }
  const summary = body.summary?.trim()
  if (!summary) {
    throw new InterviewSummaryError('Empty summary from server.', response.status)
  }
  return summary
}
