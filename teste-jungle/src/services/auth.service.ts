import { api } from '@/lib/api'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api'
import type { User } from '@/types/models'

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> =>
    (await api.post<AuthResponse>('/login', data)).data,
  register: async (data: RegisterRequest): Promise<AuthResponse> =>
    (await api.post<AuthResponse>('/register', data)).data,
  me: async (): Promise<User> => (await api.get<User>('/me')).data,
}
