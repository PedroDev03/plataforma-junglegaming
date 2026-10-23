import { expect, test } from './fixtures'

test.describe('Fluxo Completo de Compra (E2E)', () => {
  test('Login -> Adicionar ao Carrinho -> Aplicar Cupom -> Comprar -> Recibo Estático', async ({
    page,
  }) => {
    // Reduz o delay artificial do endpoint POST /api/orders no MSW para agilizar o teste de fluxo padrão
    await page.addInitScript(() => {
      window.__MSW_TEST_CONFIG__ = {
        minDelayMs: 25,
        maxDelayMs: 50,
        networkErrorRate: 0,
        orderDelayMs: 200,
      }
    })

    // 1. Acessa a tela de Login e autentica com o colecionador padrão do MSW
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

    await page.getByLabel('E-mail').fill('colecionador@junglenft.io')
    await page.getByLabel('Senha').fill('Password123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Aguarda redirecionamento para o catálogo autenticado
    await expect(page).toHaveURL('http://localhost:5173/')
    await expect(page.getByRole('button', { name: 'Abrir menu da conta' })).toBeVisible()

    // 2. Adiciona o NFT "Prism Relic #404" (4.50 ETH) ao carrinho
    const prismCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Prism Relic #404' }) })
    await expect(prismCard).toBeVisible()
    await prismCard.getByRole('button', { name: 'Adicionar' }).click()

    // Verifica que o contador do carrinho no cabeçalho atualizou para 1 item e aguarda botão concluir mutação
    await expect(page.getByRole('button', { name: /Abrir carrinho \(1 itens\)/ })).toBeVisible()
    await expect(prismCard.getByRole('button', { name: 'Adicionar' })).toBeEnabled()

    // 3. Navega para a página do Carrinho e aplica o cupom JUNGLE10 (10% OFF)
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Carrinho de Compras' })).toBeVisible()
    await expect(page.getByRole('article', { name: 'Item do carrinho: Prism Relic #404' })).toBeVisible()

    // Subtotal: 4.50 ETH | Desconto 10%: 0.45 ETH | Taxa fixa: 0.015 ETH | Total: 4.065 ETH
    await page.getByLabel('Cupom de desconto').fill('JUNGLE10')
    await page.getByRole('button', { name: 'Aplicar cupom' }).click()

    await expect(page.getByRole('button', { name: 'Remover cupom JUNGLE10' })).toBeVisible()
    await expect(page.getByText('- 0.45 ETH')).toBeVisible()
    await expect(page.getByText('4.065 ETH')).toBeVisible()

    // 4. Avança para o Checkout e confirma o pagamento em ETH
    await page.getByRole('link', { name: 'Ir para o Checkout' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByRole('heading', { name: 'Checkout Web3' })).toBeVisible()
    await expect(page.getByText('JUNGLE10 (-10%)')).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar e Pagar em ETH' }).click()

    // 5. Verifica redirecionamento para a página de Recibo (Snapshot Estático) e dados da compra
    await expect(page).toHaveURL(/\/orders\/ord-/)
    await expect(page.getByRole('heading', { name: /Recibo do Pedido #ord-/ })).toBeVisible()
    await expect(page.getByText('Transação Confirmada (Snapshot Estático)')).toBeVisible()
    await expect(page.getByText('Prism Relic #404', { exact: true })).toBeVisible()
    await expect(page.getByText('JUNGLE10 (-10%)')).toBeVisible()
    await expect(page.getByText('4.065 ETH')).toBeVisible()

    // 6. Confirma que o item comprado foi removido do carrinho
    await page.getByRole('link', { name: 'Ver carrinho restante' }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })
})
