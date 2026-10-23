import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { calculateCartTotals } from '@/lib/eth'
import { queryKeys } from '@/lib/query-keys'
import { useIsAuthenticated } from '@/lib/session'
import { cartService } from '@/services/cart.service'
import type { CartResponse } from '@/types/api'
import type { CartItem, NFT } from '@/types/models'

export const cartQueryOptions = queryOptions({
  queryKey: queryKeys.cart.all,
  queryFn: cartService.getCart,
  staleTime: 30_000,
})

export function useCart() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    ...cartQueryOptions,
    enabled: isAuthenticated,
  })
}

function recalculateOptimisticCart(cart: CartResponse, nextItems: CartItem[]): CartResponse {
  const totalItems = nextItems.reduce((sum, item) => sum + item.quantity, 0)
  const discountPercent = nextItems.length > 0 ? cart.discountPercent : 0
  const couponCode = nextItems.length > 0 ? cart.couponCode : null
  const totals = calculateCartTotals(nextItems, discountPercent)

  return {
    items: nextItems,
    totalItems,
    couponCode,
    discountPercent,
    ...totals,
  }
}

export interface AddToCartInput {
  nft: NFT
  quantity?: number
}

/**
 * Adiciona um NFT ao carrinho com Optimistic Update completo:
 * - onMutate: cancela queries, faz snapshot do carrinho, injeta o item e recalcula Subtotal/Desconto/Taxa/Total em ETH via Decimal
 * - onError: faz rollback para o snapshot anterior e dispara toast.error
 * - onSettled: invalida a query do carrinho para sincronizar com o MSW
 */
export function useAddToCart() {
  const queryClient = useQueryClient()
  const key = queryKeys.cart.all

  return useMutation({
    mutationFn: ({ nft, quantity = 1 }: AddToCartInput) =>
      cartService.addItem({ nftId: nft.id, quantity }),
    onMutate: async ({ nft, quantity = 1 }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<CartResponse>(key)

      if (previous) {
        const existingIndex = previous.items.findIndex((i) => i.nftId === nft.id)
        const nextItems = [...previous.items]

        if (existingIndex >= 0) {
          const current = nextItems[existingIndex]
          nextItems[existingIndex] = {
            ...current,
            quantity: Math.min(10, current.quantity + quantity),
          }
        } else {
          nextItems.push({
            id: `optimistic-${nft.id}`,
            userId: 'current',
            nftId: nft.id,
            name: nft.name,
            imageUrl: nft.imageUrl,
            collection: nft.collection,
            creatorName: nft.creatorName,
            priceEth: nft.priceEth,
            quantity,
            addedAt: new Date().toISOString(),
          })
        }

        queryClient.setQueryData<CartResponse>(key, recalculateOptimisticCart(previous, nextItems))
      }

      return { previous }
    },
    onSuccess: (data, { nft }) => {
      queryClient.setQueryData(key, data)
      toast.success(`"${nft.name}" adicionado ao carrinho.`)
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/**
 * Altera a quantidade de um item do carrinho com Optimistic Update e recálculo imediato em ETH.
 */
export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()
  const key = queryKeys.cart.all

  return useMutation({
    mutationFn: cartService.updateItemQuantity,
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<CartResponse>(key)

      if (previous) {
        const nextItems =
          quantity <= 0
            ? previous.items.filter((i) => i.id !== itemId)
            : previous.items.map((i) =>
                i.id === itemId ? { ...i, quantity: Math.min(10, quantity) } : i,
              )

        queryClient.setQueryData<CartResponse>(key, recalculateOptimisticCart(previous, nextItems))
      }

      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/**
 * Remove um item do carrinho com Optimistic Update, rollback em erro e sincronização em onSettled.
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const key = queryKeys.cart.all

  return useMutation({
    mutationFn: cartService.removeItem,
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<CartResponse>(key)

      if (previous) {
        const nextItems = previous.items.filter((i) => i.id !== itemId)
        queryClient.setQueryData<CartResponse>(key, recalculateOptimisticCart(previous, nextItems))
      }

      return { previous }
    },
    onSuccess: () => {
      toast.success('Item removido do carrinho.')
    },
    onError: (error, _itemId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export function useApplyCoupon() {
  const queryClient = useQueryClient()
  const key = queryKeys.cart.all

  return useMutation({
    mutationFn: cartService.applyCoupon,
    onSuccess: (data) => {
      queryClient.setQueryData(key, data)
      toast.success(`Cupom ${data.couponCode} (${data.discountPercent}% OFF) aplicado!`)
    },
  })
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient()
  const key = queryKeys.cart.all

  return useMutation({
    mutationFn: cartService.removeCoupon,
    onSuccess: (data) => {
      queryClient.setQueryData(key, data)
      toast.success('Cupom removido.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
