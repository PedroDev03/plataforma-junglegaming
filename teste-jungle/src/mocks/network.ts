import { delay, HttpResponse } from 'msw'

declare global {
  interface Window {
    __MSW_TEST_CONFIG__?: {
      minDelayMs?: number
      maxDelayMs?: number
      networkErrorRate?: number
      failNextFavoriteWith500?: boolean
      orderDelayMs?: number
    }
  }
}

/** Configuração de caos/resiliência (ver state-routing-architecture §5). */
export const CHAOS = {
  minDelayMs: 500,
  maxDelayMs: 1500,
  /** Probabilidade de falha de rede aleatória (0 a 1). */
  networkErrorRate: 0.05,
}

/** Aplica latência variável e, eventualmente, falha de rede. Retorna Response de erro ou null. */
export async function simulateNetwork(): Promise<Response | null> {
  const testConfig = typeof window !== 'undefined' ? window.__MSW_TEST_CONFIG__ : undefined
  const minDelayMs = testConfig?.minDelayMs ?? CHAOS.minDelayMs
  const maxDelayMs = testConfig?.maxDelayMs ?? CHAOS.maxDelayMs
  const networkErrorRate = testConfig?.networkErrorRate ?? CHAOS.networkErrorRate

  const ms = minDelayMs + Math.random() * (maxDelayMs - minDelayMs)
  if (ms > 0) {
    await delay(ms)
  }
  if (networkErrorRate > 0 && Math.random() < networkErrorRate) {
    return HttpResponse.error()
  }
  return null
}

export function errorResponse(message: string, status: number, code?: string) {
  return HttpResponse.json({ message, code }, { status })
}
