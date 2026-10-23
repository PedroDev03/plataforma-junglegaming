import { z } from 'zod'
import { emailField, passwordField } from './auth'

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter ao menos 2 caracteres.').max(60, 'Máximo de 60 caracteres.'),
  email: emailField,
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: passwordField,
    confirmNewPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'As senhas não coincidem.',
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual.',
  })

export const walletSchema = z.object({
  label: z.string().trim().min(2, 'Dê um nome à carteira (mín. 2 caracteres).').max(30, 'Máximo de 30 caracteres.'),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido. Use 0x seguido de 40 caracteres hexadecimais.'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
export type WalletFormValues = z.infer<typeof walletSchema>
