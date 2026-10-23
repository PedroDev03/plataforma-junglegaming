import { expect, test } from './fixtures'

test.describe('Idempotência no Checkout (Timeout seguido de Retry)', () => {
  test('preserva a chave x-idempotency-key após timeout na 1ª tentativa e recupera o mesmo pedido no retry sem cobrança duplicada', async ({
    page,
  }) => {
    const capturedIdempotencyKeys: string[] = []

    // Monitora todas as requisições POST /api/orders enviadas ao MSW
    page.on('request', (request) => {
      if (request.url().endsWith('/api/orders') && request.method() === 'POST') {
        const key = request.headers()['x-idempotency-key']
        if (key) capturedIdempotencyKeys.push(key)
      }
    })

    // 1. Login e adição de item ao carrinho
    await page.goto('/login')
    await page.getByLabel('E-mail').fill('colecionador@junglenft.io')
    await page.getByLabel('Senha').fill('Password123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('http://localhost:5173/')

    // Adiciona "Nebula Genesis #01" (1.25 ETH)
    const nebulaCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Nebula Genesis #01' }) })
    await nebulaCard.getByRole('button', { name: 'Adicionar' }).click()
    await expect(page.getByRole('button', { name: /Abrir carrinho \(1 itens\)/ })).toBeVisible()
    await expect(nebulaCard.getByRole('button', { name: 'Adicionar' })).toBeEnabled()

    // 2. Acessa o Checkout e ativa o switch "Simular Timeout na 1ª tentativa"
    await page.goto('/checkout')
    await expect(page.getByRole('heading', { name: 'Checkout Web3' })).toBeVisible()

    const displayedKey = (await page.locator('code').first().textContent())?.trim()
    expect(displayedKey).toBeTruthy()

    await page.getByRole('switch', { name: 'Simular Timeout na 1ª tentativa' }).click()

    // 3. Dispara a 1ª tentativa: o cliente aborta por timeout (1200ms) enquanto o MSW processa (2800ms+)
    const confirmBtn = page.getByRole('button', { name: 'Confirmar e Pagar em ETH' })
    await confirmBtn.click()

    // O botão fica desabilitado durante o processamento prevenindo clique duplo
    await expect(
      page.getByRole('button', { name: /Confirmando transação na rede/ }),
    ).toBeDisabled()

    // Aguarda o alerta de Timeout com proteção de idempotência ativa
    await expect(
      page.getByText('Timeout detectado — Proteção de Idempotência Ativa'),
    ).toBeVisible()

    // A chave exibida na UI permanece exatamente a mesma
    await expect(page.locator('code').first()).toHaveText(displayedKey!)

    // 4. Reenvia o pedido com a mesma chave de idempotência
    await page.getByRole('button', { name: 'Reenviar com a mesma chave' }).click()

    // 5. Redireciona para o recibo recuperado e verifica que não houve cobrança dupla
    await expect(page).toHaveURL(/\/orders\/ord-/)
    await expect(page.getByRole('heading', { name: /Recibo do Pedido #ord-/ })).toBeVisible()
    await expect(page.getByText(displayedKey!)).toBeVisible()

    // Confirma que ambas as requisições (1ª tentativa e retry) enviaram exatamente a mesma x-idempotency-key
    expect(capturedIdempotencyKeys.length).toBe(2)
    expect(capturedIdempotencyKeys[0]).toBe(displayedKey)
    expect(capturedIdempotencyKeys[1]).toBe(displayedKey)

    // Saldo inicial (10.0000 ETH) - Compra única (1.2500 ETH + 0.0150 ETH taxa = 1.2650 ETH) = 8.7350 ETH -> exibido como 8.73 ETH (debitado apenas 1 vez!)
    await expect(page.getByText('8.73 ETH')).toBeVisible()
    await expect(page.getByText('1.265 ETH')).toBeVisible()
  })
})
