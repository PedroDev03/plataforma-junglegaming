import type { CartItem, NFT, Order, User } from '@/types/models'
import { INITIAL_NFTS } from './seed'

/** "Banco de dados" simulado: em memória + persistido em localStorage. */
export interface DbUser extends User {
  password: string
}

interface DbSchema {
  users: DbUser[]
  nfts: NFT[]
  cart: CartItem[]
  /** Cupom ativo por userId (ex.: { [userId]: "JUNGLE10" }) */
  coupons: Record<string, string>
  orders: Order[]
}

const STORAGE_KEY = 'nft-marketplace:mock-db'

function seedNfts(): NFT[] {
  return INITIAL_NFTS.map((nft) => ({ ...nft }))
}

function load(): DbSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DbSchema
      parsed.users.forEach((u) => {
        u.wallets ??= []
      })
      if (!Array.isArray(parsed.nfts) || parsed.nfts.length === 0) {
        parsed.nfts = seedNfts()
      } else {
        parsed.nfts = parsed.nfts.map((n) => ({
          ...n,
          creatorName: n.creatorName ?? 'Artista Jungle',
          isFavorited: Boolean(n.isFavorited),
        }))
      }
      parsed.cart = (parsed.cart ?? []).map((item) => ({
        ...item,
        quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
        name: item.name ?? 'NFT Colecionável',
        imageUrl: item.imageUrl ?? '',
        collection: item.collection ?? 'Jungle Collection',
        creatorName: item.creatorName ?? 'Artista Jungle',
      }))
      parsed.coupons ??= {}
      parsed.orders ??= []
      return parsed
    }
  } catch {
    /* dados corrompidos: recria o banco */
  }
  const initial: DbSchema = {
    users: [
      {
        id: 'user-default-collector',
        name: 'Colecionador Jungle',
        email: 'colecionador@junglenft.io',
        password: 'Password123',
        avatarUrl: null,
        wallets: [
          {
            id: 'wallet-default-01',
            label: 'Carteira Principal',
            address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            createdAt: '2026-10-01T10:00:00.000Z',
          },
        ],
        balanceEth: '10.000000000000000000',
        createdAt: '2026-10-01T10:00:00.000Z',
      },
    ],
    nfts: seedNfts(),
    cart: [],
    coupons: {},
    orders: [],
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return initial
}

const state: DbSchema = load()

export const db = {
  get users() {
    return state.users
  },
  get nfts() {
    return state.nfts
  },
  get cart() {
    return state.cart
  },
  get coupons() {
    return state.coupons
  },
  get orders() {
    return state.orders
  },
  /** Persiste o estado atual. Chamar após qualquer mutação. */
  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
  reset(): void {
    localStorage.removeItem(STORAGE_KEY)
    const fresh = load()
    state.users = fresh.users
    state.nfts = fresh.nfts
    state.cart = fresh.cart
    state.coupons = fresh.coupons
    state.orders = fresh.orders
  },
}

export function toPublicUser(user: DbUser): User {
  const { password, ...publicUser } = user
  void password
  return publicUser
}
