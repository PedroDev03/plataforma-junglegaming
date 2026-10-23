import { api } from '@/lib/api'
import type { AddWalletRequest, ChangePasswordRequest, UpdateProfileRequest } from '@/types/api'
import type { User, Wallet } from '@/types/models'

export const profileService = {
  update: async (data: UpdateProfileRequest): Promise<User> => (await api.patch<User>('/me', data)).data,
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/me/password', data)
  },
  addWallet: async (data: AddWalletRequest): Promise<Wallet> =>
    (await api.post<Wallet>('/me/wallets', data)).data,
  removeWallet: async (walletId: string): Promise<void> => {
    await api.delete(`/me/wallets/${walletId}`)
  },
}
