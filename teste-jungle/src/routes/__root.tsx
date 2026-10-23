import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Footer } from '@/components/layout/footer'
import { Navbar } from '@/components/layout/navbar'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SocketProvider } from '@/providers/socket-provider'
import { cn } from '@/lib/utils'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <main id="main-content" className="mx-auto flex w-full max-w-md flex-1 items-center p-4">
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle role="heading" aria-level={1} className="text-xl">
            Página não encontrada
          </CardTitle>
          <CardDescription>O endereço acessado não existe ou foi movido.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
            Voltar ao catálogo
          </Link>
        </CardContent>
      </Card>
    </main>
  ),
})

function RootLayout() {
  return (
    <SocketProvider>
      <TooltipProvider delay={200}>
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-2 focus:ring-ring"
          >
            Pular para o conteúdo principal
          </a>
          <Navbar />
          <div className="flex flex-1 flex-col">
            <Outlet />
          </div>
          <Footer />
          <Toaster richColors />
        </div>
      </TooltipProvider>
    </SocketProvider>
  )
}
