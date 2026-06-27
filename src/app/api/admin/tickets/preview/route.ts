import { NextResponse } from 'next/server'
import { isAdminApiAuthorized } from '@/lib/admin-auth'
import { getOrder } from '@/lib/store'
import { getSiteContent } from '@/lib/site-content'
import { generateTicketInvitationPng } from '@/lib/ticket-invitation'
import type { StoredOrder } from '@/lib/store'
import type { TicketTierId } from '@/lib/tickets'

export const dynamic = 'force-dynamic'

const TIER_IDS: TicketTierId[] = ['standard', 'golden', 'vip']

function buildSampleOrder(tierId: TicketTierId, tierName: string, name: string): StoredOrder {
  const now = new Date().toISOString()
  return {
    orderReference: 'PROYAV-PREVIEW-000001',
    ticketCode: 'PRO-000001',
    name,
    email: 'preview@proyav.ua',
    phone: '380501234567',
    tierId,
    tierName,
    wave: 'early',
    amount: 1700,
    quantity: 1,
    status: 'paid',
    emailSent: true,
    createdAt: now,
    paidAt: now,
    checkInStatus: 'none',
  }
}

export async function GET(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const orderReference = searchParams.get('orderReference')?.trim()
  const name = searchParams.get('name')?.trim() || 'Олена Коваленко'
  const tierIdRaw = searchParams.get('tierId')?.trim() ?? 'standard'
  const tierId = TIER_IDS.includes(tierIdRaw as TicketTierId) ? (tierIdRaw as TicketTierId) : 'standard'

  try {
    let order: StoredOrder

    if (orderReference) {
      const found = await getOrder(orderReference)
      if (!found) {
        return NextResponse.json({ error: 'Замовлення не знайдено' }, { status: 404 })
      }
      order = found
    } else {
      const content = await getSiteContent()
      const tier = content.tickets.tiers.find((item) => item.id === tierId) ?? content.tickets.tiers[0]
      order = buildSampleOrder(tier.id, tier.name, name)
    }

    const png = await generateTicketInvitationPng(order)

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="proyav-ticket-preview.png"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[admin] Ticket preview failed:', error)
    return NextResponse.json({ error: 'Не вдалося згенерувати превʼю' }, { status: 500 })
  }
}
