import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react'
import { CartItemRow } from '@/components/cart/cart-item-row'
import { CartSummary } from '@/components/cart/cart-summary'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart } from '@/hooks/use-cart'
import { getErrorMessage } from '@/lib/api'
import { useIsAuthenticated } from '@/lib/session'
import { cn } from '@/lib/utils'

/**
 * Drawer lateral acessível (`<Sheet>` com Focus Trap automático) para o Carrinho de Compras.
 */
export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const isAuthenticated = useIsAuthenticated()
  const { data: cart, isLoading, isError, error, refetch } = useCart()

  const totalItems = cart?.totalItems ?? 0

  return (
    <Sheet modal open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={
              totalItems > 0 ? `Abrir carrinho (${totalItems} itens)` : 'Abrir carrinho de compras'
            }
            className="gap-1.5"
          />
        }
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Carrinho</span>
        {isAuthenticated && totalItems > 0 && (
          <Badge variant="default" className="px-1.5 font-mono text-xs tabular-nums">
            {totalItems}
          </Badge>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
            <span>Meu Carrinho</span>
          </SheetTitle>
          <SheetDescription>
            Gerencie quantidades, aplique cupons e confira o total em ETH.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {!isAuthenticated ? (
            <div className="my-auto flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Sua sessão não está autenticada.</p>
              <p className="text-xs text-muted-foreground">
                Entre na sua conta para sincronizar e gerenciar seu carrinho de NFTs.
              </p>
              <SheetClose
                render={
                  <Link
                    to="/login"
                    search={{ redirect: '/cart' }}
                    className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
                  />
                }
              >
                Entrar na conta
              </SheetClose>
            </div>
          ) : isLoading ? (
            <div className="grid gap-3" aria-busy="true" aria-label="Carregando carrinho">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertTitle>Erro ao carregar o carrinho</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between gap-2">
                <span>{getErrorMessage(error)}</span>
                <Button type="button" variant="outline" size="xs" onClick={() => void refetch()}>
                  <RefreshCw className="size-3" aria-hidden="true" />
                  <span>Tentar</span>
                </Button>
              </AlertDescription>
            </Alert>
          ) : !cart || cart.items.length === 0 ? (
            <div className="my-auto flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Seu carrinho está vazio.</p>
              <p className="text-xs text-muted-foreground">
                Explore o catálogo e adicione NFTs raros à sua coleção.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <SheetClose
                  render={
                    <Link
                      to="/"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    />
                  }
                >
                  Explorar NFTs
                </SheetClose>
              </div>
            </div>
          ) : (
            <>
              <section aria-label="Itens no carrinho" className="grid gap-2.5">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={item} compact />
                ))}
              </section>

              <CartSummary cart={cart} onNavigateCheckout={() => setOpen(false)} />

              <SheetClose
                render={
                  <Link
                    to="/cart"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-full')}
                  />
                }
              >
                Abrir página completa do carrinho
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
