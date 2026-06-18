import type { TicketTierId } from './tickets'
import type { StoredOrder } from './store'

export const TIER_RANK: Record<TicketTierId, number> = {
  standard: 1,
  golden: 2,
  vip: 3,
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function compareTiers(a: TicketTierId, b: TicketTierId) {
  return TIER_RANK[a] - TIER_RANK[b]
}

export function isActivePaidOrder(order: StoredOrder) {
  return order.status === 'paid' && !order.upgradedToOrderReference
}

export type UpgradeQuote =
  | {
      kind: 'new'
    }
  | {
      kind: 'upgrade'
      fromOrderReference: string
      fromTierId: TicketTierId
      fromTierName: string
      paidAmount: number
      newTierPrice: number
      credit: number
      amountDue: number
    }
  | {
      kind: 'blocked'
      code: 'same_tier' | 'lower_tier' | 'max_tier'
      message: string
      currentTierName?: string
    }

export function buildUpgradeQuote(
  existingOrder: StoredOrder | null,
  targetTierId: TicketTierId,
  targetTierName: string,
  targetPrice: number,
): UpgradeQuote {
  if (!existingOrder || !isActivePaidOrder(existingOrder)) {
    return { kind: 'new' }
  }

  const comparison = compareTiers(targetTierId, existingOrder.tierId)

  if (comparison === 0) {
    return {
      kind: 'blocked',
      code: 'same_tier',
      message: `На цій email-адресі вже є оплачений квиток «${existingOrder.tierName}». Перевірте пошту або напишіть нам.`,
      currentTierName: existingOrder.tierName,
    }
  }

  if (comparison < 0) {
    return {
      kind: 'blocked',
      code: 'lower_tier',
      message: `У вас уже є квиток «${existingOrder.tierName}». Для зміни тарифу оберіть пакет вищого рівня.`,
      currentTierName: existingOrder.tierName,
    }
  }

  const credit = existingOrder.amount
  const amountDue = Math.max(0, targetPrice - credit)

  return {
    kind: 'upgrade',
    fromOrderReference: existingOrder.orderReference,
    fromTierId: existingOrder.tierId,
    fromTierName: existingOrder.tierName,
    paidAmount: credit,
    newTierPrice: targetPrice,
    credit,
    amountDue,
  }
}
