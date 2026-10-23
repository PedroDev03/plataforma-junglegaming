/** Valor em ETH como string decimal (ex.: "1.250000000000000000"). Nunca usar number. */
export type EthAmount = string

export interface Wallet {
  id: string
  label: string
  /** Endereço Ethereum (0x + 40 hex) */
  address: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  wallets: Wallet[]
  balanceEth: EthAmount
  createdAt: string
}

export type NftCategory = 'art' | 'music' | 'photography' | 'game' | 'collectible'

export type NftSortBy = 'recent' | 'price_asc' | 'price_desc' | 'popular'

export interface NFT {
  id: string
  name: string
  description: string
  imageUrl: string
  collection: string
  creatorName: string
  creatorId: string
  ownerId: string | null
  priceEth: EthAmount
  category: NftCategory
  likes: number
  isFavorited: boolean
  available: boolean
  createdAt: string
}

export interface CartItem {
  id: string
  userId: string
  nftId: string
  name: string
  imageUrl: string
  collection: string
  creatorName: string
  /** Preço unitário em ETH no momento em que o item foi adicionado */
  priceEth: EthAmount
  quantity: number
  addedAt: string
}

export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface OrderItem {
  nftId: string
  name: string
  imageUrl: string
  collection: string
  creatorName: string
  priceEth: EthAmount
  quantity: number
  lineTotalEth: EthAmount
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  walletAddress: string
  couponCode: string | null
  discountPercent: number
  subtotalEth: EthAmount
  discountEth: EthAmount
  feeEth: EthAmount
  totalEth: EthAmount
  txHash: string
  status: OrderStatus
  /** Chave de idempotência enviada pelo cliente (header x-idempotency-key) */
  idempotencyKey: string
  createdAt: string
}

export interface NftUpdatedEvent {
  nftId: string
  name: string
  collection: string
  oldPriceEth: EthAmount
  newPriceEth: EthAmount
  available: boolean
  updatedAt: string
}

export interface OrderUpdatedEvent {
  orderId: string
  status: OrderStatus
  totalEth: EthAmount
  updatedAt: string
}
