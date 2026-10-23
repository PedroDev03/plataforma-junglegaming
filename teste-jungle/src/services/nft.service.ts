import { api } from '@/lib/api'
import type { NftListParams, PaginatedNftsResponse, ToggleFavoriteResponse } from '@/types/api'
import type { NFT } from '@/types/models'

export const nftService = {
  list: async (params: NftListParams): Promise<PaginatedNftsResponse> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
    )
    const { data } = await api.get<PaginatedNftsResponse>('/nfts', { params: cleanParams })
    return data
  },
  getById: async (nftId: string): Promise<NFT> => {
    const { data } = await api.get<NFT>(`/nfts/${nftId}`)
    return data
  },
  toggleFavorite: async (nftId: string): Promise<ToggleFavoriteResponse> => {
    const { data } = await api.post<ToggleFavoriteResponse>(`/nfts/${nftId}/favorite`)
    return data
  },
}
