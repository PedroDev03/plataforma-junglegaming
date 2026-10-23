import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { safeRedirect } from '@/lib/redirect'
import { session } from '@/lib/session'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  // Usuário já autenticado não precisa ver o login
  beforeLoad: ({ search }) => {
    if (session.isAuthenticated()) throw redirect({ to: safeRedirect(search.redirect) })
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  return (
    <AuthCard title="Entrar" description="Acesse sua conta de colecionador.">
      <LoginForm redirect={redirect} />
    </AuthCard>
  )
}
