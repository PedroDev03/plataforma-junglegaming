import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { FormError } from '@/components/form/form-error'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { useUpdateProfile } from '@/hooks/use-profile'
import { getErrorMessage } from '@/lib/api'
import { profileSchema, type ProfileFormValues } from '@/schemas/profile'
import type { User } from '@/types/models'

export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email },
  })

  const onSubmit = (values: ProfileFormValues) =>
    update.mutate(values, {
      onSuccess: (updated) => {
        reset({ name: updated.name, email: updated.email })
        toast.success('Dados atualizados com sucesso.')
      },
      onError: (error) => {
        const message = getErrorMessage(error)
        if (isAxiosError(error) && error.response?.status === 409) setError('email', { message })
        else setError('root', { message })
        toast.error(message)
      },
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <FormError message={errors.root?.message} />
      <TextField label="Nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <TextField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <SubmitButton isPending={update.isPending} pendingText="Salvando..." disabled={!isDirty} className="w-full sm:w-fit">
        Salvar alterações
      </SubmitButton>
    </form>
  )
}
