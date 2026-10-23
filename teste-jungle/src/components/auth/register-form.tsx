import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { FormError } from '@/components/form/form-error'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { useRegister } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/api'
import { registerSchema, type RegisterFormValues } from '@/schemas/auth'

export function RegisterForm() {
  const router = useRouter()
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = ({ name, email, password }: RegisterFormValues) =>
    registerUser.mutate(
      { name, email, password },
      {
        onSuccess: ({ user }) => {
          toast.success(`Conta criada! Bem-vindo, ${user.name}.`)
          router.history.push('/')
        },
        onError: (error) => {
          const message = getErrorMessage(error)
          if (isAxiosError(error) && error.response?.status === 409) {
            setError('email', { message })
          } else {
            setError('root', { message })
          }
          toast.error(message)
        },
      },
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <FormError message={errors.root?.message} />
      <TextField label="Nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <TextField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com letras e números."
        error={errors.password?.message}
        {...register('password')}
      />
      <TextField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <SubmitButton isPending={registerUser.isPending} pendingText="Criando conta...">
        Criar conta
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-foreground underline focus-visible:ring-2 focus-visible:ring-ring">
          Entrar
        </Link>
      </p>
    </form>
  )
}
