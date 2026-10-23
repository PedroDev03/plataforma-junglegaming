import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { socketHandlers } from './socket'

export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...nftHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...socketHandlers,
]
