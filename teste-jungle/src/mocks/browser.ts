import { delay, http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { db } from './db'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

declare global {
  interface Window {
    __MSW_WORKER__?: typeof worker
    __MSW_HTTP__?: {
      http: typeof http
      HttpResponse: typeof HttpResponse
      delay: typeof delay
    }
    __MSW_DB__?: typeof db
  }
}

if (typeof window !== 'undefined') {
  window.__MSW_WORKER__ = worker
  window.__MSW_HTTP__ = { http, HttpResponse, delay }
  window.__MSW_DB__ = db
}
