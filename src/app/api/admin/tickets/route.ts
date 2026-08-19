import { NextResponse } from 'next/server'
import { isAdminApiAuthorized } from '@/lib/admin-auth'
import { cancelOrder, getAllOrders } from '@/lib/store'

export async function GET(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const query = searchParams.get('q')?.trim().toLowerCase() ?? ''

  let orders = await getAllOrders()

  if (status && status !== 'all') {
    orders = orders.filter((order) => order.status === status)
  }

  if (query) {
    orders = orders.filter((order) => {
      const haystack = [
        order.ticketCode,
        order.orderReference,
        order.name,
        order.email,
        order.phone,
        order.tierName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  orders.sort((a, b) => {
    const aTime = new Date(a.paidAt ?? a.createdAt).getTime()
    const bTime = new Date(b.paidAt ?? b.createdAt).getTime()
    return bTime - aTime
  })

  return NextResponse.json({
    total: orders.length,
    paid: orders.filter((order) => order.status === 'paid').length,
    pending: orders.filter((order) => order.status === 'pending').length,
    admitted: orders.filter((order) => order.checkInStatus === 'admitted').length,
    orders,
  })
}

export async function PATCH(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { orderReference?: string; action?: 'cancel'; note?: string }
    const orderReference = body.orderReference?.trim()

    if (!orderReference || body.action !== 'cancel') {
      return NextResponse.json({ error: 'Некоректний запит' }, { status: 400 })
    }

    const updated = await cancelOrder(orderReference, body.note)
    if (!updated) {
      return NextResponse.json({ error: 'Замовлення не знайдено' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, order: updated })
  } catch {
    return NextResponse.json({ error: 'Не вдалося анулювати квиток' }, { status: 500 })
  }
}
