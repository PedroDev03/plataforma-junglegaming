import { toSocketIo } from '@mswjs/socket.io-binding'
import Decimal from 'decimal.js'
import { ws } from 'msw'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types/models'
import { db } from '../db'

const socketLink = ws.link(/socket\.io/)

type SocketIoClientEmitter = ReturnType<typeof toSocketIo>['client']
const activeClients = new Set<SocketIoClientEmitter>()

const PRICE_DELTAS = ['0.15', '-0.10', '0.25', '-0.05', '0.18'] as const

function mutateNftPrice(targetNftId?: string): NftUpdatedEvent | null {
  if (db.nfts.length === 0) return null

  const nft =
    (targetNftId ? db.nfts.find((n) => n.id === targetNftId) : undefined) ??
    db.nfts[Math.floor(Math.random() * db.nfts.length)]

  if (!nft) return null

  const oldPriceEth = nft.priceEth
  const deltaStr = PRICE_DELTAS[Math.floor(Math.random() * PRICE_DELTAS.length)]
  const candidate = new Decimal(oldPriceEth).plus(new Decimal(deltaStr))
  const minEth = new Decimal('0.15')
  const nextDecimal = candidate.lt(minEth) ? new Decimal(oldPriceEth).plus('0.15') : candidate
  const newPriceEth = nextDecimal.toFixed(18)

  nft.priceEth = newPriceEth
  db.save()

  return {
    nftId: nft.id,
    name: nft.name,
    collection: nft.collection,
    oldPriceEth,
    newPriceEth,
    available: nft.available,
    updatedAt: new Date().toISOString(),
  }
}

export function broadcastNftUpdated(targetNftId?: string): NftUpdatedEvent | null {
  const payload = mutateNftPrice(targetNftId)
  if (!payload) return null
  for (const client of activeClients) {
    client.emit('nft.updated', payload)
  }
  return payload
}

export function broadcastOrderUpdated(payload: OrderUpdatedEvent): void {
  for (const client of activeClients) {
    client.emit('order.updated', payload)
  }
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    activeClients.add(io.client)

    // Responde ao ping ("2") do Engine.IO com pong ("3") para manter a sessão saudável
    connection.client.addEventListener('message', (event) => {
      if (event.data === '2') {
        connection.client.send('3')
      }
    })

    // Emissão aleatória periódica de `nft.updated` pelo MSW (entre 20s e 32s)
    let timerId: ReturnType<typeof setTimeout> | null = null
    const scheduleNextRandomUpdate = () => {
      const randomDelay = 20_000 + Math.floor(Math.random() * 12_000)
      timerId = setTimeout(() => {
        broadcastNftUpdated()
        scheduleNextRandomUpdate()
      }, randomDelay)
    }
    scheduleNextRandomUpdate()

    // Permite disparar atualização imediata (ex.: item do carrinho durante checkout)
    io.client.on('simulation:trigger_nft_update', (_event, data?: { nftId?: string }) => {
      broadcastNftUpdated(data?.nftId)
    })

    // Permite simular queda abrupta da conexão para testar reconexão e invalidação automática
    io.client.on('simulation:drop_connection', () => {
      connection.client.close()
    })

    connection.client.addEventListener('close', () => {
      activeClients.delete(io.client)
      if (timerId) clearTimeout(timerId)
    })
  }),
]
