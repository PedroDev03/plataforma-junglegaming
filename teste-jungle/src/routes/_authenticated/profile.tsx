import { createFileRoute } from '@tanstack/react-router'
import {
  KeyRound,
  LogOut,
  Receipt,
  Sparkles,
  User as UserIcon,
  Wallet as WalletIcon,
} from 'lucide-react'
import { OrdersSection } from '@/components/profile/orders-section'
import { PasswordForm } from '@/components/profile/password-form'
import { ProfileForm } from '@/components/profile/profile-form'
import { WalletsSection } from '@/components/profile/wallets-section'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { meQueryOptions, useLogout, useMe } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/api'
import { formatEth } from '@/lib/eth'
import { getInitials } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/profile')({
  loader: ({ context }) => context.queryClient.prefetchQuery(meQueryOptions),
  component: ProfilePage,
})

function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch } = useMe()
  const logout = useLogout()

  if (isLoading) return <ProfileSkeleton />

  if (isError || !user) {
    return (
      <main id="main-content" className="mx-auto grid w-full max-w-3xl gap-4 p-4 md:p-8">
        <Alert variant="destructive" role="alert">
          <AlertTitle>Não foi possível carregar o perfil</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10"
    >
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold sm:text-2xl">{user.name}</h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1 font-mono tabular-nums">
                  <Sparkles className="size-3 text-primary" aria-hidden="true" />
                  <span>{formatEth(user.balanceEth)} ETH</span>
                </Badge>
                <Badge variant="outline">
                  {user.wallets.length} {user.wallets.length === 1 ? 'carteira' : 'carteiras'}
                </Badge>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={logout} className="w-full sm:w-fit">
            <LogOut className="size-4" aria-hidden="true" />
            <span>Sair</span>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="grid gap-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile">
            <UserIcon className="size-4" aria-hidden="true" />
            <span>Dados</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="size-4" aria-hidden="true" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="wallets">
            <WalletIcon className="size-4" aria-hidden="true" />
            <span>Carteiras</span>
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Receipt className="size-4" aria-hidden="true" />
            <span>Pedidos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Dados pessoais
              </CardTitle>
              <CardDescription>Atualize seu nome e e-mail de colecionador.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm key={`${user.name}|${user.email}`} user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Segurança da conta
              </CardTitle>
              <CardDescription>Altere sua senha de acesso.</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Carteiras Web3
              </CardTitle>
              <CardDescription>
                Gerencie até 5 carteiras Ethereum vinculadas à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletsSection wallets={user.wallets} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Histórico de Pedidos e Recibos
              </CardTitle>
              <CardDescription>
                Snapshots estáticos de todas as suas compras confirmadas na rede.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrdersSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

function ProfileSkeleton() {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 md:py-10"
      aria-busy="true"
      aria-label="Carregando perfil"
    >
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </main>
  )
}
