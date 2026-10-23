import { Activity, Radio, Unplug, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'

export function SocketStatusMenu() {
  const { status, triggerSimulatedNftUpdate, simulateSocketDrop } = useSocket()

  const isConnected = status === 'connected'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Status do Socket.IO: ${isConnected ? 'Conectado' : 'Reconectando'}`}
            className="gap-1.5 px-2"
          />
        }
      >
        <span
          className={cn(
            'size-2 rounded-full',
            isConnected ? 'bg-primary' : 'animate-pulse bg-destructive motion-reduce:animate-none',
          )}
          aria-hidden="true"
        />
        <Radio className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="hidden text-xs text-muted-foreground lg:inline">
          {isConnected ? 'Tempo Real' : 'Reconectando...'}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <Activity className="size-3.5 text-primary" aria-hidden="true" />
            <span>Socket.IO ({isConnected ? 'Online' : 'Offline'})</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => triggerSimulatedNftUpdate()}>
          <Zap className="size-4 text-primary" aria-hidden="true" />
          <span>Emitir nft.updated aleatório</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={simulateSocketDrop}>
          <Unplug className="size-4 text-destructive" aria-hidden="true" />
          <span>Simular queda e reconexão</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
