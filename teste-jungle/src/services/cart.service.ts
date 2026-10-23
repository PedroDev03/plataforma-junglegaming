import { api } from '@/lib/api'
import type { AddToCartRequest, ApplyCouponRequest, CartResponse } from '@/types/api'

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const { data } = await api.get<CartResponse>('/cart')
    return data
  },
  addItem: async (payload: AddToCartRequest): Promise<CartResponse> => {
    const { data } = await api.post<CartResponse>('/cart/items', payload)
    return data
  },
  updateItemQuantity: async ({
    itemId,
    quantity,
  }: {
    itemId: string
    quantity: number
  }): Promise<CartResponse> => {
    const { data } = await api.patch<CartResponse>(`/cart/items/${itemId}`, { quantity })
    return data
  },
  removeItem: async (itemId: string): Promise<CartResponse> => {
    const { data } = await api.delete<CartResponse>(`/cart/items/${itemId}`)
    return data
  },
  applyCoupon: async (payload: ApplyCouponRequest): Promise<CartResponse> => {
    const { data } = await api.post<CartResponse>('/cart/coupon', payload)
    return data
  },
  removeCoupon: async (): Promise<CartResponse> => {
    const { data } = await api.delete<CartResponse>('/cart/coupon')
    return data
  },
}
