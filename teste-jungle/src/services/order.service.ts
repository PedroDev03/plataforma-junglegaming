import { api } from '@/lib/api'
import type { CreateOrderRequest, ValidateCheckoutResponse } from '@/types/api'
import type { Order } from '@/types/models'

export interface CreateOrderVariables {
  payload: CreateOrderRequest
  timeoutMs?: number
}

export const orderService = {
  validateCheckout: async (): Promise<ValidateCheckoutResponse> => {
    const { data } = await api.post<ValidateCheckoutResponse>('/checkout/validate')
    return data
  },
  createOrder: async ({ payload, timeoutMs = 15_000 }: CreateOrderVariables): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', payload, {
      timeout: timeoutMs,
      headers: {
        'x-idempotency-key': payload.idempotencyKey,
      },
    })
    return data
  },
  listOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders')
    return data
  },
  getOrderById: async (orderId: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${orderId}`)
    return data
  },
}
