import { NextResponse } from 'next/server'
import { getPricingConfigFromContent, getTierPrice } from '@/lib/ticket-pricing'
import { getActivePaidOrderByEmail, getSalesCounts } from '@/lib/store'
import { getSiteContent } from '@/lib/site-content'
import type { TicketTierId } from '@/lib/tickets'
import { buildUpgradeQuote, normalizeEmail } from '@/lib/tier-upgrade'

type UpgradeCheckBody = {
  email?: string
  tierId?: TicketTierId
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpgradeCheckBody
    const email = body.email?.trim() ?? ''
    const tierId = body.tierId

    if (!tierId) {
      return NextResponse.json({ error: 'Оберіть тариф' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ quote: { kind: 'new' } })
    }

    const content = await getSiteContent()
    const tier = content.tickets.tiers.find((item) => item.id === tierId)
    if (!tier) {
      return NextResponse.json({ error: 'Невідомий тариф' }, { status: 400 })
    }

    const sales = await getSalesCounts()
    const pricingConfig = getPricingConfigFromContent(content.tickets)
    const pricing = getTierPrice(tierId, sales, pricingConfig)
    const existingOrder = await getActivePaidOrderByEmail(normalizeEmail(email))
    const quote = buildUpgradeQuote(existingOrder, tierId, tier.name, pricing.price)

    return NextResponse.json({
      quote,
      tierName: tier.name,
      tierPrice: pricing.price,
    })
  } catch {
    return NextResponse.json({ error: 'Не вдалося перевірити email' }, { status: 500 })
  }
}
