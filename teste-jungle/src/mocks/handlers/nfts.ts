import Decimal from 'decimal.js'
import { http, HttpResponse, type HttpHandler } from 'msw'
import { compareEth, isValidEthString } from '@/lib/eth'
import type { PaginatedNftsResponse, ToggleFavoriteResponse } from '@/types/api'
import type { NftCategory, NftSortBy } from '@/types/models'
import { db } from '../db'
import { errorResponse, simulateNetwork } from '../network'

export const nftHandlers: HttpHandler[] = [
  http.get('/api/nfts', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
    const category = url.searchParams.get('category') as NftCategory | null
    const collection = url.searchParams.get('collection')?.trim() ?? ''
    const minPrice = url.searchParams.get('minPrice')?.trim() ?? ''
    const maxPrice = url.searchParams.get('maxPrice')?.trim() ?? ''
    const onlyAvailable = url.searchParams.get('onlyAvailable') === 'true'
    const onlyFavorites = url.searchParams.get('onlyFavorites') === 'true'
    const sort = (url.searchParams.get('sort') as NftSortBy | null) ?? 'recent'
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(24, Math.max(4, Number.parseInt(url.searchParams.get('pageSize') ?? '8', 10) || 8))

    const collections = Array.from(new Set(db.nfts.map((n) => n.collection))).sort()

    const minDecimal = minPrice && isValidEthString(minPrice) ? new Decimal(minPrice) : null
    const maxDecimal = maxPrice && isValidEthString(maxPrice) ? new Decimal(maxPrice) : null

    const filtered = db.nfts.filter((nft) => {
      if (q) {
        const matchesQuery =
          nft.name.toLowerCase().includes(q) ||
          nft.description.toLowerCase().includes(q) ||
          nft.collection.toLowerCase().includes(q) ||
          nft.creatorName.toLowerCase().includes(q)
        if (!matchesQuery) return false
      }
      if (category && nft.category !== category) return false
      if (collection && nft.collection !== collection) return false
      if (onlyAvailable && !nft.available) return false
      if (onlyFavorites && !nft.isFavorited) return false

      if (minDecimal || maxDecimal) {
        const price = new Decimal(nft.priceEth)
        if (minDecimal && price.lt(minDecimal)) return false
        if (maxDecimal && price.gt(maxDecimal)) return false
      }
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return compareEth(a.priceEth, b.priceEth)
        case 'price_desc':
          return compareEth(b.priceEth, a.priceEth)
        case 'popular':
          return b.likes - a.likes
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    const total = sorted.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const items = sorted.slice(start, start + pageSize)

    const body: PaginatedNftsResponse = {
      items,
      total,
      page: safePage,
      pageSize,
      totalPages,
      collections,
    }
    return HttpResponse.json(body)
  }),

  http.get('/api/nfts/:nftId', async ({ params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const nft = db.nfts.find((n) => n.id === params.nftId)
    if (!nft) return errorResponse('NFT não encontrado.', 404, 'NFT_NOT_FOUND')
    return HttpResponse.json(nft)
  }),

  http.post('/api/nfts/:nftId/favorite', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const forceError500 =
      request.headers.get('x-msw-force-error') === '500' ||
      (typeof window !== 'undefined' && Boolean(window.__MSW_TEST_CONFIG__?.failNextFavoriteWith500))

    if (forceError500) {
      if (typeof window !== 'undefined' && window.__MSW_TEST_CONFIG__) {
        window.__MSW_TEST_CONFIG__.failNextFavoriteWith500 = false
      }
      return errorResponse(
        'Falha interna no servidor ao atualizar favorito (500).',
        500,
        'FAVORITE_SERVER_ERROR',
      )
    }

    const nft = db.nfts.find((n) => n.id === params.nftId)
    if (!nft) return errorResponse('NFT não encontrado.', 404, 'NFT_NOT_FOUND')

    nft.isFavorited = !nft.isFavorited
    nft.likes = Math.max(0, nft.likes + (nft.isFavorited ? 1 : -1))
    db.save()

    const body: ToggleFavoriteResponse = {
      id: nft.id,
      likes: nft.likes,
      isFavorited: nft.isFavorited,
    }
    return HttpResponse.json(body)
  }),
]
