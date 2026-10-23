import { http, HttpResponse, type HttpHandler } from 'msw'
import { calculateCartTotals } from '@/lib/eth'
import type {
  AddToCartRequest,
  ApplyCouponRequest,
  CartResponse,
  UpdateCartItemRequest,
} from '@/types/api'
import type { CartItem } from '@/types/models'
import { db } from '../db'
import { errorResponse, simulateNetwork } from '../network'
import { getUserFromRequest } from './auth'

export const VALID_COUPONS: Record<string, number> = {
  JUNGLE10: 10,
  WEB3VIP: 20,
  ETH5: 5,
}

const MAX_ITEM_QUANTITY = 10
const unauthorized = () => errorResponse('Sessão expirada ou inválida.', 401, 'UNAUTHORIZED')

export function buildCartResponse(userId: string): CartResponse {
  const items = db.cart.filter((item) => item.userId === userId)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const rawCode = items.length > 0 ? (db.coupons[userId] ?? null) : null
  const discountPercent = rawCode ? (VALID_COUPONS[rawCode] ?? 0) : 0
  const couponCode = discountPercent > 0 ? rawCode : null

  const totals = calculateCartTotals(items, discountPercent)

  return {
    items,
    totalItems,
    couponCode,
    discountPercent,
    ...totals,
  }
}

export const cartHandlers: HttpHandler[] = [
  http.get('/api/cart', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    return HttpResponse.json(buildCartResponse(user.id))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { nftId, quantity = 1 } = (await request.json()) as AddToCartRequest
    const nft = db.nfts.find((n) => n.id === nftId)
    if (!nft) return errorResponse('NFT não encontrado.', 404, 'NFT_NOT_FOUND')
    if (!nft.available) {
      return errorResponse('Este NFT já foi vendido e não está disponível.', 422, 'NFT_UNAVAILABLE')
    }

    const addQty = Math.max(1, Math.floor(quantity))
    const existing = db.cart.find((item) => item.userId === user.id && item.nftId === nftId)

    if (existing) {
      existing.quantity = Math.min(MAX_ITEM_QUANTITY, existing.quantity + addQty)
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        userId: user.id,
        nftId: nft.id,
        name: nft.name,
        imageUrl: nft.imageUrl,
        collection: nft.collection,
        creatorName: nft.creatorName,
        priceEth: nft.priceEth,
        quantity: Math.min(MAX_ITEM_QUANTITY, addQty),
        addedAt: new Date().toISOString(),
      }
      db.cart.push(newItem)
    }

    db.save()
    return HttpResponse.json(buildCartResponse(user.id), { status: 201 })
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { quantity } = (await request.json()) as UpdateCartItemRequest
    const index = db.cart.findIndex(
      (item) => item.id === params.itemId && item.userId === user.id,
    )
    if (index === -1) return errorResponse('Item não encontrado no carrinho.', 404, 'ITEM_NOT_FOUND')

    if (quantity <= 0) {
      db.cart.splice(index, 1)
    } else {
      db.cart[index].quantity = Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity))
    }

    db.save()
    return HttpResponse.json(buildCartResponse(user.id))
  }),

  http.delete('/api/cart/items/:itemId', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const index = db.cart.findIndex(
      (item) => item.id === params.itemId && item.userId === user.id,
    )
    if (index === -1) return errorResponse('Item não encontrado no carrinho.', 404, 'ITEM_NOT_FOUND')

    db.cart.splice(index, 1)
    db.save()
    return HttpResponse.json(buildCartResponse(user.id))
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { code } = (await request.json()) as ApplyCouponRequest
    const normalized = code.trim().toUpperCase()
    const discountPercent = VALID_COUPONS[normalized]

    if (!discountPercent) {
      return errorResponse(
        'Cupom inválido ou expirado. Experimente JUNGLE10 (10%), WEB3VIP (20%) ou ETH5 (5%).',
        422,
        'INVALID_COUPON',
      )
    }

    db.coupons[user.id] = normalized
    db.save()
    return HttpResponse.json(buildCartResponse(user.id))
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    delete db.coupons[user.id]
    db.save()
    return HttpResponse.json(buildCartResponse(user.id))
  }),
]
