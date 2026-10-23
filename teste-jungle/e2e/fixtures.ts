import { test as base, expect, type Page } from '@playwright/test'

export interface MswTestConfig {
  minDelayMs?: number
  maxDelayMs?: number
  networkErrorRate?: number
  failNextFavoriteWith500?: boolean
  orderDelayMs?: number
}

declare global {
  interface Window {
    __MSW_TEST_CONFIG__?: MswTestConfig
  }
}

/**
 * SVG determinístico usado para substituir imagens externas (Unsplash) em testes E2E,
 * evitando flakiness de rede externa e garantindo snapshots visuais 100% reprodutíveis.
 */
const DETERMINISTIC_NFT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="50%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)" />
  <circle cx="300" cy="300" r="140" fill="none" stroke="#a1a1aa" stroke-width="6" stroke-dasharray="16 12" />
  <polygon points="300,190 390,355 210,355" fill="none" stroke="#e4e4e7" stroke-width="8" />
</svg>`

export async function setupMswPage(page: Page) {
  // 1. Configura o MSW no contexto do navegador para execução determinística em E2E (0% erro aleatório e baixa latência)
  await page.addInitScript(() => {
    window.__MSW_TEST_CONFIG__ = {
      minDelayMs: 30,
      maxDelayMs: 60,
      networkErrorRate: 0,
      failNextFavoriteWith500: false,
      ...window.__MSW_TEST_CONFIG__,
    }
  })

  // 2. Intercepta rotas no Playwright:
  // - Redireciona chamadas `/api/**` diretamente para a infraestrutura mockada do Service Worker (MSW) via `route.continue()`
  // - Intercepta imagens externas (Unsplash) para servir SVG determinístico local
  await page.route('**/*', async (route) => {
    const url = route.request().url()

    if (url.includes('images.unsplash.com')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: DETERMINISTIC_NFT_SVG,
      })
      return
    }

    await route.continue()
  })
}

export const test = base.extend({
  page: async ({ page }, runTest) => {
    await setupMswPage(page)
    await runTest(page)
  },
})

export { expect }
