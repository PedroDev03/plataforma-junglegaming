import { useSyncExternalStore } from 'react'

const TOKEN_KEY = 'nft-marketplace:token'

const listeners = new Set<() => void>()

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

export const session = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
    emitChange()
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    emitChange()
  },
  isAuthenticated: (): boolean => localStorage.getItem(TOKEN_KEY) !== null,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

/** Hook reativo que sincroniza componentes com mudanças no token de sessão em memória/localStorage. */
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(session.subscribe, session.isAuthenticated, () => false)
}
