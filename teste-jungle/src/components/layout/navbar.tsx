import { Link, useRouter } from '@tanstack/react-router'
import {
  Compass,
  Heart,
  LogIn,
  LogOut,
  Menu,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  UserPlus,
} from 'lucide-react'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SocketStatusMenu } from '@/components/layout/socket-status-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useLogout, useMe } from '@/hooks/use-auth'
import { formatEth } from '@/lib/eth'
import { useIsAuthenticated } from '@/lib/session'
import { cn, getInitials } from '@/lib/utils'

export function Navbar() {
  const isAuthenticated = useIsAuthenticated()
  const { data: user } = useMe()
  const logout = useLogout()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md font-bold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="text-base sm:text-lg">JungleNFT</span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
            <Link
              to="/"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              activeProps={{ className: 'bg-accent text-accent-foreground' }}
            >
              <Compass className="size-4" aria-hidden="true" />
              <span>Explorar</span>
            </Link>

            <Link
              to="/"
              search={{ onlyFavorites: true }}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              <Heart className="size-4" aria-hidden="true" />
              <span>Favoritos</span>
            </Link>

            <Link
              to="/cart"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              activeProps={{ className: 'bg-accent text-accent-foreground' }}
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              <span>Carrinho</span>
            </Link>
          </nav>
        </div>

        {/* Ações Desktop + Mobile */}
        <div className="flex items-center gap-2">
          <SocketStatusMenu />
          <CartDrawer />

          {isAuthenticated && user && (
            <Badge variant="secondary" className="hidden font-mono tabular-nums sm:inline-flex">
              {formatEth(user.balanceEth, 2)} ETH
            </Badge>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 pl-1.5"
                    aria-label="Abrir menu da conta"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback>{getInitials(user?.name ?? 'Colecionador')}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate sm:inline">
                  {user?.name ?? 'Minha Conta'}
                </span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate">
                    {user?.email ?? 'Colecionador autenticado'}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void router.navigate({ to: '/profile' })}>
                  <UserIcon className="size-4" aria-hidden="true" />
                  <span>Perfil do Colecionador</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void router.navigate({ to: '/cart' })}>
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  <span>Meu Carrinho</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  <LogOut className="size-4" aria-hidden="true" />
                  <span>Sair da conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                search={{}}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                <LogIn className="size-4" aria-hidden="true" />
                <span>Entrar</span>
              </Link>
              <Link
                to="/register"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                <span>Criar conta</span>
              </Link>
            </div>
          )}

          {/* Menu Gaveta Mobile (< md) */}
          <Sheet modal>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menu de navegação"
                />
              }
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>

            <SheetContent side="right" className="flex flex-col">
              <SheetHeader>
                <SheetTitle>JungleNFT</SheetTitle>
                <SheetDescription>Navegue pelo marketplace Web3.</SheetDescription>
              </SheetHeader>

              <Separator />

              <nav aria-label="Menu mobile" className="grid gap-1 px-4">
                <SheetClose
                  render={
                    <Link
                      to="/"
                      className={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'justify-start')}
                    />
                  }
                >
                  <Compass className="size-4" aria-hidden="true" />
                  <span>Explorar Catálogo</span>
                </SheetClose>

                <SheetClose
                  render={
                    <Link
                      to="/"
                      search={{ onlyFavorites: true }}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'justify-start')}
                    />
                  }
                >
                  <Heart className="size-4" aria-hidden="true" />
                  <span>Meus Favoritos</span>
                </SheetClose>

                <SheetClose
                  render={
                    <Link
                      to="/cart"
                      className={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'justify-start')}
                    />
                  }
                >
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  <span>Carrinho</span>
                </SheetClose>

                {isAuthenticated ? (
                  <>
                    <SheetClose
                      render={
                        <Link
                          to="/profile"
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'default' }),
                            'justify-start',
                          )}
                        />
                      }
                    >
                      <UserIcon className="size-4" aria-hidden="true" />
                      <span>Perfil do Colecionador</span>
                    </SheetClose>
                    <Separator className="my-2" />
                    <Button
                      type="button"
                      variant="destructive"
                      className="justify-start"
                      onClick={logout}
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      <span>Sair da conta</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Separator className="my-2" />
                    <SheetClose
                      render={
                        <Link
                          to="/login"
                          search={{}}
                          className={cn(buttonVariants({ variant: 'outline', size: 'default' }), 'w-full')}
                        />
                      }
                    >
                      <LogIn className="size-4" aria-hidden="true" />
                      <span>Entrar</span>
                    </SheetClose>
                    <SheetClose
                      render={
                        <Link
                          to="/register"
                          className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'w-full')}
                        />
                      }
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                      <span>Criar conta</span>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
