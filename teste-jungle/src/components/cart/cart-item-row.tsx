import { Link } from '@tanstack/react-router'
import { Minus, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRemoveCartItem, useUpdateCartItemQuantity } from '@/hooks/use-cart'
import { formatEth, multiplyEth } from '@/lib/eth'
import type { CartItem } from '@/types/models'

interface CartItemRowProps {
  item: CartItem
  compact?: boolean
}

export function CartItemRow({ item, compact = false }: CartItemRowProps) {
  const updateQuantity = useUpdateCartItemQuantity()
  const removeItem = useRemoveCartItem()

  const lineTotalEth = multiplyEth(item.priceEth, item.quantity)

  return (
    <article
      aria-label={`Item do carrinho: ${item.name}`}
      className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3 shadow-xs transition-colors"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: item.nftId }}
          className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-20"
        >
          <img
            src={item.imageUrl}
            alt={`Obra NFT ${item.name} da coleção ${item.collection}`}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </Link>

        <div className="grid min-w-0 flex-1 gap-1">
          <p className="truncate text-xs text-muted-foreground">{item.collection}</p>
          <h3 className="truncate text-sm font-semibold">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: item.nftId }}
              className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.name}
            </Link>
          </h3>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            Unitário: {formatEth(item.priceEth)} ETH
          </p>

          {/* Controles de quantidade acessíveis */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label={`Quantidade de ${item.name}`}
              className="inline-flex items-center rounded-lg border bg-background"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Diminuir quantidade de ${item.name}`}
                onClick={() =>
                  updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                }
              >
                <Minus className="size-3" aria-hidden="true" />
              </Button>

              <span
                aria-live="polite"
                className="min-w-7 text-center font-mono text-xs font-semibold tabular-nums"
              >
                {item.quantity}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={item.quantity >= 10}
                aria-label={`Aumentar quantidade de ${item.name}`}
                onClick={() =>
                  updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                }
              >
                <Plus className="size-3" aria-hidden="true" />
              </Button>
            </div>

            {compact && (
              <span className="font-mono text-xs font-semibold tabular-nums">
                {formatEth(lineTotalEth)} ETH
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between gap-2 self-stretch">
        {!compact && (
          <div className="flex items-center gap-1 font-mono text-sm font-semibold tabular-nums">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            <span>{formatEth(lineTotalEth)} ETH</span>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remover ${item.name} do carrinho`}
                onClick={() => removeItem.mutate(item.id)}
              />
            }
          >
            <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>Remover item</TooltipContent>
        </Tooltip>
      </div>
    </article>
  )
}
