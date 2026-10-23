import type { NftListParams } from '@/types/api'

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  nfts: {
    all: ['nfts'] as const,
    lists: () => [...queryKeys.nfts.all, 'list'] as const,
    list: (filters: Partial<NftListParams> = {}) =>
      [...queryKeys.nfts.lists(), filters] as const,
    details: () => [...queryKeys.nfts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.nfts.details(), id] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: () => [...queryKeys.orders.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
}
