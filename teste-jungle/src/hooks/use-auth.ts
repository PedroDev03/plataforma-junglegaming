import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { queryKeys } from '@/lib/query-keys'
import { session, useIsAuthenticated } from '@/lib/session'
import { authService } from '@/services/auth.service'
import type { AuthResponse } from '@/types/api'

export const meQueryOptions = queryOptions({
  queryKey: queryKeys.auth.me(),
  queryFn: authService.me,
  staleTime: 5 * 60_000,
})

export function useMe() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({ ...meQueryOptions, enabled: isAuthenticated })
}

function useAuthSuccess() {
  const queryClient = useQueryClient()
  return ({ token, user }: AuthResponse) => {
    session.setToken(token)
    queryClient.setQueryData(queryKeys.auth.me(), user)
  }
}

export function useLogin() {
  const onSuccess = useAuthSuccess()
  return useMutation({ mutationFn: authService.login, onSuccess })
}

export function useRegister() {
  const onSuccess = useAuthSuccess()
  return useMutation({ mutationFn: authService.register, onSuccess })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return () => {
    session.clear()
    queryClient.clear()
    void router.navigate({ to: '/login', search: {} })
  }
}
