import { z } from 'zod'

const emailField = z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('E-mail inválido.'))

export const passwordField = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
  .regex(/\d/, 'A senha deve conter ao menos um número.')

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe a senha.'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'O nome deve ter ao menos 2 caracteres.').max(60, 'Máximo de 60 caracteres.'),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>

export { emailField }
