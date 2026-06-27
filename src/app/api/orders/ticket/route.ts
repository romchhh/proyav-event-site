import { NextResponse } from 'next/server'
import { generateTicketInvitationPng, getTicketFilename } from '@/lib/ticket-invitation'
import { getOrder, getOrderTickets } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderReference = searchParams.get('orderReference')?.trim()
  const ticketCode = searchParams.get('ticketCode')?.trim()
  const download = searchParams.get('download') === '1'

  if (!orderReference) {
    return NextResponse.json({ error: 'orderReference is required' }, { status: 400 })
  }

  const order = await getOrder(orderReference)
  if (!order || order.status !== 'paid') {
    return NextResponse.json({ error: 'Квиток недоступний' }, { status: 404 })
  }

  try {
    const tickets = await getOrderTickets(orderReference)
    const ticket = ticketCode
      ? tickets.find((item) => item.ticketCode.toUpperCase() === ticketCode.toUpperCase())
      : tickets[0]

    const png = await generateTicketInvitationPng(order, ticket)
    const filename = getTicketFilename(orderReference, ticket?.ticketCode)
    const disposition = download ? 'attachment' : 'inline'

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[ticket] Failed to generate invitation:', error)
    return NextResponse.json({ error: 'Не вдалося згенерувати квиток' }, { status: 500 })
  }
}
