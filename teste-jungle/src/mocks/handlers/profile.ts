import { http, HttpResponse, type HttpHandler } from 'msw'
import type { AddWalletRequest, ChangePasswordRequest, UpdateProfileRequest } from '@/types/api'
import type { Wallet } from '@/types/models'
import { db, toPublicUser } from '../db'
import { errorResponse, simulateNetwork } from '../network'
import { getUserFromRequest } from './auth'

const MAX_WALLETS = 5
const unauthorized = () => errorResponse('Sessão expirada ou inválida.', 401, 'UNAUTHORIZED')

export const profileHandlers: HttpHandler[] = [
  http.patch('/api/me', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { name, email } = (await request.json()) as UpdateProfileRequest
    const taken = db.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase())
    if (taken) return errorResponse('Este e-mail já está em uso.', 409, 'EMAIL_TAKEN')

    user.name = name
    user.email = email
    db.save()
    return HttpResponse.json(toPublicUser(user))
  }),

  // 400 (e não 401) para senha atual incorreta: 401 dispararia o logout global.
  http.put('/api/me/password', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { currentPassword, newPassword } = (await request.json()) as ChangePasswordRequest
    if (user.password !== currentPassword) {
      return errorResponse('A senha atual está incorreta.', 400, 'INVALID_CURRENT_PASSWORD')
    }
    user.password = newPassword
    db.save()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/me/wallets', async ({ request }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const { label, address } = (await request.json()) as AddWalletRequest
    if (user.wallets.length >= MAX_WALLETS) {
      return errorResponse(`Limite de ${MAX_WALLETS} carteiras atingido.`, 422, 'WALLET_LIMIT')
    }
    if (user.wallets.some((w) => w.address.toLowerCase() === address.toLowerCase())) {
      return errorResponse('Esta carteira já está vinculada.', 409, 'WALLET_EXISTS')
    }
    const wallet: Wallet = { id: crypto.randomUUID(), label, address, createdAt: new Date().toISOString() }
    user.wallets.push(wallet)
    db.save()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.delete('/api/me/wallets/:walletId', async ({ request, params }) => {
    const failure = await simulateNetwork()
    if (failure) return failure
    const user = getUserFromRequest(request)
    if (!user) return unauthorized()

    const index = user.wallets.findIndex((w) => w.id === params.walletId)
    if (index === -1) return errorResponse('Carteira não encontrada.', 404, 'NOT_FOUND')
    user.wallets.splice(index, 1)
    db.save()
    return new HttpResponse(null, { status: 204 })
  }),
]
