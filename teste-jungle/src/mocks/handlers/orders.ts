import { delay, http, HttpResponse, type HttpHandler } from 'msw'
import {
  calculateCartTotals,
  compareEth,
  formatEth,
  multiplyEth,
  subtractEth,
} from '@/lib/eth'
import type { CreateOrderRequest, ValidateCheckoutResponse } from '@/types/api'
import type { Order, OrderItem } from '@/types/models'
import { db } from '../db'
import { errorResponse, simulateNetwork } from '../network'
import { getUserFromRequest } from './auth'
import { buildCartResponse, VALID_COUPONS } from './cart'
import { broadcastOrderUpdated } from './socket'

const unauthorized = () => errorResponse('Sessão expirada ou inválida.', 401, 'UNAUTHORIZED')

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export const orderHandlers: HttpHandler[] = [
  /**
   * Valida se preço, cupom e disponibilidade dos itens no carrinho continuam iguais.
   */
  http.post('/api/checkout/validate', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const userCartItems = db.cart.filter((i) => i.userId === user.id)
    const issues: string[] = []

    for (const item of userCartItems) {
      const nft = db.nfts.find((n) => n.id === item.nftId)
      if (!nft || !nft.available) {
        issues.push(`O NFT "${item.name}" não está mais disponível para compra.`)
        continue
      }
      if (compareEth(item.priceEth, nft.priceEth) !== 0) {
        issues.push(
          `O preço de "${item.name}" mudou de ${formatEth(item.priceEth)} ETH para ${formatEth(nft.priceEth)} ETH.`,
        )
        item.priceEth = nft.priceEth
      }
    }

    const activeCoupon = db.coupons[user.id]
    if (activeCoupon && !VALID_COUPONS[activeCoupon]) {
      issues.push(`O cupom "${activeCoupon}" expirou ou deixou de ser válido.`)
      delete db.coupons[user.id]
    }

    if (issues.length > 0) {
      db.save()
    }

    const body: ValidateCheckoutResponse = {
      valid: issues.length === 0,
      issues,
      cart: buildCartResponse(user.id),
    }
    return HttpResponse.json(body)
  }),

  /**
   * Cria um pedido com Idempotência (`x-idempotency-key`) e lentidão severa simulada.
   * Se o request anterior deu timeout no cliente após o processamento no servidor,
   * um reenvio com a mesma `x-idempotency-key` devolve o pedido já criado sem cobrar/duplicar.
   */
  http.post('/api/orders', async ({ request }) => {
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const body = (await request.json()) as CreateOrderRequest
    const headerKey = request.headers.get('x-idempotency-key')?.trim()
    const idempotencyKey = headerKey || body.idempotencyKey?.trim()

    if (!idempotencyKey) {
      return errorResponse(
        'Cabeçalho x-idempotency-key é obrigatório para transações de checkout.',
        400,
        'IDEMPOTENCY_KEY_REQUIRED',
      )
    }

    // 1. Verificação de Idempotência: se já processado, retorna o mesmo recibo sem cobrar novamente
    const existingOrder = db.orders.find(
      (o) => o.userId === user.id && o.idempotencyKey === idempotencyKey,
    )
    if (existingOrder) {
      await delay(650)
      return HttpResponse.json(existingOrder, { status: 200 })
    }

    // 2. Validação dos itens selecionados no carrinho
    const userCartItems = db.cart.filter((i) => i.userId === user.id)
    const selectedItems =
      body.itemIds && body.itemIds.length > 0
        ? userCartItems.filter((i) => body.itemIds.includes(i.id))
        : userCartItems

    if (selectedItems.length === 0) {
      return errorResponse(
        'Nenhum item selecionado no carrinho para finalizar o pedido.',
        422,
        'EMPTY_CHECKOUT',
      )
    }

    for (const item of selectedItems) {
      const nft = db.nfts.find((n) => n.id === item.nftId)
      if (!nft || !nft.available) {
        return errorResponse(
          `Disponibilidade alterada: "${item.name}" já não está disponível.`,
          409,
          'AVAILABILITY_CHANGED',
        )
      }
      if (compareEth(item.priceEth, nft.priceEth) !== 0) {
        item.priceEth = nft.priceEth
        db.save()
        return errorResponse(
          `Preço alterado: "${item.name}" agora custa ${formatEth(nft.priceEth)} ETH. Revise o checkout.`,
          409,
          'PRICE_CHANGED',
        )
      }
    }

    // 3. Validação do Cupom de Desconto
    const serverCoupon = db.coupons[user.id] ?? null
    if ((body.couponCode ?? null) !== serverCoupon) {
      return errorResponse(
        'O estado do cupom de desconto mudou. Atualize o resumo antes de confirmar.',
        409,
        'COUPON_CHANGED',
      )
    }
    const discountPercent = serverCoupon ? (VALID_COUPONS[serverCoupon] ?? 0) : 0
    if (serverCoupon && discountPercent === 0) {
      delete db.coupons[user.id]
      db.save()
      return errorResponse('O cupom informado não é mais válido.', 409, 'COUPON_INVALID')
    }

    // 4. Cálculo preciso em ETH via Decimal e verificação de saldo
    const totals = calculateCartTotals(selectedItems, discountPercent)
    if (compareEth(user.balanceEth, totals.totalEth) < 0) {
      return errorResponse(
        `Saldo insuficiente (${formatEth(user.balanceEth)} ETH) para o total de ${formatEth(totals.totalEth)} ETH.`,
        422,
        'INSUFFICIENT_FUNDS',
      )
    }

    const orderItems: OrderItem[] = selectedItems.map((item) => ({
      nftId: item.nftId,
      name: item.name,
      imageUrl: item.imageUrl,
      collection: item.collection,
      creatorName: item.creatorName,
      priceEth: item.priceEth,
      quantity: item.quantity,
      lineTotalEth: multiplyEth(item.priceEth, item.quantity),
    }))

    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      items: orderItems,
      walletAddress: body.walletAddress || user.wallets[0]?.address || `0x${randomHex(40)}`,
      couponCode: serverCoupon,
      discountPercent,
      ...totals,
      txHash: `0x${randomHex(64)}`,
      status: 'completed',
      idempotencyKey,
      createdAt: new Date().toISOString(),
    }

    // 5. Commit atômico: debita saldo, salva recibo estático e remove APENAS os itens comprados do carrinho
    user.balanceEth = subtractEth(user.balanceEth, totals.totalEth)
    db.orders.unshift(order)

    const purchasedIds = new Set(selectedItems.map((i) => i.id))
    const remainingCart = db.cart.filter(
      (i) => !(i.userId === user.id && purchasedIds.has(i.id)),
    )
    db.cart.splice(0, db.cart.length, ...remainingCart)

    const userStillHasItems = db.cart.some((i) => i.userId === user.id)
    if (!userStillHasItems) {
      delete db.coupons[user.id]
    }

    db.save()

    // 6. Simula lentidão severa no endpoint de pagamento (2800ms a 4200ms) ou configurável via MSW test config
    const customOrderDelay =
      typeof window !== 'undefined' ? window.__MSW_TEST_CONFIG__?.orderDelayMs : undefined
    const severeDelayMs =
      customOrderDelay !== undefined ? customOrderDelay : 2800 + Math.floor(Math.random() * 1400)
    await delay(severeDelayMs)

    broadcastOrderUpdated({
      orderId: order.id,
      status: order.status,
      totalEth: order.totalEth,
      updatedAt: order.createdAt,
    })

    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const userOrders = db.orders.filter((o) => o.userId === user.id)
    return HttpResponse.json(userOrders)
  }),

  http.get('/api/orders/:orderId', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const order = db.orders.find((o) => o.id === params.orderId && o.userId === user.id)
    if (!order) return errorResponse('Pedido não encontrado.', 404, 'ORDER_NOT_FOUND')
    return HttpResponse.json(order)
  }),
]
