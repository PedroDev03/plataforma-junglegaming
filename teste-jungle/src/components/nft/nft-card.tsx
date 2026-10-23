import { Link } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import { Sparkles } from 'lucide-react'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { FavoriteButton } from '@/components/nft/favorite-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatEth } from '@/lib/eth'
import { cn, getInitials } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/schemas/nft-search'
import type { NFT } from '@/types/models'

const categoryBadgeVariants = cva('bg-background/90 backdrop-blur-sm', {
  variants: {
    category: {
      art: 'text-foreground',
      music: 'text-foreground',
      photography: 'text-foreground',
      game: 'text-foreground',
      collectible: 'text-foreground',
    },
  },
  defaultVariants: {
    category: 'art',
  },
})

interface NftCardProps {
  nft: NFT
  /** Ativa carregamento prioritário (LCP) para os primeiros cards acima da dobra */
  priority?: boolean
  className?: string
}

export function NftCard({ nft, priority = false, className }: NftCardProps) {
  return (
    <article className={cn('h-full', className)}>
      <Card className="group flex h-full flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <img
            src={nft.imageUrl}
            alt={`Obra NFT ${nft.name} da coleção ${nft.collection}, criada por ${nft.creatorName}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <Badge variant="secondary" className={categoryBadgeVariants({ category: nft.category })}>
              {CATEGORY_LABELS[nft.category]}
            </Badge>
            <FavoriteButton
              nftId={nft.id}
              nftName={nft.name}
              isFavorited={nft.isFavorited}
              likes={nft.likes}
            />
          </div>
          {!nft.available && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="destructive">Vendido</Badge>
            </div>
          )}
        </div>

        <CardHeader className="gap-1.5 pb-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{nft.collection}</p>
          <h2 className="truncate text-base font-semibold leading-snug">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: nft.id }}
              className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {nft.name}
            </Link>
          </h2>
          <div className="flex items-center gap-2 pt-0.5">
            <Avatar size="sm">
              <AvatarFallback>{getInitials(nft.creatorName)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">{nft.creatorName}</span>
          </div>
        </CardHeader>

        <CardContent className="mt-auto pt-0">
          <div className="flex items-baseline justify-between rounded-lg bg-muted/60 px-3 py-2">
            <span className="text-xs text-muted-foreground">Preço atual</span>
            <span className="flex items-center gap-1 font-mono text-sm font-semibold tabular-nums">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              {formatEth(nft.priceEth)} ETH
            </span>
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="grid grid-cols-2 gap-2 pt-3">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
          >
            Detalhes
          </Link>
          <AddToCartButton nft={nft} label="Adicionar" size="sm" className="w-full" />
        </CardFooter>
      </Card>
    </article>
  )
}
