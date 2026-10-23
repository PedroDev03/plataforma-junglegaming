import { http, HttpResponse, type HttpHandler } from 'msw'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api'
import { db, toPublicUser, type DbUser } from '../db'
import { errorResponse, simulateNetwork } from '../network'

const TOKEN_PREFIX = 'mock-token-'

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export function getUserFromRequest(request: Request): DbUser | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith(`Bearer ${TOKEN_PREFIX}`)) return null
  const userId = header.slice(`Bearer ${TOKEN_PREFIX}`.length)
  return db.users.find((u) => u.id === userId) ?? null
}

export const authHandlers: HttpHandler[] = [
  http.post('/api/login', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const { email, password } = (await request.json()) as LoginRequest
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user || user.password !== password) {
      return errorResponse('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS')
    }
    const body: AuthResponse = { user: toPublicUser(user), token: `${TOKEN_PREFIX}${user.id}` }
    return HttpResponse.json(body)
  }),

  http.post('/api/register', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const { name, email, password } = (await request.json()) as RegisterRequest
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return errorResponse('Este e-mail já está cadastrado.', 409, 'EMAIL_TAKEN')
    }
    const user: DbUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      avatarUrl: null,
      wallets: [
        {
          id: crypto.randomUUID(),
          label: 'Carteira principal',
          address: `0x${randomHex(40)}`,
          createdAt: new Date().toISOString(),
        },
      ],
      balanceEth: '10.000000000000000000',
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    db.save()
    const body: AuthResponse = { user: toPublicUser(user), token: `${TOKEN_PREFIX}${user.id}` }
    return HttpResponse.json(body, { status: 201 })
  }),

  http.get('/api/me', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure

    const user = getUserFromRequest(request)
    if (!user) return errorResponse('Sessão expirada ou inválida.', 401, 'UNAUTHORIZED')
    return HttpResponse.json(toPublicUser(user))
  }),
]
