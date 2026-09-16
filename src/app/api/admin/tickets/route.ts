import { NextResponse } from 'next/server'
import { isAdminApiAuthorized } from '@/lib/admin-auth'
import { cancelOrder, getAllOrders, type StoredOrder } from '@/lib/store'
import { resendTicketEmail } from '@/lib/wayforpay-fulfillment'

export const dynamic = 'force-dynamic'

function ticketCount(orders: StoredOrder[]) {
  return orders.reduce((sum, order) => sum + (order.quantity || 1), 0)
}

function isPaidWithMoney(order: StoredOrder) {
  return order.status === 'paid' && order.amount > 0
}

function isPaidFree(order: StoredOrder) {
  return order.status === 'paid' && order.amount < 1
}

export async function GET(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'all'
  const query = searchParams.get('q')?.trim().toLowerCase() ?? ''

  const allOrders = await getAllOrders()
  const paidOrders = allOrders.filter((order) => order.status === 'paid')
  const paidMoneyOrders = paidOrders.filter((order) => order.amount > 0)
  const paidFreeOrders = paidOrders.filter((order) => order.amount < 1)

  let orders = [...allOrders]

  if (status === 'paid_money') {
    orders = orders.filter(isPaidWithMoney)
  } else if (status === 'paid_free') {
    orders = orders.filter(isPaidFree)
  } else if (status !== 'all') {
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
        order.promoCode,
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
    stats: {
      total: ticketCount(allOrders),
      paid: ticketCount(paidOrders),
      paidMoney: ticketCount(paidMoneyOrders),
      paidFree: ticketCount(paidFreeOrders),
      payments: paidMoneyOrders.length,
      revenue: paidMoneyOrders.reduce((sum, order) => sum + order.amount, 0),
      pending: ticketCount(allOrders.filter((order) => order.status === 'pending')),
      admitted: allOrders.filter((order) => order.checkInStatus === 'admitted').length,
    },
    // legacy flat fields for older clients
    total: ticketCount(allOrders),
    paid: ticketCount(paidOrders),
    pending: ticketCount(allOrders.filter((order) => order.status === 'pending')),
    admitted: allOrders.filter((order) => order.checkInStatus === 'admitted').length,
    orders,
  })
}

export async function PATCH(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as {
      orderReference?: string
      action?: 'cancel' | 'resend-email'
      note?: string
    }
    const orderReference = body.orderReference?.trim()

    if (!orderReference || !body.action) {
      return NextResponse.json({ error: 'Некоректний запит' }, { status: 400 })
    }

    if (body.action === 'cancel') {
      const updated = await cancelOrder(orderReference, body.note)
      if (!updated) {
        return NextResponse.json({ error: 'Замовлення не знайдено' }, { status: 404 })
      }
      return NextResponse.json({ ok: true, order: updated })
    }

    if (body.action === 'resend-email') {
      const result = await resendTicketEmail(orderReference)
      if (!result.sent) {
        const message =
          result.reason === 'not_found'
            ? 'Замовлення не знайдено'
            : result.reason === 'not_paid'
              ? 'Квиток ще не оплачений'
              : result.error ?? 'Не вдалося надіслати лист'
        return NextResponse.json({ error: message, reason: result.reason }, { status: 400 })
      }
      return NextResponse.json({ ok: true, sent: true, email: result.email })
    }

    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Не вдалося виконати дію' }, { status: 500 })
  }
}
