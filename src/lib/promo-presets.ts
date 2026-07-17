import type { TicketTierId } from '@/lib/tickets'

export type PromoCodeConfig = {
  percent: number
  /** Restrict to one ticket tier; omit = all tiers */
  tierId?: TicketTierId
  /** Max successful paid uses; omit = unlimited */
  maxUses?: number
  label?: string
}

export type PromoCodesMap = Record<string, number | PromoCodeConfig>

export type NormalizedPromoCode = {
  code: string
  percent: number
  tierId?: TicketTierId
  maxUses?: number
  label?: string
}

export function normalizePromoEntry(
  code: string,
  value: number | PromoCodeConfig,
): NormalizedPromoCode | null {
  const normalizedCode = code.trim().toUpperCase()
  if (!normalizedCode) return null

  if (typeof value === 'number') {
    const percent = Math.round(value)
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) return null
    return { code: normalizedCode, percent }
  }

  const percent = Math.round(Number(value.percent))
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) return null

  const tierId = value.tierId
  const maxUsesRaw = value.maxUses
  const maxUses =
    maxUsesRaw === undefined || maxUsesRaw === null
      ? undefined
      : Math.max(1, Math.floor(Number(maxUsesRaw)))

  return {
    code: normalizedCode,
    percent,
    tierId: tierId || undefined,
    maxUses: Number.isFinite(maxUses) ? maxUses : undefined,
    label: value.label?.trim() || undefined,
  }
}

export function normalizePromoCodesMap(input: PromoCodesMap): Record<string, PromoCodeConfig> {
  const result: Record<string, PromoCodeConfig> = {}
  for (const [code, value] of Object.entries(input)) {
    const normalized = normalizePromoEntry(code, value)
    if (!normalized) continue
    result[normalized.code] = {
      percent: normalized.percent,
      ...(normalized.tierId ? { tierId: normalized.tierId } : {}),
      ...(normalized.maxUses ? { maxUses: normalized.maxUses } : {}),
      ...(normalized.label ? { label: normalized.label } : {}),
    }
  }
  return result
}

/** Preset codes for organizers, speakers, and FOUNDER campaign */
export function buildPresetPromoCodes(): Record<string, PromoCodeConfig> {
  const codes: Record<string, PromoCodeConfig> = {
    FOUNDER: { percent: 15, label: 'Засновники −15% (безліміт)' },
    STOROZH: { percent: 15, label: 'Тетяна Сторож −15%' },
    TKACH: { percent: 15, label: 'Антоніна Ткач −15%' },
    MELI: { percent: 15, label: 'Іра Мелі −15%' },
    KRAFT: { percent: 15, label: 'Крафтовики −15%' },
  }

  for (let i = 1; i <= 10; i += 1) {
    codes[`PROYAV_ORG_VIP_${i}`] = {
      percent: 100,
      tierId: 'vip',
      maxUses: 1,
      label: `Організатор VIP #${i}`,
    }
    codes[`PROYAV_ORG_GOLD_${i}`] = {
      percent: 100,
      tierId: 'golden',
      maxUses: 1,
      label: `Організатор Золотий #${i}`,
    }
    codes[`PROYAV_ORG_STD_${i}`] = {
      percent: 100,
      tierId: 'standard',
      maxUses: 1,
      label: `Організатор Стандарт #${i}`,
    }
  }

  return codes
}

export const TIER_PROMO_LABELS: Record<TicketTierId, string> = {
  standard: 'Стандарт',
  golden: 'Золотий',
  vip: 'VIP',
}
