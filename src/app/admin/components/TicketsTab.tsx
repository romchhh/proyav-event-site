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

export default function TicketsTab() {
  const [view, setView] = useState<TicketsView>('checkin')
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, admitted: 0 })
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancellingOrderRef, setCancellingOrderRef] = useState<string | null>(null)

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
        total: number
        paid: number
        pending: number
        admitted: number
      }
      setOrders(data.orders)
      setStats({
        total: data.total,
        paid: data.paid,
        pending: data.pending,
        admitted: data.admitted,
      })
      setLoading(false)
    }

    const timer = window.setTimeout(load, 250)
    return () => window.clearTimeout(timer)
  }, [status, query, view])

  const cancelTicket = async (orderReference: string) => {
    const confirmed = window.confirm('Анулювати цей квиток? Після цього він стане невалідним для входу.')
    if (!confirmed) return

    setCancellingOrderRef(orderReference)
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
        return
      }

      setOrders((current) => {
        const next = current.map((order) =>
          order.orderReference === orderReference
            ? {
                ...order,
                status: 'cancelled' as const,
                checkInStatus: 'rejected' as const,
                checkedInAt: new Date().toISOString(),
              }
            : order,
        )
        const paid = next.filter((order) => order.status === 'paid').length
        const pending = next.filter((order) => order.status === 'pending').length
        const admitted = next.filter((order) => order.checkInStatus === 'admitted').length
        setStats((currentStats) => ({
          ...currentStats,
          paid,
          pending,
          admitted,
        }))
        return next
      })
    } finally {
      setCancellingOrderRef(null)
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
          <div className="adminStats">
            <div><strong>{stats.admitted}</strong><span>Допущено</span></div>
            <div><strong>{stats.paid}</strong><span>Оплачено</span></div>
            <div><strong>{stats.pending}</strong><span>В обробці</span></div>
            <div><strong>{stats.total}</strong><span>Усього</span></div>
          </div>

          <div className="adminTicketsToolbar">
            <input
              type="search"
              placeholder="Пошук: код, імʼя, email, телефон…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Усі статуси</option>
              <option value="paid">Оплачено</option>
              <option value="pending">В обробці</option>
              <option value="failed">Відхилено</option>
              <option value="cancelled">Анульовано</option>
            </select>
          </div>

          {loading ? (
            <p className="adminHint">Завантаження…</p>
          ) : orders.length === 0 ? (
            <p className="adminHint">Квитків не знайдено</p>
          ) : (
            <div className="adminTicketList">
              {orders.map((order) => (
                <article key={order.orderReference} className="adminTicketCard">
                  <div className="adminTicketHead">
                    <div>
                      <p className="adminTicketCode">{order.ticketCode ?? '— код після оплати —'}</p>
                      <h3>{order.name}</h3>
                    </div>
                    <div className="adminCheckInBadges">
                      <span className={`adminStatus adminStatus-${order.status}`}>{STATUS_LABELS[order.status]}</span>
                      {order.checkInStatus !== 'none' && (
                        <span className={`adminCheckInStatus adminCheckInStatus-${order.checkInStatus}`}>
                          {CHECK_IN_LABELS[order.checkInStatus]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="adminTicketMeta">
                    <p><span>Тариф</span>{order.tierName}</p>
                    <p><span>Email</span>{order.email}</p>
                    <p><span>Телефон</span>{order.phone}</p>
                    <p><span>Сума</span>{order.amount.toLocaleString('uk-UA')} ₴</p>
                    <p><span>Замовлення</span>{order.orderReference}</p>
                    <p><span>Дата</span>{new Date(order.paidAt ?? order.createdAt).toLocaleString('uk-UA')}</p>
                    {order.checkedInAt && (
                      <p><span>Вхід</span>{new Date(order.checkedInAt).toLocaleString('uk-UA')}</p>
                    )}
                  </div>
                  {(order.status === 'paid' || order.status === 'pending') && (
                    <div className="adminTicketActions">
                      <button
                        type="button"
                        className="adminDangerBtn"
                        onClick={() => void cancelTicket(order.orderReference)}
                        disabled={cancellingOrderRef === order.orderReference}
                      >
                        {cancellingOrderRef === order.orderReference ? 'Анулюємо…' : 'Анулювати квиток'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
