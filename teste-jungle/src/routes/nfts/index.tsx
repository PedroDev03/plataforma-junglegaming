import { createFileRoute } from '@tanstack/react-router'
import { NftCatalog } from '@/components/nft/nft-catalog'
import { nftsListQueryOptions } from '@/hooks/use-nfts'
import { DEFAULT_PAGE_SIZE, nftCatalogSearchSchema, type NftCatalogSearch } from '@/schemas/nft-search'

export const Route = createFileRoute('/nfts/')({
  validateSearch: nftCatalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(nftsListQueryOptions(deps))
  },
  component: NftsCatalogPage,
})

function NftsCatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleFilterChange = (updates: Partial<Omit<NftCatalogSearch, 'page'>>) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
        page: 1,
      }),
    })
  }

  const handlePageChange = (nextPage: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: nextPage,
      }),
    })
  }

  const handleResetFilters = () => {
    void navigate({
      search: {
        sort: 'recent',
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      },
    })
  }

  return (
    <NftCatalog
      search={search}
      onFilterChange={handleFilterChange}
      onPageChange={handlePageChange}
      onResetFilters={handleResetFilters}
    />
  )
}
