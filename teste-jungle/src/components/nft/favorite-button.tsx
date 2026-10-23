import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToggleFavoriteNFT } from '@/hooks/use-nfts'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  nftId: string
  nftName: string
  isFavorited: boolean
  likes: number
  className?: string
}

export function FavoriteButton({
  nftId,
  nftName,
  isFavorited,
  likes,
  className,
}: FavoriteButtonProps) {
  const toggleFavorite = useToggleFavoriteNFT()
  const label = isFavorited ? `Remover ${nftName} dos favoritos` : `Favoritar ${nftName}`

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={label}
            aria-pressed={isFavorited}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite.mutate(nftId)
            }}
            className={cn(
              'gap-1.5 rounded-full bg-background/90 px-2.5 shadow-xs backdrop-blur-sm hover:bg-background',
              isFavorited && 'text-destructive',
              className,
            )}
          />
        }
      >
        <Heart
          className={cn(
            'size-3.5 transition-transform motion-reduce:transition-none',
            isFavorited && 'scale-110 fill-current',
          )}
          aria-hidden="true"
        />
        <span className="font-mono text-xs tabular-nums">{likes}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
