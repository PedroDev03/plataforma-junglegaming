import { useId, useState, type FormEvent } from 'react'
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { isValidEthString } from '@/lib/eth'
import {
  CATEGORY_LABELS,
  NFT_CATEGORIES,
  NFT_SORT_OPTIONS,
  SORT_LABELS,
  type NftCatalogSearch,
} from '@/schemas/nft-search'
import type { NftCategory, NftSortBy } from '@/types/models'

const ALL_COLLECTIONS_VALUE = '__all__'

interface NftFiltersProps {
  search: NftCatalogSearch
  collections: string[]
  onFilterChange: (updates: Partial<Omit<NftCatalogSearch, 'page'>>) => void
  onResetFilters: () => void
}

/**
 * Painel semântico (`<aside>`) de busca, filtros combináveis e ordenação.
 * O estado de filtros reside 100% na URL (`search`). Apenas erros de formato de input local usam estado de validação A11y.
 */
export function NftFilters({
  search,
  collections,
  onFilterChange,
  onResetFilters,
}: NftFiltersProps) {
  const searchInputId = useId()
  const searchHintId = `${searchInputId}-hint`
  const minPriceId = useId()
  const minPriceDescId = `${minPriceId}-desc`
  const maxPriceId = useId()
  const maxPriceDescId = `${maxPriceId}-desc`
  const availableSwitchId = useId()
  const favoritesSwitchId = useId()

  const [priceErrors, setPriceErrors] = useState<{ min?: string; max?: string }>({})

  const hasActiveFilters = Boolean(
    search.q ||
      search.category ||
      search.collection ||
      search.minPrice ||
      search.maxPrice ||
      search.onlyAvailable ||
      search.onlyFavorites ||
      search.sort !== 'recent',
  )

  const handleSearchFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = (formData.get('q') as string | null)?.trim() || undefined
    const minPrice = (formData.get('minPrice') as string | null)?.trim() || undefined
    const maxPrice = (formData.get('maxPrice') as string | null)?.trim() || undefined

    const nextErrors: { min?: string; max?: string } = {}
    if (minPrice && !isValidEthString(minPrice)) {
      nextErrors.min = 'Informe um valor decimal em ETH válido (ex: 0.5).'
    }
    if (maxPrice && !isValidEthString(maxPrice)) {
      nextErrors.max = 'Informe um valor decimal em ETH válido (ex: 3.0).'
    }

    setPriceErrors(nextErrors)
    if (nextErrors.min || nextErrors.max) return

    onFilterChange({ q, minPrice, maxPrice })
  }

  return (
    <aside aria-label="Filtros e ordenação do catálogo">
      <Card>
        <CardContent className="grid gap-4">
          <form
            key={`${search.q ?? ''}|${search.minPrice ?? ''}|${search.maxPrice ?? ''}`}
            onSubmit={handleSearchFormSubmit}
            noValidate
            className="grid items-start gap-3 md:grid-cols-12"
          >
            <div className="grid gap-1.5 md:col-span-5">
              <Label htmlFor={searchInputId} className="text-xs">
                Buscar no catálogo
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id={searchInputId}
                  name="q"
                  type="search"
                  defaultValue={search.q ?? ''}
                  placeholder="Nome, coleção ou criador..."
                  aria-invalid={false}
                  aria-describedby={searchHintId}
                  className="pl-8"
                />
              </div>
              <span id={searchHintId} className="sr-only">
                Filtra NFTs por título, descrição, coleção ou nome do artista.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 md:col-span-5">
              <div className="grid gap-1.5">
                <Label htmlFor={minPriceId} className="text-xs">
                  Preço mín. (ETH)
                </Label>
                <Input
                  id={minPriceId}
                  name="minPrice"
                  inputMode="decimal"
                  defaultValue={search.minPrice ?? ''}
                  placeholder="Ex: 0.5"
                  aria-invalid={Boolean(priceErrors.min)}
                  aria-describedby={minPriceDescId}
                />
                {priceErrors.min ? (
                  <p id={minPriceDescId} role="alert" className="text-xs text-destructive">
                    {priceErrors.min}
                  </p>
                ) : (
                  <span id={minPriceDescId} className="sr-only">
                    Valor mínimo em ETH usando ponto decimal.
                  </span>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={maxPriceId} className="text-xs">
                  Preço máx. (ETH)
                </Label>
                <Input
                  id={maxPriceId}
                  name="maxPrice"
                  inputMode="decimal"
                  defaultValue={search.maxPrice ?? ''}
                  placeholder="Ex: 3.0"
                  aria-invalid={Boolean(priceErrors.max)}
                  aria-describedby={maxPriceDescId}
                />
                {priceErrors.max ? (
                  <p id={maxPriceDescId} role="alert" className="text-xs text-destructive">
                    {priceErrors.max}
                  </p>
                ) : (
                  <span id={maxPriceDescId} className="sr-only">
                    Valor máximo em ETH usando ponto decimal.
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 md:col-span-2 md:pt-5">
              <Button type="submit" className="w-full">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                <span>Aplicar</span>
              </Button>
            </div>
          </form>

          {/* Filtro rápido de Categorias */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por categoria"
          >
            <Button
              type="button"
              size="xs"
              variant={search.category === undefined ? 'default' : 'outline'}
              aria-pressed={search.category === undefined}
              onClick={() => onFilterChange({ category: undefined })}
            >
              Todas
            </Button>
            {NFT_CATEGORIES.map((cat: NftCategory) => {
              const isSelected = search.category === cat
              return (
                <Button
                  key={cat}
                  type="button"
                  size="xs"
                  variant={isSelected ? 'default' : 'outline'}
                  aria-pressed={isSelected}
                  onClick={() => onFilterChange({ category: isSelected ? undefined : cat })}
                >
                  {CATEGORY_LABELS[cat]}
                </Button>
              )
            })}
          </div>

          <Separator />

          {/* Linha de Coleção, Switches e Ordenação */}
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Coleção:</span>
                <Select
                  value={search.collection ?? ALL_COLLECTIONS_VALUE}
                  onValueChange={(value) =>
                    onFilterChange({
                      collection: !value || value === ALL_COLLECTIONS_VALUE ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger aria-label="Filtrar por coleção" className="min-w-44">
                    <SelectValue placeholder="Todas as coleções">
                      {search.collection ?? 'Todas as coleções'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_COLLECTIONS_VALUE}>Todas as coleções</SelectItem>
                    {collections.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={availableSwitchId}
                  checked={Boolean(search.onlyAvailable)}
                  onCheckedChange={(checked) =>
                    onFilterChange({ onlyAvailable: checked ? true : undefined })
                  }
                />
                <Label htmlFor={availableSwitchId} className="cursor-pointer text-xs">
                  Apenas disponíveis
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={favoritesSwitchId}
                  checked={Boolean(search.onlyFavorites)}
                  onCheckedChange={(checked) =>
                    onFilterChange({ onlyFavorites: checked ? true : undefined })
                  }
                />
                <Label htmlFor={favoritesSwitchId} className="cursor-pointer text-xs">
                  Meus favoritos
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Ordenar:</span>
                <Select
                  value={search.sort}
                  onValueChange={(value) => {
                    if (value) onFilterChange({ sort: value as NftSortBy })
                  }}
                >
                  <SelectTrigger aria-label="Ordenar catálogo" className="min-w-44">
                    <SelectValue>{SORT_LABELS[search.sort]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {NFT_SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {SORT_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPriceErrors({})
                    onResetFilters()
                  }}
                  aria-label="Limpar todos os filtros"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>Limpar</span>
                </Button>
              )}
            </div>
          </div>

          {/* Chips de filtros ativos para feedback transparente */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="Filtros ativos">
              <span className="text-xs text-muted-foreground">Ativos:</span>
              {search.q && (
                <Badge variant="secondary" className="gap-1">
                  <span className="max-w-36 truncate">Busca: &ldquo;{search.q}&rdquo;</span>
                  <button
                    type="button"
                    aria-label="Remover filtro de busca"
                    onClick={() => onFilterChange({ q: undefined })}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {search.category && (
                <Badge variant="secondary" className="gap-1">
                  <span>{CATEGORY_LABELS[search.category]}</span>
                  <button
                    type="button"
                    aria-label="Remover filtro de categoria"
                    onClick={() => onFilterChange({ category: undefined })}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {search.collection && (
                <Badge variant="secondary" className="gap-1">
                  <span className="max-w-36 truncate">{search.collection}</span>
                  <button
                    type="button"
                    aria-label="Remover filtro de coleção"
                    onClick={() => onFilterChange({ collection: undefined })}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {(search.minPrice || search.maxPrice) && (
                <Badge variant="secondary" className="gap-1 font-mono">
                  <span>
                    {search.minPrice ?? '0'} – {search.maxPrice ?? '∞'} ETH
                  </span>
                  <button
                    type="button"
                    aria-label="Remover filtro de faixa de preço"
                    onClick={() => onFilterChange({ minPrice: undefined, maxPrice: undefined })}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
