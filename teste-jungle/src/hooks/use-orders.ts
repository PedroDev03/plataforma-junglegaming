import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { orderService } from '@/services/order.service'

export const orderDetailQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => orderService.getOrderById(orderId),
    // Recibo é um snapshot estático imutável
    staleTime: Number.POSITIVE_INFINITY,
  })

export const ordersListQueryOptions = queryOptions({
  queryKey: queryKeys.orders.list(),
  queryFn: orderService.listOrders,
  staleTime: 30_000,
})

export function useSuspenseOrder(orderId: string) {
  return useSuspenseQuery(orderDetailQueryOptions(orderId))
}

export function useGetOrders() {
  return useQuery(ordersListQueryOptions)
}

export function useValidateCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderService.validateCheckout,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.cart.all, result.cart)
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: orderService.createOrder,
    // Desabilita retry automático para expor o controle explícito de reenvio idempotente na UI
    retry: 0,
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order)
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}
