import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
  type QueryKey,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { nftService } from '@/services/nft.service'
import type { NftListParams, PaginatedNftsResponse } from '@/types/api'
import type { NFT } from '@/types/models'

export const nftsListQueryOptions = (params: NftListParams) =>
  queryOptions({
    queryKey: queryKeys.nfts.list(params),
    queryFn: () => nftService.list(params),
    staleTime: 30_000,
  })

export const nftDetailQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: queryKeys.nfts.detail(nftId),
    queryFn: () => nftService.getById(nftId),
    staleTime: 30_000,
  })

export function useGetNFTs(params: NftListParams) {
  return useQuery(nftsListQueryOptions(params))
}

export function useGetNFT(nftId: string) {
  return useQuery(nftDetailQueryOptions(nftId))
}

export function useSuspenseNFT(nftId: string) {
  return useSuspenseQuery(nftDetailQueryOptions(nftId))
}

interface FavoriteMutationContext {
  previousLists: Array<[QueryKey, PaginatedNftsResponse | undefined]>
  previousDetail: NFT | undefined
}

function toggleNftItem(nft: NFT): NFT {
  const nextFavorited = !nft.isFavorited
  return {
    ...nft,
    isFavorited: nextFavorited,
    likes: Math.max(0, nft.likes + (nextFavorited ? 1 : -1)),
  }
}

/**
 * Mutação para favoritar/desfavoritar um NFT com Optimistic Update completo:
 * - onMutate: cancela queries, salva snapshot de listas e detalhe, injeta estado otimista
 * - onError: restaura snapshots (rollback) e notifica via Toast
 * - onSettled: invalida queries para ressincronizar com o MSW
 */
export function useToggleFavoriteNFT() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nftId: string) => nftService.toggleFavorite(nftId),
    onMutate: async (nftId: string): Promise<FavoriteMutationContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.nfts.all })

      const previousLists = queryClient.getQueriesData<PaginatedNftsResponse>({
        queryKey: queryKeys.nfts.lists(),
      })
      const detailKey = queryKeys.nfts.detail(nftId)
      const previousDetail = queryClient.getQueryData<NFT>(detailKey)

      queryClient.setQueriesData<PaginatedNftsResponse>(
        { queryKey: queryKeys.nfts.lists() },
        (old) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((item) => (item.id === nftId ? toggleNftItem(item) : item)),
          }
        },
      )

      if (previousDetail) {
        queryClient.setQueryData<NFT>(detailKey, toggleNftItem(previousDetail))
      }

      return { previousLists, previousDetail }
    },
    onError: (error, nftId, context) => {
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          queryClient.setQueryData(key, data)
        }
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.nfts.detail(nftId), context.previousDetail)
      }
      toast.error(getErrorMessage(error))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all })
    },
  })
}
