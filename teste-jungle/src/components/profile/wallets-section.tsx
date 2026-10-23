import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Plus, Trash2, Wallet as WalletIcon } from 'lucide-react'
import { toast } from 'sonner'
import { FormError } from '@/components/form/form-error'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAddWallet, useRemoveWallet } from '@/hooks/use-profile'
import { getErrorMessage } from '@/lib/api'
import { walletSchema, type WalletFormValues } from '@/schemas/profile'
import type { Wallet } from '@/types/models'

export function WalletsSection({ wallets }: { wallets: Wallet[] }) {
  const addWallet = useAddWallet()
  const removeWallet = useRemoveWallet()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: { label: '', address: '' },
  })

  const onSubmit = (values: WalletFormValues) =>
    addWallet.mutate(values, {
      onSuccess: () => {
        reset()
        toast.success('Carteira adicionada.')
      },
      onError: (error) => {
        const message = getErrorMessage(error)
        if (isAxiosError(error) && error.response?.status === 409) setError('address', { message })
        else setError('root', { message })
        toast.error(message)
      },
    })

  const onRemove = (wallet: Wallet) =>
    removeWallet.mutate(wallet.id, {
      onSuccess: () => toast.success(`Carteira "${wallet.label}" removida.`),
      onError: (error) => toast.error(getErrorMessage(error)),
    })

  return (
    <div className="grid gap-6">
      {wallets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma carteira vinculada no momento.</p>
      ) : (
        <ul className="grid gap-2.5" aria-label="Carteiras vinculadas">
          {wallets.map((wallet, idx) => (
            <li
              key={wallet.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <WalletIcon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{wallet.label}</p>
                    {idx === 0 && <Badge variant="secondary">Principal</Badge>}
                  </div>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {wallet.address}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover carteira ${wallet.label}`}
                    />
                  }
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover carteira?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A carteira <strong>{wallet.label}</strong> será desvinculada do seu perfil de
                      colecionador.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => onRemove(wallet)}>
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <FormError message={errors.root?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nome da carteira"
            placeholder="Ex: Ledger Vault"
            error={errors.label?.message}
            {...register('label')}
          />
          <TextField
            label="Endereço Ethereum"
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
            error={errors.address?.message}
            {...register('address')}
          />
        </div>
        <SubmitButton
          isPending={addWallet.isPending}
          pendingText="Adicionando..."
          className="w-full sm:w-fit"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Adicionar carteira</span>
        </SubmitButton>
      </form>
    </div>
  )
}
