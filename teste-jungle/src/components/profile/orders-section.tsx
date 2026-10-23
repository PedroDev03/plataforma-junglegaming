import { Link } from '@tanstack/react-router'
import { ExternalLink, Receipt, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetOrders } from '@/hooks/use-orders'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

export function OrdersSection() {
  const { data: orders, isLoading } = useGetOrders()

  if (isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Carregando histórico de pedidos">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Receipt className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Nenhum pedido realizado ainda.</p>
        <p className="text-xs text-muted-foreground">
          Seus recibos on-chain aparecerão aqui após o checkout.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid gap-3" aria-label="Histórico de pedidos">
      {orders.map((order) => {
        const formattedDate = new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(order.createdAt))

        return (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/25 p-3.5"
          >
            <div className="grid min-w-0 gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">#{order.id}</span>
                <Badge variant="secondary">{order.items.length} NFT(s)</Badge>
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground">
                Idempotency: {order.idempotencyKey}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-sm font-bold tabular-nums">
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                {formatEth(order.totalEth)} ETH
              </span>
              <Link
                to="/orders/$orderId"
                params={{ orderId: order.id }}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <span>Recibo</span>
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
