import { io, type Socket } from 'socket.io-client'

export const socket: Socket = io('wss://realtime.junglenft.local', {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 3000,
})
