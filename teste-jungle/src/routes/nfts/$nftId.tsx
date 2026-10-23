import { useState } from 'react'
import {
  createFileRoute,
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Layers,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { FavoriteButton } from '@/components/nft/favorite-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { nftDetailQueryOptions, useSuspenseNFT } from '@/hooks/use-nfts'
import { getErrorMessage } from '@/lib/api'
import { formatEth, multiplyEth } from '@/lib/eth'
import { cn, getInitials } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/schemas/nft-search'

export const Route = createFileRoute('/nfts/$nftId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(nftDetailQueryOptions(params.nftId)),
  pendingComponent: NftDetailSkeleton,
  errorComponent: NftDetailError,
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data: nft } = useSuspenseNFT(nftId)
  const [quantity, setQuantity] = useState(1)

  const totalEth = multiplyEth(nft.priceEth, quantity)
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(nft.createdAt))
  const dynamicAlt = `Obra digital ${nft.name} da coleção ${nft.collection}, criada por ${nft.creatorName}`

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10 lg:px-8"
    >
      {/* Preload da imagem principal LCP */}
      <link rel="preload" as="image" href={nft.imageUrl} fetchPriority="high" />

      <nav aria-label="Navegação secundária">
        <Link to="/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit')}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Voltar ao catálogo</span>
        </Link>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Coluna da Obra (Imagem aspect-square + Modal de Visualização Ampliada com Focus Trap) */}
        <div className="lg:col-span-6">
          <Card className="overflow-hidden pt-0">
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              <img
                src={nft.imageUrl}
                alt={dynamicAlt}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%2327272a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23a1a1aa" font-family="sans-serif" font-size="24">NFT Artwork</text></svg>'
                }}
                className="size-full object-cover"
              />
              <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  {CATEGORY_LABELS[nft.category]}
                </Badge>
                <FavoriteButton
                  nftId={nft.id}
                  nftName={nft.name}
                  isFavorited={nft.isFavorited}
                  likes={nft.likes}
                />
              </div>

              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2">
                {!nft.available ? <Badge variant="destructive">Vendido</Badge> : <span />}

                <Dialog modal>
                  <DialogTrigger
                    render={
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        aria-label={`Ampliar imagem da obra ${nft.name}`}
                        className="bg-background/90 backdrop-blur-sm hover:bg-background"
                      />
                    }
                  >
                    <Maximize2 className="size-3.5" aria-hidden="true" />
                    <span>Ampliar obra</span>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{nft.name}</DialogTitle>
                      <DialogDescription>
                        Coleção {nft.collection} · Criado por {nft.creatorName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                      <img
                        src={nft.imageUrl}
                        alt={dynamicAlt}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%2327272a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23a1a1aa" font-family="sans-serif" font-size="24">NFT Artwork</text></svg>'
                        }}
                        className="size-full object-contain"
                      />
                    </div>
                    <DialogFooter showCloseButton />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna de Informações e Compra */}
        <div className="grid gap-6 lg:col-span-6">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/"
                search={{ collection: nft.collection }}
                className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Layers className="size-3.5" aria-hidden="true" />
                <span>{nft.collection}</span>
              </Link>
              <Badge variant={nft.available ? 'outline' : 'destructive'}>
                {nft.available ? 'Disponível on-chain' : 'Indisponível'}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              {nft.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-2.5">
                <Avatar size="default">
                  <AvatarFallback>{getInitials(nft.creatorName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Criador verificado</p>
                  <p className="text-sm font-medium">{nft.creatorName}</p>
                </div>
              </div>

              <Separator orientation="vertical" className="hidden h-8 sm:block" />

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3.5" aria-hidden="true" />
                <span>Cunhado em {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Card de Preço e Ação de Compra */}
          <Card className="bg-muted/30">
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Preço unitário</p>
                  <p className="flex items-center gap-1.5 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                    <Sparkles className="size-5 text-primary" aria-hidden="true" />
                    <span>{formatEth(nft.priceEth)} ETH</span>
                  </p>
                </div>

                {quantity > 1 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Subtotal ({quantity} edições)</p>
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {formatEth(totalEth)} ETH
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {nft.available && (
                  <div
                    role="group"
                    aria-label="Selecionar quantidade de edições"
                    className="inline-flex h-9 items-center justify-between rounded-lg border bg-background px-1 sm:w-fit"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={quantity <= 1}
                      aria-label="Diminuir quantidade"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </Button>
                    <span
                      aria-live="polite"
                      className="min-w-8 text-center font-mono text-sm font-semibold tabular-nums"
                    >
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={quantity >= 10}
                      aria-label="Aumentar quantidade"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}

                <AddToCartButton nft={nft} quantity={quantity} size="lg" className="flex-1" />
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                <span>Autenticidade garantida por contrato inteligente ERC-1155 simulado.</span>
              </p>
            </CardContent>
          </Card>

          {/* Tabs de Detalhes e Metadados */}
          <Tabs defaultValue="description" className="grid gap-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Descrição da Obra</TabsTrigger>
              <TabsTrigger value="contract">Dados On-Chain</TabsTrigger>
            </TabsList>

            <TabsContent value="description">
              <Card>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {nft.description}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contract">
              <Card>
                <CardContent>
                  <dl className="grid gap-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Token ID</dt>
                      <dd className="font-mono">{nft.id}</dd>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Padrão do Token</dt>
                      <dd className="font-mono">ERC-1155</dd>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Rede Blockchain</dt>
                      <dd className="inline-flex items-center gap-1 font-medium">
                        <span>Ethereum Mainnet</span>
                        <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

function NftDetailSkeleton() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-busy="true"
      aria-label="Carregando detalhes do NFT"
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10 lg:px-8"
    >
      <Skeleton className="h-7 w-40 rounded-lg" />
      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
        <div className="grid gap-6 lg:col-span-6">
          <div className="grid gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-3/4" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </main>
  )
}

function NftDetailError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const isNotFound = isAxiosError(error) && error.response?.status === 404

  if (isNotFound) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-md flex-1 items-center p-4 outline-none"
      >
        <Card className="w-full text-center">
          <CardHeader>
            <CardTitle role="heading" aria-level={1} className="text-xl">
              NFT não encontrado (404)
            </CardTitle>
            <CardDescription>
              Este colecionável não existe ou foi removido do catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>Voltar ao catálogo</span>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-2xl gap-4 p-4 outline-none md:py-12"
    >
      <Alert variant="destructive" role="alert">
        <AlertCircle className="size-4" aria-hidden="true" />
        <AlertTitle>Falha ao carregar os detalhes do NFT</AlertTitle>
        <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span>{getErrorMessage(error)}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            <span>Tentar novamente</span>
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  )
}
