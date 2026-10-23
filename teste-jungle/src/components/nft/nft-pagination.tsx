import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NftPaginationProps {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (nextPage: number) => void
}

export function NftPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: NftPaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
    >
      <p className="text-xs text-muted-foreground">
        Página <span className="font-semibold text-foreground">{page}</span> de{' '}
        <span className="font-semibold text-foreground">{totalPages}</span> ({totalItems} NFTs)
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {pages.map((pageNumber) => {
          const isCurrent = pageNumber === page
          return (
            <Button
              key={pageNumber}
              type="button"
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              aria-label={`Ir para a página ${pageNumber}`}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
              className="min-w-8 tabular-nums"
            >
              {pageNumber}
            </Button>
          )
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          aria-label="Próxima página"
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
