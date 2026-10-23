import { useEffect, useId, useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Fingerprint,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wallet as WalletIcon,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/form/submit-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { meQueryOptions, useMe } from '@/hooks/use-auth'
import { cartQueryOptions, useCart } from '@/hooks/use-cart'
import { useCreateOrder, useValidateCheckout } from '@/hooks/use-orders'
import { useSocket } from '@/hooks/use-socket'
import { getErrorMessage, isTimeoutError } from '@/lib/api'
import { calculateCartTotals, compareEth, formatEth, multiplyEth, subtractEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/checkout')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(cartQueryOptions)
    void context.queryClient.prefetchQuery(meQueryOptions)
  },
  component: CheckoutPage,
})

function CheckoutPage() {
  const router = useRouter()
  const { data: cart, isLoading: isCartLoading, isError: isCartError, error: cartError } = useCart()
  const { data: user, isLoading: isUserLoading } = useMe()
  const validateCheckout = useValidateCheckout()
  const createOrder = useCreateOrder()
  const { latestNftUpdate, clearLatestNftUpdate, triggerSimulatedNftUpdate } = useSocket()

  // Chave de idempotência estável por intenção de compra (preservada em caso de timeout!)
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID())
  const [excludedItemIds, setExcludedItemIds] = useState<string[]>([])
  const [selectedWallet, setSelectedWallet] = useState<string>('')
  const [simulateFirstTimeout, setSimulateFirstTimeout] = useState(false)
  const [timedOutOnce, setTimedOutOnce] = useState(false)
  const timeoutSwitchId = useId()
  const timeoutHintId = useId()

  // Valida automaticamente preço, cupom e disponibilidade no MSW ao abrir o checkout
  useEffect(() => {
    validateCheckout.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isCartLoading || isUserLoading) {
    return <CheckoutSkeleton />
  }

  if (isCartError || !cart || !user) {
    return (
      <main id="main-content" className="mx-auto grid w-full max-w-3xl gap-4 p-4 md:py-10">
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Erro ao carregar dados do checkout</AlertTitle>
          <AlertDescription>{getErrorMessage(cartError)}</AlertDescription>
        </Alert>
      </main>
    )
  }

  if (cart.items.length === 0 && !timedOutOnce) {
    return (
      <main id="main-content" className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-10">
        <Card className="border-dashed text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag className="size-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-lg font-semibold">Nenhum item no carrinho para checkout</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Adicione NFTs ao carrinho antes de iniciar o pagamento.
            </p>
            <Link to="/" className={cn(buttonVariants({ variant: 'default' }))}>
              Explorar Catálogo
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Regra 5 (Fase 6): detecta se algum NFT presente no carrinho sofreu alteração de preço via Socket.IO
  const interruptedBySocketEvent =
    latestNftUpdate && cart.items.some((item) => item.nftId === latestNftUpdate.nftId)
      ? latestNftUpdate
      : null

  const activeWalletAddress = selectedWallet || user.wallets[0]?.address || ''
  const selectedItems = cart.items.filter((item) => !excludedItemIds.includes(item.id))
  const totals = calculateCartTotals(selectedItems, cart.discountPercent)
  const hasSufficientBalance = compareEth(user.balanceEth, totals.totalEth) >= 0
  const remainingBalanceEth = hasSufficientBalance
    ? subtractEth(user.balanceEth, totals.totalEth)
    : user.balanceEth

  const handleAcknowledgeSocketPriceChange = () => {
    clearLatestNftUpdate()
    setTimedOutOnce(false)
    setIdempotencyKey(crypto.randomUUID())
    validateCheckout.mutate()
  }

  const toggleItemSelection = (itemId: string, checked: boolean) => {
    setExcludedItemIds((prev) =>
      checked ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    )
    if (!timedOutOnce) {
      setIdempotencyKey(crypto.randomUUID())
    }
  }

  const handleConfirmOrder = (isRetry = false) => {
    if (interruptedBySocketEvent) {
      toast.error(
        'Fluxo interrompido: sincronize o novo preço atualizado em tempo real antes de continuar.',
      )
      return
    }

    if (selectedItems.length === 0 && !timedOutOnce) {
      toast.error('Selecione ao menos um item para finalizar a compra.')
      return
    }

    const shouldForceShortTimeout = simulateFirstTimeout && !timedOutOnce && !isRetry

    createOrder.mutate(
      {
        payload: {
          itemIds: selectedItems.map((i) => i.id),
          walletAddress: activeWalletAddress,
          couponCode: cart.couponCode,
          idempotencyKey,
        },
        timeoutMs: shouldForceShortTimeout ? 1200 : 15_000,
      },
      {
        onSuccess: (order) => {
          toast.success(
            timedOutOnce
              ? `Pedido #${order.id} recuperado com idempotência sem cobrança duplicada!`
              : `Pagamento confirmado! Pedido #${order.id} concluído.`,
          )
          void router.navigate({
            to: '/orders/$orderId',
            params: { orderId: order.id },
          })
        },
        onError: (error) => {
          if (isTimeoutError(error)) {
            setTimedOutOnce(true)
            toast.warning(
              'Tempo limite excedido! Reenvie com a mesma chave de idempotência para recuperar seu recibo.',
            )
          } else {
            toast.error(getErrorMessage(error))
            validateCheckout.mutate()
          }
        },
      },
    )
  }

  const validationIssues = validateCheckout.data?.issues ?? []
  const targetCartNftId = selectedItems[0]?.nftId ?? cart.items[0]?.nftId

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 outline-none sm:px-6 md:py-10 lg:px-8"
    >
      {/* Modal com Focus Trap interrompendo o checkout quando o preço de um NFT do carrinho muda via Socket */}
      <AlertDialog
        open={Boolean(interruptedBySocketEvent)}
        onOpenChange={(open) => {
          if (!open) handleAcknowledgeSocketPriceChange()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checkout Interrompido: Preço Atualizado</AlertDialogTitle>
            <AlertDialogDescription>
              {interruptedBySocketEvent && (
                <>
                  O NFT <strong>{interruptedBySocketEvent.name}</strong> no seu carrinho teve o
                  preço alterado em tempo real via Socket.IO de{' '}
                  <strong className="font-mono">
                    {formatEth(interruptedBySocketEvent.oldPriceEth)} ETH
                  </strong>{' '}
                  para{' '}
                  <strong className="font-mono">
                    {formatEth(interruptedBySocketEvent.newPriceEth)} ETH
                  </strong>
                  . Revise os novos valores antes de prosseguir.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                clearLatestNftUpdate()
                void router.navigate({ to: '/cart' })
              }}
            >
              Voltar ao carrinho
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAcknowledgeSocketPriceChange}>
              Atualizar preço e revisar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Checkout Web3</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Revise a validação on-chain, selecione os itens e assine sua transação com idempotência.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={validateCheckout.isPending || createOrder.isPending}
            onClick={() => validateCheckout.mutate()}
          >
            <RefreshCw
              className={cn(
                'size-3.5',
                validateCheckout.isPending && 'animate-spin motion-reduce:animate-none',
              )}
              aria-hidden="true"
            />
            <span>Revalidar Preços e Estoque</span>
          </Button>
          <Link to="/cart" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Voltar ao carrinho</span>
          </Link>
        </div>
      </header>

      {/* Banner de Interrupção por Evento Socket.IO */}
      {interruptedBySocketEvent && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Fluxo de Checkout Interrompido (Evento Socket.IO: nft.updated)</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span>
              A cotação de <strong>{interruptedBySocketEvent.name}</strong> mudou de{' '}
              <span className="font-mono">{formatEth(interruptedBySocketEvent.oldPriceEth)} ETH</span>{' '}
              para{' '}
              <span className="font-mono">{formatEth(interruptedBySocketEvent.newPriceEth)} ETH</span>.
              Sincronize os valores para liberar o pagamento.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAcknowledgeSocketPriceChange}
            >
              Sincronizar novo preço
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Alertas de Validação de Preço, Cupom e Disponibilidade */}
      {validationIssues.length > 0 && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Alterações detectadas na validação com o servidor (MSW)</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc pl-4 text-xs">
              {validationIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de Timeout e Reenvio Idempotente */}
      {timedOutOnce && (
        <Alert role="alert" className="border-primary/50 bg-primary/5">
          <Clock className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Timeout detectado — Proteção de Idempotência Ativa</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs">
              A 1ª requisição excedeu o tempo limite, mas a chave{' '}
              <code className="font-mono font-semibold">{idempotencyKey}</code> foi mantida. Ao
              reenviar, o MSW devolverá o pedido processado sem cobrar seu saldo novamente.
            </span>
            <Button
              type="button"
              size="sm"
              disabled={createOrder.isPending || Boolean(interruptedBySocketEvent)}
              onClick={() => handleConfirmOrder(true)}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Reenviar com a mesma chave</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="grid gap-6 lg:col-span-7">
          {/* Seleção dos Itens do Carrinho */}
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2} className="text-base">
                1. Itens para esta transação ({selectedItems.length} de {cart.items.length})
              </CardTitle>
              <CardDescription>
                Apenas os itens marcados abaixo serão comprados e removidos do carrinho após a
                confirmação.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {cart.items.map((item) => {
                const isChecked = !excludedItemIds.includes(item.id)
                const checkboxId = `checkout-item-${item.id}`
                const lineTotalEth = multiplyEth(item.priceEth, item.quantity)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors',
                      isChecked ? 'bg-card' : 'bg-muted/30 opacity-60',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Checkbox
                        id={checkboxId}
                        checked={isChecked}
                        disabled={createOrder.isPending || timedOutOnce}
                        onCheckedChange={(checked) =>
                          toggleItemSelection(item.id, Boolean(checked))
                        }
                      />
                      <img
                        src={item.imageUrl}
                        alt={`Obra NFT ${item.name} da coleção ${item.collection}`}
                        loading="lazy"
                        decoding="async"
                        className="size-12 shrink-0 rounded-lg bg-muted object-cover"
                      />
                      <Label htmlFor={checkboxId} className="grid min-w-0 cursor-pointer gap-0.5">
                        <span className="truncate text-sm font-semibold">{item.name}</span>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {item.quantity}x {formatEth(item.priceEth)} ETH
                        </span>
                      </Label>
                    </div>

                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                      {formatEth(lineTotalEth)} ETH
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Seleção da Carteira Ethereum */}
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2} className="text-base">
                2. Carteira Pagadora (Assinatura Web3)
              </CardTitle>
              <CardDescription>
                Escolha qual carteira vinculada assinará o pagamento em ETH.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {user.wallets.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3">
                  <span className="text-xs text-muted-foreground">
                    Você ainda não possui carteiras cadastradas.
                  </span>
                  <Link
                    to="/profile"
                    className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}
                  >
                    Adicionar no Perfil
                  </Link>
                </div>
              ) : (
                <RadioGroup
                  value={activeWalletAddress}
                  onValueChange={(val) => {
                    if (val) setSelectedWallet(val)
                  }}
                >
                  {user.wallets.map((w) => {
                    const radioId = `wallet-${w.id}`
                    return (
                      <div
                        key={w.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <RadioGroupItem value={w.address} id={radioId} />
                          <Label htmlFor={radioId} className="grid min-w-0 cursor-pointer gap-0.5">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <WalletIcon className="size-3.5 text-primary" aria-hidden="true" />
                              <span>{w.label}</span>
                            </span>
                            <span className="break-all font-mono text-xs text-muted-foreground">
                              {w.address}
                            </span>
                          </Label>
                        </div>
                      </div>
                    )
                  })}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Idempotência, Simulações e Confirmação de Pagamento */}
        <aside aria-label="Confirmação e pagamento" className="grid gap-4 lg:col-span-5">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle role="heading" aria-level={2} className="text-base">
                  3. Liquidação em ETH
                </CardTitle>
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <CheckCircle2 className="size-3 text-primary" aria-hidden="true" />
                  <span>Idempotente</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4">
              {/* Bloco de Chave de Idempotência */}
              <div className="grid gap-1.5 rounded-lg border bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Fingerprint className="size-3.5 text-primary" aria-hidden="true" />
                  <span>Header x-idempotency-key</span>
                </div>
                <code className="break-all font-mono text-foreground">{idempotencyKey}</code>
              </div>

              {/* Simuladores para Avaliação Técnica (Timeout + Socket.IO Price Change) */}
              <div className="grid gap-2.5 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid gap-0.5 text-xs">
                    <Label htmlFor={timeoutSwitchId} className="cursor-pointer font-medium">
                      Simular Timeout na 1ª tentativa
                    </Label>
                    <span id={timeoutHintId} className="text-muted-foreground">
                      Testa reenvio idempotente sem cobrança dupla.
                    </span>
                  </div>
                  <Switch
                    id={timeoutSwitchId}
                    aria-describedby={timeoutHintId}
                    aria-invalid={false}
                    checked={simulateFirstTimeout}
                    disabled={createOrder.isPending || timedOutOnce}
                    onCheckedChange={(checked) => setSimulateFirstTimeout(Boolean(checked))}
                  />
                </div>

                {targetCartNftId && (
                  <>
                    <Separator />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={createOrder.isPending}
                      onClick={() => triggerSimulatedNftUpdate(targetCartNftId)}
                      className="w-full"
                    >
                      <Zap className="size-3 text-primary" aria-hidden="true" />
                      <span>Simular alteração de preço via Socket.IO</span>
                    </Button>
                  </>
                )}
              </div>

              <Separator />

              <dl className="grid gap-2 text-sm" aria-live="polite">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Seu saldo atual</dt>
                  <dd className="font-mono font-medium tabular-nums">
                    {formatEth(user.balanceEth)} ETH
                  </dd>
                </div>

                <Separator className="my-1" />

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Subtotal selecionado</dt>
                  <dd className="font-mono tabular-nums">{formatEth(totals.subtotalEth)} ETH</dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Desconto</span>
                    {cart.couponCode && (
                      <Badge variant="secondary" className="font-mono">
                        {cart.couponCode} (-{cart.discountPercent}%)
                      </Badge>
                    )}
                  </dt>
                  <dd className="font-mono tabular-nums">- {formatEth(totals.discountEth)} ETH</dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Taxa fixa (Gas & Protocolo)</dt>
                  <dd className="font-mono tabular-nums">{formatEth(totals.feeEth)} ETH</dd>
                </div>

                <Separator className="my-1" />

                <div className="flex items-baseline justify-between gap-2 text-base font-bold">
                  <dt>Total a pagar</dt>
                  <dd className="flex items-center gap-1 font-mono text-lg tabular-nums">
                    <Sparkles className="size-4 text-primary" aria-hidden="true" />
                    <span>{formatEth(totals.totalEth)} ETH</span>
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <dt>Saldo estimado após a compra</dt>
                  <dd className="font-mono tabular-nums">{formatEth(remainingBalanceEth)} ETH</dd>
                </div>
              </dl>

              {!hasSufficientBalance && !timedOutOnce && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle className="size-4" aria-hidden="true" />
                  <AlertTitle>Saldo insuficiente</AlertTitle>
                  <AlertDescription>
                    Seu saldo em ETH ({formatEth(user.balanceEth)} ETH) é menor que o total do
                    pedido ({formatEth(totals.totalEth)} ETH).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex-col gap-2.5 pt-0">
              <SubmitButton
                type="button"
                size="lg"
                className="w-full"
                isPending={createOrder.isPending}
                pendingText="Confirmando transação na rede (aguarde)..."
                disabled={
                  Boolean(interruptedBySocketEvent) ||
                  (!hasSufficientBalance && !timedOutOnce) ||
                  (selectedItems.length === 0 && !timedOutOnce)
                }
                onClick={() => handleConfirmOrder(timedOutOnce)}
              >
                {timedOutOnce
                  ? 'Reenviar Pedido (Mesma Chave de Idempotência)'
                  : 'Confirmar e Pagar em ETH'}
              </SubmitButton>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                <span>Protegido contra cliques duplos e cobrança duplicada.</span>
              </p>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </main>
  )
}

function CheckoutSkeleton() {
  return (
    <main
      id="main-content"
      aria-busy="true"
      aria-label="Carregando checkout"
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 md:py-10 lg:px-8"
    >
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="grid gap-6 lg:col-span-7">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    </main>
  )
}
