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
  CheckCircle2,
  Fingerprint,
  Hash,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { orderDetailQueryOptions, useSuspenseOrder } from '@/hooks/use-orders'
import { getErrorMessage } from '@/lib/api'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orderDetailQueryOptions(params.orderId)),
  pendingComponent: OrderReceiptSkeleton,
  errorComponent: OrderReceiptError,
  component: OrderReceiptPage,
})

function OrderReceiptPage() {
  const { orderId } = Route.useParams()
  const { data: order } = useSuspenseOrder(orderId)

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.createdAt))

  const totalUnits = order.items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10"
    >
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
              <span>Transação Confirmada (Snapshot Estático)</span>
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{formattedDate}</span>
          </div>

          <CardTitle role="heading" aria-level={1} className="text-2xl font-bold">
            Recibo do Pedido #{order.id}
          </CardTitle>
          <CardDescription>
            Seus colecionáveis digitais foram transferidos. Este recibo preserva os valores exatos
            no momento da compra.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-6 pt-6">
          {/* Metadados On-Chain e Idempotência */}
          <dl className="grid gap-3 rounded-xl border bg-muted/35 p-4 text-xs sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="size-3.5" aria-hidden="true" />
                <span>Carteira Pagadora</span>
              </dt>
              <dd className="truncate font-mono font-medium">{order.walletAddress}</dd>
            </div>

            <div className="grid gap-1">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Fingerprint className="size-3.5" aria-hidden="true" />
                <span>Chave de Idempotência (x-idempotency-key)</span>
              </dt>
              <dd className="truncate font-mono font-medium">{order.idempotencyKey}</dd>
            </div>

            <div className="grid gap-1 sm:col-span-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="size-3.5" aria-hidden="true" />
                <span>Hash da Transação (TxHash)</span>
              </dt>
              <dd className="break-all font-mono text-muted-foreground">{order.txHash}</dd>
            </div>
          </dl>

          {/* Lista de Itens do Snapshot */}
          <section aria-label="Itens adquiridos" className="grid gap-3">
            <h2 className="text-sm font-semibold">
              Itens adquiridos ({totalUnits} {totalUnits === 1 ? 'edição' : 'edições'})
            </h2>
            <ul className="grid gap-2.5">
              {order.items.map((item) => (
                <li
                  key={item.nftId}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={`Obra NFT ${item.name} da coleção ${item.collection}`}
                      loading="lazy"
                      decoding="async"
                      className="size-14 shrink-0 rounded-lg bg-muted object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground">{item.collection}</p>
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="font-mono text-xs text-muted-foreground tabular-nums">
                        {item.quantity}x {formatEth(item.priceEth)} ETH
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                    {formatEth(item.lineTotalEth)} ETH
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* Resumo Financeiro Estático */}
          <dl className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatEth(order.subtotalEth)} ETH</dd>
            </div>

            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span>Desconto</span>
                {order.couponCode && (
                  <Badge variant="secondary" className="font-mono">
                    {order.couponCode} (-{order.discountPercent}%)
                  </Badge>
                )}
              </dt>
              <dd className="font-mono tabular-nums">- {formatEth(order.discountEth)} ETH</dd>
            </div>

            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Taxa fixa (Gas & Protocolo)</dt>
              <dd className="font-mono tabular-nums">{formatEth(order.feeEth)} ETH</dd>
            </div>

            <Separator className="my-1" />

            <div className="flex items-baseline justify-between gap-2 text-base font-bold">
              <dt>Total Pago</dt>
              <dd className="flex items-center gap-1 font-mono text-lg tabular-nums">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                <span>{formatEth(order.totalEth)} ETH</span>
              </dd>
            </div>
          </dl>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-wrap justify-between gap-3 pt-4">
          <Link to="/" className={cn(buttonVariants({ variant: 'outline' }))}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Continuar explorando</span>
          </Link>

          <Link to="/cart" className={cn(buttonVariants({ variant: 'default' }))}>
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span>Ver carrinho restante</span>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

function OrderReceiptSkeleton() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="Carregando recibo do pedido"
      className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 md:py-10"
    >
      <Skeleton className="h-96 w-full rounded-xl" />
    </main>
  )
}

function OrderReceiptError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const isNotFound = isAxiosError(error) && error.response?.status === 404

  if (isNotFound) {
    return (
      <main id="main-content" className="mx-auto flex w-full max-w-md flex-1 items-center p-4">
        <Card className="w-full text-center">
          <CardHeader>
            <CardTitle role="heading" aria-level={1} className="text-xl">
              Recibo não encontrado (404)
            </CardTitle>
            <CardDescription>Este pedido não existe ou pertence a outra conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
              Voltar ao catálogo
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main id="main-content" className="mx-auto grid w-full max-w-2xl gap-4 p-4 md:py-12">
      <Alert variant="destructive" role="alert">
        <AlertCircle className="size-4" aria-hidden="true" />
        <AlertTitle>Falha ao carregar o recibo</AlertTitle>
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
