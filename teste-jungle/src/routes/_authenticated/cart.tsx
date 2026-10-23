import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react'
import { CartItemRow } from '@/components/cart/cart-item-row'
import { CartSummary } from '@/components/cart/cart-summary'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cartQueryOptions, useCart } from '@/hooks/use-cart'
import { getErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/cart')({
  loader: ({ context }) => context.queryClient.prefetchQuery(cartQueryOptions),
  component: CartPage,
})

function CartPage() {
  const { data: cart, isLoading, isError, error, refetch } = useCart()

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10 lg:px-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Carrinho de Compras</h1>
          {cart && cart.totalItems > 0 && (
            <Badge variant="secondary" className="font-mono tabular-nums">
              {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>

        <Link to="/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Continuar explorando</span>
        </Link>
      </header>

      {isLoading && (
        <div
          aria-busy="true"
          aria-label="Carregando carrinho de compras"
          className="grid gap-6 lg:grid-cols-12"
        >
          <div className="grid gap-3 lg:col-span-7">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      )}

      {isError && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Não foi possível carregar seu carrinho</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Tentar novamente</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && (!cart || cart.items.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Seu carrinho está vazio</h2>
            <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
              Navegue pelo catálogo para descobrir colecionáveis digitais verificados e adicioná-los
              ao seu carrinho.
            </p>
            <Link to="/" className={cn(buttonVariants({ variant: 'default', size: 'default' }))}>
              Explorar catálogo de NFTs
            </Link>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && cart && cart.items.length > 0 && (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <section aria-label="Itens do carrinho" className="grid gap-3 lg:col-span-7">
            {cart.items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </section>

          <aside aria-label="Resumo financeiro" className="lg:col-span-5">
            <CartSummary cart={cart} />
          </aside>
        </div>
      )}
    </main>
  )
}
