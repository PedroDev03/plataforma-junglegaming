import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SocketContext, type SocketConnectionStatus } from '@/hooks/use-socket'
import { formatEth } from '@/lib/eth'
import { queryKeys } from '@/lib/query-keys'
import { socket } from '@/lib/socket'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types/models'

export function SocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SocketConnectionStatus>('connecting')
  const [latestNftUpdate, setLatestNftUpdate] = useState<NftUpdatedEvent | null>(null)
  const wasDisconnectedRef = useRef(false)

  useEffect(() => {
    const handleConnect = () => {
      setStatus('connected')
      // Regra 4: Se o socket cair e voltar, invalida todas as consultas ativas automaticamente
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false
        void queryClient.invalidateQueries({ refetchType: 'active' })
        toast.success('Conexão em tempo real restabelecida. Consultas ativas atualizadas.')
      }
    }

    const handleDisconnect = () => {
      wasDisconnectedRef.current = true
      setStatus('disconnected')
      toast.warning('Conexão em tempo real interrompida. Tentando reconectar...')
    }

    const handleReconnect = () => {
      wasDisconnectedRef.current = false
      setStatus('connected')
      void queryClient.invalidateQueries({ refetchType: 'active' })
    }

    /**
     * Regra 3 (Sincronização em Tempo Real):
     * NÃO altera o cache diretamente. Dispara `queryClient.invalidateQueries({ queryKey: ['nfts'] })`.
     */
    const handleNftUpdated = (payload: NftUpdatedEvent) => {
      setLatestNftUpdate(payload)
      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all })

      toast.info(
        `Preço atualizado em tempo real: "${payload.name}" passou de ${formatEth(payload.oldPriceEth)} ETH para ${formatEth(payload.newPriceEth)} ETH.`,
      )
    }

    const handleOrderUpdated = (payload: OrderUpdatedEvent) => {
      void payload
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect', handleReconnect)
    socket.on('nft.updated', handleNftUpdated)
    socket.on('order.updated', handleOrderUpdated)

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect', handleReconnect)
      socket.off('nft.updated', handleNftUpdated)
      socket.off('order.updated', handleOrderUpdated)
    }
  }, [queryClient])

  const clearLatestNftUpdate = useCallback(() => {
    setLatestNftUpdate(null)
  }, [])

  const triggerSimulatedNftUpdate = useCallback((nftId?: string) => {
    if (!socket.connected) {
      socket.connect()
    }
    socket.emit('simulation:trigger_nft_update', { nftId })
  }, [])

  const simulateSocketDrop = useCallback(() => {
    if (socket.connected) {
      socket.emit('simulation:drop_connection')
      // Reconecta após 1.2s caso o fechamento venha do mock server
      setTimeout(() => {
        if (!socket.connected) socket.connect()
      }, 1200)
    } else {
      socket.connect()
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        status,
        latestNftUpdate,
        clearLatestNftUpdate,
        triggerSimulatedNftUpdate,
        simulateSocketDrop,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
