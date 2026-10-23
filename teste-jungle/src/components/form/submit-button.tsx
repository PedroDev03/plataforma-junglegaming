import type { ComponentProps } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  isPending: boolean
  pendingText?: string
}

/** Botão de envio que bloqueia cliques duplos e mostra spinner. */
export function SubmitButton({ isPending, pendingText = 'Enviando...', children, disabled, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending || disabled} aria-busy={isPending} {...props}>
      {isPending ? (
        <>
          <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
