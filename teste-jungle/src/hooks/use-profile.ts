import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { profileService } from '@/services/profile.service'
import type { User } from '@/types/models'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.update,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.auth.me(), user),
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: profileService.changePassword })
}

export function useAddWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.addWallet,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() }),
  })
}

/** Remoção com atualização otimista, rollback em erro e sincronização em onSettled. */
export function useRemoveWallet() {
  const queryClient = useQueryClient()
  const key = queryKeys.auth.me()
  return useMutation({
    mutationFn: profileService.removeWallet,
    onMutate: async (walletId: string) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<User>(key)
      if (previous) {
        queryClient.setQueryData<User>(key, {
          ...previous,
          wallets: previous.wallets.filter((w) => w.id !== walletId),
        })
      }
      return { previous }
    },
    onError: (_error, _walletId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
