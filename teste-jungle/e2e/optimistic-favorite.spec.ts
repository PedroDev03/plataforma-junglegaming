import { expect, test } from './fixtures'

test.describe('Optimistic Update e Rollback no Botão de Favoritar', () => {
  test('aplica atualização otimista imediata na cor/contador do botão de favorito e executa rollback ao receber erro 500 do MSW', async ({
    page,
  }) => {
    await page.goto('/')

    const nebulaCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Nebula Genesis #01' }) })
    await expect(nebulaCard).toBeVisible()

    // Estado inicial: não favoritado (`aria-pressed="false"`, sem classe `text-destructive`, 142 likes)
    const favButton = nebulaCard.getByRole('button', { name: /Nebula Genesis #01/ })
    await expect(favButton).toHaveAttribute('aria-pressed', 'false')
    await expect(favButton).not.toHaveClass(/text-destructive/)
    await expect(favButton).toContainText('142')

    // Configura o MSW no navegador para responder com HTTP 500 após 600ms no próximo POST /api/nfts/:id/favorite
    await page.evaluate(() => {
      window.__MSW_TEST_CONFIG__ = {
        minDelayMs: 600,
        maxDelayMs: 600,
        networkErrorRate: 0,
        failNextFavoriteWith500: true,
      }
    })

    // Clica para favoritar
    await favButton.click()

    // 1. Verificação Otimista Imediata (antes do MSW responder):
    // O botão muda instantaneamente para `aria-pressed="true"`, recebe a cor `text-destructive` e incrementa likes para 143
    await expect(favButton).toHaveAttribute('aria-pressed', 'true')
    await expect(favButton).toHaveClass(/text-destructive/)
    await expect(favButton).toContainText('143')

    // 2. Verificação de Rollback após resposta HTTP 500 do MSW:
    // O estado reverte para `aria-pressed="false"`, remove `text-destructive`, volta para 142 likes e exibe toast de erro
    await expect(favButton).toHaveAttribute('aria-pressed', 'false')
    await expect(favButton).not.toHaveClass(/text-destructive/)
    await expect(favButton).toContainText('142')
    await expect(
      page.getByText('Falha interna no servidor ao atualizar favorito (500).'),
    ).toBeVisible()
  })
})
