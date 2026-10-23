import { expect, test } from './fixtures'

test.describe('Catálogo (Home): Filtros sincronizados na URL e Paginação', () => {
  test('carrega a Home, sincroniza filtros combinados na URL e reinicia a paginação ao filtrar', async ({
    page,
  }) => {
    await page.goto('/')

    // 1. Verifica renderização inicial do catálogo (Página 1 de 2, 12 NFTs no seed, 8 por página)
    await expect(
      page.getByRole('heading', { name: 'Explore Colecionáveis Digitais Raros' }),
    ).toBeVisible()

    const catalogList = page.getByRole('region', { name: 'Lista de NFTs' })
    await expect(catalogList).toBeVisible()
    await expect(catalogList.locator('article')).toHaveCount(8)

    const pagination = page.getByRole('navigation', { name: 'Paginação do catálogo' })
    await expect(pagination).toContainText('Página 1 de 2 (12 NFTs)')

    // 2. Navega para a página 2 e valida actualización do search param `page=2` na URL
    await pagination.getByRole('button', { name: 'Ir para a página 2' }).click()
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(pagination).toContainText('Página 2 de 2 (12 NFTs)')
    await expect(catalogList.locator('article')).toHaveCount(4)

    // 3. Seleciona a categoria "Arte" — deve atualizar `category=art` na URL e reiniciar `page` para 1
    const categoryGroup = page.getByRole('group', { name: 'Filtrar por categoria' })
    await categoryGroup.getByRole('button', { name: 'Arte' }).click()

    await expect(page).toHaveURL(/category=art/)
    await expect(page).not.toHaveURL(/page=2/)
    await expect(catalogList.locator('article')).toHaveCount(3)

    // 4. Combina busca textual e faixa de preço em ETH via formulário
    await page.getByLabel('Buscar no catálogo').fill('Nebula')
    await page.getByLabel('Preço mín. (ETH)').fill('1.0')
    await page.getByLabel('Preço máx. (ETH)').fill('2.0')
    await page.getByRole('button', { name: 'Aplicar' }).click()

    await expect(page).toHaveURL(/q=Nebula/)
    await expect(page).toHaveURL(/minPrice=(?:%22)?1\.0(?:%22)?/)
    await expect(page).toHaveURL(/maxPrice=(?:%22)?2\.0(?:%22)?/)
    await expect(catalogList.locator('article')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Nebula Genesis #01' })).toBeVisible()

    // 5. Limpa todos os filtros e verifica restauração da URL e listagem completa
    await page.getByRole('button', { name: 'Limpar todos os filtros' }).click()
    await expect(page).not.toHaveURL(/category=/)
    await expect(page).not.toHaveURL(/q=/)
    await expect(catalogList.locator('article')).toHaveCount(8)
  })
})
