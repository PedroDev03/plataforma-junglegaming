/** Aceita apenas caminhos internos (evita open redirect). */
export function safeRedirect(target: string | undefined): string {
  if (target && target.startsWith('/') && !target.startsWith('//')) return target
  return '/'
}
