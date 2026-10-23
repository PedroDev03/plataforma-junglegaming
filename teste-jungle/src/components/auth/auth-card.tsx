import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-md flex-1 items-center p-4 outline-none sm:py-12"
    >
      <Card className="w-full">
        <CardHeader className="gap-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <img
              src="/logo.jfif"
              alt="Logo JungleNFT"
              className="size-4 rounded-xs object-cover"
            />
            <span>JungleNFT Acesso Seguro</span>
          </div>
          <CardTitle role="heading" aria-level={1} className="text-2xl font-bold">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </main>
  )
}
