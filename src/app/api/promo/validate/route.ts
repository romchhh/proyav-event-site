import { NextResponse } from 'next/server'
import { validatePromoCode } from '@/lib/promo'
import type { TicketTierId } from '@/lib/tickets'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string; tierId?: TicketTierId }
    const result = await validatePromoCode(body.code ?? '', { tierId: body.tierId })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ valid: false, message: 'Некоректний запит' }, { status: 400 })
  }
}
