import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { FormError } from '@/components/form/form-error'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { useChangePassword } from '@/hooks/use-profile'
import { getErrorMessage } from '@/lib/api'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/schemas/profile'

const emptyValues: ChangePasswordFormValues = { currentPassword: '', newPassword: '', confirmNewPassword: '' }

export function PasswordForm() {
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: emptyValues })

  const onSubmit = ({ currentPassword, newPassword }: ChangePasswordFormValues) =>
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset(emptyValues)
          toast.success('Senha alterada com sucesso.')
        },
        onError: (error) => {
          const message = getErrorMessage(error)
          if (isAxiosError(error) && error.response?.data?.code === 'INVALID_CURRENT_PASSWORD') {
            setError('currentPassword', { message })
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
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com letras e números."
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <TextField
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        {...register('confirmNewPassword')}
      />
      <SubmitButton isPending={changePassword.isPending} pendingText="Alterando..." className="w-full sm:w-fit">
        Alterar senha
      </SubmitButton>
    </form>
  )
}
