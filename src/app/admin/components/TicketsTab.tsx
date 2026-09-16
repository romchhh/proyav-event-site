'use client'

import { useEffect, useState } from 'react'
import type { StoredOrder } from '@/lib/store'
import { CHECK_IN_LABELS } from '@/lib/ticket-checkin'
import CheckInPanel from './CheckInPanel'

const STATUS_LABELS: Record<StoredOrder['status'], string> = {
  paid: 'Оплачено',
  pending: 'В обробці',
  failed: 'Відхилено',
  upgraded: 'Оновлено',
  cancelled: 'Анульовано',
}

type TicketsView = 'list' | 'checkin'

type TicketStats = {
  total: number
  paid: number
  paidMoney: number
  paidFree: number
  payments: number
  revenue: number
  pending: number
  admitted: number
}

const EMPTY_STATS: TicketStats = {
  total: 0,
  paid: 0,
  paidMoney: 0,
  paidFree: 0,
  payments: 0,
  revenue: 0,
  pending: 0,
  admitted: 0,
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uk-UA').format(amount)
}

export default function TicketsTab() {
  const [view, setView] = useState<TicketsView>('checkin')
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [stats, setStats] = useState<TicketStats>(EMPTY_STATS)
  const [status, setStatus] = useState('paid_money')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancellingOrderRef, setCancellingOrderRef] = useState<string | null>(null)
  const [resendingOrderRef, setResendingOrderRef] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (view !== 'list') return undefined

    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (query.trim()) params.set('q', query.trim())
      const response = await fetch(`/api/admin/tickets?${params.toString()}`)
      const data = (await response.json()) as {
        orders: StoredOrder[]
        stats?: TicketStats
        total: number
        paid: number
        pending: number
        admitted: number
      }
      setOrders(data.orders)
      setStats(
        data.stats ?? {
          total: data.total,
          paid: data.paid,
          paidMoney: data.paid,
          paidFree: 0,
          payments: data.paid,
          revenue: 0,
          pending: data.pending,
          admitted: data.admitted,
        },
      )
      setLoading(false)
    }

    const timer = window.setTimeout(load, 250)
    return () => window.clearTimeout(timer)
  }, [status, query, view])

  const reloadList = async () => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (query.trim()) params.set('q', query.trim())
    const response = await fetch(`/api/admin/tickets?${params.toString()}`)
    const data = (await response.json()) as { orders: StoredOrder[]; stats?: TicketStats }
    setOrders(data.orders)
    if (data.stats) setStats(data.stats)
  }

  const cancelTicket = async (orderReference: string) => {
    const confirmed = window.confirm('Анулювати цей квиток? Після цього він стане невалідним для входу.')
    if (!confirmed) return

    setCancellingOrderRef(orderReference)
    setMessage('')
    try {
      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          orderReference,
        }),
      })

      if (!response.ok) {
        setMessage('Не вдалося анулювати квиток')
        return
      }

      await reloadList()
      setMessage('Квиток анульовано')
    } finally {
      setCancellingOrderRef(null)
    }
  }

  const resendEmail = async (order: StoredOrder) => {
    const confirmed = window.confirm(`Надіслати квиток повторно на ${order.email}?`)
    if (!confirmed) return

    setResendingOrderRef(order.orderReference)
    setMessage('')
    try {
      const response = await fetch('/api/admin/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-email',
          orderReference: order.orderReference,
        }),
      })
      const data = (await response.json()) as { error?: string; email?: string }

      if (!response.ok) {
        setMessage(data.error ?? 'Не вдалося надіслати лист')
        return
      }

      setOrders((current) =>
        current.map((item) =>
          item.orderReference === order.orderReference ? { ...item, emailSent: true } : item,
        ),
      )
      setMessage(`Квиток надіслано на ${data.email ?? order.email}`)
    } finally {
      setResendingOrderRef(null)
    }
  }

  return (
    <div className="adminTickets">
      <div className="adminTicketsViewSwitch">
        <button
          type="button"
          className={view === 'checkin' ? 'adminTicketsViewActive' : 'adminTicketsView'}
          onClick={() => setView('checkin')}
        >
          Перевірка входу
        </button>
        <button
          type="button"
          className={view === 'list' ? 'adminTicketsViewActive' : 'adminTicketsView'}
          onClick={() => setView('list')}
        >
          Список квитків
        </button>
      </div>

      {view === 'checkin' ? (
        <CheckInPanel />
      ) : (
        <>
          <div className="adminStats adminStatsWide">
            <div>
              <strong>{stats.paidMoney}</strong>
              <span>Квитків за гроші</span>
            </div>
            <div>
              <strong>{stats.payments}</strong>
              <span>Реальних оплат</span>
            </div>
            <div>
              <strong>{formatMoney(stats.revenue)} ₴</strong>
              <span>Сума оплат</span>
            </div>
            <div>
              <strong>{stats.paidFree}</strong>
              <span>Безкоштовні (промо)</span>
            </div>
            <div>
              <strong>{stats.paid}</strong>
              <span>Усі оплачені</span>
            </div>
            <div>
              <strong>{stats.admitted}</strong>
              <span>Допущено</span>
            </div>
          </div>

          <div className="adminTicketsToolbar">
            <input
              type="search"
              placeholder="Пошук: код, імʼя, email, телефон, промокод…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="paid_money">Оплачено за гроші</option>
              <option value="paid_free">Безкоштовні (0 ₴)</option>
              <option value="paid">Усі оплачені</option>
              <option value="pending">В обробці</option>
              <option value="failed">Відхилено</option>
              <option value="cancelled">Анульовано</option>
              <option value="all">Усі статуси</option>
            </select>
          </div>

          {message && <p className="adminCheckInMessage">{message}</p>}

          {loading ? (
            <p className="adminHint">Завантаження…</p>
          ) : orders.length === 0 ? (
            <p className="adminHint">Квитків не знайдено</p>
          ) : (
            <div className="adminTicketList">
              {orders.map((order) => {
                const isFree = order.status === 'paid' && order.amount < 1
                const quantity = order.quantity || 1

                return (
                  <article key={order.orderReference} className="adminTicketCard">
                    <div className="adminTicketHead">
                      <div>
                        <p className="adminTicketCode">{order.ticketCode ?? '— код після оплати —'}</p>
                        <h3>{order.name}</h3>
                      </div>
                      <div className="adminCheckInBadges">
                        <span className={`adminStatus adminStatus-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                        {isFree && <span className="adminStatus adminStatus-free">0 ₴ / промо</span>}
                        {!isFree && order.status === 'paid' && (
                          <span className="adminStatus adminStatus-money">За гроші</span>
                        )}
                        {order.checkInStatus !== 'none' && (
                          <span className={`adminCheckInStatus adminCheckInStatus-${order.checkInStatus}`}>
                            {CHECK_IN_LABELS[order.checkInStatus]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="adminTicketMeta">
                      <p><span>Тариф</span>{order.tierName}</p>
                      <p><span>Кількість</span>{quantity}</p>
                      <p><span>Email</span>{order.email}</p>
                      <p><span>Телефон</span>{order.phone}</p>
                      <p><span>Сума</span>{formatMoney(order.amount)} ₴</p>
                      <p><span>Промокод</span>{order.promoCode || '—'}</p>
                      <p><span>Замовлення</span>{order.orderReference}</p>
                      <p><span>Дата</span>{new Date(order.paidAt ?? order.createdAt).toLocaleString('uk-UA')}</p>
                      <p><span>Лист</span>{order.emailSent ? 'Надіслано' : 'Ще ні'}</p>
                      {order.checkedInAt && (
                        <p><span>Вхід</span>{new Date(order.checkedInAt).toLocaleString('uk-UA')}</p>
                      )}
                    </div>
                    <div className="adminTicketActions">
                      {order.status === 'paid' && (
                        <button
                          type="button"
                          className="adminGhostBtn"
                          onClick={() => void resendEmail(order)}
                          disabled={resendingOrderRef === order.orderReference}
                        >
                          {resendingOrderRef === order.orderReference ? 'Надсилаємо…' : 'Надіслати квиток ще раз'}
                        </button>
                      )}
                      {(order.status === 'paid' || order.status === 'pending') && (
                        <button
                          type="button"
                          className="adminDangerBtn"
                          onClick={() => void cancelTicket(order.orderReference)}
                          disabled={cancellingOrderRef === order.orderReference}
                        >
                          {cancellingOrderRef === order.orderReference ? 'Анулюємо…' : 'Анулювати квиток'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
