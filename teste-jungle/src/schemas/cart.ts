import { z } from 'zod'

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Informe um código de cupom (mín. 3 caracteres).')
    .max(20, 'Máximo de 20 caracteres.'),
})

export type CouponFormValues = z.infer<typeof couponSchema>
