import { createContext, useContext } from 'react'
import type { NftUpdatedEvent } from '@/types/models'

export type SocketConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface SocketContextValue {
  status: SocketConnectionStatus
  latestNftUpdate: NftUpdatedEvent | null
  clearLatestNftUpdate: () => void
  triggerSimulatedNftUpdate: (nftId?: string) => void
  simulateSocketDrop: () => void
}

export const SocketContext = createContext<SocketContextValue | null>(null)

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext)
  if (!ctx) {
    throw new Error('useSocket deve ser utilizado dentro de um <SocketProvider />.')
  }
  return ctx
}
