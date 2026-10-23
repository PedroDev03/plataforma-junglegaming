import { AlertCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { NftCard } from '@/components/nft/nft-card'
import { NftCardSkeleton } from '@/components/nft/nft-card-skeleton'
import { NftFilters } from '@/components/nft/nft-filters'
import { NftPagination } from '@/components/nft/nft-pagination'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGetNFTs } from '@/hooks/use-nfts'
import { getErrorMessage } from '@/lib/api'
import type { NftCatalogSearch } from '@/schemas/nft-search'

interface NftCatalogProps {
  search: NftCatalogSearch
  onFilterChange: (updates: Partial<Omit<NftCatalogSearch, 'page'>>) => void
  onPageChange: (nextPage: number) => void
  onResetFilters: () => void
}

export function NftCatalog({
  search,
  onFilterChange,
  onPageChange,
  onResetFilters,
}: NftCatalogProps) {
  const { data, isLoading, isError, isSuccess, isFetching, error, refetch } = useGetNFTs(search)
  const lcpImageUrl = data?.items[0]?.imageUrl

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10 lg:px-8"
    >
      {/* Preload nativo da imagem LCP do catálogo (React 19 hoists para <head>) */}
      {lcpImageUrl && <link rel="preload" as="image" href={lcpImageUrl} fetchPriority="high" />}

      {/* Hero Section Mobile-First */}
      <Card className="bg-muted/35">
        <CardContent className="flex flex-col justify-between gap-4 py-2 sm:flex-row sm:items-center">
          <div className="grid max-w-2xl gap-2">
            <Badge variant="outline" className="w-fit gap-1.5 bg-background">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              <span>Curadoria Web3 Verificada</span>
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Explore Colecionáveis Digitais Raros
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Descubra, favorite e colecione obras exclusivas em ETH com precisão decimal garantida.
            </p>
          </div>

          {isFetching && !isLoading && (
            <Badge
              variant="secondary"
              role="status"
              aria-live="polite"
              className="gap-2 self-start px-3 py-1.5 sm:self-center"
            >
              <Loader2
                className="size-3.5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span>Sincronizando...</span>
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Filtros sincronizados com a URL */}
      <NftFilters
        search={search}
        collections={data?.collections ?? []}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
      />

      {/* Estado de Carregamento Inicial: Grid de Skeletons com Shimmer */}
      {isLoading && (
        <section
          aria-busy="true"
          aria-label="Carregando catálogo de NFTs"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: search.pageSize }, (_, idx) => (
            <NftCardSkeleton key={idx} />
          ))}
        </section>
      )}

      {/* Estado de Erro com Retry */}
      {isError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Falha ao carregar o catálogo</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Tentar novamente</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Estado de Sucesso */}
      {isSuccess && data && (
        <>
          {data.items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent
                aria-live="polite"
                className="flex flex-col items-center justify-center gap-3 py-12 text-center"
              >
                <p className="text-base font-medium">Nenhum NFT encontrado para estes filtros.</p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Experimente ajustar os intervalos de preço em ETH, trocar a categoria ou limpar a
                  busca.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <section
                aria-label="Lista de NFTs"
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {data.items.map((nft, index) => (
                  <NftCard key={nft.id} nft={nft} priority={index < 2} />
                ))}
              </section>

              <NftPagination
                page={data.page}
                totalPages={data.totalPages}
                totalItems={data.total}
                onPageChange={onPageChange}
              />
            </>
          )}
        </>
      )}
    </main>
  )
}
