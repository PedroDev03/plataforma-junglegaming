import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthCard } from '@/components/auth/auth-card'
import { RegisterForm } from '@/components/auth/register-form'
import { session } from '@/lib/session'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (session.isAuthenticated()) throw redirect({ to: '/' })
  },
  component: () => (
    <AuthCard title="Criar conta" description="Cadastre-se e comece sua coleção.">
      <RegisterForm />
    </AuthCard>
  ),
})
