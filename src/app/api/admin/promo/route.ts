import { NextResponse } from 'next/server'
import { isAdminApiAuthorized } from '@/lib/admin-auth'
import {
  buildPresetPromoCodes,
  normalizePromoCodesMap,
  normalizePromoEntry,
  TIER_PROMO_LABELS,
  type PromoCodeConfig,
  type PromoCodesMap,
} from '@/lib/promo-presets'
import { getPromoUsageCount } from '@/lib/promo'
import { getSiteContent, saveSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const content = await getSiteContent()
  const entries = Object.entries(content.tickets.promoCodes as PromoCodesMap)
    .map(([code, value]) => normalizePromoEntry(code, value))
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const promoCodes = await Promise.all(
    entries.map(async (item) => {
      const usedCount = await getPromoUsageCount(item.code)
      return {
        code: item.code,
        percent: item.percent,
        tierId: item.tierId ?? null,
        tierLabel: item.tierId ? TIER_PROMO_LABELS[item.tierId] : null,
        maxUses: item.maxUses ?? null,
        label: item.label ?? null,
        usedCount,
        exhausted: Boolean(item.maxUses && usedCount >= item.maxUses),
      }
    }),
  )

  promoCodes.sort((a, b) => a.code.localeCompare(b.code, 'uk'))

  return NextResponse.json({ promoCodes })
}

export async function PUT(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { promoCodes?: PromoCodesMap }
    if (!body.promoCodes || typeof body.promoCodes !== 'object') {
      return NextResponse.json({ error: 'Некоректні дані' }, { status: 400 })
    }

    const content = await getSiteContent()
    const promoCodes = normalizePromoCodesMap(body.promoCodes)
    await saveSiteContent({
      tickets: {
        ...content.tickets,
        promoCodes,
      },
    })

    return NextResponse.json({ ok: true, promoCodes })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зберегти' }, { status: 400 })
  }
}

/** Merge preset FOUNDER / org / speaker codes into existing promo list */
export async function POST(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { action?: string }
    if (body.action !== 'seed-presets') {
      return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
    }

    const content = await getSiteContent()
    const current = normalizePromoCodesMap(content.tickets.promoCodes as PromoCodesMap)
    const presets = buildPresetPromoCodes()

    let added = 0
    let updated = 0
    const next: Record<string, PromoCodeConfig> = { ...current }

    for (const [code, config] of Object.entries(presets)) {
      if (next[code]) {
        next[code] = { ...next[code], ...config }
        updated += 1
      } else {
        next[code] = config
        added += 1
      }
    }

    await saveSiteContent({
      tickets: {
        ...content.tickets,
        promoCodes: next,
      },
    })

    return NextResponse.json({
      ok: true,
      added,
      updated,
      total: Object.keys(next).length,
      message: `Додано ${added}, оновлено ${updated} промокодів`,
    })
  } catch {
    return NextResponse.json({ error: 'Не вдалося додати промокоди' }, { status: 500 })
  }
}
