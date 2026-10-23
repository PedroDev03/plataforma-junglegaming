import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { FormError } from '@/components/form/form-error'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { useLogin } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/api'
import { safeRedirect } from '@/lib/redirect'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'

export function LoginForm({ redirect }: { redirect?: string }) {
  const router = useRouter()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = (values: LoginFormValues) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Bem-vindo, ${user.name}!`)
        router.history.push(safeRedirect(redirect))
      },
      onError: (error) => {
        const message = getErrorMessage(error)
        setError('root', { message })
        toast.error(message)
      },
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <FormError message={errors.root?.message} />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <SubmitButton isPending={login.isPending} pendingText="Entrando...">
        Entrar
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link to="/register" className="font-medium text-foreground underline focus-visible:ring-2 focus-visible:ring-ring">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
