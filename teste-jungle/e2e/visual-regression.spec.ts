import { expect, test } from './fixtures'

test.describe('Regressão Visual Básica: Home e Carrinho', () => {
  test('mantém consistência visual da Home (Catálogo de NFTs)', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Explore Colecionáveis Digitais Raros' }),
    ).toBeVisible()
    await expect(page.getByRole('region', { name: 'Lista de NFTs' }).locator('article')).toHaveCount(
      8,
    )

    await expect(page).toHaveScreenshot('home-catalog.png', {
      fullPage: false,
    })
  })

  test('mantém consistência visual da página de Carrinho com item e resumo em ETH', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill('colecionador@junglenft.io')
    await page.getByLabel('Senha').fill('Password123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('http://localhost:5173/')

    const nebulaCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Nebula Genesis #01' }) })
    await nebulaCard.getByRole('button', { name: 'Adicionar' }).click()
    await expect(page.getByRole('button', { name: /Abrir carrinho \(1 itens\)/ })).toBeVisible()
    await expect(nebulaCard.getByRole('button', { name: 'Adicionar' })).toBeEnabled()

    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Carrinho de Compras' })).toBeVisible()
    await expect(
      page.getByRole('article', { name: 'Item do carrinho: Nebula Genesis #01' }),
    ).toBeVisible()

    await expect(page).toHaveScreenshot('cart-with-item.png', {
      fullPage: false,
    })
  })
})
