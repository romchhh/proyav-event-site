import { NextResponse } from 'next/server'
import { getOrder, getOrderTickets } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderReference = searchParams.get('orderReference')?.trim()

  if (!orderReference) {
    return NextResponse.json({ error: 'orderReference is required' }, { status: 400 })
  }

  const order = await getOrder(orderReference)
  if (!order) {
    return NextResponse.json({ found: false, status: 'unknown' })
  }

  const tickets = await getOrderTickets(orderReference)

  return NextResponse.json({
    found: true,
    status: order.status,
    emailSent: order.emailSent,
    tierName: order.tierName,
    name: order.name,
    amount: order.amount,
    quantity: order.quantity || 1,
    ticketCode: order.ticketCode,
    tickets: tickets.map((ticket) => ({
      ticketCode: ticket.ticketCode,
      sequence: ticket.sequence,
      checkInStatus: ticket.checkInStatus,
    })),
  })
}
