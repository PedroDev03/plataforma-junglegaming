import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ticket, X } from 'lucide-react'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/use-cart'
import { getErrorMessage } from '@/lib/api'
import { couponSchema, type CouponFormValues } from '@/schemas/cart'

interface CouponFormProps {
  activeCoupon: string | null
  discountPercent: number
}

const SUGGESTED_COUPONS = ['JUNGLE10', 'WEB3VIP', 'ETH5'] as const

export function CouponForm({ activeCoupon, discountPercent }: CouponFormProps) {
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: '' },
  })

  const onSubmit = (values: CouponFormValues) => {
    applyCoupon.mutate(
      { code: values.code },
      {
        onSuccess: () => reset({ code: '' }),
        onError: (error) => {
          setError('code', { message: getErrorMessage(error) })
        },
      },
    )
  }

  return (
    <div className="grid gap-3">
      {activeCoupon ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Ticket className="size-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-medium">
              Cupom <strong className="font-mono">{activeCoupon}</strong> ({discountPercent}% OFF)
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={removeCoupon.isPending}
            aria-label={`Remover cupom ${activeCoupon}`}
            onClick={() => removeCoupon.mutate()}
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-2">
            <TextField
              label="Cupom de desconto"
              placeholder="Ex: JUNGLE10"
              autoComplete="off"
              hint="Experimente JUNGLE10 (10%), WEB3VIP (20%) ou ETH5 (5%)."
              error={errors.code?.message}
              {...register('code')}
            />
            <SubmitButton
              isPending={applyCoupon.isPending}
              pendingText="Validando..."
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Ticket className="size-3.5" aria-hidden="true" />
              <span>Aplicar cupom</span>
            </SubmitButton>
          </form>

          <div
            role="group"
            aria-label="Cupons sugeridos"
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="text-xs text-muted-foreground">Sugestões:</span>
            {SUGGESTED_COUPONS.map((code) => (
              <Button
                key={code}
                type="button"
                variant="outline"
                size="xs"
                aria-label={`Preencher cupom ${code}`}
                className="font-mono"
                onClick={() => {
                  setValue('code', code, { shouldValidate: true })
                }}
              >
                {code}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
