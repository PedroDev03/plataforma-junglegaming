import { io, type Socket } from 'socket.io-client'

export const socket: Socket = io('/', {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 3000,
})
