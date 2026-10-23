import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/api'
import { queryClient } from './query-client'
import { session } from './session'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Requisição: injeta o token da sessão simulada
api.interceptors.request.use((config) => {
  const token = session.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Resposta: 401 => logout local, limpa cache e redireciona para login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const isAuthCall = error.config?.url === '/login' || error.config?.url === '/register'
    if (error.response?.status === 401 && !isAuthCall) {
      session.clear()
      queryClient.clear()
      const redirect = window.location.pathname + window.location.search
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign(`/login?redirect=${encodeURIComponent(redirect)}`)
      }
    }
    return Promise.reject(error)
  },
)

export function isTimeoutError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout'))
  )
}

export function getErrorMessage(error: unknown): string {
  if (isTimeoutError(error)) {
    return 'A requisição excedeu o tempo limite (timeout). Reenvie com segurança usando a mesma chave de idempotência.'
  }
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? 'Erro de rede. Tente novamente.'
  }
  return error instanceof Error ? error.message : 'Erro inesperado.'
}
