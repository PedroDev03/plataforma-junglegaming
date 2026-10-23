import type { CartItem, EthAmount, NFT, NftCategory, NftSortBy, Order, User } from './models'

export interface NftListParams {
  q?: string
  category?: NftCategory
  collection?: string
  minPrice?: string
  maxPrice?: string
  onlyAvailable?: boolean
  onlyFavorites?: boolean
  sort: NftSortBy
  page: number
  pageSize: number
}

export interface PaginatedNftsResponse {
  items: NFT[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  collections: string[]
}

export interface ToggleFavoriteResponse {
  id: string
  likes: number
  isFavorited: boolean
}

export interface CartResponse {
  items: CartItem[]
  totalItems: number
  couponCode: string | null
  discountPercent: number
  subtotalEth: EthAmount
  discountEth: EthAmount
  feeEth: EthAmount
  totalEth: EthAmount
}

export interface AddToCartRequest {
  nftId: string
  quantity?: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface ApplyCouponRequest {
  code: string
}

export interface CreateOrderRequest {
  /** IDs dos CartItems selecionados para compra */
  itemIds: string[]
  walletAddress: string
  /** Cupom esperado pelo cliente no momento do checkout */
  couponCode: string | null
  /** Chave de idempotência também enviada via header x-idempotency-key */
  idempotencyKey: string
}

export interface ValidateCheckoutResponse {
  valid: boolean
  issues: string[]
  cart: CartResponse
}

export type OrderResponse = Order

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface UpdateProfileRequest {
  name: string
  email: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface AddWalletRequest {
  label: string
  address: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiErrorBody {
  message: string
  code?: string
}
