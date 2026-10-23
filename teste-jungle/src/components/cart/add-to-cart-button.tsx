import type { ComponentProps } from 'react'
import { useLocation, useRouter } from '@tanstack/react-router'
import { Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAddToCart } from '@/hooks/use-cart'
import { session } from '@/lib/session'
import type { NFT } from '@/types/models'

interface AddToCartButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  nft: NFT
  quantity?: number
  label?: string
}

export function AddToCartButton({
  nft,
  quantity = 1,
  label = 'Adicionar ao carrinho',
  disabled,
  ...props
}: AddToCartButtonProps) {
  const addToCart = useAddToCart()
  const router = useRouter()
  const location = useLocation()

  const handleClick = () => {
    if (!session.isAuthenticated()) {
      toast.info('Faça login para adicionar NFTs ao seu carrinho.')
      void router.navigate({
        to: '/login',
        search: { redirect: location.href },
      })
      return
    }
    addToCart.mutate({ nft, quantity })
  }

  if (!nft.available) {
    return (
      <Button type="button" variant="secondary" disabled {...props}>
        Indisponível (Vendido)
      </Button>
    )
  }

  return (
    <Button
      type="button"
      disabled={addToCart.isPending || disabled}
      aria-busy={addToCart.isPending}
      onClick={handleClick}
      {...props}
    >
      {addToCart.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span>Adicionando...</span>
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </Button>
  )
}
