import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton com exatamente as mesmas proporções do `<NftCard />` (aspect-square,
 * cabeçalho com avatar do criador, bloco de preço, separador e rodapé) para evitar CLS.
 */
export function NftCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden pt-0" aria-hidden="true">
      <div className="relative aspect-square w-full">
        <Skeleton className="size-full rounded-none" />
      </div>

      <CardHeader className="gap-1.5 pb-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      </CardHeader>

      <CardContent className="mt-auto pt-0">
        <Skeleton className="h-9 w-full rounded-lg" />
      </CardContent>

      <Separator />

      <CardFooter className="grid grid-cols-2 gap-2 pt-3">
        <Skeleton className="h-7 w-full rounded-lg" />
        <Skeleton className="h-7 w-full rounded-lg" />
      </CardFooter>
    </Card>
  )
}
