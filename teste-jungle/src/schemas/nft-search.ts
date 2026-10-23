import { z } from 'zod'
import { isValidEthString } from '@/lib/eth'

export const NFT_CATEGORIES = ['art', 'music', 'photography', 'game', 'collectible'] as const
export const NFT_SORT_OPTIONS = ['recent', 'price_asc', 'price_desc', 'popular'] as const
export const DEFAULT_PAGE_SIZE = 8

export const CATEGORY_LABELS: Record<(typeof NFT_CATEGORIES)[number], string> = {
  art: 'Arte Digital',
  music: 'Música',
  photography: 'Fotografia',
  game: 'Gaming',
  collectible: 'Colecionáveis',
}

export const SORT_LABELS: Record<(typeof NFT_SORT_OPTIONS)[number], string> = {
  recent: 'Mais recentes',
  price_asc: 'Menor preço (ETH)',
  price_desc: 'Maior preço (ETH)',
  popular: 'Mais curtidos',
}

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((val) => (val.length > 0 ? val : undefined))
  .optional()
  .catch(undefined)

const optionalEthParam = z
  .string()
  .trim()
  .refine((val) => val === '' || isValidEthString(val))
  .transform((val) => (val.length > 0 ? val : undefined))
  .optional()
  .catch(undefined)

/**
 * Schema SSOT de Search Parameters para o catálogo de NFTs.
 * Usado em `validateSearch` do TanStack Router na Home (`/`) e em `/nfts/`.
 */
export const nftCatalogSearchSchema = z.object({
  q: optionalTrimmedString,
  category: z.enum(NFT_CATEGORIES).optional().catch(undefined),
  collection: optionalTrimmedString,
  minPrice: optionalEthParam,
  maxPrice: optionalEthParam,
  onlyAvailable: z.boolean().optional().catch(undefined),
  onlyFavorites: z.boolean().optional().catch(undefined),
  sort: z.enum(NFT_SORT_OPTIONS).default('recent').catch('recent'),
  page: z.coerce.number().int().positive().default(1).catch(1),
  pageSize: z.coerce.number().int().min(4).max(24).default(DEFAULT_PAGE_SIZE).catch(DEFAULT_PAGE_SIZE),
})

export type NftCatalogSearch = z.infer<typeof nftCatalogSearchSchema>
export type NftCatalogSearchInput = z.input<typeof nftCatalogSearchSchema>
