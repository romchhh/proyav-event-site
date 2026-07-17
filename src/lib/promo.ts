import { getAllOrders } from './store'
import { getSiteContent } from './site-content'
import type { TicketTierId } from './tickets'
import {
  normalizePromoEntry,
  TIER_PROMO_LABELS,
  type NormalizedPromoCode,
  type PromoCodeConfig,
  type PromoCodesMap,
} from './promo-presets'

export type { PromoCodeConfig, PromoCodesMap, NormalizedPromoCode }
export type PromoCode = NormalizedPromoCode

async function getPromoCodes(): Promise<NormalizedPromoCode[]> {
  const content = await getSiteContent()
  return Object.entries(content.tickets.promoCodes as PromoCodesMap)
    .map(([code, value]) => normalizePromoEntry(code, value))
    .filter((item): item is NormalizedPromoCode => item !== null)
}

export async function getPromoUsageCount(code: string): Promise<number> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return 0

  const orders = await getAllOrders()
  return orders.filter(
    (order) =>
      order.promoCode?.toUpperCase() === normalized &&
      (order.status === 'paid' || order.status === 'upgraded'),
  ).length
}

export async function validatePromoCode(
  input: string,
  options?: { tierId?: TicketTierId },
): Promise<{
  valid: boolean
  percent?: number
  label?: string
  tierId?: TicketTierId
  maxUses?: number
  usedCount?: number
  message: string
}> {
  const code = input.trim().toUpperCase()
  if (!code) {
    return { valid: false, message: 'Введіть промокод' }
  }

  const promo = (await getPromoCodes()).find((item) => item.code === code)
  if (!promo) {
    return { valid: false, message: 'Промокод не знайдено' }
  }

  if (promo.tierId && options?.tierId && promo.tierId !== options.tierId) {
    return {
      valid: false,
      message: `Цей промокод діє лише на тариф «${TIER_PROMO_LABELS[promo.tierId]}»`,
    }
  }

  const usedCount = await getPromoUsageCount(code)
  if (promo.maxUses && usedCount >= promo.maxUses) {
    return {
      valid: false,
      usedCount,
      maxUses: promo.maxUses,
      message: 'Цей промокод уже використано',
    }
  }

  const tierNote = promo.tierId ? ` (лише «${TIER_PROMO_LABELS[promo.tierId]}»)` : ''
  const usesNote = promo.maxUses === 1 ? ', одноразовий' : ''

  return {
    valid: true,
    percent: promo.percent,
    label: promo.label,
    tierId: promo.tierId,
    maxUses: promo.maxUses,
    usedCount,
    message: `Знижка ${promo.percent}% застосована${tierNote}${usesNote}`,
  }
}

export function applyDiscount(price: number, percent: number): number {
  if (percent >= 100) return 0
  const discounted = price * (1 - percent / 100)
  return Math.max(0, Math.round(discounted * 100) / 100)
}
