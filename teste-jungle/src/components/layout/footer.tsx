import { Link } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">JungleNFT Marketplace</span>
          </div>

          <nav aria-label="Links institucionais" className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link
              to="/"
              className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Catálogo
            </Link>
            <Link
              to="/cart"
              className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Carrinho
            </Link>
            <Link
              to="/profile"
              className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Perfil do Colecionador
            </Link>
          </nav>
        </div>

        <Separator className="my-4" />

        <p className="text-xs text-muted-foreground">
          Valores calculados com precisão decimal em ETH. Ambiente simulado via Mock Service Worker (MSW).
        </p>
      </div>
    </footer>
  )
}
