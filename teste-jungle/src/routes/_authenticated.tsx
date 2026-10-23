import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { session } from '@/lib/session'

/** Layout guard: protege Carrinho, Checkout e Perfil. */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (!session.isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: () => <Outlet />,
})
