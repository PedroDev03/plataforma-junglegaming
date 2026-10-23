import Decimal from 'decimal.js'
import type { EthAmount } from '@/types/models'

// Configura precisão de 36 dígitos significativos para operações Wei/ETH de 18 casas decimais
Decimal.set({ precision: 36, rounding: Decimal.ROUND_DOWN })

export const ZERO_ETH: EthAmount = '0.000000000000000000'
export const FIXED_NETWORK_FEE_ETH: EthAmount = '0.015000000000000000'

/** Valida se uma string representa um valor decimal de ETH válido e não-negativo. */
export function isValidEthString(value: string): boolean {
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,18})?$/.test(trimmed)) return false
  try {
    const d = new Decimal(trimmed)
    return d.isFinite() && d.gte(0)
  } catch {
    return false
  }
}

/** Compara dois valores em ETH usando Decimal. Retorna -1, 0 ou 1. */
export function compareEth(a: EthAmount, b: EthAmount): number {
  return new Decimal(a).cmp(new Decimal(b))
}

/** Multiplica um valor em ETH por uma quantidade inteira mantendo string decimal de 18 casas. */
export function multiplyEth(priceEth: EthAmount, quantity: number): EthAmount {
  return new Decimal(priceEth).mul(quantity).toFixed(18)
}

/** Soma uma lista de valores em ETH mantendo string decimal de 18 casas. */
export function sumEth(values: EthAmount[]): EthAmount {
  return values.reduce((acc, curr) => acc.plus(new Decimal(curr)), new Decimal(0)).toFixed(18)
}

/** Subtrai `b` de `a` em ETH mantendo string decimal de 18 casas (mínimo 0). */
export function subtractEth(a: EthAmount, b: EthAmount): EthAmount {
  return Decimal.max(0, new Decimal(a).minus(new Decimal(b))).toFixed(18)
}

export interface CartTotals {
  subtotalEth: EthAmount
  discountEth: EthAmount
  feeEth: EthAmount
  totalEth: EthAmount
}

/**
 * Calcula Subtotal, Desconto percentual, Taxa Fixa e Total em ETH
 * exclusivamente via `Decimal` (sem erros de ponto flutuante).
 */
export function calculateCartTotals(
  items: Array<{ priceEth: EthAmount; quantity: number }>,
  discountPercent = 0,
): CartTotals {
  if (items.length === 0) {
    return {
      subtotalEth: ZERO_ETH,
      discountEth: ZERO_ETH,
      feeEth: ZERO_ETH,
      totalEth: ZERO_ETH,
    }
  }

  const subtotal = items.reduce(
    (acc, item) => acc.plus(new Decimal(item.priceEth).mul(item.quantity)),
    new Decimal(0),
  )

  const clampedPercent = Math.max(0, Math.min(100, discountPercent))
  const discount = subtotal.mul(clampedPercent).div(100)
  const fee = new Decimal(FIXED_NETWORK_FEE_ETH)
  const netSubtotal = Decimal.max(0, subtotal.minus(discount))
  const total = netSubtotal.plus(fee)

  return {
    subtotalEth: subtotal.toFixed(18),
    discountEth: discount.toFixed(18),
    feeEth: fee.toFixed(18),
    totalEth: total.toFixed(18),
  }
}

/** Formata uma string decimal de ETH para exibição humana (ex.: "1.25"), sem usar ponto flutuante nativo. */
export function formatEth(value: EthAmount, maxDecimals = 4): string {
  try {
    const d = new Decimal(value)
    const fixed = d.toDecimalPlaces(maxDecimals, Decimal.ROUND_DOWN).toFixed()
    const [intPart, decPart = ''] = fixed.split('.')
    const paddedDec = decPart.length < 2 ? decPart.padEnd(2, '0') : decPart
    return `${intPart}.${paddedDec}`
  } catch {
    return value
  }
}
