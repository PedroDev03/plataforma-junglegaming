import { Link } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { CouponForm } from '@/components/cart/coupon-form'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { CartResponse } from '@/types/api'

interface CartSummaryProps {
  cart: CartResponse
  onNavigateCheckout?: () => void
}

export function CartSummary({ cart, onNavigateCheckout }: CartSummaryProps) {
  const hasDiscount = cart.discountPercent > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle role="heading" aria-level={2} className="text-base">
          Resumo do Pedido
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        <CouponForm activeCoupon={cart.couponCode} discountPercent={cart.discountPercent} />

        <Separator />

        <dl className="grid gap-2 text-sm" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">
              Subtotal ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'itens'})
            </dt>
            <dd className="font-mono tabular-nums">{formatEth(cart.subtotalEth)} ETH</dd>
          </div>

          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <span>Desconto</span>
              {hasDiscount && <Badge variant="secondary">-{cart.discountPercent}%</Badge>}
            </dt>
            <dd className={cn('font-mono tabular-nums', hasDiscount && 'font-medium text-primary')}>
              - {formatEth(cart.discountEth)} ETH
            </dd>
          </div>

          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Taxa fixa (Gas & Protocolo)</dt>
            <dd className="font-mono tabular-nums">{formatEth(cart.feeEth)} ETH</dd>
          </div>

          <Separator className="my-1" />

          <div className="flex items-baseline justify-between gap-2 text-base font-bold">
            <dt>Total estimado</dt>
            <dd className="flex items-center gap-1 font-mono tabular-nums">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <span>{formatEth(cart.totalEth)} ETH</span>
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="flex-col gap-2.5 pt-0">
        <Link
          to="/checkout"
          onClick={onNavigateCheckout}
          className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'w-full')}
        >
          <span>Ir para o Checkout</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          <span>Cálculo decimal de 18 casas (Wei/ETH) verificado.</span>
        </p>
      </CardFooter>
    </Card>
  )
}
